"use client";

import * as React from "react";
import { Accordion as A } from "radix-ui";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItemData {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

export function Accordion({
  items,
  className,
  headingLevel = 3,
}: {
  items: AccordionItemData[];
  className?: string;
  headingLevel?: 2 | 3 | 4;
}) {
  const H = `h${headingLevel}` as "h3";
  return (
    <A.Root type="single" collapsible className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((it) => (
        <A.Item key={it.id} value={it.id}>
          <A.Header asChild>
            <H>
              <A.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left text-body font-medium text-ink">
                {it.title}
                <Plus
                  className="size-5 shrink-0 stroke-[1.75] text-graphite transition-transform duration-300 ease-smooth group-data-[state=open]:rotate-45"
                  aria-hidden
                />
              </A.Trigger>
            </H>
          </A.Header>
          <A.Content className="overflow-hidden data-[state=open]:animate-[able-acc-down_260ms_var(--ease-smooth)]">
            <div className="measure pb-5 text-graphite">{it.content}</div>
          </A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
