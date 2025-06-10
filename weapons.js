// --- weapons.js ---
// Defines the projectile class and the player's combat functions.

class Projectile {
    constructor(x, y, angle, speed, ricochets, length, width, damage) {
        this.x = x; this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.angle = angle; this.length = length; this.width = width;
        this.radius = width / 2;
        this.damage = damage;
        this.lifespan = PROJECTILE_LIFESPAN_DEFAULT;
        this.active = true;
        this.ricochetsLeft = ricochets;
    }
    update(dt) {
        if (!this.active) return;
        const prevX = this.x, prevY = this.y;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifespan -= dt;
        if (this.lifespan <= 0) { this.active = false; return; }

        // Check for collision with the boss
        if (boss && boss.active && !boss.is('dead')) {
            const distSq = (this.x - boss.x)**2 + (this.y - boss.y)**2;
            if (distSq < (this.radius + boss.radius)**2) {
                boss.takeDamage(this.damage);
                this.active = false;
                return;
            }
        }
        
        // Check for wall collision
        if (isWall(Math.floor(this.x / TILE_SIZE), Math.floor(this.y / TILE_SIZE))) {
            if (this.ricochetsLeft-- > 0) {
                let wallNormalX = 0, wallNormalY = 0;
                if (Math.floor(this.x/TILE_SIZE) !== Math.floor(prevX/TILE_SIZE)) wallNormalX = this.vx > 0 ? -1 : 1;
                else wallNormalY = this.vy > 0 ? -1 : 1;
                const norm = normalizeVector(wallNormalX, wallNormalY);
                const reflectFactor = 2 * dotProduct(this.vx, this.vy, norm.x, norm.y);
                this.vx -= reflectFactor * norm.x;
                this.vy -= reflectFactor * norm.y;
                this.angle = Math.atan2(this.vy, this.vx);
                this.x = prevX; this.y = prevY;
            } else {
                this.active = false;
            }
        }
    }
    draw(ctx, ox, oy) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x - ox, this.y - oy);
        ctx.rotate(this.angle);
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = this.width;
        ctx.beginPath();
        ctx.moveTo(-this.length / 2, 0);
        ctx.lineTo(this.length / 2, 0);
        ctx.stroke();
        ctx.restore();
    }
}

Player.prototype.startReload = function() {
    if (!this.reloading && this.ammo < this.currentWeapon.magSize) {
        this.reloading = true;
        this.reloadTimer = 0;
    }
};

Player.prototype.shootProjectile = function() {
    const weapon = this.currentWeapon;
    const barrelStartX = this.x + Math.cos(this.angle) * GUN_BARREL_OFFSET;
    const barrelStartY = this.y + Math.sin(this.angle) * GUN_BARREL_OFFSET;

    const pellets = weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
        const shotAngle = this.angle + (Math.random() - 0.5) * this.spread;
        let projSpeed = weapon.projectileSpeed,
            projLength = PROJECTILE_LENGTH_DEFAULT,
            projLifespan = PROJECTILE_LIFESPAN_DEFAULT;

        if (weapon.id === WEAPON_ID.AUTOSHOTGUN) {
            projSpeed *= (1 + (Math.random() - 0.5) * SHOTGUN_PELLET_SPEED_VARIATION);
            projLifespan = SHOTGUN_PELLET_LIFESPAN;
        }
        if (weapon.id === WEAPON_ID.MACHINEGUN) {
            projLength = MG_PROJECTILE_LENGTH;
        }

        const newProjectile = new Projectile(barrelStartX, barrelStartY, shotAngle, projSpeed, weapon.ricochets, projLength, PROJECTILE_WIDTH_DEFAULT, weapon.damage);
        newProjectile.lifespan = projLifespan;
        projectiles.push(newProjectile);
    }
};