/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { tool, jsonSchema } from 'ai'

let mcpClientInstance: Client | null = null

export async function getZapierMCPClient(): Promise<Client> {
  if (mcpClientInstance) {
    return mcpClientInstance
  }

  const url = process.env.MCP_ZAPIER_URL
  if (!url) {
    throw new Error('MCP_ZAPIER_URL is not defined in environment variables')
  }

  const client = new Client({ name: 'zapier-mcp', version: '1.0.0' }, { capabilities: {} })
  const transport = new SSEClientTransport(new URL(url))
  await client.connect(transport)

  mcpClientInstance = client
  return client
}

export async function getAI_SDKTools(client: Client) {
  const { tools: mcpTools } = await client.listTools()
  const aiTools: Record<string, any> = {}

  for (const mcpTool of mcpTools) {
    // Note: mcp tool names might contain dashes which are fine as keys
    aiTools[mcpTool.name] = tool({
      description: mcpTool.description || '',
      parameters: jsonSchema(mcpTool.inputSchema as any) as any,
      execute: async (args: any) => {
        try {
          const result = await client.callTool({
            name: mcpTool.name,
            arguments: args as any,
          })
          return result.content
        } catch (error) {
          console.error(`Error executing tool ${mcpTool.name}:`, error)
          return [{ type: 'text', text: `Tool execution failed: ${String(error)}` }]
        }
      },
    } as any)
  }

  return aiTools
}
