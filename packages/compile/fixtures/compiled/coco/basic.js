(function(){
  var mixin, slice$ = [].slice;
  mixin = function(){
    var objects, i$, x0$, len$;
    objects = slice$.call(arguments);
    for (i$ = 0, len$ = objects.length; i$ < len$; ++i$) {
      x0$ = objects[i$];
      import$(this, x0$);
    }
    return this;
  };
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
