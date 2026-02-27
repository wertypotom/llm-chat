/**
 * Unit tests for multi-agent orchestration loop.
 * Mocks generateText to verify Researcher→Reviewer→Responder flow.
 */

jest.mock('ai', () => ({
  generateText: jest.fn(),
}))

jest.mock('@/shared/lib/llm', () => ({
  llmProvider: jest.fn().mockReturnValue('mock-model'),
}))

jest.mock('@/shared/lib/models', () => ({
  DEFAULT_MODEL_ID: 'route-llm',
}))

import { generateText } from 'ai'
import { runMultiAgent } from '@/shared/lib/multi-agent'

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>

// Helper to create a mock resolved value
const mockResult = (text: string) => ({ text }) as Awaited<ReturnType<typeof generateText>>

describe('runMultiAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws on empty query', async () => {
    await expect(runMultiAgent('')).rejects.toThrow('empty query')
    await expect(runMultiAgent('   ')).rejects.toThrow('empty query')
  })

  it('happy path: 3 calls (researcher → reviewer → responder)', async () => {
    mockGenerateText
      .mockResolvedValueOnce(mockResult('Research: microservices are distributed'))
      .mockResolvedValueOnce(mockResult('Good coverage. APPROVED'))
      .mockResolvedValueOnce(mockResult('Final: Microservices pros and cons...'))

    const result = await runMultiAgent('What are microservices?')

    expect(mockGenerateText).toHaveBeenCalledTimes(3)
    expect(result.finalAnswer).toBe('Final: Microservices pros and cons...')
    expect(result.agentMessages).toHaveLength(3)
    expect(result.agentMessages[0].role).toBe('researcher')
    expect(result.agentMessages[1].role).toBe('reviewer')
    expect(result.agentMessages[2].role).toBe('responder')
  })

  it('reviewer REVISE triggers re-research (4 calls total before respond)', async () => {
    mockGenerateText
      .mockResolvedValueOnce(mockResult('Initial research'))
      .mockResolvedValueOnce(mockResult('REVISE: Missing performance data'))
      .mockResolvedValueOnce(mockResult('Improved research with perf data'))
      .mockResolvedValueOnce(mockResult('Looks good. APPROVED'))
      .mockResolvedValueOnce(mockResult('Final comprehensive answer'))

    const result = await runMultiAgent('Compare REST vs GraphQL')

    expect(mockGenerateText).toHaveBeenCalledTimes(5)
    expect(result.agentMessages).toHaveLength(5)
    // researcher, reviewer (revise), researcher (retry), reviewer (approve), responder
    expect(result.agentMessages.map((m) => m.role)).toEqual([
      'researcher',
      'reviewer',
      'researcher',
      'reviewer',
      'responder',
    ])
    expect(result.finalAnswer).toBe('Final comprehensive answer')
  })

  it('caps revisions at MAX_REVISIONS (2) and proceeds', async () => {
    mockGenerateText
      .mockResolvedValueOnce(mockResult('Research v1'))
      .mockResolvedValueOnce(mockResult('REVISE: needs more'))
      .mockResolvedValueOnce(mockResult('Research v2'))
      .mockResolvedValueOnce(mockResult('REVISE: still not enough'))
      .mockResolvedValueOnce(mockResult('Research v3'))
      .mockResolvedValueOnce(mockResult('REVISE: one more time'))
      // Should stop here (max 2 revisions = 3 research attempts), proceed to responder
      .mockResolvedValueOnce(mockResult('Final answer despite imperfect research'))

    const result = await runMultiAgent('Complex topic')

    // 3 research + 3 review + 1 respond = 7 calls
    expect(mockGenerateText).toHaveBeenCalledTimes(7)
    expect(result.finalAnswer).toBe('Final answer despite imperfect research')
  })

  it('passes correct model to llmProvider', async () => {
    const { llmProvider } = await import('@/shared/lib/llm')
    const mockProvider = llmProvider as jest.MockedFunction<typeof llmProvider>

    mockGenerateText
      .mockResolvedValueOnce(mockResult('research'))
      .mockResolvedValueOnce(mockResult('APPROVED'))
      .mockResolvedValueOnce(mockResult('final'))

    await runMultiAgent('test query', 'gpt-4o')

    // All 3 calls should use 'gpt-4o'
    expect(mockProvider).toHaveBeenCalledWith('gpt-4o')
    expect(mockProvider).toHaveBeenCalledTimes(3)
  })
})
