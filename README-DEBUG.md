# Debugging Guide for DeepSearch

This guide explains how to debug your Next.js application, particularly the API routes in `src/app/api/chat/route.ts` and `src/app/api/search-web/route.ts`.

## Quick Start

### VS Code Debugging

1. **Set Breakpoints**: Click in the gutter next to line numbers in your route.ts files
2. **Start Debugging**: Press `F5` or use the Run and Debug panel
3. **Choose Configuration**: Select "Next.js: debug server-side" for API route debugging

### Command Line Debugging

```bash
# Start with debugging enabled
npm run dev:debug

# Start with debugging enabled and break on first line
npm run dev:debug-brk
```

## Debug Configurations

### 1. Next.js: debug server-side
- **Best for**: API routes, server-side code
- **Use when**: Debugging `/api/chat/route.ts` or `/api/search-web/route.ts`
- **Debugger port**: 9229

### 2. Next.js: debug client-side
- **Best for**: React components, client-side code
- **Use when**: Debugging `chat-window.tsx` or other components
- **Opens**: Chrome debugger

### 3. Next.js: debug full stack
- **Best for**: Full application debugging
- **Use when**: Need to debug both client and server code

### 4. Attach to Next.js
- **Best for**: Attaching to running debug process
- **Use when**: Server is already running with debug enabled

## Debugging API Routes

### Setting Breakpoints in route.ts

1. Open `src/app/api/chat/route.ts`
2. Click in the gutter next to line 31 (where the fetch call is made)
3. Click in the gutter next to line 44 (where toolResult is logged)
4. Start the "Next.js: debug server-side" configuration

### Key Debug Points

#### In chat/route.ts:
- **Line 10**: Request parsing
- **Line 29**: Tool execution start
- **Line 31**: External API call to search-web
- **Line 38**: Tool results processing
- **Line 44**: Tool result logging

#### In search-web/route.ts:
- **Line 8**: Request parsing
- **Line 15**: Web search execution
- **Line 52**: Response formatting

### Debug Variables to Watch

Add these to your Watch panel:
- `messages` - Incoming chat messages
- `query` - Search query being processed
- `toolResult` - Results from tool execution
- `response` - API response data

## Environment Setup

### Debug Environment Variables

Create a `.env.local` file with debug settings:

```env
# Debug logging
NODE_ENV=development
DEBUG=*

# API debugging
NEXT_PUBLIC_DEBUG=true
```

### Console Debugging

The application uses `console.log` statements for basic debugging:

```typescript
// In route.ts line 30
console.log('calling the tool')

// In route.ts line 44
console.log(toolResult);
```

## Debugging Workflow

### Step-by-Step Debugging Process

1. **Prepare**:
   ```bash
   npm install  # Ensure dependencies are installed
   ```

2. **Set Breakpoints**:
   - Open `src/app/api/chat/route.ts`
   - Set breakpoints at lines 31 and 44

3. **Start Debugging**:
   - Press `F5` in VS Code
   - Select "Next.js: debug server-side"
   - Wait for server to start

4. **Trigger API Call**:
   - Open browser to `http://localhost:3000`
   - Send a chat message that would trigger the searchWeb tool

5. **Debug Session**:
   - Execution will pause at your breakpoints
   - Inspect variables in the Debug Console
   - Use Step Over (F10), Step Into (F11), Continue (F5)

### Common Debug Scenarios

#### Debugging Tool Execution
```typescript
// Add this to line 29 in route.ts for detailed debugging
console.log('Tool query:', query);
console.log('Fetch URL:', '/api/search-web');
console.log('Request body:', JSON.stringify({ query }));
```

#### Debugging Response Issues
```typescript
// Add this after line 32 in route.ts
const responseText = await response.text();
console.log('Raw response:', responseText);
const parsedResponse = JSON.parse(responseText);
console.log('Parsed response:', parsedResponse);
```

## Troubleshooting

### Common Issues

1. **Debugger Not Attaching**:
   - Check if port 9229 is free: `lsof -i :9229`
   - Restart VS Code
   - Try "Attach to Next.js" configuration

2. **Breakpoints Not Hitting**:
   - Ensure source maps are enabled
   - Check if TypeScript is compiling correctly
   - Verify file paths in debug configuration

3. **Console Messages Not Showing**:
   - Check VS Code Debug Console
   - Check terminal output
   - Verify console.log statements are in server-side code

### Debug Console Commands

In VS Code Debug Console, you can evaluate:
```javascript
// Check current variables
messages
query
toolResult

// Modify variables during debugging
query = "new search term"

// Call functions
JSON.stringify(messages, null, 2)
```

## Advanced Debugging

### Using Node.js Inspector

```bash
# Start with Node.js inspector
node --inspect-brk=0.0.0.0:9229 ./node_modules/next/dist/bin/next dev

# Open Chrome DevTools
# Navigate to chrome://inspect
# Click "Open dedicated DevTools for Node"
```

### Debug Network Requests

Add network request logging:
```typescript
// In route.ts, replace the fetch call with this debug version:
const response = await fetch('/api/search-web', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query })
});

console.log('Response status:', response.status);
console.log('Response headers:', Object.fromEntries(response.headers));
```

### Performance Debugging

```typescript
// Add timing measurements
const startTime = Date.now();
const response = await fetch('/api/search-web', { method: 'POST', body: JSON.stringify({ query }) });
const endTime = Date.now();
console.log(`API call took ${endTime - startTime}ms`);
```

## File Structure for Debugging

```
.vscode/
├── launch.json          # Debug configurations
├── settings.json        # Workspace settings
└── tasks.json          # Build and debug tasks

src/app/api/
├── chat/route.ts        # Main chat API (primary debug target)
└── search-web/route.ts  # Web search API (secondary debug target)
```

## Next Steps

After setting up debugging:
1. Practice setting breakpoints and stepping through code
2. Learn to use the Variables, Watch, and Call Stack panels
3. Experiment with different debug configurations
4. Use debug logging strategically in your development workflow

Happy debugging! 🐛🔍
