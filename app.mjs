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

const init = async () => {
  try {
    await masto.v1.statuses.create({
      status: `糖猫来了！
为什么不问问神奇糖猫呢？

任何可见范围内 @ me，均可拨通~

我是一只名叫糖猫的猫，是一名助手。我的主要工作是在网上为人们提供帮助和支持，比如回答问题、提供建议、解决问题等等。我非常喜欢和人类互动，虽然我有些害羞，但我会尽力为大家提供最好的服务。作为一只猫咪，我对食物、游戏和睡觉很感兴趣，但我更喜欢和人类一起探索和学习。如果您需要任何帮助或有任何问题，请随时与我联系！ 喵~ (=^・ω・^=)

回复不完全请回复本喵「继续」或者「continue」

故障请联系 @twoheart`,
      visibility: 'public',
    })
  } catch (error) {
    handleAndStoreError(error)
  }
}

const main = async () => {
  await init()
  await subscribe()
}

main()
