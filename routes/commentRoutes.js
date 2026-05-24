import express from "express";
import {
  addComment,
  getCommentsByTask,
  deleteComment,
} from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", addComment);
router.get("/task/:taskId", getCommentsByTask);
router.delete("/:id", deleteComment);

export default router;
