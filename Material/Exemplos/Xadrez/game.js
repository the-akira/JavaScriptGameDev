const canvas = document.getElementById('chessBoard');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const SQUARE_SIZE = 80;

const PIECES = {
    K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

let board = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    [' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' '],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
];

let selectedSquare = null;
let currentTurn = 'white';
let validMoves = [];
let enPassantTarget = null;
let castlingRights = {
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true
};
let moveHistory = [];

let isAnimating = false;
let animationProgress = 0;
let animatingPiece = null;
let animationStart = null;
let animationEnd = null;
const ANIMATION_DURATION = 350; // milissegundos

function isWhitePiece(piece) {
    return piece === piece.toUpperCase() && piece !== ' ';
}

function isBlackPiece(piece) {
    return piece === piece.toLowerCase() && piece !== ' ';
}

function getPieceColor(piece) {
    if (piece === ' ') return null;
    return isWhitePiece(piece) ? 'white' : 'black';
}

function drawBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const isLight = (row + col) % 2 === 0;
            ctx.fillStyle = isLight ? '#f0d9b5' : '#b58863';
            ctx.fillRect(col * SQUARE_SIZE, row * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        }
    }

    // Efeito de desfoque durante animação
    if (isAnimating) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (selectedSquare && !isAnimating) {
        const [selRow, selCol] = selectedSquare;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fillRect(selCol * SQUARE_SIZE, selRow * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
    }

    if (!isAnimating) {
        validMoves.forEach(([row, col]) => {
            const isNormalCapture = board[row][col] !== ' ';
            const isEnPassantCapture = enPassantTarget && 
                enPassantTarget[0] === row && 
                enPassantTarget[1] === col;
            
            const isCapture = isNormalCapture || isEnPassantCapture;
            ctx.fillStyle = isCapture ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(col * SQUARE_SIZE + SQUARE_SIZE/2, row * SQUARE_SIZE + SQUARE_SIZE/2, 30, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            
            // Pular a peça que está sendo animada
            if (isAnimating && animatingPiece && 
                animationStart[0] === row && animationStart[1] === col) {
                continue;
            }
            
            if (piece !== ' ') {
                drawPiece(piece, col, row);
            }
        }
    }

    // Desenhar peça animando
    if (isAnimating && animatingPiece) {
        const startX = animationStart[1] * SQUARE_SIZE + SQUARE_SIZE / 2;
        const startY = animationStart[0] * SQUARE_SIZE + SQUARE_SIZE / 2;
        const endX = animationEnd[1] * SQUARE_SIZE + SQUARE_SIZE / 2;
        const endY = animationEnd[0] * SQUARE_SIZE + SQUARE_SIZE / 2;
        
        const currentX = startX + (endX - startX) * animationProgress;
        const currentY = startY + (endY - startY) * animationProgress;
        
        // Efeito de sombra
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isWhitePiece(animatingPiece.piece)) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(PIECES[animatingPiece.piece], currentX, currentY + 4.35);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(PIECES[animatingPiece.piece], currentX, currentY + 4.35);
        } else {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeText(PIECES[animatingPiece.piece], currentX, currentY + 4.35);
            ctx.fillStyle = '#000000';
            ctx.fillText(PIECES[animatingPiece.piece], currentX, currentY + 4.35);
        }
        
        // Resetar sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}

function drawPiece(piece, col, row) {
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const x = col * SQUARE_SIZE + SQUARE_SIZE / 2;
    const y = row * SQUARE_SIZE + SQUARE_SIZE / 2 + 4.35;
    
    if (isWhitePiece(piece)) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(PIECES[piece], x, y);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(PIECES[piece], x, y);
    } else {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeText(PIECES[piece], x, y);
        ctx.fillStyle = '#000000';
        ctx.fillText(PIECES[piece], x, y);
    }
}

function getValidMoves(row, col) {
    const piece = board[row][col];
    if (piece === ' ') return [];
    
    const pieceColor = getPieceColor(piece);
    if (pieceColor !== currentTurn) return [];

    let moves = [];
    const pieceType = piece.toLowerCase();

    switch(pieceType) {
        case 'p': moves = getPawnMoves(row, col); break;
        case 'r': moves = getRookMoves(row, col); break;
        case 'n': moves = getKnightMoves(row, col); break;
        case 'b': moves = getBishopMoves(row, col); break;
        case 'q': moves = getQueenMoves(row, col); break;
        case 'k': moves = getKingMoves(row, col); break;
    }

    return moves.filter(move => !wouldBeInCheck(row, col, move[0], move[1]));
}

function getPawnMoves(row, col) {
    const moves = [];
    const piece = board[row][col];
    const direction = isWhitePiece(piece) ? -1 : 1;
    const startRow = isWhitePiece(piece) ? 6 : 1;

    if (board[row + direction] && board[row + direction][col] === ' ') {
        moves.push([row + direction, col]);
        if (row === startRow && board[row + 2 * direction][col] === ' ') {
            moves.push([row + 2 * direction, col]);
        }
    }

    [-1, 1].forEach(dc => {
        const newCol = col + dc;
        if (newCol >= 0 && newCol < 8 && board[row + direction] && board[row + direction][newCol] !== ' ') {
            if (getPieceColor(board[row + direction][newCol]) !== getPieceColor(piece)) {
                moves.push([row + direction, newCol]);
            }
        }
    });

    if (enPassantTarget) {
        const [epRow, epCol] = enPassantTarget;
        if (row + direction === epRow && Math.abs(col - epCol) === 1) {
            moves.push([epRow, epCol]);
        }
    }

    return moves;
}

function getRookMoves(row, col) {
    const moves = [];
    const directions = [[0,1], [0,-1], [1,0], [-1,0]];
    directions.forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i;
            const newCol = col + dc * i;
            if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
            if (board[newRow][newCol] === ' ') {
                moves.push([newRow, newCol]);
            } else {
                if (getPieceColor(board[newRow][newCol]) !== getPieceColor(board[row][col])) {
                    moves.push([newRow, newCol]);
                }
                break;
            }
        }
    });
    return moves;
}

function getKnightMoves(row, col) {
    const moves = [];
    const jumps = [[2,1], [2,-1], [-2,1], [-2,-1], [1,2], [1,-2], [-1,2], [-1,-2]];
    jumps.forEach(([dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            if (board[newRow][newCol] === ' ' || 
                getPieceColor(board[newRow][newCol]) !== getPieceColor(board[row][col])) {
                moves.push([newRow, newCol]);
            }
        }
    });
    return moves;
}

function getBishopMoves(row, col) {
    const moves = [];
    const directions = [[1,1], [1,-1], [-1,1], [-1,-1]];
    directions.forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i;
            const newCol = col + dc * i;
            if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
            if (board[newRow][newCol] === ' ') {
                moves.push([newRow, newCol]);
            } else {
                if (getPieceColor(board[newRow][newCol]) !== getPieceColor(board[row][col])) {
                    moves.push([newRow, newCol]);
                }
                break;
            }
        }
    });
    return moves;
}

function getQueenMoves(row, col) {
    return [...getRookMoves(row, col), ...getBishopMoves(row, col)];
}

function getKingMoves(row, col) {
    const moves = [];
    const directions = [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]];
    directions.forEach(([dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            if (board[newRow][newCol] === ' ' || 
                getPieceColor(board[newRow][newCol]) !== getPieceColor(board[row][col])) {
                moves.push([newRow, newCol]);
            }
        }
    });

    const baseRow = isWhitePiece(board[row][col]) ? 7 : 0;
    if (row === baseRow && col === 4) {
        if (isWhitePiece(board[row][col])) {
            if (castlingRights.whiteKingSide && 
                board[7][5] === ' ' && board[7][6] === ' ' &&
                !isSquareUnderAttack(7, 4, 'black') &&
                !isSquareUnderAttack(7, 5, 'black') &&
                !isSquareUnderAttack(7, 6, 'black')) {
                moves.push([7, 6]);
            }
            if (castlingRights.whiteQueenSide && 
                board[7][3] === ' ' && board[7][2] === ' ' && board[7][1] === ' ' &&
                !isSquareUnderAttack(7, 4, 'black') &&
                !isSquareUnderAttack(7, 3, 'black') &&
                !isSquareUnderAttack(7, 2, 'black')) {
                moves.push([7, 2]);
            }
        } else {
            if (castlingRights.blackKingSide && 
                board[0][5] === ' ' && board[0][6] === ' ' &&
                !isSquareUnderAttack(0, 4, 'white') &&
                !isSquareUnderAttack(0, 5, 'white') &&
                !isSquareUnderAttack(0, 6, 'white')) {
                moves.push([0, 6]);
            }
            if (castlingRights.blackQueenSide && 
                board[0][3] === ' ' && board[0][2] === ' ' && board[0][1] === ' ' &&
                !isSquareUnderAttack(0, 4, 'white') &&
                !isSquareUnderAttack(0, 3, 'white') &&
                !isSquareUnderAttack(0, 2, 'white')) {
                moves.push([0, 2]);
            }
        }
    }

    return moves;
}

function isSquareUnderAttack(row, col, byColor) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece !== ' ' && getPieceColor(piece) === byColor) {
                const moves = getBasicMoves(r, c);
                if (moves.some(([mr, mc]) => mr === row && mc === col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function getBasicMoves(row, col) {
    const piece = board[row][col];
    const pieceType = piece.toLowerCase();
    switch(pieceType) {
        case 'p': return getPawnMoves(row, col);
        case 'r': return getRookMoves(row, col);
        case 'n': return getKnightMoves(row, col);
        case 'b': return getBishopMoves(row, col);
        case 'q': return getQueenMoves(row, col);
        case 'k': {
            // Versão simplificada do rei sem verificar roque
            // para evitar recursão infinita
            const moves = [];
            const directions = [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]];
            directions.forEach(([dr, dc]) => {
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    if (board[newRow][newCol] === ' ' || 
                        getPieceColor(board[newRow][newCol]) !== getPieceColor(piece)) {
                        moves.push([newRow, newCol]);
                    }
                }
            });
            return moves;
        }
        default: return [];
    }
}

function findKing(color) {
    const king = color === 'white' ? 'K' : 'k';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === king) {
                return [row, col];
            }
        }
    }
    return null;
}

function wouldBeInCheck(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const captured = board[toRow][toCol];
    const color = getPieceColor(piece);
    
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = ' ';
    
    const kingPos = piece.toLowerCase() === 'k' ? [toRow, toCol] : findKing(color);
    const enemyColor = color === 'white' ? 'black' : 'white';
    const inCheck = isSquareUnderAttack(kingPos[0], kingPos[1], enemyColor);
    
    board[fromRow][fromCol] = piece;
    board[toRow][toCol] = captured;
    
    return inCheck;
}

function isInCheck(color) {
    const kingPos = findKing(color);
    if (!kingPos) return false;
    const enemyColor = color === 'white' ? 'black' : 'white';
    return isSquareUnderAttack(kingPos[0], kingPos[1], enemyColor);
}

function isCheckmate(color) {
    if (!isInCheck(color)) return false;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece !== ' ' && getPieceColor(piece) === color) {
                const moves = getValidMoves(row, col);
                if (moves.length > 0) return false;
            }
        }
    }
    return true;
}

function movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const captured = board[toRow][toCol];
    
    enPassantTarget = null;

    if (piece.toLowerCase() === 'p') {
        if (Math.abs(fromRow - toRow) === 2) {
            enPassantTarget = [fromRow + (toRow - fromRow) / 2, fromCol];
        }
        
        if (Math.abs(fromCol - toCol) === 1 && captured === ' ') {
            board[fromRow][toCol] = ' ';
        }

        if ((toRow === 0 && isWhitePiece(piece)) || (toRow === 7 && isBlackPiece(piece))) {
            board[toRow][toCol] = isWhitePiece(piece) ? 'Q' : 'q';
            board[fromRow][fromCol] = ' ';
            return;
        }
    }

    if (piece.toLowerCase() === 'k') {
        if (Math.abs(toCol - fromCol) === 2) {
            if (toCol === 6) {
                board[toRow][5] = board[toRow][7];
                board[toRow][7] = ' ';
            } else if (toCol === 2) {
                board[toRow][3] = board[toRow][0];
                board[toRow][0] = ' ';
            }
        }
        
        if (isWhitePiece(piece)) {
            castlingRights.whiteKingSide = false;
            castlingRights.whiteQueenSide = false;
        } else {
            castlingRights.blackKingSide = false;
            castlingRights.blackQueenSide = false;
        }
    }

    if (piece.toLowerCase() === 'r') {
        if (fromRow === 7 && fromCol === 7) castlingRights.whiteKingSide = false;
        if (fromRow === 7 && fromCol === 0) castlingRights.whiteQueenSide = false;
        if (fromRow === 0 && fromCol === 7) castlingRights.blackKingSide = false;
        if (fromRow === 0 && fromCol === 0) castlingRights.blackQueenSide = false;
    }

    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = ' ';
}

function animateMove(fromRow, fromCol, toRow, toCol, callback) {
    isAnimating = true;
    animationProgress = 0;
    animationStart = [fromRow, fromCol];
    animationEnd = [toRow, toCol];
    animatingPiece = { piece: board[fromRow][fromCol] };
    
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        animationProgress = Math.min(elapsed / ANIMATION_DURATION, 1);
        
        // Easing suave (ease-out)
        animationProgress = 1 - Math.pow(1 - animationProgress, 3);
        
        drawBoard();
        
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

canvas.addEventListener('click', (e) => {
    if (isAnimating) return; // Bloqueia cliques durante animação
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / SQUARE_SIZE);
    const row = Math.floor(y / SQUARE_SIZE);

    if (selectedSquare) {
        const [selRow, selCol] = selectedSquare;
        const moveIsValid = validMoves.some(([r, c]) => r === row && c === col);
        
        if (moveIsValid) {
            // Animar o movimento
            animateMove(selRow, selCol, row, col, () => {
                movePiece(selRow, selCol, row, col);
                currentTurn = currentTurn === 'white' ? 'black' : 'white';
                
                if (isCheckmate(currentTurn)) {
                    statusEl.innerHTML = `Xeque-mate! ${currentTurn === 'white' ? 'Pretas' : 'Brancas'} vencem!`;
                } else if (isInCheck(currentTurn)) {
                    statusEl.innerHTML = `<b>Turno:</b> ${currentTurn === 'white' ? 'Brancas' : 'Pretas'} - XEQUE!`;
                } else {
                    statusEl.innerHTML = `<b>Turno:</b> ${currentTurn === 'white' ? 'Brancas' : 'Pretas'}`;
                }
                
                selectedSquare = null;
                validMoves = [];
                drawBoard();
            });
        } else {
            selectedSquare = [row, col];
            validMoves = getValidMoves(row, col);
            drawBoard();
        }
    } else {
        selectedSquare = [row, col];
        validMoves = getValidMoves(row, col);
        drawBoard();
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    board = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];
    selectedSquare = null;
    currentTurn = 'white';
    validMoves = [];
    enPassantTarget = null;
    castlingRights = {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true
    };
    statusEl.innerHTML = '<b>Turno:</b> Brancas';
    drawBoard();
});

drawBoard();