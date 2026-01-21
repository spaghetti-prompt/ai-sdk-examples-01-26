import { createMCPClient } from '@ai-sdk/mcp'
import { stepCountIs, streamText } from 'ai'

// AI SDK docs: MCP client + tool bridging
// https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools
const mcpClient = await createMCPClient({
  transport: {
    type: 'http',
    url: 'https://seolinkmap.com/mcp',
  },
})
const tools = await mcpClient.tools()

const result = streamText({
  model: 'openai/o4-mini',
  tools,
  prompt: 'what tools are available? return only the names',
  onFinish: async () => {
    await mcpClient.close()
  },
  stopWhen: stepCountIs(100),
})

for await (const chunk of result.textStream) {
  process.stdout.write(chunk)
}
