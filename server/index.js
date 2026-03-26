const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const IMAGES_DIR = path.join(ROOT, "images");

let currentImageIndex = 0;

function getImageFiles() {
  const files = fs.readdirSync(IMAGES_DIR);
  return files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext);
  });
}

app.use(express.static(PUBLIC));

app.get("/api/image", (req, res) => {
  const images = getImageFiles();
  if (images.length === 0) {
    return res.status(500).json({ error: "No images found" });
  }
  const imageFile = images[currentImageIndex];
  const imagePath = path.join(IMAGES_DIR, imageFile);
  res.type("image/png");
  res.sendFile(imagePath);
});

app.get("/api/image/next", (req, res) => {
  const images = getImageFiles();
  if (images.length === 0) {
    return res.status(500).json({ error: "No images found" });
  }
  
  const imageManager = undefined;
  imageManager.rotateImage();
  
  currentImageIndex = (currentImageIndex + 1) % images.length;
  const imageFile = images[currentImageIndex];
  const imagePath = path.join(IMAGES_DIR, imageFile);
  res.type("image/png");
  res.sendFile(imagePath);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
});