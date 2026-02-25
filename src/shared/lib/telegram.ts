import { Telegraf } from 'telegraf'
import { env } from './env'
import { generateText } from 'ai'
import { llmProvider, getSystemPrompt } from './llm'
import { DEFAULT_MODEL_ID } from './models'

// Create a new Telegraf bot instance
export const telegramBot = new Telegraf(env.TELEGRAM_BOT_TOKEN)

telegramBot.on('text', async (ctx) => {
  const userMessage = ctx.message.text

  try {
    // Show typing indicator in Telegram
    await ctx.sendChatAction('typing')

    // Call LLM
    const { text } = await generateText({
      model: llmProvider(DEFAULT_MODEL_ID),
      system: getSystemPrompt(),
      messages: [{ role: 'user', content: userMessage }],
    })

    // Reply to user
    await ctx.reply(text)
  } catch (error) {
    console.error('Error processing Telegram message via LLM:', error)
    await ctx.reply('Sorry, I encountered an error processing your request.')
  }
})

// Handle errors gracefully to prevent crashing
telegramBot.catch((err, ctx) => {
  console.error(`Ooops, encountered an error for ${ctx.updateType}`, err)
})
