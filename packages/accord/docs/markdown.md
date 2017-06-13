# Markdown
The markdown interface is very similar to the one [marked uses](https://github.com/chjj/marked#usage).

## Supported Methods
 - render

## Additional Options
### GFM
 - key: `gfm`
 - type: `Boolean`
 - default: `true`

Enable GitHub Flavored Markdown.

### Tables
 - key: `tables`
 - type: `Boolean`
 - default: `true`

Enable GFM tables. This option requires the `gfm` option to be true.

### Breaks
 - key: `breaks`
 - type: `Boolean`
 - default: `false`

Enable GFM line breaks. This option requires the `gfm` option to be true.

### Pedantic
 - key: `pedantic`
 - type: `Boolean`
 - default: `false`

Conform to obscure parts of `markdown.pl` as much as possible. Don't fix any of the original markdown bugs or poor behavior.

### Sanitize
 - key: `sanitize`
 - type: `Boolean`
 - default: `false`

Sanitize the output. Ignore any HTML that has been inputted.

### Smart Lists
 - key: `smartLists`
 - type: `Boolean`
 - default: `true`

Use smarter list behavior than the original markdown. May eventually be
default with the old behavior moved into `pedantic`.

### Smart Typography
 - key: `smartypants`
 - type: `Boolean`
 - default: `false`

Use "smart" typographic punctuation for things like quotes and dashes.

### Highlight
 - key: `highlight`
 - type: `Function`

A function to highlight code blocks. The first example below uses async highlighting with
[node-pygmentize-bundled][pygmentize], and the second is a synchronous example using
[highlight.js][highlight]:

```js
var marked = require('marked');

var markdownString = '```js\n console.log("hello"); \n```';

// Async highlighting with pygmentize-bundled
marked.setOptions({
  highlight: function (code, lang, callback) {
    require('pygmentize-bundled')({ lang: lang, format: 'html' }, code, function (err, result) {
      callback(err, result.toString());
    });
  }
});

// Using async version of marked
marked(markdownString, function (err, content) {
  if (err) throw err;
  console.log(content);
});

// Synchronous highlighting with highlight.js
marked.setOptions({
  highlight: function (code) {
    return require('highlight.js').highlightAuto(code).value;
  }
});

console.log(marked(markdownString));
```

#### Arguments

##### Code
 - type: `String`

The section of code to pass to the highlighter.

##### Language
 - type: `String`

The programming language specified in the code block.

##### Callback
 - type: `Function`

The callback function to call when using an async highlighter.

### Renderer
 - key: `renderer`
 - type: `Object`
 - default: `new Renderer()`

An object containing functions to render tokens to HTML.

#### Overriding Renderer Methods
The renderer option allows you to render tokens in a custom manor. Here is an
example of overriding the default heading token rendering by adding an embedded anchor tag like on GitHub:

```javascript
var marked = require('marked');
var renderer = new marked.Renderer();

renderer.heading = function (text, level) {
  var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

  return '<h' + level + '><a name="' +
                escapedText +
                 '" class="anchor" href="#' +
                 escapedText +
                 '"><span class="header-link"></span></a>' +
                  text + '</h' + level + '>';
},

console.log(marked('# heading+', { renderer: renderer }));
```

This code will output the following HTML:

```html
<h1>
  <a name="heading-" class="anchor" href="#heading-">
    <span class="header-link"></span>
  </a>
  heading+
</h1>
```

#### Block Level Renderer Methods
- code(*string* code, *string* language)
- blockquote(*string* quote)
- html(*string* html)
- heading(*string* text, *number*  level)
- hr()
- list(*string* body, *boolean* ordered)
- listitem(*string*  text)
- paragraph(*string* text)
- table(*string* header, *string* body)
- tablerow(*string* content)
- tablecell(*string* content, *object* flags)

`flags` has the following properties:

```js
{
    header: true || false,
    align: 'center' || 'left' || 'right'
}
```

#### Inline Level Renderer Methods
- strong(*string* text)
- em(*string* text)
- codespan(*string* code)
- br()
- del(*string* text)
- link(*string* href, *string* title, *string* text)
- image(*string* href, *string* title, *string* text)
