import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true},
    email: { type: String, required: true, },
    password: { type: String, required: true },
    preferences: [{ type: Number }], // Array of champion IDs
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
