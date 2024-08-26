module.exports.asyncSsh = async (host, user, privKey, port = 22) => {
  const sh = require("shelljs");
  const fs = require("fs")
  const tmpdir = fs.mkdtempSync("/tmp/foo");
  try {
    const sshClient = new (require("node-ssh").NodeSSH)();
    await sshClient.connect({
      host: host,
      username: user,
      privateKey: privKey,
      port,
    });
    const pipeStream = stream => {
      const { isTTY } = process.stdout;
      if (isTTY && process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
      }
      stream.pipe(process.stdout);
      stream.stderr.pipe(process.stderr);
      process.stdin.pipe(stream);
      const onResize = isTTY && (() => stream.setWindow(process.stdout.rows, process.stdout.columns, null, null));
      if (isTTY) {
        stream.once("data", onResize);
        process.stdout.on("resize", onResize);
      }
      stream.on("close", () => {
        if (isTTY) {
          process.stdout.removeListener('resize', onResize);
        }
        stream.unpipe();
        stream.stderr.unpipe();
        process.stdin.unpipe();
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(false);
        }
        process.stdin.unref();
      });
    }
    await new Promise((resolve, reject) => {
      // noinspection JSUnresolvedFunction
      sshClient.connection.shell({ term: process.env.TERM || "vt100" }, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        pipeStream(stream);
        stream.on("close", () => resolve(true));
      })
    });
    sshClient.dispose();
  } finally {
    sh.rm("-fr", tmpdir);
  }
};

module.exports.asyncSshForwardPort = async (
  fwdHost,
  fwdPort, 
  fwdUser, 
  privKey, 
  remoteHost, 
  remotePort,
  localPortBase = 10000, 
) => {
  const { SSHConnection } = require("node-ssh-forward");
  const sshConnection = new SSHConnection({
    endHost: fwdHost,
    endPort: fwdPort,
    username: fwdUser,
    privateKey: privKey,
  });
  const portfinder = require("portfinder");
  portfinder.setBasePort(localPortBase);
  const localPort = await portfinder.getPortPromise()
  await sshConnection.forward({
    fromPort: localPort,
    toHost: remoteHost,
    toPort: remotePort,
  });
  return [sshConnection, localPort];
};

