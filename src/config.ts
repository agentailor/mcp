/** Central config: fetch targets, safety rules, and shared defaults. */

/** Blog origin. Overridable for local testing (e.g. http://localhost:3000). */
export const BLOG_BASE_URL = (
  process.env.BLOG_BASE_URL ?? "https://blog.agentailor.com"
).replace(/\/$/, "");

/** Structured, machine-readable post index. */
export const LLMS_JSON_URL = `${BLOG_BASE_URL}/llms.json`;

/** Corpus map (llms-full.txt): the "what exists" index. */
export const BLOG_INDEX_URL = `${BLOG_BASE_URL}/llms-full.txt`;

/** Public GitHub org whose repos are exposed. */
export const GITHUB_ORG = process.env.GITHUB_ORG ?? "agentailor";

// Hard-validate repo names and doc paths before building any URL.
export const SAFE_REPO_RE = /^[a-zA-Z0-9_.-]+$/;
export const SAFE_PATH_RE = /^docs\/[a-zA-Z0-9_./%-]+\.md$/;

/** Default page size for search results. */
export const SEARCH_LIMIT_DEFAULT = 20;

/** Response verbosity contract shared by read tools. */
export const RESPONSE_FORMATS = ["concise", "detailed"] as const;
export type ResponseFormat = (typeof RESPONSE_FORMATS)[number];
