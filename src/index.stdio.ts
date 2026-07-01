import "dotenv/config";
import { server } from "./server.js";

server.start({
  transportType: "stdio",
});
