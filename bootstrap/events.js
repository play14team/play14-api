'use strict';

const path = require("path");
const fs = require("fs");
const { ensureFolder, uploadFile } = require('./upload.js');
const { yaml2json, mapSocialNetworks, toSlug, capitalize } = require('./utilities.js');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");

async function importData() {
    console.log("Importing events");
    const markdownDir = path.join(bootstrapDir, "md/events");
    await importEvents(markdownDir);
}

async function importEvents(markdownDir) {
    try {
        const folderId = await ensureFolder("events");
        const files = await fs.promises.readdir( markdownDir );

        let succeeded = 0;
        let failed = 0;

        Promise.all(
            files.map(file =>
                {
                    createOrUpdateEvent(path.join(markdownDir, file), folderId)
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

async function createOrUpdateEvent(file, folderId) {
    const apiName = 'api::event.event';
    const event = yaml2json(file);

    const images = await uploadImages(event, folderId);
    const eventData = mapEvent(event, images);

    const entries = await strapi.entityService.findMany(apiName, {
        fields: ['id'],
        filters: { name: event.name },
    });

    if (entries.length == 0) {
        console.log(`Insterting ${event.name}`);
        await strapi.entityService.create(apiName, eventData);
        console.log(`${event.name} inserted`);
    } else {
        console.log(`Updating ${event.name}`);
        await strapi.entityService.update(apiName, entries[0].id, eventData);
        console.log(`${event.name} updated`);
    };
}

async function uploadImages(event, folderId) {
    // if (!event.avatar)
    //     event.avatar = "images/events/default.png";

    // const slug = toSlug(event.name);
    // const extension = path.extname(event.avatar);
    // const fileName = slug + extension;
    // const filePath = path.join(bootstrapDir, event.avatar);

    // return await uploadFile(fileName, folderId, filePath);
}

function mapEvent(event, images) {
    return {
        data: {
            name: event.name,
            start: event.schedule.start,
            end: event.schedule.finish,
            status: mapStatus(event),
            contactEmail: event.contact,
            description: event.content,
            images: images,
            timetable: mapTimeTable(event.timetable),
            registration: mapRegistration(event.registration),
            venue: mapVenue(event.location)
            // TODO Sponsors
        }
    };
}

function mapStatus(event) {
    if (event.schedule.isCancelled)
        return "Cancelled";
    else if (event.schedule.isOver || Date.now() > event.schedule.finish)
        return "Over";
    else if ((event.schedule.registration.link && event.schedule.registration.url) || event.schedule.registration.type)
        return "Open";

    return "Announced";
}

function mapTimeTable(timetable) {
    // TODO
    return [];
}

function mapRegistration(registration) {
    // TODO
    return {};
}

function mapVenue(location) {
    // TODO
    return {};
}

module.exports = { importData };
