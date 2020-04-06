const { expect } = require('chai');
const io = require('socket.io-client');

let socket;

before(done => {
  socket = io.connect('http://localhost:4000/hosts', {
    forceNew: true
  });
  if (socket) {
    socket.on('connect', () => {
      done();
    });
  } else done(new Error('Unable to connect to socket'));
});

after(done => {
  if (socket.connected) socket.disconnect();
  done();
});

describe('Host', () => {
  it('should successfully disconnect', () => {});
});
