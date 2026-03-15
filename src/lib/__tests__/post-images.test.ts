import path from "path";

import { describe, expect, it } from "vitest";

import { getRelativePostImagePath, resolvePostImageFilePath, resolvePostImageUrl } from "@/lib/post-images";

describe("post image helpers", () => {
  it("rewrites post-local markdown image paths to the public post image path", () => {
    expect(resolvePostImageUrl("tutorial/ko/getting-started", "./images/figures/diagram.png")).toBe(
      "/posts/tutorial/ko/getting-started/images/figures/diagram.png",
    );
    expect(resolvePostImageUrl("tutorial/ko/getting-started", "images/diagram.png")).toBe(
      "/posts/tutorial/ko/getting-started/images/diagram.png",
    );
  });

  it("leaves non post-local image paths unchanged", () => {
    expect(resolvePostImageUrl("tutorial/test", "/api/images/hero.png")).toBe("/api/images/hero.png");
    expect(resolvePostImageUrl("tutorial/test", "https://example.com/hero.png")).toBe("https://example.com/hero.png");
    expect(resolvePostImageUrl("tutorial/test", "../images/hero.png")).toBe("../images/hero.png");
    expect(resolvePostImageUrl("tutorial/test", "hero.png")).toBe("hero.png");
  });

  it("extracts only image paths rooted under the local images directory", () => {
    expect(getRelativePostImagePath("./images/hero.png")).toBe("hero.png");
    expect(getRelativePostImagePath("images/figures/hero.png")).toBe("figures/hero.png");
    expect(getRelativePostImagePath("./assets/hero.png")).toBeNull();
    expect(getRelativePostImagePath("../images/hero.png")).toBeNull();
  });

  it("resolves image files only within the post-local images directory", () => {
    const fullPath = resolvePostImageFilePath(["tutorial", "ko", "getting-started"], "figures/diagram.png");

    expect(fullPath).toBe(
      path.resolve(process.cwd(), "content", "posts", "tutorial", "ko", "getting-started", "images", "figures", "diagram.png"),
    );
    expect(resolvePostImageFilePath(["tutorial", "ko", "getting-started"], "../secret.txt")).toBeNull();
  });
});
