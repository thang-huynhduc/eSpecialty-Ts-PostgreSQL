import { userController } from 'controllers/userController.js'
import express from 'express'
import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { userValidator } from 'validators/userValidator.js'

const Router = express.Router()

Router.get('/status', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ message: ' User is running' })
})

Router.post('/register', userValidator.createNew, userController.userRegister)
Router.post('/login', userValidator.login, userController.userLogin)
Router.post('/Adminlogin', userValidator.login, userController.adminLogin)
Router.delete('/logout', userController.logout)

export const userRoute = Router
