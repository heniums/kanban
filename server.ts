import { createServer } from "node:http";
import next from "next";
import { Server as IOServer } from "socket.io";
import { setSocketServer } from "@/lib/realtime/events";
import { REALTIME_JOIN_BOARD, REALTIME_LEAVE_BOARD } from "@/lib/realtime/types";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new IOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: dev ? "*" : false },
    serveClient: false,
  });

  io.on("connection", (socket) => {
    socket.on(REALTIME_JOIN_BOARD, (boardId: unknown) => {
      if (typeof boardId === "string" && boardId.length > 0 && boardId.length < 200) {
        socket.join(`board:${boardId}`);
      }
    });
    socket.on(REALTIME_LEAVE_BOARD, (boardId: unknown) => {
      if (typeof boardId === "string" && boardId.length > 0 && boardId.length < 200) {
        socket.leave(`board:${boardId}`);
      }
    });
  });

  setSocketServer(io);

  httpServer
    .once("error", (err) => {
      console.error("HTTP server error", err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
