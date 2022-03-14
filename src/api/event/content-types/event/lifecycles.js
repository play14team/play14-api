'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

function slugifyEvent(data) {
  var date = new Date(data.start);
  var month = date.getMonth() + 1;
  var monthPadded = month > 10 ? month : "0" + month;
  return data.name.toLowerCase().replace(' ', '-') + "-" + monthPadded;
}

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

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
  if (data.name) {
    data.slug = slugifyEvent(data)
  }
}

//const slugify = require("slugify");

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
