const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 20;
const ANIMATION_SPEED = 400;
const VIRTUAL_ROWS = 150; // Número de linhas na grade virtual
const VIRTUAL_COLS = 150; // Número de colunas na grade virtual
let grid = createEmptyGrid();
let cameraX = 0; // Posição horizontal da "câmera" na grade virtual
let cameraY = 0; // Posição vertical da "câmera" na grade virtual

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
            ctx.beginPath();
            ctx.rect(x, y, CELL_SIZE, CELL_SIZE);
            ctx.fillStyle = grid[i][j] ? '#528deb' : 'white';
            ctx.fill();
            ctx.stroke();
        }
    }
}

function updateGrid() {
    const newGrid = createEmptyGrid();
    for (let i = 0; i < VIRTUAL_ROWS; i++) {
        for (let j = 0; j < VIRTUAL_COLS; j++) {
            const neighbors = countNeighbors(i, j);
            if (grid[i][j]) {
                newGrid[i][j] = neighbors === 2 || neighbors === 3;
            } else {
                newGrid[i][j] = neighbors === 3;
            }
        }
    }
    grid = newGrid;
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
        }
    }
}

function clearGrid() {
    grid = createEmptyGrid();
}

function mainLoop() {
    if (!isPaused) {
        updateGrid();
        drawGrid();
        console.log(cameraX * CELL_SIZE, cameraY * CELL_SIZE)
    }
    setTimeout(mainLoop, ANIMATION_SPEED);
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

    document.getElementById("coordinates").innerHTML = `Coordinates (x: ${cameraX * CELL_SIZE}, y: ${cameraY * CELL_SIZE})`
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

canvas.addEventListener('click', (event) => {
    if (isPaused) {
        const x = Math.floor(event.offsetX / CELL_SIZE) + cameraX;
        const y = Math.floor(event.offsetY / CELL_SIZE) + cameraY;
        grid[y][x] = !grid[y][x];
        drawGrid();
    }
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