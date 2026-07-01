# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project

**agentailor-mcp** is an MCP (Model Context Protocol) server that exposes Agentailor's **public** content to any MCP client: the blog (search + read articles) and the public `agentailor` GitHub org (list repos + read their docs). It was scaffolded with [`@agentailor/create-mcp-server`](https://www.npmjs.com/package/@agentailor/create-mcp-server) and built on [FastMCP](https://github.com/punkpeye/fastmcp).

**This is a public repository.** Keep it self-contained — do not reference internal or private Agentailor projects in code, comments, README, or commits. Scope is public data only; no credentials are required to run.

## Commands

```bash
pnpm install
pnpm build            # tsc → dist/
pnpm dev:stdio        # watch-run the stdio entrypoint (tsx)
pnpm dev:http         # watch-run the HTTP entrypoint (tsx)
pnpm start:stdio      # run built stdio server
pnpm start:http       # run built HTTP server (PORT, default 3000)
pnpm test             # Vitest unit tests
pnpm typecheck        # tsc --noEmit
pnpm format           # Prettier write
pnpm format:check     # Prettier check (CI-safe)
pnpm inspect          # MCP Inspector against the HTTP server
pnpm inspect:stdio    # list tools over stdio
```

Package manager is **pnpm**.

## Architecture

One codebase, two transports, five tools.

### Transports (`src/index.stdio.ts`, `src/index.http.ts`)

Both import the shared server from `src/server.ts` and differ only in the `server.start(...)` call:

- **stdio** — for local clients (Claude Desktop). Run via Docker.
- **httpStream** — self-hosted; MCP endpoint at `POST /mcp`, plus `GET /health` (enabled in `server.ts`).

### Server (`src/server.ts`)

Creates the `FastMCP` instance and calls the two registrars: `registerBlogTools` and `registerRepoTools`. Tools are transport-agnostic — they don't know or care which entrypoint started the server.

### Tools

Registered by workflow, not by endpoint. Names are prefixed `agentailor_` to avoid collisions with other MCP servers on a client.

- `src/tools/blog.ts` — `agentailor_get_blog_index`, `agentailor_search_articles`, `agentailor_read_article`
- `src/tools/repos.ts` — `agentailor_list_repos`, `agentailor_read_repo_doc`

### Shared core

- `src/config.ts` — fetch targets (`BLOG_BASE_URL`, `GITHUB_ORG`), safety regexes, and defaults. Env overrides: `BLOG_BASE_URL`, `GITHUB_ORG`, `PORT`, `GITHUB_TOKEN`.
- `src/http.ts` — `fetchTextCached` (process-lifetime cache), `githubHeaders` (adds `Authorization` only when `GITHUB_TOKEN` is set), and error types: `RateLimitError` (GitHub 403-with-`x-ratelimit-remaining: 0` or 429), `NotFoundError` (404).
- `src/content.ts` — `Post` model, `getPosts()` (fetches/parses `llms.json`), and the pure `searchPosts(posts, params)` filter (query + tags + guidesOnly).
- `src/format.ts` — `formatSearchResults` with `concise`/`detailed` shapes and an overflow hint.
- `src/validate.ts` — pure input validation (`isBlogArticleUrl`, `isSafeRepo`, `normalizeDocPath`). Tools throw `UserError` on invalid input so the message reaches the agent.

### Data source

`agentailor_search_articles` reads `${BLOG_BASE_URL}/llms.json` — a structured index (`title, slug, url, date, tags, guide, summary`). **The server never parses text**: search/filter/guides logic runs over typed objects. `agentailor_get_blog_index` returns `llms-full.txt` verbatim as the human/agent-readable "what exists" map.

## Tool-design rules (the bar for any new tool)

Follow the five principles from [Writing Effective Tools for AI Agents](https://blog.agentailor.com/posts/writing-tools-for-ai-agents), which this server is built to demonstrate:

1. **Strategic selection** — one workflow-shaped tool over several fragmented ones (see how `agentailor_search_articles` folds topic/tag/guides search into one).
2. **Namespacing** — every tool starts with `agentailor_`.
3. **Meaningful context + verbosity** — read tools take `response_format: "concise" | "detailed"`; return semantic fields, not bare IDs.
4. **Token efficiency + guiding errors** — sensible limits, overflow hints, and actionable error messages (e.g. rate-limit guidance), never raw HTTP errors.
5. **Descriptions as prompts** — each tool description has a **When to use** section with example calls; each parameter documents its shape with an example.

## Testing

Vitest, offline and deterministic (network is mocked via `vi.spyOn(globalThis, "fetch")`). Tests live in `test/` with a small `test/fixtures/llms.json`. Cover: `searchPosts` logic, formatters, input validation, and the rate-limit/404 branches in `http.ts`. Add a test when you add or change tool behavior.

## Docker

One `Dockerfile`, `TRANSPORT` build ARG selects the entrypoint:

```bash
docker build -t agentailor-mcp .                            # stdio (default)
docker build --build-arg TRANSPORT=http -t agentailor-mcp-http .
```

Multi-stage: install → build → `pnpm prune --prod`, then copy `node_modules` + `dist` into the runtime stage (no second network install). pnpm is pinned for Node 20 compatibility; `.npmrc` adds fetch retries.

## Conventions

- TypeScript, ESM, NodeNext resolution — **imports use `.js` extensions** (e.g. `./config.js`) even for `.ts` sources.
- Prettier: double quotes, 2-space, semicolons, `printWidth` 80 (`.prettierrc`). Run `pnpm format` before committing.
- Keep comments lean.
