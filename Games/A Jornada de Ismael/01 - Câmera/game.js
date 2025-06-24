class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;

        this.character = new Character(50, 460, 50, 73, 3);
        this.background = new Background('assets/background.png', 1425, 600);
        this.cameraX = 0;

        this.keys = {
            left: false,
            right: false
        };

        document.addEventListener("keydown", (event) => this.keyDownHandler(event));
        document.addEventListener("keyup", (event) => this.keyUpHandler(event));

        this.gameLoop();
    }

    keyDownHandler(event) {
        if (event.key === "ArrowLeft") {
            this.keys.left = true;
            this.character.direction = 'left';
        } else if (event.key === "ArrowRight") {
            this.keys.right = true;
            this.character.direction = 'right';
        }
    }

    keyUpHandler(event) {
        if (event.key === "ArrowLeft") {
            this.keys.left = false;
        } else if (event.key === "ArrowRight") {
            this.keys.right = false;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.background.draw(this.ctx, this.cameraX);
        this.character.draw(this.ctx);
    }

    update() {
        if (this.keys.left && this.character.x > 0) {
            this.character.x -= this.character.speed;
            if (this.cameraX > 0) {
                this.cameraX -= this.character.speed;
            }
        }
        if (this.keys.right && this.character.x < this.canvasWidth - this.character.width) {
            this.character.x += this.character.speed;
            if (this.cameraX < this.background.width - this.canvasWidth) {
                this.cameraX += this.character.speed;
            }
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

class Character {
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed; 
        this.image = new Image();
        this.image.src = "assets/hero.png"
        this.direction = "right";
    }

    draw(ctx) {
        if (this.image instanceof HTMLImageElement) {
            ctx.save(); 
            if (this.direction === 'left') {
                ctx.translate(this.x, this.y); 
                ctx.scale(-1, 1);
                ctx.drawImage(this.image, -this.width, 0, this.width, this.height);
            } else {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
            ctx.restore();
        }
    }
}

class Background {
    constructor(imagePath, width, height) {
        this.image = new Image();
        this.image.src = imagePath;
        this.width = width;
        this.height = height;
    }

    draw(ctx, cameraX) {
        ctx.drawImage(this.image, -cameraX, 0, this.width, this.height);
    }
}

new Game();