/**
 * Markdown constructor.
 */
exports.Markdown = Markdown;

/**
 * Create a new Markdown.
 *
 * @return {object}
 */
exports.create = function() { return new Markdown(); };

/**
 * Extend Markdown.prototype.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extend = function(ext) { return extend(Markdown.prototype, ext); };

function Markdown() {
  this.lines = [];
}

Markdown.prototype.h = function(level, text) {
  this.lines.push('\n' + (new Array(level + 1)).join('#') + ' ' + text);
};

Markdown.prototype.p = function(text) {
  text = text.trim();
  this.lines.push('\n' + text);
};

Markdown.prototype.code = function(text) {
  return '`' + text + '`';
};

Markdown.prototype.js = function(text) {
  this.lines.push('```js\n' + text + '\n```');
};

Markdown.prototype.push = function(line) {
  this.lines.push(line);
};

Markdown.prototype.build = function() {
  return this.lines.join('\n').trim() + '\n';
};
