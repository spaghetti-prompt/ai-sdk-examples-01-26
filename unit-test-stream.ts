import { streamText, simulateReadableStream } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'

// AI SDK docs: testing helpers + simulated streams
// https://ai-sdk.dev/docs/ai-sdk-core/testing
function generateTextChunks(count: number) {
  const chunks: Array<
    { type: 'text-start'; id: string } | { type: 'text-delta'; id: string; delta: string } | { type: 'text-end'; id: string }
  > = []

  for (let i = 0; i < count; i++) {
    const id = `text-${i + 1}`
    chunks.push(
      { type: 'text-start', id },
      { type: 'text-delta', id, delta: `Some ${i}` },
      { type: 'text-delta', id, delta: ` text ${i}` },
      { type: 'text-delta', id, delta: ` with ${i}` },
      { type: 'text-delta', id, delta: ` some ${i}` },
      { type: 'text-delta', id, delta: ` numbers ${i}` },
      { type: 'text-delta', id, delta: ` and ${i}` },
      { type: 'text-delta', id, delta: ` some ${i}` },
      { type: 'text-delta', id, delta: ` letters ${i}` },
      { type: 'text-end', id }
    )
  }

  return chunks
}

const result = streamText({
  model: new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          ...generateTextChunks(100),
          {
            type: 'finish',
            finishReason: { unified: 'stop', raw: undefined },
            logprobs: undefined,
            usage: {
              inputTokens: {
                total: 3,
                noCache: 3,
                cacheRead: undefined,
                cacheWrite: undefined,
              },
              outputTokens: {
                total: 10,
                text: 10,
                reasoning: undefined,
              },
            },
          },
        ],
      }),
    }),
  }),
  prompt: 'Hello, test!',
})

for await (const chunk of result.textStream) {
  process.stdout.write(chunk)
}
