import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cn } from "@/lib/utils";
import { darkCoverOf } from "@/lib/cover";

const cache = new Map<string, string | null>();
function inlineSample(src: string): string | null {
  if (!/^\/sample\/[\w-]+\.svg$/.test(src)) return null;
  if (!cache.has(src)) {
    try {
      const svg = fs.readFileSync(path.join(process.cwd(), "public", src), "utf8");
      cache.set(
        src,
        svg.replace("<svg ", '<svg aria-hidden="true" focusable="false" width="100%" height="100%" '),
      );
    } catch {
      cache.set(src, null);
    }
  }
  return cache.get(src) ?? null;
}

/**
 * Decorative cover. Bundled sample covers are inlined as SVG (trusted local files), so they
 * never become the page's LCP image; uploaded covers stay a normal <img>.
 */
export function CoverArt({ src, className, eager }: { src: string; className?: string; eager?: boolean }) {
  const svg = inlineSample(src);
  const dark = darkCoverOf(src);
  const darkSvg = dark ? inlineSample(dark) : null;
  const cls = cn("size-full object-cover", className);
  if (svg)
    return (
      <>
        <div
          aria-hidden
          className={cn(cls, "[&>svg]:block", darkSvg && "dark:hidden")}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {darkSvg ? (
          <div
            aria-hidden
            className={cn(cls, "hidden dark:block [&>svg]:block")}
            dangerouslySetInnerHTML={{ __html: darkSvg }}
          />
        ) : null}
      </>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- user uploads (signed URLs), sizes vary
    <img
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      className={cn(cls, "dark:brightness-75 dark:saturate-75")}
    />
  );
}
