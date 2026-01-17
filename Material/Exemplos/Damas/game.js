const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const BOARD_SIZE = 8;
const CELL_SIZE = 80;

let board = [];
let selectedPiece = null;
let currentPlayer = 'red'; // 'red' ou 'black'
let validMoves = [];
let gameOver = false;

let isAnimating = false;
let animationProgress = 0;
let animatingPiece = null;
let animationStart = null;
let animationEnd = null;
const ANIMATION_DURATION = 350; // milissegundos

// Inicializar tabuleiro
function initBoard() {
    board = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            if ((row + col) % 2 === 1) {
                if (row < 3) {
                    board[row][col] = { player: 'black', king: false };
                } else if (row > 4) {
                    board[row][col] = { player: 'red', king: false };
                } else {
                    board[row][col] = null;
                }
            } else {
                board[row][col] = null;
            }
        }
    }
    selectedPiece = null;
    currentPlayer = 'red';
    validMoves = [];
    gameOver = false;
    updateTurnDisplay();
}

// Desenhar tabuleiro
function drawBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const x = col * CELL_SIZE;
            const y = row * CELL_SIZE;
            
            // Desenhar célula
            if ((row + col) % 2 === 0) {
                ctx.fillStyle = '#f0d9b5';
            } else {
                ctx.fillStyle = '#b58863';
            }
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            
            // Destacar célula selecionada
            if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col && !isAnimating) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            }
            
            // Destacar movimentos válidos
            if (!isAnimating) {
                const validMove = validMoves.find(move => move.row === row && move.col === col);
                if (validMove) {
                    // Vermelho para captura, verde para movimento normal
                    const isCapture = validMove.capture !== null;
                    ctx.fillStyle = isCapture ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 255, 0, 0.4)';
                    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                    
                    // Círculo no centro para indicar movimento
                    ctx.fillStyle = isCapture ? 'rgba(255, 0, 0, 0.6)' : 'rgba(0, 200, 0, 0.6)';
                    ctx.beginPath();
                    ctx.arc(x + CELL_SIZE/2, y + CELL_SIZE/2, 15, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    
    // Efeito de desfoque durante animação
    if (isAnimating) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Desenhar peças
function drawPieces() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            
            // Pular a peça que está sendo animada
            if (isAnimating && animatingPiece && 
                animationStart[0] === row && animationStart[1] === col) {
                continue;
            }
            
            if (piece) {
                drawSinglePiece(piece, col, row);
            }
        }
    }
    
    // Desenhar peça animando
    if (isAnimating && animatingPiece) {
        const startX = animationStart[1] * CELL_SIZE + CELL_SIZE / 2;
        const startY = animationStart[0] * CELL_SIZE + CELL_SIZE / 2;
        const endX = animationEnd[1] * CELL_SIZE + CELL_SIZE / 2;
        const endY = animationEnd[0] * CELL_SIZE + CELL_SIZE / 2;
        
        const currentX = startX + (endX - startX) * animationProgress;
        const currentY = startY + (endY - startY) * animationProgress;
        
        // Efeito de elevação durante animação
        const scale = 1 + 0.2 * Math.sin(animationProgress * Math.PI);
        const radius = 30 * scale;
        
        // Sombra mais intensa
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // Desenhar peça
        ctx.beginPath();
        ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
        ctx.fillStyle = animatingPiece.player === 'red' ? '#e74c3c' : '#2c3e50';
        ctx.fill();
        ctx.strokeStyle = animatingPiece.player === 'red' ? '#c0392b' : '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Resetar sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Desenhar brilho
        ctx.beginPath();
        ctx.arc(currentX - 8, currentY - 8, 10 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        
        // Desenhar coroa se for dama
        if (animatingPiece.king) {
            ctx.fillStyle = '#f39c12';
            ctx.font = `bold ${40 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♔', currentX, currentY);
        }
    }
}

function drawSinglePiece(piece, col, row) {
    const x = col * CELL_SIZE + CELL_SIZE / 2;
    const y = row * CELL_SIZE + CELL_SIZE / 2;
    
    // Sombra
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Desenhar peça
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fillStyle = piece.player === 'red' ? '#e74c3c' : '#2c3e50';
    ctx.fill();
    ctx.strokeStyle = piece.player === 'red' ? '#c0392b' : '#1a1a1a';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Resetar sombra
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Desenhar brilho
    ctx.beginPath();
    ctx.arc(x - 8, y - 8, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    
    // Desenhar coroa se for dama
    if (piece.king) {
        ctx.fillStyle = '#f39c12';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♔', x, y);
    }
}

// Obter movimentos válidos
function getValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece || piece.player !== currentPlayer) return [];
    
    const moves = [];
    
    // Direções de movimento
    const directions = piece.king ? 
        [[-1, -1], [-1, 1], [1, -1], [1, 1]] : 
        piece.player === 'red' ? 
            [[-1, -1], [-1, 1]] : 
            [[1, -1], [1, 1]];
    
    // Verificar movimentos simples e capturas
    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
            moves.push({ row: newRow, col: newCol, capture: null });
        }
        
        // Verificar capturas
        const captureRow = row + dr * 2;
        const captureCol = col + dc * 2;
        
        if (isValidPosition(captureRow, captureCol) && 
            !board[captureRow][captureCol] &&
            board[newRow][newCol] && 
            board[newRow][newCol].player !== piece.player) {
            moves.push({ 
                row: captureRow, 
                col: captureCol, 
                capture: { row: newRow, col: newCol }
            });
        }
    }
    
    return moves;
}

function isValidPosition(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

// Mover peça
function movePiece(fromRow, fromCol, toRow, toCol, capture) {
    const piece = board[fromRow][fromCol];
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    
    // Remover peça capturada
    if (capture) {
        board[capture.row][capture.col] = null;
    }
    
    // Promover a dama
    if (!piece.king) {
        if (piece.player === 'red' && toRow === 0) {
            piece.king = true;
        } else if (piece.player === 'black' && toRow === BOARD_SIZE - 1) {
            piece.king = true;
        }
    }
    
    // Verificar capturas em cadeia
    if (capture) {
        const chainCaptures = getValidMoves(toRow, toCol).filter(m => m.capture);
        if (chainCaptures.length > 0) {
            selectedPiece = { row: toRow, col: toCol };
            validMoves = chainCaptures;
            draw();
            return true; // Continua o turno
        }
    }
    
    return false; // Turno termina
}

// Trocar jogador
function switchPlayer() {
    currentPlayer = currentPlayer === 'red' ? 'black' : 'red';
    updateTurnDisplay();
    checkGameOver();
}

// Atualizar display do turno
function updateTurnDisplay() {
    const turnDiv = document.getElementById('turn');
    turnDiv.textContent = currentPlayer === 'red' ? 'Vez das Vermelhas' : 'Vez das Pretas';
    turnDiv.className = currentPlayer === 'red' ? 'red-turn' : 'black-turn';
}

// Verificar fim de jogo
function checkGameOver() {
    const redPieces = [];
    const blackPieces = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            if (piece) {
                if (piece.player === 'red') redPieces.push({row, col});
                else blackPieces.push({row, col});
            }
        }
    }
    
    // Verificar se alguém não tem mais peças
    if (redPieces.length === 0) {
        endGame('Pretas');
        return;
    }
    if (blackPieces.length === 0) {
        endGame('Vermelhas');
        return;
    }
    
    // Verificar se o jogador atual tem movimentos válidos
    const currentPieces = currentPlayer === 'red' ? redPieces : blackPieces;
    let hasValidMove = false;
    
    for (const {row, col} of currentPieces) {
        const moves = getValidMoves(row, col);
        if (moves.length > 0) {
            hasValidMove = true;
            break;
        }
    }
    
    if (!hasValidMove) {
        const winner = currentPlayer === 'red' ? 'Pretas' : 'Vermelhas';
        endGame(winner);
    }
}

function endGame(winner) {
    gameOver = true;
    document.getElementById('winner').textContent = `🎉 ${winner} Venceram! 🎉`;
}

function animateMove(fromRow, fromCol, toRow, toCol, callback) {
    isAnimating = true;
    animationProgress = 0;
    animationStart = [fromRow, fromCol];
    animationEnd = [toRow, toCol];
    animatingPiece = { ...board[fromRow][fromCol] }; // Clonar a peça
    
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        animationProgress = Math.min(elapsed / ANIMATION_DURATION, 1);
        
        // Easing suave (ease-out)
        animationProgress = 1 - Math.pow(1 - animationProgress, 3);
        
        draw();
        
        if (animationProgress < 1) {
            requestAnimationFrame(animate);
        } else {
            isAnimating = false;
            animatingPiece = null;
            callback();
        }
    }
    
    animate();
}

// Click no canvas
canvas.addEventListener('click', (e) => {
    if (gameOver || isAnimating) return; // Bloqueia cliques durante animação
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    
    // Verificar se clicou em um movimento válido
    const validMove = validMoves.find(move => move.row === row && move.col === col);
    if (validMove && selectedPiece) {
        animateMove(selectedPiece.row, selectedPiece.col, row, col, () => {
            const continuesTurn = movePiece(
                selectedPiece.row, 
                selectedPiece.col, 
                row, 
                col, 
                validMove.capture
            );
            
            if (!continuesTurn) {
                selectedPiece = null;
                validMoves = [];
                switchPlayer();
            }
            draw();
        });
        return;
    }
    
    // Selecionar peça
    const piece = board[row][col];
    if (piece && piece.player === currentPlayer) {
        selectedPiece = { row, col };
        validMoves = getValidMoves(row, col);
        draw();
    } else {
        selectedPiece = null;
        validMoves = [];
        draw();
    }
});

// Botão reset
document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('winner').textContent = '';
    initBoard();
    draw();
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawPieces();
}

// Iniciar jogo
initBoard();
draw();