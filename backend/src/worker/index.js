const publishScheduledLessons = require('./publisher');

console.log("🚀 Worker Service Started. Running every 60 seconds.");

// Run immediately on startup
publishScheduledLessons();

// Run every 60 seconds [2]
setInterval(() => {
  publishScheduledLessons().catch(err => {
    console.error("[Worker Error]", err);
  });
}, 60 * 1000);

// Prevent the process from closing
process.on('SIGINT', () => {
  console.log("Worker shutting down...");
  process.exit();
});