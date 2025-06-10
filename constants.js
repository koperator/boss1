// --- constants.js ---
const TILE_SIZE = 32;
const PLAYER_SIZE = TILE_SIZE * 0.6;
const BASE_PLAYER_SPEED_WALK = 177;
const BASE_PLAYER_SPEED_RUN = 250;
const GUN_BARREL_OFFSET = PLAYER_SIZE * 0.6;
const WEAPON_ID = { MACHINEGUN: 1, AUTOSHOTGUN: 3 };
const PROJECTILE_LIFESPAN_DEFAULT = 1.1;
const PROJECTILE_LENGTH_DEFAULT = 15;
const PROJECTILE_WIDTH_DEFAULT = 3;
const MG_PROJECTILE_LENGTH = PROJECTILE_LENGTH_DEFAULT * 1.3;
const SHOTGUN_PELLET_SPEED_VARIATION = 0.5;
const SHOTGUN_PELLET_LIFESPAN = 0.44;
const PARTICLE_BOUNCE_DAMPING = 0.5;

// Added damage values
const weapons = [
    { id: WEAPON_ID.MACHINEGUN, name: "Machinegun", damage: 12, rpm: 750, magSize: 100, reloadTime: 1100, spreadStand: 2.5*(Math.PI/180), spreadWalk: 6*(Math.PI/180), spreadRun: 14*(Math.PI/180), projectileSpeed: 1350, ricochets: 1, pellets: 1, auto: true },
    { id: WEAPON_ID.AUTOSHOTGUN, name: "Autoshotgun", damage: 7, rpm: 220, magSize: 12, reloadTime: 1300, spreadStand: 6*(Math.PI/180), spreadWalk: 10*(Math.PI/180), spreadRun: 18*(Math.PI/180), projectileSpeed: 1190, ricochets: 0, pellets: 11, auto: true },
];

const BRAWLER_DASH_CHARGES = 2;
const BRAWLER_DASH_RECHARGE_TIME = 1500;
const BRAWLER_DASH_DURATION = 120;
const BRAWLER_DASH_SPEED_FACTOR_MOD = 1.30;
const PLAYER_DASH_SPEED_FACTOR = 4.17;
const PLAYER_DASH_AFTERIMAGE_INTERVAL = 39;
const GRENADE_COOLDOWN = 240;
const GRENADE_SPEED = 410;
const GRENADE_FUSE_TIME = 2500;
const GRENADE_COUNT_START = 17;
const GRENADE_BOUNCE_CHANCE = 0.99;
const GRENADE_BOUNCE_DAMPING = 0.5;
const GRENADE_SLOWDOWN_TIME = 600;
const GRENADE_STOP_TIME = 930;
const GRENADE_EXPLOSION_RADIUS = TILE_SIZE * 3;
const GRENADE_AOE_MAX_DAMAGE = 60; // Max damage at the epicenter
const GRENADE_AOE_MIN_DAMAGE = 15; // Min damage at the edge
const GRENADE_PARTICLE_COUNT = 50;
const GRENADE_PARTICLE_LIFESPAN = 0.20;
const GRENADE_PARTICLE_LENGTH = 8;
const GRENADE_PARTICLE_WIDTH = 4;
const SHOCKWAVE_LIFESPAN = 310;
const FLASH_PARTICLE_COUNT = 150;
const FLASH_PARTICLE_SPEED_MIN = 800;
const FLASH_PARTICLE_SPEED_MAX = 1200;
const FLASH_PARTICLE_LIFESPAN_MIN = 150;
const FLASH_PARTICLE_LIFESPAN_MAX = 370;
const CLASS_ID = { MARINE: 0, BRAWLER: 1 };
const classes = [
    { id: CLASS_ID.MARINE, name: "Marine", hp: 100, speedMultiplier: 1.00, weaponId: WEAPON_ID.MACHINEGUN, ability: { type: 'grenade', uses: GRENADE_COUNT_START, cooldown: GRENADE_COOLDOWN }, color: 'green' },
    { id: CLASS_ID.BRAWLER, name: "Brawler", hp: 100, speedMultiplier: 0.85, weaponId: WEAPON_ID.AUTOSHOTGUN, ability: { type: 'dash', uses: BRAWLER_DASH_CHARGES, maxUses: BRAWLER_DASH_CHARGES, rechargeTime: BRAWLER_DASH_RECHARGE_TIME, duration: BRAWLER_DASH_DURATION }, color: 'red' },
];
const DEFAULT_FONT_FAMILY = "'Courier New', Courier, monospace";