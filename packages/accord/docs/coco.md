# Coco
Coco is a fork of CoffeeScript that tries to eliminate some pain points. It has a very similar compiler to that of CoffeeScript, with even fewer options. The options are not documented anywhere explicitly, but I found just two being used in the source, documented below:

## Supported Methods
 - render

## Source Maps

Coco does not support source maps, unfortunately. If they do add support we would be happy to add it to accord.

## Additional Options
### Bare
 - key: `bare`
 - type: `Boolean`
 - default: `false`

Compile without function closure.
