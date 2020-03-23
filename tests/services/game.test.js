const { expect } = require('chai');

const gameService = require('../../src/services/game');

const { GameFactory } = require('../../src/models/game');
const { UserFactory } = require('../../src/models/user');

describe('Game', () => {
  describe('Create', () => {
    it('should not create a game without a title', async () => {
      const user = await UserFactory.create({});
      await expect(
        gameService.createGame(user, GameFactory.generate({ skipTitle: true }))
      ).to.be.rejectedWith(Error, /(?:title)/);
    });

    it('should create a game with a title', async () => {
      const user = await UserFactory.create({});
      const game = await expect(
        gameService.createGame(user, GameFactory.generate({}))
      ).to.be.fulfilled;
      expect(game)
        .to.be.an('object')
        .with.property('pin');
    });
  });
});
