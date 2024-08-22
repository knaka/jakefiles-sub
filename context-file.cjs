const path = require("path");
const fs = require("fs");
const { memoize } = require("lodash");

const getConfJson = memoize((filePath) => JSON.parse(fs.readFileSync(filePath)));

const getProjectName = (filePath) => getConfJson(filePath)["context"]["project-name"];

const getContextValue = module.exports.getContextValue = (filePath, key, accountNames) => {
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

modules.exports = {
  getConfJson,
  getProjectName,
  getContextValue,
  getLogEnvName,
  getShortEnvName,
}
