# Mustache
Mustache files are compiled with Twitter's wonderful [hogan.js](https://github.com/twitter/hogan.js). This is a fantastic compiler that easily supports client-side templates and has very straightforward options and good compile speed.

The options you can pass can be [found here](https://github.com/twitter/hogan.js#compilation-options) and exactly mirror hogan's docs, other than `asString`, which is not necessary as this is covered by accord's adapter API.

It should be noted that when running a compile or client compile, hogan returns an object rather than a function like some of the other compilers. To render the template, you need to call `render`, as can be seen in the [simple example here](https://github.com/twitter/hogan.js#basics).

Hogan also has an interesting way of handling partials -- rather than being able to use `{{> partial }}` to point to a filename, you have to pass the partial content to the template when it is rendered. To pass partials, just add a special key to your options object called `partials`, which contains an object with keys as partial names and values as partial contents (mustache logic-enabled). For example:

```js
accord.render("{{> title }}", { partials: { title: 'hello world!'} })
```

## Supported Methods
 - render
 - compile
 - compileClient
 - clientHelpers
