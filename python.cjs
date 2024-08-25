module.exports.asyncRunPython = async (args, cwd, env = undefined, opts = {}) => {
  // Releases · astral-sh/rye https://github.com/astral-sh/rye/releases
  ver = "0.39.0"
  const { join } = require("path");
  const { asyncRun } = require("./utils.cjs");

  const sh = require("shelljs");
  const cmdName = "rye"
  const binDir = join(process.cwd(), ".bin")
  const cmdNameVer = `${cmdName}@${ver}`
  const cmdPath = join(binDir, cmdNameVer)
  if (! sh.test("-e", cmdPath)) {
    switch (process.platform) {
      case "linux": rsos = "linux"; break;
      case "darwin": rsos = "macos"; break;
      case "win32": rsos = "windows"; break;
      default: throw new Error("Unsupported platform");
    }
    switch (process.arch) {
      case "arm64": rsarch = "aarch64"; break;
      case "x64": rsarch = "x86_64"; break;
      default: throw new Error("Unsupported architecture");
    }
    sh.mkdir("-p", binDir);
    const res = await fetch(`https://github.com/astral-sh/rye/releases/download/${ver}/rye-${rsarch}-${rsos}.gz`, {
      redirect: "follow",
    })
    await require("stream/promises").pipeline(
      require("stream").Readable.fromWeb(res.body),
      require("zlib").createGunzip(),
      require("fs").createWriteStream(cmdPath)
    );
    sh.chmod("+x", cmdPath);
  }
  return await asyncRun([cmdPath, "run", ...args], cwd, env, opts);
}
