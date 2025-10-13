const game = {
    canvas: null,
    ctx: null,
    cols: 15,
    rows: 10,
    blockSize: 40,
    grid: [],
    score: 0,
    colors: [
        '#FF0000', // Vermelho
        '#00FF00', // Verde
        '#0000FF', // Azul
        '#FA7211', // Alaranjado
        '#FF00FF', // Magenta
        '#00FFFF'  // Ciano
    ],
    highlightedGroup: [],
    animating: false,
    isMouseInside: false,
    blocks: [],
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.cols * this.blockSize;
        this.canvas.height = this.rows * this.blockSize;
        
        this.canvas.addEventListener('mouseenter', () => {
            this.isMouseInside = true;
        });
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.isMouseInside = false;
            this.highlightedGroup = [];
        });
        
        this.newGame();
        this.animate();
    },
    
    newGame() {
        this.score = 0;
        this.grid = [];
        this.blocks = [];
        this.highlightedGroup = [];
        this.animating = false;
        
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const colorIdx = Math.floor(Math.random() * this.colors.length);
                this.grid[row][col] = colorIdx;
                this.blocks.push({
                    row: row,
                    col: col,
                    targetRow: row,
                    targetCol: col,
                    y: row * this.blockSize,
                    x: col * this.blockSize,
                    color: colorIdx,
                    removing: false,
                    scale: 1
                });
            }
        }
        
        this.updateDisplay();
        document.getElementById('message').textContent = 'JOGO INICIADO.';
    },
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            col: Math.floor((e.clientX - rect.left) / this.blockSize),
            row: Math.floor((e.clientY - rect.top) / this.blockSize)
        };
    },
    
    handleMouseMove(e) {
        // Sempre atualiza a posição do mouse, mesmo durante animação
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        // Se estiver animando, apenas registra a posição e sai
        if (this.animating || !this.isMouseInside) return;

        const pos = this.getMousePos(e);
        if (pos.col >= 0 && pos.col < this.cols && pos.row >= 0 && pos.row < this.rows) {
            if (this.grid[pos.row][pos.col] !== null) {
                const group = this.findGroup(pos.row, pos.col);
                this.highlightedGroup = group;

                // Define o cursor conforme o tamanho do grupo
                if (group.length > 1) {
                    this.canvas.style.cursor = "pointer";   // grupo válido
                } else {
                    this.canvas.style.cursor = "not-allowed"; // peça sozinha
                }
            } else {
                this.highlightedGroup = [];
                this.canvas.style.cursor = "default";
            }
        } else {
            this.highlightedGroup = [];
            this.canvas.style.cursor = "default";
        }
    },
    
    handleClick(e) {
        if (this.animating) return;
        
        const pos = this.getMousePos(e);
        if (pos.col >= 0 && pos.col < this.cols && pos.row >= 0 && pos.row < this.rows) {
            if (this.grid[pos.row][pos.col] !== null) {
                const group = this.findGroup(pos.row, pos.col);
                if (group.length > 1) {
                    this.animating = true;
                    this.canvas.style.cursor = "wait";
                    this.removeGroupAnimated(group);
                }
            }
        }
    },
    
    findGroup(row, col) {
        const color = this.grid[row][col];
        if (color === null) return [];
        
        const group = [];
        const visited = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        const queue = [{row, col}];
        visited[row][col] = true;
        
        while (queue.length > 0) {
            const curr = queue.shift();
            group.push(curr);
            
            const neighbors = [
                {row: curr.row - 1, col: curr.col},
                {row: curr.row + 1, col: curr.col},
                {row: curr.row, col: curr.col - 1},
                {row: curr.row, col: curr.col + 1}
            ];
            
            for (const n of neighbors) {
                if (n.row >= 0 && n.row < this.rows && 
                    n.col >= 0 && n.col < this.cols &&
                    !visited[n.row][n.col] && 
                    this.grid[n.row][n.col] === color) {
                    visited[n.row][n.col] = true;
                    queue.push(n);
                }
            }
        }
        
        return group;
    },
    
    removeGroupAnimated(group) {
        const points = (group.length - 2) * (group.length - 2);
        this.score += points;
        
        for (const block of group) {
            this.grid[block.row][block.col] = null;
            const b = this.blocks.find(bl => bl.row === block.row && bl.col === block.col && !bl.removing);
            if (b) b.removing = true;
        }
        
        setTimeout(() => {
            this.blocks = this.blocks.filter(b => !b.removing);
            this.applyGravityAnimated();
        }, 200);
    },
    
    applyGravityAnimated() {
        for (let col = 0; col < this.cols; col++) {
            let writeRow = this.rows - 1;
            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    if (row !== writeRow) {
                        this.grid[writeRow][col] = this.grid[row][col];
                        this.grid[row][col] = null;
                        
                        const block = this.blocks.find(b => b.row === row && b.col === col);
                        if (block) {
                            block.row = writeRow;
                            block.targetRow = writeRow;
                        }
                    }
                    writeRow--;
                }
            }
        }
        
        setTimeout(() => {
            this.shiftColumnsAnimated();
        }, 300);
    },
    
    shiftColumnsAnimated() {
        let writeCol = 0;
        for (let col = 0; col < this.cols; col++) {
            let hasBlocks = false;
            for (let row = 0; row < this.rows; row++) {
                if (this.grid[row][col] !== null) {
                    hasBlocks = true;
                    break;
                }
            }
            
            if (hasBlocks) {
                if (col !== writeCol) {
                    for (let row = 0; row < this.rows; row++) {
                        this.grid[row][writeCol] = this.grid[row][col];
                        this.grid[row][col] = null;
                        
                        const block = this.blocks.find(b => b.row === row && b.col === col);
                        if (block) {
                            block.col = writeCol;
                            block.targetCol = writeCol;
                        }
                    }
                }
                writeCol++;
            }
        }
        
        setTimeout(() => {
            this.highlightedGroup = [];
            this.animating = false;
            this.updateDisplay();
            this.checkGameOver();

            if (this.isMouseInside) {
                const event = new MouseEvent('mousemove', {
                    clientX: this.lastMouseX || 0,
                    clientY: this.lastMouseY || 0
                });
                this.canvas.dispatchEvent(event);
            }
        }, 300);
    },
    
    countBlocks() {
        let count = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] !== null) count++;
            }
        }
        return count;
    },
    
    checkGameOver() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] !== null) {
                    const group = this.findGroup(row, col);
                    if (group.length > 1) return false;
                }
            }
        }
        
        const remaining = this.countBlocks();
        if (remaining === 0) {
            this.score += 1000;
            document.getElementById('message').textContent = 'PERFEITO! BÔNUS DE 1000 PONTOS!';
        } else {
            document.getElementById('message').textContent = 'FIM DE JOGO! SEM MAIS JOGADAS.';
        }
        this.updateDisplay();
        return true;
    },
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('blocks').textContent = this.countBlocks();
    },
    
    animate() {
        this.updateBlocks();
        this.draw();
        requestAnimationFrame(() => this.animate());
    },
    
    updateBlocks() {
        for (const block of this.blocks) {
            const targetY = block.targetRow * this.blockSize;
            const targetX = block.targetCol * this.blockSize;
            
            if (block.removing) {
                block.scale *= 0.85;
            } else {
                const dy = targetY - block.y;
                const dx = targetX - block.x;
                
                if (Math.abs(dy) > 0.5) {
                    block.y += dy * 0.2;
                } else {
                    block.y = targetY;
                }
                
                if (Math.abs(dx) > 0.5) {
                    block.x += dx * 0.15;
                } else {
                    block.x = targetX;
                }
            }
        }
    },
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar grade de fundo
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.canvas.width; x += this.blockSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += this.blockSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        for (const block of this.blocks) {
            if (block.scale <= 0.1) continue;
            
            const size = this.blockSize * block.scale;
            const offset = (this.blockSize - size) / 2;
            const x = block.x + offset;
            const y = block.y + offset;
            
            const isHighlighted = !this.animating && this.highlightedGroup.some(
                b => b.row === block.row && b.col === block.col
            );
            
            // Desenhar bloco principal
            this.ctx.fillStyle = this.colors[block.color];
            this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
            
            // Efeito de pixel retrô
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(x + 4, y + 4, size - 20, 4);
            this.ctx.fillRect(x + 4, y + 4, 4, size - 20);
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(x + size - 8, y + 4, 4, size - 20);
            this.ctx.fillRect(x + 4, y + size - 8, size - 20, 4);
            
            if (isHighlighted && this.highlightedGroup.length > 1) {
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
                
                // Efeito de brilho
                this.ctx.shadowColor = '#ffff00';
                this.ctx.shadowBlur = 10;
                this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
                this.ctx.shadowBlur = 0;
            }
        }
    }
};

window.onload = () => game.init();