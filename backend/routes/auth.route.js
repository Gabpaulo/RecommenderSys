import express from "express";
import bcrypt from "bcrypt";           // Ensure bcrypt is installed
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Champion from "../models/champion.model.js";

const router = express.Router();


function cosineSimilarity(setA, setB) {
  const intersectionSize = [...setA].filter((champId) => setB.has(champId)).length;
  const magnitudeA = Math.sqrt(setA.size);
  const magnitudeB = Math.sqrt(setB.size);

  // division by zero if either set is empty
  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return intersectionSize / (magnitudeA * magnitudeB);
}


// REGISTER ROUTE

router.post("/api/users/register", async (req, res) => {
  const { username, email, password } = req.body;

  console.log("Incoming registration request:", req.body); // Debug log

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

    // hasing pw
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // save user
    const savedUser = await newUser.save();
    console.log("User registered successfully:", savedUser);

    return res
      .status(201)
      .json({ message: "User registered successfully", userId: savedUser._id });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({ message: "Server error during registration" });
  }
});


// LOGIN ROUTE

router.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Incoming login request:", req.body); // Debug log

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
   
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }

   
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.log("Invalid password for email:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Login successful for user:", user.username);
    return res.json({ message: "Login successful", userId: user._id });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
});


//  GET USER BY ID 

router.get("/api/users/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user); 
  } catch (error) {
    console.error("Error fetching user info:", error);
    return res.status(500).json({ message: "Error fetching user info" });
  }
});

//
// GET RECOMMENDATIONS
// 
router.get("/api/recommendations/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    console.log("Fetching recommendations for user ID:", userId);

    // checking if id exist
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid user ID format:", userId);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // fetching users
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found. Preferences:", user.preferences);

    //if no preference we will return none
    if (!user.preferences || user.preferences.length === 0) {
      console.log("User has no preferences.");
      return res.status(200).json({ collaborative: [], contentBased: [] });
    }

    // content based
    const userPreferredChampions = await Champion.find({
      Id: { $in: user.preferences },
    });
    console.log("User's preferred champions:", userPreferredChampions);

    // basing  on class or style.
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

    // ======= Collaborative Filtering =======
    // get users first
    const allOtherUsers = await User.find({ _id: { $ne: user._id } })
      .select("preferences")
      .lean();

    console.log("Total other users for similarity calculation:", allOtherUsers.length);

    // cosine similarity computtation
    const currentUserSet = new Set(user.preferences);

    const userSimilarities = allOtherUsers.map((otherUser) => {
      const otherUserSet = new Set(otherUser.preferences);
      const similarity = cosineSimilarity(currentUserSet, otherUserSet);

      return {
        userId: otherUser._id,
        similarity,
        preferences: otherUser.preferences,
      };
    });

    // 3) Sort by similarity & pick top 5
    userSimilarities.sort((a, b) => b.similarity - a.similarity);
    userSimilarities.forEach((item, index) => {
      console.log(
        `Index: ${index}, ` +
        `userId: ${item.userId}, ` +
        `similarity: ${item.similarity}, ` +
        `preferences: ${JSON.stringify(item.preferences)}`
      );
    });
    const topSimilarUsers = userSimilarities.slice(0, 5);

    console.log(
      "Top similar users (by cosine):",
      topSimilarUsers.map((u) => ({
        userId: u.userId,
        similarity: u.similarity,
      }))
    );

    // 4)aggregate champion IDs from these top users which are weighted by similarity
    const recommendationScores = {};
    topSimilarUsers.forEach(({ similarity, preferences }) => {
      preferences.forEach((champId) => {
        //recommend  champions that user not yet liked
        if (!currentUserSet.has(champId)) {
          recommendationScores[champId] =
            (recommendationScores[champId] || 0) + similarity;
        }
      });
    });

    // sort champion id by score
    const sortedChampionIds = Object.keys(recommendationScores).sort(
      (a, b) => recommendationScores[b] - recommendationScores[a]
    );

    //  get the top 5 champion id and arrange by score
    const topChampionIds = sortedChampionIds.slice(0, 5);
    const collaborativeRecommendations = await Champion.find({
      Id: { $in: topChampionIds },
    })
      .limit(5)
      .select("Name Class");

    console.log("Collaborative recommendations (cosine):", collaborativeRecommendations);

    // ======= Return return collaborative and content as json  =======
    return res.json({
      collaborative: collaborativeRecommendations,
      contentBased: similarChampions,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return res.status(500).json({ message: "Error fetching recommendations" });
  }
});

// =======================================
// ========== SAVE PREFERENCES ===========
// =======================================
router.post("/api/users/:id/preferences", async (req, res) => {
  const userId = req.params.id;
  const { preferences } = req.body;

  console.log("Saving preferences for user:", userId);
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
    return res.json({ message: "Preferences saved successfully" });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return res.status(500).json({ message: "Error saving preferences" });
  }
});

// =======================================
// =========== GET FAVORITES =============
// =======================================
router.get("/api/users/:id/favorites", async (req, res) => {
  const userId = req.params.id;

  try {
    console.log("Fetching saved favorites for user ID:", userId);

    
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

    // fetch fav champs by user
    const favoriteChampions = await Champion.find({ Id: { $in: user.preferences } })
      .select("Name Class");

    return res.json(favoriteChampions);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return res.status(500).json({ message: "Error fetching favorites" });
  }
});

export default router;
