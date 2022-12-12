const path = require("path");
const fs = require("fs");
const mime = require('mime');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");
const yaml = require('js-yaml');
const slugify = require('slugify');
const playerApiName = 'api::player.player';

function importData() {
	console.log("Importing players");
	const markdownDir = path.join(bootstrapDir, "md/players");
	importPlayers(markdownDir)
}

function importPlayers(markdownDir) {
    (async ()=>{
        try {
            const folderId = await ensureUloadFolder("players");
            const files = await fs.promises.readdir( markdownDir );

            for(const file of files ) {
                createOrUpdatePlayer(path.join(markdownDir, file), folderId);
            }
        }
        catch(error) {
            console.error(error);
        }
    })();
}

async function ensureUloadFolder(folderName) {
    const folderApiName = 'plugin::upload.folder';
    const folderService = strapi.plugins.upload.services.folder;

    let folder = await strapi.query(folderApiName).findOne({
      where: {
        name: folderName
      }
    });
    if (!folder) {
      await folderService.create({
        name: folderName
      })
      folder = await strapi.query(folderApiName).findOne({
        where: {
          name: folderName
        }
      });
      console.log(`Created folder ${folderName} with id ${folder.id}`)
    }

    return folder.id;
}

async function createOrUpdatePlayer(file, folderId) {
    (async () => {
        try {
            const player = yaml2json(file);
            const avatar = await uploadFile(player, folderId);
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
        } catch (error) {
            console.error(error);
        }
    })();
}

function yaml2json(inputfile) {
	const data = fs.readFileSync(inputfile, {
		encoding: 'utf-8'
	});
	const split = data.split('---');
	const cleanData = split.length > 2 ? split[1] : data;
	return yaml.load(cleanData);
}

async function uploadFile(player, folderId) {
    if (!player.avatar)
        player.avatar = "images/players/default.png";
	const slug = mapSlug(player.name);
	const extension = path.extname(player.avatar);
	const fileName = slug + extension;
	const filePath = path.join(bootstrapDir, player.avatar);

	const uploadApi = await strapi.query("plugin::upload.file");
	let file = await uploadApi.findOne({
		where: {
			name: fileName
		},
	});

	if (file) {
		console.log(`${fileName} already exists`);
	} else {
		console.log(`Uploading ${fileName}`);

		await strapi.plugins.upload.services.upload.upload({
			data: {
				fileInfo: {
					folder: folderId
				},
			},
			files: {
				path: filePath,
				name: fileName,
				type: mime.getType(filePath),
			},
		});

		file = await uploadApi.findOne({
			where: {
				name: fileName
			},
		});
	}
	return file;
}

function mapPlayer(player, avatar) {
    return {
        data: {
            name: player.name,
            position: capitalize(player.position),
            company: player.company,
            tagline: player.bio,
            bio: player.bio,
            avatar: avatar,
            socialNetworks: mapSocialMedia(player.socials),
            events: mapEvents(player.events),
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

function mapEvents(events) {
    return [];
}

function mapSlug(name) {
	return slugify(name, {
		remove: /[*+~.()'"!:@]/g
	}).toLowerCase();
}

function capitalize(name) {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

module.exports = {
	importData
};
