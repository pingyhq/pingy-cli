# LESS
LESS has a very simple public API with just a couple options, which [can be found here](https://github.com/less/less.js/#configuration). The accord adapter takes all the same options other than the minify option, which is redundant as it can be provided through [minify-css](minify-css.md). Filename is automatically filled in when using `renderFile`, so no need to provide it. Full example below:

```js
less = accord.load('less');
less.render('some less code', {
  paths: ['/path/to/folder/for/includes'],
  filename: 'foo.less'
});
```

## Supported Methods
 - render

## Source Maps

The less adapter does have support for sourcemaps. You can pass in `sourceMap: true` as an option and receive a map back on the response object as `sourcemap`.

## Compile time included imports

The less adapter returns an array of files included via `@import`. This array will be available as `imports` on the response object.
