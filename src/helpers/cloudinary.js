const cloudinary = require('cloudinary').v2;

const logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const deleteImage = async imageId => {
  if (imageId) {
    cloudinary.uploader
      .destroy(imageId)
      .then(() => logger.info(`Successfully delete image ${imageId}`))
      .catch(err =>
        logger.error(`Error while deleting image ${imageId} : ${err.message}`)
      );
  }
};

module.exports = {
  cloudinary,
  deleteImage
};
