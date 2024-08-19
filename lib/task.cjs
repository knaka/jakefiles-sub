const { Task } = require("jake");

exports.asyncExecuteTask = async (taskName, ...args) => {
  const t = Task[taskName];
  await new Promise((resolve) => {
    t.addListener("complete", () => {
      resolve();
    });
    t.execute(...args);
  });
};
