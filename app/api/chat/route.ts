import { NextRequest } from 'next/server';
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  Tool,
} from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const enc = new TextEncoder();

// Stream event helpers
function textEvent(text: string): Uint8Array {
  return enc.encode(JSON.stringify({ t: 'text', c: text }) + '\n');
}
function toolEvent(input: unknown): Uint8Array {
  return enc.encode(JSON.stringify({ t: 'tool', d: input }) + '\n');
}

// 1. THE TOOLS
const TOOLS: Tool[] = [
  {
    toolSpec: {
      name: 'web_search',
      description: 'Search Google for VC due diligence. Use specific keywords like "founders", "lawsuit", "equity dispute", "investor updates", or include the company\'s current AND former names to avoid getting consumer product reviews.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The Google search query.' },
          },
          required: ['query'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'update_section_data',
      description: 'Call this tool to silently push new JSON data to the application state when the user asks for a change.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            updated_json: {
              type: 'string',
              description: 'The stringified JSON object for the updated section. Must match the existing structure perfectly.',
            },
            summary_of_changes: {
              type: 'string',
              description: 'One short sentence explaining what was changed.',
            },
          },
          required: ['updated_json', 'summary_of_changes'],
        },
      },
    },
  },
];

// 2. SERVER-SIDE SEARCH FUNCTION (You.com)
// Ensure YOU_API_KEY is in your .env.local
async function executeWebSearch(query: string): Promise<string> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.error('❌ SERPER_API_KEY is missing!');
    return 'Search failed: API key is missing.';
  }
  
  console.log(`🔍 Executing Google search for: "${query}"`);
  
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      // Ask Google for the top 4 organic results
      body: JSON.stringify({ q: query, num: 4 }) 
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ Serper Error (${res.status}):`, errText);
      return `Search failed with status ${res.status}.`;
    }
    
    const data = await res.json();
    console.log(`✅ Search successful. Found ${data.organic?.length || 0} results.`);
    
    // Parse Google's organic search results into a clean string for Nova Pro
    return (data.organic || [])
      .map((r: any) => `${r.title}\n${r.snippet}\nSource: ${r.link}`)
      .join('\n\n---\n\n');
  } catch (error: any) {
    console.error('❌ Fetch error:', error);
    return 'Search failed due to a network error.';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, sectionName, sectionData, companyName } = await req.json();

    const systemPrompt = `You are an expert VC due diligence co-pilot reviewing the "${sectionName}" section for the startup "${companyName}".
CURRENT SECTION DATA:
${JSON.stringify(sectionData, null, 2)}

CRITICAL RULES:
1. Speak directly to the user. Do not roleplay or output "Action: ..." tags.
2. DO NOT output <thinking> tags or narrate your internal reasoning process. Just provide the final answer.
3. If the user asks you to verify or find information, use the 'web_search' tool. 
4. SMART SEARCHING: When searching for "concerns" or "red flags", focus strictly on founder history, legal issues, or equity. Ignore consumer product reviews. If the company pivoted or changed names, use both names to find the history.
5. If the user asks you to update the section, or if you find new data that answers their question, use the 'update_section_data' tool to push the changes. 
6. Never output raw JSON in your conversational text.`;

    let bedrockMessages = messages.map((m: any) => ({
      role: m.role,
      content: [{ text: m.content }],
    }));

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 3. THE MULTI-TURN AGENT LOOP
          while (true) {
            const command = new ConverseStreamCommand({
              modelId: 'us.amazon.nova-pro-v1:0',
              messages: bedrockMessages,
              system: [{ text: systemPrompt }],
              toolConfig: { tools: TOOLS },
              inferenceConfig: { maxTokens: 2048, temperature: 0.1 },
            });

            const response = await bedrock.send(command);
            if (!response.stream) throw new Error('No stream returned');
            
            const bedrockStream = response.stream;
            
            let stopReason = 'end_turn';
            const pendingTools = new Map();
            const completedTools = [];
            const assistantContent: any[] = [];
            let currentTextBuffer = '';

            // Read the stream
            for await (const chunk of bedrockStream) {
              if (chunk.contentBlockStart?.start?.toolUse) {
                const { toolUseId, name } = chunk.contentBlockStart.start.toolUse;
                pendingTools.set(chunk.contentBlockStart.contentBlockIndex, { toolUseId, name, input: '' });
              }

              if (chunk.contentBlockDelta?.delta?.text) {
                controller.enqueue(textEvent(chunk.contentBlockDelta.delta.text));
                currentTextBuffer += chunk.contentBlockDelta.delta.text;
              }

              if (chunk.contentBlockDelta?.delta?.toolUse?.input !== undefined) {
                const tool = pendingTools.get(chunk.contentBlockDelta.contentBlockIndex);
                if (tool) tool.input += chunk.contentBlockDelta.delta.toolUse.input;
              }

              if (chunk.contentBlockStop) {
                const tool = pendingTools.get(chunk.contentBlockStop.contentBlockIndex);
                if (tool) {
                  completedTools.push(tool);
                  pendingTools.delete(chunk.contentBlockStop.contentBlockIndex);

                  // If it's the UI update tool, stream the event to the frontend instantly
                  if (tool.name === 'update_section_data') {
                    try {
                      controller.enqueue(toolEvent(JSON.parse(tool.input)));
                    } catch {
                      controller.enqueue(toolEvent({ raw: tool.input }));
                    }
                  }

                  // Record what the assistant did for the loop history
                  assistantContent.push({
                    toolUse: { toolUseId: tool.toolUseId, name: tool.name, input: JSON.parse(tool.input || '{}') }
                  });
                } else if (currentTextBuffer) {
                  assistantContent.push({ text: currentTextBuffer });
                  currentTextBuffer = '';
                }
              }

              if (chunk.messageStop) {
                stopReason = chunk.messageStop.stopReason ?? 'end_turn';
              }
            }

            // 4. LOOP DECISION LOGIC
            // If the model didn't call any tools, we are done. Break the loop and close stream.
            if (stopReason !== 'tool_use' || completedTools.length === 0) break;

            // If the ONLY tool called was updating the UI, we are done. Break the loop.
            const onlyClientTools = completedTools.every((t) => t.name === 'update_section_data');
            if (onlyClientTools) break;

            // 5. SERVER-SIDE EXECUTION
            // If the model called web_search, execute it here with You.com, append results, and let the loop run again!
            const toolResults = await Promise.all(
              completedTools.map(async (tool) => {
                if (tool.name === 'web_search') {
                  const query = JSON.parse(tool.input).query ?? '';
                  const results = await executeWebSearch(query);
                  return { toolResult: { toolUseId: tool.toolUseId, content: [{ text: results }] } };
                }
                // Just acknowledge the update tool so the model knows it worked
                return { toolResult: { toolUseId: tool.toolUseId, content: [{ text: 'Section update sent to client.' }] } };
              })
            );

            // Append the Assistant's tool calls AND the Server's tool results to the history
            bedrockMessages = [
              ...bedrockMessages,
              { role: 'assistant', content: assistantContent },
              { role: 'user', content: toolResults },
            ];
            
            // The while loop restarts, sending the history back to Bedrock!
          }

          controller.close();
        } catch (err) {
          console.error('Stream processing error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}