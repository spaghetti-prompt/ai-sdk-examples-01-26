import { generateText, stepCountIs, tool } from 'ai'
import z from 'zod'

async function main() {
  // AI SDK docs: generateText lifecycle hooks + tool helper
  // https://ai-sdk.dev/docs/reference/ai-sdk-core/generatetext
  // https://ai-sdk.dev/docs/reference/ai-sdk-core/tool
  const result = await generateText({
    tools: {
      findOrders: tool({
        inputSchema: z.object({
          userId: z.string(),
          limit: z.number().default(3),
        }),
        execute: () => {
          return [
            { id: '1234', product: 'Chair' },
            { id: '6789', product: 'Table' },
          ]
        },
        onInputStart: () => {
          console.log('Tool call starting')
        },
        onInputDelta: ({ inputTextDelta }) => {
          console.log('Received input chunk:', inputTextDelta)
        },
        onInputAvailable: ({ input }) => {
          console.log('Complete input:', input)
        },
      }),
    },
    model: 'openai/gpt-4o-mini',
    prompt: `get orders user 1234`,

    prepareStep: ({ model, stepNumber, steps, messages }) => {
      console.log('[prepareStep]', {
        model: typeof model === 'string' ? model : model,
        stepNumber,
        stepsCount: steps.length,
        messagesCount: messages.length,
      })
      return {} // Return empty to use default settings
    },
    onStepFinish: ({ toolCalls, toolResults, finishReason, usage, text }) => {
      console.log(
        '[onStepFinish]',
        JSON.stringify(
          {
            text: text?.slice(0, 80),
            toolCalls,
            toolResults,
            finishReason,
            usage,
          },
          null,
          2
        )
      )
    },
    onFinish: ({ text, finishReason, usage, response }) => {
      console.log(
        '[onFinish]',
        JSON.stringify(
          {
            text: text.slice(0, 80) + '...',
            finishReason,
            usage,
            responseId: response.id,
          },
          null,
          2
        )
      )
    },
    stopWhen: stepCountIs(10),
  })

  // Use fullStream to log ALL granular events
  // console.log('\n=== fullStream events ===\n')
  // for await (const event of result.fullStream) {
  //   switch (event.type) {
  //     case 'start':
  //       console.log('[stream:start]')
  //       break
  //     case 'start-step':
  //       console.log('[stream:start-step]', { warnings: event.warnings })
  //       break
  //     case 'text-start':
  //       console.log('[stream:text-start]', { id: event.id })
  //       break
  //     case 'text-delta':
  //       process.stdout.write(event.text)
  //       break
  //     case 'text-end':
  //       console.log('\n[stream:text-end]', { id: event.id })
  //       break
  //     case 'reasoning-start':
  //       console.log('[stream:reasoning-start]', { id: event.id })
  //       break
  //     case 'reasoning-delta':
  //       console.log('[stream:reasoning-delta]', { text: event.text })
  //       break
  //     case 'reasoning-end':
  //       console.log('[stream:reasoning-end]', { id: event.id })
  //       break
  //     case 'tool-call':
  //       console.log('\n[stream:tool-call]', {
  //         toolName: event.toolName,
  //         toolCallId: event.toolCallId,
  //         input: event.input,
  //       })
  //       break
  //     case 'tool-result':
  //       console.log('[stream:tool-result]', {
  //         toolName: event.toolName,
  //         toolCallId: event.toolCallId,
  //         output: JSON.stringify(event.output).slice(0, 200) + '...',
  //       })
  //       break
  //     case 'tool-error':
  //       console.error('[stream:tool-error]', {
  //         toolName: event.toolName,
  //         toolCallId: event.toolCallId,
  //         error: event.error,
  //       })
  //       break
  //     case 'source':
  //       console.log('[stream:source]', {
  //         sourceType: event.sourceType,
  //         id: event.id,
  //         url: 'url' in event ? event.url : undefined,
  //         title: 'title' in event ? event.title : undefined,
  //       })
  //       break
  //     case 'finish-step':
  //       console.log('\n[stream:finish-step]', {
  //         finishReason: event.finishReason,
  //         usage: event.usage,
  //       })
  //       break
  //     case 'finish':
  //       console.log('[stream:finish]', {
  //         finishReason: event.finishReason,
  //         totalUsage: event.totalUsage,
  //       })
  //       break
  //     case 'error':
  //       console.error('[stream:error]', event.error)
  //       break
  //     default:
  //       console.log(`[stream:${(event as any).type}]`, event)
  //   }
  // }
  console.log('\n')
}

main().catch(console.error)
