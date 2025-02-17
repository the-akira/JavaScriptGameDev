const canvasSize = 500;
const blockSize = 20;

class SnakeGame {
    constructor(bgColor, snakeColor, speed) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.backgroundColor = bgColor;
        this.snakeColor = snakeColor;
        this.speed = speed;
        this.snake = new Snake();
        this.food = this.generateFood();
        this.direction = 'right';
        this.score = 0;
        this.interval = null;
        this.gameOver = false;
        document.addEventListener('keydown', e => this.changeDirection(e));
        this.startGame();
    }

    startGame() {
        this.interval = setInterval(() => this.update(), this.speed);
    }

    restartGame() {
        clearInterval(this.interval);
        this.snake = new Snake();
        this.food = this.generateFood();
        this.direction = 'right';
        this.score = 0;
        this.gameOver = false;
        this.startGame();
    }

    generateFood() {
        let foodPosition;
        let isOnSnake;

        do {
            isOnSnake = false;
            foodPosition = {
                x: Math.floor(Math.random() * (canvasSize / blockSize)) * blockSize,
                y: Math.floor(Math.random() * (canvasSize / blockSize)) * blockSize
            };

            for (const segment of this.snake.body) {
                if (segment.x === foodPosition.x && segment.y === foodPosition.y) {
                    isOnSnake = true;
                    break;
                }
            }
        } while (isOnSnake);

        return foodPosition;
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, blockSize, blockSize);
    }

    draw() {
        this.ctx.clearRect(0, 0, canvasSize, canvasSize);
        this.snake.body.forEach(block => this.drawBlock(block.x, block.y, this.snakeColor));
        this.drawBlock(this.food.x, this.food.y, '#422e03');
        if (this.gameOver) {
            this.drawGameOver();
        }
    }

    drawGameOver() {
        this.ctx.fillStyle = 'lightgreen';
        this.ctx.fillRect(0, 0, canvasSize, canvasSize);
        this.ctx.fillStyle = '#124203';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', canvasSize / 2, canvasSize / 2 - 20);
        this.ctx.fillText(`Score: ${this.score}`, canvasSize / 2, canvasSize / 2 + 10);
        this.ctx.fillText('Pressione Enter para reiniciar', canvasSize / 2, canvasSize / 2 + 40);
    }

    update() {
        if (this.gameOver) return;

        this.snake.move(this.direction);
        if (this.snake.collided(this.canvas) || this.snake.collidedWithSelf()) {
            this.gameOver = true;
            this.draw();
            clearInterval(this.interval);
            document.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    this.restartGame();
                }
            });
            return;
        }
        if (this.snake.ateFood(this.food)) {
            this.snake.grow();
            this.food = this.generateFood();
            this.score += 10;
        }
        this.draw();
    }

    changeDirection(e) {
        const keyMap = {
            ArrowLeft: 'left',
            ArrowUp: 'up',
            ArrowRight: 'right',
            ArrowDown: 'down'
        };
        if (keyMap[e.key] && !this.gameOver) {
            this.direction = keyMap[e.key];
        }
    }
}

class Snake {
    constructor() {
        this.body = [{ x: 60, y: 0 }, { x: 40, y: 0 }, { x: 20, y: 0 }];
        this.dx = blockSize;
        this.dy = 0;
    }

    move(direction) {
        switch (direction) {
            case 'left':
                this.dx = -blockSize;
                this.dy = 0;
                break;
            case 'up':
                this.dx = 0;
                this.dy = -blockSize;
                break;
            case 'right':
                this.dx = blockSize;
                this.dy = 0;
                break;
            case 'down':
                this.dx = 0;
                this.dy = blockSize;
                break;
        }
        const newHead = { x: this.body[0].x + this.dx, y: this.body[0].y + this.dy };
        this.body.unshift(newHead);
        this.body.pop();
    }

    grow() {
        const tail = this.body[this.body.length - 1];
        this.body.push({ x: tail.x, y: tail.y });
    }

    collided(canvas) {
        const head = this.body[0];
        return head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height;
    }

    collidedWithSelf() {
        const head = this.body[0];
        return this.body.slice(1).some(block => block.x === head.x && block.y === head.y);
    }

    ateFood(food) {
        const head = this.body[0];
        return head.x === food.x && head.y === food.y;
    }
}

new SnakeGame('lightgreen', '#124203', 105);