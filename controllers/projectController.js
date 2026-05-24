import Project from "../models/Project.js";
import User from "../models/User.js";

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [req.user._id],
    });

    await project.populate("owner", "username email avatar");

    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all projects for the current user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate("owner", "username email avatar")
      .populate("members", "username email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "username email avatar")
      .populate("members", "username email avatar");

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const isMember =
      project.owner._id.toString() === req.user._id.toString() ||
      project.members.some((m) => m._id.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a member to a project by email
// @route   POST /api/projects/:id/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const { email } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can add members",
      });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res
        .status(404)
        .json({ success: false, message: "User with this email not found" });
    }

    if (project.members.includes(userToAdd._id)) {
      return res
        .status(400)
        .json({ success: false, message: "User is already a member" });
    }

    project.members.push(userToAdd._id);
    await project.save();
    await project.populate("members", "username email avatar");

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      members: project.members,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can delete this project",
      });
    }

    await project.deleteOne();
    res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can update this project",
      });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();
    await project.populate("owner", "username email avatar");
    await project.populate("members", "username email avatar");

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { createProject, getProjects, getProjectById, addMember, deleteProject, updateProject };
