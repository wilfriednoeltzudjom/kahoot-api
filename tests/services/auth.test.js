const { expect } = require('chai');

const { signUp } = require('../../src/services/auth');

const { UserFactory } = require('../../src/models/user');

describe('Auth', () => {
  describe('Sign up', () => {
    it('should not create a user without a username', async () => {
      await expect(
        signUp(UserFactory.generate({ skipUsername: true }))
      ).to.be.eventually.rejectedWith(Error, /(?:username)/i);
    });

    it('should not create a user without a lastname', async () => {
      await expect(
        signUp(UserFactory.generate({ skipLastName: true }))
      ).to.be.eventually.rejectedWith(Error, /(?:lastname)/i);
    });

    it('should not create a user without a firstname', async () => {
      await expect(
        signUp(UserFactory.generate({ skipFirstName: true }))
      ).to.be.eventually.rejectedWith(Error, /(?:firstname)/i);
    });

    it('should not create a user without a password', async () => {
      await expect(
        signUp(UserFactory.generate({ skipPassword: true }))
      ).to.be.eventually.rejectedWith(Error, /(?:password)/i);
    });

    it('should not create a user if username length is below 5', async () => {
      await expect(
        signUp(UserFactory.generate({ usernameLength: 4 }))
      ).to.be.eventually.rejectedWith(Error);
    });

    it('should not create a user if username already exists', async () => {
      const user = await UserFactory.create({});
      await expect(
        signUp({
          ...UserFactory.generate({}),
          username: user.username
        })
      ).to.be.eventually.rejectedWith(Error, /(?:already exists)/);
    });

    it('should create a user if every parameter is correctly set and username does not exists', async () => {
      await expect(signUp(UserFactory.generate({}))).to.be.fulfilled;
    });
  });
});
