import express from "express";
import {
  createBoard,
  getBoardsByProject,
  updateBoard,
  deleteBoard,
} from "../controllers/boardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createBoard);
router.get("/project/:projectId", getBoardsByProject);
router.put("/:id", updateBoard);
router.delete("/:id", deleteBoard);

export default router;
