class Test extends TestClass {
  constructor(greeting) {
    super();
    this.greeting = greeting;
  }

  static defaultGreeting() {
    return 'hello there!'
  }
}
