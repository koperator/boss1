// --- boss.js ---

// --- REFACTOR: Centralized Boss Constants ---
// All magic numbers and stats have been moved here for easy tweaking and better readability.
const BossConstants = {
    DMG_MULT: 1.07,
    HP: 4700,
    RADIUS: TILE_SIZE * 1.1,
    MAX_SPEED: 2325,
    ACCELERATION: 1490,
    DAMPING: 3.6,
    DAMPING_HARD: 7.0,
    ROTATION_SPEED_BASE: 8.79,
    CONTACT_COOLDOWN: 200,

    LUNGE_SPEED: 2890,
    LUNGE_DURATION: 780,
    LUNGE_COOLDOWN: 6400,
    LUNGE_TELEGRAPH: 400,
    LUNGE_RANGE_MIN: 400,
    LUNGE_RANGE_MAX: 1890,
    LUNGE_VISUAL_ANGLE: (Math.PI / 12) / 2.5,
    LUNGE_AFTERIMAGE_INTERVAL: 40,
    LUNGE_COLOR: 'rgba(255, 70, 70, 0.7)',

    POUNCE_IMPULSE: 2270,
    POUNCE_DURATION: 595,
    POUNCE_WIND_DOWN: 190,
    POUNCE_KNOCKBACK: 390,
    POUNCE_RANGE_MIN: 240,
    POUNCE_RANGE_MAX: 420,
    POUNCE_COOLDOWN: 4700,
    POUNCE_TELEGRAPH: 250,

    KITING_MAX_SPEED: 370,
    KITING_ACCELERATION: 490,
    KITING_DISTANCE_MIN: 470,
    KITING_DISTANCE_MAX: 985,
    KITING_DURATION: 5300,
    KITING_MODE_COOLDOWN: 14000,
    RANGED_ATTACK_SPEED: 990,
    RANGED_ATTACK_KNOCKBACK: 310,
    RANGED_ATTACK_COOLDOWN: 1600,
    RANGED_ATTACK_RADIUS: 12,
    RANGED_COLOR: 'purple',

    COMBO_TELEGRAPH: 200,
    COMBO_COOLDOWN: 2700,
    COMBO_RANGE: (TILE_SIZE * 1.1) + 130,
    COMBO_HIT_SPACING: 470,
    COMBO_KNOCKBACK: 230,
    COMBO_LUNGE_DIST: 80,
    COMBO_LUNGE_DURATION: 210,
    COMBO_ANGLE_WIDTH: Math.PI / 3,

    BLADE_DANCE_TELEGRAPH: 220,
    BLADE_DANCE_COOLDOWN: 4600,
    BLADE_DANCE_RANGE: (TILE_SIZE * 1.1) + 95,
    BLADE_DANCE_HIT_SPACING: 250,
    BLADE_DANCE_KNOCKBACK: 100,
    BLADE_DANCE_LUNGE_DIST: 45,
    BLADE_DANCE_LUNGE_DURATION: 100,

    SPIN_TELEGRAPH: 200,
    SPIN_COOLDOWN: 3500,
    SPIN_DURATION: 300,

    SPIN_DOUBLE_TELEGRAPH: 250,
    SPIN_DOUBLE_COOLDOWN: 10000,
    SPIN_DOUBLE_DELAY: 100,

    SLASH_LUNGE_TELEGRAPH: 180,
    SLASH_LUNGE_COOLDOWN: 2600,
    SLASH_LUNGE_RANGE: (TILE_SIZE * 1.1) + 150,
    SLASH_LUNGE_KNOCKBACK: 280,
    SLASH_LUNGE_DIST: 130,
    SLASH_LUNGE_DURATION: 240,
    SLASH_LUNGE_WIND_DOWN: 90,

    SHOT_LEAP_TELEGRAPH: 180,
    SHOT_LEAP_COOLDOWN: 4300,
    SHOT_LEAP_DURATION: 410,
    SHOT_LEAP_IMPULSE: 1350,
    SHOT_LEAP_RANGE_MIN: 180,
    SHOT_LEAP_RANGE_MAX: 480,
    SHOT_LEAP_COLOR: '#FF00FF',

    DOUBLE_SHOT_TELEGRAPH: 240,
    DOUBLE_SHOT_COOLDOWN: 6300,
    DOUBLE_SHOT_DELAY: 250,
    DOUBLE_SHOT_DURATION: 400,
    DOUBLE_SHOT_RANGE_MIN: 640,
    DOUBLE_SHOT_RANGE_MAX: 1250,
    DOUBLE_SHOT_COLOR: '#AA00FF',

    SIDESTEP_CHARGES: 6,
    SIDESTEP_CHARGE_RECHARGE_TIME: 2400,
    SIDESTEP_CHAIN_COOLDOWN: 280,
    SIDESTEP_TELEGRAPH: 125,
    SIDESTEP_DURATION: 325,
    SIDESTEP_IMPULSE: 1190,
    SIDESTEP_RANGE_MAX: 840,

    CHASE_BURST_DURATION: 1500,
    CHASE_PAUSE_DURATION: 190,
    WALK_SPEED: 379,
    MOVE_SPEED: 589,
    CHARGE_SPEED: 797,
};

// --- BossProjectile Class ---
class BossProjectile {
    constructor(x, y, angle, radius, speed, damage, knockback, color = 'purple') {
        this.x = x; this.y = y; this.radius = radius; this.angle = angle; this.speed = speed; this.damage = damage; this.knockback = knockback; this.color = color;
        this.vx = Math.cos(this.angle) * this.speed; this.vy = Math.sin(this.angle) * this.speed; this.lifespan = 3.0; this.active = true;
    }
    update(dt, player) {
        if (!this.active) return; this.lifespan -= dt; if (this.lifespan <= 0) { this.active = false; return; } this.x += this.vx * dt; this.y += this.vy * dt;
        if (isWall(Math.floor(this.x / TILE_SIZE), Math.floor(this.y / TILE_SIZE))) { this.active = false; return; }
        if (player && player.active) {
            const distSq = (this.x - player.x)**2 + (this.y - player.y)**2;
            if (distSq < (this.radius + player.radius)**2) { player.takeDamage(this.damage, { angle: this.angle, force: this.knockback }); this.active = false; }
        }
    }
    draw(ctx, ox, oy) {
        if (!this.active) return; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x - ox, this.y - oy, this.radius, 0, Math.PI * 2); ctx.fill();
    }
}

class Boss {
    constructor(x, y) {
        const C = BossConstants;
        const DMG_MULT = C.DMG_MULT;

        this.HP = C.HP; this.RADIUS = C.RADIUS;
        this.MAX_SPEED = C.MAX_SPEED; this.ACCELERATION = C.ACCELERATION;
        this.DAMPING = C.DAMPING; this.DAMPING_HARD = C.DAMPING_HARD;
        this.ROTATION_SPEED_BASE = C.ROTATION_SPEED_BASE;
        this.CONTACT_DAMAGE = Math.round(5 * DMG_MULT); this.CONTACT_COOLDOWN = C.CONTACT_COOLDOWN;
        this.LUNGE_SPEED = C.LUNGE_SPEED; this.LUNGE_DAMAGE = Math.round(35 * DMG_MULT); this.LUNGE_DURATION = C.LUNGE_DURATION; this.LUNGE_COOLDOWN = C.LUNGE_COOLDOWN; this.LUNGE_TELEGRAPH = C.LUNGE_TELEGRAPH; this.LUNGE_RANGE_MIN = C.LUNGE_RANGE_MIN; this.LUNGE_RANGE_MAX = C.LUNGE_RANGE_MAX; this.LUNGE_VISUAL_ANGLE = C.LUNGE_VISUAL_ANGLE;
        this.POUNCE_IMPULSE = C.POUNCE_IMPULSE; this.POUNCE_DURATION = C.POUNCE_DURATION; this.POUNCE_WIND_DOWN = C.POUNCE_WIND_DOWN; this.POUNCE_DAMAGE = Math.round(21 * DMG_MULT); this.POUNCE_KNOCKBACK = C.POUNCE_KNOCKBACK; this.POUNCE_AOE_RADIUS = this.RADIUS * 3; this.POUNCE_RANGE_MIN = C.POUNCE_RANGE_MIN; this.POUNCE_RANGE_MAX = C.POUNCE_RANGE_MAX; this.POUNCE_COOLDOWN = C.POUNCE_COOLDOWN; this.POUNCE_TELEGRAPH = C.POUNCE_TELEGRAPH;
        this.KITING_MAX_SPEED = C.KITING_MAX_SPEED; this.KITING_ACCELERATION = C.KITING_ACCELERATION; this.KITING_DISTANCE_MIN = C.KITING_DISTANCE_MIN; this.KITING_DISTANCE_MAX = C.KITING_DISTANCE_MAX; this.KITING_DURATION = C.KITING_DURATION; this.KITING_MODE_COOLDOWN = C.KITING_MODE_COOLDOWN; this.RANGED_ATTACK_SPEED = C.RANGED_ATTACK_SPEED; this.RANGED_ATTACK_DAMAGE = Math.round(28 * DMG_MULT); this.RANGED_ATTACK_KNOCKBACK = C.RANGED_ATTACK_KNOCKBACK; this.RANGED_ATTACK_COOLDOWN = C.RANGED_ATTACK_COOLDOWN; this.RANGED_ATTACK_RADIUS = C.RANGED_ATTACK_RADIUS; this.RANGED_COLOR = C.RANGED_COLOR;
        this.COMBO_TELEGRAPH = C.COMBO_TELEGRAPH; this.COMBO_COOLDOWN = C.COMBO_COOLDOWN; this.COMBO_DAMAGE = Math.round(11 * DMG_MULT); this.COMBO_RANGE = C.COMBO_RANGE; this.COMBO_HIT_SPACING = C.COMBO_HIT_SPACING; this.COMBO_KNOCKBACK = C.COMBO_KNOCKBACK; this.COMBO_LUNGE_DIST = C.COMBO_LUNGE_DIST; this.COMBO_LUNGE_DURATION = C.COMBO_LUNGE_DURATION; this.COMBO_ANGLE_WIDTH = C.COMBO_ANGLE_WIDTH;
        this.BLADE_DANCE_TELEGRAPH = C.BLADE_DANCE_TELEGRAPH; this.BLADE_DANCE_COOLDOWN = C.BLADE_DANCE_COOLDOWN; this.BLADE_DANCE_DAMAGE = Math.round(6 * DMG_MULT); this.BLADE_DANCE_RANGE = C.BLADE_DANCE_RANGE; this.BLADE_DANCE_HIT_SPACING = C.BLADE_DANCE_HIT_SPACING; this.BLADE_DANCE_KNOCKBACK = C.BLADE_DANCE_KNOCKBACK; this.BLADE_DANCE_LUNGE_DIST = C.BLADE_DANCE_LUNGE_DIST; this.BLADE_DANCE_LUNGE_DURATION = C.BLADE_DANCE_LUNGE_DURATION;
        this.SPIN_TELEGRAPH = C.SPIN_TELEGRAPH; this.SPIN_COOLDOWN = C.SPIN_COOLDOWN; this.SPIN_DAMAGE = Math.round(18 * DMG_MULT); this.SPIN_RADIUS = this.RADIUS * 3.5; this.SPIN_DURATION = C.SPIN_DURATION;
        this.SPIN_DOUBLE_TELEGRAPH = C.SPIN_DOUBLE_TELEGRAPH; this.SPIN_DOUBLE_COOLDOWN = C.SPIN_DOUBLE_COOLDOWN; this.SPIN_DOUBLE_DELAY = C.SPIN_DOUBLE_DELAY;
        this.SLASH_LUNGE_TELEGRAPH = C.SLASH_LUNGE_TELEGRAPH; this.SLASH_LUNGE_COOLDOWN = C.SLASH_LUNGE_COOLDOWN; this.SLASH_LUNGE_DAMAGE = Math.round(20 * DMG_MULT); this.SLASH_LUNGE_RANGE = C.SLASH_LUNGE_RANGE; this.SLASH_LUNGE_KNOCKBACK = C.SLASH_LUNGE_KNOCKBACK; this.SLASH_LUNGE_DIST = C.SLASH_LUNGE_DIST; this.SLASH_LUNGE_DURATION = C.SLASH_LUNGE_DURATION; this.SLASH_LUNGE_WIND_DOWN = C.SLASH_LUNGE_WIND_DOWN;
        this.SHOT_LEAP_TELEGRAPH = C.SHOT_LEAP_TELEGRAPH; this.SHOT_LEAP_COOLDOWN = C.SHOT_LEAP_COOLDOWN; this.SHOT_LEAP_DURATION = C.SHOT_LEAP_DURATION; this.SHOT_LEAP_IMPULSE = C.SHOT_LEAP_IMPULSE; this.SHOT_LEAP_RANGE_MIN = C.SHOT_LEAP_RANGE_MIN; this.SHOT_LEAP_RANGE_MAX = C.SHOT_LEAP_RANGE_MAX; this.SHOT_LEAP_COLOR = C.SHOT_LEAP_COLOR;
        this.DOUBLE_SHOT_TELEGRAPH = C.DOUBLE_SHOT_TELEGRAPH; this.DOUBLE_SHOT_COOLDOWN = C.DOUBLE_SHOT_COOLDOWN; this.DOUBLE_SHOT_DELAY = C.DOUBLE_SHOT_DELAY; this.DOUBLE_SHOT_DURATION = C.DOUBLE_SHOT_DURATION; this.DOUBLE_SHOT_RANGE_MIN = C.DOUBLE_SHOT_RANGE_MIN; this.DOUBLE_SHOT_RANGE_MAX = C.DOUBLE_SHOT_RANGE_MAX; this.DOUBLE_SHOT_COLOR = C.DOUBLE_SHOT_COLOR;
        this.SIDESTEP_CHARGES = C.SIDESTEP_CHARGES; this.SIDESTEP_CHARGE_RECHARGE_TIME = C.SIDESTEP_CHARGE_RECHARGE_TIME; this.SIDESTEP_CHAIN_COOLDOWN = C.SIDESTEP_CHAIN_COOLDOWN; this.SIDESTEP_TELEGRAPH = C.SIDESTEP_TELEGRAPH; this.SIDESTEP_DURATION = C.SIDESTEP_DURATION; this.SIDESTEP_IMPULSE = C.SIDESTEP_IMPULSE; this.SIDESTEP_RANGE_MAX = C.SIDESTEP_RANGE_MAX;
        this.CHASE_BURST_DURATION = C.CHASE_BURST_DURATION; this.CHASE_PAUSE_DURATION = C.CHASE_PAUSE_DURATION; this.WALK_SPEED = C.WALK_SPEED; this.MOVE_SPEED = C.MOVE_SPEED; this.CHARGE_SPEED = C.CHARGE_SPEED;
        
        this.x = x; this.y = y; this.radius = this.RADIUS; this.hp = this.HP; this.maxHp = this.HP; this.active = true;
        this.vx = 0; this.vy = 0; this.angle = 0; this.targetAngle = 0;
        this.telegraphText = ''; this.telegraphTextTimer = 0;
        this.attackState = {}; this.idleTimer = 0; this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
        this.cooldowns = { combo: 0, bladeDance: 0, spin: 0, spinDouble: 0, contact: 0, ranged: 0, lunge: 0, pounce: 0, kitingMode: 0, slashLunge: 0, shotLeap: 0, doubleShot: 0, sidestep: 0 };
        this.moveState = { timer: 0, moveVec: { x: 0, y: 0 }, currentMaxSpeed: this.MAX_SPEED, currentAccel: this.ACCELERATION, currentDamping: this.DAMPING};
        
        this.sidestepCharges = this.SIDESTEP_CHARGES; this.sidestepRechargeTimer = 0;
        this._initFSM();
    }

    _fireProjectile(color = this.RANGED_COLOR) {
         bossProjectiles.push(new BossProjectile(this.x + Math.cos(this.angle)*this.radius, this.y + Math.sin(this.angle)*this.radius, this.angle, this.RANGED_ATTACK_RADIUS, this.RANGED_ATTACK_SPEED, this.RANGED_ATTACK_DAMAGE, this.RANGED_ATTACK_KNOCKBACK, color));
    }

    _checkMeleeHit(player, range, angle, angleWidth, damage, knockbackForce ) {
         if (!player || !player.active) return;
         const currentDist = Math.sqrt((this.x - player.x)**2 + (this.y - player.y)**2);
         const playerAngle = Math.atan2(player.y - this.y, player.x - this.x);
         let angleDiff = Math.abs(angle - playerAngle);
          if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;                
         if (currentDist < range + player.radius && angleDiff < angleWidth / 2) {
             player.takeDamage(damage, { angle: angle, force: knockbackForce });
         }
    }

    _initFSM() {
        const boss = this;
        StateMachine.apply(this, {
            init: 'idle',
            transitions: [
                { name: 'chase', from: 'idle', to: 'chasing' }, { name: 'startKiting', from: ['idle', 'chasing'], to: 'kiting' },
                { name: 'prepCombo', from: ['idle', 'chasing'], to: 'comboPrep' }, { name: 'prepBladeDance', from: ['idle', 'chasing'], to: 'bladeDancePrep' },
                { name: 'prepSpin', from: ['idle', 'chasing'], to: 'spinPrep' }, { name: 'prepSpinDouble', from: ['idle', 'chasing'], to: 'spinDoublePrep' },
                { name: 'prepLunge', from: ['idle', 'chasing'], to: 'lungePrep' }, { name: 'prepPounce', from: ['idle', 'chasing'], to: 'pouncePrep' },
                { name: 'prepSlashLunge', from: ['idle', 'chasing'], to: 'slashLungePrep' }, { name: 'prepShotLeap', from: ['idle', 'chasing'], to: 'shotLeapPrep' },
                { name: 'prepDoubleShot', from: ['idle', 'chasing'], to: 'doubleShotPrep' }, { name: 'prepSidestep', from: ['idle', 'chasing'], to: 'sidestepPrep' },
                { name: 'doCombo', from: 'comboPrep', to: 'combo' }, { name: 'doBladeDance', from: 'bladeDancePrep', to: 'bladeDance' },
                { name: 'doSpin', from: 'spinPrep', to: 'spin' }, { name: 'doSpinDouble', from: 'spinDoublePrep', to: 'spinDouble' },
                { name: 'doLunge', from: 'lungePrep', to: 'lunge' }, { name: 'doPounce', from: 'pouncePrep', to: 'pounce' },
                { name: 'doSlashLunge', from: 'slashLungePrep', to: 'slashLunge' }, { name: 'doShotLeap', from: 'shotLeapPrep', to: 'shotLeap' },
                { name: 'doDoubleShot', from: 'doubleShotPrep', to: 'doubleShot' }, { name: 'doSidestep', from: 'sidestepPrep', to: 'sidestep' },
                { name: 'finishAction', from: [
                    'idle', 'chasing', 'kiting', 'combo', 'bladeDance', 'spin', 'spinDouble', 'lunge', 'pounce', 'slashLunge', 'shotLeap', 'doubleShot', 'sidestep'
                ], to: 'idle' },
                { name: 'die', from: '*', to: 'dead' }
            ],
            methods: {
                onEnterIdle: () => { boss.idleTimer = 150 + (Math.random() * 250); boss.telegraphText = ''; boss.attackState = {}; },
                onEnterKiting: () => { boss.attackState = { timer: boss.KITING_DURATION }; boss.cooldowns.kitingMode = boss.KITING_MODE_COOLDOWN; boss.strafeDirection *= -1; },
                onChase: () => { boss.moveState.timer = boss.CHASE_BURST_DURATION + boss.CHASE_PAUSE_DURATION; boss.telegraphText = ''; },
                onPrepCombo: () => boss._startTelegraph("Combo!", boss.COMBO_TELEGRAPH, 'doCombo'),
                onPrepBladeDance: () => boss._startTelegraph("Blade Dance!", boss.BLADE_DANCE_TELEGRAPH, 'doBladeDance'),
                onPrepSpin: () => boss._startTelegraph("Spin!", boss.SPIN_TELEGRAPH, 'doSpin'),
                onPrepSpinDouble: () => boss._startTelegraph("Double Spin!", boss.SPIN_DOUBLE_TELEGRAPH, 'doSpinDouble'),
                onPrepLunge: () => boss._startTelegraph("LUNGE!", boss.LUNGE_TELEGRAPH, 'doLunge'),
                onPrepPounce: (lifecycle, player) => {
                    boss._startTelegraph("Pounce!", boss.POUNCE_TELEGRAPH, 'doPounce');
                    const pounceDist = Math.sqrt((player.x - boss.x)**2 + (player.y - boss.y)**2);
                    boss.attackState.targetX = boss.x + Math.cos(boss.angle) * pounceDist; boss.attackState.targetY = boss.y + Math.sin(boss.angle) * pounceDist;
                },
                onPrepSlashLunge: () => boss._startTelegraph("Slash!", boss.SLASH_LUNGE_TELEGRAPH, 'doSlashLunge'),
                onPrepShotLeap: () => boss._startTelegraph("Leap Shot!", boss.SHOT_LEAP_TELEGRAPH, 'doShotLeap'),
                onPrepDoubleShot: () => boss._startTelegraph("Double Shot!", boss.DOUBLE_SHOT_TELEGRAPH, 'doDoubleShot'),
                onPrepSidestep: () => boss._startTelegraph("Sidestep", boss.SIDESTEP_TELEGRAPH, 'doSidestep'),
                onDoCombo: () => { boss.cooldowns.combo = boss.COMBO_COOLDOWN; boss.attackState = { type: 'combo', lockedAngle: boss.angle, hits: 0, maxHits: 2, hitTimer: 0, animProgress: 0, finishTimer: -1, hitCheckTimer: -1, spacing: boss.COMBO_HIT_SPACING, lungeDur: boss.COMBO_LUNGE_DURATION, lungeDist: boss.COMBO_LUNGE_DIST, damage: boss.COMBO_DAMAGE, knockback: boss.COMBO_KNOCKBACK, range: boss.COMBO_RANGE }; },
                onDoBladeDance: () => { boss.cooldowns.bladeDance = boss.BLADE_DANCE_COOLDOWN; boss.attackState = { type: 'bladeDance', lockedAngle: boss.angle, hits: 0, maxHits: 5, hitTimer: 0, animProgress: 0, finishTimer: -1, hitCheckTimer: -1, spacing: boss.BLADE_DANCE_HIT_SPACING, lungeDur: boss.BLADE_DANCE_LUNGE_DURATION, lungeDist: boss.BLADE_DANCE_LUNGE_DIST, damage: boss.BLADE_DANCE_DAMAGE, knockback: boss.BLADE_DANCE_KNOCKBACK, range: boss.BLADE_DANCE_RANGE }; },
                onDoSpin: () => { boss.cooldowns.spin = boss.SPIN_COOLDOWN; boss.attackState = { type: 'spin', timer: 0, duration: boss.SPIN_DURATION, hitPlayers: new Set(), spinsDone: 0, delayTimer: -1 }; },
                onDoSpinDouble: () => { boss.cooldowns.spinDouble = boss.SPIN_DOUBLE_COOLDOWN; boss.attackState = { type: 'spinDouble', timer: 0, duration: boss.SPIN_DURATION, hitPlayers: new Set(), spinsDone: 0, delayTimer: -1 }; },
                onDoLunge: () => { boss.cooldowns.lunge = boss.LUNGE_COOLDOWN; boss.vx = Math.cos(boss.angle) * boss.LUNGE_SPEED; boss.vy = Math.sin(boss.angle) * boss.LUNGE_SPEED; boss.attackState = { timer: boss.LUNGE_DURATION, hasHit: false, lockedAngle: boss.angle, lastAfterimageTime: 0 }; },
                onDoPounce: () => {
                    boss.cooldowns.pounce = boss.POUNCE_COOLDOWN; boss.vx += Math.cos(boss.angle) * boss.POUNCE_IMPULSE; boss.vy += Math.sin(boss.angle) * boss.POUNCE_IMPULSE;
                    boss.attackState = { phase: 'leaping', timer: boss.POUNCE_DURATION, lockedAngle: boss.angle, animProgress: 0, };
                },
                onDoSlashLunge: () => {
                    boss.cooldowns.slashLunge = boss.SLASH_LUNGE_COOLDOWN; boss.attackState = { type: 'slashLunge', lockedAngle: boss.angle, animProgress: 0, finishTimer: -1, hitCheckTimer: -1 };
                    new TWEEN.Tween(boss.attackState).to({ animProgress: 1 }, 250).start(); new TWEEN.Tween(boss).to({ x: boss.x + Math.cos(boss.attackState.lockedAngle) * boss.SLASH_LUNGE_DIST, y: boss.y + Math.sin(boss.attackState.lockedAngle) * boss.SLASH_LUNGE_DIST }, boss.SLASH_LUNGE_DURATION).start();
                    boss.attackState.hitCheckTimer = boss.SLASH_LUNGE_DURATION * 0.6; boss.attackState.finishTimer = boss.SLASH_LUNGE_DURATION + boss.SLASH_LUNGE_WIND_DOWN;
                },
                onDoShotLeap: () => {
                    boss.cooldowns.shotLeap = boss.SHOT_LEAP_COOLDOWN; boss._fireProjectile(boss.SHOT_LEAP_COLOR);
                    boss.vx -= Math.cos(boss.angle) * boss.SHOT_LEAP_IMPULSE; boss.vy -= Math.sin(boss.angle) * boss.SHOT_LEAP_IMPULSE;
                    boss.attackState = { timer: boss.SHOT_LEAP_DURATION, lastAfterimageTime: 0 }; boss.moveState.currentDamping = boss.DAMPING_HARD;
                },
                onDoDoubleShot: () => {
                    boss.cooldowns.doubleShot = boss.DOUBLE_SHOT_COOLDOWN; boss._fireProjectile(boss.DOUBLE_SHOT_COLOR);
                    boss.attackState = { timer: boss.DOUBLE_SHOT_DURATION, delayTimer: boss.DOUBLE_SHOT_DELAY, shotsFired: 1, muzzleFlashTimer: 100 };
                },
                onDoSidestep: () => {
                    boss.sidestepCharges--; boss.cooldowns.sidestep = boss.SIDESTEP_CHAIN_COOLDOWN;
                    if (boss.sidestepCharges < boss.SIDESTEP_CHARGES && boss.sidestepRechargeTimer <= 0) { boss.sidestepRechargeTimer = boss.SIDESTEP_CHARGE_RECHARGE_TIME; }
                    boss.strafeDirection *= -1; const sideAngle = boss.angle + (Math.PI / 2) * boss.strafeDirection;
                    boss.vx += Math.cos(sideAngle) * boss.SIDESTEP_IMPULSE; boss.vy += Math.sin(sideAngle) * boss.SIDESTEP_IMPULSE;
                    boss.attackState = { timer: boss.SIDESTEP_DURATION, lastAfterimageTime: 0 }; boss.moveState.currentDamping = boss.DAMPING_HARD;
                },
                onEnterDead: () => { boss.active = false; boss.telegraphText = "DEFEATED"; boss.vx = 0; boss.vy = 0; }
            }
        });
    }
    
    _startTelegraph(text, duration, nextTransition) {
        this.telegraphText = text; this.telegraphTextTimer = duration + 100;
        this.attackState = { telegraphTimer: duration, nextTransition: nextTransition, initialTelegraphDuration: duration };
    }
    
    _decideNextAction(player, distance) {
        if (!player || !player.active) return;
        if (this.state.endsWith('Prep') || this.attackState.timer > 0 || this.attackState.finishTimer > 0) return;
        const cd = this.cooldowns;
        const attackOptions = [
            { name: 'Sidestep', can: 'prepSidestep', condition: () => this.sidestepCharges > 0 && cd.sidestep <= 0 && distance < this.SIDESTEP_RANGE_MAX && Math.random() < 0.4 },
            { name: 'Kiting', can: 'startKiting', condition: () => cd.combo > 0 && cd.spin > 0 && cd.bladeDance > 0 && cd.spinDouble > 0 && cd.slashLunge > 0 && cd.kitingMode <= 0 && Math.random() < 0.35 },
            { name: 'Pounce', can: 'prepPounce', condition: () => cd.pounce <= 0 && distance > this.POUNCE_RANGE_MIN && distance < this.POUNCE_RANGE_MAX },
            { name: 'Lunge', can: 'prepLunge', condition: () => cd.lunge <= 0 && distance > this.LUNGE_RANGE_MIN && distance < this.LUNGE_RANGE_MAX },
            { name: 'DoubleShot', can: 'prepDoubleShot', condition: () => cd.doubleShot <= 0 && distance > this.DOUBLE_SHOT_RANGE_MIN && distance < this.DOUBLE_SHOT_RANGE_MAX && Math.random() < 0.5 },
            { name: 'ShotLeap', can: 'prepShotLeap', condition: () => cd.shotLeap <= 0 && distance > this.SHOT_LEAP_RANGE_MIN && distance < this.SHOT_LEAP_RANGE_MAX && Math.random() < 0.6 },
            { name: 'SpinDouble', can: 'prepSpinDouble', condition: () => cd.spinDouble <= 0 && distance < this.SPIN_RADIUS && Math.random() > 0.5 },
            { name: 'BladeDance', can: 'prepBladeDance', condition: () => cd.bladeDance <= 0 && distance < this.BLADE_DANCE_RANGE && Math.random() < 0.2 },
            { name: 'Combo', can: 'prepCombo', condition: () => cd.combo <= 0 && distance < this.COMBO_RANGE && Math.random() < 1.35 },
            { name: 'SlashLunge', can: 'prepSlashLunge', condition: () => cd.slashLunge <= 0 && distance < this.SLASH_LUNGE_RANGE && Math.random() < 1.35 },
            { name: 'Spin', can: 'prepSpin', condition: () => cd.spin <= 0 && distance < this.SPIN_RADIUS },
        ];
        const validAttacks = attackOptions.filter(opt => opt.condition() && this.can(opt.can));
        if (validAttacks.length > 0) {
            const choice = validAttacks[Math.floor(Math.random() * validAttacks.length)];
            this[choice.can](player); // All prep actions now accept player, even if unused.
        } else if (this.is('idle') && this.can('chase')) { this.chase(player); }
    }

    _updateRotation(dt, player) {
        if (!player || !player.active) return;
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const speedRatio = Math.min(1, currentSpeed / this.MAX_SPEED);
        const dynamicRotationSpeed = this.ROTATION_SPEED_BASE * (1 - speedRatio * 0.8);
        this.targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
        let angleDiff = this.targetAngle - this.angle;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        const maxRot = dynamicRotationSpeed * dt;
        this.angle += Math.max(-maxRot, Math.min(maxRot, angleDiff));
    }

    _updateMovement(dt) {
        this.vx += this.moveState.moveVec.x * this.moveState.currentAccel * dt;
        this.vy += this.moveState.moveVec.y * this.moveState.currentAccel * dt;
        
        this.vx -= this.vx * this.moveState.currentDamping * dt;
        this.vy -= this.vy * this.moveState.currentDamping * dt;

        // --- BUG FIX & FLUIDITY IMPROVEMENT ---
        // Impulse-based moves ("ballistic" states) should NOT be speed-capped.
        // This allows them to have their full impact and prevents the vx/0 NaN error.
        const ballisticStates = ['lunge', 'pounce', 'sidestep', 'shotLeap'];
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

        if (!ballisticStates.includes(this.state) && speed > this.moveState.currentMaxSpeed) {
            // This check is safe now because if speed is 0, the condition is false.
            this.vx = (this.vx / speed) * this.moveState.currentMaxSpeed;
            this.vy = (this.vy / speed) * this.moveState.currentMaxSpeed;
        }

        const tweenControlledStates = ['combo', 'bladeDance', 'slashLunge'];
        if (!tweenControlledStates.includes(this.state)) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
    }
    
    _updateIdle(dt, player) {
        this.idleTimer -= dt * 1000;
        if (this.idleTimer <= 0 && player && player.active) {
            const distanceToPlayer = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2);
            this._decideNextAction(player, distanceToPlayer);
        }
    }
    
    _updatePrepState(dt, player) {
        if (!player || !player.active) { if (this.can('finishAction')) this.finishAction(); return; }
        this.moveState.moveVec.x = 0; this.moveState.moveVec.y = 0; this.moveState.currentDamping = this.DAMPING_HARD;
        this.attackState.telegraphTimer -= dt * 1000;
        if (this.attackState.telegraphTimer <= 0) {
            this.telegraphTextTimer = 100;
            const nextAction = this.attackState.nextTransition;
            if (this.can(nextAction)) this[nextAction](player); 
            else if (this.can('finishAction')) this.finishAction();
        }
    }

    _updateChasing(dt, player) {
        if (!player || !player.active) { if (this.can('finishAction')) this.finishAction(); return; }
        this.moveState.timer -= dt * 1000;
        if (this.moveState.timer <= 0) { if (this.can('finishAction')) this.finishAction(); return; }
        if (this.moveState.timer > this.CHASE_PAUSE_DURATION) {
            const distance = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2);
            if (distance > 350) this.moveState.currentMaxSpeed = this.CHARGE_SPEED;
            else if (distance > 150) this.moveState.currentMaxSpeed = this.MOVE_SPEED;
            else this.moveState.currentMaxSpeed = this.WALK_SPEED;
            this.moveState.moveVec.x = Math.cos(this.angle); this.moveState.moveVec.y = Math.sin(this.angle);
        } else {
            this.telegraphText = '...'; this.moveState.moveVec.x = 0; this.moveState.moveVec.y = 0; this.moveState.currentDamping = this.DAMPING_HARD;
            const distanceToPlayer = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2);
            this._decideNextAction(player, distanceToPlayer);
        }
    }

    _updateKiting(dt, player) {
        if (!player || !player.active) { if (this.can('finishAction')) this.finishAction(); return; }
        this.attackState.timer -= dt * 1000;
        if (this.attackState.timer <= 0) { if (this.can('finishAction')) this.finishAction(); return; }
        this.telegraphText = "Repositioning..."; this.moveState.currentAccel = this.KITING_ACCELERATION; this.moveState.currentMaxSpeed = this.KITING_MAX_SPEED;
        const dirX = Math.cos(this.targetAngle), dirY = Math.sin(this.targetAngle);
        const distance = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2);
        let moveX = 0, moveY = 0;
        if (distance < this.KITING_DISTANCE_MIN) { moveX = -dirX; moveY = -dirY; } 
        else if (distance > this.KITING_DISTANCE_MAX) { moveX = dirX; moveY = dirY; }
        const strafeX = -dirY * this.strafeDirection, strafeY = dirX * this.strafeDirection;
        moveX += strafeX * 0.7; moveY += strafeY * 0.7;
        const mag = Math.sqrt(moveX*moveX + moveY*moveY);
        this.moveState.moveVec = (mag > 0) ? { x: moveX / mag, y: moveY / mag } : {x:0, y:0};
        if (this.cooldowns.ranged <= 0) { this._fireProjectile(); this.cooldowns.ranged = this.RANGED_ATTACK_COOLDOWN; }
    }
    
    _updateLunge(dt, player) {
        this.attackState.timer -= dt * 1000; this.attackState.lastAfterimageTime -= dt * 1000;
        if (this.attackState.lastAfterimageTime <= 0) {
            afterimages.push(new Afterimage(this.x, this.y, this.angle, this.radius, BossConstants.LUNGE_COLOR));
            this.attackState.lastAfterimageTime = BossConstants.LUNGE_AFTERIMAGE_INTERVAL;
        }
        if (this.attackState.timer <= 0) { if (this.can('finishAction')) this.finishAction(); return; }
        if (player && player.active && !this.attackState.hasHit) {
            const distanceToPlayer = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2);
            if (distanceToPlayer < this.radius + player.radius + 20) {
                player.takeDamage(this.LUNGE_DAMAGE, {angle: this.angle, force: this.POUNCE_KNOCKBACK * 0.8});
                this.attackState.hasHit = true;
            }
        }
    }

    _updatePounce(dt, player) {
        const state = this.attackState;
        if (!state.phase) { if (this.can('finishAction')) this.finishAction(); return; }
        state.timer -= dt * 1000;

        if (state.phase === 'leaping' && state.timer <= 0) {
            // --- FLUIDITY IMPROVEMENT: "Hard Landing" ---
            // Instead of setting vx/vy to 0, use heavy damping for a natural-feeling skid to a stop.
            this.moveState.currentDamping = this.DAMPING_HARD;
            
            new TWEEN.Tween(state).to({ animProgress: 1 }, this.POUNCE_WIND_DOWN).start();
            if (player && player.active) {
                const distance = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2);
                if (distance < this.POUNCE_AOE_RADIUS) { 
                    const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                    player.takeDamage(this.POUNCE_DAMAGE, { angle: angleToPlayer, force: this.POUNCE_KNOCKBACK });
                }
            }
            state.phase = 'recovering';
            state.timer = this.POUNCE_WIND_DOWN;
        } 
        else if (state.phase === 'recovering' && state.timer <= 0) {
            if (this.can('finishAction')) this.finishAction();
        }
    }
    
    _updateAnyCombo(dt, player) {
        this.vx = 0; this.vy = 0; const state = this.attackState;
        if (state.finishTimer > 0) { state.finishTimer -= dt * 1000; if (state.finishTimer <= 0) if (this.can('finishAction')) this.finishAction(); return; }
        state.hitTimer -= dt * 1000;
        if (state.hitTimer <= 0 && state.hits < state.maxHits) {
            state.hits++; state.hitTimer = state.spacing; state.animProgress = 0;
            new TWEEN.Tween(state).to({ animProgress: 1 }, state.lungeDur * 1.5 ).start();
            new TWEEN.Tween(this).to({ x: this.x + Math.cos(state.lockedAngle) * state.lungeDist, y: this.y + Math.sin(state.lockedAngle) * state.lungeDist }, state.lungeDur).start();
            state.hitCheckTimer = state.lungeDur * 0.6;
        }
        if (state.hitCheckTimer > 0) {
            state.hitCheckTimer -= dt * 1000;
            if (state.hitCheckTimer <= 0) { this._checkMeleeHit(player, state.range, state.lockedAngle, this.COMBO_ANGLE_WIDTH, state.damage, state.knockback); state.hitCheckTimer = -1; }
        }
        if (state.hits >= state.maxHits && state.finishTimer < 0 && state.hitCheckTimer <=0) { state.finishTimer = state.lungeDur; }
    }
    
    _updateSlashLunge(dt, player) {
       this.vx = 0; this.vy = 0; const state = this.attackState;
        if (state.hitCheckTimer > 0) {
            state.hitCheckTimer -= dt * 1000;
            if (state.hitCheckTimer <= 0) { this._checkMeleeHit(player, this.SLASH_LUNGE_RANGE, state.lockedAngle, this.COMBO_ANGLE_WIDTH, this.SLASH_LUNGE_DAMAGE, this.SLASH_LUNGE_KNOCKBACK); state.hitCheckTimer = -1; }
        }
        if (state.finishTimer > 0) { state.finishTimer -= dt * 1000; if (state.finishTimer <= 0) if (this.can('finishAction')) this.finishAction(); }
     }

    _updateAnySpin(dt, player) {
        const state = this.attackState;
        if (state.delayTimer > 0) { state.delayTimer -= dt * 1000; return; }
        state.timer += dt * 1000;
        const progress = Math.min(1, state.timer / state.duration);
        const currentSpinRadius = this.SPIN_RADIUS * TWEEN.Easing.Quadratic.Out(progress);
        if (player && player.active) {
            const distanceToPlayer = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2);
            if (distanceToPlayer < currentSpinRadius + player.radius && !state.hitPlayers.has(player.id)) {
                const angleToPlayer = Math.atan2(player.y-this.y, player.x-this.x);
                player.takeDamage(this.SPIN_DAMAGE, {angle: angleToPlayer, force: this.COMBO_KNOCKBACK * 0.8});
                state.hitPlayers.add(player.id);
            }
        }
        if (state.timer >= state.duration) {
            state.spinsDone++;
            if (state.type === 'spinDouble' && state.spinsDone === 1) { state.timer = 0; state.hitPlayers = new Set(); state.delayTimer = this.SPIN_DOUBLE_DELAY; }
            else { if (this.can('finishAction')) this.finishAction(); }
        }
    }
    
     _updateShotLeap(dt, player) {
        this.attackState.timer -= dt * 1000; this.attackState.lastAfterimageTime -= dt * 1000;
        if (this.attackState.lastAfterimageTime <= 0) { afterimages.push(new Afterimage(this.x, this.y, this.angle, this.radius, this.SHOT_LEAP_COLOR)); this.attackState.lastAfterimageTime = 40; }
        if (this.attackState.timer <= 0) if (this.can('finishAction')) this.finishAction();
     }

    _updateDoubleShot(dt, player) {
        const state = this.attackState;
        this.moveState.currentDamping = this.DAMPING_HARD; if(state.muzzleFlashTimer > 0) state.muzzleFlashTimer -= dt * 1000;
        state.timer -= dt * 1000; state.delayTimer -= dt * 1000;
        if (state.delayTimer <= 0 && state.shotsFired < 2) { this._fireProjectile(this.DOUBLE_SHOT_COLOR); state.shotsFired++; state.muzzleFlashTimer = 100; }
        if(state.timer <=0) if (this.can('finishAction')) this.finishAction();
    }
      
    _updateSidestep(dt, player) {
        this.attackState.timer -= dt * 1000; this.attackState.lastAfterimageTime -= dt * 1000;
        if (this.attackState.lastAfterimageTime <= 0) { afterimages.push(new Afterimage(this.x, this.y, this.angle, this.radius, 'yellow')); this.attackState.lastAfterimageTime = 40; }
        if (this.attackState.timer <= 0) if (this.can('finishAction')) this.finishAction();
    }

    update(dt, player) {
        if (!this.active || this.is('dead')) return;

        if (this.telegraphTextTimer > 0) { this.telegraphTextTimer -= dt * 1000; if (this.telegraphTextTimer <= 0) this.telegraphText = ''; }

        if (this.sidestepCharges < this.SIDESTEP_CHARGES) {
            this.sidestepRechargeTimer -= dt * 1000;
            if(this.sidestepRechargeTimer <= 0) { this.sidestepCharges++; if (this.sidestepCharges < this.SIDESTEP_CHARGES) { this.sidestepRechargeTimer = this.SIDESTEP_CHARGE_RECHARGE_TIME; } }
        }

        if (!player || !player.active) { if(!this.is('idle') && this.can('finishAction')) this.finishAction(); return; }
        for (const cd in this.cooldowns) if (this.cooldowns[cd] > 0) this.cooldowns[cd] -= dt * 1000;

        const rotationLockStates = ['lunge', 'pounce', 'combo', 'bladeDance', 'spin', 'spinDouble', 'slashLunge', 'shotLeap', 'doubleShot', 'sidestep'];
        if (!rotationLockStates.includes(this.state) && !this.state.endsWith('Prep')) this._updateRotation(dt, player);
        
        this.moveState.moveVec = { x: 0, y: 0 }; this.moveState.currentMaxSpeed = this.MAX_SPEED; this.moveState.currentAccel = this.ACCELERATION; this.moveState.currentDamping = this.DAMPING;
        
        const stateUpdaterMap = {
            'idle': this._updateIdle, 'chasing': this._updateChasing, 'kiting': this._updateKiting,
            'lunge': this._updateLunge, 'pounce': this._updatePounce,
            'combo': this._updateAnyCombo, 'bladeDance': this._updateAnyCombo,
            'spin': this._updateAnySpin, 'spinDouble': this._updateAnySpin,
            'slashLunge': this._updateSlashLunge, 'shotLeap': this._updateShotLeap,
            'doubleShot': this._updateDoubleShot, 'sidestep': this._updateSidestep
        };
        const updater = stateUpdaterMap[this.state];
        if(updater) updater.call(this, dt, player);
        else if (this.state.endsWith('Prep')) this._updatePrepState(dt, player);
        
        this._updateMovement(dt);
    }
    
    takeDamage(amount) {
        if (!this.active || this.is('dead')) return; this.hp -= amount; if (this.hp <= 0) { this.hp = 0; this.die(); }
    }
    
    _drawMeleeArc(ctx, progress, lockedAngle, color, radius) {
        ctx.save(); ctx.rotate(lockedAngle);
        ctx.fillStyle = color.replace(')', ', 0.4)').replace('rgba', 'rgba'); ctx.strokeStyle = color.replace(')', ', 0.9)').replace('rgba', 'rgba');
        ctx.lineWidth = 2; const startAngle = -this.COMBO_ANGLE_WIDTH / 2; const endAngle = this.COMBO_ANGLE_WIDTH / 2;
        const currentAngle = startAngle + (endAngle - startAngle) * progress;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, radius, startAngle, currentAngle); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }

    draw(ctx, ox, oy) {
        if (!this.active && !this.is('dead')) return;
        const drawX = this.x - ox, drawY = this.y - oy; const state = this.attackState;

        if (this.is('pouncePrep') && state.targetX) {
            ctx.save(); const pulse = 0.7 + Math.sin(performance.now() * 0.02) * 0.3;
            ctx.strokeStyle = `rgba(255, 0, 0, ${pulse * 0.8})`; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(state.targetX - ox, state.targetY - oy, this.POUNCE_AOE_RADIUS, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }

        ctx.save(); ctx.translate(drawX, drawY); ctx.rotate(this.angle);
        ctx.fillStyle = this.is('dead') ? '#444' : (this.state.endsWith('Prep') ? '#AA0000' : '#8B0000');
        ctx.strokeStyle = '#2F0000'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath(); ctx.moveTo(this.radius, 0); ctx.lineTo(this.radius * 0.5, this.radius * 0.3); ctx.lineTo(this.radius * 0.5, -this.radius * 0.3); ctx.closePath(); ctx.fill();
        ctx.restore();

        ctx.save(); ctx.translate(drawX, drawY);
        if (this.is('pounce') && state.phase === 'recovering' && state.animProgress > 0) {
            const progress = state.animProgress; const currentRadius = this.POUNCE_AOE_RADIUS * TWEEN.Easing.Quadratic.Out(progress);
            ctx.fillStyle = `rgba(255, 120, 0, ${0.5 * (1-progress)})`; ctx.strokeStyle = `rgba(255, 150, 0, ${1-progress})`; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(0,0, currentRadius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        } else if ( (this.is('spin') || this.is('spinDouble')) && state.timer && state.delayTimer <=0) {
            const progress = state.timer / state.duration; const currentRadius = this.SPIN_RADIUS * TWEEN.Easing.Quadratic.Out(progress); const alpha = 1 - progress;
            ctx.fillStyle = `rgba(255, 80, 80, ${ alpha * 0.5})`; ctx.strokeStyle = `rgba(255, 80, 80, ${alpha})`; ctx.lineWidth = 7;
            ctx.beginPath(); ctx.arc(0, 0, currentRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        } else if ((this.is('combo') || this.is('bladeDance') || this.is('slashLunge')) && state.hits > 0 && state.animProgress < 1) {
            let color, range;
            if (state.type === 'bladeDance') { color = 'rgba(255, 200, 50, 1)'; range = state.range; }
            else if (state.type === 'slashLunge') { color = 'rgba(200, 200, 255, 1)'; range = this.SLASH_LUNGE_RANGE; }
            else { color = 'rgba(255, 255, 255, 1)'; range = state.range; }
            this._drawMeleeArc(ctx, state.animProgress, state.lockedAngle, color, range * 1.1);
        
        } else if (this.state.endsWith('Prep') && state.telegraphTimer > 0) {
            const pulse = 0.6 + Math.sin(performance.now() * 0.03) * 0.4;
            const telegraphProgress = 1 - (state.telegraphTimer / state.initialTelegraphDuration);
            ctx.strokeStyle = `rgba(255, 255, 0, ${pulse})`; ctx.lineWidth = 5 + pulse * 3; ctx.beginPath(); ctx.arc(0,0, this.radius + 15 + pulse * 5, 0, Math.PI * 2); ctx.stroke();
            ctx.save(); ctx.rotate(this.angle); ctx.fillStyle = `rgba(255, 100, 0, ${pulse * 0.35})`; ctx.strokeStyle = `rgba(255, 120, 0, ${pulse * 0.7})`; ctx.lineWidth = 3;
            const prepType = state.nextTransition;
            if (prepType === 'doLunge') { ctx.fillRect(this.radius, -this.radius * 0.1, this.LUNGE_RANGE_MAX * telegraphProgress, this.radius * 0.2);
            } else if (prepType === 'doSpin' || prepType === 'doSpinDouble') { ctx.beginPath(); ctx.arc(0, 0, this.SPIN_RADIUS * telegraphProgress, 0, Math.PI * 2); ctx.fill();
            } else if (prepType === 'doCombo' || prepType === 'doSlashLunge' || prepType === 'doBladeDance') {
                const range = (prepType === 'doSlashLunge') ? this.SLASH_LUNGE_RANGE : (prepType === 'doBladeDance' ? this.BLADE_DANCE_RANGE : this.COMBO_RANGE);
                ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0, 0, range, -this.COMBO_ANGLE_WIDTH/2, this.COMBO_ANGLE_WIDTH/2); ctx.closePath(); ctx.fill();
            }
            ctx.restore();
        } else if (this.is('doubleShot') && state.muzzleFlashTimer > 0) {
            ctx.rotate(this.angle); const flashSize = this.radius * 1.5 * (state.muzzleFlashTimer / 100); ctx.fillStyle = `rgba(255, 220, 180, ${state.muzzleFlashTimer / 100})`;
            for (let i = 0; i < 5; i++) {
                const rot = i * (Math.PI * 2 / 5); ctx.save(); ctx.rotate(rot); ctx.beginPath();
                ctx.moveTo(this.radius, 0); ctx.lineTo(this.radius + flashSize, flashSize / 4); ctx.lineTo(this.radius + flashSize, -flashSize / 4);
                ctx.closePath(); ctx.fill(); ctx.restore();
            }
        }
        ctx.restore();
        
        const barWidth = 100, barHeight = 10, barX = drawX - barWidth / 2, barY = drawY - this.radius - 20;
        ctx.fillStyle = 'rgba(192, 57, 43, 0.7)'; ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(barX, barY, Math.max(0, (this.hp / this.maxHp)) * barWidth, barHeight);
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        if (this.telegraphText) {
            ctx.font = `bold 18px ${DEFAULT_FONT_FAMILY}`; ctx.fillStyle = this.state.endsWith('Prep') ? 'orange' : 'yellow';
            ctx.textAlign = 'center'; ctx.fillText(this.telegraphText, drawX, barY - 10); ctx.textAlign = 'left';
        }
    }
}