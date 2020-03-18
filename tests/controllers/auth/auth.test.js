const chai = require('chai');

const app = require('../../../src/server');

const { UserFactory } = require('../../../src/models/user');

const { expect } = chai;

const user = UserFactory.generate();

describe('Auth', () => {
  it('should create a new user if every parameters is correct', async () => {
    const response = await chai
      .request(app)
      .post('/api/v1/auth/signup')
      .set('Content-type', 'application/json')
      .send(user);

    expect(response).to.have.status(200);
    expect(response.body)
      .to.be.an('object')
      .with.property('message')
      .that.match(/(?:successfully registered)/);
  });

  it('should not create a user with same username', async () => {
    const response = await chai
      .request(app)
      .post('/api/v1/auth/signup')
      .set('Content-type', 'application/json')
      .send(user);

    expect(response).to.have.status(400);
    expect(response.body)
      .to.be.an('object')
      .with.property('message')
      .that.match(/(?:already assigned)/i);
  });

  it('should not create a user with username length inferior to 5', async () => {
    const response = await chai
      .request(app)
      .post('/api/v1/auth/signup')
      .set('Content-type', 'application/json')
      .send(UserFactory.generateWithInvalidUsername());

    expect(response).to.have.status(400);
    expect(response.body)
      .to.be.an('object')
      .with.property('message')
      .that.match(/(?:should be composed of letters)/i);
  });

  it('should authenticate user with correct username and password', async () => {
    const response = await chai
      .request(app)
      .post('/api/v1/auth/signin')
      .set('Content-type', 'application/json')
      .send({ username: user.username, password: user.password });
    console.log(response.body);
  });
});
