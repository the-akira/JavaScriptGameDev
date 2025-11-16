const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const miniCanvas = document.getElementById('miniMap');
const miniCtx = miniCanvas.getContext('2d');

const TILE_SIZE = 32;
const VIEWPORT_TILES = 20; // Quantos tiles visíveis na tela

// Câmera
const camera = {
    x: 0,
    y: 0,
    visualX: 0,
    visualY: 0,
    width: VIEWPORT_TILES,
    height: VIEWPORT_TILES
};

function updateCamera() {
    // Centralizar câmera no player (usando posição visual para suavidade)
    const targetX = player.visualX - Math.floor(camera.width / 2);
    const targetY = player.visualY - Math.floor(camera.height / 2);

    const { map, width: MAP_WIDTH, height: MAP_HEIGHT } = getCurrentMap();
    
    // Limitar câmera aos limites do mapa
    camera.x = Math.max(0, Math.min(targetX, MAP_WIDTH - camera.width));
    camera.y = Math.max(0, Math.min(targetY, MAP_HEIGHT - camera.height));
    
    // Interpolação suave da câmera
    const smoothFactor = 0.1;
    camera.visualX += (camera.x - camera.visualX) * smoothFactor;
    camera.visualY += (camera.y - camera.visualY) * smoothFactor;
}

// Tipos de terreno
const TERRAIN = {
    GRASS: 0,
    WATER: 1,
    STONE: 2,
    PORTAL: 3,
    WALL: 4
};

// Mapas
const maps = {
    forest: {
        name: "Floresta",
        tiles: [],
        enemies: [
            { x: 10, y: 10, type: "rat" },
            { x: 35, y: 4, type: "rat" },
            { x: 15, y: 4, type: "rat" },
            { x: 3, y: 17, type: "rat" },
            { x: 3, y: 10, type: "rat" },
            { x: 28, y: 3, type: "rat" },
            { x: 3, y: 24, type: "rat" },
            { x: 23, y: 10, type: "rat" },
            { x: 15, y: 15, type: "spider" },
            { x: 15, y: 25, type: "spider" },
            { x: 48, y: 47, type: "archer" },
            { x: 45, y: 4, type: "archer" },
        ],
        portals: [{x: 45, y: 25, target: 'cave', spawn: {x: 5, y: 6}}]
    },
    cave: {
        name: "Caverna",
        tiles: [],
        enemies: [
            { x: 2, y: 2, type: "bat" },
            { x: 18, y: 18, type: "spider" }
        ],
        portals: [{x: 5, y: 6, target: 'forest', spawn: {x: 45, y: 25}}]
    }
};

function getCurrentMap() {
    const map = maps[player.currentMap];
    const width = map.tiles[0].length;
    const height = map.tiles.length;
    return { map, width, height };
}

// Player
const player = {
    x: 2,
    y: 2,
    visualX: 2,
    visualY: 2,
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50,
    level: 1,
    exp: 0,
    expToLevel: 100,
    attackMin: 5,
    attackMax: 10,
    attackCooldown: 0,
    attackSpeed: 1000,
    currentMap: 'forest',
    target: null,
    isMoving: false,
    moveProgress: 0,
    isDead: false,
    spellCooldown: 0,
    spellCooldownTime: 5000, // 2 segundos de recarga
    areaSpellCooldown: 0,
    areaSpellCooldownTime: 20000 // 8s de recarga da magia em área
};

// Regeneração de vida
let regenTimer = 0;
const REGEN_INTERVAL = 3000; // 3 segundos
const REGEN_AMOUNT = 1;

function handleRegen(deltaTime) {
    if (player.isDead) return;
    regenTimer += deltaTime;
    if (regenTimer >= REGEN_INTERVAL) {
        regenTimer = 0;
        if (player.hp < player.maxHp) {
            player.hp = Math.min(player.hp + REGEN_AMOUNT, player.maxHp);
        }
    }
}

// Regeneração de mana
let manaRegenTimer = 0;
const MANA_REGEN_INTERVAL = 1000; // 1 segundo
const MANA_REGEN_AMOUNT = 1;

function handleManaRegen(deltaTime) {
    if (player.isDead) return;
    manaRegenTimer += deltaTime;
    if (manaRegenTimer >= MANA_REGEN_INTERVAL) {
        manaRegenTimer = 0;
        if (player.mana < player.maxMana) {
            player.mana = Math.min(player.mana + MANA_REGEN_AMOUNT, player.maxMana);
        }
    }
}

function findPathAStar(startX, startY, goalX, goalY, mapId, maxDepth = 30) {
    const map = maps[mapId].tiles;
    const inBounds = (x, y) => y >= 0 && x >= 0 && y < map.length && x < map[0].length;
    const key = (x, y) => `${x},${y}`;
    const dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    const open = [];
    const gScore = new Map();
    const fScore = new Map();
    const cameFrom = new Map();
    const startK = key(startX, startY);
    const goalK = key(goalX, goalY);

    gScore.set(startK, 0);
    fScore.set(startK, Math.abs(goalX - startX) + Math.abs(goalY - startY));
    open.push({ x: startX, y: startY, f: fScore.get(startK) });

    while (open.length > 0) {
        // Escolhe o nó com menor fScore
        open.sort((a, b) => a.f - b.f);
        const current = open.shift();
        const curK = key(current.x, current.y);

        if (curK === goalK)
            return reconstructPath(cameFrom, current);

        if (gScore.get(curK) > maxDepth) continue;

        for (const d of dirs) {
            const nx = current.x + d.x;
            const ny = current.y + d.y;
            if (!inBounds(nx, ny)) continue;

            const tile = map[ny]?.[nx];
            if (tile === TERRAIN.WALL || tile === TERRAIN.WATER) continue;

            const nk = key(nx, ny);
            const tentativeG = gScore.get(curK) + 1;

            if (tentativeG < (gScore.get(nk) ?? Infinity)) {
                cameFrom.set(nk, current);
                gScore.set(nk, tentativeG);
                const noise = Math.random() * 0.3; // pequeno ruído
                const f = tentativeG + Math.abs(goalX - nx) + Math.abs(goalY - ny) + noise;
                fScore.set(nk, f);
                if (!open.some(o => o.x === nx && o.y === ny)) open.push({ x: nx, y: ny, f });
            }
        }
    }

    return null;

    function reconstructPath(came, cur) {
        const path = [];
        while (cur) {
            path.unshift({ x: cur.x, y: cur.y });
            const prev = came.get(key(cur.x, cur.y));
            cur = prev;
        }
        return path;
    }
}

// Inimigos
class Enemy {
    constructor(x, y, type, mapId) {
        this.x = x;
        this.y = y;
        this.visualX = x;
        this.visualY = y;
        this.type = type;
        this.mapId = mapId;
        this.hp = type.hp;
        this.maxHp = type.hp;
        this.attackCooldown = 0;
        this.chasePlayer = false;
        this.isMoving = false;
        this.moveProgress = 0;
    }
    
    update(deltaTime) {
        if (this.hp <= 0) return;

        this.updateMovement(deltaTime);

        if (this.type.name === "Arqueiro Goblin") {
            this.updateArcherAI(deltaTime);
        } else {
            this.updateMeleeAI(deltaTime);
        }
    }

    updateMovement(deltaTime) {
        if (!this.isMoving) return;

        this.moveProgress += deltaTime / 400; // 400ms para completar movimento

        if (this.moveProgress >= 1) {
            this.moveProgress = 0;
            this.isMoving = false;
            this.visualX = this.x;
            this.visualY = this.y;
            return;
        }

        // Início do movimento (posição anterior)
        const startX = this.prevX ?? this.x;
        const startY = this.prevY ?? this.y;

        // Suavização dinâmica (ease-out)
        const t = 1 - Math.pow(1 - this.moveProgress, 2);
        this.visualX = startX + (this.x - startX) * t;
        this.visualY = startY + (this.y - startY) * t;
    }

    updateArcherAI(deltaTime) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.abs(dx) + Math.abs(dy);
        const desiredMin = 3;
        const desiredMax = 6;
        const attackRange = this.type.range || 5;

        // Movimento tático (recuar ou avançar)
        if (!this.isMoving) {
            let { x: targetX, y: targetY } = this;
            if (dist < desiredMin) {
                // recuar
                const step = this.getStepAwayFrom(player.x, player.y);
                if (this.canMoveTo(step.x, step.y)) ({ x: targetX, y: targetY } = step);
            } else if (dist > desiredMax) {
                // avançar
                const step = this.getStepToward(player.x, player.y);
                if (this.canMoveTo(step.x, step.y)) ({ x: targetX, y: targetY } = step);
            }

            if (targetX !== this.x || targetY !== this.y) this.moveTo(targetX, targetY);
        }

        // Ataque à distância
        this.attackCooldown -= deltaTime;
        const inRange = Math.max(Math.abs(dx), Math.abs(dy)) <= attackRange;
        const hasLine = hasLineOfSight(this.x, this.y, player.x, player.y, this.mapId);

        if (this.attackCooldown <= 0 && inRange && hasLine) {
            this.shootProjectile();
            this.attackCooldown = this.type.attackSpeed;
        }
    }

    updateMeleeAI(deltaTime) {
        const dist = Math.abs(this.x - player.x) + Math.abs(this.y - player.y);

        this.chasePlayer = dist < 6 ? true : dist > 10 ? false : this.chasePlayer;
        if (!this.chasePlayer) this.path = null;

        // Movimento de perseguição
        if (this.chasePlayer && !this.isMoving) {
            if (!this.pathCooldown) this.pathCooldown = 0;
            this.pathCooldown -= deltaTime;

            const distToPlayer = Math.abs(this.x - player.x) + Math.abs(this.y - player.y);
            if (!this.path || this.pathCooldown <= 0 || distToPlayer < 2) {
                this.recalculatePath();
                this.pathCooldown = 400;
            }

            this.followPath();
        }

        // Ataque corpo a corpo / alcance curto
        this.attackCooldown -= deltaTime;
        this.tryAttack();
    }

    recalculatePath() {
        const offsets = [
            { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: 1 }, { x: 0, y: -1 },
            { x: 1, y: 1 }, { x: -1, y: 1 },
            { x: 1, y: -1 }, { x: -1, y: -1 },
        ];

        if (!this.surroundOffset || Math.random() < 0.05) {
            this.surroundOffset = this.findFreeOffset(offsets) || { x: 1, y: 0 };
        }

        const target = {
            x: player.x + this.surroundOffset.x,
            y: player.y + this.surroundOffset.y
        };

        const map = maps[this.mapId];
        const tile = map.tiles?.[target.y]?.[target.x];
        const valid = tile !== TERRAIN.WALL && tile !== TERRAIN.WATER;

        this.path = findPathAStar(
            this.x,
            this.y,
            valid ? target.x : player.x,
            valid ? target.y : player.y,
            this.mapId,
            30
        );

        this.pathIndex = 1;
    }

    followPath() {
        if (!this.path || !this.path[this.pathIndex]) return;

        const next = this.path[this.pathIndex];
        if (this.canMoveTo(next.x, next.y)) {
            this.moveTo(next.x, next.y);
            this.pathIndex++;
        } else {
            this.pathCooldown = 0; // força recalcular
        }
    }

    tryAttack() {
        const dx = Math.abs(this.x - player.x);
        const dy = Math.abs(this.y - player.y);
        const isAdjacent = dx <= 1 && dy <= 1 && (dx + dy) > 0;

        const attackRange = this.type.range || 1;
        const inRange = Math.max(dx, dy) <= attackRange;
        const hasLine = inRange && hasLineOfSight(this.x, this.y, player.x, player.y, this.mapId);

        if (this.attackCooldown > 0 || !inRange || !hasLine) return;

        if (attackRange > 1 && !isAdjacent) {
            this.shootProjectile();
        } else if (isAdjacent) {
            this.attackPlayer();
        }

        this.attackCooldown = this.type.attackSpeed;
    }

    moveTo(x, y) {
        this.prevX = this.x;
        this.prevY = this.y;
        this.x = x;
        this.y = y;
        this.isMoving = true;
        this.moveProgress = 0;
    }

    canMoveTo(x, y) {
        return canWalk(x, y) && !isPositionOccupied(x, y, this.mapId);
    }

    getStepToward(targetX, targetY) {
        return { x: this.x + Math.sign(targetX - this.x), y: this.y + Math.sign(targetY - this.y) };
    }

    getStepAwayFrom(targetX, targetY) {
        return { x: this.x + Math.sign(this.x - targetX), y: this.y + Math.sign(this.y - targetY) };
    }

    findFreeOffset(offsets) {
        for (let i = offsets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [offsets[i], offsets[j]] = [offsets[j], offsets[i]];
        }
        for (const off of offsets) {
            const tx = player.x + off.x;
            const ty = player.y + off.y;
            if (this.canMoveTo(tx, ty)) return off;
        }
        return null;
    }
    
    attackPlayer() {
        if (player.isDead) return;

        const damage = Math.floor(Math.random() * (this.type.attackMax - this.type.attackMin + 1)) + this.type.attackMin;
        player.hp = Math.max(0, player.hp - damage);
        addLog(`${this.type.name} causou ${damage} de dano!`, 'log-damage');
        addFloatingText(player.x, player.y, `-${damage}`, "red");
        
        if (player.hp === 0 && !player.isDead) {
            player.isDead = true;
            addLog('Você morreu! Respawnando...', 'log-info');
            setTimeout(() => {
                respawnPlayer();
                player.isDead = false;
            }, 2000);
        }
    }

    shootProjectile() {
        if (player.isDead) return;

        // Cria o projétil (semelhante à magia do jogador)
        const projectile = {
            x: this.visualX,
            y: this.visualY,
            targetX: player.visualX,
            targetY: player.visualY,
            progress: 0,
            speed: 0.02,
            color: this.type.projectileColor || 'rgba(255,150,50,0.8)',
            radius: TILE_SIZE / 3,
            damage: Math.floor(Math.random() * (this.type.attackMax - this.type.attackMin + 1)) + this.type.attackMin,
            target: player,
            fromEnemy: true,
            type: this.type.projectileType,
        };

        activeSpells.push(projectile);
        addLog(`${this.type.name} disparou um projétil!`, 'log-info');
    }
    
    takeDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);
        if (this.hp === 0) {
            player.exp += this.type.exp;
            addLog(`Você derrotou ${this.type.name}! +${this.type.exp} EXP`, 'log-exp');
            checkLevelUp();
            return true;
        }
        return false;
    }
}

const enemyTypes = {
    rat: {
        name: 'Rato',
        hp: 20,
        attackMin: 2,
        attackMax: 5,
        attackSpeed: 2000,
        exp: 10,
        color: '#8B4513'
    },
    spider: {
        name: 'Aranha',
        hp: 35,
        attackMin: 4,
        attackMax: 8,
        attackSpeed: 1500,
        exp: 25,
        color: '#4B0082'
    },
    bat: {
        name: 'Morcego',
        hp: 15,
        attackMin: 3,
        attackMax: 6,
        attackSpeed: 1200,
        exp: 15,
        color: '#2F4F4F'
    },
    archer: {
        name: 'Arqueiro Goblin',
        hp: 40,
        attackMin: 6,
        attackMax: 10,
        attackSpeed: 2000,
        exp: 35,
        color: '#228B22',
        range: 5, // alcance de ataque
        projectileColor: 'rgba(255,255,100,0.8)',
        projectileType: 'arrow'
    },
};

function isPositionOccupied(x, y, mapId) {
    if (player.x === x && player.y === y && player.currentMap === mapId) return true;
    return maps[mapId].enemies.some(e => e.x === x && e.y === y && e.hp > 0);
}

function canWalk(x, y) {
    const { map, width: MAP_WIDTH, height: MAP_HEIGHT } = getCurrentMap();
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return false;
    const tile = map.tiles[y][x];
    if (tile === TERRAIN.WATER || tile === TERRAIN.WALL) return false;
    
    // Verificar se tem inimigo vivo na posição
    const hasEnemy = map.enemies.some(e => e.x === x && e.y === y && e.hp > 0);
    return !hasEnemy;
}

let isTransitioning = false;
let transitionAlpha = 0;
let transitionTarget = null;

function startMapTransition(targetMap, spawn) {
    if (isTransitioning) return;
    isTransitioning = true;
    transitionAlpha = 0;
    transitionTarget = { targetMap, spawn };

    // Fade-out (escurece a tela)
    const fadeOut = setInterval(() => {
        transitionAlpha += 0.05;
        if (transitionAlpha >= 1) {
            clearInterval(fadeOut);

            // Executa a troca de mapa real
            player.currentMap = targetMap;
            player.x = spawn.x;
            player.y = spawn.y;
            player.visualX = spawn.x;
            player.visualY = spawn.y;
            player.isMoving = false;
            player.moveProgress = 0;
            player.target = null;
            activeSpells = [];

            // Recalcula câmera (com base no novo mapa)
            const { width, height } = getCurrentMap();
            camera.x = Math.max(0, Math.min(player.x - Math.floor(camera.width / 2), width - camera.width));
            camera.y = Math.max(0, Math.min(player.y - Math.floor(camera.height / 2), height - camera.height));
            camera.visualX = camera.x;
            camera.visualY = camera.y;

            addLog(`Você entrou em: ${maps[player.currentMap].name}`, 'log-info');
            updateMapName();

            // Fade-in (clareia de volta)
            const fadeIn = setInterval(() => {
                transitionAlpha -= 0.05;
                if (transitionAlpha <= 0) {
                    clearInterval(fadeIn);
                    isTransitioning = false;
                    transitionTarget = null;
                }
            }, 30);
        }
    }, 30);
}
        
function checkPortal() {
    const { map } = getCurrentMap();
    const portal = map.portals.find(p => p.x === player.x && p.y === player.y);
    if (portal) {
        startMapTransition(portal.target, portal.spawn);
    }
}

function respawnPlayer() {
    player.hp = player.maxHp;
    player.x = 2;
    player.y = 2;
    player.visualX = 2;
    player.visualY = 2;
    player.currentMap = 'forest';
    player.target = null;
    player.isMoving = false;
    player.moveProgress = 0;
    const { map, width: MAP_WIDTH, height: MAP_HEIGHT } = getCurrentMap();
    
    // Resetar câmera instantaneamente
    camera.x = player.x - Math.floor(camera.width / 2);
    camera.y = player.y - Math.floor(camera.height / 2);
    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - camera.width));
    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - camera.height));
    camera.visualX = camera.x;
    camera.visualY = camera.y;
}

function checkLevelUp() {
    if (player.exp >= player.expToLevel) {
        player.level++;
        player.exp -= player.expToLevel;
        player.expToLevel = Math.floor(player.expToLevel * 1.5);
        player.maxHp += 20;
        player.hp = player.maxHp;
        player.attackMin += 2;
        player.attackMax += 3;
        addLog(`LEVEL UP! Você alcançou o nível ${player.level}!`, 'log-exp');
    }
}

function drawTile(x, y, type) {
    const colors = {
        [TERRAIN.GRASS]: '#2d5016',
        [TERRAIN.WATER]: '#1e4d7b',
        [TERRAIN.STONE]: '#4a4a4a',
        [TERRAIN.PORTAL]: '#ff00ff',
        [TERRAIN.WALL]: '#2a2a2a'
    };
    
    // Converter coordenadas do mundo para coordenadas da tela (usando câmera visual)
    const screenX = Math.round((x - camera.visualX) * TILE_SIZE);
    const screenY = Math.round((y - camera.visualY) * TILE_SIZE);
    
    ctx.fillStyle = colors[type];
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    // Efeito dinâmico só para portais
    if (type === TERRAIN.PORTAL) {
        ctx.fillStyle = '#ff00ff';
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        ctx.globalAlpha = 1;
    }
}

function drawGrid() {
    if (!SHOW_GRID) return;

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;

    const { map, width: MAP_WIDTH, height: MAP_HEIGHT } = getCurrentMap();
    
    // Linhas verticais - apenas tiles visíveis
    const startX = Math.floor(camera.visualX);
    const endX = Math.ceil(camera.visualX + camera.width);
    for (let x = startX; x <= Math.min(endX, MAP_WIDTH); x++) {
        const xPos = (x - camera.visualX) * TILE_SIZE;
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, canvas.height);
        ctx.stroke();
    }
    
    // Linhas horizontais - apenas tiles visíveis
    const startY = Math.floor(camera.visualY);
    const endY = Math.ceil(camera.visualY + camera.height);
    for (let y = startY; y <= Math.min(endY, MAP_HEIGHT); y++) {
        const yPos = (y - camera.visualY) * TILE_SIZE;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(canvas.width, yPos);
        ctx.stroke();
    }
}

function drawPlayer() {
    const screenX = (player.visualX - camera.visualX) * TILE_SIZE;
    const screenY = (player.visualY - camera.visualY) * TILE_SIZE;
    
    ctx.fillStyle = '#b8bd2b';
    ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    
    // HP bar
    drawHealthBar(player.visualX, player.visualY, player.hp, player.maxHp);
}

function drawEnemy(enemy) {
    // Só desenhar se estiver visível na câmera
    if (enemy.x < camera.x - 1 || enemy.x >= camera.x + camera.width + 1 ||
        enemy.y < camera.y - 1 || enemy.y >= camera.y + camera.height + 1) {
        return;
    }
    
    const screenX = (enemy.visualX - camera.visualX) * TILE_SIZE;
    const screenY = (enemy.visualY - camera.visualY) * TILE_SIZE;
    
    // Highlight se for o inimigo sob o cursor
    const isHovered = hoveredEnemy === enemy;
    
    if (isHovered) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
    
    ctx.fillStyle = enemy.type.color;
    ctx.beginPath();
    ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isHovered ? '#ffff00' : '#000';
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.stroke();
    
    // Indicador de alvo
    if (player.target === enemy) {
        // Círculo pulsante ao redor
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 4;
        const pulseSize = TILE_SIZE / 2.3 + Math.sin(Date.now() / 150) * 3;
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, pulseSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Background vermelho semi-transparente
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        
        // Marcador de alvo no canto
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚔', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 1);
    }

    // --- Visualização da rota do inimigo ---
    if (DEBUG_PATHS && enemy.path && enemy.path.length > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < enemy.path.length; i++) {
            const p = enemy.path[i];
            const sx = (p.x - camera.visualX) * TILE_SIZE + TILE_SIZE / 2;
            const sy = (p.y - camera.visualY) * TILE_SIZE + TILE_SIZE / 2;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }

        ctx.stroke();

        // Marcar destino final com um círculo
        const last = enemy.path[enemy.path.length - 1];
        const lx = (last.x - camera.visualX) * TILE_SIZE + TILE_SIZE / 2;
        const ly = (last.y - camera.visualY) * TILE_SIZE + TILE_SIZE / 2;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(lx, ly, TILE_SIZE / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- DEBUG: raio de ação e linha de visão para arqueiros ---
    if (DEBUG_PATHS && enemy.type.name === "Arqueiro Goblin") {
        const range = enemy.type.range || 5;

        // Centro do inimigo
        const centerX = (enemy.visualX - camera.visualX) * TILE_SIZE + TILE_SIZE / 2;
        const centerY = (enemy.visualY - camera.visualY) * TILE_SIZE + TILE_SIZE / 2;

        // Desenha o raio de alcance
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, range * TILE_SIZE, 0, Math.PI * 2);
        ctx.stroke();

        // Se o jogador está no alcance e há linha de visão
        const dx = Math.abs(enemy.x - player.x);
        const dy = Math.abs(enemy.y - player.y);
        const inRange = Math.max(dx, dy) <= range;
        const hasLine = hasLineOfSight(enemy.x, enemy.y, player.x, player.y, enemy.mapId);

        if (inRange && hasLine) {
            // Linha até o jogador
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            const playerX = (player.visualX - camera.visualX) * TILE_SIZE + TILE_SIZE / 2;
            const playerY = (player.visualY - camera.visualY) * TILE_SIZE + TILE_SIZE / 2;
            ctx.lineTo(playerX, playerY);
            ctx.stroke();
        }
    }
    
    drawHealthBar(enemy.visualX, enemy.visualY, enemy.hp, enemy.maxHp);
}

function drawHealthBar(worldX, worldY, hp, maxHp) {
    const screenX = (worldX - camera.visualX) * TILE_SIZE;
    const screenY = (worldY - camera.visualY) * TILE_SIZE;
    
    const barWidth = TILE_SIZE - 4;
    const barHeight = 4;
    const barX = screenX + 2;
    const barY = screenY - 6;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const hpPercent = hp / maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
}

function drawMiniMap() {
    const { map, width: MAP_WIDTH, height: MAP_HEIGHT } = getCurrentMap();

    const scaleX = miniCanvas.width / MAP_WIDTH;
    const scaleY = miniCanvas.height / MAP_HEIGHT;

    // Limpa mini-mapa
    miniCtx.fillStyle = '#111';
    miniCtx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);

    // Desenha terrenos básicos
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map.tiles[y][x];
            switch (tile) {
                case TERRAIN.GRASS: miniCtx.fillStyle = '#235d1b'; break;
                case TERRAIN.WATER: miniCtx.fillStyle = '#1e4d7b'; break;
                case TERRAIN.STONE: miniCtx.fillStyle = '#555'; break;
                case TERRAIN.WALL:  miniCtx.fillStyle = '#222'; break;
                case TERRAIN.PORTAL: miniCtx.fillStyle = '#ff00ff'; break;
            }
            miniCtx.fillRect(x * scaleX, y * scaleY, scaleX, scaleY);
        }
    }

    // Inimigos
    miniCtx.fillStyle = '#ff4444';
    map.enemies.forEach(e => {
        if (e.hp > 0) {
            miniCtx.fillRect(e.x * scaleX, e.y * scaleY, scaleX, scaleY);
        }
    });

    // Player
    miniCtx.fillStyle = '#ffff00';
    miniCtx.fillRect(player.x * scaleX, player.y * scaleY, scaleX, scaleY);

    // Janela da câmera
    miniCtx.strokeStyle = '#00ffff';
    miniCtx.lineWidth = 1;
    miniCtx.strokeRect(
        camera.x * scaleX,
        camera.y * scaleY,
        camera.width * scaleX,
        camera.height * scaleY
    );
}

function drawMap() {
    const { map, width: MAP_WIDTH, height: MAP_HEIGHT } = getCurrentMap();

    // Desenhar apenas tiles visíveis (com margem extra para suavidade)
    const startX = Math.floor(camera.visualX);
    const endX = Math.ceil(camera.visualX + camera.width);
    const startY = Math.floor(camera.visualY);
    const endY = Math.ceil(camera.visualY + camera.height);
    
    for (let y = startY; y < Math.min(endY, MAP_HEIGHT); y++) {
        for (let x = startX; x < Math.min(endX, MAP_WIDTH); x++) {
            const tile = map.tiles[y][x];
            drawTile(x, y, tile);
        }
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateCamera();
    
    const map = maps[player.currentMap];
    
    drawMap();
    drawGrid();
    
    map.enemies.forEach(enemy => {
        if (enemy.hp > 0) drawEnemy(enemy);
    });
    
    drawPlayer();
    drawSpells();
    drawMiniMap();
    drawFloatingTexts();

    if (isTransitioning) {
        ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }   
}

function updateUI() {
    document.getElementById('level').textContent = player.level;
    document.getElementById('attack').textContent = `${player.attackMin}-${player.attackMax}`;
    
    const hpPercent = (player.hp / player.maxHp) * 100;
    document.getElementById('hpBar').style.width = hpPercent + '%';
    document.getElementById('hpText').textContent = `${player.hp}/${player.maxHp}`;
    
    const expPercent = (player.exp / player.expToLevel) * 100;
    document.getElementById('expBar').style.width = expPercent + '%';
    document.getElementById('expText').textContent = `${player.exp}/${player.expToLevel}`;

    const manaPercent = (player.mana / player.maxMana) * 100;
    document.getElementById("manaBar").style.width = manaPercent + "%";
    document.getElementById("manaText").textContent = `${player.mana}/${player.maxMana}`;
    
    if (player.target && player.target.hp > 0) {
        document.getElementById('target').innerHTML = `
            <strong style="color: #ff6666;">${player.target.type.name}</strong><br>
            <small>HP: ${player.target.hp}/${player.target.maxHp}</small>
        `;
    } else {
        player.target = null;
        document.getElementById('target').innerHTML = '<em style="color: #888;">Nenhum alvo</em>';
    }
}

function showUI() {
    const panels = document.querySelectorAll('.panel');
    panels.forEach(p => p.style.display = 'block');

    const miniMap = document.getElementById('miniMap');
    if (miniMap) miniMap.style.display = 'block';

    const spellCooldownIndicator = document.getElementById('spellCooldownIndicator');
    if (spellCooldownIndicator) spellCooldownIndicator.style.display = 'flex';

    const areaSpellCooldownIndicator = document.getElementById('areaSpellCooldownIndicator');
    if (areaSpellCooldownIndicator) areaSpellCooldownIndicator.style.display = 'flex';
}

function updateMapName() {
    document.getElementById('mapName').textContent = maps[player.currentMap].name;
}

function addLog(message, className = '') {
    const log = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + className;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
    
    if (log.children.length > 50) {
        log.removeChild(log.firstChild);
    }
}

const floatingTexts = [];

function addFloatingText(x, y, text, color = "#fff") {
    floatingTexts.push({
        x,
        y,
        text,
        color,
        alpha: 1,
        lifetime: 1200,
        offsetY: 0
    });
}

function updateFloatingTexts(deltaTime) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.lifetime -= deltaTime;
        ft.offsetY -= (deltaTime / 300); // sobe lentamente
        ft.alpha = ft.lifetime / 1000;   // vai ficando transparente
        if (ft.lifetime <= 0) floatingTexts.splice(i, 1);
    }
}

function drawFloatingTexts() {
    floatingTexts.forEach(ft => {
        const screenX = (ft.x - camera.visualX) * TILE_SIZE + TILE_SIZE / 2;
        const screenY = (ft.y - camera.visualY) * TILE_SIZE + TILE_SIZE / 2 + ft.offsetY;

        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(ft.text, screenX, screenY);
        ctx.globalAlpha = 1;
    });
}

function hasLineOfSight(x1, y1, x2, y2, mapId) {
    const map = maps[mapId];
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let cx = x1;
    let cy = y1;

    while (true) {
        // Ignora a posição inicial e final (player e alvo)
        if (!(cx === x1 && cy === y1) && !(cx === x2 && cy === y2)) {
            const tile = map.tiles[cy]?.[cx];
            if (tile === TERRAIN.WALL) return false; // encontrou parede
        }

        if (cx === x2 && cy === y2) break;

        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 < dx) { err += dx; cy += sy; }
    }

    return true; // linha livre
}

let activeSpells = [];

function castSpell() {
    if (player.isDead || !player.target || player.target.hp <= 0) return;

    const manaCost = 10;
    const maxRange = 4;

    // Verifica cooldown
    if (player.spellCooldown > 0) {
        addLog("A magia ainda está recarregando!", "log-info");
        return;
    }

    if (player.mana < manaCost) {
        addLog("Mana insuficiente!", "log-info");
        return;
    }

    const dx = Math.abs(player.x - player.target.x);
    const dy = Math.abs(player.y - player.target.y);
    const distance = Math.max(dx, dy);

    if (distance > maxRange) {
        addLog("O alvo está muito longe!", "log-info");
        return;
    }

    if (!hasLineOfSight(player.x, player.y, player.target.x, player.target.y, player.currentMap)) {
        addLog("Não há linha de visão — o alvo está atrás de uma parede!", "log-info");
        return;
    }

    // Gasta mana e inicia cooldown
    player.mana -= manaCost;
    player.spellCooldown = player.spellCooldownTime;

    // Calcula dano, mas só aplicará no impacto
    const damage = Math.floor(15 + Math.random() * 10);

    // Cria o projétil
    const spell = {
        x: player.visualX,
        y: player.visualY,
        targetX: player.target.visualX,
        targetY: player.target.visualY,
        progress: 0,
        speed: 0.015,
        color: "rgba(100,150,255,0.9)",
        radius: TILE_SIZE / 2,
        damage: damage,
        target: player.target
    };
    activeSpells.push(spell);

    addLog(`Você lançou uma magia em ${player.target.type.name}!`, "log-info");
}

function castAreaSpell() {
    if (player.isDead || !player.target || player.target.hp <= 0) return;

    const manaCost = 25;
    const maxRange = 5;
    const areaRadius = 3; // raio da área

    if (player.areaSpellCooldown > 0) {
        addLog("A magia em área ainda está recarregando!", "log-info");
        return;
    }

    if (player.mana < manaCost) {
        addLog("Mana insuficiente!", "log-info");
        return;
    }

    const dx = Math.abs(player.x - player.target.x);
    const dy = Math.abs(player.y - player.target.y);
    const distance = Math.max(dx, dy);

    if (distance > maxRange) {
        addLog("O alvo está muito longe!", "log-info");
        return;
    }

    if (!hasLineOfSight(player.x, player.y, player.target.x, player.target.y, player.currentMap)) {
        addLog("Não há linha de visão para lançar a magia!", "log-info");
        return;
    }

    // Consome mana e ativa cooldown
    player.mana -= manaCost;
    player.areaSpellCooldown = player.areaSpellCooldownTime;

    const damage = Math.floor(12 + Math.random() * 8);
    const map = maps[player.currentMap];
    const affected = map.enemies.filter(e => e.hp > 0 &&
        Math.hypot(e.x - player.target.x, e.y - player.target.y) <= areaRadius);

    addLog(`Você lançou uma magia em área atingindo ${affected.length} inimigo(s)!`, "log-info");

    // Cria o feitiço de área persistente
    activeSpells.push({
        type: "aoe",
        x: player.target.x,
        y: player.target.y,
        progress: 0,
        radius: 0,
        maxRadius: TILE_SIZE * areaRadius,
        color: "rgba(255,120,0,0.6)",
        affected,
        damage
    });
}

function updateSpells(deltaTime) {
    for (let i = activeSpells.length - 1; i >= 0; i--) {
        const spell = activeSpells[i];

        // Magia de área
        if (spell.type === "aoe") {
            spell.progress += deltaTime / 400;
            spell.radius = spell.maxRadius * Math.min(1, spell.progress);

            // Quando atinge o máximo, aplica o dano e remove
            if (spell.progress >= 1) {
                spell.affected.forEach(e => {
                    const killed = e.takeDamage(spell.damage);
                    addLog(`Explosão atingiu ${e.type.name} causando ${spell.damage} de dano!`, "log-damage");
                    addFloatingText(e.x, e.y, `-${spell.damage}`, "orange");
                    if (killed && player.target === e) player.target = null;
                });
                activeSpells.splice(i, 1);
            }
            continue;
        }

        // Se o alvo morreu, remove a magia
        if (!spell.target || spell.target.hp <= 0) {
            activeSpells.splice(i, 1);
            continue;
        }

        // Avança o progresso do movimento
        spell.progress += spell.speed * (deltaTime / 10);

        // Atualiza continuamente a posição destino com base no movimento do inimigo
        spell.targetX = spell.target.visualX;
        spell.targetY = spell.target.visualY;

        // Se chegou ao final (colidiu)
        if (spell.progress >= 1) {
            if (spell.fromEnemy) {
                player.hp = Math.max(0, player.hp - spell.damage);
                addLog(`Você foi atingido por ${spell.damage} de dano!`, 'log-damage');
                addFloatingText(spell.target.x, spell.target.y, `-${spell.damage}`, "red");
                if (player.hp <= 0 && !player.isDead) {
                    player.isDead = true;
                    addLog('Você morreu! Respawnando...', 'log-info');
                    setTimeout(() => {
                        respawnPlayer();
                        player.isDead = false;
                    }, 2000);
                }
            } else {
                const killed = spell.target.takeDamage(spell.damage);
                addLog(`A magia acertou ${spell.target.type.name} causando ${spell.damage} de dano mágico!`, "log-damage");
                addFloatingText(spell.target.x, spell.target.y, `-${spell.damage}`, "yellow");
                if (killed && player.target === spell.target) player.target = null;
            }

            activeSpells.splice(i, 1);
        }
    }
}

function drawSpells() {
    activeSpells.forEach(spell => {
        const x = spell.x + (spell.targetX - spell.x) * spell.progress;
        const y = spell.y + (spell.targetY - spell.y) * spell.progress;

        const screenX = (x - camera.visualX) * TILE_SIZE + TILE_SIZE / 2;
        const screenY = (y - camera.visualY) * TILE_SIZE + TILE_SIZE / 2;

        if (spell.type === "aoe") {
            const screenX = (spell.x - camera.visualX) * TILE_SIZE + TILE_SIZE / 2;
            const screenY = (spell.y - camera.visualY) * TILE_SIZE + TILE_SIZE / 2;

            const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, spell.radius);
            gradient.addColorStop(0, "rgba(255,200,50,0.8)");
            gradient.addColorStop(1, "rgba(255,50,0,0.1)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(screenX, screenY, spell.radius, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        // Player (magia padrão azul)
        if (!spell.fromEnemy) {
            // Corpo da magia
            const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, spell.radius);
            gradient.addColorStop(0, "rgba(214,32,32,0.8)");
            gradient.addColorStop(1, "rgba(255,119,0,0.5)");

            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(screenX, screenY, spell.radius, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        // Inimigos (projéteis diferentes por tipo)
        if (spell.type === "arrow") {
            // Flecha (arqueiro goblin)
            ctx.save();
            const angle = Math.atan2(spell.targetY - spell.y, spell.targetX - spell.x);
            ctx.translate(screenX, screenY);
            ctx.rotate(angle);
            ctx.strokeStyle = spell.color;
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(-TILE_SIZE / 3, 0);
            ctx.lineTo(TILE_SIZE / 3, 0);
            ctx.stroke();

            // Ponta da flecha
            ctx.beginPath();
            ctx.moveTo(TILE_SIZE / 3, 0);
            ctx.lineTo(TILE_SIZE / 4, 4);
            ctx.lineTo(TILE_SIZE / 4, -4);
            ctx.closePath();
            ctx.fillStyle = spell.color;
            ctx.fill();

            ctx.restore();
        }
    });
}
        
// Controles
const keys = {};

window.addEventListener('keydown', e => {
    e.preventDefault();
    keys[e.key.toLowerCase()] = true;
    
    if (e.key === 'Escape') {
        player.target = null;
    }

    if (e.key.toLowerCase() === 'f') {
        castSpell();
    }

    if (e.key.toLowerCase() === 'g') {
        castAreaSpell();
    }
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

let hoveredEnemy = null;

canvas.addEventListener('click', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Converter clique de tela para coordenadas do mundo
    const clickScreenX = ((e.clientX - rect.left) * scaleX) / TILE_SIZE;
    const clickScreenY = ((e.clientY - rect.top) * scaleY) / TILE_SIZE;
    
    const clickWorldX = Math.floor(clickScreenX + camera.x);
    const clickWorldY = Math.floor(clickScreenY + camera.y);
    
    const map = maps[player.currentMap];
    
    // Procurar inimigo na posição clicada com tolerância
    let enemy = null;
    
    // Primeiro tenta posição exata
    enemy = map.enemies.find(e => e.x === clickWorldX && e.y === clickWorldY && e.hp > 0);
    
    // Se não encontrou, tenta inimigo que está sendo "hovered"
    if (!enemy && hoveredEnemy && hoveredEnemy.hp > 0) {
        enemy = hoveredEnemy;
    }
    
    if (enemy) {
        player.target = enemy;
        addLog(`Atacando: ${enemy.type.name}`, 'log-info');
    } else {
        // Se clicar em espaço vazio, limpar alvo
        if (player.target) {
            player.target = null;
            addLog('Alvo cancelado', 'log-info');
        }
    }
});

let mouseWorldX = null;
let mouseWorldY = null;
let lastMouseX = 0;
let lastMouseY = 0;

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Converter hover de tela para coordenadas do mundo
    const hoverScreenX = ((e.clientX - rect.left) * scaleX) / TILE_SIZE;
    const hoverScreenY = ((e.clientY - rect.top) * scaleY) / TILE_SIZE;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    
    const hoverWorldX = Math.floor(hoverScreenX + camera.x);
    const hoverWorldY = Math.floor(hoverScreenY + camera.y);
    
    mouseWorldX = Math.floor(hoverScreenX + camera.x);
    mouseWorldY = Math.floor(hoverScreenY + camera.y);
});

function handleMovement() {
    if (player.isMoving) return; // Esperar movimento atual terminar
    if (isTransitioning) return;
    if (player.isDead) return;
    
    let newX = player.x;
    let newY = player.y;

    player.prevX = player.x;
    player.prevY = player.y;
    
    if (keys['w'] || keys['arrowup']) newY--;
    if (keys['s'] || keys['arrowdown']) newY++;
    if (keys['a'] || keys['arrowleft']) newX--;
    if (keys['d'] || keys['arrowright']) newX++;
    
    if (newX !== player.x || newY !== player.y) {
        if (canWalk(newX, newY)) {
            // Guardar posição inicial antes de mover
            const oldX = player.x;
            const oldY = player.y;
            
            player.x = newX;
            player.y = newY;
            
            // Se player estava parado, começar da posição visual atual
            if (!player.isMoving) {
                player.visualX = oldX;
                player.visualY = oldY;
            }
            
            player.isMoving = true;
            player.moveProgress = 0;
            checkPortal();
        }
    }
}

function updatePlayerMovement(deltaTime) {
    if (player.isMoving) {
        player.moveProgress += deltaTime / 250;

        // Detectar fim do movimento
        if (player.moveProgress >= 1) {
            player.moveProgress = 0;
            player.isMoving = false;
            player.visualX = player.x;
            player.visualY = player.y;
            return;
        }

        // Início do movimento (posição anterior)
        const startX = player.prevX ?? player.x;
        const startY = player.prevY ?? player.y;

        // Suavização dinâmica com lerp
        const t = 1 - Math.pow(1 - player.moveProgress, 2); // ease-out mais natural
        player.visualX = startX + (player.x - startX) * t;
        player.visualY = startY + (player.y - startY) * t;
    }
}

function attackTarget(deltaTime) {
    if (!player.target || player.target.hp <= 0) {
        player.target = null;
        return;
    }
    
    player.attackCooldown -= deltaTime;
    
    const dx = Math.abs(player.x - player.target.x);
    const dy = Math.abs(player.y - player.target.y);
    const isAdjacent = dx <= 1 && dy <= 1 && (dx + dy) > 0;
    
    if (isAdjacent && player.attackCooldown <= 0) {
        const damage = Math.floor(Math.random() * (player.attackMax - player.attackMin + 1)) + player.attackMin;
        const killed = player.target.takeDamage(damage);
        addLog(`Você causou ${damage} de dano em ${player.target.type.name}`, 'log-damage');
        addFloatingText(player.target.x, player.target.y, `-${damage}`, "yellow");
        player.attackCooldown = player.attackSpeed;
        
        if (killed) {
            player.target = null;
        }
    }
}

function updateHoveredEnemy() {
    if (lastMouseX === null || lastMouseY === null) {
        hoveredEnemy = null;
        canvas.style.cursor = 'default';
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Converter posição atual do mouse para coordenadas do mundo
    const hoverScreenX = ((lastMouseX - rect.left) * scaleX) / TILE_SIZE;
    const hoverScreenY = ((lastMouseY - rect.top) * scaleY) / TILE_SIZE;

    const hoverWorldX = Math.floor(hoverScreenX + camera.x);
    const hoverWorldY = Math.floor(hoverScreenY + camera.y);

    const map = maps[player.currentMap];
    hoveredEnemy = map.enemies.find(e => e.x === hoverWorldX && e.y === hoverWorldY && e.hp > 0);

    canvas.style.cursor = hoveredEnemy ? 'crosshair' : 'default';
}

function updateSpellCooldownUI() {
    const fill = document.getElementById("spellCooldownFill");

    // Calcula o progresso: 0 = pronto, 1 = cooldown cheio
    const progress = Math.min(1, Math.max(0, player.spellCooldown / player.spellCooldownTime));

    // Preenche visualmente conforme o cooldown (cheio = recarregando)
    fill.style.transform = `scaleY(${progress})`;

    // Brilho indicando se a magia está pronta
    const container = document.getElementById("spellCooldownIndicator");
    if (player.spellCooldown <= 0) {
        container.style.borderColor = "#00ff88";
        container.style.boxShadow = "0 0 12px #00ff88";
    } else {
        container.style.borderColor = "#00aaff";
        container.style.boxShadow = "0 0 8px #00aaff88";
    }
}

function updateAreaSpellCooldownUI() {
    const fill = document.getElementById("areaSpellCooldownFill");
    const percent = Math.max(0, player.areaSpellCooldown / player.areaSpellCooldownTime);
    fill.style.transform = `scaleY(${percent})`;

    const container = document.getElementById("areaSpellCooldownIndicator");
    if (player.areaSpellCooldown <= 0) {
        container.style.borderColor = "#ffaa00";
        container.style.boxShadow = "0 0 12px #ffaa00";
    } else {
        container.style.borderColor = "#ff6600";
        container.style.boxShadow = "0 0 8px #ff660088";
    }
}

// Loop principal
let lastTime = Date.now();
let moveTimer = 0;
const MOVE_DELAY = 50;

function gameLoop() {
    const now = Date.now();
    const deltaTime = now - lastTime;
    lastTime = now;
    
    // Atualizar movimento suave do player
    updatePlayerMovement(deltaTime);
    updateSpells(deltaTime);
    updateFloatingTexts(deltaTime);
    
    moveTimer += deltaTime;
    if (moveTimer >= MOVE_DELAY) {
        handleMovement();
        moveTimer = 0;
    }
    
    attackTarget(deltaTime);
    
    const map = maps[player.currentMap];
    map.enemies.forEach(enemy => enemy.update(deltaTime));

    handleRegen(deltaTime);
    handleManaRegen(deltaTime);
    
    if (player.spellCooldown > 0) player.spellCooldown -= deltaTime;
    if (player.areaSpellCooldown > 0) player.areaSpellCooldown -= deltaTime;
    
    updateHoveredEnemy();

    render();
    updateUI();
    updateSpellCooldownUI();
    updateAreaSpellCooldownUI();
    
    requestAnimationFrame(gameLoop);
}

async function loadMapFromCSV(url) {
    const response = await fetch(url);
    const text = await response.text();
    const rows = text.trim().split("\n");

    const tiles = rows.map(row =>
        row.split(",").map(value => parseInt(value.trim()))
    );

    return tiles;
}

async function initGame() {
    const forestURL = "https://gist.githubusercontent.com/the-akira/57cc4fda0b2475589a590f5fd3eae93e/raw/0778b1339d27b10cc1bfea22387c3ca1ecfec57d/grassMap.csv";
    const caveURL = "https://gist.githubusercontent.com/the-akira/f9dc6e6d679870972fb47f1b7a553383/raw/b403f3bdfcfe84fa3597dd73d06554a4780698e3/caveMap.csv"; 

    // Carregar CSVs
    maps.forest.tiles = await loadMapFromCSV(forestURL);
    maps.cave.tiles = await loadMapFromCSV(caveURL); 

    // Atualizar portais
    maps.forest.portals.forEach(p => maps.forest.tiles[p.y][p.x] = TERRAIN.PORTAL);
    maps.cave.portals.forEach(p => maps.cave.tiles[p.y][p.x] = TERRAIN.PORTAL);

    // Spawnar inimigos
    for (const [mapId, mapData] of Object.entries(maps)) {
        mapData.enemies = mapData.enemies.map(e => 
            new Enemy(e.x, e.y, enemyTypes[e.type], mapId)
        );
    }

    addLog("Mapa carregado!", "log-info");
    addLog('Bem-vindo ao RPG!', 'log-info');
    showUI();
    updateMapName();
    gameLoop();
}

let gameStarted = false;
let loading = false;

function drawStartScreen() {
    if (gameStarted || loading) return; // <--- impede redesenho depois que inicia

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 36px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText("ADVENTURE RPG", canvas.width / 2, canvas.height / 2 - 60);

    ctx.font = "20px 'Courier New'";
    ctx.fillText("Pressione ENTER para começar", canvas.width / 2, canvas.height / 2 + 40);

    requestAnimationFrame(drawStartScreen);
}

window.addEventListener("keydown", (e) => {
    if (!gameStarted && e.key === "Enter" && !loading) {
        loading = true;
        let progress = 0;

        // Anima a barra até 100%
        function drawLoadingScreen() {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";
            ctx.font = "28px 'Courier New'";
            ctx.textAlign = "center";
            ctx.fillText("Carregando mapa...", canvas.width / 2, canvas.height / 2 - 60);

            // Fundo da barra
            const barWidth = 400;
            const barHeight = 20;
            const barX = (canvas.width - barWidth) / 2;
            const barY = canvas.height / 2;
            ctx.fillStyle = "#333";
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Parte preenchida
            ctx.fillStyle = "#00ff88";
            ctx.fillRect(barX, barY, (barWidth * progress) / 100, barHeight);

            if (progress < 100 && loading) {
                progress += 1.2; // velocidade da barra
                requestAnimationFrame(drawLoadingScreen);
            } else if (loading) {
                startGameAfterLoading();
            }
        }

        // Quando a barra termina, inicia o jogo real
        async function startGameAfterLoading() {
            await initGame();
            showUI();
            gameStarted = true;
            loading = false;
        }

        drawLoadingScreen();
    }
});

drawStartScreen();

let DEBUG_PATHS = false;
let SHOW_GRID = true;

document.addEventListener("DOMContentLoaded", () => {
    const debugToggle = document.getElementById("debugToggle");

    if (debugToggle) {
        debugToggle.checked = DEBUG_PATHS;
        debugToggle.addEventListener("change", (e) => {
            DEBUG_PATHS = e.target.checked;
            addLog(`DEBUG ${DEBUG_PATHS ? 'ativado' : 'desativado'}`, 'log-info');
        });
    }

    if (gridToggle) {
        gridToggle.checked = SHOW_GRID;
        gridToggle.addEventListener("change", (e) => {
            SHOW_GRID = e.target.checked;
            addLog(`Grid ${SHOW_GRID ? 'ativada' : 'desativada'}`, 'log-info');
        });
    }
});