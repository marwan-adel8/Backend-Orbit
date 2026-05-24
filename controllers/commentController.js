import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";

const isMemberOfProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return false;
  return (
    project.owner.toString() === userId.toString() ||
    project.members.some((m) => m.toString() === userId.toString())
  );
};

// @desc    Add a comment to a task
// @route   POST /api/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text, taskId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const hasAccess = await isMemberOfProject(task.projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied to this project" });
    }

    const comment = await Comment.create({ text, taskId, userId: req.user._id });
    await comment.populate("userId", "username email avatar");

    // ⚡ بعت الكومنت real-time لكل التيم
    const io = req.app.get("io");
    if (io) {
      io.to(`project:${task.projectId}`).emit("comment:new", { taskId, comment });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all comments for a task
// @route   GET /api/comments/task/:taskId
// @access  Private
const getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const hasAccess = await isMemberOfProject(task.projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const comments = await Comment.find({ taskId })
      .populate("userId", "username email avatar")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: comments.length, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    await comment.deleteOne();
    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { addComment, getCommentsByTask, deleteComment };
