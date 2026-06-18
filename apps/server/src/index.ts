import http from "http";
import { createApp } from "./app.js";
import { createSocketServer } from "./socket.js";

const PORT = process.env.PORT || 3001;
const app = createApp();
const server = http.createServer(app);

const io = createSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { io };
