/*jshint node:true*/
var T = require('../../../cli');
var gitemplateDox = T.gitemplateDox;

describe('gitemplateDox cli', function() {
  'use strict';

  beforeEach(function() {
    this.bin = T.cli.impulseBin.create();
    this.handler = T.cli.gitemplateDox;

    this.markdown = 'fakeMarkdown';
    this.doxStub = this.stubMany({}, ['set', 'parse', 'build']);
    this.doxStub.build.returns(this.markdown);
    this.stub(gitemplateDox, 'create').returns(this.doxStub);
    this.printStub = this.stub(require('util'), 'print');

    process.argv = ['node', '/path/to/script', '--rootdir', 'foo', '--file', 'bar'];
  });

  it('should abort on missing --file', function() {
    process.argv = [];
    var stub = this.stub(this.bin, 'exitOnMissingOption');
    this.bin.run(T.cli.provider, this.handler);
    stub.should.have.been.calledWithExactly('file');
  });

  it('should store options', function() {
    this.bin.run(T.cli.provider, this.handler);
    this.doxStub.set.should.have.been.calledWithExactly('rootdir', 'foo');
    this.doxStub.set.should.have.been.calledWithExactly('file', 'bar');
  });

  it('should parse the file', function() {
    this.bin.run(T.cli.provider, this.handler);
    this.doxStub.parse.should.have.been.called;
  });

  it('should print the result', function() {
    this.bin.run(T.cli.provider, this.handler);
    this.printStub.should.have.been.calledWithExactly(this.markdown);
  });
});

