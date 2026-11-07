import "server-only";

/** Feature availability derived from environment variables. Never throws. */
export const services = {
  database: () => Boolean(process.env.DATABASE_URL),
  ai: () => Boolean(process.env.ANTHROPIC_API_KEY),
  speech: () => Boolean(process.env.OPENAI_API_KEY),
  email: () => Boolean(process.env.RESEND_API_KEY),
  storage: () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  calls: () => Boolean(process.env.DAILY_API_KEY),
  google: () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
} as const;

export type ServiceName = keyof typeof services;

export function missingServices(): ServiceName[] {
  return (Object.keys(services) as ServiceName[]).filter((k) => !services[k]());
}

export const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
