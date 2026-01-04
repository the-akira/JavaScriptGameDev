const map = [
    "GOAL",
    "SIDEWALK",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "SIDEWALK",
    "GRASS",
    "GRASS",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "SIDEWALK",
    "SAFE",
    "SAFE",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "SIDEWALK",
    "GRASS",
    "GRASS",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "SIDEWALK",
    "SAFE",
    "SAFE",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "SIDEWALK",
    "GRASS",
    "GRASS",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "SIDEWALK",
    "SAFE",
    "SAFE",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "SIDEWALK",
    "GRASS",
    "GRASS",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "SIDEWALK",
    "SAFE",
    "SAFE",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "SIDEWALK",
    "GRASS",
    "GRASS",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "SIDEWALK",
    "GRASS",
    "WATER",
    "WATER",
    "GRASS",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "ROAD_RIGHT",
    "ROAD_LEFT",
    "ROAD_RIGHT",
    "ROAD_RIGHT",
    "ROAD_RIGHT",
    "ROAD_LEFT",
    "SIDEWALK",
    "GRASS",
    "SIDEWALK",
];

const TOTAL_ROWS = map.length;
const VISIBLE_ROWS = 15;
const TILE_SIZE = 40;
const COLS = 16;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = COLS * TILE_SIZE;
canvas.height = VISIBLE_ROWS * TILE_SIZE;

let cameraY = TOTAL_ROWS - VISIBLE_ROWS; 

let player = {
    x: 5,
    y: TOTAL_ROWS - 1,
    color: '#4ade80',
    xFloat: 5.0, 
};

let score = 0;
let gameRunning = false;
let gameStarted = false;
let moveDelay = 100;
let moveSpeed = 0.125;
let moveDirection = 0;
let lastMoveTime = 0;
let maxRowReached = TOTAL_ROWS - 1;

const carColors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
let lanes = [];

const trafficPatterns = [
    {
        name: "sparse",
        minCars: 1,
        maxCars: 2,
        minGap: 5,
        speedMul: 0.9
    },
    {
        name: "normal",
        minCars: 2,
        maxCars: 3,
        minGap: 4,
        speedMul: 1
    },
    {
        name: "medium",
        minCars: 2,
        maxCars: 4,
        minGap: 3,
        speedMul: 1.2
    },
    {
        name: "dense",
        minCars: 3,
        maxCars: 5,
        minGap: 3,
        speedMul: 1.1
    },
    {
        name: "fast",
        minCars: 2,
        maxCars: 4,
        minGap: 4,
        speedMul: 1.4
    }
];

function isPositionValid(x, width, cars, minGapPx) {
    const laneLength = canvas.width;
    const centerA = x + width / 2;

    for (const car of cars) {
        const centerB = car.x + car.width / 2;

        // distância circular mínima
        let dist = Math.abs(centerA - centerB);
        dist = Math.min(dist, laneLength - dist);

        const minDist = (width + car.width) / 2 + minGapPx;

        if (dist < minDist) {
            return false;
        }
    }
    return true;
}

function initCars() {
    // Criar estrutura de lanes com base no mapa
    lanes = [];
    for (let r = 0; r < TOTAL_ROWS; r++) {
        if (map[r] === "ROAD_LEFT") {
            lanes.push({ y: r, direction: 1, speed: 2, cars: [] });
        } else if (map[r] === "ROAD_RIGHT") {
            lanes.push({ y: r, direction: -1, speed: 2.5, cars: [] });
        }
    }

    // Inicializar carros por lane (posições distribuídas)
    lanes.forEach(lane => {
        lane.cars = [];

        const pattern = trafficPatterns[
            Math.floor(Math.random() * trafficPatterns.length)
        ];

        lane.speed *= pattern.speedMul;

        const targetCars =
            Math.floor(Math.random() * (pattern.maxCars - pattern.minCars + 1)) +
            pattern.minCars;

        const minGapPx = pattern.minGap * TILE_SIZE;

        let attempts = 0;

        while (lane.cars.length < targetCars && attempts < 50) {
            attempts++;

            const widthVariants = [1, 1.5, 2, 3];
            const widthTiles =
                widthVariants[Math.floor(Math.random() * widthVariants.length)];
            const width = widthTiles * TILE_SIZE;

            // posição aleatória no "loop" da rua
            const x = Math.random() * canvas.width;

            if (isPositionValid(x, width, lane.cars, minGapPx)) {
                lane.cars.push({
                    x,
                    width,
                    color: carColors[Math.floor(Math.random() * carColors.length)]
                });
            }
        }
    });
}

let logs = [];

function initLogs() {
    logs = [];

    for (let r = 0; r < TOTAL_ROWS; r++) {

        if (map[r] === "WATER") {
            
            const direction = Math.random() < 0.5 ? 1 : -1;
            const speedTilesPerSec = 1 + Math.random() * 1; 
            const speed = speedTilesPerSec / 60;

            const laneLogs = [];

            const count = Math.floor(Math.random() * 6) + 2; // 2 a 4 troncos
            const value = Math.random() * (0.5 - 0.1) + 0.1;
            const minGapPx = value * TILE_SIZE; // espaço mínimo de 2 tiles

            let attempts = 0;

            while (laneLogs.length < count && attempts < 50) {
                attempts++;

                // largura em tiles
                const logTiles = Math.floor(Math.random() * 2) + 2; // 2 ou 3 tiles
                const width = logTiles * TILE_SIZE;

                // posição inicial em TILE (aleatória)
                const tileX = Math.random() * COLS;
                const x = tileX * TILE_SIZE;

                // verificar se a posição é válida (tem espaço suficiente)
                if (isPositionValid(x, width, 
                    laneLogs.map(l => ({x: l.tileX * TILE_SIZE, width: l.width})), 
                    minGapPx)) {
                    
                    laneLogs.push({
                        y: r,
                        tileX,
                        width,
                        speed,
                        direction
                    });
                }
            }

            logs.push(laneLogs);
        }
    }
}

function createGrassPattern() {
    const c = document.createElement("canvas");
    c.width = c.height = 40;
    const g = c.getContext("2d");

    // base
    g.fillStyle = "#2d5016";
    g.fillRect(0, 0, 40, 40);

    // detalhes (folhas)
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * 40;
        const y = Math.random() * 40;

        g.strokeStyle = Math.random() > 0.5 ? "#3f7d2a" : "#1f3d14";
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.random() * 3 - 1.5, y - 4);
        g.stroke();
    }

    return ctx.createPattern(c, "repeat");
}

function createSidewalkPattern() {
    const c = document.createElement("canvas");
    c.width = c.height = 40;
    const g = c.getContext("2d");

    // base
    g.fillStyle = "#9ca3af";
    g.fillRect(0, 0, 40, 40);

    // rejunte
    g.strokeStyle = "#6b7280";
    g.lineWidth = 1;

    for (let i = 0; i <= 40; i += 10) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, 40);
        g.stroke();

        g.beginPath();
        g.moveTo(0, i);
        g.lineTo(40, i);
        g.stroke();
    }

    // ruído
    for (let i = 0; i < 50; i++) {
        g.fillStyle = "rgba(0,0,0,0.05)";
        g.fillRect(
            Math.random() * 40,
            Math.random() * 40,
            1,
            1
        );
    }

    return ctx.createPattern(c, "repeat");
}

function createWaterPattern() {
    const size = 256; // GRANDE → evita repetição perceptível
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");

    // base
    g.fillStyle = "#1e3a8a";
    g.fillRect(0, 0, size, size);

    // ruído suave (sem direção preferencial)
    for (let i = 0; i < 6000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 2;

        g.fillStyle = Math.random() > 0.5
            ? "rgba(255,255,255,0.03)"
            : "rgba(0,0,0,0.03)";

        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
    }

    // leves manchas maiores (quebra qualquer padrão residual)
    for (let i = 0; i < 120; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;

        g.fillStyle = "rgba(255,255,255,0.02)";
        g.beginPath();
        g.arc(x, y, 6 + Math.random() * 10, 0, Math.PI * 2);
        g.fill();
    }

    return ctx.createPattern(c, "repeat");
}

const grassPattern = createGrassPattern();
const sidewalkPattern = createSidewalkPattern();
const waterPattern = createWaterPattern();

function drawBackground() {
    // desenha apenas as linhas que estão na tela (visíveis pela câmera)
    for (let screenRow = 0; screenRow < VISIBLE_ROWS; screenRow++) {
        const mapRow = cameraY + screenRow;
        const type = map[mapRow];

        if (type === "GOAL") {
            ctx.fillStyle = '#166534';
        } else if (type === "GRASS") {
            ctx.fillStyle = grassPattern;
        } else if (type === "SAFE" || type === "SIDEWALK") {
            ctx.fillStyle = sidewalkPattern;
        } else if (type === "ROAD_LEFT" || type === "ROAD_RIGHT") {
            ctx.fillStyle = '#374151';
        } else if (type === "WATER") {
            ctx.fillStyle = waterPattern;
        } else {
            ctx.fillStyle = '#2d5016';
        }

        ctx.fillRect(0, screenRow * TILE_SIZE, canvas.width, TILE_SIZE);

        // desenhar linhas centrais das ruas
        if (type === "ROAD_LEFT" || type === "ROAD_RIGHT") {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.setLineDash([15, 10]);
            ctx.beginPath();
            ctx.moveTo(0, screenRow * TILE_SIZE + TILE_SIZE / 2);
            ctx.lineTo(canvas.width, screenRow * TILE_SIZE + TILE_SIZE / 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // texto CHEGADA se for GOAL
        if (type === "GOAL") {
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CHEGADA!', canvas.width / 2, screenRow * TILE_SIZE + TILE_SIZE / 2 + 7);
        }
    }
}

function drawPlayer() {
    const x = player.xFloat * TILE_SIZE;
    const y = (player.y - cameraY) * TILE_SIZE;
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2;

    // Corpo
    const bodyGradient = ctx.createRadialGradient(
        cx - 6, cy - 8, TILE_SIZE * 0.1,
        cx, cy, TILE_SIZE * 0.55
    );
    bodyGradient.addColorStop(0, "#a7f3d0");
    bodyGradient.addColorStop(1, "#15803d");

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(cx, cy, TILE_SIZE * 0.35, TILE_SIZE * 0.30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pernas
    ctx.fillStyle = "#166534";
    [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.ellipse(
            cx + dir * TILE_SIZE * 0.22,
            cy + TILE_SIZE * 0.18,
            TILE_SIZE * 0.14,
            TILE_SIZE * 0.10,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // Barriga
    ctx.fillStyle = "#bbf7d0";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, TILE_SIZE * 0.20, TILE_SIZE * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Olhos
    ctx.fillStyle = "#ffffff";
    [-1, 1].forEach(dir => {
        const ex = cx + dir * TILE_SIZE * 0.16;
        const ey = cy - TILE_SIZE * 0.16;

        // globo
        ctx.beginPath();
        ctx.arc(ex, ey, TILE_SIZE * 0.11, 0, Math.PI * 2);
        ctx.fill();

        // pálpebra
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.beginPath();
        ctx.arc(ex, ey - 2, TILE_SIZE * 0.11, Math.PI, 0);
        ctx.fill();

        // pupila
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(ex, ey, TILE_SIZE * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // brilho
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(ex - 2, ey - 2, TILE_SIZE * 0.02, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
    });
}

function drawCars() {
    lanes.forEach(lane => {
        // desenhar somente se a lane estiver visível na câmera
        if (lane.y < cameraY || lane.y >= cameraY + VISIBLE_ROWS) return;
        const y = (lane.y - cameraY) * TILE_SIZE;

        lane.cars.forEach(car => {
            // Corpo do carro (mesmo visual da sua versão original)
            ctx.fillStyle = car.color;
            ctx.fillRect(car.x, y + TILE_SIZE * 0.2, car.width, TILE_SIZE * 0.6);

            // Janelas
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(car.x + car.width * 0.3, y + TILE_SIZE * 0.3, car.width * 0.4, TILE_SIZE * 0.4);

            // Faróis
            ctx.fillStyle = '#fef08a';
            if (lane.direction > 0) {
                ctx.fillRect(car.x + car.width - 5, y + TILE_SIZE * 0.25, 5, TILE_SIZE * 0.2);
                ctx.fillRect(car.x + car.width - 5, y + TILE_SIZE * 0.55, 5, TILE_SIZE * 0.2);
            } else {
                ctx.fillRect(car.x, y + TILE_SIZE * 0.25, 5, TILE_SIZE * 0.2);
                ctx.fillRect(car.x, y + TILE_SIZE * 0.55, 5, TILE_SIZE * 0.2);
            }
        });
    });
}

function drawLogs() {
    logs.forEach(lane => {
        lane.forEach(log => {
            if (log.y < cameraY || log.y >= cameraY + VISIBLE_ROWS) return;

            const x = log.tileX * TILE_SIZE;
            const y = (log.y - cameraY) * TILE_SIZE;

            ctx.fillStyle = "#8b5a2b";
            ctx.fillRect(x, y + TILE_SIZE * 0.1, log.width, TILE_SIZE * 0.8);

            ctx.fillStyle = "#5c3b1e";
            ctx.fillRect(x + 5, y + TILE_SIZE * 0.2, log.width - 10, TILE_SIZE * 0.6);
        });
    });
}

function updateCars() {
    lanes.forEach(lane => {
        lane.cars.forEach(car => {
            car.x += lane.direction * lane.speed;

            // Reposicionar carro quando sair da tela
            if (lane.direction > 0 && car.x > canvas.width) {
                // Encontrar o carro mais à esquerda (que está mais atrás)
                let minX = Infinity;
                lane.cars.forEach(c => {
                    if (c !== car && c.x < minX) {
                        minX = c.x;
                    }
                });
                
                // Reposicionar com espaço seguro atrás do último carro
                const safeGap = TILE_SIZE * 4;
                car.x = Math.min(-car.width - safeGap, minX - car.width - safeGap);
                
            } else if (lane.direction < 0 && car.x + car.width < 0) {
                // Encontrar o carro mais à direita (que está mais atrás)
                let maxX = -Infinity;
                lane.cars.forEach(c => {
                    if (c !== car && c.x > maxX) {
                        maxX = c.x;
                    }
                });
                
                // Reposicionar com espaço seguro atrás do último carro
                const safeGap = TILE_SIZE * 4;
                car.x = Math.max(canvas.width + safeGap, maxX + safeGap);
            }
        });
    });
}

function updateLogs() {
    logs.forEach(lane => {
        lane.forEach(log => {
            // Atualizar posição (em pixels para consistência com carros)
            const logX = log.tileX * TILE_SIZE;
            const newLogX = logX + (log.speed * log.direction * TILE_SIZE);
            log.tileX = newLogX / TILE_SIZE;

            // Reposicionar log quando sair da tela (direção positiva - indo para direita)
            if (log.direction > 0 && log.tileX * TILE_SIZE > canvas.width) {
                // Encontrar o tronco mais à esquerda (que está mais atrás)
                let minTileX = Infinity;
                lane.forEach(l => {
                    if (l !== log && l.tileX < minTileX) {
                        minTileX = l.tileX;
                    }
                });
                
                // Reposicionar com espaço seguro atrás do último tronco
                const safeGapTiles = 4;
                const logWidthTiles = log.width / TILE_SIZE;
                log.tileX = Math.min(
                    -logWidthTiles - safeGapTiles,
                    minTileX - logWidthTiles - safeGapTiles
                );
            } 
            // Reposicionar log quando sair da tela (direção negativa - indo para esquerda)
            else if (log.direction < 0 && (log.tileX + log.width / TILE_SIZE) * TILE_SIZE < 0) {
                // Encontrar o tronco mais à direita (que está mais atrás)
                let maxTileX = -Infinity;
                lane.forEach(l => {
                    if (l !== log && l.tileX > maxTileX) {
                        maxTileX = l.tileX;
                    }
                });
                
                // Reposicionar com espaço seguro atrás do último tronco
                const safeGapTiles = 4;
                log.tileX = Math.max(
                    COLS + safeGapTiles,
                    maxTileX + safeGapTiles
                );
            }
        });
    });
}

function checkCollision() {
    const playerLeft = player.xFloat * TILE_SIZE;
    const playerRight = playerLeft + TILE_SIZE;
    const playerTop = player.y * TILE_SIZE;
    const playerBottom = playerTop + TILE_SIZE;

    for (let lane of lanes) {
        if (lane.y === player.y) {
            for (let car of lane.cars) {
                const carLeft = car.x;
                const carRight = car.x + car.width;
                const carTop = lane.y * TILE_SIZE;
                const carBottom = carTop + TILE_SIZE;

                if (playerRight > carLeft && playerLeft < carRight &&
                    playerBottom > carTop && playerTop < carBottom) {
                    return true;
                }
            }
        }
    }
    return false;
}

function checkDrowning() {
    if (map[player.y] !== "WATER") return false;

    // player em pixels
    const px = player.xFloat * TILE_SIZE;
    const pRight = px + TILE_SIZE;

    for (let lane of logs) {
        for (let log of lane) {
            if (log.y !== player.y) continue;

            // posição do tronco em pixels (log.tileX pode ser float)
            const lx = log.tileX * TILE_SIZE;
            const lRight = lx + log.width;

            // quanto sobrepõe (em pixels)
            const overlap = Math.min(pRight, lRight) - Math.max(px, lx);

            // considerar "sobre o tronco" somente se houver sobreposição suficiente
            // use 25% do tile (10px) como threshold – ajustável
            if (overlap > TILE_SIZE * 0.25) {
                // mover o jogador junto com o tronco (log.speed está em tiles/frame)
                player.xFloat += log.speed * log.direction;

                // manter player.xFloat dentro dos limites de colunas
                if (player.xFloat < 0) player.xFloat = 0;
                if (player.xFloat > COLS - 1) player.xFloat = COLS - 1;

                // atualizar x discreto
                player.x = Math.round(player.xFloat);

                return false; // não se afogou
            }
        }
    }

    // nenhum tronco suficientemente cobriu o tile -> afogou
    return true;
}

function movePlayer(dy) {
    const now = Date.now();
    if (now - lastMoveTime < moveDelay) return;

    const newY = player.y + dy;

    if (newY >= 0 && newY < TOTAL_ROWS) {
        player.y = newY;
        lastMoveTime = now;

        // Se o jogador subir, soma pontos
        if (newY < maxRowReached) {
            const rowsProgressed = maxRowReached - newY;
            score += rowsProgressed * 10;
            maxRowReached = newY;
            updateScore();
        }

        // Atualizar câmera: centralizar o jogador na tela quando possível
        cameraY = player.y - Math.floor(VISIBLE_ROWS / 2);
        // garantir limites
        cameraY = Math.max(0, Math.min(cameraY, TOTAL_ROWS - VISIBLE_ROWS));

        // Chegou ao GOAL (verifica o mapa)
        if (map[player.y] === "GOAL") {
            score += 100;
            updateScore();
            resetPlayerPosition();
        }
    }
}

function updatePlayerMovement() {
    if (moveDirection !== 0) {
        player.xFloat += moveDirection * moveSpeed;
        
        // Limitar aos limites do canvas
        player.xFloat = Math.max(0, Math.min(player.xFloat, COLS - 1));
        
        // Atualizar x discreto
        player.x = Math.round(player.xFloat);
    }
}

function resetPlayerPosition() {
    player.x = 5;
    player.xFloat = 5.0;
    player.y = TOTAL_ROWS - 1;
    cameraY = TOTAL_ROWS - VISIBLE_ROWS;
    maxRowReached = TOTAL_ROWS - 1;
}

function updateScore() {
    const el = document.getElementById('score');
    if (el) el.textContent = score;
}

function endGame() {
    gameRunning = false;
    moveDirection = 0;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

function startGame() {
    gameRunning = true;
    gameStarted = true;
}

function restartGame() {
    gameRunning = true;
    gameStarted = true;
    score = 0;
    moveDirection = 0;
    maxRowReached = TOTAL_ROWS - 1
    updateScore();
    resetPlayerPosition();
    initCars();
    initLogs();
    document.getElementById('gameOver').style.display = 'none';
    gameLoop();
}

const keysPressed = {};

document.addEventListener('keydown', (e) => {
    if (!gameStarted && e.key === 'Enter') {
        startGame();
        e.preventDefault();
        return;
    }
    if (!gameRunning) return;

    keysPressed[e.key] = true;

    switch (e.key) {
        case 'ArrowLeft':
            moveDirection = -1;
            e.preventDefault();
            break;
        case 'ArrowRight':
            moveDirection = 1;
            e.preventDefault();
            break;
        case 'ArrowUp':
            // Impedir movimento vertical se estiver se movendo lateralmente
            if (moveDirection === 0) {
                movePlayer(-1);
            }
            e.preventDefault();
            break;
        case 'ArrowDown':
            // Impedir movimento vertical se estiver se movendo lateralmente
            if (moveDirection === 0) {
                movePlayer(1);
            }
            e.preventDefault();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (!gameRunning) return;

    keysPressed[e.key] = false;

    switch (e.key) {
        case 'ArrowLeft':
            if (moveDirection === -1) moveDirection = 0;
            break;
        case 'ArrowRight':
            if (moveDirection === 1) moveDirection = 0;
            break;
    }
});

function drawStartScreen() {
    // Fundo semi-transparente escuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Título principal
    ctx.fillStyle = '#51cf66';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(81, 207, 102, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fillText('FROGGER', canvas.width / 2, 120);
    
    // Resetar sombra
    ctx.shadowBlur = 0;
    
    // Subtítulo
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.font = '24px Arial';
    ctx.fillText('Aventura do Sapinho', canvas.width / 2, 160);
    
    // Ícone do sapinho
    ctx.font = '72px Arial';
    ctx.fillText('🐸', canvas.width / 2, 240);
    
    // Instruções
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText('Use as setas para mover', canvas.width / 2, 310);
    ctx.fillText('Evite os carros nas ruas', canvas.width / 2, 345);
    ctx.fillText('Pule nos troncos na água', canvas.width / 2, 380);
    ctx.fillText('Chegue ao topo para vencer!', canvas.width / 2, 415);
    
    // Texto piscante "Pressione ENTER"
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 26px Arial';
    ctx.fillText('Pressione ENTER para começar', canvas.width / 2, 500);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) {
        drawStartScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!gameRunning) return;

    drawBackground();
    updatePlayerMovement(); // Atualiza movimento lateral contínuo
    updateCars();
    updateLogs();
    drawLogs();
    drawPlayer();
    drawCars();

    if (checkCollision()) {
        endGame();
        return;
    }

    if (checkDrowning()) {
        endGame();
        return;
    }

    requestAnimationFrame(gameLoop);
}

initCars();
initLogs();
updateScore();
gameLoop();