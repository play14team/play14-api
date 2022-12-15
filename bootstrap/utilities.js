"use strict";

const fs = require("fs");
const yaml = require('js-yaml');
const slugify = require('slugify');

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

function toSlug(value) {
  const normalized = normalize(value);
	return slugify(normalized, {remove: /[*+~.()'"!:@]/g}).toLowerCase();
}

function capitalize(value) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

module.exports = { yaml2json, mapSocialNetworks, toSlug, capitalize, normalize };
