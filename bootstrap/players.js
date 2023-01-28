'use strict';

const path = require("path");
const fs = require("fs");
const { ensureFolder, uploadFile } = require('./upload.js');
const { yaml2json, mapSocialNetworks } = require('./utilities.js');
const { toSlug, capitalize } = require('../src/libs/strings');
const showdown  = require('showdown');

const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");
const markdownConverter = new showdown.Converter();

async function importData() {
    console.log("Importing players");
    const markdownDir = path.join(bootstrapDir, "md/players");
    await importPlayers(markdownDir);
}

async function importPlayers(markdownDir) {
    try {
        const folderId = await ensureFolder("players");
        const files = await fs.promises.readdir( markdownDir );

        let succeeded = 0;
        let failed = 0;

        await Promise.all(
          files.map(async file => {
            try {
              await createOrUpdatePlayer(path.join(markdownDir, file), folderId);
              succeeded++;
            } catch (error) {
              console.error(error);
              failed++;
            } finally {
              console.log(`Players ${succeeded + failed} players on ${files.length} [${succeeded} succeeded, ${failed} failed]`)
            }
          })
        );
    }
    catch(error) {
        console.error(error);
    }
}

async function createOrUpdatePlayer(file, folderId) {
    const playerApiName = 'api::player.player';
    const player = yaml2json(file);
    const avatar = await uploadAvatar(player, folderId);
    const playerData = mapPlayer(player, avatar);

    const entries = await strapi.entityService.findMany(playerApiName, {
        fields: ['id'],
        filters: { name: player.name },
    });

    if (entries.length == 0) {
        console.log(`Insterting Player "${player.name}"`);
        await strapi.entityService.create(playerApiName, playerData);
        console.log(`Player "${player.name}" inserted`);
    } else {
        console.log(`Updating Player "${player.name}"`);
        await strapi.entityService.update(playerApiName, entries[0].id, playerData);
        console.log(`"${player.name}" updated`);
    };
}

async function uploadAvatar(player, folderId) {
    if (!player.avatar)
        player.avatar = "images/players/default.png";

    const slug = toSlug(player.name);
    const extension = path.extname(player.avatar);
    const fileName = slug + extension;
    const filePath = path.join(bootstrapDir, player.avatar);

    return await uploadFile(fileName, folderId, filePath);
}

function mapPlayer(player, avatar) {
  const htmlContent = markdownConverter.makeHtml(player.content);

    return {
        data: {
            name: player.name,
            slug: toSlug(player.name),
            position: capitalize(player.position),
            company: player.company,
            tagline: player.bio,
            bio: htmlContent,
            avatar: avatar,
            socialNetworks: mapSocialNetworks(player.socials),
        }
    };
}

module.exports = { importData };
