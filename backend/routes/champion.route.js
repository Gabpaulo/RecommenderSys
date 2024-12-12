import express from "express";
import Champion from "../models/champion.model.js";

const router = express.Router();

// Fetch all champions
router.get("/api/champions", async (req, res) => {
  try {
    const champions = await Champion.find({});
    res.json(champions);
  } catch (error) {
    console.error("Error fetching champions:", error);
    res.status(500).json({ message: "Error fetching champions" });
  }
});

export default router;
