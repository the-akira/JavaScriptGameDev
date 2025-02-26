const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');
const TILE_SIZE = 32;
let isGameOver = false;

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
        enemies: mapData.enemies,
        npcs: mapData.npcs,
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
                    let damage = randomIntFromInterval(5, 15);
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
            let damage = randomIntFromInterval(2, 20);
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
            let damage = randomIntFromInterval(10, 30);
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

function renderPlayerHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 565;

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

function renderEnemies() {
    for (const enemy of currentMap.enemies) {
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
}

function restartGame() {
    isGameOver = false;
    player.health = player.maxHealth;
    player.x = 400;
    player.y = 300;
    enemyProjectiles = [];
    areaProjectiles = [];
    medusaProjectiles = [];
    floatingTexts = [];
    for (const magic of areaMagics) {
        clearInterval(magic.shootInterval); // Para todos os disparos ativos
    }
    areaMagics = [];
    spells = [];
    minimap.style.display = 'block';
    for (let mapId in maps) {
        resetMap(mapId);
    }

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
            x: player.x + player.width / 2, // Inicia do centro do player
            y: player.y + player.height / 2,
            width: 24,
            height: 24,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            sprite: new Image()
        });
        spells[spells.length - 1].sprite.src = 'sprites/spells/spell.png'; // Define o sprite da magia
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
                enemy.health -= damage; // Reduz a vida do inimigo
                createFloatingText(`-${damage}`, enemy.x + enemy.width / 2, enemy.y, '#ff0000', 1000);
                if (enemy.health <= 0) {
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
                enemy.health -= damage; // Reduz a vida do inimigo ao ser atingido
                createFloatingText(`-${damage}`, enemy.x + enemy.width / 2, enemy.y, '#ff0000', 1000);
                if (enemy.health <= 0) {
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
                medusaProjectiles = [];
                floatingTexts = [];
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
}

function gameLoop() {
    if (isGameOver) {
        renderGameOverScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    updatePlayer();
    updateSpells();
    updateAreaMagics();
    updateAreaProjectiles();
    updateEnemyProjectiles();
    updateEnemies();
    updateMedusaProjectiles();
    updateFloatingTexts();

    render();
    renderAreaMagics();
    renderAreaProjectiles();
    renderEnemies();
    renderNPCs();
    renderEnemyProjectiles();
    renderPlayerHealthBar();
    renderMedusaProjectiles();
    renderFloatingTexts();

    checkNPCInteraction();
    renderDialogue();

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