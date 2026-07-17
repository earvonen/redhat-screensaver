// @ts-check

const speed = 2;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let image = null;
let imageX = 0;
let imageY = 0;
let imageWidth = 0;
let imageHeight = 0;
let velocityX = 0;
let velocityY = 0;
let animationId = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function loadImage() {
  image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/RedHat_World_Map_Logo.svg/1024px-RedHat_World_Map_Logo.svg.png';

  image.onload = function () {
    imageWidth = image.width / 2;
    imageHeight = image.height / 2;
    imageX = (canvas.width - imageWidth) / 2;
    imageY = (canvas.height - imageHeight) / 2;

    const angle = Math.random() * 2 * Math.PI;
    const minSpeed = 2;
    const maxSpeed = 5;
    const currentSpeed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    velocityX = Math.cos(angle) * currentSpeed * speed;
    velocityY = Math.sin(angle) * currentSpeed * speed;

    startAnimation();
  };
}

function startAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  animate();
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  imageX += velocityX;
  imageY += velocityY;

  if (imageX + imageWidth < 0) {
    imageX = canvas.width;
  } else if (imageX > canvas.width) {
    imageX = -imageWidth;
  }

  if (imageY + imageHeight < 0) {
    imageY = canvas.height;
  } else if (imageY > canvas.height) {
    imageY = -imageHeight;
  }

  ctx.drawImage(image, imageX, imageY, imageWidth, imageHeight);

  animationId = requestAnimationFrame(animate);
}

window.addEventListener('resize', function () {
  resizeCanvas();
  if (image) {
    imageX = (canvas.width - imageWidth) / 2;
    imageY = (canvas.height - imageHeight) / 2;
  }
});

resizeCanvas();
loadImage();