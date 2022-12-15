'use strict';

const path = require("path");
const fs = require("fs");
const yaml = require('js-yaml');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");
const { ensureFolder, uploadFile } = require('./upload');
const { mapSocialNetworks } = require('./utilities');

async function importData() {
    console.log("Importing sponsors");
    const filePath = path.join(bootstrapDir, 'data/sponsors.yml');
    await importItems(filePath, mapSponsor, 'api::sponsor.sponsor');
  }

async function importItems(filePath, mapItem, apiName) {
  try {
    const sponsorsFolderId = await ensureFolder("sponsors");
    const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const items = yaml.load(data);

    let succeeded = 0;
    let failed = 0;

    Promise.all(
      items.map(item => {
        createOrUpdate(mapItem(item, sponsorsFolderId), item.name, apiName)
          .then(_ => {
            succeeded++;
          })
          .catch(err => {
            console.error(err);
            failed++;
          })
          .then(_ => {
            console.log(`Progress ${succeeded + failed} on ${items.length} [${succeeded} succeeded, ${failed} failed]`);
          });
      })
    );
  } catch (error) {
      console.error(error);
  }
}

async function createOrUpdate(value, name, apiName) {
  try {
    const entries = await strapi.entityService.findMany(apiName, {
        fields: ['id'],
        filters: { name: name },
    });

    if (entries.length == 0) {
        console.log(`Insterting ${name}`);
        await strapi.entityService.create(apiName, value);
        console.log(`${name} inserted`);
    } else {
        console.log(`Updating ${name}`);
        await strapi.entityService.update(apiName, entries[0].id, value);
        console.log(`${name} updated`);
    };
  }
  catch (err) {
    console.log(`Failed to create or update ${name}`);
    confirm.err(err);
  }
}

async function mapSponsor(sponsor, folderId) {
  try {
    const logo = await uploadFile(path.basename(sponsor.logo), folderId, path.join(bootstrapDir, sponsor.logo));
    const socialNetworks = mapSocialNetworks(sponsor.socials);

      return {
          data: {
              name: sponsor.name,
              url: sponsor.url,
              logo: logo,
              socialNetworks: socialNetworks,
          }
      };
  }
  catch (err)
  {
    console.log("Cannot map sponsor");
    console.log(sponsor);
    console.error(err);
  }
}

module.exports = { importData };
