const mongoose = require('mongoose');

const { MONGODB_URI } = process.env;

const connect = async () => {
  await mongoose.connect(MONGODB_URI, {
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
      promises.push(collections[key].drop());
    }
  });

  return Promise.all(promises);
};

module.exports = {
  connect,
  dropDatabase,
  clearDatabase
};
