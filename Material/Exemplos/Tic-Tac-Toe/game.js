class TicTacToe {
    constructor() {
        // Constantes do jogo
        this.CELL_SIZE = 120;
        this.BOARD_PADDING = 10;
        this.LINE_WIDTH = 3;
        this.SYMBOL_SIZE = 30;
        this.WINNING_LINE_WIDTH = 8;
        this.SHADOW_BLUR = 10;
        this.WINNING_SHADOW_BLUR = 15;
        this.BOARD_SIZE = 3;
        this.TOTAL_CELLS = this.BOARD_SIZE * this.BOARD_SIZE;
        
        // Elementos do DOM
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Estado do jogo
        this.currentPlayer = 'X';
        this.board = Array(this.TOTAL_CELLS).fill('');
        this.gameOver = false;
        this.scores = { X: 0, O: 0, tie: 0 };
        this.hoveredCell = -1;
        this.winningPattern = null;
        
        // Configuração de eventos
        this.setupEventListeners();
        
        // Inicialização
        this.loadScores();
        this.drawBoard();
        this.updateDisplay();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseout', () => this.handleMouseOut());
    }

    getCanvasScale() {
        const rect = this.canvas.getBoundingClientRect();
        return {
            scaleX: this.canvas.width / rect.width,
            scaleY: this.canvas.height / rect.height
        };
    }
    
    drawBoard() {
        this.clearCanvas();
        this.drawGrid();
        this.drawHoverEffect();
        this.drawSymbols();
        
        if (this.gameOver && this.winningPattern) {
            this.drawWinningLine();
        }
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = this.LINE_WIDTH;
        this.ctx.lineCap = 'round';
        
        // Linhas verticais
        for (let i = 1; i < this.BOARD_SIZE; i++) {
            this.drawLine(
                i * this.CELL_SIZE, this.BOARD_PADDING,
                i * this.CELL_SIZE, this.canvas.height - this.BOARD_PADDING
            );
        }
        
        // Linhas horizontais
        for (let i = 1; i < this.BOARD_SIZE; i++) {
            this.drawLine(
                this.BOARD_PADDING, i * this.CELL_SIZE,
                this.canvas.width - this.BOARD_PADDING, i * this.CELL_SIZE
            );
        }
    }
    
    drawLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    
    drawHoverEffect() {
        if (this.hoveredCell >= 0 && this.board[this.hoveredCell] === '' && !this.gameOver) {
            const { x, y } = this.getCellPosition(this.hoveredCell);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(
                x + 5, y + 5, 
                this.CELL_SIZE - 10, this.CELL_SIZE - 10
            );
        }
    }
    
    drawSymbols() {
        for (let i = 0; i < this.TOTAL_CELLS; i++) {
            if (this.board[i] !== '') {
                const { x, y } = this.getCellCenter(i);
                
                if (this.board[i] === 'X') {
                    this.drawX(x, y);
                } else {
                    this.drawO(x, y);
                }
            }
        }
    }
    
    getCellPosition(index) {
        const col = index % this.BOARD_SIZE;
        const row = Math.floor(index / this.BOARD_SIZE);
        return {
            x: col * this.CELL_SIZE,
            y: row * this.CELL_SIZE
        };
    }
    
    getCellCenter(index) {
        const { x, y } = this.getCellPosition(index);
        return {
            x: x + this.CELL_SIZE / 2,
            y: y + this.CELL_SIZE / 2
        };
    }
    
    drawX(x, y) {
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = this.SHADOW_BLUR;
        
        this.drawLine(x - this.SYMBOL_SIZE, y - this.SYMBOL_SIZE, x + this.SYMBOL_SIZE, y + this.SYMBOL_SIZE);
        this.drawLine(x + this.SYMBOL_SIZE, y - this.SYMBOL_SIZE, x - this.SYMBOL_SIZE, y + this.SYMBOL_SIZE);
        
        this.ctx.shadowBlur = 0;
    }
    
    drawO(x, y) {
        this.ctx.strokeStyle = '#4ecdc4';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.shadowColor = '#4ecdc4';
        this.ctx.shadowBlur = this.SHADOW_BLUR;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.SYMBOL_SIZE, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
    }
    
    handleClick(e) {
        if (this.gameOver) return;
        
        const index = this.getCellIndexFromEvent(e);
        if (index === null) return;
        
        if (this.board[index] === '') {
            this.makeMove(index);
        }
    }
    
    getCellIndexFromEvent(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scale = this.getCanvasScale();
        const x = (e.clientX - rect.left) * scale.scaleX;
        const y = (e.clientY - rect.top) * scale.scaleY;
        
        const col = Math.floor(x / this.CELL_SIZE);
        const row = Math.floor(y / this.CELL_SIZE);
        
        if (col >= 0 && col < this.BOARD_SIZE && row >= 0 && row < this.BOARD_SIZE) {
            return row * this.BOARD_SIZE + col;
        }
        return null;
    }
    
    makeMove(index) {
        this.board[index] = this.currentPlayer;
        
        if (this.checkWinner()) {
            this.handleWin();
        } else if (this.isBoardFull()) {
            this.handleTie();
        } else {
            this.switchPlayer();
        }
        
        this.drawBoard();
    }
    
    handleWin() {
        this.gameOver = true;
        this.scores[this.currentPlayer]++;
        this.saveScores();
        this.updateDisplay();
        setTimeout(() => this.drawWinningLine(), 100);
    }
    
    handleTie() {
        this.gameOver = true;
        this.scores.tie++;
        this.saveScores();
        this.updateDisplay();
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateDisplay();
    }
    
    handleMouseMove(e) {
        const index = this.getCellIndexFromEvent(e);
        
        if (index !== null) {
            if (this.hoveredCell !== index) {
                this.hoveredCell = index;
                this.drawBoard();
            }
        } else {
            this.handleMouseOut();
        }
    }

    handleMouseOut() {
        if (this.hoveredCell !== -1) {
            this.hoveredCell = -1;
            this.drawBoard();
        }
    }
    
    checkWinner() {
        const winPatterns = this.getWinPatterns();
        
        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.winningPattern = pattern;
                return true;
            }
        }
        return false;
    }
    
    getWinPatterns() {
        return [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
            [0, 4, 8], [2, 4, 6] // diagonais
        ];
    }
    
    isBoardFull() {
        return this.board.every(cell => cell !== '');
    }
    
    drawWinningLine() {
        if (!this.winningPattern) return;
        
        const [a, , c] = this.winningPattern;
        const start = this.getCellCenter(a);
        const end = this.getCellCenter(c);
        
        this.ctx.strokeStyle = '#ffd93d';
        this.ctx.lineWidth = this.WINNING_LINE_WIDTH;
        this.ctx.lineCap = 'round';
        this.ctx.shadowColor = '#ffd93d';
        this.ctx.shadowBlur = this.WINNING_SHADOW_BLUR;
        
        this.drawLine(start.x, start.y, end.x, end.y);
        
        this.ctx.shadowBlur = 0;
    }
    
    updateDisplay() {
        const currentPlayerEl = document.getElementById('currentPlayer');
        const gameStatusEl = document.getElementById('gameStatus');
        
        if (this.gameOver) {
            if (this.winningPattern) {
                currentPlayerEl.textContent = `Jogador ${this.currentPlayer} venceu!`;
                gameStatusEl.textContent = 'Clique em "Novo Jogo" para jogar novamente';
            } else {
                currentPlayerEl.textContent = 'Empate!';
                gameStatusEl.textContent = 'Clique em "Novo Jogo" para jogar novamente';
            }
        } else {
            currentPlayerEl.textContent = `Vez do Jogador: ${this.currentPlayer}`;
            gameStatusEl.textContent = 'Clique em uma célula vazia para jogar';
        }
        
        this.updateScoreDisplay();
    }
    
    updateScoreDisplay() {
        document.getElementById('scoreX').textContent = this.scores.X;
        document.getElementById('scoreO').textContent = this.scores.O;
        document.getElementById('scoreTie').textContent = this.scores.tie;
    }
    
    reset() {
        this.board = Array(this.TOTAL_CELLS).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winningPattern = null;
        this.hoveredCell = -1;
        this.drawBoard();
        this.updateDisplay();
    }
    
    clearScore() {
        this.scores = { X: 0, O: 0, tie: 0 };
        this.saveScores();
        this.updateDisplay();
    }
    
    saveScores() {
        localStorage.setItem('ticTacToeScores', JSON.stringify(this.scores));
    }
    
    loadScores() {
        const savedScores = localStorage.getItem('ticTacToeScores');
        if (savedScores) {
            try {
                this.scores = JSON.parse(savedScores);
            } catch (e) {
                this.scores = { X: 0, O: 0, tie: 0 };
            }
        } else {
            this.scores = { X: 0, O: 0, tie: 0 };
        }
    }
}

// Inicializar o jogo
let game;

window.onload = function() {
    game = new TicTacToe();
};

function resetGame() {
    game.reset();
}

function clearScore() {
    game.clearScore();
}