# Handlebars
Handlebars has an interesting way of operating, and a very obtuse API for its compiler. There aren't really any compiler options, but you can [register helpers](https://github.com/wycats/handlebars.js/#block-helpers) or [partials](https://github.com/wycats/handlebars.js/#partials) on the compiler itself before rendering, or [override the public api](https://github.com/wycats/handlebars.js/blob/7f6ef1dd38794f12aee33c76c04f604a7651810b/lib/handlebars/compiler/javascript-compiler.js#L10) (which is not currently allowed as a part of accord's wrapper).

Accord accepts the special keys `partials` or `helpers` to be registered as an object with one or more key/value pairs, each representing a helper or partial, to the corresponding keys. For example:

```js
var hbs = accord.load('handlebars');

hbs.render("hello there {{ name }}", {
  helpers: { test: function(options){}, test2: function(options){} },
  partials: { foo: "<p>{{ bar }}" },
  name: 'foobar'
});
```

## Supported Methods
 - render
 - compile
 - compileClient
 - clientHelpers

## Source Maps

Handlebars [does support source maps](https://github.com/wycats/handlebars.js/pull/902), but the functionality is brand new (at the time of writing), and is still undocumented. We will add this feature to accord once it's documented in handlebars if there's any demand for it.
