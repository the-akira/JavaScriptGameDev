const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');

let gameSpeed = 6;
let gravity = 0.8;
let score = 0;
let gameOver = false;
let gameStarted = false;

// Sistema de dia/noite
let dayNightCycle = 0; // 0 a 1 (0 = dia completo, 0.5 = noite completa, 1 = dia novamente)
let cycleSpeed = 0.0003; // Velocidade da transição

// Sistema de chuva
let isRaining = false;
let rainDuration = 0;
let rainCheckTimer = 0;
let rainDrops = [];
let rainIntensity = 0;

// Sistema de vento
let isWindy = false;
let windDuration = 0;
let windCheckTimer = 0;
let leaves = [];
let windIntensity = 0;

// Sistema de neblina
let isFoggy = false;
let fogDuration = 0;
let fogCheckTimer = 0;
let fogIntensity = 0;
let fogClouds = [];

// Sistema de arco-íris
let showRainbow = false;
let rainbowIntensity = 0;
let rainbowTimer = 0;

let featherPower = false;
let featherTimer = 0;
const normalJumpForce = -13.9;
const featherJumpForce = -18; // pulo mais forte

let horseshoePower = false;
let horseshoeTimer = 0;
const horseshoeDuration = 60 * 10; // 10 segundos

// Power-up: Relógio (slow motion)
let clockPower = false;
let clockTimer = 0;
const clockDuration = 60 * 6; // 6 segundos
let normalGameSpeed = 6; // ajuste ao valor real do seu jogo

let isMuted = false;

// Sons do jogo
const sndJump = new Audio('sounds/jump.wav');
const sndDeath = new Audio('sounds/death.wav');
const sndSpeed = new Audio('sounds/speed.wav');
const sndItem = new Audio('sounds/item.wav');
const sndSecret = new Audio('sounds/secret.wav');

// reduz latência (importante para jogos)
sndJump.preload = 'auto';
sndDeath.preload = 'auto';
sndSpeed.preload = 'auto';
sndItem.preload = 'auto';
sndSecret.preload = 'auto';

// garante que não fiquem muito altos
sndJump.volume = 0.6;
sndDeath.volume = 0.7;
sndSpeed.volume = 0.5;
sndItem.volume = 0.4;
sndSecret.volume = 0.3;

sndJump.load();
sndDeath.load();
sndSpeed.load();
sndItem.load();
sndSecret.load();

document.getElementById('muteBtn').addEventListener('click', () => {
    isMuted = !isMuted;

    // Atualiza volume real
    updateMuteState();

    // Atualiza ícone
    document.getElementById('muteBtn').textContent = isMuted ? '🔇' : '🔊';
});

function updateMuteState() {
    const volume = isMuted ? 0 : 1;

    sndJump.volume = 0.6 * volume;
    sndDeath.volume = 0.7 * volume;
    sndSpeed.volume = 0.5 * volume;
    sndItem.volume = 0.4 * volume;
    sndSecret.volume = 0.3 * volume;
}

let particles = [];

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.size = Math.random() * 3 + 2; // partículas menores (2–5)
        this.speedX = (Math.random() * -1.5) - 0.5; 
        this.speedY = Math.random() * -0.5; // ainda mais perto do chão

        this.opacity = 1;
        this.decay = Math.random() * 0.015 + 0.01; // desaparecem mais devagar
        this.color = "rgba(205, 170, 125,"; // poeira clara
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= this.decay;
        this.size *= 0.97;
    }

    draw() {
        if (this.opacity <= 0) return;

        ctx.fillStyle = this.color + this.opacity + ")";
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function spawnDustParticles() {
    const leftX = horse.x + 12;
    const rightX = horse.x + horse.width - 12;
    const y = horse.groundY + 55; // pertinho do chão

    particles.push(new Particle(leftX, y));
    particles.push(new Particle(rightX, y));
}

const horse = {
    x: 100,
    y: 0,
    width: 50,
    height: 50,
    velocityY: 0,
    jumping: false,
    groundY: canvas.height - 60,

    draw() {
        // Efeito de invencibilidade (aura)
        if (invincible && !gameOver) {
            const intensity = invincibleTimer / (60 * 5); 
            ctx.save();
            ctx.globalAlpha = 0.6 * intensity;
            ctx.fillStyle = "#FFF8A0";
            ctx.beginPath();
            ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width + 10, this.height + 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (featherPower && !gameOver) {
            const intensity = featherTimer / (60 * 6); // 1 → 0

            ctx.save();
            ctx.globalAlpha = 0.45 * intensity; 
            ctx.fillStyle = "#AEE6FF";

            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            const baseRadius = (this.width + 15);
            const sides = 8; // octógono
            const angleStep = (Math.PI * 2) / sides;

            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const angle = i * angleStep;
                const px = centerX + Math.cos(angle) * baseRadius;
                const py = centerY + Math.sin(angle) * baseRadius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        if (horseshoePower && !gameOver) {
            const intensity = horseshoeTimer / horseshoeDuration;

            ctx.save();
            ctx.globalAlpha = 0.5 * intensity;
            ctx.fillStyle = "#a8ffac";

            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            // raio do hexágono
            const radius = (this.width + 28) * 0.8;
            const sides = 6;
            const step = (Math.PI * 2) / sides;

            ctx.beginPath();

            for (let i = 0; i < sides; i++) {
                const angle = step * i - Math.PI / 2; // começa em cima
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        if (clockPower && !gameOver) {
            const intensity = clockTimer / clockDuration;

            ctx.save();
            ctx.globalAlpha = 0.4 * intensity;
            ctx.fillStyle = "#85D7FF";

            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            const sides = 5;
            const radius = (this.width + 25) * 0.8;
            const step = (Math.PI * 2) / sides;

            ctx.beginPath();

            for (let i = 0; i < sides; i++) {
                const angle = i * step - Math.PI / 2; // começa no topo
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Corpo
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y + 15, this.width, this.height - 25);
        // Cabeça
        ctx.fillRect(this.x + this.width - 10, this.y - 5, 20, 20);
        // Pernas
        ctx.fillRect(this.x + 5, this.y + this.height - 10, 8, 15);
        ctx.fillRect(this.x + this.width - 13, this.y + this.height - 10, 8, 15);
        // Orelha
        ctx.fillRect(this.x + this.width - 10, this.y - 10, 5, 20);
        // Patas
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 5, this.y + this.height, 8, 5);
        ctx.fillRect(this.x + this.width - 13, this.y + this.height, 8, 5);
        // Olho
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + this.width - 5, this.y, 3, 3);
        // Crina
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + this.width - 15, this.y - 5, 5, 20);
        // Cauda
        ctx.fillRect(this.x - 18, this.y + 15, this.width - 32, 5);
    },

    update() {
        if (this.jumping) {
            this.velocityY += gravity;
            this.y += this.velocityY;

            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.jumping = false;
                this.velocityY = 0;
            }
        } else {
            this.y = this.groundY;
        }
    },

    jump() {
        if (!this.jumping) {
            this.jumping = true;
            if (!isMuted) sndJump.play();
            this.velocityY = featherPower ? featherJumpForce : normalJumpForce;
        }
    }
};

horse.y = horse.groundY;

class Obstacle {
    constructor() {
        this.x = canvas.width;
        const rand = Math.random();
        
        if (rand < 0.2) {
            this.type = 'flower';
            this.height = 50;
            this.y = canvas.height - 50;
            this.width = 25;
        } else if (rand < 0.4) {
            this.type = 'small';
            this.height = 70;
            this.y = canvas.height - 70;
            this.width = 30;
        } else if (rand < 0.6) {
            this.type = 'tall';
            this.height = 100;
            this.y = canvas.height - 100;
            this.width = 35;
        } else if (rand < 0.8) {
            this.type = 'palm';
            this.height = 95;
            this.y = canvas.height - 95;
            this.width = 30;
        } else {
            this.type = 'bush';
            this.height = 55;
            this.y = canvas.height - 59;
            this.width = 40;
        }
    }

    draw() {
       if (this.type === 'flower') {
            // Flor
            // Caule
            ctx.fillStyle = '#228B22';
            ctx.fillRect(this.x + 10, this.y + 10, 4, 35);
            
            // Folha
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.ellipse(this.x + 5, this.y + 28, 6, 4, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Pétalas (5 pétalas rosa)
            ctx.fillStyle = '#FF69B4';
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const petalX = this.x + 12 + Math.cos(angle) * 8;
                const petalY = this.y + 12 + Math.sin(angle) * 8;
                ctx.beginPath();
                ctx.arc(petalX, petalY, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Centro da flor
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x + 12, this.y + 12, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'small') {
            // Árvore pequena
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + 10, this.y + 30, 10, 40);
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y + 15, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 5, this.y + 25, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 25, this.y + 25, 15, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'tall') {
            // Árvore alta
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + 12, this.y + 40, 12, 60);
            ctx.fillStyle = '#2E8B57';
            ctx.beginPath();
            ctx.arc(this.x + 18, this.y + 20, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 6, this.y + 32, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 30, this.y + 32, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 18, this.y + 45, 20, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'palm') {
            const offsetY = -5;

            // Palmeira / Árvore tropical
            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.moveTo(this.x + 15, this.y + 95 + offsetY);
            ctx.quadraticCurveTo(this.x + 12, this.y + 60 + offsetY, this.x + 15, this.y + 25 + offsetY);
            ctx.lineTo(this.x + 20, this.y + 25 + offsetY);
            ctx.quadraticCurveTo(this.x + 23, this.y + 60 + offsetY, this.x + 20, this.y + 95 + offsetY);
            ctx.closePath();
            ctx.fill();

            // Texturas no tronco
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const yPos = this.y + 40 + i * 10 + 5;
                ctx.beginPath();
                ctx.arc(this.x + 17, yPos, 10, 0.2, Math.PI - 0.2);
                ctx.stroke();
            }

            // Folhas (6 folhas ao redor)
            ctx.fillStyle = '#228B22';
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                ctx.save();
                ctx.translate(this.x + 17, this.y + 20 + offsetY);
                ctx.rotate(angle);

                ctx.beginPath();
                ctx.ellipse(0, -15, 5, 18, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            // Centro das folhas
            ctx.fillStyle = '#006400';
            ctx.beginPath();
            ctx.arc(this.x + 17, this.y + 20 + offsetY, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'bush') {
            // Arbusto denso
            // Base mais escura
            ctx.fillStyle = '#2D5016';
            ctx.beginPath();
            ctx.ellipse(this.x + 20, this.y + 45, 18, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Camada de folhagem - vários círculos formando arbusto
            ctx.fillStyle = '#3A7022';
            
            // Círculos da base
            ctx.beginPath();
            ctx.arc(this.x + 8, this.y + 40, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y + 42, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x + 32, this.y + 40, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Camada do meio
            ctx.fillStyle = '#4A8C2A';
            ctx.beginPath();
            ctx.arc(this.x + 12, this.y + 30, 11, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x + 28, this.y + 30, 11, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y + 28, 13, 0, Math.PI * 2);
            ctx.fill();
            
            // Camada superior (mais clara)
            ctx.fillStyle = '#5FA731';
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y + 18, 9, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x + 25, this.y + 18, 9, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y + 15, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Alguns detalhes de galhos/espinhos
            ctx.strokeStyle = '#2D5016';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y + 35);
            ctx.lineTo(this.x + 2, this.y + 32);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 35, this.y + 35);
            ctx.lineTo(this.x + 38, this.y + 32);
            ctx.stroke();
        }
    }

    update() {
        this.x -= gameSpeed;
    }
}

let obstacles = [];
let frameCount = 0;
let spawnInterval = 90;
let nextSpawn = 90;

function spawnObstacle() {
    obstacles.push(new Obstacle());
    // Intervalo aleatório entre 50 e 120 frames (mais variado)
    nextSpawn = frameCount + Math.floor(Math.random() * 70) + 50;
}

let powerUps = [];
let powerUpsFeather = [];
let powerUpsHorseshoe = [];
let powerUpsClock = [];
let invincible = false;
let invincibleTimer = 0;

function activateInvincibility() {
    invincible = true;
    if (!isMuted) {
        sndItem.currentTime = 0;
        sndItem.play();
    }
    invincibleTimer = 60 * 5; // 5 segundos
}

class PowerUpStar {
    constructor() {
        this.x = canvas.width;
        this.y = horse.groundY - 40; // Meio do ar
        this.width = 30;
        this.height = 30;
        this.rotation = 0;
        this.pulseScale = 1;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + 15, this.y + 15);
        ctx.rotate(this.rotation);
        ctx.scale(this.pulseScale, this.pulseScale);
        
        // Estrela dourada
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI / 2.5) * i - Math.PI / 2;
            const outerX = Math.cos(angle) * 15;
            const outerY = Math.sin(angle) * 15;
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * 7;
            const innerY = Math.sin(innerAngle) * 7;
            
            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        
        // Brilho
        ctx.fillStyle = '#FFED4E';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Aura brilhante
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(this.rotation * 5) * 0.2})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    update() {
        this.x -= gameSpeed;
        this.rotation += 0.1;
        this.pulseScale = 1 + Math.sin(this.rotation * 3) * 0.1;
    }

    checkCollision(player) {
        return (
            this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y
        );
    }
}

function activateFeather() {
    featherPower = true;
    if (!isMuted) {
        sndItem.currentTime = 0;
        sndItem.play();
    }
    featherTimer = 60 * 6; // dura 6 segundos
}

class PowerUpFeather {
    constructor() {
        this.x = canvas.width + 50;
        this.y = horse.groundY - 40;
        this.width = 25;
        this.height = 40;
        this.rotation = 0;
        this.speed = gameSpeed * 0.9;
    }

    update() {
        this.x -= this.speed;
        this.rotation += 0.04;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);

        // peninha (forma elíptica com "raiz")
        ctx.fillStyle = "#ADD8E6";
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // haste central
        ctx.strokeStyle = "#87CEFA";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(0, 18);
        ctx.stroke();

        ctx.restore();
    }

    checkCollision(player) {
        return (
            this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y
        );
    }
}

function activateHorseshoe() {
    horseshoePower = true;
    if (!isMuted) {
        sndItem.currentTime = 0;
        sndItem.play();
    }
    horseshoeTimer = horseshoeDuration;
}

class PowerUpHorseshoe {
    constructor() {
        this.x = canvas.width + 50;
        this.y = horse.groundY - 40;
        this.size = 35;
        this.rotation = 0;
        this.speed = gameSpeed * 0.9;
    }

    update() {
        this.x -= this.speed;
        this.rotation += 0.05;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.size/2, this.y + this.size/2);
        ctx.rotate(this.rotation);

        // cor do brilho
        ctx.shadowColor = "#FFD966";
        ctx.shadowBlur = 15;

        // Ferradura simples
        ctx.strokeStyle = "#DAA520";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 15, Math.PI * 0.25, Math.PI * 1.75, false);
        ctx.stroke();

        // pontos na ferradura
        ctx.fillStyle = "#FFF2B0";
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI * 0.25 + (i / 5) * (Math.PI * 1.5);
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * 12, Math.sin(angle) * 12, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    checkCollision(player) {
        return (
            this.x < player.x + player.width &&
            this.x + this.size > player.x &&
            this.y < player.y + player.height &&
            this.y + this.size > player.y
        );
    }
}

function activateClock() {
    if (!clockPower) {
        normalGameSpeed = gameSpeed; // salva a velocidade real atual
    }

    clockPower = true;
    clockTimer = clockDuration;
    if (!isMuted) {
        sndItem.currentTime = 0;
        sndItem.play();
    }

    // sorteio: true = acelerar, false = desacelerar
    const fast = Math.random() < 0.5;

    if (fast) {
        gameSpeed = Math.min(normalGameSpeed * 1.3, 20); 
    } else {
        gameSpeed = normalGameSpeed * 0.7;  // 30% mais lento
    }
}

class PowerUpClock {
    constructor() {
        this.x = canvas.width + 50;
        this.y = horse.groundY - 45;
        this.size = 40;
        this.rotation = 0;
        this.speed = gameSpeed * 0.9;
    }

    update() {
        this.x -= this.speed;
        this.rotation += 0.05;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.size/2, this.y + this.size/2);
        ctx.rotate(this.rotation);

        // corpo do relógio
        ctx.fillStyle = "#87CEFA";
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // borda
        ctx.strokeStyle = "#1E90FF";
        ctx.lineWidth = 3;
        ctx.stroke();

        // ponteiros
        ctx.strokeStyle = "#003366";
        ctx.lineWidth = 2;

        // ponteiro maior
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -12);
        ctx.stroke();

        // ponteiro menor
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(10, 6);
        ctx.stroke();

        ctx.restore();
    }

    checkCollision(player) {
        return (
            this.x < player.x + player.width &&
            this.x + this.size > player.x &&
            this.y < player.y + player.height &&
            this.y + this.size > player.y
        );
    }
}

function checkCollision(horse, obstacle) {
    return horse.x < obstacle.x + obstacle.width - 10 &&
           horse.x + horse.width > obstacle.x + 10 &&
           horse.y < obstacle.y + obstacle.height - 10 &&
           horse.y + horse.height > obstacle.y + 10;
}

function drawGround() {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 5, canvas.width, 5);
}

function drawSun() {
    // Calcula a opacidade do sol (visível durante o dia)
    // dayNightCycle: 0 = dia, 0.5 = noite, 1 = dia
    let sunOpacity;
    if (dayNightCycle < 0.25) {
        // Dia pleno (início)
        sunOpacity = 1;
    } else if (dayNightCycle < 0.5) {
        // Transição dia -> noite (sol desaparecendo)
        sunOpacity = 1 - ((dayNightCycle - 0.25) / 0.25);
    } else if (dayNightCycle < 0.75) {
        // Noite plena (sol invisível)
        sunOpacity = 0;
    } else {
        // Transição noite -> dia (sol aparecendo)
        sunOpacity = (dayNightCycle - 0.75) / 0.25;
    }
    
    if (sunOpacity > 0) {
        // Sol
        ctx.fillStyle = `rgba(255, 215, 0, ${sunOpacity})`;
        ctx.beginPath();
        ctx.arc(710, 85, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Brilho interno
        ctx.fillStyle = `rgba(255, 237, 78, ${sunOpacity})`;
        ctx.beginPath();
        ctx.arc(710, 85, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Raios do sol
        ctx.strokeStyle = `rgba(255, 215, 0, ${sunOpacity})`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const x1 = 710 + Math.cos(angle) * 50;
            const y1 = 85 + Math.sin(angle) * 50;
            const x2 = 710 + Math.cos(angle) * 65;
            const y2 = 85 + Math.sin(angle) * 65;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
}

function drawMoon() {
    // Calcula a opacidade da lua (visível durante a noite)
    let moonOpacity;
    if (dayNightCycle < 0.25) {
        // Dia pleno (lua invisível)
        moonOpacity = 0;
    } else if (dayNightCycle < 0.5) {
        // Transição dia -> noite (lua aparecendo)
        moonOpacity = (dayNightCycle - 0.25) / 0.25;
    } else if (dayNightCycle < 0.75) {
        // Noite plena
        moonOpacity = 1;
    } else {
        // Transição noite -> dia (lua desaparecendo)
        moonOpacity = 1 - ((dayNightCycle - 0.75) / 0.25);
    }
    
    if (moonOpacity > 0) {
        // Lua
        ctx.fillStyle = `rgba(240, 240, 245, ${moonOpacity})`;
        ctx.beginPath();
        ctx.arc(710, 85, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // Crateras
        ctx.fillStyle = `rgba(200, 200, 210, ${moonOpacity * 0.5})`;
        ctx.beginPath();
        ctx.arc(700, 80, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(720, 90, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(715, 75, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawStars() {
    // Estrelas visíveis apenas à noite
    let starOpacity;
    if (dayNightCycle < 0.25) {
        starOpacity = 0;
    } else if (dayNightCycle < 0.5) {
        starOpacity = (dayNightCycle - 0.25) / 0.25;
    } else if (dayNightCycle < 0.75) {
        starOpacity = 1;
    } else {
        starOpacity = 1 - ((dayNightCycle - 0.75) / 0.25);
    }
    
    if (starOpacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity})`;
        
        // Posições fixas de estrelas
        const stars = [
            {x: 50, y: 50, size: 2},
            {x: 150, y: 80, size: 1.5},
            {x: 250, y: 40, size: 2},
            {x: 350, y: 70, size: 1},
            {x: 450, y: 50, size: 2},
            {x: 550, y: 90, size: 1.5},
            {x: 100, y: 120, size: 1},
            {x: 200, y: 110, size: 2},
            {x: 300, y: 130, size: 1.5},
            {x: 400, y: 100, size: 1},
            {x: 500, y: 140, size: 2},
            {x: 600, y: 120, size: 1.5},
            {x: 750, y: 140, size: 1.5},
            {x: 650, y: 60, size: 1},
            {x: 780, y: 50, size: 2}
        ];
        
        stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

function updateBackground() {
    // Atualiza o ciclo dia/noite
    if (gameStarted && !gameOver) {
        dayNightCycle += cycleSpeed;
        if (dayNightCycle > 1) {
            dayNightCycle = 0;
        }
    }
    
    // Calcula as cores do céu baseado no ciclo
    let skyColor1, skyColor2, groundColor;
    
    if (dayNightCycle < 0.5) {
        // Transição dia -> noite
        const t = dayNightCycle * 2; // 0 a 1
        skyColor1 = interpolateColor([135, 206, 235], [25, 25, 112], t); // Azul claro -> Azul escuro
        skyColor2 = interpolateColor([224, 246, 255], [72, 61, 139], t); // Azul muito claro -> Roxo escuro
        groundColor = interpolateColor([144, 238, 144], [34, 139, 34], t); // Verde claro -> Verde escuro
    } else {
        // Transição noite -> dia
        const t = (dayNightCycle - 0.5) * 2; // 0 a 1
        skyColor1 = interpolateColor([25, 25, 112], [135, 206, 235], t); // Azul escuro -> Azul claro
        skyColor2 = interpolateColor([72, 61, 139], [224, 246, 255], t); // Roxo escuro -> Azul muito claro
        groundColor = interpolateColor([34, 139, 34], [144, 238, 144], t); // Verde escuro -> Verde claro
    }
    
    // Aplica o gradiente de fundo
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, `rgb(${skyColor1[0]}, ${skyColor1[1]}, ${skyColor1[2]})`);
    gradient.addColorStop(0.7, `rgb(${skyColor2[0]}, ${skyColor2[1]}, ${skyColor2[2]})`);
    gradient.addColorStop(1, `rgb(${groundColor[0]}, ${groundColor[1]}, ${groundColor[2]})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function interpolateColor(color1, color2, t) {
    return [
        Math.round(color1[0] + (color2[0] - color1[0]) * t),
        Math.round(color1[1] + (color2[1] - color1[1]) * t),
        Math.round(color1[2] + (color2[2] - color1[2]) * t)
    ];
}

function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Clique ou pressione qualquer tecla para começar', canvas.width / 2, canvas.height / 2);
}

// Nuvens
class Cloud {
    constructor() {
        this.x = canvas.width + Math.random() * 200;
        this.y = Math.random() * 150 + 30;
        this.speed = Math.random() * 0.5 + 0.3;
        this.scale = Math.random() * 0.4 + 0.8;
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        
        // Três círculos formando uma nuvem
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20 * this.scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x + 25 * this.scale, this.y, 25 * this.scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x + 50 * this.scale, this.y, 20 * this.scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x + 15 * this.scale, this.y - 10 * this.scale, 18 * this.scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x + 35 * this.scale, this.y - 8 * this.scale, 18 * this.scale, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.x -= this.speed;
        
        // Reposiciona a nuvem quando sai da tela
        if (this.x + 60 * this.scale < 0) {
            this.x = canvas.width + Math.random() * 200;
            this.y = Math.random() * 150 + 30;
            this.speed = Math.random() * 0.5 + 0.3;
            this.scale = Math.random() * 0.4 + 0.8;
        }
    }
}

let clouds = [];
// Cria 3 nuvens iniciais
for (let i = 0; i < 3; i++) {
    const cloud = new Cloud();
    cloud.x = Math.random() * canvas.width;
    clouds.push(cloud);
}

// Sistema de vento com folhas
class Leaf {
    constructor() {
        this.x = canvas.width + Math.random() * 100;
        this.y = Math.random() * canvas.height * 0.7; // Ficam na parte superior
        this.speedX = Math.random() * 4 + 3;
        this.speedY = Math.sin(Math.random() * Math.PI) * 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 8 + 5;
        this.swingSpeed = Math.random() * 0.1 + 0.05;
        this.swingOffset = Math.random() * Math.PI * 2;
        this.color = this.getLeafColor();
        this.opacity = Math.random() * 0.3 + 0.5;
    }

    getLeafColor() {
        const colors = [
            '#8B4513', // Marrom
            '#A0522D', // Marrom claro
            '#CD853F', // Peru
            '#DAA520', // Dourado
            '#228B22', // Verde
            '#6B8E23', // Verde oliva
            '#D2691E'  // Chocolate
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity * windIntensity;
        
        // Desenha folha (forma oval alongada)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size / 2, this.size, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nervura central da folha
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(0, this.size);
        ctx.stroke();
        
        ctx.restore();
    }

    update() {
        this.x -= this.speedX * windIntensity;
        this.y += this.speedY + Math.sin(this.x * this.swingSpeed + this.swingOffset) * 0.5;
        this.rotation += this.rotationSpeed;
        
        // Reposiciona quando sai da tela
        if (this.x < -20) {
            this.x = canvas.width + Math.random() * 100;
            this.y = Math.random() * canvas.height * 0.7;
        }
        
        if (this.y < -20 || this.y > canvas.height) {
            this.y = Math.random() * canvas.height * 0.7;
        }
    }
}

function updateWind() {
    if (gameStarted && !gameOver) {
        windCheckTimer++;
        
        // A cada 7 segundos, verifica se vai começar a ventar
        if (windCheckTimer >= 420) {
            windCheckTimer = 0;
            
            if (!isWindy && windIntensity === 0 && !isRaining && !isFoggy) {
                // 25% de chance de começar a ventar (não venta durante chuva)
                if (Math.random() < 0.25) {
                    startWind();
                }
            }
        }
        
        // Atualiza a duração do vento
        if (isWindy) {
            // Fade in - aumenta intensidade gradualmente
            if (windIntensity < 1) {
                windIntensity += 0.02;
                if (windIntensity > 1) windIntensity = 1;
            }
            
            windDuration--;
            if (windDuration <= 0) {
                isWindy = false;
            }
        }
        
        // Fade out - diminui intensidade gradualmente
        if (!isWindy && windIntensity > 0) {
            windIntensity -= 0.01;
            if (windIntensity < 0) {
                windIntensity = 0;
                stopWind();
            }
        }
    }
    
    // Atualiza e desenha as folhas
    if (windIntensity > 0) {
        leaves.forEach(leaf => {
            leaf.update();
            leaf.draw();
        });
    }
}

function startWind() {
    isWindy = true;
    windDuration = Math.random() * 400 + 300; // Venta por 5 a 12 segundos
    windIntensity = 0;
    
    // Cria 25 folhas
    leaves = [];
    for (let i = 0; i < 25; i++) {
        const leaf = new Leaf();
        leaf.x = Math.random() * canvas.width; // Espalha por toda a tela inicialmente
        leaves.push(leaf);
    }
}

function stopWind() {
    leaves = [];
}

// Sistema de chuva
class RainDrop {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.length = Math.random() * 15 + 10;
        this.speed = Math.random() * 3 + 5;
        this.baseOpacity = Math.random() * 0.3 + 0.3;
    }

    draw() {
        // Multiplica a opacidade base pela intensidade da chuva
        const currentOpacity = this.baseOpacity * rainIntensity;
        ctx.strokeStyle = `rgba(174, 194, 224, ${currentOpacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - 3, this.y + this.length);
        ctx.stroke();
    }

    update() {
        this.y += this.speed;
        this.x -= 1;

        // Reposiciona quando sai da tela
        if (this.y > canvas.height) {
            this.y = -20;
            this.x = Math.random() * canvas.width;
        }
        
        if (this.x < 0) {
            this.x = canvas.width;
        }
    }
}

function updateRain() {
    if (gameStarted && !gameOver) {
        rainCheckTimer++;
        
        // A cada 5 segundos (300 frames), verifica se vai começar a chover
        if (rainCheckTimer >= 300) {
            rainCheckTimer = 0;
            
            if (!isRaining && rainIntensity === 0) {
                // 20% de chance de começar a chover
                if (Math.random() < 0.2) {
                    startRain();
                }
            }
        }
        
        // Atualiza a duração da chuva
        if (isRaining) {
            // Fade in - aumenta intensidade gradualmente
            if (rainIntensity < 1) {
                rainIntensity += 0.02;
                if (rainIntensity > 1) rainIntensity = 1;
            }
            
            rainDuration--;
            if (rainDuration <= 0) {
                isRaining = false; // Marca para começar o fade out
            }
        }
        
        // Fade out - diminui intensidade gradualmente
        if (!isRaining && rainIntensity > 0) {
            rainIntensity -= 0.01;
            if (rainIntensity < 0) {
                rainIntensity = 0;
                stopRain();
            }
        }
    }
    
    // Atualiza e desenha as gotas
    if (rainIntensity > 0) {
        rainDrops.forEach(drop => {
            drop.update();
            drop.draw();
        });
    }
}

function startRain() {
    isRaining = true;
    rainDuration = Math.random() * 600 + 300; // Chove por 5 a 15 segundos
    rainIntensity = 0; // Começa com intensidade zero para fade in
    
    // Cria 100 gotas de chuva
    rainDrops = [];
    for (let i = 0; i < 100; i++) {
        rainDrops.push(new RainDrop());
    }
}

function stopRain() {
    rainDrops = [];
}

// Sistema de neblina
class FogCloud {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height - Math.random() * 150 - 50; // Perto do chão
        this.width = Math.random() * 150 + 100;
        this.height = Math.random() * 60 + 40;
        this.speedX = Math.random() * 0.3 + 0.2;
        this.opacity = Math.random() * 0.15 + 0.1;
        this.offsetY = Math.random() * Math.PI * 2;
        this.floatA = Math.random() * 0.02 + 0.01;
        this.floatB = Math.random() * 0.04 + 0.02;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity * fogIntensity;

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        const floatY =
            Math.sin(frameCount * this.floatA + this.offsetY) * 3 +
            Math.cos(frameCount * this.floatB + this.offsetY) * 1.5;

        // Desenha 4 camadas menores para efeito mais natural
        for (let i = 0; i < 4; i++) {
            const layerScale = 1 - i * 0.18; // cada camada é menor
            const w = (this.width * layerScale);
            const h = (this.height * layerScale);

            // Gradiente suave
            const gradient = ctx.createRadialGradient(
                centerX, centerY + floatY,
                0,
                centerX, centerY + floatY,
                w * 0.6
            );

            gradient.addColorStop(0, `rgba(230, 230, 240, 0.35)`);
            gradient.addColorStop(0.5, `rgba(200, 200, 210, 0.22)`);
            gradient.addColorStop(1, `rgba(180, 180, 190, 0)`);

            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.ellipse(
                centerX,
                centerY + floatY + i * 3, // leve deslocamento por camada
                w * 0.55,
                h * 0.45,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        ctx.restore();
    }

    update() {
        this.x -= this.speedX;
        
        // Reposiciona quando sai da tela
        if (this.x + this.width < 0) {
            this.x = canvas.width + Math.random() * 100;
            this.y = canvas.height - Math.random() * 150 - 50;
        }
    }
}

function updateFog() {
    if (gameStarted && !gameOver) {
        fogCheckTimer++;
        
        // A cada 8 segundos, verifica se vai ficar nebuloso
        if (fogCheckTimer >= 480) {
            fogCheckTimer = 0;
            
            if (!isFoggy && fogIntensity === 0 && !isRaining && !isWindy) {
                // 20% de chance de começar neblina
                if (Math.random() < 0.2) {
                    startFog();
                }
            }
        }
        
        // Atualiza a duração da neblina
        if (isFoggy) {
            // Fade in - aumenta intensidade gradualmente
            if (fogIntensity < 1) {
                fogIntensity += 0.008; // Mais lento para ser sutil
                if (fogIntensity > 1) fogIntensity = 1;
            }
            
            fogDuration--;
            if (fogDuration <= 0) {
                isFoggy = false;
            }
        }
        
        // Fade out - diminui intensidade gradualmente
        if (!isFoggy && fogIntensity > 0) {
            fogIntensity -= 0.008;
            if (fogIntensity < 0) {
                fogIntensity = 0;
                stopFog();
            }
        }
    }
    
    // Atualiza e desenha a neblina
    if (fogIntensity > 0) {
        fogClouds.forEach(cloud => {
            cloud.update();
            cloud.draw();
        });
    }
}

function startFog() {
    isFoggy = true;
    fogDuration = Math.random() * 600 + 400; // Neblina por 7 a 17 segundos
    fogIntensity = 0;
    
    // Cria 12 nuvens de neblina
    fogClouds = [];
    for (let i = 0; i < 26; i++) {
        fogClouds.push(new FogCloud());
    }
}

function stopFog() {
    fogClouds = [];
}

// Sistema de arco-íris
function drawRainbow() {
    if (rainbowIntensity > 0) {
        ctx.save();
        ctx.globalAlpha = rainbowIntensity * 0.5; // Mais suave
        
        const centerX = canvas.width * 0.5;
        const centerY = canvas.height - 100; // Mais perto do horizonte
        const radiusStart = 100; // Menor
        const arcWidth = 12; // Arcos mais finos
        
        // Cores do arco-íris (de fora para dentro)
        const colors = [
            '#FF0000', // Vermelho
            '#FF7F00', // Laranja
            '#FFFF00', // Amarelo
            '#00FF00', // Verde
            '#009CFE', // Azul
            '#0000FF', // Índigo
            '#9400D3'  // Violeta
        ];
        
        // Desenha cada arco
        for (let i = 0; i < colors.length; i++) {
            ctx.strokeStyle = colors[i];
            ctx.lineWidth = arcWidth;
            ctx.beginPath();
            ctx.arc(
                centerX, 
                centerY, 
                radiusStart + i * arcWidth, 
                Math.PI, 
                0
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

function updateRainbow() {
    // Verifica se deve mostrar arco-íris
    // Arco-íris aparece quando está chovendo E há sol (dia)
    const isSunny = dayNightCycle < 0.25 || dayNightCycle > 0.75;
    
    if (isRaining && isSunny) {
        showRainbow = true;
        rainbowTimer = 0;
    }
    
    // Se parar de chover, começa a contar o timer
    if (!isRaining && showRainbow) {
        rainbowTimer++;
        
        // Arco-íris fica por 5 segundos após parar de chover
        if (rainbowTimer > 300) {
            showRainbow = false;
            rainbowTimer = 0;
        }
    }
    
    // Fade in
    if (showRainbow && rainbowIntensity < 1) {
        rainbowIntensity += 0.01;
        if (rainbowIntensity > 0.7) rainbowIntensity = 0.7; // Opacidade máxima de 70%
    }
    
    // Fade out
    if (!showRainbow && rainbowIntensity > 0) {
        rainbowIntensity -= 0.008;
        if (rainbowIntensity < 0) rainbowIntensity = 0;
    }
}

// Montanhas com parallax
class Mountain {
    constructor(layer) {
        this.layer = layer;
        this.x = 0;
        this.speed = layer * 0.5;
        this.width = canvas.width;
        
        if (layer === 1) {
            this.color = '#8B7D6B';
            this.baseHeight = 150;
        } else if (layer === 2) {
            this.color = '#A0826D';
            this.baseHeight = 120;
        } else {
            this.color = '#B8956A';
            this.baseHeight = 100;
        }
        
        // Gera os pontos da montanha uma única vez
        this.points = [];
        const numPoints = 20;
        for (let i = 0; i <= numPoints; i++) {
            const variation = Math.sin(i * 0.8) * 30 + Math.cos(i * 1.2) * 20;
            this.points.push(this.baseHeight + variation);
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        // Calcula o deslocamento suave
        const offsetX = -(this.x % this.width);
        const pointWidth = this.width / (this.points.length - 1);
        
        // Desenha três repetições para garantir cobertura total
        for (let rep = -1; rep <= 1; rep++) {
            const startX = rep * this.width + offsetX;
            
            if (rep === -1) {
                ctx.moveTo(startX, canvas.height - 5);
            }
            
            for (let i = 0; i < this.points.length; i++) {
                const x = startX + i * pointWidth;
                const y = canvas.height - this.points[i];
                ctx.lineTo(x, y);
            }
        }
        
        ctx.lineTo(this.width * 2 + offsetX, canvas.height - 5);
        ctx.lineTo(offsetX - this.width, canvas.height - 5);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        if (gameStarted && !gameOver) {
            this.x += this.speed;
        }
    }
}

let mountains = [
    new Mountain(1),
    new Mountain(2),
    new Mountain(3)
];

// Adicione estas variáveis no início do script
let nightMode = false;
let nightModeChance = 0.1; // 10% de chance de ativar o modo noite
let nightModeActive = false;
let nightModeDuration = 0;
let nightModeTimer = 0;

// Adicione esta função para verificar se o modo noite deve ser ativado
function checkNightMode() {
    if (!nightModeActive && Math.random() < nightModeChance) {
        activateNightMode();
    }
}

// Função para ativar o modo noite
function activateNightMode() {
    nightModeActive = true;
    if (!isMuted) sndSecret.play();
    nightModeDuration = 60 * 7; // 20 segundos
    nightModeTimer = nightModeDuration;
    gameSpeed = 6;
}

// Função para desativar o modo noite
function deactivateNightMode() {
    nightModeActive = false;
}

function drawFlashlight() {
    if (!nightModeActive) return;
    
    // Cria um gradiente radial para o efeito de lanterna
    const gradient = ctx.createRadialGradient(
        horse.x + horse.width / 2, // Centro X (cavalo)
        horse.y + horse.height / 2, // Centro Y (cavalo)
        0, // Raio interno
        horse.x + horse.width / 2, // Centro X
        horse.y + horse.height / 2, // Centro Y
        250 // Raio externo (área iluminada)
    );
    
    // Gradiente do transparente (fora) para escuro (dentro)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    
    // Desenha uma máscara escura sobre toda a tela
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenha um pequeno brilho no centro da lanterna
    const glowGradient = ctx.createRadialGradient(
        horse.x + horse.width / 2,
        horse.y + horse.height / 2,
        0,
        horse.x + horse.width / 2,
        horse.y + horse.height / 2,
        80
    );
    
    glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Adicione esta função para desenhar a interface do modo noite
function drawNightModeUI() {
    if (!nightModeActive) return;
    
    // Desenha um indicador de tempo restante do modo noite
    const progress = nightModeTimer / nightModeDuration;
    const barWidth = 100;
    const barHeight = 10;
    const x = canvas.width - barWidth - 10;
    const y = 20;
    
    // Fundo da barra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Barra de progresso
    ctx.fillStyle = '#8A2BE2'; // Roxo para combinar com o tema noturno
    ctx.fillRect(x, y, barWidth * progress, barHeight);
    
    // Borda
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // Texto
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.fillText('Modo Trevas', x + 50, y - 5);
}

function drawSpeedUI() {
    const maxSpeed = 20; // limite visual máximo (ajustável)
    const normalized = Math.min(gameSpeed / maxSpeed, 1);

    const barWidth = 150;
    const barHeight = 12;
    const x = 15;
    const y = 15;

    // Fundo da barra
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Barra preenchida
    ctx.fillStyle = '#00E676'; // verde neon
    ctx.fillRect(x, y, barWidth * normalized, barHeight);

    // Borda
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Texto
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Velocidade: ${gameSpeed.toFixed(1)}x`, x + 50, y + barHeight + 15);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateBackground();

    // Arco-íris (atrás das montanhas)
    drawRainbow();

    // Desenha montanhas (camadas de trás para frente)
    mountains.forEach(mountain => {
        mountain.update();
        mountain.draw();
    });

    // Desenha nuvens (atrás de tudo)
    clouds.forEach(cloud => {
        cloud.update();
        cloud.draw();
    });

    // ----- atualizar e desenhar partículas -----
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();

        if (p.opacity <= 0 || p.size <= 0.5) {
            particles.splice(i, 1);
        }
    }

    if (horse.y + horse.height >= horse.groundY && !gameOver && gameStarted) {
        spawnDustParticles();
    }

    drawStars();
    drawSun();
    drawMoon();
    horse.update();
    horse.draw();
    drawGround();
    updateRain();
    updateWind();
    updateFog();
    updateRainbow();

    if (!gameStarted) {
        drawStartScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px Arial';
        ctx.fillText(`Pontuação: ${Math.floor(score / 10)}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Clique ou pressione qualquer tecla para reiniciar', canvas.width / 2, canvas.height / 2 + 60);
        requestAnimationFrame(gameLoop);
        return;
    }

    frameCount++;
    if (frameCount >= nextSpawn) {
        spawnObstacle();
    }

    if (Math.random() < 0.0009) {
        powerUps.push(new PowerUpStar());
    }

    // spawn da pena (chance baixa)
    if (Math.random() < 0.001) {
        powerUpsFeather.push(new PowerUpFeather());
    }

    // spawn da ferradura mágica
    if (Math.random() < 0.001) {
        powerUpsHorseshoe.push(new PowerUpHorseshoe());
    }

    // spawn do relógio (raro)
    if (Math.random() < 0.00075) {
        powerUpsClock.push(new PowerUpClock());
    }

    for (let i = powerUpsClock.length - 1; i >= 0; i--) {
        const p = powerUpsClock[i];
        p.update();
        p.draw();

        if (p.checkCollision(horse)) {
            activateClock();
            powerUpsClock.splice(i, 1);
            continue;
        }

        if (p.x + p.size < 0) {
            powerUpsClock.splice(i, 1);
        }
    }

    for (let i = powerUpsHorseshoe.length - 1; i >= 0; i--) {
        const p = powerUpsHorseshoe[i];
        p.update();
        p.draw();

        if (p.checkCollision(horse)) {
            activateHorseshoe();
            powerUpsHorseshoe.splice(i, 1);
            continue;
        }

        if (p.x + p.size < 0) {
            powerUpsHorseshoe.splice(i, 1);
        }
    }

    // Atualiza power-ups de pena
    for (let i = powerUpsFeather.length - 1; i >= 0; i--) {
        const p = powerUpsFeather[i];
        p.update();
        p.draw();

        if (p.checkCollision(horse)) {
            activateFeather();
            powerUpsFeather.splice(i, 1);
            continue;
        }

        if (p.x + p.width < 0) {
            powerUpsFeather.splice(i, 1);
        }
    }

    // Atualiza os power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].update();
        powerUps[i].draw();

        if (powerUps[i].checkCollision(horse)) {
            activateInvincibility();
            powerUps.splice(i, 1);
            continue;
        }

        if (powerUps[i].x + powerUps[i].size < 0) {
            powerUps.splice(i, 1);
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        obstacles[i].draw();

        if (!invincible && checkCollision(horse, obstacles[i])) {
            gameOver = true;
            if (!isMuted) sndDeath.play();
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }

    score += horseshoePower ? 2 : 1;
    scoreDisplay.textContent = `Pontuação: ${Math.floor(score / 10)}`;

    if (score % 500 === 0) {
        gameSpeed = Math.min(gameSpeed + 0.5, 20);
        if (!isMuted) sndSpeed.play();
    }

    // Contagem da invencibilidade
    if (invincible) {
        invincibleTimer--;
        if (invincibleTimer <= 0) {
            invincible = false;
        }
    }

    // Contagem da pena
    if (featherPower) {
        featherTimer--;
        if (featherTimer <= 0) {
            featherPower = false;
        }
    }

    // Contagem da ferradura
    if (horseshoePower) {
        horseshoeTimer--;
        if (horseshoeTimer <= 0) {
            horseshoePower = false;
        }
    }

    if (clockPower) {
        clockTimer--;

        // conforme o tempo acaba, pode fazer ele voltar suavemente
        if (clockTimer <= 0) {
            gameSpeed = normalGameSpeed;
            clockPower = false;
        }
    }

    // Verifica se deve ativar o modo noite
    if (gameStarted && !gameOver && !nightModeActive && frameCount % 300 === 0) {
        checkNightMode();
    }
    
    // Atualiza o temporizador do modo noite
    if (nightModeActive) {
        nightModeTimer--;
        if (nightModeTimer <= 0) {
            deactivateNightMode();
        }
    }
    
    // Desenha o efeito de lanterna por último (sobre tudo)
    if (nightModeActive) {
        drawFlashlight();
    }
    
    // Desenha a UI do modo noite
    drawNightModeUI();
    drawSpeedUI();

    requestAnimationFrame(gameLoop);
}

function resetGame() {
    gameSpeed = 6;
    score = 0;
    gameOver = false;
    gameStarted = true;
    obstacles = [];
    frameCount = 0;
    spawnInterval = 90;
    nextSpawn = 90;
    horse.y = horse.groundY;
    horse.velocityY = 0;
    horse.jumping = false;
    scoreDisplay.textContent = 'Pontuação: 0';
    dayNightCycle = 0;
    isRaining = false;
    rainDuration = 0;
    rainCheckTimer = 0;
    rainDrops = [];
    featherPower = false;
    invincible = false;
    horseshoePower = false;
    clockPower = false;
    powerUps = [];
    powerUpsFeather = [];
    powerUpsHorseshoe = [];
    powerUpsClock = [];
    nightMode = false;
    nightModeActive = false;
    isWindy = false;
    windDuration = 0;
    windCheckTimer = 0;
    leaves = [];
    windIntensity = 0;
    isFoggy = false;
    fogDuration = 0;
    fogCheckTimer = 0;
    fogIntensity = 0;
    fogClouds = [];
    showRainbow = false;
    rainbowIntensity = 0;
    rainbowTimer = 0;
}

function handleInput() {
    if (!gameStarted) {
        gameStarted = true;
        return;
    }
    
    if (gameOver) {
        resetGame();
        return;
    }
    
    horse.jump();
}

document.addEventListener('keydown', function(e) {
    handleInput();
});

canvas.addEventListener('click', function() {
    handleInput();
});

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    handleInput();
});

gameLoop();