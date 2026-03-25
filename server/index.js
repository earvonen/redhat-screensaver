const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const IMAGES_DIR = path.join(ROOT, "images");

// Get list of images in the images directory
const images = fs.readdirSync(IMAGES_DIR).filter(file => file.endsWith('.png'));
let currentImageIndex = 0;

app.use(express.static(PUBLIC));

app.get("/api/image", (req, res) => {
  // Cycle to the next image
  currentImageIndex = (currentImageIndex + 1) % images.length;
  const imagePath = path.join(IMAGES_DIR, images[currentImageIndex]);
  
  res.type("image/png");
  res.sendFile(imagePath);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
});