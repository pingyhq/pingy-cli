# Marc
[Marc](https://github.com/bredele/marc) allows you to use markdown as a simple templating language.

## Supported Methods
 - render

## Additional Options
Marc uses [marked](https://github.com/chjj/marked) in the compilation process, so all the options from marked will work here.

### Data
 - key: `data`
 - type: `Object.<String, String>`
 - default: `{}`

Being a templating language, marc lets you pass in data.

```coffee
marc = accord.load('marc')
marc.render('I am using __markdown__ with {{label}}!', data: {label: 'marc'})
  .catch((err) -> console.error err)
  .done((html) -> console.log html)
```

```html
<p>I am using <strong>markdown</strong> with marc!</p>
```

### Partials
 - key: `partial`
 - type: `Object.<String, String>`
 - default: `{}`

Marc allows you to use partials (`{> name }`)

```coffee
marc = accord.load('marc')
marc.render(
  'This is a partial: {> hello }.'
  partial:
    hello: '__{{ label }}__!'
  data:
    label: 'hello world'
).catch(
  (err) -> console.error err
).done(
  (html) -> console.log html
)
```

```html
<p>This is a partial: <strong>hello world</strong>!</p>
```

### Filters
 - key: `filter`
 - type: `Object.<String, Function>`
 - default: `{}`

Marc allows you to apply filter(s) to your markdown in a unix-like fashion.

```coffee
marc = accord.load('marc')
marc.render(
  '# {{ name } | hello}.'
  filter:
    hello: (str) -> 'hello ' + str + '!'
  data:
    name: 'world'
).catch(
  (err) -> console.error err
).done(
  (html) -> console.log html
)
```

```html
<h1>hello world!</h1>
```
