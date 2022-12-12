const path = require("path");
const fs = require("fs");
const yaml = require('js-yaml');
const bootstrapDir = path.resolve(process.cwd(), "bootstrap/");

async function importData() {
    console.log("Importing locations");
  }

module.exports = { importData };
