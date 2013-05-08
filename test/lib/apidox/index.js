/*jshint node:true*/
var T = require('../..');
var apidox = T.apidox;
var path = require('path');

describe('ApiDox', function() {
  'use strict';

  beforeEach(function() {
    this.dox = apidox.create();
    this.fixtureDir = __dirname + '/../../fixture';
    process.chdir(this.fixtureDir);
    this.dox.set('input', 'lib/kitchen-sink.js');
    this.dox.set('output', 'docs/kitchen-sink.md');
    this.dox.parse();
  });

  it('should parse fixture', function() {
    var expectedStr = T.fs.readFileSync(this.fixtureDir + '/docs/kitchen-sink.md').toString();
    var actualStr = this.dox.convert();

    // split() for easier-to-read diff from mocha
    actualStr.split('\n').should.deep.equal(expectedStr.split('\n'));

    actualStr.should.equal(expectedStr);
  });
});

function fixture(relPath) { return + relPath; }
