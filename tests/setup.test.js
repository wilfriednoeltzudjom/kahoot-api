const { connect, dropDatabase } = require('./helpers/db-handler');

before(async () => connect());
after(async () => dropDatabase());
