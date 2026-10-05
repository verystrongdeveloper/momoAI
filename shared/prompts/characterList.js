const { personas, npcs } = require('./index');

function getAvailableCharacters() {
  return [...Object.keys(personas), ...Object.keys(npcs)];
}

module.exports = { getAvailableCharacters };
