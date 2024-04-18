var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// Definindo estados do jogo
var GameState = {
    telaInicial: 0,
    jogando: 1,
};
var gameState = GameState.telaInicial;

class Dragon {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.vx = 0;
        this.vy = 0;
        this.spriteIndex = 0;
        this.sprites = Array.from({ length: 6 }, () => new Image());
        this.sprites.forEach((sprite, index) => {
            sprite.onload = () => {
                this.width = sprite.width;
                this.height = sprite.height;
            };
        });
        this.sprites[0].src = "assets/dragon1.png";
        this.sprites[1].src = "assets/dragon2.png";
        this.sprites[2].src = "assets/dragon3.png";
        this.sprites[3].src = "assets/dragon4.png";
        this.sprites[4].src = "assets/dragon5.png";
        this.sprites[5].src = "assets/dragon6.png";
        this.frameCount = 0; // Contador de quadros
        this.frameDelay = 8; // Ajuste esse valor para controlar a velocidade da animação
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
            // Avança para o próximo sprite na matriz de sprites
            this.spriteIndex = (this.spriteIndex + 1) % 6; // Considera 6 frames
            this.frameCount = 0; // Reiniciar o contador de quadros
        }
    }
}

class Background {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.background = new Image();
        this.background.src = "assets/bg.png";
    }

    draw(ctx) {
        ctx.drawImage(this.background, 0, 0, this.width, this.height);
    }
}

var player = new Dragon(50, 50, 5); // Criar a Dragon
var background = new Background(canvas.width, canvas.height); 
var keysPressed = {};

function handleKeyDown(event) {
    keysPressed[event.key] = true;
    event.preventDefault();

    // Se estiver na tela inicial e pressionar Enter, começa o jogo
    if (gameState === GameState.telaInicial && event.key === "Enter") {
        gameState = GameState.jogando;
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
    // Se estiver na tela inicial, desenhe a tela inicial
    if (gameState === GameState.telaInicial) {
        drawCenteredText("Pressione Enter para começar", "#A9BAAD", "bold 40px Arial", "#0F0F0F");
    }

    if (gameState === GameState.jogando) {
        background.draw(ctx);
        updatePlayerActions();
        player.draw(ctx);
        player.update();
        player.updateAnimation();
    }

    requestAnimationFrame(draw);
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
draw();