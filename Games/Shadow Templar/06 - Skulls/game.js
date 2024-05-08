// Objeto contendo os URLs dos mapas
const mapURLs = {
    map1: 'https://gist.githubusercontent.com/the-akira/427e8063e1828c09d4c135bf6d0700fe/raw/2a08154aa652d3b957b232d71e771b10bdab5750/gameMapSkull1.csv',
    map2: 'https://gist.githubusercontent.com/the-akira/6dcd3eac16d67d3461dc37bca051a78c/raw/2297052e926afd2d79a7648e5ddfa5fbf560f3c6/gameMapSkull2.csv',
};

// Método para obter o URL do mapa com base no nome do mapa
function getMapURL(mapName) {
    return mapURLs[mapName];
}

class Player {
    constructor(game) {
        this.game = game;
        this.width = 32; // Largura do jogador
        this.height = 44; // Altura do jogador
        this.x = 50; // Posição inicial do jogador no eixo X
        this.y = 50; // Posição inicial do jogador no eixo Y
        this.velX = 0; // Velocidade inicial do jogador no eixo X
        this.velY = 0; // Velocidade inicial do jogador no eixo Y
        this.jumpStrength = -16; // Força do pulo
        this.gravity = 0.8; // Gravidade ajustada para proporcionar uma sensação de pulo mais suave
        this.grounded = false; // Indica se o jogador está no chão
        // Definir as teclas de controle e adicionar os event listeners
        this.controls = {ArrowLeft: false, ArrowRight: false, Space: false};
        this.playerImg = new Image();
        this.playerImg.src = 'assets/player.png';
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        this.update = this.update.bind(this);
        this.draw = this.draw.bind(this);
        this.direction = "right";
    }

    handleKeyDown(event) {
        if (event.code in this.controls) {
            event.preventDefault();
            this.controls[event.code] = true;
        }
    }

    handleKeyUp(event) {
        if (event.code in this.controls) {
            event.preventDefault();
            this.controls[event.code] = false;
        }
    }

    onGround(tileY) {
        const playerBottom = this.y + this.height;
        return playerBottom >= tileY * this.game.tileSize && playerBottom <= (tileY + 1) * this.game.tileSize;
    }

    checkPortalCollision() {
        for (let y = 0; y < this.game.map.length; y++) {
            for (let x = 0; x < this.game.map[y].length; x++) {
                const tile = this.game.map[y][x];
                // Verifica se o tile é um portal
                if (tile === 2) {
                    const portalX = x * this.game.tileSize;
                    const portalY = y * this.game.tileSize;
                    // Verifica se houve colisão entre o jogador e o portal
                    if (
                        this.x + this.width > portalX &&
                        this.x < portalX + this.game.tileSize &&
                        this.y + this.height > portalY &&
                        this.y < portalY + this.game.tileSize
                    ) {
                        if (portalX === 1856 && portalY === 1152 && this.game.currentMap === getMapURL('map1')) {
                            this.game.loadMap(getMapURL('map2'));
                        }
                        else if (portalX === 32 && portalY === 128 && this.game.currentMap === getMapURL('map2')) {
                            this.game.loadMap(getMapURL('map1'));
                        }
                    }
                }
            }
        }
    }

    checkSkullCollision() {
        for (let y = 0; y < this.game.map.length; y++) {
            for (let x = 0; x < this.game.map[y].length; x++) {
                const tile = this.game.map[y][x];
                // Verifica se o tile é um portal
                if (tile === 3) {
                    const skullX = x * this.game.tileSize;
                    const skullY = y * this.game.tileSize;
                    // Verifica se houve colisão entre o jogador e o portal
                    if (
                        this.x + this.width > skullX &&
                        this.x < skullX + this.game.tileSize &&
                        this.y + this.height > skullY &&
                        this.y < skullY + this.game.tileSize
                    ) {
                        this.game.map[y][x] = -1;
                        this.game.removeSkull(x, y);
                    }
                }
            }
        }
    }

    update() {
        this.checkPortalCollision();
        this.checkSkullCollision();
        // Movimento horizontal
        if (this.controls.ArrowLeft) {
            this.velX = -5; // Movimento para a esquerda
            this.direction = "left";
        } else if (this.controls.ArrowRight) {
            this.velX = 5; // Movimento para a direita
            this.direction = "right";
        } else {
            this.velX = 0; // Nenhuma tecla de movimento pressionada, portanto, parar o movimento horizontal
        }

        // Simular gravidade e pulo
        if (this.controls.Space && this.grounded) {
            this.grounded = false;
            this.velY = this.jumpStrength;
        }

        this.velY += this.gravity;

        // Armazenar os deslocamentos horizontal e vertical
        let deltaX = this.velX;
        let deltaY = this.velY;

        // Tentar mover apenas no eixo X
        this.moveX(deltaX);

        // Tentar mover apenas no eixo Y
        this.moveY(deltaY);

        // Atualiza a câmera (centralizando o jogador)
        this.game.cameraX = Math.max(0, Math.min(this.x - this.game.canvasWidth / 2, this.game.map[0].length * this.game.tileSize - this.game.canvasWidth));
        this.game.cameraY = Math.max(0, Math.min(this.y - this.game.canvasHeight / 2, this.game.map.length * this.game.tileSize - this.game.canvasHeight));
    }

    moveX(deltaX) {
        // Tenta mover no eixo X
        let newX = this.x + deltaX;

        // Limita a posição do jogador dentro da tela
        newX = Math.max(0, Math.min(newX, this.game.map[0].length * this.game.tileSize - this.width));

        // Verifica colisões no eixo X
        const left = Math.floor(newX / this.game.tileSize);
        const right = Math.floor((newX + this.width - 1) / this.game.tileSize);
        const top = Math.floor(this.y / this.game.tileSize);
        const bottom = Math.floor((this.y + this.height - 1) / this.game.tileSize);

        for (let y = top; y <= bottom; y++) {
            if (this.game.map[y] && 
                (this.game.map[y][left] === 1 || this.game.map[y][right] === 1) ||
                (this.game.map[y][left] === 0 || this.game.map[y][right] === 0)) {
                // Colisão detectada, ajusta deltaX
                if (deltaX > 0) {
                    deltaX = (right * this.game.tileSize - this.width) - this.x;
                } else if (deltaX < 0) {
                    deltaX = (left + 1) * this.game.tileSize - this.x;
                }
                this.velX = 0;
                break;
            }
        }

        // Atualiza a posição do jogador no eixo X
        this.x += deltaX;
    }

    moveY(deltaY) {
        // Tenta mover no eixo Y
        let newY = this.y + deltaY;

        // Limita a posição do jogador dentro da tela
        newY = Math.max(0, Math.min(newY, this.game.map.length * this.game.tileSize - this.height));

        // Verifica a colisão com os tiles ao redor do jogador
        const topTileY = Math.floor(newY / this.game.tileSize);
        const bottomTileY = Math.floor((newY + this.height) / this.game.tileSize);
        const leftTileX = Math.floor(this.x / this.game.tileSize);
        const rightTileX = Math.floor((this.x + this.width - 1) / this.game.tileSize);

        // Verifica se o jogador está caindo
        const falling = deltaY > 0;

        // Se o jogador está caindo
        if (falling) {
            let collision = false;
            for (let y = topTileY; y <= bottomTileY; y++) {
                if (this.game.map[y]) {
                    for (let x = leftTileX; x <= rightTileX; x++) {
                        if (this.game.map[y][x] === 1 || this.game.map[y][x] === 0) {
                            // Colisão detectada com o tile abaixo do jogador, ajusta a posição do jogador para a parte superior do tile
                            newY = y * this.game.tileSize - this.height;
                            this.grounded = true;
                            this.velY = 0;
                            collision = true;
                            break;
                        }
                    }
                }
                if (collision) break;
            }
        }
        // Se o jogador está subindo
        else {
            let collision = false;
            for (let y = bottomTileY; y >= topTileY; y--) {
                if (this.game.map[y]) {
                    for (let x = leftTileX; x <= rightTileX; x++) {
                        if (this.game.map[y][x] === 1 || this.game.map[y][x] === 0) {
                            // Colisão detectada com o tile acima do jogador, ajusta a posição do jogador para a parte inferior do tile
                            newY = (y + 1) * this.game.tileSize;
                            this.velY = 0;
                            collision = true;
                            break;
                        }
                    }
                }
                if (collision) break;
            }
            if (!collision) {
                this.grounded = false;
            }
        }

        // Atualiza a posição do jogador no eixo Y
        this.y = newY;
    }

    draw() {
        // Desenhar a imagem do jogador
        // Rotacionar o jogador de acordo com a direção
        if (this.direction === 'right') {
            this.game.ctx.drawImage(this.playerImg, this.x - this.game.cameraX, this.y - this.game.cameraY, this.width, this.height);
        } else {
            this.game.ctx.save(); // Salva o estado do contexto
            this.game.ctx.scale(-1, 1); // Inverte o eixo x
            this.game.ctx.drawImage(this.playerImg, -(this.x + this.width - this.game.cameraX), this.y - this.game.cameraY, this.width, this.height); // Desenha o jogador invertido
            this.game.ctx.restore(); // Restaura o estado do contexto
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        this.tileSize = 32; // Tamanho do tile em pixels
        this.map = []; // Matriz para armazenar o mapa
        this.cameraX = 0; // Posição X da câmera
        this.cameraY = 0; // Posição Y da câmera
        this.loadMap(getMapURL('map1'));
        this.currentMap = getMapURL('map1');
        this.player = new Player(this);
        this.gameLoop();
        this.numTotalTiposTile = 4;
        this.tileImages = [];   
        for (let i = 0; i < this.numTotalTiposTile; i++) {
            const tileImg = new Image();
            tileImg.src = `assets/tile${i}.png`;
            this.tileImages.push(tileImg);
        }
        this.removedSkulls = [];
        this.menuImage = new Image();
        this.menuImage.onload = () => this.drawMenu(); // Desenha o menu quando a imagem é carregada
        this.menuImage.src = 'assets/menu.png'; // Caminho da imagem do menu
        this.menuActive = true; // Indica se o menu está ativo
        this.paused = false; // Estado de pausa inicial
        this.pauseMenuImage = new Image();
        this.pauseMenuImage.onload = () => this.drawPauseMenu(); // Desenha o menu de pausa quando a imagem é carregada
        this.pauseMenuImage.src = 'assets/pause.png'; // Caminho da imagem do menu de pausa
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    }

    // Método para carregar o mapa do arquivo CSV
    loadMap(mapUrl) {
        this.currentMap = mapUrl;
        fetch(this.currentMap)
            .then(response => response.text())
            .then(data => {
                // Parsear o conteúdo CSV para matriz de valores
                this.map = data.trim().split('\n').map(row => row.split(',').map(Number));
                this.applyRemovedSkulls();
            });
    }

    // Método para aplicar as mudanças de crânios removidos
    applyRemovedSkulls() {
        if (this.removedSkulls) {
            for (const skull of this.removedSkulls) {
                const [x, y, map] = skull;
                if (this.currentMap == map) {
                    this.map[y][x] = -1; // Define o valor do crânio como removido (-1)
                }
            }   
        }
    }

    // Método para remover um crânio
    removeSkull(x, y) {
        // Adiciona as coordenadas do crânio removido à matriz de crânios removidos
        this.removedSkulls.push([x, y, this.currentMap]);
    }

    // Método para desenhar o mapa no canvas
    drawMap() {
        const cameraX = Math.round(this.cameraX);
        const cameraY = Math.round(this.cameraY);

        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const tile = this.map[y][x];
                if (tile >= 0 && tile < this.tileImages.length) {
                    // Desenhar imagem correspondente ao tipo de tile
                    this.ctx.drawImage(this.tileImages[tile], x * this.tileSize - cameraX, y * this.tileSize - cameraY, this.tileSize, this.tileSize);
                }
            }
        }
    }

    // Método para desenhar o menu inicial
    drawMenu() {
        this.ctx.drawImage(this.menuImage, 0, 0, this.canvasWidth, this.canvasHeight);
    }

    // Método para desenhar o menu de pausa
    drawPauseMenu() {
        this.ctx.drawImage(this.pauseMenuImage, 0, 0, this.canvasWidth, this.canvasHeight);
    }

    // Método para desenhar o jogo
    draw() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        if (this.menuActive) {
            this.drawMenu(); // Desenhar o menu se estiver ativo
        } else {
            if (this.paused) {
                this.drawPauseMenu(); // Desenhar o menu de pausa se estiver pausado
            } else {
                this.drawMap(); // Desenhar o mapa se o menu estiver inativo
                this.player.draw();
            }
        }
    }

    gameLoop() {
        // Verifica se o mapa foi carregado antes de continuar
        if (this.map.length === 0) {
            // Se o mapa ainda não foi carregado, aguarde um momento e tente novamente
            setTimeout(() => this.gameLoop(), 100);
            return;
        }

        if (!this.menuActive && !this.paused) {
            this.player.update();
        }
        this.draw();    
        requestAnimationFrame(() => this.gameLoop());
    }

    // Método para lidar com pressionamentos de tecla
    handleKeyDown(event) {
        if (this.menuActive) {
            if (event.code === 'Enter') {
                this.menuActive = false; // Desativa o menu quando o jogador pressiona Enter
                // Inicia o jogo aqui...
            }
        } else {
            if (event.code === 'KeyP') {
                this.togglePause(); // Alterna entre pausado e jogando quando a tecla 'p' é pressionada
            }
        }
    }

    // Método para alternar entre pausado e jogando
    togglePause() {
        this.paused = !this.paused; // Inverte o estado de pausa
    }
}

new Game();