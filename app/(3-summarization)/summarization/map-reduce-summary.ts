import { generateText, Output } from "ai";
import { z } from "zod";

// Side quest: summarize 1000+ comments via MapReduce (chunk → summarize in parallel → merge).

type Comment = { id: number; author: { name: string }; timestamp: string; content: string };

const CHUNK_SIZE = 15;
const CONCURRENCY = 5; // parallel ICA calls; higher risks rate limits
const MODEL = "openai/gpt-5.4"; // ICA model (see AGENTS.md)

// Map schema keeps more detail than the final one so the reduce step loses no attribution.
const chunkSummarySchema = z.object({
  topics: z.array(z.string()).describe("Key topics discussed in these comments. Max 5, each max 8 words."),
  decisions: z.array(z.string()).describe("Decisions that were made. Empty if none."),
  actionItems: z
    .array(z.object({ owner: z.string().describe("Full name of the person responsible"), task: z.string() }))
    .describe("Assigned tasks or next steps. Empty if none."),
});

const finalSummarySchema = z.object({
  headline: z.string().describe("The main topic or title of the summary. Max 5 words."),
  context: z.string().describe("Briefly explain the situation or background. Max 2 sentences."),
  discussionPoints: z.string().describe("Summarize the key topics discussed. Max 2 sentences."),
  takeaways: z
    .array(z.string())
    .describe("Main decisions and action items. **Include names** for assigned tasks. Max 5 items."),
});

type ChunkSummary = z.infer<typeof chunkSummarySchema>;
export type LargeSummary = z.infer<typeof finalSummarySchema> & { chunks: number; failedChunks: number };

const chunk = <T,>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

// Minimal p-limit replacement: run `fn` over `items` with at most `limit` in flight; never rejects.
const mapSettled = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> => {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i], i) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

const summarizeChunk = async (comments: Comment[]): Promise<ChunkSummary> => {
  const { output } = await generateText({
    model: MODEL,
    maxRetries: 3, // exponential backoff on transient/rate-limit errors (built into the AI SDK)
    prompt: `Extract topics, decisions and action items from these comments. Only include what is stated.
Comments:
${JSON.stringify(comments.map((c) => ({ author: c.author.name, content: c.content })))}`,
    output: Output.object({ schema: chunkSummarySchema }),
  });
  return output;
};

export const summarizeLargeThread = async (
  comments: Comment[],
  onProgress?: (done: number, total: number) => void,
): Promise<LargeSummary> => {
  const chunks = chunk(comments, CHUNK_SIZE);
  let done = 0;

  // Map: summarize chunks in parallel, keep chronological order via index.
  const settled = await mapSettled(chunks, CONCURRENCY, async (c) => {
    const summary = await summarizeChunk(c);
    onProgress?.(++done, chunks.length);
    return summary;
  });
  const chunkSummaries = settled.flatMap((r, i) => (r.status === "fulfilled" ? [{ part: i + 1, ...r.value }] : []));
  const failedChunks = chunks.length - chunkSummaries.length;
  if (chunkSummaries.length === 0) throw new Error("All chunk summaries failed");

  // Reduce: merge partial summaries into one.
  const { output } = await generateText({
    model: MODEL,
    prompt: `These are partial summaries of consecutive parts of one long comment thread, in chronological order.
Merge them into one final summary: deduplicate recurring topics, keep the latest decision when they conflict,
and preserve every unique action item with its owner (group items per owner if there are many).
${failedChunks > 0 ? `Note: ${failedChunks} of ${chunks.length} parts could not be summarized and are missing.` : ""}
Partial summaries:
${JSON.stringify(chunkSummaries)}`,
    output: Output.object({ schema: finalSummarySchema }),
  });

  return { ...output, chunks: chunks.length, failedChunks };
};
