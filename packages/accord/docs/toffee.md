Toffee
===

Based on the simplicity and beauty of CoffeeScript, Toffee proveds a templating language with a slick syntax!
Be sure to checkout the [toffee docs](//github.com/malgorithms/toffee/blob/master/README.md)!

## Basic Usage

```coffeescript
# load toffee adaptor
toffee = accord.load('toffee')

# render a string
toffee.render('''
      {#
        for supply in supplies {:<li>#{supply}</li>:}
      #}
      ''',
      supplies: ['mop', 'trash bin', 'flashlight']
).catch(console.error.bind(console))
  .done((res) -> console.log.bind(console))

# render a file
toffee.renderFile('hello.toffee', {supplies: ['mop', 'trash bin', 'flashlight']})
  .catch(console.error.bind(console))
  .done((res) -> console.log.bind(console))

# compile a string
toffee.render('''
      {#
        for supply in supplies {:<li>#{supply}</li>:}
      #}
      ''',
      supplies: ['mop', 'trash bin', 'flashlight']
).catch(console.error.bind(console))
  .done((res) -> console.log.bind(console)

# compile a file
toffee.renderFile('hello.toffee', {place: "world"})
  .catch(console.error.bind(console))
  .done((res) -> console.log.bind(console))

```
