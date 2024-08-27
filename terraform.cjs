const { memoize } = require("lodash");

const goArch = memoize(() => {
  switch (process.arch) {
    case "arm64": return "arm64";
    case "x64": return "amd64";
    default: throw new Error("Unsupported architecture");
  }
});

const goOs = memoize(() => {
  switch (process.platform) {
    case "linux": return "linux";
    case "darwin": return "darwin";
    case "win32": return "windows";
    default: throw new Error("Unsupported platform");
  }
});

/**
 * Execute `terraform` command. If the command is not installed, download it under `.bin/` directory.
 * 
 * @param  {string[]} args 
 * @param  {string | URL | undefined} cwd
 * @param  {NodeJS.ProcessEnv | undefined} env 
 */
module.exports.asyncTerraform = async (args, cwd, env = undefined, opts = {}) => {
  // Install | Terraform | HashiCorp Developer https://developer.hashicorp.com/terraform/install
  const cmdName = "terraform"
  const ver = "1.9.5"

  const { join } = require("path");
  const { asyncRun } = require("./utils.cjs");
  const sh = require("shelljs");
  const binDir = join(process.cwd(), ".bin")
  const cmdPath = join(binDir, `${cmdName}@${ver}`)
  if (! sh.test("-e", cmdPath)) {
    sh.mkdir("-p", binDir);
    const resp = await fetch(`https://releases.hashicorp.com/terraform/${ver}/terraform_${ver}_${goOs()}_${goArch()}.zip`, {
      redirect: "follow",
    })
    await require("stream/promises").pipeline(
      require("stream").Readable.fromWeb(resp.body),
      require("unzip-stream").Extract({ path: binDir }),      
    );
    sh.mv(join(binDir, cmdName), cmdPath);
    sh.chmod("+x", cmdPath);
  }
  return await asyncRun([cmdPath, ...args], cwd, env, opts);
};
