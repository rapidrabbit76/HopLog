import { NextRequest, NextResponse } from "next/server";
import { POSTS_PER_PAGE } from "@/lib/data";
import { getPostListPage } from "@/lib/posts";
import { createLogger } from "@/lib/logger";
import { sanitizeLogValue } from "@/lib/log-sanitize";

const log = createLogger("api/posts");
const MAX_POSTS_LIMIT = 100;

function normalizeOffset(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function normalizeLimit(value: number) {
  if (Number.isNaN(value)) {
    return POSTS_PER_PAGE;
  }

  return Math.min(MAX_POSTS_LIMIT, Math.max(1, value));
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category")?.trim() || undefined;
  const offsetParam = Number.parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10);
  const limitParam = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? `${POSTS_PER_PAGE}`, 10);

  const offset = normalizeOffset(offsetParam);
  const limit = normalizeLimit(limitParam);

  const start = performance.now();
  const data = getPostListPage({ category, offset, limit });
  const ms = (performance.now() - start).toFixed(1);

  log.info(`cat=${sanitizeLogValue(category ?? "all")} offset=${offset} limit=${limit} → ${data.items.length}/${data.totalCount} posts (${ms}ms)`);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
