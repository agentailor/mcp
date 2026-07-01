/** Response formatting: concise vs detailed shapes for search results. */

import type { ResponseFormat } from "./config.js";
import type { Post } from "./content.js";

/** One search hit, rendered per the requested verbosity. */
function formatPost(post: Post, format: ResponseFormat): string {
  const badge = post.guide ? " [Guide]" : "";
  if (format === "concise") {
    return `- ${post.title}${badge} — ${post.url}`;
  }
  const tags = post.tags.length ? ` (${post.tags.join(", ")})` : "";
  return [
    `### ${post.title}${badge}`,
    `${post.url}`,
    `${post.date}${tags}`,
    post.summary,
  ].join("\n");
}

/**
 * Renders a search result set. `total` is the pre-truncation count so an
 * overflow hint can steer the agent toward a narrower query.
 */
export function formatSearchResults(
  results: Post[],
  total: number,
  limit: number,
  format: ResponseFormat
): string {
  if (results.length === 0) {
    return "No matching articles. Try a broader query, fewer tags, or drop guidesOnly.";
  }

  const sep = format === "concise" ? "\n" : "\n\n";
  const body = results.map((p) => formatPost(p, format)).join(sep);

  if (total > results.length) {
    const hint =
      `\n\nShowing ${results.length} of ${total} matches. ` +
      `Narrow with a more specific query, tags, or guidesOnly to see the most relevant ones ` +
      `(or raise limit up to ${total}).`;
    return body + hint;
  }
  return body;
}
