import type { ModelMessage } from "ai";
import { streamText } from "ai";
import { model } from "../../../models"; 

export const maxDuration = 60; 

export async function POST(request: Request) {
    const body = (await request.json()) as {
        messages: Array<ModelMessage>;
    };
    
    const { messages } = body;
    
    const result = streamText({
        model,
        messages,
    });
    
    return result.toTextStreamResponse();
}