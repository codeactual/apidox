Generate node module API markdown with dox

_Source: [lib/gitemplate-dox/index.js](../lib/gitemplate-dox/index.js)_

- [exports.GitemplateDox](#exportsgitemplatedox)
- [exports.create](#exportscreate)
- [exports.extend](#exportsextendext)
- [GitemplateDox](#gitemplatedox)
- [GitemplateDox.prototype.parse](#gitemplatedoxprototypeparsefile)
- [GitemplateDox.prototype.convert](#gitemplatedoxprototypeconvert)

# exports.GitemplateDox()

[GitemplateDox](#gitemplatedox) constructor.

# exports.create()

Create a new GitemplateDox.

**Return:**

`{object}`

# exports.extend(ext)

Extend GitemplateDox.prototype.

**Parameters:**

- `{object} ext`

**Return:**

`{object}`: Merge result.

# GitemplateDox()

GitemplateDox constructor.

**Usage:**

```js
var dox = require('gitemplate-dox').create();
var markdown = dox
  .set('input', '/path/to/source.js')
  .set('output', '/path/to/output.md')
  .parse()
  .convert();
```

**Configuration:**

- `{string} input` Source file to read
- `{string} output` Markdown file to write

**Properties:**

- `{array} comments` Filtered dox-provided objects to convert
- `{object} fileComment` First dox-provided comment found in the file
- `{array} lines` Markdown lines
- `{object} params` Collected `@param` meta indexed by method name
  - `{array} types` Type names
  - `{string} description` First line
  - `{array} overflow` Additional lines
- `{object} returns` Collected `@return` metadata indexed by method name
  - `{array} types` Type names
  - `{string} description` First line
  - `{array} overflow` Additional lines
- `{array} sees` Collected `@see` lines
- `{array} toc` Collected table-of-contents metadata objects
  - `{string} title` Link title
  - `{string} url` Link URL

# GitemplateDox.prototype.parse(file)

Parse the source file.

**Parameters:**

- `{string} file`

# GitemplateDox.prototype.convert()

Convert comments to markdown.

**Return:**

`{string}`
