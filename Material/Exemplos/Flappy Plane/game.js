const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

// Configurações do jogo
const game = {
    running: false,
    score: 0,
    gravity: 0.5,
    gameOver: false,
    started: false,
};

// Avião
const plane = {
    x: 80,
    y: canvas.height / 2 - 170,
    width: 40,
    height: 25,
    velocity: 0,
    lift: -10,

    // AJUSTE DA HITBOX
    hitboxPaddingX: 1,
    hitboxPaddingY: 1,
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Rotação baseada na velocidade
        const angle = Math.min(Math.max(this.velocity * 0.05, -0.5), 0.5);
        ctx.rotate(angle);
        
        // Corpo do avião
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Asas
        ctx.fillStyle = '#FF8787';
        ctx.fillRect(-5, -this.height/2 - 8, 20, 8);
        ctx.fillRect(-5, this.height/2, 20, 8);
        
        // Cockpit
        ctx.fillStyle = '#4ECDC4';
        ctx.beginPath();
        ctx.arc(this.width/4, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Cauda
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(-this.width/2 - 10, -8, 10, 16);
        
        ctx.restore();
    },
    
    update() {
        if (!game.started) return;

        this.velocity += game.gravity;
        this.y += this.velocity;
        
        // Limites da tela
        const groundVisualY = canvas.height - GROUND_HEIGHT;
        const hb = this.getHitbox();

        if (hb.y + hb.height >= groundVisualY) {
            this.y = groundVisualY - hb.height - this.hitboxPaddingY;
            endGame();
            return;
        }

        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
    },
    
    flap() {
        this.velocity = this.lift;
        game.started = true;
    },

    getHitbox() {
        return {
            x: this.x + this.hitboxPaddingX,
            y: this.y + this.hitboxPaddingY,
            width: this.width - this.hitboxPaddingX * 2,
            height: this.height - this.hitboxPaddingY * 2
        };
    },
    
    reset() {
        this.y = canvas.height / 2 - 170;
        this.velocity = 0;
    }
};

// Obstáculos
const obstacles = [];
const obstacleWidth = 60;
const gap = 180;
const GROUND_HEIGHT = 35;
let frameCount = 0;
const SHOW_HITBOX = false; 

class Obstacle {
    constructor() {
        this.x = canvas.width;
        this.width = obstacleWidth;
        this.gap = gap;
        const MIN_PIPE_HEIGHT = 80; 
        const MAX_PIPE_HEIGHT = canvas.height - gap - MIN_PIPE_HEIGHT;
        this.topHeight = Math.random() * (MAX_PIPE_HEIGHT - MIN_PIPE_HEIGHT) + MIN_PIPE_HEIGHT;
        this.scored = false;
    }
    
    draw() {
        // Obstáculo superior
        ctx.fillStyle = '#2ECC71';
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        ctx.fillStyle = '#27AE60';
        ctx.fillRect(this.x, this.topHeight - 20, this.width, 20);
        
        // Obstáculo inferior
        const bottomY = this.topHeight + this.gap;
        ctx.fillStyle = '#2ECC71';
        ctx.fillRect(this.x, bottomY, this.width, canvas.height - bottomY);
        ctx.fillStyle = '#27AE60';
        ctx.fillRect(this.x, bottomY, this.width, 20);
    }
    
    update() {
        this.x -= 3;
    }
    
    collidesWith(plane) {
        const hb = plane.getHitbox();

        const planeLeft   = hb.x;
        const planeRight  = hb.x + hb.width;
        const planeTop    = hb.y;
        const planeBottom = hb.y + hb.height;

        const obstacleLeft  = this.x;
        const obstacleRight = this.x + this.width;

        const topObstacleBottom = this.topHeight;
        const bottomObstacleTop = this.topHeight + this.gap;

        const horizontalOverlap =
            planeRight >= obstacleLeft &&
            planeLeft <= obstacleRight;

        if (!horizontalOverlap) return false;

        const hitTop =
            planeTop <= topObstacleBottom;

        const hitBottom =
            planeBottom >= bottomObstacleTop;

        return hitTop || hitBottom;
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    isPassed(plane) {
        return !this.scored && this.x + this.width < plane.x;
    }

    getTopHitbox() {
        return {
            x: this.x,
            y: 0,
            width: this.width,
            height: this.topHeight
        };
    }

    getBottomHitbox() {
        return {
            x: this.x,
            y: this.topHeight + this.gap,
            width: this.width,
            height: canvas.height - (this.topHeight + this.gap)
        };
    }
}

// Nuvens decorativas
const clouds = [];
for (let i = 0; i < 5; i++) {
    clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.6,
        width: 60 + Math.random() * 40,
        speed: 0.3 + Math.random() * 0.3
    });
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width/3, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/3, cloud.y, cloud.width/2.5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/1.5, cloud.y, cloud.width/3, 0, Math.PI * 2);
        ctx.fill();
        
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width + 50;
        }
    });
}

function drawBackground() {
    // Céu com gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateScore() {
    scoreEl.textContent = `Pontuação: ${game.score}`;
}

function endGame() {
    game.gameOver = true;
    game.running = false;
}

function drawGameOver() { 
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height/2 - 80, canvas.width, 160);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 20);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Pontuação: ${game.score}`, canvas.width/2, canvas.height/2 + 16);
    
    ctx.font = '18px Arial';
    ctx.fillText('Clique para reiniciar', canvas.width/2, canvas.height/2 + 50);
}

function drawWarning() { 
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height/2 - 80, canvas.width, 145);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Clique ou pressione ESPAÇO!', canvas.width/2, canvas.height/2 - 32);
    ctx.fillText('A gravidade será ativada!', canvas.width/2, canvas.height/2);
    ctx.fillText('Os obstáculos vão surgir!', canvas.width/2, canvas.height/2 + 32);
}

function resetGame() {
    game.score = 0;
    game.gameOver = false;
    game.running = true;
    game.started = false;
    frameCount = 0;
    obstacles.length = 0;
    plane.reset();
    updateScore();
}

function drawHitbox(rect, color = 'red') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
}

function drawGround() {
    ctx.save();
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - (GROUND_HEIGHT - 5), canvas.width, 50);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 5);
    ctx.restore();
}

function gameLoop() {
    if (!game.running) return;

    drawBackground();
    drawClouds();
    plane.update();
    plane.draw();

    if (!game.started) {
        drawWarning();
    }

    if (game.started) {
        // Criar novos obstáculos
        frameCount++;
        if (frameCount % 90 === 0) {
            obstacles.push(new Obstacle());
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].update();

            // Checa colisão entre obstáculo e avião com a posição ATUALIZADA
            if (obstacles[i].collidesWith(plane)) {
                endGame();
            }

            if (obstacles[i].isPassed(plane)) {
                obstacles[i].scored = true;
                game.score++;
                updateScore();
            }

            if (obstacles[i].isOffScreen()) {
                obstacles.splice(i, 1);
            }
        }
    }

    drawGround();

    // Desenhar obstáculos (já atualizados)
    obstacles.forEach(ob => {
        ob.draw();

        if (SHOW_HITBOX) {
            drawHitbox(ob.getTopHitbox(), 'yellow');
            drawHitbox(ob.getBottomHitbox(), 'yellow');
        }
    });

    // Debug hitbox (vai bater com a posição usada nas checagens)
    if (SHOW_HITBOX) {
        drawHitbox(plane.getHitbox(), 'red');
    }

    // Se quiser desenhar GameOver como overlay, faça aqui (último)
    if (game.gameOver) {
        drawGameOver(); // implemente conforme já conversamos
        return;
    }

    requestAnimationFrame(gameLoop);
}

// Controles
function handleInput() {
    if (game.gameOver) {
        resetGame();
        gameLoop();
    } else if (!game.running) {
        game.running = true;
        gameLoop();
    } else {
        plane.flap();
    }
}

canvas.addEventListener('click', handleInput);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (e.repeat) return; 
        e.preventDefault();
        handleInput();
    }
});

// Iniciar com tela de início
drawBackground();
drawClouds();
drawGround();
plane.draw();

ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
ctx.fillRect(0, canvas.height/2 - 60, canvas.width, 120);

ctx.fillStyle = 'white';
ctx.font = 'bold 36px Arial';
ctx.textAlign = 'center';
ctx.fillText('Flappy Plane', canvas.width/2, canvas.height/2 - 10);

ctx.font = '20px Arial';
ctx.fillText('Clique para começar!', canvas.width/2, canvas.height/2 + 35);