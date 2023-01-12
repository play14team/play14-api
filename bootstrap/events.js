'use strict';

const path = require("path");
const fs = require("fs");
const showdown  = require('showdown');
const { JSDOM } = require("jsdom");
const { ensureFolder, uploadFile } = require('./upload.js');
const { yaml2json } = require('./utilities.js');
const { eventToSlug, capitalize, normalize } = require('../src/libs/strings');
const { Mutex } = require('async-mutex');

const mutex = new Mutex();
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");
const markdownConverter = new showdown.Converter();

async function importData() {
    console.log("Importing events");
    const markdownDir = path.join(bootstrapDir, "md/events");
    await importEvents(markdownDir);
}

async function importEvents(markdownDir) {
    try {
        const eventsFolderId = await ensureFolder("events");
        const files = await fs.promises.readdir( markdownDir );

        let succeeded = 0;
        let failed = 0;
        let errors = [];

        await Promise.all(
            files.map(file =>
                {
                    createOrUpdateEvent(path.join(markdownDir, file), eventsFolderId)
                        .then(_ => {
                          succeeded++;
                        })
                        .catch(err => {
                          console.error(err);
                          failed++;
                          errors[file] = err;
                        })
                        .then(_ => {
                            console.log(`${succeeded + failed} events on ${files.length} [${succeeded} succeeded, ${failed} failed]`);
                            const count = succeeded + failed;
                            if (files.length === count && errors.length > 0)                             {
                              console.log(`There were ${errors.length} issues during the processing`)
                              console.log(errors);
                            }
                        })
                })
        );
    }
    catch(error) {
        console.error(error);
    }
}

async function createOrUpdateEvent(file, parentFolderId) {
  const apiName = 'api::event.event';
  const event = yaml2json(file);
  let isHandled = false;
  try {
    const eventData = await mapEvent(event, parentFolderId);

    const entries = await strapi.entityService.findMany(apiName, {
      fields: ['id'],
      filters: {
        name: normalize(event.title)
      },
    });

    if (entries.length == 0) {
      try {
        console.log(`Insterting Event "${event.title}"`);
        await strapi.entityService.create(apiName, eventData);
        console.log(`Event "${event.title}" inserted`);
      } catch (error) {
        console.error(`Could not insert "${event.title}"`)
        isHandled = true;
        throw error;
      }
    } else {
      try {
        console.log(`Updating Event "${event.title}"`);
        await strapi.entityService.update(apiName, entries[0].id, eventData);
        console.log(`Event "${event.title}" updated`);
      } catch (error) {
        console.error(`Could not update "${event.title}"`)
        isHandled = true;
        throw error;
      }
    };

  } catch (error) {
    if (!isHandled)
      console.error(`Could not create or update "${event.title}"`)
    throw error;
  }
}

async function mapEvent(event, parentFolderId) {
  const slug = eventToSlug(event.title, event.schedule.start);
  const imagesFolderId = await ensureFolder(slug, parentFolderId);
  const images = await uploadImages(event, imagesFolderId);
  const defaultImage = getDefaultImage(images, event);
  const venue = await mapVenue(event.location);
  const eventLocation = await mapEventLocation(event.category);
  const hosts = await mapPlayers(event.members);
  const mentors = await mapPlayers(event.mentors);
  const players = await mapPlayersFromEvent(event.title);
  const sponsorships = await mapSponsors(event.sponsors);

  const htmlContent = markdownConverter.makeHtml(event.content);
  const newHtmlContent = await uploadContentImages(htmlContent, imagesFolderId);

  return {
      data: {
          name: normalize(event.title),
          slug: slug,
          start: event.schedule.start,
          end: event.schedule.finish,
          status: mapStatus(event),
          contactEmail: event.contact,
          description: newHtmlContent,
          defaultImage: defaultImage,
          images: images,
          timetable: mapTimeTable(event.timetable),
          registration: mapRegistration(event.registration),
          venue: venue,
          location: eventLocation,
          hosts: hosts,
          mentors: mentors,
          players: players,
          sponsorships: sponsorships,
          media: mapMedia(event.title),
          publishedAt: event.schedule.start,
      }
  };
}

async function uploadContentImages(htmlContent, folderId) {
  let newHtmlContent = htmlContent;
  const { document } = (new JSDOM(htmlContent)).window;
  const images = document.querySelectorAll("img");
  if (images.length > 0) {
    const promises = [];
    const contentFolderId = await ensureFolder('content', folderId);
    images.forEach(image => {
      const url = image.getAttribute('src');
      if (url.startsWith('/images')) {
        const filePath = path.join(bootstrapDir, url);
        const promise = uploadFile(path.basename(url), contentFolderId, filePath)
          .then(file => {
            newHtmlContent = newHtmlContent.replaceAll(url, file.url);
          });
        promises.push(promise);
      }
    });
    await Promise.all(promises);
  }

  return newHtmlContent;
}

async function uploadImages(event, folderId) {
    const images = [];
    if (event.images) {
      const promises = [];
      event.images.map(image => {
          if (image.includes('/images')) {
            const filePath = path.join(bootstrapDir, image);
            if (fs.existsSync(filePath))
              promises.push(uploadFile(path.basename(image), folderId, filePath).then(file => { images.push(file) }));
          }
      })

      await Promise.all(promises);
    }
    return images;
}

function getDefaultImage(images, event) {
  const defaultImageName = event.images[0];
  if (!defaultImageName)
    return undefined;

  return images.filter(i => i.name === path.basename(defaultImageName)).pop();
}

function mapStatus(event) {
    if (event.schedule.isCancelled)
        return "Cancelled";
    else if (event.schedule.isOver || Date.now() > event.schedule.finish)
        return "Over";
    else if ((event.registration && ((event.registration.link && event.registration.url) || event.registration.type)))
        return "Open";

    return "Announced";
}

function mapTimeTable(timetable) {
    if (!timetable)
        return [];

    const t = timetable.map(t => {
        return {
            day: t.day.split(' ')[0],
            description: t.desc,
            timeslots: mapTimeslots(t.times)
        }
    });

    return t;
}

function mapTimeslots(timeslots) {
    if (!timeslots)
        return [];

    return timeslots.map(t => {
        const time = mapTime(t.time);
        return {
            time: time,
            description: t.desc,
        };
    });
}

function mapTime(time) {
    let formattedValue = null;
    const tail = ':00.000';
    if (time.includes('AM')) {
        const value = time.replaceAll('AM', '').trim();
        if (time.includes(':')) {
          formattedValue = value + tail;
        }
        else {
          formattedValue =  value + ':00' + tail;
        }
    }
    else if (time.includes('PM')) {
      const value = time.replaceAll('PM', '').trim();
      if (time.includes(':')) {
          const split = value.split(':');
          const hours = parseInt(split[0]);
          const addHours = (hours < 12) ? 12 : 0;
          formattedValue =  (hours + addHours) + ':' + split[1] + tail;
      }
      else {
        formattedValue =  (parseInt(value) + 12) + ':00' + tail;
      }
    }

    if (formattedValue)
        formattedValue = formattedValue.padStart(12, '0');
    else
        formattedValue = (time + tail);

    return formattedValue;
}

function mapRegistration(registration) {
  if (!registration)
    return {};

  if (registration.type && registration.type === 'link')
  {
      return { link: registration.url }
  }

  return { widgetCode: JSON.stringify(registration) };
}

async function mapVenue(location) {
    const apiName = 'api::venue.venue';
    let venue = {};

    if (location && location.name) {
      venue = await strapi.query(apiName).findOne({ where: { name: location.name } });
    } else if (location) {
      venue = await strapi.query(apiName).findOne({ where: { shortName: location } });
    }

    if (!venue) {
      let shortName = (location.name || location)
      shortName = shortName.replaceAll(' ', '');
      const venueData = {
          data: {
              shortName: shortName,
              name: location.name || location,
              address: {
                  street: location.address || "",
                  postalCode: "",
                  city: "",
                  area: location.area || "",
              },
              country: "",
              embeddedMapUrl: location.map || "",
              website: location.url || "",
          }
      };

      await mutex.runExclusive(async () => {
        venue = await strapi.entityService.create(apiName, venueData);
      });
    }

    return venue;
}

async function mapEventLocation(category) {
    const apiName = 'api::event-location.event-location';

    const entries = await strapi.entityService.findMany(apiName, {
        fields: ['id'],
        filters: { slug: category },
    });

    let eventLocation = {};

    if (entries.length == 0) {
        console.log(`Insterting ${category}`);
        const locationData = {
          data: {
            slug: category,
            name: capitalize(category)
          }
        }
        await mutex.runExclusive(async () => {
          eventLocation = await strapi.entityService.create(apiName, locationData);
        });
        console.log(`${category} inserted`);
    } else {
        eventLocation = entries[0];
    };

    return eventLocation;
}

async function mapPlayersFromEvent(eventName) {
  const names = await getPlayerNames(eventName);
  return await mapPlayers(names);
}

async function mapPlayers(names) {
  const players = [];
  if (names)
    await Promise.all(
      names.map(n => {
        return strapi.query('api::player.player').findOne({ where: { name: n } })
          .then(p => {
            if (p)
              players.push(p);

            else
              throw new Error(`Could not find player "${n}"`);
          });
      })
    );
  return players;
}

async function getPlayerNames(eventName) {
  const markdownDir = path.join(bootstrapDir, "md/players");
  const files = await fs.promises.readdir( markdownDir );

  const names = [];
  files.map(file =>
    {
      const player = yaml2json(path.join(markdownDir, file));
      if (player.events && player.events.includes(eventName)) {
        names.push(player.name);
      }
    }
  );

  return names;
}

async function mapSponsors(sponsors) {
  const sponsorships = [];
  if (sponsors)
  {
    const sponsorsByType = getSponsorsByType(sponsors);
    await Promise.all(
      Object.keys(sponsorsByType).map((type) => {
        const names = sponsorsByType[type];
        return findSponsorsByName(names)
          .then(sponsorItems => {
            const sponsorship = {
              category: type,
              sponsors: sponsorItems
            };
            sponsorships.push(sponsorship);
          })
      })
    );
  }
  return sponsorships;
}

function getSponsorsByType(sponsors) {
  if(sponsors) {
    return sponsors.reduce((group, sponsor) => {
      const { type } = sponsor;
      group[type] = group[type] ?? [];
      group[type].push(sponsor.name);
      return group;
    }, {});
  }

  return {};
}

async function findSponsorsByName(names) {
  const items = [];
  if (names)
    await Promise.all(
      names.map(name => {
            return strapi.query('api::sponsor.sponsor').findOne({ where: { name: name } })
              .then(item => {
                if (item)
                  items.push(item);
                else
                  throw new Error(`Could not find sponsor "${name}"`);
              });
        })
    );
  return items;
}

function mapMedia(eventName) {
  const results = [];
  const media = yaml2json(path.join(bootstrapDir, "data/media.yml"), true);
  media
    .filter(medium => medium.name.includes(eventName))
    .map(medium => {
      if (medium.photos) {
        const result = {
          url: medium.photos,
          type: "Photos"
        };
        results.push(result);
      }
      if (medium.videos) {
        const result = {
          url: medium.videos,
          type: "Videos"
        };
        results.push(result);
      }
    });
  return results;
}

module.exports = { importData };
