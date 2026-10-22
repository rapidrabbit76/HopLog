import { getAnalyticsRuntimeConfig, getUmamiServerUrl } from "@/lib/config";
import { proxyUmamiRecorderConfig } from "@/lib/umami";

export const dynamic = "force-dynamic";

// Served to browsers as /_u/api/websites/<id>/recorder (next.config.ts rewrite)
export async function GET(_request: Request, { params }: { params: Promise<{ websiteId: string }> }) {
  const serverUrl = getUmamiServerUrl();
  const { umami } = getAnalyticsRuntimeConfig();
  if (!serverUrl || !umami.recorder || !umami.websiteId) {
    return new Response(null, { status: 404 });
  }

  return proxyUmamiRecorderConfig(serverUrl, umami.websiteId, (await params).websiteId);
}
