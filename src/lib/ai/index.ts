import "server-only";
import { anthropicStructured } from "./anthropic";
import { openaiEmbedder, openaiTranscriber } from "./openai";

/** The active providers. Change these lines to swap a provider. */
export const transcriber = openaiTranscriber;
export const structured = anthropicStructured;
export const embedder = openaiEmbedder;

export * from "./types";
