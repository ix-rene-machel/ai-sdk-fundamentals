"use server";

import { generateText, Output } from "ai";
import { z } from "zod";
import type messages from "./messages.json";

type Comment = (typeof messages)[number];

const summarySchema = z.object({
  headline: z
    .string()
    .describe("The main topic or title of the summary. Max 5 words."),
  context: z
    .string()
    .describe(
      "Briefly explain the situation or background that led to this discussion. Max 2 sentences.",
    ),
  discussionPoints: z
    .string()
    .describe("Summarize the key topics discussed. Max 2 sentences."),
  takeaways: z
    .string()
    .describe(
      "List the main decisions, action items, or next steps. **Include names** for assigned tasks. Max 2-3 bullet points or sentences.",
    ),
});

export type Summary = z.infer<typeof summarySchema>;

export const generateSummary = async (comments: Comment[]): Promise<Summary> => {
  console.log("Generating summary for", comments.length, "comments...");
  const { output: summary } = await generateText({
    model: "openai/gpt-5.4", // ICA model (see AGENTS.md); course uses openai/gpt-5-mini
    prompt: `Please summarize the following comments concisely, focusing on key decisions and action items.
      Comments:
      ${JSON.stringify(comments)}`,
    output: Output.object({
      schema: summarySchema,
    }),
  });
  console.log("Summary generated:", summary);
  return summary;
};
