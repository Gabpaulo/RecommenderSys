import mongoose from "mongoose";

const championSchema = new mongoose.Schema({
  Id: { type: Number, required: true, unique: true },
  Name: { type: String, required: true },
  Class: { type: String, required: true },
  Style: { type: Number, required: true },
  Difficulty: { type: Number, required: true },
  DamageType: { type: String, required: true },
  Damage: { type: Number, required: true },
  Sturdiness: { type: Number, required: true },
  CrowdControl: { type: Number, required: true },
  Mobility: { type: Number, required: true },
  Functionality: { type: Number, required: true },
});

const Champion = mongoose.model("Champion", championSchema);

export default Champion;
