module.exports = {
  /**
   * Simple example.
   * Every monday at 1am.
   */

  myJob: {
    task: async ({ strapi }) => {
      const now = new Date();

      console.log("Running event status job");
      const apiName = "api::event.event";
      const events = await strapi.entityService.findMany(apiName, {
        fields: ["id, name, end"],
        filters: {
          $and: [
            {
              $or: [
                {
                  status: "Open",
                },
                {
                  status: "Announced",
                },
              ],
            },
            {
              end: { $lt: now.toISOString() },
            },
          ],
        },
      });

      console.log(
        "'Open' or 'Announced' events in the past found:",
        events.length
      );

      events.map(async (event) => {
        console.log("Changing status of event to 'Over'", event);
        await strapi.entityService.update(apiName, event.id, {
          data: { status: "Over" },
        });
      });
    },
    options: {
      rule: "0 0 0 * * *",
    },
  },
};
