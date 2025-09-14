let board = [];
let emptyPos = {row: 3, col: 3};
let moves = 0;
let isGameActive = false;
let celebrationTimeout = null;
let isKeyProcessing = false;

// Inicializar o tabuleiro
function initBoard() {
    board = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 0]
    ];
    emptyPos = {row: 3, col: 3};
    moves = 0;
    isGameActive = false;
    updateDisplay();
}

// Atualizar a exibição do tabuleiro
function updateDisplay() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const tile = document.createElement('button');
            tile.className = 'tile';
            
            if (board[row][col] === 0) {
                tile.className += ' empty';
                tile.textContent = '';
            } else {
                const expectedValue = row * 4 + col + 1;
                tile.textContent = board[row][col];
                tile.onclick = () => moveTile(row, col);
                
                // Destacar se estiver na posição correta
                if (board[row][col] === expectedValue) {
                    tile.className += ' correct';
                }
            }
            
            boardElement.appendChild(tile);
        }
    }

    document.getElementById('moves').textContent = moves;
}

// Mover peça
function moveTile(row, col) {
    if (!isGameActive) return;

    const rowDiff = Math.abs(row - emptyPos.row);
    const colDiff = Math.abs(col - emptyPos.col);

    // Verificar se o movimento é válido (adjacente ao espaço vazio)
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        // Trocar a peça com o espaço vazio
        board[emptyPos.row][emptyPos.col] = board[row][col];
        board[row][col] = 0;
        emptyPos = {row, col};
        moves++;
        
        updateDisplay();
        
        if (isPuzzleSolved()) {
            isGameActive = false;
            updateStatus("Puzzle resolvido!");
            showCelebration();
        } else {
            updateStatus("Continue jogando...");
        }
    }
}

// Verificar se o puzzle está resolvido
function isPuzzleSolved() {
    const solved = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 0]
    ];

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[row][col] !== solved[row][col]) {
                return false;
            }
        }
    }
    return true;
}

// Embaralhar o puzzle
function shufflePuzzle() {
    // Fazer muitos movimentos aleatórios para embaralhar
    for (let i = 0; i < 1000; i++) {
        const possibleMoves = getPossibleMoves();
        if (possibleMoves.length > 0) {
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            const {row, col} = randomMove;
            
            // Mover sem incrementar o contador
            board[emptyPos.row][emptyPos.col] = board[row][col];
            board[row][col] = 0;
            emptyPos = {row, col};
        }
    }
    
    moves = 0;
    isGameActive = true;
    updateDisplay();
    updateStatus("Puzzle iniciado!");
    hideCelebration();
    // Garantir foco para controle por teclado
    document.body.focus();
}

// Obter movimentos possíveis
function getPossibleMoves() {
    const moves = [];
    const directions = [
        {row: -1, col: 0}, // cima
        {row: 1, col: 0},  // baixo
        {row: 0, col: -1}, // esquerda
        {row: 0, col: 1}   // direita
    ];

    for (const dir of directions) {
        const newRow = emptyPos.row + dir.row;
        const newCol = emptyPos.col + dir.col;
        
        if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 4) {
            moves.push({row: newRow, col: newCol});
        }
    }
    
    return moves;
}

// Resetar o puzzle
function resetPuzzle() {
    initBoard();
    hideCelebration();
    shufflePuzzle();
}

// Resolver o puzzle automaticamente
function solvePuzzle() {
    initBoard();
    updateStatus("Puzzle resolvido automaticamente!");
    showCelebration();
}

// Atualizar status
function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

// Mostrar celebração
function showCelebration() {
    // Limpar qualquer timer anterior
    if (celebrationTimeout) {
        clearTimeout(celebrationTimeout);
        celebrationTimeout = null;
    }

    const el = document.getElementById('celebration');
    el.style.display = 'block';

    celebrationTimeout = setTimeout(() => {
        hideCelebration();
        celebrationTimeout = null;
    }, 3000);
}

// Esconder celebração
function hideCelebration() {
    const el = document.getElementById('celebration');
    el.style.display = 'none';
    // Também limpamos o timer
    if (celebrationTimeout) {
        clearTimeout(celebrationTimeout);
        celebrationTimeout = null;
    }
}

// Controle por teclado
function handleKeyPress(event) {
    if (!isGameActive || isKeyProcessing) return;
    isKeyProcessing = true; // trava

    let targetRow = emptyPos.row;
    let targetCol = emptyPos.col;

    switch (event.key) {
        case 'ArrowUp':
            if (emptyPos.row < 3) {
                targetRow = emptyPos.row + 1;
                moveTile(targetRow, targetCol);
            }
            event.preventDefault();
            break;
        case 'ArrowDown':
            if (emptyPos.row > 0) {
                targetRow = emptyPos.row - 1;
                moveTile(targetRow, targetCol);
            }
            event.preventDefault();
            break;
        case 'ArrowLeft':
            if (emptyPos.col < 3) {
                targetCol = emptyPos.col + 1;
                moveTile(targetRow, targetCol);
            }
            event.preventDefault();
            break;
        case 'ArrowRight':
            if (emptyPos.col > 0) {
                targetCol = emptyPos.col - 1;
                moveTile(targetRow, targetCol);
            }
            event.preventDefault();
            break;
        case ' ':
        case 'Enter':
            if (!isGameActive) {
                shufflePuzzle();
            }
            event.preventDefault();
            break;
    }

    // Libera a flag após um pequeno delay (tempo suficiente para atualizar a tela)
    setTimeout(() => {
        isKeyProcessing = false;
    }, 50);
}

// Inicializar o jogo quando a página carregar
window.onload = function() {
    initBoard();
    shufflePuzzle();
    
    // Adicionar listener para eventos de teclado
    document.addEventListener('keydown', handleKeyPress);
    
    // Garantir que o body tenha foco para receber eventos de teclado
    document.body.focus();
    
    // Re-focar quando clicar em qualquer lugar
    document.addEventListener('click', () => {
        document.body.focus();
    });
};