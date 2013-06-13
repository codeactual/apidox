/*jshint node:true*/
var T = require('../..');
var apidox = T.apidox;
var dox = require('dox');
var path = require('path');
var fs = require('fs');
var sprintf = require('util').format;

describe('ApiDox', function() {
  'use strict';

  beforeEach(function() {
    this.dox = apidox.create();
    this.fixtureDir = __dirname + '/../../fixture';
    this.useFixture = function(fromText, noInput) {
      process.chdir(this.fixtureDir);
      if (fromText) {
        this.dox.set('inputText', T.fs.readFileSync('./lib/kitchen-sink.js').toString());
      }
      if (!noInput) {
        this.dox.set('input', 'lib/kitchen-sink.js');
      }
      this.dox.set('output', 'docs/kitchen-sink.md');
    }.bind(this);
  });

  describe('#parse', function() {
    it('should return this-instance', function() { // issue #1
      this.stub(dox, 'parseComments').returns([]);
      this.stub(fs, 'readFileSync').returns('');
      this.dox.parse().should.deep.equal(this.dox);
    });
  });

  describe('#prependSourceHeader', function() {
    beforeEach(function() {
      this.stub(this.dox, 'linkMethodNames').returns('');
    });

    it('should omit lines if title is boolean false', function() {
      this.dox.set('inputTitle', false);
      this.dox.prependSourceLink();
      this.dox.lines.should.deep.equal([]);
    });

    it('should optionally use custom link text', function() {
      var title = 'foo.js';
      this.useFixture();
      this.dox.set('inputTitle', title);
      this.dox.prependSourceLink();
      this.dox.lines.should.deep.equal(['', sprintf('_Source: [%s](../lib/kitchen-sink.js)_', title)]);
    });

    it('should not link if input text supplied', function() {
      var title = 'foo.js';
      this.useFixture(true, true);
      this.dox.set('inputTitle', title);
      this.dox.prependSourceLink();
      this.dox.lines.should.deep.equal(['', sprintf('_Source: %s_', title)]);
    });

    it('should omit lines if input text supplied and no title', function() {
      this.useFixture(true, true);
      this.dox.prependSourceLink();
      this.dox.lines.should.deep.equal(['']);
    });
  });

  describe('integration', function() {
    beforeEach(function() {
      this.useFixture();
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

  describe('integrationText', function() {
    it('should parse fixture', function() {
      var expectedStr = T.fs.readFileSync(this.fixtureDir + '/docs/kitchen-sink.md').toString();
      this.useFixture(true);
      this.spy(fs, 'readFileSync');
      this.dox.parse();
      var actualStr = this.dox.convert();

      // split() for easier-to-read diff from mocha
      actualStr.split('\n').should.deep.equal(expectedStr.split('\n'));

      actualStr.should.equal(expectedStr);

      fs.readFileSync.called.should.equal(false);
    });
  });
});

function fixture(relPath) { return + relPath; }
