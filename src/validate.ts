/** Pure input-validation helpers shared by the tools. */

import { BLOG_BASE_URL, SAFE_PATH_RE, SAFE_REPO_RE } from "./config.js";

/** True when a URL is an article on the configured blog origin. */
export function isBlogArticleUrl(url: string): boolean {
  return url.startsWith(`${BLOG_BASE_URL}/`);
}

/** True when a repo name is safe to interpolate into a GitHub URL. */
export function isSafeRepo(repo: string): boolean {
  return SAFE_REPO_RE.test(repo);
}

/** Normalizes a requested doc path, or returns null if it isn't allowed. */
export function normalizeDocPath(requested: string): string | null {
  const normalized =
    requested.toLowerCase() === "readme.md" ? "README.md" : requested;
  if (normalized === "README.md" || SAFE_PATH_RE.test(normalized)) {
    return normalized;
  }
  return null;
}
