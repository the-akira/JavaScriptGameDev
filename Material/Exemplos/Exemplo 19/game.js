// Configurações do jogo
const GRID_SIZE = 40;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
let enemyMoveTimeouts = [];

// Elementos do DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const heroHPElement = document.getElementById('heroHP');
const heroHPBar = document.getElementById('heroHPBar');
const heroPosElement = document.getElementById('heroPos');
const currentMapElement = document.getElementById('currentMap');
const enemyCountElement = document.getElementById('enemyCount');
const portalCountElement = document.getElementById('portalCount');
const movesLeftElement = document.getElementById('movesLeft');
const rollDiceBtn = document.getElementById('rollDiceBtn');
const combatActions = document.getElementById('combatActions');
const attackBtn = document.getElementById('attackBtn');
const defendBtn = document.getElementById('defendBtn');
const fleeBtn = document.getElementById('fleeBtn');

// Estado do jogo
const gameState = {
    heroes: [
        {
            id: 0,
            name: "Guerreiro",
            x: 5,
            y: 5,
            hp: 100,
            maxHp: 100,
            color: '#3498db',
            size: GRID_SIZE - 4,
            attack: 15,
            defense: 5,
            isDefending: false,
            inCombat: false,
            combatWith: null
        },
        {
            id: 1,
            name: "Mago",
            x: 6,
            y: 5,
            hp: 70,
            maxHp: 70,
            color: '#9b59b6',
            size: GRID_SIZE - 4,
            attack: 20,
            defense: 3,
            isDefending: false,
            inCombat: false,
            combatWith: null
        },
        {
            id: 2,
            name: "Arqueiro",
            x: 5,
            y: 6,
            hp: 85,
            maxHp: 85,
            color: '#2ecc71',
            size: GRID_SIZE - 4,
            attack: 18,
            defense: 4,
            isDefending: false,
            inCombat: false,
            combatWith: null
        }
    ],
    maps: [
        {
            layout: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            ],
            enemies: [
                { x: 1, y: 1, hp: 50, maxHp: 50, attack: 10, defense: 3, name: 'Goblin', color: '#e74c3c', size: GRID_SIZE - 4, visionRange: 5, inCombat: false, combatWith: null },
                { x: 10, y: 9, hp: 60, maxHp: 60, attack: 12, defense: 4, name: 'Orc', color: '#e67e22', size: GRID_SIZE - 4, visionRange: 7, inCombat: false, combatWith: null },
                { x: 1, y: 6, hp: 35, maxHp: 35, attack: 10, defense: 3, name: 'Kobold', color: '#959912', size: GRID_SIZE - 4, visionRange: 5, inCombat: false, combatWith: null },
            ],
            portals: [
                { x: 8, y: 1, destination: 1 }
            ]
        },
        {
            layout: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
            ],
            enemies: [
                { x: 13, y: 11, hp: 80, maxHp: 80, attack: 15, defense: 5, name: 'Esqueleto', color: '#bdc3c7', size: GRID_SIZE - 4, visionRange: 10, inCombat: false, combatWith: null }
            ],
            portals: [
                { x: 1, y: 5, destination: 0 },
                { x: 8, y: 3, destination: 2 }
            ]
        },
        {
            layout: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
            ],
            enemies: [
                { x: 5, y: 5, hp: 100, maxHp: 100, attack: 20, defense: 6, name: 'Dragão', color: '#c0392b', size: GRID_SIZE - 4, visionRange: 12, inCombat: false, combatWith: null }
            ],
            portals: [
                { x: 1, y: 1, destination: 1 }
            ]
        }
    ],
    currentMap: 0,
    currentHeroIndex: 0, // Índice do herói ativo no turno atual
    movesLeft: 0, // Movimentos restantes no turno atual
    isPlayerTurn: true, // Indica se é o turno do jogador
    isGameOver: false 
};

const camera = {
    x: 0,
    y: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    speed: 20 // Velocidade ao mover com o teclado
};

let GRID_COLS = gameState.maps[gameState.currentMap].layout[0].length;
let GRID_ROWS = gameState.maps[gameState.currentMap].layout.length;

let followHero = false;
let currentMovingEnemy = null; // Armazena o inimigo atualmente em movimento
let currentAttackingEnemy = null; 

function updateCamera() {
    const hero = gameState.heroes[gameState.currentHeroIndex];

    if (followHero) {
        // Centralizar a câmera no herói
        camera.x = hero.x * GRID_SIZE - camera.width / 2 + GRID_SIZE / 2;
        camera.y = hero.y * GRID_SIZE - camera.height / 2 + GRID_SIZE / 2;

        // Garantir que a câmera não saia dos limites do mapa
        camera.x = Math.max(0, Math.min(camera.x, GRID_COLS * GRID_SIZE - camera.width));
        camera.y = Math.max(0, Math.min(camera.y, GRID_ROWS * GRID_SIZE - camera.height));
    }
}

document.addEventListener('keydown', (event) => {
    let moved = false;

    switch (event.key) {
        case 'w': 
            camera.y -= camera.speed; 
            moved = true; 
            break;
        case 's': 
            camera.y += camera.speed; 
            moved = true; 
            break;
        case 'a': 
            camera.x -= camera.speed; 
            moved = true; 
            break;
        case 'd': 
            camera.x += camera.speed; 
            moved = true; 
            break;
    }

    // Garantir que a câmera não saia dos limites do mapa
    const currentMap = gameState.maps[gameState.currentMap];
    const mapWidth = currentMap.layout[0].length * GRID_SIZE;
    const mapHeight = currentMap.layout.length * GRID_SIZE;

    camera.x = Math.max(0, Math.min(camera.x, mapWidth - camera.width));
    camera.y = Math.max(0, Math.min(camera.y, mapHeight - camera.height));

    if (moved) {
        drawMap();
        drawPortals();
        drawEnemies();
        drawHeroes();
    }
});

// Inicializar o jogo
function initGame() {
    // Atualizar contagem de inimigos
    updateEnemyCount();
    updatePortalCount();
    
    // Adicionar listeners de teclado
    document.addEventListener('keydown', handleKeyDown);
    rollDiceBtn.addEventListener('click', rollDice);
    
    // Iniciar loop do jogo
    gameLoop();
    
    // Adicionar primeira mensagem
    addLogMessage("Explore o mapa e derrote todos os inimigos!", "system");
    addLogMessage(`O turno de ${gameState.heroes[gameState.currentHeroIndex].name} iniciou, role o dado para se mover!`, "system");
}

// Função para desenhar o campo de visão dos inimigos (quadrado)
function drawEnemyVision() {
    const currentMap = gameState.maps[gameState.currentMap];

    currentMap.enemies.forEach((enemy) => {
        if (enemy.visionRange > 0 && !enemy.inCombat) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'; // Cor semi-transparente para o campo de visão

            // Calcular os limites do campo de visão
            const startX = Math.max(0, enemy.x - enemy.visionRange);
            const startY = Math.max(0, enemy.y - enemy.visionRange);
            const endX = Math.min(GRID_COLS - 1, enemy.x + enemy.visionRange);
            const endY = Math.min(GRID_ROWS - 1, enemy.y + enemy.visionRange);

            // Desenhar o campo de visão
            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    // Verificar se a posição está dentro do alcance do inimigo (quadrado)
                    if (Math.abs(x - enemy.x) <= enemy.visionRange && Math.abs(y - enemy.y) <= enemy.visionRange) {
                        ctx.fillRect(
                            x * GRID_SIZE - camera.x,
                            y * GRID_SIZE - camera.y,
                            GRID_SIZE,
                            GRID_SIZE
                        );
                    }
                }
            }
        }
    });
}

// Loop principal do jogo
function gameLoop() {
    // Limpar a tela
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    updateCamera();
    
    // Desenhar o mapa atual
    drawMap();
    
    // Desenhar portais
    drawPortals();
    
    // Desenhar inimigos do mapa atual
    drawEnemies();
    drawEnemyVision()
    
    // Desenhar o herói (se não estiver em combate)
    drawHeroes();
    
    // Atualizar informações
    updateGameInfo();
    
    // Continuar o loop
    requestAnimationFrame(gameLoop);
}

// Função para atualizar a interface dos heróis
function updateHeroesInfo() {
    const heroesInfoContainer = document.getElementById('heroesInfo');
    heroesInfoContainer.innerHTML = '';
    
    // Filtrar apenas heróis vivos
    const aliveHeroes = gameState.heroes.filter(hero => hero.hp > 0);
    
    if (aliveHeroes.length === 0 && !gameState.isGameOver) {
        addLogMessage("Todos os heróis foram derrotados!", "system");
        gameOver();
        return;
    }
    
    // Atualizar as informações de cada herói
    aliveHeroes.forEach((hero, index) => {
        const heroDiv = document.createElement('div');
        
        // Aplicar classes CSS baseadas no estado do herói
        let heroClasses = 'hero-info';
        if (index === gameState.currentHeroIndex && gameState.isPlayerTurn) {
            heroClasses += ' active';
        }
        if (hero.inCombat) {
            heroClasses += ' in-combat';
        }
        
        heroDiv.className = heroClasses;
        heroDiv.dataset.heroIndex = index;
        
        const nameElem = document.createElement('h4');
        nameElem.textContent = hero.name;
        nameElem.style.margin = '0 0 5px 0';
        
        const hpElem = document.createElement('p');
        hpElem.textContent = `HP: ${hero.hp}/${hero.maxHp}`;
        hpElem.style.margin = '5px 0';
        
        const hpBarContainer = document.createElement('div');
        hpBarContainer.className = 'hero-hp';
        
        const hpBar = document.createElement('div');
        hpBar.className = 'hero-hp-fill';
        hpBar.style.width = `${(hero.hp / hero.maxHp) * 100}%`;
        
        hpBarContainer.appendChild(hpBar);
        
        heroDiv.appendChild(nameElem);
        heroDiv.appendChild(hpElem);
        heroDiv.appendChild(hpBarContainer);
        
        heroesInfoContainer.appendChild(heroDiv);
    });
    
    // Atualizar o nome do herói atual na interface
    const currentHero = gameState.heroes[gameState.currentHeroIndex];
    if (currentHero) {
        document.getElementById('currentHero').textContent = currentHero.name;
    } else {
        // Se não houver herói atual, definir como "Nenhum"
        document.getElementById('currentHero').textContent = "Nenhum";
    }
}

// Desenhar o mapa
function drawMap() {
    const currentMap = gameState.maps[gameState.currentMap];
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            const screenX = x * GRID_SIZE - camera.x;
            const screenY = y * GRID_SIZE - camera.y;

            if (screenX + GRID_SIZE >= 0 && screenX < CANVAS_WIDTH && screenY + GRID_SIZE >= 0 && screenY < CANVAS_HEIGHT) {
                ctx.fillStyle = currentMap.layout[y][x] === 1 ? '#555' : '#111';
                ctx.fillRect(screenX, screenY, GRID_SIZE, GRID_SIZE);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.strokeRect(screenX, screenY, GRID_SIZE, GRID_SIZE);
            }
        }
    }
}

// Desenhar portais
function drawPortals() {
    const currentMap = gameState.maps[gameState.currentMap];
    currentMap.portals.forEach(portal => {
        ctx.beginPath();
        const screenX = portal.x * GRID_SIZE + GRID_SIZE / 2 - camera.x;
        const screenY = portal.y * GRID_SIZE + GRID_SIZE / 2 - camera.y;

        ctx.arc(screenX, screenY, GRID_SIZE / 2 - 4, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(screenX, screenY, 2, screenX, screenY, GRID_SIZE / 2 - 4);
        gradient.addColorStop(0, '#9b59b6');
        gradient.addColorStop(1, '#8e44ad');

        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.shadowColor = '#9b59b6';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

// Desenhar os heróis
function drawHeroes() {
    gameState.heroes.forEach((hero, index) => {
        const screenX = hero.x * GRID_SIZE - camera.x;
        const screenY = hero.y * GRID_SIZE - camera.y;

        ctx.fillStyle = hero.color;
        ctx.fillRect(screenX + 2, screenY + 2, hero.size, hero.size);

        if (index === gameState.currentHeroIndex && gameState.isPlayerTurn) {
            ctx.strokeStyle = 'gold';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, GRID_SIZE, GRID_SIZE);
        }

        // Destaque para herói em combate
        if (hero.inCombat) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, GRID_SIZE, GRID_SIZE);
        }

        // Destaque para herói em combate
        if (hero.inCombat && index === gameState.currentHeroIndex && gameState.isPlayerTurn) {
            ctx.strokeStyle = 'gold';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, GRID_SIZE, GRID_SIZE);
        }
    });
}

// Desenhar inimigos
function drawEnemies() {
    const currentMap = gameState.maps[gameState.currentMap];
    currentMap.enemies.forEach((enemy) => {
        const screenX = enemy.x * GRID_SIZE - camera.x;
        const screenY = enemy.y * GRID_SIZE - camera.y;

        // Desenha o inimigo base
        ctx.fillStyle = enemy.color;
        ctx.fillRect(screenX + 2, screenY + 2, enemy.size, enemy.size);

        // Ordem de prioridade dos destaques:
        if (enemy === currentAttackingEnemy) {
            // 1. Destaque de ataque (vermelho brilhante)
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(screenX, screenY, GRID_SIZE, GRID_SIZE);
            
            // Efeito de brilho
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(screenX, screenY, GRID_SIZE, GRID_SIZE);
            ctx.shadowBlur = 0;
        } 
        else if (enemy === currentMovingEnemy) {
            // 2. Destaque de movimento (amarelo)
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, GRID_SIZE, GRID_SIZE);
        }
        else if (enemy.inCombat) {
            // 3. Destaque de combate normal (vermelho)
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, GRID_SIZE, GRID_SIZE);
        }
    });
}

// Atualizar informações na interface
function updateGameInfo() {
    const currentHero = gameState.heroes[gameState.currentHeroIndex];
    
    // Verificar se o herói atual ainda existe
    if (currentHero) {
        heroPosElement.textContent = `${currentHero.x},${currentHero.y}`;
        currentMapElement.textContent = gameState.currentMap + 1;
        movesLeftElement.textContent = gameState.movesLeft;
        
        // Atualizar as informações de todos os heróis
        updateHeroesInfo();
    } else {
        // Se o herói atual não existe, passar para o próximo herói
        nextPlayerTurn();
    }
}

// Atualizar contagem de inimigos
function updateEnemyCount() {
    const currentMap = gameState.maps[gameState.currentMap];
    enemyCountElement.textContent = currentMap.enemies.length;
}

function updatePortalCount() {
    const currentMap = gameState.maps[gameState.currentMap];
    portalCountElement.textContent = currentMap.portals.length;
}

// Verificar se o herói está em um portal
function checkPortals() {
    const currentMap = gameState.maps[gameState.currentMap]; // Acessa o mapa atual

    // Verificar todos os heróis
    gameState.heroes.forEach(hero => {
        const portal = currentMap.portals.find( // Acessa os portais do mapa atual
            p => p.x === hero.x && p.y === hero.y
        );

        if (portal) {
            changeMap(portal.destination, hero);
        }
    });
}

// Mudar de mapa
function changeMap(mapIndex) {
    const currentMap = gameState.maps[gameState.currentMap];
    
    // 1. Fazer todos os heróis saírem de combate antes de teleportar
    gameState.heroes.forEach(hero => {
        if (hero.inCombat) {
            hero.inCombat = false;
            if (hero.combatWith) {
                const enemy = hero.combatWith;
                if (Array.isArray(enemy.combatWith)) {
                    enemy.combatWith = enemy.combatWith.filter(h => h !== hero);
                    if (enemy.combatWith.length === 0) {
                        enemy.inCombat = false;
                        enemy.combatWith = null;
                    }
                } else if (enemy.combatWith === hero) {
                    enemy.inCombat = false;
                    enemy.combatWith = null;
                }
            }
            hero.combatWith = null;
        }
    });

    // 2. Fazer todos os inimigos do mapa atual saírem de combate
    currentMap.enemies.forEach(enemy => {
        enemy.inCombat = false;
        enemy.combatWith = null;
    });

    addLogMessage(`Você entrou no portal para o mapa ${mapIndex + 1}!`, "system");
    gameState.currentMap = mapIndex;

    GRID_COLS = gameState.maps[mapIndex].layout[0].length;
    GRID_ROWS = gameState.maps[mapIndex].layout.length;

    // Restante do código existente para posicionar os heróis no novo mapa...
    const newMap = gameState.maps[gameState.currentMap];
    const occupiedPositions = new Set(); // Armazenar posições já ocupadas

    gameState.heroes.forEach(hero => {
        let safePosition = false;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!safePosition && attempts < maxAttempts) {
            attempts++;
            const x = Math.floor(Math.random() * (GRID_COLS - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_ROWS - 2)) + 1;
            const positionKey = `${x},${y}`;

            // Verificar se a posição está livre e não está ocupada por outro herói
            if (newMap.layout[y][x] === 0 &&
                !newMap.enemies.some(enemy => enemy.x === x && enemy.y === y) &&
                !isAdjacentToEnemy(x, y) &&
                !occupiedPositions.has(positionKey)) {
                
                hero.x = x;
                hero.y = y;
                safePosition = true;
                occupiedPositions.add(positionKey); // Marcar posição como ocupada
            }
        }
        
        if (!safePosition) {
            // Busca exaustiva por uma posição segura
            for (let y = 1; y < GRID_ROWS - 1 && !safePosition; y++) {
                for (let x = 1; x < GRID_COLS - 1 && !safePosition; x++) {
                    const positionKey = `${x},${y}`;
                    if (newMap.layout[y][x] === 0 &&
                        !newMap.enemies.some(enemy => enemy.x === x && enemy.y === y) &&
                        !occupiedPositions.has(positionKey)) {
                        
                        hero.x = x;
                        hero.y = y;
                        safePosition = true;
                        occupiedPositions.add(positionKey);
                    }
                }
            }
        }
    });

    updateEnemyCount();
    updatePortalCount();
    
    // Esconder ações de combate após a troca de mapa
    hideCombatActions();
}

// Função auxiliar para verificar se uma posição está adjacente a inimigos
function isAdjacentToEnemy(x, y) {
    const currentMap = gameState.maps[gameState.currentMap];
    return currentMap.enemies.some(enemy => {
        const dx = Math.abs(x - enemy.x);
        const dy = Math.abs(y - enemy.y);
        return (dx <= 1 && dy <= 1); // Adjacente (incluindo diagonais)
    });
}

function nextPlayerTurn() {
    // Encontrar o próximo herói vivo
    const nextHeroIndex = gameState.heroes.findIndex(h => h.hp > 0);

    if (nextHeroIndex === -1) {
        // Se não houver mais heróis vivos, o jogo termina
        gameOver();
    } else {
        // Passar o turno para o próximo herói
        gameState.currentHeroIndex = nextHeroIndex;
        startPlayerTurn();
    }
}

// Game over
function gameOver() {
    drawFinalState();

    if (gameState.isGameOver) {
        return;
    }

    gameState.isGameOver = true;
    addLogMessage("GAME OVER!", "system");
    addLogMessage("Recarregue a página para jogar novamente.", "system");
    
    // Desativar controles
    document.removeEventListener('keydown', handleKeyDown);
    
    // Esconder botões de combate
    combatActions.style.display = "none";
    
    // Limpar todos os timeouts de movimento de inimigos
    enemyMoveTimeouts.forEach(timeout => clearTimeout(timeout));
    enemyMoveTimeouts = [];

    clearEnemyPath();
    
    // Limpar o estado de combate de todos os inimigos
    const currentMap = gameState.maps[gameState.currentMap];
    currentMap.enemies.forEach(enemy => {
        enemy.inCombat = false;
        enemy.combatWith = null;
    });
}

function drawFinalState() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Adiciona um overlay escuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Mensagem de GAME OVER
    ctx.fillStyle = 'red';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Recarregue a página para jogar novamente', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

// Verificar combate adjacente
function checkAdjacentCombat() {
    const currentHero = gameState.heroes[gameState.currentHeroIndex];
    const currentMap = gameState.maps[gameState.currentMap];
    
    // Verificar se o herói já está em combate
    if (currentHero.inCombat) return;
    
    // Verificar inimigos adjacentes
    const adjacentEnemies = currentMap.enemies.filter(enemy => {
        const dx = Math.abs(enemy.x - currentHero.x);
        const dy = Math.abs(enemy.y - currentHero.y);
        return (dx <= 1 && dy <= 1) && (dx + dy > 0); // Adjacente mas não na mesma posição
    });
    
    if (adjacentEnemies.length > 0) {
        // Iniciar combate com todos os inimigos adjacentes
        adjacentEnemies.forEach(enemy => {
            startCombat(currentHero, enemy);
        });
    }
}

// Iniciar combate
function startCombat(hero, enemy) {
    hero.inCombat = true;
    
    // Se o inimigo já está em combate com outro herói, adicionar este herói à lista
    if (enemy.combatWith) {
        if (!Array.isArray(enemy.combatWith)) {
            // Se não for array, converter para array com o herói existente
            enemy.combatWith = [enemy.combatWith];
        }
        // Adicionar o novo herói ao combate
        enemy.combatWith.push(hero);
    } else {
        // Se é o primeiro herói, definir como referência direta
        enemy.combatWith = hero;
    }
    
    enemy.inCombat = true;
    hero.combatWith = enemy;
    
    addLogMessage(`${hero.name} entrou em combate com ${enemy.name}!`, "system");
    
    // Mostrar ações de combate se for o turno do jogador
    if (gameState.isPlayerTurn && gameState.heroes[gameState.currentHeroIndex] === hero) {
        showCombatActions();
    }
}

// Finalizar combate
function endCombat(hero, enemy) {
    // Se um herói foi derrotado ou fugiu
    if (hero) {
        // Verificar se o herói foi derrotado
        if (hero.hp <= 0) {
            const heroIndex = gameState.heroes.indexOf(hero);
            if (heroIndex !== -1) {
                addLogMessage(`${hero.name} foi derrotado!`, "system");
                
                // Remover o herói do array
                gameState.heroes.splice(heroIndex, 1);
                
                // Atualizar a interface
                updateHeroesInfo();
                
                // Verificar se o herói derrotado era o atual
                if (gameState.currentHeroIndex === heroIndex) {
                    // Se não houver mais heróis, game over
                    if (gameState.heroes.length === 0) {
                        gameOver();
                        return;
                    }
                    // Ajustar o índice do herói atual
                    gameState.currentHeroIndex = Math.min(gameState.currentHeroIndex, gameState.heroes.length - 1);
                } else if (gameState.currentHeroIndex > heroIndex) {
                    // Ajustar o índice se o herói removido estava antes do atual
                    gameState.currentHeroIndex--;
                }
                
                // Verificar todos os inimigos que estavam em combate com este herói
                const currentMap = gameState.maps[gameState.currentMap];
                currentMap.enemies.forEach(e => {
                    if (e.inCombat && e.combatWith) {
                        // Se era um array de heróis, remover este herói
                        if (Array.isArray(e.combatWith)) {
                            e.combatWith = e.combatWith.filter(h => h !== hero);
                            if (e.combatWith.length === 0) {
                                // Verificar se ainda está adjacente a algum herói vivo
                                const isAdjacent = gameState.heroes.some(h => {
                                    const dx = Math.abs(h.x - e.x);
                                    const dy = Math.abs(h.y - e.y);
                                    return (dx <= 1 && dy <= 1) && (dx + dy > 0);
                                });
                                
                                if (!isAdjacent) {
                                    e.inCombat = false;
                                    e.combatWith = null;
                                }
                            }
                        } else if (e.combatWith === hero) {
                            // Verificar se ainda está adjacente a algum herói vivo
                            const isAdjacent = gameState.heroes.some(h => {
                                const dx = Math.abs(h.x - e.x);
                                const dy = Math.abs(h.y - e.y);
                                return (dx <= 1 && dy <= 1) && (dx + dy > 0);
                            });
                            
                            if (!isAdjacent) {
                                e.inCombat = false;
                                e.combatWith = null;
                            }
                        }
                    }
                });
            }
            // Não chamar nextPlayerTurn() aqui - deixar o turno dos inimigos continuar
            return; // Não continuar se o herói foi derrotado
        }
    }

    // Restante da função permanece o mesmo...
    // Lidar com o estado do inimigo
    if (enemy) {
        if (enemy.combatWith) {
            if (Array.isArray(enemy.combatWith)) {
                enemy.combatWith = enemy.combatWith.filter(h => h !== hero);
                if (enemy.combatWith.length === 1) {
                    enemy.combatWith = enemy.combatWith[0]; // Converter de volta para referência direta se só restar um
                } else if (enemy.combatWith.length === 0) {
                    enemy.combatWith = null;
                }
            } else if (enemy.combatWith === hero) {
                enemy.combatWith = null;
            }
        }

        // Verificar se o inimigo foi derrotado
        if (enemy.hp <= 0) {
            enemy.hp = 0; // Garantir que HP não fique negativo
            const currentMap = gameState.maps[gameState.currentMap];
            const enemyIndex = currentMap.enemies.indexOf(enemy);
            if (enemyIndex !== -1) {
                currentMap.enemies.splice(enemyIndex, 1);
                addLogMessage(`${enemy.name} foi derrotado!`, "system");
                updateEnemyCount();
                
                // Encerrar combate para todos os heróis que estavam lutando contra este inimigo
                gameState.heroes.forEach(h => {
                    if (h.inCombat && h.combatWith === enemy) {
                        // Verificar se há outros inimigos adjacentes antes de sair do combate
                        const adjacentEnemies = currentMap.enemies.filter(e => {
                            const dx = Math.abs(e.x - h.x);
                            const dy = Math.abs(e.y - h.y);
                            return (dx <= 1 && dy <= 1) && (dx + dy > 0);
                        });
                        
                        if (adjacentEnemies.length === 0) {
                            h.inCombat = false;
                            h.combatWith = null;
                        } else {
                            // Se ainda há inimigos adjacentes, continuar em combate com eles
                            adjacentEnemies.forEach(e => {
                                startCombat(h, e);
                            });
                        }
                    }
                });
            }
        } else {
            // Se o inimigo ainda está vivo, verificar se ainda há heróis em combate com ele
            const heroesStillInCombat = gameState.heroes.filter(h => 
                h.inCombat && h.combatWith === enemy
            );
            
            if (heroesStillInCombat.length === 0) {
                enemy.inCombat = false;
                enemy.combatWith = null;
            }
        }
    }
    
    // Esconder ações de combate se o herói atual não está mais em combate
    const currentHero = gameState.heroes[gameState.currentHeroIndex];
    if (!currentHero || !currentHero.inCombat) {
        hideCombatActions();
    }

    // Verificar se todos os heróis foram derrotados
    if (gameState.heroes.length === 0) {
        gameOver();
    }
}

// Mostrar ações de combate
function showCombatActions() {
    const currentHero = gameState.heroes[gameState.currentHeroIndex];
    if (!currentHero.inCombat) return;

    // Limpar ações anteriores
    combatActions.innerHTML = '<h3>Ações de Combate</h3>';

    // Criar seção de seleção de inimigo
    const enemySelection = document.createElement('div');
    enemySelection.className = 'enemy-selection';
    enemySelection.innerHTML = '<h4>Selecione o inimigo:</h4>';

    // Obter todos os inimigos em combate com o herói
    const enemiesInCombat = getEnemiesInCombatWith(currentHero);
    
    // Adicionar botões para cada inimigo
    enemiesInCombat.forEach((enemy, index) => {
        const enemyBtn = document.createElement('button');
        enemyBtn.className = 'enemy-btn';
        enemyBtn.textContent = `${enemy.name} (HP: ${enemy.hp}/${enemy.maxHp})`;
        enemyBtn.dataset.enemyIndex = index;
        
        enemyBtn.addEventListener('click', () => {
            selectEnemyForCombat(enemy);
        });
        
        enemySelection.appendChild(enemyBtn);
    });

    combatActions.appendChild(enemySelection);
    combatActions.style.display = "block";
    rollDiceBtn.disabled = true;
}

// Função auxiliar para obter inimigos em combate com o herói
function getEnemiesInCombatWith(hero) {
    const currentMap = gameState.maps[gameState.currentMap];
    return currentMap.enemies.filter(enemy => {
        if (!enemy.inCombat) return false;
        
        if (Array.isArray(enemy.combatWith)) {
            return enemy.combatWith.includes(hero);
        } else {
            return enemy.combatWith === hero;
        }
    });
}

// Função para selecionar um inimigo para combate
function selectEnemyForCombat(enemy) {
    const currentHero = gameState.heroes[gameState.currentHeroIndex];
    
    // Limpar seleção anterior
    combatActions.innerHTML = '<h3>Ações de Combate</h3>';
    
    // Mostrar informações do inimigo selecionado
    const enemyInfo = document.createElement('div');
    enemyInfo.className = 'selected-enemy';
    enemyInfo.innerHTML = `<h4>Alvo: ${enemy.name} (HP: ${enemy.hp}/${enemy.maxHp})</h4>`;
    combatActions.appendChild(enemyInfo);
    
    // Criar botões de ação
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'combat-buttons';
    
    const attackBtn = document.createElement('button');
    attackBtn.textContent = 'Atacar';
    attackBtn.addEventListener('click', () => {
        performCombatAction('attack', enemy);
    });
    
    const defendBtn = document.createElement('button');
    defendBtn.textContent = 'Defender';
    defendBtn.addEventListener('click', () => {
        performCombatAction('defend', enemy);
    });
    
    const fleeBtn = document.createElement('button');
    fleeBtn.textContent = 'Fugir';
    fleeBtn.addEventListener('click', () => {
        performCombatAction('flee', enemy);
    });
    
    const changeTargetBtn = document.createElement('button');
    changeTargetBtn.textContent = 'Trocar Alvo';
    changeTargetBtn.addEventListener('click', showCombatActions);
    
    actionsDiv.appendChild(attackBtn);
    actionsDiv.appendChild(defendBtn);
    actionsDiv.appendChild(fleeBtn);
    actionsDiv.appendChild(changeTargetBtn);
    
    combatActions.appendChild(actionsDiv);
}

// Esconder ações de combate
function hideCombatActions() {
    combatActions.style.display = "none";
    rollDiceBtn.disabled = false;
}

// Executar ação de combate
function performCombatAction(action, enemy) {
    const currentHero = gameState.heroes[gameState.currentHeroIndex];
    
    if (!currentHero.inCombat || !enemy) {
        addLogMessage("Você não está em combate!", "system");
        return;
    }
    
    // Verificar se o inimigo ainda está em combate com o herói
    if (!isEnemyInCombatWithHero(enemy, currentHero)) {
        addLogMessage(`${enemy.name} não está mais em combate com você!`, "system");
        showCombatActions(); // Voltar para seleção de inimigos
        return;
    }
    
    switch (action) {
        case 'attack':
            // Calcular dano do herói
            const heroDamage = Math.max(1, currentHero.attack - Math.floor(enemy.defense / 2));
            enemy.hp -= heroDamage;
            addLogMessage(`${currentHero.name} ataca ${enemy.name} causando ${heroDamage} de dano!`, "hero");
            
            // Verificar se o inimigo foi derrotado
            if (enemy.hp <= 0) {
                enemy.hp = 0;
                addLogMessage(`${enemy.name} foi derrotado!`, "system");
                endCombat(currentHero, enemy);
                break; // Sair do switch caso o inimigo tenha sido derrotado
            }

            addLogMessage(`O inimigo ${enemy.name} está com ${enemy.hp} pontos de vida.`, "hero");
            
            // Calcular dano do inimigo apenas se ele ainda está vivo
            const enemyDamage = Math.max(1, enemy.attack - Math.floor(currentHero.defense / 2));
            currentHero.hp -= enemyDamage;
            currentHero.hp = Math.max(0, currentHero.hp); // Garantir que HP não fique negativo
            addLogMessage(`${enemy.name} contra-ataca causando ${enemyDamage} de dano!`, "enemy");
            
            // Verificar se o herói foi derrotado
            if (currentHero.hp <= 0) {
                addLogMessage(`${currentHero.name} foi derrotado!`, "system");
                endCombat(currentHero, enemy);
            }
            break;
            
        case 'defend':
            currentHero.isDefending = true;
            addLogMessage(`${currentHero.name} assume uma postura defensiva!`, "hero");
            
            // Inimigo ainda pode atacar, mas com dano reduzido
            const reducedDamage = Math.max(1, Math.floor(enemy.attack / 2) - Math.floor(currentHero.defense / 2));
            currentHero.hp -= reducedDamage;
            addLogMessage(`${enemy.name} ataca, mas ${currentHero.name} defende, causando apenas ${reducedDamage} de dano!`, "enemy");
            break;
            
        case 'flee':
            // Chance de 50% de fugir com sucesso
            if (Math.random() < 0.5) {
                // Tentar encontrar uma posição segura e distante
                const fleePosition = getRandomValidPosition();
                
                // Verificar se encontrou uma posição válida
                if (fleePosition) {
                    // Teleportar o herói para a nova posição
                    const oldX = currentHero.x;
                    const oldY = currentHero.y;
                    currentHero.x = fleePosition.x;
                    currentHero.y = fleePosition.y;
                    
                    addLogMessage(`${currentHero.name} fugiu com sucesso do combate!`, "hero");
                    addLogMessage(`${currentHero.name} foi teleportado de (${oldX},${oldY}) para (${fleePosition.x},${fleePosition.y})`, "system");
                    
                    // Finalizar combate para este herói com TODOS os inimigos
                    currentHero.inCombat = false;
                    
                    // Lidar com todos os inimigos que estavam em combate com este herói
                    const currentMap = gameState.maps[gameState.currentMap];
                    currentMap.enemies.forEach(enemy => {
                        if (enemy.combatWith) {
                            if (Array.isArray(enemy.combatWith)) {
                                // Remover este herói da lista de combate do inimigo
                                enemy.combatWith = enemy.combatWith.filter(h => h !== currentHero);
                                
                                // Se só restou um herói, converter de array para referência direta
                                if (enemy.combatWith.length === 1) {
                                    enemy.combatWith = enemy.combatWith[0];
                                } 
                                // Se não há mais heróis, limpar o combate
                                else if (enemy.combatWith.length === 0) {
                                    enemy.inCombat = false;
                                    enemy.combatWith = null;
                                }
                            } 
                            // Se era uma referência direta a este herói
                            else if (enemy.combatWith === currentHero) {
                                enemy.inCombat = false;
                                enemy.combatWith = null;
                            }
                        }
                    });
                    
                    currentHero.combatWith = null;
                    
                    // Atualizar a câmera para acompanhar o herói se estiver no modo follow
                    if (followHero) {
                        updateCamera();
                    }
                    
                    // Esconder ações de combate se este era o herói atual
                    if (gameState.heroes[gameState.currentHeroIndex] === currentHero) {
                        hideCombatActions();
                    }
                } else {
                    // Se não encontrou posição segura, tratar como falha na fuga
                    addLogMessage(`${currentHero.name} tentou fugir mas não encontrou um local seguro!`, "hero");
                    const enemyDamage = Math.max(1, enemy.attack - Math.floor(currentHero.defense / 2));
                    currentHero.hp -= enemyDamage;
                    addLogMessage(`${enemy.name} ataca causando ${enemyDamage} de dano!`, "enemy");
                }
            } else {
                // Falha na tentativa de fuga
                addLogMessage(`${currentHero.name} tentou fugir mas falhou!`, "hero");
                const enemyDamage = Math.max(1, enemy.attack - Math.floor(currentHero.defense / 2));
                currentHero.hp -= enemyDamage;
                addLogMessage(`${enemy.name} ataca causando ${enemyDamage} de dano!`, "enemy");
            }
            break;
    }
    
    // Resetar defesa após o turno
    currentHero.isDefending = false;
    
    // Verificar se o combate terminou (algum dos dois foi derrotado)
    if (currentHero.hp <= 0 || enemy.hp <= 0) {
        endCombat(currentHero, enemy);
    } else {
        // Voltar para seleção de ações após realizar uma ação
        selectEnemyForCombat(enemy);
    }
    
    // Passar para o próximo jogador após ação de combate
    if (gameState.isPlayerTurn) {
        // Só passar para o próximo jogador se for o turno dos jogadores
        nextHeroOrEndTurn();
    }
}

function isEnemyInCombatWithHero(enemy, hero) {
    if (!enemy.inCombat || !enemy.combatWith) return false;
    
    if (Array.isArray(enemy.combatWith)) {
        return enemy.combatWith.includes(hero);
    } else {
        return enemy.combatWith === hero;
    }
}

function getRandomValidPosition(maxAttempts = 50) {
    const currentMap = gameState.maps[gameState.currentMap];
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        attempts++;
        const x = Math.floor(Math.random() * GRID_COLS);
        const y = Math.floor(Math.random() * GRID_ROWS);
        
        // Verificar se a posição é válida
        if (isPositionValidForFlee(x, y)) {
            return { x, y };
        }
    }
    
    // Se não encontrou após várias tentativas, retorna null
    return null;
}

function isPositionValidForFlee(x, y) {
    const currentMap = gameState.maps[gameState.currentMap];
    
    // Verificar limites do mapa
    if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) {
        return false;
    }
    
    // Verificar se é parede
    if (currentMap.layout[y][x] === 1) {
        return false;
    }
    
    // Verificar se tem outro herói
    if (gameState.heroes.some(hero => hero.x === x && hero.y === y)) {
        return false;
    }
    
    // Verificar se tem inimigo
    if (currentMap.enemies.some(enemy => enemy.x === x && enemy.y === y)) {
        return false;
    }
    
    // Verificar se é portal
    if (currentMap.portals.some(portal => portal.x === x && portal.y === y)) {
        return false;
    }
    
    // Verificar se está adjacente a inimigos
    if (isAdjacentToEnemy(x, y)) {
        return false;
    }
    
    return true;
}

function isAdjacentToEnemy(x, y) {
    const currentMap = gameState.maps[gameState.currentMap];
    return currentMap.enemies.some(enemy => {
        const dx = Math.abs(x - enemy.x);
        const dy = Math.abs(y - enemy.y);
        return dx <= 1 && dy <= 1 && (dx + dy > 0); // Adjacente mas não na mesma posição
    });
}

// Mover herói
function moveHero(dx, dy) {
    // Verificar se é o turno do jogador, se há movimentos restantes e se não está em combate
    const currentHero = gameState.heroes[gameState.currentHeroIndex];
    if (!gameState.isPlayerTurn || gameState.movesLeft <= 0 || currentHero.inCombat) return;

    const newX = currentHero.x + dx;
    const newY = currentHero.y + dy;
    
    // Verificar se a nova posição está dentro dos limites do mapa
    if (newX >= 0 && newX < GRID_COLS && newY >= 0 && newY < GRID_ROWS) {
        // Verificar se não há parede na nova posição
        const currentMap = gameState.maps[gameState.currentMap];
        if (currentMap.layout[newY][newX] !== 1) {
            // Verificar se não há outro herói na posição
            if (!gameState.heroes.some(hero => hero !== currentHero && hero.x === newX && hero.y === newY)) {
                // Verificar se não há inimigo na posição
                if (!currentMap.enemies.some(enemy => enemy.x === newX && enemy.y === newY)) {
                    currentHero.x = newX;
                    currentHero.y = newY;
                    gameState.movesLeft--;
                    checkPortals();

                    // Verificar se entrou em combate com inimigo adjacente
                    checkAdjacentCombat();

                    // Se o jogador acabou seus movimentos, trocar para o próximo herói ou passar a vez
                    if (gameState.movesLeft === 0 && !currentHero.inCombat) {
                        nextHeroOrEndTurn();
                    }
                } else {
                    addLogMessage("Você não pode ocupar o mesmo espaço que um inimigo!", "system");
                }
            } else {
                addLogMessage("Você não pode ocupar o mesmo espaço que outro herói!", "system");
            }
        }
    }
}

// Função para trocar para o próximo herói ou encerrar o turno
function nextHeroOrEndTurn() {
    let nextHeroIndex = (gameState.currentHeroIndex + 1) % gameState.heroes.length;
    
    // Se voltou ao primeiro herói, terminar o turno
    if (nextHeroIndex === 0) {
        endPlayerTurn();
    } else {
        // Trocar para o próximo herói
        gameState.currentHeroIndex = nextHeroIndex;
        gameState.movesLeft = 0; // Reiniciar movimentos (precisará rolar o dado)
        
        // Verificar se o próximo herói está em combate
        const nextHero = gameState.heroes[nextHeroIndex];
        if (nextHero && nextHero.inCombat) {
            showCombatActions();
            addLogMessage(`Agora é o turno de ${nextHero.name} (em combate com ${nextHero.combatWith.name}). Escolha uma ação.`, "system");
        } else {
            hideCombatActions();
            addLogMessage(`Agora é o turno de ${nextHero.name}. Role o dado para se mover.`, "system");
        }
        
        updateHeroesInfo();
    }
}

// Função para encerrar o turno do jogador
function endPlayerTurn() {
    const currentMap = gameState.maps[gameState.currentMap];
    const enemiesInCombat = currentMap.enemies.filter(enemy => enemy.inCombat);
    const enemiesNotInCombat = currentMap.enemies.filter(enemy => !enemy.inCombat);

    // Determinar a mensagem apropriada
    if (enemiesInCombat.length > 0 && enemiesNotInCombat.length > 0) {
        addLogMessage("Turno dos jogadores encerrado. Inimigos estão agindo...", "system");
    } else if (enemiesInCombat.length > 0) {
        addLogMessage("Turno dos jogadores encerrado. Inimigos em combate estão atacando...", "system");
    } else if (enemiesNotInCombat.length > 0) {
        addLogMessage("Turno dos jogadores encerrado. Inimigos estão se movendo...", "system");
    } else {
        addLogMessage("Turno dos jogadores encerrado. Não há inimigos para agir.", "system");
    }

    gameState.isPlayerTurn = false;
    gameState.currentHeroIndex = 0; // Resetar para o primeiro herói
    gameState.movesLeft = 0;

    // Esconder ações de combate
    hideCombatActions();

    // Atualizar interface para remover o destaque do herói ativo
    updateHeroesInfo();

    // Iniciar o movimento dos inimigos e passar um callback para reiniciar o turno dos jogadores
    moveEnemies(() => {
        // Após o movimento dos inimigos, reiniciar o turno dos jogadores
        startPlayerTurn();
    });
}

// Adicionar evento para o botão de passar turno
document.getElementById('endTurnBtn').addEventListener('click', function() {
    if (gameState.isPlayerTurn) {
        endPlayerTurn();
    }
});

document.getElementById('nextPlayerBtn').addEventListener('click', function() {
    if (gameState.isPlayerTurn) {
        nextHeroOrEndTurn();
    }
});

function startPlayerTurn() {
    // Verificar se já é o turno do jogador para evitar chamadas redundantes
    if (gameState.isPlayerTurn) {
        return; // Já é o turno do jogador, não fazer nada
    }

    // Definir o turno do jogador
    gameState.isPlayerTurn = true;
    gameState.currentHeroIndex = 0; // Começar com o primeiro herói
    gameState.movesLeft = 0; // Reiniciar movimentos (precisará rolar o dado)

    // Verificar se o herói está em combate
    const currentHero = gameState.heroes[gameState.currentHeroIndex];
    if (currentHero && currentHero.inCombat && !gameState.isGameOver) {
        showCombatActions();
        addLogMessage(`Turno dos jogadores iniciado. ${currentHero.name} está em combate com ${currentHero.combatWith.name}! Escolha uma ação.`, "system");
    } else if (!gameState.isGameOver) {
        hideCombatActions();
        addLogMessage("Turno dos jogadores iniciado. Role o dado para se mover.", "system");
    }

    // Atualizar a interface para refletir o início do turno do jogador
    updateHeroesInfo();
}

// Função para desenhar a rota do inimigo
function drawEnemyPath(path) {
    // Limpar rota anterior
    clearEnemyPath();
    
    if (!path || path.length === 0) return;
    
    path.forEach((step, index) => {
        const pathDot = document.createElement('div');
        pathDot.className = 'enemy-path';
        pathDot.style.left = (step.x * GRID_SIZE - camera.x + GRID_SIZE/2) + 'px';
        pathDot.style.top = (step.y * GRID_SIZE - camera.y + GRID_SIZE/2) + 'px';
        pathDot.style.opacity = 0.3 + (0.7 * (index / path.length)); // Pontos mais próximos do destino são mais visíveis
        document.querySelector('.canvas-container').appendChild(pathDot);
    });
}

// Função para limpar a rota
function clearEnemyPath() {
    document.querySelectorAll('.enemy-path').forEach(el => el.remove());
}

// Mover inimigos com base no resultado do dado e com delay entre os movimentos
function moveEnemies(callback) {
    const currentMap = gameState.maps[gameState.currentMap];
    
    // Separar inimigos em combate e não em combate
    const enemiesInCombat = currentMap.enemies.filter(enemy => enemy.inCombat);
    const activeEnemies = currentMap.enemies.filter(enemy => !enemy.inCombat);
    
    // Se não houver inimigos ativos ou em combate, voltar o turno para o jogador
    if (activeEnemies.length === 0 && enemiesInCombat.length === 0 || gameState.isGameOver) {
        if (callback) callback();
        return;
    }

    // Função para mover um inimigo para a lista de ativos
    const activateEnemy = (enemy) => {
        if (!activeEnemies.includes(enemy)) {
            activeEnemies.push(enemy);
        }
    };

    // Primeiro processar inimigos em combate
    const processCombatEnemies = () => {
        if (enemiesInCombat.length === 0) {
            // Se não há inimigos em combate, mover para os inimigos ativos
            moveActiveEnemies(callback);
            return;
        }

        const enemy = enemiesInCombat.shift();

        // Verificar se o inimigo ainda está em combate com heróis vivos
        const isEnemyStillInCombat = () => {
            if (!enemy.combatWith) return false;
            
            if (Array.isArray(enemy.combatWith)) {
                return enemy.combatWith.some(hero => hero.hp > 0);
            } else {
                return enemy.combatWith.hp > 0;
            }
        };

        // Se não há mais heróis vivos em combate com este inimigo, pular para o próximo
        if (!isEnemyStillInCombat()) {
            endCombat(null, enemy);
            activateEnemy(enemy);
            setTimeout(processCombatEnemies, 300);
            return;
        }

        currentAttackingEnemy = enemy; // Destacar o inimigo que está atacando
        currentMovingEnemy = null;     // Garantir que não está em movimento
        drawEnemies();                 // Atualizar visualização imediatamente
        
        addLogMessage(`Turno de combate do ${enemy.name}...`, "system");
        
        // Pequeno delay para dar tempo do destaque aparecer
        setTimeout(() => {
            // Verificar se o inimigo ainda está em combate (pode ter mudado)
            if (enemy.inCombat && enemy.combatWith && !gameState.isPlayerTurn) {
                // Obter todos os heróis em combate com este inimigo
                let heroesInCombat = [];
                if (Array.isArray(enemy.combatWith)) {
                    heroesInCombat = [...enemy.combatWith];
                } else if (enemy.combatWith) {
                    heroesInCombat = [enemy.combatWith];
                }
                
                // Filtrar apenas heróis vivos
                heroesInCombat = heroesInCombat.filter(h => h.hp > 0);
                
                // Se não há mais heróis vivos em combate, encerrar
                if (heroesInCombat.length === 0) {
                    endCombat(null, enemy);
                    activateEnemy(enemy);
                    currentAttackingEnemy = null;
                    drawEnemies();
                    setTimeout(processCombatEnemies, 300);
                    return;
                }
                
                // Escolher um herói aleatório para atacar
                const randomHero = heroesInCombat[Math.floor(Math.random() * heroesInCombat.length)];
                
                if (randomHero && randomHero.hp > 0) { // Verificação adicional de HP
                    // Inimigo realiza um ataque
                    const damage = Math.max(1, enemy.attack - Math.floor(randomHero.defense / 2));
                    randomHero.hp -= damage;
                    randomHero.hp = Math.max(0, randomHero.hp); // Garantir que HP não fique negativo
                    
                    addLogMessage(`${enemy.name} ataca ${randomHero.name} causando ${damage} de dano!`, "enemy");
                    
                    // Verificar se o herói foi derrotado
                    if (randomHero.hp <= 0) {
                        addLogMessage(`${randomHero.name} foi derrotado!`, "system");
                        endCombat(randomHero, enemy);
                        
                        // Atualizar a lista de heróis em combate
                        if (Array.isArray(enemy.combatWith)) {
                            enemy.combatWith = enemy.combatWith.filter(h => h !== randomHero);
                            if (enemy.combatWith.length === 1) {
                                enemy.combatWith = enemy.combatWith[0];
                            }
                        } else if (enemy.combatWith === randomHero) {
                            enemy.combatWith = null;
                        }
                    }
                } else {
                    // Se o herói selecionado já está morto, apenas continuar
                    addLogMessage(`${enemy.name} não encontrou alvo válido!`, "system");
                }
            }

            // Remover o destaque após o ataque (ou se não houve ataque)
            setTimeout(() => {
                currentAttackingEnemy = null;
                drawEnemies();
                setTimeout(processCombatEnemies, 300);
            }, 500);
        }, 100);
    };

    // Função para mover inimigos ativos (não em combate)
    const moveActiveEnemies = (finalCallback) => {
        if (activeEnemies.length === 0 || gameState.isGameOver) {
            clearEnemyPath();
            if (finalCallback) finalCallback();
            return;
        }

        const enemiesToMove = [...activeEnemies];
        
        const moveNextEnemy = () => {
            if (enemiesToMove.length === 0) {
                clearEnemyPath();
                if (finalCallback) finalCallback();
                return;
            }
            
            const enemy = enemiesToMove.shift();
            const enemyIndex = currentMap.enemies.indexOf(enemy);
            currentMovingEnemy = enemy;

            addLogMessage(`Turno do inimigo ${enemy.name}...`, "system");
            
            // Encontrar o herói mais próximo que esteja vivo, não em combate e dentro do campo de visão
            let closestHero = null;
            let shortestPathLength = Infinity;

            for (const hero of gameState.heroes) {
                if (hero.hp <= 0) continue;

                const dx = Math.abs(hero.x - enemy.x);
                const dy = Math.abs(hero.y - enemy.y);

                // Verificar se está dentro do campo de visão (visão quadrada)
                if (dx <= enemy.visionRange && dy <= enemy.visionRange) {
                    // Calcular o caminho usando BFS
                    const path = bfs(enemy, hero, currentMap);
                    
                    // Se encontrou um caminho e é mais curto que o atual
                    if (path.length > 0 && path.length < shortestPathLength) {
                        shortestPathLength = path.length;
                        closestHero = hero;
                    }
                    // Em caso de empate, usar critérios de desempate
                    else if (path.length > 0 && path.length === shortestPathLength) {
                        // 1. Priorizar heróis em linha reta (menos curvas no caminho)
                        const currentPathTurns = countTurnsInPath(path);
                        const closestPathTurns = countTurnsInPath(bfs(enemy, closestHero, currentMap));
                        
                        if (currentPathTurns < closestPathTurns) {
                            shortestPathLength = path.length;
                            closestHero = hero;
                        }
                        // 2. Se ainda empatado, priorizar herói com menor HP
                        else if (currentPathTurns === closestPathTurns && hero.hp < closestHero.hp) {
                            shortestPathLength = path.length;
                            closestHero = hero;
                        }
                    }
                }
            }

            if (!closestHero) {
                addLogMessage(`${enemy.name} não vê nenhum herói e fica parado.`, "system");
                currentMovingEnemy = null;
                setTimeout(moveNextEnemy, 500);
                return;
            }

            // Rolagem de dado para o inimigo (D6)
            const enemyDiceRoll = Math.floor(Math.random() * 6) + 1;
            addLogMessage(`O inimigo ${enemy.name} rolou um ${enemyDiceRoll} e se moverá ${enemyDiceRoll} vezes.`, "system");

            // Calcular o caminho mais curto usando BFS
            const path = bfs(enemy, closestHero, currentMap);
            drawEnemyPath(path);

            setTimeout(() => {
                if (path.length > 0) {
                    let step = 0;
                    const moveStepByStep = () => {
                        if (step >= enemyDiceRoll || step >= path.length - 1) {
                            const finalX = enemy.x;
                            const finalY = enemy.y;
                            
                            const adjacentHeroes = gameState.heroes.filter(hero => {
                                if (hero.hp <= 0) return false;
                                const dx = Math.abs(hero.x - finalX);
                                const dy = Math.abs(hero.y - finalY);
                                return (dx <= 1 && dy <= 1) && (dx + dy > 0);
                            });

                            adjacentHeroes.forEach(hero => {
                                startCombat(hero, enemy);
                            });

                            clearEnemyPath();
                            currentMovingEnemy = null;
                            setTimeout(moveNextEnemy, 500);
                            return;
                        }

                        const nextStep = path[step + 1];
                        
                        // Nova verificação de tile ocupado
                        const isTileBlocked = () => {
                            if (currentMap.layout[nextStep.y][nextStep.x] === 1) {
                                return { blocked: true, reason: 'parede' };
                            }
                            
                            const heroHere = gameState.heroes.find(h => 
                                h.x === nextStep.x && h.y === nextStep.y && h.hp > 0
                            );
                            if (heroHere) {
                                return { blocked: true, reason: 'hero', hero: heroHere };
                            }
                            
                            const enemyHere = currentMap.enemies.find(e => 
                                e !== enemy && e.x === nextStep.x && e.y === nextStep.y && !e.inCombat
                            );
                            if (enemyHere) {
                                return { blocked: true, reason: 'enemy' };
                            }
                            
                            return { blocked: false };
                        };

                        const tileCheck = isTileBlocked();
                        if (tileCheck.blocked) {
                            if (tileCheck.reason === 'hero') {
                                startCombat(tileCheck.hero, enemy);
                            } else {
                                addLogMessage(`${enemy.name} não pode se mover - ${tileCheck.reason === 'parede' ? 'parede no caminho' : 'outro inimigo bloqueando'}!`, "system");
                            }
                            clearEnemyPath();
                            currentMovingEnemy = null;
                            setTimeout(moveNextEnemy, 500);
                            return;
                        }
                        
                        enemy.x = nextStep.x;
                        enemy.y = nextStep.y;

                        const newAdjacentHeroes = gameState.heroes.filter(hero => {
                            if (hero.hp <= 0 || hero.inCombat) return false;
                            const dx = Math.abs(hero.x - enemy.x);
                            const dy = Math.abs(hero.y - enemy.y);
                            return (dx <= 1 && dy <= 1) && (dx + dy > 0);
                        });

                        if (newAdjacentHeroes.length > 0) {
                            newAdjacentHeroes.forEach(hero => {
                                startCombat(hero, enemy);
                            });
                            clearEnemyPath();
                            currentMovingEnemy = null;
                            setTimeout(moveNextEnemy, 500);
                            return;
                        }

                        updateGameInfo();

                        step++;
                        enemyMoveTimeouts.push(setTimeout(moveStepByStep, 500));
                    };

                    moveStepByStep();
                } else {
                    clearEnemyPath();
                    addLogMessage(`${enemy.name} está preso e não pode se mover!`, "system");
                    currentMovingEnemy = null;
                    setTimeout(moveNextEnemy, 500);
                }
            }, 200);
        };

        moveNextEnemy();
    };

    // Começar processando inimigos em combate
    processCombatEnemies();
}

// Função auxiliar para contar curvas no caminho
function countTurnsInPath(path) {
    if (path.length < 3) return 0;
    
    let turns = 0;
    let lastDirection = null;
    
    for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i-1].x;
        const dy = path[i].y - path[i-1].y;
        const currentDirection = dx !== 0 ? 'horizontal' : 'vertical';
        
        if (lastDirection && currentDirection !== lastDirection) {
            turns++;
        }
        
        lastDirection = currentDirection;
    }
    
    return turns;
}

// Função para calcular o caminho mais curto usando BFS (sem diagonais)
function bfs(start, goal, map) {
    const queue = [];
    const visited = new Set();
    const cameFrom = new Map();

    // Verificar se já está adjacente (incluindo diagonais)
    const isAdjacent = (x1, y1, x2, y2) => {
        return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1 && (x1 !== x2 || y1 !== y2);
    };

    // Se já está adjacente (pode ser diagonal), não precisa se mover
    if (isAdjacent(start.x, start.y, goal.x, goal.y)) {
        return [];
    }

    queue.push(start);
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
        const current = queue.shift();

        // Vizinhos ortogonais apenas (norte, sul, leste, oeste)
        const neighbors = [
            { x: current.x + 1, y: current.y }, // Direita
            { x: current.x - 1, y: current.y }, // Esquerda
            { x: current.x, y: current.y + 1 }, // Baixo
            { x: current.x, y: current.y - 1 }  // Cima
        ];

        for (const neighbor of neighbors) {
            // Verificar se o vizinho está dentro dos limites do mapa
            if (neighbor.x < 0 || neighbor.x >= GRID_COLS || neighbor.y < 0 || neighbor.y >= GRID_ROWS) {
                continue;
            }

            // Verificar se o vizinho é uma parede
            if (map.layout[neighbor.y][neighbor.x] === 1) {
                continue;
            }

            // Verificar se há outro inimigo na posição
            if (map.enemies.some(e => e !== start && e.x === neighbor.x && e.y === neighbor.y)) {
                continue;
            }

            // Verificar se há um herói na posição (exceto o alvo)
            if (gameState.heroes.some(h => (h.x !== goal.x || h.y !== goal.y) && h.x === neighbor.x && h.y === neighbor.y)) {
                continue;
            }

            // Verificar se o vizinho já foi visitado
            if (visited.has(`${neighbor.x},${neighbor.y}`)) {
                continue;
            }

            // Verificar se chegou perto o suficiente (adjacente incluindo diagonais)
            if (isAdjacent(neighbor.x, neighbor.y, goal.x, goal.y)) {
                const path = [];
                let node = current;
                while (node) {
                    path.push({ x: node.x, y: node.y });
                    node = cameFrom.get(`${node.x},${node.y}`);
                }
                path.reverse();
                path.push(neighbor); // Adiciona o último passo
                return path;
            }

            // Adicionar o vizinho à fila e marcar como visitado
            queue.push(neighbor);
            visited.add(`${neighbor.x},${neighbor.y}`);
            cameFrom.set(`${neighbor.x},${neighbor.y}`, current);
        }
    }

    // Se não houver caminho, retornar uma lista vazia
    return [];
}

function rollDice() {
    // Verificar se é o turno do jogador, se não há movimentos restantes e se não está em combate
    const currentHero = gameState.heroes[gameState.currentHeroIndex];
    if (!gameState.isPlayerTurn || gameState.movesLeft > 0 || currentHero.inCombat) return;

    const diceRoll = Math.floor(Math.random() * 6) + 1; // Rola um D6 (1 a 6)
    gameState.movesLeft = diceRoll; // Define o número de movimentos
    addLogMessage(`Você rolou um ${diceRoll}! Agora você tem ${diceRoll} movimentos.`, "system");
}

// Lidar com input do teclado
function handleKeyDown(event) {
    event.preventDefault();
    
    switch (event.key) {
        case 'ArrowUp':
            moveHero(0, -1);
            break;
        case 'ArrowDown':
            moveHero(0, 1);
            break;
        case 'ArrowLeft':
            moveHero(-1, 0);
            break;
        case 'ArrowRight':
            moveHero(1, 0);
            break;
    }
}

// Adicionar mensagem ao log de combate
function addLogMessage(message, type) {
    const p = document.createElement('p');
    p.textContent = message;
    p.className = `log-${type}`;
    combatLog.appendChild(p);
    
    // Manter scroll no final
    combatLog.scrollTop = combatLog.scrollHeight;
}

// Iniciar o jogo
initGame();