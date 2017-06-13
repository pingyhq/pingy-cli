# Stylus
The Stylus compiler interface is one of the most abnormal and has gone through heavy modification to fit to the the accord model.

## Supported Methods
 - render

## Source Maps

Source maps are supported by the stylus adapter. Just pass in a `sourcemap` option [as described in the docs](http://learnboost.github.io/stylus/docs/sourcemaps.html), and it will come back as `sourcemap` on the response object.

## Additional Options
### [Define](http://learnboost.github.io/stylus/docs/js.html#definename-node)

 - key: `define`
 - type: `Object`
 - default: `{}`

`define` lets you pass in variables that you can use in Stylus. Pretty sweet. One thing to keep in mind is that Stylus does not do a great job of typecasting values that are passed in. For example, if you're working with colors, you need to go through quite a process to get the right values in. Eventually we'd like to add better typecasting to the accord adapter to make life easier, but for now you'll have to do it the long way. Let's look at an example with some basic values passed through.

```coffee
styl = accord.load('stylus')
styl.render(
  '.test\n  width: maxwidth\n  height: maxheight'
  define:
    maxwidth: 42
    maxheight: 100
).catch(
  (err) -> console.error err
).done(
  (css) -> console.log css
)
```

You can pass as many key/value pairs as you want in the object, and each one will be defined.

### [Include](http://learnboost.github.io/stylus/docs/js.html#includepath)

 - key: `include`
 - type: `(String|String[])`
 - default: `[]`

`include` will set additional paths in Stylus that you can `@import` from. For example, if you'd like to make a specific folder of Stylus available within another totally separate folder, you don't have to use path-fu on every `@import` statement, you can just add the folder's path with an `include` and then load it as if it was in the same folder.

```coffee
styl = accord.load('stylus')
styl.render('@import foobar', { include: __dirname + 'foobar' })
  .catch((err) -> console.error(err))
  .done((css) -> console.log(css))
```

As indicated by the type `String[]`, if you want to include multiple paths, you can pass an array.

```coffee
styl = accord.load('stylus')
styl.render('@import baz', { include: [__dirname + 'foobar', __dirname + baz] })
  .catch((err) -> console.error err)
  .done((css) -> console.log css)
```

### [Import](http://learnboost.github.io/stylus/docs/js.html#importpath)

 - key: `import`
 - type: `(String|String[])`
 - default: `[]`

`import` is like include, except rather than just making the paths available, it will import all the files at the paths given automatically, so you don't have to use an `@import` at all in your Stylus.

```coffee
styl = accord.load('stylus')

# single import
styl.render('mixin_from_foobar()', { import: __dirname + 'foobar' })
  .catch((err) -> console.error err)
  .done((css) -> console.log css)

# multiple imports
styl.render('mixin_from_baz()', { import: [__dirname + 'foobar', __dirname + baz] })
  .catch((err) -> console.error err)
  .done((css) -> console.log css)
```

### [Use](http://learnboost.github.io/stylus/docs/js.html#usefn)

 - key: `use`
 - type: `(Function|Function[])`
 - default: `[]`

`use` allows you to pass through a function or array of functions which get(s) the entire Stylus object. So this function can add any number of additional `define`s, `include`s, `import`s, and whatever other JavaScript transformations you want. Best suited for Stylus plugins that need to be loaded cleanly and make a few manipulations in the pipeline (like [nib](https://github.com/visionmedia/nib) or [axis](https://github.com/jenius/axis)).

```coffee
some_plugin = require('some_plugin')
second_plugin = require('second_plugin')
styl = accord.load('stylus')

# single plugin
styl.render('plugin()', { use: some_plugin() })
  .catch((err) -> console.error err)
  .done((css) -> console.log css)

# multiple plugins
styl.render('plugin()', { use: [some_plugin, second_plugin] })
  .catch((err) -> console.error err)
  .done((css) -> console.log css)
```

## [Set](http://learnboost.github.io/stylus/docs/js.html#setsetting-value)

In Stylus, you can use `set()` to set options directly on the compiler. Accord lets you do this by dropping the key/value pairs directly into the options object.

```coffee
styl = accord.load('stylus')
styl.render('.test\n  foo: bar', { foo: 'bar', filename: 'none' })
  .catch((err) -> console.error err)
  .done((css) -> console.log css)
```

## [URL](http://learnboost.github.io/stylus/docs/functions.url.html)

If you want a custom URL function, you can pass an object to the `url` key in your options containing the `name` of your function, along with optionally `paths` or `limit` which function as they do in the stylus docs linked above. For example:

```coffee
styl = accord.load('stylus')

options =
  url:
    name: 'embedurl'
    paths: [__dirname + '/img']
    limit: false

styl.render('.test\n  background: url(wow.png)', options)
  .catch((err) -> console.error err)
  .done((css) -> console.log css)
```

Or if you'd just like to take advantage of the default inlining (any image below 30k will be base64'd), just pass a string to `url` that you want to name your custom url function.

```coffee
styl = accord.load('stylus')
styl.render('.test\n  background: url(wow.png)', { url: 'embedurl' })
  .catch((err) -> console.error err)
  .done((css) -> console.log css)
```

Please note that this functionality will not work if stylus cannot find your image file.
