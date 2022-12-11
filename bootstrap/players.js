const path = require("path");
const fs = require("fs");
const mime = require('mime');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");
const yaml = require('js-yaml');
const slugify = require('slugify');

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
			let file = await uploadFile(player, folderId);
			await createOrUpdatePlayer(player, file);
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
	const stats = fs.statSync(filePath);

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
				size: stats.size,
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

async function createOrUpdatePlayer(player, file) {
	const slug = mapSlug(player.name);

	const playerApi = strapi.query('api::player.player');
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
		//socialNetworks: mapSocialMedia(player.socials),
		// events: mapEvents(player.events),
		avatar: file
	};

	if (!entry) {
		console.log("Create player");
		await playerApi.create({
			data: playerData
		});
	} else {
		console.log("Update player");
		await playerApi.update({
			where: {
				id: entry.id
			},
			data: playerData
		});
	}
}

function mapSlug(name) {
	return slugify(name, {
		remove: /[*+~.()'"!:@]/g
	}).toLowerCase();
}

function mapSocialMedia(socials) {
	if (socials)
		return socials.map(s => {
			const url = s.url ? s.url.toString() : "";
			return {
				url: url,
				type: mapSocialMediaName(s.name)
			}
		});

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
