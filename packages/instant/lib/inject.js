'use strict';

const tamper = require('tamper');

/**
 * Returns a middleware that injects a script tag with the given URL before
 * the closing body tag of text/html responses.
 */
module.exports = function inject(script) {
  return tamper((req, res) => {
    const url = req.realUrl || req.url;
    const mime = res.getHeader('Content-Type');

    if (/text\/html/.test(mime) && !/instant\/events/.test(url)) {
      return function injected(body) {
        if (body.search(/<\/body>/i) !== -1) {
          return body.replace(
            /<\/body>/i,
            `  <script src="${script}"></script>\n</body>`
          );
        }
        return `${body}  <script src="${script}"></script>`;
      };
    }
    return null;
  });
};
