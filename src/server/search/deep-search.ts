import { runAgentLoop } from "@/run-agent-loop";

export interface DeepSearchOptions {
  question: string;
  userId: number;
}
// Adapter function to run the agent loop
export async function performDeepSearch(options: DeepSearchOptions) {
  const { question, userId } = options;
  // This returns { stream: StreamTextResult, context: SystemContext }
  return runAgentLoop({ question, userId });
}