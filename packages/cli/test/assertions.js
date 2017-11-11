'use strict';

const { existsSync, readFileSync } = require('fs');

module.exports = (expect) => {
  expect.addAssertion('<string> [not] to exist', (ex, subject) => {
    ex.errorMode = 'default';
    ex(existsSync(subject), '[not] to be true');
  });

  expect.addAssertion('<string> [not] to have file content <string>', (ex, subject, cmp) => {
    ex.errorMode = 'default';
    ex(readFileSync(subject, 'utf8'), '[not] to contain', cmp);
  });
};
