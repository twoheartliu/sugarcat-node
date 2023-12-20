import dotenv from 'dotenv'

dotenv.config()

export const config = {
  URL: process.env.URL,
  TOKEN: process.env.TOKEN,
  STREAMING_API_URL: process.env.STREAMING_API_URL,
}
