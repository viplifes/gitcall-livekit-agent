import { AgentDispatchClient } from 'livekit-server-sdk';
import * as openai from '@livekit/agents-plugin-openai';
import { JobRequest} from '@livekit/agents';
import { fileURLToPath } from 'node:url';
import { type JobContext, WorkerOptions, cli, defineAgent, llm, multimodal } from '@livekit/agents';
import { z } from 'zod';

let OPENAI_API_KEY;
// init agent
export function initAgent(url: string, key: string, secret: string, agentName: string){
    cli.runApp(new WorkerOptions({
        wsURL: url,
        apiKey: key,
        apiSecret: secret,
        agentName: agentName,
        agent: fileURLToPath(import.meta.url),
        requestFunc: async (req) => {
        // accept the job request
        await req.accept(
            agentName, // name
            '', // identity
            '', // metadata
            {}
        );
        },
    }));
}

// connect to room
export async function createExplicitDispatch(url, key, secret, agentName, roomName) {
  const agentDispatchClient = new AgentDispatchClient(url, key, secret);
  // create a dispatch request for an agent named "test-agent" to join "my-room"
  const dispatch = await agentDispatchClient.createDispatch(roomName, agentName, {
    metadata: 'my_job_metadata',
  });
  const dispatches = await agentDispatchClient.listDispatch(roomName);
  console.log(`there are ${dispatches.length} dispatches in ${roomName}`);
}


// agent
export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();

    console.log('waiting for participant');
    const participant = await ctx.waitForParticipant();
    console.log(`starting assistant example agent for ${participant.identity}`);

    let model: openai.realtime.RealtimeModel;
    model = new openai.realtime.RealtimeModel({
      apiKey: OPENAI_API_KEY,
      instructions: 'You are a helpful assistant.',
    });

    const fncCtx: llm.FunctionContext = {
      weather: {
        description: 'Get the weather in a location',
        parameters: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          console.debug(`executing weather function for ${location}`);
          const response = await fetch(`https://wttr.in/${location}?format=%C+%t`);
          if (!response.ok) {
            throw new Error(`Weather API returned status: ${response.status}`);
          }
          const weather = await response.text();
          return `The weather in ${location} right now is ${weather}.`;
        },
      },
    };

    const agent = new multimodal.MultimodalAgent({
      model,
      fncCtx,
    });

    const session = await agent
      .start(ctx.room, participant)
      .then((session) => session as openai.realtime.RealtimeSession);

    session.conversation.item.create(
      llm.ChatMessage.create({
        role: llm.ChatRole.USER,
        text: 'Say "How can I help you today?"',
      }),
    );
    session.response.create();
  },
});