'use strict';

const path = require("path");
const fs = require("fs");
const yaml = require('js-yaml');
const {
  ensureFolder,
  uploadFile
} = require('./upload.js');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");

async function importData() {
  console.log("Importing testimonials");
  const filePath = path.join(bootstrapDir, 'data/testimonials.yml');
  await importTestimonials(filePath);
}

async function importTestimonials(filePath) {
  try {
    const folderId = await ensureFolder("testimonials");
    const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const items = yaml.load(data);

    let succeeded = 0;
    let failed = 0;

    await Promise.all(
      items.map(async item => {
        try {
          await createTestimonial(item, folderId);
          succeeded++;
        } catch (error) {
          console.error(error);
          failed++;
        } finally {
          console.log(`Testimonials ${succeeded + failed} testimonials on ${items.length} [${succeeded} succeeded, ${failed} failed]`)
        }
      })
    );
  } catch (error) {
    console.error(error);
  }
}

async function createTestimonial(testimonial, folderId) {
  const testimonialApiName = 'api::testimonial.testimonial';
  try {
    const testimonialData = await mapTestimonial(testimonial, folderId);
    console.log(`Insterting Testimonial`);
    await strapi.entityService.create(testimonialApiName, testimonialData);
    console.log(`Testimonial inserted`);
  } catch (error) {
    console.error(`Failed to import testimonial`);
    throw error;
  }
}

async function mapTestimonial(testimonial, parentFolderId) {
  const audio = await mapAudio(testimonial.audio, parentFolderId);
  const author = await mapPlayer(testimonial.author);

  return {
    data: {
      content: testimonial.text,
      audio,
      author,
    }
  };
}

async function mapAudio(audio, folderId) {
  if (audio) {
    const filePath = path.join(bootstrapDir, audio);
    const name = path.basename(audio);
    return await uploadFile(name, folderId, filePath);
  }
}

async function mapPlayer(name) {
  if (!name)
    return {};

  try {
    return strapi.query('api::player.player').findOne({
      where: {
        name: name
      }
    })
  } catch (error) {
    throw new Error(`Could not find player "${name}"`);
  }
}

module.exports = {
  importData
};
