import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

async function main() {
  // AI SDK docs: streamText + OpenAI web search tool
  // https://ai-sdk.dev/docs/reference/ai-sdk-core/streamtext
  // https://ai-sdk.dev/providers/ai-sdk-providers/openai
  const result = streamText({
    tools: {
      webSearch: openai.tools.webSearch(),
    },
    model: 'openai/gpt-4o-mini',
    prompt: `find the official documentation for the Vercel AI SDK`,
  })

  console.log('Streaming response:\n')
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk)
  }
  console.log('\n')
}

main().catch(console.error)
