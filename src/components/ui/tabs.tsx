"use client";

import * as React from "react";
import { Tabs as T } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { tabSlide, useReducedMotion, variantsFor } from "@/lib/motion";

type TabsCtx = { value: string; dir: number; ids: string[] };
const Ctx = React.createContext<TabsCtx>({ value: "", dir: 1, ids: [] });

export interface TabItem {
  value: string;
  label: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  label: string;
  className?: string;
  listClassName?: string;
  children: React.ReactNode;
}

/** Underline tabs; panel content slides in the direction of the selected tab. */
export function Tabs({
  items,
  value: valueProp,
  defaultValue,
  onValueChange,
  label,
  className,
  listClassName,
  children,
}: TabsProps) {
  const [inner, setInner] = React.useState(defaultValue ?? items[0]?.value ?? "");
  const value = valueProp ?? inner;
  const ids = items.map((i) => i.value);
  const prev = React.useRef(value);
  const dir = ids.indexOf(value) >= ids.indexOf(prev.current) ? 1 : -1;
  React.useEffect(() => {
    prev.current = value;
  }, [value]);
  const reduced = useReducedMotion();

  return (
    <Ctx.Provider value={{ value, dir, ids }}>
      <T.Root
        value={value}
        onValueChange={(v) => {
          if (valueProp === undefined) setInner(v);
          onValueChange?.(v);
        }}
        className={className}
      >
        <T.List
          aria-label={label}
          className={cn("no-scrollbar flex gap-1 overflow-x-auto border-b border-line", listClassName)}
        >
          {items.map((it) => (
            <T.Trigger
              key={it.value}
              value={it.value}
              className={cn(
                "relative flex min-h-12 shrink-0 items-center gap-2 px-4 text-small font-medium whitespace-nowrap text-graphite transition-colors",
                "hover:text-ink data-[state=active]:text-ink",
              )}
            >
              {it.label}
              {typeof it.count === "number" ? (
                <span className="rounded-full bg-mist px-2 text-caption text-graphite">{it.count}</span>
              ) : null}
              {value === it.value ? (
                <motion.span
                  layoutId={reduced ? undefined : `tab-underline-${label}`}
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
            </T.Trigger>
          ))}
        </T.List>
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            {React.Children.toArray(children).filter(
              (c) => React.isValidElement<{ value?: string }>(c) && c.props.value === value,
            )}
          </AnimatePresence>
        </div>
      </T.Root>
    </Ctx.Provider>
  );
}

export function TabPanel({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(Ctx);
  const reduced = useReducedMotion();
  if (ctx.value !== value) return null;
  return (
    <T.Content value={value} forceMount asChild>
      <motion.div
        key={value}
        custom={ctx.dir}
        variants={variantsFor(tabSlide, reduced)}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn("pt-6 focus-visible:outline-none", className)}
      >
        {children}
      </motion.div>
    </T.Content>
  );
}
