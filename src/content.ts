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

function matchesQuery(post: Post, query: string): boolean {
  const q = query.toLowerCase();
  return (
    post.title.toLowerCase().includes(q) ||
    post.summary.toLowerCase().includes(q) ||
    post.tags.some((t) => t.toLowerCase().includes(q))
  );
}

function matchesTags(post: Post, tags: string[]): boolean {
  const postTags = post.tags.map(norm);
  return tags.every((t) => postTags.includes(norm(t)));
}

/**
 * Filters posts by free-text query, tag membership, and/or guides-only.
 * Empty params return the full (date-desc) index. Results are already sorted
 * newest-first as emitted by the blog.
 */
export function searchPosts(posts: Post[], params: SearchParams): Post[] {
  const { query, tags, guidesOnly } = params;
  return posts.filter((post) => {
    if (guidesOnly && !post.guide) return false;
    if (tags && tags.length > 0 && !matchesTags(post, tags)) return false;
    if (query && query.trim() && !matchesQuery(post, query)) return false;
    return true;
  });
}
