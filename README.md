# apidox

Generate node.js API markdown with [dox](https://github.com/visionmedia/dox)

[![Build Status](https://travis-ci.org/codeactual/apidox.png)](https://travis-ci.org/codeactual/apidox)

## Markdown

Main differences from `dox --api`:

* Method references are auto-linked to associated sections
* Links to Table of Contents and parent object's section
* `<ul>` of `@param` w/ two levels of sub-items
* `<ul>` of `@throws` w/ one level of sub-items
* `@return` with one level of `<ul>` items
* `<ul>` of `@see` (w/ `dox` URL detection intact)
* Boldfaced section headings (ex. `Configuration:`) in method summaries
* Source file link

## Examples

### CLI

    cd /path/to/proj
    apidox --input lib/util/index.js --output docs/Util.md

### Output

* [weir](https://github.com/codeactual/weir/blob/master/docs/Weir.md)
* [conjure](https://github.com/codeactual/conjure/blob/master/docs/Conjure.md)

## Installation

### [NPM](https://npmjs.org/package/apidox)

    npm install apidox

## API

[Documentation](docs/ApiDox.md)

## License

  MIT

## Contributors

- [@davedoesdev](https://github.com/davedoesdev)

## Tests

    npm test
