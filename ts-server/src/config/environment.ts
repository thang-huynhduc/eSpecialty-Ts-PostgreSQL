import 'dotenv/config'

export const env = {
  APP_HOST: process.env.APP_HOST || 'localhost',
  APP_PORT: process.env.APP_PORT || 8888,

  BUILD_MODE: process.env.BUILD_MODE,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'access_token_secret',
  ACCESS_TOKEN_LIFE: process.env.ACCESS_TOKEN_LIFE || '1d',

  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'refesh',
  REFRESH_TOKEN_LIFE: process.env.REFRESH_TOKEN_LIFE || '1d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
}
