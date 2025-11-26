import 'dotenv/config'

export const env = {
  APP_HOST: process.env.APP_HOST || 'localhost',
  APP_PORT: process.env.APP_PORT || 8888,

  BUILD_MODE: process.env.BUILD_MODE,
}
