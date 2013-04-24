module.exports = function() {
  'use strict';

  if (!this.options.file) {
    this.provider.outputHelp();
    process.exit(1);
  }

  var dox = require('../../gitemplate-dox').create();
  dox.parseFile(this.options.file);
  this.util.print(dox.build());
};
