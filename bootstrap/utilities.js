"use strict";

const path = require("path");
const fs = require("fs");
const { JSDOM } = require("jsdom");
const yaml = require('js-yaml');
const { ensureFolder, uploadFile } = require('./upload.js');
const { capitalize } = require('../src/libs/strings');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");

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

function sanitizeMarkdown(markdown) {
  return markdown.replaceAll("#play14", "&#x23;play14");
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

async function uploadImages(event, slug, folderId) {
  const images = [];
  if (event.images) {
    const promises = [];
    event.images.map(image => {
      if (image.includes('/images')) {
        const filePath = path.join(bootstrapDir, image);
        const name = getImageName(slug, image);
        if (fs.existsSync(filePath))
          promises.push(uploadFile(name, folderId, filePath).then(file => {
            images.push(file)
          }));
      }
    })

    await Promise.all(promises);
  }
  return images;
}

function getDefaultImage(images, slug, event) {
  const defaultImageName = event.images[0];
  if (!defaultImageName)
    return undefined;

  return images.filter(i => i.name === getImageName(slug, defaultImageName)).pop();
}

function getImageName(slug, image) {
  return slug + "_" + path.basename(image);
}

async function uploadContentImages(htmlContent, folderId) {
  let newHtmlContent = htmlContent;
  const { document } = (new JSDOM(htmlContent)).window;
  const images = document.querySelectorAll("img");
  if (images.length > 0) {
    const promises = [];
    const contentFolderId = await ensureFolder('content', folderId);
    images.forEach(image => {
      const url = image.getAttribute('src');
      if (url.startsWith('/images')) {
        const filePath = path.join(bootstrapDir, url);
        const promise = uploadFile(path.basename(url), contentFolderId, filePath)
          .then(file => {
            newHtmlContent = newHtmlContent.replaceAll(url, file.url);
          });
        promises.push(promise);
      }
    });
    await Promise.all(promises);
  }

  return newHtmlContent;
}

async function mapPlayers(names) {
  const players = [];
  if (names)
    await Promise.all(
      names.map(n => {
        return strapi.query('api::player.player').findOne({ where: { name: n } })
          .then(p => {
            if (p)
              players.push(p);

            else
              throw new Error(`Could not find player "${n}"`);
          });
      })
    );
  return players;
}

module.exports = { yaml2json, sanitizeMarkdown, mapSocialNetworks, mapPlayers, uploadImages, getDefaultImage, uploadContentImages };
