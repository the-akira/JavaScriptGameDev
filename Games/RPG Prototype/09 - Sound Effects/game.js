const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');
const TILE_SIZE = 32;
let isGameOver = false;
let gameState = "start";

let lastTime = 0;
let gameTime = 0; // Tempo do jogo em segundos
const dayDuration = 120; // Duração de um dia completo em segundos (2 minutos)
const nightDuration = 60; // Duração de uma noite completa em segundos (1 minuto)

function updateTime(deltaTime) {
    gameTime += deltaTime / 1000; // Converte deltaTime para segundos
    if (gameTime >= dayDuration + nightDuration) {
        gameTime = 0; // Reinicia o ciclo após um dia e uma noite completos
    }
}

function isDay() {
    return gameTime < dayDuration; // Dia ocorre nos primeiros `dayDuration` segundos
}

function isNight() {
    return !isDay(); // Noite ocorre após o dia
}

function renderDayNightCycle() {
    if (!isNight()) return; // Se não for noite, não faz nada

    ctx.save();

    // Cria um gradiente radial ao redor do jogador
    let gradient = ctx.createRadialGradient(
        player.x + player.width / 2 - camera.x, 
        player.y + player.height / 2 - camera.y,
        50, // Raio interno (bem iluminado)
        player.x + player.width / 2 - camera.x, 
        player.y + player.height / 2 - camera.y,
        200 // Raio externo (sombra escura)
    );

    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");  // Centro completamente transparente (luz)
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");      // Bordas escuras

    // Desenha um overlay escuro e aplica o gradiente
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
}

function renderTimeIndicator() {
    ctx.save();
    ctx.font = "17px Arial";
    ctx.textAlign = "left";

    if (isDay()) {
        ctx.fillText("☀️", 754, 571); // Ícone de sol
    } else {
        ctx.fillText("🌙", 754, 571); // Ícone de lua
    }
    ctx.restore();
}

function renderCircularClock() {
    const clockRadius = 20; // Raio do relógio
    const clockX = 765; // Posição X do relógio
    const clockY = 565; // Posição Y do relógio

    const totalCycleTime = dayDuration + nightDuration; // Tempo total do ciclo (dia + noite)
    const progress = (gameTime % totalCycleTime) / totalCycleTime; // Progresso do tempo (0 a 1)

    ctx.save();
    ctx.translate(clockX, clockY); // Move o contexto para a posição do relógio

    ctx.beginPath();
    ctx.arc(0, 0, clockRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#333333"; // Cor de fundo do círculo (cinza escuro)
    ctx.fill();

    // Desenha o fundo do relógio (círculo vazio)
    ctx.beginPath();
    ctx.arc(0, 0, clockRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff"; // Cor do círculo (branco)
    ctx.lineWidth = 5;
    ctx.stroke();

    // Calcula o progresso separadamente para dia e noite
    let fillProgress;
    if (isDay()) {
        fillProgress = gameTime / dayDuration; // Progresso durante o dia
    } else {
        fillProgress = (gameTime - dayDuration) / nightDuration; // Progresso durante a noite
    }

    // Desenha a parte preenchida do relógio
    ctx.beginPath();
    ctx.arc(0, 0, clockRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fillProgress);
    ctx.strokeStyle = isDay() ? "#ffcc00" : "#0000ff"; // Cor do preenchimento (amarelo para dia, azul para noite)
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
}

// Game maps
const maps = {
    'forest': {
        id: 'forest',
        tileSize: TILE_SIZE,
        backgroundColor: '#35732a',
        borderColor: '#27541f',
        music: 'sounds/music/epic.mp3',
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
        ],
        enemies: [
            {
                type: "chaser",
                x: 3 * TILE_SIZE, // Posição X do inimigo
                y: 3 * TILE_SIZE,  // Posição Y do inimigo
                width: 32,          // Largura do inimigo
                height: 32,         // Altura do inimigo
                health: 100,        // Vida do inimigo
                maxHealth: 100,
                speed: 2,            // Velocidade do inimigo
                sprite: new Image(), // Sprite do inimigo
                spriteSrc: 'sprites/enemies/skull.png', // Caminho do sprite
                lastAttackTime: 0,
            },
            {
                type: "chaser",
                x: 35 * TILE_SIZE, // Posição X do inimigo
                y: 20 * TILE_SIZE,  // Posição Y do inimigo
                width: 32,          // Largura do inimigo
                height: 32,         // Altura do inimigo
                health: 100,        // Vida do inimigo
                maxHealth: 100,
                speed: 1.5,            // Velocidade do inimigo
                sprite: new Image(), // Sprite do inimigo
                spriteSrc: 'sprites/enemies/skull.png', // Caminho do sprite
                lastAttackTime: 0,
            },
            {
                type: "chaser",
                x: 5 * TILE_SIZE, // Posição X do inimigo
                y: 10 * TILE_SIZE,  // Posição Y do inimigo
                width: 32,          // Largura do inimigo
                height: 32,         // Altura do inimigo
                health: 100,        // Vida do inimigo
                maxHealth: 100,
                speed: 1.15,            // Velocidade do inimigo
                sprite: new Image(), // Sprite do inimigo
                spriteSrc: 'sprites/enemies/skull.png', // Caminho do sprite
                lastAttackTime: 0,
            },
            {
                type: "shooter", // Atira no jogador
                x: 35 * TILE_SIZE,
                y: 20 * TILE_SIZE,
                width: 32,
                height: 32,
                health: 100,
                maxHealth: 100,
                speed: 0, // Não se move
                attackCooldown: 2000, // Tempo entre tiros
                lastAttackTime: 0,
                sprite: new Image(),
                spriteSrc: 'sprites/enemies/eye.png'
            },
            {
                type: "patrol", // Tipo do inimigo
                x: 3 * TILE_SIZE, // Posição X inicial
                y: 3 * TILE_SIZE, // Posição Y inicial
                width: 32, // Largura do inimigo
                height: 32, // Altura do inimigo
                health: 100, // Vida do inimigo
                maxHealth: 100,
                speed: 1, // Velocidade de movimento
                dx: 0, // Inicializa dx
                dy: 0, // Inicializa dy
                attackCooldown: 2000, // Tempo entre ataques (em milissegundos)
                lastMoveTime: Date.now(),
                lastAttackTime: 0, // Último tempo de ataque
                sprite: new Image(), // Sprite do inimigo
                spriteSrc: 'sprites/enemies/medusa.png' // Caminho do sprite
            }
        ],
        npcs: [
            {
                x: 4 * TILE_SIZE,
                y: 22 * TILE_SIZE,
                width: 48,
                height: 51,
                sprite: new Image(),
                spriteSrc: "sprites/npcs/Gabriel.png",
                text: ["Olá, viajante!", "Cuidado com os monstros na floresta.", "Boa sorte!"],
                interactionRange: 50, // Distância para interagir
            },
            {
                x: 50 * TILE_SIZE,
                y: 20 * TILE_SIZE,
                width: 48,
                height: 60,
                sprite: new Image(),
                spriteSrc: "sprites/npcs/Michael.png",
                text: ["Oi, amigo!", "Que o sucesso esteja sempre com você.", "Tchau!"],
                interactionRange: 50, // Distância para interagir
            }
        ],
        items: [
            { 
                x: 5 * TILE_SIZE, 
                y: 7 * TILE_SIZE,
                width: 20,
                height: 25,
                type: 'potion', 
                spriteSrc: 'sprites/items/potion.png', 
                sprite: new Image() 
            },
            { 
                x: 10 * TILE_SIZE, 
                y: 5 * TILE_SIZE,
                width: 25,
                height: 25,
                type: 'powerup', 
                spriteSrc: 'sprites/items/powerup.png', 
                sprite: new Image() 
            },
            { 
                x: 8 * TILE_SIZE, 
                y: 12 * TILE_SIZE, 
                width: 31,
                height: 28,
                type: 'teleport', 
                spriteSrc: 'sprites/items/teleport.png', 
                sprite: new Image() 
            }
        ]
    },
    'desert': {
        id: 'desert',
        tileSize: TILE_SIZE,
        backgroundColor: '#1a4d1a',
        borderColor: '#0d2d0d',
        music: 'sounds/music/mystery.mp3',
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
        ],
        enemies: [
            {
                type: "chaser",
                x: 3 * TILE_SIZE, // Posição X do inimigo
                y: 3 * TILE_SIZE,  // Posição Y do inimigo
                width: 32,          // Largura do inimigo
                height: 32,         // Altura do inimigo
                health: 100,        // Vida do inimigo
                maxHealth: 100,
                speed: 2,            // Velocidade do inimigo
                sprite: new Image(), // Sprite do inimigo
                spriteSrc: 'sprites/enemies/skull.png', // Caminho do sprite
                lastAttackTime: 0,
            },
            {
                type: "shooter", // Atira no jogador
                x: 15 * TILE_SIZE,
                y: 15 * TILE_SIZE,
                width: 32,
                height: 32,
                health: 100,
                maxHealth: 100,
                speed: 0, // Não se move
                attackCooldown: 2000, // Tempo entre tiros
                lastAttackTime: 0,
                sprite: new Image(),
                spriteSrc: 'sprites/enemies/eye.png'
            },
            {
                type: "patrol", // Tipo do inimigo
                x: 3 * TILE_SIZE, // Posição X inicial
                y: 18 * TILE_SIZE, // Posição Y inicial
                width: 32, // Largura do inimigo
                height: 32, // Altura do inimigo
                health: 100, // Vida do inimigo
                maxHealth: 100,
                speed: 1, // Velocidade de movimento
                dx: 0, // Inicializa dx
                dy: 0, // Inicializa dy
                attackCooldown: 2000, // Tempo entre ataques (em milissegundos)
                lastMoveTime: Date.now(),
                lastAttackTime: 0, // Último tempo de ataque
                sprite: new Image(), // Sprite do inimigo
                spriteSrc: 'sprites/enemies/medusa.png' // Caminho do sprite
            }
        ],
        npcs: [
            {
                x: 3 * TILE_SIZE,
                y: 25 * TILE_SIZE,
                width: 35,
                height: 53,
                sprite: new Image(),
                spriteSrc: "sprites/npcs/Raphael.png",
                text: ["Saudações!", "O deserto é um local perigoso, tome cuidado!", "Fique com Deus!"],
                interactionRange: 50, // Distância para interagir
            },
        ],
        items: []
    },
    'dungeon': {
        id: 'dungeon',
        tileSize: TILE_SIZE,
        backgroundColor: '#1a1a2e',
        borderColor: '#292929',
        music: 'sounds/music/pendulum.mp3',
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
        ],
        enemies: [
            {
                type: "chaser",
                x: 18 * TILE_SIZE, // Posição X do inimigo
                y: 3 * TILE_SIZE,  // Posição Y do inimigo
                width: 32,          // Largura do inimigo
                height: 32,         // Altura do inimigo
                health: 100,        // Vida do inimigo
                maxHealth: 100,
                speed: 2,            // Velocidade do inimigo
                sprite: new Image(), // Sprite do inimigo
                spriteSrc: 'sprites/enemies/skull.png', // Caminho do sprite
                lastAttackTime: 0,
            },
            {
                type: "shooter", // Atira no jogador
                x: 15 * TILE_SIZE,
                y: 15 * TILE_SIZE,
                width: 32,
                height: 32,
                health: 100,
                maxHealth: 100,
                speed: 0, // Não se move
                attackCooldown: 2000, // Tempo entre tiros
                lastAttackTime: 0,
                sprite: new Image(),
                spriteSrc: 'sprites/enemies/eye.png'
            },
            {
                type: "patrol", // Tipo do inimigo
                x: 3 * TILE_SIZE, // Posição X inicial
                y: 18 * TILE_SIZE, // Posição Y inicial
                width: 32, // Largura do inimigo
                height: 32, // Altura do inimigo
                health: 100, // Vida do inimigo
                maxHealth: 100,
                speed: 1, // Velocidade de movimento
                dx: 0, // Inicializa dx
                dy: 0, // Inicializa dy
                attackCooldown: 2000, // Tempo entre ataques (em milissegundos)
                lastMoveTime: Date.now(),
                lastAttackTime: 0, // Último tempo de ataque
                sprite: new Image(), // Sprite do inimigo
                spriteSrc: 'sprites/enemies/medusa.png' // Caminho do sprite
            }
        ],
        npcs: [
            {
                x: 24 * TILE_SIZE,
                y: 26 * TILE_SIZE,
                width: 35,
                height: 53,
                sprite: new Image(),
                spriteSrc: "sprites/npcs/Uriel.png",
                text: ["Salve o Mestre!", "A masmorra é cheia de perigos e mistérios!", "Que a paz esteja com você!"],
                interactionRange: 50, // Distância para interagir
            },
        ],
        items: []
    }
};

const sounds = {
    curse: new Audio('sounds/effects/curse.mp3'),
    flower: new Audio('sounds/effects/flower.ogg'),
    potion: new Audio('sounds/effects/potion.ogg'),
    teleport: new Audio('sounds/effects/teleport.ogg'),
    owl: new Audio('sounds/effects/owl.ogg'),
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
        enemies: mapData.enemies,
        npcs: mapData.npcs,
        items: mapData.items,
        grid: mapData.grid,
        tileSize: mapData.tileSize,
        backgroundColor: mapData.backgroundColor,
        borderColor: mapData.borderColor,
        sprites: { ...mapData.sprites },
        music: mapData.music
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

    for (const npc of map.npcs) {
        npc.sprite.src = npc.spriteSrc;
        promises.push(new Promise((resolve) => {
            npc.sprite.onload = resolve;
        }));
    }

    for (const enemy of map.enemies) {
        enemy.sprite.src = enemy.spriteSrc;
        promises.push(new Promise((resolve) => {
            enemy.sprite.onload = resolve;
        }));
    }

    for (const item of map.items) {
        item.sprite.src = item.spriteSrc;
        promises.push(new Promise((resolve) => {
            item.sprite.onload = resolve;
        }));
    }

    return Promise.all(promises).then(() => sprites);
}

function heuristic(a, b) {
    // Distância de Manhattan (soma das diferenças absolutas nas coordenadas x e y)
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function aStar(grid, start, end) {
    const openSet = [start];
    const closedSet = new Set();
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    gScore[`${start.x},${start.y}`] = 0;
    fScore[`${start.x},${start.y}`] = heuristic(start, end);

    while (openSet.length > 0) {
        // Encontra o nó com o menor fScore
        let current = openSet[0];
        for (let i = 1; i < openSet.length; i++) {
            if (fScore[`${openSet[i].x},${openSet[i].y}`] < fScore[`${current.x},${current.y}`]) {
                current = openSet[i];
            }
        }

        // Se chegamos ao destino, reconstruímos o caminho
        if (current.x === end.x && current.y === end.y) {
            return reconstructPath(cameFrom, current);
        }

        // Remove o nó atual do openSet e adiciona ao closedSet
        openSet.splice(openSet.indexOf(current), 1);
        closedSet.add(`${current.x},${current.y}`);

        // Verifica os vizinhos
        const neighbors = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 }
        ];

        for (const neighbor of neighbors) {
            if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= grid[0].length || neighbor.y >= grid.length) continue;
            if (grid[neighbor.y][neighbor.x] === 1 || closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;

            const tentativeGScore = gScore[`${current.x},${current.y}`] + 1;

            if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                openSet.push(neighbor);
            } else if (tentativeGScore >= gScore[`${neighbor.x},${neighbor.y}`]) {
                continue;
            }

            cameFrom[`${neighbor.x},${neighbor.y}`] = current;
            gScore[`${neighbor.x},${neighbor.y}`] = tentativeGScore;
            fScore[`${neighbor.x},${neighbor.y}`] = gScore[`${neighbor.x},${neighbor.y}`] + heuristic(neighbor, end);
        }
    }

    return []; // Nenhum caminho encontrado
}

function reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom[`${current.x},${current.y}`]) {
        current = cameFrom[`${current.x},${current.y}`];
        path.push(current);
    }
    return path.reverse();
}

function generateWalkableGrid(map) {
    return map.grid.map(row => row.split('').map(tile => tile === '.' ? 0 : 1));
}

function dijkstra(grid, start, end) {
    const directions = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
    ];

    const queue = [{ x: start.x, y: start.y, cost: 0, path: [] }];
    const costs = {};
    costs[`${start.x},${start.y}`] = 0;

    while (queue.length > 0) {
        queue.sort((a, b) => a.cost - b.cost); // Ordena pelo menor custo
        const { x, y, cost, path } = queue.shift();

        if (x === end.x && y === end.y) return path;

        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            const newCost = cost + 1;

            if (newX < 0 || newY < 0 || newX >= grid[0].length || newY >= grid.length) continue;
            if (grid[newY][newX] === 1) continue;

            const key = `${newX},${newY}`;
            if (newCost < (costs[key] || Infinity)) {
                costs[key] = newCost;
                queue.push({ x: newX, y: newY, cost: newCost, path: [...path, { x: newX, y: newY }] });
            }
        }
    }
    return [];
}

function bfs(grid, start, end) {
    const directions = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, // Cima, Baixo
        { x: -1, y: 0 }, { x: 1, y: 0 }  // Esquerda, Direita
    ];
    
    const queue = [{ x: start.x, y: start.y, path: [] }];
    const visited = new Set();
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
        const { x, y, path } = queue.shift();

        if (x === end.x && y === end.y) return path; // Caminho encontrado

        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;

            if (newX < 0 || newY < 0 || newX >= grid[0].length || newY >= grid.length) continue;
            if (grid[newY][newX] === 1 || visited.has(`${newX},${newY}`)) continue;

            visited.add(`${newX},${newY}`);
            queue.push({ x: newX, y: newY, path: [...path, { x: newX, y: newY }] });
        }
    }
    return []; // Nenhum caminho encontrado
}

let floatingTexts = [];

function createFloatingText(text, x, y, color = '#ff0000', duration = 1000) {
    floatingTexts.push({
        text: text,
        x: x,
        y: y,
        color: color,
        startTime: Date.now(),
        duration: duration
    });
}

function updateFloatingTexts() {
    const currentTime = Date.now();

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const floatingText = floatingTexts[i];

        // Remove o texto se o tempo expirou
        if (currentTime - floatingText.startTime >= floatingText.duration) {
            floatingTexts.splice(i, 1);
        } else {
            // Move o texto para cima ao longo do tempo
            floatingText.y -= 0.5; // Ajuste a velocidade de subida conforme necessário
        }
    }
}

function renderFloatingTexts() {
    ctx.save();
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';

    for (const floatingText of floatingTexts) {
        ctx.fillStyle = floatingText.color;
        ctx.fillText(floatingText.text, floatingText.x - camera.x, floatingText.y - camera.y);
    }

    ctx.restore();
}

function drawAggroArea(enemy, color = 'rgba(255, 0, 0, 0.2)', radius = 500) {
    ctx.save();
    ctx.strokeStyle = color; // Cor da borda do círculo
    ctx.fillStyle = color; // Cor do preenchimento do círculo
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
        enemy.x + enemy.width / 2, // Centro X do inimigo (ajustado para a câmera)
        enemy.y + enemy.height / 2, // Centro Y do inimigo (ajustado para a câmera)
        radius, // Raio da área de aggro (passado como argumento)
        0, Math.PI * 2
    );
    ctx.fill(); // Preenche o círculo com a cor definida em fillStyle
    ctx.stroke(); // Desenha a borda do círculo
    ctx.restore();
}

// Adicione uma lista para armazenar inimigos derrotados
let defeatedEnemies = [];

// Defina o tempo de respawn (em milissegundos)
const RESPAWN_TIME = 10000; // 10 segundos

function updateEnemies() {
    const grid = generateWalkableGrid(currentMap);
    const updateInterval = 2000; // Aumenta o intervalo de recálculo para 2 segundos

    for (let enemy of currentMap.enemies) {
        let distanceX = player.x - enemy.x;
        let distanceY = player.y - enemy.y;
        let distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

        if (enemy.type === "chaser") {
            // Se o jogador estiver fora do alcance, o inimigo para de perseguir
            if (distance > 500) {
                enemy.path = [];
                continue;
            }

            if (distance < 45) { // Aproximadamente a largura do jogador
                let currentTime = Date.now();
                if (currentTime - enemy.lastAttackTime > DAMAGE_COOLDOWN) {
                    let damage = isCursed ? randomIntFromInterval(10, 25) : randomIntFromInterval(5, 15);
                    player.health -= damage; // Aplica dano ao jogador
                    createFloatingText(`-${damage}`, player.x + player.width / 2, player.y, '#ff0000', 1000);
                    enemy.lastAttackTime = currentTime;

                    if (player.health <= 0) {
                        handlePlayerDeath();
                    }
                }
            }

            // Recalcula o caminho apenas se necessário
            if (!enemy.lastPathUpdate || Date.now() - enemy.lastPathUpdate > updateInterval) {
                let enemyTile = { x: Math.floor(enemy.x / TILE_SIZE), y: Math.floor(enemy.y / TILE_SIZE) };
                let playerTile = { x: Math.floor(player.x / TILE_SIZE), y: Math.floor(player.y / TILE_SIZE) };

                // Verifica se o jogador se moveu significativamente
                if (!enemy.lastPlayerTile || enemy.lastPlayerTile.x !== playerTile.x || enemy.lastPlayerTile.y !== playerTile.y) {
                    let newPath = aStar(grid, enemyTile, playerTile);

                    if (newPath.length > 0) {
                        enemy.path = newPath;
                        enemy.lastPathUpdate = Date.now();
                        enemy.lastPlayerTile = playerTile; // Armazena a última posição do jogador
                    }
                }
            }

            // Se há um caminho, o inimigo se move
            if (enemy.path && enemy.path.length > 0) {
                let nextStep = enemy.path[0];
                let targetX = nextStep.x * TILE_SIZE;
                let targetY = nextStep.y * TILE_SIZE;

                let directionX = targetX - enemy.x;
                let directionY = targetY - enemy.y;
                let distance = Math.sqrt(directionX ** 2 + directionY ** 2);

                if (distance > 1) {
                    let newX = enemy.x + (directionX / distance) * enemy.speed;
                    let newY = enemy.y + (directionY / distance) * enemy.speed;

                    // Verifica colisão antes de mover
                    let collided = currentMap.obstacles.some(obstacle =>
                        checkCollision({ x: newX, y: newY, width: enemy.width, height: enemy.height }, obstacle)
                    );

                    if (!collided) {
                        enemy.x = newX;
                        enemy.y = newY;
                    } else {
                        // Se houver colisão, tenta desviar do obstáculo
                        let angle = Math.atan2(directionY, directionX);
                        let offsetX = Math.cos(angle + Math.PI / 4) * enemy.speed;
                        let offsetY = Math.sin(angle + Math.PI / 4) * enemy.speed;

                        let newXOffset = enemy.x + offsetX;
                        let newYOffset = enemy.y + offsetY;

                        let collidedOffset = currentMap.obstacles.some(obstacle =>
                            checkCollision({ x: newXOffset, y: newYOffset, width: enemy.width, height: enemy.height }, obstacle)
                        );

                        if (!collidedOffset) {
                            enemy.x = newXOffset;
                            enemy.y = newYOffset;
                        } else {
                            // Se ainda colidir, tenta o outro lado
                            offsetX = Math.cos(angle - Math.PI / 4) * enemy.speed;
                            offsetY = Math.sin(angle - Math.PI / 4) * enemy.speed;

                            newXOffset = enemy.x + offsetX;
                            newYOffset = enemy.y + offsetY;

                            collidedOffset = currentMap.obstacles.some(obstacle =>
                                checkCollision({ x: newXOffset, y: newYOffset, width: enemy.width, height: enemy.height }, obstacle)
                            );

                            if (!collidedOffset) {
                                enemy.x = newXOffset;
                                enemy.y = newYOffset;
                            } else {
                                // Se ainda colidir, remove o tile do caminho e recalcula
                                enemy.path.shift();
                            }
                        }
                    }
                } else {
                    enemy.path.shift(); // Remove o tile atual do caminho
                }
            }
        }

        else if (enemy.type === "patrol") {
            updatePatrolEnemy(enemy, distance);
        }

        else if (enemy.type === "shooter") {
            // Verifica se está na distância de ataque
            if (distance < 300) {
                const currentTime = Date.now();
                if (currentTime - enemy.lastAttackTime >= enemy.attackCooldown) {
                    shootAtPlayer(enemy);
                    enemy.lastAttackTime = currentTime;
                }
            }
        }
    }
}

function updateDefeatedEnemies() {
    for (let i = defeatedEnemies.length - 1; i >= 0; i--) {
        let defeatedEnemy = defeatedEnemies[i];

        // Verifica se o inimigo pertence ao mapa atual
        if (defeatedEnemy.mapId === currentMap.id) {
            // Verifica se o tempo de respawn já passou
            if (Date.now() - defeatedEnemy.timeDefeated >= RESPAWN_TIME) {
                // Respawna o inimigo
                defeatedEnemy.enemy.health = defeatedEnemy.enemy.maxHealth; // Restaura a vida
                let newPosition = getRandomValidPosition();
                defeatedEnemy.enemy.x = newPosition.x; // Posição X fixa
                defeatedEnemy.enemy.y = newPosition.y; // Posição Y fixa
                currentMap.enemies.push(defeatedEnemy.enemy); // Adiciona de volta ao mapa
                defeatedEnemies.splice(i, 1); // Remove da lista de derrotados
            }
        }
    }
}

function getRandomWalkableTile() {
    let walkableTiles = [];

    for (let y = 0; y < currentMap.grid.length; y++) {
        for (let x = 0; x < currentMap.grid[y].length; x++) {
            if (currentMap.grid[y][x] === '.') { // Tiles caminháveis
                walkableTiles.push({ x: x * TILE_SIZE, y: y * TILE_SIZE });
            }
        }
    }

    return walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
}

function updatePatrolEnemy(enemy, playerDistance) {
    const currentTime = Date.now();

    // Se o inimigo não tem um destino, escolhe um aleatório no mapa
    if (!enemy.target || (Math.abs(enemy.x - enemy.target.x) < 10 && Math.abs(enemy.y - enemy.target.y) < 10)) {
        enemy.target = getRandomWalkableTile(); // Escolhe um destino válido
    }

    // Calcula a direção até o alvo
    let directionX = enemy.target.x - enemy.x;
    let directionY = enemy.target.y - enemy.y;
    let distance = Math.sqrt(directionX ** 2 + directionY ** 2);

    if (distance > 1) {
        enemy.x += (directionX / distance) * enemy.speed;
        enemy.y += (directionY / distance) * enemy.speed;
    }

    // Verifica colisões
    for (const obstacle of currentMap.obstacles) {
        if (checkCollision(enemy, obstacle)) {
            enemy.x -= (directionX / distance) * enemy.speed;
            enemy.y -= (directionY / distance) * enemy.speed;
            enemy.target = null; // Escolhe um novo destino se colidir
        }
    }

    // Lança projéteis aleatoriamente
    if (currentTime - enemy.lastAttackTime >= enemy.attackCooldown && playerDistance < 400) {
        shootMedusa(enemy);
        enemy.lastAttackTime = currentTime;
    }
}

let medusaProjectiles = [];

function shootMedusa(enemy) {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const speed = 4;

    medusaProjectiles.push({
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
        width: 16,
        height: 16,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        sprite: new Image()
    });

    medusaProjectiles[medusaProjectiles.length - 1].sprite.src = 'sprites/spells/medusaprojectile.png';
}

function renderMedusaProjectiles() {
    for (const projectile of medusaProjectiles) {
        ctx.drawImage(
            projectile.sprite,
            Math.round(projectile.x - camera.x),
            Math.round(projectile.y - camera.y),
            projectile.width,
            projectile.height
        );
    }
}

function updateMedusaProjectiles() {
    for (let i = medusaProjectiles.length - 1; i >= 0; i--) {
        const projectile = medusaProjectiles[i];
        projectile.x += projectile.dx;
        projectile.y += projectile.dy;

        if (checkCollision(projectile, player)) {
            let damage = isCursed ? randomIntFromInterval(5, 30) : randomIntFromInterval(2, 20);
            player.health -= damage; // Reduz 10 de vida
            createFloatingText(`-${damage}`, player.x + player.width / 2, player.y, '#ff0000', 1000);
            if (player.health <= 0) {
                handlePlayerDeath();
            }
            console.log("O jogador foi atingido!"); // Aqui podemos reduzir a vida do jogador futuramente
            medusaProjectiles.splice(i, 1); // Remove o projétil
        }
    }
}

function renderPatrolEnemy(enemy) {
    ctx.drawImage(
        enemy.sprite,
        Math.round(enemy.x - camera.x),
        Math.round(enemy.y - camera.y),
        enemy.width,
        enemy.height
    );
}

let enemyProjectiles = [];

function shootAtPlayer(enemy) {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const speed = 4;

    enemyProjectiles.push({
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
        width: 16,
        height: 16,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        sprite: new Image()
    });

    enemyProjectiles[enemyProjectiles.length - 1].sprite.src = 'sprites/spells/enemyprojectile.png';
}

function updateEnemyProjectiles() {
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        let projectile = enemyProjectiles[i];

        projectile.x += projectile.dx;
        projectile.y += projectile.dy;

        // Verifica colisão com obstáculos
        const gridX = Math.floor(projectile.x / TILE_SIZE);
        const gridY = Math.floor(projectile.y / TILE_SIZE);

        if (currentMap.grid[gridY] && (currentMap.grid[gridY][gridX] === '#' || currentMap.grid[gridY][gridX] === 'X')) {
            enemyProjectiles.splice(i, 1); // Remove o projétil ao colidir
            continue;
        }

        // Verifica colisão com o jogador
        if (checkCollision(projectile, player)) {
            let damage = isCursed ? randomIntFromInterval(20, 45) : randomIntFromInterval(10, 30);
            player.health -= damage; // Reduz 10 de vida
            createFloatingText(`-${damage}`, player.x + player.width / 2, player.y, '#ff0000', 1000);
            if (player.health <= 0) {
                handlePlayerDeath();
            }
            console.log("O jogador foi atingido!"); // Aqui podemos reduzir a vida do jogador futuramente
            enemyProjectiles.splice(i, 1); // Remove o projétil
        }

        // Remove o projétil se sair do mapa
        if (projectile.x < 0 || projectile.y < 0 ||
            projectile.x > currentMap.width || projectile.y > currentMap.height) {
            enemyProjectiles.splice(i, 1);
        }
    }
}

function handlePlayerDeath() {
    console.log("Game Over!");
    isGameOver = true; // Ativa o estado de Game Over
    gameState = 'game over';
    if (currentMusic) {
        currentMusic.pause();
        currentMusic = null;
    }
}

function renderGameOverScreen() {
    ctx.save();
    minimap.style.display = 'none';
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Fundo semi-transparente
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#d1d8e6";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";

    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px Arial";
    ctx.fillText("Pressione ENTER para reiniciar", canvas.width / 2, canvas.height / 2 + 20);
    ctx.restore();
}

const startScreenImage = new Image();
startScreenImage.src = "sprites/avatar.jpeg";

function renderStartScreen() {
    ctx.save();
    minimap.style.display = 'none';
    ctx.fillStyle = "#000"; // Fundo preto
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#d1d8e6"; // Texto branco
    ctx.font = "40px Arial";
    ctx.textAlign = "center";

    if (startScreenImage.complete) {
        const imgWidth = 190; // Ajuste conforme necessário
        const imgHeight = 190;
        const imgX = (canvas.width - imgWidth) / 2; // Posição X da imagem (centralizada)
        const imgY = canvas.height / 8.2; // Posição Y da imagem

        ctx.drawImage(startScreenImage, (canvas.width - imgWidth) / 2, canvas.height / 8.2, imgWidth, imgHeight);

        // Desenha a borda ao redor da imagem
        ctx.strokeStyle = "#d1d8e6"; // Cor da borda (branca)
        ctx.lineWidth = 2; // Espessura da borda
        ctx.strokeRect(imgX, imgY, imgWidth, imgHeight); // Desenha o retângulo da borda
    }

    ctx.fillText("As Aventuras do", canvas.width / 2, canvas.height / 1.65);
    ctx.fillText("Mestre dos Magos", canvas.width / 2, canvas.height / 1.45);
    ctx.font = "24px Arial"
    ctx.fillText("Pressione ENTER para iniciar", canvas.width / 2, canvas.height / 1.15);
    ctx.restore();
}

function renderPauseMenu() {
    ctx.save();
    minimap.style.display = 'none';
    ctx.fillStyle = "#000"; // Fundo preto
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#d1d8e6"; // Texto branco
    ctx.font = "40px Arial";
    ctx.textAlign = "center";

    ctx.fillText("JOGO PAUSADO", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px Arial"
    ctx.fillText("Pressione ENTER para continuar", canvas.width / 2, canvas.height / 2 + 20);
    ctx.restore();
}

let pauseStartTime = 0; // Tempo em que o jogo foi pausado
let totalPausedTime = 0; // Tempo total que o jogo ficou pausado
let curseRemainingTime = 0;

window.addEventListener("keydown", (event) => {
    if (gameState === "start" && event.key === "Enter") {
        gameState = "playing"; // Começa o jogo
        minimap.style.display = 'block';
        startCurseCycle();
        playMapMusic(maps['forest']);
    } else if (gameState === "playing" && event.key === "Escape" && !isCursed) {
        gameState = "paused"; // Pausa o jogo
        pauseStartTime = Date.now();
        if (currentMusic) {
            currentMusic.pause(); // Pausa a música ao pausar o jogo
        }
        if (isOwlMode && owlModeTimeout) {
            clearTimeout(owlModeTimeout); // Cancela o temporizador
            owlModeRemainingTime = Math.max(0, owlModeDuration - (Date.now() - owlModeStartTime)); 
        }
        clearInterval(curseInterval);
        curseRemainingTime = Math.max(0, CURSE_INTERVAL - (Date.now() - curseTimeControl)); // Salva tempo restante
    } else if (gameState === "paused") {
        if (event.key === "Enter") {
            gameState = "playing"; // Retoma o jogo
            totalPausedTime += Date.now() - pauseStartTime;

            if (currentMusic) {
                currentMusic.play(); // Retoma a música ao retomar o jogo
            }

            // Se o modo coruja estava ativo, retoma o temporizador com o tempo restante
            if (isOwlMode && owlModeRemainingTime > 0) {
                owlModeStartTime = Date.now() - (owlModeDuration - owlModeRemainingTime);
                owlModeTimeout = setTimeout(deactivateOwlMode, owlModeRemainingTime);
            }
            minimap.style.display = 'block';
            if (!isCursed) {
                curseTimeControl = Date.now() - (CURSE_INTERVAL - curseRemainingTime); 

                startCurseCycle();
            }
        }
    }
});

function renderPlayerHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = canvas.width - canvas.width + 15;
    const y = canvas.height - 35;

    // Fundo da barra
    ctx.fillStyle = "#444";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Barra de vida preenchida
    const healthWidth = (Math.max(player.health, 0) / player.maxHealth) * barWidth;
    ctx.fillStyle = player.health > 50 ? "green" : player.health > 20 ? "yellow" : "red";
    ctx.fillRect(x, y, healthWidth, barHeight);

    // Contorno da barra
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
}

function drawEnemyHealthBar(enemy) {
    const barWidth = enemy.width; // Largura da barra igual ao inimigo
    const barHeight = 5; // Altura fixa da barra
    const currentHealth = Math.max(enemy.health, 0);
    const healthPercentage = currentHealth / enemy.maxHealth;

    // Posição da barra acima do inimigo
    const barX = Math.round(enemy.x - camera.x);
    const barY = Math.round(enemy.y - camera.y) - 10; // 10px acima do inimigo

    // Fundo da barra (preto)
    ctx.fillStyle = '#000';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Barra de vida (vermelho para baixo, verde para cheio)
    ctx.fillStyle = healthPercentage > 0.5 ? '#0f0' : (healthPercentage > 0.2 ? '#ff0' : '#f00');
    ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
}

function renderEnemyProjectiles() {
    for (const projectile of enemyProjectiles) {
        ctx.drawImage(
            projectile.sprite,
            Math.round(projectile.x - camera.x),
            Math.round(projectile.y - camera.y),
            projectile.width,
            projectile.height
        );
    }
}

function drawEnemyPath(enemy) {
    if (!enemy.path || enemy.path.length === 0) return; // Se não há caminho, não desenha nada

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 0, 0.8)"; // Cor amarela semi-transparente
    ctx.lineWidth = 2;
    ctx.beginPath();

    let startX = enemy.x + enemy.width / 2 - camera.x;
    let startY = enemy.y + enemy.height / 2 - camera.y;

    ctx.moveTo(startX, startY);

    for (let i = 0; i < enemy.path.length; i++) {
        let tileX = enemy.path[i].x * TILE_SIZE + TILE_SIZE / 2 - camera.x;
        let tileY = enemy.path[i].y * TILE_SIZE + TILE_SIZE / 2 - camera.y;
        ctx.lineTo(tileX, tileY);
    }

    ctx.stroke();
    ctx.restore();
}

function renderEnemies() {
    for (const enemy of currentMap.enemies) {
        // if (enemy.type === "chaser") {
        //     drawEnemyPath(enemy); // Desenha a rota do inimigo chaser
        // }
        ctx.drawImage(
            enemy.sprite,
            Math.round(enemy.x - camera.x), // Ajusta para a câmera
            Math.round(enemy.y - camera.y), // Ajusta para a câmera
            enemy.width,
            enemy.height
        );
        drawEnemyHealthBar(enemy);
    }
}

function renderNPCs() {
    for (const npc of currentMap.npcs) {
        ctx.drawImage(
            npc.sprite,
            Math.round(npc.x - camera.x),
            Math.round(npc.y - camera.y),
            npc.width,
            npc.height
        );
    }
}

let currentDialogue = null; // Armazena o diálogo atual

function checkNPCInteraction() {
    for (const npc of currentMap.npcs) {
        let distance = Math.sqrt((player.x - npc.x) ** 2 + (player.y - npc.y) ** 2);
        if (distance < npc.interactionRange) {
            currentDialogue = npc.text; // Exibe o diálogo
            return;
        }
    }
    currentDialogue = null;
    dialogueIndex = 0;
}

function renderDialogue() {
    if (currentDialogue) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(50, canvas.height - 100, canvas.width - 100, 80);
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.fillText(currentDialogue[dialogueIndex], 60, canvas.height - 70);
    }
}

let dialogueIndex = 0;
window.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && currentDialogue) {
        dialogueIndex++;
        if (dialogueIndex >= currentDialogue.length) {
            currentDialogue = null;
            dialogueIndex = 0; // Reset quando terminar
        }
    }
});

function renderItems() {
    for (const item of currentMap.items) {
        ctx.drawImage(item.sprite, item.x - camera.x, item.y - camera.y, item.width, item.height);
    }
}

let itemsWaitingRespawn = [];

// Tempo de respawn dos itens (em milissegundos)
const ITEM_RESPAWN_TIME = 15000; // 15 segundos

// Função para encontrar uma posição válida no mapa
function getRandomValidPosition() {
    let validTiles = [];

    // Percorre o mapa, evitando as bordas
    for (let y = 1; y < currentMap.grid.length - 1; y++) { // Evita bordas superiores e inferiores
        for (let x = 1; x < currentMap.grid[y].length - 1; x++) { // Evita bordas laterais
            if (currentMap.grid[y][x] === '.') { // Tile válido (chão)
                let tileX = x * TILE_SIZE;
                let tileY = y * TILE_SIZE;

                // Verifica se há um espaço seguro ao redor (não pode estar cercado por paredes)
                let isSafe = (
                    currentMap.grid[y - 1][x] === '.' &&  // Cima
                    currentMap.grid[y + 1][x] === '.' &&  // Baixo
                    currentMap.grid[y][x - 1] === '.' &&  // Esquerda
                    currentMap.grid[y][x + 1] === '.' &&  // Direita
                    currentMap.grid[y - 1][x - 1] === '.' &&  // Canto superior esquerdo
                    currentMap.grid[y - 1][x + 1] === '.' &&  // Canto superior direito
                    currentMap.grid[y + 1][x - 1] === '.' &&  // Canto inferior esquerdo
                    currentMap.grid[y + 1][x + 1] === '.'     // Canto inferior direito
                );

                if (isSafe) {
                    validTiles.push({ x: tileX, y: tileY });
                }
            }
        }
    }

    // Escolhe uma posição aleatória entre os tiles válidos
    if (validTiles.length > 0) {
        return validTiles[Math.floor(Math.random() * validTiles.length)];
    }

    return null; // Retorna null se não houver tiles válidos
}

// Função para respawnar itens
function respawnItems() {
    for (let i = itemsWaitingRespawn.length - 1; i >= 0; i--) {
        let item = itemsWaitingRespawn[i];

        // Verifica se o item pertence ao mapa atual
        if (item.mapId === currentMap.id) {
            // Verifica se o tempo de respawn já passou
            if (Date.now() - item.timeCollected >= ITEM_RESPAWN_TIME) {
                // Encontra uma posição válida para o item
                let newPosition = getRandomValidPosition();

                if (newPosition) {
                    // Atualiza a posição do item
                    item.x = newPosition.x;
                    item.y = newPosition.y;

                    // Adiciona o item de volta ao mapa
                    currentMap.items.push(item);

                    // Remove o item da lista de espera
                    itemsWaitingRespawn.splice(i, 1);
                }
            }
        }
    }
}

// Verificar colisão do jogador com os itens
function checkItemCollisions() {
    for (let i = currentMap.items.length - 1; i >= 0; i--) {
        const item = currentMap.items[i];
        if (checkCollision(player, item)) {
            applyItemEffect(item);
            itemsWaitingRespawn.push({
                ...item, // Copia as propriedades do item
                timeCollected: Date.now(), // Marca o tempo em que foi coletado
                mapId: currentMap.id
            });
            currentMap.items.splice(i, 1); // Remove o item do mapa
        }
    }
}

// Aplicar efeito do item
function applyItemEffect(item) {
    if (item.type === 'potion') {
        player.health = Math.min(player.maxHealth, player.health + 20);
        createFloatingText('+20 HP', player.x, player.y, 'green', 1000);
        sounds.potion.currentTime = 0; // Reinicia o som se já estiver tocando
        sounds.potion.play();
    } else if (item.type === 'powerup') {
        player.attackPower += 0.1;
        createFloatingText('Attack UP!', player.x, player.y, 'yellow', 1000);
        sounds.flower.currentTime = 0; // Reinicia o som se já estiver tocando
        sounds.flower.play();
    } else if (item.type === 'teleport') {
        teleportPlayer();
        sounds.teleport.currentTime = 0; // Reinicia o som se já estiver tocando
        sounds.teleport.play();
    }
}

// Teleportar jogador para um local aleatório válido
function teleportPlayer() {
    let validTiles = [];

    for (let y = 1; y < currentMap.grid.length - 1; y++) { // Evita bordas
        for (let x = 1; x < currentMap.grid[y].length - 1; x++) { // Evita bordas laterais
            if (currentMap.grid[y][x] === '.') {
                let tileX = x * TILE_SIZE;
                let tileY = y * TILE_SIZE;

                // Verifica se há um espaço seguro ao redor (não pode estar cercado por paredes)
                let isSafe = (
                    currentMap.grid[y - 1][x] === '.' &&  // Cima
                    currentMap.grid[y + 1][x] === '.' &&  // Baixo
                    currentMap.grid[y][x - 1] === '.' &&  // Esquerda
                    currentMap.grid[y][x + 1] === '.' &&  // Direita
                    currentMap.grid[y - 1][x - 1] === '.' &&  // Canto superior esquerdo
                    currentMap.grid[y - 1][x + 1] === '.' &&  // Canto superior direito
                    currentMap.grid[y + 1][x - 1] === '.' &&  // Canto inferior esquerdo
                    currentMap.grid[y + 1][x + 1] === '.'     // Canto inferior direito
                );

                if (isSafe) {
                    validTiles.push({ x: tileX, y: tileY });
                }
            }
        }
    }

    if (validTiles.length > 0) {
        const randomTile = validTiles[Math.floor(Math.random() * validTiles.length)];
        player.x = randomTile.x;
        player.y = randomTile.y;
    }
}

const DAMAGE_COOLDOWN = 1000;

const player = {
    x: 400,
    y: 300,
    width: 48,
    height: 48,
    speed: 4,
    sprite: new Image(),
    health: 100,
    maxHealth: 100,
    attackPower: 1,
};

player.sprite.src = 'sprites/player.png';

const camera = {
    x: 0,
    y: 0
};

let currentMap = processMap(maps['forest']);

let isCursed = false;  // Se a maldição está ativa
let CURSE_INTERVAL = 60000; // Ativa a maldição a cada 30 segundos (30.000 ms)
const CURSE_DURATION = 15000; // A maldição dura 10 segundos
let curseTimeControl = null;
let curseInterval; // Variável para armazenar o intervalo da maldição

let isCurseTransitioning = false; // Indica se a transição da maldição está em andamento
let starSize = 0; // Tamanho inicial da estrela
const maxStarSize = Math.sqrt(canvas.width ** 2 + canvas.height ** 2); // Tamanho máximo para cobrir a tela
const transitionSpeed = 25; // Velocidade de crescimento da estrela

// Função para desenhar a Estrela de Davi
function drawStarOfDavid(x, y, size) {
    ctx.save();
    ctx.fillStyle = `rgba(17, 24, 39, 0.8)`; // Cor do overlay (preto com transparência)

    // Primeiro triângulo (apontando para cima)
    ctx.beginPath();
    ctx.moveTo(x, y - size); // Topo
    ctx.lineTo(x + size * Math.sqrt(3) / 2, y + size / 2); // Direita
    ctx.lineTo(x - size * Math.sqrt(3) / 2, y + size / 2); // Esquerda
    ctx.closePath();
    ctx.fill();

    // Segundo triângulo (apontando para baixo)
    ctx.beginPath();
    ctx.moveTo(x, y + size); // Base
    ctx.lineTo(x + size * Math.sqrt(3) / 2, y - size / 2); // Direita
    ctx.lineTo(x - size * Math.sqrt(3) / 2, y - size / 2); // Esquerda
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// Função para desenhar o overlay de transição com a Estrela de Davi
function renderCurseTransitionOverlay() {
    if (!isCurseTransitioning) return; // Só desenha se a transição da maldição estiver ativa

    // Desenha a Estrela de Davi no centro da tela
    drawStarOfDavid(canvas.width / 2, canvas.height / 2, starSize);
}

// Função para iniciar a transição da maldição
function startCurseTransition() {
    isCurseTransitioning = true;
    starSize = 0; // Começa com a estrela pequena
}

// Função para atualizar a transição da maldição
function updateCurseTransition() {
    if (!isCurseTransitioning) return;

    // Expande a estrela
    if (starSize < maxStarSize) {
        starSize += transitionSpeed;
    } else {
        isCurseTransitioning = false; // Finaliza a transição quando a estrela cobre a tela
    }
}

function startCurseCycle() {
    if (!curseTimeControl) {
        curseTimeControl = Date.now(); // Apenas define na primeira vez
    }

    curseInterval = setInterval(() => {
        if (gameState === "playing" && !isCursed) {
            activateCurse();
        }
    }, CURSE_INTERVAL - (Date.now() - curseTimeControl)); // Ajusta o intervalo corretamente
}

// Guardamos os tiles normais para restaurá-los depois
let originalTiles = null;
let curseStartTime = 0;
let oldMap = '';

function activateCurse() {
    isCursed = true;
    curseStartTime = Date.now()

    if (currentMusic) {
        currentMusic.pause();
        currentMusic = null;
    }
    sounds.curse.currentTime = 0; // Reinicia o som se já estiver tocando
    sounds.curse.play();

    // Altera os sprites do mapa para a versão amaldiçoada
    currentMap.sprites.ground = 'sprites/tiles/ethereal.png';
    currentMap.sprites.portal = 'sprites/tiles/ethereal.png';
    currentMap.sprites.wall = 'sprites/tiles/flower.png';
    currentMap.sprites.obstacle = 'sprites/tiles/flower.png';
    oldMap = currentMap.id;
    currentMap.id = 'abyss';

    // Recarrega os sprites para aplicar a mudança visual
    loadMapSprites(currentMap).then((newSprites) => {
        currentMapSprites = newSprites;
    });

    console.log("Maldição ativada!");

    startCurseTransition();

    // Desativa a maldição após um tempo
    curseTimer = setTimeout(deactivateCurse, CURSE_DURATION);
}

function deactivateCurse() {
    console.log("🛑 A maldição terminou!");
    isCursed = false;

    originalTiles = JSON.parse(JSON.stringify(originalMaps[oldMap]));

    // Restaura os tiles normais
    if (originalTiles) {
        currentMap.sprites.ground = originalTiles.sprites.ground;
        currentMap.sprites.portal = originalTiles.sprites.portal;
        currentMap.sprites.wall = originalTiles.sprites.wall;
        currentMap.sprites.obstacle = originalTiles.sprites.obstacle;
        currentMap.id = originalTiles.id;
    }

    loadMapSprites(currentMap).then((newSprites) => {
        currentMapSprites = newSprites;
    });

    clearTimeout(curseTimer);
    clearInterval(curseInterval);
    curseStartTime = 0;
    curseTimeControl = 0; // Reseta o controle da maldição
    curseRemainingTime = CURSE_INTERVAL; // Reseta o tempo restante
    startCurseCycle();
    playMapMusic(currentMap);
}

function renderCurseBar() {
    if (!isCursed) return; // Só desenha se a maldição estiver ativa

    const barWidth = 200;
    const barHeight = 20;
    const x = canvas.width / 2 - barWidth / 2;
    const y = 15;

    const elapsedTime = Date.now() - curseStartTime;
    const remainingTime = Math.max(0, CURSE_DURATION - elapsedTime);
    const progress = remainingTime / CURSE_DURATION;

    ctx.fillStyle = "#000"; // Fundo preto para contraste
    ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

    ctx.fillStyle = "#ff0000"; // Cor vermelha da maldição
    ctx.fillRect(x, y, barWidth * progress, barHeight);

    ctx.strokeStyle = "#fff"; // Borda branca para destaque
    ctx.strokeRect(x, y, barWidth, barHeight);
}

function renderCurseTimerBar() {
    if (isCursed) return; // Não exibir quando a maldição está ativa

    const elapsedTime = Date.now() - curseTimeControl;
    const remainingTime = Math.max(0, CURSE_INTERVAL - elapsedTime); 
    const progress = remainingTime / CURSE_INTERVAL;

    const barWidth = 200;
    const barHeight = 20;
    const x = canvas.width / 2 - barWidth / 2;
    const y = canvas.height - 35;

    ctx.fillStyle = "#000";
    ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

    ctx.fillStyle = "#ff0000";
    ctx.fillRect(x, y, barWidth * (1 - progress), barHeight);

    ctx.strokeStyle = "#fff";
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.fillText(`${Math.ceil(remainingTime / 1000)}s`, x + barWidth / 2, y + barHeight - 4);
}

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

const minimap = document.getElementById('minimapCanvas');

window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === 'm') {
        if (minimap.style.display === 'none') {
            minimap.style.display = 'block'; // Exibe o minimapa
        } else {
            minimap.style.display = 'none'; // Esconde o minimapa
        }
    }
    if (isGameOver && event.key === "Enter") {
        restartGame();
        gameState = "playing";
        playMapMusic(maps['forest']);
    }
});

const originalMaps = JSON.parse(JSON.stringify(maps)); 

function resetMap(mapId) {
    // Restaura o mapa a partir da cópia original
    maps[mapId] = JSON.parse(JSON.stringify(originalMaps[mapId]));

    // Recarrega os sprites dos inimigos
    for (let enemy of maps[mapId].enemies) {
        enemy.sprite = new Image();
        enemy.sprite.src = enemy.spriteSrc; // Certifique-se de definir `spriteSrc` corretamente
    }
    for (let npc of maps[mapId].npcs) {
        npc.sprite = new Image();
        npc.sprite.src = npc.spriteSrc; // Certifique-se de definir `spriteSrc` corretamente
    }
    for (let item of maps[mapId].items) {
        item.sprite = new Image();
        item.sprite.src = item.spriteSrc; // Certifique-se de definir `spriteSrc` corretamente
    }
}

function restartGame() {
    isGameOver = false;
    isCursed = false;
    isOwlMode = false;
    curseStartTime = 0;
    curseTimeControl = 0; // Reseta o controle da maldição
    curseRemainingTime = CURSE_INTERVAL; // Reseta o tempo restante
    pauseStartTime = 0;
    totalPausedTime = 0;

    owlModeStartTime = 0;
    owlModeCooldownStartTime = 0;
    owlModeRemainingTime = 0;
    if (owlModeTimeout) {
        clearTimeout(owlModeTimeout);
        owlModeTimeout = null;
    }

    player.sprite.src = 'sprites/player.png'; // Volta ao sprite normal
    player.health = player.maxHealth;
    player.x = 400;
    player.y = 300;
    player.attackPower = 1;

    enemyProjectiles = [];
    areaProjectiles = [];
    medusaProjectiles = [];
    floatingTexts = [];
    defeatedEnemies = [];
    itemsWaitingRespawn = [];

    for (const magic of areaMagics) {
        clearInterval(magic.shootInterval); // Para todos os disparos ativos
    }
    areaMagics = [];
    spells = [];

    minimap.style.display = 'block';
    for (let mapId in maps) {
        resetMap(mapId);
    }

    // Reinicia o efeito de transição
    isTransitioning = false; // Desativa a transição
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridCols; j++) {
            gridAlpha[i][j] = 1; // Reseta a opacidade de todos os quadrados
        }
    }

    clearInterval(curseInterval);
    startCurseCycle();

    // Define o mapa inicial
    currentMap = processMap(maps['forest']);

    loadMapSprites(maps['forest']).then((newSprites) => {
        currentMapSprites = newSprites;
    });
}

let lastMagicTime = 0; // Tempo do último lançamento de magia
const magicCooldown = 500; // Cooldown de 1 segundo (1000 ms)

canvas.addEventListener('click', (event) => {
    const currentTime = Date.now();

    if (currentTime - lastMagicTime >= magicCooldown && gameState !== 'paused' && gameState !== 'start') {
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
    if (currentTime - lastAreaMagicTime >= areaMagicCooldown && gameState !== 'paused' && gameState !== 'start') {
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
        console.log('Magia de área em cooldown ou jogo está pausado!'); // Feedback opcional
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

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
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

        for (let j = currentMap.enemies.length - 1; j >= 0; j--) {
            let enemy = currentMap.enemies[j];
            if (checkCollision(projectile, enemy)) {
                let damage = randomIntFromInterval(5, 13);
                enemy.health -= damage * player.attackPower; // Reduz a vida do inimigo
                createFloatingText(`-${parseInt(damage * player.attackPower)}`, enemy.x + enemy.width / 2, enemy.y, '#ff0000', 1000);
                if (enemy.health <= 0) {
                    defeatedEnemies.push({ enemy: enemy, timeDefeated: Date.now(), mapId: currentMap.id });
                    currentMap.enemies.splice(j, 1); // Remove o inimigo
                }

                areaProjectiles.splice(i, 1); // Remove o projétil após o impacto
                break;
            }
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

        for (let j = currentMap.enemies.length - 1; j >= 0; j--) {
            let enemy = currentMap.enemies[j];
            if (checkCollision(spell, enemy)) {
                let damage = randomIntFromInterval(5, 20);
                enemy.health -= damage * player.attackPower; // Reduz a vida do inimigo ao ser atingido
                createFloatingText(`-${parseInt(damage * player.attackPower)}`, enemy.x + enemy.width / 2, enemy.y, '#ff0000', 1000);
                if (enemy.health <= 0) {
                    defeatedEnemies.push({ enemy: enemy, timeDefeated: Date.now(), mapId: currentMap.id });
                    currentMap.enemies.splice(j, 1); // Remove o inimigo
                }

                spells.splice(i, 1); // Remove a magia após o impacto
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

let isTransitioning = false; // Indica se uma transição está em andamento
const gridSize = 20; // Tamanho de cada quadrado na grade
const gridRows = Math.ceil(canvas.height / gridSize); // Número de linhas na grade
const gridCols = Math.ceil(canvas.width / gridSize); // Número de colunas na grade
let gridAlpha = []; // Armazena a opacidade de cada quadrado
const TRANSITION_DELAY = 10;

// Inicializa a grade com opacidade 1 (totalmente visível)
for (let i = 0; i < gridRows; i++) {
    gridAlpha[i] = [];
    for (let j = 0; j < gridCols; j++) {
        gridAlpha[i][j] = 1; // Todos os quadrados começam totalmente visíveis
    }
}

// Função para desenhar o overlay de transição com grade
function renderTransitionOverlay() {
    if (!isTransitioning) return; // Só desenha se estiver em transição

    ctx.save();
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridCols; j++) {
            if (gridAlpha[i][j] > 0) {
                ctx.fillStyle = `rgba(17, 24, 39, ${gridAlpha[i][j]})`; // Overlay preto com opacidade variável
                ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
            }
        }
    }
    ctx.restore();
}

// Função para iniciar a transição
function startTransition() {
    isTransitioning = true;
    // Reinicia a opacidade da grade
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridCols; j++) {
            gridAlpha[i][j] = 1; // Todos os quadrados começam totalmente visíveis
        }
    }
}

// Função para atualizar a transição
function updateTransition() {
    if (!isTransitioning) return;

    // Diminui a opacidade de cada quadrado aleatoriamente
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridCols; j++) {
            if (gridAlpha[i][j] > 0 && Math.random() < 0.1) {
                gridAlpha[i][j] -= 0.1; // Diminui a opacidade gradualmente
            }
        }
    }

    // Verifica se todos os quadrados desapareceram
    let allInvisible = true;
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridCols; j++) {
            if (gridAlpha[i][j] > 0) {
                allInvisible = false;
                break;
            }
        }
        if (!allInvisible) break;
    }

    // Se todos os quadrados desapareceram, finaliza a transição
    if (allInvisible) {
        isTransitioning = false;
    }
}

let currentMusic = null; // Variável para armazenar a música atual

// Seleciona o controle de volume no HTML
const volumeControl = document.getElementById('volumeControl');

// Função para ajustar o volume de todos os áudios
function setGlobalVolume(volume) {
    for (let key in sounds) {
        if (sounds[key] instanceof Audio) {
            sounds[key].volume = volume;
        }
    }
    if (currentMusic) {
        currentMusic.volume = volume;
    }
}

// Define o volume inicial (opcional)
setGlobalVolume(volumeControl.value);

// Adiciona um evento de escuta para o controle de volume
volumeControl.addEventListener('input', (event) => {
    const volume = parseFloat(event.target.value);
    setGlobalVolume(volume);
    if (currentMusic) {
        currentMusic.volume = volume; // Atualiza o volume da música atual imediatamente
    }
});

function playMapMusic(map) {
    if (currentMusic) {
        currentMusic.pause(); // Pausa a música atual, se houver
    }

    if (map.music) {
        currentMusic = new Audio(map.music); // Cria um novo objeto de áudio com a música do mapa
        currentMusic.loop = true; // Faz a música repetir em loop
        currentMusic.volume = volumeControl.value; // Aplica o volume atual do controle

        // Adiciona um delay antes de iniciar a música
        setTimeout(() => {
            if (currentMusic) { // Verifica se currentMusic ainda existe
                currentMusic.play().then(() => {
                    console.log('Música do mapa iniciada:', map.id);
                }).catch(error => {
                    console.error('Erro ao reproduzir música:', error);
                });
            }
        }, 500); // Delay de 500ms (0.5 segundos)
    }
}

// Modifique a função checkPortals para incluir a transição com grade
function checkPortals() {
    if (isCursed) {
        return; // Bloqueia os portais durante a maldição
    }
    for (const portal of currentMap.portals) {
        if (checkCollision(player, portal)) {
            startTransition(); // Inicia a transição com grade

            // Aguarda um pequeno delay antes de mudar de mapa
            setTimeout(() => {
                loadMapSprites(maps[portal.destinationMap]).then((newSprites) => {
                    currentMap = processMap(maps[portal.destinationMap]);
                    currentMapSprites = newSprites;
                    player.x = portal.destinationX;
                    player.y = portal.destinationY;

                    playMapMusic(currentMap);

                    // Aplica a maldição ao novo mapa, se necessário
                    if (isCursed) {
                        currentMap.sprites.ground = 'sprites/tiles/ethereal.png';
                        currentMap.sprites.portal = 'sprites/tiles/ethereal.png';
                        currentMap.sprites.wall = 'sprites/tiles/flower.png';
                        currentMap.sprites.obstacle = 'sprites/tiles/flower.png';
                        oldMap = currentMap.id;
                        currentMap.id = 'abyss';

                        // Recarrega os sprites para aplicar a mudança visual
                        loadMapSprites(currentMap).then((newSprites) => {
                            currentMapSprites = newSprites;
                        });
                    }

                    // Limpa magias, projéteis, etc.
                    for (const magic of areaMagics) {
                        clearInterval(magic.shootInterval);
                    }
                    areaMagics = [];
                    spells = [];
                    areaProjectiles = [];
                    medusaProjectiles = [];
                    floatingTexts = [];
                });
            }, TRANSITION_DELAY);

            break;
        }
    }
}

let isOwlMode = false; // Indica se o modo coruja está ativo
let owlModeDuration = 10000; // Duração do modo coruja em milissegundos (10 segundos)
let owlModeCooldown = 60000; // Cooldown do modo coruja em milissegundos (60 segundos)
let owlModeStartTime = 0; // Tempo em que o modo coruja foi ativado
let owlModeCooldownStartTime = 0; // Tempo em que o modo coruja entrou em cooldown
let owlModeRemainingTime = 0; // Tempo restante ao pausar
let owlModeTimeout = null; // Guarda o temporizador para cancelamento

window.addEventListener('keydown', (e) => {
    const currentTime = Date.now() - totalPausedTime; // Considera o tempo pausado

    if (e.key.toLowerCase() === 'f' && !isOwlMode && currentTime >= owlModeCooldownStartTime + owlModeCooldown && gameState !== 'paused') {
        activateOwlMode();
        sounds.owl.currentTime = 0; // Reinicia o som se já estiver tocando
        sounds.owl.play();
    }
});

function activateOwlMode() {
    const currentTime = Date.now() - totalPausedTime; // Considera o tempo pausado

    // Verifica se o cooldown já terminou
    if (isOwlMode || currentTime < owlModeCooldownStartTime + owlModeCooldown) {
        return; // Não ativa o modo coruja se ainda estiver em cooldown
    }

    isOwlMode = true;
    owlModeStartTime = Date.now();
    owlModeRemainingTime = owlModeDuration;
    const owlSprite = new Image();
    owlSprite.src = 'sprites/owl.png'; 

    player.sprite = owlSprite; // Muda o sprite para coruja
    player.attackPower *= 1.1; // Aumenta o poder de ataque
    player.speed *= 1.15;

    owlModeTimeout = setTimeout(deactivateOwlMode, owlModeRemainingTime);
}

function deactivateOwlMode() {
    isOwlMode = false;
    owlModeCooldownStartTime = Date.now() - totalPausedTime; // Inicia o cooldown
    player.sprite.src = 'sprites/player.png'; // Volta ao sprite normal
    player.attackPower = 1; // Volta ao poder de ataque normal
    player.speed = 4;
    owlModeTimeout = null;
}

function drawOwlModeCooldownBar() {
    const currentTime = Date.now() - totalPausedTime; // Ajusta o tempo atual para considerar o tempo pausado
    const remainingCooldown = Math.max(0, owlModeCooldownStartTime + owlModeCooldown - currentTime);

    const barWidth = 100;
    const barHeight = 15;
    const barX = 570;
    const barY = 570;

    ctx.save();

    if (remainingCooldown > 0) {
        ctx.fillStyle = '#555';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const progress = remainingCooldown / owlModeCooldown;
        ctx.fillStyle = '#800080';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    // Texto indicando tempo restante
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';

    if (!isOwlMode && remainingCooldown === 0) {
        ctx.font = '22px Arial';
        ctx.fillText("🦉", barX + barWidth / 2, barY + barHeight - 4);
    } else if (remainingCooldown > 0) {
        ctx.font = '10px Arial';
        ctx.fillText(`${Math.ceil(remainingCooldown / 1000)}s`, barX + barWidth / 2, barY + barHeight - 4);
    }

    ctx.restore();
}

function drawOwlModeDurationBar() {
    if (!isOwlMode) return; // Só desenha a barra se o modo coruja estiver ativo

    const currentTime = Date.now();
    const elapsedTime = currentTime - owlModeStartTime; 
    const remainingTime = Math.max(0, owlModeDuration - elapsedTime); // Garante que nunca fique negativo
    const progress = remainingTime / owlModeDuration; // Proporção do tempo restante

    const barWidth = 100; // Largura total da barra
    const barHeight = 15; // Altura da barra
    const barX = 570; // Centraliza horizontalmente
    const barY = 570; // Posição vertical

    ctx.save();

    // Fundo da barra
    ctx.fillStyle = '#222'; // Cor escura para fundo
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Barra de progresso (duração restante)
    ctx.fillStyle = '#800080'; // Roxo indicando o tempo restante
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Borda da barra
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Texto indicando tempo restante
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(remainingTime / 1000)}s`, barX + barWidth / 2, barY + barHeight - 2);

    ctx.restore();
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

    // for (const enemy of currentMap.enemies) {
    //     if (enemy.type === "chaser") {
    //         drawAggroArea(enemy);
    //     } else if (enemy.type === "shooter") {
    //         drawAggroArea(enemy, 'rgba(0, 0, 255, 0.2)', 300);
    //     } else if (enemy.type === "patrol") {
    //         drawAggroArea(enemy, 'rgba(0, 255, 0, 0.2)', 400);
    //     }
    // }

    ctx.restore();

    // Draw current map name
    ctx.fillStyle = '#111827';
    ctx.font = '20px Arial';
    ctx.fillText(`Map: ${currentMap.id}`, 15, 30);

    drawCooldownBar();
    drawAreaMagicCooldownBar();
    drawMinimap();
    drawOwlModeCooldownBar();
    drawOwlModeDurationBar();
}

function gameLoop(timestamp) {
    if (gameState === "start") {
        renderStartScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === "paused") {
        renderPauseMenu();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (isGameOver) {
        renderGameOverScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Atualiza o tempo do jogo
    updateTime(deltaTime);

    updatePlayer();
    updateSpells();
    updateAreaMagics();
    updateAreaProjectiles();
    updateEnemyProjectiles();
    updateEnemies();
    updateMedusaProjectiles();
    updateFloatingTexts();
    updateDefeatedEnemies();
    respawnItems(); 
    updateTransition();
    updateCurseTransition();

    render();
    renderAreaMagics();
    renderAreaProjectiles();
    renderEnemies();
    renderNPCs();
    renderItems();
    renderEnemyProjectiles();
    renderPlayerHealthBar();
    renderMedusaProjectiles();
    renderFloatingTexts();
    renderCurseBar();
    renderCurseTimerBar();
    renderCircularClock();
    renderTransitionOverlay();
    renderCurseTransitionOverlay();

    if (isOwlMode && Date.now() - owlModeStartTime >= owlModeDuration) {
        deactivateOwlMode();
    }

    checkItemCollisions();
    checkNPCInteraction();
    renderDialogue();
    renderDayNightCycle();
    renderTimeIndicator();

    requestAnimationFrame(gameLoop);
}

// Start the game
let currentMapSprites;

// Função assíncrona para carregar as sprites e iniciar o jogo
async function initializeGame() {
    currentMapSprites = await loadMapSprites(maps['forest']); // Aguarda o carregamento das sprites
    requestAnimationFrame(gameLoop);
}

// Inicializa o jogo
initializeGame();

// Seleciona o canvas e os controles
const gameCanvas = document.getElementById('gameCanvas');
const brightnessControl = document.getElementById('brightnessControl');
const contrastControl = document.getElementById('contrastControl');
const saturationControl = document.getElementById('saturationControl');

// Função para atualizar os filtros do canvas
function updateCanvasFilters() {
    const brightness = brightnessControl.value;
    const contrast = contrastControl.value;
    const saturation = saturationControl.value;

    // Aplica os filtros ao canvas
    gameCanvas.style.filter = `
        brightness(${brightness})
        contrast(${contrast})
        saturate(${saturation})
    `;
}

// Adiciona eventos de escuta para os controles
brightnessControl.addEventListener('input', updateCanvasFilters);
contrastControl.addEventListener('input', updateCanvasFilters);
saturationControl.addEventListener('input', updateCanvasFilters);