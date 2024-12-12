import express from "express";
import bcrypt from "bcrypt"; // Ensure bcrypt is installed
import User from "../models/user.model.js";
import Champion from "../models/champion.model.js";
import mongoose from "mongoose";
const router = express.Router();

// Register route
router.post("/api/users/register", async (req, res) => {
  const { username, email, password } = req.body;

  console.log("Incoming registration request:", req.body); // Debugging log

  // Validate the input fields
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already in use");
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save the user in the database
    const savedUser = await newUser.save();
    console.log("User registered successfully:", savedUser);

    res.status(201).json({ message: "User registered successfully", userId: savedUser._id });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login route
router.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Incoming login request:", req.body); // Log for debugging

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.log("Invalid password for email:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Send success response
    console.log("Login successful for user:", user.username);
    res.json({ message: "Login successful", userId: user._id });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});


router.get("/api/users/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user); // Return the user object
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Error fetching user info" });
  }
});
router.get("/api/recommendations/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    console.log("Fetching recommendations for user ID:", userId);

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid user ID format:", userId);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Fetch the user
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found. Preferences:", user.preferences);

    // Ensure user has preferences
    if (!user.preferences || user.preferences.length === 0) {
      console.log("User has no preferences.");
      return res.status(200).json({ collaborative: [], contentBased: [] });
    }

    // ======= Collaborative Filtering =======
    const similarUsers = await User.find({
      _id: { $ne: user._id },
      preferences: { $in: user.preferences },
    })
      .limit(5)
      .select("preferences");

    console.log("Number of similar users found:", similarUsers.length);

    const collaborativeChampionIds = [];
    similarUsers.forEach((similarUser) => {
      similarUser.preferences.forEach((championId) => {
        if (!user.preferences.includes(championId)) {
          collaborativeChampionIds.push(championId);
        }
      });
    });

    const uniqueCollaborativeChampionIds = [...new Set(collaborativeChampionIds)];
    const collaborativeRecommendations = await Champion.find({
      Id: { $in: uniqueCollaborativeChampionIds },
    })
      .limit(5)
      .select("Name Class");

    console.log("Collaborative recommendations:", collaborativeRecommendations);

    // ======= Content-Based Filtering =======
    const userPreferredChampions = await Champion.find({ Id: { $in: user.preferences } });

    console.log("User's preferred champions:", userPreferredChampions);

    const similarChampions = await Champion.find({
      Id: { $nin: user.preferences },
      $or: userPreferredChampions.map((champ) => ({
        Class: champ.Class,
        Style: champ.Style,
      })),
    })
      .limit(5)
      .select("Id Name Class");

    console.log("Content-based recommendations:", similarChampions);

    res.json({
      collaborative: collaborativeRecommendations,
      contentBased: similarChampions,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ message: "Error fetching recommendations" });
  }
});



router.post("/api/users/:id/preferences", async (req, res) => {
  const userId = req.params.id;
  const { preferences } = req.body;

  console.log("Saving preferences for user:", userId); // Debugging log
  console.log("Preferences received:", preferences);

  if (!Array.isArray(preferences)) {
    return res.status(400).json({ message: "Preferences must be an array" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.preferences = preferences;
    const savedUser = await user.save();
    console.log("Preferences saved for user:", savedUser);

    res.json({ message: "Preferences saved successfully" });
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).json({ message: "Error saving preferences" });
  }
});

router.get("/api/users/:id/favorites", async (req, res) => {
  const userId = req.params.id;

  try {
    console.log("Fetching saved favorites for user ID:", userId);

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid user ID format:", userId);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Fetch the user
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found. Preferences:", user.preferences);

    // Fetch the user's favorite champions
    const favoriteChampions = await Champion.find({ Id: { $in: user.preferences } }).select(
      "Name Class"
    );

    res.json(favoriteChampions);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Error fetching favorites" });
  }
});


export default router;
