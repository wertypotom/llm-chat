import { generateText } from 'ai'
import { llmProvider } from './llm'
import { DEFAULT_MODEL_ID } from './models'
import type { AgentPersona, AgentMessage, OrchestrationResult } from '@/features/chat/types'

const MAX_REVISIONS = 2
const REVISION_PREFIX = 'REVISE:'

const PERSONAS: AgentPersona[] = [
  {
    id: 'researcher',
    name: 'Researcher',
    role: 'researcher',
    systemPrompt: `You are a thorough Researcher agent. Given a user query, produce a structured analysis with:
- Key facts and relevant context
- Multiple perspectives if applicable
- Data points, examples, or evidence
Be comprehensive but concise. Output in bullet points.`,
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    role: 'reviewer',
    systemPrompt: `You are a critical Reviewer agent. You receive research from another agent and must:
1. Check for factual accuracy and completeness
2. Identify gaps, biases, or unsupported claims
3. Either APPROVE the research or request a revision

If the research is good enough, reply with your critique followed by "APPROVED".
If it needs improvement, start your response EXACTLY with "REVISE:" followed by specific feedback on what to fix.`,
  },
  {
    id: 'responder',
    name: 'Responder',
    role: 'responder',
    systemPrompt: `You are the Final Responder agent. You receive:
- The original user query
- Approved research from a Researcher
- A review from a Reviewer

Synthesize everything into a clear, well-structured, user-facing answer.
Be direct and helpful. Use markdown formatting where appropriate.
Do NOT mention the internal agent process.`,
  },
]

function getPersona(role: AgentPersona['role']): AgentPersona {
  const p = PERSONAS.find((a) => a.role === role)
  if (!p) throw new Error(`Unknown agent role: ${role}`)
  return p
}

async function callAgent(persona: AgentPersona, prompt: string, modelId: string): Promise<string> {
  const { text } = await generateText({
    model: llmProvider(modelId),
    system: persona.systemPrompt,
    prompt,
  })
  return text.trim()
}

/**
 * Multi-agent orchestration loop:
 *
 *   User Query → Researcher → Reviewer → (loop if REVISE:) → Responder → Final Answer
 *
 * Max rounds: 1 research + up to MAX_REVISIONS re-research + 1 review each + 1 respond = 2–6 LLM calls
 */
export async function runMultiAgent(
  userQuery: string,
  modelId: string = DEFAULT_MODEL_ID,
): Promise<OrchestrationResult> {
  if (!userQuery?.trim()) throw new Error('runMultiAgent: empty query')

  const agentMessages: AgentMessage[] = []
  const researcher = getPersona('researcher')
  const reviewer = getPersona('reviewer')
  const responder = getPersona('responder')

  // --- Step 1: Research ---
  let researchContent = await callAgent(researcher, `User query: "${userQuery}"`, modelId)
  agentMessages.push({
    agentId: researcher.id,
    agentName: researcher.name,
    role: 'researcher',
    content: researchContent,
  })

  // --- Step 2: Review (with optional revision loop) ---
  let revisions = 0
  let reviewContent = ''

  while (revisions <= MAX_REVISIONS) {
    reviewContent = await callAgent(
      reviewer,
      `Original user query: "${userQuery}"\n\nResearch output:\n${researchContent}`,
      modelId,
    )
    agentMessages.push({
      agentId: reviewer.id,
      agentName: reviewer.name,
      role: 'reviewer',
      content: reviewContent,
    })

    if (!reviewContent.startsWith(REVISION_PREFIX)) {
      // Approved (or at least not requesting revision)
      break
    }

    if (revisions >= MAX_REVISIONS) {
      console.log('[MultiAgent] Max revisions reached, proceeding with current research')
      break
    }

    // Re-research with reviewer feedback
    const feedback = reviewContent.slice(REVISION_PREFIX.length).trim()
    console.log(`[MultiAgent] Revision ${revisions + 1} requested`)

    researchContent = await callAgent(
      researcher,
      `User query: "${userQuery}"\n\nYour previous research was reviewed and needs revision.\nReviewer feedback: ${feedback}\n\nPlease produce an improved analysis addressing the feedback.`,
      modelId,
    )
    agentMessages.push({
      agentId: researcher.id,
      agentName: researcher.name,
      role: 'researcher',
      content: researchContent,
    })

    revisions++
  }

  // --- Step 3: Final Response ---
  const finalAnswer = await callAgent(
    responder,
    `Original user query: "${userQuery}"\n\nApproved research:\n${researchContent}\n\nReviewer notes:\n${reviewContent}`,
    modelId,
  )
  agentMessages.push({
    agentId: responder.id,
    agentName: responder.name,
    role: 'responder',
    content: finalAnswer,
  })

  return { finalAnswer, agentMessages }
}
