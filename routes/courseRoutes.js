const express = require("express");
const Course = require("../models/Course");
const authMiddleware = require("../middleware/auth");
const { default: mongoose } = require("mongoose");
const router = express.Router();

// Get all courses
router.get("/", authMiddleware, async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json({ status: "success", data: courses });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get all courses created by a specific user
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid user ID" });
    }

    // Fetch courses where the instructor matches the given userId
    const courses = await Course.find({ instructor: userId });

    if (!courses || !courses.length) {
      return res.status(404).json({ status: "fail", message: "No courses" });
    }

    res.status(200).json({ status: "success", data: courses });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get course by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid user ID" });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res
        .status(404)
        .json({ status: "fail", message: "Course not found" });
    }

    res.status(200).json({ status: "success", data: course });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Add a new course
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, numHours } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ status: "fail", message: "All fields are required" });
    }

    if (typeof title !== "string" || typeof description !== "string") {
      return res.status(400).json({
        status: "fail",
        message: "title and description must be strings",
      });
    }

    if (typeof numHours !== "number") {
      return res.status(400).json({
        status: "fail",
        message: "Number of course hours must be number",
      });
    }

    // Check length of title and description
    if (title.length < 5 || title.length > 100) {
      return res.status(400).json({
        status: "fail",
        message: "Title must be between 5 and 100 characters long",
      });
    }

    if (description.length < 10 || description.length > 500) {
      return res.status(400).json({
        status: "fail",
        message: "Description must be between 10 and 500 characters long",
      });
    }

    const course = new Course({ ...req.body, instructor: req.user._id });
    await course.save();
    res.status(201).json({ status: "success", data: course });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Update a course
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    // Check if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid user ID" });
    }

    const { title, description, numHours } = req.body;

    if (title) {
      if (typeof title !== "string" || typeof description !== "string") {
        return res.status(400).json({
          status: "fail",
          message: "title and description must be strings",
        });
      }
      if (title.length < 5 || title.length > 100) {
        return res.status(400).json({
          status: "fail",
          message: "Title must be between 5 and 100 characters long",
        });
      }
    }

    if (description && (description.length < 10 || description.length > 500)) {
      return res.status(400).json({
        status: "fail",
        message: "Description must be between 10 and 500 characters long",
      });
    }

    if (numHours && typeof numHours !== "number") {
      return res.status(400).json({
        status: "fail",
        message: "Number of course hours must be number",
      });
    }

    const course = await Course.findById(courseId);
    if (!course)
      return res
        .status(404)
        .json({ status: "fail", message: "Course not found" });

    if (
      req.body.instructor &&
      req.body.instructor.toString() !== course.instructor.toString()
    ) {
      return res.status(400).json({
        status: "fail",
        message: "You cannot modify the instructor field",
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: "You are not the instructor of this course",
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(courseId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ status: "success", data: updatedCourse });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Delete a course
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    // Check if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid user ID" });
    }

    const course = await Course.findById(courseId);
    if (!course)
      return res
        .status(404)
        .json({ status: "fail", message: "Course not found" });

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: "You are not the instructor of this course",
      });
    }

    await Course.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ status: "success", message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
