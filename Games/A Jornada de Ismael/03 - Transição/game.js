class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;

        this.character = new Character(50, 460, 50, 73, 3);
        this.background = new Background('assets/background/background1.png', 1425, 600);
        this.cameraX = 0;
        this.currentMap = 'background1';

        this.portalCooldown = 0; 
        this.portalCooldownTime = 2000; 
        this.portals = [
            new Portal(1150, 455, 80, 80, 'background1', 'background2'),
            new Portal(100, 455, 80, 80, 'background2', 'background3'),
            new Portal(1150, 455, 80, 80, 'background3', 'background4'),
            new Portal(180, 455, 80, 80, 'background4', 'background1'),
        ];

        this.keys = {
            left: false,
            right: false,
            up: false,
        };

        document.addEventListener("keydown", (event) => this.keyDownHandler(event));
        document.addEventListener("keyup", (event) => this.keyUpHandler(event));

        this.gameLoop();
    }

    drawCooldownIndicator() {
        let cooldownIndicatorWidth = 100;
        let cooldownIndicatorHeight = 30;

        if (this.portalCooldown > 0) {
            const remainingCooldownPercentage = this.portalCooldown / this.portalCooldownTime;
            const remainingCooldownWidth = cooldownIndicatorWidth * remainingCooldownPercentage;
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.fillRect(20, 20, remainingCooldownWidth, cooldownIndicatorHeight);
        }
    }

    keyDownHandler(event) {
        if (event.key === "ArrowLeft") {
            this.keys.left = true;
            this.character.isMoving = true;
            this.character.direction = 'left';
        } else if (event.key === "ArrowRight") {
            this.keys.right = true;
            this.character.isMoving = true;
            this.character.direction = 'right'; 
        } else if (event.key === "ArrowUp") {
            this.keys.up = true;
        }

        if (this.keys.left && this.keys.right) {
            this.character.isMoving = false;
        } else {
            this.character.isMoving = this.keys.left || this.keys.right;
        }
    }

    keyUpHandler(event) {
        if (event.key === "ArrowLeft") {
            this.keys.left = false;
            this.character.isMoving = false;
        } else if (event.key === "ArrowRight") {
            this.keys.right = false;
            this.character.isMoving = false;
        } else if (event.key === "ArrowUp") {
            this.keys.up = false;
        }

        if (this.keys.left && this.keys.right) {
            this.character.isMoving = false;
        } else {
            this.character.isMoving = this.keys.left || this.keys.right;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.background.draw(this.ctx, this.cameraX);
        this.character.draw(this.ctx);
        for (const portal of this.portals) {
            if (portal.originMap === this.currentMap) {
                portal.draw(this.ctx, this.cameraX);
            }
        }
        this.drawCooldownIndicator();
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

        this.character.update();

        const currentTime = performance.now();
        for (const portal of this.portals) {
            portal.update(currentTime);
            const destinationMap = portal.checkCollision(this.character.x + this.cameraX, this.character.y, this.character.width, this.character.height);
            if (destinationMap && this.keys.up && this.currentMap === portal.originMap && this.portalCooldown <= 0) {
                this.currentMap = destinationMap;
                this.changeMap(this.currentMap);
                this.portalCooldown = this.portalCooldownTime;
                break;
            }
        }

        if (this.portalCooldown > 0) {
            this.portalCooldown -= 16;
        }
    }

    changeMap(destinationMap) {
        this.background.image.src = `assets/background/${destinationMap}.png`;
        this.character.x = this.character.x;
        this.character.y = this.character.y;
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
        this.isMoving = false; 

        this.idleSprites = [];
        this.walkingSprites = [];
        this.loadSprites();

        this.currentSprites = this.idleSprites; 
        this.spriteIndex = 0; 
        this.frameCounter = 0;

        this.walkingAnimationSpeed = 3;
        this.idleAnimationSpeed = 0.25;

        this.direction = 'right';
    }

    loadSprites() {
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = `assets/hero/idle/idle${i}.png`;
            this.idleSprites.push(img);
        }

        for (let i = 1; i <= 6; i++) {
            const img = new Image();
            img.src = `assets/hero/walking/walking${i}.png`;
            this.walkingSprites.push(img);
        }
    }

    update() {
        if (this.isMoving) {
            this.currentSprites = this.walkingSprites;
            this.animationSpeed = this.walkingAnimationSpeed;
        } else {
            if (this.currentSprites !== this.idleSprites) {
                this.spriteIndex = 0;
            }
            this.currentSprites = this.idleSprites;
            this.animationSpeed = this.idleAnimationSpeed;
        }

        this.frameCounter++;

        // Usa Math.floor para suavizar a animação com velocidade reduzida
        if (this.frameCounter >= 10 / this.animationSpeed) {
            this.spriteIndex = (this.spriteIndex + 1) % this.currentSprites.length;
            this.frameCounter = 0;
        }
    }

    draw(ctx) {
        if (this.currentSprites[this.spriteIndex] instanceof HTMLImageElement) {
            ctx.save(); 
            if (this.direction === 'left') {
                ctx.translate(this.x, this.y); 
                ctx.scale(-1, 1);
                ctx.drawImage(this.currentSprites[this.spriteIndex], -this.width, 0, this.width, this.height);
            } else {
                ctx.drawImage(this.currentSprites[this.spriteIndex], this.x, this.y, this.width, this.height);
            }
            ctx.restore();
        }
    }
}

class Portal {
    constructor(x, y, width, height, originMap, destinationMap) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.originMap = originMap;
        this.destinationMap = destinationMap;
        this.sprites = [];
        this.loadSprites();
        this.spriteIndex = 0; 
        this.lastUpdateTime = 0;
        this.frameInterval = 200; 
    }

    loadSprites() {
        for (let i = 1; i <= 5; i++) {
            const img = new Image();
            img.src = `assets/portal/portal${i}.png`;
            this.sprites.push(img);
        }
    }

    update(currentTime) {
        if (currentTime - this.lastUpdateTime > this.frameInterval) {
            this.spriteIndex = (this.spriteIndex + 1) % this.sprites.length;
            this.lastUpdateTime = currentTime;
        }
    }

    checkCollision(playerX, playerY, playerWidth, playerHeight) {
        if (
            playerX < this.x + this.width &&
            playerX + playerWidth > this.x &&
            playerY < this.y + this.height &&
            playerY + playerHeight > this.y
        ) {
            return this.destinationMap;
        }
        return null;
    }

    draw(ctx, cameraX) {
        if (this.sprites[this.spriteIndex] instanceof HTMLImageElement) {
            const adjustedX = this.x - cameraX; // Ajusta a posição do portal em relação à posição da câmera
            ctx.drawImage(this.sprites[this.spriteIndex], adjustedX, this.y, this.width, this.height);
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