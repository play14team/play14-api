'use strict';

const { eventToSlug } = require('../../../../libs/strings')

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

function validate(data) {
  if (!data || !data.name || !data.start) return;
  const slug = eventToSlug(data.name, data.start);
  if (data.slug != slug) {
    data.slug = slug;
  }
}

module.exports = {
  beforeCreate(event) {
    validate(event.params.data);
  },
  beforeUpdate(event) {
    validate(event.params.data);
  },
};
