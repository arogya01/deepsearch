import { runAgentLoop } from "@/run-agent-loop";
import { UIMessageStreamWriter } from "ai";

export interface DeepSearchOptions {
  question: string;
  userId: number;
  writer?: UIMessageStreamWriter;
}
// Adapter function to run the agent loop
export async function performDeepSearch(options: DeepSearchOptions) {
  const { question, userId, writer } = options;
  // This returns { stream: StreamTextResult, context: SystemContext }
  return runAgentLoop({ question, userId, writer });
}