import { afterEach, describe, expect, it, vi } from "vitest";

import { getClientIp, proxyUmamiEvent, proxyUmamiRecorderConfig, proxyUmamiRecording, proxyUmamiScript } from "@/lib/umami";

describe("getClientIp", () => {
  it("prefers CF-Connecting-IP over a client-supplied X-Forwarded-For", () => {
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1, 203.0.113.7" });
    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to the first X-Forwarded-For entry", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("198.51.100.1");
  });

  it("returns undefined without proxy headers", () => {
    expect(getClientIp(new Headers())).toBeUndefined();
  });
});

describe("Umami proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serves the tracker script from the Umami server", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("!function(){}()", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyUmamiScript("http://umami:3000");

    expect(fetchMock).toHaveBeenCalledWith("http://umami:3000/script.js", { cache: "no-store" });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("javascript");
    expect(await response.text()).toBe("!function(){}()");
  });

  it("forwards events with the visitor IP, user agent and session cache only", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"cache":"abc"}', { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://blog.example.com/_u/api/send", {
      method: "POST",
      body: '{"type":"event","payload":{}}',
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0",
        "x-umami-cache": "token",
        "cf-connecting-ip": "203.0.113.7",
        cookie: "session=secret",
      },
    });

    const response = await proxyUmamiEvent("http://umami:3000", request);

    const [url, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Headers;
    expect(url).toBe("http://umami:3000/api/send");
    expect(init.body).toBe('{"type":"event","payload":{}}');
    expect(headers.get("x-real-ip")).toBe("203.0.113.7");
    expect(headers.get("user-agent")).toBe("Mozilla/5.0");
    expect(headers.get("x-umami-cache")).toBe("token");
    expect(headers.get("cookie")).toBeNull();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('{"cache":"abc"}');
  });

  it("rejects oversized events without calling Umami", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://blog.example.com/_u/api/send", { method: "POST", body: "x".repeat(17 * 1024) });

    const response = await proxyUmamiEvent("http://umami:3000", request);

    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 502 when Umami is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    expect((await proxyUmamiScript("http://umami:3000")).status).toBe(502);
  });

  it("serves the recorder script", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("recorder", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await proxyUmamiScript("http://umami:3000", "recorder.js");

    expect(fetchMock).toHaveBeenCalledWith("http://umami:3000/recorder.js", { cache: "no-store" });
  });

  it("forwards replay chunks up to Umami's 1 MB limit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const chunk = new Request("https://blog.example.com/_u/api/record", { method: "POST", body: "x".repeat(600 * 1024) });

    const response = await proxyUmamiRecording("http://umami:3000", chunk);

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe("http://umami:3000/api/record");
    const tooBig = new Request("https://blog.example.com/_u/api/record", { method: "POST", body: "x".repeat(1_000_001) });
    expect((await proxyUmamiRecording("http://umami:3000", tooBig)).status).toBe(413);
  });

  it("only forwards recorder settings for this site's own website ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"enabled":true}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const own = "bb9457e3-4a7b-41ae-8b65-30b54b9e6647";

    const ok = await proxyUmamiRecorderConfig("http://umami:3000", own, own);
    const other = await proxyUmamiRecorderConfig("http://umami:3000", own, "fbf4b685-38f2-430d-94c8-f86ea5f476eb");
    const traversal = await proxyUmamiRecorderConfig("http://umami:3000", own, "../../users");

    expect(ok.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(`http://umami:3000/api/websites/${own}/recorder`, { cache: "no-store" });
    expect(other.status).toBe(404);
    expect(traversal.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
