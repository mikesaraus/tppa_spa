module.exports = {
  decodeURL: () => {
    return (req, res, next) => {
      try {
        decodeURIComponent(req.path)
      } catch (err) {
        console.error('URL Format Error', JSON.stringify(err))
        return res.json({
          success: 0,
          error: {
            message: 'URL Format Error',
          },
        })
      }

      next()
    }
  },
}
