var T = module.exports = require('./index');
T.cli = {
  apidox: require('../lib/cli/apidox'),
  impulseBin: require('impulse-bin'),
  provider: require('commander')
};
