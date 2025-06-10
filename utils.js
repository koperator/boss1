// --- utils.js ---
// Contains shared utility functions used across different game files.

function isWall(gridX, gridY) {
    return gridX < 0 || gridX >= level.width || gridY < 0 || gridY >= level.height;
}

function checkWallCollision(px, py, r) {
    return px - r < 0 || px + r >= level.width * TILE_SIZE || py - r < 0 || py + r >= level.height * TILE_SIZE;
}

function wrapText(context, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        if (context.measureText(currentLine + " " + word).width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeVector(vx, vy) {
    const mag = Math.sqrt(vx * vx + vy * vy);
    return mag === 0 ? { x: 0, y: 0 } : { x: vx / mag, y: vy / mag };
}

function dotProduct(vx1, vy1, vx2, vy2) {
    return vx1 * vx2 + vy1 * vy2;
}