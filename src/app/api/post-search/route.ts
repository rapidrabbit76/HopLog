import { NextRequest, NextResponse } from "next/server";
import { createSearchProvider } from "@/lib/search";
import { createLogger } from "@/lib/logger";
import { sanitizeLogValue } from "@/lib/log-sanitize";

const log = createLogger("api/search");

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const provider = createSearchProvider();

  log.debug(`query="${sanitizeLogValue(query)}" provider=${provider.mode}`);

  const start = performance.now();
  const data = query ? await provider.search(query) : await provider.getInitialItems();
  const ms = (performance.now() - start).toFixed(1);

  log.info(`${provider.mode} q="${sanitizeLogValue(query)}" → ${data.length} results (${ms}ms)`);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": provider.getQueryCacheControl(query),
    },
  });
}
