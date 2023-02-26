'use strict';

const path = require("path");
const fs = require("fs");
const yaml = require('js-yaml');
const exp = require("constants");
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");

async function importData() {
  console.log("Importing expectations");
  const filePath = path.join(bootstrapDir, 'data/expectations.yml');
  await importExpectations(filePath);
}

async function importExpectations(filePath) {
  try {
    const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const items = yaml.load(data);

    await importExpectationItems(items.main, "Main");
    await importExpectationItems(items.other, "Secondary");

  } catch (error) {
    console.error(error);
  }
}

async function importExpectationItems(items, type) {
  let succeeded = 0;
  let failed = 0;

  await Promise.all(
    items.map(async item => {
      try {
        await createExpectation(item, type);
        succeeded++;
      } catch (error) {
        console.error(error);
        failed++;
      } finally {
        console.log(`Expectations ${succeeded + failed} expectations on ${items.length} [${succeeded} succeeded, ${failed} failed]`)
      }
    })
  );
}

async function createExpectation(expectation, type) {
  const expectationApiName = 'api::expectation.expectation';
  try {
    const expectationData = await mapExpectation(expectation, type);
    console.log(`Insterting Expectation`);
    await strapi.entityService.create(expectationApiName, expectationData);
    console.log(`Expectation inserted`);
  } catch (error) {
    console.error(`Failed to import expectation`);
    throw error;
  }
}

async function mapExpectation(expectation, type) {
  return {
    data: {
      title: expectation.title,
      type,
      icon: expectation.icon_class,
      content: expectation.desc,
    }
  };
}

module.exports = {
  importData
};
