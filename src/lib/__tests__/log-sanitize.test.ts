import { describe, expect, it } from "vitest";

import { sanitizeLogValue } from "@/lib/log-sanitize";

describe("sanitizeLogValue", () => {
  it("preserves normal ASCII text", () => {
    expect(sanitizeLogValue("Engineering")).toBe("Engineering");
    expect(sanitizeLogValue("Hello, World!")).toBe("Hello, World!");
  });

  it("preserves unicode (non-ASCII) characters", () => {
    expect(sanitizeLogValue("한글 카테고리")).toBe("한글 카테고리");
    expect(sanitizeLogValue("日本語")).toBe("日本語");
    expect(sanitizeLogValue("Ünïcödé")).toBe("Ünïcödé");
  });

  it("preserves tabs (\\x09)", () => {
    expect(sanitizeLogValue("col1\tcol2")).toBe("col1\tcol2");
  });

  it("strips line feed (\\n) to prevent log injection", () => {
    expect(sanitizeLogValue("line1\nINJECTED: fake log entry")).toBe("line1INJECTED: fake log entry");
  });

  it("strips carriage return (\\r)", () => {
    expect(sanitizeLogValue("line1\rline2")).toBe("line1line2");
  });

  it("strips CRLF sequences", () => {
    expect(sanitizeLogValue("before\r\nafter")).toBe("beforeafter");
  });

  it("strips null bytes (\\x00)", () => {
    expect(sanitizeLogValue("be\x00fore")).toBe("before");
  });

  it("strips other low control characters (\\x01–\\x08)", () => {
    expect(sanitizeLogValue("\x01\x02\x03\x04text")).toBe("text");
  });

  it("strips DEL character (\\x7f)", () => {
    expect(sanitizeLogValue("text\x7fmore")).toBe("textmore");
  });

  it("strips ANSI color escape sequences", () => {
    expect(sanitizeLogValue("\x1b[31mred text\x1b[0m")).toBe("red text");
  });

  it("strips bold ANSI escape sequences", () => {
    expect(sanitizeLogValue("\x1b[1;32mbold green\x1b[0m")).toBe("bold green");
  });

  it("handles empty string", () => {
    expect(sanitizeLogValue("")).toBe("");
  });

  it("handles string with only control characters", () => {
    expect(sanitizeLogValue("\n\r\x00\x1b[31m")).toBe("");
  });
});
