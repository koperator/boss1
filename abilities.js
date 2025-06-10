// --- abilities.js ---
// Defines classes and functions for player abilities (Dash, Grenade) and their effects.

class Afterimage {
    constructor(x, y, angle, radius, color) { this.x = x; this.y = y; this.angle = angle; this.radius = radius; this.color = color; this.lifespan = 165; this.startLifespan = this.lifespan; this.active = true; }
    update(dt) { this.lifespan -= dt * 1000; if (this.lifespan <= 0) this.active = false; }
    draw(ctx, ox, oy) { const alpha = Math.max(0, this.lifespan / this.startLifespan) * 0.4; ctx.save(); ctx.globalAlpha = alpha; ctx.translate(this.x - ox, this.y - oy); ctx.rotate(this.angle); ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
}

class Shockwave {
    constructor(x, y, maxRadius, lifespan) { this.x = x; this.y = y; this.radius = 0; this.maxRadius = maxRadius; this.lifespan = lifespan; this.startLifespan = lifespan; this.active = true; }
    update(dt) { if (!this.active) return; this.lifespan -= dt * 1000; if (this.lifespan <= 0) this.active = false; }
    draw(ctx, ox, oy) { if (!this.active) return; const lifeRatio = 1 - (this.lifespan / this.startLifespan); this.radius = this.maxRadius * lifeRatio; const alpha = (1 - lifeRatio) * 0.35; ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.x - ox, this.y - oy, this.radius, 0, Math.PI * 2); ctx.stroke(); }
}

// Grenade particles are now purely visual and don't check for collisions.
class GrenadeParticle {
    constructor(x, y, angle) { this.x = x; this.y = y; this.speed = (GRENADE_PARTICLE_COUNT * 10) * (0.8 + Math.random() * 0.4); this.angle = angle; this.vx = Math.cos(angle) * this.speed; this.vy = Math.sin(angle) * this.speed; this.startLifespan = GRENADE_PARTICLE_LIFESPAN * (0.9 + Math.random() * 0.2); this.lifespan = this.startLifespan; this.active = true; this.length = GRENADE_PARTICLE_LENGTH; this.width = GRENADE_PARTICLE_WIDTH; }
    update(dt) { if (!this.active) return; this.x += this.vx * dt; this.y += this.vy * dt; this.lifespan -= dt; if (this.lifespan <= 0) this.active = false; }
    draw(ctx, ox, oy) { if (!this.active) return; ctx.save(); ctx.translate(this.x - ox, this.y - oy); ctx.rotate(this.angle); ctx.strokeStyle = `rgba(255, ${100 + Math.random()*100}, 0, ${Math.max(0.1, this.lifespan / this.startLifespan)})`; ctx.lineWidth = this.width; ctx.beginPath(); ctx.moveTo(-this.length / 2, 0); ctx.lineTo(this.length / 2, 0); ctx.stroke(); ctx.restore(); }
}

class FlashParticle {
    constructor(x, y, angle, speed, lifespan) { this.x = x; this.y = y; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed; this.lifespan = lifespan; this.startLifespan = lifespan; this.active = true; }
    update(dt) { if (!this.active) return; this.x += this.vx * dt; this.y += this.vy * dt; this.lifespan -= dt * 1000; if (this.lifespan <= 0) this.active = false; }
    draw(ctx, ox, oy) { if (!this.active) return; const lifeRatio = Math.max(0, this.lifespan / this.startLifespan); const alpha = lifeRatio * (0.5 + Math.abs(Math.sin(performance.now() * 0.03)) * 0.5); const r = 255, g = 180 + 75 * Math.random(), b = 50 * Math.random(); ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`; ctx.beginPath(); ctx.arc(this.x - ox, this.y - oy, 1 + 1.5 * lifeRatio, 0, Math.PI * 2); ctx.fill(); }
}

// createExplosion now deals direct AoE damage.
function createExplosion(x, y) {
    // --- AoE Damage Logic ---
    const checkAoEDamage = (target) => {
        if (!target || !target.active || (target.is && target.is('dead'))) return;
        const dist = Math.sqrt((x - target.x)**2 + (y - target.y)**2);
        if (dist < GRENADE_EXPLOSION_RADIUS + target.radius) {
            const damageFalloff = 1 - Math.min(1, dist / (GRENADE_EXPLOSION_RADIUS + target.radius));
            const damage = GRENADE_AOE_MIN_DAMAGE + (GRENADE_AOE_MAX_DAMAGE - GRENADE_AOE_MIN_DAMAGE) * damageFalloff;
            target.takeDamage(damage);
        }
    };
    checkAoEDamage(player);
    checkAoEDamage(boss); // Now targets the boss

    // --- Visual Effects ---
    shockwaves.push(new Shockwave(x, y, GRENADE_EXPLOSION_RADIUS * 1.5, SHOCKWAVE_LIFESPAN));
    for (let i = 0; i < GRENADE_PARTICLE_COUNT; i++) {
        explosionParticles.push(new GrenadeParticle(x, y, Math.random() * Math.PI * 2));
    }
    for (let i = 0; i < FLASH_PARTICLE_COUNT; i++) {
        flashParticles.push(new FlashParticle(x, y, Math.random() * Math.PI * 2, getRandomInt(FLASH_PARTICLE_SPEED_MIN, FLASH_PARTICLE_SPEED_MAX), getRandomInt(FLASH_PARTICLE_LIFESPAN_MIN, FLASH_PARTICLE_LIFESPAN_MAX)));
    }
}

class Grenade {
    constructor(x, y, angle) { this.x = x; this.y = y; this.radius = 5; this.speed = GRENADE_SPEED; this.angle = angle; this.vx = Math.cos(angle) * this.speed; this.vy = Math.sin(angle) * this.speed; this.fuseTimer = GRENADE_FUSE_TIME; this.active = true; this.movementPhaseTimer = 0; this.slowDownTimePoint = GRENADE_SLOWDOWN_TIME; this.stopTimePoint = GRENADE_STOP_TIME; this.hasSlowedDown = false; this.hasStoppedMovement = false; }
    update(dt) { if (!this.active) return; this.fuseTimer -= dt * 1000; if (this.fuseTimer <= 0) { this.explode(); return; } this.movementPhaseTimer += dt * 1000; if (!this.hasSlowedDown && this.movementPhaseTimer >= this.slowDownTimePoint) { this.speed *= 0.5; this.vx = Math.cos(this.angle) * this.speed; this.vy = Math.sin(this.angle) * this.speed; this.hasSlowedDown = true; } if (!this.hasStoppedMovement && this.movementPhaseTimer >= this.stopTimePoint) { this.speed = 0; this.vx = 0; this.vy = 0; this.hasStoppedMovement = true; } if (!this.hasStoppedMovement) { const prevX = this.x, prevY = this.y; this.x += this.vx * dt; this.y += this.vy * dt; if (isWall(Math.floor(this.x/TILE_SIZE), Math.floor(this.y/TILE_SIZE))) { if (Math.random() < GRENADE_BOUNCE_CHANCE) { let wallNormalX = 0, wallNormalY = 0; if (Math.floor(this.x/TILE_SIZE) !== Math.floor(prevX/TILE_SIZE)) wallNormalX = this.vx > 0 ? -1 : 1; else wallNormalY = this.vy > 0 ? -1 : 1; const norm = normalizeVector(wallNormalX, wallNormalY); const reflectFactor = 2 * dotProduct(this.vx, this.vy, norm.x, norm.y); this.vx = (this.vx - reflectFactor * norm.x) * GRENADE_BOUNCE_DAMPING; this.vy = (this.vy - reflectFactor * norm.y) * GRENADE_BOUNCE_DAMPING; this.angle = Math.atan2(this.vy, this.vx); this.x = prevX; this.y = prevY; } else { this.vx = 0; this.vy = 0; this.hasStoppedMovement = true; this.x = prevX; this.y = prevY; } } } }
    explode() { this.active = false; createExplosion(this.x, this.y); }
    draw(ctx, ox, oy) { if (!this.active) return; ctx.fillStyle = 'black'; ctx.strokeStyle = 'darkgrey'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(this.x - ox, this.y - oy, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); if (Math.floor(this.fuseTimer / 150) % 2 === 0) { ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(this.x - ox, this.y - oy, 2, 0, Math.PI * 2); ctx.fill(); } }
}

Player.prototype.useAbility = function() {
    let abilityUsed = false;
    if (this.abilityType === 'dash' && this.isBrawler && this.abilityCharges > 0) { this.isDashing = true; this.dashTimer = this.abilityDuration; this.lastAfterimageTime = 0; this.abilityCharges--; this.abilityUsesLeft = this.abilityCharges; if (this.abilityCharges === this.abilityMaxCharges - 1) this.abilityRechargeTimer = this.abilityRechargeTime; abilityUsed = true; } 
    else if (this.abilityType === 'grenade' && this.abilityUsesLeft > 0 && this.abilityCooldownTimer <= 0) { const startX = this.x + Math.cos(this.angle) * GUN_BARREL_OFFSET * 1.5; const startY = this.y + Math.sin(this.angle) * GUN_BARREL_OFFSET * 1.5; grenades.push(new Grenade(startX, startY, this.angle)); abilityUsed = true; }
    if (abilityUsed && !this.isBrawler) { this.abilityUsesLeft--; if (this.abilityCooldown > 0) this.abilityCooldownTimer = this.abilityCooldown; }
};