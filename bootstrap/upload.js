"use strict";

const fs = require("fs");
const mime = require('mime');
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

async function ensureFolder(folderName, parentFolderId) {
    let folder = await getFolder(folderName, parentFolderId);
    if (!folder) {
      console.log(`Creating folder "${folderName}"`);
      await mutex.runExclusive(async () => {
        await createFolder(folderName, parentFolderId);
        folder = await getFolder(folderName, parentFolderId);
        console.log(`Folder ${folderName} created with id ${folder.id}`)
      });
    }

    return folder.id;
}

async function getFolder(folderName, parentFolderId) {
  const whereClause = { name: folderName };
  if (parentFolderId)
  {
    whereClause["parent"] = await getFolderById(parentFolderId);
  }

  return await strapi.query('plugin::upload.folder').findOne({ where: whereClause });
}

async function createFolder(folderName, parentFolderId) {
  const folder = { name: folderName };
  if (parentFolderId)
  {
    folder["parent"] = parentFolderId;
  }

  await strapi.plugins.upload.services.folder.create(folder);
}

async function getFolderById(folderId) {
  const whereClause = { id: folderId };
  return await strapi.query('plugin::upload.folder').findOne({ where: whereClause });
}

async function uploadFile(fileName, folderId, filePath) {
    const uploadApi = await strapi.query("plugin::upload.file");
    let file = await uploadApi.findOne({
        where: {
          name: fileName,
          folder: folderId
        },
    });

    if (!file) {
        console.log(`Uploading ${fileName}`);

        try {
          const stats = fs.statSync(filePath);
          await strapi.plugins.upload.services.upload.upload({
            data: {
                fileInfo: { folder: folderId },
            },
            files: {
                path: filePath,
                name: fileName,
                type: mime.getType(filePath),
                size: stats.size,
            },
          });
        } catch (error) {
          console.error(`Could not upload ${filePath}`);
          console.error(error);
        }


        file = await uploadApi.findOne({
        where: {
            name: fileName
        },
        });
    }
    return file;
}

module.exports = { ensureFolder, uploadFile };

