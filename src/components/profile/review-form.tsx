"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { RatingInput } from "@/components/ui/rating-stars";
import { toast } from "@/components/ui/toaster";
import { reviewableConversations, submitReview } from "@/server/social";

/** Shown only to an employer who had a conversation with an accepted offer and hasn't reviewed yet. */
export function ReviewForm({ talentId, name }: { talentId: string; name: string }) {
  const t = useTranslations("social");
  const [eligible, setEligible] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    void reviewableConversations(talentId).then((r) => setEligible(r.length > 0));
  }, [talentId]);
  if (!eligible) return null;
  return (
    <form
      className="border-line bg-raised flex flex-col gap-4 rounded-[20px] border p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating) return toast.error(t("pickRating"));
        setBusy(true);
        const r = await submitReview(talentId, { rating, text });
        setBusy(false);
        if (r.ok) {
          toast.success(t("reviewThanks"));
          setEligible(false);
          window.location.reload();
        } else toast.error(t("reviewFailed"));
      }}
    >
      <h3 className="text-h3">{t("reviewTitle", { name })}</h3>
      <p className="text-small text-graphite">{t("reviewHint")}</p>
      <RatingInput
        value={rating}
        onChange={setRating}
        legend={t("rating")}
        starLabel={(n) => t("stars", { n })}
      />
      <label htmlFor="rv-text" className="text-small font-medium">
        {t("reviewText")}
      </label>
      <Textarea
        id="rv-text"
        rows={3}
        maxLength={1000}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button type="submit" className="self-start" loading={busy}>
        {t("submitReview")}
      </Button>
    </form>
  );
}
