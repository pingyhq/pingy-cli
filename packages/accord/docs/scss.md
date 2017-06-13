# SCSS
This adapter uses [node-sass](https://github.com/andrew/node-sass), an incredibly fast C binding to libsass. It is however limited in that it does not include ways to work with plugins and extensions that are as robust as the main ruby version, and that it only supports the scss syntax, and not sass.

## Supported Methods
 - render

## Source Maps

`node-sass` (include its dependency `libsass`) currently supports sourcemap. And you can use `sourcemap` option to enable this feature.

1. When passing `Boolean` value to `sourcemap`, it means enable/disable the sourcemap. And the `sources` property of generated sourcemap is array of absolute paths.
2. When passing `String` value to `sourcemap`, the `sources` property of generated sourcemap is array of relative paths (relative to the scss file).

See [node-sass Options.sourceMap](https://github.com/sass/node-sass#sourcemap) for more details.

## Additional Options
It has a pretty standard API, and uses the [options documented here](https://github.com/andrew/node-sass#options). Do not pass through `data` or `file`, as this will be overridden by accord's wrapper - everything else is fair game.

If you do want to include plugins, you can start moving towards this type of functionality using the `importPaths` option - by adding a folder to this path, you will make all its contents available for `@import`s into your scss files. While not quite as robust as Stylus' options or sass-ruby's options, it will get the job done.

## Compile time included imports

The scss adapter returns an array of files included via `@import`. This array will be available as `imports` on the response object.

## Build meta information

Meta information about the build will be available as `meta` on the response object.
