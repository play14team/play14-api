module.exports = ({ env }) => ({
  emitErrors: false,
  proxy: env.bool('IS_PROXIED', true),
  cron: {
    enabled: env.bool('CRON_ENABLED', false),
  },
});
