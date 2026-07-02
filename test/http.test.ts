import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchText, NotFoundError, RateLimitError } from "../src/http.js";

function mockResponse(
  body: string,
  init: { status?: number; headers?: Record<string, string> } = {}
): Response {
  return new Response(body, {
    status: init.status ?? 200,
    headers: init.headers,
  });
}

describe("fetchText", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns body text on success and does not cache", async () => {
    // Fresh Response per call: a body can only be read once.
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => mockResponse("hello"));

    expect(await fetchText("https://x.test/a")).toBe("hello");
    expect(await fetchText("https://x.test/a")).toBe("hello");
    expect(spy).toHaveBeenCalledTimes(2); // no cache — each call hits the network
  });

  it("throws RateLimitError on 403 with x-ratelimit-remaining: 0", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockResponse("forbidden", {
        status: 403,
        headers: { "x-ratelimit-remaining": "0" },
      })
    );
    await expect(fetchText("https://x.test/rl")).rejects.toBeInstanceOf(
      RateLimitError
    );
    await expect(fetchText("https://x.test/rl")).rejects.toThrow(
      /GITHUB_TOKEN/
    );
  });

  it("throws RateLimitError on 429", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockResponse("slow down", { status: 429 })
    );
    await expect(fetchText("https://x.test/429")).rejects.toBeInstanceOf(
      RateLimitError
    );
  });

  it("does not treat a normal 403 (remaining > 0) as rate-limited", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockResponse("forbidden", {
        status: 403,
        headers: { "x-ratelimit-remaining": "42" },
      })
    );
    const err = await fetchText("https://x.test/403").catch((e) => e);
    expect(err).not.toBeInstanceOf(RateLimitError);
    expect(err).toBeInstanceOf(Error);
  });

  it("throws NotFoundError on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockResponse("nope", { status: 404 })
    );
    await expect(fetchText("https://x.test/404")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
