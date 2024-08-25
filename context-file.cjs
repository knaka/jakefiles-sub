const path = require("path");
const fs = require("fs");
const { memoize } = require("lodash");

module.exports.getConfJson = memoize((filePath) => JSON.parse(fs.readFileSync(filePath)));

module.exports.getProjectName = (filePath) => getConfJson(filePath)["context"]["project-name"];

module.exports.getContextValue = (filePath, key, accountNames) => {
  let value = getConfJson(filePath)["context"][key];
  for (const accountName of accountNames) {
    if (
      getConfJson(filePath)["context"]["overrides"][accountName] && 
      getConfJson(filePath)["context"]["overrides"][accountName][getShortEnvName()] &&
      getConfJson(filePath)["context"]["overrides"][accountName][getShortEnvName()][key] !== undefined
    ) {
      value = getConfJson(filePath)["context"]["overrides"][accountName][getShortEnvName()][key];
    }
  }
  return value
}

const { getLogEnvName, getShortEnvName } = require("./env.cjs");

module.exports = {
  getLogEnvName,
  getShortEnvName,
}
