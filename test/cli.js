var T = module.exports = require('./index');
T.cli = {
  gitemplateDox: require('../lib/cli/gitemplate-dox'),
  impulseBin: require('impulse-bin'),
  provider: require('commander')
};
