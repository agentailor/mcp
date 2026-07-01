import { describe, expect, it } from "vitest";
import {
  isBlogArticleUrl,
  isSafeRepo,
  normalizeDocPath,
} from "../src/validate.js";

describe("isBlogArticleUrl", () => {
  it("accepts blog.agentailor.com URLs", () => {
    expect(isBlogArticleUrl("https://blog.agentailor.com/posts/x.md")).toBe(
      true
    );
  });

  it("rejects other origins", () => {
    expect(isBlogArticleUrl("https://evil.example.com/x.md")).toBe(false);
    expect(isBlogArticleUrl("https://agentailor.com/x.md")).toBe(false);
    expect(isBlogArticleUrl("https://blog.agentailor.com.evil.com/x.md")).toBe(
      false
    );
  });
});

describe("isSafeRepo", () => {
  it("accepts normal repo names", () => {
    expect(isSafeRepo("create-mcp-server")).toBe(true);
    expect(isSafeRepo("repo_1.2")).toBe(true);
  });

  it("rejects path traversal and separators", () => {
    expect(isSafeRepo("../secret")).toBe(false);
    expect(isSafeRepo("a/b")).toBe(false);
    expect(isSafeRepo("a b")).toBe(false);
  });
});

describe("normalizeDocPath", () => {
  it("normalizes readme casing", () => {
    expect(normalizeDocPath("readme.md")).toBe("README.md");
    expect(normalizeDocPath("README.md")).toBe("README.md");
  });

  it("allows docs/*.md", () => {
    expect(normalizeDocPath("docs/quickstart.md")).toBe("docs/quickstart.md");
    expect(normalizeDocPath("docs/sub/dir.md")).toBe("docs/sub/dir.md");
  });

  it("rejects anything outside README.md and docs/*.md", () => {
    expect(normalizeDocPath("package.json")).toBeNull();
    expect(normalizeDocPath("../../etc/passwd")).toBeNull();
    expect(normalizeDocPath("docs/secret.env")).toBeNull();
    expect(normalizeDocPath("src/index.ts")).toBeNull();
  });
});
