const multer = require('multer');
const DataUri = require('datauri');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const { BadRequestError } = require('../utils/errors');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const multerHander = multer({ storage }).single('image');

const dataUri = file =>
  new DataUri().format(path.extname(file.originalname).toString(), file.buffer);

const uploadHandler = async (req, res, next) => {
  if (req.file) {
    const { folder } = req.body;
    const file = dataUri(req.file).content;
    const { url } = await cloudinary.uploader.upload(file, {
      folder: `kahoot/${folder}`
    });

    req.downloadUrl = url;
  }

  next();
};

module.exports = [multerHander, uploadHandler];
