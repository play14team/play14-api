const path = require("path");
const fs = require("fs");
const mime = require('mime');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");
const yaml = require('js-yaml');
const slugify = require('slugify');
const { endianness } = require("os");
const { entries } = require("lodash");
const playerApiName = 'api::player.player';

function importData() {
	console.log("Importing players");
	const markdownDir = path.join(bootstrapDir, "md/players");
	importPlayers(markdownDir)
}

function importPlayers(markdownDir) {
	(async () => {
		let succeeded = [];
		let failed = [];
		try {
			const folderId = await ensureUloadFolder("players");
			const files = await fs.promises.readdir(markdownDir);

			for (const file of files) {
				const mdPath = path.join(markdownDir, file);
				const player = yaml2json(mdPath);
				try {
					uploadFileAndCreateOrUpdatePlayer(player, folderId);
					succeeded.push(player)
				} catch (error) {
					failed.push(player)
					console.error(error);
				}

			}
			console.log(`${succeeded.length} players imported, ${failed.length} failed`);
		} catch (e) {
			console.error("Error occurred while transforming to json", e);
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

function yaml2json(inputfile) {
	const data = fs.readFileSync(inputfile, {
		encoding: 'utf-8'
	});
	const split = data.split('---');
	const cleanData = split.length > 2 ? split[1] : data;
	return yaml.load(cleanData);
}

function uploadFileAndCreateOrUpdatePlayer(player, folderId) {
	(async () => {
		try {
			const file = await uploadFile(player, folderId);
			const entityId = await mapPlayer(player, file);
			//await mapSocialMedia(player, entityId)
		} catch (error) {
			console.log(error);
		}
	})();
}

async function uploadFile(player, folderId) {
	const slug = mapSlug(player.name);
	const extension = path.extname(player.avatar);
	const fileName = slug + extension;
	const filePath = path.join(bootstrapDir, player.avatar ?? "images/players/default.png");

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

async function mapPlayer(player, file) {
	const slug = mapSlug(player.name);

	const playerApi = strapi.query(playerApiName);
	let entry = await playerApi.findOne({
		where: {
			slug: slug
		},
		populate: {
			avatar: true
		},
	});

	const playerData = {
		slug: slug,
		name: player.name,
		position: capitalize(player.position),
		company: player.company,
		bio: player.bio,
    // socialNetworks: [
    //     {
    //         type: "Twitter",
    //         url: "cpontet",
    //     }
    // ],
		avatar: file
	};

	if (!entry) {
		console.log("Create player");
		entry = await playerApi.create({
			data: playerData
		});
	} else {
		console.log("Update player");
		entry = await playerApi.update({
			where: {
				id: entry.id
			},
			data: playerData
		});
	}

  return entry.id;
}

function mapSlug(name) {
	return slugify(name, {
		remove: /[*+~.()'"!:@]/g
	}).toLowerCase();
}

async function mapSocialMedia(player, entityId) {
	if (player.socials) {
		const entry = await strapi.entityService.findOne(playerApiName, entityId);
    if (entry) {
        // entry was found
        const socialNetworks = createSocialMedia(player.socials);
        entry.socialNetworks = socialNetworks;
        console.log(entry);
        await strapi.entityService.update(playerApiName, entry.id, entry);
    }
	}
}

function createSocialMedia(socials) {
	if (socials)
		return socials.map(s => {
			return {
				url: mapUrl(s.url),
				type: mapSocialMediaName(s.name)
			}
		});

	return [];
}

function updateSocialMedia(entry, player) {
    if (!player.socials)
        return [];

    let socialsData = [];
    player.socials.forEach(social => {
        if (!entry.socialNetworks) {
            console.log("Create new social networks")
            socialsData.push( {
                type: mapSocialMediaName(social.name),
                url: mapUrl(social.url)
            });
        }
        else {
            entry.socialNetworks.forEach(socialNetwork => {
                if (socialNetwork.type == mapSocialMediaName(social.name)) {
                    console.log("Update social networks")
                    // socialsData.push( {
                    //     id: socialNetwork.id,
                    //     type: socialNetwork.type,
                    //     url: mapUrl(social.url)
                    // });
                }
                else {
                    console.log("Add new social networks")
                    // socialsData.push( {
                    //     type: mapSocialMediaName(social.name),
                    //     url: mapUrl(social.url)
                    // });
                }

            })
        }
    })
    return socialsData;
}

function mapUrl(url) {
	if (url)
		return url.toString();

	return "";
}

function mapSocialMediaName(name) {
	if (name.toLowerCase() === "google-plus")
		return "Other"
	if (name.toLowerCase() === "linkedin")
		return "LinkedIn";
	else
		return capitalize(name);
}

function capitalize(name) {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

function mapEvents(events) {
	return null;
}

function changeExtension(file, extension) {
	return path.join(path.dirname(file), basename(file) + extension)
}

function basename(file) {
	return path.basename(file, path.extname(file))
}

module.exports = {
	importData
};
