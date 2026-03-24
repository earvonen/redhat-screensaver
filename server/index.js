const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const IMAGE_PATH = path.join(ROOT, "images", "redhat.png");

app.use(express.static(PUBLIC));

app.get("/api/image", (req, res) => {
  // Check if file exists before sending
  if (!fs.existsSync(IMAGE_PATH)) {
    return res.status(404).json({ error: "Image not found" });
  }
  res.type("image/png");
  res.sendFile(IMAGE_PATH);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
});