import { telegramBot } from '@/shared/lib/telegram'
import { env } from '@/shared/lib/env'

export async function POST(req: Request) {
  try {
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token')

    if (secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    // Telegraf expects an Express-like req/res object for handleUpdate
    // but works fine if we just pass the raw body to handleUpdate
    await telegramBot.handleUpdate(body)

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    // Still return 200 so Telegram doesn't retry infinitely
    return new Response('OK', { status: 200 })
  }
}
