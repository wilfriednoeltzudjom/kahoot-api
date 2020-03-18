const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const chaiHttp = require('chai-http');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.use(chaiHttp);
