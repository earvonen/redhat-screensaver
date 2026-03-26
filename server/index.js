const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Serve static files from public directory
app.use(express.static('public'));

// Get list of image files
const imagesDir = path.join(__dirname, '..', 'images');
let imageFiles = [];
let currentImageIndex = 0;

function getImageFiles() {
    try {
        imageFiles = fs.readdirSync(imagesDir).filter(file => {
            return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file);
        });
    } catch (err) {
        console.error('Error reading images directory:', err);
        imageFiles = [];
    }
}

// Refresh image list on startup and periodically
getImageFiles();
setInterval(getImageFiles, 60000); // Refresh every minute

// API endpoint to get current image
app.get('/api/current-image', (req, res) => {
    if (imageFiles.length === 0) {
        return res.status(404).json({ error: 'No images found' });
    }
    
    const currentImage = imageFiles[currentImageIndex];
    res.json({ 
        image: currentImage,
        imageUrl: `/images/${currentImage}`,
        currentIndex: currentImageIndex,
        totalImages: imageFiles.length
    });
});

// API endpoint to switch to next image
app.get('/api/next-image', (req, res) => {
    if (imageFiles.length === 0) {
        return res.status(404).json({ error: 'No images found' });
    }
    
    currentImageIndex = (currentImageIndex + 1) % imageFiles.length;
    const currentImage = imageFiles[currentImageIndex];
    res.json({ 
        image: currentImage,
        imageUrl: `/images/${currentImage}`,
        currentIndex: currentImageIndex,
        totalImages: imageFiles.length
    });
});

// Serve images
app.use('/images', express.static(imagesDir));

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Serving images from: ${imagesDir}`);
    getImageFiles();
    if (imageFiles.length > 0) {
        console.log(`Found ${imageFiles.length} images`);
        console.log(`Current image: ${imageFiles[currentImageIndex]}`);
    } else {
        console.log('No images found in images directory');
    }
});