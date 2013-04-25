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
 * Properties:
 *
 * - `{array} [comments=[]]` Comment objects from dox
 *
 */
function GitemplateDox() {
  this.settings = {
  };

  this.comments = [];
  this.params = {};
  this.returns = {};
  this.toc = [];
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

GitemplateDox.prototype.exportName = function(comment) {
  if (!comment.code) { return null; }
  var matches = comment.code.match(/^(module\.)?exports\.([^ ]+) =/);
  return matches ? matches[2] : null;
};

/**
 * Parse a single comment.
 *
 * @param {object} comment Attributes extracted by `dox`.
 */
GitemplateDox.prototype.parseComment = function(comment) {
  if (!comment.ctx && !this.exportName(comment)) { return; } // Ex. jshint
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
  this.prependTOC(md);
  return md.build();
};

/**
 * Convert one parsed comment to markdown line(s).
 *
 * @param {Markdown} Line collection
 * @param {object} comment
 * @api private
 */
GitemplateDox.prototype.convertOne = function(md, comment) {
  this.prepParams(comment);
  this.prepReturns(comment);
  this.prepTOC(comment);

  this.buildHeading(md, comment);
  this.buildSummary(md, comment);
  this.buildJsBlocks(md, comment);
  this.buildParams(md, comment);
  this.buildReturns(md, comment);
};

GitemplateDox.prototype.method = function(comment) {
  return comment.ctx ? comment.ctx.string.replace('()', '') : this.exportName(comment);
};

/**
 * @api private
 */
GitemplateDox.prototype.prependTOC = function(md) {
  md.pushTOC('# Contents');
  md.pushTOC('');
  this.toc.forEach(function(entry) {
    md.pushTOC(sprintf('- [%s](%s)', entry.title, entry.url));
  });
};

/**
 * @api private
 */
GitemplateDox.prototype.slug = function(raw) {
  return raw.replace(/[^a-zA-Z0-9- ]+/g, '').replace(/\s+/g, '-').toLowerCase();
};

/**
 * @api private
 */
GitemplateDox.prototype.prepTOC = function(comment) {
  var method = this.method(comment);
  this.toc.push({
    title: method,
    url: '#' + this.slug(method)
  });
};

/**
 * @api private
 */
GitemplateDox.prototype.prepParams = function(comment) {
  if (!comment.tags) { return; }

  var self = this;
  var method = this.method(comment);
  var lastParam;

  this.params[method] = {};

  comment.tags.forEach(function(tag) {
    if ('param' === tag.type) {
      self.params[method][tag.name] = {
        types: tag.types,
        description: tag.description,
        overflow: []
      };
      lastParam = tag.name;
    } else if ('' === tag.type && lastParam) {
      self.params[method][lastParam].overflow.push(tag.string);
    } else { // Ex. @return
      lastParam = null;
    }
  });
};

/**
 * @api private
 */
GitemplateDox.prototype.prepReturns = function(comment) {
  if (!comment.tags) { return; }

  var self = this;
  var method = this.method(comment);
  var collectOverflow = false;

  comment.tags.forEach(function(tag) {
    if ('return' === tag.type) {
      self.returns[method] = {
        types: tag.types,
        description: tag.description,
        overflow: []
      };
      collectOverflow = true;
    } else if ('' === tag.type && collectOverflow) {
      self.returns[method].overflow.push(tag.string);
    } else { // Ex. @see
      collectOverflow = false;
    }
  });
};

/**
 * @api private
 */
GitemplateDox.prototype.buildHeading = function(md, comment) {
  var method = this.method(comment);
  var heading = sprintf('%s(%s)', method, Object.keys(this.params[method]).join(', '));
  md.h(1, heading);
};

/**
 * @api private
 */
GitemplateDox.prototype.buildSummary = function(md, comment) {
  md.p(comment.description.summary);
};

/**
 * @api private
 */
GitemplateDox.prototype.buildParams = function(md, comment) {
  var self = this;
  var method = this.method(comment);
  var names = Object.keys(this.params[method]);

  if (!names.length) { return; }

  md.h(2, 'Parameters');
  names.forEach(function(name) {
    var param = self.params[method][name];
    var heading = sprintf(
        '`{%s} %s`%s',
        param.types.join(' | '),
        name,
        param.description ? ': ' + param.description : ''
    );
    md.h(3, heading);

    if (param.overflow.length) {
      md.newline();
      param.overflow.forEach(function(line) {
          md.push(line);
      });
    }
  });
};

/**
 * @api private
 */
GitemplateDox.prototype.buildReturns = function(md, comment) {
  var self = this;
  var method = this.method(comment);
  var returns = this.returns[method];

  if (!returns) { return; }

  md.h(2, 'Return');

  var heading = sprintf(
    '`{%s}`%s',
    returns.types.join(' | '),
    returns.description ? ': ' + returns.description : ''
  );
  md.h(3, heading);

  if (returns.overflow.length) {
    md.newline();
    returns.overflow.forEach(function(line) {
      md.push(line);
    });
  }
};

/**
 * @api private
 */
GitemplateDox.prototype.buildJsBlocks = function(md, comment) {
  if (!comment.description.body) { return; }

  // From https://github.com/visionmedia/dox/blob/master/lib/api.js
  var buf = comment.description.body;
  var code = buf.match(/^( {4}[^\n]+\n*)+/gm) || [];
  code.forEach(function(block){
    var code = block.replace(/^ {4}/gm, '');
    buf = buf.replace(block, '```js\n' + code.trimRight() + '\n```\n\n');
  });
  md.p(buf);
};
