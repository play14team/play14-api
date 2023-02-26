'use strict';
const venues = require('../bootstrap/venues')
const sponsors = require('../bootstrap/sponsors')
const players = require('../bootstrap/players')
const events = require('../bootstrap/events')
const games = require('../bootstrap/games')
const posts = require('../bootstrap/posts')
const testimonials = require('../bootstrap/testimonials')

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
      setTimeout(async () => {
        // await sponsors.importData();
        // await venues.importData();
        // await players.importData();
        // await events.importData();
        // await games.importData();
        // await posts.importData();
        // await testimonials.importData();
      }, 1500);
    }
  },
};
