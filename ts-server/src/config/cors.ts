import { StatusCodes } from 'http-status-codes'
import { env } from './environment.js' // Import từ file config env của đại ca
import ApiError from '../utils/apiError.js'
import { WHITELIST_DOMAINS } from '../utils/constants.js'
import { CorsOptions } from 'cors' // Import type

export const corsOptions: CorsOptions = {
  origin: function (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // 1. Môi trường DEV -> Cho qua hết (để test Postman thoải mái)
    if (env.BUILD_MODE === 'dev') {
      return callback(null, true)
    }

    // 2. Kiểm tra Origin
    // Postman hoặc Server gọi Server thường không có origin (requestOrigin = undefined)
    // Nếu muốn chặn Postman ở Production thì giữ dòng này, còn muốn cho qua thì sửa logic nhé.
    if (!requestOrigin) {
      return callback(new ApiError(StatusCodes.FORBIDDEN, 'CORS: No origin provided.'))
    }

    // 3. Check Whitelist
    if (WHITELIST_DOMAINS.includes(requestOrigin)) {
      return callback(null, true)
    }

    // 4. Không nằm trong whitelist -> Chặn cửa
    return callback(new ApiError(StatusCodes.FORBIDDEN, `${requestOrigin} not allowed by our CORS Policy.`))
  },

  credentials: true,
  optionsSuccessStatus: 200
}
