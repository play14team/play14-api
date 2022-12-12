module.exports = ({
  env
}) => [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        directives: {
          'script-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
          'img-src': ["'self'", 'data:', 'blob:', 'cdn.jsdelivr.net', 'strapi.io', 'market.strapi.io', '*.tile.openstreetmap.org', process.env.STORAGE_URL, process.env.STORAGE_CDN_URL],
          'media-src': ["'self'", 'data:', 'blob:', process.env.STORAGE_URL, process.env.STORAGE_CDN_URL],
          upgradeInsecureRequests: null,
        },
      }
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
