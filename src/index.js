'use strict';
const venues = require('../bootstrap/venues')
const sponsors = require('../bootstrap/sponsors')
const players = require('../bootstrap/players')
const events = require('../bootstrap/events')

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap() {
    if (process.env.BOOTSTRAP === "true")
    {
      console.log("Bootstrap started");
      setTimeout(() => {
        sponsors.importData();
        // venues.importData();
        // players.importData();
        events.importData();
      }, 1500);
    }
  },
};
