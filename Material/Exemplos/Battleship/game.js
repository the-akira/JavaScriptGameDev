const GRID_SIZE = 10;
const CELL_SIZE = 40;
const SHIPS = [
    { name: 'Porta-aviões', size: 5 },
    { name: 'Encouraçado', size: 4 },
    { name: 'Cruzador', size: 3 },
    { name: 'Submarino', size: 3 },
    { name: 'Submarino', size: 3 },
    { name: 'Destroyer', size: 2 }
];
const ENEMY_TURN_DELAY = 1500;

class Board {
    constructor() {
        this.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
        this.ships = [];
        this.hits = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(false));
        this.misses = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(false));
    }

    canPlaceShip(x, y, size, isHorizontal) {
        // Verifica se a posição inicial está dentro dos limites
        if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return false;

        if (isHorizontal) {
            if (x + size > GRID_SIZE) return false;
            for (let i = 0; i < size; i++) {
                if (this.grid[y]?.[x + i] !== 0) return false;
            }
        } else {
            if (y + size > GRID_SIZE) return false;
            for (let i = 0; i < size; i++) {
                if (this.grid[y + i]?.[x] !== 0) return false;
            }
        }
        return true;
    }

    placeShip(x, y, size, isHorizontal) {
        const ship = { x, y, size, isHorizontal, hits: 0 };
        this.ships.push(ship);
        
        if (isHorizontal) {
            for (let i = 0; i < size; i++) {
                this.grid[y][x + i] = this.ships.length;
            }
        } else {
            for (let i = 0; i < size; i++) {
                this.grid[y + i][x] = this.ships.length;
            }
        }
        return true;
    }

    attack(x, y) {
        if (this.hits[y][x] || this.misses[y][x]) {
            return 'already';
        }

        if (this.grid[y][x] > 0) {
            this.hits[y][x] = true;
            const shipIndex = this.grid[y][x] - 1;
            this.ships[shipIndex].hits++;
            
            if (this.ships[shipIndex].hits === this.ships[shipIndex].size) {
                return 'sunk';
            }
            return 'hit';
        } else {
            this.misses[y][x] = true;
            return 'miss';
        }
    }

    allShipsSunk() {
        return this.ships.every(ship => ship.hits === ship.size);
    }

    getRemainingShips() {
        return this.ships.filter(ship => ship.hits < ship.size).length;
    }
}

class Game {
    constructor() {
        this.playerBoard = new Board();
        this.enemyBoard = new Board();
        this.playerCanvas = document.getElementById('playerBoard');
        this.enemyCanvas = document.getElementById('enemyBoard');
        this.playerCtx = this.playerCanvas.getContext('2d');
        this.enemyCtx = this.enemyCanvas.getContext('2d');
        this.isHorizontal = true;
        this.placingShipIndex = 0;
        this.gameStarted = false;
        this.playerTurn = true;
        this.enemyTimerFrame = null;    // requestAnimationFrame id
        this.enemyTimeoutId = null;     // setTimeout id para o próximo enemyTurn
        this.turnToken = 0;             // token para invalidar callbacks antigos
        this.clickLocked = false;
        
        this.setupEventListeners();
        this.setupEnemyHoverHighlight();
        this.placeEnemyShips();
        this.draw();
        this.updateCursors();
    }

    setupEventListeners() {
        this.playerCanvas.addEventListener('click', (e) => this.handlePlayerBoardClick(e));
        this.enemyCanvas.addEventListener('click', (e) => this.handleEnemyBoardClick(e));
        
        document.getElementById('rotateBtn').addEventListener('click', () => {
            this.isHorizontal = !this.isHorizontal;
            document.getElementById('rotateBtn').textContent = 
                `Rotacionar (${this.isHorizontal ? 'Horizontal' : 'Vertical'})`;
            this.draw();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });

        this.playerCanvas.addEventListener('mousemove', (e) => {
            if (!this.gameStarted) {
                this.draw();
                this.drawShipPreview(e);
            }
        });

        // Quando o mouse sair do tabuleiro, limpar o preview
        this.playerCanvas.addEventListener('mouseleave', () => {
            if (!this.gameStarted) {
                this.draw(); // redesenha o tabuleiro sem o preview
            }
        });
    }

    setupEnemyHoverHighlight() {
        const canvas = this.enemyCanvas;
        const ctx = this.enemyCtx;
        // guarda a última posição do ponteiro em coordenadas offset (relativas ao canvas)
        this.lastMouseOffset = null;
        
        const onMove = (e) => {
            // atualiza posição atual do ponteiro usando offsetX/offsetY
            this.lastMouseOffset = { offsetX: e.offsetX, offsetY: e.offsetY };
            
            if (!this.gameStarted || !this.playerTurn || this.clickLocked) return;
            
            const x = Math.min(Math.max(0, Math.floor(e.offsetX / CELL_SIZE)), GRID_SIZE - 1);
            const y = Math.min(Math.max(0, Math.floor(e.offsetY / CELL_SIZE)), GRID_SIZE - 1);
            
            // redesenha e aplica destaque
            this.drawBoard(ctx, this.enemyBoard, false);
            ctx.fillStyle = 'rgba(74,144,226,0.15)';
            ctx.fillRect(0, y * CELL_SIZE, (x + 1) * CELL_SIZE, CELL_SIZE); // horizontal até a célula
            ctx.fillRect(x * CELL_SIZE, 0, CELL_SIZE, (y + 1) * CELL_SIZE); // vertical até a célula
            ctx.fillStyle = 'rgba(74,144,226,0.35)';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE); // célula
        };
        
        const onLeave = () => {
            this.lastMouseOffset = null;
            this.drawBoard(ctx, this.enemyBoard, false);
        };
        
        // listeners (mousemove guarda coords e desenha; mouseleave limpa)
        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseleave', onLeave);
        
        // função usada para redesenhar quando a vez volta (usa a posição real do ponteiro)
        this.redrawEnemyHover = () => {
            // só redesenha se realmente for a vez do jogador e ponteiro sobre o canvas
            if (!this.gameStarted || !this.playerTurn || this.clickLocked) return;
            
            if (!this.lastMouseOffset) {
                // nada conhecido — redesenha normal
                this.drawBoard(ctx, this.enemyBoard, false);
                return;
            }
            
            const { offsetX, offsetY } = this.lastMouseOffset;
            
            // calcula coordenadas usando os valores offset salvos
            const x = Math.min(Math.max(0, Math.floor(offsetX / CELL_SIZE)), GRID_SIZE - 1);
            const y = Math.min(Math.max(0, Math.floor(offsetY / CELL_SIZE)), GRID_SIZE - 1);
            
            this.drawBoard(ctx, this.enemyBoard, false);
            ctx.fillStyle = 'rgba(74,144,226,0.15)';
            ctx.fillRect(0, y * CELL_SIZE, (x + 1) * CELL_SIZE, CELL_SIZE);
            ctx.fillRect(x * CELL_SIZE, 0, CELL_SIZE, (y + 1) * CELL_SIZE);
            ctx.fillStyle = 'rgba(74,144,226,0.35)';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        };
    }

    drawShipPreview(e) {
        if (this.placingShipIndex >= SHIPS.length) return;
        
        const gridX = Math.min(Math.max(0, Math.floor(e.offsetX / CELL_SIZE)), GRID_SIZE - 1);
        const gridY = Math.min(Math.max(0, Math.floor(e.offsetY / CELL_SIZE)), GRID_SIZE - 1);
        
        const ship = SHIPS[this.placingShipIndex];
        const canPlace = this.playerBoard.canPlaceShip(gridX, gridY, ship.size, this.isHorizontal);
        
        this.playerCtx.globalAlpha = 0.5;
        this.playerCtx.fillStyle = canPlace ? '#4a90e2' : '#ff6b6b';
        
        if (this.isHorizontal) {
            for (let i = 0; i < ship.size && gridX + i < GRID_SIZE; i++) {
                this.playerCtx.fillRect(
                    (gridX + i) * CELL_SIZE + 1,
                    gridY * CELL_SIZE + 1,
                    CELL_SIZE - 2,
                    CELL_SIZE - 2
                );
            }
        } else {
            for (let i = 0; i < ship.size && gridY + i < GRID_SIZE; i++) {
                this.playerCtx.fillRect(
                    gridX * CELL_SIZE + 1,
                    (gridY + i) * CELL_SIZE + 1,
                    CELL_SIZE - 2,
                    CELL_SIZE - 2
                );
            }
        }
        this.playerCtx.globalAlpha = 1;
    }

    handlePlayerBoardClick(e) {
        if (this.gameStarted) return;

        const x = Math.min(Math.max(0, Math.floor(e.offsetX / CELL_SIZE)), GRID_SIZE - 1);
        const y = Math.min(Math.max(0, Math.floor(e.offsetY / CELL_SIZE)), GRID_SIZE - 1);

        if (this.placingShipIndex < SHIPS.length) {
            const ship = SHIPS[this.placingShipIndex];
            if (this.playerBoard.canPlaceShip(x, y, ship.size, this.isHorizontal)) {
                this.playerBoard.placeShip(x, y, ship.size, this.isHorizontal);
                this.placingShipIndex++;
                this.updateShipCounts();

                // Atualiza contador de navios posicionados
                document.getElementById('playerShips').textContent = this.placingShipIndex;

                if (this.placingShipIndex >= SHIPS.length) {
                    this.gameStarted = true;
                    this.updateStatus('Jogo iniciado! Sua vez de atacar!');
                    document.getElementById('rotateBtn').disabled = true;
                    this.updateShipCounts(); // Agora passa a mostrar navios restantes
                    this.updateCursors();
                } else {
                    this.updateStatus(`Posicione seu ${SHIPS[this.placingShipIndex].name} (${SHIPS[this.placingShipIndex].size} células)`);
                }
                this.draw();
            }
        }
    }

    handleEnemyBoardClick(e) {
        if (!this.gameStarted || !this.playerTurn || this.clickLocked) return;
        
        const x = Math.min(Math.max(0, Math.floor(e.offsetX / CELL_SIZE)), GRID_SIZE - 1);
        const y = Math.min(Math.max(0, Math.floor(e.offsetY / CELL_SIZE)), GRID_SIZE - 1);
        
        const result = this.enemyBoard.attack(x, y);
        
        if (result === 'already') {
            this.updateStatus('Você já atacou essa posição!');
            return;
        }
        
        if (result === 'hit') {
            this.updateStatus('Acertou! Ataque novamente!');
        } else if (result === 'sunk') {
            this.updateStatus('Afundou um navio inimigo! Ataque novamente!');
        } else {
            this.updateStatus('Água! Vez do inimigo...');
            this.playerTurn = false;
            this.updateCursors();
            this.startEnemyTurnTimer(ENEMY_TURN_DELAY);
            const currentToken = this.turnToken;
            this.enemyTimeoutId = setTimeout(() => {
                if (this.turnToken !== currentToken) return;
                this.enemyTimeoutId = null;
                this.enemyTurn();
            }, ENEMY_TURN_DELAY);
        }
        
        this.draw();
        this.updateShipCounts();
        
        if (this.enemyBoard.allShipsSunk()) {
            this.updateStatus('VITÓRIA! Você destruiu toda a frota inimiga!');
            this.gameStarted = false;
        }
    }

    startEnemyTurnTimer(durationMs) {
        // invalida timeouts antigos e cancela animação
        if (this.enemyTimerFrame) {
            cancelAnimationFrame(this.enemyTimerFrame);
            this.enemyTimerFrame = null;
        }
        if (this.enemyTimeoutId) {
            clearTimeout(this.enemyTimeoutId);
            this.enemyTimeoutId = null;
        }

        // captura token atual — qualquer callback agendado mais tarde verifica esse token
        const currentToken = this.turnToken;

        const bar = document.getElementById('enemyTurnBar');
        const container = document.querySelector('.turn-timer');

        // Mostra o container e força reset visual (sem transição)
        container.style.display = 'block';
        bar.style.transition = 'none';
        bar.style.width = '0%';
        bar.offsetHeight; // força reflow
        bar.style.transition = 'width 0.08s linear';

        const startTime = performance.now();

        const animate = (now) => {
            // Se o token mudou (reset aconteceu), aborta a animação
            if (this.turnToken !== currentToken) {
                // garante que a barra termine resetada e container oculto
                bar.style.transition = 'none';
                bar.style.width = '0%';
                container.style.display = 'none';
                bar.offsetHeight;
                bar.style.transition = 'width 0.08s linear';
                this.enemyTimerFrame = null;
                return;
            }

            const elapsed = now - startTime;
            const progress = Math.min((elapsed / durationMs) * 100, 100);
            bar.style.width = progress + '%';

            if (progress < 100) {
                this.enemyTimerFrame = requestAnimationFrame(animate);
            } else {
                this.enemyTimerFrame = null;
                // pequena pausa para a barra completar visualmente
                setTimeout(() => {
                    if (this.turnToken !== currentToken) return; // checa token de novo
                    container.style.display = 'none';
                    bar.style.width = '0%';
                }, 120);
            }
        };

        this.enemyTimerFrame = requestAnimationFrame(animate);
    }

    enemyTurn() {
        if (!this.gameStarted) return;

        if (this.enemyTimeoutId) {
            clearTimeout(this.enemyTimeoutId);
            this.enemyTimeoutId = null;
        }
        
        let x, y;
        do {
            x = Math.floor(Math.random() * GRID_SIZE);
            y = Math.floor(Math.random() * GRID_SIZE);
        } while (this.playerBoard.hits[y][x] || this.playerBoard.misses[y][x]);
        
        const result = this.playerBoard.attack(x, y);
        
        if (result === 'hit') {
            this.updateStatus('Inimigo acertou seu navio! Ele ataca novamente...');
            this.draw();
            this.updateShipCounts();
            this.turnToken++;
            const currentToken = this.turnToken;
            this.startEnemyTurnTimer(ENEMY_TURN_DELAY);
            this.enemyTimeoutId = setTimeout(() => {
                if (this.turnToken !== currentToken) return;
                this.enemyTimeoutId = null;
                this.enemyTurn();
            }, ENEMY_TURN_DELAY);
        } else if (result === 'sunk') {
            this.updateStatus('Inimigo afundou um de seus navios! Ele ataca novamente...');
            this.draw();
            this.updateShipCounts();
            this.turnToken++;
            const currentToken = this.turnToken;
            this.startEnemyTurnTimer(ENEMY_TURN_DELAY);
            this.enemyTimeoutId = setTimeout(() => {
                if (this.turnToken !== currentToken) return;
                this.enemyTimeoutId = null;
                this.enemyTurn();
            }, ENEMY_TURN_DELAY);
        } else {
            this.updateStatus('O inimigo errou! Sua vez de atacar!');
            // Bloqueia brevemente cliques, mas mantém cursor ativo
            this.clickLocked = true;
            this.updateCursors(); // mantém aparência correta

            setTimeout(() => {
                this.clickLocked = false;
                this.playerTurn = true;
                this.updateCursors();
                this.draw();
                this.updateShipCounts();
                this.redrawEnemyHover();
            }, 250); // pequena pausa até a barra sumir
        }
        
        if (this.playerBoard.allShipsSunk()) {
            this.updateStatus('DERROTA! O inimigo destruiu sua frota!');
            this.gameStarted = false;
        }
    }

    placeEnemyShips() {
        for (const ship of SHIPS) {
            let placed = false;
            while (!placed) {
                const x = Math.floor(Math.random() * GRID_SIZE);
                const y = Math.floor(Math.random() * GRID_SIZE);
                const isHorizontal = Math.random() > 0.5;
                
                if (this.enemyBoard.canPlaceShip(x, y, ship.size, isHorizontal)) {
                    this.enemyBoard.placeShip(x, y, ship.size, isHorizontal);
                    placed = true;
                }
            }
        }
    }

    drawBoard(ctx, board, showShips) {
        ctx.fillStyle = '#e8f4f8';
        ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
        
        // Grid lines
        ctx.strokeStyle = '#b0c4de';
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
            ctx.stroke();
        }
        
        // Ships
        if (showShips) {
            ctx.fillStyle = '#4a90e2';
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (board.grid[y][x] > 0) {
                        ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                    }
                }
            }
        }
        
        // Hits
        ctx.fillStyle = '#ff6b6b';
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (board.hits[y][x]) {
                    ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('X', x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
                    ctx.fillStyle = '#ff6b6b';
                }
            }
        }
        
        // Misses
        ctx.fillStyle = '#95a5a6';
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (board.misses[y][x]) {
                    ctx.beginPath();
                    ctx.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    draw() {
        this.drawBoard(this.playerCtx, this.playerBoard, true);
        this.drawBoard(this.enemyCtx, this.enemyBoard, false);
    }

    updateCursors() {
        if (!this.gameStarted) {
            // Fase de posicionamento
            this.playerCanvas.style.cursor = 'pointer'; // mãozinha
            this.enemyCanvas.style.cursor = 'not-allowed';
        } else {
            // Fase de batalha
            if (this.playerTurn) {
                // Vez do jogador
                this.playerCanvas.style.cursor = 'not-allowed';
                this.enemyCanvas.style.cursor = 'crosshair';
            } else {
                // Vez do inimigo
                this.playerCanvas.style.cursor = 'not-allowed';
                this.enemyCanvas.style.cursor = 'not-allowed';
            }
        }
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }

    updateShipCounts() {
        const playerRemaining = this.playerBoard.getRemainingShips();
        const enemyRemaining = this.enemyBoard.getRemainingShips();

        document.getElementById('playerShips').textContent = playerRemaining;
        document.getElementById('enemyShips').textContent = enemyRemaining;

        const playerBar = document.getElementById('playerProgress');
        const enemyBar = document.getElementById('enemyProgress');

        // Se o jogo ainda não começou → a barra do jogador mostra progresso de colocação
        if (!this.gameStarted) {
            const placed = this.placingShipIndex;
            const progress = (placed / SHIPS.length) * 100;
            playerBar.style.width = progress + '%';
            playerBar.style.background = 'linear-gradient(90deg, #2a5298, #4a90e2)';
        } else {
            // Após o início → barra mostra navios restantes
            const playerProgress = (playerRemaining / SHIPS.length) * 100;
            const enemyProgress = (enemyRemaining / SHIPS.length) * 100;

            playerBar.style.width = playerProgress + '%';
            enemyBar.style.width = enemyProgress + '%';

            // Cor dinâmica
            playerBar.style.background = playerRemaining <= 2
                ? 'linear-gradient(90deg, #ff6b6b, #e74c3c)'
                : 'linear-gradient(90deg, #2a5298, #4a90e2)';

            enemyBar.style.background = enemyRemaining <= 2
                ? 'linear-gradient(90deg, #ff6b6b, #e74c3c)'
                : 'linear-gradient(90deg, #2a5298, #4a90e2)';
        }
    }

    reset() {
        // incrementa token para invalidar qualquer callback/timer/animation anteriores
        this.turnToken++;

        // Cancela animação da barra
        if (this.enemyTimerFrame) {
            cancelAnimationFrame(this.enemyTimerFrame);
            this.enemyTimerFrame = null;
        }

        // Cancela qualquer setTimeout ativo (ataques inimigos agendados)
        if (this.enemyTimeoutId) {
            clearTimeout(this.enemyTimeoutId);
            this.enemyTimeoutId = null;
        }

        // Recria o estado do jogo
        this.playerBoard = new Board();
        this.enemyBoard = new Board();
        this.isHorizontal = true;
        this.placingShipIndex = 0;
        this.gameStarted = false;
        this.playerTurn = true;

        // Reseta barras de progresso visuais (navios)
        const playerBar = document.getElementById('playerProgress');
        const enemyBar = document.getElementById('enemyProgress');
        playerBar.style.transition = 'none';
        enemyBar.style.transition = 'none';
        playerBar.style.width = '0%';
        enemyBar.style.width = '100%';
        playerBar.offsetHeight;
        enemyBar.offsetHeight;
        playerBar.style.transition = 'width 0.5s ease';
        enemyBar.style.transition = 'width 0.5s ease';
        playerBar.style.background = 'linear-gradient(90deg, #2a5298, #4a90e2)';
        enemyBar.style.background = 'linear-gradient(90deg, #2a5298, #4a90e2)';

        // Botões
        const rotateBtn = document.getElementById('rotateBtn');
        rotateBtn.disabled = false;
        rotateBtn.textContent = `Rotacionar (${this.isHorizontal ? 'Horizontal' : 'Vertical'})`;

        // Reseta a barra de turno inimigo corretamente
        const container = document.querySelector('.turn-timer');
        const bar = document.getElementById('enemyTurnBar');
        bar.style.transition = 'none';
        bar.style.width = '0%';
        container.style.display = 'none';
        bar.offsetHeight;
        bar.style.transition = 'width 0.08s linear';

        // Reposiciona e redesenha tudo
        this.placeEnemyShips();
        this.draw();
        this.updateShipCounts();
        this.updateCursors();
        this.updateStatus(`Posicione seu ${SHIPS[0].name} (${SHIPS[0].size} células)`);
    }
}

const game = new Game();
game.updateStatus(`Posicione seu ${SHIPS[0].name} (${SHIPS[0].size} células)`);
game.updateShipCounts();