import { describe, expect, it } from "vitest";
import type { Post } from "../src/content.js";
import { formatSearchResults } from "../src/format.js";

const post: Post = {
  title: "MCP TypeScript SDK Complete Guide",
  slug: "mcp-typescript-sdk-complete-guide",
  url: "https://blog.agentailor.com/posts/mcp-typescript-sdk-complete-guide.md",
  date: "2026-03-18",
  tags: ["MCP", "Tools"],
  guide: true,
  summary: "Everything in the MCP TypeScript SDK, end to end.",
};

describe("formatSearchResults", () => {
  it("concise format is a link list and flags guides", () => {
    const out = formatSearchResults([post], 1, 20, "concise");
    expect(out).toContain(post.url);
    expect(out).toContain("[Guide]");
    expect(out).not.toContain(post.summary);
  });

  it("detailed format includes date, tags, and summary", () => {
    const out = formatSearchResults([post], 1, 20, "detailed");
    expect(out).toContain(post.summary);
    expect(out).toContain("2026-03-18");
    expect(out).toContain("MCP, Tools");
  });

  it("adds an overflow hint when results are truncated", () => {
    const out = formatSearchResults([post], 42, 1, "concise");
    expect(out).toMatch(/Showing 1 of 42/);
    expect(out).toContain("Narrow");
  });

  it("omits the hint when nothing is truncated", () => {
    const out = formatSearchResults([post], 1, 20, "concise");
    expect(out).not.toMatch(/Showing/);
  });

  it("returns a helpful message for no results", () => {
    const out = formatSearchResults([], 0, 20, "concise");
    expect(out).toMatch(/No matching articles/);
  });
});
