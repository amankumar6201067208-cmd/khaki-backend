const cronTasks = require("./cron-tasks");

module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  logger: {
    // Strapi's once-a-day "new version available" check calls the npm registry
    // through got@11, which crashes the process on Node 24 when that request
    // has to retry (p-cancelable: "onCancel handler attached after settled").
    // We don't need the notice; turning it off removes the startup crash.
    updates: { enabled: false },
  },
  // Scheduled publishing of tours (see config/cron-tasks.js).
  cron: {
    enabled: true,
    tasks: cronTasks,
  },
});
