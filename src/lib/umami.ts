// Umami runs behind this site: the browser only ever talks to these two same-origin paths
// (rewritten in next.config.ts to the /api/umami routes), so the Umami dashboard can stay private.
// The tracker posts to "<script folder>/api/send", which is why the collect path sits under /_u too.
export const UMAMI_SCRIPT_PATH = "/_u/script.js";
export const UMAMI_COLLECT_PATH = "/_u/api/send";

const MAX_EVENT_BYTES = 16 * 1024;

/** Visitor IP as seen by the edge. CF-Connecting-IP first: Cloudflare overwrites it, while it only appends to X-Forwarded-For */
export function getClientIp(headers: Headers): string | undefined {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return headers.get("cf-connecting-ip") || headers.get("x-real-ip") || forwardedFor || undefined;
}

export async function proxyUmamiScript(serverUrl: string): Promise<Response> {
  try {
    const upstream = await fetch(`${serverUrl}/script.js`, { cache: "no-store" });
    if (!upstream.ok) {
      return new Response(null, { status: 502 });
    }

    return new Response(await upstream.text(), {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

export async function proxyUmamiEvent(serverUrl: string, request: Request): Promise<Response> {
  const body = await request.text();
  if (body.length > MAX_EVENT_BYTES) {
    return new Response(null, { status: 413 });
  }

  // Umami derives browser/OS from User-Agent, location from the IP, and keeps the session via x-umami-cache
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const name of ["user-agent", "accept-language", "x-umami-cache"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const ip = getClientIp(request.headers);
  if (ip) headers.set("x-real-ip", ip);

  try {
    const upstream = await fetch(`${serverUrl}/api/send`, { method: "POST", headers, body, cache: "no-store" });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
