module.exports = function() {
  'use strict';

  if (!this.options.file) {
    this.provider.outputHelp();
    process.exit(1);
  }

  var dox = require('../../gitemplate-dox').create();
  dox.set('rootdir', this.options.rootdir);
  dox.set('file', this.options.file);
  dox.parse();
  this.util.print(dox.build());
};
