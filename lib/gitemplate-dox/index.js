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
var path = require('path');
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
    file: '',
    rootdir: ''
  };

  this.comments = [];
  this.params = {};
  this.sees = [];
  this.returns = {};
  this.toc = [];

  this.fileComment = {};
}

configurable(GitemplateDox.prototype);

/**
 * Use dox to parse a source file.
 *
 * @param {string} file
 */
GitemplateDox.prototype.parse= function() {
  var text = fs.readFileSync(this.get('file')).toString();
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
GitemplateDox.prototype.parseComment = function(comment, idx) {
  if (!idx) { this.fileComment = comment; return; }
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
  this.comments.forEach(this.prepParams.bind(this));
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
  this.prepReturns(comment);
  this.prepTOC(comment);
  this.prepSees(comment);

  this.buildHeading(md, comment);
  this.buildSummary(md, comment);
  this.buildJsBlocks(md, comment);
  this.buildParams(md, comment);
  this.buildReturns(md, comment);
  this.buildSees(md, comment);
};

GitemplateDox.prototype.method = function(comment) {
  return comment.ctx ? comment.ctx.string.replace('()', '') : this.exportName(comment);
};

/**
 * @api private
 */
GitemplateDox.prototype.prependTOC = function(md) {
  var source = path.relative(this.get('rootdir'), this.get('file'));

  md.pushTOC('# Contents');
  md.pushTOC('');
  this.buildIntro(md, this.fileComment);
  md.pushTOC('');
  md.pushTOC(sprintf('Source: [%s](%s)', source, source));
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


GitemplateDox.prototype.slugMethod = function(method) {
  return this.slug(method + this.signature(method));
};

/**
 * @api private
 */
GitemplateDox.prototype.prepTOC = function(comment) {
  var method = this.method(comment);
  this.toc.push({
    title: method,
    url: '#' + this.slugMethod(method)
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
GitemplateDox.prototype.prepSees = function(comment) {
  if (!comment.tags) { return; }

  var self = this;
  var method = this.method(comment);

  this.sees[method] = [];
  comment.tags.forEach(function(tag) {
    if ('see' === tag.type) {
      if (tag.url) {
        self.sees[method].push(sprintf('[%s](%s)', tag.title, tag.url));
      } else if (tag.local) {
        self.sees[method].push(tag.local);
      }
    }
  });
};

/**
 * @api private
 */
GitemplateDox.prototype.buildIntro = function(md, comment) {
  md.pushTOC(this.linkSymbols(comment.description.full, comment));
};

/**
 * @api private
 */
GitemplateDox.prototype.signature = function(method) {
  return '(' + Object.keys(this.params[method]).join(', ') + ')';
};

/**
 * @api private
 */
GitemplateDox.prototype.buildHeading = function(md, comment) {
  var method = this.method(comment);
  var heading = method + this.signature(method);
  md.h(1, this.linkSymbols(heading, comment));
};

/**
 * @api private
 */
GitemplateDox.prototype.buildSummary = function(md, comment) {
  md.p(this.linkSymbols(comment.description.summary, comment));
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
        param.description ? ': ' + self.linkSymbols(param.description, comment) : ''
    );
    md.h(3, heading);

    if (param.overflow.length) {
      md.newline();
      param.overflow.forEach(function(line) {
          md.push(self.linkSymbols(line, comment));
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
    returns.description ? ': ' + this.linkSymbols(returns.description, comment) : ''
  );
  md.h(3, heading);

  if (returns.overflow.length) {
    md.newline();
    returns.overflow.forEach(function(line) {
      md.push(self.linkSymbols(line, comment));
    });
  }
};

/**
 * @api private
 */
GitemplateDox.prototype.buildSees = function(md, comment) {
  var self = this;
  var method = this.method(comment);
  var sees = this.sees[method];

  if (!sees.length) { return; }

  md.h(2, 'See');

  md.newline();
  sees.forEach(function(description) {
    md.push('- ' + self.linkSymbols(description, comment));
  });
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
  md.p(this.linkSymbols(buf, comment));
};

/**
 * @api private
 */
GitemplateDox.prototype.linkSymbols = function(text, comment) {
  var self = this;
  var methods = Object.keys(this.params);
  methods.sort(function(a, b) { // Replace longest symbols first
    return a.length > b.length ? -1 : (a.length === b.length ? 0 : 1);
  });

  var curMethod = this.method(comment);

  methods.forEach(function(method) {
    if (method === curMethod) { return; }
    var regex = new RegExp(

      // Not following '`' char(s), which possibly open a multi-line code block
      '(?!`+\\w?\\n?)' +

      '(^|\\s)(' + // Preceeded by nothing/whitespace

      method.replace(/\./, '\\.') +

      ')(\\s|$)' + // Followed by nothing/whitespace

      // Not followed by '`' char(s), which possibly close a multi-line code
      '(?!\\n?`+\\n?)',

      'gm'
    );
    text = text.replace(regex, sprintf('$1[%s](#%s)$3', method, self.slugMethod(method)));
  });
  return text;
};
