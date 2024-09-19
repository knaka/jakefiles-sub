import { existsSync } from "fs";
import { spawn } from "child_process";
import { join, parse } from 'path';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = parse(process.cwd()).root;
while (! existsSync("package.json")) {
  if (process.cwd() === rootDir) {
    console.error("NPM root directory not found.");
    process.exit(1);
  }
  process.chdir("..");
}

process.env.NODE_ENV = process.env.APP_ENV;
process.env.NODE_SENV = process.env.APP_SENV;

const tasks = process.argv.slice(2);

// Ensure that `npm install` has been run.

const packageName = "jake";
try {
  await import(packageName);
} catch {
  if (await new Promise(resolve =>
    spawn("npm", ["install"], {stdio: "inherit"}).on("exit", resolve)
  ) !== 0) {
    throw new Error();
  }
  await import(packageName);
}

// Then run the tasks.

// Quiet mode if stdout is not a TTY.
const quiet_options = process.stdout.isTTY ? [] : ["--quiet"];

process.exit(await new Promise(resolve =>
  spawn("npx", [
    "jake",
    ...quiet_options,
    "--jakefile", join(__dirname, "bootstrap.cjs"),
    ...tasks
  ], {stdio: "inherit"}).on("exit", resolve)
));
