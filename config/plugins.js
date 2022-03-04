module.exports = ({ env }) => ({
  transformer: {
    enabled: true,
    config: {
      prefix: '/api/'
    }
  },
  'strapi-tiptap-editor': {
    enabled: true,
    resolve: './node_modules/strapi-tiptap-editor'
  },
  upload: {
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
