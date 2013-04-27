/*jshint node:true*/
var T = require('../..');
var gitemplateDox = T.gitemplateDox;
var path = require('path');

describe('GitemplateDox', function() {
  'use strict';

  beforeEach(function() {
    this.dox = gitemplateDox.create();
    this.dox.set('output', path.normalize(__dirname + '/../../..'));
  });

  it('should parse fixture', function() {
    this.dox.set('input', fixture('kitchen-sink.js'));
    this.dox.parse(fixture('kitchen-sink.js'));

    var expectedStr = T.fs.readFileSync(fixture('kitchen-sink.md')).toString();
    var actualStr = this.dox.convert();

    // split() for easier-to-read diff from mocha
    actualStr.split('\n').should.deep.equal(expectedStr.split('\n'));

    actualStr.should.equal(expectedStr);
  });
});

function fixture(relPath) { return __dirname + '/../../fixture/' + relPath; }
