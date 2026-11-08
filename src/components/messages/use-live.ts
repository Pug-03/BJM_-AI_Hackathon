"use client";

import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: Promise<SupabaseClient | null> | null = null;
function realtime() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Promise.resolve(null);
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url, key, { auth: { persistSession: false } }),
  );
  return client;
}

/**
 * Live updates: Supabase Realtime broadcast nudges when configured (then a slow safety poll),
 * otherwise polling every `fallbackMs` (section 2: 5-second polling fallback).
 * `onChange` should re-fetch through an authorized server action.
 */
export function useLive(topic: string | null, onChange: () => void, fallbackMs = 5000) {
  const cb = React.useRef(onChange);
  cb.current = onChange;
  const [connected, setConnected] = React.useState(false);

  React.useEffect(() => {
    if (!topic) return;
    let cancelled = false;
    let unsub: (() => void) | null = null;
    void realtime().then((sb) => {
      if (!sb || cancelled) return;
      const ch = sb
        .channel(topic)
        .on("broadcast", { event: "change" }, () => cb.current())
        .subscribe((status) => setConnected(status === "SUBSCRIBED"));
      unsub = () => void sb.removeChannel(ch);
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [topic]);

  React.useEffect(() => {
    if (!topic) return;
    const ms = connected ? 30_000 : fallbackMs;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") cb.current();
    }, ms);
    const onVis = () => document.visibilityState === "visible" && cb.current();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [topic, connected, fallbackMs]);

  return connected;
}
