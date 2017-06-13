var Test = React.createClass({displayName: "Test",
  render: function(){
    return (
      React.createElement("div", {className: "foo"}, this.props.bar)
    );
  }
});