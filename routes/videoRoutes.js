const express = require("express");
const Video = require("../models/Video");
const Course = require("../models/Course");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// Get all videos related to a course
router.get("/courses/:courseId", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res
        .status(404)
        .json({ status: "fail", message: "Course not found" });
    }

    // Find all videos related to the course
    const videos = await Video.find({ course: req.params.courseId });
    res.status(200).json({ status: "success", data: videos });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get a video by its ID
router.get("/:videoId", authMiddleware, async (req, res) => {
  try {
    // Find the video by its ID
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res
        .status(404)
        .json({ status: "fail", message: "Video not found" });
    }

    res.status(200).json({ status: "success", data: video });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Add a new video to a course
router.post("/courses/:courseId", authMiddleware, async (req, res) => {
  try {
    // Find the course by ID
    const course = await Course.findById(req.params.courseId);
    if (!course)
      return res
        .status(404)
        .json({ status: "fail", message: "Course not found" });

    // Check if the authenticated user is the instructor of the course
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: "You are not the instructor of this course",
      });
    }

    // Create and save the new video linked to the course
    const video = new Video({ ...req.body, course: req.params.courseId });
    await video.save();
    res.status(201).json({ status: "success", data: video });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Edit a video by its ID
router.patch("/:videoId", authMiddleware, async (req, res) => {
  try {
    // Find the video by ID
    const video = await Video.findById(req.params.videoId).populate("course");
    if (!video)
      return res
        .status(404)
        .json({ status: "fail", message: "Video not found" });

    // Check if the authenticated user is the instructor of the course related to the video
    const course = video.course;
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: "You are not the instructor of this course",
      });
    }

    // If the request body contains a course field, validate it
    if (req.body.course) {
      // Find the new course by ID
      const newCourse = await Course.findById(req.body.course);
      if (!newCourse) {
        return res.status(404).json({
          status: "fail",
          message: "The course ID provided in the request body is not valid.",
        });
      }

      // Check if the user is the instructor of the new course
      if (newCourse.instructor.toString() !== req.user._id.toString()) {
        return res.status(400).json({
          status: "fail",
          message: "You cannot move the video to a course you do not own.",
        });
      }
    }

    // Update the video with new data from the request body
    video.title = req.body.title || video.title;
    video.description = req.body.description || video.description;
    video.course = req.body.course || video.course;

    // Save the updated video
    await video.save();
    res.status(200).json({ status: "success", data: video });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Delete a video by its ID
router.delete("/:videoId", authMiddleware, async (req, res) => {
  try {
    // Find the video by ID
    const video = await Video.findById(req.params.videoId).populate("course");
    if (!video) {
      return res
        .status(404)
        .json({ status: "fail", message: "Video not found" });
    }

    // Check if the authenticated user is the instructor of the course related to the video
    const course = video.course;
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: "You are not the instructor of this course",
      });
    }

    // Delete the video
    await Video.findByIdAndDelete(req.params.videoId);
    res
      .status(204)
      .json({ status: "success", message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
