const multer = require('multer');
const DataUri = require('datauri');
const path = require('path');

const { cloudinary } = require('../helpers/cloudinary');

const storage = multer.memoryStorage();
const multerHander = multer({ storage }).single('image');

const dataUri = file =>
  new DataUri().format(path.extname(file.originalname).toString(), file.buffer);

const uploadHandler = async (req, res, next) => {
  if (req.file) {
    const { folder } = req.body;
    const file = dataUri(req.file).content;
    const data = await cloudinary.uploader.upload(file, {
      folder: `kahoot/${folder}`
    });

    req.downloadUrl = data.url;
    req.downloadId = data.public_id;
  }

  next();
};

module.exports = [multerHander, uploadHandler];
