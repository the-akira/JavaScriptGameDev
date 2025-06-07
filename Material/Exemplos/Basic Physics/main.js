// Canvas e contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configurações da física
const physics = {
    gravity: 0.5,
    friction: 0.98,
    airResistance: 0.999,
    bounceDecay: 0.8,
    groundFriction: 0.85
};

// Estado do jogo
let gameState = {
    gravityEnabled: true,
    trailsEnabled: true,
    particlesEnabled: true,
    objects: [],
    particles: [],
    maxObjects: 15,
};

// Classe para objetos físicos
class PhysicsObject {
    constructor(x, y, radius, color, type = 'normal') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.type = type;
        
        // Propriedades físicas
        this.vx = (Math.random() - 0.5) * 10; // Velocidade X aleatória
        this.vy = Math.random() * -5 - 2;     // Velocidade Y inicial para cima
        this.mass = radius / 10;
        this.restitution = type === 'bouncy' ? 0.9 : 0.7;
        
        // Rastro visual
        this.trail = [];
        this.maxTrailLength = 20;
        
        // Efeitos visuais
        this.glowIntensity = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }
    
    update() {
        // Aplicar gravidade
        if (gameState.gravityEnabled) {
            this.vy += physics.gravity;
        }
        
        // Aplicar resistência do ar
        this.vx *= physics.airResistance;
        this.vy *= physics.airResistance;
        
        // Atualizar posição
        this.x += this.vx;
        this.y += this.vy;
        
        // Adicionar ao rastro
        if (gameState.trailsEnabled) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }
        
        // Colisão com bordas
        this.handleBoundaryCollision();
        
        // Atualizar efeitos visuais
        this.updateVisualEffects();
    }
    
    handleBoundaryCollision() {
        // Chão
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.vy *= -this.restitution;
            this.vx *= physics.groundFriction;
            this.createImpactParticles();
        }
        
        // Teto
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -this.restitution;
        }
        
        // Paredes laterais
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.vx *= -this.restitution;
            this.createImpactParticles();
        }
        
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -this.restitution;
            this.createImpactParticles();
        }
    }
    
    createImpactParticles() {
        if (!gameState.particlesEnabled) return;
        
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 3) {
            for (let i = 0; i < 5; i++) {
                gameState.particles.push(new Particle(
                    this.x,
                    this.y,
                    this.color,
                    'impact'
                ));
            }
        }
    }
    
    updateVisualEffects() {
        // Brilho baseado na velocidade
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.glowIntensity = Math.min(speed / 10, 1);
        
        // Pulso para bolas elásticas
        this.pulsePhase += 0.1;
    }
    
    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.radius + other.radius);
    }
    
    resolveCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        // Normalizar vetor de colisão
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Separar objetos
        const overlap = (this.radius + other.radius) - distance;
        const separationX = nx * overlap * 0.5;
        const separationY = ny * overlap * 0.5;
        
        this.x += separationX;
        this.y += separationY;
        other.x -= separationX;
        other.y -= separationY;
        
        // Velocidades relativas
        const rvx = this.vx - other.vx;
        const rvy = this.vy - other.vy;
        
        // Velocidade na direção da normal
        const normalVelocity = rvx * nx + rvy * ny;
        
        if (normalVelocity > 0) return;
        
        // Coeficiente de restituição
        const e = Math.min(this.restitution, other.restitution);
        
        // Impulso
        const impulse = -(1 + e) * normalVelocity / (1/this.mass + 1/other.mass);
        
        // Aplicar impulso
        const impulseX = impulse * nx;
        const impulseY = impulse * ny;
        
        this.vx += impulseX / this.mass;
        this.vy += impulseY / this.mass;
        other.vx -= impulseX / other.mass;
        other.vy -= impulseY / other.mass;
        
        // Criar partículas de colisão
        if (gameState.particlesEnabled) {
            for (let i = 0; i < 8; i++) {
                gameState.particles.push(new Particle(
                    (this.x + other.x) / 2,
                    (this.y + other.y) / 2,
                    '#ffffff',
                    'collision'
                ));
            }
        }
    }
    
    draw() {
        // Desenhar rastro
        if (gameState.trailsEnabled && this.trail.length > 1) {
            this.drawTrail();
        }
        
        // Desenhar brilho
        if (this.glowIntensity > 0) {
            this.drawGlow();
        }
        
        // Desenhar objeto principal
        ctx.save();
        
        // Pulso para bolas elásticas
        if (this.type === 'bouncy') {
            const pulse = Math.sin(this.pulsePhase) * 0.1 + 1;
            ctx.scale(pulse, pulse);
            ctx.translate(this.x / pulse, this.y / pulse);
        } else {
            ctx.translate(this.x, this.y);
        }
        
        // Gradiente radial
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, this.darkenColor(this.color, 0.3));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Brilho adicional
        const highlight = ctx.createRadialGradient(-this.radius/3, -this.radius/3, 0, 0, 0, this.radius/2);
        highlight.addColorStop(0, 'rgba(255,255,255,0.8)');
        highlight.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawTrail() {
        if (this.trail.length < 2) return;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        for (let i = 1; i < this.trail.length; i++) {
            const alpha = i / this.trail.length * 0.3;
            const size = (i / this.trail.length) * this.radius * 0.5;
            
            // Criar cor com alpha baseada na cor original
            let trailColor = this.color;
            if (this.color.startsWith('#')) {
                const hex = this.color.slice(1);
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                trailColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            } else if (this.color.startsWith('rgb')) {
                trailColor = this.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
            }
            
            ctx.fillStyle = trailColor;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawGlow() {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        const glowRadius = this.radius + this.glowIntensity * 20;
        const gradient = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, glowRadius);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(1, `rgba(255,255,255,${this.glowIntensity * 0.3})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    darkenColor(color, factor) {
        // Função auxiliar para escurecer cores
        if (color.startsWith('#')) {
            // Converter hex para rgb
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            
            const darkR = Math.floor(r * (1 - factor));
            const darkG = Math.floor(g * (1 - factor));
            const darkB = Math.floor(b * (1 - factor));
            
            return `rgb(${darkR}, ${darkG}, ${darkB})`;
        } else if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (!rgb || rgb.length < 3) return color;
            
            const r = Math.floor(parseInt(rgb[0]) * (1 - factor));
            const g = Math.floor(parseInt(rgb[1]) * (1 - factor));
            const b = Math.floor(parseInt(rgb[2]) * (1 - factor));
            
            return `rgb(${r}, ${g}, ${b})`;
        }
        
        return color; // Retorna a cor original se não conseguir processar
    }
}

// Classe para partículas
class Particle {
    constructor(x, y, color, type = 'normal') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        
        // Propriedades físicas
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 4 + 2;
        
        // Efeitos especiais por tipo
        if (type === 'collision') {
            this.vx *= 2;
            this.vy *= 2;
            this.decay *= 2;
        } else if (type === 'explosion') {
            this.vx *= 3;
            this.vy *= 3;
            this.size *= 1.5;
        }
    }
    
    update() {
        // Aplicar física
        if (gameState.gravityEnabled && this.type !== 'collision') {
            this.vy += physics.gravity * 0.3;
        }
        
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Diminuir vida
        this.life -= this.decay;
        this.size *= 0.99;
        
        return this.life > 0 && this.size > 0.1;
    }
    
    draw() {
        ctx.save();
        
        const alpha = this.life;
        ctx.globalAlpha = alpha;
        
        // Gradiente da partícula
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Funções de controle
function addBall() {
    if (gameState.objects.length >= gameState.maxObjects) {
        // Remove o objeto mais antigo
        gameState.objects.shift();
    }

    const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4d96ff', '#9b59b6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const radius = Math.random() * 15 + 15;
    
    gameState.objects.push(new PhysicsObject(
        Math.random() * (canvas.width - radius * 2) + radius,
        Math.random() * 100 + 50,
        radius,
        color,
        'normal'
    ));
}

function addBouncyBall() {
    if (gameState.objects.length >= gameState.maxObjects) {
        // Remove o objeto mais antigo
        gameState.objects.shift();
    }

    const radius = Math.random() * 12 + 18;
    
    gameState.objects.push(new PhysicsObject(
        Math.random() * (canvas.width - radius * 2) + radius,
        Math.random() * 100 + 50,
        radius,
        '#4ecdc4',
        'bouncy'
    ));
}

function createParticleExplosion() {
    if (!gameState.particlesEnabled) return;
    
    const centerX = Math.random() * canvas.width;
    const centerY = Math.random() * (canvas.height * 0.5) + 100;
    
    for (let i = 0; i < 50; i++) {
        gameState.particles.push(new Particle(
            centerX,
            centerY,
            '#280069',
            'explosion'
        ));
    }
}

function toggleGravity() {
    gameState.gravityEnabled = !gameState.gravityEnabled;
    document.getElementById('gravityStatus').textContent = gameState.gravityEnabled ? 'ON' : 'OFF';
}

function toggleTrails() {
    gameState.trailsEnabled = !gameState.trailsEnabled;
    document.getElementById('trailStatus').textContent = gameState.trailsEnabled ? 'ON' : 'OFF';
}

function toggleParticles() {
    gameState.particlesEnabled = !gameState.particlesEnabled;
    document.getElementById('particleStatus').textContent = gameState.particlesEnabled ? 'ON' : 'OFF';
    const btnExplosion = document.getElementById('btnExplosion');

    if (gameState.particlesEnabled) {
        btnExplosion.disabled = false;
    } else {
        btnExplosion.disabled = true;
        gameState.particles = [];
    }
}

function clearCanvas() {
    gameState.objects = [];
    gameState.particles = [];
}

// Event listeners
canvas.addEventListener('click', (e) => {
    if (gameState.objects.length >= gameState.maxObjects) {
        // Remove o objeto mais antigo
        gameState.objects.shift();
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffd93d'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const radius = Math.random() * 12 + 12;
    
    const ball = new PhysicsObject(x, y, radius, color);
    ball.vy = Math.random() * -8 - 2; // Impulso inicial para cima
    gameState.objects.push(ball);
    
    // Criar algumas partículas no clique
    if (gameState.particlesEnabled) {
        for (let i = 0; i < 5; i++) {
            gameState.particles.push(new Particle(x, y, color, 'normal'));
        }
    }
});

// Loop principal do jogo
function gameLoop() {
    // Limpar canvas completamente ou com fade para efeito de rastro
    if (gameState.trailsEnabled) {
        // Fade suave para criar efeito de rastro
        ctx.fillStyle = 'rgba(135, 206, 235, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Limpeza completa quando rastros estão desabilitados
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Redesenhar o fundo sem transparência
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Atualizar objetos
    gameState.objects.forEach(obj => obj.update());
    
    // Verificar colisões entre objetos
    for (let i = 0; i < gameState.objects.length; i++) {
        for (let j = i + 1; j < gameState.objects.length; j++) {
            if (gameState.objects[i].checkCollision(gameState.objects[j])) {
                gameState.objects[i].resolveCollision(gameState.objects[j]);
            }
        }
    }
    
    // Atualizar partículas
    if (gameState.particlesEnabled) {
        gameState.particles = gameState.particles.filter(particle => particle.update());
    }
    
    // Desenhar tudo
    gameState.objects.forEach(obj => obj.draw());
    if (gameState.particlesEnabled) {
        gameState.particles.forEach(particle => particle.draw());
    }
    
    // Informações na tela
    drawInfo();
    
    requestAnimationFrame(gameLoop);
}

function drawInfo() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, 10, 135, 110);
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`Objetos: ${gameState.objects.length}`, 20, 30);
    ctx.fillText(`Partículas: ${gameState.particles.length}`, 20, 50);
    ctx.fillText(`Gravidade: ${gameState.gravityEnabled ? 'ON' : 'OFF'}`, 20, 70);
    ctx.fillText(`Partículas: ${gameState.particlesEnabled ? 'ON' : 'OFF'}`, 20, 90);
    ctx.fillText(`Partículas: ${gameState.trailsEnabled ? 'ON' : 'OFF'}`, 20, 110);
}

// Inicializar jogo
function init() {
    // Adicionar alguns objetos iniciais
    addBall();
    addBouncyBall();
    // Iniciar loop do jogo
    gameLoop();
}

// Iniciar quando a página carregar
init();