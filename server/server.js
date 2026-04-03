const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = require("./app");
const http = require("http");
const { buildIo } = require("./socket");

// Load env variables
dotenv.config();

// Connect to DB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = buildIo(server);

// Make io accessible in controllers via req.app.get("io")
app.set("io", io);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
