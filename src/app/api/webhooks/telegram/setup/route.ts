import { telegramBot } from '@/shared/lib/telegram'
import { env } from '@/shared/lib/env'

export async function GET() {
  try {
    const webhookUrl = `${env.APP_URL}/api/webhooks/telegram`

    await telegramBot.telegram.setWebhook(webhookUrl, {
      secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    })

    return Response.json({
      success: true,
      message: `Webhook successfully set to ${webhookUrl}`,
    })
  } catch (error: unknown) {
    console.error('Failed to set webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
