import * as express from 'express'
import * as winston from 'winston'
import * as boom from 'express-boom'
import * as morgan from 'morgan'
import * as cors from 'cors'
import expressValidator = require('express-validator')
import { json, urlencoded } from 'body-parser'
import { Express, Request, Response } from 'express'
import * as config from 'config'

import userController from './controllers/UserController'

const PORT: number = config.port;

/**
 * Root class of your node server.
 * Can be used for basic configurations, for instance starting up the server or registering middleware.
 */
export class Server {
  private app: Express

  constructor() {
    this.app = express()

    this.initMiddleware()
    this.initRoutes()

    this.app.listen(PORT, () => {
      winston.log('info', '--> Server successfully started at port %d', PORT)
    })
  }

  initMiddleware() {
    this.app.use(cors({
      optionsSuccessStatus: 200
    }))
    this.app.use(urlencoded({
      extended: true
    }))
    this.app.use(json())
    this.app.use(boom())
    this.app.use(morgan('combined'))
    this.app.use(expressValidator())
  }

  initRoutes() {
    winston.log('info', '--> Initialisations des routes')

    this.app.use('/v1/config', (req: Request, res: Response) => res.status(200).json({
      env: process.env
    }))
    this.app.use('/v1/info', (req: Request, res: Response) => res.status(200).json(config))
    this.app.use('/v1/users', userController)
    // init graphql and graphiql routes

    this.app.all('*', (req: Request, res: Response) => res.boom.notFound())
  }

  getApp() {
    return this.app
  }
}
new Server()