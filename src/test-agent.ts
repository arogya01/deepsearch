// Simple test script for the agent loop
// Run with: npx tsx src/test-agent.ts "Your question here"

import "dotenv/config";  // Load .env file

// Quick validation of required env vars before importing heavy modules
const requiredEnvVars = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "SERPER_API_KEY",
  "DATABASE_URL"
];

const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error("❌ Missing required environment variables:");
  missing.forEach(v => console.error(`   - ${v}`));
  console.error("\nMake sure your .env file contains these variables.");
  process.exit(1);
}

// Import after env validation
import { runAgentLoop } from "./run-agent-loop";

async function main() {
  const question = process.argv[2] || "What are the latest developments in AI agents in 2024?";

  console.log("═".repeat(60));
  console.log("🚀 DeepSearch Agent Test");
  console.log("═".repeat(60));
  console.log(`Question: ${question}\n`);

  try {
    // Run agent loop - now returns { stream, context }
    const { stream } = await runAgentLoop({ question, userId: 1 });

    // Consume the stream and print the answer
    console.log("\n" + "═".repeat(60));
    console.log("📝 FINAL ANSWER:");
    console.log("═".repeat(60));

    // Stream the answer to stdout
    for await (const chunk of stream.textStream) {
      process.stdout.write(chunk);
    }

    console.log("\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Agent failed:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

main();
