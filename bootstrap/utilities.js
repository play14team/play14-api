"use strict";
const fs = require("fs");
const yaml = require('js-yaml');

function yaml2json(inputfile) {
    const data = fs.readFileSync(inputfile, { encoding: 'utf-8' });
    const split = data.split('---');
    const cleanData = split.length > 1 ? split[1] : data;
    const json = yaml.load(cleanData);
    json["content"] = split.length > 2 ? split[2] : "";

    return json;
}

function mapSocialNetworks(socials) {
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

function toSlug(name) {
	return slugify(name, {remove: /[*+~.()'"!:@]/g}).toLowerCase();
}

function capitalize(name) {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

module.exports = { yaml2json, mapSocialNetworks, toSlug, capitalize };
