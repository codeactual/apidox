module.exports = function(commander) {
  'use strict';

  if (!commander.input || !commander.output) {
    commander.outputHelp();
    console.error('Required: --input and --output');
    process.exit(1);
  }

  var dox = require('../../apidox').create();
  dox.set('input', commander.input);
  dox.set('output', commander.output);
  dox.parse();
  require('fs').writeFileSync(commander.output, dox.convert());
};
