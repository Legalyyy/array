// server/index.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = 5e3;
app.use(express.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});
if (process.env.NODE_ENV === "development") {
  const vite = await createViteServer({
    root: path.resolve(__dirname, "../client"),
    server: {
      middlewareMode: true,
      host: "0.0.0.0",
      hmr: {
        host: "localhost",
        clientPort: 443
      }
    },
    appType: "spa"
  });
  app.use(vite.middlewares);
}
app.listen(PORT, () => {
  console.log(`\u{1F680} Server running on port ${PORT}`);
});
