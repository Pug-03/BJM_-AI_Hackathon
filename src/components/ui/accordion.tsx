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
    <A.Root type="single" collapsible className={cn("divide-line border-line divide-y border-y", className)}>
      {items.map((it) => (
        <A.Item key={it.id} value={it.id}>
          <A.Header asChild>
            <H>
              <A.Trigger className="group text-body text-ink flex w-full items-center justify-between gap-4 py-5 text-left font-medium">
                {it.title}
                <Plus
                  className="text-graphite ease-smooth size-5 shrink-0 stroke-[1.75] transition-transform duration-300 group-data-[state=open]:rotate-45"
                  aria-hidden
                />
              </A.Trigger>
            </H>
          </A.Header>
          <A.Content className="overflow-hidden data-[state=open]:animate-[able-acc-down_260ms_var(--ease-smooth)]">
            <div className="measure text-graphite pb-5">{it.content}</div>
          </A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
