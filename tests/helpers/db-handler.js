const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Initialize environment
dotenv.config({
  path: path.join(__dirname, '../', '../', '/src', '/config', 'default.env')
});
dotenv.config({
  path: path.join(__dirname, '../', '../', '/src', '/config', 'development.env')
});

const { MONGODB_URI } = process.env;

const connect = async () => {
  await mongoose.connect(MONGODB_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

const dropDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

const clearDatabase = async () => {
  const { collections } = mongoose.connection;

  const promises = [];

  Object.keys(collections).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(collections, key)) {
      promises.push(collections[key].deleteMany());
    }
  });

  await Promise.all(promises);
};

module.exports = {
  connect,
  dropDatabase,
  clearDatabase
};
