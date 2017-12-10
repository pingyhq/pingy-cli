# TypeScript
TypeScript is a superset of Javascript that compile to plain JavaScript. TypeScript offers classes, modules, and interfaces to help you build robust components. More information can be found on [typescriptlang.org](http://www.typescriptlang.org/).

The adapter uses [typescript's](https://github.com/Microsoft/TypeScript) `transpileModule` method. This means that you can configurate it's behavior by passing `tsc` option to `pingy.json`. By example, this version of config allows you to transpile output files to ES5 with AMD modules:
```
{
  "name": "pingy",
  "exportDir": "dist",
  "minify": true,
  "compile": true,
  "exclusions": [
    {
      "path": "node_modules",
      "action": "exclude",
      "type": "dir"
    }
  ],
  "tsc": {
    "module": "AMD",
    "target": "es5"
  },
  "port": 49947
}
```
All `tsc` options covered by [official documentation](https://www.typescriptlang.org/docs/handbook/compiler-options.html).
You can control version of typescript package, because adapter uses project's package inside `<pingy_project_dir>/node_modules`
