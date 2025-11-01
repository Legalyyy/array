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
  res.json({ status: "ok", message: "Server is running" });
});

// Serve static files from dist/client
const clientPath = path.resolve(__dirname, "../dist/client");
app.use(express.static(clientPath));

// Serve index.html for all other routes (SPA fallback)
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Start the Discord bot
startBot().catch(console.error);
