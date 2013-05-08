/*jshint node:true*/
var T = require('../../../cli');
var apidox = T.apidox;

describe('apidox cli', function() {
  'use strict';

  beforeEach(function() {
    this.handler = T.cli.apidox;

    this.markdown = 'fakeMarkdown';
    this.doxStub = this.stubMany({}, ['set', 'parse', 'convert']);
    this.doxStub.convert.returns(this.markdown);
    this.stub(apidox, 'create').returns(this.doxStub);
    this.writeStub = this.stub(require('fs'), 'writeFileSync');

    process.argv = ['node', '/to/script', '--input', 'foo', '--output', 'bar'];

    this.commander = {input: 'foo', output: 'bar'};
    this.outputHelperStub = this.stubMany(this.commander, 'outputHelp').outputHelp;
    this.exitStub = this.stub(process, 'exit');
  });

  it('should abort on missing input option', function() {
    this.commander.input = '';
    this.handler(this.commander);
    this.exitStub.should.have.been.calledWithExactly(1);
  });

  it('should abort on missing output option', function() {
    this.commander.output = '';
    this.handler(this.commander);
    this.exitStub.should.have.been.calledWithExactly(1);
  });

  it('should store options', function() {
    this.handler(this.commander);
    this.doxStub.set.should.have.been.calledWithExactly('input', 'foo');
    this.doxStub.set.should.have.been.calledWithExactly('output', 'bar');
  });

  it('should parse the source', function() {
    this.handler(this.commander);
    this.doxStub.parse.should.have.been.called;
  });

  it('should write the result', function() {
    this.handler(this.commander);
    this.doxStub.parse.should.have.been.called;
    this.writeStub.should.have.been.calledWithExactly('bar', this.markdown);
  });
});

