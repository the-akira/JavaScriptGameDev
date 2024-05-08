class Grid {
    constructor(ctx, step, color, drawCoordinates) {
        this.ctx = ctx;
        this.step = step;
        this.color = color;
        this.drawCoordinates = drawCoordinates;
    }

    draw() {
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let x = 0; x <= this.ctx.canvas.width; x += this.step) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.ctx.canvas.height);
            if (this.drawCoordinates && x > 0) {
                this.drawCoordinateText(x - 5, 17, x.toString(), "right");
            }
        }
        for (let y = 0; y <= this.ctx.canvas.height; y += this.step) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.ctx.canvas.width, y);
            if (this.drawCoordinates && y > 0) {
                this.drawCoordinateText(5, y + 18, y.toString(), "left");
            }
        }
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();
    }

    drawCoordinateText(x, y, text, align) {
        this.ctx.font = "bold 16px Arial";
        this.ctx.fillStyle = "blue";
        this.ctx.textAlign = align;
        this.ctx.fillText(text, x, y);
    }

    drawCoordinateLines(x, y) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.ctx.canvas.width, 0);
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, this.ctx.canvas.height);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = "blue";
        this.ctx.stroke();
    }
}

class Player {
    constructor(ctx, x, y, width, height, color) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.rect(this.x, this.y, this.width, this.height);
        this.ctx.strokeStyle = "black"; // Cor da borda
        this.ctx.lineWidth = 4; // Espessura da borda
        this.ctx.strokeRect(this.x, this.y, this.width, this.height); // Desenha a borda
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        this.ctx.closePath();
        this.drawCoordinates();
        this.drawCoordinateLines();
    }

    drawCoordinateLines() {
        this.ctx.beginPath();
        // Linha para o eixo x
        this.ctx.moveTo(this.x, this.y);
        this.ctx.lineTo(this.x, 0);
        // Linha para o eixo y
        this.ctx.moveTo(this.x, this.y);
        this.ctx.lineTo(0, this.y);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = "blue";
        this.ctx.stroke();
    }

    drawCoordinates() {
        document.getElementById("coordinates").innerHTML = `(x: ${this.x}, y: ${this.y})`;
    }

    checkCollision(circle) {
        let circleCenterX = circle.x;
        let circleCenterY = circle.y;

        let playerCenterX = this.x + this.width / 2;
        let playerCenterY = this.y + this.height / 2;

        let deltaX = Math.abs(circleCenterX - playerCenterX);
        let deltaY = Math.abs(circleCenterY - playerCenterY);

        if (deltaX > (this.width / 2 + circle.radius) || deltaY > (this.height / 2 + circle.radius)) {
            return false;
        }

        if (deltaX <= (this.width / 2) || deltaY <= (this.height / 2)) {
            return true;
        }

        let cornerDistance = Math.pow(deltaX - this.width / 2, 2) + Math.pow(deltaY - this.height / 2, 2);
        return cornerDistance <= Math.pow(circle.radius, 2);
    }
}

class Circle {
    constructor(ctx, x, y, radius, color) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        this.ctx.strokeStyle = "black"; // Cor da borda
        this.ctx.lineWidth = 1.5; // Espessura da borda
        this.ctx.stroke(); // Desenha a borda
        this.ctx.closePath();
        this.drawCoordinates();
    }

    update() {
        this.x -= 1;
    }

    drawCoordinates() {
        this.ctx.font = "bold 14px Arial";
        this.ctx.fillStyle = "black";
        this.ctx.fillText(`(x: ${this.x}, y: ${this.y})`, this.x + this.radius + 6, this.y + 3);
    }
}

class Triangle {
    constructor(ctx, x, y, width, height, color) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.time = 0; // Tempo para controlar o movimento senoidal
    }

    draw() {
        // Desenha o objeto triangular
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y);
        this.ctx.lineTo(this.x + this.width, this.y);
        this.ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        this.ctx.closePath();
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        this.ctx.strokeStyle = "black"; // Cor da borda
        this.ctx.lineWidth = 1.5; // Espessura da borda
        this.ctx.stroke(); // Desenha a borda
        // Desenha as coordenadas (opcional)
        this.drawCoordinates();
    }

    drawCoordinates() {
        this.ctx.font = "bold 14px Arial";
        this.ctx.fillStyle = "black";
        this.ctx.fillText(`(x: ${Math.floor(this.x)}, y: ${Math.floor(this.y)})`, this.x - 17, this.y - 10);
    }

    update() {
        // Atualiza a posição vertical usando um movimento senoidal
        this.time += 0.05;
        this.y += 1; // Movimento para baixo
        this.x += Math.sin(this.time) * 2; // Movimento senoidal
    }

    checkCollision(player) {
        // Verifica colisão com o jogador
        return (
            this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y
        );
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.grid = new Grid(this.ctx, 10, '#bdbdbd', false);
        this.gridWithCoordinates = new Grid(this.ctx, 50, '#545454', true);
        this.player = new Player(this.ctx, 100, 150, 50, 50, "#7b5edb");
        this.circle = new Circle(this.ctx, this.canvas.width, Math.floor(Math.random() * this.canvas.height), 20, "#ed5168");
        this.triangularObject = new Triangle(this.ctx, Math.floor(Math.random() * this.canvas.width), 0, 50, 50, "#5edb86");
        this.canSpawnCircle = true;
        this.directions = new Set();
        this.objects = [];
        this.intervalIds = [];
        this.startIntervals(); 
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.grid.draw();
        this.gridWithCoordinates.draw();
        this.player.draw();
        this.grid.drawCoordinateLines(this.player.x, this.player.y);
        this.objects.forEach(object => object.draw());
        this.objects.forEach(object => object.update());

        // Verifica colisões e remove objetos se necessário
        for (let i = 0; i < this.objects.length; i++) {
            const object = this.objects[i];
            if (object instanceof Circle && this.player.checkCollision(object)) {
                // Remove o objeto da lista usando seu índice
                this.objects.splice(i, 1);
                i--; // Decrementa o contador para compensar a remoção do objeto
            } else if (object instanceof Triangle && object.checkCollision(this.player)) {
                // Remove o objeto da lista usando seu índice
                this.objects.splice(i, 1);
                i--; // Decrementa o contador para compensar a remoção do objeto
            }
        }

        // Event listener para pausar e retomar o jogo quando a aba não está ativa
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                // A aba do jogo está ativa, retoma os intervalos
                this.intervalIds.forEach(id => {
                    clearInterval(id);
                });
                this.intervalIds = []; // Limpa a lista de IDs de intervalo
                this.startIntervals(); // Inicia novamente os intervalos
            } else {
                // A aba do jogo não está ativa, pausa os intervalos
                this.intervalIds.forEach(id => {
                    clearInterval(id);
                });
                this.intervalIds = []; // Limpa a lista de IDs de intervalo
            }
        });

        requestAnimationFrame(() => this.animate());
    }

    moveRectangle() {
        let deltaX = 0;
        let deltaY = 0;

        // Verifica se as teclas de seta esquerda e direita estão pressionadas
        if (this.directions.has("ArrowLeft")) {
            deltaX -= 10;
        }
        if (this.directions.has("ArrowRight")) {
            deltaX += 10;
        }

        // Verifica se as teclas de seta para cima e para baixo estão pressionadas
        if (this.directions.has("ArrowUp")) {
            deltaY -= 10;
        }
        if (this.directions.has("ArrowDown")) {
            deltaY += 10;
        }

        // Calcula as novas posições do jogador
        const newX = this.player.x + deltaX;
        const newY = this.player.y + deltaY;

        // Verifica se as novas posições estão dentro dos limites do canvas
        if (newX >= 0 && newX + this.player.width <= this.canvas.width) {
            this.player.x = newX;
        }
        if (newY >= 0 && newY + this.player.height <= this.canvas.height) {
            this.player.y = newY;
        }
    }

    start() {
        this.animate();
        const keyMap = {
            37: "ArrowLeft",
            38: "ArrowUp",
            39: "ArrowRight",
            40: "ArrowDown"
        };

        document.addEventListener('keydown', (event) => {
            const key = keyMap[event.keyCode];
            if (key) {
                this.directions.add(key); // Adiciona a direção ao conjunto de direções
                this.moveRectangle(); // Move o jogador
                event.preventDefault();
            }
        });

        document.addEventListener('keyup', (event) => {
            const key = keyMap[event.keyCode];
            if (key) {
                this.directions.delete(key); // Remove a direção do conjunto de direções
            }
        });
    }

    startIntervals() {
        // Adiciona círculos ao array de objetos
        const circleIntervalId = setInterval(() => {
            this.objects.push(new Circle(this.ctx, this.canvas.width, Math.floor(Math.random() * this.canvas.height), 20, "#ed5168"));
        }, 5000);
        this.intervalIds.push(circleIntervalId); // Armazena o ID do intervalo

        // Adiciona objetos triangulares ao array de objetos
        const triangleIntervalId = setInterval(() => {
            this.objects.push(new Triangle(this.ctx, Math.floor(Math.random() * this.canvas.width), 0, 50, 50, "#5edb86"));
        }, 5000);
        this.intervalIds.push(triangleIntervalId); // Armazena o ID do intervalo
    }
}

const game = new Game();
game.start();