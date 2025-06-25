const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let score = 0;
let lives = 3;
let level = 1;

// Game objects
let player;
let bombCheckId = null;
let enemies = [];
let bullets = [];
let walls = [];
let explosions = [];
let healthPacks = [];
let drones = [];
let powerUps = [];

// Input handling
const keys = {};

// Constants
const TILE_SIZE = 20;
const PLAYER_SPEED = 2;
const ENEMY_SPEED = 2;
const BULLET_SPEED = 4;
const DEBUG_MODE = false;

// Directions
const DIRECTIONS = {
    UP: { x: 0, y: -1, angle: 0 },
    DOWN: { x: 0, y: 1, angle: Math.PI },
    LEFT: { x: -1, y: 0, angle: -Math.PI/2 },
    RIGHT: { x: 1, y: 0, angle: Math.PI/2 }
};

// Mapeamento de tiles
const TILE_TYPES = {
    EMPTY: 0,
    WALL: 1,
    PLAYER: 2,
    ENEMY: 3,
    STEEL_WALL: 4,
    SUICIDE_ENEMY: 5,
    LASER_TOWER: 6,
    GUIDED_ENEMY: 7,
    HEALTH_PACK: 8,
    FORTRESS: 9,
    MACHINE_GUN_TOWER: 10,
    REINFORCED_WALL: 11,
    TRIPLE_SHOT: 12,
    HEALER_ENEMY: 13,
    REACTIVE_WALL_TURRET: 14,
    IMMUNITY: 15,
    BOSS: 16
};

const LEVELS = [
    // Nível 1
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 11, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 1],
        [1, 3, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 11, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 13, 0, 0, 0, 0, 11, 1, 1, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 11, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 11, 11, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 8, 0, 0, 14, 0, 0, 0, 11, 1, 0, 0, 4, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 4, 4, 4, 4, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 1, 11, 0, 0, 0, 11, 1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 11, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 11, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 1, 4, 4, 0, 0, 0, 9, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 11, 0, 0, 5, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1],
        [1, 0, 0, 1, 1, 1, 15, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    // Nível 2
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
];

class Tank {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.color = color;
        this.direction = DIRECTIONS.UP;
        this.isPlayer = isPlayer;
        this.lastShot = 0;
        this.shootCooldown = isPlayer ? 300 : 400;
        this.health = isPlayer ? 1 : Math.floor(Math.random() * 3) + 1;
        this.maxHealth = this.health;
        this.lastMove = 0;
        this.moveInterval = isPlayer ? 0 : 50; // Very smooth movement
        this.stuckCounter = 0;
        this.targetDirection = null;
        this.isMoving = false;
        this.moveSteps = 0;
        this.maxMoveSteps = TILE_SIZE / ENEMY_SPEED;
        this.stuckThreshold = 10; // Número de tentativas antes de considerar preso
        this.directionChangeCooldown = 1000; // Tempo mínimo entre mudanças de direção
        this.lastDirectionChange = 0;
        this.viewRadius = 300; // Raio de visão do inimigo
        this.chasing = false; // Se está perseguindo o jogador
        this.attackDistance = 150; // Distância ideal para ataque
        this.lastSightCheck = 0;
        this.sightCheckInterval = 200; // Verifica visão a cada 200ms
        this.lastPlayerPosition = null;
        this.lastSeenTime = 0;
        this.memoryDuration = 3000; // 3 segundos de memória da posição
        this.giveUpTime = 5000; // 5 segundos tentando alcançar
        this.lastAttemptTime = 0;
        this.isInvulnerable = false;
        this.invulnerableTime = 2000; // 2 segundos
        this.invulnerableStart = 0;
        this.hasShield = false;
        this.shieldCooldown = 0;
        this.maxShieldCooldown = 10000; // 10 segundos de cooldown
        this.shieldActiveTime = 5000; // 5 segundos de duração
        this.shieldActivationTime = 0;
        this.shieldElement = null;
        this.hasSpeedBoost = false;
        this.speedBoostCooldown = 0;
        this.maxSpeedBoostCooldown = 8000; // 8 segundos de cooldown
        this.speedBoostActiveTime = 3000; // 3 segundos de duração
        this.speedBoostActivationTime = 0;
        this.normalSpeed = PLAYER_SPEED;
        this.boostedSpeed = PLAYER_SPEED * 2; // Velocidade dobrada durante o boost
        this.currentSpeed = this.normalSpeed;
        this.speedBoostElement = null;
        this.hasMultiShot = false;
        this.multiShotCooldown = 0;
        this.maxMultiShotCooldown = 10000; // 10 segundos de cooldown
        this.lastMultiShot = 0;
        this.multiShotCount = 5; // Número de projéteis
        this.multiShotSpread = Math.PI/4; // Ângulo de dispersão (45 graus)
        this.multiShotRange = 2; // Multiplicador de alcance
        this.hasRicochet = false;
        this.ricochetCooldown = 0;
        this.maxRicochetCooldown = 10000; // 10 segundos
        this.lastRicochet = 0;
        this.droneCooldown = 0;
        this.maxDroneCooldown = 20000; // 20 segundos de cooldown
        this.droneActiveTime = 8000; // 15 segundos de duração
        this.drones = [];
        this.hasTripleShot = false;
        this.tripleShotEndTime = 0;
        this.areaBombCooldown = 0;
        this.maxAreaBombCooldown = 30000; // 30 segundos de cooldown
        this.lastAreaBomb = 0;
        this.freezeShotCooldown = 0;
        this.maxFreezeShotCooldown = 15000; // 15 segundos de cooldown
        this.freezeDuration = 6000; // 3 segundos de congelamento
    }

    freeze(duration) {
        this.isFrozen = true;
        this.frozenUntil = Date.now() + duration;

        if (this.sprintActive) {
            this.sprintActive = false;
            this.color = this.preSprintColor; // Restaura a cor armazenada
        }
        
        // Efeito visual temporário
        this.originalColor = this.color;
        this.color = '#00a8ff';
        
        // Restaura após o tempo
        setTimeout(() => {
            this.isFrozen = false;
            this.color = this.originalColor;
        }, duration);
    }

    activateFreezeShot() {
        if (this.freezeShotCooldown > 0 || !this.isPlayer) return;
        
        const bulletX = this.x + this.width/2 - 3;
        const bulletY = this.y + this.height/2 - 3;
        
        // Cria uma cópia da direção atual
        const bulletDirection = {
            x: this.direction.x,
            y: this.direction.y,
            angle: this.direction.angle
        };
        
        bullets.push(new FreezeBullet(bulletX, bulletY, bulletDirection, true, this.freezeDuration));
        
        this.freezeShotCooldown = this.maxFreezeShotCooldown;
        updateUI();
    }

    updateFreezeShotCooldown() {
        if (this.freezeShotCooldown > 0) {
            this.freezeShotCooldown = Math.max(0, this.freezeShotCooldown - 16);
        }
    }

    activateAreaBomb() {
        const now = Date.now();
        if (this.areaBombCooldown > 0) return;
        
        const bombX = this.x + this.width/2;
        const bombY = this.y + this.height/2;
        const bombRadius = 300;
        
        // Cria o efeito visual
        const bombEffect = new AreaBombEffect(bombX, bombY);
        explosions.push(bombEffect);
        
        // Função que verifica e destrói inimigos atingidos
        const checkEnemies = () => {
            enemies = enemies.filter(enemy => {
                const dx = enemy.x + enemy.width/2 - bombX;
                const dy = enemy.y + enemy.height/2 - bombY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Só processa se estiver dentro do raio atual da bomba
                if (distance <= bombEffect.radius) {
                    // Verifica se o inimigo é imune a bombas
                    if (enemy.isBombImmune) {
                        // Cria um efeito visual especial (azul) para indicar imunidade
                        explosions.push(new BombImmuneEffect(
                            enemy.x + enemy.width/2 - 10,
                            enemy.y + enemy.height/2 - 10
                        ));
                        return true; // Mantém o inimigo no array (não destrói)
                    }
                    
                    // Inimigos normais são destruídos
                    score += enemy instanceof GuidedEnemy ? 150 : 
                           enemy instanceof LaserTower ? 200 :
                           enemy instanceof FortressTank ? 300 : 
                           enemy instanceof BossEnemy ? 1000 : // Adiciona pontuação do Boss caso não seja imune
                           100; // Pontuação padrão
                    
                    explosions.push(new Explosion(enemy.x, enemy.y, 30, 15));
                    return false; // Remove o inimigo do array
                }
                return true;
            });
            
            // Continua verificando até a bomba terminar de expandir
            if (!bombEffect.expansionComplete) {
                bombCheckId = requestAnimationFrame(checkEnemies);
            }
        };
        
        // Inicia a verificação
        checkEnemies();
        
        this.areaBombCooldown = this.maxAreaBombCooldown;
        updateUI();
    }

    // Método para ativar o power-up
    activateTripleShot(duration) {
        this.hasTripleShot = true;
        this.tripleShotEndTime = Date.now() + duration;
    }

    // Atualizar o estado do power-up
    updateTripleShot() {
        if (this.hasTripleShot && Date.now() > this.tripleShotEndTime) {
            this.hasTripleShot = false;
        }
    }

    activateDrone() {
        // Verifica se já está em cooldown ou se já tem drones ativos
        if (this.droneCooldown > 0 || this.drones.length > 0) return;

        this.drones.push(new AttackDrone(this.x - 5, this.y - 5, this));
        this.droneActivationTime = Date.now();
        updateUI();
    }

    updateDrones() {
        // Atualiza os drones e remove os que expiraram
        this.drones = this.drones.filter(drone => drone.update());
        
        // Atualiza cooldown apenas quando não há drones ativos
        if (this.drones.length === 0) {
            // Se acabou o tempo dos drones e o cooldown ainda não começou
            if (this.droneActivationTime > 0) {
                this.droneCooldown = this.maxDroneCooldown;
                this.droneActivationTime = 0; // Reseta o tempo de ativação
            }
            
            // Diminui o cooldown normalmente
            if (this.droneCooldown > 0) {
                this.droneCooldown = Math.max(0, this.droneCooldown - 16);
            }
        }
        updateUI();
    }

    activateRicochet() {
        if (this.ricochetCooldown > 0 || !this.isPlayer) return;
        
        const bulletX = this.x + this.width/2 - 3;
        const bulletY = this.y + this.height/2 - 3;
        
        // Cria uma cópia da direção atual para não afetar a do jogador
        const bulletDirection = {
            x: this.direction.x,
            y: this.direction.y,
            angle: this.direction.angle
        };
        
        bullets.push(new RicochetBullet(bulletX, bulletY, bulletDirection, true));
        
        this.ricochetCooldown = this.maxRicochetCooldown;
        updateUI();
    }

    // Atualizar cooldown
    updateRicochetCooldown() {
        if (this.ricochetCooldown > 0) {
            this.ricochetCooldown = Math.max(0, this.ricochetCooldown - 16);
        }
    }

    activateMultiShot() {
        if (this.multiShotCooldown > 0 || !this.isPlayer) return;
        
        // Calcula o ângulo baseado na direção atual do jogador
        const centerAngle = Math.atan2(this.direction.y, this.direction.x);
        const angleStep = this.multiShotSpread / (this.multiShotCount - 1);
        const startAngle = centerAngle - this.multiShotSpread/2;
        
        for (let i = 0; i < this.multiShotCount; i++) {
            const angle = startAngle + i * angleStep;
            const direction = {
                x: Math.cos(angle),
                y: Math.sin(angle),
                angle: angle
            };
            
            const bulletX = this.x + this.width/2 - 2;
            const bulletY = this.y + this.height/2 - 2;
            bullets.push(new MultiBullet(bulletX, bulletY, direction, true, this.multiShotRange));
        }
        
        this.multiShotCooldown = this.maxMultiShotCooldown;
        updateUI();
    }

    updateMultiShotCooldown() {
        if (this.multiShotCooldown > 0) {
            this.multiShotCooldown = Math.max(0, this.multiShotCooldown - 16); // ~16ms por frame
        }
    }

    startInvulnerability(duration = 2000) {
        this.isInvulnerable = true;
        this.invulnerableStart = Date.now();
        this.invulnerableTime = duration;
    }

    activateSpeedBoost() {
        if (this.speedBoostCooldown > 0 || this.hasSpeedBoost) return;
        
        this.hasSpeedBoost = true;
        this.currentSpeed = this.boostedSpeed;
        this.speedBoostActivationTime = Date.now();
    }

    updateSpeedBoost() {
        if (!this.isPlayer) return;
        
        // Atualiza o cooldown
        if (this.speedBoostCooldown > 0) {
            this.speedBoostCooldown = Math.max(0, this.speedBoostCooldown - 16); // ~16ms por frame
        }
        
        // Desativa o speed boost após o tempo de duração
        if (this.hasSpeedBoost && Date.now() - this.speedBoostActivationTime > this.speedBoostActiveTime) {
            this.hasSpeedBoost = false;
            this.currentSpeed = this.normalSpeed;
            this.speedBoostCooldown = this.maxSpeedBoostCooldown;
            
            if (this.speedBoostElement) {
                this.speedBoostElement.style.display = 'none';
            }
        }
    }
    
    move(dx, dy) {
        const speed = (this.isPlayer ? this.currentSpeed : ENEMY_SPEED) * (Math.round(this.speedMultiplier) || 1); 
        const newX = this.x + dx * speed;
        const newY = this.y + dy * speed;
        
        // Check boundaries
        if (newX < 0 || newX + this.width > canvas.width || 
            newY < 0 || newY + this.height > canvas.height) {
            return false;
        }
        
        // Check wall collisions
        const tankRect = { x: newX, y: newY, width: this.width, height: this.height };
        for (let wall of walls) {
            if (this.checkCollision(tankRect, wall)) {
                return false;
            }
        }
        
        // Check tank collisions
        const otherTanks = this.isPlayer ? enemies : enemies.concat([player]);
        for (let tank of otherTanks) {
            if (tank !== this && this.checkCollision(tankRect, tank)) {
                return false;
            }
        }
        
        this.x = newX;
        this.y = newY;
        
        // Update direction
        if (dx > 0) this.direction = DIRECTIONS.RIGHT;
        else if (dx < 0) this.direction = DIRECTIONS.LEFT;
        else if (dy > 0) this.direction = DIRECTIONS.DOWN;
        else if (dy < 0) this.direction = DIRECTIONS.UP;
        
        return true;
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.shootCooldown) return;

        const bulletX = this.x + this.width / 2 - 2;
        const bulletY = this.y + this.height / 2 - 2;

        // Corrige o ângulo visual do tanque para o sistema cartesiano
        const baseAngle = this.direction.angle - Math.PI / 2;

        if (this.hasTripleShot) {
            const angles = [-0.26, 0, 0.26]; // ±15 graus

            angles.forEach(offset => {
                const angle = baseAngle + offset;
                const direction = {
                    x: Math.cos(angle),
                    y: Math.sin(angle),
                    angle: angle
                };
                bullets.push(new Bullet(bulletX, bulletY, direction, this.isPlayer));
            });
        } else {
            // Direção corrigida
            const angle = baseAngle;
            const direction = {
                x: Math.cos(angle),
                y: Math.sin(angle),
                angle: angle
            };
            bullets.push(new Bullet(bulletX, bulletY, direction, this.isPlayer));
        }

        this.lastShot = now;
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    update() {
        if (this.isFrozen) {
            if (Date.now() > this.frozenUntil) {
                this.isFrozen = false;
                this.color = this.originalColor;
            }
            return; // Não faz nada se estiver congelado
        }

        if (this.isPlayer && this.isInvulnerable) {
            if (Date.now() - this.invulnerableStart > this.invulnerableTime) {
                this.isInvulnerable = false;
            }
        }

        if (this.areaBombCooldown > 0) {
            this.areaBombCooldown = Math.max(0, this.areaBombCooldown - 16);
        }

        if (!this.isPlayer) {
            const now = Date.now();
            
            // Verifica se o jogador está no raio de visão
            if (now - this.lastSightCheck > this.sightCheckInterval) {
                this.checkPlayerInSight();
                this.lastSightCheck = now;
            }
            
            // Movimento contínuo e suave
            if (now - this.lastMove > this.moveInterval) {
                // Se estiver perseguindo, usa lógica de perseguição
                if (this.chasing && player) {
                    this.updateChasingBehavior();
                } 
                // Caso contrário, usa o comportamento padrão
                else {
                    if (!this.targetDirection || this.stuckCounter > this.stuckThreshold) {
                        this.chooseNewDirection();
                        this.stuckCounter = 0;
                    }
                    
                    const moved = this.move(this.targetDirection.x, this.targetDirection.y);
                    
                    if (moved) {
                        this.moveSteps++;
                        this.stuckCounter = 0;
                    } else {
                        this.stuckCounter++;
                        
                        if (this.stuckCounter > 2 && now - this.lastDirectionChange > this.directionChangeCooldown) {
                            this.tryAlternativeDirections();
                            this.lastDirectionChange = now;
                        }
                    }
                }
                
                this.lastMove = now;
                
                // Dispara com mais frequência quando está perseguindo
                if (this.chasing) {
                    // Chance de atirar a cada frame (ajuste o valor para mudar a frequência)
                    if (Math.random() < 0.05) { // 5% de chance por frame (era 1% antes)
                        this.shoot();
                    }
                } else {
                    // Chance menor quando não está perseguindo
                    if (Math.random() < 0.005) { // 0.5% de chance por frame
                        this.shoot();
                    }
                }
            }
        }
    }
    
    // Verifica se o jogador está no campo de visão
    checkPlayerInSight() {
        if (!player) return false;
        
        const now = Date.now();
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Verifica apenas periodicamente para otimização
        if (now - this.lastSightCheck < this.sightCheckInterval) {
            return this.chasing;
        }
        this.lastSightCheck = now;

        // Se está muito longe, nem verifica
        if (distance > this.viewRadius) {
            this.chasing = false;
            return false;
        }

        // Verifica linha de visão
        const canSeePlayer = this.hasLineOfSightToPlayer();
        
        if (canSeePlayer) {
            this.lastPlayerPosition = { x: player.x, y: player.y };
            this.lastSeenTime = now;
            this.lastAttemptTime = now;
            this.chasing = true;
            return true;
        } else if (this.lastPlayerPosition && now - this.lastSeenTime < this.memoryDuration) {
            // Continua perseguindo a última posição conhecida por um tempo
            this.chasing = true;
            return true;
        } else {
            // Desiste depois de muito tempo tentando
            if (now - this.lastAttemptTime > this.giveUpTime) {
                this.chasing = false;
                this.lastPlayerPosition = null;
            }
            return false;
        }
    }
    
    // Verifica se há linha de visão direta até o jogador (sem paredes no caminho)
    hasLineOfSightToPlayer() {
        if (!player) return false;
        
        // Cria um retângulo de teste entre o inimigo e o jogador
        const testRect = {
            x: this.x + this.width/2 - 2,
            y: this.y + this.height/2 - 2,
            width: 4,
            height: 4
        };
        
        // Direção para o jogador
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / 5); // Verifica a cada 5 pixels
        
        // Testa pontos ao longo da linha entre o inimigo e o jogador
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            testRect.x = this.x + this.width/2 - 2 + dx * t;
            testRect.y = this.y + this.height/2 - 2 + dy * t;
            
            // Verifica colisão com paredes
            for (let wall of walls) {
                if (this.checkCollision(testRect, wall)) {
                    return false; // Parede no caminho
                }
            }
        }
        
        return true; // Nenhuma parede no caminho
    }
    
    // Lógica de perseguição ao jogador
    updateChasingBehavior() {
        if (!player) {
            this.chasing = false;
            return;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Se estiver na distância ideal, apenas atira
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.attackDistance) {
            if (absDx > absDy) {
                this.direction = dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
            } else {
                this.direction = dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
            }

            if (this instanceof Tank && Math.random() < 0.005) this.shoot();
            return;
        }

        // Movimento: prioriza um eixo por vez para evitar o "zig-zag"
        let moved = false;

        if (absDx > TILE_SIZE / 2) {
            const dirX = dx > 0 ? 1 : -1;
            moved = this.move(dirX, 0);
            if (moved) return;
        }

        if (!moved && absDy > TILE_SIZE / 2) {
            const dirY = dy > 0 ? 1 : -1;
            this.move(0, dirY);
        }

        // Tenta atirar com chance quando estiver perseguindo
        if (this instanceof Tank && Math.random() < 0.008) {
            this.shoot();
        }
    }
    
    tryAlternativeDirections() {
        // Tenta direções alternativas quando preso
        const directions = [
            DIRECTIONS.UP, DIRECTIONS.DOWN,
            DIRECTIONS.LEFT, DIRECTIONS.RIGHT
        ];
        
        // Embaralha as direções para tentativa aleatória
        const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
        
        for (const dir of shuffledDirections) {
            if (dir === this.targetDirection) continue;
            
            if (this.canMoveInDirection(dir)) {
                this.targetDirection = dir;
                this.direction = dir;
                return true;
            }
        }
        
        return false;
    }
    
    chooseNewDirection() {
        const directions = [
            DIRECTIONS.UP, DIRECTIONS.DOWN,
            DIRECTIONS.LEFT, DIRECTIONS.RIGHT
        ];
        
        // Prioriza direções que levam ao jogador (comportamento mais inteligente)
        if (Math.random() < 0.6 && player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            
            // Escolhe o eixo com maior diferença
            if (Math.abs(dx) > Math.abs(dy)) {
                this.targetDirection = dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
            } else {
                this.targetDirection = dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
            }
            
            // Verifica se a direção escolhida é válida
            if (this.canMoveInDirection(this.targetDirection)) {
                this.direction = this.targetDirection;
                return;
            }
        }
        
        // Se não conseguiu direção inteligente, escolhe aleatória disponível
        const availableDirections = directions.filter(dir => 
            dir !== this.targetDirection && this.canMoveInDirection(dir)
        );
        
        if (availableDirections.length > 0) {
            this.targetDirection = availableDirections[
                Math.floor(Math.random() * availableDirections.length)
            ];
            this.direction = this.targetDirection;
        } else {
            // Se nenhuma direção disponível, tenta qualquer direção
            this.targetDirection = directions[
                Math.floor(Math.random() * directions.length)
            ];
            this.direction = this.targetDirection;
        }
    }
    
    canMoveInDirection(dir) {
        // Testa movimento com um pouco de margem para evitar ficar preso
        const margin = 2;
        const testX = this.x + dir.x * (ENEMY_SPEED + margin);
        const testY = this.y + dir.y * (ENEMY_SPEED + margin);
        
        // Verifica limites do canvas
        if (testX < 0 || testX + this.width > canvas.width || 
            testY < 0 || testY + this.height > canvas.height) {
            return false;
        }
        
        // Verifica colisão com paredes
        const testRect = {
            x: testX,
            y: testY,
            width: this.width,
            height: this.height
        };
        
        for (let wall of walls) {
            if (this.checkCollision(testRect, wall)) {
                return false;
            }
        }
        
        // Verifica colisão com outros tanques
        const otherTanks = [player, ...enemies.filter(e => e !== this)];
        for (let tank of otherTanks) {
            if (tank && this.checkCollision(testRect, tank)) {
                return false;
            }
        }
        
        return true;
    }

    activateShield() {
        if (this.shieldCooldown > 0 || this.hasShield) return;
        
        this.hasShield = true;
        this.shieldActivationTime = Date.now();
        
        if (this.shieldElement) {
            this.shieldElement.style.display = 'block';
        }
    }

    updateShield() {
        if (!this.isPlayer) return;
        
        // Atualiza o cooldown
        if (this.shieldCooldown > 0) {
            this.shieldCooldown = Math.max(0, this.shieldCooldown - 16); // ~16ms por frame
        }
        
        // Desativa o escudo após o tempo de duração
        if (this.hasShield && Date.now() - this.shieldActivationTime > this.shieldActiveTime) {
            this.hasShield = false;
            if (this.shieldElement) {
                this.shieldElement.style.display = 'none';
            }
        }
    }

    takeDamage() {
        if (this.hasShield) {
            // Escudo protege do dano, mas é quebrado
            this.hasShield = false;
            this.shieldCooldown = this.maxShieldCooldown;
            
            // Efeito visual quando o escudo é quebrado
            explosions.push(new Explosion(this.x, this.y, 30, 20));
            return false; // Indica que o dano foi bloqueado
        }
        
        // Se não tem escudo, toma dano normalmente
        return true;
    }
    
    draw() {
        if (DEBUG_MODE && !this.isPlayer) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            
            // Cor diferente se estiver perseguindo
            if (this.chasing) {
                ctx.fillStyle = '#f006'; // Vermelho quando perseguindo
            } else {
                ctx.fillStyle = '#0f06'; // Verde quando em patrulha
            }
            
            ctx.beginPath();
            ctx.arc(
                this.x + this.width/2, 
                this.y + this.height/2, 
                this.viewRadius, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }

        if (this.isPlayer && this.hasShield) {
            ctx.save();
            
            // Cria um gradiente radial para o escudo
            const gradient = ctx.createRadialGradient(
                this.x + this.width/2, this.y + this.height/2, this.width * 0.3,
                this.x + this.width/2, this.y + this.height/2, this.width * 0.8
            );
            gradient.addColorStop(0, 'rgba(0, 168, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 168, 255, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width/2,
                this.y + this.height/2,
                this.width * 0.8,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Borda do escudo com efeito de brilho
            ctx.strokeStyle = '#00a8ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00a8ff';
            ctx.shadowBlur = 5;
            ctx.stroke();
            
            ctx.restore();
        }

        if (this.isPlayer && this.hasSpeedBoost) {
            ctx.save();
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width/2,
                this.y + this.height/2,
                this.width * 0.8,
                0,
                Math.PI * 2
            );
            ctx.stroke();
            
            // Efeito de partículas para velocidade (opcional)
            for (let i = 0; i < 4; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = this.width * 0.6 + Math.random() * 10;
                ctx.fillStyle = `rgba(255, 200, 0, ${Math.random() * 0.5 + 0.5})`;
                ctx.beginPath();
                ctx.arc(
                    this.x + this.width/2 + Math.cos(angle) * dist,
                    this.y + this.height/2 + Math.sin(angle) * dist,
                    2 + Math.random() * 2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.direction.angle);

        if (this.isPlayer && this.isInvulnerable) {
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.globalAlpha = 0.3; // Mais transparente
            } else {
                ctx.globalAlpha = 1.0;
            }
        }
   
        // Tank body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.globalAlpha = 1.0; // Restaura transparência
        
        // Tank tracks
        ctx.fillStyle = this.isPlayer ? '#444' : '#600';
        ctx.fillRect(-this.width/2, -this.height/2 + 2, this.width, 3);
        ctx.fillRect(-this.width/2, this.height/2 - 5, this.width, 3);
        
        // Tank cannon
        ctx.fillStyle = this.isPlayer ? '#666' : '#800';
        ctx.fillRect(-2, -this.height/2 - 5, 4, 8);

        if (!this.isPlayer) {
            ctx.fillStyle = 'red';
            for (let i = 0; i < this.health; i++) {
                ctx.beginPath();
                ctx.arc(-this.width/2 + 5 + (i * 5), -this.height/2 + 10, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (this.isPlayer && this.hasTripleShot) {
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Limpa o dash depois
            ctx.globalAlpha = 1.0; // Restaura opacidade
        }
        
        ctx.restore();
    }
}

class GuidedEnemy extends Tank {
    constructor(x, y) {
        super(x, y, '#ff9900', false); // Cor laranja
        this.health = 2; // 2 de vida
        this.maxHealth = this.health;
        this.speedMultiplier = 0.6; // Movimento mais lento
        this.viewRadius = 300; // Raio de visão
        this.lastSightCheck = 0;
        this.sightCheckInterval = 300; // Verifica visão a cada 300ms
        this.active = false;
        this.bulletSpeed = BULLET_SPEED * 0.7; // Balas mais lentas (para compensar a perseguição)
        this.shootCooldown = 2500;
        this.canShoot = true;
        this.color = '#ff9900';
        this.activeColor = '#ff6600';
    }

    freeze(duration) {
        this.isFrozen = true;
        this.frozenUntil = Date.now() + duration;
        
        // Efeito visual temporário
        this.originalColor = this.color;
        this.originalActiveColor = this.activeColor;
        this.color = '#00a8ff';
        this.activeColor = '#00a8ff';
        
        // Restaura após o tempo
        setTimeout(() => {
            this.isFrozen = false;
            this.color = this.originalColor;
            this.activeColor = this.originalActiveColor;
        }, duration);
    }

    update() {
        const now = Date.now();

        if (this.isFrozen) {
            if (Date.now() > this.frozenUntil) {
                this.isFrozen = false;
                this.color = this.originalColor;
            }
            return; // Não faz nada se estiver congelado
        }
        
        // Verificação de visão periódica
        if (now - this.lastSightCheck > this.sightCheckInterval) {
            this.active = this.checkPlayerInSight();
            this.lastSightCheck = now;
        }

        // Movimento aleatório básico (herdado) quando não vê o jogador
        if (!this.active) {
            super.update();
            return;
        }

        // Comportamento quando ativo (vê o jogador)
        if (now - this.lastMove > this.moveInterval) {
            // Tenta se posicionar na melhor direção para atirar
            this.updateChasingBehavior();
            this.lastMove = now;
        }

        // Dispara com menos frequência que inimigos normais
        if (now - this.lastShot > this.shootCooldown && this.active) {
            this.shoot();
            this.lastShot = now;
        }
    }

    shoot() {
        // Verifica se já existe um projétil ativo deste inimigo
        const hasActiveBullet = bullets.some(b => 
            !b.isPlayerBullet && Math.abs(b.x - this.x) < 30 && Math.abs(b.y - this.y) < 30
        );
        
        if (!hasActiveBullet) {
            const bulletX = this.x + this.width/2 - 3;
            const bulletY = this.y + this.height/2 - 3;
            bullets.push(new GuidedBullet(bulletX, bulletY, this.direction, this.bulletSpeed));
        }
    }

    draw() {
        // Desenho base do tanque
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.direction.angle);
        
        // Corpo
        ctx.fillStyle = this.active ? this.activeColor : this.color; // Laranja mais vivo quando ativo
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Antenas (detalhe especial)
        ctx.fillStyle = '#ccc';
        ctx.fillRect(-3, -this.height/2 - 8, 6, 8); // Antena central
        ctx.fillRect(-this.width/2 - 5, -4, 5, 3); // Antena lateral esquerda
        ctx.fillRect(this.width/2, -4, 5, 3); // Antena lateral direita
        
        // Canhão
        ctx.fillStyle = '#666';
        ctx.fillRect(-2, -this.height/2 - 10, 4, 10);
        
        // Indicador de vida
        ctx.fillStyle = 'red';
        for (let i = 0; i < this.health; i++) {
            ctx.fillRect(-this.width/4 + (i * 6), -this.height/2, 4, 4);
        }

        ctx.restore();

        // Debug: mostra campo de visão
        if (DEBUG_MODE) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = this.active ? '#f00' : '#0f0';
            ctx.beginPath();
            ctx.arc(
                this.x + this.width/2, 
                this.y + this.height/2, 
                this.viewRadius, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }
    }
}

class GuidedBullet {
    constructor(x, y, initialDirection, speed) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 5;
        this.speed = speed;
        this.direction = { ...initialDirection }; // Cópia da direção inicial
        this.turningSpeed = 0.05; // Velocidade de curva
        this.lifetime = 180; // Duração em frames (3 segundos a 60fps)
        this.isPlayerBullet = false;
    }

    update() {
        if (!player || this.lifetime-- <= 0) return false;

        // Calcula direção para o jogador
        const dx = player.x + player.width/2 - (this.x + this.width/2);
        const dy = player.y + player.height/2 - (this.y + this.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Suavemente ajusta a direção para perseguir o jogador
            const targetAngle = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(this.direction.y, this.direction.x);
            
            // Interpolação angular suave
            let newAngle = currentAngle;
            const angleDiff = ((targetAngle - currentAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            newAngle += Math.min(this.turningSpeed, Math.abs(angleDiff)) * Math.sign(angleDiff);
            
            // Atualiza direção
            this.direction.x = Math.cos(newAngle);
            this.direction.y = Math.sin(newAngle);
        }

        // Movimento
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;

        // Verifica colisão com o jogador
        if (this.checkCollision(this, player)) {
            if (player.takeDamage()) { // Só causa dano se takeDamage retornar true (escudo não ativo)
                if (!player.isInvulnerable) {
                    explosions.push(new Explosion(player.x, player.y));
                    lives--;
                    updateUI();

                    if (lives <= 0) {
                        endGame();
                    } else {
                        player.startInvulnerability();
                    }
                }
            }
            return false; // A bala sempre é destruída ao atingir o jogador
        }

        // Verifica colisão com paredes
        for (let i = walls.length - 1; i >= 0; i--) {
            if (this.checkCollision(this, walls[i])) {
                // Se for uma parede reforçada
                if (walls[i] instanceof ReinforcedWall) {
                    // Aplica dano à parede reforçada
                    const shouldDestroy = walls[i].takeHit();
                    explosions.push(new Explosion(
                        walls[i].x + walls[i].width/2 - 10,
                        walls[i].y + walls[i].height/2 - 10,
                        15, 10
                    ));
                    
                    // Remove a parede só se tiver levado hits suficientes
                    if (shouldDestroy) {
                        walls.splice(i, 1);
                    }
                } 
                // Para paredes normais destrutíveis
                else if (walls[i].isDestructible) {
                    explosions.push(new Explosion(walls[i].x, walls[i].y));
                    walls.splice(i, 1);
                }
                // Para paredes indestrutíveis só cria a explosão
                else {
                    explosions.push(new Explosion(
                        walls[i].x + walls[i].width/2 - 10,
                        walls[i].y + walls[i].height/2 - 10
                    ));
                }
                return false;
            }
        }

        return true;
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw() {
        // Projétil brilhante com núcleo e aura
        ctx.save();
        
        // Aura
        ctx.fillStyle = '#ff990055';
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2, 
            this.y + this.height/2, 
            this.width + 2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Núcleo
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Rastro
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y + this.height/2);
        ctx.lineTo(
            this.x + this.width/2 - this.direction.x * 10,
            this.y + this.height/2 - this.direction.y * 10
        );
        ctx.stroke();
        
        ctx.restore();
    }
}

class SuicideEnemy extends Tank {
    constructor(x, y) {
        super(x, y, '#f80', false);
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.speedMultiplier = 1.1;
        this.explosionRadius = 60;
        this.damage = 1;
        this.explodeDistance = 30;
        this.pathUpdateInterval = 500; // Atualiza o caminho a cada 500ms
        this.lastPathUpdate = 0;
        this.currentPath = [];
        this.stuckTime = 0;
        this.maxStuckTime = 2000; // 2 segundos
        this.viewRadius = 250; // Raio em pixels dentro do qual o jogador pode ser detectado
        this.sightCheckInterval = 200; // Verifica a visão a cada 200ms
        this.lastSightCheck = 0;
        this.hasDetectedPlayer = false; // Flag para indicar se o jogador foi detectado
    }

    checkPlayerInSight() {
        if (!player) return false;
        
        // Calcula a distância até o jogador
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Se o jogador está dentro do raio de visão
        if (distance <= this.viewRadius) {
            // Verifica se há linha de visão direta (sem paredes no caminho)
            if (this.hasLineOfSightToPlayer()) {
                this.hasDetectedPlayer = true;
                return true;
            }
        }
        
        return false;
    }
    
    hasLineOfSightToPlayer() {
        if (!player) return false;
        
        // Cria um retângulo de teste entre o inimigo e o jogador
        const testRect = {
            x: this.x + this.width/2 - 2,
            y: this.y + this.height/2 - 2,
            width: 4,
            height: 4
        };
        
        // Direção para o jogador
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / 5); // Verifica a cada 5 pixels
        
        // Testa pontos ao longo da linha entre o inimigo e o jogador
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            testRect.x = this.x + this.width/2 - 2 + dx * t;
            testRect.y = this.y + this.height/2 - 2 + dy * t;
            
            // Verifica colisão com paredes
            for (let wall of walls) {
                if (this.checkCollision(testRect, wall)) {
                    return false; // Parede no caminho
                }
            }
        }
        
        return true; // Nenhuma parede no caminho
    }

    update() {
        if (!player) return;

        if (this.isFrozen) {
            if (Date.now() > this.frozenUntil) {
                this.isFrozen = false;
                this.color = this.originalColor;
            }
            return; // Não faz nada se estiver congelado
        }

        const now = Date.now();
        
        // Verifica periodicamente se o jogador está no campo de visão
        if (now - this.lastSightCheck > this.sightCheckInterval) {
            this.checkPlayerInSight();
            this.lastSightCheck = now;
        }
        
        // Só persegue se tiver detectado o jogador
        if (!this.hasDetectedPlayer) return;
        
        // Verifica se está preso
        if (this.isStuck()) {
            this.findAlternativePath();
            return;
        }

        // Atualiza o caminho periodicamente
        if (now - this.lastPathUpdate > this.pathUpdateInterval) {
            this.updatePathToPlayer();
            this.lastPathUpdate = now;
        }

        // Segue o caminho calculado ou vai direto ao jogador
        this.followPathOrDirect();

        // Verifica se está perto o suficiente para explodir
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.explodeDistance) {
            this.explode();
        }
    }

    isStuck() {
        // Verifica se não está se movendo
        const moved = Math.sqrt(
            Math.pow(this.x - this.lastX, 2) + 
            Math.pow(this.y - this.lastY, 2)
        ) < 1;

        if (moved) {
            this.stuckTime += 16; // ~16ms por frame
        } else {
            this.stuckTime = 0;
            this.lastX = this.x;
            this.lastY = this.y;
        }

        return this.stuckTime > this.maxStuckTime;
    }

    findAlternativePath() {
        // Tenta se afastar do jogador temporariamente para desencalhar
        const directions = [
            {x: 1, y: 0},  // direita
            {x: -1, y: 0}, // esquerda
            {x: 0, y: 1},  // baixo
            {x: 0, y: -1}  // cima
        ];

        // Escolhe uma direção aleatória que não leve diretamente para uma parede
        const validDirections = directions.filter(dir => {
            const testX = this.x + dir.x * TILE_SIZE;
            const testY = this.y + dir.y * TILE_SIZE;
            return !this.checkWallCollision(testX, testY);
        });

        if (validDirections.length > 0) {
            const dir = validDirections[Math.floor(Math.random() * validDirections.length)];
            this.move(dir.x, dir.y);
        }

        this.stuckTime = 0;
        this.updatePathToPlayer();
    }

    checkWallCollision(x, y) {
        const testRect = {
            x: x,
            y: y,
            width: this.width,
            height: this.height
        };

        for (let wall of walls) {
            if (this.checkCollision(testRect, wall)) {
                return true;
            }
        }
        return false;
    }

    updatePathToPlayer() {
        // Implementação simples de pathfinding - versão otimizada
        this.currentPath = this.simplePathfinding();
    }

    simplePathfinding() {
        // Pathfinding simplificado - evita paredes mas não calcula caminho completo
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Tenta mover no eixo com maior diferença
        if (absDx > absDy) {
            const dirX = dx > 0 ? 1 : -1;
            if (!this.checkWallCollision(this.x + dirX * TILE_SIZE, this.y)) {
                return [{x: dirX, y: 0}];
            } else if (!this.checkWallCollision(this.x, this.y + (dy > 0 ? 1 : -1) * TILE_SIZE)) {
                return [{x: 0, y: dy > 0 ? 1 : -1}];
            }
        } else {
            const dirY = dy > 0 ? 1 : -1;
            if (!this.checkWallCollision(this.x, this.y + dirY * TILE_SIZE)) {
                return [{x: 0, y: dirY}];
            } else if (!this.checkWallCollision(this.x + (dx > 0 ? 1 : -1) * TILE_SIZE, this.y)) {
                return [{x: dx > 0 ? 1 : -1, y: 0}];
            }
        }

        // Se ambos os eixos principais estão bloqueados, tenta alternativas
        const directions = [
            {x: 1, y: 0},  // direita
            {x: -1, y: 0}, // esquerda
            {x: 0, y: 1},  // baixo
            {x: 0, y: -1}  // cima
        ];

        for (let dir of directions) {
            if (!this.checkWallCollision(this.x + dir.x * TILE_SIZE, this.y + dir.y * TILE_SIZE)) {
                return [dir];
            }
        }

        // Se completamente preso, não se move
        return [];
    }

    followPathOrDirect() {
        if (this.currentPath.length > 0) {
            // Segue o caminho calculado
            const nextStep = this.currentPath[0];
            this.move(Math.round(nextStep.x * this.speedMultiplier), Math.round(nextStep.y * this.speedMultiplier));
        } else {
            // Tenta ir direto ao jogador (para casos sem obstáculos)
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dirX = dx > 0 ? 1 : -1;
            const dirY = dy > 0 ? 1 : -1;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.move(Math.round(dirX * this.speedMultiplier), 0);
            } else {
                this.move(0, Math.round(dirY * this.speedMultiplier));
            }
        }

        // Atualiza a direção visual
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (dx > 0) this.direction = DIRECTIONS.RIGHT;
        else if (dx < 0) this.direction = DIRECTIONS.LEFT;
        else if (dy > 0) this.direction = DIRECTIONS.DOWN;
        else if (dy < 0) this.direction = DIRECTIONS.UP;
    }

    explode() {
        // Cria uma grande explosão
        explosions.push(new Explosion(this.x, this.y, this.explosionRadius / 2, 60));
        
        // Remove este inimigo
        const index = enemies.indexOf(this);
        if (index !== -1) {
            enemies.splice(index, 1);
        }

        // Verifica se atingiu o jogador
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.explosionRadius) {
                if (player.takeDamage()) { // Verifica escudo primeiro
                    if (!player.isInvulnerable) {
                        lives -= this.damage;
                        updateUI();
                        
                        if (lives <= 0) {
                            endGame();
                        } else {
                            player.startInvulnerability();
                        }
                    }
                }
            }
        }

        updateUI();
    }

    draw() {
        // Desenha diferente dos tanques normais
        if (DEBUG_MODE) {
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = this.hasDetectedPlayer ? '#f006' : '#0f06';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 
                   this.viewRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Desenha o círculo de vida primeiro (para ficar atrás do inimigo)
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Círculo de fundo (cinza)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.width - 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // Círculo de vida (cheio sempre, muda cor conforme a saúde)
        let lifeColor;
        if (this.health === 3) {
            lifeColor = '#2fff00'; // Verde
        } else if (this.health === 2) {
            lifeColor = '#ffffff'; // Laranja
        } else {
            lifeColor = '#ff0000'; // Vermelho
        }
        
        ctx.strokeStyle = lifeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.width - 10, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();

        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.direction.angle);
        
        // Corpo circular (diferente dos tanques retangulares)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos para indicar direção
        ctx.fillStyle = '#f06d2b';
        ctx.beginPath();
        ctx.arc(0, 0, this.width/3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(0, 0, this.width/6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class LaserTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.health = 3;
        this.maxHealth = this.health;
        this.lastShot = 0;
        this.shootCooldown = 2000; // Atira a cada 2 segundos
        this.color = '#8a2be2'; // Roxo para diferenciar
        this.activeColor = '#ff00ff';
        this.viewRadius = 250; // Raio de visão
        this.active = false; // Começa inativo
        this.activationTime = 0;
        this.cooldownAfterLosingSight = 1000; // Tempo que fica ativo depois de perder visão
    }

    freeze(duration) {
        this.isFrozen = true;
        this.frozenUntil = Date.now() + duration;
        
        // Efeito visual temporário
        this.originalColor = this.color;
        this.originalActiveColor = this.activeColor;
        this.color = '#00a8ff';
        this.activeColor = '#00a8ff';
        
        // Restaura após o tempo
        setTimeout(() => {
            this.isFrozen = false;
            this.color = this.originalColor;
            this.activeColor = this.originalActiveColor;
        }, duration);
    }

    checkPlayerInSight() {
        if (!player) return false;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Verifica se está dentro do raio de visão
        if (distance > this.viewRadius) {
            return false;
        }

        // Verifica linha de visão (sem paredes no caminho)
        const testRect = {
            x: this.x + this.width/2 - 2,
            y: this.y + this.height/2 - 2,
            width: 4,
            height: 4
        };
        
        const steps = Math.ceil(distance / 5);
        
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            testRect.x = this.x + this.width/2 - 2 + dx * t;
            testRect.y = this.y + this.height/2 - 2 + dy * t;
            
            for (let wall of walls) {
                if (this.checkCollision(testRect, wall)) {
                    return false; // Parede no caminho
                }
            }
        }
        
        return true; // Jogador visível
    }

    update() {
        const now = Date.now();
        const canSeePlayer = this.checkPlayerInSight();

        if (this.isFrozen) {
            if (Date.now() > this.frozenUntil) {
                this.isFrozen = false;
                this.color = this.originalColor;
            }
            return; // Não faz nada se estiver congelado
        }
        
        // Ativa/desativa com base na visão do jogador
        if (canSeePlayer) {
            this.active = true;
            this.activationTime = now;
        } else if (now - this.activationTime > this.cooldownAfterLosingSight) {
            this.active = false;
        }

        // Só atira se estiver ativo
        if (this.active && now - this.lastShot > this.shootCooldown) {
            this.shoot();
            this.lastShot = now;
        }
    }

    shoot() {
        // Cria 4 lasers (um para cada direção)
        const centerX = this.x + this.width/2 - 2;
        const centerY = this.y + this.height/2 - 2;
        
        bullets.push(new Bullet(centerX, centerY, DIRECTIONS.UP, false, true));
        bullets.push(new Bullet(centerX, centerY, DIRECTIONS.DOWN, false, true));
        bullets.push(new Bullet(centerX, centerY, DIRECTIONS.LEFT, false, true));
        bullets.push(new Bullet(centerX, centerY, DIRECTIONS.RIGHT, false, true));
    }

    takeDamage() {
        this.health--;
        explosions.push(new Explosion(this.x, this.y));
        if (this.health <= 0) {
            const index = enemies.indexOf(this);
            if (index !== -1) {
                enemies.splice(index, 1);
                score += 200;
                updateUI();
            }
        }
    }

    draw() {
        // Base da torre
        ctx.fillStyle = this.active ? this.activeColor : this.color; // Muda de cor quando ativo
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Detalhes da torre
        ctx.fillStyle = this.active ? '#cc00cc' : '#6a0dad';
        ctx.fillRect(this.x + 3, this.y + 3, this.width - 6, this.height - 6);
        
        // Canhões (um em cada direção)
        ctx.fillStyle = this.active ? '#990099' : '#483d8b';
        // Canhão norte
        ctx.fillRect(this.x + this.width/2 - 2, this.y - 4, 4, 4);
        // Canhão sul
        ctx.fillRect(this.x + this.width/2 - 2, this.y + this.height, 4, 4);
        // Canhão leste
        ctx.fillRect(this.x + this.width, this.y + this.height/2 - 2, 4, 4);
        // Canhão oeste
        ctx.fillRect(this.x - 4, this.y + this.height/2 - 2, 4, 4);
        
        // Indicador de vida
        const totalWidth = this.health * 3 + (this.health - 1) * 2; // 3px cada + 2px espaçamento
        const startX = this.x + (this.width - totalWidth) / 2;

        ctx.fillStyle = 'red';
        for (let i = 0; i < this.health; i++) {
            ctx.fillRect(
                startX + (i * 5), // 3px + 2px espaçamento
                this.y + this.height - 5, 
                3, 
                3
            );
        }

        // Desenha o raio de visão no modo debug
        if (DEBUG_MODE) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = this.active ? '#f00' : '#0f0';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 
                   this.viewRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}

class FortressTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE * 1.5;
        this.height = TILE_SIZE * 1.5;
        this.health = 5; // Agora são 5 vidas reais
        this.maxHealth = 5;
        this.shootCooldown = 0;
        this.shootInterval = 1500;
        this.rotationAngle = 0;
        this.rotationSpeed = 0.02;
        this.coreColor = '#8B0000';
        this.lastHitTime = 0;
        this.hitCooldown = 100; // Pequeno cooldown entre hits
    }

    freeze(duration) {
        this.isFrozen = true;
        this.frozenUntil = Date.now() + duration;
        
        // Efeito visual temporário
        this.originalColor = this.coreColor;
        this.coreColor = '#00a8ff';
        
        // Restaura após o tempo
        setTimeout(() => {
            this.isFrozen = false;
            this.coreColor = this.originalColor;
        }, duration);
    }

    update() {
        if (this.isFrozen) {
            if (Date.now() > this.frozenUntil) {
                this.isFrozen = false;
                this.color = this.originalColor;
            }
            return; // Não faz nada se estiver congelado
        }

        this.rotationAngle += this.rotationSpeed;

        if (this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.shootInterval;
        } else {
            this.shootCooldown -= 16;
        }
    }

    shoot() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        for (let i = 0; i < 4; i++) {
            const angle = this.rotationAngle + (i * Math.PI / 2);
            const direction = {
                x: Math.cos(angle),
                y: Math.sin(angle),
                angle: angle
            };
            bullets.push(new Bullet(centerX - 2, centerY - 2, direction, false));
        }
    }

    takeDamage() {
        const now = Date.now();
        if (now - this.lastHitTime < this.hitCooldown) return false;
        
        this.lastHitTime = now;
        this.health--;
        
        // Efeito visual quando atingido
        explosions.push(new Explosion(
            this.x + this.width/2 - 10,
            this.y + this.height/2 - 10
        ));
        
        if (this.health <= 0) {
            score += 300;
            updateUI();
            return true; // Inimigo destruído
        }
        
        return false; // Inimigo atingido mas não destruído
    }

    draw() {
        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotationAngle);
        
        // Núcleo com indicador de vida
        ctx.fillStyle = this.coreColor;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Barra de vida (ao redor do núcleo)
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, (this.health / this.maxHealth) * Math.PI * 2);
        ctx.stroke();
        
        // Canhões
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI/2);
            ctx.fillStyle = '#555';
            ctx.fillRect(20, -3, 15, 6);
            ctx.restore();
        }
        
        ctx.restore();
    }
}

class MachineGunTower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.health = 2;
        this.maxHealth = this.health;
        this.lastShot = 0;
        this.shootCooldown = 100; // Dispara muito mais rápido que outros inimigos
        this.burstCount = 0;
        this.maxBurst = 8; // Número de tiros em cada rajada
        this.burstCooldown = 0;
        this.burstInterval = 1500; // Tempo entre rajadas
        this.viewRadius = 300; // Raio de visão
        this.active = false;
        this.activationTime = 0;
        this.cooldownAfterLosingSight = 1000; // Tempo que fica ativo depois de perder visão
        this.color = '#ff5722'; // Cor laranja
        this.activeColor = '#ff7043';
    }

    freeze(duration) {
        this.isFrozen = true;
        this.frozenUntil = Date.now() + duration;
        
        // Efeito visual temporário
        this.originalColor = this.color;
        this.originalActiveColor = this.activeColor;
        this.color = '#00a8ff';
        this.activeColor = '#00a8ff';
        
        // Restaura após o tempo
        setTimeout(() => {
            this.isFrozen = false;
            this.color = this.originalColor;
            this.activeColor = this.originalActiveColor;
        }, duration);
    }

    checkPlayerInSight() {
        if (!player) return false;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Verifica se está dentro do raio de visão
        if (distance > this.viewRadius) {
            return false;
        }

        // Verifica linha de visão (sem paredes no caminho)
        const testRect = {
            x: this.x + this.width/2 - 2,
            y: this.y + this.height/2 - 2,
            width: 4,
            height: 4
        };
        
        const steps = Math.ceil(distance / 5);
        
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            testRect.x = this.x + this.width/2 - 2 + dx * t;
            testRect.y = this.y + this.height/2 - 2 + dy * t;
            
            for (let wall of walls) {
                if (this.checkCollision(testRect, wall)) {
                    return false; // Parede no caminho
                }
            }
        }
        
        return true; // Jogador visível
    }

    update() {
        const now = Date.now();
        const canSeePlayer = this.checkPlayerInSight();

        if (this.isFrozen) {
            if (Date.now() > this.frozenUntil) {
                this.isFrozen = false;
                this.color = this.originalColor;
            }
            return; // Não faz nada se estiver congelado
        }
        
        // Ativa/desativa com base na visão do jogador
        if (canSeePlayer) {
            this.active = true;
            this.activationTime = now;
        } else if (now - this.activationTime > this.cooldownAfterLosingSight) {
            this.active = false;
            this.burstCount = 0; // Reseta a rajada se perder visão
        }

        // Só atira se estiver ativo
        if (this.active) {
            if (this.burstCount < this.maxBurst) {
                // Dentro de uma rajada
                if (now - this.lastShot > this.shootCooldown) {
                    this.shoot();
                    this.lastShot = now;
                    this.burstCount++;
                }
            } else {
                // Entre rajadas
                if (now - this.lastShot > this.burstInterval) {
                    this.burstCount = 0; // Reseta para começar nova rajada
                }
            }
        }
    }

    shoot() {
        if (!player) return;
        
        // Calcula direção para o jogador
        const dx = player.x + player.width/2 - (this.x + this.width/2);
        const dy = player.y + player.height/2 - (this.y + this.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const direction = {
                x: dx / distance,
                y: dy / distance,
                angle: Math.atan2(dy, dx)
            };
            
            const bulletX = this.x + this.width/2 - 2;
            const bulletY = this.y + this.height/2 - 2;
            
            // Cria balas com pequena variação de direção para parecer uma metralhadora
            const spreadAngle = (Math.random() - 0.5) * 0.2; // Pequena variação aleatória
            const spreadDirection = {
                x: Math.cos(direction.angle + spreadAngle),
                y: Math.sin(direction.angle + spreadAngle),
                angle: direction.angle + spreadAngle
            };
            
            bullets.push(new Bullet(bulletX, bulletY, spreadDirection, false));
        }
    }

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            explosions.push(new Explosion(this.x, this.y));
            const index = enemies.indexOf(this);
            if (index !== -1) {
                enemies.splice(index, 1);
                score += 175; // Pontuação intermediária
                updateUI();
            }
        }
    }

    draw() {
        // Base da torre
        ctx.fillStyle = this.active ? this.activeColor : this.color; // Muda de cor quando ativo
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Detalhes da torre
        ctx.fillStyle = this.active ? '#e64a19' : '#bf360c';
        ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
        
        if (this.active && player && !this.isFrozen) {
            // Canhão (aponta para o jogador quando ativo)
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            const angle = Math.atan2(
                player.y + player.height/2 - (this.y + this.height/2),
                player.x + player.width/2 - (this.x + this.width/2)
            );
            ctx.rotate(angle);
        }
        
        ctx.fillStyle = '#795548';
        ctx.fillRect(0, -3, 15, 6); // Canhão mais longo que o normal
        
        ctx.restore();
        
        // Indicador de vida
        const centerX = this.x + this.width/2;
        const centerY = this.y + 10;
        const radius = 5;

        // Fundo do medidor
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();

        // Vida atual
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * (this.health/2)));
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.health > 1 ? '#0f0' : '#f00';
        ctx.stroke();

        // Desenha o raio de visão no modo debug
        if (DEBUG_MODE) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = this.active ? '#f00' : '#0f0';
            ctx.beginPath();
            ctx.arc(
                this.x + this.width/2, 
                this.y + this.height/2, 
                this.viewRadius, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}

class AreaBombEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 300;
        this.growthSpeed = 5; // Reduzi de 10 para 5 (mais lento)
        this.life = 90;       // Aumentei o tempo de vida para 90 frames (era 60)
        this.maxLife = 90;
        this.particles = [];
        this.expansionComplete = false;
    }
    
    update() {
        // Expande o raio até atingir o máximo
        if (this.radius < this.maxRadius) {
            this.radius += this.growthSpeed;
            
            // Reduz a velocidade conforme se aproxima do raio máximo
            // Isso cria um efeito de desaceleração
            const remaining = this.maxRadius - this.radius;
            if (remaining < 100) {
                this.growthSpeed = Math.max(1, remaining / 20);
            }
        } else {
            this.expansionComplete = true;
        }
        
        // Cria partículas apenas durante a expansão
        if (!this.expansionComplete && Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * this.radius;
            this.particles.push({
                x: this.x + Math.cos(angle) * dist,
                y: this.y + Math.sin(angle) * dist,
                size: 2 + Math.random() * 4,
                life: 20 + Math.random() * 20,
                speed: 0.5 + Math.random() * 2 // Adiciona movimento às partículas
            });
        }
        
        // Atualiza partículas (com movimento radial)
        this.particles = this.particles.filter(p => {
            p.life--;
            
            // Move as partículas para fora radialmente
            if (!this.expansionComplete) {
                const angle = Math.atan2(p.y - this.y, p.x - this.x);
                p.x += Math.cos(angle) * p.speed;
                p.y += Math.sin(angle) * p.speed;
            }
            
            return p.life > 0;
        });
        
        this.life--;
        return this.life > 0 || !this.expansionComplete;
    }
    
    draw() {
        // Desenha o círculo principal com transparência variável
        const expansionProgress = Math.min(1, this.radius / this.maxRadius);
        const fadeProgress = this.life / this.maxLife;
        const alpha = expansionProgress * fadeProgress * 0.8;
        
        ctx.save();
        
        // Gradiente para o círculo de plasma
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius * 0.3,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, `rgba(255, 100, 0, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 200, 0, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Desenha partículas
        this.particles.forEach(p => {
            const pAlpha = p.life / 40 * fadeProgress;
            ctx.fillStyle = `rgba(255, ${150 + Math.random() * 105}, 0, ${pAlpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Borda brilhante (mais intensa durante a expansão)
        if (!this.expansionComplete) {
            ctx.strokeStyle = `rgba(255, 200, 0, ${alpha * 0.7})`;
            ctx.lineWidth = 3 + 2 * Math.sin(Date.now() / 100); // Efeito pulsante
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, direction, isPlayerBullet, isLaser = false) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 4;
        this.direction = direction;
        this.speed = BULLET_SPEED;
        this.isPlayerBullet = isPlayerBullet;
        this.isLaser = isLaser;
        this.life = isLaser ? 60 : Infinity; // Laser desaparece após um tempo
    }
    
    update() {
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;

        if (this.isLaser) {
            this.life--;
            if (this.life <= 0) return false;
        }
        
        // Check boundaries
        if (this.x < 0 || this.x > canvas.width || 
            this.y < 0 || this.y > canvas.height) {
            return false;
        }
        
        // Check wall collisions
        for (let i = walls.length - 1; i >= 0; i--) {
            if (this.checkCollision(this, walls[i])) {
                if (walls[i] instanceof ReinforcedWall) {
                    if (walls[i].takeHit()) { // Retorna true se a parede deve ser destruída
                        explosions.push(new Explosion(walls[i].x, walls[i].y));
                        walls.splice(i, 1);
                    } else {
                        // Mostra efeito visual do hit sem destruir a parede
                        explosions.push(new Explosion(
                            walls[i].x + walls[i].width/2 - 10,
                            walls[i].y + walls[i].height/2 - 10,
                            15, 10
                        ));
                    }
                    return false;
                }
                // Só destrói se a parede for destrutível
                else if (walls[i].isDestructible) {
                    explosions.push(new Explosion(walls[i].x, walls[i].y));
                    walls.splice(i, 1);
                } else {
                    explosions.push(new Explosion(walls[i].x, walls[i].y));
                }
                return false;
            }
        }
        
        // Check tank collisions
        if (this.isPlayerBullet) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                if (this.checkCollision(this, enemies[i])) {
                    const enemy = enemies[i];
                    if (enemy instanceof BossEnemy) {
                        if (enemy.hasShield) {
                            // Apenas registra o hit no escudo
                            enemy.takeDamage(this);
                            explosions.push(new Explosion(enemy.x + 5, enemy.y + 5, 15, 10));
                        } else {
                            // Causa dano direto no boss sem escudo
                            enemy.health--;
                            explosions.push(new Explosion(enemy.x + 5, enemy.y + 5, 30, 15));
                            if (enemy.health <= 0) {
                                enemies.splice(i, 1);
                                score += 1000;
                            }
                        }
                        updateUI();
                        return false;
                    } else if (enemy instanceof FortressTank) {
                        if (enemy.takeDamage()) { // Só remove se retornar true
                            enemies.splice(i, 1);
                            score += 300;
                        }
                    } else if (enemies[i] instanceof LaserTower) {
                        if (enemies[i].takeDamage()) {
                            enemies.splice(i, 1);
                            score += 200; // Pontuação maior para inimigo teleguiado
                        }
                    } else if (enemies[i] instanceof GuidedEnemy) {
                        enemies[i].health--; // Reduz a vida do inimigo teleguiado
                        explosions.push(new Explosion(enemies[i].x, enemies[i].y));
                        if (enemies[i].health <= 0) {
                            enemies.splice(i, 1);
                            score += 150; // Pontuação maior para inimigo teleguiado
                        }
                    } else {
                        enemies[i].health--;
                        explosions.push(new Explosion(enemies[i].x, enemies[i].y));
                        if (enemies[i].health <= 0) {
                            enemies.splice(i, 1);
                            score += 100;
                        }
                    }
                    updateUI();
                    return false;
                }
            }
        } else {
            if (this.checkCollision(this, player)) {
                if (player.takeDamage()) { // Se takeDamage retornar true (sem escudo)
                    if (!player.isInvulnerable) {
                        explosions.push(new Explosion(player.x, player.y));
                        lives--;
                        updateUI();

                        if (lives <= 0) {
                            endGame();
                        } else {
                            player.startInvulnerability();
                        }
                    }
                }
                return false; // A bala sempre é destruída, independente do escudo
            }
        }
        
        return true;
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    draw() {
        if (this.isLaser) {
            // Desenho do laser (mais brilhante e colorido)
            ctx.fillStyle = this.isPlayerBullet ? '#00ffff' : '#ff00ff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Efeito de brilho
            ctx.fillStyle = this.isPlayerBullet ? '#00ffff88' : '#ff00ff88';
            ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        } else {
            // Código original de desenho de balas normais
            ctx.fillStyle = this.isPlayerBullet ? '#ff0' : '#f44';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.fillStyle = this.isPlayerBullet ? '#ff06' : '#f446';
            ctx.fillRect(this.x - this.direction.x * 8, this.y - this.direction.y * 8, 
                       this.width, this.height);
        }
    }
}

class FreezeBullet extends Bullet {
    constructor(x, y, direction, isPlayerBullet, freezeDuration) {
        super(x, y, direction, isPlayerBullet);
        this.width = 6;
        this.height = 6;
        this.color = '#00a8ff';
        this.freezeDuration = freezeDuration;
        this.speed = BULLET_SPEED * 1.2; // Um pouco mais rápido que o normal
    }
    
    update() {
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;
        
        // Check boundaries
        if (this.x < 0 || this.x > canvas.width || 
            this.y < 0 || this.y > canvas.height) {
            return false;
        }
        
        // Check wall collisions
        for (let i = walls.length - 1; i >= 0; i--) {
            if (this.checkCollision(this, walls[i])) {
                explosions.push(new FreezeExplosion(walls[i].x, walls[i].y));
                return false;
            }
        }
        
        // Check enemy collisions
        if (this.isPlayerBullet) {
            for (let enemy of enemies) {
                if (this.checkCollision(this, enemy)) {
                    enemy.freeze(this.freezeDuration);
                    explosions.push(new FreezeExplosion(enemy.x, enemy.y));
                    return false;
                }
            }
        }
        
        return true;
    }
    
    draw() {
        // Projétil com efeito de gelo
        ctx.save();
        
        // Núcleo
        ctx.fillStyle = '#00a8ff';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Aura
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width, 0, Math.PI * 2);
        ctx.stroke();
        
        // Efeito de cristais de gelo
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI/2 + Date.now()/500;
            const dist = this.width * 0.8;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y + this.height/2);
            ctx.lineTo(
                this.x + this.width/2 + Math.cos(angle) * dist,
                this.y + this.height/2 + Math.sin(angle) * dist
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class FreezeExplosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.maxSize = 40;
        this.life = 40;
        this.maxLife = 40;
    }
    
    update() {
        this.life--;
        this.size = (this.maxSize * (this.maxLife - this.life)) / this.maxLife;
        return this.life > 0;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Efeito de gelo
        ctx.fillStyle = '#00a8ff';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Padrão de cristal
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI/3;
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y + 10);
            ctx.lineTo(
                this.x + 10 + Math.cos(angle) * this.size,
                this.y + 10 + Math.sin(angle) * this.size
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class HealerEnemy extends Tank {
    constructor(x, y) {
        super(x, y, '#00ffaa', false); // Cor verde-água para diferenciar
        this.health = 2; // Vida moderada
        this.healRadius = 150; // Raio de cura em pixels
        this.healAmount = 1; // Quantidade de vida curada
        this.healCooldown = 0; // Tempo até poder curar novamente
        this.healInterval = 3000; // 3 segundos entre curas
        this.lastHealTime = 0;
        this.viewRadius = 200; // Raio de visão para detectar aliados feridos
    }

    update() {
        super.update(); // Mantém o comportamento básico de movimento

        const now = Date.now();
        
        // Verifica se pode curar
        if (now - this.lastHealTime > this.healInterval) {
            this.healAllies();
            this.lastHealTime = now;
        }
    }

    healAllies() {
        // Encontra aliados feridos dentro do raio de cura
        const injuredAllies = enemies.filter(enemy => {
            // Não se cura a si mesmo e verifica se está no raio
            return enemy !== this && 
                   this.distanceTo(enemy) <= this.healRadius &&
                   enemy.health < enemy.maxHealth;
        });

        // Cura cada aliado encontrado
        injuredAllies.forEach(ally => {
            ally.health = Math.min(ally.health + this.healAmount, ally.maxHealth);
            
            // Efeito visual de cura
            explosions.push(new HealEffect(
                ally.x + ally.width/2 - 10,
                ally.y + ally.height/2 - 10
            ));
        });

        // Se curou alguém, mostra efeito no próprio curador também
        if (injuredAllies.length > 0) {
            explosions.push(new HealEffect(
                this.x + this.width/2 - 10,
                this.y + this.height/2 - 10,
                25
            ));
        }
    }

    distanceTo(other) {
        const dx = other.x + other.width/2 - (this.x + this.width/2);
        const dy = other.y + other.height/2 - (this.y + this.height/2);
        return Math.sqrt(dx * dx + dy * dy);
    }

    draw() {
        // Desenho base do tanque
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.direction.angle);
        
        // Corpo (verde-água)
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Símbolo médico (cruz branca)
        ctx.fillStyle = '#fff';
        ctx.fillRect(-4, -8, 8, 16); // Parte vertical
        ctx.fillRect(-8, -4, 16, 8); // Parte horizontal
        
        ctx.restore();

        // Debug: mostra raio de cura
        if (DEBUG_MODE) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#0f0';
            ctx.beginPath();
            ctx.arc(
                this.x + this.width/2, 
                this.y + this.height/2, 
                this.healRadius, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }
    }
}

class HealEffect {
    constructor(x, y, size = 20) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.life = 30;
        this.maxLife = 30;
    }
    
    update() {
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        const currentSize = this.size * (1 + (1 - alpha)); // Cresce ao sumir
        
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        
        // Círculo de cura (verde brilhante)
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, currentSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Partículas
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = currentSize/2 * Math.random();
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(
                this.x + 10 + Math.cos(angle) * dist,
                this.y + 10 + Math.sin(angle) * dist,
                2 + Math.random() * 3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class WallTurret {
    constructor(x, y) {
        // Posição e tamanho
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        
        // Atributos de combate
        this.health = 3;
        this.maxHealth = 3;
        this.lastShot = 0;
        this.shootCooldown = 1500; // 1.5 segundos entre tiros
        this.active = false; // Estado de detecção do jogador
        
        // Cores
        this.normalColor = "#8f00ff";   // Roxo normal
        this.activeColor = "#ff00ff";   // Rosa quando ativo
        this.currentColor = this.normalColor;
    }

    freeze(duration) {
        this.isFrozen = true;
        this.frozenUntil = Date.now() + duration;
        
        // Efeito visual temporário
        this.originalColor = this.currentColor;
        this.originalActiveColor = this.activeColor;
        this.currentColor = '#00a8ff';
        this.activeColor = '#00a8ff';
        
        // Restaura após o tempo
        setTimeout(() => {
            this.isFrozen = false;
            this.currentColor = this.originalColor;
            this.activeColor = this.originalActiveColor;
        }, duration);
    }

    update() {
        const now = Date.now();
        this.active = this.canSeePlayer(); // Atualiza estado de detecção

        if (this.isFrozen) {
            if (Date.now() > this.frozenUntil) {
                this.isFrozen = false;
                this.color = this.originalColor;
            }
            return; // Não faz nada se estiver congelado
        }
        
        // Muda a cor baseado no estado
        this.currentColor = this.active ? this.activeColor : this.normalColor;
        
        // Só atira se estiver ativo e o cooldown acabou
        if (this.active && now - this.lastShot >= this.shootCooldown) {
            this.shootAtPlayer();
            this.lastShot = now;
        }
    }

    canSeePlayer() {
        if (!player) return false;

        // Calcula direção para o jogador
        const dx = player.x + player.width/2 - (this.x + this.width/2);
        const dy = player.y + player.height/2 - (this.y + this.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Testa colisão ao longo da linha de visão
        const testRect = { x: 0, y: 0, width: 4, height: 4 };
        const steps = Math.ceil(distance / 5); // Verifica a cada 5 pixels

        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            testRect.x = this.x + this.width/2 + dx * t - 2;
            testRect.y = this.y + this.height/2 + dy * t - 2;

            // Verifica colisão com paredes
            for (let wall of walls) {
                if (this.checkCollision(testRect, wall)) {
                    return false; // Parede bloqueia a visão
                }
            }
        }
        return true; // Jogador visível
    }

    shootAtPlayer() {
        if (!player) return;
        
        // Calcula direção para o jogador
        const dx = player.x + player.width/2 - (this.x + this.width/2);
        const dy = player.y + player.height/2 - (this.y + this.height/2);
        const angle = Math.atan2(dy, dx);
        
        // Cria a bala um pouco à frente da torre
        const direction = { 
            x: Math.cos(angle), 
            y: Math.sin(angle), 
            angle 
        };
        
        const bulletX = this.x + this.width/2 - 2 + direction.x * 10;
        const bulletY = this.y + this.height/2 - 2 + direction.y * 10;
        
        bullets.push(new Bullet(bulletX, bulletY, direction, false)); // Bala inimiga
    }

    takeDamage() {
        this.health--;
        explosions.push(new Explosion(
            this.x + this.width/2 - 10,
            this.y + this.height/2 - 10,
            15, 10
        ));
        
        if (this.health <= 0) {
            // Adiciona pontos e remove a torre
            score += 125;
            updateUI();
            return true; // Indica que foi destruída
        }
        return false;
    }

    draw() {
        // Corpo principal
        ctx.fillStyle = this.currentColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Detalhes centrais
        ctx.fillStyle = this.active ? "#ffffff" : "#cccccc";
        ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
        
        // Indicador de saúde
        for (let i = 0; i < this.maxHealth; i++) {
            ctx.fillStyle = i < this.health ? "red" : "#333";
            ctx.fillRect(this.x + 4 + i * 4, this.y + this.height - 8, 4, 4);
        }
        
        // Canhão (aponta para o jogador quando ativo)
        if (this.active && player && !this.isFrozen) {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            const angle = Math.atan2(
                player.y + player.height/2 - (this.y + this.height/2),
                player.x + player.width/2 - (this.x + this.width/2)
            );
            ctx.rotate(angle);
            ctx.fillStyle = "#555";
            ctx.fillRect(0, -2, 12, 4);
            ctx.restore();
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}

class RicochetBullet extends Bullet {
    constructor(x, y, direction, isPlayerBullet) {
        super(x, y, direction, isPlayerBullet);
        this.width = 6;
        this.height = 6;
        this.color = '#00bcd4';
        this.maxBounces = 3;
        this.bounceCount = 0;
        this.particles = [];
        this.speed = BULLET_SPEED * 1.5;
        this.damage = 1;
        this.lastHitEnemy = null;  // Rastreia o último inimigo atingido
        this.hitCooldown = 0;      // Cooldown para evitar hits repetidos
        
        // Cria uma cópia independente da direção
        this.direction = {
            x: direction.x,
            y: direction.y,
            angle: direction.angle
        };
    }
    
    update() {
        if (!this.direction) {
            this.direction = { x: 1, y: 0, angle: 0 }; // Direção padrão se não existir
        }

        this.hitCooldown = Math.max(0, this.hitCooldown - 1);

        // Atualiza partículas do rastro
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => p.life--);
        
        // Adiciona nova partícula ao rastro
        if (Math.random() < 0.7) {
            this.particles.push({
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                size: 2 + Math.random() * 3,
                life: 10 + Math.random() * 10
            });
        }
        
        // Movimento normal
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;
        
        // Verifica colisão com paredes
        for (let i = walls.length - 1; i >= 0; i--) {
            if (this.checkCollision(this, walls[i])) {
                const wall = walls[i];
                const isLastBounce = this.bounceCount >= this.maxBounces;

                // Lógica de ricochete (sempre executa, mesmo no último)
                const overlapX = Math.min(
                    Math.abs(this.x + this.width - wall.x),
                    Math.abs(wall.x + wall.width - this.x)
                );
                const overlapY = Math.min(
                    Math.abs(this.y + this.height - wall.y),
                    Math.abs(wall.y + wall.height - this.y)
                );

                if (overlapX < overlapY) {
                    this.direction.x *= -1;
                } else {
                    this.direction.y *= -1;
                }
                this.direction.angle = Math.atan2(this.direction.y, this.direction.x);

                // Se for parede destrutível, causa dano (mesmo no último ricochete)
                if (wall.isDestructible) {
                    if (wall instanceof ReinforcedWall) {
                        explosions.push(new Explosion(wall.x, wall.y));
                        if (wall.takeHit()) {
                            walls.splice(i, 1);
                        }
                    } else {
                        explosions.push(new Explosion(wall.x, wall.y));
                        walls.splice(i, 1);
                    }
                } else {
                    explosions.push(new Explosion(wall.x, wall.y));
                }

                // Ajusta posição para evitar ficar preso
                this.x += this.direction.x * 2;
                this.y += this.direction.y * 2;

                // Incrementa o contador (só se não for o último)
                if (!isLastBounce) {
                    this.bounceCount++;
                }

                // Destrói a bala se for o último ricochete
                if (isLastBounce) {
                    return false;
                }
            }
        }
        
        // Verifica colisão com tanques (mesma lógica da classe Bullet)
        if (this.isPlayerBullet) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                
                // Ignora se for o mesmo inimigo recentemente atingido
                if (enemy === this.lastHitEnemy && this.hitCooldown > 0) {
                    continue;
                }

                if (this.checkCollision(this, enemy)) {
                    // Verificação especial para o Boss com escudo
                    if (enemy instanceof BossEnemy) {
                        if (enemy.hasShield) {
                            // Apenas registra o hit no escudo
                            enemy.takeDamage(this);
                            explosions.push(new Explosion(enemy.x + 5, enemy.y + 5, 15, 10));
                        } else {
                            // Causa dano direto no boss sem escudo
                            enemy.health--;
                            explosions.push(new Explosion(enemy.x + 5, enemy.y + 5, 30, 15));
                            if (enemy.health <= 0) {
                                enemies.splice(i, 1);
                                score += 1000;
                            }
                        }
                        updateUI();
                    } else {
                        // Para outros inimigos aplica dano
                        enemy.health--;
                        explosions.push(new Explosion(
                            enemy.x + enemy.width/2 - 10,
                            enemy.y + enemy.height/2 - 10,
                            15, 10
                        ));

                        // Verifica se destruiu o inimigo
                        if (enemy.health <= 0) {
                            enemies.splice(i, 1);
                            score += enemy instanceof GuidedEnemy ? 150 : 
                                   enemy instanceof LaserTower ? 200 :
                                   enemy instanceof FortressTank ? 300 : 
                                   enemy instanceof BossEnemy ? 1000 :
                                   100;
                            updateUI();
                        }

                        // Configura cooldown e último inimigo atingido
                        this.lastHitEnemy = enemy;
                        this.hitCooldown = 5;
                    }

                    // Lógica de ricochete (sempre executa, exceto se atingir maxBounces)
                    if (this.bounceCount >= this.maxBounces) return false;
                    
                    const overlapX = Math.min(
                        Math.abs(this.x + this.width - enemy.x),
                        Math.abs(enemy.x + enemy.width - this.x)
                    );
                    const overlapY = Math.min(
                        Math.abs(this.y + this.height - enemy.y),
                        Math.abs(enemy.y + enemy.height - this.y)
                    );
                    
                    if (overlapX < overlapY) {
                        this.direction.x *= -1;
                    } else {
                        this.direction.y *= -1;
                    }
                    
                    this.direction.angle = Math.atan2(this.direction.y, this.direction.x);
                    this.bounceCount++;
                    
                    // Ajusta posição para sair do hitbox
                    this.x += this.direction.x * 5;
                    this.y += this.direction.y * 5;
                    
                    break; // Sai do loop após o primeiro ricochete
                }
            }
        } else {
            // Colisão com jogador (comportamento original)
            if (this.checkCollision(this, player)) {
                if (player.takeDamage()) {
                    if (!player.isInvulnerable) {
                        explosions.push(new Explosion(player.x, player.y));
                        lives--;
                        updateUI();

                        if (lives <= 0) {
                            endGame();
                        } else {
                            player.startInvulnerability();
                        }
                    }
                }
                return false;
            }
        }
        
        // Verifica limites da tela
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            if (this.bounceCount >= this.maxBounces) {
                return false;
            }
            
            // Ricocheteia nas bordas da tela
            if (this.x < 0 || this.x > canvas.width) {
                this.direction.x *= -1;
            } else {
                this.direction.y *= -1;
            }
            this.direction.angle = Math.atan2(this.direction.y, this.direction.x);
            this.bounceCount++;
            
            // Ajusta posição
            this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
            this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
        }
        
        return true;
    }
    
    draw() {
        // Desenha partículas do rastro
        ctx.save();
        this.particles.forEach(p => {
            const alpha = p.life / 20;
            const particleSize = Math.max(0.1, p.size * (p.life / 20)); // Garante que o tamanho nunca seja negativo
            ctx.fillStyle = `rgba(0, 188, 212, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        
        // Restante do código de desenho permanece o mesmo
        ctx.save();
        
        // Núcleo brilhante
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2, 
            this.y + this.height/2, 
            Math.max(0.1, this.width/2), // Garante raio mínimo
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Aura elétrica
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2, 
            this.y + this.height/2, 
            Math.max(0.1, this.width/2 + 2), // Garante raio mínimo
            0, 
            Math.PI * 2
        );
        ctx.stroke();
        
        // Efeito de pulsação
        if (this.bounceCount > 0) {
            const pulse = 1 + 0.2 * Math.sin(Date.now() / 100);
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width/2, 
                this.y + this.height/2, 
                Math.max(0.1, (this.width/2 + 2) * pulse), // Garante raio mínimo
                0, 
                Math.PI * 2
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class MultiBullet extends Bullet {
    constructor(x, y, direction, isPlayerBullet, rangeMultiplier = 2) {
        super(x, y, direction, isPlayerBullet);
        this.width = 6;
        this.height = 6;
        this.speed = BULLET_SPEED * 1.2; // 20% mais rápido
        this.maxDistance = canvas.width * rangeMultiplier; // Alcance maior
        this.distanceTraveled = 0;
        this.color = '#9c27b0'; // Roxo para diferenciar
    }
    
    update() {
        const dx = this.direction.x * this.speed;
        const dy = this.direction.y * this.speed;
        this.x += dx;
        this.y += dy;
        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
        
        // Verifica se atingiu o alcance máximo
        if (this.distanceTraveled > this.maxDistance) {
            return false;
        }
        
        // Check boundaries
        if (this.x < 0 || this.x > canvas.width || 
            this.y < 0 || this.y > canvas.height) {
            return false;
        }
        
        // Check wall collisions (mesma lógica da classe Bullet)
        for (let i = walls.length - 1; i >= 0; i--) {
            if (this.checkCollision(this, walls[i])) {
                if (walls[i].isDestructible) {
                    explosions.push(new Explosion(walls[i].x, walls[i].y));
                    walls.splice(i, 1);
                }
                return false;
            }
        }
        
        // Check tank collisions (mesma lógica da classe Bullet)
        if (this.isPlayerBullet) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                if (this.checkCollision(this, enemies[i])) {
                    if (enemies[i] instanceof BossEnemy) {
                        if (enemies[i].hasShield) {
                            // Apenas registra o hit no escudo
                            enemies[i].takeDamage(this);
                            explosions.push(new Explosion(enemies[i].x + 5, enemies[i].y + 5, 15, 10));
                        } else {
                            // Causa dano direto no boss sem escudo
                            enemies[i].health--;
                            explosions.push(new Explosion(enemies[i].x + 5, enemies[i].y + 5, 30, 15));
                            if (enemies[i].health <= 0) {
                                enemies.splice(i, 1);
                                score += 1000;
                            }
                        }
                        updateUI();
                        return false;
                    } else if (enemies[i] instanceof FortressTank) {
                        if (enemies[i].takeDamage()) { // Passa a bala como parâmetro
                            enemies.splice(i, 1);
                            score += 300;
                        }
                    } else if (enemies[i] instanceof LaserTower) {
                        enemies[i].takeDamage();
                        explosions.push(new Explosion(enemies[i].x, enemies[i].y));
                    } else if (enemies[i] instanceof GuidedEnemy) {
                        enemies[i].health--;
                        explosions.push(new Explosion(enemies[i].x, enemies[i].y));
                        if (enemies[i].health <= 0) {
                            enemies.splice(i, 1);
                            score += 150;
                        }
                    } else {
                        enemies[i].health--;
                        explosions.push(new Explosion(enemies[i].x, enemies[i].y));
                        if (enemies[i].health <= 0) {
                            enemies.splice(i, 1);
                            score += 100;
                        }
                    }
                    updateUI();
                    return false;
                }
            }
        } else {
            if (this.checkCollision(this, player)) {
                if (player.takeDamage()) {
                    if (!player.isInvulnerable) {
                        explosions.push(new Explosion(player.x, player.y));
                        lives--;
                        updateUI();

                        if (lives <= 0) {
                            endGame();
                        } else {
                            player.startInvulnerability();
                        }
                    }
                }
                return false;
            }
        }
        
        return true;
    }
    
    draw() {
        // Projétil com efeito especial
        ctx.save();
        
        // Núcleo
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Aura
        ctx.fillStyle = this.color + '4';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width, 0, Math.PI * 2);
        ctx.fill();
        
        // Rastro
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y + this.height/2);
        ctx.lineTo(
            this.x + this.width/2 - this.direction.x * 15,
            this.y + this.height/2 - this.direction.y * 15
        );
        ctx.stroke();
        
        ctx.restore();
    }
}

class AttackDrone {
    constructor(x, y, owner) {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.size = 5;
        this.speed = 3;
        this.angle = 0;
        this.lastShot = 0;
        this.shootCooldown = 800;
        this.range = 200;
        this.spawnTime = Date.now();
        this.lifetime = player.droneActiveTime; // Usa o tempo definido no jogador
    }

    update() {
        // Verifica se o tempo acabou
        if (Date.now() - this.spawnTime > this.lifetime) {
            // Quando o drone expira, inicia o cooldown no jogador
            if (this.owner.drones.length === 1) { // Se este for o último drone
                this.owner.droneCooldown = this.owner.maxDroneCooldown;
            }
            return false; // Remove o drone
        }

        // Restante da lógica de movimento e tiro...
        const offsetX = 25 * Math.cos(this.angle);
        const offsetY = 25 * Math.sin(this.angle);
        this.angle += 0.05;

        const targetX = this.owner.x + this.owner.width/2 + offsetX;
        const targetY = this.owner.y + this.owner.height/2 + offsetY;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        const now = Date.now();
        if (now - this.lastShot > this.shootCooldown) {
            this.shoot();
            this.lastShot = now;
        }

        return true;
    }

    shoot() {
        if (!enemies.length) return;

        // Encontra o inimigo mais próximo
        let closestEnemy = null;
        let minDist = Infinity;

        enemies.forEach(enemy => {
            const dist = Math.sqrt(
                (enemy.x + enemy.width/2 - this.x) ** 2 + 
                (enemy.y + enemy.height/2 - this.y) ** 2
            );
            if (dist < this.range && dist < minDist) {
                minDist = dist;
                closestEnemy = enemy;
            }
        });

        if (closestEnemy) {
            const angle = Math.atan2(
                closestEnemy.y + closestEnemy.height/2 - this.y,
                closestEnemy.x + closestEnemy.width/2 - this.x
            );
            const direction = { x: Math.cos(angle), y: Math.sin(angle), angle };
            bullets.push(new Bullet(this.x, this.y, direction, true));
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Corpo do drone
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Detalhes
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

class Wall {
    constructor(x, y, width = TILE_SIZE, height = TILE_SIZE, isDestructible = true) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isDestructible = isDestructible;
    }
    
    draw() {
        if (this.isDestructible) {
            // Parede normal (destrutível)
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Padrão de tijolos
            ctx.strokeStyle = '#432';
            ctx.lineWidth = 1;
            for (let i = 0; i < this.width; i += 10) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y);
                ctx.lineTo(this.x + i, this.y + this.height);
                ctx.stroke();
            }
            for (let i = 0; i < this.height; i += 5) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + i);
                ctx.lineTo(this.x + this.width, this.y + i);
                ctx.stroke();
            }
        } else {
            // Parede de aço (indestrutível)
            ctx.fillStyle = '#777';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Padrão de metal
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            for (let i = 0; i < this.width; i += 10) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y);
                ctx.lineTo(this.x + i, this.y + this.height);
                ctx.stroke();
            }
            for (let i = 0; i < this.height; i += 10) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + i);
                ctx.lineTo(this.x + this.width, this.y + i);
                ctx.stroke();
            }
        }
    }
}

class ReinforcedWall extends Wall {
    constructor(x, y, width = TILE_SIZE, height = TILE_SIZE) {
        super(x, y, width, height, true); // Chama o construtor da classe pai
        this.hits = 0;
        this.maxHits = 2;
    }
    
    takeHit() {
        this.hits++;
        if (this.hits >= this.maxHits) {
            return true; // Parede deve ser destruída
        }
        return false; // Parede ainda está de pé
    }
    
    draw() {
        // Base da parede
        ctx.fillStyle = '#8B4513'; // Cor mais escura que a parede normal
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Padrão de tijolos
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 10) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i, this.y + this.height);
            ctx.stroke();
        }
        for (let i = 0; i < this.height; i += 5) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + i);
            ctx.lineTo(this.x + this.width, this.y + i);
            ctx.stroke();
        }
        
        // Mostra dano (rachaduras)
        if (this.hits > 0) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            // Rachadura 1
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y + 5);
            ctx.lineTo(this.x + 15, this.y + 15);
            ctx.stroke();
            // Rachadura 2
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - 5, this.y + 5);
            ctx.lineTo(this.x + this.width - 15, this.y + 15);
            ctx.stroke();
        }
    }
}

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 5;
        this.maxSize = 30;
        this.life = 30;
        this.maxLife = 30;
    }
    
    update() {
        this.life--;
        this.size = (this.maxSize * (this.maxLife - this.life)) / this.maxLife;
        return this.life > 0;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Explosion effect
        ctx.fillStyle = '#ff4500';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class TripleShotPowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.collected = false;
        this.animationFrame = 0;
        this.maxAnimationFrames = 30;
        this.duration = 10000; // 10 segundos em milissegundos
    }

    draw() {
        if (this.collected) return;

        ctx.save();
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        // Efeito de pulsação sutil
        const pulse = 0.9 + 0.1 * Math.sin(this.animationFrame * 0.2);
        ctx.translate(centerX, centerY);
        ctx.scale(pulse, pulse);
        ctx.translate(-centerX, -centerY);

        // Núcleo central (círculo amarelo)
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Contorno pulsante
        ctx.strokeStyle = `rgba(255, 200, 0, ${0.5 + pulse * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
        this.animationFrame = (this.animationFrame + 1) % this.maxAnimationFrames;
    }

    checkCollision(rect) {
        return !this.collected && 
               rect.x < this.x + this.width &&
               rect.x + rect.width > this.x &&
               rect.y < this.y + this.height &&
               rect.y + rect.height > this.y;
    }
}

class ImmunityPowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.collected = false;
        this.animationFrame = 0;
        this.maxAnimationFrames = 30;
        this.duration = 5000; // 5 segundos de imunidade
    }

    draw() {
        if (this.collected) return;

        ctx.save();
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        // Efeito de pulsação
        const pulse = 0.9 + 0.1 * Math.sin(this.animationFrame * 0.2);
        ctx.translate(centerX, centerY);
        ctx.scale(pulse, pulse);
        ctx.translate(-centerX, -centerY);

        // Núcleo (círculo branco)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Aura azul
        ctx.strokeStyle = '#00a8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
        this.animationFrame = (this.animationFrame + 1) % this.maxAnimationFrames;
    }

    checkCollision(rect) {
        return !this.collected && 
               rect.x < this.x + this.width &&
               rect.x + rect.width > this.x &&
               rect.y < this.y + this.height &&
               rect.y + rect.height > this.y;
    }
}

class HealthPack {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.collected = false;
        this.animationFrame = 0;
        this.maxAnimationFrames = 30;
    }
    
    draw() {
        if (this.collected) return;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Efeito de pulsação
        const scale = 0.9 + 0.1 * Math.sin(this.animationFrame * 0.2);
        ctx.scale(scale, scale);
        
        // Símbolo de cruz médica
        ctx.fillStyle = '#0f0';
        ctx.fillRect(-8, -3, 16, 6);
        ctx.fillRect(-3, -8, 6, 16);
        
        // Contorno branco
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, -3, 16, 6);
        ctx.strokeRect(-3, -8, 6, 16);
        
        ctx.restore();
        
        this.animationFrame = (this.animationFrame + 1) % this.maxAnimationFrames;
    }
    
    checkCollision(rect) {
        return !this.collected && 
               rect.x < this.x + this.width &&
               rect.x + rect.width > this.x &&
               rect.y < this.y + this.height &&
               rect.y + rect.height > this.y;
    }
}

class BossEnemy extends Tank {
    constructor(x, y) {
        super(x, y, '#ff0000', false); // Cor vermelha para o boss
        this.width = TILE_SIZE * 1.5; // 50% maior que um tanque normal
        this.height = TILE_SIZE * 1.5;
        this.health = 10; // Vida alta
        this.maxHealth = this.health;
        this.viewRadius = 400; // Visão maior
        this.sprintCooldown = 0;
        this.sprintDuration = 2000; // 2 segundos de sprint
        this.sprintSpeedMultiplier = 2; // Dobro de velocidade durante sprint
        this.normalSpeed = ENEMY_SPEED;
        this.sprintActive = false;
        this.sprintStartTime = 0;
        this.lastSpecialAttack = 0;
        this.specialAttackCooldown = 5000; // 5 segundos entre ataques especiais
        this.phase = 1; // Fases do boss (1-3)
        this.originalColor = '#ff0000';
        this.isBombImmune = true; // Imunidade a bombas
        this.hasShield = false;
        this.shieldHits = 0;
        this.maxShieldHits = 5; // Número de tiros necessários para quebrar o escudo
        this.shieldActiveTime = 5000; // 5 segundos de duração
        this.shieldCooldown = 10000; // 10 segundos de cooldown
        this.lastShieldActivation = 0;
    }

    update() {
        const now = Date.now();

        if (this.isFrozen) {
            if (Date.now() > this.frozenUntil) {
                this.isFrozen = false;
                this.color = this.originalColor;
            }
            return; // Não faz nada se estiver congelado
        }
        
        // Atualiza estado do sprint
        if (this.sprintActive && now - this.sprintStartTime > this.sprintDuration) {
            this.sprintActive = false;
            this.sprintCooldown = 3000;
            this.color = this.phase === 1 ? this.originalColor : 
                         this.phase === 2 ? '#ff6600' : '#990000';
        } else if (!this.sprintActive && this.sprintCooldown > 0) {
            this.sprintCooldown = Math.max(0, this.sprintCooldown - 16);
        }
        
        // Atualiza estado do escudo
        if (this.hasShield && now - this.lastShieldActivation > this.shieldActiveTime) {
            this.hasShield = false;
            this.shieldCooldown = this.shieldCooldown;
        } else if (!this.hasShield && this.shieldCooldown > 0) {
            this.shieldCooldown = Math.max(0, this.shieldCooldown - 16);
        }
        
        // Ativa habilidades aleatoriamente
        if (!this.sprintActive && this.sprintCooldown <= 0 && 
            (Math.random() < 0.005 || this.health < this.maxHealth / 2)) {
            this.activateSprint();
        }
        
        // Ativa escudo aleatoriamente ou quando a vida está baixa
        if (!this.hasShield && this.shieldCooldown <= 0 && 
            (Math.random() < 0.008 || this.health < this.maxHealth / 3)) {
            this.activateShield();
        }
        
        // Velocidade baseada no sprint
        this.speedMultiplier = this.sprintActive ? this.sprintSpeedMultiplier : 1;
        
        // Verifica mudança de fase
        this.checkPhaseChange();
        
        // Ataque especial periódico
        if (now - this.lastSpecialAttack > this.specialAttackCooldown) {
            this.specialAttack();
            this.lastSpecialAttack = now;
        }
        
        // Comportamento normal de tanque
        super.update();
    }
    
    activateShield() {
        this.hasShield = true;
        this.shieldHits = 0;
        this.lastShieldActivation = Date.now();
        // Efeito visual
        explosions.push(new BossShieldEffect(
            this.x + this.width/2,
            this.y + this.height/2,
            this.width * 1.2
        ));
    }
    
    activateSprint() {
        this.sprintActive = true;
        this.sprintStartTime = Date.now();
        // Guarda a cor atual antes de mudar para amarelo
        this.preSprintColor = this.color;
        this.color = '#ffff00';
    }
    
    checkPhaseChange() {
        // Fase 2 (50% de vida)
        if (this.phase === 1 && this.health <= this.maxHealth * 0.5) {
            this.phase = 2;
            this.specialAttackCooldown = 3000;
            // Só muda a cor se não estiver em sprint
            if (!this.sprintActive) {
                this.color = '#ff6600';
            }
            this.health = Math.min(this.maxHealth, this.health + 2);
        }
        // Fase 3 (25% de vida)
        else if (this.phase === 2 && this.health <= this.maxHealth * 0.25) {
            this.phase = 3;
            this.specialAttackCooldown = 2000;
            // Só muda a cor se não estiver em sprint
            if (!this.sprintActive) {
                this.color = '#990000';
            }
            this.activateSprint();
        }
    }
    
    specialAttack() {
        if (!player) return;
        
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        // Diferentes ataques baseados na fase
        switch(this.phase) {
            case 1:
                // Ataque em círculo (8 direções)
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI / 4);
                    const direction = {
                        x: Math.cos(angle),
                        y: Math.sin(angle),
                        angle: angle
                    };
                    bullets.push(new BossBullet(centerX - 5, centerY - 5, direction, false));
                }
                break;
                
            case 2:
                // Ataque em espiral
                for (let i = 0; i < 12; i++) {
                    const angle = (i * Math.PI / 6) + (Date.now() / 500);
                    const direction = {
                        x: Math.cos(angle),
                        y: Math.sin(angle),
                        angle: angle
                    };
                    bullets.push(new BossBullet(centerX - 5, centerY - 5, direction, false));
                }
                break;
                
            case 3:
                // Ataque direcionado ao jogador + círculo
                if (player) {
                    const angleToPlayer = Math.atan2(
                        player.y + player.height/2 - centerY,
                        player.x + player.width/2 - centerX
                    );
                    
                    // 3 tiros na direção do jogador
                    for (let i = -1; i <= 1; i++) {
                        const spread = i * 0.2; // Pequeno espalhamento
                        const direction = {
                            x: Math.cos(angleToPlayer + spread),
                            y: Math.sin(angleToPlayer + spread),
                            angle: angleToPlayer + spread
                        };
                        bullets.push(new BossBullet(centerX - 5, centerY - 5, direction, false));
                    }
                }
                
                // + 5 tiros em círculo
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2 / 5) + (Date.now() / 500);
                    const direction = {
                        x: Math.cos(angle),
                        y: Math.sin(angle),
                        angle: angle
                    };
                    bullets.push(new BossBullet(centerX - 5, centerY - 5, direction, false));
                }
                break;
        }
    }
    
    takeDamage(source) {
        // Verifica se o dano vem de uma bomba e o boss é imune
        if (this.isBombImmune && source instanceof AreaBombEffect) {
            return false;
        }
        
        // Se o escudo está ativo, conta os hits em vez de causar dano
        if (this.hasShield) {
            this.shieldHits++;
            explosions.push(new BossShieldHitEffect(
                this.x + this.width/2,
                this.y + this.height/2,
                this.width * 1.2
            ));
            
            // Verifica se o escudo foi quebrado
            if (this.shieldHits >= this.maxShieldHits) {
                this.hasShield = false;
                explosions.push(new BossShieldBreakEffect(
                    this.x + this.width/2,
                    this.y + this.height/2,
                    this.width * 1.5
                ));
            }
            return false;
        }
        
        // Se não há escudo, causa dano normalmente
        this.health--;
        if (this.health <= 0) {
            explosions.push(new Explosion(this.x, this.y, 100, 60));
            score += 1000;
            updateUI();
            return true;
        }
        return false;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.direction.angle);
        
        // Desenha o escudo se estiver ativo
        if (this.hasShield) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            
            // Gradiente para o escudo
            const gradient = ctx.createRadialGradient(
                0, 0, this.width * 0.5,
                0, 0, this.width * 0.8
            );
            gradient.addColorStop(0, 'rgba(0, 150, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 150, 255, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            // Efeito pulsante
            const pulse = 1 + 0.1 * Math.sin(Date.now() / 200);
            ctx.strokeStyle = '#00a8ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.8 * pulse, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        }
        
        // Tank body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Tank tracks
        ctx.fillStyle = '#444';
        ctx.fillRect(-this.width/2, -this.height/2 + 2, this.width, 3);
        ctx.fillRect(-this.width/2, this.height/2 - 5, this.width, 3);
        
        // Tank cannon
        ctx.fillStyle = '#666';
        ctx.fillRect(-2, -this.height/2 - 5, 4, 8);
        
        ctx.restore();
        
        // Barra de vida
        ctx.save();
        const barWidth = this.width;
        const barHeight = 5;
        const barX = this.x;
        const barY = this.y - 10;
        
        // Fundo da barra
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Vida atual
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        ctx.fillStyle = this.phase === 1 ? '#ff0000' : 
                        this.phase === 2 ? '#ff6600' : '#990000';
        ctx.fillRect(barX, barY, healthWidth, barHeight);
        
        // Borda
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Mostra o escudo se estiver ativo
        if (this.hasShield) {
            const shieldWidth = (1 - this.shieldHits / this.maxShieldHits) * barWidth;
            ctx.fillStyle = 'rgba(0, 150, 255, 0.5)';
            ctx.fillRect(barX, barY - 8, shieldWidth, 3);
        }
        
        ctx.restore();
        
        // Efeito de sprint
        if (this.sprintActive && !this.isFrozen) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(
                this.x + this.width/2,
                this.y + this.height/2,
                this.width * 0.8 + Math.sin(Date.now()/100) * 5,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }
    }
}

class BossShieldEffect {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.life = 30;
        this.maxLife = 30;
    }
    
    update() {
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Círculo externo
        ctx.strokeStyle = '#00a8ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Padrão hexagonal
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(angle) * this.radius,
                this.y + Math.sin(angle) * this.radius
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class BossShieldHitEffect {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.life = 15;
        this.maxLife = 15;
        this.hitAngle = Math.random() * Math.PI * 2;
    }
    
    update() {
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Efeito no ponto de impacto
        ctx.strokeStyle = '#ff5555';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
            this.x + Math.cos(this.hitAngle) * this.radius * 0.7,
            this.y + Math.sin(this.hitAngle) * this.radius * 0.7,
            10 * (1 - alpha),
            0,
            Math.PI * 2
        );
        ctx.stroke();
        
        // Linhas de rachadura
        for (let i = 0; i < 3; i++) {
            const angle = this.hitAngle + (i - 1) * 0.3;
            ctx.beginPath();
            ctx.moveTo(
                this.x + Math.cos(angle) * this.radius * 0.5,
                this.y + Math.sin(angle) * this.radius * 0.5
            );
            ctx.lineTo(
                this.x + Math.cos(angle) * this.radius * 0.9,
                this.y + Math.sin(angle) * this.radius * 0.9
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class BossShieldBreakEffect {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.life = 30;
        this.maxLife = 30;
        this.particles = [];
        
        // Cria partículas para o efeito de quebra
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                angle: Math.random() * Math.PI * 2,
                speed: 1 + Math.random() * 3,
                size: 2 + Math.random() * 4,
                life: 10 + Math.random() * 20
            });
        }
    }
    
    update() {
        this.life--;
        
        // Atualiza partículas
        this.particles = this.particles.filter(p => {
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            p.life--;
            return p.life > 0;
        });
        
        return this.life > 0 || this.particles.length > 0;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        
        // Círculo principal
        if (this.life > 0) {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#ff5555';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Linhas de rachadura
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(
                    this.x + Math.cos(angle) * this.radius * 1.2,
                    this.y + Math.sin(angle) * this.radius * 1.2
                );
                ctx.stroke();
            }
        }
        
        // Partículas
        this.particles.forEach(p => {
            const pAlpha = p.life / 30;
            ctx.fillStyle = `rgba(100, 200, 255, ${pAlpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}

class BossBullet extends Bullet {
    constructor(x, y, direction, isPlayerBullet) {
        super(x, y, direction, isPlayerBullet);
        this.width = 8;
        this.height = 8;
        this.speed = BULLET_SPEED * 1.5;
        this.color = '#ff0000';
        this.lifetime = 120; // Duração limitada para evitar acumulação
    }
    
    draw() {
        // Projétil com efeito especial
        ctx.save();
        
        // Núcleo
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Aura
        const gradient = ctx.createRadialGradient(
            this.x + this.width/2, this.y + this.height/2, 0,
            this.x + this.width/2, this.y + this.height/2, this.width
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width, 0, Math.PI * 2);
        ctx.fill();
        
        // Rastro
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y + this.height/2);
        ctx.lineTo(
            this.x + this.width/2 - this.direction.x * 20,
            this.y + this.height/2 - this.direction.y * 20
        );
        ctx.stroke();
        
        ctx.restore();
    }
}

class BombImmuneEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 5;
        this.maxSize = 40;
        this.life = 10; // Aumente a vida atual
        this.maxLife = 15; // Aumente a vida máxima proporcionalmente
        this.particles = [];
    }
    
    update() {
        this.life--;
        this.size = Math.max(0, (this.maxSize * (this.maxLife - this.life)) / this.maxLife); // Garante tamanho não negativo
        
        // Adiciona partículas elétricas
        if (Math.random() < 0.7) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 30,
                y: this.y + (Math.random() - 0.5) * 30,
                size: 1 + Math.random() * 3,
                life: 10 + Math.random() * 5
            });
        }
        
        // Atualiza partículas
        this.particles = this.particles.filter(p => {
            p.life--;
            return p.life > 0;
        });
        
        return this.life > 0;
    }
    
    draw() {
        ctx.save();
        
        // Círculo principal (azul elétrico)
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(0, 150, 255, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Anel externo (branco/azul)
        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, this.size * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Partículas elétricas
        this.particles.forEach(p => {
            const pAlpha = p.life / 15;
            ctx.fillStyle = `rgba(0, 200, 255, ${pAlpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Linhas elétricas entre partículas
            if (Math.random() < 0.3) {
                ctx.strokeStyle = `rgba(100, 220, 255, ${pAlpha * 0.7})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(
                    this.x + 10 + (Math.random() - 0.5) * 10,
                    this.y + 10 + (Math.random() - 0.5) * 10
                );
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }
}

function generateLevel() {
    walls = [];
    enemies = [];
    bullets = [];
    healthPacks = [];
    powerUps = [];
    explosions = [];
    drones = [];

    if (bombCheckId !== null) {
        cancelAnimationFrame(bombCheckId);
        bombCheckId = null;
    }

    // Create player
    player = new Tank(50, canvas.height - 50, '#4a4', true);
    
    if (level - 1 >= LEVELS.length) {
        // Se não houver mais níveis, reinicia ou mostra mensagem de vitória
        endGame(true); // Passa true para indicar vitória
        return;
    }
    // Verifica se o nível existe, senão usa o primeiro
    const levelMap = LEVELS[level - 1] || LEVELS[0];
    
    // Percorre o array do mapa
    for (let row = 0; row < levelMap.length; row++) {
        for (let col = 0; col < levelMap[row].length; col++) {
            const tile = levelMap[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;
            
            switch(tile) {
                case TILE_TYPES.WALL:
                    walls.push(new Wall(x, y));
                    break;
                case TILE_TYPES.STEEL_WALL:
                    walls.push(new Wall(x, y, TILE_SIZE, TILE_SIZE, false)); // Parede indestrutível
                    break;
                case TILE_TYPES.REINFORCED_WALL:  // Novo caso para parede reforçada
                    walls.push(new ReinforcedWall(x, y));
                    break;
                case TILE_TYPES.PLAYER:
                    // Posiciona o jogador se ainda não estiver definido
                    if (!player) {
                        player = new Tank(x, y, '#4a4', true);
                    } else {
                        player.x = x;
                        player.y = y;
                    }
                    break;
                case TILE_TYPES.ENEMY:
                    enemies.push(new Tank(x, y, '#c44', false));
                    break;
                case TILE_TYPES.SUICIDE_ENEMY:  // Novo caso para inimigos suicidas
                    enemies.push(new SuicideEnemy(x, y));
                    break;
                case TILE_TYPES.LASER_TOWER:
                    enemies.push(new LaserTower(x, y));
                    break;
                case TILE_TYPES.GUIDED_ENEMY:
                    enemies.push(new GuidedEnemy(x, y));
                    break;
                case TILE_TYPES.FORTRESS:
                    enemies.push(new FortressTank(x, y));
                    break;
                case TILE_TYPES.MACHINE_GUN_TOWER:
                    enemies.push(new MachineGunTower(x, y));
                    break;
                case TILE_TYPES.HEALER_ENEMY:
                    enemies.push(new HealerEnemy(x, y));
                    break;
                case TILE_TYPES.REACTIVE_WALL_TURRET:
                    enemies.push(new WallTurret(x, y)); // Adiciona como um inimigo normal
                    break;
                case TILE_TYPES.BOSS:
                    enemies.push(new BossEnemy(x, y));
                    break;
                case TILE_TYPES.HEALTH_PACK:
                    healthPacks.push(new HealthPack(x, y));
                    break;
                case TILE_TYPES.TRIPLE_SHOT:
                    powerUps.push(new TripleShotPowerUp(x, y));
                    break;
                case TILE_TYPES.IMMUNITY:
                    powerUps.push(new ImmunityPowerUp(x, y));
                    break;
            }
        }
    }
}

// Função auxiliar para verificar colisão (pode ser a mesma que já existe)
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function handleInput() {
    if (!gameRunning) return;
    
    // Only allow one direction at a time - no diagonal movement
    if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        player.move(0, -1);
    } else if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        player.move(0, 1);
    } else if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
        player.move(-1, 0);
    } else if (keys['d'] || keys['D'] || keys['ArrowRight']) {
        player.move(1, 0);
    }
    
    if (keys[' '] || keys['Space']) {
        player.shoot();
    }

    if (keys['e'] || keys['E']) {
        player.activateShield();
    }

    if (keys['q'] || keys['Q']) {
        player.activateSpeedBoost();
    }

    if (keys['f'] || keys['F']) {
        player.activateMultiShot();
    }

    if (keys['c'] || keys['C']) {
        player.activateRicochet();
    }

    if (keys['v'] || keys['V']) {
        player.activateDrone();
    }

    if (keys['b'] || keys['B']) {
        player.activateAreaBomb();
    }

    if (keys['g'] || keys['G']) {
        player.activateFreezeShot();
    }
}

function updateShieldCooldownUI() {
    if (!player) return;
    
    const fillElement = document.getElementById('shieldCooldownFill');
    if (!fillElement) return;
    
    if (player.hasShield) {
        const remaining = player.shieldActiveTime - (Date.now() - player.shieldActivationTime);
        const percent = (remaining / player.shieldActiveTime) * 100;
        fillElement.style.width = `${percent}%`;
        fillElement.style.background = '#00a8ff';
    } else if (player.shieldCooldown > 0) {
        const percent = 100 - ((player.shieldCooldown / player.maxShieldCooldown) * 100);
        fillElement.style.width = `${percent}%`;
        fillElement.style.background = '#ff5555';
    } else {
        fillElement.style.width = '100%';
        fillElement.style.background = '#11bf11';
    }
}

function updateSpeedBoostCooldownUI() {
    if (!player) return;
    
    const fillElement = document.getElementById('speedBoostCooldownFill');
    if (!fillElement) return;
    
    if (player.hasSpeedBoost) {
        const remaining = player.speedBoostActiveTime - (Date.now() - player.speedBoostActivationTime);
        const percent = (remaining / player.speedBoostActiveTime) * 100;
        fillElement.style.width = `${percent}%`;
        fillElement.style.background = '#ff9900';
    } else if (player.speedBoostCooldown > 0) {
        const percent = 100 - ((player.speedBoostCooldown / player.maxSpeedBoostCooldown) * 100);
        fillElement.style.width = `${percent}%`;
        fillElement.style.background = '#ff5555';
    } else {
        fillElement.style.width = '100%';
        fillElement.style.background = '#cfa40a';
    }
}

function updateMultiShotCooldownUI() {
    if (!player) return;
    
    const fillElement = document.getElementById('multiShotCooldownFill');
    if (!fillElement) return;
    
    if (player.multiShotCooldown > 0) {
        const percent = 100 - ((player.multiShotCooldown / player.maxMultiShotCooldown) * 100);
        fillElement.style.width = `${percent}%`;
        fillElement.style.background = player.multiShotCooldown > 0 ? '#ff5555' : '#9c27b0';
    } else {
        fillElement.style.width = '100%';
        fillElement.style.background = '#9c27b0';
    }
}

function updateRicochetCooldownUI() {
    if (!player) return;
    
    const fillElement = document.getElementById('ricochetCooldownFill');
    if (!fillElement) return;
    
    if (player.ricochetCooldown > 0) {
        const percent = 100 - ((player.ricochetCooldown / player.maxRicochetCooldown) * 100);
        fillElement.style.width = `${percent}%`;
        fillElement.style.background = player.ricochetCooldown > 0 ? '#ff5555' : '#00bcd4';
    } else {
        fillElement.style.width = '100%';
        fillElement.style.background = '#00bcd4';
    }
}

function updateDroneCooldownUI() {
    if (!player) return;
    const fillElement = document.getElementById('droneCooldownFill');
    if (!fillElement) return;
    
    if (player.drones.length > 0) {
        // Mostra tempo restante dos drones ativos (verde)
        const remaining = player.droneActiveTime - (Date.now() - player.droneActivationTime);
        const percent = (remaining / player.droneActiveTime) * 100;
        fillElement.style.width = `${percent}%`;
        fillElement.style.background = '#4CAF50'; // Verde
    } else if (player.droneCooldown > 0) {
        // Mostra cooldown (vermelho)
        const percent = (player.maxDroneCooldown - player.droneCooldown) / player.maxDroneCooldown * 100;
        fillElement.style.width = `${percent}%`;
        fillElement.style.background = '#ff5555'; // Vermelho
    } else {
        // Pronto para usar (verde cheio)
        fillElement.style.width = '100%';
        fillElement.style.background = '#4CAF50'; // Verde
    }
}

function updateTripleShotCooldownUI() {
    if (!player) return;
    
    const fillElement = document.getElementById('tripleShotCooldownFill');
    if (!fillElement) return;
    
    if (player.hasTripleShot) {
        const remaining = player.tripleShotEndTime - Date.now();
        const percent = (remaining / 10000) * 100; // 10 segundos de duração
        fillElement.style.width = `${Math.max(0, percent)}%`;
        fillElement.style.background = '#ffeb3b'; // Amarelo
    } else {
        fillElement.style.width = '0%';
        fillElement.style.background = '#ffeb3b';
    }
}

function updateImmunityCooldownUI() {
    if (!player) return;
    
    const fillElement = document.getElementById('immunityCooldownFill');
    if (!fillElement) return;
    
    if (player.isInvulnerable) {
        const remaining = player.invulnerableTime - (Date.now() - player.invulnerableStart);
        const percent = (remaining / player.invulnerableTime) * 100;
        fillElement.style.width = `${percent}%`;
        fillElement.style.background = '#00a8ff'; // Azul
    } else {
        fillElement.style.width = '0%';
    }
}

function updateAreaBombCooldownUI() {
    if (!player) return;
    
    const fillElement = document.getElementById('areaBombCooldownFill');
    if (!fillElement) return;
    
    if (player.areaBombCooldown > 0) {
        const percent = 100 - ((player.areaBombCooldown / player.maxAreaBombCooldown) * 100);
        fillElement.style.width = `${percent}%`;
        fillElement.style.background = player.areaBombCooldown > 0 ? '#ff5555' : '#ff5722';
    } else {
        fillElement.style.width = '100%';
        fillElement.style.background = '#ff5722';
    }
}

function updateFreezeCooldownUI() {
    if (!player) return;
    
    const fillElement = document.getElementById('freezeCooldownFill');
    if (!fillElement) return;
    
    if (player.freezeShotCooldown > 0) {
        const percent = 100 - ((player.freezeShotCooldown / player.maxFreezeShotCooldown) * 100);
        fillElement.style.width = `${percent}%`;
        fillElement.style.background = player.freezeShotCooldown > 0 ? '#ff5555' : '#00a8ff';
    } else {
        fillElement.style.width = '100%';
        fillElement.style.background = '#00a8ff';
    }
}

function update() {
    if (!gameRunning) return;

    // Atualiza o efeito de vida baixa
    const lowHealthOverlay = document.getElementById('lowHealthOverlay');
    if (lives === 1) {
        lowHealthOverlay.style.display = 'block';
        // Alterna entre os efeitos para mais variedade
        const time = Date.now();
        if (Math.floor(time / 500) % 2 === 0) {
            lowHealthOverlay.className = 'low-health-overlay low-health-pulse';
        } else {
            lowHealthOverlay.className = 'low-health-overlay low-health-glitch';
        }
    } else {
        lowHealthOverlay.style.display = 'none';
    }

    if (player) {
        player.updateSpeedBoost();
        player.update();  // Garante que o jogador atualize imunidade
        player.updateMultiShotCooldown();
        player.updateRicochetCooldown();
        player.updateDrones();
        player.updateShield();
        player.updateTripleShot();
        player.updateFreezeShotCooldown();
        updateShieldCooldownUI();
        updateSpeedBoostCooldownUI();
        updateMultiShotCooldownUI();
        updateRicochetCooldownUI();
        updateDroneCooldownUI();
        updateTripleShotCooldownUI();
        updateImmunityCooldownUI();
        updateAreaBombCooldownUI();
        updateFreezeCooldownUI();
    }
    
    // Update player
    handleInput();

    // Check health pack collisions
    healthPacks = healthPacks.filter(pack => {
        if (pack.checkCollision(player)) {
            lives = Math.min(3, lives + 1); // Cura 1 vida, máximo de 3
            updateUI();
            return false;
        }
        return true;
    });

    // Verificar colisão com power-ups
    powerUps = powerUps.filter(powerUp => {
        if (powerUp.checkCollision(player)) {
            if (powerUp instanceof ImmunityPowerUp) {
                player.startInvulnerability(powerUp.duration);
            }
            if (powerUp instanceof TripleShotPowerUp) {
                player.activateTripleShot(powerUp.duration);
            }
            return false; // Remove o power-up do mapa
        }
        return true;
    });
    
    // Update enemies
    enemies.forEach(enemy => enemy.update());
    
    // Update bullets
    bullets = bullets.filter(bullet => bullet.update());
    
    // Update explosions
    explosions = explosions.filter(explosion => explosion.update());

    drones = drones.filter(drone => drone.update());
    
    // Check win condition
    if (enemies.length === 0) {
        // Verifica se existe próximo nível antes de incrementar
        if (level < LEVELS.length) {
            level++;
            score += 500;
            generateLevel();
        } else {
            // Último nível completado
            endGame(true);
        }
        updateUI();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid pattern
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw walls
    walls.forEach(wall => wall.draw());
    
    // Draw tanks
    if (gameRunning) {
        player.draw();
        enemies.forEach(enemy => enemy.draw());
        bullets.forEach(bullet => bullet.draw());
        explosions.forEach(explosion => explosion.draw());
        healthPacks.forEach(pack => pack.draw());
        powerUps.forEach(powerUp => powerUp.draw());
        player.drones.forEach(drone => drone.draw());
    }
    
    // Draw level indicator
    ctx.fillStyle = '#fff';
    ctx.font = '16px Courier New';
    ctx.fillText(`Nível: ${level}`, 10, 25);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('enemies').textContent = enemies.length;
}

// Variáveis para controle da introdução
let introText = `Ano 2147. A Terra está sob o domínio da máquina.\n\nVocê é o último comandante da resistência humana, operando a partir de bunkers subterrâneos.\n\nSua missão: infiltrar-se na base central do inimigo e desativar o núcleo de controle.\n\nMas primeiro, você precisa sobreviver aos exércitos de tanques automatizados que patrulham os túneis...\n\nPreparado?`;
let currentIntroText = '';
let introIndex = 0;
let introInterval;
let introFinished = false;

function startIntro() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('introScreen').style.display = 'flex';
    document.getElementById('progressBar').style.width = '0%';
    
    // Inicia o efeito de máquina de escrever
    introInterval = setInterval(typeIntroText, 120);
}

function typeIntroText() {
    if (introIndex < introText.length) {
        // Adiciona o próximo caractere
        currentIntroText += introText.charAt(introIndex);
        document.getElementById('introText').innerHTML = currentIntroText + '<span class="typing-cursor"></span>';
        const progress = (introIndex / introText.length) * 100;
        document.getElementById('progressBar').style.width = progress + '%';
        introIndex++;
    } else {
        // Texto completo
        clearInterval(introInterval);
        document.getElementById('introText').innerHTML = currentIntroText;
        document.getElementById('skipIntro').textContent = 'Start';
        document.getElementById('progressBar').style.width = '100%';
    }
}

function skipIntro() {
    clearInterval(introInterval);
    introFinished = true;
    document.getElementById('introText').innerHTML = introText;
    document.getElementById('progressBar').style.width = '100%';
    startGame();
}

function showControls() {
    document.getElementById('controlsModal').style.display = 'flex';
    // Adiciona o event listener para o documento
    document.addEventListener('keydown', handleEscapeKey);
}

function hideControls() {
    document.getElementById('controlsModal').style.display = 'none';
    // Remove o event listener quando o modal é fechado
    document.removeEventListener('keydown', handleEscapeKey);
}

function handleModalClick(event) {
    // Se o clique foi diretamente no modal (fora do conteúdo), fecha o modal
    if (event.target === document.getElementById('controlsModal')) {
        hideControls();
    }
}

function handleEscapeKey(event) {
    // Fecha o modal quando a tecla ESC é pressionada
    if (event.key === 'Escape') {
        hideControls();
    }
}

function startGame() {
    if (!introFinished) return;

    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('controls').style.display = 'block';
    document.getElementById('gameCanvas').style.display = 'block';
    document.getElementById('introScreen').style.display = 'none';
    document.getElementById('gameCooldowns').style.display = 'block';
    document.getElementById('gameTitle').style.display = 'block';
    document.getElementById('gameInfo').style.display = 'flex';

    gameRunning = true;
    score = 0;
    lives = 3;
    level = 1;
    
    // Generate level
    generateLevel();
    
    // Update UI
    updateUI();
    
    // Hide game over screen
    document.getElementById('gameOver').style.display = 'none';
}

function endGame(victory = false) {
    gameRunning = false;

    const finalScoreElement = document.getElementById('finalScore');
    if (finalScoreElement) {
        finalScoreElement.textContent = score;
    }

    const gameOverDiv = document.getElementById('gameOver');
    const titleElement = gameOverDiv?.querySelector('h2');
    const messageElement = gameOverDiv?.querySelector('p');

    if (victory) {
        if (titleElement) titleElement.textContent = 'VITÓRIA!';
        if (messageElement) messageElement.textContent = `Você completou todos os níveis! Pontuação final: ${score}`;
    } else {
        if (titleElement) titleElement.textContent = 'GAME OVER';
        if (messageElement) messageElement.textContent = `Sua pontuação final: ${score}`;
    }

    if (gameOverDiv) gameOverDiv.style.display = 'block';
    if (lowHealthOverlay) lowHealthOverlay.style.display = 'none';
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'r' || e.key === 'R') {
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Prevent default behavior for game keys
document.addEventListener('keydown', (e) => {
    if (['w', 'a', 's', 'd', 'q', 'f', 'e', 'c', 'v', 'b', 'g',' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
});

// Start the game
window.onload = function () {
    gameLoop();
};