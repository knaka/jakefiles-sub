const asyncWaitForEnter = async () => {
  return new Promise((resolve) => {
    const read = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    read.on("line", () => {
      read.close();
      resolve();
    });
  });
};

module.exports = {
  asyncWaitForEnter,
};
