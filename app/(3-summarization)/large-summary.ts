import dotenvFlow from "dotenv-flow";
dotenvFlow.config();
import messages from "./summarization/messages.json";
import { summarizeLargeThread } from "./summarization/map-reduce-summary";

// Side quest runner: builds a synthetic 1000+ comment thread and summarizes it via MapReduce.
// Usage: pnpm summarization:large [count]

const COUNT = Number(process.argv[2] ?? 1000);

const AUTHORS = ["Olivia Davis", "James Smith", "Liam Johnson", "Sophia Martinez", "Emma Thompson", "Noah Brown"];
const FILLER = [
  "Thanks, sounds good.",
  "+1, agreed.",
  "Can someone share the link again?",
  "I'll be a few minutes late to the sync.",
  "Looks fine from my side.",
  "Noted.",
];
// Sparse signal hidden in the noise — the summary should surface these.
const SIGNAL: Record<number, { author: string; content: string }> = {
  150: { author: "Noah Brown", content: "Decision: we move the launch from March 3 to March 17 because QA found blocking bugs in checkout." },
  320: { author: "Sophia Martinez", content: "I'll rework the launch email campaign for the new March 17 date by Friday." },
  540: { author: "Liam Johnson", content: "Checkout bug #482 is fixed; I'll run the full regression suite tomorrow and report back." },
  760: { author: "Olivia Davis", content: "Budget update: the client approved an extra $20k for the analytics dashboard." },
  910: { author: "Emma Thompson", content: "I'll draft the analytics dashboard wireframes and share them in Monday's review." },
};

const buildThread = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const original = messages[i % messages.length];
    const signal = SIGNAL[i];
    const author = signal?.author ?? (i < messages.length ? original.author.name : AUTHORS[i % AUTHORS.length]);
    const content = signal?.content ?? (i < messages.length ? original.content : FILLER[i % FILLER.length]);
    return { id: i + 1, author: { name: author }, timestamp: `${count - i} min ago`, content };
  });

async function main(): Promise<void> {
  const thread = buildThread(COUNT);
  console.log(`Summarizing ${thread.length} comments via MapReduce...`);
  const start = Date.now();

  const summary = await summarizeLargeThread(thread, (done, total) => {
    process.stdout.write(`\r  map: ${done}/${total} chunks`);
  });

  console.log(`\n  reduce: done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log(`  chunks: ${summary.chunks}, failed: ${summary.failedChunks}\n`);
  console.log(`# ${summary.headline}\n`);
  console.log(`Context: ${summary.context}\n`);
  console.log(`Discussion: ${summary.discussionPoints}\n`);
  console.log("Takeaways:");
  for (const t of summary.takeaways) console.log(`- ${t}`);
}

main().catch((error: unknown) => {
  console.error("❌ Summarization failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
