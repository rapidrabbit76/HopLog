---
title: "Getting Started with HopLog"
date: "2026.03.12"
category: ["EN", "Guide", "HopLog"]
excerpt: "From installation to your first post. Covers project structure, frontmatter, keyboard shortcuts, and i18n."
image: "./images/hero-bg.webp"
---

## Quick Start with Docker (Recommended)

The fastest way to get HopLog running is with Docker. Just prepare a `content/` directory with your posts and config, then:

```bash
docker run -p 3000:3000 \
  -v $(pwd)/content:/app/content \
  rapidrabbit76/hoplog:latest
```

Open `http://localhost:3000` — your blog is live. For full-text search, use Docker Compose:

```bash
docker compose --profile search up -d
```

See the [Deployment](/posts/tutorial/deployment) guide for details on services, environment variables, and the search-sync sidecar.

## Local Development

If you want to develop or customize HopLog itself:

```bash
bun install
bun run dev
```

For production: `bun run build && bun start`

## Project Structure

```text
content/
  config.yml          # Site metadata, hero, typography, search, comments, analytics
  profile.yml         # Profile, social links, experience, skills
  seo.yml             # SEO, OpenGraph, Twitter, robots policy
  posts/              # Markdown posts (scanned recursively)
  themes/             # Color theme YAML files
  images/             # Images (served via /api/images/)
  faq/                # FAQ locale files (en.yml, ko.yml, ...)
messages/
  en.json             # UI translations (en, ko, ja, zh)
  ko.json
  ja.json
  zh.json
```

## Writing Posts

Create a `.md` file anywhere under `content/posts/`. Nested paths are supported and map directly to URL slugs.

```text
content/posts/tutorial/getting-started.md → /posts/tutorial/getting-started
content/posts/my-first-post.md            → /posts/my-first-post
```

### Frontmatter

```yaml
---
title: "Post Title"                        # required
date: "2026.03.12"                         # required
category: ["EN", "Dev", "Guide"]                 # required
excerpt: "Short summary"                   # optional (auto-generated from body if omitted)
image: "./images/thumbnail.jpg"            # optional (post-local thumbnail & OG image)
fontFamily: "'Noto Sans KR', sans-serif"   # optional (per-post font override)
fontUrl: "https://fonts.googleapis.com/..."# optional
visibility: "private"                      # optional (hides post entirely)
seo:                                       # optional (per-post SEO overrides)
  title: "Custom SEO Title"
  description: "Custom meta description"
  keywords: ["keyword1", "keyword2"]
  noindex: false
---
```

### Post-local Images

This document uses an image stored next to the post itself. Put `content/posts/tutorial/getting-started/images/hero-bg.webp` beside the markdown file and reference it directly from markdown with a relative path.

```md
![Post-local image example](./images/hero-bg.webp)
```

![Post-local image example](./images/hero-bg.webp)

### Private Posts

Set `visibility: "private"` to exclude a post from listings, route generation, sitemap, and direct URL access. The legacy `public: false` format is also supported.

## Home Page Post Feed

The home page starts with the first page of posts, lets readers switch categories from the filter pill, and loads additional posts incrementally with the “Load more” button. These follow-up requests are served through `/api/posts`.

## Markdown Features

- **Code blocks**: Syntax highlighting with a copy button on hover
- **Math**: KaTeX support via `remark-math` + `rehype-katex`
- **GFM tables**: GitHub Flavored Markdown tables
- **Table of Contents**: Auto-generated sticky ToC on wide screens with scroll tracking
- **Images**: Use `content/images/` + `/api/images/...` for shared assets, or a post-local `images/` folder + `./images/...` for per-post assets
- **Post sharing**: Configure `sharing:` in `content/config.yml` to show icon-only share buttons at the bottom of each post (`twitter`, `facebook`, `linkedin`, `copyLink`)

## Keyboard Shortcuts

| Key                       | Action              |
| ------------------------- | ------------------- |
| `?`                       | Shortcut help       |
| `⌘⇧P` / `Ctrl+Shift+P`  | Command Palette     |
| `T`                       | Toggle dark/light   |
| `W`                       | Toggle wide mode    |
| `G H`                     | Go to home          |
| `G B`                     | Go to about         |
| `G F`                     | Go to FAQ           |

## Internationalization

UI text is managed in `messages/*.json` files. English, Korean, Japanese, and Chinese are supported. Switch languages from the header dropdown or the Command Palette.

Each file shares the same key structure: `header`, `postList`, `error`, `common`, `command`, `activity`.

---

Next: [Site Configuration](/posts/tutorial/site-configuration) | [Themes & Typography](/posts/tutorial/themes-and-typography) | [Search](/posts/tutorial/search) | [Deployment](/posts/tutorial/deployment)
