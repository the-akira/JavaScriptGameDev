// PADRÃO SINGLETON - Game Manager
class GameManager {
    constructor() {
        if (GameManager.instance) {
            return GameManager.instance;
        }
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.gameState = 'playing'; // playing, gameOver
        this.entities = [];
        this.eventSystem = new EventSystem();
        this.inputManager = new InputManager();
        this.entityFactory = new EntityFactory();
        this.stars = this.generateStars(200);
        this.healthPackSpawnTimer = 0;
        this.healthPackSpawnInterval = 600; // 10 segundos a 60fps
        
        GameManager.instance = this;
        this.init();
    }

    static getInstance() {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    init() {
        // Subscribe to events
        this.eventSystem.subscribe('asteroidDestroyed', (data) => {
            this.score += data.points;
            this.updateUI();
        });

        this.eventSystem.subscribe('enemyDestroyed', (data) => {
            this.score += data.points;
            this.updateUI();
        });

        this.eventSystem.subscribe('playerDestroyed', () => {
            this.gameState = 'gameOver';
            this.showGameOver();
        });

        this.eventSystem.subscribe('playerHealthChanged', (data) => {
            this.updateHealthUI(data.health);
        });

        this.eventSystem.subscribe('enemyEscaped', () => {
            this.player.takeDamage(10); // Causa 10 de dano ao jogador
        });

        // Create initial entities
        this.player = this.entityFactory.createEntity('player', 400, 500);
        this.entities.push(this.player);

        // Spawn asteroids periodically
        this.asteroidSpawnTimer = 0;
        this.gameLoop();
    }

    updateHealthUI(health) {
        const healthBar = document.getElementById('healthBar');
        const healthPercent = (health / this.player.maxHealth) * 100;
        healthBar.style.width = `${healthPercent}%`;
        
        // Muda a cor conforme a vida diminui
        if (healthPercent < 20) {
            healthBar.style.backgroundColor = '#ff0000';
        } else if (healthPercent < 50) {
            healthBar.style.backgroundColor = '#ff9900';
        } else {
            healthBar.style.backgroundColor = '#00ff00';
        }
    }

    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.5,
                speed: 0.2 + Math.random() * 1.5 // Velocidade variada
            });
        }
        return stars;
    }

    updateStars() {
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
    }

    drawStars() {
        this.ctx.fillStyle = '#FFFFFF';
        this.stars.forEach(star => {
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }

    spawnEnemy() {
        const strategies = [
            new ChasePlayerStrategy(),
            new ZigZagMovementStrategy(),
            new CircleMovementStrategy(80, -50),
            new SideEntryMovementStrategy()
        ];
        
        const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
        const x = Math.random() * this.canvas.width;
        const enemy = this.entityFactory.createEntity('enemy', x, -50, { strategy: randomStrategy });
        this.entities.push(enemy);
    }

    gameLoop() {
        if (this.gameState === 'playing') {
            this.update();
            this.updateStars();
            this.render();
            
            // Spawn asteroids
            this.asteroidSpawnTimer++;
            if (this.asteroidSpawnTimer > 120) { // Every 2 seconds at 60fps
                this.spawnAsteroid();
                this.asteroidSpawnTimer = 0;
            }

            // Spawn de inimigos a cada 3 segundos (180 frames)
            this.enemySpawnTimer = (this.enemySpawnTimer || 0) + 1;
            if (this.enemySpawnTimer > 180) {
                this.spawnEnemy();
                this.enemySpawnTimer = 0;
            }

            // Spawn de itens de cura
            this.healthPackSpawnTimer++;
            if (this.healthPackSpawnTimer > this.healthPackSpawnInterval) {
                this.spawnHealthPack();
                this.healthPackSpawnTimer = 0;
            }
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    spawnHealthPack() {
        const x = Math.random() * (this.canvas.width - 50) + 25;
        const healthPack = this.entityFactory.createEntity('healthPack', x, -30);
        this.entities.push(healthPack);
    }

    update() {
        // Process continuous input for smooth movement
        this.inputManager.processContinuousInput();
        
        // Update all entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.update();
            
            // Remove dead entities
            if (entity.isDead) {
                this.entities.splice(i, 1);
            }
        }

        this.checkCollisions();
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render all entities
        this.drawStars();
        this.entities.forEach(entity => entity.render(this.ctx));
    }

    checkCollisions() {
        const bullets = this.entities.filter(e => e.type === 'bullet');
        const asteroids = this.entities.filter(e => e.type === 'asteroid');
        const enemies = this.entities.filter(e => e.type === 'enemy');

        // Bullet vs Asteroid
        bullets.forEach(bullet => {
            asteroids.forEach(asteroid => {
                if (this.isColliding(bullet, asteroid)) {
                    bullet.isDead = true;
                    asteroid.isDead = true;
                    this.eventSystem.publish('asteroidDestroyed', { points: 10 });
                }
            });

            // Nova colisão: Bullet vs Enemy
            enemies.forEach(enemy => {
                if (this.isColliding(bullet, enemy)) {
                    bullet.isDead = true;
                    enemy.isDead = true;
                    this.eventSystem.publish('enemyDestroyed', { points: 20 });
                }
            });
        });

        // Colisão Laser vs Asteroides/Inimigos
        const lasers = this.entities.filter(e => e.type === 'laser');
        lasers.forEach(laser => {
            [...asteroids, ...enemies].forEach(entity => {
                if (this.isLaserColliding(laser, entity)) {
                    entity.isDead = true;
                    const points = entity.type === 'asteroid' ? 10 : 20;
                    this.eventSystem.publish(`${entity.type}Destroyed`, { points });
                }
            });
        });

        // Colisão Player vs HealthPack
        const healthPacks = this.entities.filter(e => e.type === 'healthPack');
        healthPacks.forEach(healthPack => {
            if (this.isColliding(this.player, healthPack)) {
                this.player.heal(healthPack.healAmount);
                healthPack.isDead = true;
            }
        });

        // Player vs Asteroid/Enemy (existente)
        [...asteroids, ...enemies].forEach(entity => {
            if (this.isColliding(this.player, entity)) {
                this.player.takeDamage(25); // Dano de 25 por colisão
                entity.isDead = true; // Destrói o asteróide/inimigo
            }
        });
    }

    isLaserColliding(laser, entity) {
        // Verifica colisão retângulo (laser) com círculo (entidade)
        const closestX = Math.max(laser.x - laser.width/2, Math.min(entity.x, laser.x + laser.width/2));
        const closestY = Math.max(laser.y - laser.height/2, Math.min(entity.y, laser.y + laser.height/2));
        
        const distanceX = entity.x - closestX;
        const distanceY = entity.y - closestY;
        
        return (distanceX * distanceX + distanceY * distanceY) < (entity.radius * entity.radius);
    }

    isColliding(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (a.radius + b.radius);
    }

    spawnAsteroid() {
        const x = Math.random() * this.canvas.width;
        const asteroid = this.entityFactory.createEntity('asteroid', x, -50);
        this.entities.push(asteroid);
    }

    updateUI() {
        document.getElementById('score').innerHTML = `<b>Score:</b> ${this.score}`;
    }

    showGameOver() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
    }

    restart() {
        this.score = 0;
        this.gameState = 'playing';
        this.entities = [];
        this.asteroidSpawnTimer = 0;
        document.getElementById('gameOver').style.display = 'none';
        
        this.player = this.entityFactory.createEntity('player', 400, 500);
        this.entities.push(this.player);
        this.updateUI();
        this.updateHealthUI(this.player.maxHealth);
    }
}

// PADRÃO OBSERVER/PUBLISH-SUBSCRIBE - Event System
class EventSystem {
    constructor() {
        this.events = {};
    }

    subscribe(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    unsubscribe(eventName, callback) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        }
    }

    publish(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(data));
        }
    }
}

// PADRÃO FACTORY - Entity Factory
class EntityFactory {
    createEntity(type, x, y, options = {}) {
        switch (type) {
            case 'player':
                return new Player(x, y);
            case 'bullet':
                return new Bullet(x, y);
            case 'asteroid':
                return new Asteroid(x, y);
            case 'enemy':
                return new Enemy(x, y, options.strategy);
            case 'healthPack':
                return new HealthPack(x, y);
            case 'laser':
                return new LaserBullet(x, y);
            default:
                throw new Error(`Unknown entity type: ${type}`);
        }
    }
}

// PADRÃO COMMAND - Input Commands
class Command {
    execute() {
        throw new Error('Execute method must be implemented');
    }
}

class MoveCommand extends Command {
    constructor(entity, direction) {
        super();
        this.entity = entity;
        this.direction = direction;
    }

    execute() {
        this.entity.move(this.direction);
    }
}

class ShootCommand extends Command {
    constructor(entity) {
        super();
        this.entity = entity;
    }

    execute() {
        this.entity.shoot();
    }
}

// PADRÃO STRATEGY - Movement Strategies
class MovementStrategy {
    move(entity) {
        throw new Error('Move method must be implemented');
    }
}

class PlayerMovementStrategy extends MovementStrategy {
    move(entity, direction) {
        const speed = 5;
        switch (direction) {
            case 'up':
                entity.y = Math.max(0, entity.y - speed);
                break;
            case 'down':
                entity.y = Math.min(600, entity.y + speed);
                break;
            case 'left':
                entity.x = Math.max(0, entity.x - speed);
                break;
            case 'right':
                entity.x = Math.min(800, entity.x + speed);
                break;
        }
    }
}

class StraightMovementStrategy extends MovementStrategy {
    move(entity) {
        entity.y += entity.speed;
        if (entity.y > 650) {
            entity.isDead = true;
        }
    }
}

class FallingMovementStrategy extends MovementStrategy {
    move(entity) {
        entity.y += entity.speed;
        entity.rotation += 0.05;
        if (entity.y > 650) {
            entity.isDead = true;
            const game = GameManager.getInstance();
            game.eventSystem.publish('enemyEscaped', { enemy: entity });
        }
    }
}

class ChasePlayerStrategy extends MovementStrategy {
    move(enemy) {
        const game = GameManager.getInstance();
        const player = game.player;
        
        // Calcula a direção até o jogador
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normaliza e aplica a velocidade
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
    }
}

class ZigZagMovementStrategy extends MovementStrategy {
    move(enemy) {
        enemy.y += enemy.speed;
        enemy.x += Math.sin(enemy.y * 0.05) * 3; // Oscila horizontalmente
        
        if (enemy.y > 650) {
            enemy.isDead = true;
        }
    }
}

class CircleMovementStrategy extends MovementStrategy {
    constructor(radius = 50, initialY = 0) {
        super();
        this.angle = 0;
        this.radius = radius;
        this.initialY = initialY; // Guarda a posição Y inicial para referência
        this.progress = 0; // Controla a descida ao longo do tempo
    }

    move(enemy) {
        this.angle += 0.05; // Velocidade do círculo
        this.progress += 0.5; // Velocidade da descida
        
        // Movimento circular (X) + Descida contínua (Y)
        enemy.x = enemy.initialX + Math.cos(this.angle) * this.radius;
        enemy.y = this.initialY + this.progress;
        
        // Remove se sair da tela
        if (enemy.y > 650) {
            enemy.isDead = true;
        }
    }
}

class SideEntryMovementStrategy extends MovementStrategy {
    constructor() {
        super();
        // Decide aleatoriamente se vem da esquerda (0) ou direita (1)
        this.side = Math.floor(Math.random() * 2); 
        this.speed = 2;
        this.enteredScreen = false;
    }

    move(enemy) {
        if (!this.enteredScreen) {
            // Posiciona fora da tela no lado escolhido
            enemy.x = this.side === 0 ? -30 : 830; // Esquerda ou direita
            enemy.y = Math.random() * 300 + 100; // Altura aleatória
            this.enteredScreen = true;
        }

        // Movimento em diagonal para o centro
        if (this.side === 0) { // Veio da esquerda
            enemy.x += this.speed;
            enemy.y += Math.sin(enemy.x * 0.02) * 0.5; // Pequena curva
        } else { // Veio da direita
            enemy.x -= this.speed;
            enemy.y += Math.sin(enemy.x * 0.02) * 0.5;
        }

        // Remove se sair da tela pela parte inferior
        if (enemy.y > 650 || enemy.y < -50 || enemy.x < -50 || enemy.x > 850) {
            enemy.isDead = true;
        }
    }
}

// Base Entity Class
class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.isDead = false;
        this.movementStrategy = null;
    }

    update() {
        if (this.movementStrategy) {
            this.movementStrategy.move(this);
        }
    }

    render(ctx) {
        // Override in subclasses
    }

    move(direction) {
        if (this.movementStrategy) {
            this.movementStrategy.move(this, direction);
        }
    }
}

// Player Entity
class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        this.type = 'player';
        this.radius = 15;
        this.shootCooldown = 0;
        this.maxShootCooldown = 15; // Frames between shots
        this.movementStrategy = new PlayerMovementStrategy();
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.isImmune = false;
        this.immuneTime = 0;
        this.maxImmuneTime = 120; // 2 segundos a 60fps
        this.blinkInterval = 5; // Frames entre piscadas
        this.blinkTimer = 0;
        this.visible = true; // Para o efeito de piscar
        this.laserCooldown = 0;
        this.maxLaserCooldown = 180; // 3 segundos a 60fps
        this.laserReady = true;
    }

    heal(amount) {
        const game = GameManager.getInstance();
        this.health = Math.min(this.health + amount, this.maxHealth);
        game.eventSystem.publish('playerHealthChanged', { health: this.health });
        
        // Efeito visual de cura
        game.eventSystem.publish('healEffect', { x: this.x, y: this.y });
    }

    takeDamage(amount) {
        if (this.isImmune) return;
        
        this.health = Math.max(0, this.health - amount); // Garante que não fique negativo
        const game = GameManager.getInstance();
        game.eventSystem.publish('playerHealthChanged', { health: this.health });
        
        if (this.health <= 0) {
            this.isDead = true;
            game.eventSystem.publish('playerDestroyed');
        } else {
            this.activateImmunity();
        }
    }

    activateImmunity() {
        this.isImmune = true;
        this.immuneTime = this.maxImmuneTime;
    }

    update() {
        super.update();
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // Atualizar imunidade
        if (this.isImmune) {
            this.immuneTime--;
            this.blinkTimer++;
            
            if (this.blinkTimer >= this.blinkInterval) {
                this.visible = !this.visible;
                this.blinkTimer = 0;
            }
            
            if (this.immuneTime <= 0) {
                this.isImmune = false;
                this.visible = true;
            }
        }

        // Atualizar cooldown do laser
        if (this.laserCooldown > 0) {
            this.laserCooldown--;
        } else if (!this.laserReady) {
            this.laserReady = true;
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw player ship
        ctx.fillStyle = this.isImmune ? '#00ffff' : '#00ff00'; // Muda cor quando imune
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-10, 15);
        ctx.lineTo(0, 10);
        ctx.lineTo(10, 15);
        ctx.closePath();
        ctx.fill();

        // Indicador de laser pronto
        if (this.laserReady) {
            const pulseSize = 6 + Math.sin(Date.now() * 0.01) * 2; // Efeito de pulsação
            ctx.fillStyle = 'rgba(0, 200, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(0, -25, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Anel externo pulsante
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -25, pulseSize + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw shoot cooldown indicator
        if (this.shootCooldown > 0) {
            const cooldownRatio = this.shootCooldown / this.maxShootCooldown;
            ctx.fillStyle = `rgba(255, 0, 0, ${cooldownRatio * 0.5})`;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    shootLaser() {
        if (this.laserReady) {
            const laser = GameManager.getInstance().entityFactory.createEntity('laser', this.x, this.y - 40);
            GameManager.getInstance().entities.push(laser);
            this.laserReady = false;
            this.laserCooldown = this.maxLaserCooldown;
        }
    }

    shoot() {
        if (this.shootCooldown <= 0) {
            const bullet = GameManager.getInstance().entityFactory.createEntity('bullet', this.x, this.y - 20);
            GameManager.getInstance().entities.push(bullet);
            this.shootCooldown = this.maxShootCooldown;
        }
    }
}

// Bullet Entity
class Bullet extends Entity {
    constructor(x, y) {
        super(x, y);
        this.type = 'bullet';
        this.radius = 3;
        this.speed = -8;
        this.movementStrategy = new StraightMovementStrategy();
    }

    render(ctx) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Nova classe LaserBullet
class LaserBullet extends Entity {
    constructor(x, y) {
        super(x, y);
        this.type = 'laser';
        this.width = 50;
        this.height = 325;
        this.speed = -12;
        this.damage = 2; // Dano por frame (o laser permanece ativo)
        this.activeFrames = 30; // Duração do laser em frames
        this.currentFrame = 0;
        this.movementStrategy = new StraightMovementStrategy();
    }

    update() {
        super.update();
        this.currentFrame++;
        if (this.currentFrame >= this.activeFrames) {
            this.isDead = true;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Gradiente para o laser
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#0066ff');
        gradient.addColorStop(1, '#0000ff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Brilho ao redor
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        ctx.restore();
    }
}

// HealthPack Entity
class HealthPack extends Entity {
    constructor(x, y) {
        super(x, y);
        this.type = 'healthPack';
        this.radius = 12;
        this.speed = 1;
        this.healAmount = 25;
        this.movementStrategy = new StraightMovementStrategy();
        this.rotation = 0;
        this.rotationSpeed = 0.03;
    }

    update() {
        super.update();
        this.rotation += this.rotationSpeed;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Desenha o pacote de cura (cruz médica)
        ctx.fillStyle = '#00ff00';
        
        // Haste vertical
        ctx.fillRect(-4, -12, 8, 24);
        
        // Haste horizontal
        ctx.fillRect(-12, -4, 24, 8);
        
        // Centro branco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -3, 6, 6);
        
        ctx.restore();
    }
}

// Asteroid Entity
class Asteroid extends Entity {
    constructor(x, y) {
        super(x, y);
        this.type = 'asteroid';
        this.radius = 20 + Math.random() * 20;
        this.speed = 1 + Math.random() * 3;
        this.rotation = 0;
        this.movementStrategy = new FallingMovementStrategy();
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw asteroid
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const sides = 8;
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const radius = this.radius + Math.sin(angle * 3) * 5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

// Enemy Entity
class Enemy extends Entity {
    constructor(x, y, movementStrategy) {
        super(x, y);
        this.type = 'enemy';
        this.radius = 15;
        this.initialX = x;
        this.speed = 2;
        this.color = '#ff0000'; // Vermelho para diferenciar
        this.movementStrategy = movementStrategy || new StraightMovementStrategy(); // Padrão: movimento reto
        // Define as 3 variações de cores fixas
        this.colorVariations = [
            { body: '#7e2cc9', eyes: '#00ff00' }, 
            { body: '#1b12c7', eyes: '#b5c712' },  
            { body: '#9802a8', eyes: '#ffffff' }  
        ];
        // Seleciona UMA variação aleatória ao criar o inimigo (fixa durante toda a vida do objeto)
        this.colors = this.colorVariations[Math.floor(Math.random() * this.colorVariations.length)];
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Corpo do alien (cabeça oval)
        ctx.fillStyle = this.colors.body;
        ctx.beginPath();
        ctx.ellipse(0, -5, 12, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Olho
        ctx.fillStyle = this.colors.eyes;
        ctx.beginPath();
        ctx.arc(0, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Input Manager
class InputManager {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Handle one-time key presses
            this.handleSingleKeyPress(e.key.toLowerCase());
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    handleSingleKeyPress(key) {
        const game = GameManager.getInstance();
        
        if (game.gameState === 'gameOver' && key === 'r') {
            game.restart();
            return;
        }

        if (game.gameState !== 'playing') return;

        const player = game.player;
        
        // Shoot command (single press)
        if (key === ' ') {
            new ShootCommand(player).execute();
        }

        // Adicione esta condição para o tiro laser (tecla 'e')
        if (key === 'e') {
            player.shootLaser();
        }
    }

    // Process continuous input
    processContinuousInput() {
        const game = GameManager.getInstance();
        if (game.gameState !== 'playing') return;

        const player = game.player;
        
        // Continuous movement
        if (this.isPressed('w')) {
            new MoveCommand(player, 'up').execute();
        }
        if (this.isPressed('s')) {
            new MoveCommand(player, 'down').execute();
        }
        if (this.isPressed('a')) {
            new MoveCommand(player, 'left').execute();
        }
        if (this.isPressed('d')) {
            new MoveCommand(player, 'right').execute();
        }
    }

    isPressed(key) {
        return !!this.keys[key];
    }
}

// Initialize the game
window.addEventListener('load', () => {
    new GameManager();
});