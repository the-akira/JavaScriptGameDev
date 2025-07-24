const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverMessage = document.getElementById('gameOverMessage');
const startScreen = document.getElementById('startScreen');

// Configurações do jogo
const TILE_SIZE = 32;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 3;
const MONKEY_THROW_INTERVAL = 2000;
const LADDER_EXIT_DELAY = Number.MIN_VALUE;
let ladderExitBuffer = 0;
let DEBUG = true;

// Mapa do jogo
const gameMap = [
    "################################################",
    "#                                              #",
    "#                                              #",
    "#                                              #",
    "#   B      E   B    E             E     M      #",
    "##########################L  ###################",
    "#                         L                    #",
    "#                         L                    #",
    "#    B    E   B           L              E    B#",
    "##################L       L         ############",
    "#                 L       L                    #",
    "#                 L       L                    #",
    "#            E    L   E   L    B           E  B#",
    "#        L#########################L  ##########",
    "#        L                         L           #",
    "#        L                         L           #",
    "#B       L   B    E     B          L           #",
    "###L     L##################       L           #",
    "###L     L                         L           #",
    "#  L     L                         L           #",
    "#  L     L                         L           #",
    "#  L     L                         L           #",
    "#  L     L    B      E     B       L          P#",
    "################################################",
];

// Sistema de câmera
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    followTarget: null
};

// Dimensões do mundo
const WORLD_WIDTH = gameMap[0].length * TILE_SIZE;
const WORLD_HEIGHT = gameMap.length * TILE_SIZE;

// Objetos do jogo
let player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: 24,
    height: 24,
    onGround: false,
    onLadder: false,
    onLadderTop: false
};

let mama = { x: 0, y: 0, width: 24, height: 24 };
let monkeys = [];
let stones = [];
let babies = [];
let collectedBabies = 0;
let totalBabies = 0;
let gameState = 'playing';
let gameStarted = false;
let gameLoopId = null;

// Verificar se uma posição específica tem colisão
function getTileAt(x, y) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    
    if (row < 0 || row >= gameMap.length || col < 0 || col >= gameMap[row].length) {
        return '#'; // Fora do mapa é considerado sólido
    }
    
    return gameMap[row][col];
}

// Verificar se um tile é sólido
function isSolidTile(tile) {
    return tile === '#';
}

// Verificar se um tile é escada
function isLadderTile(tile) {
    return tile === 'L';
}

// Verificar se está no topo de uma escada
function isLadderTop(x, y) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    
    // Verificar se o tile atual é uma escada
    if (row >= 0 && row < gameMap.length && col >= 0 && col < gameMap[row].length) {
        if (gameMap[row][col] === 'L') {
            // Verificar se o tile acima NÃO é uma escada
            if (row > 0 && gameMap[row - 1][col] !== 'L') {
                return true;
            }
        }
    }
    return false;
}

// Verificar se pode ficar no topo da escada (funciona como chão)
function checkLadderTopSupport(x, y, width, height) {
    const tolerance = 4; // Pixels extras para cada lado
    const expandedX = x - tolerance;
    const expandedWidth = width + (tolerance * 2);
    
    const left = Math.floor(expandedX / TILE_SIZE);
    const right = Math.floor((expandedX + expandedWidth - 1) / TILE_SIZE);
    const bottom = Math.floor((y + height) / TILE_SIZE);
    
    let supportFound = false;
    
    for (let col = left; col <= right; col++) {
        if (isLadderTop(col * TILE_SIZE, bottom * TILE_SIZE)) {
            const tileLeft = col * TILE_SIZE;
            const tileRight = tileLeft + TILE_SIZE;
            const playerLeft = expandedX;
            const playerRight = expandedX + expandedWidth;
            
            const overlapLeft = Math.max(tileLeft, playerLeft);
            const overlapRight = Math.min(tileRight, playerRight);
            const overlapWidth = overlapRight - overlapLeft;
            
            // Verificar se o jogador está realmente ACIMA do topo da escada
            const ladderTopY = bottom * TILE_SIZE;
            const playerBottomY = y + height;
            
            // O jogador deve estar muito próximo do topo da escada (não embaixo)
            if (overlapWidth >= width * 0.1 && Math.abs(playerBottomY - ladderTopY) <= 2) {
                supportFound = true;
                break;
            }
        }
    }
    return supportFound;
}

// Verificar colisão de retângulo com tiles sólidos
function checkTileCollision(x, y, width, height) {
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.floor((x + width - 1) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.floor((y + height - 1) / TILE_SIZE);

    for (let row = top; row <= bottom; row++) {
        for (let col = left; col <= right; col++) {
            if (row >= 0 && row < gameMap.length && col >= 0 && col < gameMap[row].length) {
                if (isSolidTile(gameMap[row][col])) {
                    return true;
                }
            } else {
                return true; // Fora do mapa
            }
        }
    }
    return false;
}

// Verificar se está tocando uma escada
function checkLadderContact(x, y, width, height) {
    const tolerance = 6; // Tolerância em pixels
    const top = y;
    const bottom = y + height;
    
    // Verificar pontos da esquerda, centro e direita (com tolerância)
    const checkPoints = [
        x + width / 2 - tolerance,  // Esquerda do centro
        x + width / 2,              // Centro
        x + width / 2 + tolerance   // Direita do centro
    ];
    
    for (let checkX of checkPoints) {
        for (let checkY = top; checkY <= bottom; checkY += TILE_SIZE / 2) {
            if (isLadderTile(getTileAt(checkX, checkY))) {
                return true;
            }
        }
    }
    return false;
}

// Verificar se está tocando uma escada abaixo (para descer do topo)
function checkLadderBelow(x, y, width, height) {
    const tolerance = 6;
    const checkYStart = y + height + 1;
    const checkYEnd = y + height + 4; // Verificar alguns pixels abaixo
    
    // Verificar pontos em diferentes posições X e Y
    const checkPointsX = [
        x + width / 2 - tolerance,
        x + width / 2,
        x + width / 2 + tolerance
    ];
    
    for (let checkX of checkPointsX) {
        for (let checkY = checkYStart; checkY <= checkYEnd; checkY++) {
            if (isLadderTile(getTileAt(checkX, checkY))) {
                return true;
            }
        }
    }
    return false;
}

// Movimento com colisão horizontal
function moveHorizontal(entity, deltaX) {
    if (deltaX === 0) return;

    const steps = Math.abs(deltaX);
    const stepSize = deltaX > 0 ? 1 : -1;

    for (let i = 0; i < steps; i++) {
        const newX = entity.x + stepSize;
        
        if (newX < 0 || newX + entity.width > WORLD_WIDTH) {
            entity.vx = 0;
            break;
        }
        
        if (checkTileCollision(newX, entity.y, entity.width, entity.height)) {
            entity.vx = 0;
            break;
        }
        
        entity.x = newX;
    }
}

// Movimento com colisão vertical
function moveVertical(entity, deltaY) {
    if (deltaY === 0) return;

    const steps = Math.abs(deltaY);
    const stepSize = deltaY > 0 ? 1 : -1;

    for (let i = 0; i < steps; i++) {
        const newY = entity.y + stepSize;
        
        if (newY < 0 || newY + entity.height > WORLD_HEIGHT) {
            entity.vy = 0;
            if (deltaY > 0) {
                entity.onGround = true;
                entity.onLadder = false;
            }
            break;
        }
        
        if (checkTileCollision(entity.x, newY, entity.width, entity.height)) {
            entity.vy = 0;
            if (deltaY > 0) {
                entity.onGround = true;
                entity.onLadder = false;
            }
            break;
        }
        
        // Verificar se está descendo e há suporte do topo da escada (só se não estiver no modo escada)
        if (deltaY > 0 && !entity.onLadder && entity.vy > 0) {
            const ladderSupport = checkLadderTopSupport(entity.x, newY, entity.width, entity.height);
            if (ladderSupport) {
                // Ajustar a posição Y para ficar exatamente no topo da escada
                const bottom = Math.floor((newY + entity.height) / TILE_SIZE);
                const snapY = bottom * TILE_SIZE - entity.height;
                entity.y = snapY;
                entity.vy = 0;
                entity.onGround = true;
                entity.onLadderTop = true;
                entity.onLadder = false;
                break;
            }
        }
        
        entity.y = newY;
    }
}

// Verificar colisão com os filhotes
function checkBabyCollision() {
    for (let i = 0; i < babies.length; i++) {
        const baby = babies[i];
        if (!baby.collected && checkCollision(player, baby)) {
            baby.collected = true;
            collectedBabies++;
        }
    }
}

// Verificar colisão entre retângulos (melhorada)
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Verificar se está no chão
function checkGroundContact(entity) {
    // Verificar um pixel abaixo do jogador
    const groundCollision = checkTileCollision(entity.x, entity.y + entity.height + 1, entity.width, 1);
    const ladderTopSupport = checkLadderTopSupport(entity.x, entity.y + entity.height + 1, entity.width, 1);
    
    return groundCollision || ladderTopSupport;
}

// Inicializar posições baseadas no mapa
function initializeGame() {
    monkeys = [];
    stones = [];
    babies = [];
    collectedBabies = 0;
    totalBabies = 0;
    gameState = 'playing';
    
    for (let row = 0; row < gameMap.length; row++) {
        for (let col = 0; col < gameMap[row].length; col++) {
            const char = gameMap[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;
            
            if (char === 'P') {
                player.x = x + 4;
                player.y = y + 4;
                player.vx = 0;
                player.vy = 0;
                player.onGround = false;
                player.onLadder = false;
                player.onLadderTop = false;
            } else if (char === 'M') {
                mama.x = x + 4;
                mama.y = y + 4;
            } else if (char === 'E') {
                monkeys.push({
                    x: x + 4,
                    y: y + 4,
                    width: 24,
                    height: 24,
                    lastThrow: 0
                });
            } else if (char === 'B') {
                babies.push({
                    x: x + 4,
                    y: y + 4,
                    width: 16,
                    height: 16,
                    collected: false
                });
                totalBabies++;
            }
        }
    }
    
    camera.followTarget = player;
    updateCamera();
    gameOverScreen.style.display = 'none';
}

// Atualizar câmera
function updateCamera() {
    if (camera.followTarget) {
        camera.x = camera.followTarget.x + camera.followTarget.width / 2 - camera.width / 2;
        camera.y = camera.followTarget.y + camera.followTarget.height / 2 - camera.height / 2;
        
        camera.x = Math.max(0, Math.min(WORLD_WIDTH - camera.width, camera.x));
        camera.y = Math.max(0, Math.min(WORLD_HEIGHT - camera.height, camera.y));
    }
}

// Atualizar jogador (com sistema de colisão melhorado)
function updatePlayer() {
    if (gameState !== 'playing') return;

    // Verificar contato com escada
    const touchingLadder = checkLadderContact(player.x, player.y, player.width, player.height);
    const ladderBelow = checkLadderBelow(player.x, player.y, player.width, player.height);
    
    // Verificar se está no topo da escada
    const wasOnLadderTop = player.onLadderTop;
    player.onLadderTop = false;
    
    // Lógica melhorada para entrada no modo escada
    if (touchingLadder && ((keys['ArrowUp'] || keys['w']) || (keys['ArrowDown'] || keys['s']))) {
        player.onLadder = true;
        player.onGround = false;
        ladderExitBuffer = 0; // Reset do buffer quando entra na escada
    }
    
    // Se estava no topo da escada e pressiona para baixo, e há uma escada abaixo
    if (wasOnLadderTop && (keys['ArrowDown'] || keys['s']) && ladderBelow) {
        player.onLadder = true;
        player.onGround = false;
        player.onLadderTop = false;
        ladderExitBuffer = 0; // Reset do buffer
    }
    
    // Sair do modo escada se não estiver mais tocando
    if (!touchingLadder && !ladderBelow) {
        if (player.onLadder) {
            const nearGround = checkGroundContact(player) || checkLadderTopSupport(player.x, player.y + player.height + 3, player.width, 1);

            if (nearGround) {
                player.onLadder = false;
                ladderExitBuffer = 0;
            } else {
                if (ladderExitBuffer === 0) {
                    ladderExitBuffer = Date.now();
                }
                else if (Date.now() - ladderExitBuffer > LADDER_EXIT_DELAY) {
                    player.onLadder = false;
                    ladderExitBuffer = 0;
                }
            }
        }
    } else {
        ladderExitBuffer = 0;
    }
    
    // Se está no modo escada mas não pressiona nenhuma tecla vertical, sair do modo
    if (player.onLadder && !touchingLadder && !(keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'])) {
        const nearGround = checkGroundContact(player) || checkLadderTopSupport(player.x, player.y + player.height + 3, player.width, 1);

        if (nearGround) {
            player.onLadder = false;
            ladderExitBuffer = 0;
        } else {
            if (ladderExitBuffer === 0) {
                ladderExitBuffer = Date.now();
            }
            else if (Date.now() - ladderExitBuffer > LADDER_EXIT_DELAY) {
                player.onLadder = false;
                ladderExitBuffer = 0;
            }
        }
    }

    // Aplicar gravidade ou movimento em escada
    if (!player.onLadder) {
        player.vy += GRAVITY;
    } else {
        player.vy = 0;
        
        if (keys['ArrowUp'] || keys['w']) {
            player.vy = -PLAYER_SPEED;
        } else if (keys['ArrowDown'] || keys['s']) {
            player.vy = PLAYER_SPEED;
        }
    }

    // Movimento horizontal
    if (keys['ArrowLeft'] || keys['a']) {
        player.vx = -PLAYER_SPEED;
    } else if (keys['ArrowRight'] || keys['d']) {
        player.vx = PLAYER_SPEED;
    } else {
        player.vx = 0;
    }

    // Pular (só se não estiver no modo escada)
    if ((keys[' '] || keys['Space']) && player.onGround && !player.onLadder) {
        player.vy = JUMP_FORCE;
        player.onGround = false;
    }

    // Resetar estado do chão
    player.onGround = false;

    // Aplicar movimento com colisão
    moveHorizontal(player, player.vx);
    moveVertical(player, player.vy);

    // Verificar se está no chão após o movimento
    if (player.vy >= 0 && !player.onLadder) {
        player.onGround = checkGroundContact(player);
        
        // Verificar se está especificamente no topo de uma escada
        if (player.onGround && checkLadderTopSupport(player.x, player.y + player.height, player.width, 1)) {
            player.onLadderTop = true;
        }
    }

    // Verificar vitória
    if (checkCollision(player, mama)) {
        if (collectedBabies === totalBabies) {
            gameState = 'victory';
            showGameOver(true);
        } else {
            gameState = 'missingBabies';
            showGameOver(false);
        }
    }
}

// Configurações de arremesso
const MIN_THROW_ANGLE = 15;
const MAX_THROW_ANGLE = 75;
const MIN_THROW_FORCE = 3;
const MAX_THROW_FORCE = 6;

// Atualizar macacos
function updateMonkeys() {
    if (gameState !== 'playing') return;

    const currentTime = Date.now();
    
    monkeys.forEach(monkey => {
        if (currentTime - monkey.lastThrow > MONKEY_THROW_INTERVAL) {
            const angle = (MIN_THROW_ANGLE + Math.random() * 
                         (MAX_THROW_ANGLE - MIN_THROW_ANGLE)) * Math.PI / 180;
            
            const force = MIN_THROW_FORCE + Math.random() * 
                        (MAX_THROW_FORCE - MIN_THROW_FORCE);
            
            const vx = Math.cos(angle) * force;
            const vy = -Math.sin(angle) * force;
            
            const direction = Math.random() > 0.5 ? 1 : -1;
            
            stones.push({
                x: monkey.x + 12,
                y: monkey.y + 12,
                vx: vx * direction,
                vy: vy,
                width: 8,
                height: 8
            });
            
            monkey.lastThrow = currentTime;
        }
    });
}

// Atualizar pedras (com sistema de colisão melhorado)
function updateStones() {
    if (gameState !== 'playing') return;

    for (let i = stones.length - 1; i >= 0; i--) {
        const stone = stones[i];
        
        // Aplicar gravidade
        stone.vy += 0.2;
        
        // Mover pedra com colisão
        const oldX = stone.x;
        const oldY = stone.y;
        
        // Movimento horizontal
        stone.x += stone.vx;
        if (checkTileCollision(stone.x, stone.y, stone.width, stone.height)) {
            stone.x = oldX;
            stone.vx = -stone.vx * 0.5; // Quicar com perda de energia
        }
        
        // Movimento vertical
        stone.y += stone.vy;
        if (checkTileCollision(stone.x, stone.y, stone.width, stone.height) || 
            checkLadderTopSupport(stone.x, stone.y, stone.width, stone.height)) {
            stone.y = oldY;
            stone.vy = -stone.vy * 0.3; // Quicar com mais perda de energia
            
            // Se a velocidade for muito baixa, remover a pedra
            if (Math.abs(stone.vy) < 0.5) {
                stones.splice(i, 1);
                continue;
            }
        }
        
        // Verificar colisão com jogador
        if (checkCollision(stone, player)) {
            gameState = 'gameOver';
            showGameOver(false);
            return;
        }
        
        // Remover pedras que saíram muito longe
        if (stone.x < camera.x - 100 || stone.x > camera.x + camera.width + 100 || 
            stone.y > camera.y + camera.height + 100) {
            stones.splice(i, 1);
        }
    }
}

// Renderizar jogo
function render() {
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Desenhar mapa
    for (let row = 0; row < gameMap.length; row++) {
        for (let col = 0; col < gameMap[row].length; col++) {
            const char = gameMap[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;
            
            if (char === '#') {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#A0522D';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            } else if (char === 'L') {
                ctx.strokeStyle = '#CD853F';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x + 8, y);
                ctx.lineTo(x + 8, y + TILE_SIZE);
                ctx.moveTo(x + 24, y);  
                ctx.lineTo(x + 24, y + TILE_SIZE);
                for (let i = 0; i < 4; i++) {
                    const stepY = y + (i * 8) + 4;
                    ctx.moveTo(x + 8, stepY);
                    ctx.lineTo(x + 24, stepY);
                }
                ctx.stroke();
                
                // Destacar topo da escada
                if (isLadderTop(x, y)) {
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(x, y, TILE_SIZE, 4);
                    ctx.strokeStyle = '#A0522D';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, TILE_SIZE, 4);
                }
            }
        }
    }

    // Desenhar mamãe canguru
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(mama.x, mama.y + 3, mama.width, mama.height);
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(mama.x + 4, mama.y + 7, 16, 16);
    ctx.fillStyle = '#FF1493';
    ctx.font = '16px Arial';
    ctx.fillText('♥', mama.x + 7.25, mama.y - 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(mama.x + 6, mama.y + 11, 2, 2);
    ctx.fillRect(mama.x + 16, mama.y + 11, 2, 2);
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(mama.x + 4, mama.y - 1, 4, 4);
    ctx.fillRect(mama.x + 16, mama.y - 1, 4, 4);

    // Desenhar macacos
    monkeys.forEach(monkey => {
        ctx.fillStyle = '#70370f';
        ctx.fillRect(monkey.x, monkey.y + 3, monkey.width, monkey.height);
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(monkey.x + 4, monkey.y + 7, 16, 16);
        ctx.fillStyle = '#000';
        ctx.fillRect(monkey.x + 6, monkey.y + 11, 2, 2);
        ctx.fillRect(monkey.x + 16, monkey.y + 11, 2, 2);
    });

    // Desenhar bebês
    babies.forEach(baby => {
        if (!baby.collected) {
            ctx.fillStyle = '#FF8C69';
            ctx.fillRect(baby.x, baby.y + 11, baby.width, baby.height);
            ctx.fillStyle = '#FFB6C1';
            ctx.fillRect(baby.x + 2, baby.y + 13, 12, 12);
            ctx.fillStyle = '#000';
            ctx.fillRect(baby.x + 4, baby.y + 17, 2, 2);
            ctx.fillRect(baby.x + 10, baby.y + 17, 2, 2);
            ctx.fillStyle = '#FF8C69';
            ctx.fillRect(baby.x + 2, baby.y + 7, 3, 6);
            ctx.fillRect(baby.x + 11, baby.y + 7, 3, 6);
        }
    });

    // Desenhar pedras
    stones.forEach(stone => {
        ctx.fillStyle = '#696969';
        ctx.fillRect(stone.x, stone.y, stone.width, stone.height);
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(stone.x + 1, stone.y + 1, stone.width - 2, stone.height - 2);
    });

    // Desenhar jogador
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#FFB366';
    ctx.fillRect(player.x + 4, player.y + 4, 16, 16);
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 6, player.y + 8, 2, 2);
    ctx.fillRect(player.x + 16, player.y + 8, 2, 2);
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(player.x + 4, player.y - 4, 4, 8);
    ctx.fillRect(player.x + 16, player.y - 4, 4, 8);

    ctx.restore();

    // Desenhar HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`ᗢ ${collectedBabies}/${totalBabies}`, 10, 25);

    // Debug info
    if (DEBUG) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(`Player: ${Math.round(player.x)}, ${Math.round(player.y)}`, 10, 45);
        ctx.fillText(`On Ground: ${player.onGround}`, 10, 60);
        ctx.fillText(`On Ladder: ${player.onLadder}`, 10, 75);
        ctx.fillText(`On Ladder Top: ${player.onLadderTop}`, 10, 90);
        ctx.fillText(`Velocity: ${Math.round(player.vx)}, ${Math.round(player.vy)}`, 10, 105);
        ctx.fillText(`Stones: ${stones.length}`, 10, 120);       
    }
}

// Controles
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    keys[e.code] = true;
    
    if (e.key === 'r' || e.key === 'R') {
        restartGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    keys[e.code] = false;
});

// Mostrar tela de game over
function showGameOver(victory) {
    if (victory) {
        // Tela de vitória
        gameOverTitle.textContent = 'Parabéns!';
        gameOverMessage.textContent = `Você resgatou todos os ${totalBabies} filhotes e encontrou a mamãe canguru!`;
        gameOverScreen.classList.add('victory');
        gameOverScreen.innerHTML = `
            <h2>${gameOverTitle.textContent}</h2>
            <p>${gameOverMessage.textContent}</p>
            <button onclick="restartGame()">Jogar Novamente</button>
        `;
    } else if (gameState === 'missingBabies') {
        // Tela de filhotes faltando
        gameOverTitle.textContent = 'Ainda não!';
        gameOverMessage.textContent = `Você precisa coletar todos os ${totalBabies} filhotes primeiro!`;
        gameOverScreen.classList.remove('victory');
        gameOverScreen.innerHTML = `
            <h2>${gameOverTitle.textContent}</h2>
            <p>${gameOverMessage.textContent}</p>
            <p>Filhotes coletados: ${collectedBabies}/${totalBabies}</p>
            <button onclick="continueGame()">Continuar</button>
            <button onclick="restartGame()">Reiniciar</button>
        `;
    } else {
        // Tela de game over normal
        gameOverTitle.textContent = 'Game Over!';
        gameOverMessage.textContent = 'Você foi atingido por uma pedra!';
        gameOverScreen.classList.remove('victory');
        gameOverScreen.innerHTML = `
            <h2>${gameOverTitle.textContent}</h2>
            <p>${gameOverMessage.textContent}</p>
            <p>Você coletou ${collectedBabies} de ${totalBabies} filhotes</p>
            <button onclick="restartGame()">Jogar Novamente</button>
        `;
    }
    
    gameOverScreen.style.display = 'block';
}

function startGame() {
    gameStarted = true;
    startScreen.style.display = 'none';
    gameLoop(); // Inicia o loop do jogo
}

// Adicione esta nova função para continuar o jogo
function continueGame() {
    // Move o jogador para longe da mãe para evitar loop
    player.x = mama.x - 50;
    player.y = mama.y;
    
    gameState = 'playing';
    gameOverScreen.style.display = 'none';
}

// Reiniciar jogo
function restartGame() {
    // Cancela o loop anterior se existir
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    
    initializeGame();
    if (gameStarted) {
        gameOverScreen.style.display = 'none';
        gameLoop(); // Inicia um novo loop
    } else {
        startScreen.style.display = 'block';
    }
}

// Loop principal do jogo
function gameLoop() {
    updatePlayer();
    updateMonkeys();
    updateStones();
    updateCamera();
    checkBabyCollision();
    render();       
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Inicializar e começar o jogo
startScreen.style.display = 'block';
initializeGame();