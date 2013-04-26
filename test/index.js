var T = module.exports = {};

T.sinon = require('sinon');
var chai = require('chai');

T.should = chai.should();
chai.Assertion.includeStack = true;
chai.use(require('sinon-chai'));

T.fs = require('fs');
T.sinonDoublist = require('sinon-doublist');

T.requireComponent = require('../lib/component/require');

T.gitemplateDox = require('..');

beforeEach(function() {
  T.sinonDoublist(T.sinon, this);
});

afterEach(function() {
  this.sandbox.restore();
});
