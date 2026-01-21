import { generateText, tool } from 'ai'
import z from 'zod'

async function main() {
  const result = await generateText({
    tools: {
      findOrders: tool({
        inputSchema: z.object({
          userId: z.string(),
          limit: z.number().default(3),
        }),
        execute: () => {
          console.log('Executing tool call')
          const orders = [
            { id: '1234', product: 'Chair' },
            { id: '6789', product: 'Table' },
          ]
          // Return a random order to demonstrate retries across steps.
          return [orders[Math.random() > 0.9 ? 0 : 1]]
        },
      }),
    },
    model: 'openai/gpt-4o-mini',
    prompt: `find the order 1234 for user 1111; keep trying until it is found`,

    // AI SDK docs: stopWhen + tool-calling control flow
    // https://ai-sdk.dev/docs/ai-sdk-core/tool-calling
    stopWhen: [
      ({ steps }) => {
        const lastStep = steps.at(-1)
        if (!lastStep) return false

        const contains = lastStep.text.toLowerCase().includes('chair')
        console.log(`[textContains] Looking for "chair", found: ${contains}`)
        return contains
      },
    ],
  })

  console.log(result.text)
  console.log(result.toolCalls)
  console.log(result.finishReason)
  console.log(result.rawFinishReason)
}

main().catch(console.error)
