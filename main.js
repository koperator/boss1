// --- main.js ---
// Main game loop, state management, UI rendering, and input handling.

// --- Global State & World ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GameState = { CharacterSelection: 'CharSelect', Playing: 'Playing' };
let gameState = GameState.CharacterSelection;

let player = null;
let boss = null;
let projectiles = [];
let bossProjectiles = [];
let grenades = [];
let afterimages = [];
let shockwaves = [];
let explosionParticles = [];
let flashParticles = [];
// --- ADDITION: Array for the new physical melee attack particles ---
let bladeParticles = []; 
let selectionBoxes = [];
let input = { w: false, a: false, s: false, d: false, shift: false, r: false, mouseDown: false, mouseX: 0, mouseY: 0 };
let lastTime = 0, deltaTime = 0, elapsedTime = 0, gameStartTime = 0;

const level = { width: 200, height: 200 };
const camera = { x: 0, y: 0 };

// --- Game Logic ---
function startGame(classIndex) {
    gameState = GameState.Playing;
    // --- ADDITION: Clear the bladeParticles array on new game start ---
    projectiles = []; bossProjectiles = []; grenades = []; afterimages = []; shockwaves = []; explosionParticles = []; flashParticles = []; bladeParticles = [];
    
    const playerStartX = 1000;
    const playerStartY = 1000;
    player = new Player(playerStartX, playerStartY, classes[classIndex]);
    boss = new Boss(playerStartX, playerStartY - 300);
    
    TWEEN.removeAll();
    gameStartTime = performance.now(); elapsedTime = 0; lastTime = gameStartTime;
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
}

function resolveCollisions() {
    if (!player || !player.active || !boss || !boss.active) return;

    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = player.radius + boss.radius;

    if (distance < minDistance) {
        if (boss.cooldowns.contact <= 0) {
            player.takeDamage(boss.CONTACT_DAMAGE);
            boss.cooldowns.contact = boss.CONTACT_COOLDOWN;
        }

        const overlap = minDistance - distance;
        const angle = Math.atan2(dy, dx);
        const pushX = Math.cos(angle) * overlap;
        const pushY = Math.sin(angle) * overlap;

        const bossMass = 10;
        const playerMass = 1;
        const totalMass = bossMass + playerMass;

        player.x += pushX * (bossMass / totalMass);
        player.y += pushY * (bossMass / totalMass);

        boss.x -= pushX * (playerMass / totalMass);
        boss.y -= pushY * (playerMass / totalMass);
    }
}


function updatePlaying(dt) {
    elapsedTime = (performance.now() - gameStartTime) / 1000;
    
    TWEEN.update(performance.now());

    if (player && player.active) player.update(dt);
    if (boss && boss.active) boss.update(dt, player);
    
    resolveCollisions();

    // --- ADDITION: Include bladeParticles in the main update loop ---
    const allParticles = [projectiles, bossProjectiles, grenades, afterimages, shockwaves, explosionParticles, flashParticles, bladeParticles];
    allParticles.forEach(arr => {
        for (let i = arr.length - 1; i >= 0; i--) {
            // Pass 'player' to any projectile that needs it for collision
            arr[i].update(dt, player); 
            if (!arr[i].active) arr.splice(i, 1);
        }
    });

    if (player) {
        camera.x = player.x - canvas.width / 2;
        camera.y = player.y - canvas.height / 2;
        camera.x = Math.max(0, Math.min(level.width * TILE_SIZE - canvas.width, camera.x));
        camera.y = Math.max(0, Math.min(level.height * TILE_SIZE - canvas.height, camera.y));
    }
}

// --- Drawing & UI ---
function drawLevel() {
    const startCol = Math.floor(camera.x / TILE_SIZE);
    const endCol = startCol + Math.ceil(canvas.width / TILE_SIZE) + 1;
    const startRow = Math.floor(camera.y / TILE_SIZE);
    const endRow = startRow + Math.ceil(canvas.height / TILE_SIZE) + 1;

    for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
            ctx.fillStyle = (col + row) % 2 === 0 ? '#3E3546' : '#4A4053';
            ctx.fillRect(col * TILE_SIZE - camera.x, row * TILE_SIZE - camera.y, TILE_SIZE, TILE_SIZE);
        }
    }
}

function drawPlaying() {
    const camX = camera.x, camY = camera.y;
    drawLevel();
    
    if (boss) boss.draw(ctx, camX, camY);
    
    // --- ADDITION: Include bladeParticles in the main draw loop ---
    // The order determines layering. Blades are drawn on top of most effects but under primary projectiles.
    [afterimages, shockwaves, explosionParticles, flashParticles, bladeParticles, projectiles, bossProjectiles, grenades].forEach(arr => arr.forEach(item => item.draw(ctx, camX, camY)));
    
    if (player && player.active) player.draw(ctx, camX, camY);
}

let hoveredClassIndex = -1;
function updateCharacterSelection() {
    hoveredClassIndex = -1;
    for (const box of selectionBoxes) { if (input.mouseX >= box.rect.x && input.mouseX <= box.rect.x + box.rect.w && input.mouseY >= box.rect.y && input.mouseY <= box.rect.y + box.rect.h) { hoveredClassIndex = box.classIndex; break; } }
}

function drawCharacterSelection() {
    selectionBoxes = [];
    ctx.fillStyle = '#3E3546'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const numClasses = classes.length;
    const boxWidth = Math.floor(canvas.width / (numClasses + 1.8)); 
    const boxHeight = Math.floor(boxWidth * 0.85); 
    const totalWidth = (numClasses * boxWidth) + ((numClasses - 1) * (boxWidth * 0.12));
    const startX = (canvas.width - totalWidth) / 2;
    const startY = canvas.height * 0.68; 
    ctx.font = `${Math.max(22, Math.floor(canvas.width / 42))}px ${DEFAULT_FONT_FAMILY}`;
    ctx.fillStyle = 'rgba(230, 230, 230, 0.9)'; ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'; ctx.shadowBlur = 3;
    ctx.textAlign = 'center'; ctx.fillText(`CHOOSE YOUR CLASS (PRESS 1-${numClasses} OR CLICK)`, canvas.width / 2, canvas.height * 0.12); ctx.shadowBlur = 0;
    
    classes.forEach((cls, index) => {
        const boxX = startX + index * (boxWidth + (boxWidth * 0.12));
        selectionBoxes.push({ classIndex: index, rect: { x: boxX, y: startY, w: boxWidth, h: boxHeight } });
        ctx.fillStyle = 'rgba(15, 15, 25, 0.85)'; ctx.fillRect(boxX, startY, boxWidth, boxHeight);
        ctx.strokeStyle = (hoveredClassIndex === index) ? '#FFFF99' : 'rgba(100, 100, 120, 0.5)'; ctx.lineWidth = (hoveredClassIndex === index) ? 2 : 1; ctx.strokeRect(boxX, startY, boxWidth, boxHeight);
        ctx.fillStyle = cls.color || 'grey'; ctx.fillRect(boxX + 1, startY + 1, boxWidth - 2, boxHeight * 0.22);
        ctx.font = `${Math.floor(boxHeight * 0.15)}px ${DEFAULT_FONT_FAMILY}`; ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center';
        ctx.fillText(`(${index + 1}) ${cls.name.toUpperCase()}`, boxX + boxWidth / 2, startY + boxHeight * 0.22 - (Math.floor(boxHeight * 0.15) * 0.28));
        ctx.textAlign = 'left'; let currentTextY = startY + boxHeight * 0.22 + (boxWidth * 0.08) + (Math.floor(boxHeight * 0.12) * 0.4);
        ctx.font = `${Math.floor(boxHeight * 0.12)}px ${DEFAULT_FONT_FAMILY}`; ctx.fillStyle = 'rgba(220, 220, 230, 1)';
        let shortDesc = (cls.id === CLASS_ID.MARINE) ? "SOLDIER | GRENADES" : "TANK | DASH";
        wrapText(ctx, shortDesc.toUpperCase(), boxWidth - (boxWidth * 0.08) * 2).forEach(line => { ctx.fillText(line, boxX + (boxWidth * 0.08), currentTextY); currentTextY += Math.floor(boxHeight * 0.12) * 1.2; });
        currentTextY += Math.floor(boxHeight * 0.12) * 0.4;
        ctx.font = `${Math.floor(boxHeight * 0.11)}px ${DEFAULT_FONT_FAMILY}`; ctx.fillStyle = 'rgba(210, 210, 220, 1)';
        ctx.fillText(`HP: ${cls.hp}`, boxX + (boxWidth * 0.08), currentTextY); currentTextY += Math.floor(boxHeight * 0.11) * 1.25;
        const weapon = weapons.find(w => w.id === cls.weaponId); ctx.fillText(`WPN: ${weapon ? weapon.name.toUpperCase() : 'N/A'}`, boxX + (boxWidth * 0.08), currentTextY); 
    });
    ctx.textAlign = 'left'; ctx.lineWidth = 1;
}

function drawUI() {
    if (!player) return; ctx.font = `16px ${DEFAULT_FONT_FAMILY}`;
    const barHeight = 18, hpBarWidth = 180, hpBarX = 10, hpBarY = canvas.height - barHeight - 10;
    ctx.fillStyle = 'red'; ctx.fillRect(hpBarX, hpBarY, hpBarWidth, barHeight); ctx.fillStyle = 'lime'; ctx.fillRect(hpBarX, hpBarY, (player.hp / player.maxHp) * hpBarWidth, barHeight);
    ctx.strokeStyle = 'white'; ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, barHeight); ctx.fillStyle = 'white'; ctx.textAlign = 'left'; ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, hpBarX + 5, hpBarY + barHeight - 4);
    ctx.textAlign = 'right';
    let ammoText = `AMMO: ${player.ammo} / ${player.currentWeapon.magSize === Infinity ? '∞' : player.currentWeapon.magSize}`;
    if (player.reloading) ammoText = `RELOADING... (${((player.currentWeapon.reloadTime - player.reloadTimer)/1000).toFixed(1)}s)`;
    else if (player.ammo <= 0) ammoText = "RELOAD NEEDED";
    ctx.fillStyle = player.reloading ? 'yellow' : (player.ammo <= 0 ? 'orange' : 'white'); ctx.fillText(ammoText, canvas.width - 15, canvas.height - 20);
    ctx.fillStyle = 'white'; ctx.fillText(`${player.currentWeapon.name.toUpperCase()}`, canvas.width - 15, canvas.height - 70);
    let abilityName = player.abilityType === 'grenade' ? `GRENADE (${player.abilityUsesLeft} LEFT)` : 'DASH';
    let abilityText = `ABILITY: ${abilityName}`, abilityColor = 'white';
    if (player.isBrawler) { abilityText = `ABILITY: DASH [${player.abilityCharges}/${player.abilityMaxCharges}]`; if (player.abilityCharges < player.abilityMaxCharges && player.abilityRechargeTimer > 0) { abilityText += ` (${(player.abilityRechargeTimer/1000).toFixed(1)}s)`; abilityColor = 'yellow'; } else if (player.abilityCharges === 0) { abilityColor = 'grey'; } else { abilityColor = 'lime'; } } 
    else { if (player.abilityCooldownTimer > 0) { abilityText += ` (CD ${(player.abilityCooldownTimer / 1000).toFixed(1)}S)`; abilityColor = 'yellow'; } else if (player.abilityUsesLeft === 0) { abilityText += " (EMPTY)"; abilityColor = 'grey'; } else { abilityColor = 'lime'; } }
    ctx.fillStyle = abilityColor; ctx.fillText(abilityText, canvas.width - 15, canvas.height - 45);
    ctx.font = `14px ${DEFAULT_FONT_FAMILY}`; ctx.textAlign = 'left'; ctx.fillStyle = 'white';
    ctx.fillText(`TIME: ${Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:${Math.floor(elapsedTime % 60).toString().padStart(2, '0')}`, 15, 20); 
    ctx.fillText(`BOSS HP: ${boss ? Math.ceil(boss.hp) : 'N/A'}`, 15, 40);
}

// --- Input Handling ---
function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (gameState === GameState.CharacterSelection) {
            const num = parseInt(key);
            if (!isNaN(num) && num >= 1 && num <= classes.length) {
                startGame(num - 1);
            }
        } else if (gameState === GameState.Playing && player && player.active) {
            if (key === 'w') input.w = true;
            else if (key === 'a') input.a = true;
            else if (key === 's') input.s = true;
            else if (key === 'd') input.d = true;
            else if (key === 'r') input.r = true;
            else if (key === 'shift') input.shift = true;
            else if (key === ' ') {
                e.preventDefault();
                if (!e.repeat) {
                    player.useAbility();
                }
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w') input.w = false;
        else if (key === 'a') input.a = false;
        else if (key === 's') input.s = false;
        else if (key === 'd') input.d = false;
        else if (key === 'r') input.r = false;
        else if (key === 'shift') input.shift = false;
    });

    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) { if (gameState === GameState.CharacterSelection) { const rect = canvas.getBoundingClientRect(); const mx = e.clientX - rect.left, my = e.clientY - rect.top; selectionBoxes.forEach(box => { if (mx >= box.rect.x && mx <= box.rect.x + box.rect.w && my >= box.rect.y && my <= box.rect.y + box.rect.h) startGame(box.classIndex); }); } else if (gameState === GameState.Playing) { input.mouseDown = true; if(player && !player.currentWeapon.auto) player.attackedThisClick = false; } } });
    canvas.addEventListener('mouseup', (e) => { if (e.button === 0) { input.mouseDown = false; if(player) player.attackedThisClick = false; } });
    canvas.addEventListener('mousemove', (e) => { const rect = canvas.getBoundingClientRect(); input.mouseX = e.clientX - rect.left; input.mouseY = e.clientY - rect.top; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// --- Main Game Loop ---
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === GameState.CharacterSelection) { updateCharacterSelection(); drawCharacterSelection(); } 
    else if (gameState === GameState.Playing) { updatePlaying(deltaTime); drawPlaying(); drawUI(); }
    requestAnimationFrame(gameLoop);
}

// --- Initializer ---
setupInputListeners();
requestAnimationFrame(gameLoop);