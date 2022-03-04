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
  'website-builder': {
    enabled: true,
    config: {
      url: 'https://api.vercel.com/v1/integrations/deploy/prj_U1wjY8CZ3cCXxTe20hYlChK4r2fA/RtFvN1P3hc',
      trigger: {
        type: 'event',
        events: [
          {
            model: 'events',
            types: ['create', 'update', 'delete'],
          },
        ],
      },
    }
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
