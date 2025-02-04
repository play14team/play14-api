"use strict";

const { toSlug } = require("../../../../libs/strings");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

function validate(data) {
  if (!data || !data.title) return;
  const slug = toSlug(data.title);
  if (data.slug != slug) {
    data.slug = slug;
  }
}

module.exports = {
  beforeCreate(location) {
    validate(location.params.data);
  },
  beforeUpdate(location) {
    validate(location.params.data);
  },
};
