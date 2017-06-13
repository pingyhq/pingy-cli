# PostCSS
This is the compiler interface to [PostCSS](https://github.com/postcss/postcss). PostCSS is a tool for transforming CSS with JS plugins. These plugins can support variables and mixins, transpile future CSS syntax, inline images, and more.

## Supported Methods
 - render

## Source Maps

Source maps are supported by the PostCSS adapter. Just pass in a `map` option [as described in the docs](https://github.com/postcss/postcss#source-map), and it will come back as `sourcemap` on the response object.

## Additional Options
### [Use](https://github.com/postcss/postcss/blob/master/API.md#processoruseplugin)

 - key: `use`
 - type: `Array|Function|Object`
 - default: `[]`

Adds one or more plugins to be used as a CSS processor.

```coffee
pcss = accord.load('postcss')
varPlugin = require('postcss-simple-vars')

pcss.render(
  '$color: green;\n\n.test { background: $color; }'
  use: [varPlugin]
).catch(
  (err) -> console.error err
).done(
  (res) -> console.log res.result
)
```

