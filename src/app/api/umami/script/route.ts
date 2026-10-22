import { getUmamiServerUrl } from "@/lib/config";
import { proxyUmamiScript } from "@/lib/umami";

export const dynamic = "force-dynamic";

// Served to browsers as /_u/script.js (next.config.ts rewrite)
export async function GET() {
  const serverUrl = getUmamiServerUrl();
  if (!serverUrl) {
    return new Response(null, { status: 404 });
  }

  return proxyUmamiScript(serverUrl);
}
