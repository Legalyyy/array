import express, { type Express } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = 5000;

app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Setup Vite dev server
if (process.env.NODE_ENV === "development") {
  const vite = await createViteServer({
    root: path.resolve(__dirname, "../client"),
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);
}

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// TODO: Start the Discord bot
// startBot().catch(console.error);
