import { initAgent, createExplicitDispatch } from './agent.js';

let initAgentOk = false;

const usercode = async (taskId: string | number, data: Record<string, any>): Promise<Record<string, any>> => {
    const action = data["action"];
    
    if (action === "start") {
        const { url, key, secret, agentName, roomName, openAiApiKey } = data;
        if (openAiApiKey) {
            process.env.OPENAI_API_KEY = openAiApiKey;
        }
        
        if (!initAgentOk) {
            initAgentOk = true;
            initAgent(url!, key!, secret!, agentName!);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        createExplicitDispatch(url!, key!, secret!, agentName!, roomName!);
    } else if (action === "ping") {
        data["pong"] = "ok";
    }
    
    return data;
};

export default usercode;
