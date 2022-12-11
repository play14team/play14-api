const path = require("path");
const fs = require("fs");
const mime = require('mime');
const axios = require("axios");
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");
const yaml = require('js-yaml');
const slugify = require('slugify');

function importData() {
    console.log("Importing players");
    const mdDir = path.join(bootstrapDir, "md/players");
    transformToJson(mdDir)
}

function transformToJson(mdDir) {
  (async ()=>{
        let players = [];
        let failed = [];
        try {
            const files = await fs.promises.readdir( mdDir );

            for( const file of files ) {
              const apiName = 'api::player.player';
              const mdPath = path.join( mdDir, file );
              const player = yaml2json(mdPath);
              try {
                    createAndLinkFile(player, 7);

                    // const dbPlayer = mapToDatabase(player);
                    // const entries = await strapi.entityService.findMany(apiName, {
                    //     fields: ['id'],
                    //     filters: { name: player.name },
                    // });

                    // uploadFile(player);

                    // if (entries.length == 0) {
                    //     console.log("Insterting ", player.name);
                    //     await strapi.entityService.create(apiName, dbPlayer);
                    // } else {
                    //     console.log("Updating ", player.name);
                    //     await strapi.entityService.update(apiName, entries[0].id, dbPlayer);
                    // };
                    players.push(player)
                } catch (error) {
                    failed.push(player)
                    console.error(error);
                }

            }
            console.log(`${players.length} players imported, ${failed.length} failed`);
        }
        catch( e ) {
            console.error( "Error occurred while transforming to json", e );
        }
    })();
}

function yaml2json(inputfile) {
    const data = fs.readFileSync(inputfile, {encoding: 'utf-8'});
    const split = data.split('---');
    const cleanData = split.length > 2 ? split[1] : data;
    return yaml.load(cleanData);
}

function mapToDatabase(player) {
    return {
        data: {
            slug: mapSlug(player.name),
            name: player.name,
            position: capitalize(player.position),
            company: player.company,
            bio: player.bio,
            socialNetworks: mapSocialMedia(player.socials),
            events: mapEvents(player.events),
        },
        //files: mapAvatar(player),
    };
}

function mapSlug(name) {
    return slugify(name, {remove: /[*+~.()'"!:@]/g}).toLowerCase();
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

function capitalize(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function mapEvents(events) {
    return null;
}

function changeExtension(file, extension) {
    return path.join(path.dirname(file), basename(file) + extension)
}

function basename(file){
    return path.basename(file, path.extname(file))
}

function uploadFile(player) {
    const uploadService = strapi.plugins.upload.services.upload;
    const folderName = "players";

    const slug = mapSlug(player.name);
    const fileName = slug + path.extname(player.avatar);
    const filePath = path.join(folderName, fileName);
    const folderId = ensureUloadFolder(folderName);

    console.log("Uploading " + filePath);

    const file = {
        path: path.join(bootstrapDir, player.avatar),
        name: fileName
    };

    (async ()=> {
        uploadService.upload({
            data: {
              path: filePath,
              fileInfo: {folder: folderId},
            },
            files: file
          });
    })();
}

function ensureUloadFolder(folderName) {
    const folderApiName = 'plugin::upload.folder';
    const folderService = strapi.plugins.upload.services.folder;
    let folderId = 1;

    (async ()=> {
        let folder = await strapi.query(folderApiName).findOne({where: {name: folderName}});
        if (!folder) {
            await folderService.create({name: folderName})
            folder = await strapi.query(folderApiName).findOne({where: {name: folderName}});
            folderId = folder.id;
            console.log(`Created folder ${folderName} with id ${folderId}`)
        }
    })();
    return folderId;
}

const uploadUserFilesService = async (fileArray, firstLevelFolder) => {
    const uploadService = strapi.plugins.upload.services.upload;
    const folderService = strapi.plugins.upload.services.folder;

    // FIRST LEVEL FOLDER BLOCK
    let firstLevelFolderBase = await strapi.query('plugin::upload.folder').findOne({where: {name: firstLevelFolder}});
    if (!firstLevelFolderBase) {
      await folderService.create({name: firstLevelFolder})
      firstLevelFolderBase = await strapi.query('plugin::upload.folder').findOne({where: {name: firstLevelFolder}});
    }

    // NOW LETS UPDATE THE FILES
    const uploadedFiles = await Promise.map(fileArray, async (file) => {
        return uploadService.upload({
          data: {
            path: path.join(firstLevelFolder, ),
            fileInfo: {folder: firstLevelFolderBase.id},
          },
          files: file
        })
      }
    );
}



function createAndLinkFile(player, folderId) {
    (async ()=> {
        try {
            const slug = mapSlug(player.name);
            const api = strapi.query('api::player.player');

            const extension = path.extname(player.avatar);
            const fileName = slug + extension;
            const filePath = path.join(bootstrapDir, player.avatar ?? "images/players/default.png");
            const stats = fs.statSync(filePath);

            //upload file
            const uploadApi = await strapi.query("plugin::upload.file");
            let file = await uploadApi.findOne({
                where: { name: fileName },
            });

            if (file) {
                console.log(`${fileName} already exists`);
            }
            else {
                console.log(`Uploading ${fileName}`);

                await strapi.plugins.upload.services.upload.upload({
                    data: {
                        fileInfo: {folder: folderId},
                    },
                    files: {
                        path: filePath,
                        name: fileName,
                        type: mime.getType(filePath),
                        size: stats.size,
                    },
                });

                file = await uploadApi.findOne({
                    where: { name: fileName },
                });
            }

            //create or update player
            let entry = await api.findOne({
                where: { slug: slug },
                populate: { avatar: true },
			      });

            const playerData = {
                slug: slug,
                name: player.name,
                position: capitalize(player.position),
                company: player.company,
                bio: player.bio,
                avatar: file
                // socialNetworks: mapSocialMedia(player.socials),
                // events: mapEvents(player.events),
            };

            if (!entry) {
                console.log("Create player")
                await api.create({ data: playerData});
            }
            else {
                console.log("Update player")
                await api.update({
                    where: { id: entry.id },
                    data : playerData
                });
            }
        } catch (error) {
            console.log(error);
        }
    })();
}
module.exports = { importData };
