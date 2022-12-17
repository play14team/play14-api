'use strict';

const path = require("path");
const fs = require("fs");
const yaml = require('js-yaml');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");

async function importData() {
    console.log("Importing locations");
    const locationPath = path.join(bootstrapDir, 'data/locations.yml');
    await importVenues(locationPath);
  }

async function importVenues(locationPath) {
    try {
        const data = fs.readFileSync(locationPath, { encoding: 'utf-8' });
        const locations = yaml.load(data);

        let succeeded = 0;
        let failed = 0;

        const promises = [];

        for (const location in locations) {
            if (Object.prototype.hasOwnProperty.call(locations, location)) {
                promises.push(
                    createOrUpdateLocation(locations[location], location)
                        .then(_ => {
                            succeeded++;
                        })
                        .catch(err => {
                            console.error(err);
                            failed++;
                        })
                        .then(_ => {
                            console.log(`${succeeded + failed} venues on ${promises.length} [${succeeded} succeeded, ${failed} failed]`)
                        })
                );
            }
        }

        Promise.all(promises);

    } catch (error) {
        console.error(error);
    }
}

async function createOrUpdateLocation(location, shortName) {
    const venueApiName = 'api::venue.venue';
    const venue = mapVenue(location, shortName);

    const entries = await strapi.entityService.findMany(venueApiName, {
        fields: ['id'],
        filters: { name: location.name },
    });

    if (entries.length == 0) {
        console.log(`Insterting Venue "${shortName}"`);
        await strapi.entityService.create(venueApiName, venue);
        console.log(`Venue "${shortName}" inserted`);
    } else {
        console.log(`Updating Venue "${shortName}"`);
        await strapi.entityService.update(venueApiName, entries[0].id, venue);
        console.log(`Venue "${shortName}" updated`);
    };
}

function mapVenue(location, shortName) {
    return {
        data: {
            shortName: shortName,
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
}

module.exports = { importData };
