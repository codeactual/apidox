/**
 * Generate node module API markdown with dox
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

/**
 * Reference to GitemplateDox.
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
var path = require('path');
var util = require('util');
var sprintf = util.format;

var requireComponent = require('../component/require');
var extend = requireComponent('extend');
var configurable = requireComponent('configurable.js');

var doxTagTypes = ['param', 'return', 'see', 'api', 'type', 'memberOf', 'audit', 'borrows'];

var escape = require('../../node_modules/dox/lib/utils').escape;

/**
 * GitemplateDox constructor.
 *
 * Usage:
 *
 *     var dox = require('gitemplate-dox').create();
 *     var markdown = dox
 *       .set('input', '/path/to/source.js')
 *       .set('output', '/path/to/output.md')
 *       .parse()
 *       .convert();
 *
 * Configuration:
 *
 * - `{string} input` Source file to read
 * - `{string} output` Markdown file to write
 *
 * Properties:
 *
 * - `{array} comments` Filtered dox-provided objects to convert
 * - `{object} fileComment` First dox-provided comment found in the file
 * - `{array} lines` Markdown lines
 * - `{object} params` Collected `@param` meta indexed by method name
 *   - `{array} types` Type names
 *   - `{string} description` First line
 *   - `{array} overflow` Additional lines
 * - `{object} returns` Collected `@return` metadata indexed by method name
 *   - `{array} types` Type names
 *   - `{string} description` First line
 *   - `{array} overflow` Additional lines
 * - `{array} sees` Collected `@see` lines
 * - `{array} toc` Collected table-of-contents metadata objects
 *   - `{string} title` Link title
 *   - `{string} url` Link URL
 *
 */
function GitemplateDox() {
  this.settings = {input: '', output: ''};
  this.comments = [];
  this.fileComment = {};
  this.lines = [];
  this.params = {};
  this.returns = {};
  this.sees = [];
  this.toc = [];
}

configurable(GitemplateDox.prototype);

// ===================== PUBLIC =====================

/**
 * Parse the source file.
 *
 * @param {string} file
 */
GitemplateDox.prototype.parse = function() {
  var text = fs.readFileSync(this.get('input')).toString();
  dox.parseComments(text, {raw: true}).forEach(this.parseComment.bind(this));
};

/**
 * Convert comments to markdown.
 *
 * @return {string}
 */
GitemplateDox.prototype.convert = function() {
  this.comments.forEach(this.collectParams.bind(this));
  this.comments.forEach(this.convertOne.bind(this));
  this.prependTOC();
  this.appendGenerator();
  return this.lines.join('\n').trim() + '\n';
};

// ===================== PRIVATE: PARSING =====================

/**
 * Convert one parsed comment to markdown line(s).
 *
 * @param {Markdown} Line collection
 * @param {object} comment
 * @api private
 */
GitemplateDox.prototype.convertOne = function(comment) {
  this.collectReturns(comment);
  this.collectTOC(comment);
  this.collectSees(comment);

  this.convertMethodName(comment);
  this.convertSummary(comment);
  this.convertMethodDesc(comment);
  this.convertParams(comment);
  this.convertReturns(comment);
  this.convertSees(comment);
};

/**
 * Filter comment objects for conversion to text.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @param {number} idx Iteration
 * @see GitemplateDox.prototype.parse
 * @api private
 */
GitemplateDox.prototype.parseComment = function(comment, idx) {
  if (!idx) { this.fileComment = comment; return; }
  if (!comment.ctx && !this.exportedProp(comment)) { return; } // Ex. jshint
  if (comment.isPrivate) { return; } // @api private
  if (/^var/.test(comment.code)) { return; } // Module-private var
  this.comments.push(comment);
};

// ===================== PRIVATE: METADATA =====================

/**
 * Collect `@param` meta.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
GitemplateDox.prototype.collectParams = function(comment) {
  if (!comment.tags) { return; }

  var self = this;
  var method = this.method(comment);
  var prevParam;

  this.params[method] = {};

  comment.tags.forEach(function(tag) {
    if ('param' === tag.type) {
      self.params[method][tag.name] = {
        types: tag.types,
        description: tag.description,
        overflow: []
      };
      prevParam = tag.name;
    } else if (-1 === doxTagTypes.indexOf(tag.type) && prevParam) {
      if ('-' === tag.type || '*' === tag.type) {
        tag.string = sprintf('  %s %s', tag.type, tag.string);
      }
      self.params[method][prevParam].overflow.push(tag.string);
    } else { // Ex. @return
      prevParam = null;
    }
  });
};

/**
 * Collect `@return` meta.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
GitemplateDox.prototype.collectReturns = function(comment) {
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
    } else if (-1 === doxTagTypes.indexOf(tag.type) && collectOverflow) {
      if ('-' === tag.type || '*' === tag.type) {
        tag.string = sprintf('%s %s', tag.type, tag.string);
      }
      self.returns[method].overflow.push(tag.string);
    } else { // Ex. @see
      collectOverflow = false;
    }
  });
};

/**
 * Collect table-of-contents meta.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
GitemplateDox.prototype.collectTOC = function(comment) {
  var method = this.method(comment);
  this.toc.push({
    title: method,
    url: '#' + this.slugMethod(method)
  });
};

/**
 * Collect `@see` meta.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
GitemplateDox.prototype.collectSees = function(comment) {
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

// ===================== PRIVATE: CONVERSION =====================

/**
 * Prepend table-of-contents markdown lines.
 *
 * @api private
 */
GitemplateDox.prototype.prependTOC = function() {
  var input = this.get('input');
  var output = this.get('output');

  // From markdown dir to source file.
  // Assumes both are relative to the project root.
  var source = path.relative(path.dirname(output), path.dirname(input));

  var lines = [];
  lines.push(this.linkMethodNames(this.fileComment.description.summary, this.fileComment));
  lines.push('');
  lines.push(sprintf('_Source: [%s](%s)_', input, source + '/' + path.basename(input)));
  lines.push('');
  this.toc.forEach(function(entry) {
    lines.push(sprintf('- [%s](%s)', escape(entry.title), entry.url));
  });
  this.lines = lines.concat(this.lines);
};

/**
 * Convert the method description to markdown.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
GitemplateDox.prototype.convertSummary = function(comment) {
  this.bq(this.linkMethodNames(comment.description.summary, comment));
};

/**
 * Stylize/wrap sections of the description.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
GitemplateDox.prototype.convertMethodDesc = function(comment) {
  if (!comment.description.body) { return; }

  var buf = comment.description.body;

  // Stylize isolated description lines that end with a colon.
  buf = buf.replace(/(^|\n\n)([^\n*]+:)\n\n/gm, '$1**$2**\n\n');

  // Convert the 4-space indented blocks to markdown js-lang code blocks.
  // From https://github.com/visionmedia/dox/blob/master/lib/api.js
  var code = buf.match(/^( {4}[^\n]+\n*)+/gm) || [];
  code.forEach(function(block){
    var code = block.replace(/^ {4}/gm, '');
    buf = buf.replace(block, '```js\n' + code.trimRight() + '\n```\n\n');
  });

  this.p(this.linkMethodNames(buf, comment));
};

/**
 * Convert the method name to a markdown.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
GitemplateDox.prototype.convertMethodName = function(comment) {
  var method = this.method(comment);
  this.h(1, method + this.signature(method));
};

/**
 * Convert the `@param` meta to markdown.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
GitemplateDox.prototype.convertParams = function(comment) {
  var self = this;
  var method = this.method(comment);
  var names = Object.keys(this.params[method]);

  if (!names.length) { return; }

  this.p('**Parameters:**');
  self.newline();
  names.forEach(function(name, idx) {
    var param = self.params[method][name];
    self.lines.push(sprintf(
        '- `{%s} %s`%s',
        param.types.join(' | '),
        name,
        escape(param.description ? ' ' + self.linkMethodNames(param.description, comment) : '')
    ));

    if (param.overflow.length) {
      self.newline();
      param.overflow.forEach(function(line) {
        self.lines.push(escape(self.linkMethodNames(line, comment)));
      });
      if (idx < names.length - 1) { self.newline(); } // More params exist
    }
  });
};

/**
 * Convert the `@return` meta to markdown.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
GitemplateDox.prototype.convertReturns = function(comment) {
  var self = this;
  var method = this.method(comment);
  var returns = this.returns[method];

  if (!returns) { return; }

  this.p('**Return:**');
  this.p(sprintf(
    '`{%s}`%s',
    returns.types.join(' | '),
    escape(returns.description ? ' ' + this.linkMethodNames(returns.description, comment) : '')
  ));

  if (returns.overflow.length) {
    self.newline();
    returns.overflow.forEach(function(line) {
      self.lines.push(escape(self.linkMethodNames(line, comment)));
    });
  }
};

/**
 * Convert the `@see` meta to markdown.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
GitemplateDox.prototype.convertSees = function(comment) {
  var self = this;
  var method = this.method(comment);
  var sees = this.sees[method];

  if (!sees.length) { return; }

  this.p('**See:**');
  this.newline();

  sees.forEach(function(description) {
    self.lines.push('- ' + escape(self.linkMethodNames(description, comment)));
  });
};

/**
 * Append generator name.
 *
 * @api private
 */
GitemplateDox.prototype.appendGenerator = function() {
  this.p('_&mdash;generated by [gitemplate-dox](https://github.com/codeactual/gitemplate-dox)&mdash;_');
};

// ===================== PRIVATE: UTIL =====================

/**
 * Extract an exported property name.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @return {string} Extracted name or null
 * @api private
 */
GitemplateDox.prototype.exportedProp = function(comment) {
  if (!comment.code) { return null; }
  var matches = comment.code.match(/^(module\.)?exports\.([^ ]+) =/);
  return matches ? matches[2] : null;
};

/**
 * Convert text to a markdown heading.
 *
 * @param {number} level Ex. 1 for <h1>
 * @param {string} text
 * @api private
 */
GitemplateDox.prototype.h = function(level, text) {
  this.lines.push('\n' + (new Array(level + 1)).join('#') + ' ' + text);
};

/**
 * Link all method name references to their GitHub generated heading anchors.
 *
 * @param {string} text
 * @param {object} comment Attributes extracted by `dox`
 * @return {string}
 * @api private
 */
GitemplateDox.prototype.linkMethodNames = function(text, comment) {
  var self = this;
  var curMethod = this.method(comment);
  var methods = Object.keys(this.params);

  methods.sort(function(a, b) { // Replace longest symbols first
    return a.length > b.length ? -1 : (a.length === b.length ? 0 : 1);
  });

  var codeMarker = '!!gtdox:method!!';

  methods.forEach(function(method) {
    if (method === curMethod) { return; }

    // Collect `code` blocks that contain the method.
    var codeRe = new RegExp('(`+)([^`]*' + method + '[^`]*)(`+)', 'gm');
    var removedCode = text.match(codeRe) || [];

    // Temporarily replace those blocks, in the final string, with markers.
    text = text.replace(codeRe, codeMarker);

    // Perform main replacement w/ simpler regex due to missing code blocks.
    var methodRe = new RegExp(
      '(^|\\s)' +
      method.replace(/\./, '\\.') +
      '(\\W|$)',
      'gm'
    );
    text = text.replace(methodRe, sprintf('$1[%s](#%s)$2', method, self.slugMethod(method)));

    while(removedCode.length) { // Add back all code blocks.
      text = text.replace(codeMarker, removedCode.shift());
    }
  });
  return text;
};

/**
 * Extract a method name (ex. 'Klass') from its dox-provided version
 * (ex. 'Klass()').
 *
 * @param {string} method
 * @return {string} Ex. '(arg1, arg2)'
 * @api private
 */
GitemplateDox.prototype.method = function(comment) {
  return comment.ctx ? comment.ctx.string.replace('()', '') : this.exportedProp(comment);
};

/**
 * Add a blank line to the markdown output.
 *
 * @api private
 */
GitemplateDox.prototype.newline = function() {
  this.lines.push('');
};

/**
 * Convert text to a markdown paragraph.
 *
 * @param {string} text
 * @api private
 */
GitemplateDox.prototype.p = function(text) {
  text = text.trim();
  this.lines.push('\n' + text);
};

/**
 * Convert text to a markdown blockquote.
 *
 * @param {string} text
 * @api private
 */
GitemplateDox.prototype.bq = function(text) {
  text = text.trim();
  this.lines.push('\n> ' + text);
};

/**
 * Build a method's signature string.
 *
 * @param {string} method
 * @return {string} Ex. '(arg1, arg2)'
 * @api private
 */
GitemplateDox.prototype.signature = function(method) {
  return '(' + Object.keys(this.params[method]).join(', ') + ')';
};

/**
 * Build a GitHub-compatbible heading anchor slug.
 *
 * @param {string} text
 * @return {string}
 * @api private
 */
GitemplateDox.prototype.slug = function(text) {
  return text.replace(/[^a-zA-Z0-9-_ ]+/g, '').replace(/\s+/g, '-').toLowerCase();
};

/**
 * Build a slug for a method and its signature.
 *
 * @param {string} method
 * @return {string}
 * @api private
 */
GitemplateDox.prototype.slugMethod = function(method) {
  return this.slug(method + this.signature(method));
};
