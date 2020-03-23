const {
  connect,
  clearDatabase,
  dropDatabase
} = require('./helpers/db-handler');

before(async () => {
  await connect();
});
afterEach(async () => {
  await clearDatabase();
});
after(async () => {
  await dropDatabase();
});
