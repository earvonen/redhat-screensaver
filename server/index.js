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
  
  // Secret feature: error when button is pressed
  if (req.query.button === "true") {
    console.error("Error: Failed to load image from button press");
    return res.status(500).json({ error: "Failed to load image" });
  }
  
  res.type("image/png");
  res.sendFile(imagePath);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
});