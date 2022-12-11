const { Readable } = require("stream");

const getServiceUpload = (name) => {
  return strapi.plugin("upload").service(name);
};

const uploadAndLink = async (buffer, {filename, extension, mimeType, refId, ref, field, user}) => {
  const config = strapi.config.get("plugin.upload");

  // add generated document
  const entity = {
    name,
    hash: filename,
    ext: extension,
    mime: mimeType,
    size: buffer.length,
    provider: config.provider,
  };
  if (refId) {
    entity.related = [
      {
        id: refId,
        __type: ref,
        __pivot: { field },
      },
    ];
  }
  entity.getStream = () => Readable.from(buffer);
  await getServiceUpload("provider").upload(entity);

  const fileValues = { ...entity };
  if (user) {
    // created_by has a foreign key on admin_users. Here our user is a regular user, so it fails.
    // uncomment this only if the user you pass to the function is a strapi admin.
    /*fileValues[UPDATED_BY_ATTRIBUTE] = user.id;
    fileValues[CREATED_BY_ATTRIBUTE] = user.id;*/
  }

  const res = await strapi
    .query("plugin::upload.file")
    .create({ data: fileValues });
  return res;
};


const uploadImage = async (file) => {
  const formData = new FormData()

  formData.append('files', file)

  axios.post("http://localhost:1337/api/upload", formData)
  .then((response)=>{

    const imageId = response.data[0].id

    axios.post("http://localhost:1337/api/player", { image:imageId }).then((response)=>{
      //handle success
    }).catch((error)=>{
        //handle error
      })
  }).catch((error)=>{
      //handle error
  })

}

const uploadFileBinary = async (binary, uuid) => {
  const fileInfo = { name: uuid }
  const metas = {}
  const { optimize } = strapi.plugins.upload.services['image-manipulation'];
  const { buffer, info } = await optimize(binary);
  const formattedFile = await strapi.plugins.upload.services.upload.formatFileInfo(
    {
      filename: uuid + '.png',
      type: 'image/png',
      size: binary.toString().length,
    },
    fileInfo,
    metas
  );
  const fileData = _.assign(formattedFile, info, { buffer });
  const upload = await strapi.plugins.upload.services.upload.uploadFileAndPersist(fileData)
  return upload.id;
}






                // let file = strapi.plugins.upload.services.upload.findOne({
                //     where: { name: fileName },
                // });

                // console.log(file);

                //files=@/path/to/pictures/avatar.jpg&refId=5a993616b8e66660e8baf45c&ref=user&source=users-permissions&field=avatar'

                // const file = {
                //     files: fs.createReadStream(pathName),
                //     path: "player/avatar", // Uploading folder of file(s).
                //     refId: "5a993616b8e66660e8baf45c", // User's Id.
                //     ref: "player", // Model name.
                //     source: "upload", // Plugin name.
                //     field: "avatar" // Field name in the User model.
                //   }

                // const uploadService = strapi.plugins.upload.services.upload;
                // try {
                //     uploadService.upload({
                //         data: {
                //           path: pathName,
                //           fileInfo: {folder: 6},
                //         },
                //         files: fs.createReadStream(pathName)
                //       });
                // } catch (error) {
                //     console.log(error);
                // }

                // const returnEntry = await strapi.entityService.uploadFiles(entry, {
                //     'files.avatar': fs.createReadStream(pathName)
                // }, {
                //     model: 'api::player.player'
                // });

                // console.log(returnEntry);
