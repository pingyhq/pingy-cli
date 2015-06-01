"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Test = (function (TestClass) {
  function Test(greeting) {
    _classCallCheck(this, Test);

    this.greeting = greeting;
  }

  _inherits(Test, TestClass);

  _prototypeProperties(Test, {
    defaultGreeting: {
      value: function defaultGreeting() {
        return "hello there!";
      },
      writable: true,
      configurable: true
    }
  });

  return Test;
})(TestClass);