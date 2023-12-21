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
export const readUserHistory = () => {
  if (!fs.existsSync(dbFilePath)) {
    // 创建文件
    fs.writeFileSync(dbFilePath, '{}', 'utf-8')
    console.log('File created successfully')
  }
  try {
    const data = fs.readFileSync(dbFilePath, 'utf8')
    return JSON.parse(data) || {}
  } catch (error) {
    console.error('Error reading user history:', error)
    return {}
  }
}

// 写入用户对话历史的函数
export const writeUserHistory = (userHistories) => {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(userHistories, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing user history:', error)
  }
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
