const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 20;
const ANIMATION_SPEED = 400;
const ROWS = Math.floor(canvas.height / CELL_SIZE);
const COLS = Math.floor(canvas.width / CELL_SIZE);
let grid = createEmptyGrid();

function createEmptyGrid() {
    const rows = [];
    for (let i = 0; i < ROWS; i++) {
        const row = [];
        for (let j = 0; j < COLS; j++) {
            row.push(false);
        }
        rows.push(row);
    }
    return rows;
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            ctx.beginPath();
            ctx.rect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.fillStyle = grid[i][j] ? '#528deb' : 'white';
            ctx.fill();
            ctx.stroke();
        }
    }
}

function updateGrid() {
    const newGrid = createEmptyGrid();
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
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
            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                count += grid[newRow][newCol] ? 1 : 0;
            }
        }
    }
    return count;
}

function randomizeGrid() {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
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
    }
    setTimeout(mainLoop, ANIMATION_SPEED);
}

canvas.addEventListener('click', (event) => {
    if (isPaused) {
        const x = Math.floor(event.offsetX / CELL_SIZE);
        const y = Math.floor(event.offsetY / CELL_SIZE);
        grid[y][x] = !grid[y][x];
        drawGrid();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'c') {
        clearGrid();
        drawGrid();
    } else if (event.key === 'r') {
        randomizeGrid();
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

let isPaused = false;

function toggleSimulation() {
    isPaused = !isPaused;
    if (isPaused) {
        document.getElementById("playPause").innerHTML = "Play";
    } else {
        document.getElementById("playPause").innerHTML = "Pause";
    }
}

randomizeGrid();
mainLoop();