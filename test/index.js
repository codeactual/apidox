var T = module.exports = {};

T.sinon = require('sinon');
var chai = require('chai');

T.should = chai.should();
chai.Assertion.includeStack = true;

T.fs = require('fs');
T.sinonDoublist = require('sinon-doublist');
T.sinonDoublistFs = require('sinon-doublist-fs');

T.requireComponent = require('../lib/component/require');

T.gitemplateDox = require('..');

beforeEach(function() {
  T.sinonDoublist(T.sinon, this);
  T.sinonDoublistFs(this);
});

afterEach(function() {
  this.restoreFs();
  this.sandbox.restore();
});
