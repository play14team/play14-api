module.exports = {
  eventStatus: {
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
      // everyday at 00:00
      rule: "0 0 0 * * *",
    },
  },
  playerPosition: {
    task: async ({ strapi }) => {
      const now = new Date();

      console.log("Running player position job");
      const apiName = "api::player.player";
      const players = await strapi.entityService.findMany(apiName, {
        fields: ["id, name, position"],
        populate: ["hosted", "mentored"],
        filters: {
          position: { $nei: "Founder" },
        },
      });

      console.log("Players found:", players.length);

      players.map(async (player) => {
        if (isPlayer(player) && hasHosted(player)) {
          console.log(
            `Changing postion of ${player.name} from "Player" to "Host"`
          );
          await setPosition(apiName, player, "Host");
        }
        if (isHost(player) && hasNeverHosted(player)) {
          console.log(
            `Changing postion of ${player.name} from "Host" to "Player"`
          );
          await setPosition(apiName, player, "Player");
        }
        if (isHost(player) && hasMentored(player)) {
          console.log(
            `Changing postion of ${player.name} from "Host" to "Mentor"`
          );
          await setPosition(apiName, player, "Mentor");
        }
      });
    },
    options: {
      // everyday at 00:05
      rule: "0 5 0 * * *",
    },
  },
};

function isHost(player) {
  return player.position === "Host";
}

function isPlayer(player) {
  return player.position === "Player";
}

function hasHosted(player) {
  return player.hosted && notCancelled(player.hosted).length > 0;
}

function hasHosted4(player) {
  return (
    player.hosted && player.hosted.filter((e) => e.status == "Over").length > 3
  );
}

function hasNeverHosted(player) {
  return !player.hosted || notCancelled(player.hosted).length == 0;
}

function hasMentored(player) {
  return player.mentored && notCancelled(player.mentored).length > 0;
}

function notCancelled(events) {
  return events.filter((e) => e.status != "Cancelled");
}

async function setPosition(apiName, player, position) {
  await strapi.entityService.update(apiName, player.id, {
    data: { position: position },
  });
}
