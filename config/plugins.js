module.exports = ({ env }) => ({
  graphql: {
    config: {
      apolloServer: {
        tracing: false,
        introspection: true,
      },
      // Enable v4 compatibility mode for gradual migration
      v4CompatibilityMode: true,
    },
  },
  ckeditor5: {
    enabled: true,
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
  "timezone-select": {
    enabled: true,
  },
  "country-select": {
    enabled: true,
  },
  // NOTE: The following plugins were removed during Strapi 5 migration due to compatibility issues:
  // - update-static-content: No Node 22/Strapi 5 version available
  //   TODO: Implement alternative GitHub webhook trigger mechanism
  // - fuzzy-search: Requires Node <=20.x.x
  //   TODO: Migrate to Strapi 5 native search or Meilisearch integration
  // - prev-next-button: No Strapi 5 version available
  //   TODO: Evaluate if still needed or implement custom solution
});
