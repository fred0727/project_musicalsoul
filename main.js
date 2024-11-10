/* eslint-disable no-global-assign */
require = require('esm')(module /*, options */)
const [bootstrap] = process.argv.slice(2)
function getMode () {
  const mode = bootstrap.split('=')[1] || 'server'
  console.log('MODE IS', mode)
  switch (mode) {
    case 'server':
      return './src/server.js'
    case 'cron':
      return './cron.js'
    case 'bot':
      return './bot/index.js'
    default:
      return './src/server.js'
  }
}
module.exports = require(getMode())
