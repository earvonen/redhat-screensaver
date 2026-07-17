// @ts-check

/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Velocity
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Dimensions
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} State
 * @property {HTMLImageElement} image
 * @property {HTMLCanvasElement} canvas
 * @property {CanvasRenderingContext2D} ctx
 * @property {Position} position
 * @property {Velocity} velocity
 * @property {Dimensions} imageDimensions
 * @property {Dimensions} canvasDimensions
 */

const image = document.getElementById('screensaver-image');
const canvas = document.getElementById('screensaver-canvas');
const ctx = canvas.getContext('2d');

/** @type {State} */
const state = {
    image,
    canvas,
    ctx,
    position: { x: 0, y: 0 },
    velocity: { x: 1, y: 1 },
    imageDimensions: { width: 0, height: 0 },
    canvasDimensions: { width: 0, height: 0 },
};

/**
 * @param {HTMLImageElement} image
 * @returns {Promise<Dimensions>}
 */
function getImageDimensions(image) {
    return new Promise((resolve) => {
        if (image.complete) {
            resolve({ width: image.naturalWidth, height: image.naturalHeight });
        } else {
            image.onload = () => {
                resolve({ width: image.naturalWidth, height: image.naturalHeight });
            };
        }
    });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Dimensions}
 */
function getCanvasDimensions(canvas) {
    return { width: canvas.width, height: canvas.height };
}

/**
 * @param {number} canvasWidth
 * @param {number} imageWidth
 * @returns {number}
 */
function getRandomX(canvasWidth, imageWidth) {
    return Math.random() * (canvasWidth - imageWidth);
}

/**
 * @param {number} canvasHeight
 * @param {number} imageHeight
 * @returns {number}
 */
function getRandomY(canvasHeight, imageHeight) {
    return Math.random() * (canvasHeight - imageHeight);
}

/**
 * @param {State} state
 */
function updateDimensions(state) {
    state.imageDimensions = getImageDimensions(state.image);
    state.canvasDimensions = getCanvasDimensions(state.canvas);
}

/**
 * @param {State} state
 */
function updatePosition(state) {
    const { position, velocity, imageDimensions, canvasDimensions } = state;

    position.x += velocity.x;
    position.y += velocity.y;

    const imageWidth = imageDimensions.width;
    const imageHeight = imageDimensions.height;
    const canvasWidth = canvasDimensions.width;
    const canvasHeight = canvasDimensions.height;

    if (position.x <= 0 || position.x + imageWidth >= canvasWidth) {
        velocity.x *= -1;
        position.x = Math.max(0, Math.min(position.x, canvasWidth - imageWidth));
    }

    if (position.y <= 0 || position.y + imageHeight >= canvasHeight) {
        velocity.y *= -1;
        position.y = Math.max(0, Math.min(position.y, canvasHeight - imageHeight));
    }
}

/**
 * @param {State} state
 */
function draw(state) {
    const { ctx, image, position, imageDimensions } = state;
    ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    ctx.drawImage(image, position.x, position.y, imageDimensions.width, imageDimensions.height);
}

/**
 * @param {State} state
 */
async function animate(state) {
    const speed = 1.0;

    updateDimensions(state);

    state.position.x = getRandomX(state.canvasDimensions.width, state.imageDimensions.width);
    state.position.y = getRandomY(state.canvasDimensions.height, state.imageDimensions.height);

    function animateFrame() {
        updatePosition(state);
        draw(state);
        requestAnimationFrame(animateFrame);
    }

    state.velocity.x *= speed;
    state.velocity.y *= speed;

    animateFrame();
}

animate(state);