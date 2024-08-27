const { memoize } = require("lodash");

const rustArch = memoize(() => {
  switch (process.arch) {
    case "arm64": return "aarch64";
    case "x64": return "x86_64";
    default: throw new Error("Unsupported architecture");
  }
});

const rustOs = memoize(() => {
  switch (process.platform) {
    case "linux": return "linux";
    case "darwin": return "macos";
    case "win32": return "windows";
    default: throw new Error("Unsupported platform");
  }
});

module.exports.asyncRunPython = async (args, cwd, env = undefined, opts = {}) => {
  // Releases · astral-sh/rye https://github.com/astral-sh/rye/releases
  const cmdBase = "rye"
  ver = "0.39.0"

  const path = require("path");
  const sh = require("shelljs");
  const binDirPath = path.join(process.cwd(), ".bin")
  const cmdPath = path.join(binDirPath, `${cmdBase}@${ver}`)
  if (! sh.test("-e", cmdPath)) {
    sh.mkdir("-p", binDirPath);
    const resp = await fetch(`https://github.com/astral-sh/rye/releases/download/${ver}/rye-${rustArch()}-${rustOs()}.gz`, {
      redirect: "follow",
    })
    await require("stream/promises").pipeline(
      require("stream").Readable.fromWeb(resp.body),
      require("zlib").createGunzip(),
      require("fs").createWriteStream(cmdPath)
    );
    sh.chmod("+x", cmdPath);
  }
  const { asyncRun } = require("./utils.cjs");
  return await asyncRun([cmdPath, "run", ...args], cwd, env, opts);
}
