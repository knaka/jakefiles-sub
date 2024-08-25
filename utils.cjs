module.exports.cleanup = (fn) => {
  ["exit", "SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException", "SIGTERM"].forEach((eventType) => {
    process.once(eventType, () => {
      try { fn(); } catch (e) {}
    });
  });
}

/**
 * @param {string[]} args
 * @param {string | URL | undefined} cwd
 * @param {NodeJS.ProcessEnv | undefined} env
 */

module.exports.asyncRun = async (args, cwd, env, opts) => {
  const spawnOpts = { cwd, env };
  if (!opts.input && opts.input !== "") {
    spawnOpts.stdio = "inherit";
  }
  return await new Promise(resolve => {
    const child = require("child_process").spawn(args[0], args.slice(1), spawnOpts);
    let output = "";
    if (child.stdout) {
      child.stdout.on("data", data => { output += data.toString(); });
    }
    child.on("close", (code) => {
      if (code !== 0) {
        throw new Error(`Command failed with code ${code}`);
      }
      resolve(output);
    });
    if (opts.input) {
      child.stdin.write(opts.input);
    }
    if (child.stdin) {
      child.stdin.end();
    }
  });
}
