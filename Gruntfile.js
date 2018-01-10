'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    eslint: {
      target: [ 'Grunfile.js', 'index.js', 'lib/**/*.js', 'test/**/*.js' ]
    },
    mochaTest: {
      src: 'test/**/*.js'
    }
  });
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.registerTask('lint', 'eslint');
  grunt.registerTask('test', 'mochaTest');
};
