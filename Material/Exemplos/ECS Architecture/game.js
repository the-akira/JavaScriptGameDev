// ===== ARQUITETURA ECS =====
// Entity: apenas um ID único
class Entity {
    constructor(id) {
        this.id = id;
    }
}

// Component: dados puros
class Component {
    constructor(type) {
        this.type = type;
    }
}

class PositionComponent extends Component {
    constructor(x, y) {
        super('position');
        this.x = x;
        this.y = y;
    }
}

class VelocityComponent extends Component {
    constructor(vx, vy) {
        super('velocity');
        this.vx = vx;
        this.vy = vy;
    }
}

class DirectionComponent extends Component {
    constructor(x = 1, y = 0) {
        super('direction');
        this.x = x; // Direção normalizada
        this.y = y;
    }
}

class RenderComponent extends Component {
    constructor(color, width, height) {
        super('render');
        this.color = color;
        this.width = width;
        this.height = height;
        this.originalColor = color; // Guardar cor original para o efeito de piscar
        this.isFlashing = false;
        this.flashTimer = 0;
    }
}

class PlayerComponent extends Component {
    constructor() {
        super('player');
        this.speed = 200;
        this.attackCooldown = 0;
        this.maxAttackCooldown = 0.3;
        this.invulnerabilityTime = 0;
        this.maxInvulnerabilityTime = 1.5; // 1.5 segundos de invencibilidade
        this.isInvulnerable = false;
        this.hitCooldown = 0; // Novo: cooldown após levar dano
        this.hitCooldownMax = 0.2; // 0.2 segundos de cooldown
    }
}

class EnemyComponent extends Component {
    constructor() {
        super('enemy');
        this.speed = 100;
        this.spawnTime = Date.now();
        this.damage = 20; // Dano que o inimigo causa
    }
}

class CoinComponent extends Component {
    constructor() {
        super('coin');
        this.value = 10;
    }
}

class ColliderComponent extends Component {
    constructor(width, height) {
        super('collider');
        this.width = width;
        this.height = height;
    }
}

class HealthComponent extends Component {
    constructor(maxHealth) {
        super('health');
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }
}

class AttackComponent extends Component {
    constructor(damage, range, duration) {
        super('attack');
        this.damage = damage;
        this.range = range;
        this.duration = duration;
        this.timeLeft = duration;
        this.hasHit = new Set(); // Para evitar múltiplos hits no mesmo inimigo
    }
}

class LifetimeComponent extends Component {
    constructor(duration) {
        super('lifetime');
        this.duration = duration;
        this.timeLeft = duration;
    }
}

// System: lógica de processamento
class System {
    constructor(world) {
        this.world = world;
    }
    
    update(deltaTime) {
        // Override em sistemas específicos
    }
}

class MovementSystem extends System {
    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents(['position', 'velocity']);
        
        entities.forEach(entity => {
            const pos = this.world.getComponent(entity.id, 'position');
            const vel = this.world.getComponent(entity.id, 'velocity');
            
            pos.x += vel.vx * deltaTime;
            pos.y += vel.vy * deltaTime;
            
            // Manter dentro da tela
            pos.x = Math.max(0, Math.min(canvas.width - 32, pos.x));
            pos.y = Math.max(0, Math.min(canvas.height - 32, pos.y));
        });
    }
}

class PlayerInputSystem extends System {
    constructor(world) {
        super(world);
        this.keys = {};
        this.setupInput();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    update(deltaTime) {
        const players = this.world.getEntitiesWithComponents(['player', 'velocity', 'direction']);
        
        players.forEach(entity => {
            const player = this.world.getComponent(entity.id, 'player');
            const vel = this.world.getComponent(entity.id, 'velocity');
            const dir = this.world.getComponent(entity.id, 'direction');
            const render = this.world.getComponent(entity.id, 'render');

            // Atualizar estados
            this.updateCooldowns(player, deltaTime);
            this.updateInvulnerability(player, deltaTime, render);
            
            // Resetar movimento
            vel.vx = vel.vy = 0;
            
            // Obter inputs
            const { up, down, left, right, attacking } = this.getInputs();
            
            // Processar movimento
            this.processMovement(player, vel, dir, up, down, left, right);
            
            // Processar ataques (agora permitindo diagonais)
            if (attacking && player.attackCooldown <= 0) {
                this.createAttack(entity.id);
                player.attackCooldown = player.maxAttackCooldown;
            }
        });
    }

    updateCooldowns(player, deltaTime) {
        if (player.attackCooldown > 0) {
            player.attackCooldown -= deltaTime;
        }
        if (player.hitCooldown > 0) {
            player.hitCooldown -= deltaTime;
        }
    }

    updateInvulnerability(player, deltaTime, render) {
        if (player.isInvulnerable) {
            player.invulnerabilityTime -= deltaTime;
            if (player.invulnerabilityTime <= 0 && render) {
                player.isInvulnerable = false;
                render.color = render.originalColor;
                render.isFlashing = false;
            }
        }
    }

    getInputs() {
        return {
            up: this.keys['arrowup'],
            down: this.keys['arrowdown'],
            left: this.keys['arrowleft'],
            right: this.keys['arrowright'],
            attacking: this.keys['z']
        };
    }

    processMovement(player, vel, dir, up, down, left, right) {
        const speed = player.speed;
        const diagonalSpeed = speed * 0.7071;
        
        // Resetar velocidade, mas manter a direção atual
        vel.vx = vel.vy = 0;
        
        // Se nenhuma tecla estiver pressionada, mantemos a direção atual
        if (!up && !down && !left && !right) {
            return; // Mantém a última direção
        }
        
        // Resetar direção apenas se novas teclas forem pressionadas
        dir.x = dir.y = 0;
        
        // Horizontal
        if (left) {
            vel.vx = -speed;
            dir.x = -1;
        } else if (right) {
            vel.vx = speed;
            dir.x = 1;
        }
        
        // Vertical
        if (up) {
            vel.vy = -speed;
            dir.y = -1;
        } else if (down) {
            vel.vy = speed;
            dir.y = 1;
        }
        
        // Ajuste diagonal
        if (dir.x !== 0 && dir.y !== 0) {
            vel.vx = dir.x * diagonalSpeed;
            vel.vy = dir.y * diagonalSpeed;
        }
        
        this.normalizeDirection(dir);
    }

    normalizeDirection(dir) {
        const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
        if (length > 0) {
            dir.x /= length;
            dir.y /= length;
        }
    }
    
    createAttack(playerId) {
        const playerPos = this.world.getComponent(playerId, 'position');
        const playerDir = this.world.getComponent(playerId, 'direction');
        
        const attack = this.world.createEntity();
        const attackRange = 50;
        const attackX = playerPos.x + playerDir.x * attackRange - 3;
        const attackY = playerPos.y + playerDir.y * attackRange - 3;
        
        this.world.addComponent(attack.id, new PositionComponent(attackX, attackY));
        this.world.addComponent(attack.id, new RenderComponent('#1acf17', 40, 40));
        this.world.addComponent(attack.id, new AttackComponent(1, 40, 0.2));
        this.world.addComponent(attack.id, new ColliderComponent(40, 40));
        this.world.addComponent(attack.id, new LifetimeComponent(0.2));
    }
}

class EnemyAISystem extends System {
    update(deltaTime) {
        const enemies = this.world.getEntitiesWithComponents(['enemy', 'position', 'velocity']);
        const players = this.world.getEntitiesWithComponents(['player', 'position']);
        
        if (players.length === 0) return;
        
        const playerPos = this.world.getComponent(players[0].id, 'position');
        
        enemies.forEach(entity => {
            const enemy = this.world.getComponent(entity.id, 'enemy');
            const pos = this.world.getComponent(entity.id, 'position');
            const vel = this.world.getComponent(entity.id, 'velocity');
            
            const dx = playerPos.x - pos.x;
            const dy = playerPos.y - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                vel.vx = (dx / distance) * enemy.speed;
                vel.vy = (dy / distance) * enemy.speed;
            }
        });
    }
}

class AttackSystem extends System {
    update(deltaTime) {
        const attacks = this.world.getEntitiesWithComponents(['attack', 'position', 'collider']);
        const enemies = this.world.getEntitiesWithComponents(['enemy', 'position', 'collider', 'health']);
        
        attacks.forEach(attackEntity => {
            const attack = this.world.getComponent(attackEntity.id, 'attack');
            const attackPos = this.world.getComponent(attackEntity.id, 'position');
            const attackCollider = this.world.getComponent(attackEntity.id, 'collider');
            
            // Atualizar tempo do ataque
            attack.timeLeft -= deltaTime;
            
            enemies.forEach(enemyEntity => {
                if (attack.hasHit.has(enemyEntity.id)) return;
                
                const enemyPos = this.world.getComponent(enemyEntity.id, 'position');
                const enemyCollider = this.world.getComponent(enemyEntity.id, 'collider');
                const enemyHealth = this.world.getComponent(enemyEntity.id, 'health');
                
                if (this.checkCollision(attackPos, attackCollider, enemyPos, enemyCollider)) {
                    enemyHealth.currentHealth -= attack.damage;
                    attack.hasHit.add(enemyEntity.id);
                    
                    if (enemyHealth.currentHealth <= 0) {
                        this.world.removeEntity(enemyEntity.id);
                        game.score += 50;
                        game.enemiesKilled++;
                    }
                }
            });
        });
    }
    
    checkCollision(pos1, collider1, pos2, collider2) {
        return pos1.x < pos2.x + collider2.width &&
               pos1.x + collider1.width > pos2.x &&
               pos1.y < pos2.y + collider2.height &&
               pos1.y + collider1.height > pos2.y;
    }
}

class LifetimeSystem extends System {
    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents(['lifetime']);
        
        entities.forEach(entity => {
            const lifetime = this.world.getComponent(entity.id, 'lifetime');
            lifetime.timeLeft -= deltaTime;
            
            if (lifetime.timeLeft <= 0) {
                this.world.removeEntity(entity.id);
            }
        });
    }
}

class FlashingSystem extends System {
    update(deltaTime) {
        const players = this.world.getEntitiesWithComponents(['player', 'render']);
        
        players.forEach(entity => {
            const player = this.world.getComponent(entity.id, 'player');
            const render = this.world.getComponent(entity.id, 'render');
            
            if (player.isInvulnerable) {
                render.isFlashing = true;
                render.flashTimer += deltaTime;
                
                // Alternar cor a cada 0.1 segundos
                if (render.flashTimer >= 0.1) {
                    render.flashTimer = 0;
                    if (render.color === render.originalColor) {
                        render.color = 'rgba(74, 144, 226, 0.3)'; // Cor transparente
                    } else {
                        render.color = render.originalColor;
                    }
                }
            }
        });
    }
}

class CollisionSystem extends System {
    update(deltaTime) {
        // Verificar se o jogo ainda está rodando
        if (!game.isRunning) return;
        
        // Verificar colisões player-coin
        const players = this.world.getEntitiesWithComponents(['player', 'position', 'collider']);
        const coins = this.world.getEntitiesWithComponents(['coin', 'position', 'collider']);
        
        players.forEach(player => {
            const playerPos = this.world.getComponent(player.id, 'position');
            const playerCollider = this.world.getComponent(player.id, 'collider');
            const playerComponent = this.world.getComponent(player.id, 'player');
            const playerHealth = this.world.getComponent(player.id, 'health');
            
            coins.forEach(coin => {
                const coinPos = this.world.getComponent(coin.id, 'position');
                const coinCollider = this.world.getComponent(coin.id, 'collider');
                const coinComponent = this.world.getComponent(coin.id, 'coin');
                
                if (this.checkCollision(playerPos, playerCollider, coinPos, coinCollider)) {
                    game.score += coinComponent.value;
                    this.world.removeEntity(coin.id);
                    game.spawnCoin();
                }
            });
            
            // Verificar colisões player-enemy (apenas se não estiver invulnerável)
            if (!playerComponent.isInvulnerable && game.isRunning) {
                const enemies = this.world.getEntitiesWithComponents(['enemy', 'position', 'collider']);
                
                enemies.forEach(enemy => {
                    const enemyPos = this.world.getComponent(enemy.id, 'position');
                    const enemyCollider = this.world.getComponent(enemy.id, 'collider');
                    const enemyComponent = this.world.getComponent(enemy.id, 'enemy');
                    
                    if (this.checkCollision(playerPos, playerCollider, enemyPos, enemyCollider)) {
                        // Verificar cooldown de dano
                        if (playerComponent.hitCooldown <= 0) {
                            // Aplicar dano
                            playerHealth.currentHealth = Math.max(0, playerHealth.currentHealth - enemyComponent.damage);
                            playerComponent.hitCooldown = playerComponent.hitCooldownMax;
                            
                            // Ativar invencibilidade
                            playerComponent.isInvulnerable = true;
                            playerComponent.invulnerabilityTime = playerComponent.maxInvulnerabilityTime;
                            
                            // Atualizar barra de vida
                            game.updateHealthBar();
                            
                            if (playerHealth.currentHealth <= 0 && game.isRunning) {
                                game.gameOver();
                                return;
                            }
                        }
                    }
                });
                
                // Atualizar cooldown de dano
                if (playerComponent.hitCooldown > 0) {
                    playerComponent.hitCooldown -= deltaTime;
                }
            }
        });
    }
    
    checkCollision(pos1, collider1, pos2, collider2) {
        return pos1.x < pos2.x + collider2.width &&
               pos1.x + collider1.width > pos2.x &&
               pos1.y < pos2.y + collider2.height &&
               pos1.y + collider1.height > pos2.y;
    }
}

class RenderSystem extends System {
    constructor(world, canvas, ctx) {
        super(world);
        this.canvas = canvas;
        this.ctx = ctx;
    }
    
    update(deltaTime) {
        // Limpar canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderizar entidades
        const renderables = this.world.getEntitiesWithComponents(['position', 'render']);
        
        renderables.forEach(entity => {
            const pos = this.world.getComponent(entity.id, 'position');
            const render = this.world.getComponent(entity.id, 'render');
            
            this.ctx.fillStyle = render.color;
            this.ctx.fillRect(pos.x, pos.y, render.width, render.height);
        });
        
        // Renderizar indicador de direção do player
        const players = this.world.getEntitiesWithComponents(['player', 'position', 'direction']);
        players.forEach(entity => {
            const pos = this.world.getComponent(entity.id, 'position');
            const dir = this.world.getComponent(entity.id, 'direction');
            
            this.ctx.strokeStyle = '#FFF';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            const centerX = pos.x + 16;
            const centerY = pos.y + 16;
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(centerX + dir.x * 20, centerY + dir.y * 20);
            this.ctx.stroke();
        });
    }
}

class EnemySpawnSystem extends System {
    constructor(world) {
        super(world);
        this.spawnTimer = 0;
        this.spawnInterval = 3; // Spawn a cada 3 segundos
    }
    
    update(deltaTime) {
        // Não spawnar inimigos se o jogo não estiver rodando
        if (!game.isRunning) return;
        
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer >= this.spawnInterval) {
            game.spawnEnemy();
            this.spawnTimer = 0;
            
            // Diminuir intervalo gradualmente para aumentar dificuldade
            this.spawnInterval = Math.max(1, this.spawnInterval - 0.1);
        }
    }
}

// World: gerenciador de entidades e componentes
class World {
    constructor() {
        this.entities = new Map();
        this.components = new Map();
        this.nextEntityId = 1;
    }
    
    createEntity() {
        const entity = new Entity(this.nextEntityId++);
        this.entities.set(entity.id, entity);
        this.components.set(entity.id, new Map());
        return entity;
    }
    
    removeEntity(entityId) {
        this.entities.delete(entityId);
        this.components.delete(entityId);
    }
    
    addComponent(entityId, component) {
        if (this.components.has(entityId)) {
            this.components.get(entityId).set(component.type, component);
        }
    }
    
    getComponent(entityId, componentType) {
        if (this.components.has(entityId)) {
            return this.components.get(entityId).get(componentType);
        }
        return null;
    }
    
    hasComponent(entityId, componentType) {
        return this.components.has(entityId) && 
               this.components.get(entityId).has(componentType);
    }
    
    getEntitiesWithComponents(componentTypes) {
        const entities = [];
        
        for (const [entityId, entity] of this.entities) {
            if (componentTypes.every(type => this.hasComponent(entityId, type))) {
                entities.push(entity);
            }
        }
        
        return entities;
    }
}

// ===== JOGO =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const enemiesElement = document.getElementById('enemies');
const healthFillElement = document.getElementById('healthFill');
const healthTextElement = document.getElementById('healthText');

class Game {
    constructor() {
        this.world = new World();
        this.systems = [];
        this.score = 0;
        this.enemiesKilled = 0;
        this.isRunning = true;
        this.playerId = null;
        
        this.setupSystems();
        this.createEntities();
        this.updateHealthBar();
        this.gameLoop();
    }
    
    setupSystems() {
        this.systems.push(new PlayerInputSystem(this.world));
        this.systems.push(new EnemyAISystem(this.world));
        this.systems.push(new MovementSystem(this.world));
        this.systems.push(new AttackSystem(this.world));
        this.systems.push(new LifetimeSystem(this.world));
        this.systems.push(new FlashingSystem(this.world));
        this.systems.push(new CollisionSystem(this.world));
        this.systems.push(new EnemySpawnSystem(this.world));
        this.systems.push(new RenderSystem(this.world, canvas, ctx));
    }
    
    createEntities() {
        // Criar player
        const player = this.world.createEntity();
        this.playerId = player.id;
        this.world.addComponent(player.id, new PositionComponent(100, 100));
        this.world.addComponent(player.id, new VelocityComponent(0, 0));
        this.world.addComponent(player.id, new DirectionComponent(1, 0));
        this.world.addComponent(player.id, new RenderComponent('#4A90E2', 32, 32));
        this.world.addComponent(player.id, new PlayerComponent());
        this.world.addComponent(player.id, new ColliderComponent(32, 32));
        this.world.addComponent(player.id, new HealthComponent(100)); // 100 de vida
        
        // Criar inimigos iniciais
        for (let i = 0; i < 2; i++) {
            this.spawnEnemy();
        }
        
        // Criar moedas
        for (let i = 0; i < 5; i++) {
            this.spawnCoin();
        }
    }
    
    spawnEnemy() {
        const enemy = this.world.createEntity();
        
        // Spawn em bordas aleatórias
        let x, y;
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0: // Top
                x = Math.random() * canvas.width;
                y = -32;
                break;
            case 1: // Right
                x = canvas.width;
                y = Math.random() * canvas.height;
                break;
            case 2: // Bottom
                x = Math.random() * canvas.width;
                y = canvas.height;
                break;
            case 3: // Left
                x = -32;
                y = Math.random() * canvas.height;
                break;
        }
        
        this.world.addComponent(enemy.id, new PositionComponent(x, y));
        this.world.addComponent(enemy.id, new VelocityComponent(0, 0));
        this.world.addComponent(enemy.id, new RenderComponent('#E74C3C', 32, 32));
        this.world.addComponent(enemy.id, new EnemyComponent());
        this.world.addComponent(enemy.id, new ColliderComponent(32, 32));
        this.world.addComponent(enemy.id, new HealthComponent(1));
    }
    
    spawnCoin() {
        const coin = this.world.createEntity();
        const x = Math.random() * (canvas.width - 24);
        const y = Math.random() * (canvas.height - 24);
        
        this.world.addComponent(coin.id, new PositionComponent(x, y));
        this.world.addComponent(coin.id, new RenderComponent('#FFD700', 24, 24));
        this.world.addComponent(coin.id, new CoinComponent());
        this.world.addComponent(coin.id, new ColliderComponent(24, 24));
    }
    
    updateHealthBar() {
        if (this.playerId && this.isRunning) {
            const playerHealth = this.world.getComponent(this.playerId, 'health');
            if (playerHealth) {
                // Garantir que a vida não seja negativa
                playerHealth.currentHealth = Math.max(0, playerHealth.currentHealth);
                
                const healthPercentage = (playerHealth.currentHealth / playerHealth.maxHealth) * 100;
                healthFillElement.style.width = Math.max(0, healthPercentage) + '%';
                healthTextElement.textContent = `${playerHealth.currentHealth}/${playerHealth.maxHealth}`;
                
                // Debug: verificar se a vida está correta
                console.log(`Vida atual: ${playerHealth.currentHealth}/${playerHealth.maxHealth}`);
            }
        }
    }
    
    gameOver() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.updateHealthBar();
        
        // Mostrar modal personalizado
        const modal = document.getElementById('gameOverModal');
        const gameOverText = document.getElementById('gameOverText');
        gameOverText.textContent = `Pontuação final: ${this.score} | Inimigos derrotados: ${this.enemiesKilled}`;
        modal.style.display = 'flex';
        
        // Configurar botão de reinício
        document.getElementById('restartButton').onclick = () => {
            location.reload();
        };
    }
    
    gameLoop() {
        let lastTime = 0;
        
        const loop = (currentTime) => {
            if (!this.isRunning) return;
            
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            // Atualizar sistemas
            this.systems.forEach(system => system.update(deltaTime));
            
            // Atualizar UI
            scoreElement.textContent = this.score;
            enemiesElement.textContent = this.enemiesKilled;
            this.updateHealthBar();
            
            requestAnimationFrame(loop);
        };
        
        requestAnimationFrame(loop);
    }
}

// Iniciar jogo
const game = new Game();