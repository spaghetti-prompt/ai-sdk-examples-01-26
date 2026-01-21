# websearch-demo

Small, focused examples for the Vercel AI SDK: web search, tool calling, stop conditions, MCP tools, evals, and tests.

## Quick start

```bash
pnpm install
cp .env.example .env
```

Set `OPENAI_API_KEY` in `.env`, then run any example:

```bash
pnpm run example:web-search
```

## Examples

- Web search + streaming: `web-search.ts` (`pnpm run example:web-search`)
- Tool-call debugging hooks: `web-search.debug.ts` (`pnpm run example:web-search:debug`)
- Custom `stopWhen`: `stop-when.ts` (`pnpm run example:stop-when`)
- Stop on tool call: `stop-when-tool-call.ts` (`pnpm run example:stop-when-tool-call`)
- MCP tools over HTTP: `mcp.ts` (`pnpm run example:mcp`)
- Structured output + eval loop: `eval.ts` (`pnpm run example:eval`)
- Tests: `unit-test-*.ts` (`pnpm run test`)

## AI SDK docs (explainers)

- `streamText`: https://ai-sdk.dev/docs/reference/ai-sdk-core/streamtext
- `generateText`: https://ai-sdk.dev/docs/reference/ai-sdk-core/generatetext
- Tools + tool calling: https://ai-sdk.dev/docs/reference/ai-sdk-core/tool
- Tool-call stopping + control flow: https://ai-sdk.dev/docs/ai-sdk-core/tool-calling
- Structured outputs: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
- Testing helpers: https://ai-sdk.dev/docs/ai-sdk-core/testing
- MCP tools + client: https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools
- OpenAI provider + web search tool: https://ai-sdk.dev/providers/ai-sdk-providers/openai
