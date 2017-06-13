# Base Adapter
All accord adapters inherit from a base adapter. So, the options documented here will work with all the other adapters (unless otherwise noted).

## Supported Methods
Not all compilers implement the full list of methods, but these are the ones they _can_ support. Check the docs for the specific adapter to find out what methods it supports.
 - `render`
 - `compile`
 - `compileClient`
 - `clientHelpers`

In addition, anything that supports a particular method (other than `clientHelpers`) will automatically support the "file" version of that method. For example, if it supports `render`, it will support `renderFile`.

## Options
### Filename
 - key: `filename`
 - type: `String`
 - default: The filename that's passed to `compileFile`, otherwise `undefined`.

If you use the `compile` or `render` function, but you also happen to know the filename of the file that's being compiled, you can pass it in the `options` object as `filename`. By providing the filename, it will usually improve error reporting, but it varies depending on the compiler.

If you pass the filename to the function (as with `renderFile`, `compileFile`, and `compileFileClient`) then `filename` will be set for you.
