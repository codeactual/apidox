module.exports = function(grunt) {
  'use strict';

  require('grunt-horde')
    .create(grunt)
    .demand('initConfig.projName', 'apidox')
    .demand('initConfig.instanceName', 'apidox')
    .demand('initConfig.klassName', 'ApiDox')
    .loot('node-component-grunt')
    .attack();
};
