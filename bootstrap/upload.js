"use strict";

const ensureFolder = async (folderName) => {
    const folderApiName = 'plugin::upload.folder';
    const folderService = strapi.plugins.upload.services.folder;

    let folder = await strapi.query(folderApiName).findOne({
      where: {
        name: folderName
      }
    });
    if (!folder) {
      await folderService.create({
        name: folderName
      })
      folder = await strapi.query(folderApiName).findOne({
        where: {
          name: folderName
        }
      });
      console.log(`Created folder ${folderName} with id ${folder.id}`)
    }

    return folder.id;
}

const uploadFile = async (fileName, folderId, filePath) => {
    const uploadApi = await strapi.query("plugin::upload.file");
    let file = await uploadApi.findOne({
        where: {
        name: fileName
        },
    });

    if (file) {
        console.log(`${fileName} already exists`);
    } else {
        console.log(`Uploading ${fileName}`);

        await strapi.plugins.upload.services.upload.upload({
        data: {
            fileInfo: {
            folder: folderId
            },
        },
        files: {
            path: filePath,
            name: fileName,
            type: mime.getType(filePath),
        },
        });

        file = await uploadApi.findOne({
        where: {
            name: fileName
        },
        });
    }
    return file;
}

module.exports = { ensureFolder, uploadFile };
