'use strict';

const path = require("path");
const fs = require("fs");
const mime = require('mime');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");
const yaml = require('js-yaml');
const slugify = require('slugify');
const { ensureFolder, uploadFile } = require('./upload.js');

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

function yaml2json(inputfile) {
    const data = fs.readFileSync(inputfile, { encoding: 'utf-8' });
    const split = data.split('---');
    const cleanData = split.length > 1 ? split[1] : data;
    const json = yaml.load(cleanData);
    json["content"] = split.length > 2 ? split[2] : "";

    return json;
}

async function uploadAvatar(player, folderId) {
    if (!player.avatar)
        player.avatar = "images/players/default.png";

    const slug = mapSlug(player.name);
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
            socialNetworks: mapSocialMedia(player.socials),
        }
    };
}

function mapSocialMedia(socials) {
    if (socials)
        return socials.map(s => {
            const url = s.url ? s.url?.toString() : "";
            return { url: url, type: mapSocialMediaName(s.name)}}
        );

    return [];
}

function mapSocialMediaName(name) {
    if (name.toLowerCase() === "google-plus")
        return "Other"
    if (name.toLowerCase() === "linkedin")
        return "LinkedIn";
    else
        return capitalize(name);
}

function mapSlug(name) {
	return slugify(name, {remove: /[*+~.()'"!:@]/g}).toLowerCase();
}

function capitalize(name) {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

module.exports = { importData };
