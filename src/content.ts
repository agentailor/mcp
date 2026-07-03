/** Blog post index: typed model + search/filter helpers over llms.json. */

import { LLMS_JSON_URL } from "./config.js";
import { fetchText } from "./http.js";

export interface Post {
  title: string;
  slug: string;
  url: string;
  date: string;
  tags: string[];
  guide: boolean;
  summary: string;
}

interface LlmsJson {
  generatedAt?: string;
  posts: Post[];
}

/** Fetches and parses the structured post index. */
export async function getPosts(): Promise<Post[]> {
  const raw = await fetchText(LLMS_JSON_URL);
  const parsed = JSON.parse(raw) as LlmsJson;
  return parsed.posts ?? [];
}

export interface SearchParams {
  query?: string;
  tags?: string[];
  guidesOnly?: boolean;
}

/** Normalizes a tag or query fragment for case/format-insensitive matching. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s_-]+/g, "");
}

/** Splits a query into lowercased terms, dropping empties. */
function queryTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** True when a single term appears in the post's title, summary, or any tag. */
function termMatches(post: Post, term: string): boolean {
  return (
    post.title.toLowerCase().includes(term) ||
    post.summary.toLowerCase().includes(term) ||
    post.tags.some((t) => t.toLowerCase().includes(term))
  );
}

/** How many of the given terms match the post (OR semantics, ranking signal). */
function countMatchedTerms(post: Post, terms: string[]): number {
  return terms.reduce((n, term) => n + (termMatches(post, term) ? 1 : 0), 0);
}

function matchesTags(post: Post, tags: string[]): boolean {
  const postTags = post.tags.map(norm);
  return tags.every((t) => postTags.includes(norm(t)));
}

/**
 * Filters posts by tag membership (AND), guides-only, and a free-text query.
 * The query is split into terms; a post matches if it contains ANY term, and
 * results are ranked by how many terms match (then newest-first). Without a
 * query, order is unchanged (date-desc, as emitted by the blog).
 */
export function searchPosts(posts: Post[], params: SearchParams): Post[] {
  const { query, tags, guidesOnly } = params;

  const filtered = posts.filter((post) => {
    if (guidesOnly && !post.guide) return false;
    if (tags && tags.length > 0 && !matchesTags(post, tags)) return false;
    return true;
  });

  const terms = query ? queryTerms(query) : [];
  if (terms.length === 0) return filtered;

  // Keep posts matching at least one term, then stable-sort by match count
  // desc. Input is already newest-first, so ties preserve date-desc order.
  return filtered
    .map((post) => ({ post, score: countMatchedTerms(post, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ post }) => post);
}
