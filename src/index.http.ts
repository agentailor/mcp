import "dotenv/config";
import { server } from "./server.js";

const PORT = Number(process.env.PORT) || 3000;

server.start({
  transportType: "httpStream",
  httpStream: {
    port: PORT,
    stateless: true,
  },
});

console.log(`Agentailor MCP server listening on http://localhost:${PORT}/mcp`);
