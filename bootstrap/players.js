var path = require("path");
const fs = require("fs");
const axios = require("axios");
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");
const yaml = require('js-yaml');
const { fail } = require("assert");

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
                    const dbPlayer = mapToDatabase(player);
                    const entries = await strapi.entityService.findMany(apiName, {
                        fields: ['id'],
                        filters: { name: player.name },
                    });

                    if (entries.length == 0) {
                        console.log("Insterting ", player.name);
                        await strapi.entityService.create(apiName, dbPlayer);
                    } else {
                        console.log("Updating ", player.name);
                        await strapi.entityService.update(apiName, entries[0].id, dbPlayer);
                    };
                    players.push(player)
                } catch (error) {
                    failed.push(player)
                    console.error(error);
                }

            }
            console.log(players.length + " players imported");
            console.log(failed.length + "  import failed");
        }
        catch( e ) {
            console.error( "Error occurred while transforming to json", e );
        }
    })();
}

function changeExtension(file, extension) {
    const basename = path.basename(file, path.extname(file))
    return path.join(path.dirname(file), basename + extension)
}

function yaml2json(inputfile) {
    const data = fs.readFileSync(inputfile, {encoding: 'utf-8'});
    const split = data.split('---');
    cleanData = split.length > 2 ? split[1] : data;
    return yaml.load(cleanData);
}

function mapToDatabase(player) {
    return {
        data: {
            name: player.name,
            position: capitalize(player.position),
            company: player.company,
            bio: player.bio,
            // avatar: mapAvatar(player.avatar),
            socialNetworks: mapSocialMedia(player.socials),
            // events: mapEvents(player.events),
        }
    };
}

function mapAvatar(avatar) {
    return null;
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

module.exports = { importData };
