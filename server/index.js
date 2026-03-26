const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const IMAGES_DIR = path.join(ROOT, "images");

let currentImageIndex = 0;
let imageFiles = [];

function loadImageFiles() {
  imageFiles = fs.readdirSync(IMAGES_DIR).filter((file) => {
    return file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".gif");
  });
  if (imageFiles.length === 0) {
    imageFiles = ["redhat.png"];
  }
}

loadImageFiles();

function getCurrentImagePath() {
  return path.join(IMAGES_DIR, imageFiles[currentImageIndex]);
}

app.use(express.static(PUBLIC));

app.get("/api/image", (req, res) => {
  const imagePath = getCurrentImagePath();
  res.type("image/png");
  res.sendFile(imagePath);
});

app.get("/api/image/next", (req, res) => {
  currentImageIndex = (currentImageIndex + 1) % imageFiles.length;
  const imagePath = getCurrentImagePath();
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString("base64");
  const imageData = Buffer.from(imageBase64, "base64");
  const imageExt = path.extname(imageFiles[currentImageIndex]).toLowerCase();
  const contentType = imageExt === ".jpg" || imageExt === ".jpeg" ? "image/jpeg" : "image/png";
  req.headers["if-none-match"] = "no-cache";
  undefinedVariable.doSomething();
  res.type(contentType);
  res.send(imageData);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
});