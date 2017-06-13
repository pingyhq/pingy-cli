# HAML
The haml compiler is very simple and fairly weak in comparison to other JavaScript templating engines (like Jade). It does not support any sort of layout system or includes, and it does not support client-side templates (yet). Its compile options are not documented, but here's what I could find in the source:

## Supported Methods
 - render
 - compile

## Additional Options
### Cache
 - key: `no_restructure`
 - type: `Boolean`
 - default: `false`

Used to cache templates; `filename` is required to use this.

## Extending HAML
HAML also allows you to [extend it](https://github.com/visionmedia/haml.js#extending-haml) with custom filters and doctypes, although this functionality has not yet been added to the accord adapter due to low demand. If there is a need, open an issue and/or pull request and adding it should not be too much work.
