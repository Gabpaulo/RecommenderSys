import User from "../models/user.model.js";
import Champion from "../models/champion.model.js";

// Save user preferences
export const saveUserPreferences = async (req, res) => {
  const userId = req.params.id;
  const { preferences } = req.body;

  if (!Array.isArray(preferences)) {
    return res.status(400).json({ message: "Invalid preferences format. Must be an array." });
  }

  try {
    const validChampionIds = await Champion.find({ Id: { $in: preferences } }).select("Id");
    const validIds = validChampionIds.map((champion) => champion.Id);

    if (validIds.length !== preferences.length) {
      return res.status(400).json({ message: "One or more invalid champion IDs provided." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.preferences = preferences;
    await user.save();
    res.json({ message: "Preferences saved successfully" });
  } catch (error) {
    console.error("Error saving preferences:", error.message);
    res.status(500).json({ message: "Error saving preferences" });
  }
};

// Fetch recommendations
export const getRecommendations = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const similarUsers = await User.find({
      _id: { $ne: user._id },
      preferences: { $in: user.preferences },
    });

    const recommendedChampionIds = [];
    similarUsers.forEach((similarUser) => {
      similarUser.preferences.forEach((championId) => {
        if (!user.preferences.includes(championId)) {
          recommendedChampionIds.push(championId);
        }
      });
    });

    const uniqueChampionIds = [...new Set(recommendedChampionIds)];
    const recommendedChampions = await Champion.find({ Id: { $in: uniqueChampionIds } });

    res.json(recommendedChampions);
  } catch (error) {
    console.error("Error fetching recommendations:", error.message);
    res.status(500).json({ message: "Error fetching recommendations" });
  }
};
