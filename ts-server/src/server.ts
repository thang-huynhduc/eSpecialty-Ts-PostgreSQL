import express from 'express'
import cookieParser from 'cookie-parser'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js'
import { API_V1 } from 'routes/v1/index.js'

const START_SERVER = () : void => {
  const app = express()
  const PORT = process.env.PORT || 8000

  app.use(cookieParser())

  // Enable req.body parsing for JSON
  app.use(express.json())

  // Xử lí lỗi tập trung
  app.use(errorHandlingMiddleware)

  // API v1
  app.use('/api', API_V1)

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server đang chạy tại: http://localhost:${PORT}`)
  })
}

(async () => {
  START_SERVER()
})()
