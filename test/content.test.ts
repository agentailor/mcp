import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type Post, searchPosts } from "../src/content.js";

const fixture = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("./fixtures/llms.json", import.meta.url)),
    "utf8"
  )
) as { posts: Post[] };
const posts = fixture.posts;

describe("searchPosts", () => {
  it("returns the full index when no params are given", () => {
    expect(searchPosts(posts, {})).toHaveLength(posts.length);
  });

  it("matches a free-text query against title, summary, and tags", () => {
    const bySummary = searchPosts(posts, { query: "principles" });
    expect(bySummary.map((p) => p.slug)).toEqual([
      "writing-tools-for-ai-agents",
    ]);

    const byTitle = searchPosts(posts, { query: "roadmap" });
    expect(byTitle.map((p) => p.slug)).toContain("agent-development-roadmap");
  });

  it("matches multiple query terms with OR and ranks by match count", () => {
    // No article contains the contiguous phrase "agents tools", but several
    // contain one or both terms. Old phrase-matching returned nothing here.
    const res = searchPosts(posts, { query: "agents tools" });
    expect(res.length).toBeGreaterThan(0);
    // "writing-tools-for-ai-agents" matches both terms -> ranked first.
    expect(res[0].slug).toBe("writing-tools-for-ai-agents");
  });

  it("degrades gracefully when only some terms match", () => {
    // "roadmap" hits one post; "nonexistentterm" hits none. Still returns the
    // roadmap post instead of a silent empty.
    const res = searchPosts(posts, { query: "roadmap nonexistentterm" });
    expect(res.map((p) => p.slug)).toContain("agent-development-roadmap");
  });

  it("returns empty only when no term matches anything", () => {
    expect(searchPosts(posts, { query: "zzz qqq" })).toHaveLength(0);
  });

  it("is case- and format-insensitive for tags", () => {
    const a = searchPosts(posts, { tags: ["mcp server"] });
    const b = searchPosts(posts, { tags: ["mcp-server"] });
    const c = searchPosts(posts, { tags: ["MCP Server"] });
    expect(a.map((p) => p.slug)).toEqual(["mcp-typescript-sdk-complete-guide"]);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });

  it("requires ALL given tags (AND semantics)", () => {
    const both = searchPosts(posts, { tags: ["MCP", "Tools"] });
    expect(both.map((p) => p.slug).sort()).toEqual([
      "mcp-typescript-sdk-complete-guide",
      "writing-tools-for-ai-agents",
    ]);
  });

  it("filters to guides only", () => {
    const guides = searchPosts(posts, { guidesOnly: true });
    expect(guides.every((p) => p.guide)).toBe(true);
    expect(guides).toHaveLength(2);
  });

  it("combines query, tags, and guidesOnly (all narrow together)", () => {
    // "MCP" tag + guidesOnly matches both MCP guides...
    expect(
      searchPosts(posts, { tags: ["MCP"], guidesOnly: true })
        .map((p) => p.slug)
        .sort()
    ).toEqual([
      "agent-development-roadmap",
      "mcp-typescript-sdk-complete-guide",
    ]);

    // ...adding a query term unique to one of them isolates it.
    const res = searchPosts(posts, {
      query: "sdk",
      tags: ["MCP"],
      guidesOnly: true,
    });
    expect(res.map((p) => p.slug)).toEqual([
      "mcp-typescript-sdk-complete-guide",
    ]);
  });

  it("returns nothing when filters exclude everything", () => {
    expect(searchPosts(posts, { tags: ["nonexistent-tag"] })).toHaveLength(0);
  });
});
