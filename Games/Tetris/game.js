// Configurações do jogo
const COLS = 10;
const ROWS = 20;
const aspectRatio = COLS / ROWS; // Proporção do tabuleiro
let BLOCK_SIZE = Math.min(window.innerWidth / COLS, window.innerHeight / ROWS) * 0.9; // Ajuste do tamanho dos blocos
const GAME_SPEED = 1000;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// Matrix rain setup
const rainCanvas = document.getElementById('matrixRain');
const rainCtx = rainCanvas.getContext('2d');
rainCanvas.width = window.innerWidth;
rainCanvas.height = window.innerHeight;

// Peças do Tetris
const PIECES = [
    [
        [1, 1, 1, 1] // I
    ],
    [
        [1, 1], // O
        [1, 1]
    ],
    [
        [1, 1, 1], // T
        [0, 1, 0]
    ],
    [
        [1, 1, 1], // L
        [1, 0, 0]
    ],
    [
        [1, 1, 1], // J
        [0, 0, 1]
    ],
    [
        [1, 1, 0], // S
        [0, 1, 1]
    ],
    [
        [0, 1, 1], // Z
        [1, 1, 0]
    ]
];

// Estado do jogo
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let score = 0;
let lines = 0;
let level = 1;
let gameOver = false;
let currentPiece = null;
let currentPiecePosition = { x: 0, y: 0 };

// Matrix rain
class MatrixSymbol {
    constructor(x, y, speed, first) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.first = first;
        this.value = '';
        this.switchInterval = Math.random() * 2;
        this.sinceLastSwitch = 0;
    }

    setRandomValue() {
        const charTypes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*';
        this.value = charTypes.charAt(Math.floor(Math.random() * charTypes.length));
    }
}

let matrixSymbols = [];
const fontSize = 14;
const columns = rainCanvas.width / fontSize;

for(let i = 0; i < columns; i++) {
    const y = Math.random() * rainCanvas.height;
    matrixSymbols.push(new MatrixSymbol(i * fontSize, y, Math.random() * 2 + 1, true));
}

// Funções do jogo
function createNewPiece() {
    const pieceIdx = Math.floor(Math.random() * PIECES.length);
    currentPiece = PIECES[pieceIdx];
    currentPiecePosition = {
        x: Math.floor((COLS - currentPiece[0].length) / 2),
        y: 0
    };

    if (!isValidMove(currentPiecePosition.x, currentPiecePosition.y, currentPiece)) {
        gameOver = true;
    }
}

function draw() {
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar board
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(x, y);
            }
        }
    }

    // Desenhar peça atual
    if (currentPiece) {
        for (let y = 0; y < currentPiece.length; y++) {
            for (let x = 0; x < currentPiece[y].length; x++) {
                if (currentPiece[y][x]) {
                    drawBlock(currentPiecePosition.x + x, currentPiecePosition.y + y);
                }
            }
        }
    }
}

function drawBlock(x, y) {
    ctx.fillStyle = '#0f0';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function isValidMove(x, y, piece) {
    for (let py = 0; py < piece.length; py++) {
        for (let px = 0; px < piece[py].length; px++) {
            if (piece[py][px]) {
                const newX = x + px;
                const newY = y + py;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }
                
                if (newY >= 0 && board[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function rotatePiece() {
    const rotated = [];
    for (let i = 0; i < currentPiece[0].length; i++) {
        const row = [];
        for (let j = currentPiece.length - 1; j >= 0; j--) {
            row.push(currentPiece[j][i]);
        }
        rotated.push(row);
    }
    
    if (isValidMove(currentPiecePosition.x, currentPiecePosition.y, rotated)) {
        currentPiece = rotated;
    }
}

function mergePiece() {
    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x]) {
                board[currentPiecePosition.y + y][currentPiecePosition.x + x] = 1;
            }
        }
    }
}

function checkLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }

    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        
        document.getElementById('score').textContent = score;
        document.getElementById('lines').textContent = lines;
        document.getElementById('level').textContent = level;
    }
}

function moveDown() {
    if (isValidMove(currentPiecePosition.x, currentPiecePosition.y + 1, currentPiece)) {
        currentPiecePosition.y++;
    } else {
        mergePiece();
        checkLines();
        createNewPiece();
    }
}

function hardDrop() {
    while (isValidMove(currentPiecePosition.x, currentPiecePosition.y + 1, currentPiece)) {
        currentPiecePosition.y++;
    }
    moveDown();
}

// Matrix rain animation
function drawMatrixRain() {
    rainCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    rainCtx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);

    rainCtx.fillStyle = '#0f0';
    rainCtx.font = fontSize + 'px monospace';

    matrixSymbols.forEach(symbol => {
        symbol.first = (symbol.y <= fontSize);

        if (symbol.first) {
            rainCtx.fillStyle = '#62ff00';
        } else {
            rainCtx.fillStyle = '#0f0';
        }

        symbol.sinceLastSwitch += 0.1;
        if (symbol.sinceLastSwitch >= symbol.switchInterval) {
            symbol.setRandomValue();
            symbol.sinceLastSwitch = 0;
        }

        rainCtx.fillText(symbol.value, symbol.x, symbol.y);
        symbol.y += symbol.speed;

        if (symbol.y >= rainCanvas.height) {
            symbol.y = 0;
            symbol.setRandomValue();
        }
    });
}

// Game loop
let lastTime = 0;
let dropCounter = 0;
const MIN_DROP_INTERVAL = 150; 
const SPEED_DECREASE_PER_POINT = 0.01; 
const SOFT_DROP_SPEED = 50;
let isDownKeyActive = false;

function getDropInterval() {
    let dropInterval = Math.max(GAME_SPEED - (score * SPEED_DECREASE_PER_POINT), MIN_DROP_INTERVAL);
    return isDownKeyActive ? SOFT_DROP_SPEED : dropInterval;
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > getDropInterval()) {
        moveDown();
        dropCounter = 0;
    }

    draw();
    drawMatrixRain();
    
    if (!gameOver) {
        requestAnimationFrame(update);
    } else {
        drawGameOverScreen();
    }
}

document.addEventListener('keydown', event => {
    if (gameOver && event.key === 'Enter') {
        resetGame();
    }
});

function resetGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0)); // Reseta o tabuleiro
    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    document.getElementById('score').textContent = score;
    document.getElementById('lines').textContent = lines;
    document.getElementById('level').textContent = level;
    createNewPiece(); // Criar uma nova peça
    update(); // Reiniciar a animação
}

// Controles
const ROTATE_DELAY = 100; // Tempo mínimo entre rotações (100ms)
let lastRotateTime = 0; // Guarda o tempo da última rotação

document.addEventListener('keydown', event => {
    if (!gameOver) {
        switch(event.keyCode) {
            case 37: // Left
                if (isValidMove(currentPiecePosition.x - 1, currentPiecePosition.y, currentPiece)) {
                    currentPiecePosition.x--;
                }
                break;
            case 39: // Right
                if (isValidMove(currentPiecePosition.x + 1, currentPiecePosition.y, currentPiece)) {
                    currentPiecePosition.x++;
                }
                break;
            case 40: // Down
                isDownKeyActive = true;
                break;
            case 38: // Up (Rotate)
                if (performance.now() - lastRotateTime > ROTATE_DELAY) {
                    rotatePiece();
                    lastRotateTime = performance.now(); // Atualiza o tempo da última rotação
                }
                break;
            case 32: // Space (Hard Drop)
                hardDrop();
                break;
        }
    }
});

document.addEventListener('keyup', event => {
    if (event.keyCode === 40) { // Soltar a tecla ↓
        isDownKeyActive = false;
    }
});

// Iniciar jogo
createNewPiece();
update();

function resizeCanvas() {
    BLOCK_SIZE = Math.min(window.innerWidth / COLS, window.innerHeight / ROWS) * 0.9; // Redimensiona os blocos

    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;

    draw(); // Redesenhar apenas se o jogo ainda estiver rodando
    drawGameOverScreen(); // Se o jogo acabou, redesenha a tela de Game Over
}

// Função para redesenhar a tela de Game Over corretamente
function drawGameOverScreen() {
    rainCtx.fillStyle = '#000';
    rainCtx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0';
    ctx.font = '30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px monospace';
    ctx.fillText('Aperte Enter', canvas.width / 2, canvas.height / 2 + 40);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Chamar no início para ajustar o tamanho inicial

// Responsividade
window.addEventListener('resize', () => {
    if (!gameOver) {
        rainCanvas.width = window.innerWidth;
        rainCanvas.height = window.innerHeight;
        matrixSymbols = [];
        const columns = rainCanvas.width / fontSize;

        for(let i = 0; i < columns; i++) {
            const y = Math.random() * rainCanvas.height;
            matrixSymbols.push(new MatrixSymbol(i * fontSize, y, Math.random() * 2 + 1, true));
        }        
    }
});