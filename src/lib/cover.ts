/** Bundled sample covers have dark-mode twins (`cover-N-dark.svg`); uploads don't. */
export function darkCoverOf(src: string | null | undefined): string | null {
  const m = src?.match(/^\/sample\/(cover-\d+)\.svg$/);
  return m ? `/sample/${m[1]}-dark.svg` : null;
}
