// app/api/chat/route.ts
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 30; // optional for long streams

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: convertToModelMessages(messages),
      abortSignal: req.signal,
      // Optional Gemini features:
      // providerOptions: {
      //   google: {
      //     safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }],
      //     thinkingConfig: { thinkingBudget: 4096, includeThoughts: false }, // only on supported models
      //   },
      // },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
