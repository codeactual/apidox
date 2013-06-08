# 0.3.3

- feat(ApiDox): Add `inputTitle` config (#3)
  - Allow `set('inputTitle', <false|string>)` to either omit `Source: ...` from markdown or customize the link text.

# 0.3.2

- fix(ApiDox): Return `this` from `parse` to match docs (#1)

# 0.3.1

- feat(markdown): Add anchors to intermediate obj paths
- chore(npm): Upgrade outdated dev dependencies

# 0.3.0

- feat(markdown): Add anchors before parent object's (`Klass.prototype`) heading.
- feat(markdown): Add anchors before parent object's TOC entry.
- feat(markdown): Add links below each method section to TOC and parent object's TOC entry.

# 0.2.2

- fix(param): Remove leading newline from sub-item set
- fix(markdown): Add missing HTML escaping in method summaries, descriptions, `@param`, `@return`.

# 0.2.1

- Fix circular NPM dependencies.

# 0.2.0

- Rename project to `apidox`.

# 0.1.1

- Remove NPM shrinkwrapping.

# 0.1.0

- Initial API: `parse()`, `convert()`
- Initial CLI: `--name`, `--src`, `--dst`, `--desc`, `--repo`, `--json`, `--verbose`
