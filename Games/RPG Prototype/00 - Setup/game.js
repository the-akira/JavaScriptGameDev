const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE_SIZE = 32;

// Game maps
const maps = {
    'town': {
        id: 'town',
        tileSize: TILE_SIZE,
        backgroundColor: '#35732a',
        borderColor: '#27541f',
        grid: [
            "#######################################################",
            "#.....................................................#",
            "#....X.............................X..................#",
            "#....................X.............X.........XXX......#",
            "#.......XX...........X.............X.........XXX......#",
            "#........X...........XX...............................#",
            "#........X............X...............................#",
            "#...................XXX...............................#",
            "#...................................XXX...............#",
            "#.....................................................#",
            "#.....................................................#",
            "#............................................XXX......#",
            "#............................................XXX......#",
            "#.......XXXXXXXX......................................#",
            "#.....................................................#",
            "#.....................................................#",
            "#...........................XXXXXXXXXXX...............#",
            "#...........................XX........................#",
            "#......XXXXXX...............XX........................#",
            "#......XXXXXX...............XX............XXXXX.......#",
            "#.........................................XXXXX.......#",
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
                destinationMap: 'forest',
                destinationX: 2 * TILE_SIZE,
                destinationY: 5 * TILE_SIZE
            },
        ]
    },
    'forest': {
        id: 'forest',
        tileSize: TILE_SIZE,
        backgroundColor: '#1a4d1a',
        borderColor: '#0d2d0d',
        grid: [
            "#############################################",
            "#...........................................#",
            "#...........................................#",
            "#....XXX....................................#",
            "#..................XXXX.....................#",
            "#.................................X.........#",
            "#.................................X.........#",
            "#.................................X.........#",
            "#...........XXXXX..............XXXX.........#",
            "#...............X..............X............#",
            "#...............X..............X............#",
            "#...........XXXXX..........XXXXX............#",
            "#..........XX...............................#",
            "#..........X................................#",
            "#..........X...............XXXXXXXXX........#",
            "#...........................................#",
            "#...........................................#",
            "#..................................XX.......#",
            "#..................................XX.......#",
            "#..........XXXXXXXXXXX..............X.......#",
            "#....................XXXXXXX................#",
            "#...........................................#",
            "#...........................................#",
            "#...........................................#",
            "#......XX............XXXXXXX................#",
            "#......XX.............XXXXX.................#",
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
                destinationMap: 'town',
                destinationX: 3 * TILE_SIZE,
                destinationY: 3 * TILE_SIZE
            },
            {
                x: 7 * TILE_SIZE,
                y: 12 * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                destinationMap: 'forest',
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

// Game state
const player = {
    x: 400,
    y: 300,
    width: 32,
    height: 32,
    speed: 4,
    color: '#e63946'
};

const camera = {
    x: 0,
    y: 0
};

let currentMap = processMap(maps['town']);

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
            currentMap = processMap(maps[portal.destinationMap]);
            player.x = portal.destinationX;
            player.y = portal.destinationY;
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

            // Draw tile based on grid content
            if (cell === '#') { // Parede
                ctx.fillStyle = '#2d1810';
                ctx.fillRect(tileX, tileY, currentMap.tileSize, currentMap.tileSize);
            } else if (cell === 'X') { // Obstáculo
                ctx.fillStyle = '#4a3425';
                ctx.fillRect(tileX, tileY, currentMap.tileSize, currentMap.tileSize);
            } else { // Chão
                ctx.strokeStyle = currentMap.borderColor;
                ctx.strokeRect(tileX, tileY, currentMap.tileSize, currentMap.tileSize);
            }
        }
    }

    // Draw portals
    for (const portal of currentMap.portals) {
        ctx.fillStyle = '#4287f5';
        ctx.fillRect(
            Math.round(portal.x),
            Math.round(portal.y),
            portal.width,
            portal.height
        );
    }

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(Math.round(player.x), Math.round(player.y), player.width, player.height);
    ctx.restore();

    // Draw current map name
    ctx.fillStyle = '#d1d8e6';
    ctx.font = '20px Arial';
    ctx.fillText(`Map: ${currentMap.id}`, 15, 30);
}

function gameLoop() {
    updatePlayer();
    render();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();