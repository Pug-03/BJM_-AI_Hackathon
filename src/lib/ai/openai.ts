import "server-only";
import OpenAI from "openai";
import { AiUnavailableError, type Embedder, type Transcriber } from "./types";

let client: OpenAI | null = null;
function openai() {
  if (!process.env.OPENAI_API_KEY) throw new AiUnavailableError("speech");
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

/** gpt-4o-transcribe, falling back to whisper-1 (section 2). Language is auto-detected. */
export const openaiTranscriber: Transcriber = {
  async transcribe(audio) {
    const prompt = "The speaker may use Thai, English, or both. Keep names and skills as spoken.";
    try {
      const r = await openai().audio.transcriptions.create({
        file: audio,
        model: "gpt-4o-transcribe",
        prompt,
      });
      return { text: r.text.trim() };
    } catch (e) {
      if (e instanceof AiUnavailableError) throw e;
      const r = await openai().audio.transcriptions.create({ file: audio, model: "whisper-1", prompt });
      return { text: r.text.trim() };
    }
  },
};

/** text-embedding-3-small (1536 dimensions) for matching. */
export const openaiEmbedder: Embedder = {
  async embed(texts) {
    if (!texts.length) return [];
    const r = await openai().embeddings.create({ model: "text-embedding-3-small", input: texts });
    return r.data.map((d) => d.embedding);
  },
};
