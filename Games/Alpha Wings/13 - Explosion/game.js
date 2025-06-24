var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// Definindo estados do jogo
var GameState = {
    telaInicial: 0,
    jogando: 1,
    pausado: 2,
    gameOver: 3,
};
var gameState = GameState.telaInicial;

const shootSound = new Audio('audio/blaster.mp3');
shootSound.volume = 0.020;

const hitSound = new Audio('audio/explosion.mp3');
hitSound.volume = 0.020;

const damageSound = new Audio('audio/smallexplosion.mp3');
damageSound.volume = 0.020;

const gameOverSound = new Audio('audio/gameover.mp3');
gameOverSound.volume = 0.4;

const backgroundMusic = new Audio('audio/spaceheroes.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.035;

var explosions = [];

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64; // Ajuste conforme o tamanho dos seus sprites de explosão
        this.height = 64;
        this.sprites = [];
        
        // Carrega os sprites da explosão (assumindo que você tem 9 frames)
        for (let i = 1; i <= 9; i++) {
            const img = new Image();
            img.src = `assets/explosion${i}.png`; // Nome dos arquivos de explosão
            this.sprites.push(img);
        }
        
        this.spriteIndex = 0;
        this.frameCount = 0;
        this.frameDelay = 4; // Velocidade da animação (quanto menor, mais rápida)
        this.isFinished = false;
    }

    update() {
        this.frameCount++;
        
        if (this.frameCount >= this.frameDelay) {
            this.spriteIndex++;
            this.frameCount = 0;
            
            if (this.spriteIndex >= this.sprites.length) {
                this.isFinished = true;
            }
        }
    }

    draw(ctx) {
        if (!this.isFinished) {
            ctx.drawImage(
                this.sprites[this.spriteIndex], 
                this.x - this.width/2, 
                this.y - this.height/2, 
                this.width, 
                this.height
            );
        }
    }
}

class HealItem {
    constructor() {
        this.image = new Image();
        this.image.src = "assets/energy.png"; // Imagem do item de cura
        this.width = 30; // Largura do item de cura
        this.height = 30; // Altura do item de cura
        this.x = Math.random() * (canvas.width - this.width); // Posição x aleatória dentro dos limites do canvas
        this.y = Math.random() * (canvas.height - this.height); // Posição y aleatória dentro dos limites do canvas
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    checkCollision(player) {
        // Verifica colisão entre o jogador e o item de cura
        if (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        ) {
            return true; // Colisão detectada
        }
        return false; // Nenhuma colisão
    }
}

class Enemy {
    constructor() {
        this.spriteSets = [
            ["assets/enemy1.png", "assets/enemy2.png"],
            ["assets/flying1.png", "assets/flying2.png", "assets/flying3.png", "assets/flying4.png", "assets/flying5.png"],
            ["assets/saucer1.png", "assets/saucer2.png", "assets/saucer3.png", "assets/saucer4.png"],
            ["assets/thor1.png", "assets/thor2.png", "assets/thor3.png", "assets/thor4.png"]
        ];

        // Escolhe aleatoriamente um conjunto de sprites para o inimigo
        const selectedSpriteSet = this.spriteSets[Math.floor(Math.random() * this.spriteSets.length)];

        // Carrega as imagens dos sprites
        this.sprites = selectedSpriteSet.map(spritePath => {
            const img = new Image();
            img.onload = () => {
                // Após o carregamento da imagem, defina a largura e a altura
                this.width = img.width;
                this.height = img.height;
            };
            img.src = spritePath;
            return img;
        });

        // Define a largura e altura do inimigo com base no tamanho do primeiro sprite
        this.width = this.sprites[0].width;
        this.height = this.sprites[0].height;

        this.speed = Math.floor(Math.random() * 4) + 1;
        this.x = Math.random() * (canvas.width - this.width); // Posição x aleatória dentro dos limites do canvas
        this.y = -this.height - 200; // Começa acima do canvas
        this.spriteIndex = 0;
        this.frameCount = 0; // Contador de quadros
        this.frameDelay = 10; // Ajuste esse valor para controlar a velocidade da animação
    }

    move() {
        this.y += this.speed; // Move o inimigo para baixo

        if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
        }
    }

    draw(ctx) {
        ctx.drawImage(this.sprites[this.spriteIndex], this.x, this.y, this.width, this.height);
    }

    updateAnimation() {
        this.frameCount++;

        // Verifica se é hora de alternar os sprites
        if (this.frameCount >= this.frameDelay) {
            // Avança para o próximo sprite na matriz de sprites
            this.spriteIndex = (this.spriteIndex + 1) % this.sprites.length;
            this.frameCount = 0; // Reiniciar o contador de quadros
        }
    }
}

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
        this.life = 3;
        this.score = 0;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    draw(ctx) {
        ctx.drawImage(this.sprites[this.spriteIndex], this.x, this.y, this.width, this.height);
    }

    // Função para desenhar a vida do jogador na tela
    drawLife(ctx) {
        var heartImg = new Image();
        heartImg.src = 'assets/heart.png'; // Imagem do coração

        // Definir a posição inicial para desenhar os corações
        var heartX = 10;
        var heartY = 10;

        // Loop para desenhar corações com base na vida do jogador
        for (var i = 0; i < this.life; i++) {
            ctx.drawImage(heartImg, heartX, heartY, 30, 30); // Desenha o coração na posição atual

            // Atualiza a posição para o próximo coração
            heartX += 35;
        }
    }

    // Função para desenhar a pontuação na tela
    drawScore(ctx) {
        // Define a cor do contorno
        ctx.strokeStyle = 'black';
        // Define a largura da linha do contorno
        ctx.lineWidth = 3;
        // Desenha o texto com o contorno preto
        ctx.strokeText(`Score: ${this.score}`, 63, 72);
        ctx.fillStyle = '#A4FEB0';
        ctx.font = 'bold 24px Arial';
        ctx.lineWidth = 5;
        ctx.fillText(`Score: ${this.score}`, 63, 72);
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
            shootSound.currentTime = 0; // Reinicia o áudio
            shootSound.play();
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

var player = new SpaceShip(360, 500, 60, 53, 5); // Criar a SpaceShip
var background = new Background(canvas.width, canvas.height, 2, 30); 
var keysPressed = {};
var projectiles = [];
var enemies = [];

function handleCollisionsEnemies() {
    // Verifica colisões entre o jogador e os inimigos
    for (let i = 0; i < enemies.length; i++) {
        let enemy = enemies[i];
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            // Cria uma explosão no local do inimigo
            explosions.push(new Explosion(
                enemy.x + enemy.width/2,
                enemy.y + enemy.height/2
            ));
            // Colisão detectada, remove o inimigo e aplica dano ao jogador
            enemies.splice(i, 1);
            player.life--;
            damageSound.currentTime = 0;
            damageSound.play();
        }
    }
}

function handleCollisionsProjectiles() {
    for (let i = 0; i < projectiles.length; i++) {
        let projectile = projectiles[i];
        for (let j = 0; j < enemies.length; j++) {
            let enemy = enemies[j];
            if (
                projectile.x < enemy.x + enemy.width &&
                projectile.x + projectile.radius > enemy.x &&
                projectile.y < enemy.y + enemy.height &&
                projectile.y + projectile.radius > enemy.y
            ) {
                // Cria uma explosão no local do inimigo
                explosions.push(new Explosion(
                    enemy.x + enemy.width/2,
                    enemy.y + enemy.height/2
                ));
                
                // Remove o projétil e o inimigo
                projectiles.splice(i, 1);
                enemies.splice(j, 1);
                player.score++;
                hitSound.currentTime = 0;
                hitSound.play();
                i--;
                break;
            }
        }
    }
}

function handleExplosions() {
    for (let i = 0; i < explosions.length; i++) {
        explosions[i].update();
        explosions[i].draw(ctx);
        
        // Remove explosões que terminaram
        if (explosions[i].isFinished) {
            explosions.splice(i, 1);
            i--;
        }
    }
}

function spawnEnemy() {
    // Cria um novo inimigo e o adiciona ao array de inimigos
    let newEnemy = new Enemy();
    enemies.push(newEnemy);
}

function handleEnemies() {
    // Move e desenha cada inimigo, e verifica a colisão
    for (let enemy of enemies) {
        enemy.move();
        enemy.draw(ctx);
        enemy.updateAnimation();
    }

    // Remove os inimigos que saíram da tela
    for (let i = 0; i < enemies.length; i++) {
        let enemy = enemies[i];
        if (enemy.y > canvas.height) {
            player.life--;
            enemies.splice(i, 1);
            hitSound.currentTime = 0;
            hitSound.play();
        }
    }

    // Spawna um novo inimigo aleatoriamente
    if (Math.random() < 0.01) { // Ajuste a probabilidade de spawn conforme necessário
        spawnEnemy();
    }
}

var healItem = null; // Variável para armazenar o item de cura

function spawnHealItem() {
    // Cria um novo item de cura e o atribui à variável global healItem
    healItem = new HealItem();
}

function handleHealItem() {
    // Verifica se o item de cura está disponível e desenha-o na tela
    if (healItem) {
        healItem.draw(ctx);

        // Verifica se houve colisão entre o jogador e o item de cura
        if (healItem.checkCollision(player)) {
            // Curar a vida do jogador
            player.life++;
            // Remove o item de cura da tela
            healItem = null;
        }
    }
}

setInterval(spawnHealItem, 25000); // Respawn do item de cura a cada minuto

function handleKeyDown(event) {
    keysPressed[event.key] = true;
    event.preventDefault();

    if (gameState === GameState.telaInicial && event.key === "Enter") {
        gameState = GameState.jogando;
    }
    if (gameState === GameState.gameOver && event.key === "Enter") {
        gameState = GameState.jogando;
        player.score = 0;
        player.life = 3;
        player.x = 360;
        player.y = 500;
        explosions = [];
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
        && gameState != GameState.gameOver
        && gameState != GameState.telaInicial
        ) {
        player.shoot();
    }
    if ('t' in keysPressed
        && gameState != GameState.pausado 
        && gameState != GameState.gameOver
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

function drawCenteredText(text, textColor, font, backgroundColor, score) {
    // Desenhar fundo
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar texto centralizado
    ctx.fillStyle = textColor;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    if (score) {
        ctx.fillText(score, canvas.width / 2, canvas.height / 2 + 50);        
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Se estiver na tela inicial, desenhe a tela inicial
    if (gameState === GameState.telaInicial) {
        drawCenteredText("Pressione Enter para começar", "#562E73", "bold 30px Arial", "#e8e8e8");
        backgroundMusic.pause();
    }

    if (gameState === GameState.jogando) {
        backgroundMusic.play();
        background.draw(ctx);
        background.updateAnimation();

        handleEnemies();
        handleCollisionsEnemies();
        handleCollisionsProjectiles();
        handleHealItem();
        handleExplosions();

        for (let projectile of projectiles) {
            projectile.draw(ctx); 
            projectile.update(); 
        }

        updatePlayerActions();
        player.draw(ctx);
        player.drawLife(ctx);
        player.drawScore(ctx);
        player.update();
        player.updateAnimation();

        if (player.life <= 0) {
            gameState = GameState.gameOver;
            enemies = [];
            projectiles = [];
            healItem = null;
            gameOverSound.play();
        }
    }

    if (gameState === GameState.pausado) {
        drawCenteredText("Pausado", "#562E73", "bold 30px Arial", "#e8e8e8");
        backgroundMusic.pause();        
    }

    if (gameState === GameState.gameOver) {
        drawCenteredText("Game Over!", "#562E73", "bold 30px Arial", "#e8e8e8", `Score: ${player.score}`);
        backgroundMusic.pause();
    }

    requestAnimationFrame(draw);
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
draw();