import { describe, expect, it, vi } from "vitest";

import { NextRequest } from "next/server";

import { proxy } from "@/proxy";

describe("proxy", () => {
  it("ignores malformed referer headers without throwing", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const response = proxy(new NextRequest("http://localhost/api/posts?offset=1", {
      headers: {
        accept: "application/json",
        referer: "not-a-valid-url",
        "user-agent": "Mozilla/5.0",
        "x-real-ip": "127.0.0.1",
      },
    }));

    expect(response.headers.get("x-request-start")).toBeTruthy();
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).not.toContain("ref=");
  });

  it("logs the referer pathname when the header is valid", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    proxy(new NextRequest("http://localhost/about", {
      headers: {
        referer: "https://example.com/docs/getting-started?from=test",
        "user-agent": "Mozilla/5.0",
        "x-forwarded-for": "203.0.113.10",
      },
    }));

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("ref=/docs/getting-started"));
  });

  it("rewrites public post image paths to the internal route", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const response = proxy(new NextRequest("http://localhost/posts/tutorial/ko/getting-started/images/hero-bg.webp", {
      headers: {
        "user-agent": "Mozilla/5.0",
      },
    }));

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/api/post-images/tutorial/ko/getting-started/images/hero-bg.webp",
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("/posts/tutorial/ko/getting-started/images/hero-bg.webp"));
  });

  it("rewrites nested public post image paths to the internal route", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const response = proxy(
      new NextRequest("http://localhost/posts/tutorial/ko/getting-started/images/figures/hero-bg.webp", {
        headers: {
          "user-agent": "Mozilla/5.0",
        },
      }),
    );

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/api/post-images/tutorial/ko/getting-started/images/figures/hero-bg.webp",
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("/posts/tutorial/ko/getting-started/images/figures/hero-bg.webp"),
    );
  });

  it("preserves percent-encoded image segments when rewriting", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const response = proxy(
      new NextRequest("http://localhost/posts/tutorial/ko/getting-started/images/my%20hero-%ED%95%9C%EA%B8%80.webp", {
        headers: {
          "user-agent": "Mozilla/5.0",
        },
      }),
    );

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/api/post-images/tutorial/ko/getting-started/images/my%20hero-%ED%95%9C%EA%B8%80.webp",
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("/posts/tutorial/ko/getting-started/images/my%20hero-%ED%95%9C%EA%B8%80.webp"),
    );
  });

  it("preserves query strings on rewritten post image requests", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const response = proxy(
      new NextRequest("http://localhost/posts/tutorial/ko/getting-started/images/hero-bg.webp?v=1", {
        headers: {
          "user-agent": "Mozilla/5.0",
        },
      }),
    );

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/api/post-images/tutorial/ko/getting-started/images/hero-bg.webp?v=1",
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("/posts/tutorial/ko/getting-started/images/hero-bg.webp?v=1"),
    );
  });
});
