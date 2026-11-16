<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## AI models: always use IBM ICA

This project runs AI SDK calls against IBM ICA (Remea), not the Vercel AI Gateway (requires a credit card on the Hobby team). `.npmrc` preloads `lib/ica-provider.mts` for every pnpm-run process.

- Always use an ICA model id — never copy the model ids from Vercel Academy / AI SDK code examples (e.g. `openai/gpt-5-mini`, `openai/gpt-4.1` do not exist on ICA and silently fall back to `gpt-5.4`).
- Available ICA models (`GET https://api.remea.ica.ibm.com/ica/v1/models`): `gpt-5.4`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-6.1-sol`, `gpt-6-luna`, `gemini-3.7-flash`, `claude-haiku-4-5`, `claude-haiku-5-5`, `claude-sonnet-5`, `claude-sonnet-5-5`, `claude-opus-5-5`, `mistral-medium-2505`, `ibm/granite-4-h-small`, `meta-llama/llama-3-3-70b-instruct`, `meta-llama/llama-4-maverick-17b-128e-instruct-fp8`.
- Default for course steps: `"openai/gpt-5.4"` (fast) — use e.g. `"claude/claude-sonnet-5"` where a stronger/reasoning model is asked for. When the list above changes, update `ICA_MODELS` in `lib/ica-provider.mts` too.
- Run scripts via `pnpm` (`pnpm tsx <file>`, `pnpm <script>`); `npx`/plain `node` skip the preload and hit the Vercel Gateway.
