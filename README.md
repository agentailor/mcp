# agentailor-mcp

An MCP server that connects your AI assistant to [Agentailor](https://agentailor.com) — search the blog, read articles in full, and pull docs from the open-source repos, all over the Model Context Protocol.

It ships in two flavors from one codebase:

- **stdio** (via Docker) — for local clients like Claude Desktop.
- **HTTP** (streamable) — for a self-hosted, remotely reachable endpoint.

Scaffolded with [`@agentailor/create-mcp-server`](https://www.npmjs.com/package/@agentailor/create-mcp-server) on [FastMCP](https://github.com/punkpeye/fastmcp) — the tool building its own ecosystem.

## Tools

| Tool                         | What it does                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `agentailor_get_blog_index`  | Returns the blog's content map — every published article with title, date, tags, summary.                      |
| `agentailor_search_articles` | Ranked article search in one tool: free-text `query`, `tags` filter, `guidesOnly`, `limit`, `response_format`. |
| `agentailor_read_article`    | Fetches a single article's full Markdown by its `blog.agentailor.com` `.md` URL.                               |
| `agentailor_list_repos`      | Lists the public repos in the `agentailor` GitHub org.                                                         |
| `agentailor_read_repo_doc`   | Reads a `README.md` or `docs/*.md` from a given org repo.                                                      |

Scope is Agentailor's public content: the blog and the open-source org repos.

## Designed to the "Writing Effective Tools for AI Agents" playbook

These tools follow the five principles from Agentailor's [Writing Effective Tools for AI Agents](https://blog.agentailor.com/posts/writing-tools-for-ai-agents) — here's exactly how:

| Principle                                | How this server applies it                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Strategic selection**               | One `agentailor_search_articles` covers discovery by topic, by tag, and guides-only — instead of four fragmented search tools. Tools map to how you actually work, not to endpoints. |
| **2. Clear namespacing**                 | Every tool is prefixed `agentailor_`, so it never collides with other MCP servers on your client.                                                                                    |
| **3. Meaningful context**                | Read tools take `response_format: "concise" \| "detailed"`. Results carry titles, tags, and summaries you can reason on — not bare IDs.                                              |
| **4. Token efficiency + guiding errors** | Search defaults to 20 results with an overflow hint that tells the agent how to narrow. A GitHub rate-limit returns "set a `GITHUB_TOKEN`" guidance, not a raw 403.                  |
| **5. Descriptions as prompts**           | Each tool description includes a **When to use** section with example calls, and every parameter documents its shape with an example.                                                |

## Quick start (local)

```bash
pnpm install
pnpm build

# stdio (local clients)
pnpm start:stdio

# HTTP on PORT (default 3000)
pnpm start:http
```

Dev mode with reload: `pnpm dev:stdio` or `pnpm dev:http`.

## Use with Claude Desktop (stdio via Docker)

Build the image, then point Claude Desktop at it.

```bash
docker build -t agentailor-mcp .
```

In your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "agentailor": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "agentailor-mcp"]
    }
  }
}
```

To raise the GitHub rate limit for the repo tools, pass a token:

```json
{
  "mcpServers": {
    "agentailor": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_TOKEN", "agentailor-mcp"],
      "env": { "GITHUB_TOKEN": "ghp_your_token" }
    }
  }
}
```

## Self-host over HTTP

```bash
docker build --build-arg TRANSPORT=http -t agentailor-mcp-http .
docker run -p 3000:3000 agentailor-mcp-http
```

The MCP endpoint is `POST /mcp`; connect any HTTP MCP client to `http://<host>:3000/mcp`. A `GET /health` endpoint returns `200` for container health checks.

## Configuration

| Variable        | Required | Purpose                                                                                                         |
| --------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `PORT`          | No       | HTTP transport port (default `3000`). Ignored by stdio.                                                         |
| `GITHUB_TOKEN`  | No       | Raises the GitHub API limit for the repo tools from 60/hr to 5,000/hr. Any token with public read access works. |
| `BLOG_BASE_URL` | No       | Override the blog origin (for local/staging testing).                                                           |

No credentials are required to run — all exposed data is public.

## Develop and test

```bash
pnpm test          # Vitest unit tests
pnpm typecheck     # tsc --noEmit
pnpm inspect       # MCP Inspector against the HTTP server
pnpm inspect:stdio # list tools over stdio
```

## Learn more

- [Writing Effective Tools for AI Agents](https://blog.agentailor.com/posts/writing-tools-for-ai-agents) — the design playbook this server follows
- [`@agentailor/create-mcp-server`](https://github.com/agentailor/create-mcp-server) — the scaffolder
- [FastMCP](https://github.com/punkpeye/fastmcp) · [Model Context Protocol](https://modelcontextprotocol.io/)
