import { NextResponse } from "next/server";
import { getColorThemes } from "@/lib/themes";

function generateGiscusCss(colors: Record<string, string>): string {
  const bg = colors.background;
  const fg = colors.foreground;
  const card = colors.card || bg;
  const muted = colors.muted;
  const mutedFg = colors["muted-foreground"];
  const border = colors.border;
  const primary = colors.primary;
  const primaryFg = colors["primary-foreground"];

  return `main {
  --color-canvas-default: ${bg};
  --color-canvas-overlay: ${card};
  --color-canvas-inset: ${bg};
  --color-canvas-subtle: ${card};

  --color-fg-default: ${fg};
  --color-fg-muted: ${mutedFg};
  --color-fg-subtle: ${mutedFg};

  --color-border-default: ${border};
  --color-border-muted: ${border};
  --color-border-overlay: ${border};

  --color-neutral-muted: ${muted};
  --color-neutral-subtle: ${muted};

  --color-accent-fg: ${primary};
  --color-accent-emphasis: ${primary};
  --color-accent-muted: ${primary}80;
  --color-accent-subtle: ${primary}1a;

  --color-btn-bg: ${muted};
  --color-btn-text: ${fg};
  --color-btn-border: ${border};
  --color-btn-hover-bg: ${border};
  --color-btn-hover-border: ${border};

  --color-btn-primary-bg: ${primary};
  --color-btn-primary-text: ${primaryFg};
  --color-btn-primary-border: ${primary};
  --color-btn-primary-hover-bg: ${primary}d9;
  --color-btn-primary-hover-border: ${primary}d9;

  --color-btn-outline-text: ${primary};
  --color-btn-outline-bg: transparent;
  --color-btn-outline-border: ${border};
  --color-btn-outline-hover-text: ${primaryFg};
  --color-btn-outline-hover-bg: ${primary};
  --color-btn-outline-hover-border: ${primary};

  --color-primer-shadow-inset: 0 0 transparent;
  --color-primer-shadow-focus: 0 0 0 3px ${primary}40;

  --color-social-reaction-bg-hover: ${muted};
  --color-social-reaction-bg-reacted-hover: ${primary}1a;
}`;
}

const SAFE_THEME_ID = /^[a-z0-9_-]+$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawThemeId = searchParams.get("theme") || "default";
  const themeId = SAFE_THEME_ID.test(rawThemeId) ? rawThemeId : "default";
  const mode = searchParams.get("mode") === "dark" ? "dark" : "light";

  const themes = getColorThemes();
  const theme = themes.find((t) => t.id === themeId) || themes[0];
  const colors = mode === "dark" ? theme.dark : theme.light;

  return new NextResponse(generateGiscusCss(colors), {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
