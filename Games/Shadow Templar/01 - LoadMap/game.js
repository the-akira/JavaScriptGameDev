class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        this.tileSize = 32; // Tamanho do tile em pixels
        this.map = []; // Matriz para armazenar o mapa
        this.loadMap();
        this.gameLoop();
    }

    // Método para carregar o mapa do arquivo CSV
    loadMap() {
        // Carregar o arquivo CSV
        fetch('https://gist.githubusercontent.com/the-akira/4c390c20cebbeb7f2d868d26aa36803d/raw/768638323eb3e2a050adb48da2bc8f16bea40cca/gamemap.csv')
            .then(response => response.text())
            .then(data => {
                // Parsear o conteúdo CSV para matriz de valores
                this.map = data.trim().split('\n').map(row => row.split(',').map(Number));
            });
    }

    // Método para desenhar o mapa no canvas
    drawMap() {
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const tile = this.map[y][x];
                if (tile === 1) {
                    // Desenhar tiles sólidos (exemplo: retângulos de cor)
                    this.ctx.fillStyle = '#242424';
                    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                } else if (tile === 0) {
                    // Desenhar tiles vazios (exemplo: retângulos de cor)
                    this.ctx.fillStyle = '#424242';
                    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.drawMap();
    }

    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

new Game();