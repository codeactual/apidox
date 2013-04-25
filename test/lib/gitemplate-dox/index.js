/*jshint node:true*/
var T = require('../..');
var gitemplateDox = T.gitemplateDox;

describe('GitemplateDox', function() {
  'use strict';

  beforeEach(function() {
    this.dox = gitemplateDox.create();
  });

  it('should parse fixture', function() {
    this.dox.parseFile(fixture('kitchen-sink.js'));

    var expectedStr = T.fs.readFileSync(fixture('kitchen-sink.md')).toString();
    var actualStr = this.dox.build();

    // split() for easier-to-read diff from mocha
    actualStr.split('\n').should.deep.equal(expectedStr.split('\n'));

    actualStr.should.equal(expectedStr);
  });
});

function fixture(relPath) { return __dirname + '/../../fixture/' + relPath; }
