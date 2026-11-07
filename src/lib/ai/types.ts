import type { z } from "zod";

/**
 * Provider interfaces (section 2: "All providers behind small interfaces in src/lib/ai/*").
 * Swap an implementation by changing `src/lib/ai/index.ts` only.
 */
export interface Transcriber {
  /** Speech-to-text, auto language (Thai/English). Audio is never stored. */
  transcribe(audio: File): Promise<{ text: string }>;
}

export interface StructuredModel {
  /** Returns output validated by `schema`; retries once on invalid output, then throws. */
  generate<T extends z.ZodType>(args: {
    schema: T;
    system: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<z.infer<T>>;
}

export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
}

export class AiUnavailableError extends Error {
  constructor(public service: "speech" | "ai") {
    super(`${service}_unavailable`);
  }
}

export class AiOutputError extends Error {}
