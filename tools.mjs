import fs from 'fs'
import { createRestAPIClient, createStreamingAPIClient } from 'masto'
import { Constants } from './config.mjs'
import * as cheerio from 'cheerio'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'

const { URL, ACCESS_TOKEN, STREAMING_API_URL } = Constants
// 获取当前模块的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbFilePath = path.join(__dirname, 'db.json')

// Function to extract plain text from HTML content
export function extractPlainText(htmlContent) {
  const $ = cheerio.load(htmlContent)
  const plainText = $('body').text()
  const cleanedText = plainText.replace(/@sugarcat/g, '')
  return cleanedText.trim()
}

// 读取用户对话历史的函数
export const readUserHistory = (userId) => {
  if (!fs.existsSync(dbFilePath)) {
    // 创建文件
    fs.writeFileSync(dbFilePath, '{}', 'utf-8')
    console.log('File created successfully')
  }
  try {
    const data = fs.readFileSync(dbFilePath, 'utf8')
    const jsonData = JSON.parse(data)
    if (!jsonData[userId]) {
      return []
    } else {
      return jsonData[userId]
    }
  } catch (error) {
    console.error('Error reading user history:', error)
    return {}
  }
}

// 写入用户对话历史的函数
export function writeUserHistory(userId, userHistories) {
  // 读取已存在的 JSON 文件
  fs.readFile(dbFilePath, 'utf8', (readError, data) => {
    if (readError) {
      console.error('读取文件时出错：', readError)
      return
    }

    try {
      // 将 JSON 内容解析为 JavaScript 对象
      const existingData = JSON.parse(data)

      // 检查 userId 是否存在于 existingData 中
      if (!existingData[userId]) {
        // 如果不存在，创建一个新数组并赋值给 userId
        existingData[userId] = []
      }

      // 用于调试目的的记录现有数据
      console.log('existingData', existingData)

      // 根据需要修改或追加数据（例如，添加到数组中）
      console.log('userHistories', userHistories)
      console.log('userId', userId)
      // 使用 spread (...) 将各个元素推送到数组中
      existingData[userId] = userHistories

      // 将 JavaScript 对象转换回 JSON 字符串
      const updatedJson = JSON.stringify(existingData, null, 2) // 最后一个参数（2）是缩进的空格数

      // 将更新后的 JSON 字符串追加到已存在的文件
      fs.writeFile(dbFilePath, updatedJson, 'utf8', (writeError) => {
        if (writeError) {
          console.error('写入文件时出错：', writeError)
        } else {
          console.log('数据成功追加到文件！')
        }
      })
    } catch (parseError) {
      console.error('解析 JSON 时出错：', parseError)
    }
  })
}
// Mastodon client
export const masto = createRestAPIClient({
  url: URL,
  accessToken: ACCESS_TOKEN,
})

// Streaming client
export const streaming = createStreamingAPIClient({
  streamingApiUrl: STREAMING_API_URL,
  accessToken: ACCESS_TOKEN,
})

// 报错
// 处理和存储错误信息的函数
export const handleAndStoreError = async (error) => {
  // 获取当前北京时间
  const currentTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Shanghai',
  })

  // 构造错误信息对象
  const errorInfo = {
    timestamp: currentTime,
    message: JSON.stringify(
      error.response ? error.response.data : error.message
    ),
  }

  // 错误处理
  if (error.response) {
    // 服务器返回错误状态码时的处理
    console.error('Server Error:', error.response.data)
  } else if (error.request) {
    // 请求发送但没有收到响应时的处理
    console.error('No Response from Server')
  } else {
    // 其他类型的错误处理
    console.error('Error:', error.message)
  }

  // 将错误信息写入 error.json 文件
  const errorFilePath = path.join(__dirname, 'error.json')
  const existingErrors = fs.existsSync(errorFilePath)
    ? JSON.parse(fs.readFileSync(errorFilePath, 'utf-8'))
    : []
  existingErrors.push(errorInfo)
  fs.writeFileSync(
    errorFilePath,
    JSON.stringify(existingErrors, null, 2),
    'utf-8'
  )

  // 可以添加额外的处理逻辑，例如记录错误日志或发送通知
}
