const blockSize = 20;

class SnakeGame {
    constructor(bgColor, snakeColor, speed) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 600;
        this.canvas.height = 400;
        this.canvas.style.backgroundColor = bgColor;
        this.snakeColor = snakeColor;
        this.speed = speed;
        this.originalSpeed = speed;
        this.snake = new Snake(this);
        this.food = this.generateFood();
        this.direction = 'right';
        this.score = 0;
        this.interval = null;
        this.gameOver = false;
        this.matrixMode = false;
        this.wallPass = false;
        this.fastMode = false;
        this.invertedControls = false;
        this.isStartMenu = true;
        this.canChangeDirection = true; 

        document.addEventListener('keydown', e => this.changeDirection(e));

        this.matrixModeButton = document.getElementById('matrixModeButton');
        this.invertedControlsButton = document.getElementById('invertedControlsButton');
        this.wallPassButton = document.getElementById('wallPassButton');
        this.fastModeButton = document.getElementById('fastModeButton');

        document.addEventListener('keydown', e => {
            if (e.key === 'x' || e.key === 'X') {
                this.matrixMode = !this.matrixMode;
                this.updateButtonUI('matrixMode');
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'z' || e.key === 'Z') {
                this.invertedControls = !this.invertedControls;
                this.updateButtonUI('invertedControls');
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'w' || e.key === 'W') {
                this.wallPass = !this.wallPass;
                this.updateButtonUI('wallPass');
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'f' || e.key === 'F') {
                this.fastMode = !this.fastMode;
                this.updateButtonUI('fastMode');
                this.startGame();
            }
        });

        document.addEventListener('keydown', e => {
            if (this.isStartMenu && e.key === 'Enter' && !this.gameOver) {
                this.isStartMenu = false;
                this.startGame();
            }
        });

        this.draw();
    }

    updateButtonUI(mode) {
        const button = this[`${mode}Button`];
        const isActive = this[mode];

        const modeDetails = {
            matrixMode: { name: "Matrix Mode", key: "X" },
            invertedControls: { name: "Inverted Controls", key: "Z" },
            wallPass: { name: "Wall Pass", key: "W" },
            fastMode: { name: "Fast Mode", key: "F" }
        };

        const { name, key } = modeDetails[mode];

        if (isActive) {
            button.classList.remove('inactive');
            button.classList.add('active');
            button.textContent = `(${key}) ${name}: ON`;
        } else {
            button.classList.remove('active');
            button.classList.add('inactive');
            button.textContent = `(${key}) ${name}: OFF`;
        }
    }

    startGame() {
        const speed = this.fastMode ? this.originalSpeed / 1.65 : this.originalSpeed;
        clearInterval(this.interval);
        this.interval = setInterval(() => this.update(), speed);
    }

    restartGame() {
        clearInterval(this.interval);
        this.snake = new Snake(this);
        this.food = this.generateFood();
        this.direction = 'right';
        this.score = 0;
        this.gameOver = false;
        this.canChangeDirection = true; 
        this.startGame();
    }

    generateFood() {
        let foodPosition;
        let isOnSnake;

        do {
            isOnSnake = false;
            foodPosition = {
                x: Math.floor(Math.random() * (this.canvas.width / blockSize)) * blockSize,
                y: Math.floor(Math.random() * (this.canvas.height / blockSize)) * blockSize
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

    drawBlock(x, y, color, isHead = false, isFood = false) {
        if (this.matrixMode) {
            if (isFood) {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.font = '16px monospace';
                this.ctx.fillText('1', x + blockSize / 2 - 5, y + blockSize / 2 + 6);
            } else if (isHead) {
                this.ctx.fillStyle = '#ffcc00';
                this.ctx.font = '16px monospace';
                const binaryDigit = Math.round(Math.random()).toString();
                this.ctx.fillText(binaryDigit, x + blockSize / 2 - 5, y + blockSize / 2 + 6);
            } else {
                this.ctx.fillStyle = '#33ff33';
                this.ctx.font = '16px monospace';
                const binaryDigit = Math.round(Math.random()).toString();
                this.ctx.fillText(binaryDigit, x + blockSize / 2 - 5, y + blockSize / 2 + 6);
            }
        } else {
            this.ctx.fillStyle = isHead ? '#ffcc00' : color;
            this.ctx.fillRect(x, y, blockSize, blockSize);
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, blockSize, blockSize);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.isStartMenu) {
            this.drawStartMenu(); 
            return; 
        }

        if (this.matrixMode) {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.matrixMode) {
            this.ctx.strokeStyle = '#114411';
            for (let x = 0; x < this.canvas.width; x += blockSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }

            for (let y = 0; y < this.canvas.height; y += blockSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
        }

        this.snake.body.forEach((block, index) => {
            this.drawBlock(block.x, block.y, this.snakeColor, index === 0);
        });

        this.drawBlock(this.food.x, this.food.y, 'red', false, true);

        if (this.gameOver) {
            this.drawGameOver();
        }
    }

    drawStartMenu() {
        this.ctx.save();
        this.ctx.fillStyle = 'lightgreen';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#124203';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Snake Game', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.font = '22px Arial';
        this.ctx.fillText('Pressione Enter para começar', this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.restore();
    }

    drawGameOver() {
        this.ctx.save();
        this.ctx.fillStyle = 'lightgreen';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#124203';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.font = '22px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('Pressione Enter para reiniciar', this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.restore();
    }

    update() {
        if (this.isStartMenu || this.gameOver) return;

        this.snake.move(this.direction);
        this.canChangeDirection = true;

        if (this.snake.collided(this.canvas) || this.snake.collidedWithSelf()) {
            this.gameOver = true;
            this.draw();
            clearInterval(this.interval);
            document.addEventListener('keydown', e => {
                if (e.key === 'Enter' && this.gameOver) {
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

        const oppositeDirections = {
            left: 'right',
            right: 'left',
            up: 'down',
            down: 'up'
        };

        let newDirection = keyMap[e.key];

        if (this.invertedControls && newDirection) {
            newDirection = oppositeDirections[newDirection];
        }

        if (newDirection && !this.gameOver && newDirection !== oppositeDirections[this.direction] && this.canChangeDirection) {
            this.direction = newDirection;
            this.canChangeDirection = false;
        }
    }
}

class Snake {
    constructor(game) {
        const initialX = 3 * blockSize;
        const initialY = 0; 
        this.body = [
            { x: initialX, y: initialY },
            { x: initialX - blockSize, y: initialY },
            { x: initialX - 2 * blockSize, y: initialY }
        ];
        this.dx = blockSize;
        this.dy = 0;
        this.game = game;
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

        if (this.game && this.game.wallPass) {
            if (head.x < 0) {
                head.x = canvas.width - blockSize; 
            } else if (head.x >= canvas.width) {
                head.x = 0;
            }

            if (head.y < 0) {
                head.y = canvas.height - blockSize;
            } else if (head.y >= canvas.height) {
                head.y = 0;
            }

            return false;
        }

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

new SnakeGame('lightgreen', '#2fc718', 105);