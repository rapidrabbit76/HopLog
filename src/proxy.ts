import { NextRequest, NextResponse } from "next/server";

function getRefererPath(referer: string | null) {
  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).pathname;
  } catch {
    return null;
  }
}

function getPostImageRewrite(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 4 || segments[0] !== "posts") {
    return null;
  }

  const imageDirIndex = segments.lastIndexOf("images");

  if (imageDirIndex <= 1 || imageDirIndex === segments.length - 1) {
    return null;
  }

  const postSegments = segments.slice(1, imageDirIndex);
  const imageSegments = segments.slice(imageDirIndex + 1);

  return {
    postSegments,
    imagePath: imageSegments.join("/"),
  };
}

export function proxy(request: NextRequest) {
  const start = Date.now();

  const { method } = request;
  const url = request.nextUrl;
  const path = url.pathname;
  const query = url.search || "";
  const rewrite = getPostImageRewrite(path);
  const response = (() => {
    if (!rewrite) {
      return NextResponse.next();
    }

    const rewriteUrl = url.clone();
    rewriteUrl.pathname = `/api/post-images/${rewrite.postSegments.map(encodeURIComponent).join("/")}/images/${rewrite.imagePath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
    rewriteUrl.search = "";

    return NextResponse.rewrite(rewriteUrl);
  })();

  // Client info
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const ua = request.headers.get("user-agent") || "";
  const shortUA = parseUA(ua);
  const referer = request.headers.get("referer");
  const refererPath = getRefererPath(referer);

  // Timing
  const ms = Date.now() - start;

  // Build log parts
  const parts = [
    `${method} ${path}${query}`,
    `${ms}ms`,
    shortUA,
    `ip=${ip}`,
  ];
  if (refererPath) parts.push(`ref=${refererPath}`);

  // Content negotiation
  const accept = request.headers.get("accept") || "";
  if (accept && !accept.includes("text/html") && !accept.includes("*/*")) {
    parts.push(`accept=${accept.split(",")[0]}`);
  }

  console.log(`▸ ${parts.join(" │ ")}`);

  // Pass timing info downstream for API routes
  response.headers.set("x-request-start", start.toString());
  response.headers.set("server-timing", `middleware;dur=${ms}`);

  return response;
}

function parseUA(ua: string): string {
  if (!ua) return "unknown";

  // Bots
  if (/googlebot/i.test(ua)) return "Googlebot";
  if (/bingbot/i.test(ua)) return "Bingbot";
  if (/gptbot/i.test(ua)) return "GPTBot";
  if (/claudebot/i.test(ua)) return "ClaudeBot";
  if (/slurp/i.test(ua)) return "YahooBot";
  if (/duckduckbot/i.test(ua)) return "DuckDuckBot";
  if (/mj12bot/i.test(ua)) return "MJ12Bot";
  if (/semrushbot/i.test(ua)) return "SemrushBot";
  if (/ahrefsbot/i.test(ua)) return "AhrefsBot";
  if (/bot|crawl|spider|scrape/i.test(ua)) return "Bot";

  // Browsers
  const chrome = ua.match(/Chrome\/(\d+)/);
  const firefox = ua.match(/Firefox\/(\d+)/);
  const safari = ua.match(/Version\/(\d+).*Safari/);
  const edge = ua.match(/Edg\/(\d+)/);

  // OS
  let os = "";
  if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Mac OS/.test(ua)) os = "Mac";
  else if (/Windows/.test(ua)) os = "Win";
  else if (/Linux/.test(ua)) os = "Linux";

  if (edge) return `Edge/${edge[1]}${os ? ` ${os}` : ""}`;
  if (chrome) return `Chrome/${chrome[1]}${os ? ` ${os}` : ""}`;
  if (firefox) return `Firefox/${firefox[1]}${os ? ` ${os}` : ""}`;
  if (safari) return `Safari/${safari[1]}${os ? ` ${os}` : ""}`;

  // Curl, wget, etc.
  if (/curl/i.test(ua)) return "curl";
  if (/wget/i.test(ua)) return "wget";

  return ua.slice(0, 20);
}

export const config = {
  matcher: [
    "/posts/:path*/images/:path*",
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon|apple-icon|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|css|js)$).*)",
  ],
};
