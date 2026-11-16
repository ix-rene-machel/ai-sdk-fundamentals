// Preload: routes AI SDK string model ids ("openai/gpt-5.4") to IBM ICA instead of Vercel AI Gateway.
// Loaded for every pnpm-run node process via `node-options` in .npmrc.
import { execFileSync } from "node:child_process";
import dotenvFlow from "dotenv-flow";
import { createOpenAI } from "@ai-sdk/openai";

dotenvFlow.config({ silent: true });

const ICA_BASE_URL = process.env.ICA_BASE_URL ?? "https://api.remea.ica.ibm.com/ica/v1";
// Used when a course model id does not exist on ICA (e.g. gpt-5-mini, gpt-4.1).
const ICA_DEFAULT_MODEL = process.env.ICA_MODEL ?? "gpt-5.4";
// From GET {ICA_BASE_URL}/models
const ICA_MODELS = new Set<string>([
	"gpt-5.4", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna", "gpt-6.1-sol", "gpt-6-luna",
	"gemini-3.7-flash", "claude-haiku-4-5", "claude-haiku-5-5", "claude-sonnet-5", "claude-sonnet-5-5",
	"claude-opus-5-5", "mistral-medium-2505", "ibm/granite-4-h-small",
	"meta-llama/llama-3-3-70b-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
]);

const readApiKey = (): string | undefined => {
	if (process.env.ICA_API_KEY) return process.env.ICA_API_KEY;
	try {
		// Keychain service name; override locally via ICA_KEYCHAIN_SERVICE in .env.local
		const service = process.env.ICA_KEYCHAIN_SERVICE ?? "pi-ica-api-key";
		return execFileSync("security", ["find-generic-password", "-s", service, "-w"], {
			encoding: "utf-8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return undefined; // not macOS / no keychain entry → keep default Vercel AI Gateway
	}
};

// "openai/gpt-5.4" → "gpt-5.4"; "meta-llama/llama-..." stays as-is.
const toIcaModelId = (modelId: string): string => {
	if (ICA_MODELS.has(modelId)) return modelId;
	const withoutProvider = modelId.slice(modelId.indexOf("/") + 1);
	return ICA_MODELS.has(withoutProvider) ? withoutProvider : ICA_DEFAULT_MODEL;
};

const apiKey = process.env.VERCEL ? undefined : readApiKey(); // never hijack Vercel builds/deploys

if (apiKey) {
	const ica = createOpenAI({ name: "ica", baseURL: ICA_BASE_URL, apiKey });
	globalThis.AI_SDK_DEFAULT_PROVIDER = {
		...ica,
		specificationVersion: "v4",
		// ICA speaks OpenAI chat completions, not the Responses API.
		languageModel: (modelId: string) => ica.chat(toIcaModelId(modelId)),
	};
}
