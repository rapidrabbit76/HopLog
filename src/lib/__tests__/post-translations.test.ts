import fs from "fs";
import path from "path";
import { expect, it, vi } from "vitest";

it("groups public translation files with the original post without exposing them as separate posts", async () => {
  const root = fs.mkdtempSync(path.join(process.cwd(), ".tmp-translations-"));
  const previous = process.env.CONTENT_DIR;
  try {
    const folder = path.join(root, "posts", "article");
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, "index.md"), "---\ntitle: Korean\ndate: 2026.11.13\ncategory: [KO]\n---\nKorean body");
    fs.writeFileSync(path.join(folder, "index.en.md"), "---\ntitle: English\ndate: 2026.11.13\n---\nEnglish body");
    fs.writeFileSync(path.join(folder, "index.ja.md"), "---\ntitle: Secret\ndate: 2026.11.13\nvisibility: private\n---\nSecret body");
    process.env.CONTENT_DIR = path.relative(process.cwd(), root);
    vi.resetModules();
    const posts = await import("@/lib/posts");
    expect(posts.getAllPosts().map((post) => post.id)).toEqual(["article"]);
    expect(posts.getPostSearchSyncItems().map((post) => post.id)).toEqual(["article"]);
    expect(posts.getPostById("article/index.en")).toBeNull();
    expect(posts.getPostTranslations("article")).toMatchObject({ en: { title: "English", content: "English body" } });
    expect(posts.getPostTranslations("article")).not.toHaveProperty("ja");
  } finally {
    process.env.CONTENT_DIR = previous;
    fs.rmSync(root, { recursive: true, force: true });
    vi.resetModules();
  }
});
