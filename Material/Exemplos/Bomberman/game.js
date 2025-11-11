const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configurações do jogo
const TILE_SIZE = 32;
const GRID_WIDTH = 15;
const GRID_HEIGHT = 15;
const PLAYER_SPEED = 2;
const ENEMY_SPEED = 1.2;
const BOMB_TIMER = 3000;
const EXPLOSION_DURATION = 500;
const BOMB_RANGE = 2;

// Tipos de tiles
const TILE_EMPTY = 0;
const TILE_WALL = 1;
const TILE_DESTRUCTIBLE = 2;

// Estado do jogo
let gameState = {
    score: 0,
    lives: 3,
    gameOver: false,
    victory: false
};

// Mapa do jogo
let map = [];

// Player
let player = {
    x: TILE_SIZE,
    y: TILE_SIZE,
    width: TILE_SIZE * 0.8,
    height: TILE_SIZE * 0.8,
    speed: PLAYER_SPEED,
    maxBombs: 1,
    bombsPlaced: 0,
    alive: true,
    invulnerable: false,
    invulnerableTime: 0
};

// Inimigos
let enemies = [];

// Bombas
let bombs = [];

// Explosões
let explosions = [];

// Controles
let keys = {};

// Inicializar mapa
function initMap() {
    map = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            // Paredes fixas nas bordas e em padrão xadrez
            if (x === 0 || y === 0 || x === GRID_WIDTH - 1 || y === GRID_HEIGHT - 1) {
                map[y][x] = TILE_WALL;
            } else if (x % 2 === 0 && y % 2 === 0) {
                map[y][x] = TILE_WALL;
            } else {
                // Área inicial do jogador livre
                if ((x <= 2 && y <= 2) || (x <= 1 && y <= 1)) {
                    map[y][x] = TILE_EMPTY;
                } else {
                    // 60% de chance de ter parede destrutível
                    map[y][x] = Math.random() < 0.6 ? TILE_DESTRUCTIBLE : TILE_EMPTY;
                }
            }
        }
    }
}

// Criar inimigos
function initEnemies() {
    enemies = [];
    const numEnemies = 5;
    let tries = 0;

    while (enemies.length < numEnemies && tries < 1000) {
        const gridX = Math.floor(Math.random() * GRID_WIDTH);
        const gridY = Math.floor(Math.random() * GRID_HEIGHT);

        if (map[gridY][gridX] === TILE_EMPTY &&
            !(gridX <= 2 && gridY <= 2)) { // evita área inicial do player
            enemies.push({
                x: gridX * TILE_SIZE,
                y: gridY * TILE_SIZE,
                tileX: gridX,
                tileY: gridY,
                moving: false,
                targetX: 0,
                targetY: 0,
                width: TILE_SIZE * 0.8,
                height: TILE_SIZE * 0.8,
                speed: ENEMY_SPEED,
                visited: [],
                decisionCooldown: 0,
                personality: {
                    curiosity: 0.05 + Math.random() * 0.2,  // chance de escolher rota aleatória
                    revisitPenalty: 3 + Math.random() * 6,  // penalidade variável
                    corridorBias: 0.3 + Math.random() * 0.8 // peso de corredores longos
                }
            });
        }
        tries++;
    }
}

// Inicializar jogo
function initGame() {
    initMap();
    player = {
        x: TILE_SIZE,
        y: TILE_SIZE,
        width: TILE_SIZE * 0.8,
        height: TILE_SIZE * 0.8,
        speed: PLAYER_SPEED,
        maxBombs: 1,
        bombsPlaced: 0,
        alive: true,
        invulnerable: false,
        invulnerableTime: 0
    };
    initEnemies();
    bombs = [];
    explosions = [];
    gameState = {
        score: 0,
        lives: 3,
        gameOver: false,
        victory: false
    };
    updateUI();
}

// Colisão com tiles
function checkTileCollision(x, y, width, height, ignoreBombs = false) {
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.floor((x + width) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.floor((y + height) / TILE_SIZE);
    
    for (let row = top; row <= bottom; row++) {
        for (let col = left; col <= right; col++) {
            if (row < 0 || row >= GRID_HEIGHT || col < 0 || col >= GRID_WIDTH) {
                return true;
            }
            if (map[row][col] === TILE_WALL || map[row][col] === TILE_DESTRUCTIBLE) {
                return true;
            }
        }
    }
    
    // Verificar colisão com bombas (exceto quando o jogador está colocando)
    if (!ignoreBombs) {
        for (let bomb of bombs) {
            if (checkRectCollision(x, y, width, height, 
                bomb.gridX * TILE_SIZE + TILE_SIZE * 0.1, 
                bomb.gridY * TILE_SIZE + TILE_SIZE * 0.1, 
                TILE_SIZE * 0.8, TILE_SIZE * 0.8)) {
                return true;
            }
        }
    }
    
    return false;
}

// Colisão entre retângulos
function checkRectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

// Mover jogador
function movePlayer() {
    if (!player.alive) return;
    
    let newX = player.x;
    let newY = player.y;
    
    // Verificar se está na posição da bomba que acabou de colocar
    let onOwnBomb = false;
    for (let bomb of bombs) {
        if (bomb.placedByPlayer && checkRectCollision(
            player.x, player.y, player.width, player.height,
            bomb.gridX * TILE_SIZE + TILE_SIZE * 0.1, 
            bomb.gridY * TILE_SIZE + TILE_SIZE * 0.1,
            TILE_SIZE * 0.8, TILE_SIZE * 0.8
        )) {
            onOwnBomb = true;
            break;
        }
    }
    
    if (keys['ArrowUp']) newY -= player.speed;
    if (keys['ArrowDown']) newY += player.speed;
    if (keys['ArrowLeft']) newX -= player.speed;
    if (keys['ArrowRight']) newX += player.speed;
    
    // Testar movimento horizontal
    if (newX !== player.x) {
        if (!checkTileCollision(newX, player.y, player.width, player.height, onOwnBomb)) {
            player.x = newX;
        }
    }
    
    // Testar movimento vertical
    if (newY !== player.y) {
        if (!checkTileCollision(player.x, newY, player.width, player.height, onOwnBomb)) {
            player.y = newY;
        }
    }
}

// Move o jogador com sliding entre as beiradas
function movePlayerEdgeSliding() {
    if (!player.alive) return;

    // flags e posições iniciais
    let targetX = player.x;
    let targetY = player.y;

    // Verificar se está na posição da bomba que acabou de colocar
    let onOwnBomb = false;
    for (let bomb of bombs) {
        if (bomb.placedByPlayer && checkRectCollision(
            player.x, player.y, player.width, player.height,
            bomb.gridX * TILE_SIZE + TILE_SIZE * 0.1,
            bomb.gridY * TILE_SIZE + TILE_SIZE * 0.1,
            TILE_SIZE * 0.8, TILE_SIZE * 0.8
        )) {
            onOwnBomb = true;
            break;
        }
    }

    if (keys['ArrowUp']) targetY -= player.speed;
    if (keys['ArrowDown']) targetY += player.speed;
    if (keys['ArrowLeft']) targetX -= player.speed;
    if (keys['ArrowRight']) targetX += player.speed;

    // função utilitária: tenta achar um deslocamento lateral/vertical que permita movimento
    function trySlideMove(desiredX, desiredY, moveAxis) {
        // moveAxis: 'vertical' ou 'horizontal'
        // se sem colisão, ok
        if (!checkTileCollision(desiredX, desiredY, player.width, player.height, onOwnBomb)) {
            player.x = desiredX;
            player.y = desiredY;
            return true;
        }

        // parâmetros de varredura
        const maxOffset = Math.max(8, TILE_SIZE * 0.25); // até 8px ou 25% do tile
        const step = 1;

        if (moveAxis === 'vertical') {
            // varre offsets em x: 1,-1,2,-2,... até maxOffset
            for (let d = 1; d <= maxOffset; d += step) {
                for (let sign of [1, -1]) {
                    const tryX = desiredX + sign * d;
                    if (!checkTileCollision(tryX, desiredY, player.width, player.height, onOwnBomb)) {
                        player.x = tryX;
                        player.y = desiredY;
                        return true;
                    }
                }
            }
        } else { // horizontal -> varre em y
            for (let d = 1; d <= maxOffset; d += step) {
                for (let sign of [1, -1]) {
                    const tryY = desiredY + sign * d;
                    if (!checkTileCollision(desiredX, tryY, player.width, player.height, onOwnBomb)) {
                        player.x = desiredX;
                        player.y = tryY;
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // --- Prioriza movimento diagonal suave: tenta aplicar movimento com sliding ---
    // Se houver movimento horizontal **e** vertical ao mesmo tempo, ainda assim tentamos aplicar ambos
    const movingVert = targetY !== player.y;
    const movingHorz = targetX !== player.x;

    if (movingVert && movingHorz) {
        // tenta aplicar horizontal primeiro (ou você pode inverter a ordem)
        const horzOk = trySlideMove(targetX, player.y, 'horizontal');
        const vertOk = trySlideMove(player.x, targetY, 'vertical');

        // se ambos ok, aplica ambos
        if (horzOk && vertOk) {
            // player já foi atualizado dentro do trySlideMove
        } else {
            // se só um funcionou, tenta aplicar ao menos um deles
            if (!horzOk && vertOk) {
                // já feito
            } else if (horzOk && !vertOk) {
                // mover horizontal já feito; tenta ajustar vertical onde possível
                trySlideMove(player.x, targetY, 'vertical');
            } else {
                // nenhum: tenta movimento diagonal direto (pior caso)
                // testa colisão diagonal simples
                if (!checkTileCollision(targetX, targetY, player.width, player.height, onOwnBomb)) {
                    player.x = targetX;
                    player.y = targetY;
                }
            }
        }
    } else if (movingVert) {
        // mover apenas vertical: tenta vertical puro; se bloqueado, varre offset em X
        if (!trySlideMove(player.x, targetY, 'vertical')) {
            // não conseguiu — tenta também mover levemente na direção do input horizontal (se houver)
            // por exemplo, se tecla direita estava pressionada junto, tenta empurrar pra direita
            if (keys['ArrowLeft'] || keys['ArrowRight']) {
                const dir = keys['ArrowRight'] ? 1 : -1;
                if (!trySlideMove(player.x + dir * player.speed, targetY, 'vertical')) {
                    // nada a fazer
                }
            }
        }
    } else if (movingHorz) {
        // mover apenas horizontal: tenta horizontal puro; se bloqueado, varre offset em Y
        if (!trySlideMove(targetX, player.y, 'horizontal')) {
            if (keys['ArrowUp'] || keys['ArrowDown']) {
                const dir = keys['ArrowDown'] ? 1 : -1;
                if (!trySlideMove(targetX, player.y + dir * player.speed, 'horizontal')) {
                    // nada a fazer
                }
            }
        }
    }
}

// Colocar bomba
function placeBomb() {
    if (player.bombsPlaced >= player.maxBombs || !player.alive) return;
    
    const gridX = Math.round(player.x / TILE_SIZE);
    const gridY = Math.round(player.y / TILE_SIZE);
    
    // Verificar se já tem bomba nessa posição
    for (let bomb of bombs) {
        if (bomb.gridX === gridX && bomb.gridY === gridY) {
            return;
        }
    }
    
    bombs.push({
        gridX: gridX,
        gridY: gridY,
        timer: BOMB_TIMER,
        range: BOMB_RANGE,
        placedByPlayer: true
    });
    
    player.bombsPlaced++;
}

// Atualizar bombas
function updateBombs(deltaTime) {
    for (let i = bombs.length - 1; i >= 0; i--) {
        bombs[i].timer -= deltaTime;
        
        if (bombs[i].timer <= 0) {
            explodeBomb(bombs[i]);
            if (bombs[i].placedByPlayer) {
                player.bombsPlaced--;
            }
            bombs.splice(i, 1);
        }
    }
}

// Explodir bomba
function explodeBomb(bomb) {
    const explosionCells = [];
    explosionCells.push({x: bomb.gridX, y: bomb.gridY});
    
    // Direções: cima, baixo, esquerda, direita
    const directions = [
        {dx: 0, dy: -1},
        {dx: 0, dy: 1},
        {dx: -1, dy: 0},
        {dx: 1, dy: 0}
    ];
    
    for (let dir of directions) {
        for (let i = 1; i <= bomb.range; i++) {
            const x = bomb.gridX + dir.dx * i;
            const y = bomb.gridY + dir.dy * i;
            
            if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) break;
            if (map[y][x] === TILE_WALL) break;
            
            explosionCells.push({x, y});
            
            if (map[y][x] === TILE_DESTRUCTIBLE) {
                map[y][x] = TILE_EMPTY;
                gameState.score += 10;
                break;
            }
        }
    }
    
    // Criar explosões visuais
    explosionCells.forEach(cell => {
        explosions.push({
            x: cell.x * TILE_SIZE,
            y: cell.y * TILE_SIZE,
            timer: EXPLOSION_DURATION
        });
    });
    
    // Verificar dano ao jogador
    if (player.alive && !player.invulnerable) {
        for (let cell of explosionCells) {
            if (checkRectCollision(
                player.x, player.y, player.width, player.height,
                cell.x * TILE_SIZE, cell.y * TILE_SIZE, TILE_SIZE, TILE_SIZE
            )) {
                hitPlayer();
                break;
            }
        }
    }
    
    // Verificar dano aos inimigos
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        for (let cell of explosionCells) {
            if (checkRectCollision(
                enemy.x, enemy.y, enemy.width, enemy.height,
                cell.x * TILE_SIZE, cell.y * TILE_SIZE, TILE_SIZE, TILE_SIZE
            )) {
                enemies.splice(i, 1);
                gameState.score += 100;
                break;
            }
        }
    }
    
    updateUI();
}

// Jogador levou dano
function hitPlayer() {
    gameState.lives--;
    player.invulnerable = true;
    player.invulnerableTime = 2000;
    
    if (gameState.lives <= 0) {
        player.alive = false;
        gameState.gameOver = true;
        showGameOver(false);
    }
    
    updateUI();
}

// Atualizar explosões
function updateExplosions(deltaTime) {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].timer -= deltaTime;
        if (explosions[i].timer <= 0) {
            explosions.splice(i, 1);
        }
    }
}

// Verifica se um tile está livre
function tileIsFree(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= GRID_WIDTH || ty >= GRID_HEIGHT) return false;
    return map[ty][tx] === TILE_EMPTY;
}

// Verifica se há bomba em um tile
function tileHasBomb(tx, ty) {
    return bombs.some(b => b.gridX === tx && b.gridY === ty);
}

// Move o inimigo
function moveEnemyTile(enemy, deltaTime) {
    if (!enemy.moving) return;

    // Se o alvo tem bomba agora, cancela movimento
    const targetTileX = Math.floor(enemy.targetX / TILE_SIZE);
    const targetTileY = Math.floor(enemy.targetY / TILE_SIZE);
    if (tileHasBomb(targetTileX, targetTileY)) {
        enemy.moving = false;
        return;
    }

    const speed = enemy.speed;
    const dx = enemy.targetX - enemy.x;
    const dy = enemy.targetY - enemy.y;

    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < speed) {
        // chegou no tile
        enemy.x = enemy.targetX;
        enemy.y = enemy.targetY;

        // registrar tile visitado
        const key = enemy.tileX + "," + enemy.tileY;
        enemy.visited.push(key);

        // manter só os últimos 12
        if (enemy.visited.length > 12) {
            enemy.visited.shift();
        }
        enemy.tileX = Math.floor(enemy.x / TILE_SIZE);
        enemy.tileY = Math.floor(enemy.y / TILE_SIZE);
        enemy.moving = false;
    } else {
        // anda suave
        enemy.x += (dx / dist) * speed;
        enemy.y += (dy / dist) * speed;
    }
}

// Atualiza a IA do inimigo
function updateEnemyAI(enemy) {
    if (enemy.decisionCooldown > 0) {
        enemy.decisionCooldown -= 1;
    } else {
        enemy.decisionCooldown = 5 + Math.floor(Math.random() * 10);
    }
    enemy.decisionCooldown = 5 + Math.floor(Math.random() * 10);

    if (enemy.moving) return;

    if (!enemy.visitedSet) enemy.visitedSet = new Set();

    const dirs = [
        {dx: 0, dy: -1, id: 0}, // cima
        {dx: 0, dy: 1,  id: 1}, // baixo
        {dx: -1, dy: 0, id: 2}, // esquerda
        {dx: 1, dy: 0,  id: 3}  // direita
    ];

    const opposite = {0:1, 1:0, 2:3, 3:2};

    // opções livres
    let options = dirs.filter(dir => {
        const nx = enemy.tileX + dir.dx;
        const ny = enemy.tileY + dir.dy;
        return tileIsFree(nx, ny) && !tileHasBomb(nx, ny);
    });

    if (options.length === 0) return;

    // evita voltar pro lado oposto se houver alternativa
    if (enemy.lastDir !== null) {
        const filtered = options.filter(o => o.id !== opposite[enemy.lastDir]);
        if (filtered.length > 0) options = filtered;
    }

    // --- NOVO: pontuação baseada em exploração global ---
    options.forEach(o => {
        const nx = enemy.tileX + o.dx;
        const ny = enemy.tileY + o.dy;
        const key = nx + "," + ny;

        let score = 0;

        // Altíssima prioridade se nunca visitou esse tile
        if (!enemy.visitedSet.has(key)) {
            score += 100;
        } else {
            score -= enemy.personality.revisitPenalty;
        }

        // bônus por corredor longo adaptado à personalidade
        let corridor = 0;
        for (let i = 1; i <= 8; i++) {
            const cx = nx + o.dx * i;
            const cy = ny + o.dy * i;
            if (!tileIsFree(cx, cy)) break;
            corridor++;
        }
        score += corridor * enemy.personality.corridorBias;

        o.score = score;
    });

    // ordena por score
    options.sort((a, b) => b.score - a.score);

    // chance de "curiosidade" (pegar outra direção mesmo que pior)
    let chosen;
    if (Math.random() < enemy.personality.curiosity && options.length > 1) {
        chosen = options[Math.floor(Math.random() * options.length)];
    } else {
        chosen = options[0];
    }

    const newTileX = enemy.tileX + chosen.dx;
    const newTileY = enemy.tileY + chosen.dy;

    enemy.targetX = newTileX * TILE_SIZE;
    enemy.targetY = newTileY * TILE_SIZE;

    enemy.tileX = newTileX;
    enemy.tileY = newTileY;

    enemy.visitedSet.add(`${newTileX},${newTileY}`);

    enemy.moving = true;
    enemy.lastDir = chosen.id;
}

// IA dos inimigos
function updateEnemies(deltaTime) {
    for (let enemy of enemies) {
        moveEnemyTile(enemy, deltaTime);

        if (!enemy.moving) {
            updateEnemyAI(enemy);
        }

        // colisão com o player continua igual
        if (player.alive && !player.invulnerable) {
            if (checkRectCollision(
                player.x, player.y, player.width, player.height,
                enemy.x, enemy.y, enemy.width, enemy.height
            )) {
                hitPlayer();
            }
        }
    }
}

// Desenhar o game
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar mapa
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            // TILE: parede sólida
            if (map[y][x] === TILE_WALL) {
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // contorno nítido
                ctx.strokeStyle = '#1a252f';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

            // TILE: parede destrutível
            } else if (map[y][x] === TILE_DESTRUCTIBLE) {
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                ctx.fillStyle = '#654321';
                ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);

                ctx.strokeStyle = '#5d3a1a';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

            // TILE: chão
            } else {
                ctx.fillStyle = (x + y) % 2 === 0 ? '#27ae60' : '#2ecc71';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    
    // Desenhar explosões
    for (let exp of explosions) {
        const alpha = exp.timer / EXPLOSION_DURATION;
        ctx.fillStyle = `rgba(255, 150, 0, ${alpha})`;
        ctx.fillRect(exp.x, exp.y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = `rgba(255, 50, 0, ${alpha * 0.8})`;
        ctx.fillRect(exp.x + 10, exp.y + 10, TILE_SIZE - 20, TILE_SIZE - 20);
    }
    
    // Desenhar bombas
    for (let bomb of bombs) {
        const pulse = Math.sin(bomb.timer / 100) * 0.1 + 0.9;
        const size = TILE_SIZE * 0.6 * pulse;
        const offset = (TILE_SIZE - size) / 2;
        
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(
            bomb.gridX * TILE_SIZE + TILE_SIZE / 2,
            bomb.gridY * TILE_SIZE + TILE_SIZE / 2,
            size / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Pavio
        ctx.strokeStyle = bomb.timer < 1000 ? '#e74c3c' : '#f39c12';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bomb.gridX * TILE_SIZE + TILE_SIZE / 2, bomb.gridY * TILE_SIZE + TILE_SIZE / 2 - size / 2);
        ctx.lineTo(bomb.gridX * TILE_SIZE + TILE_SIZE / 2, bomb.gridY * TILE_SIZE + TILE_SIZE / 2 - size / 2 - 10);
        ctx.stroke();
    }
    
    // Desenhar jogador
    if (player.alive) {
        if (!player.invulnerable || Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = '#3498db';
            ctx.fillRect(player.x, player.y, player.width, player.height);
            ctx.fillStyle = '#2980b9';
            ctx.fillRect(player.x + 5, player.y + 5, player.width - 10, player.height - 10);
            
            // Olhos
            ctx.fillStyle = '#fff';
            ctx.fillRect(player.x + 8, player.y + 8, 6, 6);
            ctx.fillRect(player.x + player.width - 14, player.y + 8, 6, 6);
        }
    }
    
    // Desenhar inimigos
    for (let enemy of enemies) {
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.fillStyle = '#d35400';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);
        
        // Olhos
        ctx.fillStyle = '#fff';
        ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 6);
        ctx.fillRect(enemy.x + enemy.width - 14, enemy.y + 8, 6, 6);
    }
}

// Atualizar UI
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('enemies').textContent = enemies.length;
    
    if (enemies.length === 0 && !gameState.victory) {
        gameState.victory = true;
        showGameOver(true);
    }
}

// Mostrar game over
function showGameOver(victory) {
    const gameOverDiv = document.getElementById('gameOver');
    const title = document.getElementById('gameOverTitle');
    const message = document.getElementById('gameOverMessage');
    
    if (victory) {
        title.textContent = 'Vitória!';
        message.textContent = `Você eliminou todos os inimigos! Score: ${gameState.score}`;
        gameOverDiv.classList.add('victory');
    } else {
        title.textContent = 'Game Over!';
        message.textContent = `Score Final: ${gameState.score}`;
        gameOverDiv.classList.remove('victory');
    }
    
    gameOverDiv.style.display = 'block';
}

// Reiniciar jogo
function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    initGame();
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    if (!gameState.gameOver && !gameState.victory) {
        movePlayer();
        updateEnemies(deltaTime);
        updateBombs(deltaTime);
        updateExplosions(deltaTime);
        
        if (player.invulnerable) {
            player.invulnerableTime -= deltaTime;
            if (player.invulnerableTime <= 0) {
                player.invulnerable = false;
            }
        }
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    e.preventDefault();
    
    if (e.key === ' ' && !gameState.gameOver && !gameState.victory) {
        e.preventDefault();
        placeBomb();
    }
});

document.addEventListener('keyup', (e) => {
    e.preventDefault();
    keys[e.key] = false;
});

// Iniciar jogo
initGame();
requestAnimationFrame(gameLoop);