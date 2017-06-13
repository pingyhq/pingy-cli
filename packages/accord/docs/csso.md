# CSSO
CSSO is a great tool for optimizing CSS. It's public API is very simple, sometimes to a fault, where it becomes difficult to track down errors. Although we're considering building in some extra error tracking in the future, for now just be careful.

## Supported Methods
 - render

## Source Maps

CSSO does not have support for source maps, unfortunately. There is an open issue for it [here](https://github.com/css/csso/issues/173). If they do add support we'd be happy to integrate it with accord.

## Additional Options

### Restructuring
 - key: `restructuring`
 - type: `Boolean`
 - default: `true`

 If set to false it disables structure minimization. Structure minimization is a feature that merges together blocks that have the same selector.

 ### Debug
 - key: `debug`
 - type: `Boolean`
 - default: `false`

Emits additional information for debugging if set to true.