const { memoize } = require("lodash");

const asyncGetTenancyName = memoize(async () => {
  const ociCommon = require("oci-common");
  const ociIdentity = require("oci-identity");
  const authenticationDetailsProvider = new ociCommon.ConfigFileAuthenticationDetailsProvider();
  const client = new ociIdentity.IdentityClient({ authenticationDetailsProvider });
  const resp = await client.getTenancy({ tenancyId: authenticationDetailsProvider.getTenantId() });
  return resp.tenancy.name;
})

const asyncProfileInfo = memoize(async () => {
  const ociCommon = require("oci-common");
  const authenticationDetailsProvider = new ociCommon.ConfigFileAuthenticationDetailsProvider();

  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  const tempFilePath = path.join(os.tmpdir(), `tempfile-${Date.now()}`);
  fs.writeFileSync(tempFilePath, authenticationDetailsProvider.getPrivateKey(), { mode: 0o600 });
  (require("./utils.cjs").cleanup)(() => { fs.unlinkSync(tempFilePath) });

  return {
    tenancy_ocid: authenticationDetailsProvider.getTenantId(),
    region: authenticationDetailsProvider.getRegion().regionId,
    fingerprint: authenticationDetailsProvider.getFingerprint(),
    user_ocid: authenticationDetailsProvider.getUser(),
    private_key_path: tempFilePath,
  };
});

const asyncGetObjectStorageNamespace = memoize(async () => {
  const ociCommon = require("oci-common");
  const ociObjectStorage = require("oci-objectstorage");
  const authenticationDetailsProvider = new ociCommon.ConfigFileAuthenticationDetailsProvider();
  const client = new ociObjectStorage.ObjectStorageClient({ authenticationDetailsProvider });
  const resp = await client.getNamespace({});
  return resp.value;
});

/**
 * @param {string[]} args 
 * @param {string} stackName
 * @param [{}] opts
 */
module.exports.asyncTerraform = async (args, moduleName = undefined, opts = {}) => {
  const path = require("path");
  const cwd = path.join(process.cwd(), "terraform");
  const env = { ...process.env };
  env["TF_WORKSPACE"] = require("./env.cjs").getShortEnvName();
  const info = await asyncProfileInfo();
  for (const [key, value] of Object.entries(info)) {
    env[`TF_VAR_${key}`] = value
  }
  env[`TF_VAR_project_name`] = env["APP_PROJECT_NAME"];
  env[`TF_VAR_tenancy_name`] = await asyncGetTenancyName();
  const fs = require('fs');
  // env["TF_VAR_ssh_public_keys"] = env["APP_SSH_PUBLIC_KEY"];
  const content = fs.readFileSync(env["APP_SSH_PUBLIC_KEY_PATH"]);
  env["TF_VAR_ssh_public_keys"] = content.toString().trim();
  if (moduleName) {
    args.push("-target", `module.${moduleName}`);
  }
  const namespace = await asyncGetObjectStorageNamespace();
  const s3Endpoint = `https://${namespace}.compat.objectstorage.${info.region}.oraclecloud.com`
  env["AWS_REGION"] = info.region;
  env["AWS_S3_URL_ENDPOINT"] = s3Endpoint;
  if (["init"].includes(args[0])) {
    args.push(`-backend-config=bucket=${env["APP_PROJECT_NAME"]}`);
    args.push(`-backend-config=region=${info.region}`);
    args.push(`-backend-config=endpoints={s3="${s3Endpoint}"}`);
  }
  return await (require("./terraform.cjs").asyncTerraform)(args, cwd, env, opts);
}

module.exports.asyncBastionForwardPort = async (bastionId, instanceId, callback) => {
  const ociCommon = require("oci-common");
  const authenticationDetailsProvider = new ociCommon.ConfigFileAuthenticationDetailsProvider();
  const ociBastion = require("oci-bastion");
  const client = new ociBastion.BastionClient({ authenticationDetailsProvider });
  const fs = require("fs");
  const pubKey = fs.readFileSync(process.env["APP_SSH_PUBLIC_KEY_PATH"]).toString();
  let sessionId = "";
  try {
    // CreateSession | Oracle Cloud Infrastructure API Reference and Endpoints https://docs.oracle.com/en-us/iaas/api/#/en/bastion/20210331/Session/CreateSession
    const resp = await client.createSession({
      createSessionDetails: {
        bastionId: bastionId,
        targetResourceDetails: {
          sessionType: ociBastion.models.CreatePortForwardingSessionTargetResourceDetails.sessionType,
          targetResourceId: instanceId,
          targetResourcePort: 22,
        },
        keyType: ociBastion.models.CreateSessionDetails.KeyType.Pub,
        keyDetails: {
          publicKeyContent: pubKey,
        },
        sessionTtlInSeconds: 3 * 3600,
      },
    });
    sessionId = resp.session.id;
    process.stderr.write("Creating OCI Bastion session...")
    let respSession;
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      respSession = await client.getSession({ sessionId });
      process.stderr.write(".");
      if (respSession.session.lifecycleState === ociBastion.models.BastionLifecycleState.Active) {
        console.log("done");
        break;
      }
    }
    // console.error("respSession", respSession);
    const fwdUser = respSession.session.bastionUserName
    const info = await asyncProfileInfo();
    const fwdHost = `host.bastion.${info.region}.oci.oraclecloud.com`;
    const fwdPort = 22;
    const fwdRemoteHost = respSession.session.targetResourceDetails.targetResourcePrivateIpAddress;
    const fwdRemotePort = respSession.session.targetResourceDetails.targetResourcePort;
    const fs = require("fs");
    const privKey = fs.readFileSync(process.env["APP_SSH_PRIVATE_KEY_PATH"]).toString();
    process.stderr.write("Connecting to OCI Bastion forward port...")
    let conn, localPort;
    const { asyncSshForwardPort } = require("./ssh.cjs");
    while (true) {
      try {
        [conn, localPort] = await asyncSshForwardPort(fwdHost, fwdPort, fwdUser, privKey, fwdRemoteHost, fwdRemotePort, 10022);
        console.error("done");
        break;
      } catch (e) {
        process.stderr.write(".");
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
    await callback("127.0.0.1", localPort);
    await conn.shutdown();
  } catch (e) {
    console.error("274b020", e);
  } finally {
    await client.deleteSession({ sessionId });
  }
}
