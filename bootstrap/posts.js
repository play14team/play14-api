'use strict';

const path = require("path");
const fs = require("fs");
const {
  ensureFolder,
} = require('./upload.js');
const {
  yaml2json,
  uploadImages,
  getDefaultImage,
  uploadContentImages
} = require('./utilities.js');
const {
  toSlug
} = require('../src/libs/strings');
const showdown = require('showdown');

const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");
const markdownConverter = new showdown.Converter();

async function importData() {
  console.log("Importing posts");
  const markdownDir = path.join(bootstrapDir, "md/posts");
  await importPosts(markdownDir);
}

async function importPosts(markdownDir) {
  try {
    const folderId = await ensureFolder("posts");
    const files = await fs.promises.readdir(markdownDir);

    let succeeded = 0;
    let failed = 0;

    await Promise.all(
      files.map(async file => {
        try {
          await createOrUpdatePost(path.join(markdownDir, file), folderId);
          succeeded++;
        } catch (error) {
          console.error(error);
          failed++;
        } finally {
          console.log(`Posts ${succeeded + failed} posts on ${files.length} [${succeeded} succeeded, ${failed} failed]`)
        }
      })
    );
  } catch (error) {
    console.error(error);
  }
}

async function createOrUpdatePost(file, folderId) {
  const articleApiName = 'api::article.article';
  const post = yaml2json(file);
  const title = post.title;
  try {
    const postData = await mapPost(post, folderId);
    const entries = await strapi.entityService.findMany(articleApiName, {
      fields: ['id'],
      filters: {
        title: title
      },
    });

    if (entries.length == 0) {
      console.log(`Insterting Post "${title}"`);
      await strapi.entityService.create(articleApiName, postData);
      console.log(`Post "${title}" inserted`);
    } else {
      console.log(`Updating Post "${title}"`);
      await strapi.entityService.update(articleApiName, entries[0].id, postData);
      console.log(`"${title}" updated`);
    };
  } catch (error) {
    console.error(`Failed to import '${title}'`);
    throw error;
  }
}

async function mapPost(post, parentFolderId) {
  const slug = toSlug(post.title);
  const tags = mapList(post.tags);
  const author = await mapPlayer(post.author);
  const imagesFolderId = await ensureFolder(slug, parentFolderId);
  const images = await uploadImages(post, slug, imagesFolderId);
  const defaultImage = getDefaultImage(images, slug, post);
  const htmlContent = markdownConverter.makeHtml(post.content);
  const newHtmlContent = await uploadContentImages(htmlContent, imagesFolderId);

  return {
    data: {
      title: post.title,
      slug: slug,
      // author: author,
      // cannonical: post.cannonical,
      // summary: post.excerpt,
      // defaultImage: defaultImage,
      // images: images,
      // content: newHtmlContent,
      // category: post.categories[0],
      // tags: tags,
      // publishedAt: post.date,
    }
  };
}

function mapList(values) {
  if (values)
    return values.map(value => {
      return {
        value: value
      }
    });

  return [];
}

async function mapPlayer(name) {
  if (name) {
    return strapi.query('api::player.player').findOne({ where: { name: name } })
  }
  return null;
}


module.exports = {
  importData
};
