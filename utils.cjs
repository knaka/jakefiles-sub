module.exports.cleanup = function (fn) {
  ["exit", "SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException", "SIGTERM"].forEach((eventType) => {
    process.once(eventType, () => {
      try { fn(); } catch (e) {}
    });
  });
}
