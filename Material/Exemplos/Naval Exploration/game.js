const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');
const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;

// Configurações do jogo
const TILE_SIZE = 20;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 60;
const VISION_RADIUS = 5;

// Tipos de terreno
const TERRAIN = {
    OCEAN: 0,
    SHALLOW: 1,
    LAND: 2,
    MOUNTAIN: 3,
    FOREST: 4
};

// Cores dos terrenos
const TERRAIN_COLORS = {
    [TERRAIN.OCEAN]: '#0066cc',
    [TERRAIN.SHALLOW]: '#3399ff',
    [TERRAIN.LAND]: '#8B7355',
    [TERRAIN.MOUNTAIN]: '#666666',
    [TERRAIN.FOREST]: '#228B22'
};

// Definição de mapas/regiões
const MAPS = {
    'oceano_inicial': {
        name: 'Oceano Inicial',
        numIslands: 5,
        islandSizeMin: 8,
        islandSizeMax: 12,
        enemyCount: 5
    },
    'mar_profundo': {
        name: 'Mar Profundo',
        numIslands: 3,
        islandSizeMin: 10,
        islandSizeMax: 18,
        enemyCount: 7
    },
    'arquipelago': {
        name: 'Arquipélago',
        numIslands: 10,
        islandSizeMin: 4,
        islandSizeMax: 8,
        enemyCount: 6
    }
};

// Estado do jogo
const game = {
    ship: { 
        x: 10, 
        y: 10, 
        vx: 0,
        vy: 0,
        angle: 0,
        speed: 0,
        maxSpeed: 0.12,
        acceleration: 0.003,
        deceleration: 0.001,
        turnSpeed: 0.04,
        hp: 1000,
        maxHp: 1000,
        cannonCooldown: 0,
        cannonReloadTime: 30
    },
    player: {
        x: 10,
        y: 10,
        angle: 0,
        speed: 0,
        maxSpeed: 0.08,
        onLand: false
    },
    lastShipPosition: { x: 10, y: 10, angle: null }, 
    camera: { 
        x: 0, 
        y: 0,
        targetX: 0,
        targetY: 0,
        smoothing: 0.1
    },
    currentMap: 'oceano_inicial',
    worldData: {}, // Armazena dados de cada mapa visitado
    cannonballs: [],
    enemies: [],
    portals: [],
    keys: {},
    lastTime: Date.now(),
    enemySpawnTimer: 0,
    enemySpawnInterval: 300,
    score: 0,
    nearPortal: null,
    isTransitioning: false,
    gameOver: false,
    debugMode: false
};

// Gera o mapa proceduralmente
function generateMap(mapKey) {
    const mapConfig = MAPS[mapKey];
    const map = [];
    const explored = [];
    const portals = [];

    // Inicializa com oceano
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        explored[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = TERRAIN.OCEAN;
            explored[y][x] = false;
        }
    }

    // Adiciona continentes
    for (let i = 0; i < mapConfig.numIslands; i++) {
        const centerX = Math.floor(Math.random() * MAP_WIDTH);
        const centerY = Math.floor(Math.random() * MAP_HEIGHT);
        const size = mapConfig.islandSizeMin + Math.floor(Math.random() * (mapConfig.islandSizeMax - mapConfig.islandSizeMin));
        
        for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size; dx <= size; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const noise = Math.random() * 3;
                    
                    if (dist < size - 4 + noise) {
                        map[y][x] = TERRAIN.LAND;
                        
                        if (dist < size - 6 + noise && Math.random() > 0.5) {
                            map[y][x] = Math.random() > 0.5 ? TERRAIN.FOREST : TERRAIN.MOUNTAIN;
                        }
                    } else if (dist < size + noise) {
                        map[y][x] = TERRAIN.SHALLOW;
                    }
                }
            }
        }
    }

    // Garante posição inicial livre
    for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
            const x = 10 + dx;
            const y = 10 + dy;
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                map[y][x] = TERRAIN.OCEAN;
            }
        }
    }

    // Cria portais para outros mapas
    const otherMaps = Object.keys(MAPS).filter(k => k !== mapKey);
    otherMaps.forEach((targetMap, index) => {
        let px, py, attempts = 0;
        do {
            px = 15 + Math.random() * (MAP_WIDTH - 30);
            py = 15 + Math.random() * (MAP_HEIGHT - 30);
            attempts++;
        } while (attempts < 50 && map[Math.floor(py)][Math.floor(px)] !== TERRAIN.OCEAN);

        if (attempts < 50) {
            portals.push({
                x: px,
                y: py,
                targetMap: targetMap,
                radius: 2,
                angle: 0
            });
        }
    });

    return { map, explored, portals };
}

// Inicializa ou recupera dados do mapa
function loadMap(mapKey, spawnX = null, spawnY = null) {
    if (!game.worldData[mapKey]) {
        const data = generateMap(mapKey);
        game.worldData[mapKey] = {
            map: data.map,
            explored: data.explored,
            portals: data.portals,
            enemies: []
        };
    }

    // IMPORTANTE: Troca o currentMap PRIMEIRO
    game.currentMap = mapKey;
    game.portals = game.worldData[mapKey].portals;
    game.enemies = game.worldData[mapKey].enemies;

    if (spawnX !== null && spawnY !== null) {
        game.ship.x = spawnX;
        game.ship.y = spawnY;
    }
    
    // NÃO atualiza exploração aqui - será feito manualmente depois
}

// Transição de portal
function enterPortal(portal) {
    if (game.isTransitioning) return;
    
    game.isTransitioning = true;
    game.nearPortal = null; 
    game.ship.speed = 0;
    game.ship.vx = 0;
    game.ship.vy = 0;
    
    const transitionEl = document.getElementById('portal-transition');
    transitionEl.textContent = `Viajando para ${MAPS[portal.targetMap].name}...`;
    transitionEl.style.display = 'flex';
    
    // Força reflow para aplicar a transição
    transitionEl.offsetHeight;
    transitionEl.classList.add('active');

    // Limpa inimigos e balas do mapa atual
    game.cannonballs = [];

    setTimeout(() => {
        // IMPORTANTE: Guarda o mapa anterior antes de trocar
        const previousMap = game.currentMap;
        
        // Troca para o novo mapa ANTES de fazer qualquer coisa
        loadMap(portal.targetMap);
        
        const returnPortal = game.portals.find(p => p.targetMap === previousMap);
        
        const currentMapData = game.worldData[game.currentMap];
        let spawnX = 10;
        let spawnY = 10;
        
        if (returnPortal) {
            // Tenta spawnar próximo ao portal de retorno
            // Busca uma posição segura em oceano ao redor do portal
            let foundSafeSpot = false;
            
            for (let radius = 3; radius <= 8 && !foundSafeSpot; radius++) {
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                    const testX = returnPortal.x + Math.cos(angle) * radius;
                    const testY = returnPortal.y + Math.sin(angle) * radius;
                    const tileX = Math.floor(testX);
                    const tileY = Math.floor(testY);
                    
                    if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
                        if (currentMapData.map[tileY][tileX] === TERRAIN.OCEAN) {
                            spawnX = testX;
                            spawnY = testY;
                            foundSafeSpot = true;
                            break;
                        }
                    }
                }
            }
        }

        // Atualiza posição do navio DEPOIS de trocar o mapa
        game.ship.x = spawnX;
        game.ship.y = spawnY;
        game.ship.speed = 0;
        game.ship.vx = 0;
        game.ship.vy = 0;
        game.camera.x = game.ship.x - 20;
        game.camera.y = game.ship.y - 15;
        game.camera.targetX = game.camera.x;
        game.camera.targetY = game.camera.y;
        
        // Agora sim atualiza a exploração do NOVO mapa
        updateExploration();

        // Fade out
        transitionEl.classList.remove('active');
        
        setTimeout(() => {
            transitionEl.style.display = 'none';
            game.isTransitioning = false;
        }, 300);
    }, 800);
}

// Atualiza áreas exploradas
function updateExploration() {
    const currentData = game.worldData[game.currentMap];
    const sx = Math.floor(game.player.onLand ? game.player.x : game.ship.x);
    const sy = Math.floor(game.player.onLand ? game.player.y : game.ship.y);
    
    for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
        for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
            const x = sx + dx;
            const y = sy + dy;
            
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= VISION_RADIUS) {
                    currentData.explored[y][x] = true;
                }
            }
        }
    }
}

// Calcula porcentagem explorada
function getExplorationPercent() {
    const currentData = game.worldData[game.currentMap];
    let explored = 0;
    let total = MAP_WIDTH * MAP_HEIGHT;
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (currentData.explored[y][x]) explored++;
        }
    }
    
    return Math.floor((explored / total) * 100);
}

// Cria inimigo
function spawnEnemy() {
    const currentData = game.worldData[game.currentMap];
    let x, y, attempts = 0;
    do {
        x = Math.random() * MAP_WIDTH;
        y = Math.random() * MAP_HEIGHT;
        attempts++;
        if (attempts > 100) return;
    } while (
        currentData.map[Math.floor(y)][Math.floor(x)] !== TERRAIN.OCEAN ||
        Math.hypot(x - game.ship.x, y - game.ship.y) < 15
    );

    game.enemies.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        angle: Math.random() * Math.PI * 2,
        speed: 0,
        maxSpeed: 0.08,
        acceleration: 0.002,
        turnSpeed: 0.03,
        hp: 50,
        maxHp: 50,
        cannonCooldown: 0,
        cannonReloadTime: 45,
        state: 'patrol',
        patrolTimer: 0,
        stuckCounter: 0,
        lastX: x,
        lastY: y,
        lastCollisionTime: 0
    });
}

// Atira canhão
function fireCannonball(ship, isPlayer = true) {
    const offsetDist = TILE_SIZE / TILE_SIZE;
    game.cannonballs.push({
        x: ship.x + Math.sin(ship.angle) * offsetDist,
        y: ship.y - Math.cos(ship.angle) * offsetDist,
        vx: Math.sin(ship.angle) * 0.3,
        vy: -Math.cos(ship.angle) * 0.3,
        lifetime: 100,
        isPlayer: isPlayer
    });
}

// Atualiza balas de canhão
function updateCannonballs(dt) {
    const currentData = game.worldData[game.currentMap];
    
    for (let i = game.cannonballs.length - 1; i >= 0; i--) {
        const ball = game.cannonballs[i];
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        ball.lifetime -= dt;

        if (ball.lifetime <= 0 || ball.x < 0 || ball.x >= MAP_WIDTH || 
            ball.y < 0 || ball.y >= MAP_HEIGHT) {
            game.cannonballs.splice(i, 1);
            continue;
        }

        const tileX = Math.floor(ball.x);
        const tileY = Math.floor(ball.y);
        if (currentData.map[tileY] && currentData.map[tileY][tileX] !== TERRAIN.OCEAN && 
            currentData.map[tileY][tileX] !== TERRAIN.SHALLOW) {
            game.cannonballs.splice(i, 1);
            continue;
        }

        if (!ball.isPlayer && Math.hypot(ball.x - game.ship.x, ball.y - game.ship.y) < 0.8) {
            game.ship.hp = Math.max(0, game.ship.hp - 20);
            game.cannonballs.splice(i, 1);
            continue;
        }

        if (ball.isPlayer) {
            for (let j = game.enemies.length - 1; j >= 0; j--) {
                const enemy = game.enemies[j];
                if (Math.hypot(ball.x - enemy.x, ball.y - enemy.y) < 0.8) {
                    enemy.hp -= 25;
                    game.cannonballs.splice(i, 1);
                    if (enemy.hp <= 0) {
                        game.enemies.splice(j, 1);
                        game.score += 100;
                    }
                    break;
                }
            }
        }
    }
}

// Verifica se uma posição é navegável
function isNavigable(x, y) {
    const currentData = game.worldData[game.currentMap];
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    
    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
        return false;
    }
    
    const terrain = currentData.map[tileY][tileX];
    return terrain === TERRAIN.OCEAN || terrain === TERRAIN.SHALLOW;
}

// Encontra o melhor ângulo para contornar um obstáculo
function findNavigableAngle(enemy, targetAngle) {
    const testAngles = [
        0, 
        Math.PI/4, -Math.PI/4,
        Math.PI/2, -Math.PI/2,
        Math.PI/3, -Math.PI/3,
        2*Math.PI/3, -2*Math.PI/3,
        3*Math.PI/4, -3*Math.PI/4
    ];
    
    let bestAngle = targetAngle;
    let bestScore = -1;
    
    for (const offset of testAngles) {
        const testAngle = targetAngle + offset;
        let clearDistance = 0;
        
        // Verifica caminho até 8 tiles
        for (let dist = 1; dist <= 8; dist++) {
            const checkX = enemy.x + Math.sin(testAngle) * dist;
            const checkY = enemy.y - Math.cos(testAngle) * dist;
            
            if (!isNavigable(checkX, checkY)) break;
            clearDistance = dist;
        }
        
        const angleDiff = Math.abs(offset);
        const score = clearDistance * 10 - angleDiff * 2;
        
        if (score > bestScore) {
            bestScore = score;
            bestAngle = testAngle;
        }
    }
    
    return bestAngle;
}

// Verifica linha de visão entre inimigo e jogador
function hasLineOfSight(enemy, targetX, targetY) {
    const currentData = game.worldData[game.currentMap];
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Número de steps baseado na distância (mais preciso)
    const steps = Math.ceil(distance * 2); // Dobro de precisão
    
    for (let i = 1; i < steps; i++) {
        const ratio = i / steps;
        const checkX = enemy.x + dx * ratio;
        const checkY = enemy.y + dy * ratio;
        
        // Verifica o tile principal
        const tileX = Math.floor(checkX);
        const tileY = Math.floor(checkY);
        
        if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
            const terrain = currentData.map[tileY][tileX];
            if (terrain !== TERRAIN.OCEAN && terrain !== TERRAIN.SHALLOW) {
                return false;
            }
        }
        
        // NOVO: Verifica tiles adjacentes quando está perto de bordas (detecta diagonais)
        const fracX = checkX - tileX; // Parte fracionária (0-1)
        const fracY = checkY - tileY;
        
        const edgeThreshold = 0.2; // Distância da borda do tile
        
        // Perto da borda direita
        if (fracX > 1 - edgeThreshold && tileX + 1 < MAP_WIDTH) {
            const terrainRight = currentData.map[tileY][tileX + 1];
            if (terrainRight !== TERRAIN.OCEAN && terrainRight !== TERRAIN.SHALLOW) {
                return false;
            }
        }
        
        // Perto da borda esquerda
        if (fracX < edgeThreshold && tileX - 1 >= 0) {
            const terrainLeft = currentData.map[tileY][tileX - 1];
            if (terrainLeft !== TERRAIN.OCEAN && terrainLeft !== TERRAIN.SHALLOW) {
                return false;
            }
        }
        
        // Perto da borda inferior
        if (fracY > 1 - edgeThreshold && tileY + 1 < MAP_HEIGHT) {
            const terrainDown = currentData.map[tileY + 1][tileX];
            if (terrainDown !== TERRAIN.OCEAN && terrainDown !== TERRAIN.SHALLOW) {
                return false;
            }
        }
        
        // Perto da borda superior
        if (fracY < edgeThreshold && tileY - 1 >= 0) {
            const terrainUp = currentData.map[tileY - 1][tileX];
            if (terrainUp !== TERRAIN.OCEAN && terrainUp !== TERRAIN.SHALLOW) {
                return false;
            }
        }
        
        // NOVO: Verifica cantos diagonais (crítico para detectar bloqueios diagonais)
        if (fracX > 1 - edgeThreshold && fracY > 1 - edgeThreshold) {
            // Canto inferior direito
            if (tileX + 1 < MAP_WIDTH && tileY + 1 < MAP_HEIGHT) {
                const terrainDiag = currentData.map[tileY + 1][tileX + 1];
                if (terrainDiag !== TERRAIN.OCEAN && terrainDiag !== TERRAIN.SHALLOW) {
                    return false;
                }
            }
        }
        
        if (fracX < edgeThreshold && fracY > 1 - edgeThreshold) {
            // Canto inferior esquerdo
            if (tileX - 1 >= 0 && tileY + 1 < MAP_HEIGHT) {
                const terrainDiag = currentData.map[tileY + 1][tileX - 1];
                if (terrainDiag !== TERRAIN.OCEAN && terrainDiag !== TERRAIN.SHALLOW) {
                    return false;
                }
            }
        }
        
        if (fracX > 1 - edgeThreshold && fracY < edgeThreshold) {
            // Canto superior direito
            if (tileX + 1 < MAP_WIDTH && tileY - 1 >= 0) {
                const terrainDiag = currentData.map[tileY - 1][tileX + 1];
                if (terrainDiag !== TERRAIN.OCEAN && terrainDiag !== TERRAIN.SHALLOW) {
                    return false;
                }
            }
        }
        
        if (fracX < edgeThreshold && fracY < edgeThreshold) {
            // Canto superior esquerdo
            if (tileX - 1 >= 0 && tileY - 1 >= 0) {
                const terrainDiag = currentData.map[tileY - 1][tileX - 1];
                if (terrainDiag !== TERRAIN.OCEAN && terrainDiag !== TERRAIN.SHALLOW) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// Calcula ângulo do inimigo para o jogador
function getAngleToPlayer(enemy) {
    return Math.atan2(
        game.ship.x - enemy.x,
        -(game.ship.y - enemy.y)
    );
}

// Normaliza diferença de ângulo
function normalizeAngleDiff(angleDiff) {
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    return angleDiff;
}

// Comportamento de patrulha
function updateEnemyPatrol(enemy, dt) {
    const margin = 5;
    
    enemy.navigationMode = 'direct';
    enemy.patrolTimer -= dt;
    
    // Perto dos limites, vira para o centro
    const nearBoundary = enemy.x < margin || enemy.x > MAP_WIDTH - margin || 
                         enemy.y < margin || enemy.y > MAP_HEIGHT - margin;
    
    if (nearBoundary && enemy.patrolTimer <= 10) {
        const centerAngle = Math.atan2(
            MAP_WIDTH / 2 - enemy.x,
            -(MAP_HEIGHT / 2 - enemy.y)
        );
        enemy.angle = centerAngle;
        enemy.patrolTimer = 40 + Math.random() * 40;
    } else if (enemy.patrolTimer <= 0) {
        enemy.angle += (Math.random() - 0.5) * 0.4;
        enemy.patrolTimer = 60 + Math.random() * 60;
    }
    
    // Velocidade de patrulha
    let targetSpeed = enemy.maxSpeed * 0.4;
    if (nearBoundary) targetSpeed *= 0.6;
    
    if (enemy.speed > targetSpeed) {
        enemy.speed = Math.max(targetSpeed, enemy.speed - enemy.acceleration * dt * 2);
    } else {
        enemy.speed = Math.min(targetSpeed, enemy.speed + enemy.acceleration * dt);
    }
}

// Comportamento de perseguição
// Comportamento de perseguição
function updateEnemyChase(enemy, dt, distToPlayer) {
    const angleToPlayer = getAngleToPlayer(enemy);
    const hasLOS = hasLineOfSight(enemy, game.ship.x, game.ship.y);
    const positionChanged = Math.abs(enemy.x - enemy.lastX) > 0.001 || Math.abs(enemy.y - enemy.lastY) > 0.001;
    const isMoving = positionChanged && enemy.speed > 0.01;
    
    // Sistema de hysteresis para LOS (evita oscilação rápida)
    if (!enemy.losHistory) {
        enemy.losHistory = [];
        enemy.stableLOS = hasLOS;
    }
    
    // Mantém histórico dos últimos frames
    enemy.losHistory.push(hasLOS);
    if (enemy.losHistory.length > 20) { // ~0.3 segundos
        enemy.losHistory.shift();
    }
    
    // Só muda stableLOS se houver consenso
    const losCount = enemy.losHistory.filter(x => x).length;
    if (losCount >= 15) { // 75% dos frames tem LOS
        enemy.stableLOS = true;
    } else if (losCount <= 5) { // 25% dos frames tem LOS
        enemy.stableLOS = false;
    }
    // Entre 25-75% mantém o estado anterior (hysteresis)
    
    let targetAngle = angleToPlayer;
    
    // Usa LOS estável ao invés do instantâneo
    if (!enemy.stableLOS) {
        if (enemy.navigationMode === 'direct') {
            enemy.navigationMode = 'avoiding';
            enemy.avoidanceAngle = findNavigableAngle(enemy, angleToPlayer);
            enemy.avoidanceTimer = 150;
            enemy.stuckCounter = 0;
        }
        
        // Se está parado sem linha de visão por muito tempo, desiste
        if (!isMoving) {
            enemy.stuckCounter += dt;
            
            console.log(`Inimigo parado sem LOS. Counter: ${enemy.stuckCounter.toFixed(1)}, speed: ${enemy.speed.toFixed(3)}, stableLOS: ${enemy.stableLOS}`);
            
            if (enemy.stuckCounter > 80) { // Aumentei de 60 para 80 (~2.7s)
                console.log('🚨 Inimigo desistiu! Voltando para patrulha');
                console.log(`Posição: x=${enemy.x.toFixed(1)}, y=${enemy.y.toFixed(1)}, distância: ${distToPlayer.toFixed(1)}`);
                
                enemy.state = 'patrol';
                enemy.forcePatrol = true;
                enemy.navigationMode = 'direct';
                enemy.stuckCounter = 0;
                enemy.losHistory = []; // Limpa histórico
                
                // Vira para direção oposta ao jogador
                const escapeAngle = angleToPlayer + Math.PI + (Math.random() - 0.5) * Math.PI / 2;
                enemy.angle = escapeAngle;
                enemy.patrolTimer = 200 + Math.random() * 200; // Aumentei o tempo de patrulha forçada
                enemy.speed = enemy.maxSpeed * 0.6;
                
                console.log(`Fuga: ângulo=${enemy.angle.toFixed(2)}, velocidade=${enemy.speed.toFixed(3)}`);
                
                return true;
            }
        } else {
            enemy.stuckCounter = Math.max(0, enemy.stuckCounter - dt * 0.3); // Reduz mais devagar
        }
    } else {
        // TEM linha de visão estável
        if (isMoving) {
            enemy.stuckCounter = Math.max(0, enemy.stuckCounter - dt * 0.5);
        }
    }
    
    // ===== MODO DE CONTORNO =====
    if (enemy.navigationMode === 'avoiding') {
        enemy.avoidanceTimer -= dt;
        targetAngle = enemy.avoidanceAngle;
        
        // Verifica se caminho direto está livre (mas só se LOS estável)
        let pathClear = false;
        if (enemy.stableLOS) {
            pathClear = true;
            for (let dist = 1; dist <= 5; dist++) {
                const checkX = enemy.x + Math.sin(angleToPlayer) * dist;
                const checkY = enemy.y - Math.cos(angleToPlayer) * dist;
                if (!isNavigable(checkX, checkY)) {
                    pathClear = false;
                    break;
                }
            }
        }
        
        // Volta ao modo direto apenas se caminho livre E LOS estável
        if (pathClear || enemy.avoidanceTimer <= 0) {
            enemy.navigationMode = 'direct';
            enemy.stuckCounter = 0;
            targetAngle = angleToPlayer;
        } else if (enemy.avoidanceTimer % 40 === 0) {
            // Recalcula periodicamente
            enemy.avoidanceAngle = findNavigableAngle(enemy, angleToPlayer);
            targetAngle = enemy.avoidanceAngle;
        }
    }
    
    // ===== ROTAÇÃO =====
    let angleDiff = normalizeAngleDiff(targetAngle - enemy.angle);
    const turnMultiplier = enemy.navigationMode === 'avoiding' ? 0.7 : 1.0;
    
    if (Math.abs(angleDiff) > 0.1) {
        enemy.angle += Math.sign(angleDiff) * enemy.turnSpeed * dt * turnMultiplier;
    }
    
    // ===== VELOCIDADE =====
    const idealDistance = 6;
    const tooCloseDistance = 4;
    
    if (enemy.navigationMode === 'avoiding') {
        // Modo contorno: velocidade constante
        const targetSpeed = enemy.maxSpeed * 0.7;
        if (Math.abs(angleDiff) < Math.PI / 6) {
            enemy.speed = Math.min(targetSpeed, enemy.speed + enemy.acceleration * dt * 2);
        } else {
            enemy.speed = Math.max(targetSpeed * 0.5, enemy.speed - enemy.acceleration * dt);
        }
    } else {
        // Modo direto: baseado na distância
        if (distToPlayer > idealDistance + 1) {
            // Muito longe: acelera
            enemy.speed = Math.min(enemy.maxSpeed, enemy.speed + enemy.acceleration * dt);
        } else if (distToPlayer < tooCloseDistance) {
            // Muito perto: recua
            enemy.speed = Math.max(-enemy.maxSpeed * 0.5, enemy.speed - enemy.acceleration * dt * 2);
        } else {
            // Distância ideal
            if (!enemy.stableLOS) { // Usa stableLOS
                // Sem visão: continua se movendo
                const targetSpeed = enemy.maxSpeed * 0.8;
                enemy.speed = Math.min(targetSpeed, enemy.speed + enemy.acceleration * dt);
            } else {
                // Com visão: desacelera
                if (enemy.speed > 0) {
                    enemy.speed = Math.max(0, enemy.speed - enemy.acceleration * dt * 3);
                } else {
                    enemy.speed = Math.min(0, enemy.speed + enemy.acceleration * dt * 3);
                }
            }
        }
    }
    
    // ===== TIRO =====
    const engageDistance = 12;
    const wellAligned = Math.abs(angleDiff) < 0.3;
    
    // Só atira se tiver LOS estável
    if (enemy.navigationMode === 'direct' && enemy.stableLOS && wellAligned && distToPlayer < engageDistance) {
        if (enemy.cannonCooldown <= 0) {
            fireCannonball(enemy, false);
            enemy.cannonCooldown = enemy.cannonReloadTime;
        }
    }
    
    return false; // Não mudou de estado
}

// Atualiza movimento físico do inimigo
function updateEnemyMovement(enemy, dt) {
    const currentData = game.worldData[game.currentMap];

    enemy.lastX = enemy.x;
    enemy.lastY = enemy.y;
    
    enemy.vx = Math.sin(enemy.angle) * enemy.speed * dt;
    enemy.vy = -Math.cos(enemy.angle) * enemy.speed * dt;
    
    const newX = enemy.x + enemy.vx;
    const newY = enemy.y + enemy.vy;
    const tileX = Math.floor(newX);
    const tileY = Math.floor(newY);
    
    // Verifica colisão
    if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
        const terrain = currentData.map[tileY][tileX];
        
        if (terrain === TERRAIN.OCEAN || terrain === TERRAIN.SHALLOW) {
            enemy.x = newX;
            enemy.y = newY;
        } else {
            // Colidiu com terra
            enemy.speed *= 0.3;
            
            if (enemy.state === 'chase' && enemy.navigationMode === 'direct') {
                const angleToPlayer = getAngleToPlayer(enemy);
                enemy.navigationMode = 'avoiding';
                enemy.avoidanceAngle = findNavigableAngle(enemy, angleToPlayer);
                enemy.avoidanceTimer = 100;
                enemy.stuckCounter = 0;
            } else if (enemy.state === 'patrol') {
                enemy.angle += Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
            }
        }
    } else {
        // Fora dos limites - corrige posição
        enemy.angle += Math.PI;
        enemy.speed *= 0.5;
    }
    
    // Mantém dentro dos limites
    enemy.x = Math.max(0.5, Math.min(MAP_WIDTH - 0.5, enemy.x));
    enemy.y = Math.max(0.5, Math.min(MAP_HEIGHT - 0.5, enemy.y));
}

// ========== FUNÇÃO PRINCIPAL ==========
function updateEnemies(dt) {
    for (let i = game.enemies.length - 1; i >= 0; i--) {
        const enemy = game.enemies[i];
        const distToPlayer = Math.hypot(enemy.x - game.ship.x, enemy.y - game.ship.y);
        const engageDistance = 12;
        
        // Inicializa propriedades se necessário
        if (enemy.navigationMode === undefined) {
            enemy.navigationMode = 'direct';
            enemy.avoidanceAngle = 0;
            enemy.avoidanceTimer = 0;
            enemy.stuckCounter = 0;
            enemy.forcePatrol = false; // Nova flag
        }
        
        // Atualiza cooldown do canhão
        enemy.cannonCooldown = Math.max(0, enemy.cannonCooldown - dt);
        
        // Define estado baseado na distância, MAS respeita forcePatrol
        if (enemy.forcePatrol) {
            // Conta frames em forcePatrol
            if (!enemy.forcePatrolTimer) {
                enemy.forcePatrolTimer = 0;
            }
            enemy.forcePatrolTimer += dt;
            
            enemy.state = 'patrol';
            console.log(`⚠️ Inimigo em forcePatrol. Timer: ${enemy.forcePatrolTimer.toFixed(1)}, Distância: ${distToPlayer.toFixed(1)}`);
            
            // Desativa forcePatrol após 180 frames (~3 segundos) OU se ficou longe o suficiente
            if (enemy.forcePatrolTimer > 180 || distToPlayer > engageDistance + 8) {
                enemy.forcePatrol = false;
                enemy.forcePatrolTimer = 0;
                console.log('✅ ForcePatrol desativado, inimigo livre novamente');
            }
        } else {
            enemy.state = distToPlayer < engageDistance ? 'chase' : 'patrol';
        }
        
        // Executa comportamento apropriado
        if (enemy.state === 'chase') {
            const changedToPatrol = updateEnemyChase(enemy, dt, distToPlayer);
            // Se mudou para patrulha dentro do chase, não precisa atualizar movimento
            // pois já foi configurado
            if (changedToPatrol) {
                updateEnemyMovement(enemy, dt);
                continue; // Pula para o próximo inimigo
            }
        } else {
            updateEnemyPatrol(enemy, dt);
        }
        
        // Atualiza movimento físico
        updateEnemyMovement(enemy, dt);
    }
}

// Verifica proximidade com portais
function checkPortalProximity() {
    game.nearPortal = null;
    
    for (const portal of game.portals) {
        const dist = Math.hypot(game.ship.x - portal.x, game.ship.y - portal.y);
        if (dist < 1) {
            game.nearPortal = portal;
            return;
        }
    }
}

// Verifica se pode desembarcar/embarcar
function checkLandingSpot() {
    if (game.player.onLand) {
        // Está em terra, verifica se pode voltar ao navio
        const distToShip = Math.hypot(game.player.x - game.ship.x, game.player.y - game.ship.y);
        return distToShip < 2;
    } else {
        // Está no navio, verifica se há terra próxima
        const currentData = game.worldData[game.currentMap];
        const shipTileX = Math.floor(game.ship.x);
        const shipTileY = Math.floor(game.ship.y);
        
        // Procura terra próxima ao navio
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const checkX = shipTileX + dx;
                const checkY = shipTileY + dy;
                
                if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
                    const terrain = currentData.map[checkY][checkX];
                    if (terrain === TERRAIN.LAND || terrain === TERRAIN.FOREST || terrain === TERRAIN.MOUNTAIN) {
                        const dist = Math.hypot(dx, dy);
                        if (dist < 2) {
                            return { canLand: true, x: checkX + 0.5, y: checkY + 0.5 };
                        }
                    }
                }
            }
        }
        return { canLand: false };
    }
}

// Desembarca ou embarca
function toggleLanding() {
    if (game.player.onLand) {
        // Embarca de volta no navio
        const canEmbark = checkLandingSpot();
        if (canEmbark) {
            game.player.onLand = false;
            game.ship.x = game.lastShipPosition.x;
            game.ship.y = game.lastShipPosition.y;
        }
    } else {
        // Desembarca
        const landSpot = checkLandingSpot();
        if (landSpot.canLand) {
            game.player.onLand = true;
            game.player.x = landSpot.x;
            game.player.y = landSpot.y;
            game.player.angle = 0;
            game.player.speed = 0;
            game.lastShipPosition.x = game.ship.x;
            game.lastShipPosition.y = game.ship.y;
            game.lastShipPosition.angle = game.ship.angle;
        }
    }
}

// Renderiza o mini-mapa
function renderMinimap() {
    const currentData = game.worldData[game.currentMap];
    const minimapScaleX = MINIMAP_WIDTH / MAP_WIDTH;
    const minimapScaleY = MINIMAP_HEIGHT / MAP_HEIGHT;
    
    minimapCtx.fillStyle = '#000';
    minimapCtx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const mmX = x * minimapScaleX;
            const mmY = y * minimapScaleY;
            
            if (currentData.explored[y][x]) {
                const terrain = currentData.map[y][x];
                
                if (terrain === TERRAIN.OCEAN) {
                    minimapCtx.fillStyle = '#004080';
                } else if (terrain === TERRAIN.SHALLOW) {
                    minimapCtx.fillStyle = '#0066aa';
                } else if (terrain === TERRAIN.LAND) {
                    minimapCtx.fillStyle = '#6b5344';
                } else if (terrain === TERRAIN.MOUNTAIN) {
                    minimapCtx.fillStyle = '#4a4a4a';
                } else if (terrain === TERRAIN.FOREST) {
                    minimapCtx.fillStyle = '#1a6b1a';
                }
                
                minimapCtx.fillRect(mmX, mmY, Math.ceil(minimapScaleX), Math.ceil(minimapScaleY));
            } else {
                minimapCtx.fillStyle = '#0a0a0a';
                minimapCtx.fillRect(mmX, mmY, Math.ceil(minimapScaleX), Math.ceil(minimapScaleY));
            }
        }
    }
    
    // Portais no mini-mapa
    game.portals.forEach(portal => {
        const tileX = Math.floor(portal.x);
        const tileY = Math.floor(portal.y);
        
        if (currentData.explored[tileY][tileX]) {
            const mmX = portal.x * minimapScaleX;
            const mmY = portal.y * minimapScaleY;
            
            minimapCtx.fillStyle = '#00ffff';
            minimapCtx.beginPath();
            minimapCtx.arc(mmX, mmY, 3, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    });
    
    // Inimigos
    game.enemies.forEach(enemy => {
        const tileX = Math.floor(enemy.x);
        const tileY = Math.floor(enemy.y);
        
        if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT && 
            currentData.explored[tileY][tileX]) {
            const mmX = enemy.x * minimapScaleX;
            const mmY = enemy.y * minimapScaleY;
            
            minimapCtx.fillStyle = '#ff0000';
            minimapCtx.beginPath();
            minimapCtx.arc(mmX, mmY, 2, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    });
    
    // Jogador
    const shipX = game.player.onLand
        ? game.lastShipPosition.x
        : game.ship.x;

    const shipY = game.player.onLand
        ? game.lastShipPosition.y
        : game.ship.y;

    const shipMmX = shipX * minimapScaleX;
    const shipMmY = shipY * minimapScaleY;

    minimapCtx.fillStyle = '#ffaa00';
    minimapCtx.beginPath();
    minimapCtx.arc(shipMmX, shipMmY, 3, 0, Math.PI * 2);
    minimapCtx.fill();

    if (game.player.onLand) {
        const playerMmX = game.player.x * minimapScaleX;
        const playerMmY = game.player.y * minimapScaleY;

        minimapCtx.fillStyle = '#ffff00';
        minimapCtx.beginPath();
        minimapCtx.arc(playerMmX, playerMmY, 2.5, 0, Math.PI * 2);
        minimapCtx.fill();
    }
    
    minimapCtx.strokeStyle = '#ffaa00';
    minimapCtx.lineWidth = 1.5;
    minimapCtx.stroke();
}

// Renderiza o jogo
function render() {
    const currentData = game.worldData[game.currentMap];
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tilesX = Math.floor(canvas.width / TILE_SIZE);
    const tilesY = Math.floor(canvas.height / TILE_SIZE);
    
    const focusX = game.player.onLand ? game.player.x : game.ship.x;
    const focusY = game.player.onLand ? game.player.y : game.ship.y;

    game.camera.targetX = focusX - tilesX / 2;
    game.camera.targetY = focusY - tilesY / 2;
    game.camera.targetX = Math.max(0, Math.min(MAP_WIDTH - tilesX, game.camera.targetX));
    game.camera.targetY = Math.max(0, Math.min(MAP_HEIGHT - tilesY, game.camera.targetY));
    game.camera.x += (game.camera.targetX - game.camera.x) * game.camera.smoothing;
    game.camera.y += (game.camera.targetY - game.camera.y) * game.camera.smoothing;

    const offsetX = (game.camera.x - Math.floor(game.camera.x)) * TILE_SIZE;
    const offsetY = (game.camera.y - Math.floor(game.camera.y)) * TILE_SIZE;
    const startTileX = Math.floor(game.camera.x);
    const startTileY = Math.floor(game.camera.y);

    for (let ty = 0; ty < tilesY + 2; ty++) {
        for (let tx = 0; tx < tilesX + 2; tx++) {
            const mapX = startTileX + tx;
            const mapY = startTileY + ty;
            
            if (mapX >= 0 && mapX < MAP_WIDTH && mapY >= 0 && mapY < MAP_HEIGHT) {
                const screenX = tx * TILE_SIZE - offsetX;
                const screenY = ty * TILE_SIZE - offsetY;
                
                if (currentData.explored[mapY][mapX]) {
                    const terrain = currentData.map[mapY][mapX];
                    ctx.fillStyle = TERRAIN_COLORS[terrain];
                    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                    ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                } else {
                    ctx.fillStyle = '#111';
                    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    // Renderiza portais
    game.portals.forEach(portal => {
        const portalScreenX = (portal.x - game.camera.x) * TILE_SIZE;
        const portalScreenY = (portal.y - game.camera.y) * TILE_SIZE;
        
        const tileX = Math.floor(portal.x);
        const tileY = Math.floor(portal.y);
        
        if (currentData.explored[tileY][tileX]) {
            portal.angle += 0.05;
            
            // Efeito de portal girando
            ctx.save();
            ctx.translate(portalScreenX, portalScreenY);
            
            // Círculo externo pulsante
            const pulseSize = 25 + Math.sin(Date.now() / 200) * 5;
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Anel rotativo
            ctx.rotate(portal.angle);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 1.5);
            ctx.stroke();
            
            ctx.restore();
            
            // Texto do destino
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(MAPS[portal.targetMap].name, portalScreenX, portalScreenY - 35);
            ctx.textAlign = 'left';
        }
    });

    // Renderiza o navio
    const shipScreenX = (game.ship.x - game.camera.x) * TILE_SIZE;
    const shipScreenY = (game.ship.y - game.camera.y) * TILE_SIZE;
    
    ctx.save();
    ctx.translate(shipScreenX, shipScreenY);
    ctx.rotate(game.ship.angle);
    
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(0, -TILE_SIZE / 2 + 2);
    ctx.lineTo(TILE_SIZE / 2 - 3, TILE_SIZE / 2 - 3);
    ctx.lineTo(0, TILE_SIZE / 3);
    ctx.lineTo(-TILE_SIZE / 2 + 3, TILE_SIZE / 2 - 3);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if (game.ship.speed > 0.01) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, TILE_SIZE / 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();

    if (game.player.onLand) {
        const playerScreenX = (game.player.x - game.camera.x) * TILE_SIZE;
        const playerScreenY = (game.player.y - game.camera.y) * TILE_SIZE;
        
        ctx.save();
        ctx.translate(playerScreenX, playerScreenY);
        
        // Corpo do jogador (círculo)
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Cabeça
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, -3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // Se estiver em terra, renderiza o navio parado na última posição
    if (game.player.onLand) {
        const shipScreenX = (game.lastShipPosition.x - game.camera.x) * TILE_SIZE;
        const shipScreenY = (game.lastShipPosition.y - game.camera.y) * TILE_SIZE;
        
        ctx.save();
        ctx.translate(shipScreenX, shipScreenY);
        ctx.rotate(game.lastShipPosition.angle); 
        
        ctx.fillStyle = '#ffcc00';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -TILE_SIZE / 2 + 2);
        ctx.lineTo(TILE_SIZE / 2 - 3, TILE_SIZE / 2 - 3);
        ctx.lineTo(0, TILE_SIZE / 3);
        ctx.lineTo(-TILE_SIZE / 2 + 3, TILE_SIZE / 2 - 3);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
    
    ctx.restore();

    // Efeito de vinheta
    const centerX = (game.player.onLand
        ? game.player.x
        : game.ship.x
    ) * TILE_SIZE - game.camera.x * TILE_SIZE;

    const centerY = (game.player.onLand
        ? game.player.y
        : game.ship.y
    ) * TILE_SIZE - game.camera.y * TILE_SIZE;
    const vignette = ctx.createRadialGradient(
        centerX, centerY, TILE_SIZE * 3,
        centerX, centerY, TILE_SIZE * 15
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.4)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Balas de canhão
    game.cannonballs.forEach(ball => {
        const ballScreenX = (ball.x - game.camera.x) * TILE_SIZE;
        const ballScreenY = (ball.y - game.camera.y) * TILE_SIZE;
        
        ctx.fillStyle = ball.isPlayer ? '#ffff00' : '#ff3300';
        ctx.beginPath();
        ctx.arc(ballScreenX, ballScreenY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = ball.isPlayer ? '#ffaa00' : '#aa0000';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Inimigos
    game.enemies.forEach(enemy => {
        const enemyScreenX = (enemy.x - game.camera.x) * TILE_SIZE;
        const enemyScreenY = (enemy.y - game.camera.y) * TILE_SIZE;
        
        const tileX = Math.floor(enemy.x);
        const tileY = Math.floor(enemy.y);
        if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT && 
            currentData.explored[tileY][tileX]) {

            if (game.debugMode) {
                // DEBUG: Linha de visão
                const hasLOS = hasLineOfSight(enemy, game.ship.x, game.ship.y);
                const shipScreenX = (game.ship.x - game.camera.x) * TILE_SIZE;
                const shipScreenY = (game.ship.y - game.camera.y) * TILE_SIZE;
                
                ctx.save();
                ctx.setLineDash([5, 5]);
                ctx.lineWidth = 2;
                
                if (hasLOS) {
                    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'; // Verde = tem linha de visão
                } else {
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Vermelho = sem linha de visão
                }
                
                ctx.beginPath();
                ctx.moveTo(enemyScreenX, enemyScreenY);
                ctx.lineTo(shipScreenX, shipScreenY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();

                // Área de visão do inimigo (cone de visão)
                const engageDistance = 12;
                const visionRadius = engageDistance * TILE_SIZE;
                const visionAngle = Math.PI / 3; // 60 graus de cone de visão
                
                ctx.save();
                ctx.translate(enemyScreenX, enemyScreenY);
                
                // Cone de visão
                ctx.fillStyle = enemy.state === 'chase' 
                    ? 'rgba(255, 0, 0, 0.1)' // Vermelho quando perseguindo
                    : 'rgba(255, 255, 0, 0.08)'; // Amarelo quando patrulhando
                    
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, visionRadius, enemy.angle - visionAngle / 2, enemy.angle + visionAngle / 2);
                ctx.closePath();
                ctx.fill();
                
                // Borda do cone
                ctx.strokeStyle = enemy.state === 'chase'
                    ? 'rgba(255, 0, 0, 0.3)'
                    : 'rgba(255, 255, 0, 0.2)';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Círculo de engajamento (distância de ataque)
                ctx.strokeStyle = 'rgba(255, 100, 0, 0.2)';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(0, 0, visionRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.restore();
            }
            
            ctx.save();
            ctx.translate(enemyScreenX, enemyScreenY);
            ctx.rotate(enemy.angle);
            
            ctx.fillStyle = '#cc0000';
            ctx.beginPath();
            ctx.moveTo(0, -TILE_SIZE / 2 + 2);
            ctx.lineTo(TILE_SIZE / 2 - 3, TILE_SIZE / 2 - 3);
            ctx.lineTo(0, TILE_SIZE / 3);
            ctx.lineTo(-TILE_SIZE / 2 + 3, TILE_SIZE / 2 - 3);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#880000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();

            const hpPercent = enemy.hp / enemy.maxHp;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(enemyScreenX - 15, enemyScreenY - 20, 30, 3);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(enemyScreenX - 15, enemyScreenY - 20, 30 * hpPercent, 3);
        }
    });

    // HUD
    document.getElementById('hud-region').textContent = MAPS[game.currentMap].name;
    document.getElementById('hud-hp').textContent = `HP: ${game.ship.hp}/${game.ship.maxHp}`;
    document.getElementById('hud-score').textContent = `Pontos: ${game.score}`;
    
    const playerHpPercent = game.ship.hp / game.ship.maxHp;
    const hpBar = document.getElementById('hp-bar');
    hpBar.style.width = (playerHpPercent * 100) + '%';
    
    // Remove todas as classes primeiro
    hpBar.classList.remove('low', 'medium');
    
    // Adiciona classe baseada no HP
    if (playerHpPercent <= 0.3) {
        hpBar.classList.add('low');
    } else if (playerHpPercent <= 0.6) {
        hpBar.classList.add('medium');
    }

    // Indicador de portal próximo
    if (game.nearPortal) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(canvas.width / 2 - 150, canvas.height - 62, 300, 51);
        
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Portal para ${MAPS[game.nearPortal.targetMap].name}`, canvas.width / 2, canvas.height - 40);
        ctx.fillText('Pressione E para viajar', canvas.width / 2, canvas.height - 22);
        ctx.textAlign = 'left';
    }

    // Indicador de desembarque/embarque
    const landingSpot = checkLandingSpot();
    if ((game.player.onLand && landingSpot) || (!game.player.onLand && landingSpot.canLand)) {
        ctx.fillStyle = 'rgba(0, 150, 0, 0.8)';
        ctx.fillRect(canvas.width / 2 - 150, 20, 300, 50);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        const message = game.player.onLand ? 'Embarcar no navio' : 'Desembarcar';
        ctx.fillText(message, canvas.width / 2, 60);
        ctx.fillText('Pressione F', canvas.width / 2, 41);
        ctx.textAlign = 'left';
    }

    // Cooldown canhão
    if (game.ship.cannonCooldown > 0) {
        const cooldownPercent = game.ship.cannonCooldown / game.ship.cannonReloadTime;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fillRect(canvas.width / 2 - 50, canvas.height - 50, 100 * (1 - cooldownPercent), 10);
        ctx.strokeStyle = '#ffff00';
        ctx.strokeRect(canvas.width / 2 - 50, canvas.height - 50, 100, 10);
    }

    renderMinimap();

    // Game Over
    if (game.gameOver) { 
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(`Pontuação Final: ${game.score}`, canvas.width / 2, canvas.height / 2 + 25);
        ctx.fillText('Pressione ENTER para jogar novamente', canvas.width / 2, canvas.height / 2 + 70);  // <-- MUDAR TEXTO
        ctx.textAlign = 'left';
    }

    const speedKnots = Math.floor(game.ship.speed * 100);
    document.getElementById('stats').textContent = 
        `Área Explorada: ${getExplorationPercent()}% | Posição: (${Math.floor(game.ship.x)}, ${Math.floor(game.ship.y)}) | Velocidade: ${speedKnots} nós`;
}

// Reinicia o jogo
function restartGame() {
    // Reseta estado do navio
    game.ship.x = 10;
    game.ship.y = 10;
    game.ship.vx = 0;
    game.ship.vy = 0;
    game.ship.angle = 0;
    game.ship.speed = 0;
    game.ship.hp = game.ship.maxHp;
    game.ship.cannonCooldown = 0;
    
    // Reseta câmera
    game.camera.x = 0;
    game.camera.y = 0;
    game.camera.targetX = 0;
    game.camera.targetY = 0;
    
    // Limpa arrays
    game.cannonballs = [];
    game.enemies = [];
    game.portals = [];
    game.worldData = {};
    
    // Reseta estado geral
    game.score = 0;
    game.nearPortal = null;
    game.isTransitioning = false;
    game.gameOver = false;
    game.enemySpawnTimer = 0;
    game.keys = {};

    // Reseta jogador
    game.player.x = 10;
    game.player.y = 10;
    game.player.angle = 0;
    game.player.speed = 0;
    game.player.maxSpeed = 0.08;
    game.player.onLand = false;
    game.lastShipPosition.x = 10;
    game.lastShipPosition.y = 10;
    game.lastShipPosition.angle = null;
    
    // Recarrega mapa inicial
    loadMap('oceano_inicial');
    updateExploration();
}

// Atualiza física e movimento
function update(deltaTime) {
    if (game.gameOver || game.isTransitioning) return;

    const dt = Math.min(deltaTime / 16.67, 3);
    if (deltaTime > 1000) return;
    
    const currentData = game.worldData[game.currentMap];
    
    if (game.player.onLand) {
        // MOVIMENTO EM TERRA
        let moveX = 0, moveY = 0;
        
        if (game.keys['w'] || game.keys['W'] || game.keys['ArrowUp']) moveY = -1;
        if (game.keys['s'] || game.keys['S'] || game.keys['ArrowDown']) moveY = 1;
        if (game.keys['a'] || game.keys['A'] || game.keys['ArrowLeft']) moveX = -1;
        if (game.keys['d'] || game.keys['D'] || game.keys['ArrowRight']) moveX = 1;
        
        // Normaliza diagonal
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }
        
        const speed = game.player.maxSpeed * dt;
        let movedX = false;
        let movedY = false;

        // --- Movimento em X ---
        const newX = game.player.x + moveX * speed;
        const tileX = Math.floor(newX);
        const tileYforX = Math.floor(game.player.y);

        if (
            tileX >= 0 && tileX < MAP_WIDTH &&
            tileYforX >= 0 && tileYforX < MAP_HEIGHT
        ) {
            const terrainX = currentData.map[tileYforX][tileX];
            if (
                terrainX === TERRAIN.LAND ||
                terrainX === TERRAIN.FOREST ||
                terrainX === TERRAIN.MOUNTAIN
            ) {
                game.player.x = newX;
                movedX = true;
            }
        }

        // --- Movimento em Y ---
        const newY = game.player.y + moveY * speed;
        const tileY = Math.floor(newY);
        const tileXforY = Math.floor(game.player.x);

        if (
            tileXforY >= 0 && tileXforY < MAP_WIDTH &&
            tileY >= 0 && tileY < MAP_HEIGHT
        ) {
            const terrainY = currentData.map[tileY][tileXforY];
            if (
                terrainY === TERRAIN.LAND ||
                terrainY === TERRAIN.FOREST ||
                terrainY === TERRAIN.MOUNTAIN
            ) {
                game.player.y = newY;
                movedY = true;
            }
        }

        if (!movedX && !movedY && moveX !== 0 && moveY !== 0) {
            const diagX = Math.floor(game.player.x + moveX * speed);
            const diagY = Math.floor(game.player.y + moveY * speed);

            if (
                diagX >= 0 && diagX < MAP_WIDTH &&
                diagY >= 0 && diagY < MAP_HEIGHT
            ) {
                const diagTerrain = currentData.map[diagY][diagX];
                if (
                    diagTerrain === TERRAIN.LAND ||
                    diagTerrain === TERRAIN.FOREST ||
                    diagTerrain === TERRAIN.MOUNTAIN
                ) {
                    game.player.x += moveX * speed;
                    game.player.y += moveY * speed;
                }
            }
        }
        
        game.player.x = Math.max(0.5, Math.min(MAP_WIDTH - 0.5, game.player.x));
        game.player.y = Math.max(0.5, Math.min(MAP_HEIGHT - 0.5, game.player.y));
        
    } else {
        // MOVIMENTO NO NAVIO (código existente)
        const maxEnemies = MAPS[game.currentMap].enemyCount;
        game.enemySpawnTimer += dt;
        if (game.enemySpawnTimer >= game.enemySpawnInterval && game.enemies.length < maxEnemies) {
            spawnEnemy();
            game.enemySpawnTimer = 0;
        }

        game.ship.cannonCooldown = Math.max(0, game.ship.cannonCooldown - dt);
        
        if (game.keys['a'] || game.keys['A'] || game.keys['ArrowLeft']) {
            game.ship.angle -= game.ship.turnSpeed * dt;
        }
        if (game.keys['d'] || game.keys['D'] || game.keys['ArrowRight']) {
            game.ship.angle += game.ship.turnSpeed * dt;
        }
        
        if (game.keys[' '] && game.ship.cannonCooldown <= 0) {
            fireCannonball(game.ship, true);
            game.ship.cannonCooldown = game.ship.cannonReloadTime;
        }
        
        if (game.keys['w'] || game.keys['W'] || game.keys['ArrowUp']) {
            game.ship.speed = Math.min(game.ship.maxSpeed, game.ship.speed + game.ship.acceleration * dt);
        } else if (game.keys['s'] || game.keys['S'] || game.keys['ArrowDown']) {
            game.ship.speed = Math.max(-game.ship.maxSpeed * 0.5, game.ship.speed - game.ship.acceleration * dt);
        } else {
            if (game.ship.speed > 0) {
                game.ship.speed = Math.max(0, game.ship.speed - game.ship.deceleration * dt);
            } else if (game.ship.speed < 0) {
                game.ship.speed = Math.min(0, game.ship.speed + game.ship.deceleration * dt);
            }
        }
        
        game.ship.vx = Math.sin(game.ship.angle) * game.ship.speed * dt;
        game.ship.vy = -Math.cos(game.ship.angle) * game.ship.speed * dt;
        
        if (Math.abs(game.ship.vx) > 0.001 || Math.abs(game.ship.vy) > 0.001) {
            const newX = game.ship.x + game.ship.vx;
            const newY = game.ship.y + game.ship.vy;
            
            const tileX = Math.floor(newX);
            const tileY = Math.floor(newY);
            
            if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
                const terrain = currentData.map[tileY][tileX];
                
                if (terrain === TERRAIN.OCEAN || terrain === TERRAIN.SHALLOW) {
                    game.ship.x = newX;
                    game.ship.y = newY;
                } else {
                    game.ship.speed = 0;
                    game.ship.vx = 0;
                    game.ship.vy = 0;
                }
            }
            
            game.ship.x = Math.max(0.5, Math.min(MAP_WIDTH - 0.5, game.ship.x));
            game.ship.y = Math.max(0.5, Math.min(MAP_HEIGHT - 0.5, game.ship.y));
        }
        
        checkPortalProximity();
    }

    if (game.ship.hp <= 0) {
        game.gameOver = true;
    }

    updateCannonballs(dt);
    updateEnemies(dt);            
    updateExploration();
}

// Loop principal
let animationFrameId;
function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;
    
    update(deltaTime);
    render();
    animationFrameId = requestAnimationFrame(gameLoop);
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        game.lastTime = Date.now();
    }
});

window.addEventListener('keydown', (e) => {
    if (game.gameOver && e.key === 'Enter') { 
        restartGame();
        return;
    }

    // Bloqueia inputs durante transição
    if (game.isTransitioning) {
        e.preventDefault();
        return;
    }
    
    game.keys[e.key] = true;
    
    // Entrar no portal
    if ((e.key === 'e' || e.key === 'E') && game.nearPortal && game.ship.hp > 0 && !game.isTransitioning) {
        enterPortal(game.nearPortal);
    }

    if ((e.key === 'f' || e.key === 'F') && !game.gameOver && !game.isTransitioning) {
        toggleLanding();
    }
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (!game.isTransitioning) {
        game.keys[e.key] = false;
    }
});

const debugCheckbox = document.getElementById('debug-mode');
if (debugCheckbox) {
    debugCheckbox.addEventListener('change', (e) => {
        game.debugMode = e.target.checked;
    });
}

// Inicializa
loadMap('oceano_inicial');
gameLoop();