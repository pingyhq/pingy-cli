# LiveScript
LiveScript is a fork of Coco, which is a fork of CoffeeScript. More info on changes and additons can be found [here](http://livescript.net/).

## Supported Methods
 - render

## Source Maps

Livescript does not yet have support for source maps. You can see an open issue for this feature [here](https://github.com/gkz/LiveScript/issues/452).

## Additional Options
Its compiler is unsurprisingly very similar to both CoffeeScript and Coco, and has only 2 unique options, explained below.

### Bare
 - key: `bare`
 - type: `Boolean`
 - default: `false`

Compile without function closure.

### Const
 - key: `const`
 - type: `Boolean`
 - default: `false`

Compile all variables as constants
