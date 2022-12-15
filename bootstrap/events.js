'use strict';

const path = require("path");
const fs = require("fs");
const { ensureFolder, uploadFile } = require('./upload.js');
const { yaml2json, toSlug, capitalize, normalize } = require('./utilities.js');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");

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

        Promise.all(
            files.map(file =>
                {
                    createOrUpdateEvent(path.join(markdownDir, file), eventsFolderId)
                        .then(_ => {
                            succeeded++;
                        })
                        .catch(err => {
                            console.error(err);
                            failed++;
                        })
                        .then(_ => {
                            console.log(`Progress ${succeeded + failed} on ${files.length} [${succeeded} succeeded, ${failed} failed]`)
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

    const eventData = await mapEvent(event, parentFolderId);
    const entries = await strapi.entityService.findMany(apiName, {
        fields: ['id'],
        filters: { name: normalize(event.title) },
    });

    if (entries.length == 0) {
        console.log(`Insterting ${event.title}`);
        await strapi.entityService.create(apiName, eventData);
        console.log(`${event.title} inserted`);
    } else {
        console.log(`Updating ${event.title}`);
        await strapi.entityService.update(apiName, entries[0].id, eventData);
        console.log(`${event.title} updated`);
    };
}

async function mapEvent(event, parentFolderId) {

    const childFolderId = await ensureFolder(toSlug(event.title), parentFolderId);
    const images = await uploadImages(event, childFolderId);
    const venue = await mapVenue(event.location);
    const eventLocation = await mapEventLocation(event.category);
    const hosts = await mapHosts(event.members);

    return {
        data: {
            name: normalize(event.title),
            slug: toSlug(event.title),
            start: event.schedule.start,
            end: event.schedule.finish,
            status: mapStatus(event),
            contactEmail: event.contact,
            description: event.content,
            images: images,
            timetable: mapTimeTable(event.timetable),
            registration: mapRegistration(event.registration),
            venue: venue,
            location: eventLocation,
            hosts : hosts,


            // TODO Sponsors
            // TODO Mentors
            // TODO Players
        }
    };
}

async function uploadImages(event, folderId) {
    const images = [];
    if (event.images)
        Promise.all(
            event.images.map(image => {
                const filePath = path.join(bootstrapDir, image);
                return uploadFile(path.basename(image), folderId, filePath).then(file => { images.push(file) });
            })
        );
    return images;
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
            day: t.day,
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
          formattedValue =  (parseInt(split[0]) + 12) + ':' + split[1] + tail;
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
        return await strapi.query(apiName).findOne({ where: { shortName: location } });
    }

    if (!venue) {
        const venueData = {
            data: {
                shortName: location.name.replaceAll(' ', ''),
                name: location.name,
                address: {
                    street: location.address,
                    postalCode: "",
                    city: "",
                    area: location.area,
                },
                country: "",
                embeddedMapUrl: location.map,
                website: location.url,
            }
        };

        venue = await strapi.entityService.create(apiName, venueData);
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
        eventLocation = await strapi.entityService.create(apiName, locationData);
        console.log(`${category} inserted`);
    } else {
        eventLocation = entries[0];
    };

    return eventLocation;
}

async function mapHosts(members) {
  const hosts = [];
  if (members)
    Promise.all(
      members.map(m => {
            return strapi.query('api::player.player').findOne({ where: { name: m } })
              .then(h => {
                hosts.push(h);
              });
        })
    );
  return hosts;
}

module.exports = { importData };
