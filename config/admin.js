module.exports = ({ env }) => ({
  apiToken: {
    salt: env('API_TOKEN_SALT', '123456789012345678901234567890'),
  },
  auth: {
    events: {
      onConnectionSuccess(e) {
        console.log(e.user, e.provider);
      },
      onConnectionError(e) {
        console.error(e.error, e.provider);
      },
    },
    options: {
      expiresIn: "7d",
    },
    secret: env('ADMIN_JWT_SECRET', '4657dd537e7982c3fa68ee29fa34c36d'),
  },
  url: env('PUBLIC_ADMIN_URL', '/admin'),
  autoOpen: false,
  // watchIgnoreFiles: [
  //   './my-custom-folder', // Folder
  //   './scripts/someScript.sh', // File
  // ],
  // host: 'localhost', // Only used for --watch-admin
  // port: 8003, // Only used for --watch-admin
  serveAdminPanel: env.bool('SERVE_ADMIN', true),
  forgotPassword: {
    from: 'admin@play14.org',
    replyTo: 'admin@play14.org',
  },
  watchIgnoreFiles: [
    '**/config/sync/**',
    '**/bootstrap/**',
  ],
});
