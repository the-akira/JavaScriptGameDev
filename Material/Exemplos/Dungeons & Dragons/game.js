// Configurações do jogo
const config = {
    tileSize: 40,
    viewportWidth: 15,
    viewportHeight: 10,
    cameraX: 0,
    cameraY: 0,
    moveSpeed: 300 // Velocidade do movimento em ms
};

// Definindo os mapas como arrays 2D
const mapTemplates = {
    1: {
        tiles: [
            // 0 = chão, 1 = parede, 2 = porta
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        enemies: [
            { type: 'Goblin', x: 8, y: 5, health: 10, maxHealth: 10, attackRange: 1, damage: '1d6', color: '#2ecc71', movement: 4, visionRange: 3 },
            { type: 'Orc', x: 8, y: 7, health: 18, maxHealth: 18, attackRange: 1, damage: '1d8', color: '#27ae60', movement: 3, visionRange: 3 }
        ],
        doors: [
            { x: 1, y: 6, targetMap: 2, targetX: 2, targetY: 2 }
        ],
        playerStart: { x: 2, y: 2 }
    },
    2: {
        tiles: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        enemies: [
            { type: 'Skeleton', x: 15, y: 5, health: 15, maxHealth: 15, attackRange: 1, damage: '1d6', color: '#bdc3c7', movement: 5, visionRange: 3 }
        ],
        doors: [
            { x: 2, y: 2, targetMap: 1, targetX: 18, targetY: 9 }
        ],
        playerStart: { x: 10, y: 5 }
    }
};

// Estado do jogo
const gameState = {
    currentTurn: 1,
    activePlayerIndex: 0,
    actionsLeft: 2,
    gamePhase: 'player', // 'player' ou 'enemy'
    players: [
        { id: 1, type: 'warrior', x: 2, y: 2, health: 30, maxHealth: 30, attackRange: 1, damage: '1d8+2', color: '#3498db' },
        { id: 2, type: 'archer', x: 4, y: 2, health: 25, maxHealth: 25, attackRange: 4, damage: '1d6+1', color: '#e74c3c' },
        { id: 3, type: 'mage', x: 2, y: 4, health: 20, maxHealth: 20, attackRange: 3, damage: '1d10', color: '#9b59b6' }
    ],
    enemies: [],
    currentMap: 1,
    currentMapWidth: 0,
    currentMapHeight: 0,
    maps: {
        1: createMap(1),
        2: createMap(2)
    },
    selectedPlayer: null,
    movementPath: [],
    movementStepsLeft: 0,
    validMoveTiles: [],
    currentEnemyIndex: 0,
    isMoving: false,
    currentMoveIndex: 0,
    showingAttackRange: false,
    attackRangeTiles: [],
    movementStarted: false,
    enemyPaths: {},
    playerPaths: {},
};

// Cria um mapa simples com paredes e portas
function createMap(mapId) {
    const template = mapTemplates[mapId];
    const map = {
        walls: [],
        doors: template.doors || [],
        width: template.tiles[0].length, // Largura = número de colunas
        height: template.tiles.length    // Altura = número de linhas
    };

    // Processa o array de tiles para criar paredes
    for (let y = 0; y < template.tiles.length; y++) {
        for (let x = 0; x < template.tiles[y].length; x++) {
            if (template.tiles[y][x] === 1) { // Parede
                map.walls.push({ x, y });
            }
        }
    }

    return map;
}

// Carrega o mapa atual
function loadMap(mapId) {
    gameState.currentMap = mapId;
    const template = mapTemplates[mapId];
    const map = gameState.maps[mapId];
    
    // Atualiza as dimensões atuais do mapa
    gameState.currentMapWidth = map.width;
    gameState.currentMapHeight = map.height;
    
    // Atualiza as posições dos jogadores
    gameState.players[0].x = template.playerStart.x;
    gameState.players[0].y = template.playerStart.y;
    gameState.players[1].x = template.playerStart.x + 2;
    gameState.players[1].y = template.playerStart.y;
    gameState.players[2].x = template.playerStart.x;
    gameState.players[2].y = template.playerStart.y + 2;
    
    // Carrega os inimigos do mapa
    gameState.enemies = template.enemies.map((enemy, index) => ({
        id: index + 1,
        ...enemy
    }));
}

// Elementos do DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const turnCounter = document.getElementById('turn-counter');
const activePlayer = document.getElementById('active-player');
const actionsLeft = document.getElementById('actions-left');
const gamePhase = document.getElementById('game-phase');
const gameLog = document.getElementById('game-log');
const moveBtn = document.getElementById('move-btn');
const attackBtn = document.getElementById('attack-btn');
const endTurnBtn = document.getElementById('end-turn-btn');
const cameraLeftBtn = document.getElementById('camera-left-btn');
const cameraRightBtn = document.getElementById('camera-right-btn');
const cameraUpBtn = document.getElementById('camera-up-btn');
const cameraDownBtn = document.getElementById('camera-down-btn');
const miniMapCanvas = document.getElementById('miniMap');
const miniMapCtx = miniMapCanvas.getContext('2d');

// Inicialização do jogo
function init() {
    loadMap(1);
    updateUI();
    render();
    addToLog('Jogo iniciado, execute uma ação com o jogador selecionado.')
    
    // Event listeners
    canvas.addEventListener('click', handleCanvasClick);
    moveBtn.addEventListener('click', startMovement);
    attackBtn.addEventListener('click', startAttack);
    endTurnBtn.addEventListener('click', endTurn);
    cameraLeftBtn.addEventListener('click', () => moveCamera(-1, 0));
    cameraRightBtn.addEventListener('click', () => moveCamera(1, 0));
    cameraUpBtn.addEventListener('click', () => moveCamera(0, -1));
    cameraDownBtn.addEventListener('click', () => moveCamera(0, 1));
}

// Atualiza a interface do usuário
function updateUI() {
    turnCounter.textContent = gameState.currentTurn;
    
    if (gameState.gamePhase === 'player') {
        const activePlayerObj = gameState.players[gameState.activePlayerIndex];
        activePlayer.textContent = getPlayerName(activePlayerObj.type);
        activePlayer.style.color = activePlayerObj.color;
        
        actionsLeft.textContent = gameState.actionsLeft;
        gamePhase.textContent = 'Jogador';
        gamePhase.style.color = '#3498db';
        
        // Ativa/desativa botões conforme o estado do jogo
        moveBtn.disabled = gameState.actionsLeft <= 0 || gameState.movementStarted || gameState.isMoving;
        attackBtn.disabled = gameState.actionsLeft <= 0 || gameState.movementStarted || gameState.isMoving;
        endTurnBtn.disabled = gameState.isMoving;
    } else {
        if (gameState.currentEnemyIndex < gameState.enemies.length) {
            const activeEnemy = gameState.enemies[gameState.currentEnemyIndex];
            activePlayer.textContent = activeEnemy.type;
            activePlayer.style.color = activeEnemy.color;
        } else {
            activePlayer.textContent = 'Inimigos';
            activePlayer.style.color = '#2ecc71';
        }
        actionsLeft.textContent = '0';
        gamePhase.textContent = 'Inimigos';
        gamePhase.style.color = '#e74c3c';
        
        // Desativa todos os botões durante o turno dos inimigos
        moveBtn.disabled = true;
        attackBtn.disabled = true;
        endTurnBtn.disabled = true;
    }
}

// Desenha o mapa
function renderMiniMap() {
    const currentMap = gameState.maps[gameState.currentMap];
    
    // Calcula a escala para caber todo o mapa no mini-mapa
    const scaleX = miniMapCanvas.width / gameState.currentMapWidth;
    const scaleY = miniMapCanvas.height / gameState.currentMapHeight;
    const tileSize = Math.min(scaleX, scaleY);
    
    // Ajusta o tamanho do canvas para manter proporções inteiras
    const mapPixelWidth = Math.floor(gameState.currentMapWidth * tileSize);
    const mapPixelHeight = Math.floor(gameState.currentMapHeight * tileSize);
    miniMapCanvas.width = mapPixelWidth;
    miniMapCanvas.height = mapPixelHeight;
    
    // Fundo do mini-mapa
    miniMapCtx.fillStyle = '#111';
    miniMapCtx.fillRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);
    
    // Desenha o chão (opcional)
    miniMapCtx.fillStyle = '#333';
    for (let y = 0; y < gameState.currentMapHeight; y++) {
        for (let x = 0; x < gameState.currentMapWidth; x++) {
            miniMapCtx.fillRect(
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize
            );
        }
    }
    
    // Desenha paredes
    miniMapCtx.fillStyle = '#555';
    currentMap.walls.forEach(wall => {
        miniMapCtx.fillRect(
            wall.x * tileSize,
            wall.y * tileSize,
            tileSize,
            tileSize
        );
    });
    
    // Desenha portas
    miniMapCtx.fillStyle = '#8b4513';
    currentMap.doors.forEach(door => {
        miniMapCtx.fillRect(
            door.x * tileSize,
            door.y * tileSize,
            tileSize,
            tileSize
        );
    });
    
    // Desenha inimigos (círculos vermelhos)
    gameState.enemies.forEach(enemy => {
        miniMapCtx.fillStyle = enemy.color;
        miniMapCtx.beginPath();
        miniMapCtx.arc(
            (enemy.x + 0.5) * tileSize,
            (enemy.y + 0.5) * tileSize,
            tileSize * 0.4,
            0,
            Math.PI * 2
        );
        miniMapCtx.fill();
    });
    
    // Desenha jogadores (círculos coloridos)
    gameState.players.forEach(player => {
        miniMapCtx.fillStyle = player.color;
        miniMapCtx.beginPath();
        miniMapCtx.arc(
            (player.x + 0.5) * tileSize,
            (player.y + 0.5) * tileSize,
            tileSize * 0.4,
            0,
            Math.PI * 2
        );
        miniMapCtx.fill();
        
        // Destaque para o jogador ativo (contorno amarelo)
        if (gameState.gamePhase === 'player' && 
            gameState.players[gameState.activePlayerIndex].id === player.id) {
            miniMapCtx.strokeStyle = '#f1c40f';
            miniMapCtx.lineWidth = 2;
            miniMapCtx.stroke();
        }
    });
    
    // Adiciona interatividade para mover a câmera
    miniMapCanvas.onclick = function(e) {
        const rect = this.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / tileSize);
        const y = Math.floor((e.clientY - rect.top) / tileSize);
        
        // Centraliza a câmera no ponto clicado
        config.cameraX = Math.max(0, Math.min(
            gameState.currentMapWidth - config.viewportWidth,
            x - Math.floor(config.viewportWidth / 2)
        ));
        config.cameraY = Math.max(0, Math.min(
            gameState.currentMapHeight - config.viewportHeight,
            y - Math.floor(config.viewportHeight / 2)
        ));
        
        render();
    };
}

// Renderiza o jogo
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const currentMap = gameState.maps[gameState.currentMap];
    
    // Desenha o grid
    for (let x = 0; x < config.viewportWidth; x++) {
        for (let y = 0; y < config.viewportHeight; y++) {
            const worldX = x + config.cameraX;
            const worldY = y + config.cameraY;
            
            if (worldX >= 0 && worldX < gameState.currentMapWidth && worldY >= 0 && worldY < gameState.currentMapHeight) {
                // Fundo
                ctx.fillStyle = (x + y) % 2 === 0 ? '#3a3a3a' : '#333333';
                
                // Destaca tiles de movimento válidos
                if (gameState.validMoveTiles.some(t => t.x === worldX && t.y === worldY)) {
                    ctx.fillStyle = '#3a5a3a';
                }
                
                ctx.fillRect(x * config.tileSize, y * config.tileSize, config.tileSize, config.tileSize);
                
                // Portas
                const door = currentMap.doors.find(d => d.x === worldX && d.y === worldY);
                if (door) {
                    ctx.fillStyle = '#8b4513';
                    ctx.fillRect(x * config.tileSize, y * config.tileSize, config.tileSize, config.tileSize);
                }
                
                // Paredes
                const wall = currentMap.walls.find(w => w.x === worldX && w.y === worldY);
                if (wall) {
                    ctx.fillStyle = '#555555';
                    ctx.fillRect(x * config.tileSize, y * config.tileSize, config.tileSize, config.tileSize);
                }
            }
        }
    }

    // Desenha a grid (grade) entre os tiles
    ctx.strokeStyle = 'rgba(100, 100, 100, 1)'; // Cor da grid (cinza claro semi-transparente)
    ctx.lineWidth = 1; // Espessura da linha

    // Linhas verticais
    for (let x = 0; x <= config.viewportWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * config.tileSize, 0);
        ctx.lineTo(x * config.tileSize, config.viewportHeight * config.tileSize);
        ctx.stroke();
    }

    // Linhas horizontais
    for (let y = 0; y <= config.viewportHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * config.tileSize);
        ctx.lineTo(config.viewportWidth * config.tileSize, y * config.tileSize);
        ctx.stroke();
    }

    if (gameState.showingAttackRange) {
        gameState.attackRangeTiles.forEach(tile => {
            if (isInViewport(tile.x, tile.y)) {
                const screenX = (tile.x - config.cameraX) * config.tileSize;
                const screenY = (tile.y - config.cameraY) * config.tileSize;
                
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Vermelho semi-transparente
                ctx.fillRect(screenX, screenY, config.tileSize, config.tileSize);
            }
        });
    }
    
    // Desenha os inimigos
    gameState.enemies.forEach(enemy => {
        const screenX = (enemy.x - config.cameraX) * config.tileSize;
        const screenY = (enemy.y - config.cameraY) * config.tileSize;

        if (enemy.visionRange) {
            ctx.fillStyle = "rgba(255, 255, 0, 0.05)";
            for (let dx = -enemy.visionRange; dx <= enemy.visionRange; dx++) {
                for (let dy = -enemy.visionRange; dy <= enemy.visionRange; dy++) {
                    const dist = Math.max(Math.abs(dx), Math.abs(dy)); // Chebyshev
                    if (dist <= enemy.visionRange) {
                        const tileX = enemy.x + dx;
                        const tileY = enemy.y + dy;
                        if (tileX >= 0 && tileX < gameState.currentMapWidth && tileY >= 0 && tileY < gameState.currentMapHeight) {
                            const screenTileX = (tileX - config.cameraX) * config.tileSize;
                            const screenTileY = (tileY - config.cameraY) * config.tileSize;
                            ctx.fillRect(screenTileX, screenTileY, config.tileSize, config.tileSize);
                        }
                    }
                }
            }
        }
        
        if (isInViewport(enemy.x, enemy.y)) {
            // Corpo
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(screenX + config.tileSize/2, screenY + config.tileSize/2, config.tileSize/3, 0, Math.PI * 2);
            ctx.fill();
            
            // Barra de vida
            drawHealthBar(screenX, screenY, enemy.health, enemy.maxHealth, config.tileSize);
            
            // Nome
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.type, screenX + config.tileSize/2, screenY + config.tileSize/1.2);
        }
    });
    
    // Desenha os jogadores
    gameState.players.forEach(player => {
        const screenX = (player.x - config.cameraX) * config.tileSize;
        const screenY = (player.y - config.cameraY) * config.tileSize;
        
        if (isInViewport(player.x, player.y)) {
            // Corpo
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(screenX + config.tileSize/2, screenY + config.tileSize/2, config.tileSize/3, 0, Math.PI * 2);
            ctx.fill();
            
            // Barra de vida
            drawHealthBar(screenX, screenY, player.health, player.maxHealth, config.tileSize);
            
            // Nome
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(getPlayerName(player.type), screenX + config.tileSize/2, screenY + config.tileSize/1.2);
            
            // Destaque para o jogador ativo
            if (gameState.gamePhase === 'player' && 
                gameState.players[gameState.activePlayerIndex].id === player.id) {
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(screenX + config.tileSize/2, screenY + config.tileSize/2, config.tileSize/2.5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    });
    
    // Desenha o caminho de movimento (se não estiver em movimento)
    if (gameState.movementPath.length > 0 && !gameState.isMoving) {
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const firstStep = gameState.movementPath[0];
        let lastX = (firstStep.x - config.cameraX) * config.tileSize + config.tileSize/2;
        let lastY = (firstStep.y - config.cameraY) * config.tileSize + config.tileSize/2;
        ctx.moveTo(lastX, lastY);
        
        for (let i = 1; i < gameState.movementPath.length; i++) {
            const step = gameState.movementPath[i];
            const x = (step.x - config.cameraX) * config.tileSize + config.tileSize/2;
            const y = (step.y - config.cameraY) * config.tileSize + config.tileSize/2;
            ctx.lineTo(x, y);
            lastX = x;
            lastY = y;
        }
        
        ctx.stroke();
    }

    if (gameState.enemyPaths) {
        for (const [enemyId, path] of Object.entries(gameState.enemyPaths)) {
            if (!path || path.length < 2) continue;

            ctx.strokeStyle = 'rgba(231, 76, 60, 0.9)'; // vermelho
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]); // tracejado (opcional)

            ctx.beginPath();
            const start = path[0];
            if (isInViewport(start.x, start.y)) {
                ctx.moveTo(
                    (start.x - config.cameraX) * config.tileSize + config.tileSize / 2,
                    (start.y - config.cameraY) * config.tileSize + config.tileSize / 2
                );
                for (let i = 1; i < path.length; i++) {
                    const p = path[i];
                    if (!isInViewport(p.x, p.y)) continue;
                    ctx.lineTo(
                        (p.x - config.cameraX) * config.tileSize + config.tileSize / 2,
                        (p.y - config.cameraY) * config.tileSize + config.tileSize / 2
                    );
                }
                ctx.stroke();
                ctx.setLineDash([]); // reseta
            }
        }
    }

    if (gameState.playerPaths) {
        for (const [playerId, path] of Object.entries(gameState.playerPaths)) {
            if (!path || path.length < 2) continue;

            ctx.strokeStyle = 'rgba(241, 196, 15, 0.9)'; // amarelo
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 2]);

            ctx.beginPath();
            const start = path[0];
            if (isInViewport(start.x, start.y)) {
                ctx.moveTo(
                    (start.x - config.cameraX) * config.tileSize + config.tileSize / 2,
                    (start.y - config.cameraY) * config.tileSize + config.tileSize / 2
                );
                for (let i = 1; i < path.length; i++) {
                    const p = path[i];
                    if (!isInViewport(p.x, p.y)) continue;
                    ctx.lineTo(
                        (p.x - config.cameraX) * config.tileSize + config.tileSize / 2,
                        (p.y - config.cameraY) * config.tileSize + config.tileSize / 2
                    );
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    renderMiniMap();
}

// Desenha a barra de vida
function drawHealthBar(x, y, current, max, size) {
    const healthPercent = current / max;
    const barWidth = size * 0.6;
    const barHeight = 4;
    const barX = x + size * 0.2;
    const barY = y + size * 0.8;
    
    // Fundo da barra
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Preenchimento da barra
    ctx.fillStyle = healthPercent > 0.6 ? '#2ecc71' : 
                  healthPercent > 0.3 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
}

// Verifica se uma posição está na viewport
function isInViewport(x, y) {
    return x >= config.cameraX && x < config.cameraX + config.viewportWidth &&
           y >= config.cameraY && y < config.cameraY + config.viewportHeight;
}

// Manipula cliques no canvas
function handleCanvasClick(event) {
    if (gameState.gamePhase !== 'player' || gameState.isMoving) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / config.tileSize) + config.cameraX;
    const y = Math.floor((event.clientY - rect.top) / config.tileSize) + config.cameraY;
    
    // Se estiver selecionando um destino de movimento
    if (gameState.movementStepsLeft > 0 && gameState.validMoveTiles.some(t => t.x === x && t.y === y)) {
        movePlayerTo(x, y);
        return;
    }
    
    // Verifica se clicou em um jogador
    const clickedPlayer = gameState.players.find(p => p.x === x && p.y === y);
    if (clickedPlayer && clickedPlayer.id === gameState.players[gameState.activePlayerIndex].id) {
        gameState.selectedPlayer = clickedPlayer;
        addToLog(`Jogador ${getPlayerName(clickedPlayer.type)} selecionado.`);
        return;
    }
    
    // Verifica se clicou em um inimigo
    const clickedEnemy = gameState.enemies.find(e => e.x === x && e.y === y);
    if (clickedEnemy && gameState.selectedPlayer && gameState.showingAttackRange) {
        attemptAttack(gameState.selectedPlayer, clickedEnemy);
        return;
    }

    // Se clicou em qualquer outro lugar e estava mostrando alcance de ataque, limpa
    if (gameState.showingAttackRange) {
        gameState.showingAttackRange = false;
        gameState.attackRangeTiles = [];
        render();
    }
}

// Inicia o movimento
function startMovement() {
    if (gameState.actionsLeft <= 0 || gameState.gamePhase !== 'player' || gameState.isMoving) return;

    // Se o movimento já foi iniciado, não rola o dado novamente
    if (gameState.movementStarted) {
        addToLog(`Você já rolou o dado de movimento para esta ação.`);
        return;
    }
    
    const player = gameState.players[gameState.activePlayerIndex];
    gameState.selectedPlayer = player;
    gameState.showingAttackRange = false;
    gameState.attackRangeTiles = [];
    
    // Rola o dado para movimento
    const roll = rollDice(6);
    gameState.movementStepsLeft = roll;
    gameState.movementStarted = true;
    
    addToLog(`${getPlayerName(player.type)} rolou um D6 e obteve ${roll} passos de movimento.`);
    
    // Calcula as posições alcançáveis
    calculateReachableTiles(player.x, player.y, roll);
    
    updateUI();
    render();
}

// Calcula os tiles alcançáveis para movimento
function calculateReachableTiles(startX, startY, steps) {
    const currentMap = gameState.maps[gameState.currentMap];
    const visited = new Set();
    const queue = [{ x: startX, y: startY, stepsLeft: steps }];
    gameState.validMoveTiles = [];
    
    while (queue.length > 0) {
        const current = queue.shift();
        const key = `${current.x},${current.y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        if (!(current.x === startX && current.y === startY)) {
            gameState.validMoveTiles.push({ x: current.x, y: current.y });
        }
        
        if (current.stepsLeft <= 0) continue;
        
        // Mantenha apenas as 4 direções cardeais para movimento
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        
        for (const dir of directions) {
            const newX = current.x + dir.dx;
            const newY = current.y + dir.dy;
            const newKey = `${newX},${newY}`;
            
            if (newX < 0 || newX >= gameState.currentMapWidth || newY < 0 || newY >= gameState.currentMapHeight) {
                continue;
            }
            
            const isWall = currentMap.walls.some(w => w.x === newX && w.y === newY);
            if (isWall) continue;
            
            const isOccupied = isPositionOccupied(newX, newY, gameState.selectedPlayer?.id);
            if (isOccupied) continue;
            
            if (!visited.has(newKey)) {
                queue.push({ 
                    x: newX, 
                    y: newY, 
                    stepsLeft: current.stepsLeft - 1 
                });
            }
        }
    }
}

// Move o jogador para a posição clicada (passo a passo)
function movePlayerTo(targetX, targetY) {
    const player = gameState.players[gameState.activePlayerIndex];
    
    // Calcula o caminho
    const path = findPathBFS(player.x, player.y, targetX, targetY, gameState.movementStepsLeft);
    
    if (path.length === 0 || path.length > gameState.movementStepsLeft + 1) {
        addToLog("Caminho inválido ou muito longo.");
        return;
    }
    
    // Remove a posição inicial do caminho (já estamos nela)
    path.shift();
    
    // Configura o movimento passo a passo
    gameState.movementPath = path;
    gameState.isMoving = true;
    gameState.currentMoveIndex = 0;
    gameState.playerPaths[gameState.selectedPlayer.id] = [{ x: player.x, y: player.y }, ...path];

    updateUI();
    
    // Inicia a animação de movimento
    animateMovement();
}

// Anima o movimento passo a passo
function animateMovement() {
    if (gameState.currentMoveIndex >= gameState.movementPath.length) {
        // Movimento concluído
        gameState.isMoving = false;
        delete gameState.playerPaths[gameState.selectedPlayer?.id];
        gameState.movementPath = [];
        gameState.validMoveTiles = [];
        gameState.actionsLeft--;
        gameState.movementStarted = false;
        
        // Verifica se está em uma porta
        const player = gameState.players[gameState.activePlayerIndex];
        checkForDoor(player);
        
        updateUI();
        render();
        return;
    }
    
    // Move para o próximo passo
    const nextStep = gameState.movementPath[gameState.currentMoveIndex];
    const player = gameState.players[gameState.activePlayerIndex];
    player.x = nextStep.x;
    player.y = nextStep.y;
    gameState.currentMoveIndex++;
    
    // Centraliza a câmera no jogador
    centerCameraOnPlayer(player);
    
    // Agenda o próximo passo
    setTimeout(animateMovement, config.moveSpeed);
    
    render();
}

// Verifica se uma posição está ocupada
function isPositionOccupied(x, y, excludePlayerId = null) {
    // Verifica jogadores
    if (gameState.players.some(p => p.id !== excludePlayerId && p.x === x && p.y === y)) {
        return true;
    }
    
    // Verifica inimigos
    if (gameState.enemies.some(e => e.x === x && e.y === y)) {
        return true;
    }
    
    return false;
}

// Inicia um ataque
function startAttack() {
    if (gameState.actionsLeft <= 0 || gameState.gamePhase !== 'player' || gameState.isMoving) return;
    
    const player = gameState.players[gameState.activePlayerIndex];
    gameState.selectedPlayer = player;

    calculateAttackRangeTiles(player.x, player.y, player.attackRange);
    gameState.showingAttackRange = true;
    gameState.isMoving = false;
    gameState.movementPath = [];
    gameState.validMoveTiles = [];

    addToLog(`Selecione um inimigo para atacar com ${getPlayerName(player.type)}.`);
    updateUI();
    render();
}

// Calcula o alcance de ataque
function calculateAttackRangeTiles(startX, startY, range) {
    const currentMap = gameState.maps[gameState.currentMap];
    gameState.attackRangeTiles = [];
    
    // Usando Chebyshev distance para permitir ataques diagonais
    for (let x = startX - range; x <= startX + range; x++) {
        for (let y = startY - range; y <= startY + range; y++) {
            // Verifica se está dentro do mapa
            if (x < 0 || x >= gameState.currentMapWidth || y < 0 || y >= gameState.currentMapHeight) {
                continue;
            }
            
            // Calcula a distância (Chebyshev)
            const dx = Math.abs(x - startX);
            const dy = Math.abs(y - startY);
            const distance = Math.max(dx, dy);
            
            if (distance <= range) {
                // Verifica se não é parede
                const isWall = currentMap.walls.some(w => w.x === x && w.y === y);
                if (!isWall) {
                    gameState.attackRangeTiles.push({ x, y });
                }
            }
        }
    }
}

// Tenta atacar um inimigo
function attemptAttack(player, enemy) {
    if (gameState.actionsLeft <= 0 || gameState.gamePhase !== 'player' || gameState.isMoving) return;
    
    // Verifica alcance com Chebyshev (permite diagonais)
    const dx = Math.abs(player.x - enemy.x);
    const dy = Math.abs(player.y - enemy.y);
    const distance = Math.max(dx, dy);
    
    if (distance > player.attackRange) {
        addToLog(`Ataque falhou: inimigo fora do alcance (${distance} tiles, alcance ${player.attackRange}).`);
        return;
    }
    
    // Restante da função permanece igual
    const attackRoll = rollDice(20);
    addToLog(`${getPlayerName(player.type)} rolou um D20 para ataque: ${attackRoll}`);
    
    if (attackRoll >= 10) {
        const damage = rollDamage(player.damage);
        enemy.health -= damage;
        addToLog(`Acertou! Causou ${damage} de dano. ${enemy.type} tem ${enemy.health}/${enemy.maxHealth} de vida.`);
        
        if (enemy.health <= 0) {
            gameState.enemies = gameState.enemies.filter(e => e.id !== enemy.id);
            addToLog(`${enemy.type} foi derrotado!`);
            
            if (gameState.enemies.length === 0) {
                addToLog("Todos os inimigos foram derrotados. Vitória!");
            }
        }
    } else {
        addToLog("Errou o ataque!");
    }
    
    gameState.actionsLeft--;
    gameState.showingAttackRange = false;
    gameState.attackRangeTiles = [];
    gameState.selectedPlayer = null;

    updateUI();
    render();
}

// Finaliza o turno atual
function endTurn() {
    if (gameState.gamePhase === 'player') {
        // Passa para o próximo jogador ou para os inimigos
        gameState.activePlayerIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;
        gameState.showingAttackRange = false;
        gameState.attackRangeTiles = [];
        gameState.movementStarted = false;
        gameState.validMoveTiles = [];
        
        // Se voltou ao primeiro jogador, começa o turno dos inimigos
        if (gameState.activePlayerIndex === 0) {
            gameState.gamePhase = 'enemy';
            gameState.currentEnemyIndex = 0;
            addToLog(`Turno ${gameState.currentTurn}: Inimigos começam a agir.`);
            processEnemyTurn();
        } else {
            gameState.currentTurn++;
            gameState.actionsLeft = 2;
            gameState.selectedPlayer = null;
            gameState.movementPath = [];
            gameState.movementStepsLeft = 0;
            gameState.validMoveTiles = [];
            
            // Centraliza a câmera no novo jogador ativo
            centerCameraOnPlayer(gameState.players[gameState.activePlayerIndex]);
            
            addToLog(`Turno ${gameState.currentTurn}: ${getPlayerName(gameState.players[gameState.activePlayerIndex].type)} começa a jogar.`);
        }
    }
    
    updateUI();
    render();
}

// Verifica se jogador está no campo de visão
function isPlayerInVision(enemy) {
    for (const player of gameState.players) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.max(Math.abs(dx), Math.abs(dy)); // Chebyshev
        if (distance <= (enemy.visionRange || 5)) {
            return true;
        }
    }
    return false;
}

// Processa o turno dos inimigos
function processEnemyTurn() {
    if (gameState.gamePhase !== 'enemy' || gameState.currentEnemyIndex >= gameState.enemies.length) {
        // Todos os inimigos agiram, volta para os jogadores
        gameState.gamePhase = 'player';
        gameState.currentTurn++;
        gameState.activePlayerIndex = 0;
        gameState.actionsLeft = 2;
        gameState.selectedPlayer = null;
        
        // Centraliza a câmera no primeiro jogador
        centerCameraOnPlayer(gameState.players[0]);
        
        addToLog(`Turno ${gameState.currentTurn}: Jogadores começam a jogar.`);
        updateUI();
        render();
        return;
    }
    
    const enemy = gameState.enemies[gameState.currentEnemyIndex];

    updateUI();

    if (!isPlayerInVision(enemy)) {
        addToLog(`${enemy.type} não vê nenhum jogador e fica parado.`);
        // Aguarda um pouco para mostrar na UI antes de passar para o próximo inimigo
        setTimeout(() => {
            gameState.currentEnemyIndex++;
            processEnemyTurn();
        }, 800);
        return;
    }
    
    // Tenta atacar um jogador próximo
    const targetPlayer = findClosestPlayer(enemy);
    
    if (targetPlayer && canAttack(enemy, targetPlayer)) {
        // Ataca o jogador
        setTimeout(() => {
            enemyAttack(enemy, targetPlayer);
            gameState.currentEnemyIndex++;
            setTimeout(processEnemyTurn, 500);
        }, 1000);
    } else {
        // Rola o dado de movimento para o inimigo
        const movementRoll = rollDice(enemy.movement); // Usa o valor de movement como número de lados do dado
        addToLog(`${enemy.type} rolou um D${enemy.movement} e obteve ${movementRoll} passos de movimento.`);
        // Move-se em direção ao jogador mais próximo com os passos obtidos
        setTimeout(() => {
            moveEnemyTowardsPlayer(enemy, movementRoll, () => {
                gameState.currentEnemyIndex++;
                setTimeout(processEnemyTurn, 500);
            });
        }, 1000);
    }
}

// Encontra o jogador mais próximo
function findClosestPlayer(enemy) {
    let closestPlayer = null;
    let minDistance = Infinity;
    
    for (const player of gameState.players) {
        const dx = Math.abs(enemy.x - player.x);
        const dy = Math.abs(enemy.y - player.y);
        const chebyshevDist = Math.max(dx, dy); // usado para visão

        // ignora se está fora da visão do inimigo
        if (chebyshevDist > enemy.visionRange) continue;

        // distância real até o jogador (via BFS)
        const path = findPathBFS(enemy.x, enemy.y, player.x, player.y, 50);
        if (path.length > 0 && path.length < minDistance) {
            minDistance = path.length;
            closestPlayer = player;
        }
    }
    
    return closestPlayer;
}

// Verifica se o inimigo pode atacar o jogador
function canAttack(attacker, target) {
    // Distância de Chebyshev (permite diagonais)
    const dx = Math.abs(attacker.x - target.x);
    const dy = Math.abs(attacker.y - target.y);
    const distance = Math.max(dx, dy); // Isso permite ataques diagonais
    
    return distance <= attacker.attackRange;
}

// Inimigo ataca um jogador
function enemyAttack(enemy, player) {
    // Rola o dado de ataque (D20)
    const attackRoll = rollDice(20);
    addToLog(`${enemy.type} rolou um D20 para ataque: ${attackRoll}`);
    
    // Verifica se acertou (simplificado: precisa de 10+ para acertar)
    if (attackRoll >= 10) {
        // Calcula dano
        const damage = rollDamage(enemy.damage);
        player.health -= damage;
        addToLog(`Acertou! Causou ${damage} de dano. ${getPlayerName(player.type)} tem ${player.health}/${player.maxHealth} de vida.`);
        
        // Verifica se o jogador morreu
        if (player.health <= 0) {
            gameState.players = gameState.players.filter(p => p.id !== player.id);
            addToLog(`${getPlayerName(player.type)} foi derrotado!`);
            
            // Verifica se o jogo acabou
            if (gameState.players.length === 0) {
                addToLog("Todos os jogadores foram derrotados. Fim de jogo!");
                return;
            }
        }
    } else {
        addToLog(`${enemy.type} errou o ataque!`);
    }
    
    render();
}

// Move o inimigo em direção ao jogador (passo a passo)
function moveEnemyTowardsPlayer(enemy, stepsLeft, callback) {
    if (stepsLeft <= 0) {
        callback();
        return;
    }

    const targetPlayer = findClosestPlayer(enemy);
    if (!targetPlayer) {
        callback();
        return;
    }

    // Lista de posições adjacentes ao jogador
    const adjacentTiles = [
        { x: targetPlayer.x + 1, y: targetPlayer.y },
        { x: targetPlayer.x - 1, y: targetPlayer.y },
        { x: targetPlayer.x,     y: targetPlayer.y + 1 },
        { x: targetPlayer.x,     y: targetPlayer.y - 1 },
        { x: targetPlayer.x + 1, y: targetPlayer.y + 1 },
        { x: targetPlayer.x - 1, y: targetPlayer.y + 1 },
        { x: targetPlayer.x + 1, y: targetPlayer.y - 1 },
        { x: targetPlayer.x - 1, y: targetPlayer.y - 1 }
    ].filter(pos => 
        pos.x >= 0 && pos.x < gameState.currentMapWidth &&
        pos.y >= 0 && pos.y < gameState.currentMapHeight &&
        !isPositionOccupied(pos.x, pos.y) &&
        !gameState.maps[gameState.currentMap].walls.some(w => w.x === pos.x && w.y === pos.y)
    );

    // Escolhe a posição adjacente mais próxima
    let bestPath = [];
    for (const tile of adjacentTiles) {
        const path = findPathBFS(enemy.x, enemy.y, tile.x, tile.y, 50);
        if (path.length > 0 && (bestPath.length === 0 || path.length < bestPath.length)) {
            bestPath = path;
        }
    }

    if (bestPath.length > 1) {
        bestPath.shift(); // Remove a posição atual do inimigo
        const stepsToMove = bestPath.slice(0, stepsLeft);
        const fullPath = [{ x: enemy.x, y: enemy.y }, ...stepsToMove];
        gameState.enemyPaths[enemy.id] = fullPath;
        animateEnemyMovement(enemy, [{ x: enemy.x, y: enemy.y }, ...stepsToMove], callback);
    } else {
        addToLog(`${enemy.type} não conseguiu encontrar caminho até o jogador.`);
        callback();
    }
}

// Algoritmo BFS para encontrar caminho
function findPathBFS(startX, startY, targetX, targetY, maxSteps) {
    const currentMap = gameState.maps[gameState.currentMap];
    const queue = [{ x: startX, y: startY, path: [] }];
    const visited = new Set();
    visited.add(`${startX},${startY}`);
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        // Chegou ao destino
        if (current.x === targetX && current.y === targetY) {
            return [...current.path, { x: current.x, y: current.y }];
        }
        
        // Limita pelo número máximo de passos
        if (current.path.length >= maxSteps) {
            continue;
        }
        
        // Verifica vizinhos
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        
        for (const dir of directions) {
            const newX = current.x + dir.dx;
            const newY = current.y + dir.dy;
            const newKey = `${newX},${newY}`;
            
            // Verifica se está dentro dos limites do mapa
            if (newX < 0 || newX >= gameState.currentMapWidth || newY < 0 || newY >= gameState.currentMapHeight) {
                continue;
            }
            
            // Verifica se já foi visitado
            if (visited.has(newKey)) continue;
            visited.add(newKey);
            
            // Verifica se há parede
            const isWall = currentMap.walls.some(w => w.x === newX && w.y === newY);
            if (isWall) continue;
            
            // Verifica se está ocupado por outro personagem (exceto o destino)
            if (!(newX === targetX && newY === targetY)) {
                const isOccupied = isPositionOccupied(newX, newY, gameState.selectedPlayer?.id);
                if (isOccupied) continue;
            }
            
            // Adiciona à fila
            queue.push({
                x: newX,
                y: newY,
                path: [...current.path, { x: current.x, y: current.y }]
            });
        }
    }
    
    // Não encontrou caminho
    return [];
}

// Anima o movimento do inimigo passo a passo
function animateEnemyMovement(enemy, steps, callback, index = 0) {
    if (index >= steps.length) {
        callback();
        return;
    }
    
    enemy.x = steps[index].x;
    enemy.y = steps[index].y;

    gameState.enemyPaths[enemy.id] = steps.slice(index);
    
    render();
    
    setTimeout(() => {
        animateEnemyMovement(enemy, steps, callback, index + 1);
    }, config.moveSpeed);
}

// Verifica se o jogador está em uma porta e troca de mapa se estiver
function checkForDoor(player) {
    const currentMap = gameState.maps[gameState.currentMap];
    const door = currentMap.doors.find(d => d.x === player.x && d.y === player.y);
    
    if (door) {
        addToLog(`Entrando no mapa ${door.targetMap}...`);
        loadMap(door.targetMap);
        player.x = door.targetX;
        player.y = door.targetY;
        render();
        centerCameraOnPlayer(gameState.players[gameState.activePlayerIndex]);
    }
}

// Move a câmera
function moveCamera(dx, dy) {
    config.cameraX = Math.max(0, Math.min(gameState.currentMapWidth - config.viewportWidth, config.cameraX + dx));
    config.cameraY = Math.max(0, Math.min(gameState.currentMapHeight - config.viewportHeight, config.cameraY + dy));
    render();
}

// Centraliza a câmera no jogador
function centerCameraOnPlayer(player) {
    config.cameraX = Math.max(0, Math.min(
        gameState.currentMapWidth - config.viewportWidth, 
        player.x - Math.floor(config.viewportWidth / 2)
    ));
    config.cameraY = Math.max(0, Math.min(
        gameState.currentMapHeight - config.viewportHeight, 
        player.y - Math.floor(config.viewportHeight / 2)
    ));
    render();
}

// Rola um dado
function rollDice(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

// Rola dano baseado em uma string como "1d6+2"
function rollDamage(damageStr) {
    const parts = damageStr.split(/d|\+/);
    const numDice = parseInt(parts[0]) || 1;
    const diceSides = parseInt(parts[1]) || 6;
    const modifier = parseInt(parts[2]) || 0;
    
    let total = 0;
    for (let i = 0; i < numDice; i++) {
        total += rollDice(diceSides);
    }
    
    return total + modifier;
}

// Retorna o nome do jogador
function getPlayerName(type) {
    const names = {
        'warrior': 'Guerreiro',
        'archer': 'Arqueiro',
        'mage': 'Mago'
    };
    return names[type] || type;
}

// Adiciona mensagem ao log
function addToLog(message) {
    const entry = document.createElement('div');
    entry.innerHTML = message.replace(/(D\d+)/g, '<span class="dice-roll">$1</span>');
    gameLog.appendChild(entry);
    gameLog.scrollTop = gameLog.scrollHeight;
}

// Inicia o jogo
window.onload = init;