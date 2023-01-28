'use strict';

const path = require("path");
const fs = require("fs");
const { ensureFolder, uploadFile } = require('./upload.js');
const { yaml2json, mapPlayers, uploadImages, getDefaultImage, uploadContentImages  } = require('./utilities.js');
const { toSlug } = require('../src/libs/strings');
const showdown = require('showdown');

const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");
const markdownConverter = new showdown.Converter();

async function importData() {
  console.log("Importing games");
  const markdownDir = path.join(bootstrapDir, "md/games");
  await importGames(markdownDir);
}

async function importGames(markdownDir) {
  try {
    const folderId = await ensureFolder("games");
    const files = await fs.promises.readdir(markdownDir);

    let succeeded = 0;
    let failed = 0;

    await Promise.all(
      files.map(async file => {
        try {
          await createOrUpdateGame(path.join(markdownDir, file), folderId);
          succeeded++;
        } catch (error) {
          console.error(error);
          failed++;
        } finally {
          console.log(`Games ${succeeded + failed} games on ${files.length} [${succeeded} succeeded, ${failed} failed]`)
        }
      })
    );
  } catch (error) {
    console.error(error);
  }
}

async function createOrUpdateGame(file, folderId) {
  const gameApiName = 'api::game.game';
  const game = yaml2json(file);
  const name = game.title;
  try {
    const gameData = await mapGame(game, folderId);
    const entries = await strapi.entityService.findMany(gameApiName, {
      fields: ['id'],
      filters: {
        name: name
      },
    });

    if (entries.length == 0) {
      console.log(`Insterting Game "${name}"`);
      await strapi.entityService.create(gameApiName, gameData);
      console.log(`Game "${name}" inserted`);
    } else {
      console.log(`Updating Game "${name}"`);
      await strapi.entityService.update(gameApiName, entries[0].id, gameData);
      console.log(`"${name}" updated`);
    };
  } catch (error) {
    console.error(`Failed to import '${name}'`);
    throw error;
  }
}

async function mapGame(game, parentFolderId) {
  const slug = toSlug(game.title);
  const category = mapCategory(game.category);
  const tags = mapList(game.tags);
  const imagesFolderId = await ensureFolder(slug, parentFolderId);
  const images = await uploadImages(game, slug, imagesFolderId);
  const defaultImage = getDefaultImage(images, slug, game);
  const authors = await mapPlayers(game.authors);
  const originators = await mapPlayers(game.originators);
  const firstPlayedAt = await mapEvent(game.firstplayed);
  const materials = mapList(game.materials);
  const preparationSteps = mapList(game.preparations);
  const resources = await mapFiles(game.resources, parentFolderId);
  const safety = mapSafety(game.safety);
  const htmlContent = markdownConverter.makeHtml(game.content);
  const newHtmlContent = await uploadContentImages(htmlContent, imagesFolderId);

  return {
    data: {
      name: game.title,
      slug: slug,
      gategory: category,
      tags: tags,
      authors: authors,
      originators: originators,
      credits: game.credits,
      firstPlayedAt: firstPlayedAt,
      scale: game.scale,
      timebox: game.timebox,
      summary: game.excerpt,
      materials: materials,
      preparationSteps: preparationSteps,
      resources: resources,
      safety: safety,
      defaultImage: defaultImage,
      images: images,
      description: newHtmlContent,
      publishedAt: game.publishdate,
    }
  };
}

function mapCategory(event) {
  switch (event.category) {
    case "ice breaker":
      return "IceBreaker";
    case "ice breaker":
      return "IceBreaker";
    case "warmup":
      return "WarmUp";
    case "cooldown":
      return "CoolDown";
    case "facilitation":
      return "Facilitation";
    case "retrospective":
      return "Rectrospective";
    default:
      return "Game";
  }
}

async function mapFiles(resources, folderId) {
  const files = [];
  if (resources && resources.length > 0) {
    const filesFolderId = await ensureFolder('files', folderId);
    Promise.all(resources.map(async (resource) => {
      const filePath = path.join(bootstrapDir, resource.url);
      return uploadFile(resource.name, filesFolderId, filePath).then(file => files.push(file));
    }));
  }
  return files;
}

function mapList(values) {
  if (values)
    return values.map(value => { return { value: value }});

  return [];
}

function mapSafety(safety) {
  if (safety)
    return safety.map(s => { return {key: s.title, value: s.description}});

  return [];
}

async function mapEvent(name) {
  if (!name)
    return {};

  try {
    return strapi.query('api::event.event').findOne({ where: { name: name } })
  } catch (error) {
    throw new Error(`Could not find event "${name}"`);
  }
}

module.exports = { importData };
