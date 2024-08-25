/**
 * Execute `terraform` command. If the command is not installed, download it under `.bin/` directory.
 * 
 * @param  {string[]} args 
 * @param  {string | URL | undefined} cwd
 * @param  {NodeJS.ProcessEnv | undefined} env 
 */
module.exports.asyncTerraform = async (args, cwd, env = undefined, opts = {}) => {
  // Install | Terraform | HashiCorp Developer https://developer.hashicorp.com/terraform/install
  const ver = "1.9.5"

  const { join } = require("path");
  const { asyncRun } = require("./utils.cjs");

  const sh = require("shelljs");
  const cmdName = "terraform"
  const binDir = join(process.cwd(), ".bin")
  const cmdNameVer = `${cmdName}@${ver}`
  const cmdPath = join(binDir, cmdNameVer)
  if (! sh.test("-e", cmdPath)) {
    switch (process.platform) {
      case "linux": goos = "linux"; break;
      case "darwin": goos = "darwin"; break;
      case "win32": goos = "windows"; break;
      default: throw new Error("Unsupported platform");
    }
    switch (process.arch) {
      case "arm64": goarch = "arm64"; break;
      case "x64": goarch = "amd64"; break;
      default: throw new Error("Unsupported architecture");
    }
    sh.mkdir("-p", binDir);
    const res = await fetch(`https://releases.hashicorp.com/terraform/${ver}/terraform_${ver}_${goos}_${goarch}.zip`, {
      redirect: "follow",
    })
    const admZip = require("adm-zip");
    const zip = new admZip(Buffer.from(await res.arrayBuffer()));
    zip.extractEntryTo("terraform", binDir, false, true, false, cmdNameVer);
    sh.chmod("+x", cmdPath);
  }
  return await asyncRun([cmdPath, ...args], cwd, env, opts);
};
