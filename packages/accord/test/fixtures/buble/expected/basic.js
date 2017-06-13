var Test = (function (TestClass) {
  function Test(greeting) {
    TestClass.call(this);
    this.greeting = greeting;
  }

  if ( TestClass ) Test.__proto__ = TestClass;
  Test.prototype = Object.create( TestClass && TestClass.prototype );
  Test.prototype.constructor = Test;

  Test.defaultGreeting = function defaultGreeting () {
    return 'hello there!'
  };

  return Test;
}(TestClass));
