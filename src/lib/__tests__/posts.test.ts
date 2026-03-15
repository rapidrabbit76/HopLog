import fs from "fs";
import path from "path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isPrivatePost, parseSEO } from "@/lib/posts";

describe("isPrivatePost", () => {
  it("returns true when visibility is private", () => {
    expect(isPrivatePost({ visibility: "private" })).toBe(true);
  });

  it("returns false when visibility is public", () => {
    expect(isPrivatePost({ visibility: "public" })).toBe(false);
  });

  it("returns true when legacy public flag is false", () => {
    expect(isPrivatePost({ public: false })).toBe(true);
  });

  it("returns false when private indicators are missing", () => {
    expect(isPrivatePost({})).toBe(false);
  });
});

describe("parseSEO", () => {
  it("returns undefined when no seo-related fields are present", () => {
    expect(parseSEO({})).toBeUndefined();
    expect(parseSEO({ seo: {} })).toBeUndefined();
  });

  it("returns partial seo values when provided", () => {
    expect(parseSEO({ seo: { title: "My SEO Title", description: "My SEO Description" } })).toEqual({
      title: "My SEO Title",
      description: "My SEO Description",
    });
  });

  it("uses post image fallback for OG and Twitter images", () => {
    expect(parseSEO({ image: "/cover.png" })).toEqual({
      ogImage: "/cover.png",
      twitterImage: "/cover.png",
    });
  });

  it("resolves post-local relative image fields when a post id is provided", () => {
    expect(
      parseSEO(
        {
          image: "./images/cover.png",
          seo: {
            ogImage: "images/og.png",
            twitterImage: "images/twitter.png",
          },
        },
        "tutorial/ko/getting-started",
      ),
    ).toEqual({
      ogImage: "/posts/tutorial/ko/getting-started/images/og.png",
      twitterImage: "/posts/tutorial/ko/getting-started/images/twitter.png",
    });
  });

  it("ignores seo fields with invalid types", () => {
    expect(
      parseSEO({
        seo: {
          title: 123,
          description: false,
          keywords: ["valid", 100, null],
          ogImageWidth: "1200",
          ogImageHeight: "630",
          twitterCard: 10,
          noindex: "false",
        },
      }),
    ).toEqual({
      keywords: ["valid"],
    });
  });
});

describe("post image rewriting integration", () => {
  const originalContentDir = process.env.CONTENT_DIR;
  let contentDirPath = "";
  let contentDirRelative = "";

  beforeEach(() => {
    vi.resetModules();
    contentDirPath = fs.mkdtempSync(path.join(process.cwd(), ".tmp-content-"));
    contentDirRelative = path.relative(process.cwd(), contentDirPath);
    fs.mkdirSync(path.join(contentDirPath, "posts", "tutorial", "ko"), { recursive: true });
    process.env.CONTENT_DIR = contentDirRelative;
  });

  afterEach(() => {
    if (originalContentDir === undefined) {
      delete process.env.CONTENT_DIR;
    } else {
      process.env.CONTENT_DIR = originalContentDir;
    }

    if (contentDirPath) {
      fs.rmSync(contentDirPath, { recursive: true, force: true });
    }
  });

  it("rewrites post-local frontmatter image fields in loaded posts", async () => {
    fs.writeFileSync(
      path.join(contentDirPath, "posts", "tutorial", "ko", "getting-started.md"),
      `---
title: "Getting Started"
date: "2026.03.12"
category: ["Guide"]
image: "./images/cover.png"
seo:
  ogImage: "images/og.png"
  twitterImage: "images/twitter.png"
---

Body
`,
    );

    const { getAllPosts, getPostById } = await import("@/lib/posts");
    const post = getPostById("tutorial/ko/getting-started");
    const allPosts = getAllPosts();

    expect(post?.image).toBe("/posts/tutorial/ko/getting-started/images/cover.png");
    expect(post?.seo?.ogImage).toBe("/posts/tutorial/ko/getting-started/images/og.png");
    expect(post?.seo?.twitterImage).toBe("/posts/tutorial/ko/getting-started/images/twitter.png");
    expect(allPosts[0]?.image).toBe("/posts/tutorial/ko/getting-started/images/cover.png");
  });
});
