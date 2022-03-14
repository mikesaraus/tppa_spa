'use strict'

require('dotenv').config()

const _ = process.env,
  express = require('express'),
  app = express(),
  port = _.PORT || 8088

const compression = require('compression'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  cron = require('node-cron')

const { throttle, decodeURL } = require('./lib/middleware'),
  { readFileSync, existsSync } = require('fs'),
  CGU = require('cron-git-updater')

// Some Process
process.title = _.npm_package_name || process.title
process.env.TZ = _.TZ || 'Asia/Manila'

// App Package Information
const pkg = require('./package.json')

/**
 * New Updater
 */
const newUpdater = new CGU({
  repository: pkg.repository.url,
  branch: 'main',
  tempLocation: '../history',
  keepAllBackup: true,
  exitOnComplete: false,
})

// Check for Updates every 12 Midnight
newUpdater.schedule('0 0 * * *')

// Some Middlewares
app
  .use(compression())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(decodeURL()) // Check URL
  .use(throttle(5 * 1024 * 1024)) // Throttling bandwidth (bytes)
  .disable('x-powered-by')

// Log Requests
morgan.token('datetime', (_req, res) => new Date())
app.use(
  morgan(
    `[:datetime] :remote-addr - :remote-user ":method :url HTTP/:http-version" (:response-time ms) :status :res[content-length] ":referrer" ":user-agent" (Total :total-time ms)`
  )
)

// Check if History Mode
if (_.MODE == 'history') {
  const history = require('connect-history-api-fallback')
  app.use(history())
}

// Create HTTP or HTTPS Server
const createServer = () => {
  const key = _.SSL_KEY
  const cert = _.SSL_CERT
  const ssl =
    existsSync(key) && existsSync(cert)
      ? {
          key: readFileSync(key),
          cert: readFileSync(cert),
        }
      : null
  return ssl
    ? // https://
      require('https').createServer(ssl, app)
    : // http://
      require('http').createServer(app)
}

// Initialize Server
const server = createServer()

// SPA - Single Page Application
app.use(express.static('./app'))

server.listen(port, () => {
  console.log('#'.repeat(50))
  console.info(`Server is up and running on *:${port}`)
  console.log('#'.repeat(50))
})
