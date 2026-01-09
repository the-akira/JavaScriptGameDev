const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE = 20;
const COLS = 28;
const ROWS = 31;
canvas.width = COLS * TILE;
canvas.height = ROWS * TILE;

// Mapa do labirinto (1 = parede, 0 = caminho, 2 = moeda, 3 = power pellet)
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let gameMap = JSON.parse(JSON.stringify(map));

let score = 0;
let lives = 3;
let level = 1;
let powerMode = false;
let powerTimer = 0;
let gameRunning = true;
let gameStarted = false;

const pacman = {
    x: 14,
    y: 23,
    dir: 0,
    nextDir: 0,
    mouth: 0,
    mouthSpeed: 1
};

const ghosts = [
    { 
        x: 13, y: 14, dir: 0, color: '#f00',  // Blinky agora começa dentro
        scatter: {x: 25, y: 0}, name: 'blinky', 
        startX: 13, startY: 14,  // Mudou de (13, 11)
        mode: 'chase', modeTimer: 0,
        eaten: false, returningHome: false,
    },
    { 
        x: 14, y: 14, dir: 0, color: '#f8b', 
        scatter: {x: 2, y: 0}, name: 'pinky', 
        startX: 14, startY: 14, 
        mode: 'scatter', modeTimer: 50,
        eaten: false, returningHome: false,
    },
    { 
        x: 13, y: 15, dir: 0, color: '#0ff', 
        scatter: {x: 27, y: 30}, name: 'inky', 
        startX: 13, startY: 15, 
        mode: 'chase', modeTimer: 50,
        eaten: false, returningHome: false,
    },
    { 
        x: 14, y: 15, dir: 0, color: '#fb0', 
        scatter: {x: 0, y: 30}, name: 'clyde', 
        startX: 14, startY: 15, 
        mode: 'wander', modeTimer: 50,
        eaten: false, returningHome: false,
    }
];

const dirs = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
];

function drawMaze() {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (gameMap[y][x] === 1) {
                ctx.fillStyle = '#00f';
                ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
            } else if (gameMap[y][x] === 2) {
                ctx.fillStyle = '#ff8';
                ctx.beginPath();
                ctx.arc(x * TILE + TILE/2, y * TILE + TILE/2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (gameMap[y][x] === 3) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x * TILE + TILE/2, y * TILE + TILE/2, 5, 0, Math.PI * 2);
                ctx.fill();
            } else if (gameMap[y][x] === 4) {
                // Desenha a portinha (barreira horizontal rosa)
                ctx.fillStyle = '#f8b';
                ctx.fillRect(x * TILE, y * TILE + TILE/2 - 2, TILE, 4);
            }
        }
    }
}

function drawPacman() {
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    
    const centerX = pacman.x * TILE + TILE/2;
    const centerY = pacman.y * TILE + TILE/2;
    const radius = TILE/2 - 2;
    const mouthAngle = Math.abs(Math.sin(pacman.mouth)) * 0.8;
    
    let angle;
    if (pacman.dir === 0) angle = Math.PI * 1.5;
    else if (pacman.dir === 1) angle = 0;
    else if (pacman.dir === 2) angle = Math.PI * 0.5;
    else angle = Math.PI;
    
    ctx.arc(centerX, centerY, radius, 
        angle + mouthAngle, 
        angle + Math.PI * 2 - mouthAngle);
    ctx.lineTo(centerX, centerY);
    ctx.fill();
    
    pacman.mouth += pacman.mouthSpeed;
}

function drawGhost(ghost) {
    const x = ghost.x * TILE + TILE/2;
    const y = ghost.y * TILE + TILE/2;
    const size = TILE/2 - 2;
    
    // Se foi comido, desenha apenas os olhos
    if (ghost.eaten) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - size/3, y - size/3, size/4, 0, Math.PI * 2);
        ctx.arc(x + size/3, y - size/3, size/4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#00f';
        ctx.beginPath();
        ctx.arc(x - size/3 + dirs[ghost.dir].x * 2, y - size/3 + dirs[ghost.dir].y * 2, size/6, 0, Math.PI * 2);
        ctx.arc(x + size/3 + dirs[ghost.dir].x * 2, y - size/3 + dirs[ghost.dir].y * 2, size/6, 0, Math.PI * 2);
        ctx.fill();
        return;
    }
    
    ctx.fillStyle = powerMode ? '#00f' : ghost.color;
    
    ctx.beginPath();
    ctx.arc(x, y - size/2, size, Math.PI, 0);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x + size/2, y + size/2);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size/2, y + size/2);
    ctx.lineTo(x - size, y + size);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - size/3, y - size/3, size/4, 0, Math.PI * 2);
    ctx.arc(x + size/3, y - size/3, size/4, 0, Math.PI * 2);
    ctx.fill();
    
    if (!powerMode) {
        ctx.fillStyle = '#00f';
        ctx.beginPath();
        ctx.arc(x - size/3 + dirs[ghost.dir].x * 2, y - size/3 + dirs[ghost.dir].y * 2, size/6, 0, Math.PI * 2);
        ctx.arc(x + size/3 + dirs[ghost.dir].x * 2, y - size/3 + dirs[ghost.dir].y * 2, size/6, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawStartScreen() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenha o título PAC-MAN
    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 60px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('PAC-MAN', canvas.width / 2, canvas.height / 2 - 50);
    
    // Efeito de sombra no título
    ctx.fillStyle = '#f00';
    ctx.fillText('PAC-MAN', canvas.width / 2 + 3, canvas.height / 2 - 47);
    
    // Texto piscante
    const blink = Math.floor(Date.now() / 550) % 2;
    if (blink) {
        ctx.fillStyle = '#fff';
        ctx.font = '24px "Courier New"';
        ctx.fillText('PRESSIONE ENTER PARA COMEÇAR', canvas.width / 2, canvas.height / 2 + 50);
    }
}

function canMove(x, y, isPacman = false) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
    
    const tile = gameMap[y][x];
    
    // Porta dos fantasmas (4) bloqueia apenas o Pac-Man
    if (isPacman && tile === 4) {
        return false;
    }
    
    // Parede (1) bloqueia todos
    return tile !== 1;
}

function movePacman() {
    const nextX = pacman.x + dirs[pacman.nextDir].x;
    const nextY = pacman.y + dirs[pacman.nextDir].y;
    
    if (canMove(nextX, nextY, true)) {
        pacman.dir = pacman.nextDir;
    }
    
    const newX = pacman.x + dirs[pacman.dir].x;
    const newY = pacman.y + dirs[pacman.dir].y;
    
    if (canMove(newX, newY, true)) {
        pacman.x = newX;
        pacman.y = newY;
        
        if (pacman.x < 0) pacman.x = COLS - 1;
        if (pacman.x >= COLS) pacman.x = 0;
        
        if (gameMap[pacman.y][pacman.x] === 2) {
            gameMap[pacman.y][pacman.x] = 0;
            score += 10;
            checkWin();
        }
        
        if (gameMap[pacman.y][pacman.x] === 3) {
            gameMap[pacman.y][pacman.x] = 0;
            score += 50;
            powerMode = true;
            powerTimer = 35;
            checkWin();
        }
    }
}

function updateGhostMode(ghost) {
    ghost.modeTimer--;
    
    if (ghost.modeTimer <= 0) {
        const modes = ['chase', 'scatter', 'wander'];
        const currentIndex = modes.indexOf(ghost.mode);
        ghost.mode = modes[(currentIndex + 1) % modes.length];
        
        if (ghost.mode === 'chase') {
            ghost.modeTimer = 100 + Math.random() * 100;
        } else if (ghost.mode === 'scatter') {
            ghost.modeTimer = 30 + Math.random() * 30;
        } else {
            ghost.modeTimer = 40 + Math.random() * 40;
        }
    }
}

function moveGhost(ghost) {
    // Se foi comido, volta para casa
    if (ghost.eaten && ghost.returningHome) {
        const homeX = 14;
        const homeY = 14;
        
        // Chegou em casa
        if (Math.abs(ghost.x - homeX) < 1 && Math.abs(ghost.y - homeY) < 1) {
            ghost.eaten = false;
            ghost.returningHome = false;
            ghost.x = homeX;
            ghost.y = homeY;
            ghost.mode = 'chase';
            ghost.modeTimer = 50;
            return;
        }
        
        // Busca todas as direções possíveis (sem voltar)
        const possibleDirs = [];
        for (let i = 0; i < 4; i++) {
            if (i === (ghost.dir + 2) % 4) continue; // não volta
            
            const newX = ghost.x + dirs[i].x;
            const newY = ghost.y + dirs[i].y;
            
            // Verifica se pode mover (caminhos normais)
            if (canMove(newX, newY, false)) {
                possibleDirs.push(i);
            }
        }
        
        // Se não tiver opções, pode voltar
        if (possibleDirs.length === 0) {
            for (let i = 0; i < 4; i++) {
                const newX = ghost.x + dirs[i].x;
                const newY = ghost.y + dirs[i].y;
                if (canMove(newX, newY, false)) {
                    possibleDirs.push(i);
                }
            }
        }
        
        if (possibleDirs.length > 0) {
            let bestDir = possibleDirs[0];
            let bestDist = Infinity;
            
            for (const dir of possibleDirs) {
                const newX = ghost.x + dirs[dir].x;
                const newY = ghost.y + dirs[dir].y;
                const dist = Math.abs(newX - homeX) + Math.abs(newY - homeY);
                
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = dir;
                }
            }
            
            ghost.dir = bestDir;
        }
        
        ghost.x += dirs[ghost.dir].x;
        ghost.y += dirs[ghost.dir].y;
        
        if (ghost.x < 0) ghost.x = COLS - 1;
        if (ghost.x >= COLS) ghost.x = 0;
        
        return;
    }
    
    updateGhostMode(ghost);
    
    const possibleDirs = [];
    
    for (let i = 0; i < 4; i++) {
        if (i === (ghost.dir + 2) % 4) continue;
        
        const newX = ghost.x + dirs[i].x;
        const newY = ghost.y + dirs[i].y;
        
        if (canMove(newX, newY, false)) {
            possibleDirs.push(i);
        }
    }
    
    if (possibleDirs.length > 0) {
        let targetX, targetY;
        let useRandom = false;
        
        if (powerMode) {
            targetX = ghost.scatter.x;
            targetY = ghost.scatter.y;
        } else if (ghost.mode === 'wander') {
            useRandom = true;
        } else if (ghost.mode === 'scatter') {
            targetX = ghost.scatter.x;
            targetY = ghost.scatter.y;
        } else {
            targetX = pacman.x;
            targetY = pacman.y;
            
            if (ghost.name === 'blinky') {
                targetX = pacman.x;
                targetY = pacman.y;
            } else if (ghost.name === 'pinky') {
                targetX = pacman.x + dirs[pacman.dir].x * 4;
                targetY = pacman.y + dirs[pacman.dir].y * 4;
            } else if (ghost.name === 'inky') {
                const dist = Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y);
                if (dist > 5) {
                    targetX = pacman.x;
                    targetY = pacman.y;
                } else {
                    targetX = pacman.x + (pacman.x - ghosts[0].x);
                    targetY = pacman.y + (pacman.y - ghosts[0].y);
                }
            } else if (ghost.name === 'clyde') {
                const dist = Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y);
                if (dist > 5) {
                    targetX = pacman.x;
                    targetY = pacman.y;
                } else {
                    targetX = ghost.scatter.x;
                    targetY = ghost.scatter.y;
                }
            }
        }
        
        let bestDir;
        
        if (useRandom) {
            if (Math.random() > 0.3 && possibleDirs.includes(ghost.dir)) {
                bestDir = ghost.dir;
            } else {
                bestDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            }
        } else {
            let bestDist = Infinity;
            bestDir = possibleDirs[0];
            
            for (const dir of possibleDirs) {
                const newX = ghost.x + dirs[dir].x;
                const newY = ghost.y + dirs[dir].y;
                const dist = Math.abs(newX - targetX) + Math.abs(newY - targetY);
                
                if (powerMode ? dist > bestDist : dist < bestDist) {
                    bestDist = dist;
                    bestDir = dir;
                }
            }
        }
        
        ghost.dir = bestDir;
    }
    
    ghost.x += dirs[ghost.dir].x;
    ghost.y += dirs[ghost.dir].y;
    
    if (ghost.x < 0) ghost.x = COLS - 1;
    if (ghost.x >= COLS) ghost.x = 0;
}

function checkCollision() {
    for (const ghost of ghosts) {
        // Usa distância Manhattan (soma das diferenças absolutas)
        const distX = Math.abs(pacman.x - ghost.x);
        const distY = Math.abs(pacman.y - ghost.y);
        
        // Colisão detectada apenas quando estão no mesmo tile ou adjacentes diretos
        // Bloqueia diagonais exigindo que pelo menos uma coordenada seja igual
        const collision = (distX === 0 && distY === 0) || // Mesmo tile
                         (distX === 0 && distY <= 1) ||   // Mesma coluna, linha adjacente
                         (distY === 0 && distX <= 1);     // Mesma linha, coluna adjacente
        
        if (collision) {
            // Se está no power mode e o fantasma não foi comido ainda
            if (powerMode && !ghost.eaten && !ghost.returningHome) {
                score += 200;
                ghost.eaten = true;
                ghost.returningHome = true;
            } 
            // Se o fantasma não está comido, perde vida
            else if (!ghost.eaten && !ghost.returningHome) {
                lives--;
                if (lives <= 0) {
                    gameOver();
                } else {
                    resetPositions();
                }
            }
        }
    }
}

function checkWin() {
    let hasFood = false;
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (gameMap[y][x] === 2 || gameMap[y][x] === 3) {
                hasFood = true;
                break;
            }
        }
        if (hasFood) break;
    }
    
    if (!hasFood) {
        level++;
        gameMap = JSON.parse(JSON.stringify(map));
        resetPositions();
    }
}

function resetPositions() {
    pacman.x = 14;
    pacman.y = 23;
    pacman.dir = 0;
    pacman.nextDir = 0;
    
    // Blinky sai imediatamente
    ghosts[0].x = 13;
    ghosts[0].y = 11;
    ghosts[0].dir = 2;
    ghosts[0].mode = 'chase';
    ghosts[0].modeTimer = 0;
    ghosts[0].eaten = false;
    ghosts[0].returningHome = false;
    
    // Outros fantasmas saem rapidamente
    for (let i = 1; i < ghosts.length; i++) {
        ghosts[i].x = ghosts[i].startX;
        ghosts[i].y = ghosts[i].startY;
        ghosts[i].dir = 0;
        ghosts[i].mode = ['chase', 'scatter'][i % 2];
        ghosts[i].modeTimer = i * 10;
        ghosts[i].eaten = false;
        ghosts[i].returningHome = false;
    }
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    powerMode = false;
    powerTimer = 0;
    gameRunning = true;
    gameStarted = true
    gameMap = JSON.parse(JSON.stringify(map));
    resetPositions();
    document.getElementById('gameOver').style.display = 'none';
    gameLoop();
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
}

function gameLoop() {
    if (!gameStarted) {
        drawStartScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!gameRunning) return;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMaze();
    
    // Atualiza power mode ANTES de mover
    if (powerMode) {
        powerTimer--;
        if (powerTimer <= 0) {
            powerMode = false;
        }
    }
    
    movePacman();
    
    ghosts.forEach(ghost => {
        moveGhost(ghost);
        drawGhost(ghost);
    });
    
    drawPacman();
    checkCollision();
    
    updateUI();
    
    setTimeout(() => requestAnimationFrame(gameLoop), 150);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !gameStarted) {
        gameStarted = true;
        return;
    }
    if (e.key === 'ArrowUp') pacman.nextDir = 0;
    if (e.key === 'ArrowRight') pacman.nextDir = 1;
    if (e.key === 'ArrowDown') pacman.nextDir = 2;
    if (e.key === 'ArrowLeft') pacman.nextDir = 3;
});

gameLoop();