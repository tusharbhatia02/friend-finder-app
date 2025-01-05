// server/routes/friend.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User =  require("../models/User");

// Send friend request
router.post("/request", auth, async (req, res) => {
  try {
    const { toUserId } = req.body;
    const fromUserId = req.user.id;

    if (toUserId === fromUserId) {
      return res.status(400).json({ msg: "You cannot send request to yourself" });
    }

    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);

    // Check if already friends
    if (fromUser.friends.includes(toUserId)) {
      return res.status(400).json({ msg: "Already friends" });
    }

    // Push friend request to toUser
    toUser.friendRequests.push({ from: fromUser._id, status: "pending" });
    await toUser.save();

    res.status(200).json({ msg: "Friend request sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Accept / Reject friend request
router.post("/respond", auth, async (req, res) => {
  try {
    const { requestId, action } = req.body; // "accept" or "reject"
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);

    const friendRequest = currentUser.friendRequests.find(
      (req) => req._id.toString() === requestId
    );

    if (!friendRequest) {
      return res.status(404).json({ msg: "Friend request not found" });
    }

    if (action === "accept") {
      friendRequest.status = "accepted";

      // Add each other to friends list
      currentUser.friends.push(friendRequest.from);
      const fromUser = await User.findById(friendRequest.from);
      fromUser.friends.push(currentUser._id);
      await fromUser.save();
    } else if (action === "reject") {
      friendRequest.status = "rejected";
    }

    await currentUser.save();

    res.status(200).json({ msg: `Friend request ${action}ed` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Search users
router.get("/search", auth, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      username: { $regex: query, $options: "i" },
    }).select("-password"); // exclude the password from results

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get friend recommendations (basic approach based on total mutual friends)
router.get("/recommendations", auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId).populate("friends");

    // Step 1: Collect all friends of the current user
    const userFriends = currentUser.friends.map((friend) => friend._id.toString());

    // Step 2: For each friend, gather their friends
    let recommendationsMap = {};
    for (const friend of currentUser.friends) {
      const friendDetails = await User.findById(friend._id).populate("friends");
      for (const friendOfFriend of friendDetails.friends) {
        if (
          friendOfFriend._id.toString() !== currentUserId && // not the current user
          !userFriends.includes(friendOfFriend._id.toString()) // not already a friend
        ) {
          const friendOfFriendId = friendOfFriend._id.toString();
          recommendationsMap[friendOfFriendId] = recommendationsMap[friendOfFriendId]
            ? recommendationsMap[friendOfFriendId] + 1
            : 1;
        }
      }
    }

    // Step 3: Sort recommendations by mutual friend count
    const sorted = Object.keys(recommendationsMap).sort(
      (a, b) => recommendationsMap[b] - recommendationsMap[a]
    );

    // Step 4: Return the top recommended users
    const recommendedUsers = await User.find({ _id: { $in: sorted } }).select("-password");
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;