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
    var expected = T.fs.readFileSync(fixture('kitchen-sink.md')).toString();
    this.dox.build().should.equal(expected);
  });
});

function fixture(relPath) { return __dirname + '/../../fixture/' + relPath; }
