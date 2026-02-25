import { Telegraf } from 'telegraf'
import { env } from './env'
import { generateText } from 'ai'
import { llmProvider, getSystemPrompt } from './llm'
import { DEFAULT_MODEL_ID } from './models'
import { supabase } from './supabase'
import type { ChatSession, ChatMessage } from '@/features/chat/types'

// Create a new Telegraf bot instance
export const telegramBot = new Telegraf(env.TELEGRAM_BOT_TOKEN)

telegramBot.on('text', async (ctx) => {
  const userMessage = ctx.message.text
  // We use Telegram chat ID as a unique identifier for the session
  const telegramUserId = String(ctx.from.id)

  let typingInterval: NodeJS.Timeout | null = null

  try {
    // Show typing indicator immediately
    await ctx.sendChatAction('typing')

    // Telegram chat actions only last 5 seconds, so refresh it while generating
    typingInterval = setInterval(() => {
      ctx.sendChatAction('typing').catch(console.error)
    }, 4000)

    // 1. Fetch existing session from Supabase (or create initial state)
    let session: ChatSession | null = null
    const { data: existingSessions } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', telegramUserId)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (existingSessions && existingSessions.length > 0) {
      session = existingSessions[0] as ChatSession
    } else {
      session = {
        id: crypto.randomUUID(),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    // 2. Append new user message
    const newUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    }
    const messages = [...(session.messages || []), newUserMsg]

    // Map messages for AI SDK
    const aiMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // 3. Call LLM with full context
    const { text } = await generateText({
      model: llmProvider(DEFAULT_MODEL_ID),
      system: getSystemPrompt(),
      messages: aiMessages,
    })

    // 4. Append AI response
    const newAiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: text,
      createdAt: new Date(),
    }
    messages.push(newAiMsg)

    // 5. Save back to Supabase
    await supabase.from('chat_sessions').upsert(
      {
        id: session.id,
        user_id: telegramUserId,
        messages: messages,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

    // Reply to user
    await ctx.reply(text)
  } catch (error) {
    console.error('Error processing Telegram message via LLM:', error)
    await ctx.reply('Sorry, I encountered an error processing your request.')
  } finally {
    if (typingInterval) clearInterval(typingInterval)
  }
})

// Handle errors gracefully to prevent crashing
telegramBot.catch((err, ctx) => {
  console.error(`Ooops, encountered an error for ${ctx.updateType}`, err)
})
