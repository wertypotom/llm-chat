import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { tool, jsonSchema } from 'ai'
import type { JSONSchema7 } from 'json-schema'

type AITool = ReturnType<typeof tool<Record<string, unknown>, unknown>>

interface MCPToolMeta {
  name: string
  description: string
  schema: JSONSchema7
}

let mcpClientInstance: Client | null = null
// Cache only the metadata (schemas) — execute functions are created per-request
let mcpToolsMetaCache: MCPToolMeta[] | null = null

export async function getZapierMCPClient(): Promise<Client> {
  if (mcpClientInstance) return mcpClientInstance

  const url = process.env.MCP_ZAPIER_URL
  if (!url) throw new Error('MCP_ZAPIER_URL is not defined in environment variables')

  const client = new Client({ name: 'zapier-mcp', version: '1.0.0' }, { capabilities: {} })
  const transport = new StreamableHTTPClientTransport(new URL(url))
  await client.connect(transport)

  mcpClientInstance = client
  return client
}

async function getMCPToolsMeta(client: Client): Promise<MCPToolMeta[]> {
  if (mcpToolsMetaCache) return mcpToolsMetaCache

  const { tools: mcpTools } = await client.listTools()

  mcpToolsMetaCache = mcpTools.map((mcpTool) => {
    const raw = mcpTool.inputSchema as Record<string, unknown>
    console.log(`[MCP] tool="${mcpTool.name}" inputSchema=`, JSON.stringify(raw))

    const props = (raw?.['properties'] ?? {}) as Record<string, JSONSchema7>

    // Add description to instructions so model knows what to put there
    if ('instructions' in props && !props['instructions'].description) {
      props['instructions'] = {
        ...props['instructions'],
        description:
          'REQUIRED. Natural language description of the full action to perform, including spreadsheet name, worksheet, and exact data values.',
      }
    }

    return {
      name: mcpTool.name,
      description: mcpTool.description || '',
      schema: {
        type: 'object',
        properties: props,
        ...(Array.isArray(raw?.['required']) ? { required: raw['required'] as string[] } : {}),
      },
    }
  })

  return mcpToolsMetaCache
}

/**
 * Build AI SDK tools per-request so execute functions have access to the
 * user's last message — used to construct meaningful Zapier instructions
 * when the model fails to provide them.
 */
export async function getAI_SDKTools(
  client: Client,
  userIntent: string,
): Promise<Record<string, AITool>> {
  const toolsMeta = await getMCPToolsMeta(client)
  const aiTools: Record<string, AITool> = {}

  for (const meta of toolsMeta) {
    aiTools[meta.name] = tool({
      description: meta.description,
      parameters: jsonSchema(meta.schema),
      execute: async (args: unknown) => {
        try {
          const argsObj = (args ?? {}) as Record<string, unknown>

          // Zapier requires `instructions`. If model omitted it, use the
          // user's actual message as context — far more useful than a generic fallback.
          if (!argsObj['instructions']) {
            argsObj['instructions'] = userIntent
              ? `User request: "${userIntent}". Action: ${meta.name}.`
              : `Execute ${meta.name} with parameters: ${JSON.stringify(argsObj)}`
          }

          console.log(`[MCP] calling tool="${meta.name}" args=`, JSON.stringify(argsObj))
          const result = await client.callTool({ name: meta.name, arguments: argsObj })
          console.log(`[MCP] tool="${meta.name}" result=`, JSON.stringify(result.content))
          return result.content
        } catch (error) {
          console.error(`[MCP] tool="${meta.name}" FAILED:`, error)
          return [{ type: 'text', text: `Tool execution failed: ${String(error)}` }]
        }
      },
    } as unknown as AITool)
  }

  return aiTools
}
