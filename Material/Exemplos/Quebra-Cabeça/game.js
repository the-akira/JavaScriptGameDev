const piecesCanvas = document.getElementById('piecesCanvas');
const puzzleCanvas = document.getElementById('puzzleCanvas');
const originalCanvas = document.getElementById('originalCanvas');
const dragCanvas = document.getElementById('dragCanvas');
const piecesCtx = piecesCanvas.getContext('2d');
const puzzleCtx = puzzleCanvas.getContext('2d');
const originalCtx = originalCanvas.getContext('2d');
const dragCtx = dragCanvas.getContext('2d');

dragCanvas.width = window.innerWidth;
dragCanvas.height = window.innerHeight;

let gameImage = null;
let gridSize = 4;
let pieces = [];
let grid = {};
let dragging = null;
let offsetX = 0;
let offsetY = 0;
let mouseX = 0;
let mouseY = 0;
let highlightedCell = null;
let highlightedPiece = null;
let toleranceFactor = 0.4;

document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                gameImage = img;
                newGame();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('difficulty').addEventListener('change', function() {
    gridSize = parseInt(this.value);
    if (gameImage) newGame();
});

function loadDefaultImage() {
    const img = new Image();

    img.onload = function () {
        gameImage = img;
        newGame();
    };

    img.onerror = function () {
        console.error("Failed to load default image.");
    };

    img.src = "default.jpg";
}

function stretchImageToSquare(img, size = 400) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(img, 0, 0, size, size);

    return canvas;
}

function newGame() {
    if (!gameImage) return;
    
    gridSize = parseInt(document.getElementById('difficulty').value);
    pieces = [];
    grid = {};

    const stretchedCanvas = stretchImageToSquare(gameImage, 400);
    gameImage = stretchedCanvas;
    
    originalCtx.clearRect(0, 0, 400, 400);
    originalCtx.drawImage(gameImage, 0, 0, 400, 400);
    
    const pieceSize = 400 / gridSize;
    
    for (let i = 0; i < gridSize * gridSize; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        pieces.push({
            id: i,
            srcX: col * pieceSize,
            srcY: row * pieceSize,
            size: pieceSize,
            correctRow: row,
            correctCol: col
        });
    }
    
    pieces.sort(() => Math.random() - 0.5);
    
    drawPieces();
    drawGrid();
    updateStatus();
}

function drawPieces() {
    piecesCtx.clearRect(0, 0, 400, 400);
    
    const pieceSize = 400 / gridSize;
    let index = 0;
    
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (index >= pieces.length) break;
            
            const piece = pieces[index];
            
            if (dragging && dragging.from === 'pieces' && dragging.index === index) {
                index++;
                continue;
            }
            
            const x = col * pieceSize;
            const y = row * pieceSize;
            
            // Destaque de fundo se esta peça está sendo apontada
            if (highlightedPiece && highlightedPiece.index === index) {
                piecesCtx.fillStyle = 'rgba(255, 193, 7, 0.3)';
                piecesCtx.fillRect(x, y, pieceSize, pieceSize);
            }
            
            piecesCtx.drawImage(
                gameImage,
                piece.srcX, piece.srcY, piece.size, piece.size,
                x + 2, y + 2, pieceSize - 4, pieceSize - 4
            );
            
            index++;
        }
    }
    
    // Desenha a grid de bordas
    piecesCtx.strokeStyle = '#2a3d5c';
    piecesCtx.lineWidth = 2;
    for (let row = 0; row <= gridSize; row++) {
        piecesCtx.beginPath();
        piecesCtx.moveTo(0, row * pieceSize);
        piecesCtx.lineTo(400, row * pieceSize);
        piecesCtx.stroke();
    }
    for (let col = 0; col <= gridSize; col++) {
        piecesCtx.beginPath();
        piecesCtx.moveTo(col * pieceSize, 0);
        piecesCtx.lineTo(col * pieceSize, 400);
        piecesCtx.stroke();
    }
    
    // Desenha borda destacada por cima (se houver peça destacada)
    if (highlightedPiece) {
        const visualIndex = highlightedPiece.visualIndex;
        const row = Math.floor(visualIndex / gridSize);
        const col = visualIndex % gridSize;
        piecesCtx.strokeStyle = '#FFC107';
        piecesCtx.lineWidth = 4;
        piecesCtx.strokeRect(
            col * pieceSize + 2, 
            row * pieceSize + 2, 
            pieceSize - 4, 
            pieceSize - 4
        );
    }
}

function drawGrid() {
    puzzleCtx.clearRect(0, 0, 400, 400);
    
    const pieceSize = 400 / gridSize;
    
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const key = row + ',' + col;
            
            // Desenha destaque se esta célula está sendo apontada
            if (highlightedCell && highlightedCell.key === key) {
                // Cor diferente para hover vs drag
                if (highlightedCell.isHover) {
                    puzzleCtx.fillStyle = 'rgba(33, 150, 243, 0.3)'; // Azul para hover
                } else {
                    puzzleCtx.fillStyle = 'rgba(76, 175, 80, 0.3)'; // Verde para drag
                }
                puzzleCtx.fillRect(col * pieceSize, row * pieceSize, pieceSize, pieceSize);
            }
            
            if (grid[key] && !(dragging && dragging.from === 'grid' && dragging.key === key)) {
                const piece = grid[key];
                const x = col * pieceSize;
                const y = row * pieceSize;
                
                puzzleCtx.drawImage(
                    gameImage,
                    piece.srcX, piece.srcY, piece.size, piece.size,
                    x, y, pieceSize, pieceSize
                );
            }
        }
    }
    
    // Desenha todas as bordas da grid de uma vez (sem sobreposição)
    puzzleCtx.strokeStyle = '#2a3d5c';
    puzzleCtx.lineWidth = 2;
    for (let row = 0; row <= gridSize; row++) {
        puzzleCtx.beginPath();
        puzzleCtx.moveTo(0, row * pieceSize);
        puzzleCtx.lineTo(400, row * pieceSize);
        puzzleCtx.stroke();
    }
    for (let col = 0; col <= gridSize; col++) {
        puzzleCtx.beginPath();
        puzzleCtx.moveTo(col * pieceSize, 0);
        puzzleCtx.lineTo(col * pieceSize, 400);
        puzzleCtx.stroke();
    }
    
    // Desenha borda destacada por cima (se houver célula destacada)
    if (highlightedCell) {
        const row = highlightedCell.row;
        const col = highlightedCell.col;
        // Cor diferente para hover vs drag
        if (highlightedCell.isHover) {
            puzzleCtx.strokeStyle = '#2196F3'; // Azul para hover
        } else {
            puzzleCtx.strokeStyle = '#4CAF50'; // Verde para drag
        }
        puzzleCtx.lineWidth = 4;
        puzzleCtx.strokeRect(
            col * pieceSize + 2, 
            row * pieceSize + 2, 
            pieceSize - 4, 
            pieceSize - 4
        );
    }
}

function drawDraggedPiece() {
    if (!dragging || !gameImage) return;
    
    dragCtx.clearRect(0, 0, dragCanvas.width, dragCanvas.height);
    
    const pieceSize = 400 / gridSize;
    const x = mouseX - offsetX;
    const y = mouseY - offsetY;
    
    dragCtx.save();
    dragCtx.globalAlpha = 0.8;
    dragCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    dragCtx.shadowBlur = 15;
    dragCtx.shadowOffsetX = 5;
    dragCtx.shadowOffsetY = 5;
    
    dragCtx.drawImage(
        gameImage,
        dragging.piece.srcX, dragging.piece.srcY, dragging.piece.size, dragging.piece.size,
        x, y, pieceSize, pieceSize
    );
    
    dragCtx.restore();
    
    dragCtx.strokeStyle = '#ff6b6b';
    dragCtx.lineWidth = 3;
    dragCtx.strokeRect(x, y, pieceSize, pieceSize);
}

function updateStatus() {
    const placed = Object.keys(grid).length;
    const total = gridSize * gridSize;
    document.getElementById('status').textContent = 'Peças colocadas: ' + placed + ' / ' + total;
    
    if (placed === total && checkWin()) {
        document.getElementById('victory').style.display = 'block';
    } else {
        document.getElementById('victory').style.display = 'none';
    }
}

function checkWin() {
    for (let key in grid) {
        const [row, col] = key.split(',').map(Number);
        const piece = grid[key];
        if (piece.correctRow !== row || piece.correctCol !== col) {
            return false;
        }
    }
    return true;
}

piecesCanvas.addEventListener('mousedown', function(e) {
    const rect = piecesCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pieceSize = 400 / gridSize;
    const col = Math.floor(x / pieceSize);
    const row = Math.floor(y / pieceSize);
    const index = row * gridSize + col;
    
    if (index >= 0 && index < pieces.length && col < gridSize && row < gridSize) {
        let actualIndex = 0;
        let visualIndex = 0;
        
        for (let i = 0; i < pieces.length; i++) {
            if (dragging && dragging.from === 'pieces' && dragging.index === i) {
                continue;
            }
            if (visualIndex === index) {
                actualIndex = i;
                break;
            }
            visualIndex++;
        }
        
        if (visualIndex === index && actualIndex < pieces.length) {
            dragging = { piece: pieces[actualIndex], from: 'pieces', index: actualIndex };
            offsetX = x - col * pieceSize;
            offsetY = y - row * pieceSize;
            mouseX = e.clientX;
            mouseY = e.clientY;
            highlightedPiece = null; // Limpa o destaque ao arrastar
            drawPieces();
            drawDraggedPiece();
        }
    }
});

piecesCanvas.addEventListener('mousemove', function(e) {
    if (dragging) return; // Não destacar se estiver arrastando
    
    const rect = piecesCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pieceSize = 400 / gridSize;
    const col = Math.floor(x / pieceSize);
    const row = Math.floor(y / pieceSize);
    const visualIndex = row * gridSize + col;
    
    // Verifica se há uma peça nesta posição
    if (col >= 0 && col < gridSize && row >= 0 && row < gridSize && visualIndex < pieces.length) {
        let actualIndex = visualIndex;
        highlightedPiece = { index: actualIndex, visualIndex: visualIndex };
        drawPieces();
    } else {
        if (highlightedPiece) {
            highlightedPiece = null;
            drawPieces();
        }
    }
});

piecesCanvas.addEventListener('mouseleave', function() {
    if (highlightedPiece) {
        highlightedPiece = null;
        drawPieces();
    }
});

puzzleCanvas.addEventListener('mousedown', function(e) {
    const rect = puzzleCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pieceSize = 400 / gridSize;
    const col = Math.floor(x / pieceSize);
    const row = Math.floor(y / pieceSize);
    const key = row + ',' + col;
    
    if (grid[key]) {
        dragging = { piece: grid[key], from: 'grid', key: key };
        offsetX = x - col * pieceSize;
        offsetY = y - row * pieceSize;
        mouseX = e.clientX;
        mouseY = e.clientY;
        highlightedCell = null;
        drawGrid();
        drawDraggedPiece();
    }
});

puzzleCanvas.addEventListener('mousemove', function(e) {
    if (dragging) return; // Não destacar se estiver arrastando
    
    const rect = puzzleCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pieceSize = 400 / gridSize;
    const col = Math.floor(x / pieceSize);
    const row = Math.floor(y / pieceSize);
    const key = row + ',' + col;
    
    // Verifica se há uma peça nesta posição
    if (col >= 0 && col < gridSize && row >= 0 && row < gridSize && grid[key]) {
        highlightedCell = { key: key, row: row, col: col, isHover: true };
        drawGrid();
    } else {
        if (highlightedCell && highlightedCell.isHover) {
            highlightedCell = null;
            drawGrid();
        }
    }
});

puzzleCanvas.addEventListener('mouseleave', function() {
    if (highlightedCell && highlightedCell.isHover) {
        highlightedCell = null;
        drawGrid();
    }
});

document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Detecta sobre qual célula do grid o mouse está
    const rect = puzzleCanvas.getBoundingClientRect();
    const pieceSize = 400 / gridSize;
    
    // Calcula a posição da peça sendo arrastada
    const pieceX = e.clientX - offsetX;
    const pieceY = e.clientY - offsetY;
    
    // Calcula o centro da peça
    const pieceCenterX = pieceX + pieceSize / 2;
    const pieceCenterY = pieceY + pieceSize / 2;
    
    // Converte para coordenadas relativas ao canvas
    const centerXRelative = pieceCenterX - rect.left;
    const centerYRelative = pieceCenterY - rect.top;
    
    // Verifica se o centro da peça está dentro do canvas (com margem de tolerância)
    const tolerance = pieceSize * toleranceFactor; // 50% da peça pode estar fora
    if (centerXRelative >= -tolerance && centerXRelative < 400 + tolerance && 
        centerYRelative >= -tolerance && centerYRelative < 400 + tolerance) {
        
        // Clampeia as coordenadas para dentro dos limites válidos
        const clampedX = Math.max(0, Math.min(399, centerXRelative));
        const clampedY = Math.max(0, Math.min(399, centerYRelative));
        
        const col = Math.floor(clampedX / pieceSize);
        const row = Math.floor(clampedY / pieceSize);
        const key = row + ',' + col;
        
        highlightedCell = { key: key, row: row, col: col };
    } else {
        highlightedCell = null;
    }
    
    drawGrid();
    drawDraggedPiece();
});

document.addEventListener('mouseup', function(e) {
    if (!dragging) return;
    
    const rect = puzzleCanvas.getBoundingClientRect();
    const pieceSize = 400 / gridSize;
    
    // Calcula a posição da peça sendo arrastada
    const pieceX = e.clientX - offsetX;
    const pieceY = e.clientY - offsetY;
    
    // Calcula o centro da peça
    const pieceCenterX = pieceX + pieceSize / 2;
    const pieceCenterY = pieceY + pieceSize / 2;
    
    // Converte para coordenadas relativas ao canvas
    const centerXRelative = pieceCenterX - rect.left;
    const centerYRelative = pieceCenterY - rect.top;
    
    // Verifica se o centro da peça está dentro do canvas (com margem de tolerância)
    const tolerance = pieceSize * toleranceFactor; // 50% da peça pode estar fora
    if (centerXRelative >= -tolerance && centerXRelative < 400 + tolerance && 
        centerYRelative >= -tolerance && centerYRelative < 400 + tolerance) {
        
        // Clampeia as coordenadas para dentro dos limites válidos
        const clampedX = Math.max(0, Math.min(399, centerXRelative));
        const clampedY = Math.max(0, Math.min(399, centerYRelative));
        
        const col = Math.floor(clampedX / pieceSize);
        const row = Math.floor(clampedY / pieceSize);
        const key = row + ',' + col;
        
        if (dragging.from === 'pieces') {
            if (grid[key]) {
                pieces[dragging.index] = grid[key];
            } else {
                pieces.splice(dragging.index, 1);
            }
            grid[key] = dragging.piece;
        } else {
            delete grid[dragging.key];
            if (grid[key]) {
                pieces.push(grid[key]);
            }
            grid[key] = dragging.piece;
        }
    } else if (dragging.from === 'grid') {
        delete grid[dragging.key];
        pieces.push(dragging.piece);
    }
    
    dragging = null;
    highlightedCell = null;
    dragCtx.clearRect(0, 0, dragCanvas.width, dragCanvas.height);
    drawPieces();
    drawGrid();
    updateStatus();

    // Verifica se o mouse ainda está sobre a área de peças e atualiza o destaque
    const piecesRect = piecesCanvas.getBoundingClientRect();
    const piecesX = e.clientX - piecesRect.left;
    const piecesY = e.clientY - piecesRect.top;
    
    if (piecesX >= 0 && piecesX < 400 && piecesY >= 0 && piecesY < 400) {
        const col = Math.floor(piecesX / pieceSize);
        const row = Math.floor(piecesY / pieceSize);
        const visualIndex = row * gridSize + col;
        
        if (col >= 0 && col < gridSize && row >= 0 && row < gridSize && visualIndex < pieces.length) {
            highlightedPiece = { index: visualIndex, visualIndex: visualIndex };
            drawPieces();
        }
    }

    // Verifica se o mouse ainda está sobre o grid de montagem e atualiza o destaque
    const puzzleX = e.clientX - rect.left;
    const puzzleY = e.clientY - rect.top;
    
    if (puzzleX >= 0 && puzzleX < 400 && puzzleY >= 0 && puzzleY < 400) {
        const col = Math.floor(puzzleX / pieceSize);
        const row = Math.floor(puzzleY / pieceSize);
        const key = row + ',' + col;
        
        if (col >= 0 && col < gridSize && row >= 0 && row < gridSize && grid[key]) {
            highlightedCell = { key: key, row: row, col: col, isHover: true };
            drawGrid();
        }
    }
});

loadDefaultImage();