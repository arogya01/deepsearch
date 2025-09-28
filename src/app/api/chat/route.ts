// app/api/chat/route.ts
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    system: [
      'You are a helpful assistant.',
      'When current information is needed, use Google Search grounding and include citations.',
      'If unsure, say you do not know.',
    ].join('\n'),
    tools: {
      // Native Google Search grounding (no execute handler; runs provider-side)
      google_search: google.tools.googleSearch({}),
    },
  });

  // Send text and source parts to the UI; attach grounding metadata via message metadata
  return result.toUIMessageStreamResponse({
    sendSources: true, // streams source parts (e.g., source-url) to the client
    messageMetadata: ({ part }) => {
      // Forward provider grounding metadata from the step where it becomes available
      if (part.type === 'finish-step' && (part as any).providerMetadata?.google) {
        const gm = (part as any).providerMetadata.google.groundingMetadata ?? null;
        return { provider: 'google', groundingMetadata: gm };
      }
      if (part.type === 'finish') {
        return { provider: 'google' };
      }
    },
  });
}
