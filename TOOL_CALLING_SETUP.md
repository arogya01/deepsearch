# AI SDK Tool Calling Setup - Fixed ✅

## Summary of Issues Found and Fixed

### 1. **Missing Multi-Step Tool Calling** ⚠️ CRITICAL

**Problem:**
Your `streamText` call was missing the `stopWhen` parameter. Without this, the AI model would:
- Call the tool
- Get the results
- **STOP immediately** without generating a response

This means users would never see a natural language answer based on the search results.

**Solution:**
```typescript
const result = streamText({
  // ... other options
  stopWhen: stepCountIs(5), // Allow up to 5 steps for tool calls + responses
  onStepFinish: async ({ toolResults, text }) => {
    // Optional: Log each step for debugging
    if (toolResults && toolResults.length > 0) {
      console.log('Step finished with tool results');
    }
  },
});
```

### 2. **Incorrect Response Stream Construction**

**Problem:**
You were using `createUIMessageStream` to manually construct a stream, which added unnecessary complexity and wasn't properly configured for tool calls.

**Solution:**
Use the built-in `toUIMessageStreamResponse()` method which handles everything automatically:
```typescript
return result.toUIMessageStreamResponse();
```

### 3. **Message Persistence Issue**

**Problem:**
The code was trying to save `response.messages` (which are `ResponseMessage[]` from AI SDK) directly to the database, but your persistence layer expects `UIMessage[]` format.

**Solution:**
Convert the final text response into a proper `UIMessage` structure:
```typescript
result.text.then(async (finalText) => {
  const assistantMessage: UIMessage = {
    id: response.id,
    role: 'assistant',
    parts: finalText ? [{ type: 'text', text: finalText }] : [],
  };
  const finishedMessages = [...allMessages, assistantMessage];
  await saveMessages(sessionId, finishedMessages);
});
```

### 4. **Frontend Type Mismatches**

**Problem:**
- Frontend expected custom part type `"tool-searchWeb"` but AI SDK v5 uses standard types
- TypeScript type extraction wasn't working with AI SDK's complex types

**Solution:**
- Updated to handle AI SDK v5's standard part types (e.g., `"tool-call"`, `"tool-result"`)
- Used flexible interface definitions instead of type extraction
- Added proper type casting with `as unknown as` pattern

---

## How the Tool Calling Flow Works Now

### 1. **User Sends Message**
```
User: "What's the weather in San Francisco?"
```

### 2. **Model Decides to Use Tool**
The model recognizes it needs current information and calls the `searchWeb` tool:
```typescript
{
  type: "tool-call",
  toolCallId: "call_abc123",
  toolName: "searchWeb",
  args: { query: "weather San Francisco" }
}
```

### 3. **Tool Executes**
Your `execute` function runs:
```typescript
execute: async ({ query }) => {
  const result = await performWebSearch(query, user.id);
  return result; // Returns search results
}
```

### 4. **Model Uses Results** (This was broken before!)
Because of `stopWhen: stepCountIs(5)`, the model continues:
```typescript
{
  type: "text",
  text: "Based on current data, San Francisco has sunny weather with temperatures around 68°F..."
}
```

### 5. **Frontend Renders**
- Tool call shows as a card with "🔍 Web Search"
- Final text response appears as a normal message
- User sees both the tool activity and the answer

---

## Key AI SDK v5 Concepts

### Multi-Step Execution
```typescript
stopWhen: stepCountIs(5)
```
Allows the model to:
1. Call tool
2. Receive results
3. Generate text using those results
4. Optionally call more tools
5. Generate final response

Without this, execution stops after step 1!

### Tool Definition Best Practices
```typescript
tools: {
  searchWeb: tool({
    description: 'Search the web for a given query. Use this to find current, factual information.',
    inputSchema: z.object({
      query: z.string().describe('The search query to look up')
    }),
    execute: async ({ query }) => {
      // Your implementation
    }
  })
}
```

### Streaming Response
```typescript
return result.toUIMessageStreamResponse();
```
Automatically handles:
- Text streaming
- Tool call streaming
- Tool result streaming
- Proper message format for `useChat`

---

## Testing Your Setup

### Test 1: Simple Tool Call
Ask: "What is the current weather in Tokyo?"

Expected flow:
1. You see "🔍 Web Search - Searching for: weather Tokyo"
2. Search completes: "🔍 Web Search - Completed"
3. AI response: "Based on the search results, Tokyo currently has..."

### Test 2: Multi-Step
Ask: "Compare the weather in Tokyo and New York"

Expected flow:
1. First search for Tokyo
2. Second search for New York
3. AI synthesizes both results into a comparison

### Test 3: No Tool Needed
Ask: "What is 2+2?"

Expected flow:
- No tool call
- Direct response: "2+2 equals 4"

---

## Debugging

### Enable Step Logging
Already added in your code:
```typescript
onStepFinish: async ({ toolResults, text }) => {
  if (toolResults && toolResults.length > 0) {
    console.log('Step finished with tool results:', toolResults.map(r => ({
      toolName: r.toolName,
      hasOutput: !!r.output
    })));
  }
}
```

Check your server console to see each step as it executes.

### Common Issues

**Issue:** Model doesn't call the tool
- **Solution:** Improve tool description to be more specific
- **Solution:** Update system prompt to encourage tool use

**Issue:** Tool is called but no response after
- **Solution:** Check `stopWhen` is set correctly
- **Solution:** Verify tool returns data successfully

**Issue:** Frontend doesn't show tool cards
- **Solution:** Check that `part.type.startsWith("tool-")` matches
- **Solution:** Verify `toolName === "searchWeb"`

---

## References

- [AI SDK Tool Calling Docs](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- [Multi-Step Execution](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling#multi-step-calls)
- [AI SDK v5 Migration Guide](https://sdk.vercel.ai/docs/migration-guides/migration-guide-5-0)

---

## What's Next?

1. **Add More Tools:** Weather API, calculator, database queries, etc.
2. **Improve UI:** Show intermediate steps, loading states
3. **Add Tool Approval:** Ask user before executing sensitive operations
4. **Parallel Tool Calls:** Model can call multiple tools simultaneously
5. **Tool Results Caching:** Avoid redundant searches

All of these are now possible with your corrected setup! ✨

