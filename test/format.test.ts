import { describe, expect, it } from "vitest";
import type { Post } from "../src/content.js";
import { buildSearchResponse } from "../src/format.js";

const post: Post = {
  title: "MCP TypeScript SDK Complete Guide",
  slug: "mcp-typescript-sdk-complete-guide",
  url: "https://blog.agentailor.com/posts/mcp-typescript-sdk-complete-guide.md",
  date: "2026-03-18",
  tags: ["MCP", "Tools"],
  guide: true,
  summary: "Everything in the MCP TypeScript SDK, end to end.",
};

describe("buildSearchResponse", () => {
  it("concise result carries title, url, and guide only", () => {
    const res = buildSearchResponse([post], 1, 20, "concise");
    expect(res.results).toHaveLength(1);
    const [r] = res.results;
    expect(r).toEqual({ title: post.title, url: post.url, guide: true });
    expect(r.summary).toBeUndefined();
    expect(res.total).toBe(1);
    expect(res.shown).toBe(1);
  });

  it("detailed result adds date, tags, and summary", () => {
    const [r] = buildSearchResponse([post], 1, 20, "detailed").results;
    expect(r.date).toBe("2026-03-18");
    expect(r.tags).toEqual(["MCP", "Tools"]);
    expect(r.summary).toBe(post.summary);
  });

  it("adds an overflow hint when results are truncated", () => {
    const res = buildSearchResponse([post], 42, 1, "concise");
    expect(res.total).toBe(42);
    expect(res.shown).toBe(1);
    expect(res.hint).toMatch(/Showing 1 of 42/);
  });

  it("omits the hint when nothing is truncated", () => {
    const res = buildSearchResponse([post], 1, 20, "concise");
    expect(res.hint).toBeUndefined();
  });

  it("returns an empty result set with a helpful hint for no matches", () => {
    const res = buildSearchResponse([], 0, 20, "concise");
    expect(res.results).toEqual([]);
    expect(res.total).toBe(0);
    expect(res.hint).toMatch(/No matching articles/);
  });
});
