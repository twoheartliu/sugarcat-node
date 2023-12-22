import axios from 'axios'
import { Constants } from './config.mjs'
import fs from 'fs'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import {
  masto,
  streaming,
  readUserHistory,
  writeUserHistory,
  extractPlainText,
  handleAndStoreError,
} from './tools.mjs'

const { ROLE_CONTENT, API_URL, OPENAI_API_KEY } = Constants

// 获取当前模块的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const subscribe = async () => {
  try {
    for await (const event of streaming.user.notification.subscribe()) {
      console.log('event', event)
      if (event.payload.type === 'mention') {
        const userId = event.payload.account.id

        // 读取用户对话历史
        const userHistories = readUserHistory()

        // 如果用户不存在，则创建一个新的对话历史数组
        if (!userHistories[userId]) {
          userHistories[userId] = []
        }

        const plainText = extractPlainText(event.payload.status.content)

        console.log('plainText', plainText)

        // 将用户消息添加到对话历史中
        const userMessage = { role: 'user', content: plainText }
        userHistories[userId].push(userMessage)

        const requestData = {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: ROLE_CONTENT.default,
            },
            ...userHistories[userId], // 包含用户的对话历史
          ],
        }

        axios
          .post(API_URL, requestData, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${OPENAI_API_KEY}1`,
            },
          })
          .then(async (response) => {
            const chatGptResponse = response.data.choices[0].message.content

            console.log('Response:', chatGptResponse)

            // 将ChatGPT的响应添加到用户的对话历史中
            const chatGptMessage = {
              role: 'assistant',
              content: chatGptResponse,
            }
            userHistories[userId].push(chatGptMessage)

            // 写入更新后的用户对话历史
            writeUserHistory(userHistories)

            await masto.v1.statuses.create({
              status: `@${event.payload.account.acct} ${chatGptResponse}!`,
              visibility: 'public',
              in_reply_to_id: event.payload.status.id,
            })
          })
          .catch(async (error) => {
            handleAndStoreError(error)

            await masto.v1.statuses.create({
              status: `@${event.payload.account.acct} 实在太抱歉了！刚刚你说什么我没有听到，可能是网络原因或者程序出错了，要不你再试试看？或者联系 @twoheart@nofan.xyz 解决故障喵～`,
              visibility: 'public',
              in_reply_to_id: event.payload.status.id,
            })
          })
      }
    }
  } catch (error) {
    console.error('Error in subscribe:', error)
    handleAndStoreError(error)
  }
}

subscribe()
