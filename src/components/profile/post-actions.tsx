"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Heart, MessageSquare, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { addComment, deleteComment, listComments, togglePostLike, type CommentView } from "@/server/social";

/** Like + comments on a post (Stage 9). Signed-out visitors see counts and a sign-in link. */
export function PostActions({
  postId,
  liked: initialLiked,
  likeCount: initialLikes,
  commentCount: initialComments,
  signedIn,
}: {
  postId: string;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  signedIn: boolean;
}) {
  const t = useTranslations("social");
  const fmt = useFormatter();
  const [liked, setLiked] = React.useState(initialLiked);
  const [likes, setLikes] = React.useState(initialLikes);
  const [open, setOpen] = React.useState(false);
  const [comments, setComments] = React.useState<CommentView[] | null>(null);
  const [count, setCount] = React.useState(initialComments);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const like = async () => {
    if (!signedIn) return toast.message(t("signInToLike"));
    setLiked(!liked);
    setLikes((n) => n + (liked ? -1 : 1));
    const r = await togglePostLike(postId, !liked);
    if (r.ok) setLikes(r.likeCount);
    else {
      setLiked(liked);
      setLikes(initialLikes);
    }
  };
  const toggleComments = async () => {
    const next = !open;
    setOpen(next);
    if (next && !comments) setComments(await listComments(postId));
  };
  const btn =
    "text-caption text-graphite hover:text-ink -mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button type="button" className={btn} aria-pressed={liked} onClick={() => void like()}>
          <Heart className={cn("size-4", liked && "fill-danger text-danger")} aria-hidden />
          {t("likes", { count: likes })}
          <span className="sr-only">{liked ? t("unlike") : t("like")}</span>
        </button>
        <button
          type="button"
          className={btn}
          aria-expanded={open}
          aria-controls={`c-${postId}`}
          onClick={() => void toggleComments()}
        >
          <MessageSquare className="size-4" aria-hidden />
          {t("comments", { count })}
        </button>
      </div>
      {open ? (
        <div id={`c-${postId}`} className="border-line flex flex-col gap-3 border-t pt-3">
          {comments === null ? (
            <p className="text-caption text-graphite">{t("loading")}</p>
          ) : comments.length ? (
            <ul className="flex flex-col gap-3">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start gap-2">
                  <Avatar src={c.author.image} name={c.author.name} size="xs" />
                  <div className="bg-mist min-w-0 flex-1 rounded-[14px] px-3 py-2">
                    <p className="text-caption flex items-center justify-between gap-2">
                      {c.author.href ? (
                        <Link href={c.author.href} className="font-medium hover:underline">
                          {c.author.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{c.author.name}</span>
                      )}
                      <time className="text-graphite" dateTime={c.createdAt}>
                        {fmt.relativeTime(new Date(c.createdAt))}
                      </time>
                    </p>
                    <p className="text-small whitespace-pre-line">{c.text}</p>
                  </div>
                  {c.mine ? (
                    <button
                      type="button"
                      aria-label={t("deleteComment")}
                      className="hover:bg-mist flex size-11 shrink-0 items-center justify-center rounded-full"
                      onClick={async () => {
                        if ((await deleteComment(c.id)).ok) {
                          setComments((cs) => cs?.filter((x) => x.id !== c.id) ?? null);
                          setCount((n) => n - 1);
                        }
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-caption text-graphite">{t("noComments")}</p>
          )}
          {signedIn ? (
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!text.trim()) return;
                setBusy(true);
                const r = await addComment(postId, text);
                setBusy(false);
                if (r.ok) {
                  setComments(r.comments);
                  setCount(r.comments.length);
                  setText("");
                } else toast.error(t("commentFailed"));
              }}
            >
              <label htmlFor={`ci-${postId}`} className="sr-only">
                {t("writeComment")}
              </label>
              <input
                id={`ci-${postId}`}
                value={text}
                maxLength={1000}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("writeComment")}
                className="border-field-line bg-paper text-small focus-visible:outline-brand h-11 min-w-0 flex-1 rounded-full border px-4 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid"
              />
              <Button type="submit" size="sm" loading={busy} disabled={!text.trim()}>
                {t("post")}
              </Button>
            </form>
          ) : (
            <Link href="/login" className="text-small text-brand underline-offset-4 hover:underline">
              {t("signInToComment")}
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
