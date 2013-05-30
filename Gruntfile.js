module.exports = function(grunt) {
  'use strict';

  require('grunt-horde')
    .create(grunt)
    .demand('projName', 'apidox')
    .demand('instanceName', 'apidox')
    .demand('klassName', 'ApiDox')
    .loot('node-component-grunt')
    .attack();
};
