"use strict";

const fs = require("fs");
const yaml = require('js-yaml');
const { capitalize } = require('../src/libs/strings');

function yaml2json(inputfile, skipSplit) {
    const data = fs.readFileSync(inputfile, { encoding: 'utf-8' });
    if (!skipSplit)
    {
      const split = data.split('---');
      const cleanData = split.length > 1 ? split[1] : data;
      const json = yaml.load(cleanData);
      json["content"] = split.length > 2 ? split[2] : "";
      return json;
    }
    else
      return yaml.load(data);
}

function mapSocialNetworks(socials) {
  const socialNetworks = [];
  socials && socials.map(s => {
    const type = mapSocialNetworkName(s.name);
    if (type) {
      const url = mapSocialNetworkUrl('' + s.url, type).toString();
      socialNetworks.push({ url: url, type: type});
    }
  });

  return socialNetworks;
}

function mapSocialNetworkUrl(url, socialNetworkName) {
  switch (socialNetworkName) {
    case "Twitter":
      return new URL(url, "https://twitter.com");
    case "LinkedIn":
      return new URL(url, "https://www.linkedin.com");
    case "Facebook":
      return new URL(url, "https://www.facebook.com");
    case "Youtube":
      return new URL(url, "https://www.youtube.com");
    case "Instagram":
      return new URL(url, "https://www.instagram.com");
    case "Xing":
      return new URL(url, "https://www.xing.com/");
    case "Wikipedia":
      return new URL(url, "https://www.wikipedia.org");
    case "Vimeo":
      return new URL(url, "https://vimeo.com");
    case "Email":
        return "mailto:" + url;
    default:
      return url;
  }
}

function mapSocialNetworkName(name) {
    if (name.toLowerCase() === "google-plus")
        return null;
    if (name.toLowerCase() === "linkedin")
        return "LinkedIn";
    else
        return capitalize(name);
}

module.exports = { yaml2json, mapSocialNetworks };
