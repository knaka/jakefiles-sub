const path = require("path");
const fs = require("fs");
const { memoize } = require("lodash");

const getConfJson = memoize((filePath) => JSON.parse(fs.readFileSync(filePath)));

const getProjectName = module.exports.getProjectName = (filePath) => getConfJson(filePath)["context"]["project-name"];

const getContextValue = module.exports.getContextValue = (filePath, key, accountNames) => {
  let value = getConfJson(filePath)["context"][key];
  for (const accountName of accountNames) {
    if (
      getConfJson(filePath)["context"]["overrides"][accountName] && 
      getConfJson(filePath)["context"]["overrides"][accountName][getEnvName()] &&
      getConfJson(filePath)["context"]["overrides"][accountName][getEnvName()][key] !== undefined
    ) {
      value = getConfJson(filePath)["context"]["overrides"][accountName][getEnvName()][key];
    }
  }
  return value
}

const getLogEnvName = module.exports.getLongEnvName = () => {
  return process.env["NODE_ENV"] || process.env["APP_ENV"] || undefined;
}

const getEnvName = module.exports.getEnvName = () => {
  return process.env["NODE_SENV"] || process.env["APP_SENV"] || undefined;
}
