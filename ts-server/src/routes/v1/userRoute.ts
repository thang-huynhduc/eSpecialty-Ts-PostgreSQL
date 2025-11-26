import { authController } from 'controllers/authController.js'
import express from 'express'
import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { authValidator } from 'validators/authValidator.js'

const Router = express.Router()

Router.get('/status', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ message: ' User is running' })
})

Router.post('/register', authValidator.createNew, authController.userRegister)
Router.post('/login', authValidator.login, authController.userLogin)

export const userRoute = Router
