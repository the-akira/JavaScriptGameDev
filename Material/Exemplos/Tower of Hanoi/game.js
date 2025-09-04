class HanoiGame {
    constructor() {
        this.disks = 5;
        this.towers = [[], [], []];
        this.moves = 0;
        this.startTime = null;
        this.gameTime = 0;
        this.timer = null;
        this.autoSolving = false;
        this.autoSolvePaused = false;
        this.autoSolveSpeed = 500;
        this.solutionSteps = [];
        this.currentStep = 0;
        this.autoSolveInterval = null; // Novo: para controlar o intervalo do auto-solve
        this.dragEnterCounters = [0, 0, 0];
        
        this.colors = [
            '#A52A2A', '#8B4513', '#CD853F', '#D2691E', '#DAA520',
            '#B8860B', '#BC8F8F', '#F4A460', '#DEB887', '#D2B48C'
        ];
        
        this.init();
    }

    init() {
        this.setupGame();
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupGame() {
        const difficulty = document.getElementById('difficulty').value;
        this.disks = parseInt(difficulty);
        this.towers = [[], [], []];
        this.moves = 0;
        this.gameTime = 0;
        this.startTime = null;
        
        // CORREÇÃO: Limpar todos os timers e estados
        this.clearAllTimers();
        this.resetAutoSolveState();
        
        // Criar discos na primeira torre
        for (let i = this.disks; i >= 1; i--) {
            this.towers[0].push(i);
        }
        
        this.renderTowers();
        this.updateMathInfo();
        this.updateDisplay();
        this.updateTimeDisplay();
    }

    // NOVO: Método para limpar todos os timers
    clearAllTimers() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (this.autoSolveInterval) {
            clearTimeout(this.autoSolveInterval);
            this.autoSolveInterval = null;
        }
    }

    // NOVO: Método para resetar completamente o estado do auto-solve
    resetAutoSolveState() {
        this.autoSolving = false;
        this.autoSolvePaused = false;
        this.solutionSteps = [];
        this.currentStep = 0;
        
        // Resetar interface do auto-solve
        document.getElementById('autoControls').style.display = 'none';
        document.getElementById('autoSolveBtn').textContent = 'Resolver Automaticamente';
        document.getElementById('autoSolveBtn').disabled = false;
        document.getElementById('pauseBtn').textContent = 'Pausar';
    }

    setupEventListeners() {
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        
        speedSlider.addEventListener('input', (e) => {
            this.autoSolveSpeed = parseInt(e.target.value);
            speedValue.textContent = this.autoSolveSpeed + 'ms';
        });
    }

    renderTowers() {
        const towersContainer = document.getElementById('towers');
        const towers = towersContainer.querySelectorAll('.tower');
        
        towers.forEach((tower, index) => {
            // Limpar discos existentes
            const existingDisks = tower.querySelectorAll('.disk');
            existingDisks.forEach(disk => disk.remove());
            
            // Adicionar discos atuais
            this.towers[index].forEach((diskSize) => {
                const disk = this.createDisk(diskSize);
                tower.appendChild(disk);
            });
        });
    }

    createDisk(size) {
        const disk = document.createElement('div');
        disk.className = 'disk';
        disk.draggable = true;
        disk.dataset.size = size;
        
        const width = 60 + (size * 20);
        disk.style.width = width + 'px';
        disk.style.background = `linear-gradient(45deg, ${this.colors[size-1]}, ${this.adjustBrightness(this.colors[size-1], -20)})`;
        
        // CORREÇÃO: Só adicionar event listeners se não estiver em auto-solve
        if (!this.autoSolving) {
            disk.addEventListener('dragstart', (e) => this.handleDragStart(e));
            disk.addEventListener('dragend', (e) => this.handleDragEnd(e));
        }
        
        return disk;
    }

    adjustBrightness(hex, percent) {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    handleDragStart(e) {
        if (this.autoSolving) {
            e.preventDefault();
            return;
        }
        
        const disk = e.target;
        const tower = disk.parentElement;
        const towerIndex = parseInt(tower.dataset.tower);
        
        // Verificar se é o disco do topo
        if (this.towers[towerIndex][this.towers[towerIndex].length - 1] != disk.dataset.size) {
            e.preventDefault();
            return;
        }
        
        disk.classList.add('dragging');
        e.dataTransfer.setData('text/plain', JSON.stringify({
            size: disk.dataset.size,
            fromTower: towerIndex
        }));
        
        // Inicializar contadores para cada torre
        this.dragEnterCounters = [0, 0, 0];
        
        // Adicionar drop zones
        document.querySelectorAll('.tower').forEach((t, index) => {
            t.addEventListener('dragover', this.handleDragOver.bind(this));
            t.addEventListener('drop', this.handleDrop.bind(this));
            t.addEventListener('dragenter', this.handleDragEnter.bind(this));
            t.addEventListener('dragleave', this.handleDragLeave.bind(this));
        });
    }

    handleDragEnter(e) {
        e.preventDefault();
        const tower = e.currentTarget;
        const towerIndex = parseInt(tower.dataset.tower);

        if (this.autoSolving) {
            e.preventDefault();
            return;
        }
        
        // Incrementar contador para esta torre
        this.dragEnterCounters[towerIndex]++;
        
        // Adicionar visual de drop zone
        tower.classList.add('drop-zone');
    }

    handleDragLeave(e) {
        e.preventDefault();
        const tower = e.currentTarget;
        const towerIndex = parseInt(tower.dataset.tower);
        
        // Decrementar contador para esta torre
        this.dragEnterCounters[towerIndex]--;
        
        // Só remover a classe se o contador chegou a zero
        // (significa que realmente saiu da torre)
        if (this.dragEnterCounters[towerIndex] <= 0) {
            this.dragEnterCounters[towerIndex] = 0;
            tower.classList.remove('drop-zone');
        }
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        
        // Limpar todas as torres e event listeners
        document.querySelectorAll('.tower').forEach(t => {
            t.classList.remove('drop-zone');
            t.removeEventListener('dragover', this.handleDragOver);
            t.removeEventListener('drop', this.handleDrop);
            t.removeEventListener('dragenter', this.handleDragEnter);
            t.removeEventListener('dragleave', this.handleDragLeave);
        });
        
        // Limpar contadores
        this.dragEnterCounters = [0, 0, 0];
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e) {
        if (this.autoSolving) {
            e.preventDefault();
            return;
        }
        
        e.preventDefault();
        const tower = e.currentTarget;
        const toTower = parseInt(tower.dataset.tower);
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const diskSize = parseInt(data.size);
        const fromTower = data.fromTower;
        
        tower.classList.remove('drop-zone');
        
        if (this.isValidMove(fromTower, toTower)) {
            this.makeMove(fromTower, toTower);
        } else {
            // Animação de movimento inválido
            const disk = document.querySelector(`[data-size="${diskSize}"]`);
            disk.classList.add('invalid-move');
            setTimeout(() => disk.classList.remove('invalid-move'), 500);
        }
    }

    isValidMove(from, to) {
        if (this.towers[from].length === 0) return false;
        if (this.towers[to].length === 0) return true;
        
        const topFrom = this.towers[from][this.towers[from].length - 1];
        const topTo = this.towers[to][this.towers[to].length - 1];
        
        return topFrom < topTo;
    }

    makeMove(from, to) {
        const disk = this.towers[from].pop();
        this.towers[to].push(disk);
        this.moves++;
        
        if (this.startTime === null) {
            this.startTime = Date.now();
            this.startTimer();
        }
        
        this.renderTowers();
        this.updateDisplay();
        
        if (this.checkWin()) {
            this.handleWin();
        }
    }

    startTimer() {
        // CORREÇÃO: Verificar se já existe um timer antes de criar
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            if (!this.autoSolvePaused) { // CORREÇÃO: Pausar timer durante auto-solve pausado
                this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
                this.updateTimeDisplay();
            }
        }, 1000);
    }

    updateTimeDisplay() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        document.getElementById('time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateDisplay() {
        document.getElementById('moves').textContent = this.moves;
        
        const minMoves = Math.pow(2, this.disks) - 1;
        let efficiency;
        
        if (this.moves === 0) {
            efficiency = 100;
        } else if (this.moves < minMoves) {
            efficiency = 100;
        } else {
            efficiency = Math.round((minMoves / this.moves) * 100);
            efficiency = Math.min(efficiency, 100);
        }
        
        document.getElementById('efficiency').textContent = efficiency + '%';
    }

    updateMathInfo() {
        const minMoves = Math.pow(2, this.disks) - 1;
        document.getElementById('minMoves').textContent = minMoves;
        document.getElementById('currentDisks').textContent = this.disks;
        document.getElementById('currentDisks2').textContent = this.disks;
        document.getElementById('formulaResult').textContent = minMoves;
    }

    checkWin() {
        return this.towers[2].length === this.disks;
    }

    handleWin() {
        // CORREÇÃO: Parar auto-solve se estiver ativo
        if (this.autoSolving) {
            this.stopAutoSolve();
        }
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        const finalTime = this.gameTime;
        const minMoves = Math.pow(2, this.disks) - 1;
        const efficiency = Math.round((minMoves / this.moves) * 100);
        
        document.getElementById('finalStats').innerHTML = `
            <b>Movimentos:</b> ${this.moves} (mínimo: ${minMoves})<br>
            <b>Tempo:</b> ${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}<br>
            <b>Eficiência:</b> ${efficiency}%
        `;
        
        document.getElementById('overlay').style.display = 'block';
        document.getElementById('successMessage').style.display = 'block';
    }

    // Solução automática usando algoritmo recursivo
    solveHanoi(n, from, to, aux) {
        if (n === 1) {
            this.solutionSteps.push([from, to]);
        } else {
            this.solveHanoi(n - 1, from, aux, to);
            this.solutionSteps.push([from, to]);
            this.solveHanoi(n - 1, aux, to, from);
        }
    }

    // Novo resolvedor: encontra solução a partir de qualquer estado
    solveFromState() {
        const goal = [[], [], []];
        for (let i = this.disks; i >= 1; i--) goal[2].push(i);

        const startKey = JSON.stringify(this.towers);
        const goalKey = JSON.stringify(goal);

        let queue = [{ state: this.towers.map(t => [...t]), moves: [] }];
        let visited = new Set([startKey]);

        while (queue.length > 0) {
            let { state, moves } = queue.shift();

            // Chegou na solução
            if (JSON.stringify(state) === goalKey) {
                return moves;
            }

            // Testar todos os movimentos possíveis
            for (let from = 0; from < 3; from++) {
                if (state[from].length === 0) continue;
                let disk = state[from][state[from].length - 1];

                for (let to = 0; to < 3; to++) {
                    if (from === to) continue;

                    if (
                        state[to].length === 0 ||
                        disk < state[to][state[to].length - 1]
                    ) {
                        // Gerar novo estado
                        let newState = state.map(t => [...t]);
                        newState[to].push(newState[from].pop());

                        let key = JSON.stringify(newState);
                        if (!visited.has(key)) {
                            visited.add(key);
                            queue.push({
                                state: newState,
                                moves: [...moves, [from, to]]
                            });
                        }
                    }
                }
            }
        }
        return null; // não encontrou solução (teoricamente não deve acontecer)
    }

    // CORREÇÃO: Refatoração completa do auto-solve para melhor controle
    async autoSolve() {
        this.autoSolving = true;
        this.autoSolvePaused = false;
        this.solutionSteps = [];
        this.currentStep = 0;
        
        document.getElementById('autoControls').style.display = 'block';
        document.getElementById('autoSolveBtn').textContent = 'Resolvendo...';
        document.getElementById('autoSolveBtn').disabled = true;
        
        this.solutionSteps = this.solveFromState();
        
        if (this.solutionSteps && this.solutionSteps.length > 0) {
            this.executeAutoSolveSteps();
        } else {
            this.stopAutoSolve();
        }
    }

    // NOVO: Método separado para executar os passos do auto-solve
    async executeAutoSolveSteps() {
        for (let i = 0; i < this.solutionSteps.length; i++) {
            if (!this.autoSolving) break;
            
            // Aguardar se pausado
            while (this.autoSolvePaused && this.autoSolving) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (!this.autoSolving) break; // Verificar novamente após pausa
            
            const [from, to] = this.solutionSteps[i];
            this.makeMove(from, to);
            
            // CORREÇÃO: Usar setTimeout em vez de Promise para melhor controle
            if (i < this.solutionSteps.length - 1) { // Não esperar no último movimento
                await new Promise(resolve => {
                    this.autoSolveInterval = setTimeout(resolve, this.autoSolveSpeed);
                });
            }
        }
        
        if (this.autoSolving) {
            this.stopAutoSolve();
        }
    }

    // CORREÇÃO: Método melhorado para parar auto-solve
    stopAutoSolve() {
        // CORREÇÃO: Se estava pausado, ajustar o tempo antes de parar
        if (this.autoSolvePaused && this.pauseStartTime && this.startTime) {
            const pauseDuration = Date.now() - this.pauseStartTime;
            this.startTime += pauseDuration;
            this.pauseStartTime = null;
        }
        
        this.autoSolving = false;
        this.autoSolvePaused = false;
        
        // Limpar timeout pendente
        if (this.autoSolveInterval) {
            clearTimeout(this.autoSolveInterval);
            this.autoSolveInterval = null;
        }
        
        document.getElementById('autoControls').style.display = 'none';
        document.getElementById('autoSolveBtn').textContent = 'Resolver Automaticamente';
        document.getElementById('autoSolveBtn').disabled = false;
        document.getElementById('pauseBtn').textContent = 'Pausar';
        
        // CORREÇÃO: Re-renderizar para adicionar event listeners de drag
        this.renderTowers();
    }

    pauseAutoSolve() {
        if (!this.autoSolving) return;
        
        this.autoSolvePaused = !this.autoSolvePaused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.autoSolvePaused ? 'Continuar' : 'Pausar';
        
        // CORREÇÃO: Pausar/continuar o timer do jogo também
        if (this.autoSolvePaused) {
            // Pausar: ajustar startTime para compensar o tempo pausado
            this.pauseStartTime = Date.now();
        } else {
            // Continuar: ajustar startTime
            if (this.pauseStartTime && this.startTime) {
                const pauseDuration = Date.now() - this.pauseStartTime;
                this.startTime += pauseDuration;
            }
            this.pauseStartTime = null;
        }
    }
}

// Instância global do jogo
let game = new HanoiGame();

// Funções globais para os botões
function newGame() {
    // CORREÇÃO: Parar auto-solve completamente antes de criar novo jogo
    if (game.autoSolving) {
        game.stopAutoSolve();
    }
    game.clearAllTimers(); // NOVO: Garantir que todos os timers são limpos
    game.setupGame();
}

function resetGame() {
    // CORREÇÃO: Parar auto-solve completamente antes de resetar
    if (game.autoSolving) {
        game.stopAutoSolve();
    }
    game.clearAllTimers(); // NOVO: Garantir que todos os timers são limpos
    game.startTime = null;
    game.gameTime = 0;
    game.setupGame();
}

function toggleAutoSolve() {
    if (game.autoSolving) {
        game.stopAutoSolve();
    } else {
        game.autoSolve();
    }
}

function pauseAutoSolve() {
    game.pauseAutoSolve();
}

function stopAutoSolve() {
    game.stopAutoSolve();
}

function hideSuccess() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

// Event listener para mudança de dificuldade
document.getElementById('difficulty').addEventListener('change', () => {
    resetGame();
});