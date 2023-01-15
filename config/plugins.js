module.exports = ({ env }) => ({
    'graphql': {
      config: {
          endpoint: '/graphql',
          shadowCRUD: true,
          playgroundAlways: true,
          depthLimit: 7,
          amountLimit: 100,
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
  'upload': {
    config: {
      provider: 'strapi-provider-upload-azure-storage',
      providerOptions: {
        account: env('STORAGE_ACCOUNT'),
        accountKey: env('STORAGE_ACCOUNT_KEY'),
        serviceBaseURL: env('STORAGE_URL'),
        containerName: env('STORAGE_CONTAINER_NAME', 'strapi_uploads'),
        cdnBaseURL: env('STORAGE_CDN_URL'),
        defaultPath: 'assets',
        maxConcurrent: 10
      }
    }
  }
});
