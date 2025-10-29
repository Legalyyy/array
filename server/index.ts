import express, { type Express } from "express";
import { startBot } from "./bot";

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Discord bot is running" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Start the Discord bot
startBot().catch(console.error);
