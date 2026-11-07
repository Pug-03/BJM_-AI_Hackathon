"use client";

import * as React from "react";

export type RecorderError = "denied" | "unsupported" | "failed";

function pickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"])
    if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
}

/**
 * Microphone recorder with an AnalyserNode for the live waveform. The recording stays in
 * memory and is sent once for transcription — it is never saved.
 */
export function useRecorder({ maxMs, onAutoStop }: { maxMs: number; onAutoStop?: (b: Blob) => void }) {
  const [state, setState] = React.useState<"idle" | "recording">("idle");
  const [elapsed, setElapsed] = React.useState(0);
  const [analyser, setAnalyser] = React.useState<AnalyserNode | null>(null);
  const rec = React.useRef<MediaRecorder | null>(null);
  const chunks = React.useRef<Blob[]>([]);
  const stream = React.useRef<MediaStream | null>(null);
  const ctx = React.useRef<AudioContext | null>(null);
  const timer = React.useRef<number | null>(null);
  const resolveStop = React.useRef<((b: Blob | null) => void) | null>(null);
  const autoStop = React.useRef(onAutoStop);
  autoStop.current = onAutoStop;

  const cleanup = React.useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void ctx.current?.close().catch(() => {});
    ctx.current = null;
    setAnalyser(null);
    setState("idle");
  }, []);

  React.useEffect(() => cleanup, [cleanup]);

  const start = React.useCallback(async (): Promise<RecorderError | null> => {
    const mime = pickMime();
    if (mime === null || !navigator.mediaDevices?.getUserMedia) return "unsupported";
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (e) {
      return e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError")
        ? "denied"
        : "failed";
    }
    try {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx.current = new AC();
      const node = ctx.current.createAnalyser();
      node.fftSize = 64;
      node.smoothingTimeConstant = 0.7;
      ctx.current.createMediaStreamSource(stream.current).connect(node);
      setAnalyser(node);
    } catch {
      setAnalyser(null); // waveform is decorative; recording still works
    }
    chunks.current = [];
    const r = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => {
      const blob = new Blob(chunks.current, { type: r.mimeType || mime || "audio/webm" });
      chunks.current = [];
      cleanup();
      if (resolveStop.current) {
        resolveStop.current(blob);
        resolveStop.current = null;
      } else autoStop.current?.(blob);
    };
    rec.current = r;
    r.start(250);
    const began = Date.now();
    setElapsed(0);
    setState("recording");
    timer.current = window.setInterval(() => {
      const ms = Date.now() - began;
      setElapsed(ms);
      if (ms >= maxMs && r.state === "recording") r.stop();
    }, 200);
    return null;
  }, [cleanup, maxMs]);

  const stop = React.useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const r = rec.current;
        if (!r || r.state !== "recording") return resolve(null);
        resolveStop.current = resolve;
        r.stop();
      }),
    [],
  );

  const cancel = React.useCallback(() => {
    const r = rec.current;
    resolveStop.current = () => {};
    if (r && r.state === "recording") r.stop();
    else cleanup();
  }, [cleanup]);

  return { state, elapsed, analyser, start, stop, cancel };
}

/** Sends a recording for transcription. Returns the text or an error code. */
export async function transcribe(blob: Blob): Promise<{ text: string } | { error: string }> {
  const form = new FormData();
  form.append("audio", new File([blob], "speech", { type: blob.type.split(";")[0] || "audio/webm" }));
  try {
    const r = await fetch("/api/ai/transcribe", { method: "POST", body: form });
    const j = (await r.json().catch(() => ({}))) as { text?: string; error?: string };
    if (!r.ok || typeof j.text !== "string") return { error: j.error ?? "failed" };
    return { text: j.text };
  } catch {
    return { error: "network" };
  }
}
