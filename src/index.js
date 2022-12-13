'use strict';
const players = require('../bootstrap/players')
const locations = require('../bootstrap/locations')
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
        // players.importData();
        // locations.importData();
        events.importData();
      }, 1500);
    }
  },
};
