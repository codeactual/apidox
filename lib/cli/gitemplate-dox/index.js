module.exports = function() {
  'use strict';

  if (!this.options.server) {
    this.provider.outputHelp();
    process.exit(1);
  }

  var requireComponent = require('../../component').require;
};
