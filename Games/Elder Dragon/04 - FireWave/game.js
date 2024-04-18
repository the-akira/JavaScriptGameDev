var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// Definindo estados do jogo
var GameState = {
    telaInicial: 0,
    jogando: 1,
};
var gameState = GameState.telaInicial;

var fireballs = [];
var firewaves = [];
var explosions = [];

let score = 0;
var lastExplosionTime = 0;
var explosionDelay = 10000;

class Firewave {
    constructor(x, y, speed, numFrames) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.numFrames = numFrames;
        this.frameIndex = 0;
        this.frames = Array.from({ length: numFrames }, () => new Image());
        this.frames.forEach((frame, index) => {
            frame.onload = () => {
                this.width = frame.width;
                this.height = frame.height;
            };
        });
        // Carregar imagens para animação
        for (let i = 0; i < numFrames; i++) {
            this.frames[i].src = `assets/firewave${i + 1}.png`;
        }
        this.frameDelay = 15; // Atraso entre cada atualização de frame (em milissegundos)
        this.frameCount = 0; // Contador de quadros para controle do atraso
    }

    update() {
        // Atualizar posição horizontal
        this.x += this.speed;
    }

    draw(ctx) {
        // Desenhar o frame atual da animação
        ctx.drawImage(this.frames[this.frameIndex], this.x, this.y, this.width, this.height);
    }

    updateAnimation() {
        // Aumentar o contador de quadros
        this.frameCount++;

        // Verificar se é hora de alternar os sprites
        if (this.frameCount >= this.frameDelay) {
            // Atualizar o índice do frame para criar a animação
            this.frameIndex = (this.frameIndex + 1) % this.numFrames;
            this.frameCount = 0; // Reiniciar o contador de quadros
        }
    }
}

class Fireball {
    constructor(x, y, speed, numFrames) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.numFrames = numFrames;
        this.frameIndex = 0;
        this.frames = Array.from({ length: numFrames }, () => new Image());
        this.frames.forEach((frame, index) => {
            frame.onload = () => {
                this.width = frame.width;
                this.height = frame.height;
            };
        });
        // Carregar imagens para animação
        for (let i = 0; i < numFrames; i++) {
            this.frames[i].src = `assets/fb${i + 1}.png`;
        }
        // Definir movimento senoidal
        this.amplitude = Math.random() * (8 - 3) + 3;
        this.frequency = 0.05; // Frequência do movimento senoidal
        this.frameDelay = 15; // Atraso entre cada atualização de frame (em milissegundos)
        this.frameCount = 0; // Contador de quadros para controle do atraso
    }

    update() {
        // Atualizar posição vertical com movimento senoidal
        this.y += this.speed;
        this.x += this.amplitude * Math.sin(this.frequency * this.y);
    }

    draw(ctx) {
        // Desenhar o frame atual da animação
        ctx.drawImage(this.frames[this.frameIndex], this.x, this.y, this.width, this.height);
    }

    updateAnimation() {
        // Aumentar o contador de quadros
        this.frameCount++;

        // Verificar se é hora de alternar os sprites
        if (this.frameCount >= this.frameDelay) {
            // Atualizar o índice do frame para criar a animação
            this.frameIndex = (this.frameIndex + 1) % this.numFrames;
            this.frameCount = 0; // Reiniciar o contador de quadros
        }
    }
}

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
        this.firewaveCooldown = 2000; // Tempo de recarga da Firewave em milissegundos
        this.lastFirewaveTime = 0; // Último momento em que a Firewave foi lançada
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

    checkCollision(fireballs) {
        for (let i = 0; i < fireballs.length; i++) {
            let fireball = fireballs[i];
            // Verificar se há colisão entre os retângulos delimitadores
            if (
                this.x < fireball.x + fireball.width &&
                this.x + this.width > fireball.x &&
                this.y < fireball.y + fireball.height &&
                this.y + this.height > fireball.y
            ) {
                // Se houver colisão, faça algo, por exemplo, reduza a vida do jogador
                gameState = GameState.telaInicial;
            }
        }
    }

    launchFirewave() {
        const currentTime = Date.now();
        // Verificar se o cooldown da Firewave já passou
        if (currentTime - this.lastFirewaveTime > this.firewaveCooldown) {
            const x = this.x + this.width / 2; // Posição x do centro do jogador
            const y = this.y + 10; // Posição y do jogador

            // Criar e adicionar a Firewave ao array de Firewaves
            firewaves.push(new Firewave(x, y, 5, 4)); // Ajuste a velocidade e o número de frames conforme necessário

            // Atualizar o tempo da última Firewave lançada
            this.lastFirewaveTime = currentTime;
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

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.frameIndex = 0;
        this.frames = []; // Array de imagens para a animação da explosão
        this.numFrames = 7; // Número de frames da animação
        for (let i = 0; i < this.numFrames; i++) {
            let frame = new Image();
            frame.src = `assets/explosion${i + 1}.png`;
            this.frames.push(frame);
        }
        this.frameDelay = 5; // Atraso entre cada quadro (em milissegundos)
        this.frameCount = 0; // Contador de quadros
    }

    update() {
        // Atualizar a animação da explosão
        this.frameCount++;
        if (this.frameCount >= this.frameDelay) {
            this.frameIndex++;
            if (this.frameIndex >= this.numFrames) {
                // Se a animação estiver completa, remova a explosão
                explosions.splice(explosions.indexOf(this), 1);
            }
            this.frameCount = 0;
        }
    }

    draw(ctx) {
        if (this.frameIndex >= 0 && this.frameIndex < this.frames.length && this.frames[this.frameIndex].complete) {
            // Desenhar o quadro atual da animação se for uma imagem válida e estiver completamente carregada
            ctx.drawImage(this.frames[this.frameIndex], this.x, this.y);
        }
    }
}

function activateExplosion() {
    var currentTime = Date.now();
    if (currentTime - lastExplosionTime > explosionDelay) {
        let explosionCount = 0; // Contador de explosões realizadas
        let maxExplosions = 10; // Número máximo de explosões a serem realizadas

        // Função para criar uma explosão a cada intervalo de tempo
        if (explosions <= maxExplosions) {
            var explosionInterval = setInterval(function() {
                if (explosionCount < maxExplosions) {
                    let x = Math.random() * (canvas.width - 250); // Coordenada x dentro do canvas
                    let y = Math.random() * (canvas.height - 250); // Coordenada y dentro do canvas
                    // Criar a explosão
                    explosions.push(new Explosion(x, y));
                    score += fireballs.length;
                    document.getElementById('score').textContent = `Score: ${score}`;
                    fireballs = [];
                    explosionCount++;
                } else {
                    clearInterval(explosionInterval); // Parar o intervalo quando todas as explosões forem criadas
                    lastExplosionTime = currentTime;
                }
            }, 100); // Intervalo de tempo entre cada explosão em milissegundos   
        }
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
        fireballs = [];
        explosions = [];
        score = 0;
        document.getElementById('score').textContent = `Score: ${score}`;
        lastExplosionTime = 0;
    }

    if (event.key === "x") {
        if (Date.now() - lastExplosionTime > explosionDelay) {
            activateExplosion();
        }
    }
    if (event.key === "f") {
        player.launchFirewave();
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

function drawCooldownBar() {
    const barWidth = 200;
    const barHeight = 20;
    const barPadding = 10;
    const cooldownRemaining = Math.max(0, (lastExplosionTime + explosionDelay - Date.now()) / explosionDelay);
    const barFillWidth = barWidth * cooldownRemaining;

    // Desenhar a barra de progresso
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(barPadding, canvas.height - barHeight - barPadding, barFillWidth, barHeight);
}

function drawFirewaveCooldownBar() {
    const barWidth = 200;
    const barHeight = 20;
    const cooldownRemaining = Math.max(0, (player.lastFirewaveTime + player.firewaveCooldown - Date.now()) / player.firewaveCooldown);
    const barFillWidth = barWidth * cooldownRemaining;

    // Desenhar a barra de progresso
    ctx.fillStyle = '#ff9800'; // Cor laranja para a barra de cooldown da Firewave
    ctx.fillRect(20, 20, barFillWidth, barHeight);
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
        player.checkCollision(fireballs);
        drawCooldownBar();
        drawFirewaveCooldownBar();

        // Adicione novos projéteis com uma certa chance
        if (Math.random() < 0.011) {
            let x = Math.random() * (canvas.width - 48);
            let y = -100; // Começar acima da tela
            let speed = Math.random() * (2.5 - 0.5) + 0.5;
            let numFrames = 5; // 5 frames de animação
            fireballs.push(new Fireball(x, y, speed, numFrames));
        }

        // Desenhar e atualizar as explosões
        explosions.forEach(explosion => {
            explosion.update();
            explosion.draw(ctx);
        });

        // Atualizar e desenhar todos os projéteis
        fireballs.forEach((fireball, index) => {
            fireball.update();
            fireball.draw(ctx);
            fireball.updateAnimation();
            // Remover projéteis que saíram da tela para economizar memória
            if (fireball.y > canvas.height) {
                fireballs.splice(index, 1);
                score++;
                document.getElementById('score').textContent = `Score: ${score}`;
            }
        });

        firewaves.forEach((firewave, index) => {
            firewave.update();
            firewave.draw(ctx);
            firewave.updateAnimation();
            // Remover Firewaves que saíram da tela para economizar memória
            if (firewave.x > canvas.width) {
                firewaves.splice(index, 1);
            }
        });
    }

    requestAnimationFrame(draw);
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
draw();