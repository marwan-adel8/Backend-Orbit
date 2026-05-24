import express from "express";
import {
  createTask,
  getTasksByBoard,
  getTasksByProject,
  updateTask,
  moveTask,
  deleteTask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createTask);
router.get("/board/:boardId", getTasksByBoard);
router.get("/project/:projectId", getTasksByProject);
router.put("/:id", updateTask);
router.put("/:id/move", moveTask);  // ⬅️ Drag & Drop endpoint
router.delete("/:id", deleteTask);

export default router;
