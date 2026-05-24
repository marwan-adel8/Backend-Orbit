import Task from "../models/Task.js";
import Board from "../models/Board.js";
import Project from "../models/Project.js";

const isMemberOfProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return false;
  return (
    project.owner.toString() === userId.toString() ||
    project.members.some((m) => m.toString() === userId.toString())
  );
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, projectId, boardId, assignedTo, priority, dueDate } = req.body;

    const hasAccess = await isMemberOfProject(projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied to this project" });
    }

    const board = await Board.findOne({ _id: boardId, projectId });
    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found or doesn't belong to this project",
      });
    }

    const count = await Task.countDocuments({ boardId });

    const task = await Task.create({
      title,
      description,
      projectId,
      boardId,
      assignedTo: assignedTo || null,
      priority: priority || "medium",
      dueDate: dueDate || null,
      order: count,
    });

    await task.populate("assignedTo", "username email avatar");
    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tasks for a board
// @route   GET /api/tasks/board/:boardId
// @access  Private
const getTasksByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    const hasAccess = await isMemberOfProject(board.projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const tasks = await Task.find({ boardId })
      .populate("assignedTo", "username email avatar")
      .sort({ order: 1 });

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const hasAccess = await isMemberOfProject(projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const tasks = await Task.find({ projectId })
      .populate("assignedTo", "username email avatar")
      .populate("boardId", "title")
      .sort({ order: 1 });

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const hasAccess = await isMemberOfProject(task.projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { title, description, assignedTo, priority, dueDate, order } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (order !== undefined) task.order = order;

    await task.save();
    await task.populate("assignedTo", "username email avatar");

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Move task to another board (Drag & Drop)
// @route   PUT /api/tasks/:id/move
// @access  Private
const moveTask = async (req, res) => {
  try {
    const { boardId, order } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const hasAccess = await isMemberOfProject(task.projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const newBoard = await Board.findOne({ _id: boardId, projectId: task.projectId });
    if (!newBoard) {
      return res.status(404).json({
        success: false,
        message: "Target board not found or doesn't belong to this project",
      });
    }

    task.boardId = boardId;
    if (order !== undefined) task.order = order;

    await task.save();
    await task.populate("assignedTo", "username email avatar");

    // ⚡ بعت إشارة WebSocket لكل التيم
    const io = req.app.get("io");
    if (io) {
      io.to(`project:${task.projectId}`).emit("task:moved", {
        taskId: task._id,
        newBoardId: boardId,
        order: task.order,
        task,
      });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const hasAccess = await isMemberOfProject(task.projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await task.deleteOne();

    const io = req.app.get("io");
    if (io) {
      io.to(`project:${task.projectId}`).emit("task:deleted", {
        taskId: task._id,
        boardId: task.boardId,
      });
    }

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { createTask, getTasksByBoard, getTasksByProject, updateTask, moveTask, deleteTask };
