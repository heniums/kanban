import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.WEB_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    // Auth middleware stub — will be implemented with JWT verification
    // when real-time features are built
    next();
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
