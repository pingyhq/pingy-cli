Car = React.createClass
  render: ->
    React.createElement(Vehicle, {"doors": (4), "locked": (isLocked()), "data-colour": "red", "on": true},
      React.createElement(Parts.FrontSeat, null),
      React.createElement(Parts.BackSeat, null),
      React.createElement("p", {"className": "seat"}, "Which seat can I take? ", (@props?.seat or 'none'))
    )