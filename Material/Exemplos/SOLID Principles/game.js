// ============================================
// PRINCÍPIOS SOLID EM AÇÃO
// ============================================

// S - SINGLE RESPONSIBILITY PRINCIPLE
// Cada classe tem uma única responsabilidade bem definida

// Interface base para objetos desenháveis
class Drawable {
    draw(ctx) {
        throw new Error("Método draw deve ser implementado");
    }
}

// Interface para objetos móveis
class Movable {
    move() {
        throw new Error("Método move deve ser implementado");
    }
}

// Interface para objetos que podem colidir
class Collidable {
    getBounds() {
        throw new Error("Método getBounds deve ser implementado");
    }
    
    collidesWith(other) {
        const bounds1 = this.getBounds();
        const bounds2 = other.getBounds();
        return bounds1.x < bounds2.x + bounds2.width &&
               bounds1.x + bounds1.width > bounds2.x &&
               bounds1.y < bounds2.y + bounds2.height &&
               bounds1.y + bounds1.height > bounds2.y;
    }
}

// S - Classe com responsabilidade única: representar uma posição
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(vector) {
        return new Vector2D(this.x + vector.x, this.y + vector.y);
    }
    
    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }
}

// S - Responsabilidade única: gerenciar input do usuário
class InputManager {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            // Previne comportamento padrão para evitar scroll
            if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            // Previne comportamento padrão para evitar scroll
            if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
        });
    }
    
    isPressed(key) {
        return !!this.keys[key];
    }
}

// S - Responsabilidade única: efeitos visuais Matrix
class MatrixEffect {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.drops = [];
        this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()";
        this.fontSize = 14;
        this.columns = Math.floor(canvas.width / this.fontSize);
        
        for(let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * canvas.height;
        }
    }
    
    update() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#0f0';
        this.ctx.font = this.fontSize + 'px courier';
        
        for(let i = 0; i < this.drops.length; i++) {
            const char = this.chars[Math.floor(Math.random() * this.chars.length)];
            this.ctx.fillText(char, i * this.fontSize, this.drops[i]);
            
            if(this.drops[i] > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i] += this.fontSize;
        }
    }
}

// L - LISKOV SUBSTITUTION PRINCIPLE
// Diferentes tipos de projéteis podem substituir a classe base sem quebrar o código

class Projectile extends Drawable {
    constructor(x, y, velocity, color = '#0f0') {
        super();
        this.position = new Vector2D(x, y);
        this.velocity = velocity;
        this.color = color;
        this.width = 4;
        this.height = 10;
        this.active = true;
    }
    
    move() {
        this.position = this.position.add(this.velocity);
        
        // Remove projétil se sair da tela
        if (this.position.y < 0 || this.position.y > 600) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        
        // Efeito Matrix glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
    
    getBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height
        };
    }
}

// L - Projétil do player pode substituir Projectile
class PlayerBullet extends Projectile {
    constructor(x, y) {
        super(x, y, new Vector2D(0, -8), '#0ff');
    }
}

// L - Projétil do inimigo pode substituir Projectile
class EnemyBullet extends Projectile {
    constructor(x, y) {
        super(x, y, new Vector2D(0, 4), '#f00');
    }
}

// S - Responsabilidade única: representar e controlar o jogador
class Player extends Drawable {
    constructor(x, y) {
        super();
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.width = 40;
        this.height = 30;
        this.speed = 5;
        this.lastShot = 0;
        this.shotCooldown = 450;
        this.health = 3;
        this.invulnerable = false;
        this.invulnDuration = 2000; // 2 segundos
        this.lastHitTime = 0;
    }

    takeDamage() {
        const now = Date.now();
        if (this.invulnerable && now - this.lastHitTime < this.invulnDuration) return;

        this.health--;
        this.lastHitTime = now;
        this.invulnerable = true;

        setTimeout(() => {
            this.invulnerable = false;
        }, this.invulnDuration);
    }
    
    move(inputManager) {
        this.velocity = new Vector2D(0, 0);
        
        if (inputManager.isPressed('ArrowLeft') && this.position.x > 0) {
            this.velocity.x = -this.speed;
        }
        if (inputManager.isPressed('ArrowRight') && this.position.x < 800 - this.width) {
            this.velocity.x = this.speed;
        }
        
        this.position = this.position.add(this.velocity);
    }
    
    canShoot() {
        return Date.now() - this.lastShot > this.shotCooldown;
    }
    
    shoot() {
        if (this.canShoot()) {
            this.lastShot = Date.now();
            return new PlayerBullet(this.position.x + this.width/2, this.position.y);
        }
        return null;
    }
    
    draw(ctx) {
        const x = this.position.x;
        const y = this.position.y;

        // Piscar se invulnerável
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            return; // não desenha neste frame para efeito de piscar
        }
        
        // Corpo principal da nave (formato triangular futurista)
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(x + 20, y); // Ponta superior
        ctx.lineTo(x + 5, y + 25); // Canto esquerdo inferior
        ctx.lineTo(x + 35, y + 25); // Canto direito inferior
        ctx.closePath();
        ctx.fill();
        
        // Asas laterais
        ctx.fillStyle = '#00aaaa';
        ctx.fillRect(x, y + 18, 12, 8); // Asa esquerda
        ctx.fillRect(x + 28, y + 18, 12, 8); // Asa direita
        
        // Cockpit central
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 20, y + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Propulsores traseiros
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(x + 8.5, y + 25, 3, 5); // Motor esquerdo
        ctx.fillRect(x + 29.5, y + 25, 3, 5); // Motor direito
        
        // Efeito glow ao redor da nave
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 20, y);
        ctx.lineTo(x + 5, y + 25);
        ctx.lineTo(x + 35, y + 25);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Efeito de propulsão (partículas atrás)
        if (Math.random() < 0.7) {
            ctx.fillStyle = `rgba(255, 100, 0, ${Math.random()})`;
            ctx.fillRect(x + 9, y + 30, 2, Math.random() * 8);
            ctx.fillRect(x + 30, y + 30, 2, Math.random() * 8);
        }
    }
    
    getBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height
        };
    }
}

// O - OPEN/CLOSED PRINCIPLE
// Podemos criar diferentes tipos de inimigos sem modificar a classe base

class Enemy extends Drawable {
    constructor(x, y, type = 'basic') {
        super();
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(1, 0);
        this.width = 30;
        this.height = 20;
        this.type = type;
        this.lastShot = 0;
        this.shotCooldown = 2000 + Math.random() * 3000;
        this.active = true;
        this.color = this.getColorByType(type);
    }
    
    getColorByType(type) {
        const colors = {
            'basic': '#0f0',     // Verde
            'fast': '#ff0',      // Amarelo
            'strong': '#f80',    // Laranja
            'boss': '#f0f'       // Magenta
        };
        return colors[type] || '#0f0';
    }
    
    move() {
        this.position = this.position.add(this.velocity);
    }
    
    reverseDirection() {
        this.velocity.x *= -1;
        this.position.y += 20;
    }
    
    canShoot() {
        return Date.now() - this.lastShot > this.shotCooldown && Math.random() < 0.001;
    }
    
    shoot() {
        if (this.canShoot()) {
            this.lastShot = Date.now();
            return new EnemyBullet(this.position.x + this.width/2, this.position.y + this.height);
        }
        return null;
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const x = this.position.x;
        const y = this.position.y;
        
        // Corpo principal hexagonal futurista
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(x + 15, y); // Topo
        ctx.lineTo(x + 25, y + 5); // Topo direito
        ctx.lineTo(x + 25, y + 15); // Baixo direito
        ctx.lineTo(x + 15, y + 20); // Baixo
        ctx.lineTo(x + 5, y + 15); // Baixo esquerdo
        ctx.lineTo(x + 5, y + 5); // Topo esquerdo
        ctx.closePath();
        ctx.fill();
        
        // Núcleo interno
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + 15, y + 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Antenas/Sensores
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 15, y);
        ctx.lineTo(x + 15, y - 5);
        ctx.moveTo(x + 5, y + 5);
        ctx.lineTo(x, y);
        ctx.moveTo(x + 25, y + 5);
        ctx.lineTo(x + 30, y);
        ctx.stroke();
        
        // Propulsores inferiores
        ctx.fillStyle = this.getDarkerColor();
        ctx.fillRect(x + 8, y + 20, 4, 3);
        ctx.fillRect(x + 18, y + 20, 4, 3);
        
        // Efeito glow pulsante
        const pulseIntensity = Math.sin(Date.now() * 0.01) * 5 + 10;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = pulseIntensity;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + 15, y + 10, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Efeito de energia (pequenas partículas)
        if (Math.random() < 0.3) {
            ctx.fillStyle = this.getBrighterColor();
            const sparkX = x + Math.random() * 30;
            const sparkY = y + Math.random() * 20;
            ctx.fillRect(sparkX, sparkY, 1, 1);
        }
    }
    
    getBrighterColor() {
        const colorMap = {
            '#0f0': '#5f5',     // Verde claro
            '#ff0': '#ff5',     // Amarelo claro
            '#f80': '#ffa',     // Laranja claro
            '#f0f': '#f5f'      // Magenta claro
        };
        return colorMap[this.color] || '#fff';
    }
    
    getDarkerColor() {
        const colorMap = {
            '#0f0': '#070',     // Verde escuro
            '#ff0': '#aa0',     // Amarelo escuro
            '#f80': '#a50',     // Laranja escuro
            '#f0f': '#a0a'      // Magenta escuro
        };
        return colorMap[this.color] || '#333';
    }
    
    getBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height
        };
    }
}

// O - Extensão: novo tipo de inimigo sem modificar Enemy
class BossEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'boss');
        // Mesmo tamanho que inimigo básico
        this.width = 30;
        this.height = 20;
        this.health = 3;
        this.shotCooldown = 1000;
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const x = this.position.x;
        const y = this.position.y;
        
        // Boss com o mesmo formato hexagonal que os outros
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(x + 15, y); // Topo
        ctx.lineTo(x + 25, y + 5); // Topo direito
        ctx.lineTo(x + 25, y + 15); // Baixo direito
        ctx.lineTo(x + 15, y + 20); // Baixo
        ctx.lineTo(x + 5, y + 15); // Baixo esquerdo
        ctx.lineTo(x + 5, y + 5); // Topo esquerdo
        ctx.closePath();
        ctx.fill();
        
        // Núcleo interno pulsante (maior que os outros)
        const pulseSize = Math.sin(Date.now() * 0.02) * 1 + 6;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 15, y + 10, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Antenas/Sensores (mesmo padrão)
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 15, y);
        ctx.lineTo(x + 15, y - 5);
        ctx.moveTo(x + 5, y + 5);
        ctx.lineTo(x, y);
        ctx.moveTo(x + 25, y + 5);
        ctx.lineTo(x + 30, y);
        ctx.stroke();
        
        // Propulsores inferiores
        ctx.fillStyle = this.getDarkerColor();
        ctx.fillRect(x + 8, y + 20, 4, 3);
        ctx.fillRect(x + 18, y + 20, 4, 3);
        
        // Efeito glow mais intenso para boss
        const glowIntensity = Math.sin(Date.now() * 0.015) * 8 + 18;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = glowIntensity;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + 15, y + 10, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Partículas de energia mais intensas (mas dentro do mesmo espaço)
        if (Math.random() < 0.6) {
            ctx.fillStyle = this.getBrighterColor();
            for(let i = 0; i < 4; i++) {
                const sparkX = x + 5 + Math.random() * 20;
                const sparkY = y + Math.random() * 20;
                ctx.fillRect(sparkX, sparkY, 1.5, 1.5);
            }
        }
    }
}

// S - Responsabilidade única: gerenciar sistema de partículas
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    addExplosion(x, y, color = '#0f0') {
        for(let i = 0; i < 15; i++) {
            this.particles.push({
                x: x + Math.random() * 20,
                y: y + Math.random() * 20,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color: color
            });
        }
    }
    
    update() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            return particle.life > 0;
        });
    }
    
    draw(ctx) {
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x, particle.y, 3, 3);
        });
        ctx.globalAlpha = 1.0;
    }
}

// D - DEPENDENCY INVERSION PRINCIPLE
// Game depende de abstrações (interfaces), não de implementações concretas
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputManager = new InputManager();
        this.particleSystem = new ParticleSystem();
        
        // D - Dependemos de abstrações, não de implementações
        this.player = new Player(380, 550);
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        
        this.score = 0;
        this.gameOver = false;
        this.wave = 1;
        
        this.spawnEnemies();
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }
    
    spawnEnemies() {
        this.enemies = [];
        const rows = Math.min(8, 3 + Math.floor(this.wave / 3));
        const cols = 8;
        
        for(let row = 0; row < rows; row++) {
            for(let col = 0; col < cols; col++) {
                const x = col * 80 + 100;
                const y = row * 50 + 50;
                
                // O - Criamos diferentes tipos de inimigos com cores diferentes
                const rand = Math.random();
                if(rand < 0.1) {
                    this.enemies.push(new BossEnemy(x, y)); // 10% boss (magenta)
                } else if(rand < 0.3) {
                    this.enemies.push(new Enemy(x, y, 'strong')); // 20% strong (laranja)
                } else if(rand < 0.5) {
                    this.enemies.push(new Enemy(x, y, 'fast')); // 20% fast (amarelo)
                } else {
                    this.enemies.push(new Enemy(x, y, 'basic')); // 50% basic (verde)
                }
            }
        }
    }
    
    handleInput() {
        if (this.inputManager.isPressed(' ')) {
            const bullet = this.player.shoot();
            if (bullet) {
                this.playerBullets.push(bullet);
            }
        }
        
        if (this.inputManager.isPressed('r') || this.inputManager.isPressed('R')) {
            this.restart();
        }
        
        this.player.move(this.inputManager);
    }
    
    update() {
        if (this.gameOver) return;
        
        // Update bullets
        this.playerBullets.forEach(bullet => bullet.move());
        this.enemyBullets.forEach(bullet => bullet.move());
        
        // Remove inactive bullets
        this.playerBullets = this.playerBullets.filter(bullet => bullet.active);
        this.enemyBullets = this.enemyBullets.filter(bullet => bullet.active);
        
        // Move enemies
        let shouldReverse = false;
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                enemy.move();
                if (enemy.position.x <= 0 || enemy.position.x >= 770) {
                    shouldReverse = true;
                }
                
                // Enemy shooting
                const bullet = enemy.shoot();
                if (bullet) {
                    this.enemyBullets.push(bullet);
                }
            }
        });
        
        if (shouldReverse) {
            this.enemies.forEach(enemy => {
                if (enemy.active) enemy.reverseDirection();
            });
        }
        
        this.checkCollisions();
        this.particleSystem.update();

        if (this.player.health <= 0) {
            this.gameOver = true;
        }
        
        // Check win condition
        if (this.enemies.filter(e => e.active).length === 0) {
            this.wave++;
            this.spawnEnemies();
        }
        
        // Check game over
        const activeEnemies = this.enemies.filter(e => e.active);
        if (activeEnemies.some(e => e.position.y > 500)) {
            this.gameOver = true;
        }
    }
    
    checkCollisions() {
        // I - INTERFACE SEGREGATION: usamos apenas métodos necessários
        
        // Player bullets vs enemies
        this.playerBullets.forEach(bullet => {
            this.enemies.forEach(enemy => {
                if (enemy.active && bullet.active && this.checkCollision(bullet, enemy)) {
                    bullet.active = false;
                    
                    if (enemy.type === 'boss' && enemy.health > 1) {
                        enemy.health--;
                        this.particleSystem.addExplosion(enemy.position.x, enemy.position.y, '#f0f');
                    } else {
                        enemy.active = false;
                        this.score += enemy.type === 'boss' ? 50 : 10;
                        this.particleSystem.addExplosion(enemy.position.x, enemy.position.y, enemy.color);
                    }
                }
            });
        });
        
        // Enemy bullets vs player
        this.enemyBullets.forEach(bullet => {
            if (bullet.active && this.checkCollision(bullet, this.player)) {
                bullet.active = false;
                this.player.takeDamage();
                this.particleSystem.addExplosion(this.player.position.x, this.player.position.y, '#0ff');
            }
        });
    }
    
    checkCollision(obj1, obj2) {
        const bounds1 = obj1.getBounds();
        const bounds2 = obj2.getBounds();
        return bounds1.x < bounds2.x + bounds2.width &&
               bounds1.x + bounds1.width > bounds2.x &&
               bounds1.y < bounds2.y + bounds2.height &&
               bounds1.y + bounds1.height > bounds2.y;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.gameOver) {
            this.player.draw(this.ctx);
        }

        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.playerBullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemyBullets.forEach(bullet => bullet.draw(this.ctx));
        this.particleSystem.draw(this.ctx);
        
        // UI
        this.ctx.fillStyle = '#0f0';
        this.ctx.font = '20px courier';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Wave: ${this.wave}`, 10, 60);
        this.ctx.fillText(`Vida: ${this.player.health}`, 10, 90);
        
        if (this.gameOver) {
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '48px courier';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SYSTEM FAILURE', 400, 250);
            this.ctx.font = '24px courier';
            this.ctx.fillText('Press R to Restart', 400, 300);
            this.ctx.textAlign = 'left';
        }
    }
    
    restart() {
        this.score = 0;
        this.wave = 1;
        this.gameOver = false;
        this.player = new Player(380, 550);
        this.playerBullets = [];
        this.enemyBullets = [];
        this.particleSystem = new ParticleSystem();
        this.spawnEnemies();
    }
    
    gameLoop() {
        this.handleInput();
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
}

// Inicialização
const gameCanvas = document.getElementById('gameCanvas');
const matrixCanvas = document.getElementById('matrixRain');

// Setup Matrix rain background
matrixCanvas.width = window.innerWidth;
matrixCanvas.height = window.innerHeight;
const matrixEffect = new MatrixEffect(matrixCanvas);

setInterval(() => {
    matrixEffect.update();
}, 50);

// Start game
const game = new Game(gameCanvas);

// Resize handler for matrix effect
window.addEventListener('resize', () => {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
});