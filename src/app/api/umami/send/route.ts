import { getUmamiServerUrl } from "@/lib/config";
import { proxyUmamiEvent } from "@/lib/umami";

export const dynamic = "force-dynamic";

// Served to browsers as /_u/api/send (next.config.ts rewrite)
export async function POST(request: Request) {
  const serverUrl = getUmamiServerUrl();
  if (!serverUrl) {
    return new Response(null, { status: 404 });
  }

  return proxyUmamiEvent(serverUrl, request);
}
