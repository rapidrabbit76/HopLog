// Umami runs behind this site: the browser only ever talks to these same-origin paths
// (rewritten in next.config.ts to the /api/umami routes), so the Umami dashboard can stay private.
// The scripts post to "<script folder>/api/...", which is why every path sits under /_u.
export const UMAMI_SCRIPT_PATH = "/_u/script.js";
export const UMAMI_COLLECT_PATH = "/_u/api/send";
// Session replay & heatmap recorder: loads its settings from /_u/api/websites/<id>/recorder and posts to /_u/api/record
export const UMAMI_RECORDER_PATH = "/_u/recorder.js";

export type UmamiScript = "script.js" | "recorder.js";

const MAX_EVENT_BYTES = 16 * 1024;
// Umami accepts up to 1 MB per recording request (replay chunks are flushed at ~500 KB)
const MAX_RECORD_BYTES = 1_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Visitor IP as seen by the edge. CF-Connecting-IP first: Cloudflare overwrites it, while it only appends to X-Forwarded-For */
export function getClientIp(headers: Headers): string | undefined {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return headers.get("cf-connecting-ip") || headers.get("x-real-ip") || forwardedFor || undefined;
}

export async function proxyUmamiScript(serverUrl: string, script: UmamiScript = "script.js"): Promise<Response> {
  try {
    const upstream = await fetch(`${serverUrl}/${script}`, { cache: "no-store" });
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

async function forwardToUmami(url: string, request: Request, maxBytes: number): Promise<Response> {
  const body = await request.text();
  if (body.length > maxBytes) {
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
    const upstream = await fetch(url, { method: "POST", headers, body, cache: "no-store" });
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

export function proxyUmamiEvent(serverUrl: string, request: Request): Promise<Response> {
  return forwardToUmami(`${serverUrl}/api/send`, request, MAX_EVENT_BYTES);
}

export function proxyUmamiRecording(serverUrl: string, request: Request): Promise<Response> {
  return forwardToUmami(`${serverUrl}/api/record`, request, MAX_RECORD_BYTES);
}

/** Recorder settings (sample rate, masking) for this site's own website ID only; other IDs are never forwarded */
export async function proxyUmamiRecorderConfig(serverUrl: string, websiteId: string, requestedId: string): Promise<Response> {
  if (!UUID.test(requestedId) || requestedId.toLowerCase() !== websiteId.toLowerCase()) {
    return new Response(null, { status: 404 });
  }

  try {
    const upstream = await fetch(`${serverUrl}/api/websites/${websiteId}/recorder`, { cache: "no-store" });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
