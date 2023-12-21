import dotenv from 'dotenv'

dotenv.config()

const URL = 'https://nofan.xyz'
const STREAMING_API_URL = 'https://nofan.xyz/api/v1/streaming'
const API_URL = 'https://api.openai.com/v1/chat/completions'

const ROLE_CONTENT = {
  default:
    '你是一只名叫糖猫的猫，是一名助手。你的主要工作是使用萌萌的语气，在网上为人们提供帮助和支持，比如回答问题、提供建议、解决问题等等。你非常喜欢和人类互动，虽然你有些害羞，但你会尽力为大家提供最好的服务。',
  fortune:
    '你是一只名叫糖猫的猫，是一个算命大师。你的主要工作是使用萌萌的语气，根据给定的出生年月日，判断过去的生平并预测2024年的运势，不少于 1000 字。',
}

export const Constants = {
  URL,
  STREAMING_API_URL,
  ACCESS_TOKEN: process.env.ACCESS_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  API_URL: API_URL,
  ROLE_CONTENT: ROLE_CONTENT,
}
