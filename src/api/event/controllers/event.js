'use strict';

/**
 *  event controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::event.event', ({ strapi }) =>  ({

  async findOne(ctx) {
    const { slug } = ctx.params;
    const { fields } = ctx.query;
    const { populate } = ctx.query;
    const { publicationState } = ctx.query;

    const query = {
      fields: fields,
      filters: { slug: slug },
      populate: populate,
      publicationState
    };

    const entities = await strapi.entityService.findMany('api::event.event', query);
    const entity = entities[0];
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  }

}));
