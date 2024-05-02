const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 20;
const ROWS = Math.floor(canvas.height / CELL_SIZE);
const COLS = Math.floor(canvas.width / CELL_SIZE);
let grid = createEmptyGrid();

function createEmptyGrid() {
    const rows = [];
    for (let i = 0; i < ROWS; i++) {
        const row = [];
        for (let j = 0; j < COLS; j++) {
            row.push("white");
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
            ctx.fillStyle = grid[i][j];
            ctx.fill();
            ctx.stroke();
        }
    }
}

drawGrid();