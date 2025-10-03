import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import i18n from '../libs/i18n'
import routes from '../rest-resources/routes'
import errorHandlerMiddleware from './middlewares/errorHandler.middleware'
import { verifyBodyParser } from '../helpers/bodyParserVerify.helper'
import { requestIdMiddleware } from './middlewares/requestId.middleware'

const app = express()

app.use(requestIdMiddleware)

app.use(i18n.init)

app.use(helmet())

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ verify: verifyBodyParser }))

app.use(morgan('tiny'))

// CORS Configuration
const corsOptions = {
  credentials: true,
  origin: '*',
  methods: ['GET, POST, PUT, PATCH, DELETE']
}

app.use(cors(corsOptions))

app.use(routes)

app.use(async (req, res) => {
  res.status(404).json({ status: 'Not Found' })
})

app.use(errorHandlerMiddleware)

export default app
