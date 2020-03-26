const mongoose = require('mongoose');

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

module.exports = { clearDatabase };
