import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";

// System prompt: persistent persona + constraints for every turn (`instructions`, called `system` before AI SDK v7).
// Lesson iterations: "You are a helpful assistant." → riddle bot → 1984 Steve Jobs → support assistant (below).
const SYSTEM_PROMPT = `You are a support assistant for TechCorp's cloud platform.
Focus on helping users troubleshoot deployment issues, API usage, and account settings.
Be concise but thorough. Link to documentation at docs.techcorp.com when relevant.
If a question is outside your knowledge area, politely redirect to contact@techcorp.com.`;

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: "openai/gpt-5.4", // ICA model (see AGENTS.md); course uses openai/gpt-5-mini
      instructions: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
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
