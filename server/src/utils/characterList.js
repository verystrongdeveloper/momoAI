const { personas, npcs } = require('../config/prompts');

function getAvailableCharacters() {
  return [...Object.keys(personas), ...Object.keys(npcs)];
}

module.exports = { getAvailableCharacters };
