import express from 'express'
import type { Request, Response } from 'express'

const app = express()
const PORT = process.env.PORT || 5432

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript with Express!')
})

app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`)
})