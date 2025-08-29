// Configuração do jogo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE_SIZE = 32;

// Estados do jogo
let currentLevel = 0;
let playerX = 0;
let playerY = 0;
let moves = 0;
let gameMap = [];
let originalMap = [];

// Símbolos do mapa
const SYMBOLS = {
    EMPTY: '0',
    WALL: '#',
    PLAYER: '@',
    BOX: '$',
    TARGET: '.',
    BOX_ON_TARGET: '*',
    PLAYER_ON_TARGET: '+'
};

// Definição dos mapas (você pode adicionar quantos quiser aqui)
const LEVELS = [
    {
        name: "Nível 1 - Iniciante",
        map: [
            "#######",
            "#00000#",
            "#0$000#",
            "#00+00#",
            "#00000#",
            "#######"
        ]
    },
    {
        name: "Nível 2 - Básico",
        map: [
            "########",
            "#000000#",
            "#0$$0@0#",
            "#00..*0#",
            "#00*000#",
            "########"
        ]
    },
    {
        name: "Nível 3 - Intermediário",
        map: [
            "#########",
            "#0000000#",
            "#0$0$0$0#",
            "#000@000#",
            "#0.0.0.0#",
            "#0000000#",
            "#########"
        ]
    },
    {
        name: "Nível 4 - Desafio",
        map: [
            "##########",
            "#00000000#",
            "#0$0000$0#",
            "#00$$$$00#",
            "#000@0000#",
            "#00....00#",
            "#00000000#",
            "##########"
        ]
    },
    {
        name: "Nível 5 - Difícil",
        map: [
            "00#####0",
            "###000#0",
            "#.@$00#0",
            "###0$.#0",
            "#.##$0#0",
            "#0#0.0##",
            "#$0*$$.#",
            "#000.00#",
            "########"
        ]
    },
    {
        name: "Nível 6 - Muito Difícil",
        map: [
            "0000#####0000000000000",
            "0000#000#0000000000000",
            "0000#$00#0000000000000",
            "00###00$###00000000000",
            "00#00$00$0#00000000000",
            "###0#0###0#00000######",
            "#000#0###0#######00..#",
            "#0$00$0000000000000..#",
            "#####0####0#@####00..#",
            "0000#000000###00######",
            "0000########0000000000"
        ]
    }
];

// Inicialização do jogo
function initGame() {
    loadLevel(currentLevel);
    updateUI();
    gameLoop();
}

// Carrega um nível específico
function loadLevel(levelIndex) {
    if (levelIndex < 0 || levelIndex >= LEVELS.length) return;
    
    const level = LEVELS[levelIndex];
    gameMap = level.map.map(row => row.split(''));
    originalMap = level.map.map(row => row.split(''));
    
    for (let y = 0; y < gameMap.length; y++) {
        for (let x = 0; x < gameMap[y].length; x++) {
            const tile = gameMap[y][x];
            if (tile === SYMBOLS.PLAYER || tile === SYMBOLS.PLAYER_ON_TARGET) {
                playerX = x;
                playerY = y;
                gameMap[y][x] = SYMBOLS.EMPTY;
                if (tile === SYMBOLS.PLAYER_ON_TARGET) {
                    originalMap[y][x] = SYMBOLS.TARGET;
                }
            }
            if (tile === SYMBOLS.BOX_ON_TARGET) {
                gameMap[y][x] = SYMBOLS.BOX;
                originalMap[y][x] = SYMBOLS.TARGET;
            }
        }
    }

    // Corrige estado inicial das caixas
    for (let y = 0; y < gameMap.length; y++) {
        for (let x = 0; x < gameMap[y].length; x++) {
            if (gameMap[y][x] === SYMBOLS.BOX && originalMap[y][x] === SYMBOLS.TARGET) {
                gameMap[y][x] = SYMBOLS.BOX_ON_TARGET;
            }
        }
    }
    
    moves = 0;
    document.getElementById('levelComplete').style.display = 'none';
    updateCanvasSize();
}

// Atualiza o tamanho do canvas baseado no mapa
function updateCanvasSize() {
    const width = gameMap[0].length * TILE_SIZE;
    const height = gameMap.length * TILE_SIZE;
    canvas.width = width;
    canvas.height = height;
}

// Renderização do jogo
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenha o mapa
    for (let y = 0; y < gameMap.length; y++) {
        for (let x = 0; x < gameMap[y].length; x++) {
            const tile = gameMap[y][x];
            const posX = x * TILE_SIZE;
            const posY = y * TILE_SIZE;
            const centerX = posX + TILE_SIZE / 2;
            const centerY = posY + TILE_SIZE / 2;
            
            // Cor de fundo
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
            
            // Desenha borda sutil para cada célula
            ctx.strokeStyle = '#404040';
            ctx.lineWidth = 1;
            ctx.strokeRect(posX + 0.5, posY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
            
            switch (tile) {
                case SYMBOLS.WALL:
                    // Parede - Retângulo marrom com gradiente
                    const gradient = ctx.createLinearGradient(posX, posY, posX + TILE_SIZE, posY + TILE_SIZE);
                    gradient.addColorStop(0, '#8B4513');
                    gradient.addColorStop(1, '#5D2F0A');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(posX + 2, posY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    
                    // Borda da parede
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(posX + 2, posY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    break;
                    
                case SYMBOLS.BOX:
                    // Caixa - Quadrado laranja
                    ctx.fillStyle = '#FF8C00';
                    ctx.fillRect(posX + 4, posY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                    
                    // Borda da caixa
                    ctx.strokeStyle = '#FF6347';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(posX + 4, posY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                    
                    // Detalhes da caixa (linhas internas)
                    ctx.strokeStyle = '#FF6347';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(posX + 6, posY + 6);
                    ctx.lineTo(posX + TILE_SIZE - 6, posY + TILE_SIZE - 6);
                    ctx.moveTo(posX + TILE_SIZE - 6, posY + 6);
                    ctx.lineTo(posX + 6, posY + TILE_SIZE - 6);
                    ctx.stroke();
                    break;
                    
                case SYMBOLS.TARGET:
                    // Local de destino - Círculo dourado
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, TILE_SIZE / 3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Borda do target
                    ctx.strokeStyle = '#FFA500';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Círculo interno menor
                    ctx.fillStyle = '#FFFF00';
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, TILE_SIZE / 6, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case SYMBOLS.BOX_ON_TARGET:
                    // Caixa no local correto - Quadrado verde sobre círculo dourado
                    // Primeiro desenha o target
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, TILE_SIZE / 3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Caixa verde por cima
                    ctx.fillStyle = '#32CD32';
                    ctx.fillRect(posX + 6, posY + 6, TILE_SIZE - 12, TILE_SIZE - 12);
                    
                    // Borda da caixa
                    ctx.strokeStyle = '#228B22';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(posX + 6, posY + 6, TILE_SIZE - 12, TILE_SIZE - 12);
                    
                    // Marca de "correto" (V)
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(centerX - 6, centerY - 2);
                    ctx.lineTo(centerX - 2, centerY + 4);
                    ctx.lineTo(centerX + 6, centerY - 4);
                    ctx.stroke();
                    break;
            }
        }
    }
    
    // Desenha o jogador - Círculo azul
    ctx.fillStyle = '#4169E1';
    ctx.beginPath();
    ctx.arc(playerX * TILE_SIZE + TILE_SIZE / 2, playerY * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Borda do jogador
    ctx.strokeStyle = '#1E90FF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Detalhe do jogador (olhos)
    ctx.fillStyle = '#FFFFFF';
    const eyeRadius = 3;
    const eyeOffsetX = 5;
    const eyeOffsetY = 4;
    // Olho esquerdo
    ctx.beginPath();
    ctx.arc(playerX * TILE_SIZE + TILE_SIZE / 2 - eyeOffsetX, playerY * TILE_SIZE + TILE_SIZE / 2 - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    // Olho direito
    ctx.beginPath();
    ctx.arc(playerX * TILE_SIZE + TILE_SIZE / 2 + eyeOffsetX, playerY * TILE_SIZE + TILE_SIZE / 2 - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
}

// Movimento do jogador
function move(direction) {
    let newX = playerX;
    let newY = playerY;
    
    switch (direction) {
        case 'up': newY--; break;
        case 'down': newY++; break;
        case 'left': newX--; break;
        case 'right': newX++; break;
    }
    
    // Verifica se o movimento é válido
    if (newY < 0 || newY >= gameMap.length || newX < 0 || newX >= gameMap[0].length) {
        return false;
    }
    
    const targetTile = gameMap[newY][newX];
    
    // Se há uma parede, não pode mover
    if (targetTile === SYMBOLS.WALL) {
        return false;
    }
    
    // Se há uma caixa, tenta empurrá-la
    if (targetTile === SYMBOLS.BOX || targetTile === SYMBOLS.BOX_ON_TARGET) {
        let boxNewX = newX;
        let boxNewY = newY;
        
        switch (direction) {
            case 'up': boxNewY--; break;
            case 'down': boxNewY++; break;
            case 'left': boxNewX--; break;
            case 'right': boxNewX++; break;
        }
        
        // Verifica se a caixa pode ser empurrada
        if (boxNewY < 0 || boxNewY >= gameMap.length || boxNewX < 0 || boxNewX >= gameMap[0].length) {
            return false;
        }
        
        const boxTargetTile = gameMap[boxNewY][boxNewX];
        
        if (boxTargetTile === SYMBOLS.WALL || boxTargetTile === SYMBOLS.BOX || boxTargetTile === SYMBOLS.BOX_ON_TARGET) {
            return false;
        }
        
        // Move a caixa
        const wasBoxOnTarget = targetTile === SYMBOLS.BOX_ON_TARGET;
        const isTargetDestination = boxTargetTile === SYMBOLS.TARGET;
        
        // Remove a caixa da posição atual
        gameMap[newY][newX] = wasBoxOnTarget ? SYMBOLS.TARGET : SYMBOLS.EMPTY;
        
        // Coloca a caixa na nova posição
        gameMap[boxNewY][boxNewX] = isTargetDestination ? SYMBOLS.BOX_ON_TARGET : SYMBOLS.BOX;
    }

    gameMap[playerY][playerX] = originalMap[playerY][playerX] === SYMBOLS.TARGET ? SYMBOLS.TARGET : SYMBOLS.EMPTY;
    
    // Move o jogador
    playerX = newX;
    playerY = newY;
    moves++;
    
    updateUI();
    checkWin();
    return true;
}

// Verifica se o jogador venceu
function checkWin() {
    let boxesOnTarget = 0;
    let totalTargets = 0;
    
    // Conta caixas no lugar e targets do mapa original
    for (let y = 0; y < gameMap.length; y++) {
        for (let x = 0; x < gameMap[y].length; x++) {
            if (gameMap[y][x] === SYMBOLS.BOX_ON_TARGET) {
                boxesOnTarget++;
            }
            if (originalMap[y][x] === SYMBOLS.TARGET || originalMap[y][x] === SYMBOLS.PLAYER_ON_TARGET) {
                totalTargets++;
            }
        }
    }
    
    if (boxesOnTarget === totalTargets && totalTargets > 0) {
        document.getElementById('levelComplete').style.display = 'block';
        document.getElementById('finalMoves').textContent = moves;
        
        if (currentLevel < LEVELS.length - 1) {
            document.getElementById('nextBtn').disabled = false;
        } else {
            document.getElementById('nextBtn').disabled = true;
        }
    } else {
        document.getElementById('levelComplete').style.display = 'none';
        document.getElementById('nextBtn').disabled = true;
    }
}

// Atualiza a interface
function updateUI() {
    document.getElementById('level').textContent = currentLevel + 1;
    document.getElementById('moves').textContent = moves;
    
    let boxesOnTarget = 0;
    let totalTargets = 0;
    
    for (let y = 0; y < gameMap.length; y++) {
        for (let x = 0; x < gameMap[y].length; x++) {
            if (gameMap[y][x] === SYMBOLS.BOX_ON_TARGET) {
                boxesOnTarget++;
            }
            if (originalMap[y][x] === SYMBOLS.TARGET || originalMap[y][x] === SYMBOLS.PLAYER_ON_TARGET) {
                totalTargets++;
            }
        }
    }
    
    document.getElementById('boxes').textContent = `${boxesOnTarget}/${totalTargets}`;
    
    // Atualiza botões de navegação
    document.getElementById('prevBtn').disabled = currentLevel === 0;
    document.getElementById('nextBtn').disabled = true;
}

// Funções de controle
function resetLevel() {
    loadLevel(currentLevel);
    updateUI();
}

function resetGame() {
    currentLevel = 0;
    loadLevel(currentLevel);
    updateUI();
}

function nextLevel() {
    if (currentLevel < LEVELS.length - 1) {
        currentLevel++;
        loadLevel(currentLevel);
        updateUI();
    }
}

function previousLevel() {
    if (currentLevel > 0) {
        currentLevel--;
        loadLevel(currentLevel);
        updateUI();
    }
}

function toggleInstructions() {
    const instructions = document.getElementById('instructions');
    instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
}

// Loop principal do jogo
function gameLoop() {
    render();
    requestAnimationFrame(gameLoop);
}

// Controles do teclado
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            move('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            move('down');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            move('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            move('right');
            break;
        case 'r':
        case 'R':
            resetLevel();
            break;
    }
});

// Inicializa o jogo quando a página carrega
window.addEventListener('load', initGame);