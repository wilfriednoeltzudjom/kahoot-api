const { validationResult } = require('express-validator');

const { deleteImage } = require('../helpers/cloudinary');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const extractedErrors = [];
  errors
    .array()
    .map(err =>
      extractedErrors.push({ [err.param]: `${err.msg} ${err.value}` })
    );

  // If image was uploaded to cloudinary
  if (req.downloadId) deleteImage(req.downloadId);

  return res.status(422).json({
    errors: extractedErrors
  });
};

module.exports = validate;
