import { describe, it, expect } from 'vitest'
import { generateText, stepCountIs } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { z } from 'zod'

// AI SDK docs: testing helpers (MockLanguageModelV3)
// https://ai-sdk.dev/docs/ai-sdk-core/testing
const testUsage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
}

const dummyResponseValues = {
  finishReason: { unified: 'stop', raw: 'stop' } as const,
  usage: testUsage,
  warnings: [],
}

describe('tool calling', () => {
  it('should call a tool and return the result', async () => {
    const mockModel = new MockLanguageModelV3({
      doGenerate: async () => ({
        ...dummyResponseValues,
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call-1',
            toolName: 'getWeather',
            input: JSON.stringify({ city: 'San Francisco' }),
          },
        ],
        finishReason: { unified: 'tool-calls', raw: undefined },
      }),
    })

    const result = await generateText({
      model: mockModel,
      prompt: 'What is the weather in San Francisco?',
      tools: {
        getWeather: {
          description: 'Get the weather for a city',
          parameters: z.object({
            city: z.string().describe('The city to get weather for'),
          }),
          execute: async ({ city }) => {
            return { temperature: 72, condition: 'sunny', city }
          },
        },
      },
    })

    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls[0]).toMatchObject({
      toolName: 'getWeather',
      input: { city: 'San Francisco' },
    })
    expect(result.toolResults).toHaveLength(1)
    expect(result.toolResults[0].output).toEqual({
      temperature: 72,
      condition: 'sunny',
      city: 'San Francisco',
    })
  })

  it('should handle multiple tool calls', async () => {
    const mockModel = new MockLanguageModelV3({
      doGenerate: async () => ({
        ...dummyResponseValues,
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call-1',
            toolName: 'add',
            input: JSON.stringify({ a: 5, b: 3 }),
          },
          {
            type: 'tool-call',
            toolCallId: 'call-2',
            toolName: 'multiply',
            input: JSON.stringify({ a: 4, b: 7 }),
          },
        ],
        finishReason: { unified: 'tool-calls', raw: undefined },
      }),
    })

    const result = await generateText({
      model: mockModel,
      prompt: 'Calculate 5+3 and 4*7',
      tools: {
        add: {
          description: 'Add two numbers',
          parameters: z.object({
            a: z.number(),
            b: z.number(),
          }),
          execute: async ({ a, b }) => ({ result: a + b }),
        },
        multiply: {
          description: 'Multiply two numbers',
          parameters: z.object({
            a: z.number(),
            b: z.number(),
          }),
          execute: async ({ a, b }) => ({ result: a * b }),
        },
      },
    })

    expect(result.toolCalls).toHaveLength(2)
    expect(result.toolResults).toHaveLength(2)
    expect(result.toolResults[0].output).toEqual({ result: 8 })
    expect(result.toolResults[1].output).toEqual({ result: 28 })
  })

  it('should handle text response after tool call with multi-step', async () => {
    let callCount = 0

    const mockModel = new MockLanguageModelV3({
      doGenerate: async () => {
        callCount++
        if (callCount === 1) {
          // First call: model decides to use a tool
          return {
            ...dummyResponseValues,
            content: [
              {
                type: 'tool-call',
                toolCallId: 'call-1',
                toolName: 'getWeather',
                input: JSON.stringify({ city: 'Tokyo' }),
              },
            ],
            finishReason: { unified: 'tool-calls', raw: undefined },
            response: {
              id: 'test-id-1',
              timestamp: new Date(0),
              modelId: 'test-model',
            },
          }
        }
        // Second call: model responds with text based on tool result
        return {
          ...dummyResponseValues,
          content: [{ type: 'text', text: 'The weather in Tokyo is 68°F and cloudy.' }],
          finishReason: { unified: 'stop', raw: undefined },
          response: {
            id: 'test-id-2',
            timestamp: new Date(1000),
            modelId: 'test-model',
          },
        }
      },
    })

    const result = await generateText({
      model: mockModel,
      prompt: 'What is the weather in Tokyo?',
      stopWhen: stepCountIs(3),
      tools: {
        getWeather: {
          description: 'Get the weather for a city',
          parameters: z.object({
            city: z.string(),
          }),
          execute: async ({ city }) => ({
            temperature: 68,
            condition: 'cloudy',
            city,
          }),
        },
      },
    })

    expect(result.text).toBe('The weather in Tokyo is 68°F and cloudy.')
    expect(result.steps).toHaveLength(2)
    expect(callCount).toBe(2)
  })

  it('should capture tool call arguments from prompt', async () => {
    let capturedPrompt: unknown

    const mockModel = new MockLanguageModelV3({
      doGenerate: async ({ prompt }) => {
        capturedPrompt = prompt
        return {
          ...dummyResponseValues,
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call-1',
              toolName: 'search',
              input: JSON.stringify({ query: 'AI testing' }),
            },
          ],
          finishReason: { unified: 'tool-calls', raw: undefined },
        }
      },
    })

    await generateText({
      model: mockModel,
      prompt: 'Search for AI testing',
      tools: {
        search: {
          description: 'Search the web',
          parameters: z.object({
            query: z.string(),
          }),
          execute: async ({ query }) => ({ results: [`Result for: ${query}`] }),
        },
      },
    })

    // Verify the prompt was captured correctly
    expect(capturedPrompt).toBeDefined()
    expect(Array.isArray(capturedPrompt)).toBe(true)
  })
})
