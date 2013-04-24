/**
 * Generate node module API markdown with dox
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

/**
 * GitemplateDox constructor.
 */
exports.GitemplateDox = GitemplateDox;

/**
 * Create a new GitemplateDox.
 *
 * @return {object}
 */
exports.create = function() { return new GitemplateDox(); };

/**
 * Extend GitemplateDox.prototype.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extend = function(ext) { return extend(GitemplateDox.prototype, ext); };

var shelljs = require('outer-shelljs').create();
var util = require('util');
var sprintf = util.format;

var requireComponent = require('../component/require');
var extend = requireComponent('extend');
var configurable = requireComponent('configurable.js');

/**
 * Usage:
 *
 * Configuration:
 *
 * - `{TYPE} [name=DEFAULT]` Description ..
 *
 * Properties:
 *
 * - `{TYPE} [name=DEFAULT]` Description ..
 *
 */
function GitemplateDox() {
  this.settings = {
  };
}

configurable(GitemplateDox.prototype);
