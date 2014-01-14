
module.exports = function(commander) {
  'use strict';

  var dox = require('../../apidox').create();

  if (commander.input && commander.output) {

		dox.set('input', commander.input);
		dox.set('output', commander.output);
		dox.parse();

		require('fs').writeFileSync(commander.output, dox.convert());

  } else if (commander.root && commander.target) {

  	commander.dox = dox
	 	require("./recursive")(commander)

  } else {

		commander.outputHelp();
		console.error('Required: --input and --output');
		process.exit(1);


  }



};
