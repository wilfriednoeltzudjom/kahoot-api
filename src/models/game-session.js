const mongoose = require('mongoose');
const uuid = require('uuid');

const { gameSessionStatuses } = require('../utils/enums');

const { Schema } = mongoose;

const gameSessionSchema = new Schema({
  uuid: {
    type: String,
    default: () => uuid.v1()
  },
  status: { type: String, default: gameSessionStatuses.PENDING },
  players: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Player'
    }
  ],
  game: {
    type: Schema.Types.ObjectId,
    ref: 'Game'
  }
});

const GameSession =
  mongoose.models.GameSession ||
  mongoose.model('GameSession', gameSessionSchema);

module.exports = { GameSession };
