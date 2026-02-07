import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { observe } from "@langfuse/tracing";

const SUMMARIZE_SYSTEM_PROMPT = `# Research Extraction Specialist

You are a research extraction specialist. Given a **research topic** and **raw web content**, create a thoroughly detailed synthesis as a cohesive narrative that flows naturally between key concepts.

---

## Core Objective

Extract the most valuable information related to the research topic, including:
- Relevant facts and statistics
- Methodologies and approaches
- Claims and arguments
- Contextual information

> **Important:** Preserve technical terminology and domain-specific language from the source material.

---

## Structure Requirements

Structure your synthesis as a coherent document with natural transitions between ideas:

1. **Introduction**: Begin with an introduction that captures the core thesis and purpose of the source material
2. **Development**: Weave together key findings and their supporting details, ensuring each concept flows logically to the next
3. **Integration**: Integrate specific metrics, dates, and quantitative information within their proper context
4. **Connections**: Explore how concepts interconnect within the source material, highlighting meaningful relationships between ideas
5. **Limitations**: Acknowledge where information related to aspects of the research topic may be missing or incomplete

---

## Guidelines

| ✅ **Do** | ❌ **Don't** |
|-----------|--------------|
| Maintain original data context (e.g., "2024 study of 150 patients") | Use generic phrases like "recent study" |
| Preserve integrity by keeping details anchored to their original context | Remove important contextual anchors |
| Create a cohesive narrative | Use disconnected bullet points or lists |
| Use paragraph breaks only when transitioning between major themes | Over-fragment the content |

---

## Critical Reminder

> [!CAUTION]
> If content lacks a specific aspect of the research topic, **clearly state that in the synthesis**.
> 
> **NEVER make up information** and **NEVER rely on external knowledge.**
`;

export interface SummarizeURLOptions {
    researchTopic: string;
    url: string;
    rawContent: string;
}

export interface SummarizedContent {
    url: string;
    summary: string;
    originalLength: number;
    summaryLength: number;
}

/**
 * Summarizes raw web content to extract high-signal information
 * related to the research topic.
 */
export const summarizeURL = observe(
    async function summarizeURL({
        researchTopic,
        url,
        rawContent,
    }: SummarizeURLOptions): Promise<SummarizedContent> {
        const result = await generateText({
            model: google("gemini-2.0-flash"),
            system: SUMMARIZE_SYSTEM_PROMPT,
            prompt: `## Research Topic
${researchTopic}

---

## Source URL
${url}

---

## Raw Web Content

\`\`\`
${rawContent}
\`\`\`

---

Provide your detailed synthesis of the above content as it relates to the research topic.`,
            experimental_telemetry: {
                isEnabled: true,
                functionId: "summarizeURL",
            },
        });

        return {
            url,
            summary: result.text,
            originalLength: rawContent.length,
            summaryLength: result.text.length,
        };
    },
    { name: "Summarize URL" }
);
