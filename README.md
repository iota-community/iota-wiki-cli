iota-wiki-cli
========

This utility requires [`yarn`](https://yarnpkg.com/) and [`git`](https://git-scm.com/) to be installed.

Configure the utility with a `config.json`. See a example [`here`](./config.example.json).

# Release

1. Ensure commit signing is properly setup.
2. Run `npm version minor`, `npm version major`, etc. depending on what's applicable.
3. Push changes including the newly created tag.
4. Create GitHub release using the commit above.

# TOC

<!-- toc -->
* [Release](#release)
* [TOC](#toc)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @iota-community/iota-wiki-cli
$ iota-wiki-cli COMMAND
running command...
$ iota-wiki-cli (-v|--version|version)
@iota-community/iota-wiki-cli/1.7.1 linux-x64 node-v16.13.1
$ iota-wiki-cli --help [COMMAND]
USAGE
  $ iota-wiki-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`iota-wiki-cli checkout`](#iota-wiki-cli-checkout)
* [`iota-wiki-cli clean`](#iota-wiki-cli-clean)
* [`iota-wiki-cli help [COMMAND]`](#iota-wiki-cli-help-command)
* [`iota-wiki-cli setup`](#iota-wiki-cli-setup)
* [`iota-wiki-cli start`](#iota-wiki-cli-start)

## `iota-wiki-cli checkout`

checkout content repositories

```
USAGE
  $ iota-wiki-cli checkout

OPTIONS
  -h, --help            show CLI help
  -o, --[no-]overwrite  Disable/Enable overwriting of static content

EXAMPLE
  $ iota-wiki-cli checkout
```

## `iota-wiki-cli clean`

completely removes local wiki

```
USAGE
  $ iota-wiki-cli clean

OPTIONS
  -h, --help  show CLI help
```

## `iota-wiki-cli help [COMMAND]`

display help for iota-wiki-cli

```
USAGE
  $ iota-wiki-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.18/src/commands/help.ts)_

## `iota-wiki-cli setup`

setup local wiki

```
USAGE
  $ iota-wiki-cli setup

OPTIONS
  -h, --help     show CLI help
  -r, --ref=ref  wiki revison to checkout

EXAMPLE
  $ iota-wiki-cli setup --ref main
```

## `iota-wiki-cli start`

start local wiki

```
USAGE
  $ iota-wiki-cli start

OPTIONS
  -h, --help  show CLI help
  --dry-run   Test build the wiki with the current edited content
```
<!-- commandsstop -->
