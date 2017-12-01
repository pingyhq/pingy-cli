'use strict';

/* global window, XMLHttpRequest */

(function pingyIIFE(global) {
  if (!window.Promise) {
    // eslint-disable-next-line no-alert
    window.alert(
      'Scaffolding requires a modern web browser that supports Promises (Chrome, Firefox, Safari or Edge)'
    );
  }

  function scaffold(options) {
    return new Promise(resolve => {
      const request = new XMLHttpRequest();
      request.open('POST', '/__pingy__', true);
      request.setRequestHeader(
        'Content-Type',
        'application/json;charset=UTF-8'
      );

      request.onreadystatechange = function onreadystatechange() {
        if (this.readyState === 4) {
          if (this.status >= 200 && this.status < 400) {
            // Success!
            const resp = this.responseText;
            resolve(JSON.parse(resp));
          } else {
            // Error :(
          }
        }
      };

      request.send(JSON.stringify({ scaffold: options }));
    });
  }

  const toQueryString = obj =>
    Object.keys(obj)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
      .join('&');

  function templatedURL(url, context) {
    return `${url}?${toQueryString(context)}`;
  }

  // eslint-disable-next-line no-param-reassign
  global.pingy = {
    scaffold,
    templatedURL,
    // TODO: dirname
    dirName: '',
  };
})(window);
