'use strict';

module.exports = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('map-control')
      .service('myService')
      .getWelcomeMessage();
  },
});
