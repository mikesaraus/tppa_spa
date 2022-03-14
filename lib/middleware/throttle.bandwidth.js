module.exports = {
  throttle: (bps) => {
    return (req, res, next) => {
      if (bps > 0) {
        let total = 0
        let resume = req.socket.resume

        // make sure nothing else can resume
        req.socket.resume = () => {}

        let pulse = setInterval(() => {
          total = total - bps / 100
          if (total < bps) {
            resume.call(req.socket)
          }
        }, 10)

        req.on('data', (chunk) => {
          total += chunk.length
          if (total >= bps) {
            req.socket.pause()
          }
        })

        req.on('end', () => {
          clearInterval(pulse)
          // restore resume because socket could be reused
          req.socket.resume = resume
          // future requests need the socket to be flowing
          req.socket.resume()
        })
      }

      next()
    }
  },
}
