/** Fetch helpers: an in-memory cache and GitHub rate-limit handling. */

/** Raised when GitHub's rate limit is hit; carries an agent-actionable message. */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

// Process-lifetime cache. Data is public and changes rarely, so caching keeps
// us well under GitHub's unauthenticated 60 req/hr/IP budget.
const cache = new Map<string, string>();

/** Adds an Authorization header only when the user supplied a token. */
export function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** True when a GitHub response is a rate-limit rejection. */
function isRateLimited(res: Response): boolean {
  if (res.status === 429) return true;
  return res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0";
}

const RATE_LIMIT_HINT =
  "GitHub's request limit is exhausted (unauthenticated calls are capped at 60/hour). " +
  "Set a GITHUB_TOKEN environment variable to raise the limit to 5,000/hour, then retry.";

/**
 * Cached text fetch. On GitHub rate-limit responses, throws a RateLimitError
 * with an actionable message instead of surfacing a raw 403.
 */
export async function fetchTextCached(
  url: string,
  init?: RequestInit
): Promise<string> {
  const cached = cache.get(url);
  if (cached !== undefined) return cached;

  const res = await fetch(url, init);

  if (isRateLimited(res)) throw new RateLimitError(RATE_LIMIT_HINT);
  if (res.status === 404) throw new NotFoundError(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  cache.set(url, text);
  return text;
}

/** Raised on 404 so callers can return a friendly "not found" tool result. */
export class NotFoundError extends Error {
  constructor(url: string) {
    super(`Not found: ${url}`);
    this.name = "NotFoundError";
  }
}

/** Test-only: clear the cache between cases. */
export function _clearCache(): void {
  cache.clear();
}
