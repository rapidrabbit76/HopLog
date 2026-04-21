import { describe, expect, it } from "vitest";

import { isSafeCssColor } from "@/lib/themes";

describe("isSafeCssColor", () => {
  it("allows short hex colors", () => {
    expect(isSafeCssColor("#fff")).toBe(true);
    expect(isSafeCssColor("#000")).toBe(true);
    expect(isSafeCssColor("#abc")).toBe(true);
  });

  it("allows long hex colors", () => {
    expect(isSafeCssColor("#ffffff")).toBe(true);
    expect(isSafeCssColor("#3182f6")).toBe(true);
  });

  it("allows 8-digit hex colors with alpha", () => {
    expect(isSafeCssColor("#3182f680")).toBe(true);
    expect(isSafeCssColor("#ffffffff")).toBe(true);
  });

  it("allows rgb and rgba functions", () => {
    expect(isSafeCssColor("rgb(50, 130, 246)")).toBe(true);
    expect(isSafeCssColor("rgba(50, 130, 246, 0.5)")).toBe(true);
  });

  it("allows hsl and hsla functions", () => {
    expect(isSafeCssColor("hsl(210, 100%, 50%)")).toBe(true);
    expect(isSafeCssColor("hsla(210, 100%, 50%, 0.8)")).toBe(true);
  });

  it("allows oklch and other modern CSS color functions", () => {
    expect(isSafeCssColor("oklch(0.7 0.15 250)")).toBe(true);
    expect(isSafeCssColor("oklab(0.5 0.1 -0.1)")).toBe(true);
  });

  it("allows named CSS colors", () => {
    expect(isSafeCssColor("red")).toBe(true);
    expect(isSafeCssColor("blue")).toBe(true);
    expect(isSafeCssColor("transparent")).toBe(true);
  });

  it("rejects values with semicolons (CSS injection)", () => {
    expect(isSafeCssColor("red; } body { display:none")).toBe(false);
  });

  it("rejects values with @import (CSS injection)", () => {
    expect(isSafeCssColor("#fff; @import url(evil.css)")).toBe(false);
  });

  it("rejects values with curly braces", () => {
    expect(isSafeCssColor("red}")).toBe(false);
    expect(isSafeCssColor("{color:red")).toBe(false);
    expect(isSafeCssColor("rgb(0;0;0{background:red")).toBe(false);
  });

  it("rejects expression() (legacy IE XSS vector)", () => {
    expect(isSafeCssColor("expression(alert(1))")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isSafeCssColor("")).toBe(false);
  });

  it("trims whitespace before validation", () => {
    expect(isSafeCssColor("  #fff  ")).toBe(true);
    expect(isSafeCssColor("  red  ")).toBe(true);
  });
});
