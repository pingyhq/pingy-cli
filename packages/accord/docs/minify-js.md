# Minify JS
Uses [uglifyjs2](https://github.com/mishoo/UglifyJS2) to minify javascript code. The interface matches that of uglifyjs2, you can see some options that can be passed in [listed out here](https://github.com/mishoo/UglifyJS2#the-simple-way).

## Supported Methods
 - render

## Source Maps

Although UglifyJS has sourcemap support, unfortunately it forces you to write them to a specific file rather than simply returning the map so you can do with it what you want. Since accord does not write files and simply executes transforms then returns the text, we do not support this in any special way. You can pass `sourceMap` as an option with the path to a file and presumably it will be written. This is not tested or officially supported and will not be until UglifyJS allows us to return the sourcemap as a string or object.
