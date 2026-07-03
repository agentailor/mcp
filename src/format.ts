/** Search-response shaping: concise vs detailed article records + envelope. */

import type { ResponseFormat } from "./config.js";
import type { Post } from "./content.js";

/** A single article result. Detailed adds date, tags, and summary. */
export interface ArticleResult {
  title: string;
  url: string;
  guide: boolean;
  date?: string;
  tags?: string[];
  summary?: string;
}

/** The JSON envelope returned by agentailor_search_articles. */
export interface SearchResponse {
  results: ArticleResult[];
  total: number;
  shown: number;
  hint?: string;
}

/** Projects a post to a result record per the requested verbosity. */
function toResult(post: Post, format: ResponseFormat): ArticleResult {
  const base: ArticleResult = {
    title: post.title,
    url: post.url,
    guide: post.guide,
  };
  if (format === "concise") return base;
  return {
    ...base,
    date: post.date,
    tags: post.tags,
    summary: post.summary,
  };
}

/**
 * Builds the search-response envelope. `total` is the pre-truncation count so
 * an overflow hint can steer the agent toward a narrower query.
 */
export function buildSearchResponse(
  results: Post[],
  total: number,
  limit: number,
  format: ResponseFormat
): SearchResponse {
  if (results.length === 0) {
    return {
      results: [],
      total: 0,
      shown: 0,
      hint: "No matching articles. Try a broader query, fewer tags, or drop guidesOnly.",
    };
  }

  const response: SearchResponse = {
    results: results.map((p) => toResult(p, format)),
    total,
    shown: results.length,
  };

  if (total > results.length) {
    response.hint =
      `Showing ${results.length} of ${total} matches. ` +
      `Narrow with a more specific query, tags, or guidesOnly to see the most relevant ones ` +
      `(or raise limit up to ${total}).`;
  }
  return response;
}
