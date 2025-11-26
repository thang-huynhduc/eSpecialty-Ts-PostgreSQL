import express from 'express'
import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoute } from './userRoute.js'

const Router = express.Router()

Router.get('/status', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ message: 'API v1 is running' })
})

/** User API */
Router.use('/user', userRoute)

export const API_V1 = Router
