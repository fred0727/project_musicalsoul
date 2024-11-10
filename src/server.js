import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import express from 'express'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import { handleError } from './utils/error.js'
import cors from 'cors'
import router from './routes/main.route.js'
// import morgan from 'morgan'
const morgan = require('morgan')
dotenv.config()

const upload = multer({ upload: './uploads' })

const app = express()
const port = process.env.PORT

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
  flags: 'a',
  interval: '2d'
})

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }))

app.use(
  cors({
    origin: ['http://localhost:3001', 'http://192.168.0.177:3001', 'http://localhost:5001', 'https://musicalsoul.melodiasunidasapp.website/'],
    credentials: true
  })
)

app.use('/static', express.static(path.join(path.resolve(), '/static')))

app.use(upload.none())
app.use(express.json())
app.set('views', path.join(path.resolve(), 'src', 'views'))
app.set('view engine', 'ejs')
app.set('layout', './layouts/index')
app.set('trust proxy', 1)
app.set('trust proxy', function (ip) {
  if (ip === '127.0.0.1' || ip === process.env.SERVER_IP) return true
  // trusted IPs
  else return false
})
app.use(cookieParser('SHHH'))

app.use(router)


app.get('*', (req, res, next) => {
  res.render('errors/404')
})

app.use(handleError)

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
