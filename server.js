import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

// Load env vars
dotenv.config();

const defaultOrigins = [
  "http://localhost:5173",
  "https://orbit-ruby-nu.vercel.app",
];

const allowedOrigins = (process.env.CLIENT_URL || defaultOrigins.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// ⚡ إعداد Socket.io
const io = new Server(server, {
  cors: {
    ...corsOptions,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// احفظ الـ io instance عشان نوصله من الـ Controllers
app.set("io", io);

// ===========================
//        Middleware
// ===========================
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===========================
//          Routes
// ===========================
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 OrbitTask API is running!",
    version: "1.0.0",
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ===========================
//  Socket.io - Real-time Logic
// ===========================
io.on("connection", (socket) => {
  console.log(`🟢 New client connected: ${socket.id}`);

  // اليوزر يدخل "غرفة" المشروع بتاعه
  socket.on("join:project", (projectId) => {
    socket.join(`project:${projectId}`);
    console.log(`📌 Socket ${socket.id} joined project room: ${projectId}`);
  });

  socket.on("leave:project", (projectId) => {
    socket.leave(`project:${projectId}`);
    console.log(`📤 Socket ${socket.id} left project room: ${projectId}`);
  });

  // اليوزر يفتح تاسك معينة
  socket.on("join:task", (taskId) => {
    socket.join(`task:${taskId}`);
  });

  socket.on("leave:task", (taskId) => {
    socket.leave(`task:${taskId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});

// ===========================
//       Start Server
// ===========================
const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  try {
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`❌ Failed to start server listener: ${error.message}`);
  }
}

export default app;