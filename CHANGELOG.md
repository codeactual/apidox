# 2.0.1

- Update lodash to `v4.17.11` due to security vulnerabilities via `npm audit fix`

# 2.0.0

- Make @return formatting consistent with @param and @throw

# 1.0.0

- Bump major version since we changed parser which may change output
- Remove node-component-grunt dep

# 0.3.8

- Update to latest dox

# 0.3.7

- chore(npm): Upgrade deps

# 0.3.6

- feat(markdown): Support two levels of list items under `@param`

# 0.3.5

- feat(ApiDox): Add `@throws` rendering based on `dox-0.4.4` support
- chore(deps): Upgrade NPM dependencies

# 0.3.4

- feat(ApiDox): Added `fullSourceDescription` option to insert full source description instead of summary. Defaults to false.
- fix(ApiDox): Omit source lines if no `input` or `inputTitle`
- fix(ApiDox): If `inputText` specified and no input, don't generate the link target

# 0.3.3

- feat(ApiDox): Add `inputTitle` config (#3)
  - Allow `set('inputTitle', <false|string>)` to either omit `Source: ...` from markdown or customize the link text.
- feat(ApiDox): Add `inputText` config as alternative to `input` (#4)

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
