// Objeto contendo os URLs dos mapas
const mapURLs = {
    map1: 'https://gist.githubusercontent.com/the-akira/427e8063e1828c09d4c135bf6d0700fe/raw/2a08154aa652d3b957b232d71e771b10bdab5750/gameMapSkull1.csv',
    map2: 'https://gist.githubusercontent.com/the-akira/0bf95410bef6d6a25ebfa4cfef8ba79d/raw/b5dd5855f56aebc658b98c81cb542e2cde001e37/gamemapSkull2.csv',
};

// Posições de spawn dos inimigos por mapa
const enemySpawnConfig = {
    map1: [
        { x: 8  * 32, y: 30 * 32 },
        { x: 18 * 32, y: 38 * 32 },
        { x: 32 * 32, y: 27 * 32 },
        { x: 50 * 32, y: 19 * 32 },
        { x: 66 * 32, y: 23 * 32 },
    ],
    map2: [
        { x: 5  * 32, y: 5  * 32 },
        { x: 15 * 32, y: 8  * 32 },
        { x: 25 * 32, y: 15 * 32 },
    ]
};

// Método para obter o URL do mapa com base no nome do mapa
function getMapURL(mapName) {
    return mapURLs[mapName];
}

class Spell {
    constructor(game, x, y, direction) {
        this.game      = game;
        this.x         = x;
        this.y         = y;
        this.width     = 14;
        this.height    = 14;
        this.velX      = direction === 'right' ? 10 : -10;
        this.active    = true;
        this.age       = 0; // usado para animar o brilho
    }

    isSolid(px, py) {
        const tx = Math.floor(px / this.game.tileSize);
        const ty = Math.floor(py / this.game.tileSize);
        if (!this.game.map[ty]) return false;
        const tile = this.game.map[ty][tx];
        return tile === 0 || tile === 1;
    }

    update() {
        this.x += this.velX;
        this.age++;

        // Remove ao sair dos limites do mapa
        if (this.x < 0 || this.x > this.game.map[0].length * this.game.tileSize) {
            this.active = false;
            return;
        }

        // Colisão com tiles sólidos
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        if (this.isSolid(cx, cy)) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active) return;
        const ctx = this.game.ctx;
        const sx = this.x - this.game.cameraX;
        const sy = this.y - this.game.cameraY;
        const cx = sx + this.width / 2;
        const cy = sy + this.height / 2;

        ctx.save(); 

        // Pulsar: raio oscila levemente
        const pulse = 1 + 0.25 * Math.sin(this.age * 0.4);
        const r = (this.width / 2) * pulse;

        // Halo externo
        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
        halo.addColorStop(0,   'rgba(200, 130, 255, 0.7)');
        halo.addColorStop(0.5, 'rgba(130,  60, 220, 0.3)');
        halo.addColorStop(1,   'rgba(0,     0,   0, 0)');
        ctx.beginPath();
        ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        // Orbe central
        const orb = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        orb.addColorStop(0,   'white');
        orb.addColorStop(0.4, '#d8b4fe');
        orb.addColorStop(1,   '#7c3aed');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = orb;
        ctx.fill();
        ctx.restore();
    }
}

class Enemy {
    constructor(game, x, y) {
        this.game          = game;
        this.x             = x;
        this.y             = y;
        this.width         = 28;
        this.height        = 28;
        this.velX          = 1.5;
        this.velY          = 0;
        this.gravity       = 0.8;
        this.grounded      = false;
        this.alive         = true;
        this.deathTimer    = 0;    // contagem regressiva após morte (para fade-out)
        this.deathDuration = 20; // frames de animação de morte
    }

    isSolid(px, py) {
        const tx = Math.floor(px / this.game.tileSize);
        const ty = Math.floor(py / this.game.tileSize);
        if (ty < 0 || !this.game.map[ty]) return false;
        const tile = this.game.map[ty][tx];
        return tile === 0 || tile === 1;
    }

    update() {
        if (!this.alive) {
            this.deathTimer++;
            return;
        }

        // ── Gravidade ──────────────────────────────────
        this.velY += this.gravity;

        // ── Movimento horizontal ───────────────────────
        const nextX = this.x + this.velX;

        // Ponto de frente (topo e baixo)
        const frontX = this.velX > 0 ? nextX + this.width : nextX;

        const wallTop = this.isSolid(frontX, this.y + 2);
        const wallBot = this.isSolid(frontX, this.y + this.height - 2);

        // Ponto de chão à frente (para não cair de plataformas)
        const groundCheckX = this.velX > 0 ? nextX + this.width : nextX;
        const groundAhead  = this.isSolid(groundCheckX, this.y + this.height + 2);

        if (wallTop || wallBot || (!groundAhead && this.grounded)) {
            this.velX *= -1; // inverte direção
        } else {
            this.x = Math.max(0, Math.min(nextX, this.game.map[0].length * this.game.tileSize - this.width));
        }

        // ── Movimento vertical ─────────────────────────
        let newY = this.y + this.velY;
        newY = Math.max(0, Math.min(newY, this.game.map.length * this.game.tileSize - this.height));

        const topTileY   = Math.floor(newY / this.game.tileSize);
        const bottomTileY = Math.floor((newY + this.height) / this.game.tileSize);
        const leftTileX  = Math.floor(this.x / this.game.tileSize);
        const rightTileX = Math.floor((this.x + this.width - 1) / this.game.tileSize);

        if (this.velY > 0) { // caindo
            let collision = false;
            for (let y = topTileY; y <= bottomTileY && !collision; y++) {
                if (!this.game.map[y]) continue;
                for (let x = leftTileX; x <= rightTileX; x++) {
                    if (this.game.map[y][x] === 0 || this.game.map[y][x] === 1) {
                        newY = y * this.game.tileSize - this.height;
                        this.velY = 0;
                        this.grounded = true;
                        collision = true;
                        break;
                    }
                }
            }
            if (!collision) this.grounded = false;
        } else if (this.velY < 0) { // subindo
            let collision = false;
            for (let y = bottomTileY; y >= topTileY && !collision; y--) {
                if (!this.game.map[y]) continue;
                for (let x = leftTileX; x <= rightTileX; x++) {
                    if (this.game.map[y][x] === 0 || this.game.map[y][x] === 1) {
                        newY = (y + 1) * this.game.tileSize;
                        this.velY = 0;
                        collision = true;
                        break;
                    }
                }
            }
        }

        this.y = newY;
    }

    die() {
        if (!this.alive) return;
        this.alive = false;
        this.deathTimer = 0;
    }

    isExpired() {
        return !this.alive && this.deathTimer >= this.deathDuration;
    }

    isCollidingWith(obj) {
        return (
            this.x < obj.x + obj.width  &&
            this.x + this.width > obj.x  &&
            this.y < obj.y + obj.height  &&
            this.y + this.height > obj.y
        );
    }

    draw() {
        const ctx = this.game.ctx;
        const sx = Math.round(this.x - this.game.cameraX);
        const sy = Math.round(this.y - this.game.cameraY);

        let alpha = 1;
        if (!this.alive) {
            // Fade-out na morte
            alpha = 1 - this.deathTimer / this.deathDuration;
        }
        ctx.globalAlpha = alpha;

        // Corpo
        ctx.fillStyle = '#561cb9';
        ctx.fillRect(sx, sy, this.width, this.height);

        // Destaque superior
        ctx.fillStyle = '#9a44ef';
        ctx.fillRect(sx, sy, this.width, 6);

        // Olhos (seguem a direção do movimento)
        const eyeOffsetX = this.velX > 0 ? 2 : -1;
        ctx.fillStyle = 'white';
        ctx.fillRect(sx + 4, sy + 8, 7, 7);
        ctx.fillRect(sx + 17, sy + 8, 7, 7);
        ctx.fillStyle = '#111';
        ctx.fillRect(sx + 5 + eyeOffsetX, sy + 10, 4, 4);
        ctx.fillRect(sx + 18 + eyeOffsetX, sy + 10, 4, 4);

        // Boca
        if (this.alive) {
            ctx.fillStyle = '#561d7f';
            ctx.fillRect(sx + 6, sy + 20, 16, 3);
            // Dentes
            ctx.fillStyle = 'white';
            ctx.fillRect(sx + 8,  sy + 20, 3, 3);
            ctx.fillRect(sx + 14, sy + 20, 3, 3);
        }

        ctx.globalAlpha = 1;
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.width         = 40;
        this.height        = 40;
        this.x             = 50;
        this.y             = 50;
        this.velX          = 0;
        this.velY          = 0;
        this.jumpStrength  = -16;
        this.gravity       = 0.8;
        this.grounded      = false;
        this.coyoteTime    = 8;   // frames de graça após sair da borda
        this.coyoteTimer   = 0;

        // Saúde
        this.maxHealth      = 3;
        this.health         = 3;
        this.invincibleTimer = 0;   // frames de invencibilidade após tomar dano
        this.invincibleDuration = 80;

        // Magia
        this.spellCooldown    = 0;
        this.spellCooldownMax = 25; // frames entre lançamentos

        // Controles
        this.controls = { ArrowLeft: false, ArrowRight: false, Space: false };

        // Animações
        this.animationFrames = {
            idle: Array(3).fill().map(() => new Image()),
            run:  Array(12).fill().map(() => new Image()),
        };
        for (let i = 0; i < 3;  i++) this.animationFrames.idle[i].src = `assets/player_idle${i+1}.png`;
        for (let i = 0; i < 12; i++) this.animationFrames.run[i].src  = `assets/player_run${i+1}.png`;

        this.animationSpeeds   = { idle: 0.4, run: 0.08 };
        this.currentAnimation  = 'idle';
        this.currentFrame      = 0;
        this.animationTimer    = 0;
        this.direction         = 'right';

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp   = this.handleKeyUp.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup',   this.handleKeyUp);
        this.update = this.update.bind(this);
        this.draw   = this.draw.bind(this);
    }

    updateAnimation(deltaTime) {
        this.currentAnimation = (Math.abs(this.velX) > 0 && this.grounded) ? 'run' : 'idle';
        this.animationTimer += deltaTime;
        const speed  = this.animationSpeeds[this.currentAnimation];
        const frames = this.animationFrames[this.currentAnimation];
        if (this.animationTimer >= speed) {
            this.animationTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % frames.length;
        }
        if (this.currentFrame >= frames.length) this.currentFrame = 0;
    }

    handleKeyDown(event) {
        if (event.code in this.controls) {
            event.preventDefault();
            this.controls[event.code] = true;
        }
        // Lançar magia com Z (disparo único por pressionamento)
        if (event.code === 'KeyZ') {
            event.preventDefault();
            this.castSpell();
        }
    }

    handleKeyUp(event) {
        if (event.code in this.controls) {
            event.preventDefault();
            this.controls[event.code] = false;
        }
    }

    castSpell() {
        if (this.spellCooldown > 0) return;
        this.spellCooldown = this.spellCooldownMax;

        // Spawn do projétil no centro-vertical do jogador
        const spellX = this.direction === 'right'
            ? this.x + this.width
            : this.x - 14;
        const spellY  = this.y + this.height / 2 - 7;

        this.game.spells.push(new Spell(this.game, spellX, spellY, this.direction));
    }

    takeDamage() {
        if (this.invincibleTimer > 0) return;
        this.health--;
        if (this.health <= 0) {
            this.respawn();
        } else {
            this.invincibleTimer = this.invincibleDuration; // só pisca se não morreu
        }
    }

    respawn() {
        this.health = this.maxHealth;
        this.x = 50;
        this.y = 50;
        this.velX = 0;
        this.velY = 0;
        this.game.loadMap(getMapURL('map1'));
    }

    onGround(tileY) {
        const playerBottom = this.y + this.height;
        return playerBottom >= tileY * this.game.tileSize && playerBottom <= (tileY + 1) * this.game.tileSize;
    }

    checkPortalCollision() {
        for (let y = 0; y < this.game.map.length; y++) {
            for (let x = 0; x < this.game.map[y].length; x++) {
                if (this.game.map[y][x] === 2) {
                    const portalX = x * this.game.tileSize;
                    const portalY = y * this.game.tileSize;
                    if (
                        this.x + this.width > portalX &&
                        this.x < portalX + this.game.tileSize &&
                        this.y + this.height > portalY &&
                        this.y < portalY + this.game.tileSize
                    ) {
                        if (portalX === 1856 && portalY === 1152 && this.game.currentMap === getMapURL('map1')) {
                            this.game.loadMap(getMapURL('map2'));
                        } else if (portalX === 32 && portalY === 128 && this.game.currentMap === getMapURL('map2')) {
                            this.game.loadMap(getMapURL('map1'));
                        }
                    }
                }
            }
        }
    }

    checkSkullCollision() {
        for (let y = 0; y < this.game.map.length; y++) {
            for (let x = 0; x < this.game.map[y].length; x++) {
                if (this.game.map[y][x] === 3) {
                    const skullX = x * this.game.tileSize;
                    const skullY = y * this.game.tileSize;
                    if (
                        this.x + this.width > skullX &&
                        this.x < skullX + this.game.tileSize &&
                        this.y + this.height > skullY &&
                        this.y < skullY + this.game.tileSize
                    ) {
                        this.game.map[y][x] = -1;
                        this.game.removeSkull(x, y);
                    }
                }
            }
        }
    }

    update() {
        // Timers
        if (this.spellCooldown > 0)    this.spellCooldown--;
        if (this.invincibleTimer > 0)  this.invincibleTimer--;

        this.checkPortalCollision();
        this.checkSkullCollision();

        // Movimento horizontal
        if (this.controls.ArrowLeft) {
            this.velX = -5;
            this.direction = 'left';
        } else if (this.controls.ArrowRight) {
            this.velX = 5;
            this.direction = 'right';
        } else {
            this.velX = 0;
        }

        // Pulo
        if (this.controls.Space && (this.grounded || this.coyoteTimer > 0)) {
            this.coyoteTimer = 0;
            this.grounded = false;
            this.velY = this.jumpStrength;
        }

        this.velY += this.gravity;
        this.moveX(this.velX);
        this.moveY(this.velY);

        // Coyote time: conta regressiva quando está no ar
        if (this.grounded) {
            this.coyoteTimer = this.coyoteTime; // reseta ao tocar o chão
        } else {
            if (this.coyoteTimer > 0) this.coyoteTimer--;
        }

        // Câmera
        this.game.cameraX = Math.max(0, Math.min(this.x - this.game.canvasWidth  / 2, this.game.map[0].length * this.game.tileSize - this.game.canvasWidth));
        this.game.cameraY = Math.max(0, Math.min(this.y - this.game.canvasHeight / 2, this.game.map.length    * this.game.tileSize - this.game.canvasHeight));
    }

    moveX(deltaX) {
        let newX = this.x + deltaX;
        newX = Math.max(0, Math.min(newX, this.game.map[0].length * this.game.tileSize - this.width));

        const left   = Math.floor(newX / this.game.tileSize);
        const right  = Math.floor((newX + this.width - 1) / this.game.tileSize);
        const top    = Math.floor(this.y / this.game.tileSize);
        const bottom = Math.floor((this.y + this.height - 1) / this.game.tileSize);

        for (let y = top; y <= bottom; y++) {
            if (this.game.map[y] &&
                (this.game.map[y][left] === 1 || this.game.map[y][right] === 1) ||
                (this.game.map[y] && (this.game.map[y][left] === 0 || this.game.map[y][right] === 0))) {
                if (deltaX > 0) {
                    deltaX = (right * this.game.tileSize - this.width) - this.x;
                } else if (deltaX < 0) {
                    deltaX = (left + 1) * this.game.tileSize - this.x;
                }
                this.velX = 0;
                break;
            }
        }
        this.x += deltaX;
    }

    moveY(deltaY) {
        let newY = this.y + deltaY;
        newY = Math.max(0, Math.min(newY, this.game.map.length * this.game.tileSize - this.height));

        const topTileY    = Math.floor(newY / this.game.tileSize);
        const bottomTileY = Math.floor((newY + this.height) / this.game.tileSize);
        const leftTileX   = Math.floor(this.x / this.game.tileSize);
        const rightTileX  = Math.floor((this.x + this.width - 1) / this.game.tileSize);

        if (deltaY > 0) { // caindo
            let collision = false;
            for (let y = topTileY; y <= bottomTileY; y++) {
                if (this.game.map[y]) {
                    for (let x = leftTileX; x <= rightTileX; x++) {
                        if (this.game.map[y][x] === 1 || this.game.map[y][x] === 0) {
                            newY = y * this.game.tileSize - this.height;
                            this.grounded = true;
                            this.velY = 0;
                            collision = true;
                            break;
                        }
                    }
                }
                if (collision) break;
            }
            if (!collision) this.grounded = false;
        } else { // subindo
            let collision = false;
            for (let y = bottomTileY; y >= topTileY; y--) {
                if (this.game.map[y]) {
                    for (let x = leftTileX; x <= rightTileX; x++) {
                        if (this.game.map[y][x] === 1 || this.game.map[y][x] === 0) {
                            newY = (y + 1) * this.game.tileSize;
                            this.velY = 0;
                            collision = true;
                            break;
                        }
                    }
                }
                if (collision) break;
            }
            if (!collision) this.grounded = false;
        }

        this.y = newY;
    }

    draw() {
        // Pisca quando invencível
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 5) % 2 === 0) return;

        let frameToDraw = this.currentAnimation === 'run'
            ? this.animationFrames.run[this.currentFrame]
            : this.animationFrames.idle[this.currentFrame];

        const ctx = this.game.ctx;
        if (this.direction === 'right') {
            ctx.drawImage(frameToDraw, this.x - this.game.cameraX, this.y - this.game.cameraY, this.width, this.height);
        } else {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(frameToDraw, -(this.x + this.width - this.game.cameraX), this.y - this.game.cameraY, this.width, this.height);
            ctx.restore();
        }
    }
}

class Game {
    constructor() {
        this.canvas       = document.getElementById('gameCanvas');
        this.ctx          = this.canvas.getContext('2d');
        this.canvasWidth  = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        this.tileSize     = 32;
        this.map          = [];
        this.cameraX      = 0;
        this.cameraY      = 0;
        this.currentMap   = getMapURL('map1');

        // Inimigos e projéteis
        this.enemies = [];
        this.spells  = [];

        this.loadMap(getMapURL('map1'));
        this.player  = new Player(this);
        this.lastTime = 0;

        // Tiles
        this.numTotalTiposTile = 4;
        this.tileImages = [];
        for (let i = 0; i < this.numTotalTiposTile; i++) {
            const img = new Image();
            img.src = `assets/tile${i}.png`;
            this.tileImages.push(img);
        }

        // Crânios
        this.removedSkulls = [];

        // Menus
        this.menuImage = new Image();
        this.menuImage.onload = () => this.drawMenu();
        this.menuImage.src = 'assets/menu.png';
        this.menuActive = true;
        this.paused = false;
        this.pauseMenuImage = new Image();
        this.pauseMenuImage.src = 'assets/pause.png';

        document.addEventListener('keydown', (event) => this.handleKeyDown(event));

        this.gameLoop();
    }

    loadMap(mapUrl) {
        this.currentMap = mapUrl;
        fetch(this.currentMap)
            .then(response => response.text())
            .then(data => {
                this.map = data.trim().split('\n').map(row => row.split(',').map(Number));
                this.applyRemovedSkulls();
                this.initEnemies(); // reinicializa inimigos ao trocar de mapa
            });
    }

    applyRemovedSkulls() {
        if (this.removedSkulls) {
            for (const skull of this.removedSkulls) {
                const [x, y, map] = skull;
                if (this.currentMap === map) this.map[y][x] = -1;
            }
        }
    }

    removeSkull(x, y) {
        this.removedSkulls.push([x, y, this.currentMap]);
    }

    initEnemies() {
        this.enemies = [];
        this.spells  = []; // limpa projéteis ao trocar de mapa

        // Descobrir qual chave de mapa corresponde ao currentMap
        const mapKey = Object.keys(mapURLs).find(k => mapURLs[k] === this.currentMap);
        const spawns = enemySpawnConfig[mapKey] || [];

        for (const spawn of spawns) {
            this.enemies.push(new Enemy(this, spawn.x, spawn.y));
        }
    }

    updateEnemies() {
        for (const enemy of this.enemies) {
            enemy.update();
        }
        // Remove inimigos com animação de morte concluída
        this.enemies = this.enemies.filter(e => !e.isExpired());
    }

    drawEnemies() {
        for (const enemy of this.enemies) {
            enemy.draw();
        }
    }

    updateSpells() {
        for (const spell of this.spells) {
            spell.update();
        }
        // Remove projéteis inativos
        this.spells = this.spells.filter(s => s.active);
    }

    drawSpells() {
        for (const spell of this.spells) {
            spell.draw();
        }
    }

    checkCollisions() {
        const player = this.player;

        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;

            // Colisão projétil → inimigo
            for (const spell of this.spells) {
                if (!spell.active) continue;
                if (
                    spell.x < enemy.x + enemy.width  &&
                    spell.x + spell.width > enemy.x  &&
                    spell.y < enemy.y + enemy.height &&
                    spell.y + spell.height > enemy.y
                ) {
                    enemy.die();
                    spell.active = false;
                }
            }

            // Colisão jogador → inimigo
            if (!enemy.isCollidingWith(player)) continue;
            player.takeDamage();
        }
    }

    drawHUD() {
        const ctx = this.ctx;
        const heartSize = 22;
        const padding   = 8;

        ctx.save();
        ctx.font      = 'bold 14px "Arial", cursive';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#411525';
        ctx.shadowBlur  = 4;
        ctx.fillText('HP', padding, padding + heartSize - 7);
        ctx.restore();

        for (let i = 0; i < this.player.maxHealth; i++) {
            const hx = padding + 34 + i * (heartSize + 6);
            const hy = padding - 3;
            ctx.save();
            ctx.font      = `${heartSize}px serif`;
            ctx.globalAlpha = i < this.player.health ? 1 : 0.25;
            ctx.fillText('♥', hx, hy + heartSize - 2);
            ctx.restore();
        }

        // Indicador de magia (cooldown)
        const cdRatio = 1 - this.player.spellCooldown / this.player.spellCooldownMax;
        const barW = 60, barH = 7;
        const bx = padding, by = padding + heartSize + 6;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(bx, by, barW, barH);
        const barGrd = ctx.createLinearGradient(bx, 0, bx + barW, 0);
        barGrd.addColorStop(0, '#a855f7');
        barGrd.addColorStop(1, '#d8b4fe');
        ctx.fillStyle = barGrd;
        ctx.fillRect(bx, by, barW * cdRatio, barH);
        ctx.strokeStyle = '#411525';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, barW, barH);
        // Rótulo
        ctx.font = '9px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('Z', bx + barW + 5, by + barH);
        ctx.restore();
    }

    drawMap() {
        const camX = Math.round(this.cameraX);
        const camY = Math.round(this.cameraY);
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const tile = this.map[y][x];
                if (tile >= 0 && tile < this.tileImages.length) {
                    this.ctx.drawImage(this.tileImages[tile], x * this.tileSize - camX, y * this.tileSize - camY, this.tileSize, this.tileSize);
                }
            }
        }
    }

    drawMenu() {
        this.ctx.drawImage(this.menuImage, 0, 0, this.canvasWidth, this.canvasHeight);
    }

    drawPauseMenu() {
        this.ctx.drawImage(this.pauseMenuImage, 0, 0, this.canvasWidth, this.canvasHeight);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        if (this.menuActive) {
            this.drawMenu();
        } else if (this.paused) {
            this.drawPauseMenu();
        } else {
            this.drawMap();
            this.drawEnemies();
            this.drawSpells();
            this.player.draw();
            this.drawHUD();
        }
    }

    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.map.length === 0) {
            setTimeout(() => this.gameLoop(), 100);
            return;
        }

        if (!this.menuActive && !this.paused) {
            this.player.update();
            this.player.updateAnimation(deltaTime);
            this.updateEnemies();
            this.updateSpells();
            this.checkCollisions();
        }

        this.draw();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    handleKeyDown(event) {
        if (this.menuActive) {
            if (event.code === 'Enter') this.menuActive = false;
        } else {
            if (event.code === 'KeyP') this.togglePause();
        }
    }

    togglePause() {
        this.paused = !this.paused;
    }
}

new Game();