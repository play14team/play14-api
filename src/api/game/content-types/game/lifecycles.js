"use strict";

const { toSlug } = require("../../../../libs/strings");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

function validate(data) {
  if (!data || !data.name) return;
  const slug = toSlug(data.name);
  if (data.slug != slug) {
    data.slug = slug;
  }
}

module.exports = {
  beforeCreate(game) {
    validate(game.params.data);
  },
  beforeUpdate(game) {
    validate(game.params.data);
  },
};
