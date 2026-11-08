"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircle, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { toggleFollow } from "@/server/talent";
import { startConversation } from "@/server/conversations";

/** Follow + Message for an organization (talent side). */
export function OrgActions({
  orgUserId,
  following: initial,
  size = "sm",
  canMessage = true,
}: {
  orgUserId: string;
  following: boolean;
  size?: "sm" | "md";
  canMessage?: boolean;
}) {
  const t = useTranslations("feed");
  const locale = useLocale();
  const [following, setFollowing] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      {canMessage ? (
        <Button
          size={size}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            const r = await startConversation(orgUserId);
            if (r.ok) window.location.assign(`/${locale}/messages/${r.id}`);
            else {
              setBusy(false);
              toast.error(t("messageFailed"));
            }
          }}
        >
          <MessageCircle aria-hidden />
          {t("message")}
        </Button>
      ) : null}
      <Button
        size={size}
        variant="secondary"
        aria-pressed={following}
        onClick={async () => {
          setFollowing(!following);
          const r = await toggleFollow(orgUserId, !following);
          if (!r.ok) setFollowing(following);
        }}
      >
        {following ? <UserCheck aria-hidden /> : <UserPlus aria-hidden />}
        {following ? t("following") : t("follow")}
      </Button>
    </div>
  );
}
