"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/** Friendly error boundary for every route (Stage 10). Never shows stack traces. */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  React.useEffect(() => {
    console.error(
      JSON.stringify({ level: "error", event: "client.route_error", digest: error.digest ?? null }),
    );
  }, [error]);
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-start justify-center gap-4 px-4"
    >
      <p className="text-small text-graphite">{t("errorCode")}</p>
      <h1 className="text-h1 tracking-display">{t("errorTitle")}</h1>
      <p className="text-graphite">{t("errorBody")}</p>
      {error.digest ? (
        <p className="text-caption text-graphite">{t("errorRef", { id: error.digest })}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>{t("tryAgain")}</Button>
        <Button asChild variant="secondary">
          {/* Full reload on purpose: the error may come from the router itself. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">{t("home")}</a>
        </Button>
      </div>
    </main>
  );
}
