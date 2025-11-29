import express from 'express'
import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoute } from './userRoute.js'
import { brandRoute } from './brandRoute.js'
import { categoryRoute } from './categoryRoute.js'
import { productRoute } from './productRoute.js'

const Router = express.Router()

Router.get('/status', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ message: 'API v1 is running' })
})

/** User API */
Router.use('/user', userRoute)

/** Brand API */
Router.use('/brand', brandRoute)

/** Category API */
Router.use('/categories', categoryRoute)

/** Product API */
Router.use('/product', productRoute)

export const API_V1 = Router
