/**
 * First comment summary
 *
 * First comment description
 */

/*jshint node:true*/
'use strict';

/**
 * Klass constructor.
 */
exports.Klass = Klass;

/**
 * Return a new Klass() instance.
 *
 * @return {Klass}
 */
exports.create = function() { return new Klass(); }

/**
 * Extend `Klass.prototype`
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
 * Foo summary
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
 *
 * @see http://www.google.com
 * @see bar()
 * @see Klass#bar()
 * @see Klass.bar()
 */
Klass.prototype.foo = function() {
};

/**
 * Bat summary
 *
 * Link this: `foo()`
 * Link this: `Klass#foo()`
 * Link this: `Klass.foo()`
 *
 * @param {string} str String summary
 *   String body 1st line
 *   String body 2nd line
 * @param {string|array} mixed Mixed summary
 *   Mixed body 1st line
 *   Mixed body 2nd line
 * @return {array} Return summary
 *   Return body 1st line
 *   Return body 2nd line
 */
Klass.prototype.bar = function(str, obj) {
};

/**
 * Test @api private
 *
 * @api private
 */
function klassNoOp() {};
