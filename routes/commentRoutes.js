const express = require("express");
const Comment = require("../models/Comment");
const Video = require("../models/Video");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// Get all comments for a specific video
router.get("/videos/:videoId", authMiddleware, async (req, res) => {
  try {
    const comments = await Comment.find({ video: req.params.videoId });
    res.status(200).json({ status: "success", data: comments });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get a comment by its ID
router.get("/:commentId", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ status: "fail", message: "Comment not found" });
    }

    res.status(200).json({ status: "success", data: comment });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Add a new comment to a specific video
router.post("/videos/:videoId", authMiddleware, async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res
        .status(404)
        .json({ status: "fail", message: "Video not found" });
    }

    const comment = new Comment({
      content: req.body.content,
      video: req.params.videoId,
      user: req.user._id,
    });
    await comment.save();
    res.status(201).json({ status: "success", data: comment });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Edit a comment by its ID
router.patch("/:commentId", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ status: "fail", message: "Comment not found" });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: "Not authorized to edit this comment",
      });
    }

    comment.content = req.body.content || comment.content;
    await comment.save();
    res.status(200).json({ status: "success", data: comment });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Delete a comment by its ID
router.delete("/:commentId", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ status: "fail", message: "Comment not found" });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: "Not authorized to delete this comment",
      });
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    res
      .status(200)
      .json({ status: "success", message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
