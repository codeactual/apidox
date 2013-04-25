/**
 * First comment summary
 *
 * First comment description
 */

/*jshint node:true*/
'use strict';

/**
 * [Klass](#klass) constructor.
 *
 * constructor summary
 * constructor 2nd line
 *
 * constructor 1st section:
 *
 * - `item`: Summary 1
 * - `item`: Summary 2
 *
 * constructor 2nd section:
 *
 * - `item`: Summary 1
 * - `item`: Summary 2
 */
exports.Klass = Klass;

/**
 * Create a new Klass() instance.
 *
 * @return {Klass}
 */
exports.create = function() { return new Klass(); }

/**
 * Extend `Klass.prototype`.
 *
 * @param {object} ext Methods to mix in.
 * @return {object} Merge result.
 */
exports.extend = function(ext) { return extend(Klass.prototype, ext); };

var util = require('util');

/**
 * Klass summary
 * Klass 2nd line
 *
 * Klass 1st section:
 *
 * - `item`: Summary 1
 * - `item`: Summary 2
 *
 * Klass 2nd section:
 *
 * - `item`: Summary 1
 * - `item`: Summary 2
 */
function Klass() {
}

/**
 * Foo summary, link this: Klass.baz
 * Foo 2nd line
 *
 * Foo 1st section:
 *
 * - `item`: Summary 1
 * - `item`: Summary 2
 *
 * Foo 2nd section:
 *
 * - `item`: Summary 1
 * - `item`: Summary 2
 */
Klass.prototype.foo = function() {
};

/**
 * Bar summary, link this: Klass.baz
 *
 * Link this: Klass.prototype.foo
 * Link this: Klass.baz
 *
 * @param {string} noSummary
 * @param {string} str String summary, link this: Klass.baz
 *   String body 1st line
 *   String body 2nd line
 * @param {string|array} mixed Mixed summary
 *   Mixed body 1st line
 *   Mixed body 2nd line
 *   Link this: Klass.baz
 * @see Google http://www.google.com/
 * @see Klass.prototype.foo
 * @see Klass.baz
 * @return {array} Return summary, link this: Klass.baz
 *   Return body 1st line
 *   Return body 2nd line
 *   Link this: Klass.baz
 */
Klass.prototype.bar = function(noSummary, str, obj) {
};

/**
 * Baz summary
 *
 * Baz description
 *
 * @param {array} arr
 * @return {array} Return summary
 */
Klass.baz = function(arr) {
};

/**
 * Test @api private
 *
 * @api private
 */
function klassNoOp() {};
