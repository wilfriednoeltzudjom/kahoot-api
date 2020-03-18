const jwt = require('jsonwebtoken');

const { PRIVATE_KEY, PUBLIC_KEY } = process.env;

const options = {
  issuer: 'TheTechShrine',
  expiresIn: '30d'
};

const sign = payload => {
  return jwt.sign(payload, PRIVATE_KEY, {
    ...options,
    algorithm: 'RS512'
  });
};

const verify = token => {
  try {
    return jwt.verify(token, PUBLIC_KEY, {
      ...options,
      algorithms: ['RS512']
    });
  } catch (error) {
    return false;
  }
};

const decode = token => jwt.decode(token, { complete: true });

module.exports = {
  sign,
  verify,
  decode
};
