const image = document.getElementById('screensaver-image');
const container = document.getElementById('container');

let speed = 4;
let x = 0;
let y = 0;
let directionX = 1;
let directionY = 1;

function animate() {
  x += speed * directionX;
  y += speed * directionY;

  const maxX = container.clientWidth - image.clientWidth;
  const maxY = container.clientHeight - image.clientHeight;

  if (x >= maxX || x <= 0) {
    directionX *= -1;
    x = Math.max(0, Math.min(x, maxX));
  }

  if (y >= maxY || y <= 0) {
    directionY *= -1;
    y = Math.max(0, Math.min(y, maxY));
  }

  image.style.transform = `translate(${x}px, ${y}px)`;
  requestAnimationFrame(animate);
}

animate();