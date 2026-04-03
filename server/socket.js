const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

function buildIo(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id, role: decoded.role };
      return next();
    } catch (err) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    // Join a private room for the logged-in user.
    if (socket.user?.id) socket.join(`user:${socket.user.id}`);

    // Client requests to join a course room (for faculty/student pages).
    socket.on("joinCourse", (courseId) => {
      if (!courseId) return;
      socket.join(`course:${courseId}`);
    });

    socket.on("leaveCourse", (courseId) => {
      if (!courseId) return;
      socket.leave(`course:${courseId}`);
    });
  });

  return io;
}

module.exports = { buildIo };

