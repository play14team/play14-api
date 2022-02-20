module.exports = ({ env }) => ({
  emitErrors: false,
  url: env('PUBLIC_URL', 'https://api.play14.org'),
  proxy: env.bool('IS_PROXIED', true),
  cron: {
    enabled: env.bool('CRON_ENABLED', false),
  },
});
