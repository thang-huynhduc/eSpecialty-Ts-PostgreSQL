import express from 'express'
import type { Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js'

const START_SERVER = () : void => {
    const app = express()
    const PORT = process.env.PORT || 8000

    app.use(cookieParser())

    // Enable req.body parsing for JSON
    app.use(express.json())

    // Xử lí lỗi tập trung
    app.use(errorHandlingMiddleware)

    app.get('/', (req: Request, res: Response) => {
        res.send('Hello, TypeScript with Express!')
    })
    
    app.listen(PORT, () => {
        console.log(`Server đang chạy tại: http://localhost:${PORT}`)
    })
}

(async () => {
    START_SERVER()
})()
