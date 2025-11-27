import { userController } from 'controllers/userController.js'
import express from 'express'
import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { authMiddleware } from 'middlewares/authMiddleware.js'
import { userValidator } from 'validators/userValidator.js'

const Router = express.Router()
// /api/user
Router.get('/status', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ message: ' User is running' })
})

/** Auth Route */
Router.route('/register')
  .post(userValidator.createNew, userController.userRegister)

Router.route('/login')
  .post(userValidator.login, userController.userLogin)

Router.route('/Adminlogin')
  .post(userValidator.login, userController.adminLogin)

Router.route('/logout')
  .delete( userController.logout)

Router.route('/sendOTP')
  .post(userController.sendOtp)

Router.route('/verify')
  .post(userValidator.verifyAccount, userController.verifyOtp)

/** Profile Route */
Router.route('/profile')
  .get(authMiddleware.isAuthorize, authMiddleware.userAuth, userController.getUserProfile)

Router.route('/addAddress')
  .post(authMiddleware.isAuthorize, authMiddleware.userAuth, userValidator.addAddress, userController.addUserAddress)

export const userRoute = Router
