exports.init = function(provider) {
  provider
    .option('-i, --input <file>', 'Source file to read', String)
    .option('-o, --output <file>', 'Markdown file to write', String);
};

exports.run = function() {
  'use strict';

  this.exitOnMissingOption(['input', 'output']);

  var dox = require('../../gitemplate-dox').create();
  dox.set('input', this.options.input);
  dox.set('output', this.options.output);
  dox.parse();
  this.fs.writeFileSync(this.options.output, dox.convert());
};
