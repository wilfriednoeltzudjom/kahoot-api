const { GameSession } = require('../models/game-session');
const { Game } = require('../models/game');
const { Player } = require('../models/player');

const { ResourceNotFoundError, BadRequestError } = require('../utils/errors');

const { gameSessionStatuses } = require('../utils/enums');

const checkGamePin = async ({ gamePin }) => {
  const game = await Game.findOne({ pin: gamePin });
  if (!game)
    throw new ResourceNotFoundError(`Game not found for pin ${gamePin}`);
  const foundGameSession = await GameSession.findOne({
    game: game._id,
    status: gameSessionStatuses.PENDING
  });
  if (!foundGameSession)
    throw new BadRequestError(`Game ${gamePin} is currenly off`);
  return foundGameSession;
};

const checkUsername = async ({ gameSessionUUID, username }) => {
  const gameSession = await GameSession.findOne({ uuid: gameSessionUUID });
  if (!gameSession) throw new ResourceNotFoundError(`Game session not found`);

  const foundPlayer = await Player.findOne({
    username,
    gameSession: gameSession._id
  });
  if (foundPlayer)
    throw new BadRequestError(`Username ${username} already taken`);

  console.log('Dont reach here');
  return Game.findById(gameSession.game);
};

module.exports = {
  checkGamePin,
  checkUsername
};
