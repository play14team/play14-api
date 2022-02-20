module.exports = ({ env }) => ({
  connection: {
    pool: {
        min: 0,
        max: 15,
        idleTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        acquireTimeoutMillis: 30000,
    },
    debug: false,
  },
});
