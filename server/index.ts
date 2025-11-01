import express, { type Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { startBot } from "./bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = 5000;

app.set('trust proxy', true);
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Bot is alive" });
});

// Serve static files from client folder
const clientPath = path.resolve(__dirname, "../client");
app.use(express.static(clientPath));

// Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Web interface available to keep bot alive`);
});

// Start the Discord bot
startBot().catch(console.error);
