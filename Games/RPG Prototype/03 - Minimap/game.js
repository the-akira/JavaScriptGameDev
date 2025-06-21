const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');
const TILE_SIZE = 32;

// Game maps
const maps = {
    'forest': {
        id: 'forest',
        tileSize: TILE_SIZE,
        backgroundColor: '#35732a',
        borderColor: '#27541f',
        sprites: {
            ground: 'sprites/tiles/grass.png',
            wall: 'sprites/tiles/bush.png',
            obstacle: 'sprites/tiles/trunk.png',
            portal: 'sprites/portal.png'
        },
        grid: [
            "#######################################################",
            "#.....................................................#",
            "#.....................................................#",
            "#.............XXX....#.............#.........X##......#",
            "#.......##...........X.............X.........##X......#",
            "#........#...........##...............................#",
            "#........#........####X...............................#",
            "#........#............######..........................#",
            "#........X............X.............XXX...............#",
            "#.....................X..............#................#",
            "#.....................##X##X..........................#",
            "#............................................###......#",
            "#............................................###......#",
            "#.......X######X...........X##X.......................#",
            "#.....................................................#",
            "#.....................................................#",
            "#...........................###########...............#",
            "#...........................XX........................#",
            "#......######...............##........................#",
            "#......###########..........XX............X###X.......#",
            "#.........................................#####.......#",
            "#.....................................................#",
            "#.....................................................#",
            "#..............X###########X.............X#...........#",
            "#.....................................................#",
            "#.....................................................#",
            "#######################################################"
        ],
        portals: [
            {
                x: 15 * TILE_SIZE, 
                y: 10 * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                destinationMap: 'desert',
                destinationX: 2 * TILE_SIZE,
                destinationY: 5 * TILE_SIZE
            },
        ]
    },
    'desert': {
        id: 'desert',
        tileSize: TILE_SIZE,
        backgroundColor: '#1a4d1a',
        borderColor: '#0d2d0d',
        sprites: {
            ground: 'sprites/tiles/dirty.png',
            wall: 'sprites/tiles/stone.png',
            obstacle: 'sprites/tiles/plant.png',
            portal: 'sprites/portal.png'
        },
        grid: [
            "#############################################",
            "#...........................................#",
            "#...........................................#",
            "#......XXX..................................#",
            "#..................XXXX.....................#",
            "#.................................X.........#",
            "#.................................X.........#",
            "#.................................X.........#",
            "#...........XXXXX..............XXXX.........#",
            "#...............X..............X............#",
            "#...............X..........XXXXX............#",
            "#...........XXXXX...........................#",
            "#..........XX...............................#",
            "#..........X................................#",
            "#..........X...............XXXXXXXXX........#",
            "#...........................................#",
            "#...........................................#",
            "#...........................................#",
            "#..................................XX.......#",
            "#..........XXXXXXXXXXX.............XX.......#",
            "#....................XXXXXXX........X.......#",
            "#...........................................#",
            "#...........................................#",
            "#...........................................#",
            "#......XX............XXXXXXX.........XX.....#",
            "#......XX.............XXXXX..........XX.....#",
            "#......................XXX..................#",
            "#...........................................#",
            "#...........................................#",
            "#############################################"
        ],
        portals: [
            {
                x: 3 * TILE_SIZE,
                y: 9 * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                destinationMap: 'dungeon',
                destinationX: 2 * TILE_SIZE,
                destinationY: 2 * TILE_SIZE
            },
        ]
    },
    'dungeon': {
        id: 'dungeon',
        tileSize: TILE_SIZE,
        backgroundColor: '#1a1a2e',
        borderColor: '#292929',
        sprites: {
            ground: 'sprites/tiles/stonefloor.png',
            wall: 'sprites/tiles/wall.png',
            obstacle: 'sprites/tiles/greenwall.png',
            portal: 'sprites/portal.png'
        },
        grid: [
            "#############################",
            "#...........................#",
            "#...........................#",
            "#....XXX....................#",
            "#...........................#",
            "#...........................#",
            "#...........................#",
            "#...........XXXXX...........#",
            "#...........XXXXX...........#",
            "#..............XX...........#",
            "#..............XX...........#",
            "#..........XXXXXX...........#",
            "#..........XX...............#",
            "#...........................#",
            "#...........................#",
            "#...........................#",
            "#...........................#",
            "#...........................#",
            "#...........................#",
            "#.......XXXXXXXXXXXXXXX.....#",
            "#.......XXXXXXXXXXXXXXX.....#",
            "#...........................#",
            "#...........................#",
            "#...........................#",
            "#...........................#",
            "#........XXXXXXXXXXXX.......#",
            "#........XXXXXXXXXXXX.......#",
            "#........XXXXXXXXXXXX.......#",
            "#...........................#",
            "#...........................#",
            "#############################"
        ],
        portals: [
            {
                x: 5 * TILE_SIZE,
                y: 1 * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                destinationMap: 'forest',
                destinationX: 3 * TILE_SIZE,
                destinationY: 3 * TILE_SIZE
            },
            {
                x: 7 * TILE_SIZE,
                y: 12 * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                destinationMap: 'desert',
                destinationX: 3 * TILE_SIZE,
                destinationY: 3 * TILE_SIZE
            }
        ]
    }
};

function getMapDimensions(map) {
    return {
        width: map.grid[0].length * map.tileSize,
        height: map.grid.length * map.tileSize
    };
}

function getMapObstacles(map) {
    const obstacles = [];
    for (let y = 0; y < map.grid.length; y++) {
        for (let x = 0; x < map.grid[y].length; x++) {
            if (map.grid[y][x] === 'X' || map.grid[y][x] === '#') {
                obstacles.push({
                    x: x * map.tileSize,
                    y: y * map.tileSize,
                    width: map.tileSize,
                    height: map.tileSize
                });
            }
        }
    }
    return obstacles;
}

function processMap(mapData) {
    const dimensions = getMapDimensions(mapData);
    return {
        id: mapData.id,
        width: dimensions.width,
        height: dimensions.height,
        obstacles: getMapObstacles(mapData),
        portals: mapData.portals,
        grid: mapData.grid,
        tileSize: mapData.tileSize,
        backgroundColor: mapData.backgroundColor,
        borderColor: mapData.borderColor
    };
}

function loadMapSprites(map) {
    const sprites = {};
    const promises = [];

    for (const key in map.sprites) {
        sprites[key] = new Image();
        sprites[key].src = map.sprites[key];
        promises.push(new Promise((resolve) => {
            sprites[key].onload = resolve;
        }));
    }

    return Promise.all(promises).then(() => sprites);
}

const player = {
    x: 400,
    y: 300,
    width: 48,
    height: 48,
    speed: 4,
    sprite: new Image()
};

player.sprite.src = 'sprites/player.png';

const camera = {
    x: 0,
    y: 0
};

let currentMap = processMap(maps['forest']);

let spells = [];

// Input handling
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase()] = false;
    }
});

window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === 'm') {
        const minimap = document.getElementById('minimapCanvas');
        if (minimap.style.display === 'none') {
            minimap.style.display = 'block'; // Exibe o minimapa
        } else {
            minimap.style.display = 'none'; // Esconde o minimapa
        }
    }
});

let lastMagicTime = 0; // Tempo do último lançamento de magia
const magicCooldown = 500; // Cooldown de 1 segundo (1000 ms)

canvas.addEventListener('click', (event) => {
    const currentTime = Date.now();

    if (currentTime - lastMagicTime >= magicCooldown) {
        const rect = canvas.getBoundingClientRect();

        // Converte as coordenadas do clique para a posição real do mundo
        const mouseX = event.clientX - rect.left + camera.x;
        const mouseY = event.clientY - rect.top + camera.y;

        // Calcula a direção da magia a partir do centro do player
        const angle = Math.atan2(mouseY - (player.y + player.height / 2), mouseX - (player.x + player.width / 2));
        const speed = 6;

        // Adiciona a magia à lista
        spells.push({
            x: player.x + player.width / 2 - 10, // Inicia do centro do player
            y: player.y + player.height / 2,
            width: 24,
            height: 24,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            sprite: new Image()
        });
        spells[spells.length - 1].sprite.src = 'sprites/spells/fireball.png'; // Define o sprite da magia
        lastMagicTime = currentTime;
    }
});

let lastAreaMagicTime = 0; // Tempo do último lançamento da magia de área
const areaMagicCooldown = 2500; // Cooldown de 3 segundos (3000 ms)

canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Impede o menu de contexto de aparecer

    const currentTime = Date.now();

    // Verifica se o cooldown já passou
    if (currentTime - lastAreaMagicTime >= areaMagicCooldown) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left + camera.x; // Converte para coordenadas do mundo
        const mouseY = event.clientY - rect.top + camera.y;

        // Verifica se o local está livre
        if (isLocationFree(mouseX, mouseY)) {
            // Cria a magia de área no local clicado
            createAreaMagic(mouseX, mouseY);

            // Atualiza o tempo do último lançamento
            lastAreaMagicTime = currentTime;
        } else {
            console.log('Não é possível usar magia em cima de um obstáculo!'); // Feedback opcional
        }
    } else {
        console.log('Magia de área em cooldown!'); // Feedback opcional
    }
});

function isLocationFree(x, y) {
    // Verifica colisão com obstáculos
    for (const obstacle of currentMap.obstacles) {
        if (
            x >= obstacle.x &&
            x <= obstacle.x + obstacle.width &&
            y >= obstacle.y &&
            y <= obstacle.y + obstacle.height
        ) {
            return false; // Colide com um obstáculo
        }
    }

    // Verifica colisão com portais
    for (const portal of currentMap.portals) {
        if (
            x >= portal.x &&
            x <= portal.x + portal.width &&
            y >= portal.y &&
            y <= portal.y + portal.height
        ) {
            return false; // Colide com um portal
        }
    }

    return true; // Local livre
}

let areaMagics = []; // Array para armazenar as magias de área
let areaProjectiles = []; // Projéteis da magia de área

function createAreaMagic(x, y) {
    const magic = {
        x: x,
        y: y,
        width: 48,
        height: 48,
        createdAt: Date.now(),
        lifeTime: 5000, // A magia dura 5 segundos
        blinkInterval: 200,
        lastBlinkTime: Date.now(),
        visible: true,
        sprite: new Image()
    };

    magic.sprite.src = 'sprites/spells/areamagic.png';

    // Intervalo para disparar projéteis enquanto a magia estiver ativa
    magic.shootInterval = setInterval(() => {
        spawnAreaProjectile(magic);
    }, 500); // Dispara um projétil a cada 0.5 segundos

    areaMagics.push(magic);
}

function updateAreaProjectiles() {
    for (let i = areaProjectiles.length - 1; i >= 0; i--) {
        let projectile = areaProjectiles[i];

        projectile.x += projectile.dx;
        projectile.y += projectile.dy;

        // Verifica colisão com obstáculos
        const gridX = Math.floor(projectile.x / TILE_SIZE);
        const gridY = Math.floor(projectile.y / TILE_SIZE);

        if (currentMap.grid[gridY] 
            && currentMap.grid[gridY][gridX] === '#' 
            || currentMap.grid[gridY][gridX] === 'X') {
            areaProjectiles.splice(i, 1); // Remove o projétil ao colidir
            continue;
        }

        // Remove o projétil se sair do mapa
        if (projectile.x < 0 || projectile.y < 0 ||
            projectile.x > currentMap.grid[0].length * TILE_SIZE ||
            projectile.y > currentMap.grid.length * TILE_SIZE) {
            areaProjectiles.splice(i, 1);
        }
    }
}

function spawnAreaProjectile(magic) {
    const angle = Math.random() * Math.PI * 2; // Direção aleatória (0 a 360 graus)
    const speed = 5; // Velocidade do projétil
    const SPAWN_OFFSET = 30;

    areaProjectiles.push({
        x: (magic.x + magic.width / 2) - SPAWN_OFFSET,
        y: (magic.y + magic.height / 2) - SPAWN_OFFSET,
        width: 12,
        height: 12,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        sprite: new Image()
    });

    areaProjectiles[areaProjectiles.length - 1].sprite.src = 'sprites/spells/projectile.png';
}

function renderAreaProjectiles() {
    for (const projectile of areaProjectiles) {
        ctx.drawImage(
            projectile.sprite,
            Math.round(projectile.x - camera.x),
            Math.round(projectile.y - camera.y),
            projectile.width,
            projectile.height
        );
    }
}

function updateAreaMagics() {
    const currentTime = Date.now();

    for (let i = areaMagics.length - 1; i >= 0; i--) {
        const magic = areaMagics[i];

        // Agora verificamos corretamente se o tempo de vida acabou
        if (currentTime - magic.createdAt >= magic.lifeTime) {
            clearInterval(magic.shootInterval);
            areaMagics.splice(i, 1); // Remove a magia
            continue;
        }

        // Pisca a magia
        if (currentTime - magic.lastBlinkTime >= magic.blinkInterval) {
            magic.visible = !magic.visible; // Alterna a visibilidade
            magic.lastBlinkTime = currentTime; // Atualiza o tempo do último piscar
        }
    }
}

function renderAreaMagics() {
    for (const magic of areaMagics) {
        if (magic.visible) {
            ctx.drawImage(
                magic.sprite,
                Math.round(magic.x - magic.width / 2 - camera.x), // Ajusta para a câmera
                Math.round(magic.y - magic.height / 2 - camera.y), // Ajusta para a câmera
                magic.width,
                magic.height
            );
        }
    }
}

function updateSpells() {
    for (let i = spells.length - 1; i >= 0; i--) {
        let spell = spells[i];
        spell.x += spell.dx;
        spell.y += spell.dy;

        // Verifica colisão com obstáculos
        for (const obstacle of currentMap.obstacles) {
            if (checkCollision(spell, obstacle)) {
                spells.splice(i, 1); // Remove a magia
                break;
            }
        }

        // Remove a magia se sair do mapa
        if (spell.x < 0 || spell.y < 0 || spell.x > currentMap.width || spell.y > currentMap.height) {
            spells.splice(i, 1);
        }
    }
}

function drawCooldownBar(drawBackground = false) {
    const currentTime = Date.now();
    const remainingCooldown = magicCooldown - (currentTime - lastMagicTime);

    // Tamanho e posição da barra de cooldown
    const barWidth = 100; // Largura total da barra
    const barHeight = 10; // Altura da barra
    const barX = 15; // Posição X da barra
    const barY = 40; // Posição Y da barra

    if (drawBackground) {
        // Desenha o fundo da barra (cinza)
        ctx.fillStyle = '#555'; // Cor de fundo da barra
        ctx.fillRect(barX, barY, barWidth, barHeight);
    }

    // Desenha a barra de progresso (verde)
    if (remainingCooldown > 0) {
        const progress = (remainingCooldown / magicCooldown); // Progresso do cooldown (0 a 1)
        ctx.fillStyle = '#00FF00'; // Cor da barra de progresso (verde)
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }
}

function drawAreaMagicCooldownBar(drawBackground = false) {
    const currentTime = Date.now();
    const remainingCooldown = areaMagicCooldown - (currentTime - lastAreaMagicTime);

    // Tamanho e posição da barra de cooldown
    const barWidth = 100; // Largura total da barra
    const barHeight = 10; // Altura da barra
    const barX = 15; // Posição X da barra
    const barY = 60; // Posição Y da barra (abaixo da primeira barra)

    if (drawBackground) {
        // Desenha o fundo da barra (cinza)
        ctx.fillStyle = '#555'; // Cor de fundo da barra
        ctx.fillRect(barX, barY, barWidth, barHeight);
    }

    // Desenha a barra de progresso (azul)
    if (remainingCooldown > 0) {
        const progress = (remainingCooldown / areaMagicCooldown); // Progresso do cooldown (0 a 1)
        ctx.fillStyle = '#0000FF'; // Cor da barra de progresso (azul)
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }
}

function drawMinimap() {
    const grid = currentMap.grid;
    const mapWidth = grid[0].length * TILE_SIZE;
    const mapHeight = grid.length * TILE_SIZE;

    minimapCanvas.width = mapWidth / 10;
    minimapCanvas.height = mapHeight / 10;
    
    const scaleX = minimapCanvas.width / mapWidth;
    const scaleY = minimapCanvas.height / mapHeight;
    
    // Limpa o minimapa
    minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    
    // Desenha os tiles no minimapa
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            const tileX = x * TILE_SIZE * scaleX;
            const tileY = y * TILE_SIZE * scaleY;
            const tileW = TILE_SIZE * scaleX;
            const tileH = TILE_SIZE * scaleY;

            switch (grid[y][x]) {
                case '#':
                    minimapCtx.fillStyle = '#4a3425';
                    break;
                case '.':
                    minimapCtx.fillStyle = '#2d5a27';
                    break;
                case 'X':
                    minimapCtx.fillStyle = '#382914';
                    break;
                default:
                    continue;
            }
            minimapCtx.fillRect(tileX, tileY, tileW, tileH);
        }
    }
    
    // Desenha o jogador no minimapa
    const playerMinimapX = player.x * scaleX;
    const playerMinimapY = player.y * scaleY;
    minimapCtx.fillStyle = '#e63946';
    minimapCtx.fillRect(
        playerMinimapX,
        playerMinimapY,
        player.width * scaleX,
        player.height * scaleY
    );
}

function checkCollision(obj1, obj2) {
    const x1 = Math.round(obj1.x);
    const y1 = Math.round(obj1.y);
    const x2 = Math.round(obj2.x);
    const y2 = Math.round(obj2.y);
    
    return (
        x1 < x2 + obj2.width &&
        x1 + obj1.width > x2 &&
        y1 < y2 + obj2.height &&
        y1 + obj1.height > y2
    );
}

function checkPortals() {
    for (const portal of currentMap.portals) {
        if (checkCollision(player, portal)) {
            loadMapSprites(maps[portal.destinationMap]).then((newSprites) => {
                currentMap = processMap(maps[portal.destinationMap]);
                currentMapSprites = newSprites;
                player.x = portal.destinationX;
                player.y = portal.destinationY;

                for (const magic of areaMagics) {
                    clearInterval(magic.shootInterval); // Para todos os disparos ativos
                }
                areaMagics = [];
                spells = [];
                areaProjectiles = [];
            });
            break;
        }
    }
}

function updatePlayer() {
    let newX = player.x;
    let newY = player.y;

    // Calcula o movimento em cada direção separadamente
    if (keys.w) {
        player.y -= player.speed;
        // Verifica colisões verticais
        for (const obstacle of currentMap.obstacles) {
            if (checkCollision(player, obstacle)) {
                player.y = obstacle.y + obstacle.height;
            }
        }
    }
    if (keys.s) {
        player.y += player.speed;
        // Verifica colisões verticais
        for (const obstacle of currentMap.obstacles) {
            if (checkCollision(player, obstacle)) {
                player.y = obstacle.y - player.height;
            }
        }
    }
    if (keys.a) {
        player.x -= player.speed;
        // Verifica colisões horizontais
        for (const obstacle of currentMap.obstacles) {
            if (checkCollision(player, obstacle)) {
                player.x = obstacle.x + obstacle.width;
            }
        }
    }
    if (keys.d) {
        player.x += player.speed;
        // Verifica colisões horizontais
        for (const obstacle of currentMap.obstacles) {
            if (checkCollision(player, obstacle)) {
                player.x = obstacle.x - player.width;
            }
        }
    }

    // Aplica limites do mapa
    player.x = Math.max(0, Math.min(player.x, currentMap.width - player.width));
    player.y = Math.max(0, Math.min(player.y, currentMap.height - player.height));

    // Check for portal interactions
    checkPortals();

    // Update camera with map boundaries
    camera.x = Math.max(0, Math.min(player.x - canvas.width / 2, currentMap.width - canvas.width));
    camera.y = Math.max(0, Math.min(player.y - canvas.height / 2, currentMap.height - canvas.height));
}

function render() {
    // Clear canvas
    ctx.fillStyle = currentMap.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply camera transform
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw grid
    const startX = Math.floor(camera.x / currentMap.tileSize);
    const startY = Math.floor(camera.y / currentMap.tileSize);
    const endX = Math.ceil((camera.x + canvas.width) / currentMap.tileSize);
    const endY = Math.ceil((camera.y + canvas.height) / currentMap.tileSize);

    for (let y = startY; y < endY && y < currentMap.grid.length; y++) {
        for (let x = startX; x < endX && x < currentMap.grid[0].length; x++) {
            const tileX = x * currentMap.tileSize;
            const tileY = y * currentMap.tileSize;
            const cell = currentMap.grid[y]?.[x];

            if (cell === '#') { // Parede
                ctx.drawImage(currentMapSprites.wall, tileX, tileY, currentMap.tileSize, currentMap.tileSize);
            } else if (cell === 'X') { // Obstáculo
                ctx.drawImage(currentMapSprites.obstacle, tileX, tileY, currentMap.tileSize, currentMap.tileSize);
            } else { // Chão
                ctx.drawImage(currentMapSprites.ground, tileX, tileY, currentMap.tileSize, currentMap.tileSize);
            }
        }
    }

    // Draw portals
    for (const portal of currentMap.portals) {
        ctx.drawImage(currentMapSprites.portal, portal.x, portal.y, portal.width, portal.height);
    }

    // Draw spells
    for (const spell of spells) {
        ctx.drawImage(
            spell.sprite,
            Math.round(spell.x),
            Math.round(spell.y),
            spell.width,
            spell.height
        );
    }

    // Draw player
    ctx.drawImage(player.sprite, 
        Math.round(player.x), Math.round(player.y), 
        player.width, player.height
    );
    ctx.restore();

    // Draw current map name
    ctx.fillStyle = '#111827';
    ctx.font = '20px Arial';
    ctx.fillText(`Map: ${currentMap.id}`, 15, 30);

    drawCooldownBar();
    drawAreaMagicCooldownBar();
    drawMinimap();
}

function gameLoop() {
    updatePlayer();
    updateSpells();
    updateAreaMagics();
    updateAreaProjectiles();
    render();
    renderAreaMagics();
    renderAreaProjectiles();
    requestAnimationFrame(gameLoop);
}

// Start the game
let currentMapSprites;

// Função assíncrona para carregar as sprites e iniciar o jogo
async function initializeGame() {
    currentMapSprites = await loadMapSprites(maps['forest']); // Aguarda o carregamento das sprites
    gameLoop(); // Inicia o loop do jogo após o carregamento
}

// Inicializa o jogo
initializeGame();