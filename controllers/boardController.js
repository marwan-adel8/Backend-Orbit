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

// @desc    Create a new board (column)
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res) => {
  try {
    const { title, projectId, order } = req.body;

    const hasAccess = await isMemberOfProject(projectId, req.user._id);
    if (!hasAccess) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied to this project" });
    }

    let boardOrder = order;
    if (boardOrder === undefined) {
      const count = await Board.countDocuments({ projectId });
      boardOrder = count;
    }

    const board = await Board.create({ title, projectId, order: boardOrder });
    res.status(201).json({ success: true, board });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all boards for a project
// @route   GET /api/boards/project/:projectId
// @access  Private
const getBoardsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const hasAccess = await isMemberOfProject(projectId, req.user._id);
    if (!hasAccess) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied to this project" });
    }

    const boards = await Board.find({ projectId }).sort({ order: 1 });
    res.status(200).json({ success: true, count: boards.length, boards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a board
// @route   PUT /api/boards/:id
// @access  Private
const updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    const hasAccess = await isMemberOfProject(board.projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { title, order } = req.body;
    if (title !== undefined) board.title = title;
    if (order !== undefined) board.order = order;

    await board.save();
    res.status(200).json({ success: true, board });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a board
// @route   DELETE /api/boards/:id
// @access  Private
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    const hasAccess = await isMemberOfProject(board.projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await board.deleteOne();
    res.status(200).json({ success: true, message: "Board deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { createBoard, getBoardsByProject, updateBoard, deleteBoard };
