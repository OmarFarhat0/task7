const mongoose = require("mongoose");
const Video = require("./Video");
const Comment = require("./Comment");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    numHours: { type: Number, required: true }, // Represents the duration in hours
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Pre-remove middleware for Course
courseSchema.pre("remove", async function (next) {
  try {
    // Find and delete all videos associated with the course
    const videos = await Video.find({ course: this._id });

    // Delete all comments associated with each video
    for (const video of videos) {
      await Comment.deleteMany({ video: video._id });
    }

    // Delete all videos after deleting their comments
    await Video.deleteMany({ course: this._id });

    next();
  } catch (error) {
    next(error);
  }
});

const Course = mongoose.model("Course", courseSchema);
module.exports = Course;
