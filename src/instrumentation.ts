/**
 * Server error reporting (Stage 10). Always a structured, PII-free log line; when SENTRY_DSN
 * is set, also a minimal event to Sentry's store API (no SDK needed, optional key).
 */
export async function register() {}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  const e = err as Error & { digest?: string };
  const line = {
    t: new Date().toISOString(),
    level: "error",
    event: "server.request_error",
    route: context.routePath,
    type: context.routeType,
    method: request.method,
    digest: e?.digest ?? null,
    name: e?.name,
  };
  console.error(JSON.stringify(line));
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/\//g, "");
    await fetch(`${u.protocol}//${u.host}/api/${projectId}/store/`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sentry-auth": `Sentry sentry_version=7, sentry_key=${u.username}, sentry_client=able/1.0`,
      },
      // Route template only (no query strings, no user data).
      body: JSON.stringify({
        level: "error",
        platform: "javascript",
        transaction: context.routePath,
        exception: { values: [{ type: e?.name ?? "Error", value: (e?.message ?? "").slice(0, 300) }] },
        tags: { digest: e?.digest ?? "" },
      }),
    });
  } catch {
    // Reporting must never throw.
  }
}
