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
        filters: { name: event.title },
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

    return {
        data: {
            slug: toSlug(event.title),
            name: event.title,
            start: event.schedule.start,
            end: event.schedule.finish,
            status: mapStatus(event),
            contactEmail: event.contact,
            description: event.content,
            images: images,
            timetable: mapTimeTable(event.timetable),
            registration: mapRegistration(event.registration),
            venue: venue
            // TODO EventLocation
            // TODO Sponsors
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
    // TODO
    return [];
}

function mapRegistration(registration) {
    // TODO
    return {};
}

async function mapVenue(location) {
    // TODO
    return {};
}

module.exports = { importData };
