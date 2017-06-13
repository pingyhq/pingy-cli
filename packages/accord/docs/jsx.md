# JSX

Transforms React's jsx syntax into normal javascript. Very simple, only a few options, which [can be found here](https://www.npmjs.com/package/react-tools#transforminputstring-options). Disregard the *sourceMap* and *sourceFilename* options, just pass *sourcemap: true* and everything will be configured for you. At the time of writing, the valid options are:

- `harmony`: enable es6 features
- `stripTypes`: strips out type annotations

## Supported Methods

- render

## Source Maps

Source maps are supported by the jsx adapter. Just pass in `sourcemap: true` as an option and you will get back `sourcemap` on the response object.