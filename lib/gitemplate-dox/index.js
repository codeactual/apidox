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

var dox = require('dox');
var fs = require('fs');
var markdown = require('./markdown');

var requireComponent = require('../component/require');
var extend = requireComponent('extend');
var configurable = requireComponent('configurable.js');

/**
 * Usage:
 *
 * Configuration:
 *
 * Properties:
 *
 * - `{array} [comments=[]]` Comment objects from dox
 *
 */
function GitemplateDox() {
  this.settings = {
  };

  this.comments = [];
}

configurable(GitemplateDox.prototype);

/**
 * Use dox to parse a source file.
 *
 * @param {string} file
 */
GitemplateDox.prototype.parseFile = function(file) {
  var text = fs.readFileSync(file).toString();
  dox.parseComments(text, {raw: true}).forEach(this.parseComment.bind(this));
};

/**
 * Parse a single comment.
 *
 * @param {object} comment Attributes extracted by `dox`.
 */
GitemplateDox.prototype.parseComment = function(comment) {
  if (!comment.ctx) { return; } // Ex. jshint
  if (comment.isPrivate) { return; } // @api private
  if (/^var/.test(comment.code)) { return; } // Module-private var
  this.comments.push(comment);
};

/**
 * Convert comments to markdown.
 *
 * @return {string}
 */
GitemplateDox.prototype.build = function() {
  var md = markdown.create();
  this.comments.forEach(this.convertOne.bind(this, md));
  return md.build();
};

GitemplateDox.prototype.convertOne = function(md, comment) {
  md.h(1, comment.ctx.string);
  md.p(comment.description.summary);
  if (comment.description.body) {
    // From https://github.com/visionmedia/dox/blob/master/lib/api.js
    var buf = comment.description.body;
    var code = buf.match(/^( {4}[^\n]+\n*)+/gm) || [];
    code.forEach(function(block){
      var code = block.replace(/^ {4}/gm, '');
      buf = buf.replace(block, '```js\n' + code.trimRight() + '\n```\n\n');
    });
    md.p(buf);
  }
};
