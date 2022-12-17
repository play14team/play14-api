'use strict';

const { eventToSlug } = require('../../../../libs/strings')

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

function validate(data) {
  if (!data.start) {
    data.start = new Date();
    data.start.setHours(18, 0, 0, 0);
    console.log("Changed start date to " + data.start);
  }
  if (!data.end) {
    data.end = data.start.addDays(2);
    data.end.setHours(17, 0, 0, 0);
    console.log("Changed end date to " + data.end);
  }
  if (!data.slug) {
    data.slug = eventToSlug(data.name, data.start)
  }
}

Date.prototype.addDays = function (days) {
  const date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

module.exports = {
  beforeCreate(event) {
    const {
      data
    } = event.params;

    validate(data);
  },
  beforeUpdate(event) {
    const {
      data
    } = event.params;

    validate(data);
  },
};
