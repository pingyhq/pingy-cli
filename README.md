# Pingy CLI

[![npm](https://img.shields.io/npm/v/@pingy/cli.svg)](https://www.npmjs.com/package/@pingy/cli)
[![Build Status](https://travis-ci.org/pingyhq/pingy-cli.svg?branch=master)](https://travis-ci.org/pingyhq/pingy-cli)

> The Simple **Frontend Build** Tool. No Configuration, No Plugins.

## Install

```
npm install @pingy/cli --global
```

## Usage

```
Usage: pingy [command]

Commands:

  init              Initialise a new or existing website
  serve [options]   Serve local development version of website
  export            Export website to a folder for distribution
  -h, --help        output usage information
  -V, --version     output the version number
```

### `init`

`pingy init` will initialise a new or existing website in the current directory.
An interactive prompt will ask you a few questions and can then install requested
dependencies (e.g. Sass, Less, Babel, CoffeeScript etc..). Optionally, `init` can
also scaffold some boilerplate files for your website.

Pingy is zero-configuration but it does place a `.pingy.json` file in your website folder to help Pingy identify the root of your website. Currently, this only contains the default folder name exporting files to ('dist'), you can change this if you like.

*Coming soon: A non-interactive version of the init command*

### `serve`

```
Usage: pingy serve [options]

Serve local development version of website

Options:

  -h, --help         output usage information
  -p, --port [port]  Use chosen port (otherwise random port will be used)
  -q, --no-open      Don't automatically launch site in web browser
```

Will create a local development server and open the site in your default web browser. Automatically supports live browser reload, compilation/transpilation (with smart caching) and sourcemaps without any configuration.

*Note: If you created your project with `pingy init`, then Pingy will try to add a `run` script (if it doesn't already exist) to your `package.json`. In this case, you can run `npm start`, instead of `pingy init`.*


### `export`

`pingy export` will export the website so that it's ready to be uploaded wherever you like. Assets will be minified so that your website is super fast.

#### Configuring Export
You can edit the `.pingy.json` file in your website root to change which folder your site will be exported to. You can also add/remove to the `exclusions` array to exclude files/folder from being exported or compiled.

This is what the default `.pingy.json` file looks like:

```json
{
  "exportDir": "dist",
  "exclusions": [
    {
      "path": "node_modules",
      "action": "exclude",
      "type": "dir"
    }
  ]
}
```

This will export your site to a folder named 'dist' within your website's folder.
It will also exclude the 'node_modules' folder from your exported build.

Let's try changing our `.pingy.json` to something a bit different:

```json
{
  "exportDir": "exported-site",
  "exclusions": [
    {
      "path": "bower_components",
      "action": "dontCompile",
      "type": "dir"
    },
    {
      "path": "*.json",
      "action": "exclude",
      "type": "file"
    }
  ]
}
```

This will export your site to a folder named 'exported-site' within your website's folder.
It will exclude any files that have the 'json' extension and it will copy the
'bower_components' folder and internal file but it won't compile any of those files.
For example, if Pingy CLI sees a SASS or CoffeeScript file then it won't try to compile it,
it also won't try to minify HTML, CSS or JS files within 'bower_components'.

*Better documentation for this functionality is coming soon. For the moment, feel free to create an issue if you want more information.*

## License

(The MIT License)

Copyright (c) 2017 Pingy <team@pin.gy>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
