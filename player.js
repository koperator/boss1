// --- player.js ---
// Defines the core Player class, handling movement, state, and drawing.

// Damping for how quickly the player stops after being knocked back. Higher value = stops faster.
const PLAYER_KNOCKBACK_DAMPING = 3.0; 

let nextPlayerId = 0;

class Player {
    constructor(x, y, classData) {
        this.id = nextPlayerId++;
        this.x = x; this.y = y; this.radius = PLAYER_SIZE / 2;
        this.classData = classData; this.hp = classData.hp; this.maxHp = classData.hp;
        this.speedMultiplier = classData.speedMultiplier; this.recalculateSpeeds();
        this.angle = 0; this.isMoving = false; this.isRunning = false;

        // --- CHANGE: Added velocity for knockback physics ---
        this.vx = 0;
        this.vy = 0;

        const baseWeaponData = weapons.find(w => w.id === classData.weaponId);
        this.currentWeapon = JSON.parse(JSON.stringify(baseWeaponData));

        this.ammo = this.currentWeapon.magSize; this.reloading = false; this.reloadTimer = 0; this.fireTimer = 0;
        this.spread = this.currentWeapon.spreadStand;

        this.abilityType = classData.ability.type;
        this.abilityCooldown = classData.ability.cooldown || 0;
        this.abilityUsesTotal = classData.ability.uses !== undefined ? classData.ability.uses : Infinity;
        this.abilityUsesLeft = this.abilityUsesTotal;
        this.abilityDuration = classData.ability.duration || 0;

        this.isDashing = false; this.dashTimer = 0; this.active = true; this.lastAfterimageTime = 0;
        this.isBrawler = (this.classData.id === CLASS_ID.BRAWLER);

        this.abilityCharges = this.isBrawler ? BRAWLER_DASH_CHARGES : this.abilityUsesLeft;
        this.abilityMaxCharges = this.isBrawler ? BRAWLER_DASH_CHARGES : this.abilityUsesTotal;
        this.abilityRechargeTime = this.isBrawler ? BRAWLER_DASH_RECHARGE_TIME : 0;
        this.abilityRechargeTimer = 0;
        this.abilityCooldownTimer = this.isBrawler ? 0 : (classData.ability.cooldown || 0);
        this.attackedThisClick = false;
    }

    recalculateSpeeds() {
        this.speedWalk = BASE_PLAYER_SPEED_WALK * this.speedMultiplier;
        this.speedRun = BASE_PLAYER_SPEED_RUN * this.speedMultiplier;
    }

    // --- CHANGE: takeDamage now applies an impulse (instant velocity change) for knockback ---
    takeDamage(amount, knockbackInfo = null) {
        if (!this.active) return;
        this.hp -= amount;

        if (knockbackInfo && knockbackInfo.angle != null && knockbackInfo.force > 0) {
            this.vx += Math.cos(knockbackInfo.angle) * knockbackInfo.force;
            this.vy += Math.sin(knockbackInfo.angle) * knockbackInfo.force;
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.active = false;
            console.log("Player has been defeated!");
        }
    }

    update(dt) {
        if (!this.active) return;
        
        if (this.abilityCooldownTimer > 0 && !this.isBrawler) { this.abilityCooldownTimer -= dt * 1000; }
        if (this.isBrawler && this.abilityCharges < this.abilityMaxCharges) {
            this.abilityRechargeTimer -= dt * 1000;
            if (this.abilityRechargeTimer <= 0) {
                this.abilityCharges++;
                this.abilityUsesLeft = this.abilityCharges;
                if (this.abilityCharges < this.abilityMaxCharges) this.abilityRechargeTimer = this.abilityRechargeTime;
            }
        }
        
        if (this.isDashing) {
            this.dashTimer -= dt * 1000;
            if (performance.now() - this.lastAfterimageTime > PLAYER_DASH_AFTERIMAGE_INTERVAL) {
                afterimages.push(new Afterimage(this.x, this.y, this.angle, this.radius, this.classData.color));
                this.lastAfterimageTime = performance.now();
            }
            if (this.dashTimer <= 0) this.isDashing = false;
        }

        // --- CHANGE: Player movement is now a combination of input and knockback velocity ---
        this.isRunning = input.shift && !this.isDashing;
        const baseSpeed = this.isDashing ? this.speedRun * PLAYER_DASH_SPEED_FACTOR * BRAWLER_DASH_SPEED_FACTOR_MOD : (this.isRunning ? this.speedRun : this.speedWalk);
        let moveX = 0, moveY = 0;
        if (input.w) moveY -= 1; if (input.s) moveY += 1; if (input.a) moveX -= 1; if (input.d) moveX += 1;
        this.isMoving = (moveX !== 0 || moveY !== 0);
        this.spread = this.isMoving ? (this.isRunning ? this.currentWeapon.spreadRun : this.currentWeapon.spreadWalk) : this.currentWeapon.spreadStand;
        
        const moveMag = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveMag > 0) { moveX /= moveMag; moveY /= moveMag; }

        const finalMoveX = (moveX * baseSpeed * dt) + (this.vx * dt);
        const finalMoveY = (moveY * baseSpeed * dt) + (this.vy * dt);

        this.vx -= this.vx * PLAYER_KNOCKBACK_DAMPING * dt;
        this.vy -= this.vy * PLAYER_KNOCKBACK_DAMPING * dt;

        let nextX = this.x + finalMoveX;
        let nextY = this.y + finalMoveY;
        
        if (checkWallCollision(nextX, this.y, this.radius)) { nextX = this.x; this.vx *= -0.5; }
        if (checkWallCollision(this.x, nextY, this.radius)) { nextY = this.y; this.vy *= -0.5; }
        this.x = nextX; this.y = nextY;

        const mouseGameX = input.mouseX + camera.x;
        const mouseGameY = input.mouseY + camera.y;
        this.angle = Math.atan2(mouseGameY - this.y, mouseGameX - this.x);

        if (this.reloading) {
            this.reloadTimer += dt * 1000;
            if (this.reloadTimer >= this.currentWeapon.reloadTime) { this.reloading = false; this.ammo = this.currentWeapon.magSize; }
        } else {
            if (input.r && this.ammo < this.currentWeapon.magSize) this.startReload();
            if (this.ammo <= 0) this.startReload();
        }

        if (this.fireTimer > 0) this.fireTimer -= dt * 1000;
        if (input.mouseDown && !this.reloading && this.ammo > 0 && this.fireTimer <= 0) {
            this.shootProjectile(); this.fireTimer = 60000 / this.currentWeapon.rpm;
            this.ammo--;
        }
    }
    
    draw(ctx, ox, oy) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x - ox, this.y - oy); ctx.rotate(this.angle);
        ctx.fillStyle = this.classData.color || 'blue';
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.fillRect(this.radius * 0.5, -2, GUN_BARREL_OFFSET, 4);
        ctx.restore();
        if (this.reloading) {
            ctx.fillStyle = 'yellow'; ctx.font = `14px ${DEFAULT_FONT_FAMILY}`;
            ctx.textAlign = 'center'; ctx.fillText("RELOADING...", this.x - ox, this.y - oy - this.radius - 15);
            ctx.textAlign = 'left';
        }
    }
}