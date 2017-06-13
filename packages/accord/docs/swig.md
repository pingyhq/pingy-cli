# Swig
The [Swig](http://paularmstrong.github.io/swig/) adapter is written with a few quirks to assure that it works similarly to the other template engines.

There is no way to set a "base path" in Swig's `render` or `compile` methods, which means external file requests (see: [template inheritance](http://paularmstrong.github.io/swig/docs/#inheritance)) Swig's `renderFile` and `compileFile` methods both parse the file path through the first argument passed.  Thus, the Swig adapter overwrites the `Adapter` class's `renderFile` and `compileFile` methods.

For `render` and `renderFile`, locals are passed to `options.locals.`  You'll notice that the Swig adapter passes `options` to the second argument of the compiler's `render` method and `options.locals` to the second argument of the compiler's `renderFile` method.  This is because the compiler accepts a slew of options in the second argument of `render` but only locals in the second argument of `renderFile`.

```javascript
var accord = require("accord")
var swig = accord.load("swig")

swig.render("<h1>{{ title }}</h1>", { locals: { title: "Hello" } });
// ... is the same as swig.compiler.render("<h1>{{ title }}</h1>", { locals: { title: "Hello" } });

swig.renderFile("index.swig", { locals: { title: "Hello" } });
// ... is the same as swig.compiler.renderFile("<h1>{{ title }}</h1>", { title: "Hello" });
```
[See documentation for more information.](http://paularmstrong.github.io/swig/docs/api/#render)

## Supported Methods
 - render
 - compile
 - compileClient
 - clientHelpers
