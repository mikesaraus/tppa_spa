const { throttle } = require('./throttle.bandwidth'),
  { decodeURL } = require('./url.checker')

module.exports = {
  throttle,
  decodeURL,
}
