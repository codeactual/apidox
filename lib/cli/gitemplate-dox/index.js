exports.init = function(provider) {
  provider
    .option('-r, --rootdir <dir>', 'Project/repo root directory', String)
    .option('-f, --file <name>', 'Source file', String);
};

exports.run = function() {
  'use strict';

  this.exitOnMissingOption('file');

  var dox = require('../../gitemplate-dox').create();
  dox.set('rootdir', this.options.rootdir);
  dox.set('file', this.options.file);
  dox.parse();
  this.util.print(dox.build());
};
