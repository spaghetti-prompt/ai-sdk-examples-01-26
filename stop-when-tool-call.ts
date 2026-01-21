import { generateText, hasToolCall, stepCountIs, streamText, tool } from 'ai'
import z from 'zod'

async function main() {
  const result = await generateText({
    tools: {
      findOrders: tool({
        inputSchema: z.object({
          userId: z.string(),
          limit: z.number().default(3),
        }),
      }),
      // No execute handler: this example stops at the tool call.
    },
    model: 'openai/gpt-4o-mini',
    prompt: `get orders user 1234`,

    // generate the call request but “give me control back” instead of executing
    // AI SDK docs: hasToolCall + stopWhen
    // https://ai-sdk.dev/docs/reference/ai-sdk-core/hastoolcall
    stopWhen: hasToolCall('findOrders'),
  })

  console.log(result.text)
  console.log(result.toolCalls)
}

main().catch(console.error)
