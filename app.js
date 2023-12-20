import { createRestAPIClient, createStreamingAPIClient } from 'masto'
import { config } from './config.js'

const masto = createRestAPIClient({
  url: config.URL,
  accessToken: config.TOKEN,
})

const streaming = createStreamingAPIClient({
  streamingApiUrl: config.STREAMING_API_URL,
  accessToken: config.TOKEN,
})

// console.log('subscribed to #sugarcat')

const subscribe = async () => {
  for await (const event of streaming.hashtag.subscribe({ tag: 'sugarcat' })) {
    console.log('event', event)
    switch (event.event) {
      case 'update': {
        console.log('new post', event.payload.content)
        await masto.v1.statuses.create({
          status: 'meow!',
          visibility: 'public',
          in_reply_to_id: event.payload.id,
        })
        break
      }
      case 'delete': {
        console.log('deleted post', event.payload)
        break
      }
      default: {
        break
      }
    }
  }
}

try {
  await subscribe()
} catch (error) {
  console.error(error)
}
