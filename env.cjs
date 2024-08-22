const getLogEnvName = () => {
  return process.env["NODE_ENV"] || undefined;
}

const getShortEnvName = () => {
  return process.env["NODE_SENV"] || undefined;
}

module.exports = {
  getLogEnvName,
  getShortEnvName,
}
