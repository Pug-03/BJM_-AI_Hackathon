"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiltersSheet } from "@/components/feed/filters-sheet";
import type { TalentFilter } from "@/lib/schemas/talent";
import { filterToQuery } from "@/lib/filter-query";

export function ExploreControls({ filter }: { filter: TalentFilter }) {
  const t = useTranslations("explore");
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = React.useState(filter.q ?? "");
  const go = (f: TalentFilter) => {
    const qs = filterToQuery(f);
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <form
        role="search"
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          go({ ...filter, q: q.trim() || undefined });
        }}
      >
        <label htmlFor="explore-q" className="sr-only">
          {t("searchLabel")}
        </label>
        <Search
          className="text-graphite pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          id="explore-q"
          type="search"
          enterKeyHint="search"
          className="pr-28 pl-12"
          placeholder={t("searchPlaceholder")}
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" size="sm" className="absolute top-1/2 right-1.5 -translate-y-1/2">
          {t("search")}
        </Button>
      </form>
      <FiltersSheet value={filter} onApply={(f) => go({ ...f, q: filter.q })} />
    </div>
  );
}
