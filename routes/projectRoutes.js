import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  addMember,
  deleteProject,
  updateProject,
} from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/:id/members", addMember);
router.delete("/:id", deleteProject);
router.put("/:id", updateProject);

export default router;
