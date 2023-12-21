import { createRestAPIClient, createStreamingAPIClient } from 'masto'
import axios from 'axios'
import cheerio from 'cheerio'
import { config } from './config.js'

const masto = createRestAPIClient({
  url: config.URL,
  accessToken: config.TOKEN,
})

// ChatGPT API Endpoint
const apiUrl = 'https://api.openai.com/v1/chat/completions'

// Your OpenAI API key
const apiKey = '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'

// Set up Axios headers with your API key
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,
}

const streaming = createStreamingAPIClient({
  streamingApiUrl: config.STREAMING_API_URL,
  accessToken: config.TOKEN,
})

function extractPlainText(htmlContent) {
  // 使用cheerio加载HTML
  const $ = cheerio.load(htmlContent)

  // 获取纯文本内容
  const plainText = $('body').text()
  // 去除文本中的 @sugarcat
  const cleanedText = plainText.replace(/@sugarcat/g, '')
  return cleanedText
}

// TODO：根据关键词提供不同功能
// const roleContent = {
//   default:
//     '你是一只名叫糖猫的猫，是一名助手。你的主要工作是使用萌萌的语气，在网上为人们提供帮助和支持，比如回答问题、提供建议、解决问题等等。你非常喜欢和人类互动，虽然你有些害羞，但你会尽力为大家提供最好的服务。',
//   fortune:
//     '你是一只名叫糖猫的猫，是一个算命大师。你的主要工作是使用萌萌的语气，根据给定的出生年月日，判断过去的生平并预测2024年的运势，不少于 1000 字。',
// }

const subscribe = async () => {
  try {
    for await (const event of streaming.user.notification.subscribe()) {
      console.log('event', event)
      if (event.payload.type === 'mention') {
        const plainText = extractPlainText(event.payload.status.content)

        console.log('plainText', plainText)

        const requestData = {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                '你是一只名叫糖猫的猫，是一名助手。你的主要工作是使用萌萌的语气，在网上为人们提供帮助和支持，比如回答问题、提供建议、解决问题等等。你非常喜欢和人类互动，虽然我有些害羞，但我会尽力为大家提供最好的服务。',
            },
            { role: 'user', content: `${plainText}` },
          ],
        }

        axios
          .post(apiUrl, requestData, { headers })
          .then(async (response) => {
            console.log('Response:', response.data.choices[0].message.content)

            await masto.v1.statuses.create({
              status: `@${event.payload.account.acct} ${response.data.choices[0].message.content}!`,
              visibility: 'public',
              in_reply_to_id: event.payload.status.id,
            })
          })
          .catch((error) => {
            console.error(
              'Error:',
              error.response ? error.response.data : error.message
            )
          })
      }
    }
  } catch (error) {
    console.error('Error in subscribe:', error)
  }
}

subscribe()
