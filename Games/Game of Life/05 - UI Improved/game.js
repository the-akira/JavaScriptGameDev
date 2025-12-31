const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 20;
let ANIMATION_SPEED = 1000;
const VIRTUAL_ROWS = 150;
const VIRTUAL_COLS = 150;
let grid = createEmptyGrid();
let cellStates = createEmptyStateGrid(); // Para animações
let cameraX = 0;
let cameraY = 0;
let generation = 0;

// Controles de desenho
let isDrawing = false;
let drawMode = null; // 'add' or 'remove'
let lastDrawnCell = null;

function createEmptyGrid() {
    const rows = [];
    for (let i = 0; i < VIRTUAL_ROWS; i++) {
        const row = [];
        for (let j = 0; j < VIRTUAL_COLS; j++) {
            row.push(false);
        }
        rows.push(row);
    }
    return rows;
}

function createEmptyStateGrid() {
    const rows = [];
    for (let i = 0; i < VIRTUAL_ROWS; i++) {
        const row = [];
        for (let j = 0; j < VIRTUAL_COLS; j++) {
            row.push({ opacity: 0, scale: 1, dying: false, born: false });
        }
        rows.push(row);
    }
    return rows;
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const startX = Math.max(0, cameraX);
    const endX = Math.min(VIRTUAL_COLS, cameraX + Math.ceil(canvas.width / CELL_SIZE));
    const startY = Math.max(0, cameraY);
    const endY = Math.min(VIRTUAL_ROWS, cameraY + Math.ceil(canvas.height / CELL_SIZE));
    
    for (let i = startY; i < endY; i++) {
        for (let j = startX; j < endX; j++) {
            const x = (j - cameraX) * CELL_SIZE;
            const y = (i - cameraY) * CELL_SIZE;
            const state = cellStates[i][j];
            
            // Desenha borda da célula
            ctx.beginPath();
            ctx.rect(x, y, CELL_SIZE, CELL_SIZE);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = '#ddd';
            ctx.stroke();
            
            // Desenha célula viva com animação
            if (grid[i][j] || state.dying) {
                const centerX = x + CELL_SIZE / 2;
                const centerY = y + CELL_SIZE / 2;
                const size = CELL_SIZE * state.scale;
                
                ctx.save();
                ctx.globalAlpha = state.opacity;
                
                // Efeito de "pulso" para células nascendo
                if (state.born && state.scale < 1) {
                    ctx.fillStyle = '#7ba3f0';
                } else if (state.dying) {
                    ctx.fillStyle = '#ff6b6b';
                } else {
                    ctx.fillStyle = '#528deb';
                }
                
                ctx.beginPath();
                ctx.rect(
                    centerX - size / 2,
                    centerY - size / 2,
                    size,
                    size
                );
                ctx.fill();
                ctx.restore();
            }
        }
    }
    
    updateStats();
}

function updateGrid() {
    const newGrid = createEmptyGrid();
    const oldGrid = grid.map(row => [...row]);
    
    for (let i = 0; i < VIRTUAL_ROWS; i++) {
        for (let j = 0; j < VIRTUAL_COLS; j++) {
            const neighbors = countNeighbors(i, j);
            if (grid[i][j]) {
                newGrid[i][j] = neighbors === 2 || neighbors === 3;
            } else {
                newGrid[i][j] = neighbors === 3;
            }
            
            // Detecta mudanças para animação
            if (oldGrid[i][j] && !newGrid[i][j]) {
                // Célula morrendo
                cellStates[i][j].dying = true;
                cellStates[i][j].born = false;
                cellStates[i][j].opacity = 1;
                cellStates[i][j].scale = 1;
            } else if (!oldGrid[i][j] && newGrid[i][j]) {
                // Célula nascendo
                cellStates[i][j].born = true;
                cellStates[i][j].dying = false;
                cellStates[i][j].scale = 0.3;
                cellStates[i][j].opacity = 0.3;
            } else if (newGrid[i][j]) {
                cellStates[i][j].dying = false;
                cellStates[i][j].born = false;
            }
        }
    }
    
    grid = newGrid;
    generation++;
}

function animateCells() {
    for (let i = 0; i < VIRTUAL_ROWS; i++) {
        for (let j = 0; j < VIRTUAL_COLS; j++) {
            const state = cellStates[i][j];
            
            if (grid[i][j]) {
                // Célula viva
                if (state.born && state.scale < 1) {
                    state.scale = Math.min(1, state.scale + 0.05);
                } else {
                    state.scale = 1;
                }
                state.opacity = Math.min(1, state.opacity + 0.08);
            } else {
                // Célula morta
                if (state.dying && state.opacity > 0) {
                    state.opacity = Math.max(0, state.opacity - 0.08);
                    state.scale = Math.max(0.3, state.scale - 0.03);
                } else {
                    state.dying = false;
                    state.opacity = 0;
                    state.scale = 1;
                }
            }
        }
    }
}

function countNeighbors(row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const newRow = row + i;
            const newCol = col + j;
            if (newRow >= 0 && newRow < VIRTUAL_ROWS && newCol >= 0 && newCol < VIRTUAL_COLS) {
                count += grid[newRow][newCol] ? 1 : 0;
            }
        }
    }
    return count;
}

function randomizeGrid() {
    for (let i = 0; i < VIRTUAL_ROWS; i++) {
        for (let j = 0; j < VIRTUAL_COLS; j++) {
            grid[i][j] = Math.random() < 0.4;
            if (grid[i][j]) {
                cellStates[i][j].opacity = 1;
                cellStates[i][j].scale = 1;
            }
        }
    }
    generation = 0;
}

function clearGrid() {
    grid = createEmptyGrid();
    cellStates = createEmptyStateGrid();
    generation = 0;
}

function updateStats() {
    let alive = 0;
    for (let i = 0; i < VIRTUAL_ROWS; i++) {
        for (let j = 0; j < VIRTUAL_COLS; j++) {
            if (grid[i][j]) alive++;
        }
    }
    document.getElementById('generation').textContent = generation;
    document.getElementById('aliveCells').textContent = alive;
}

let lastUpdateTime = 0;

function mainLoop() {
    const currentTime = Date.now();
    
    if (!isPaused && currentTime - lastUpdateTime >= ANIMATION_SPEED) {
        updateGrid();
        lastUpdateTime = currentTime;
    }
    
    animateCells();
    drawGrid();
    setTimeout(mainLoop, 50); // Loop de animação rápido para suavidade visual
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'c') {
        clearGrid();
        drawGrid();
    } else if (event.key === 'r') {
        randomizeGrid();
        drawGrid();
    } else if (event.key === 'ArrowUp') {
        cameraY = Math.max(0, cameraY - 1);
        drawGrid();
    } else if (event.key === 'ArrowDown') {
        cameraY = Math.min(VIRTUAL_ROWS - Math.ceil(canvas.height / CELL_SIZE), cameraY + 1);
        drawGrid();
    } else if (event.key === 'ArrowLeft') {
        cameraX = Math.max(0, cameraX - 1);
        drawGrid();
    } else if (event.key === 'ArrowRight') {
        cameraX = Math.min(VIRTUAL_COLS - Math.ceil(canvas.width / CELL_SIZE), cameraX + 1);
        drawGrid();
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
    }

    document.getElementById("coordinates").innerHTML = `Coordenadas (x: ${cameraX * CELL_SIZE}, y: ${cameraY * CELL_SIZE})`;
});

let isPaused = false;

function toggleSimulation() {
    isPaused = !isPaused;
    if (isPaused) {
        document.getElementById("playPause").innerHTML = "Play";
    } else {
        document.getElementById("playPause").innerHTML = "Pause";
    }
}

// Sistema de desenho contínuo
function getCellCoords(event) {
    const x = Math.floor(event.offsetX / CELL_SIZE) + cameraX;
    const y = Math.floor(event.offsetY / CELL_SIZE) + cameraY;
    return { x, y };
}

canvas.addEventListener('mousedown', (event) => {
    if (isPaused) {
        isDrawing = true;
        const { x, y } = getCellCoords(event);
        drawMode = grid[y][x] ? 'remove' : 'add';
        grid[y][x] = drawMode === 'add';
        if (drawMode === 'add') {
            cellStates[y][x].opacity = 1;
            cellStates[y][x].scale = 1;
        } else {
            cellStates[y][x].opacity = 0;
        }
        lastDrawnCell = `${x},${y}`;
        drawGrid();
        canvas.classList.add('dragging');
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (isDrawing && isPaused) {
        const { x, y } = getCellCoords(event);
        const cellKey = `${x},${y}`;
        
        if (cellKey !== lastDrawnCell && x >= 0 && x < VIRTUAL_COLS && y >= 0 && y < VIRTUAL_ROWS) {
            grid[y][x] = drawMode === 'add';
            if (drawMode === 'add') {
                cellStates[y][x].opacity = 1;
                cellStates[y][x].scale = 1;
            } else {
                cellStates[y][x].opacity = 0;
            }
            lastDrawnCell = cellKey;
            drawGrid();
        }
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    drawMode = null;
    lastDrawnCell = null;
    canvas.classList.remove('dragging');
});

canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
    drawMode = null;
    lastDrawnCell = null;
    canvas.classList.remove('dragging');
});

// Controle de velocidade
document.getElementById('speed').addEventListener('input', (event) => {
    ANIMATION_SPEED = parseInt(event.target.value);
    document.getElementById('speedValue').textContent = ANIMATION_SPEED + 'ms';
});

document.getElementById("clear").addEventListener('click', (event) => {
    clearGrid();
    drawGrid();
});

document.getElementById("randomize").addEventListener('click', (event) => {
    randomizeGrid();
    drawGrid();
});

randomizeGrid();
mainLoop();