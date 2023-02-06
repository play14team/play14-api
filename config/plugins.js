module.exports = ({ env }) => ({
    'graphql': {
      config: {
          endpoint: '/graphql',
          shadowCRUD: true,
          playgroundAlways: true,
          depthLimit: 10,
          amountLimit: 1000,
          apolloServer: {
              tracing: false,
              introspection: true
          }
      }
  },
  'ckeditor': true,
  'seo': {
    enabled: true,
  },
  'transformer': {
    enabled: true,
    config: {
      prefix: '/api/',
      responseTransforms: {
        removeAttributesKey: true,
        removeDataKey: true,
      }
    }
  },
  'vercel-deploy': {
    enabled: true,
    config: {
      deployHook: process.env.VERCEL_DEPLOY_PLUGIN_HOOK,
      apiToken: process.env.VERCEL_DEPLOY_PLUGIN_API_TOKEN,
      appFilter: process.env.VERCEL_DEPLOY_PLUGIN_APP_FILTER,
      teamFilter: process.env.VERCEL_DEPLOY_PLUGIN_TEAM_FILTER,
      roles: ["strapi-super-admin", "strapi-editor", "strapi-author"],
    }
  },
  'strapi-plugin-populate-deep': {
    config: {
      defaultDepth: 3, // Default is 5
    }
  },
  'import-export-entries': {
    enabled: true,
  },
  'strapi-blurhash': {
    enabled: true,
  },
  upload: {
    config: {
      provider: 'strapi-provider-upload-local-url',
      providerOptions: {
        baseurl: "http://localhost:1337"
      }
    }
  },
  // 'upload': {
  //   config: {
  //     provider: 'strapi-provider-upload-azure-storage',
  //     providerOptions: {
  //       account: env('STORAGE_ACCOUNT'),
  //       accountKey: env('STORAGE_ACCOUNT_KEY'),
  //       serviceBaseURL: env('STORAGE_URL'),
  //       containerName: env('STORAGE_CONTAINER_NAME', 'strapi_uploads'),
  //       cdnBaseURL: env('STORAGE_CDN_URL'),
  //       defaultPath: 'assets',
  //       maxConcurrent: 10
  //     }
  //   }
  // },
  "map-field": {
    enabled: true,
    resolve: './src/plugins/map-field'
  },
  "fuzzy-search": {
    enabled: true,
    config: {
      contentTypes: [
        {
          uid: "api::event.event",
          modelName: "event",
          queryConstraints: {
            where: {
              $and: [
                {
                  publishedAt: { $notNull: true },
                },
              ],
            },
          },
          fuzzysortOptions: {
            characterLimit: 500,
            threshold: -200,
            keys: [
              {
                name: "name",
                weight: 500,
              },
              {
                name: "status",
                weight: 400,
              },
              {
                name: "description",
                weight: -100,
              },
            ],
          },
        },
        {
          uid: "api::player.player",
          modelName: "player",
          fuzzysortOptions: {
            characterLimit: 200,
            threshold: -200,
            keys: [
              {
                name: "name",
                weight: 500,
              },
              {
                name: "slug",
                weight: 400,
              },
              {
                name: "position",
                weight: 300,
              },
              {
                name: "company",
                weight: 200,
              },
              {
                name: "tagline",
                weight: 100,
              },
              {
                name: "bio",
                weight: -100,
              },
            ],
          },
        },
        {
          uid: "api::game.game",
          modelName: "game",
          fuzzysortOptions: {
            characterLimit: 200,
            threshold: -200,
            keys: [
              {
                name: "name",
                weight: 500,
              },
              {
                name: "slug",
                weight: 400,
              },
              {
                name: "category",
                weight: 300,
              },
              {
                name: "tags",
                weight: 200,
              },
              {
                name: "credits",
                weight: 100,
              },
              {
                name: "summary",
                weight: -100,
              },
            ],
          },
        },
      ],
    },
  },
});
