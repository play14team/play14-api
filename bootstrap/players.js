'use strict';

const path = require("path");
const fs = require("fs");
const { ensureFolder, uploadFile } = require('./upload.js');
const { yaml2json, mapSocialNetworks, toSlug, capitalize } = require('./utilities.js');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");

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

        Promise.all(
            files.map(file =>
                {
                    createOrUpdatePlayer(path.join(markdownDir, file), folderId)
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
        console.log(`Insterting ${player.name}`);
        await strapi.entityService.create(playerApiName, playerData);
        console.log(`${player.name} inserted`);
    } else {
        console.log(`Updating ${player.name}`);
        await strapi.entityService.update(playerApiName, entries[0].id, playerData);
        console.log(`${player.name} updated`);
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
    return {
        data: {
            name: player.name,
            position: capitalize(player.position),
            company: player.company,
            tagline: player.bio,
            bio: player.content,
            avatar: avatar,
            socialNetworks: mapSocialNetworks(player.socials),
        }
    };
}

module.exports = { importData };
