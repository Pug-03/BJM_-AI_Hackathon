"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AudioLines, FileText, HandCoins, ImagePlus, Plus, SendHorizontal, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { toast } from "@/components/ui/toaster";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MicButton } from "@/components/ai/mic-button";
import { useRecorder } from "@/components/ai/use-recorder";
import { Waveform, formatClock } from "@/components/ai/waveform";
import { toWebp, uploadFile } from "@/lib/upload-client";
import type { Attachment, SendInput } from "@/lib/schemas/message";

/**
 * Composer (section 7.8): text with mic dictation, photos/files, voice notes (record → stop →
 * send, live waveform), and "Send offer". Enter sends; Shift+Enter adds a line.
 */
export function Composer({
  conversationId,
  disabled,
  onSend,
  onTyping,
  onOffer,
}: {
  conversationId: string;
  disabled: boolean;
  onSend: (input: SendInput, preview?: { src: string; type: string }[]) => void;
  onTyping: () => void;
  onOffer: () => void;
}) {
  const t = useTranslations("messages");
  const tu = useTranslations("onboard");
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const ta = React.useRef<HTMLTextAreaElement>(null);
  const imgInput = React.useRef<HTMLInputElement>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const lastTyping = React.useRef(0);
  const rec = useRecorder({ maxMs: 5 * 60_000, onAutoStop: (b) => void sendVoice(b) });

  React.useLayoutEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const sendText = () => {
    const v = text.trim();
    if (!v || disabled) return;
    onSend({ kind: "TEXT", text: v });
    setText("");
    ta.current?.focus();
  };

  async function upload(blob: Blob, name: string): Promise<Attachment | null> {
    const r = await uploadFile("chat", blob, { conversationId, name });
    if (!r.ok) {
      toast.error(tu(`uploadErrors.${r.error}`));
      return null;
    }
    return { url: r.url, type: blob.type || "application/octet-stream", name, size: blob.size };
  }

  async function sendVoice(blob: Blob | null) {
    if (!blob || blob.size < 1200) return;
    const durationMs = rec.elapsed;
    setBusy(true);
    const a = await upload(blob, "voice-note");
    setBusy(false);
    if (a) onSend({ kind: "VOICE_NOTE", attachments: [{ ...a, durationMs }] });
  }

  const pickImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const list = [...files].slice(0, 10);
    const previews = list.map((f) => ({ src: URL.createObjectURL(f), type: "image/webp" }));
    const atts = (await Promise.all(list.map(async (f) => upload(await toWebp(f), f.name)))).filter(
      Boolean,
    ) as Attachment[];
    setBusy(false);
    if (atts.length) onSend({ kind: "IMAGE", attachments: atts, text: text.trim() || undefined }, previews);
    if (text.trim()) setText("");
  };
  const pickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const atts = (
      await Promise.all([...files].slice(0, 5).map((f) => upload(f, f.name.slice(0, 120))))
    ).filter(Boolean) as Attachment[];
    setBusy(false);
    if (atts.length) onSend({ kind: "FILE", attachments: atts });
  };

  if (rec.state === "recording")
    return (
      <div className="flex items-center gap-2">
        <IconButton aria-label={t("discardVoice")} onClick={() => rec.cancel()}>
          <Trash2 aria-hidden />
        </IconButton>
        <div
          className="bg-brand-soft flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full px-4"
          role="status"
          aria-live="polite"
        >
          <span className="bg-danger size-2.5 shrink-0 animate-pulse rounded-full" aria-hidden />
          <span className="sr-only">{t("recordingVoice")}</span>
          <Waveform
            analyser={rec.analyser}
            bars={24}
            className="min-w-0 flex-1 justify-center overflow-hidden"
          />
          <span className="text-caption text-brand tabular-nums">{formatClock(rec.elapsed)}</span>
        </div>
        <IconButton
          variant="solid"
          aria-label={t("sendVoice")}
          onClick={async () => void sendVoice(await rec.stop())}
        >
          <SendHorizontal aria-hidden />
        </IconButton>
      </div>
    );

  return (
    <div className="flex items-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton aria-label={t("attach")} disabled={disabled || busy} aria-busy={busy || undefined}>
            <Plus aria-hidden />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top">
          <DropdownMenuItem onSelect={() => imgInput.current?.click()}>
            <ImagePlus aria-hidden />
            {t("attachPhoto")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => fileInput.current?.click()}>
            <FileText aria-hidden />
            {t("attachFile")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOffer}>
            <HandCoins aria-hidden />
            {t("sendOffer")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={imgInput}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void pickImages(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void pickFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="relative min-w-0 flex-1">
        <label htmlFor="composer" className="sr-only">
          {t("writeMessage")}
        </label>
        <textarea
          id="composer"
          ref={ta}
          rows={1}
          maxLength={4000}
          disabled={disabled}
          value={text}
          placeholder={disabled ? t("blockedComposer") : t("writeMessage")}
          onChange={(e) => {
            setText(e.target.value);
            if (Date.now() - lastTyping.current > 3000) {
              lastTyping.current = Date.now();
              onTyping();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              sendText();
            }
          }}
          className="border-field-line bg-paper text-body placeholder:text-muted focus-visible:outline-brand block max-h-40 min-h-12 w-full resize-none rounded-[24px] border py-3 pr-14 pl-4 leading-normal focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
        />
        <MicButton
          kind="input"
          label={t("message")}
          onText={(v) => setText((cur) => (cur.trim() ? `${cur.trimEnd()} ${v}` : v))}
          disabled={disabled}
        />
      </div>
      {text.trim() ? (
        <IconButton variant="solid" aria-label={t("send")} onClick={sendText} disabled={disabled}>
          <SendHorizontal aria-hidden />
        </IconButton>
      ) : (
        <IconButton
          variant="soft"
          aria-label={t("recordVoice")}
          disabled={disabled || busy}
          onClick={async () => {
            const err = await rec.start();
            if (err) toast.error(t(`voiceErrors.${err}`));
          }}
        >
          <AudioLines aria-hidden />
        </IconButton>
      )}
    </div>
  );
}
