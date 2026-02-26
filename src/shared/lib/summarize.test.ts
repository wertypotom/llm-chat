/**
 * Unit tests for map-reduce summarization logic.
 * We mock the LLM (generateText) and LlamaIndex (SentenceSplitter)
 * to keep tests fast and deterministic.
 */

// --- Mocks ---
jest.mock('ai', () => ({
  generateText: jest.fn(),
}))

jest.mock('llamaindex', () => ({
  SentenceSplitter: jest.fn().mockImplementation(() => ({
    splitText: (text: string) => {
      // Return 2 fixed chunks for testing
      const mid = Math.floor(text.length / 2)
      return [text.slice(0, mid), text.slice(mid)]
    },
  })),
}))

jest.mock('@/shared/lib/llm', () => ({
  llmProvider: jest.fn().mockReturnValue('mock-model'),
}))

jest.mock('@/shared/lib/models', () => ({
  DEFAULT_MODEL_ID: 'route-llm',
}))

import { generateText } from 'ai'
import { summarizeDocument } from '@/shared/lib/summarize'

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>

describe('summarizeDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws on empty input', async () => {
    await expect(summarizeDocument('')).rejects.toThrow('empty input')
    await expect(summarizeDocument('   ')).rejects.toThrow('empty input')
  })

  it('single chunk: calls generateText once (skips reduce)', async () => {
    // Override SentenceSplitter to return a single chunk for this test
    const { SentenceSplitter } = await import('llamaindex')
    jest
      .mocked(SentenceSplitter)
      .mockImplementationOnce(() => ({ splitText: () => ['Only one chunk here'] }) as never)

    mockGenerateText.mockResolvedValueOnce({ text: 'Summary of single chunk' } as Awaited<
      ReturnType<typeof generateText>
    >)

    const result = await summarizeDocument('Only one chunk here')

    expect(mockGenerateText).toHaveBeenCalledTimes(1)
    expect(result).toBe('Summary of single chunk')
  })

  it('multi-chunk: calls generateText N+1 times (N map + 1 reduce)', async () => {
    // Splitter returns 2 chunks (default mock)
    mockGenerateText
      .mockResolvedValueOnce({ text: '• Chunk 1 summary' } as Awaited<
        ReturnType<typeof generateText>
      >)
      .mockResolvedValueOnce({ text: '• Chunk 2 summary' } as Awaited<
        ReturnType<typeof generateText>
      >)
      .mockResolvedValueOnce({ text: 'Final merged summary' } as Awaited<
        ReturnType<typeof generateText>
      >)

    const result = await summarizeDocument('A'.repeat(200))

    // 2 map calls + 1 reduce call = 3 total
    expect(mockGenerateText).toHaveBeenCalledTimes(3)
    expect(result).toBe('Final merged summary')
  })

  it('reduce prompt contains all chunk summaries', async () => {
    mockGenerateText
      .mockResolvedValueOnce({ text: 'Sum A' } as Awaited<ReturnType<typeof generateText>>)
      .mockResolvedValueOnce({ text: 'Sum B' } as Awaited<ReturnType<typeof generateText>>)
      .mockResolvedValueOnce({ text: 'Final' } as Awaited<ReturnType<typeof generateText>>)

    await summarizeDocument('A'.repeat(200))

    const reduceCall = mockGenerateText.mock.calls[2][0]
    expect(reduceCall.prompt).toContain('Sum A')
    expect(reduceCall.prompt).toContain('Sum B')
  })
})
