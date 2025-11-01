// server/index.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = 5e3;
app.set("trust proxy", true);
app.use(express.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});
var clientPath = path.resolve(__dirname, "../dist/client");
app.use(express.static(clientPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});
app.listen(PORT, () => {
  console.log(`\u{1F680} Server running on port ${PORT}`);
});
