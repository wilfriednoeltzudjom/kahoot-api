const { validationResult } = require('express-validator');

const cloudinary = require('../helpers/cloudinary');
const logger = require('../helpers/logger');

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

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  // If image was uploaded to cloudinary
  if (req.downloadId) deleteImage(req.downloadId);

  return res.status(422).json({
    errors: extractedErrors
  });
};

module.exports = validate;
