# agentailor-mcp

An MCP server that connects your AI assistant to [Agentailor](https://agentailor.com) — search the blog, read articles in full, and pull docs from the open-source repos, all over the Model Context Protocol.

Two ways to use it, no clone required:

- **Hosted HTTP** — point your client at Agentailor's endpoint. Zero install.
- **npx (local stdio)** — run `npx @agentailor/mcp` as a command in Claude Desktop and other local clients.

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

## Use it

### Hosted (no install)

Point any HTTP MCP client at Agentailor's hosted endpoint:

```
https://<agentailor-mcp-host>/mcp
```

For a client that speaks streamable HTTP, that URL is all you need. Nothing to install or run.

> The final hosted URL is published on [agentailor.com](https://agentailor.com).

### npx (local stdio)

Run the server as a local command — ideal for Claude Desktop. In `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentailor": {
      "command": "npx",
      "args": ["-y", "@agentailor/mcp"]
    }
  }
}
```

The repo tools read **public** GitHub data, so no token is required. If you hit GitHub's unauthenticated rate limit (60 requests/hour), pass a token to raise it to 5,000/hour:

```json
{
  "mcpServers": {
    "agentailor": {
      "command": "npx",
      "args": ["-y", "@agentailor/mcp"],
      "env": { "GITHUB_TOKEN": "ghp_your_token" }
    }
  }
}
```

## Designed to the "Writing Effective Tools for AI Agents" playbook

These tools follow the five principles from Agentailor's [Writing Effective Tools for AI Agents](https://blog.agentailor.com/posts/writing-tools-for-ai-agents) — here's exactly how:

| Principle                                | How this server applies it                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Strategic selection**               | One `agentailor_search_articles` covers discovery by topic, by tag, and guides-only — instead of four fragmented search tools. Tools map to how you actually work, not to endpoints. |
| **2. Clear namespacing**                 | Every tool is prefixed `agentailor_`, so it never collides with other MCP servers on your client.                                                                                    |
| **3. Meaningful context**                | Read tools take `response_format: "concise" \| "detailed"`. Results carry titles, tags, and summaries you can reason on — not bare IDs.                                              |
| **4. Token efficiency + guiding errors** | Search defaults to 20 results with an overflow hint that tells the agent how to narrow. A GitHub rate-limit returns "set a `GITHUB_TOKEN`" guidance, not a raw 403.                  |
| **5. Descriptions as prompts**           | Each tool description includes a **When to use** section with example calls, and every parameter documents its shape with an example.                                                |

## Deploy your own HTTP instance

The HTTP transport serves the MCP endpoint at `POST /mcp` and a `GET /health` check.

### Native Node host

On any platform that runs a Node web service from this repo:

- **Build command:** `pnpm install --frozen-lockfile && pnpm build`
- **Start command:** `pnpm start:http`
- **Health check path:** `/health`
- **Environment:**
  - `GITHUB_TOKEN` — a token with public read access (recommended on a shared/hosted instance; raises the GitHub limit to 5,000/hour).
  - `PORT` — most hosts inject this automatically; the server reads it. Defaults to `3000` if unset.

Node 20 is pinned via `engines` and `.node-version`.

### Docker

A `Dockerfile` is included for running the server on any container host. The `TRANSPORT` build arg selects the entrypoint:

```bash
docker build --build-arg TRANSPORT=http -t agentailor-mcp-http .
docker run -p 3000:3000 -e GITHUB_TOKEN=ghp_your_token agentailor-mcp-http
```

Connect any HTTP MCP client to `http://<host>:3000/mcp`.

## Configuration

| Variable        | Required | Purpose                                                                                                                                                  |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`          | No       | HTTP transport port (default `3000`). Injected by most hosts. Ignored by stdio.                                                                          |
| `GITHUB_TOKEN`  | No       | Raises the GitHub API limit for the repo tools from 60/hr to 5,000/hr. Any token with public read access works. Recommended on a hosted/shared instance. |
| `BLOG_BASE_URL` | No       | Override the blog origin (for local/staging testing).                                                                                                    |

No credentials are required to run — all exposed data is public.

## Develop locally (contributors)

Clone and run from source:

```bash
pnpm install
pnpm build

# stdio (local clients)
pnpm start:stdio

# HTTP on PORT (default 3000)
pnpm start:http
```

Dev mode with reload: `pnpm dev:stdio` or `pnpm dev:http`.

```bash
pnpm test          # Vitest unit tests
pnpm typecheck     # tsc --noEmit
pnpm format:check  # Prettier check
pnpm inspect       # MCP Inspector against the HTTP server
pnpm inspect:stdio # list tools over stdio
```

## Releasing

The npm package publishes via GitHub Actions when a **GitHub Release** is published:

1. Bump `version` in `package.json` (and `src/server.ts`), commit.
2. Cut a GitHub Release / tag.
3. The `publish` workflow runs the test/build gates and publishes `@agentailor/mcp` to npm (auth via the `NPM_TOKEN` repo secret).

## Learn more

- [Writing Effective Tools for AI Agents](https://blog.agentailor.com/posts/writing-tools-for-ai-agents) — the design playbook this server follows
- [`@agentailor/create-mcp-server`](https://github.com/agentailor/create-mcp-server) — the scaffolder
- [FastMCP](https://github.com/punkpeye/fastmcp) · [Model Context Protocol](https://modelcontextprotocol.io/)

## License

[Apache 2.0](LICENSE) © Agentailor
