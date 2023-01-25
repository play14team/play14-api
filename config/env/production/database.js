module.exports = ({ env }) => ({
  connection: {
    pool: {
        min: 0,
        max: 15,
        idleTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        acquireTimeoutMillis: 30000,
    },
    connection: {
      ssl: {
        rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false), // For self-signed certificates
      }
    },
    debug: false,
  },
});
