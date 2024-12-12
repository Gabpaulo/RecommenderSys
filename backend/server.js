import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import championRoutes from "./routes/champion.route.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware for redirecting logged-in users
app.use((req, res, next) => {
  if (req.path === "/" && req.headers["user-id"]) {
    return res.redirect("/dashboard.html");
  }
  next();
});

// Serve static files
app.use(express.static("frontend"));

// Routes
app.use(authRoutes);
app.use(championRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
