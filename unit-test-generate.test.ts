import { generateText } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'

// AI SDK docs: testing helpers (MockLanguageModelV3)
// https://ai-sdk.dev/docs/ai-sdk-core/testing
const mockModel = new MockLanguageModelV3({
  doGenerate: async ({ prompt }) => {
    console.log(prompt)
    return {
      content: [{ type: 'text', text: `the prompt was ${prompt[0]?.content[0].text}` }],
      finishReason: { unified: 'stop', raw: undefined },
      usage: {
        inputTokens: {
          total: 10,
          noCache: 10,
          cacheRead: undefined,
          cacheWrite: undefined,
        },
        outputTokens: {
          total: 69,
          text: 69,
          reasoning: undefined,
        },
      },
      warnings: [],
    }
  },
})

describe('unit-test-generate', () => {
  it('should generate text', async () => {
    const result = await generateText({
      model: mockModel,
      prompt: 'Hello, test!',
    })
    expect(result.text).toBe('the prompt was Hello, test!')
  })
})
