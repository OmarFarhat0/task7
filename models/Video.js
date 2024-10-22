const mongoose = require("mongoose");
const Comment = require("./Comment");

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  { timestamps: true }
);

// Pre-remove middleware for Video
videoSchema.pre("remove", async function (next) {
  try {
    // Delete all comments associated with the video
    await Comment.deleteMany({ video: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

const Video = mongoose.model("Video", videoSchema);
module.exports = Video;
