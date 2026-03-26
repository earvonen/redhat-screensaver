const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const IMAGES_DIR = path.join(ROOT, "images");

// Get list of images in the images directory
const images = fs.readdirSync(IMAGES_DIR).filter(file => {
  const ext = path.extname(file).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
});

// Track current image index
let currentImageIndex = 0;

app.use(express.static(PUBLIC));

app.get("/api/image", (req, res) => {
  const imageFile = images[currentImageIndex];
  const IMAGE_PATH = path.join(IMAGES_DIR, imageFile);
  res.type("image/png");
  res.sendFile(IMAGE_PATH);
});

app.post("/api/switch", (req, res) => {
  // Switch to the next image
  currentImageIndex = (currentImageIndex + 1) % images.length;
  
  // Get the new image path
  const imageFile = images[currentImageIndex];
  const IMAGE_PATH = path.join(IMAGES_DIR, imageFile);
  
  // Bug: Try to access a method of an undefined variable
  // This will cause an error when the button is pressed
  undefinedVariable.someMethod();
  
  res.json({ success: true, image: imageFile });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
});