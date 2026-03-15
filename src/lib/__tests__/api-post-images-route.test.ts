import fs from "fs";
import path from "path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("api/post-images route", () => {
  const originalContentDir = process.env.CONTENT_DIR;
  let contentDirPath = "";
  let contentDirRelative = "";

  beforeEach(() => {
    vi.resetModules();
    contentDirPath = fs.mkdtempSync(path.join(process.cwd(), ".tmp-content-"));
    contentDirRelative = path.relative(process.cwd(), contentDirPath);
    fs.mkdirSync(path.join(contentDirPath, "posts", "tutorial", "ko", "getting-started", "images"), { recursive: true });
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

  it("returns an image response for files under a post-local images directory", async () => {
    fs.writeFileSync(
      path.join(contentDirPath, "posts", "tutorial", "ko", "getting-started", "images", "hero.png"),
      "image-data",
    );

    const { GET } = await import("@/app/api/post-images/[...path]/route");
    const response = await GET(
      new Request("http://localhost/api/post-images/tutorial/ko/getting-started/images/hero.png"),
      {
        params: Promise.resolve({ path: ["tutorial", "ko", "getting-started", "images", "hero.png"] }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });

  it("returns an image response for nested files under a post-local images directory", async () => {
    fs.mkdirSync(
      path.join(contentDirPath, "posts", "tutorial", "ko", "getting-started", "images", "figures"),
      { recursive: true },
    );
    fs.writeFileSync(
      path.join(contentDirPath, "posts", "tutorial", "ko", "getting-started", "images", "figures", "hero.png"),
      "nested-image-data",
    );

    const { GET } = await import("@/app/api/post-images/[...path]/route");
    const response = await GET(
      new Request("http://localhost/api/post-images/tutorial/ko/getting-started/images/figures/hero.png"),
      {
        params: Promise.resolve({ path: ["tutorial", "ko", "getting-started", "images", "figures", "hero.png"] }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });

  it("serves symlinked files from a post-local images directory", async () => {
    fs.mkdirSync(path.join(contentDirPath, "images"), { recursive: true });
    fs.writeFileSync(path.join(contentDirPath, "images", "shared.png"), "shared-image-data");
    fs.symlinkSync(
      path.join(contentDirPath, "images", "shared.png"),
      path.join(contentDirPath, "posts", "tutorial", "ko", "getting-started", "images", "shared.png"),
    );

    const { GET } = await import("@/app/api/post-images/[...path]/route");
    const response = await GET(
      new Request("http://localhost/api/post-images/tutorial/ko/getting-started/images/shared.png"),
      {
        params: Promise.resolve({ path: ["tutorial", "ko", "getting-started", "images", "shared.png"] }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("shared-image-data");
  });

  it("rejects traversal attempts outside the post-local images directory", async () => {
    fs.writeFileSync(path.join(contentDirPath, "posts", "tutorial", "ko", "secret.txt"), "secret");

    const { GET } = await import("@/app/api/post-images/[...path]/route");
    const response = await GET(
      new Request("http://localhost/api/post-images/tutorial/ko/getting-started/images/..%2Fsecret.txt"),
      {
        params: Promise.resolve({ path: ["tutorial", "ko", "getting-started", "images", "..", "secret.txt"] }),
      },
    );

    expect(response.status).toBe(404);
  });
});
