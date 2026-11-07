/**
 * Sponsors shown in the header ("Supported by") and the thank-you section.
 * Add real logo files to /public/sponsors/ and set `logo` to the path.
 * Never invent or download a real organization's logo — leave `logo: null`
 * to render a neutral placeholder labelled "Sponsor logo".
 */
export interface Sponsor {
  id: string;
  name: string | null;
  logo: string | null;
  url?: string;
}

export const sponsors: Sponsor[] = [
  { id: "sponsor-1", name: null, logo: null },
  { id: "sponsor-2", name: null, logo: null },
  { id: "sponsor-3", name: null, logo: null },
];
