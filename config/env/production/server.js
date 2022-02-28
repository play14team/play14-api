module.exports = ({ env }) => ({
  // emitErrors: false,
  // proxy: env.bool('IS_PROXIED', true),
  // url: env('PUBLIC_URL', 'https://api.example.com'),
  cron: {
    enabled: env.bool('CRON_ENABLED', false),
  },
});
