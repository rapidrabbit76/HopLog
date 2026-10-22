import { getAnalyticsRuntimeConfig, getUmamiServerUrl } from "@/lib/config";
import { proxyUmamiRecording } from "@/lib/umami";

export const dynamic = "force-dynamic";

// Served to browsers as /_u/api/record (next.config.ts rewrite)
export async function POST(request: Request) {
  const serverUrl = getUmamiServerUrl();
  if (!serverUrl || !getAnalyticsRuntimeConfig().umami.recorder) {
    return new Response(null, { status: 404 });
  }

  return proxyUmamiRecording(serverUrl, request);
}
