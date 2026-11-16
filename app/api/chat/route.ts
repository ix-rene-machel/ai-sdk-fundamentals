import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai";
import { tools, type ChatMessage } from "./tools";

// System prompt: persistent persona + constraints for every turn (`instructions`, called `system` before AI SDK v7).
// System prompts lesson iterated: helpful assistant → riddle bot → 1984 Steve Jobs → TechCorp support assistant.
// Tool use lesson resets to a generic assistant so weather questions are not deflected as off-topic.
const SYSTEM_PROMPT = "You are a helpful assistant.";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();

    const result = streamText({
      model: "openai/gpt-5.4", // ICA model (see AGENTS.md); course uses openai/gpt-5-mini
      instructions: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
