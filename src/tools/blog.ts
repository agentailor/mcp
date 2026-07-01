import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import {
  BLOG_BASE_URL,
  BLOG_INDEX_URL,
  SEARCH_LIMIT_DEFAULT,
} from "../config.js";
import { getPosts, searchPosts } from "../content.js";
import { formatSearchResults } from "../format.js";
import { fetchTextCached, NotFoundError } from "../http.js";
import { isBlogArticleUrl } from "../validate.js";

/** Registers the blog content tools on the given server. */
export function registerBlogTools(server: FastMCP): void {
  server.addTool({
    name: "agentailor_get_blog_index",
    description: `Returns the Agentailor blog's content map — the list of every published article with its title, date, tags, and summary.

**When to use:**
- To see what topics the blog covers before answering ("what do you have on X?").
- As a first step when you're not sure which article is relevant.
- Prefer agentailor_search_articles when the user names a topic — it returns a filtered, ranked shortlist instead of the whole map.`,
    parameters: z.object({}),
    execute: async () => {
      return await fetchTextCached(BLOG_INDEX_URL);
    },
  });

  server.addTool({
    name: "agentailor_search_articles",
    description: `Searches the Agentailor blog and returns a ranked shortlist of matching articles (title, url, date, tags, summary). One tool for all discovery: free-text, by tag, and guides-only.

**When to use:**
- "What articles cover MCP?" → query: "mcp"
- "Show me everything tagged langgraph and tools" → tags: ["langgraph", "tools"]
- "Which complete guides do you have?" → guidesOnly: true
- Combine them: query + tags + guidesOnly all narrow together.

Returns links to the .md version of each article; call agentailor_read_article to read one in full.`,
    parameters: z.object({
      query: z
        .string()
        .optional()
        .describe(
          'Free-text terms matched against title, summary, and tags. Example: "memory" or "langgraph vs llamaindex". Omit to list everything.'
        ),
      tags: z
        .array(z.string())
        .optional()
        .describe(
          'Filter to articles carrying ALL of these tags (case/format-insensitive). Example: ["mcp", "security"].'
        ),
      guidesOnly: z
        .boolean()
        .optional()
        .describe("If true, return only complete guides. Default: false."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe(
          `Max results to return. Default: ${SEARCH_LIMIT_DEFAULT}. Lower values save tokens.`
        ),
      response_format: z
        .enum(["concise", "detailed"])
        .optional()
        .describe(
          'Output verbosity. "concise" (default) is a titled link list; "detailed" adds date, tags, and summary per result.'
        ),
    }),
    execute: async ({ query, tags, guidesOnly, limit, response_format }) => {
      const posts = await getPosts();
      const matches = searchPosts(posts, { query, tags, guidesOnly });
      const cap = limit ?? SEARCH_LIMIT_DEFAULT;
      const shown = matches.slice(0, cap);
      return formatSearchResults(
        shown,
        matches.length,
        cap,
        response_format ?? "concise"
      );
    },
  });

  server.addTool({
    name: "agentailor_read_article",
    description: `Fetches the full Markdown of a single Agentailor blog article.

**When to use:**
- The user asks a substantive question that needs the article's actual content, not just its summary.
- You found a relevant article via agentailor_search_articles and want to read it.

Pass the .md URL from the search results (e.g. https://blog.agentailor.com/posts/agent-development-roadmap.md).`,
    parameters: z.object({
      url: z
        .string()
        .describe(
          "The .md URL of the article, from agentailor_search_articles results. Must be a blog.agentailor.com URL."
        ),
    }),
    execute: async ({ url }) => {
      if (!isBlogArticleUrl(url)) {
        throw new UserError(
          `Only ${BLOG_BASE_URL} article URLs can be read. Get a valid .md URL from agentailor_search_articles.`
        );
      }
      try {
        return await fetchTextCached(url);
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new UserError(
            `No article found at ${url}. Check the URL against agentailor_search_articles results.`
          );
        }
        throw err;
      }
    },
  });
}
