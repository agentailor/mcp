import { FastMCP } from "fastmcp";
import { registerBlogTools } from "./tools/blog.js";
import { registerRepoTools } from "./tools/repos.js";

const server = new FastMCP({
  name: "agentailor-mcp",
  version: "0.1.0",
  // GET /health → "ok" on the HTTP transport (ignored by stdio).
  health: { enabled: true },
});

registerBlogTools(server);
registerRepoTools(server);

export { server };
