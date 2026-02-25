import { z } from 'zod'

const envSchema = z.object({
  ABACUS_API_KEY: z.string().min(1),
  ABACUS_BASE_URL: z.string().url().default('https://routellm.abacus.ai/v1'),
  MCP_ZAPIER_URL: z.string().url(),
  ELEVENLABS_API_KEY: z.string().min(1),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Missing or invalid environment variables: ${missing}`)
  }
  return result.data
}

// Validated once at module load — crashes fast if misconfigured
export const env = validateEnv()
