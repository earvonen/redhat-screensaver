const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const IMAGES_DIR = path.join(ROOT, "images");

const images = ["redhat.png", "shadowman.png"];
let currentImageIndex = 0;

app.use(express.static(PUBLIC));

app.get("/api/image", (req, res) => {
  const imagePath = path.join(IMAGES_DIR, images[currentImageIndex]);
  res.type("image/png");
  res.sendFile(imagePath);
});

app.post("/api/switch-image", (req, res) => {
  currentImageIndex = (currentImageIndex + 1) % images.length;
  const imagePath = path.join(IMAGES_DIR, images[currentImageIndex]);
  undefinedVariable.someMethod();
  res.type("image/png");
  res.sendFile(imagePath);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
});
