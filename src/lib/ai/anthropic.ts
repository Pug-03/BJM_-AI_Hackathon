import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { log } from "@/lib/log";
import { AiOutputError, AiUnavailableError, type StructuredModel } from "./types";

let client: Anthropic | null = null;
function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiUnavailableError("ai");
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export const anthropicModel = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

/**
 * Claude with JSON output constrained to the Zod schema, then validated again with Zod.
 * One retry on invalid output (section 2), then an AiOutputError.
 */
export const anthropicStructured: StructuredModel = {
  async generate({ schema, system, prompt, maxTokens = 2048 }) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const msg = await anthropic().messages.parse({
          model: anthropicModel(),
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: prompt }],
          output_config: { format: zodOutputFormat(schema) },
        });
        const parsed = schema.safeParse(msg.parsed_output);
        if (parsed.success) return parsed.data;
        lastError = parsed.error;
      } catch (e) {
        if (e instanceof AiUnavailableError) throw e;
        lastError = e;
      }
      log.warn("ai.invalid_output", {
        attempt,
        kind: lastError instanceof Error ? lastError.name : "unknown",
      });
    }
    throw new AiOutputError("invalid_output", { cause: lastError });
  },
};
