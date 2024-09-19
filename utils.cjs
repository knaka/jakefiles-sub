exports.cleanup = (fn) => {
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

exports.asyncRun = async (args, cwd, env, opts) => {
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
        throw new Error(`Command ${args} failed with code ${code}`);
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

exports.jsonExtract = (tfState, exacts, regexes) => {
  let conditions = "";
  let delim = "";
  for (const [key, value] of Object.entries(exacts)) {
    conditions += `${delim}@["${key}"] == "${value}"`;
    delim = " && ";
  }
  for (const [key, value] of Object.entries(regexes)) {
    if (! (value instanceof RegExp)) {
      throw new Error("Value must be a RegExp");
    }
    conditions += `${delim}${value.toString()}.test(@["${key}"])`;
    delim = " && ";
  }
  const query = `$..[?(${conditions})]`;
  const jsonpath = require("jsonpath");
  return jsonpath.query(tfState, query)[0];
}

const json2sh = exports.json2sh = (obj, prefix = "json__") => {
  let result = "";
  for (const key in obj) {
    const keyForShell = key.replace(/[-\.]/g, "_");
    if (typeof obj[key] === "object") {
      result += json2sh(obj[key], `${prefix}${keyForShell}__`);
    } else {
      result += `${prefix}${keyForShell}="${obj[key]}"\n`;
    }
  }
  return result;
};
