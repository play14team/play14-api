var path = require("path");
const fs = require("fs");
const axios = require("axios");
const bootstrapDir = path.resolve(process.cwd(), "src/bootstrap/");
const yaml = require('js-yaml');

function importData() {
    const mdDir = path.join(bootstrapDir, "md/players");
    const jsonDir = path.join(bootstrapDir, "json/players");
    transformToJson(mdDir, jsonDir)
}

function transformToJson(mdDir, jsonDir) {
    (async ()=>{
        try {
            const files = await fs.promises.readdir( mdDir );

            for( const file of files ) {
                const mdPath = path.join( mdDir, file );
                const jsonFile = path.join( jsonDir, changeExtension(file, '.json'));

                console.log( "Converting '%s'", mdPath);
                yaml2json(mdPath, jsonFile);
                console.log( "Converted to '%s'", jsonFile );
            }
        }
        catch( e ) {
            console.error( "We've thrown! Whoops!", e );
        }
    })();
}

function yaml2json(inputfile, outputfile) {
    const data = fs.readFileSync(inputfile, {encoding: 'utf-8'});
    const split = data.split('---');
    cleanData = split.length > 2 ? split[1] : data;
    const obj = yaml.load(cleanData);
    fs.writeFileSync(outputfile, JSON.stringify(obj, null, 2));
}

function changeExtension(file, extension) {
    const basename = path.basename(file, path.extname(file))
    return path.join(path.dirname(file), basename + extension)
}

module.exports = { importData };
