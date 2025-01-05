// server/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
    // OPTIONAL FIELDS:
    interests: [
      {
        type: String, // e.g. ["music", "coding", "gaming"]
      },
    ],
    biography: {
      type: String, // a short bio/description about the user
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);