var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// Definindo estados do jogo
var GameState = {
    telaInicial: 0,
    jogando: 1,
    pausado: 2
};
var gameState = GameState.telaInicial;

class SpaceShip {
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.vx = 0;
        this.vy = 0;
        this.spriteIndex = 0;
        this.sprites = [new Image(), new Image()];
        this.sprites[0].src = "assets/ship1.png";
        this.sprites[1].src = "assets/ship2.png";
        this.frameCount = 0; // Contador de quadros
        this.frameDelay = 20; // Ajuste esse valor para controlar a velocidade da animação
        this.lastShotTime = 0;
        this.shootDelay = 350;
        this.lastTeleportTime = 0;
        this.teleportDelay = 450;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    draw(ctx) {
        ctx.drawImage(this.sprites[this.spriteIndex], this.x, this.y, this.width, this.height);
    }

    update() {
        this.move(this.vx, this.vy);

        // Limitar jogador dentro do canvas
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }

    updateAnimation() {
        // Aumentar o contador de quadros
        this.frameCount++;

        // Verificar se é hora de alternar os sprites
        if (this.frameCount >= this.frameDelay) {
            this.spriteIndex = (this.spriteIndex === 0) ? 1 : 0;
            this.frameCount = 0; // Reiniciar o contador de quadros
        }
    }

    shoot() {
        var currentTime = Date.now();
        if (currentTime - this.lastShotTime > this.shootDelay) {
            projectiles.push(new Projectile(this.x + this.width / 2, this.y, 5, 6));
            this.lastShotTime = currentTime;
        }
    }

    teleport() {
        var currentTime = Date.now();
        if (currentTime - this.lastTeleportTime > this.teleportDelay) {
            this.x = Math.random() * (canvas.width - this.width);
            this.y = Math.random() * (canvas.height - this.height);
            this.lastTeleportTime = currentTime;
        }
    }
}

class Background {
    constructor(width, height, speed, frameDelay) {
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.frameDelay = frameDelay;
        this.bgIndex = 0;
        this.backgrounds = [new Image(), new Image()];
        this.backgrounds[0].src = "assets/bg1.png";
        this.backgrounds[1].src = "assets/bg2.png";
        this.y = 0; // Posição inicial do background
        this.frameCount = 0; // Contador de quadros
    }

    move() {
        // Mover o background para cima com base na velocidade
        this.y += this.speed;
        
        // Se o background sair da tela, reiniciar a posição para criar um efeito de loop
        if (this.y >= this.height) {
            this.y = 0;
        }
    }

    draw(ctx) {
        // Desenhar o background
        ctx.drawImage(this.backgrounds[this.bgIndex], 0, this.y, this.width, this.height);
        
        // Desenhar o segundo background para criar um efeito de scrolling
        ctx.drawImage(this.backgrounds[this.bgIndex], 0, this.y - this.height, this.width, this.height);
    }

    updateAnimation() {
        // Aumentar o contador de quadros
        this.frameCount++;

        // Verificar se é hora de alternar os backgrounds
        if (this.frameCount >= this.frameDelay) {
            this.bgIndex = (this.bgIndex === 0) ? 1 : 0;
            this.frameCount = 0; // Reiniciar o contador de quadros
        }
    }
}

class Projectile {
    constructor(x, y, radius, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed;
    }

    update() {
        this.y -= this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = "#c2061f";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

var player = new SpaceShip(50, 50, 60, 53, 5); // Criar a SpaceShip
var background = new Background(canvas.width, canvas.height, 2, 30); 
var keysPressed = {};
var projectiles = [];

function handleKeyDown(event) {
    keysPressed[event.key] = true;
    event.preventDefault();

    // Se estiver na tela inicial e pressionar Enter, começa o jogo
    if (gameState === GameState.telaInicial && event.key === "Enter") {
        gameState = GameState.jogando;
    }
    // Se estiver jogando e pressionar "p", pausa o jogo
    if (gameState === GameState.jogando && event.key === "p") {
        gameState = GameState.pausado;
    } else if (gameState === GameState.pausado && event.key === "p") {
        gameState = GameState.jogando; // Se estiver pausado e pressionar "P" novamente, retoma o jogo
    }
}

function updatePlayerActions() {
    player.vx = 0;
    player.vy = 0;

    // Atualizar a velocidade do jogador com base nas teclas pressionadas
    if ('ArrowUp' in keysPressed) {
        player.vy = -player.speed;
    }
    if ('ArrowDown' in keysPressed) {
        player.vy = player.speed;
    }
    if ('ArrowLeft' in keysPressed) {
        player.vx = -player.speed;
    }
    if ('ArrowRight' in keysPressed) {
        player.vx = player.speed;
    }

    if ('q' in keysPressed 
        && gameState != GameState.pausado 
        && gameState != GameState.telaInicial
        ) {
        player.shoot();
    }
    if ('t' in keysPressed
        && gameState != GameState.pausado 
        && gameState != GameState.telaInicial
        ) {
        player.teleport();
    }     
}

function handleKeyUp(event) {
    delete keysPressed[event.key];

    // Atualizar a velocidade do jogador quando uma tecla é liberada
    if (!('ArrowUp' in keysPressed || 'ArrowDown' in keysPressed)) {
        player.vy = 0;
    }
    if (!('ArrowLeft' in keysPressed || 'ArrowRight' in keysPressed)) {
        player.vx = 0;
    }
}

function drawCenteredText(text, textColor, font, backgroundColor) {
    // Desenhar fundo
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar texto centralizado
    ctx.fillStyle = textColor;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Se estiver na tela inicial, desenhe a tela inicial
    if (gameState === GameState.telaInicial) {
        drawCenteredText("Pressione Enter para começar", "black", "30px Arial", "#e8e8e8");
    }

    if (gameState === GameState.jogando) {
        background.draw(ctx);
        background.updateAnimation();

        for (let projectile of projectiles) {
            projectile.draw(ctx); 
            projectile.update(); 
        }

        updatePlayerActions();
        player.draw(ctx);
        player.update();
        player.updateAnimation();
    }

    if (gameState === GameState.pausado) {
        drawCenteredText("Pausado", "black", "30px Arial", "#e8e8e8");        
    }

    requestAnimationFrame(draw);
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

draw();