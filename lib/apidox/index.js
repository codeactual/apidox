/**
 * Generate node.js API markdown with dox
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

/**
 * Reference to ApiDox.
 */
exports.ApiDox = ApiDox;

/**
 * Create a new ApiDox.
 *
 * @return {object}
 */
exports.create = function() { return new ApiDox(); };

/**
 * Extend ApiDox.prototype.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extend = function(ext) { return extend(ApiDox.prototype, ext); };

var dox = require('dox');
var fs = require('fs');
var path = require('path');
var util = require('util');
var sprintf = util.format;

var requireComponent = require('../component/require');
var extend = requireComponent('extend');
var configurable = requireComponent('configurable.js');

var doxTagTypes = [
  'param', 'return', 'see', 'api', 'type', 'memberOf', 'audit', 'borrows',
  'throws'
];

/**
 * ApiDox constructor.
 *
 * Usage:
 *
 *     var dox = require('apidox').create();
 *     var markdown = dox
 *       .set('input', '/path/to/source.js')
 *       .set('output', '/path/to/output.md')
 *       .parse()
 *       .convert();
 *
 * Configuration:
 *
 * - `{string} input` Source file to read
 * - `{string} inputText` Alternative to `input`
 * - `{string|boolean} [inputTitle=input]` Customize `Source: ...` link text
 *   - `false`: Omit `Source: ...` entirely from markdown
 *   - `string`: Set link text (does not affect link URL)
 * - `{string} output` Markdown file to write
 *
 * Properties:
 *
 * - `{object} anchors` Keys are object paths which already have anchors
 *   - For duplicate prevention
 * - `{array} comments` Filtered dox-provided objects to convert
 * - `{string curSection` Current section being converted, ex. 'Klass.prototype'.
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
 * - `{array} throws` Collected `@throws` lines
 *
 */
function ApiDox() {
  this.settings = {
    input: '',
    inputText: null,
    inputTitle: '',
    output: '',
    fullSourceDescription: false
  };
  this.anchors = {};
  this.comments = [];
  this.curSection = null;
  this.fileComment = {};
  this.lines = [];
  this.params = {};
  this.returns = {};
  this.sees = [];
  this.toc = [];
  this.throws = [];
}

configurable(ApiDox.prototype);

// ===================== PUBLIC =====================

/**
 * Parse the source file.
 *
 * @param {string} file
 * @return {object} this
 */
ApiDox.prototype.parse = function() {
  var text = this.get('inputText');
  if (typeof text !== 'string') {
    text = fs.readFileSync(this.get('input')).toString();
  }
  dox.parseComments(text, {raw: true}).forEach(this.parseComment.bind(this));
  return this;
};

/**
 * Convert comments to markdown.
 *
 * @return {string}
 */
ApiDox.prototype.convert = function() {
  this.curSection = '';
  this.comments.forEach(this.collectParams.bind(this));
  this.comments.forEach(this.collectThrows.bind(this));
  this.comments.forEach(this.convertOne.bind(this));
  this.prependTOC();
  this.prependSourceLink();
  this.prependSourceDesc();
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
ApiDox.prototype.convertOne = function(comment) {
  this.collectReturns(comment);
  this.collectTOC(comment);
  this.collectSees(comment);

  this.convertMethodName(comment);
  this.convertSummary(comment);
  this.convertMethodDesc(comment);
  this.convertParams(comment);
  this.convertReturns(comment);
  this.convertThrows(comment);
  this.convertSees(comment);
  this.appendNav(comment);
};

/**
 * Filter comment objects for conversion to text.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @param {number} idx Iteration
 * @see ApiDox.prototype.parse
 * @api private
 */
ApiDox.prototype.parseComment = function(comment, idx) {
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
ApiDox.prototype.collectParams = function(comment) {
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
ApiDox.prototype.collectReturns = function(comment) {
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
ApiDox.prototype.collectTOC = function(comment) {
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
ApiDox.prototype.collectSees = function(comment) {
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
 * Collect `@throws` meta.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
ApiDox.prototype.collectThrows = function(comment) {
  if (!comment.tags) { return; }

  var self = this;
  var method = this.method(comment);
  var prevThrow;

  this.throws[method] = {};

  comment.tags.forEach(function(tag) {
    if ('throws' === tag.type) {
      var throwId = tag.types.join('|') + tag.description;
      self.throws[method][throwId] = {
        types: tag.types,
        description: tag.description,
        overflow: []
      };
      prevThrow = throwId;
    } else if (-1 === doxTagTypes.indexOf(tag.type) && prevThrow) {
      if ('-' === tag.type || '*' === tag.type) {
        tag.string = sprintf('%s %s', tag.type, tag.string);
      }
      self.throws[method][prevThrow].overflow.push(tag.string);
    } else { // Ex. @return
      prevThrow = null;
    }
  });
};

// ===================== PRIVATE: CONVERSION =====================

/**
 * Add navigation links.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
ApiDox.prototype.appendNav = function(comment) {
  var nameParts = this.method(comment).split('.');
  var parentName = nameParts.slice(0, nameParts.length - 1).join('.');

  var links = ['[TOC](#tableofcontents)'];
  if (parentName) {
    links.push(sprintf('[%s](#toc_%s)', parentName, this.slug(parentName)));
  }
  this.p('<sub>Go: ' + links.join(' | ') + '</sub>');
};

/**
 * Prepend the source file description.
 *
 * @api private
 */
ApiDox.prototype.prependSourceDesc = function() {
  var desc = this.get('fullSourceDescription') ? this.fileComment.description.full : this.fileComment.description.summary;
  this.lines.unshift(this.linkMethodNames(desc, this.fileComment));
};

/**
 * Prepend the source file link.
 *
 * @api private
 */
ApiDox.prototype.prependSourceLink = function() {
  var input = this.get('input');
  var output = this.get('output');
  var title = this.get('inputTitle');
  var text = this.get('inputText');
  var lines = [];

  // From markdown dir to input file.
  // Assumes both are relative to the project root.
  var url = path.relative(path.dirname(output), path.dirname(input));

  if (typeof title === 'string') {
    title = title || input;
    lines.push('');

    if ((typeof text === 'string') && !input) {
      if (title) {
        lines.push(sprintf('_Source: %s_', title));
      }
    } else {
      lines.push(sprintf('_Source: [%s](%s)_', title, url + '/' + path.basename(input)));
    }
  }

  this.lines.unshift.apply(this.lines, lines);
};

/**
 * Prepend table-of-contents markdown lines.
 *
 * @api private
 */
ApiDox.prototype.prependTOC = function() {
  var self = this;

  var lines = [];
  lines.push('');
  lines.push('<a name="tableofcontents"></a>');
  lines.push('');

  var curSection = null;
  var seen = {};
  this.toc.forEach(function(entry) {
    var method = entry.title;

    // Be lazy/dumb and add one for each method rather than do a look-ahead.
    var anchor = sprintf('<a name="toc_%s"></a>', self.slugMethod(method));

    // Insert anchor before the start of each new section. A new section starts
    // whenever the parent object path changes. Ex. between `Klass` and `Klass.prototype`.
    // Keep removing '.'-delimited parts from the method name, add the anchor
    // if missing.
    var nameParts = method.split('.');
    while(nameParts.length > 1) {
      nameParts.pop();
      var parentName = nameParts.join('.');

      // - Section name (current method's parent object) has changed.
      // - Section name is not already linked.
      if (curSection !== parentName && !seen[parentName] && !self.params[parentName]) {
        curSection = parentName;
        anchor += sprintf('<a name="toc_%s"></a>', self.slug(parentName));
        seen[parentName] = 1;
      }
    }
    lines.push(sprintf('- %s[%s](%s)', anchor, self.escape(entry.title), entry.url));
  });
  this.lines = lines.concat(this.lines);
};

/**
 * Convert the method description to markdown.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
ApiDox.prototype.convertSummary = function(comment) {
  var summary = this.escape(comment.description.summary);
  this.bq(this.linkMethodNames(summary, comment));
};

/**
 * Stylize/wrap sections of the description.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
ApiDox.prototype.convertMethodDesc = function(comment) {
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

  buf = this.escape(buf);

  this.p(this.linkMethodNames(buf, comment));
};

/**
 * Convert the method name to a markdown.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
ApiDox.prototype.convertMethodName = function(comment) {
  var method = this.method(comment);
  var seen = this.anchors;

  // Insert anchor before the start of each new section. A new section starts
  // whenever the parent object path changes. Ex. between `Klass` and `Klass.prototype`.
  var nameParts = method.split('.');
  while(nameParts.length > 1) {
    nameParts.pop();
    var parentName = nameParts.join('.');

    // - Section name (current method's parent object) has changed.
    // - Section name is not already linked.
    if (this.curSection !== parentName && !seen[parentName] && !this.params[parentName]) {
      this.curSection = parentName;
      this.lines.push(sprintf('\n<a name="%s"></a>', this.slug(parentName)));
      seen[parentName] = 1;
    }
  }
  this.h(1, method + this.signature(method));
};

/**
 * Convert the `@param` meta to markdown.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
ApiDox.prototype.convertParams = function(comment) {
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
        self.escape(param.description ? ' ' + self.linkMethodNames(param.description, comment) : '')
    ));

    if (param.overflow.length) {
      var firstChar = param.overflow[0].trim()[0];
      if ('-' !== firstChar && '*' !== firstChar) {
        self.newline();
      }
      param.overflow.forEach(function(line) {
        self.lines.push(self.escape(self.linkMethodNames(line, comment)));
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
ApiDox.prototype.convertReturns = function(comment) {
  var self = this;
  var method = this.method(comment);
  var returns = this.returns[method];

  if (!returns) { return; }

  this.p('**Return:**');
  this.p(sprintf(
    '`{%s}`%s',
    returns.types.join(' | '),
    self.escape(returns.description ? ' ' + this.linkMethodNames(returns.description, comment) : '')
  ));

  if (returns.overflow.length) {
    self.newline();
    returns.overflow.forEach(function(line) {
      self.lines.push(self.escape(self.linkMethodNames(line, comment)));
    });
  }
};

/**
 * Convert the `@see` meta to markdown.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
ApiDox.prototype.convertSees = function(comment) {
  var self = this;
  var method = this.method(comment);
  var sees = this.sees[method];

  if (!sees.length) { return; }

  this.p('**See:**');
  this.newline();

  sees.forEach(function(description) {
    self.lines.push('- ' + self.escape(self.linkMethodNames(description, comment)));
  });
};

/**
 * Convert the `@throws` meta to markdown.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @api private
 */
ApiDox.prototype.convertThrows = function(comment) {
  var self = this;
  var method = this.method(comment);

  var throwIds = Object.keys(this.throws[method]);

  if (!throwIds.length) { return; }

  this.p('**Throws:**');
  self.newline();
  throwIds.forEach(function(throwId, idx) {
    var th = self.throws[method][throwId];
    self.lines.push(sprintf(
      '`{%s}`%s',
      th.types.join(' | '),
      self.escape(th.description ? ' ' + self.linkMethodNames(th.description, comment) : '')
    ));

    if (th.overflow.length) {
      self.newline();

      var firstChar = th.overflow[0].trim()[0];
      if ('-' !== firstChar && '*' !== firstChar) {
        self.newline();
      }
      th.overflow.forEach(function(line) {
        self.lines.push(self.escape(self.linkMethodNames(line, comment)));
      });
      if (idx < throwIds.length - 1) { self.newline(); } // More throws exist
    }
  });
};

/**
 * Append generator name.
 *
 * @api private
 */
ApiDox.prototype.appendGenerator = function() {
  this.p('_&mdash;generated by [apidox](https://github.com/codeactual/apidox)&mdash;_');
};

// ===================== PRIVATE: UTIL =====================

/**
 * Escape HTML entities, except in code blocks.
 *
 * @param {string} str
 * @return {string}
 * @api private
 */
ApiDox.prototype.escape = function(str) {
  // Patterns from https://github.com/visionmedia/dox/blob/master/lib/utils.js
  str = this.replace(str, /&(?!\w+;)/g, '&amp;');
  str = this.replace(str, /</g, '&lt;');
  str = this.replace(str, />/g, '&gt;');
  return str;
};

/**
 * Extract an exported property name.
 *
 * @param {object} comment Attributes extracted by `dox`
 * @return {string} Extracted name or null
 * @api private
 */
ApiDox.prototype.exportedProp = function(comment) {
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
ApiDox.prototype.h = function(level, text) {
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
ApiDox.prototype.linkMethodNames = function(text, comment) {
  var self = this;
  var curMethod = this.method(comment);
  var methods = Object.keys(this.params);

  methods.sort(function(a, b) { // Replace longest symbols first
    return a.length > b.length ? -1 : (a.length === b.length ? 0 : 1);
  });

  methods.forEach(function(method) {
    if (method === curMethod) { return; }

    text = self.replace(
      text,
      new RegExp('(^|\\s)' + method.replace(/\./, '\\.') + '(\\W|$)', 'gm'),
      sprintf('$1[%s](#%s)$2', method, self.slugMethod(method))
    );
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
ApiDox.prototype.method = function(comment) {
  return comment.ctx ? comment.ctx.string.replace('()', '') : this.exportedProp(comment);
};

/**
 * Add a blank line to the markdown output.
 *
 * @api private
 */
ApiDox.prototype.newline = function() {
  this.lines.push('');
};

/**
 * Convert text to a markdown paragraph.
 *
 * @param {string} text
 * @api private
 */
ApiDox.prototype.p = function(text) {
  text = text.trim();
  this.lines.push('\n' + text);
};

/**
 * Convert text to a markdown blockquote.
 *
 * @param {string} text
 * @api private
 */
ApiDox.prototype.bq = function(text) {
  text = text.trim();
  this.lines.push('\n> ' + text);
};

/**
 * Replace all matching strings, except in code blocks.
 *
 * @param {string} origStr
 * @param {regexp} pattern
 * @param {string} newStr
 * @return {string}
 * @api private
 */
ApiDox.prototype.replace = function(origStr, pattern, newStr) {
  var codeRe = new RegExp('(`+)([^`]*)(`+)', 'gm'); // Collect code blocks
  var removedCode = origStr.match(codeRe) || [];
  var codeMarker = '!apidox!';

  origStr = origStr.replace(codeRe, codeMarker); // Replace code blocks w/ markers
  origStr = origStr.replace(pattern, newStr); // Main replacement

  while(removedCode.length) { // Add back code blocks
    origStr = origStr.replace(codeMarker, removedCode.shift());
  }

  return origStr;
};

/**
 * Build a method's signature string.
 *
 * @param {string} method
 * @return {string} Ex. '(arg1, arg2)'
 * @api private
 */
ApiDox.prototype.signature = function(method) {
  return '(' + Object.keys(this.params[method]).join(', ') + ')';
};

/**
 * Build a GitHub-compatbible heading anchor slug.
 *
 * @param {string} text
 * @return {string}
 * @api private
 */
ApiDox.prototype.slug = function(text) {
  return text.replace(/[^a-zA-Z0-9-_ ]+/g, '').replace(/\s+/g, '-').toLowerCase();
};

/**
 * Build a slug for a method and its signature.
 *
 * @param {string} method
 * @return {string}
 * @api private
 */
ApiDox.prototype.slugMethod = function(method) {
  return this.slug(method + this.signature(method));
};
