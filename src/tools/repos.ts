import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import { GITHUB_ORG } from "../config.js";
import {
  fetchText,
  githubHeaders,
  NotFoundError,
  RateLimitError,
} from "../http.js";
import { isSafeRepo, normalizeDocPath } from "../validate.js";

interface Repo {
  name: string;
  description: string | null;
  topics: string[];
  html_url: string;
  stargazers_count: number;
}

/** Registers the GitHub org repo tools on the given server. */
export function registerRepoTools(server: FastMCP): void {
  server.addTool({
    name: "agentailor_list_repos",
    description: `Lists the public open-source repositories in the ${GITHUB_ORG} GitHub org, with names, descriptions, topics, stars, and URLs.

**When to use:**
- "What open-source tools does Agentailor have?"
- "Do you have a starter/template for MCP?"
- To find a repo before reading its docs with agentailor_read_repo_doc.`,
    parameters: z.object({
      response_format: z
        .enum(["concise", "detailed"])
        .optional()
        .describe(
          'Output verbosity. "concise" (default) is name + description; "detailed" adds topics and star counts.'
        ),
    }),
    execute: async ({ response_format }) => {
      const raw = await withRateLimitHint(() =>
        fetchText(
          `https://api.github.com/orgs/${GITHUB_ORG}/repos?type=public&per_page=100&sort=updated`,
          { headers: githubHeaders() }
        )
      );
      const repos = JSON.parse(raw) as Repo[];
      const detailed = response_format === "detailed";
      return repos
        .map((r) => {
          const desc = r.description ?? "No description";
          if (!detailed) return `- ${r.name}: ${desc} — ${r.html_url}`;
          const topics = r.topics?.length ? ` [${r.topics.join(", ")}]` : "";
          return `- ${r.name}${topics} (★${r.stargazers_count}): ${desc} — ${r.html_url}`;
        })
        .join("\n");
    },
  });

  server.addTool({
    name: "agentailor_read_repo_doc",
    description: `Fetches a Markdown doc (the README, or a file under docs/) from a public ${GITHUB_ORG} repo.

**When to use:**
- The user asks how to use a specific repo, or about its architecture → read its README first.
- The user asks about a specific documented topic → read the matching docs/*.md file.

Only README.md and docs/*.md paths are allowed.`,
    parameters: z.object({
      repo: z
        .string()
        .describe(
          'Repository name, exactly as returned by agentailor_list_repos. Example: "create-mcp-server".'
        ),
      path: z
        .string()
        .describe(
          'File to read: "README.md" or a "docs/<name>.md" path. Defaults to README.md if omitted.'
        )
        .optional(),
    }),
    execute: async ({ repo, path }) => {
      if (!isSafeRepo(repo)) {
        throw new UserError(
          `Invalid repository name "${repo}". Use a name from agentailor_list_repos.`
        );
      }

      const requested = path ?? "README.md";
      const normalized = normalizeDocPath(requested);
      if (normalized === null) {
        throw new UserError(
          `Only "README.md" and "docs/*.md" paths are allowed (got "${requested}").`
        );
      }

      const url = `https://raw.githubusercontent.com/${GITHUB_ORG}/${repo}/HEAD/${normalized}`;
      try {
        return await withRateLimitHint(() =>
          fetchText(url, { headers: githubHeaders() })
        );
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new UserError(
            `${normalized} was not found in ${repo}. Confirm the repo and path against agentailor_list_repos.`
          );
        }
        throw err;
      }
    },
  });
}

/** Converts a rate-limit failure into an agent-visible, actionable message. */
async function withRateLimitHint<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof RateLimitError) throw new UserError(err.message);
    throw err;
  }
}
