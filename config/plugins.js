module.exports = ({ env }) => ({
  graphql: {
    config: {
      apolloServer: {
        tracing: false,
        introspection: true,
      },
    },
  },
  ckeditor5: true,
  "prev-next-button": true,
  "strapi-blurhash": {
    enabled: true,
    config: {
      regenerateOnUpdate: true,
      forceRegenerateOnUpdate: false,
    },
  },
  // upload: {
  //   config: {
  //     provider: 'strapi-provider-upload-local-url',
  //     providerOptions: {
  //       baseurl: "http://localhost:1337"
  //     }
  //   }
  // },
  upload: {
    config: {
      provider: "strapi-provider-upload-azure-storage",
      providerOptions: {
        authType: "default",
        account: env("STORAGE_ACCOUNT"),
        accountKey: env("STORAGE_ACCOUNT_KEY"),
        serviceBaseURL: env("STORAGE_URL"),
        containerName: env("STORAGE_CONTAINER_NAME", "strapi_uploads"),
        cdnBaseURL: env("STORAGE_CDN_URL"),
        defaultPath: "assets",
        maxConcurrent: 10,
      },
    },
  },
  "map-field": {
    enabled: true,
  },
  "update-static-content": {
    enabled: true,
    config: {
      githubToken: env("GITHUB_TOKEN"),
      owner: "play14team",
      repo: "play14-ui",
      workflowId: "52506304",
      branch: "main",
    },
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
        {
          uid: "api::article.article",
          modelName: "article",
          fuzzysortOptions: {
            characterLimit: 200,
            threshold: -200,
            keys: [
              {
                name: "title",
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
                name: "summary",
                weight: 100,
              },
              {
                name: "content",
                weight: -100,
              },
            ],
          },
        },
      ],
    },
  },
});
