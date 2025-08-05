const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const crtToggle = document.getElementById('crtToggle');
const attributesPanel = document.getElementById('attributesPanel');

let lastFrameTime = Date.now();
let gameTime = 0; // Tempo acumulado do jogo (não avança quando pausado)

// Configurações do jogo
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 600;
const RESPAWN_TIME = 8000;

const ASTEROID_EVENT_INTERVAL = 60000; // 60 segundos entre eventos
const ASTEROID_EVENT_DURATION = 15000; // 15 segundos de duração
const ASTEROID_TYPES = [
    { size: 15, speed: 3, damage: 10, color: '#8B4513' },  // Pequeno
    { size: 30, speed: 2, damage: 20, color: '#A0522D' },  // Médio
    { size: 50, speed: 1, damage: 40, color: '#654321' }   // Grande
];

const NEBULA_EVENT_INTERVAL = 45000; // 45 segundos entre eventos
const NEBULA_EVENT_DURATION = 20000; // 20 segundos de duração
const NEBULA_DENSITY = 0.7; // Densidade da névoa (0-1)
const NEBULA_MOVEMENT_SPEED = 0.5; // Velocidade de movimento da névoa

const LIGHTNING_EVENT_INTERVAL = 80000; // 80 segundos entre eventos
const LIGHTNING_EVENT_DURATION = 15000; // 15 segundos de duração
const LIGHTNING_TYPES = [
    { width: 4, damage: 15, color: '#00aaff', speed: 10 },  // Raio rápido
    { width: 7, damage: 25, color: '#ff00ff', speed: 6 },  // Raio médio
    { width: 10, damage: 40, color: '#ffff00', speed: 4 }   // Raio poderoso
];

// Estado do jogo
let gameState = {
    score: 0,
    lives: 3,
    gameOver: false,
    camera: { x: 0, y: 0 },
    isRespawning: false,
    respawnCountdown: 0,
    crtEffectEnabled: false,
    asteroidEvent: {
        active: false,
        startTime: 0,
        asteroids: [],
        nextEventTime: gameTime + ASTEROID_EVENT_INTERVAL
    },
    nebulaEvent: {
        active: false,
        startTime: 0,
        nextEventTime: gameTime + NEBULA_EVENT_INTERVAL,
        clouds: [],
        lastCloudSpawn: 0
    },
    lightningEvent: {
        active: false,
        startTime: 0,
        lightnings: [],
        nextEventTime: gameTime + LIGHTNING_EVENT_INTERVAL,
        warning: false
    },
    drops: [],
    isInStartScreen: true,
    timeFields: [],
    playerLevel: 1,
    playerXP: 0,
    xpToNextLevel: 100,
    availablePoints: 0,
    attributes: {
        speed: { base: 5, bonus: 0, max: 7 }, // Velocidade base é 5, pode aumentar até +5
        health: { base: 100, bonus: 0, max: 150 }, // Vida base 100, pode aumentar até 150
        spreadCooldown: { base: 15000, bonus: 0, max: 5000 }, // Cooldown do tiro espalhado
        turboCooldown: { base: 10000, bonus: 0, max: 4500 } // Cooldown do turbo
    }
};

function addXP(amount) {
    gameState.playerXP += amount;
    
    // Verificar se subiu de nível
    while (gameState.playerXP >= gameState.xpToNextLevel) {
        levelUp();
    }
    
    updateXPDisplay();
}

function levelUp() {
    gameState.playerXP -= gameState.xpToNextLevel;
    gameState.playerLevel++;
    gameState.availablePoints++;
    gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * 1.2); // Aumenta a XP necessária
    
    // Atualiza os displays
    updateLevelDisplay();
    updateAttributesPanel();
    
    // Mostra o painel de atributos
    showAttributesPanel();
}

// Chamar esta função quando inimigos são destruídos
function enemyDestroyed(points) {
    gameState.score += points;
    addXP(points / 20); // Ganha metade dos pontos como XP
}

function showAttributesPanel() {
    // Pausa o jogo
    gameState.gamePaused = true;

    // Mostra o painel
    document.getElementById('attributesPanel').style.display = 'block';
    document.getElementById('xpBarContainer').style.display = 'block';
    updateAttributesPanel();
}

function hideAttributesPanel() {
    // Esconde o painel
    document.getElementById('attributesPanel').style.display = 'none';
    
    // Continua o jogo
    gameState.gamePaused = false;
}

function updateAttributesPanel() {
    // Atualiza os valores exibidos
    document.getElementById('availablePoints').textContent = gameState.availablePoints;
    
    // Velocidade (mostra o valor total)
    const speedTotal = gameState.attributes.speed.base + gameState.attributes.speed.bonus;
    document.getElementById('speedValue').textContent = speedTotal.toFixed(1);
    
    // Vida (mostra o valor total)
    const healthTotal = gameState.attributes.health.base + gameState.attributes.health.bonus;
    document.getElementById('healthValue').textContent = Math.floor(healthTotal);
    
    // Cooldown Spread (mostra em segundos)
    const spreadTotal = (gameState.attributes.spreadCooldown.base - gameState.attributes.spreadCooldown.bonus) / 1000;
    document.getElementById('spreadCooldownValue').textContent = spreadTotal.toFixed(1) + 's';
    
    // Cooldown Turbo (mostra em segundos)
    const turboTotal = (gameState.attributes.turboCooldown.base - gameState.attributes.turboCooldown.bonus) / 1000;
    document.getElementById('turboCooldownValue').textContent = turboTotal.toFixed(1) + 's';
    
    // Desabilita botões se não houver pontos ou se atingiu o máximo/minimo
    const attributes = {
        'speed': { 
            isDecreasing: false, 
            current: gameState.attributes.speed.bonus, 
            max: gameState.attributes.speed.max - gameState.attributes.speed.base 
        },
        'health': { 
            isDecreasing: false, 
            current: gameState.attributes.health.bonus, 
            max: gameState.attributes.health.max - gameState.attributes.health.base 
        },
        'spreadCooldown': { 
            isDecreasing: true, 
            current: gameState.attributes.spreadCooldown.bonus, 
            max: gameState.attributes.spreadCooldown.base - gameState.attributes.spreadCooldown.max 
        },
        'turboCooldown': { 
            isDecreasing: true, 
            current: gameState.attributes.turboCooldown.bonus, 
            max: gameState.attributes.turboCooldown.base - gameState.attributes.turboCooldown.max 
        }
    };
    
    Object.keys(attributes).forEach(attr => {
        const btn = document.querySelector(`button[onclick="increaseAttribute('${attr}')"]`);
        const attrData = attributes[attr];
        
        const isMaxed = attrData.isDecreasing ? 
            (attrData.current >= attrData.max) : 
            (attrData.current >= attrData.max);
            
        btn.disabled = gameState.availablePoints === 0 || isMaxed;
    });
}

function increaseAttribute(attribute) {
    if (gameState.availablePoints <= 0) return;
    
    // Aumenta o atributo
    switch(attribute) {
        case 'speed':
            gameState.attributes.speed.bonus += 0.1;
            player.speed = gameState.attributes.speed.base + gameState.attributes.speed.bonus;
            break;
            
        case 'health':
            gameState.attributes.health.bonus += 1;
            player.maxHealth = gameState.attributes.health.base + gameState.attributes.health.bonus;
            player.health = player.maxHealth; // Cura completamente
            break;
            
        case 'spreadCooldown':
            gameState.attributes.spreadCooldown.bonus += 100;
            player.spreadShotCooldown = Math.max(5000, 
                gameState.attributes.spreadCooldown.base - gameState.attributes.spreadCooldown.bonus);
            break;
            
        case 'turboCooldown':
            gameState.attributes.turboCooldown.bonus += 100;
            player.turboCooldown = Math.max(4500, 
                gameState.attributes.turboCooldown.base - gameState.attributes.turboCooldown.bonus);
            console.log(player.turboCooldown)
            break;
    }
    
    gameState.availablePoints--;
    updateAttributesPanel();
}

function updateXPDisplay() {
    const xpPercent = (gameState.playerXP / gameState.xpToNextLevel) * 100;
    document.getElementById('xpBar').style.width = xpPercent + '%';
    document.getElementById('xpText').textContent = 
        `Level ${gameState.playerLevel} (${gameState.playerXP}/${gameState.xpToNextLevel})`;
}

function updateLevelDisplay() {
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('aliens').textContent = aliens.length;
    
    // Atualiza também no painel de atributos se estiver visível
    if (document.getElementById('attributesPanel').style.display === 'block') {
        updateAttributesPanel();
    }
}

// Adicione este evento no final do seu script
document.getElementById('confirmAttributes').addEventListener('click', hideAttributesPanel);

// Sistema de música
const musicPlayer = {
    tracks: [
        { name: "Space Adventure", url: "music/arcade_acadia.mp3" },
        { name: "Sci-Fi Loop", url: "music/rush_point.mp3" },
        { name: "Digital Dreams", url: "music/spaceshooter.mp3" }
    ],
    currentTrack: 0,
    audio: new Audio(),
    isPlaying: false,
    volume: 0.1,
    
    init: function() {
        this.audio.volume = this.volume;
        this.loadTrack(this.currentTrack);
        
        // Event listeners para os controles
        document.getElementById('playPause').addEventListener('click', () => this.togglePlay());
        document.getElementById('nextTrack').addEventListener('click', () => this.nextTrack());
        document.getElementById('prevTrack').addEventListener('click', () => this.prevTrack());
        document.getElementById('volumeControl').addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });
        
        // Quando a música acabar, tocar a próxima
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.play();
        this.isPlaying = true;
        document.getElementById('playPause').innerHTML = `<i class="fas fa-pause" style="color: #00FF00"></i>`;
    },
    
    loadTrack: function(index) {
        this.currentTrack = index;
        this.audio.src = this.tracks[index].url;
        this.audio.load();
        document.getElementById('nowPlaying').textContent = this.tracks[index].name;
        
        if (this.isPlaying) {
            this.audio.play().catch(e => console.log("Autoplay prevented:", e));
        }
    },
    
    togglePlay: function() {
        this.isPlaying = !this.isPlaying;
        
        if (this.isPlaying) {
            this.audio.play().catch(e => console.log("Play failed:", e));
            document.getElementById('playPause').innerHTML = `<i class="fas fa-pause" style="color: #00FF00"></i>`;
        } else {
            this.audio.pause();
            document.getElementById('playPause').innerHTML = `<i class="fas fa-play" style="color: #00FF00"></i>`;
        }
    },

    stop: function() {
        this.audio.pause();
        this.audio.currentTime = 0; // Volta para o início da faixa
        this.isPlaying = false;
        document.getElementById('playPause').innerHTML = `<i class="fas fa-play" style="color: #00FF00"></i>`;
    },
    
    nextTrack: function() {
        this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
        this.loadTrack(this.currentTrack);
    },
    
    prevTrack: function() {
        this.currentTrack = (this.currentTrack - 1 + this.tracks.length) % this.tracks.length;
        this.loadTrack(this.currentTrack);
    },
    
    setVolume: function(vol) {
        this.volume = parseFloat(vol);
        this.audio.volume = this.volume;
    }
};

// Controles
const keys = {};

// Player
const player = {
    x: 100,
    y: 300,
    width: 30,
    height: 20,
    speed: 5,
    color: '#00ff00',
    bullets: [],
    lastShot: 0,
    shootDelay: 200,
    facingRight: true,
    maxHealth: 100,
    health: 100,
    isInvulnerable: false,
    invulnerableTimer: 0,
    invulnerableDuration: 2000, // 2 segundos de imunidade
    blinkTimer: 0,
    lasers: [], // Novo array para armazenar os lasers
    lastLaserShot: 0,
    laserDelay: 500, // Metade do tempo do tiro normal
    laserSpeed: 12, // Mais rápido que o tiro normal
    laserWidth: 4,
    laserHeight: 2,
    spreadShots: [], // Array para os tiros de espalhamento
    lastSpreadShot: 0,
    spreadShotCooldown: 15000, // 15 segundos de cooldown
    spreadShotReady: true, // Indica se o tiro está pronto
    spreadShotPulse: 0, // Para o efeito visual
    baseSpeed: 5, // Velocidade base
    turboSpeed: 10, // Velocidade com turbo
    turboActive: false, // Estado do turbo
    turboDuration: 2000, // 2 segundos de turbo
    turboCooldown: 10000, // 10 segundos de cooldown
    lastTurboUse: 0, // Quando foi usado pela última vez
    turboReady: true, // Se o turbo está disponível
    turboPulse: 0, // Para efeito visual do cooldown
    turboParticles: [], // Partículas para efeito do turbo
    nuclearBomb: {
        ready: true,
        lastUse: 0,
        cooldown: 30000, // 30 segundos
        pulse: 0,
        radius: 250 // Raio de efeito
    },
    blackHoleParticles: [], // Partículas para o efeito de buraco negro
    allies: {
        ready: true,
        lastUse: 0,
        cooldown: 25000, // 25 segundos de cooldown
        pulse: 0,
        ships: [], // Naves aliadas ativas
        damage: 1 // Dano causado por cada nave aliada
    },
    lastSkinSwitch: 0,
    shield: {
        active: false,
        ready: true,
        lastUse: 0,
        cooldown: 20000, // 20 segundos
        pulse: 0,
        radius: 40, // Raio do escudo
        strength: 100, // "Vida" do escudo
        maxStrength: 100
    },
    drone: {
        active: false,
        ready: true,
        lastUse: 0,
        cooldown: 30000, // 30 segundos de cooldown
        duration: 10000, // 10 segundos de duração
        pulse: 0,
        x: 0,
        y: 0,
        bullets: [], // Tiros do drone
        lastShot: 0,
        shootDelay: 500 // Atira a cada 0.5 segundos
    },
    shieldParticles: [],
    isForceFieldActive: false,
    forceFieldEndTime: 0,
    forceFieldParticles: [] // Para efeitos visuais
};

const SHIP_SKINS = {
    CLASSIC: 0,
    STEALTH: 1
};
let currentShipSkin = SHIP_SKINS.CLASSIC;

// Aliens
const aliens = [];
const alienBullets = [];
const alienTypes = [
    { width: 25, height: 25, color: '#ff0000', speed: 2, points: 100, type: 'scout', attackRate: 0.009, bulletSpeed: 3, damage: 20 },
    { width: 35, height: 30, color: '#ff6600', speed: 1.5, points: 200, type: 'warrior', attackRate: 0.006, bulletSpeed: 4, damage: 30 },
    { width: 20, height: 20, color: '#ffff00', speed: 3, points: 150, type: 'fast', attackRate: 0.007, bulletSpeed: 5, damage: 15 },
    { width: 40, height: 35, color: '#990000', speed: 1, points: 500, type: 'tank', attackRate: 0.003, bulletSpeed: 2.5, damage: 40, health: 5, invulnerableDuration: 1000 },
    { 
        width: 30, 
        height: 30, 
        color: '#aa00ff', 
        speed: 2.5, 
        points: 300, 
        type: 'hunter', 
        attackRate: 0.005, 
        bulletSpeed: 4, 
        damage: 25,
        health: 3,
        detectionRange: 400,
        pursuitSpeed: 3.5,
        invulnerableDuration: 1000
    },
    { 
        width: 40, 
        height: 40, 
        color: '#ff00ff', 
        speed: 1, 
        points: 400, 
        type: 'disco', 
        attackRate: 0.004, 
        bulletSpeed: 4, 
        damage: 15,
        health: 4,
        invulnerableDuration: 1000,
        spinSpeed: 0.05 // Velocidade de rotação
    },
    {
        width: 28,
        height: 28,
        color: '#00ff88', // Cor verde-água para diferenciar
        speed: 1.8,
        points: 350,
        type: 'eye', // Novo tipo
        attackRate: 0.008, // Taxa de ataque um pouco menor
        bulletSpeed: 4,
        damage: 25,
        health: 3,
        invulnerableDuration: 1000,
        amplitude: 50, // Amplitude do movimento senoidal
        frequency: 0.05 // Frequência do movimento senoidal
    },
    {
        width: 28,
        height: 28,
        color: '#00ddff', // Cor azul clara para diferenciar
        speed: 1.5,
        points: 250,
        type: 'medic', // Novo tipo
        attackRate: 0.005, // Taxa de ataque
        bulletSpeed: 4,
        damage: 15,
        health: 2,
        invulnerableDuration: 1000,
        healRange: 250, // Alcance da cura
        healAmount: 1, // Quantidade de saúde restaurada
        healCooldown: 5000, // 5 segundos entre curas
        lastHealTime: 0, // Será inicializado quando o alien for criado
        bulletColor: '#00aaff'
    },
    {
        width: 40,
        height: 40,
        color: '#cc00cc',  // Roxo para diferenciar
        speed: 1.2,
        points: 400,
        type: 'mother',
        attackRate: 0.004,
        bulletSpeed: 3.5,
        damage: 25,
        health: 5,
        invulnerableDuration: 1500,
        spawnRate: 0.002,  // Chance de spawnar filhotes por frame
        lastSpawn: 0,
        spawnCooldown: 5000  // 5 segundos entre spawns
    }
];

const offspringTypes = [
    {
        width: 15,
        height: 15,
        color: '#ff88ff',
        speed: 3,
        points: 50,
        type: 'offspring',
        attackRate: 0.01,
        bulletSpeed: 3.3,
        damage: 10,
        health: 1,
        lifeTime: 15000,  // 15 segundos de vida
        bulletColor: '#ff00ff',  // Cor roxa para os tiros
        bulletType: 'swarm'  // Tipo especial de tiro
    }
];

// Sistema de drops
const DROP_TYPES = {
    HEALTH: {
        id: 'health',
        chance: 0.2,
        speed: 1.2,
        move: true // Se move ou fica parado
    },
    BLACK_HOLE: {
        id: 'blackhole',
        chance: 0.15,
        speed: 0, // Não se move
        move: false,
        pulseSpeed: 0.05 // Velocidade da pulsação
    },
    FORCE_FIELD: {
        id: 'forcefield',
        chance: 0.25,
        speed: 0,     // Não se move
        move: false,
        duration: 6000 // 3 segundos
    },
    TIME_BOMB: {  // Novo tipo
        id: 'timebomb',
        chance: 0.2,
        speed: 0,
        move: false,
        radius: 200,  // Raio de efeito
        freezeDuration: 12000  // 12 segundos de congelamento
    }
};

function createDrop(x, y) {
    // Calcular qual item dropar baseado nas chances individuais
    const dropTypes = Object.values(DROP_TYPES);
    const totalChance = dropTypes.reduce((sum, type) => sum + type.chance, 0);
    
    // Se nenhum drop deve ocorrer (baseado na chance total)
    if (Math.random() > totalChance) {
        return null;
    }
    
    // Escolher um drop baseado nas chances relativas
    let random = Math.random() * totalChance;
    let cumulativeChance = 0;
    
    for (const type of dropTypes) {
        cumulativeChance += type.chance;
        if (random <= cumulativeChance) {
            return createSpecificDrop(x, y, type);
        }
    }
    
    return null;
}

function createSpecificDrop(x, y, type) {
    // Propriedades comuns
    const drop = {
        x: x,
        y: y,
        width: 15,
        height: 15,
        vy: type.speed,
        type: type.id,
        move: type.move,
        collected: false,
        animationTime: 0,
        life: 5000,
        createdAt: gameTime,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.05
    };
    
    // Propriedades específicas
    switch(type.id) {
        case 'health':
            drop.color = '#00ff00';
            drop.glowColor = 'rgba(0, 255, 0, 0.3)';
            drop.amount = 20;
            drop.bounceHeight = 5;
            break;
        case 'blackhole':
            drop.color = '#000000';
            drop.glowColor = 'rgba(150, 0, 255, 0.7)';
            drop.pulseSpeed = type.pulseSpeed;
            drop.size = 20; // Tamanho base
            drop.maxSize = 30; // Tamanho máximo quando pulsar
            break;
        case 'forcefield':
            drop.color = '#00aaff';
            drop.glowColor = 'rgba(0, 170, 255, 0.7)';
            drop.duration = type.duration;
            break;
        case 'timebomb':
            drop.color = '#ffffff';
            drop.glowColor = 'rgba(100, 200, 255, 0.7)';
            drop.radius = type.radius;
            drop.freezeDuration = type.freezeDuration;
            drop.size = 15;
            drop.maxSize = 25;
            drop.pulseSpeed = 0.1;
            break;
    }
    
    return drop;
}

// Cenários do game
const spaceEnvironments = [
    {
        name: "Deep Space",
        background: "#001122",
        starColor: "#ffffff",
        starsAmount: 200,
        planets: [],
        environmentType: "mountains", // Tipo de ambiente
        aliens: 15,
        elements: {
            // Configurações específicas para montanhas
            color1: "#0a1a2a",
            color2: "#1a3a5a",
            color3: "#2a5a8a"
        }
    },
    {
        name: "Nebula Zone",
        background: "#220033",
        starColor: "#ffccff",
        starsAmount: 100,
        planets: [
            { x: 1000, y: 150, radius: 60, color: "#9900cc", ring: true }
        ],
        environmentType: "trees", // Floresta alienígena
        aliens: 18,
        elements: {
            treeColor: "#00aa00",
            trunkColor: "#553300"
        }
    },
    {
        name: "Alien City",
        background: "#0a0a2a",
        starColor: "#aaffaa",
        starsAmount: 150,
        planets: [
            { x: 1500, y: 100, radius: 40, color: "#aa00ff", ring: true }
        ],
        environmentType: "alien_city",
        aliens: 22,
        elements: {
            buildingColors: ["#5500aa", "#8800ff", "#aa88ff"],
            glowColors: ["#00ffaa", "#ff00ff", "#00ffff"],
            structures: []
        }
    }
];

let currentEnvironmentIndex = 0;
let currentEnvironment = spaceEnvironments[currentEnvironmentIndex];

function changeEnvironment() {
    currentEnvironmentIndex = (currentEnvironmentIndex + 1) % spaceEnvironments.length;
    currentEnvironment = spaceEnvironments[currentEnvironmentIndex];
    generateStars(); // Gerar estrelas com nova cor e quantidade

    if (currentEnvironment.environmentType === "trees") {
        generateForest();
    } else if (currentEnvironment.environmentType === "alien_city") {
        generateAlienCity();
    }

    console.log(`Mudou para cenário: ${currentEnvironment.name} (${currentEnvironment.environmentType})`);
}

// Partículas para explosões
const particles = [];

// Estrelas de fundo
const stars = [];

// Substitua as variáveis de montanhas por estas:
const forestLayers = {
    back: {  // Árvores distantes (fundo)
        color: '#0a2a1a',
        speed: 0.2,
        height: 180,
        segments: [],
        treeColor: '#003315',
        trunkColor: '#331a00'
    },
    middle: {  // Árvores médias
        color: '#1a5a3a',
        speed: 0.5,
        height: 150,
        segments: [],
        treeColor: '#006622',
        trunkColor: '#552200'
    },
    front: {  // Árvores próximas (frente)
        color: '#2a8a5a',
        speed: 0.8,
        height: 120,
        segments: [],
        treeColor: '#009933',
        trunkColor: '#773300'
    }
};

function generateForest() {
    // Limpa os segmentos existentes
    for (const layer in forestLayers) {
        forestLayers[layer].segments = [];
    }
    
    // Camada de fundo (árvores distantes)
    for (let i = 0; i < 15; i++) {
        forestLayers.back.segments.push({
            x: i * 350,
            width: 350,
            treeCount: 4 + Math.floor(Math.random() * 3),
            trees: []
        });
        
        // Gerar árvores para este segmento
        for (let t = 0; t < forestLayers.back.segments[i].treeCount; t++) {
            forestLayers.back.segments[i].trees.push({
                xInSegment: Math.random(),
                width: 30 + Math.random() * 20,
                height: 80 + Math.random() * 40,
                colorVariation: Math.random()
            });
        }
    }
    
    // Camada do meio (árvores médias)
    for (let i = 0; i < 20; i++) {
        forestLayers.middle.segments.push({
            x: i * 250,
            width: 250,
            treeCount: 3 + Math.floor(Math.random() * 3),
            trees: []
        });
        
        for (let t = 0; t < forestLayers.middle.segments[i].treeCount; t++) {
            forestLayers.middle.segments[i].trees.push({
                xInSegment: Math.random(),
                width: 40 + Math.random() * 30,
                height: 100 + Math.random() * 60,
                colorVariation: Math.random()
            });
        }
    }
    
    // Camada frontal (árvores grandes)
    for (let i = 0; i < 25; i++) {
        forestLayers.front.segments.push({
            x: i * 180,
            width: 180,
            treeCount: 2 + Math.floor(Math.random() * 3),
            trees: []
        });
        
        for (let t = 0; t < forestLayers.front.segments[i].treeCount; t++) {
            forestLayers.front.segments[i].trees.push({
                xInSegment: Math.random(),
                width: 50 + Math.random() * 40,
                height: 120 + Math.random() * 80,
                colorVariation: Math.random()
            });
        }
    }
}

function generateAlienCity() {
    const city = currentEnvironment.elements;
    city.structures = [];
    
    // Gerar estruturas principais
    for (let i = 0; i < 30; i++) {
        const x = i * 300 + Math.random() * 200;
        const width = 80 + Math.random() * 120;
        const height = 150 + Math.random() * 300;
        const segments = 3 + Math.floor(Math.random() * 5);
        
        city.structures.push({
            x: x,
            width: width,
            height: height,
            segments: segments,
            color: city.buildingColors[Math.floor(Math.random() * city.buildingColors.length)],
            glowColor: city.glowColors[Math.floor(Math.random() * city.glowColors.length)],
            details: []
        });
        
        // Adicionar detalhes às estruturas
        for (let s = 0; s < segments; s++) {
            city.structures[i].details.push({
                width: width * (0.7 + Math.random() * 0.3),
                height: height / segments * (0.8 + Math.random() * 0.4),
                offset: (Math.random() - 0.5) * 40,
                windows: Math.floor(Math.random() * 5) + 2
            });
        }
    }
    
    // Gerar estruturas secundárias (flutuantes)
    for (let i = 0; i < 15; i++) {
        city.structures.push({
            x: Math.random() * WORLD_WIDTH,
            y: 100 + Math.random() * 200,
            width: 40 + Math.random() * 80,
            height: 60 + Math.random() * 100,
            floating: true,
            color: city.buildingColors[Math.floor(Math.random() * city.buildingColors.length)],
            glowColor: city.glowColors[Math.floor(Math.random() * city.glowColors.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.01
        });
    }
}

// Adicionando variáveis para as montanhas parallax
const mountains = {
    back: {
        color: '#0a1a2a',
        speed: 0.2,
        height: 150,
        segments: []
    },
    middle: {
        color: '#1a3a5a',
        speed: 0.5,
        height: 120,
        segments: []
    },
    front: {
        color: '#2a5a8a',
        speed: 0.8,
        height: 80,
        segments: []
    }
};

// Função para gerar as montanhas
function generateMountains() {
    // Montanhas distantes (fundo)
    for (let i = 0; i < 10; i++) {
        mountains.back.segments.push({
            x: i * 400,
            width: 400,
            peak: Math.random() * 50 + 100,
            colorVariation: Math.random()
        });
    }
    
    // Montanhas médias
    for (let i = 0; i < 15; i++) {
        mountains.middle.segments.push({
            x: i * 300,
            width: 300,
            peak: Math.random() * 40 + 80,
            colorVariation: Math.random()
        });
    }
    
    // Montanhas próximas (frente)
    for (let i = 0; i < 20; i++) {
        mountains.front.segments.push({
            x: i * 200,
            width: 200,
            peak: Math.random() * 30 + 50,
            colorVariation: Math.random()
        });
    }
}

// Função para desenhar as montanhas
function drawMountains() {
    const baseY = WORLD_HEIGHT; // Base das montanhas
    
    // Desenhar cada camada de montanhas
    for (const layer in mountains) {
        const mountainLayer = mountains[layer];
        
        mountainLayer.segments.forEach(segment => {
            const adjustedX = segment.x - gameState.camera.x * mountainLayer.speed;

            // Cria um gradiente vertical simples
            const gradient = ctx.createLinearGradient(
                0, baseY - mountainLayer.height - segment.peak,
                0, baseY
            );
            gradient.addColorStop(0, lightenColor(mountainLayer.color, 25 * segment.colorVariation));
            gradient.addColorStop(1, mountainLayer.color);
            
            ctx.fillStyle = gradient;
            
            // Se a montanha estiver fora da tela à esquerda, reposiciona à direita
            if (adjustedX + segment.width < 0) {
                segment.x += mountainLayer.segments.length * segment.width;
            }
            // Se a montanha estiver fora da tela à direita, reposiciona à esquerda
            else if (adjustedX > WORLD_WIDTH) {
                segment.x -= mountainLayer.segments.length * segment.width;
            }
            
            // Desenhar a montanha
            ctx.beginPath();
            ctx.moveTo(adjustedX, baseY);

            // Usamos uma curva para o topo da montanha
            ctx.quadraticCurveTo(
                adjustedX + segment.width / 2,                      // Ponto de controle (topo)
                baseY - mountainLayer.height - segment.peak,        // Altura do pico
                adjustedX + segment.width,                          // Final da base
                baseY
            );

            ctx.lineTo(adjustedX, baseY); // Fecha a base
            ctx.closePath();
            ctx.fill();
        });
    }
}

function drawAlienCity() {
    const city = currentEnvironment.elements;
    const baseY = WORLD_HEIGHT;
    
    city.structures.forEach(structure => {
        const drawX = structure.x - gameState.camera.x * 0.7; // Efeito parallax
        
        if (structure.floating) {
            // Estruturas flutuantes
            const drawY = structure.y;
            
            ctx.save();
            ctx.translate(drawX + structure.width/2, drawY + structure.height/2);
            ctx.rotate(structure.rotation);
            
            // Corpo principal
            ctx.fillStyle = structure.color;
            ctx.beginPath();
            ctx.moveTo(-structure.width/2, -structure.height/2);
            ctx.lineTo(0, -structure.height/2 - 20);
            ctx.lineTo(structure.width/2, -structure.height/2);
            ctx.lineTo(structure.width/2, structure.height/2);
            ctx.lineTo(-structure.width/2, structure.height/2);
            ctx.closePath();
            ctx.fill();
            
            // Detalhes luminosos
            ctx.strokeStyle = structure.glowColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-structure.width/3, -structure.height/3);
            ctx.lineTo(structure.width/3, -structure.height/3);
            ctx.lineTo(0, structure.height/3);
            ctx.closePath();
            ctx.stroke();
            
            ctx.restore();
            
            // Atualizar rotação
            structure.rotation += structure.rotationSpeed;
        } else {
            // Estruturas principais no chão
            let currentY = baseY;
            
            for (let s = 0; s < structure.segments; s++) {
                const segment = structure.details[s];
                currentY -= segment.height;
                
                const segmentX = drawX + segment.offset;
                const segmentY = currentY;
                
                // Desenhar segmento
                ctx.fillStyle = structure.color;
                ctx.beginPath();
                ctx.moveTo(segmentX, segmentY);
                ctx.lineTo(segmentX + segment.width, segmentY);
                ctx.lineTo(segmentX + segment.width * 0.9, segmentY + segment.height);
                ctx.lineTo(segmentX + segment.width * 0.1, segmentY + segment.height);
                ctx.closePath();
                ctx.fill();
                
                // Janelas luminosas
                ctx.fillStyle = structure.glowColor;
                const windowWidth = segment.width * 0.8 / segment.windows;
                for (let w = 0; w < segment.windows; w++) {
                    const windowX = segmentX + segment.width * 0.1 + w * windowWidth;
                    ctx.fillRect(
                        windowX, 
                        segmentY + segment.height * 0.2, 
                        windowWidth * 0.8, 
                        segment.height * 0.6
                    );
                }
            }
            
            // Efeito de brilho na base
            const gradient = ctx.createLinearGradient(
                drawX, baseY,
                drawX, baseY - 50
            );
            gradient.addColorStop(0, structure.glowColor + "aa");
            gradient.addColorStop(1, "transparent");
            
            ctx.fillStyle = gradient;
            ctx.fillRect(drawX - 20, baseY - 50, structure.width + 40, 50);
        }
    });
}

function drawAlienForest() {
    const baseY = WORLD_HEIGHT;
    
    for (const layer in forestLayers) {
        const forestLayer = forestLayers[layer];
        const totalSegments = forestLayer.segments.length;
        
        forestLayer.segments.forEach(segment => {
            // Calcular a posição ajustada com parallax
            let adjustedX = segment.x - gameState.camera.x * forestLayer.speed;
            
            // Sistema de reposicionamento contínuo
            // Verificar se o segmento saiu completamente da tela
            if (adjustedX + segment.width + 20 < 0) {
                segment.x += forestLayer.segments.length * segment.width;
            }
            // Se a montanha estiver fora da tela à direita, reposiciona à esquerda
            else if (adjustedX > WORLD_WIDTH) {
                segment.x -= forestLayer.segments.length * segment.width;
            }
            
            // Desenhar todas as árvores do segmento
            segment.trees.forEach(tree => {
                const treeX = adjustedX + (tree.xInSegment * segment.width);
                const treeY = baseY - tree.height;
                
                // Restante do código de desenho das árvores...
                // Desenhar tronco
                ctx.fillStyle = forestLayer.trunkColor;
                ctx.fillRect(
                    treeX + tree.width/4, 
                    treeY + tree.height/2, 
                    tree.width/2, 
                    tree.height/2
                );
                
                // Desenhar copa
                const copaOffsetY = tree.height * 0.15; // Ajuste este valor para controlar o deslocamento
                ctx.fillStyle = forestLayer.treeColor;
                ctx.beginPath();
                ctx.moveTo(treeX + tree.width/2, treeY + copaOffsetY);                // Topo deslocado
                ctx.lineTo(treeX + tree.width, treeY + tree.height/2 + copaOffsetY);  // Direita deslocada
                ctx.lineTo(treeX, treeY + tree.height/2 + copaOffsetY);               // Esquerda deslocada
                ctx.closePath();
                ctx.fill();
            });
        });
    }
}

function drawEnvironment() {
    switch(currentEnvironment.environmentType) {
        case "mountains":
            drawMountains();
            break;
        case "trees":
            drawAlienForest();
            break;
        case "alien_city":
            drawAlienCity();
            break;
        default:
            drawMountains(); // Padrão
    }
}

function generateStars() {
    stars.length = 0;
    for (let i = 0; i < currentEnvironment.starsAmount; i++) {
        stars.push({
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            size: Math.random() * 2 + 1,
            color: currentEnvironment.starColor,
            brightness: Math.random() * 0.5 + 0.5
        });
    }
}

function drawPlanets() {
    currentEnvironment.planets.forEach(planet => {
        const px = planet.x - gameState.camera.x;
        const py = planet.y;

        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(px, py, planet.radius, 0, Math.PI * 2);
        ctx.fill();

        if (planet.ring) {
            ctx.strokeStyle = "#ffffff22";
            ctx.beginPath();
            ctx.ellipse(px, py, planet.radius + 10, planet.radius / 2, 0.3, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}

let radarAngle = 0; // Ângulo da varredura

function drawRadar() {
    const radar = document.getElementById('radarCanvas');
    const rCtx = radar.getContext('2d');
    const w = radar.width;
    const h = radar.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w / 2;
    const scale = 0.05;
    const radarRadius = radar.width / 2;
    const centerX = radar.width / 2;
    const centerY = radar.height / 2;

    rCtx.clearRect(0, 0, w, h);

    // Fundo escuro
    rCtx.fillStyle = '#001010';
    rCtx.fillRect(0, 0, w, h);

    // Círculos concêntricos
    rCtx.strokeStyle = '#00ff88';
    rCtx.lineWidth = 0.5;
    for (let r = radius / 4; r <= radius; r += radius / 4) {
        rCtx.beginPath();
        rCtx.arc(cx, cy, r, 0, Math.PI * 2);
        rCtx.stroke();
    }

    // Linhas radiais
    for (let i = 0; i < 360; i += 30) {
        const angle = (i * Math.PI) / 180;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        rCtx.beginPath();
        rCtx.moveTo(cx, cy);
        rCtx.lineTo(x, y);
        rCtx.stroke();
    }

    // Varredura giratória (cone)
    const sweepAngle = radarAngle * (Math.PI / 180);
    const sweepWidth = Math.PI / 12; // ângulo do cone

    const gradient = rCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(0,255,100,0.3)');
    gradient.addColorStop(1, 'rgba(0,255,100,0.05)');
    rCtx.fillStyle = gradient;

    rCtx.beginPath();
    rCtx.moveTo(cx, cy);
    rCtx.arc(cx, cy, radius, sweepAngle - sweepWidth, sweepAngle + sweepWidth);
    rCtx.closePath();
    rCtx.fill();

    // Jogador no centro
    rCtx.fillStyle = '#00ff00';
    rCtx.beginPath();
    rCtx.arc(cx, cy, 3, 0, Math.PI * 2);
    rCtx.fill();

    // Inimigos
    aliens.forEach(alien => {
        const dx = (alien.x - player.x) * scale;
        const dy = (alien.y - player.y) * scale;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius - 5) {
            const angleToAlien = Math.atan2(dy, dx);
            const brightness = (Math.cos(angleToAlien - sweepAngle) + 1) / 2;

            rCtx.fillStyle = `rgba(255, 0, 0, ${brightness.toFixed(2)})`;
            rCtx.beginPath();
            rCtx.arc(cx + dx, cy + dy, 2, 0, Math.PI * 2);
            rCtx.fill();
        }
    });

    // Desenhar inimigos
    aliens.forEach(alien => {
        const dx = (alien.x - player.x) * scale;
        const dy = (alien.y - player.y) * scale;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius - 5) {
            const angleToAlien = Math.atan2(dy, dx);
            const maxDist = radius - 5;
            const brightness = 1 - Math.min(dist / maxDist, 1); 

            const { r, g, b } = hexToRGB(alien.color || '#ff0000');

            rCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness.toFixed(2)})`;
            rCtx.beginPath();
            rCtx.arc(cx + dx, cy + dy, 2, 0, Math.PI * 2);
            rCtx.fill();
        }
    });

    // Atualizar ângulo da varredura
    radarAngle = (radarAngle + 2) % 360;
}

// Converter cor hex para RGB
function hexToRGB(hex) {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    
    const r = Math.min(255, (num >> 16) + amt);
    const g = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const b = Math.min(255, (num & 0x0000FF) + amt);
    
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function drawHealthMonitor() {
    const canvas = document.getElementById('healthMonitorCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Fundo escuro
    ctx.fillStyle = '#001010';
    ctx.fillRect(0, 0, w, h);

    // Grade de linhas
    ctx.strokeStyle = '#003322';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
    }
    for (let i = 0; i < h; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
    }

    // ECG - linha de batimento cardíaco
    const now = gameTime / 50;
    const healthRatio = player.health / player.maxHealth;
    const critical = healthRatio < 0.25;
    const ecgHeight = 115;

    ctx.lineWidth = 2;
    ctx.strokeStyle = critical ? `rgba(255,0,0,${0.5 + 0.5 * Math.sin(now / 3)})` : '#00ff00';
    ctx.beginPath();

    for (let x = 0; x < w; x++) {
        const t = (x + now) * 0.35;
        const mod = (x + now * 2) % 80;

        // Batimento com pico
        let y;
        if (mod > 5 && mod < 10) y = h / 2 - 30 * healthRatio;
        else if (mod >= 10 && mod < 15) y = h / 2 + 40 * healthRatio;
        else if (mod >= 15 && mod < 25) y = h / 2 - 20 * healthRatio;
        else y = h / 2;

        y += Math.sin(t) * 2 * healthRatio;

        if (x === 0) ctx.moveTo(x, y - 9.5);
        else ctx.lineTo(x, y - 9.5);
    }
    ctx.stroke();

    // Texto de status
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`HEALTH: ${Math.floor(player.health)} / ${player.maxHealth}`, 10, 20);

    if (player.shield.active) {
        const shieldRatio = player.shield.strength / player.shield.maxStrength;
        
        // Barra de escudo
        const barWidth = w - 40;
        const barY = ecgHeight + 15;
        
        // Fundo da barra
        ctx.fillStyle = '#003300';
        ctx.fillRect(20, barY, barWidth, 15);
        
        // Barra de força (gradiente azul)
        const shieldGradient = ctx.createLinearGradient(20, 0, 20 + barWidth, 0);
        shieldGradient.addColorStop(0, '#00aaff');
        shieldGradient.addColorStop(1, '#0066ff');
        ctx.fillStyle = shieldGradient;
        ctx.fillRect(20, barY, barWidth * shieldRatio, 15);
        
        // Efeito de pulso quando o escudo está fraco
        if (shieldRatio < 0.3) {
            const pulse = Math.sin(now) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(0, 200, 255, ${pulse})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(20, barY, barWidth, 15);
        }
    } else {
        // Mensagem quando o escudo está inativo
        if (player.shield.ready) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'italic 12px monospace';
            ctx.fillText(`ESCUDO: DISPONÍVEL`, 10, ecgHeight + 27.5);            
        }
        
        // Barra de cooldown se estiver recarregando
        if (!player.shield.ready) {
            const cooldownRatio = 1 - (gameTime - player.shield.lastUse) / player.shield.cooldown;
            
            if (cooldownRatio > 0) {
                const barWidth = w - 40;
                const barY = ecgHeight + 40;
                
                // Fundo
                ctx.fillStyle = '#222222';
                ctx.fillRect(20, barY - 15, barWidth, 5);
                
                // Progresso
                ctx.fillStyle = '#00aa00';
                ctx.fillRect(20, barY - 15, barWidth * (1 - cooldownRatio), 5);
            }
        }
    }

    ctx.restore();
}

// Inicialização
function init() {
    // Criar estrelas de fundo
    generateStars();

    // Gerar montanhas
    generateMountains();
    
    // Criar aliens iniciais
    spawnAliens();

    // Iniciar controles da nave
    activateControls();

    initNeuralNetwork();

    gameState.asteroidEvent.nextEventTime = gameTime + ASTEROID_EVENT_INTERVAL;
    gameState.nebulaEvent.nextEventTime = gameTime + NEBULA_EVENT_INTERVAL;
    gameState.lightningEvent.nextEventTime = gameTime + LIGHTNING_EVENT_INTERVAL;
    crtToggle.style.display = 'block';

    // Mostra a barra de XP
    document.getElementById('xpBarContainer').style.display = 'block';
    updateXPDisplay();
    
    // Iniciar loop do jogo
    gameLoop();

    musicPlayer.init();
}

function spawnAliens() {
    for (let i = 0; i < currentEnvironment.aliens; i++) {
        const type = alienTypes[Math.floor(Math.random() * alienTypes.length)];
        aliens.push({
            x: Math.random() * (WORLD_WIDTH - 200) + 200,
            y: Math.random() * (WORLD_HEIGHT - 100) + 50,
            width: type.width,
            height: type.height,
            color: type.color,
            speed: type.speed,
            points: type.points,
            type: type.type,
            attackRate: type.attackRate,
            bulletSpeed: type.bulletSpeed,
            damage: type.damage,
            vx: (Math.random() - 0.5) * type.speed,
            vy: (Math.random() - 0.5) * type.speed,
            lastDirectionChange: 0,
            facingRight: Math.random() > 0.5,
            animationTime: Math.random() * 100,
            lastAttack: 0,
            health: type.health || 1, // Padrão para 1 se não estiver definido
            maxHealth: type.health || 1,
            invulnerableDuration: type.invulnerableDuration || 0,
            healRange: type.healRange || 0,
            healAmount: type.healAmount || 0,
            healCooldown: type.healCooldown || 0,
            lastHealTime: 0, // Inicializa sem cooldown
            lastSpawn: 0, // Garante que está inicializado
            spawnCooldown: 5000,
            spawnRate: 0.002,
        });
    }
}

function drawAlien(alien) {
    ctx.save();
    
    const { x, y, width, height, color, type, facingRight, animationTime, health, maxHealth, isInvulnerable, blinkTimer } = alien;
    const pulse = Math.sin(animationTime) * 0.1 + 1;

    // Efeito de piscar durante imunidade
    if (isInvulnerable) {
        const blinkPhase = Math.sin(blinkTimer * 0.02) > 0;
        if (!blinkPhase) {
            ctx.globalAlpha = 0.5; // Alien fica semi-transparente
        }
    }

    if (alien.isFrozen) {
        ctx.save();
        
        const centerX = alien.x + alien.width/2;
        const centerY = alien.y + alien.height/2;
        const radius = Math.max(alien.width, alien.height) * 0.6;
        const now = gameTime;
        
        // 1. Camada de gelo circular
        const gradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.3,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 2. Borda pulsante
        if (Math.sin(now * 0.005) > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 3. Símbolo de gelo central simples
        ctx.fillStyle = 'white';
        ctx.font = `${radius * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄', centerX, centerY);
        
        ctx.restore();
    }

    if (type === 'tank') {
        ctx.save();
        
        // Corpo principal - formato simétrico e orgânico
        ctx.fillStyle = color;
        ctx.beginPath();
        
        // Forma de casco alienígena simétrico
        ctx.moveTo(x, y + height/2);
        ctx.bezierCurveTo(
            x + width*0.2, y + height*0.1,
            x + width*0.8, y + height*0.1,
            x + width, y + height/2
        );
        ctx.bezierCurveTo(
            x + width*0.8, y + height*0.9,
            x + width*0.2, y + height*0.9,
            x, y + height/2
        );
        ctx.closePath();
        ctx.fill();
        
        // Divisões simétricas no casco
        ctx.strokeStyle = '#330000';
        ctx.lineWidth = 1.5;
        for (let i = 1; i <= 2; i++) {
            const segmentX = x + width * (i/3);
            ctx.beginPath();
            ctx.moveTo(segmentX, y + height*0.15);
            ctx.lineTo(segmentX, y + height*0.85);
            ctx.stroke();
        }
        
        // Olhos centrais - padrão simétrico
        const eyeSize = 5 + Math.sin(animationTime*3)*2;
        const eyeY = y + height*0.3;
        
        // Olho esquerdo
        let eyeX = x + width*0.35;
        let eyeGradient = ctx.createRadialGradient(
            eyeX, eyeY, 0,
            eyeX, eyeY, eyeSize
        );
        eyeGradient.addColorStop(0, '#00ff00');
        eyeGradient.addColorStop(0.7, '#005500');
        eyeGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI*2);
        ctx.fill();
        
        // Olho direito
        eyeX = x + width*0.65;
        eyeGradient = ctx.createRadialGradient(
            eyeX, eyeY, 0,
            eyeX, eyeY, eyeSize
        );
        eyeGradient.addColorStop(0, '#00ff00');
        eyeGradient.addColorStop(0.7, '#005500');
        eyeGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI*2);
        ctx.fill();
        
        // Boca/órgão central
        ctx.fillStyle = '#220000';
        ctx.beginPath();
        ctx.ellipse(
            x + width/2, y + height*0.6,
            width*0.1, height*0.05,
            0, 0, Math.PI*2
        );
        ctx.fill();
        
        // Apêndices simétricos (4 tentáculos)
        ctx.strokeStyle = '#550000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        const tentaclePositions = [
            { angle: -Math.PI/4, length: width*0.35 },
            { angle: Math.PI/4, length: width*0.35 },
            { angle: Math.PI - Math.PI/4, length: width*0.35 },
            { angle: Math.PI + Math.PI/4, length: width*0.35 }
        ];
        
        tentaclePositions.forEach(pos => {
            const startX = x + width/2;
            const startY = y + height*0.7;
            const endX = startX + Math.cos(pos.angle) * pos.length;
            const endY = startY + Math.sin(pos.angle) * pos.length;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(
                startX + Math.cos(pos.angle) * pos.length/2,
                startY + Math.sin(pos.angle) * pos.length/2,
                endX, endY
            );
            ctx.stroke();
            
            // Ventosas
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(endX, endY, 3, 0, Math.PI*2);
            ctx.fill();
        });
        
        // Canhão biológico central
        const cannonGradient = ctx.createLinearGradient(
            x + width/2, y + height*0.4,
            x + width/2, y + height*0.6
        );
        cannonGradient.addColorStop(0, '#880000');
        cannonGradient.addColorStop(0.5, '#ff0000');
        cannonGradient.addColorStop(1, '#880000');
        
        ctx.fillStyle = cannonGradient;
        ctx.beginPath();
        ctx.ellipse(
            x + width/2, y + height*0.5,
            width*0.08, height*0.15,
            0, 0, Math.PI*2
        );
        ctx.fill();
        
        // Barra de vida flutuante (centralizada)
        const healthWidth = 40;
        const healthHeight = 5;
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.roundRect(x + (width - healthWidth)/2, y - 10, healthWidth, healthHeight, 3);
        ctx.fill();
        
        ctx.fillStyle = health/maxHealth > 0.5 ? '#00ff00' : '#ff0000';
        ctx.beginPath();
        ctx.roundRect(x + (width - healthWidth)/2, y - 10, healthWidth * (health/maxHealth), healthHeight, 3);
        ctx.fill();
        
        // Efeito de pulsação quando ferido
        if (health/maxHealth < 0.5) {
            const pulse = Math.sin(animationTime * 5) * 0.1 + 1;
            ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * (1 - health/maxHealth)})`;
            ctx.beginPath();
            ctx.ellipse(
                x + width/2, y + height/2,
                width/2 * pulse, height/2 * pulse,
                0, 0, Math.PI*2
            );
            ctx.fill();
        }
        
        ctx.restore();
        
    } else if (type === 'scout') {
        // Alien Scout - formato de disco voador
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/2, width/2 * pulse, height/3, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Cúpula superior
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/3, width/3, height/4, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Luzes piscando
        const lightColor = Math.sin(animationTime * 3) > 0 ? '#00ffff' : '#ff00ff';
        ctx.fillStyle = lightColor;
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) + animationTime * 0.5;
            const lightX = x + width/2 + Math.cos(angle) * width/3;
            const lightY = y + height/2 + Math.sin(angle) * height/4;
            ctx.beginPath();
            ctx.arc(lightX, lightY, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        
    } else if (type === 'warrior') {
        // Alien Warrior - nave alienígena em formato de diamante
        ctx.fillStyle = color;
        
        // Corpo principal em formato diamante/losango
        ctx.beginPath();
        if (facingRight) {
            ctx.moveTo(x + width, y + height/2); // Ponta direita
            ctx.lineTo(x + width * 0.7, y); // Topo
            ctx.lineTo(x, y + height/2); // Ponta esquerda
            ctx.lineTo(x + width * 0.7, y + height); // Base
        } else {
            ctx.moveTo(x, y + height/2); // Ponta esquerda
            ctx.lineTo(x + width * 0.3, y); // Topo
            ctx.lineTo(x + width, y + height/2); // Ponta direita
            ctx.lineTo(x + width * 0.3, y + height); // Base
        }
        ctx.closePath();
        ctx.fill();
        
        // Centro da nave (cockpit)
        ctx.fillStyle = '#aa2200';
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/2, width/4, height/4, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Propulsores nas laterais
        ctx.fillStyle = '#ff4400';
        const thrusterGlow = Math.sin(animationTime * 4) * 0.3 + 0.7;
        ctx.globalAlpha = thrusterGlow;
        
        if (facingRight) {
            ctx.fillRect(x - 3, y + height/3, 5, height/3);
        } else {
            ctx.fillRect(x + width - 2, y + height/3, 5, height/3);
        }
        ctx.globalAlpha = 1;
        
        // Luzes de alerta piscando
        if (Math.sin(animationTime * 5) > 0) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(x + width/2, y + height/4, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + width/2, y + 3*height/4, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        
    } else if (type === 'fast') {
        // Alien Fast - criatura orgânica tipo polvo espacial
        ctx.fillStyle = color;
        
        // Corpo central arredondado
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/3, width/3 * pulse, height/3 * pulse, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Tentáculos animados (6 tentáculos)
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3) + (facingRight ? 0 : Math.PI);
            const baseX = x + width/2 + Math.cos(angle) * width/4;
            const baseY = y + height/3 + Math.sin(angle) * height/4;
            
            // Movimento ondulado dos tentáculos
            const wave1 = Math.sin(animationTime * 2 + i) * 8;
            const wave2 = Math.sin(animationTime * 3 + i + 1) * 12;
            
            const midX = baseX + Math.cos(angle + 0.5) * (width/3 + wave1);
            const midY = baseY + Math.sin(angle + 0.5) * (height/3 + wave1);
            
            const endX = midX + Math.cos(angle + 1) * (width/4 + wave2);
            const endY = midY + Math.sin(angle + 1) * (height/4 + wave2);
            
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.quadraticCurveTo(midX, midY, endX, endY);
            ctx.stroke();
            
            // Ventosas nos tentáculos
            ctx.fillStyle = '#aa8800';
            ctx.beginPath();
            ctx.arc(endX, endY, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Olho grande central
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/3, width/5, height/4, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Pupila que segue a direção
        ctx.fillStyle = '#000000';
        const pupilOffsetX = facingRight ? 2 : -2;
        ctx.beginPath();
        ctx.arc(x + width/2 + pupilOffsetX, y + height/3, width/8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Brilho no olho
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + width/2 + pupilOffsetX - 1, y + height/3 - 1, 2, 0, 2 * Math.PI);
        ctx.fill();
    } else if (alien.type === 'hunter') {
        // Alien Hunter - formato de predador biomecânico
        ctx.save();

        // Efeito de piscar durante imunidade
        if (alien.isInvulnerable) {
            const blinkPhase = Math.sin(alien.blinkTimer * 0.02) > 0;
            if (!blinkPhase) {
                ctx.globalAlpha = 0.5; // Alien fica semi-transparente
            }
        }

        // Barra de vida flutuante
        const healthWidth = 40;
        const healthHeight = 5;
        const healthX = alien.x + (alien.width - healthWidth) / 2;
        const healthY = alien.y - 15;
        
        // Fundo da barra
        ctx.fillStyle = '#333333';
        ctx.fillRect(healthX, healthY, healthWidth, healthHeight);
        
        // Vida atual
        ctx.fillStyle = alien.health/alien.maxHealth > 0.5 ? '#00ff00' : 
                      alien.health/alien.maxHealth > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(healthX, healthY, healthWidth * (alien.health/alien.maxHealth), healthHeight);
        
        // Borda
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(healthX, healthY, healthWidth, healthHeight);
        
        // Corpo principal em formato de gota alongada
        ctx.fillStyle = alien.color;
        ctx.beginPath();
        ctx.ellipse(
            alien.x + alien.width/2, alien.y + alien.height/2,
            alien.width/2, alien.height/1.5,
            Math.atan2(alien.vy, alien.vx),
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Detalhes biomecânicos
        ctx.strokeStyle = '#550088';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            alien.x + alien.width/2, alien.y + alien.height/2,
            alien.width/3, 0, Math.PI * 2
        );
        ctx.stroke();
        
        // Olhos que seguem o player
        const dx = player.x - (alien.x + alien.width/2);
        const dy = player.y - (alien.y + alien.height/2);
        const eyeAngle = Math.atan2(dy, dx);
        const eyeDistance = 5;
        
        // Olho esquerdo
        let eyeX = alien.x + alien.width/2 + Math.cos(eyeAngle) * eyeDistance;
        let eyeY = alien.y + alien.height/2 + Math.sin(eyeAngle) * eyeDistance;
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Olho direito (ligeiramente atrás)
        eyeX = alien.x + alien.width/2 + Math.cos(eyeAngle) * (eyeDistance - 3);
        eyeY = alien.y + alien.height/2 + Math.sin(eyeAngle) * (eyeDistance - 3);
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Mandíbulas que se abrem e fecham
        const jawOpen = Math.sin(alien.animationTime * 5) * 0.5 + 0.5;
        ctx.strokeStyle = '#8800ff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Mandíbula superior
        ctx.beginPath();
        ctx.moveTo(
            alien.x + alien.width/2 + Math.cos(eyeAngle + Math.PI/4) * 10,
            alien.y + alien.height/2 + Math.sin(eyeAngle + Math.PI/4) * 10
        );
        ctx.lineTo(
            alien.x + alien.width/2 + Math.cos(eyeAngle) * (15 * jawOpen),
            alien.y + alien.height/2 + Math.sin(eyeAngle) * (15 * jawOpen)
        );
        ctx.stroke();
        
        // Mandíbula inferior
        ctx.beginPath();
        ctx.moveTo(
            alien.x + alien.width/2 + Math.cos(eyeAngle - Math.PI/4) * 10,
            alien.y + alien.height/2 + Math.sin(eyeAngle - Math.PI/4) * 10
        );
        ctx.lineTo(
            alien.x + alien.width/2 + Math.cos(eyeAngle) * (15 * jawOpen),
            alien.y + alien.height/2 + Math.sin(eyeAngle) * (15 * jawOpen)
        );
        ctx.stroke();
        
        // Efeito de brilho quando perseguindo
        const distanceToPlayer = Math.sqrt(
            Math.pow(player.x - alien.x, 2) + 
            Math.pow(player.y - alien.y, 2)
        );
        
        if (distanceToPlayer < alien.detectionRange) {
            const pulse = Math.sin(alien.animationTime * 10) * 0.2 + 0.8;
            ctx.fillStyle = `rgba(255, 0, 255, ${0.3 * pulse})`;
            ctx.beginPath();
            ctx.arc(
                alien.x + alien.width/2, alien.y + alien.height/2,
                alien.width * 0.8, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        ctx.restore();
    } else if (alien.type === 'disco') {
        // Disco Alien - estilo psicodélico que gira e atira em todas as direções
        ctx.save();
        
        // Mover para o centro do alien e rotacionar
        ctx.translate(alien.x + alien.width/2, alien.y + alien.height/2);
        ctx.rotate(alien.animationTime * alien.spinSpeed);
        
        // Disco principal com padrão psicodélico
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, alien.width/2);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(0.3, '#00ffff');
        gradient.addColorStop(0.6, '#ffff00');
        gradient.addColorStop(1, '#ff0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, alien.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Padrão espiral interno
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const radius = alien.width/2 * (i/5);
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(alien.animationTime) * radius, Math.sin(alien.animationTime) * radius);
        }
        ctx.stroke();
        
        // Anéis concêntricos
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, alien.width/2 * (i/4), 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Luzes pulsantes
        const pulse = Math.sin(alien.animationTime * 5) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(
                Math.cos(angle) * alien.width/3,
                Math.sin(angle) * alien.width/3,
                3, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Núcleo central
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(1, '#000000');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Barra de vida
        const healthWidth = 40;
        const healthHeight = 5;
        ctx.fillStyle = '#333333';
        ctx.fillRect(alien.x + (alien.width - healthWidth)/2, alien.y - 15, healthWidth, healthHeight);
        
        ctx.fillStyle = alien.health/alien.maxHealth > 0.5 ? '#00ff00' : '#ff0000';
        ctx.fillRect(alien.x + (alien.width - healthWidth)/2, alien.y - 15, healthWidth * (alien.health/alien.maxHealth), healthHeight);
    } else if (alien.type === 'eye') {
        ctx.save();
        
        // Efeito de piscar durante imunidade
        if (alien.isInvulnerable) {
            const blinkPhase = Math.sin(alien.blinkTimer * 0.02) > 0;
            if (!blinkPhase) {
                ctx.globalAlpha = 0.5;
            }
        }

        // Corpo principal - formato de medusa espacial
        const gradient = ctx.createRadialGradient(
            x + width/2, y + height/2, 0,
            x + width/2, y + height/2, width/2
        );
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(1, '#008855');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/2, width/2, height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalhes luminosos
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Tentáculos de energia (animados)
        const tentacleCount = 8;
        for (let i = 0; i < tentacleCount; i++) {
            const angle = (i / tentacleCount) * Math.PI * 2 + alien.animationTime;
            const length = 10 + Math.sin(alien.animationTime * 2 + i) * 5;
            
            ctx.strokeStyle = `rgba(0, 255, 200, ${0.7 + Math.sin(alien.animationTime * 3 + i) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + width/2, y + height/2);
            ctx.lineTo(
                x + width/2 + Math.cos(angle) * length,
                y + height/2 + Math.sin(angle) * length
            );
            ctx.stroke();
        }
        
        // Olho central pulsante
        const eyePulse = Math.sin(alien.animationTime * 5) * 0.2 + 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2, width/4 * eyePulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupila que segue o jogador
        const dx = player.x - (x + width/2);
        const dy = player.y - (y + height/2);
        const angle = Math.atan2(dy, dx);
        const pupilX = x + width/2 + Math.cos(angle) * width/8;
        const pupilY = y + height/2 + Math.sin(angle) * width/8;
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(pupilX, pupilY, width/10, 0, Math.PI * 2);
        ctx.fill();
        
        // Barra de vida
        const healthWidth = 40;
        const healthHeight = 5;
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + (width - healthWidth)/2, y - 15, healthWidth, healthHeight);
        
        ctx.fillStyle = alien.health/alien.maxHealth > 0.5 ? '#00ff00' : '#ff0000';
        ctx.fillRect(x + (width - healthWidth)/2, y - 15, healthWidth * (alien.health/alien.maxHealth), healthHeight);
        
        ctx.restore();
    } else if (alien.type === 'medic') {
        ctx.save();
        
        // Efeito de piscar durante imunidade
        if (alien.isInvulnerable) {
            const blinkPhase = Math.sin(alien.blinkTimer * 0.02) > 0;
            if (!blinkPhase) {
                ctx.globalAlpha = 0.5;
            }
        }

        // Corpo principal - formato de cruz médica estilizada
        ctx.fillStyle = alien.color;
        
        // Haste vertical
        ctx.fillRect(alien.x + alien.width/2 - 3, alien.y, 6, alien.height);
        
        // Haste horizontal
        ctx.fillRect(alien.x, alien.y + alien.height/2 - 3, alien.width, 6);
        
        // Círculo central
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(
            alien.x + alien.width/2, 
            alien.y + alien.height/2, 
            8, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Símbolo de cura (pulsante)
        const pulse = Math.sin(alien.animationTime * 5) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(0, 255, 0, ${pulse})`;
        ctx.beginPath();
        ctx.moveTo(alien.x + alien.width/2, alien.y + alien.height/2 - 6);
        ctx.lineTo(alien.x + alien.width/2 + 6, alien.y + alien.height/2 + 6);
        ctx.lineTo(alien.x + alien.width/2 - 6, alien.y + alien.height/2 + 6);
        ctx.closePath();
        ctx.fill();
        
        // Barra de vida
        const healthWidth = 40;
        const healthHeight = 5;
        ctx.fillStyle = '#333333';
        ctx.fillRect(alien.x + (alien.width - healthWidth)/2, alien.y - 15, healthWidth, healthHeight);
        
        ctx.fillStyle = alien.health/alien.maxHealth > 0.5 ? '#00ff00' : '#ff0000';
        ctx.fillRect(alien.x + (alien.width - healthWidth)/2, alien.y - 15, healthWidth * (alien.health/alien.maxHealth), healthHeight);
        
        ctx.restore();
    } else if (alien.type === 'mother') {
        ctx.save();
        
        // Corpo principal
        ctx.fillStyle = alien.color;
        ctx.beginPath();
        ctx.ellipse(
            alien.x + alien.width/2, 
            alien.y + alien.height/2,
            alien.width/2, 
            alien.height/2.5,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Detalhes internos
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.ellipse(
            alien.x + alien.width/2, 
            alien.y + alien.height/2,
            alien.width/4, 
            alien.height/4,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Tentáculos reprodutores (animados)
        const tentacleAngle = Math.sin(alien.animationTime * 3) * 0.5;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + tentacleAngle;
            const length = 15 + Math.sin(alien.animationTime * 2 + i) * 5;
            
            ctx.strokeStyle = '#ff88ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(alien.x + alien.width/2, alien.y + alien.height/2);
            ctx.lineTo(
                alien.x + alien.width/2 + Math.cos(angle) * length,
                alien.y + alien.height/2 + Math.sin(angle) * length
            );
            ctx.stroke();
        }
        
        // Barra de vida especial
        const healthWidth = 50;
        const healthHeight = 6;
        ctx.fillStyle = '#333333';
        ctx.fillRect(alien.x + (alien.width - healthWidth)/2, alien.y - 15, healthWidth, healthHeight);
        
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(alien.x + (alien.width - healthWidth)/2, alien.y - 15, 
                    healthWidth * (alien.health/alien.maxHealth), healthHeight);
        
        // Indicador de spawn
        if (gameTime - alien.lastSpawn < alien.spawnCooldown) {
            const cooldownProgress = (gameTime - alien.lastSpawn) / alien.spawnCooldown;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(alien.x + (alien.width - healthWidth)/2, alien.y - 10, 
                        healthWidth * cooldownProgress, 2);
        }
        
        ctx.restore();
        
    } else if (alien.type === 'offspring') {
        ctx.save();
        
        // Posição central do alien
        const centerX = alien.x + alien.width/2;
        const centerY = alien.y + alien.height/2;
        const radius = alien.width/2;

        // ---- Corpo Circular ----
        // Gradiente para o corpo
        const bodyGradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.3,
            centerX, centerY, radius
        );
        bodyGradient.addColorStop(0, '#2a0a4a');  // Roxo escuro no centro
        bodyGradient.addColorStop(1, '#1a0433');  // Roxo mais escuro nas bordas

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Borda luminosa
        ctx.strokeStyle = '#6a0dad';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ---- Olho Central ----
        const eyeSize = radius * 0.6;  // Tamanho do olho
        const pupilBaseSize = eyeSize * 0.4;
        const highlightSize = pupilBaseSize * 0.5;

        // Movimento da pupila (segue o jogador)
        const dx = player.x - centerX;
        const dy = player.y - centerY;
        const angle = Math.atan2(dy, dx);
        const maxOffset = eyeSize * 0.3;
        const pupilX = centerX + Math.cos(angle) * maxOffset;
        const pupilY = centerY + Math.sin(angle) * maxOffset;

        // Branco do olho
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(centerX, centerY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Íris (gradiente)
        const irisGradient = ctx.createRadialGradient(
            pupilX, pupilY, 0,
            pupilX, pupilY, pupilBaseSize * 1.8
        );
        irisGradient.addColorStop(0, '#00ffff');  // Ciano claro
        irisGradient.addColorStop(1, '#0077aa');  // Azul mais escuro

        ctx.fillStyle = irisGradient;
        ctx.beginPath();
        ctx.arc(pupilX, pupilY, pupilBaseSize * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupila
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(pupilX, pupilY, pupilBaseSize, 0, Math.PI * 2);
        ctx.fill();

        // Brilho no olho (dois pontos)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(
            pupilX - pupilBaseSize * 0.4, 
            pupilY - pupilBaseSize * 0.4, 
            highlightSize, 
            0, 
            Math.PI * 2
        );
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
            pupilX + pupilBaseSize * 0.2, 
            pupilY + pupilBaseSize * 0.3, 
            highlightSize * 0.6, 
            0, 
            Math.PI * 2
        );
        ctx.fill();

        // ---- Detalhes Adicionais ----
        // Padrão circular ao redor do olho
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, eyeSize * 1.3, 0, Math.PI * 2);
        ctx.stroke();

        // Linhas radiais
        for (let i = 0; i < 8; i++) {
            const lineAngle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(lineAngle) * eyeSize * 0.8,
                centerY + Math.sin(lineAngle) * eyeSize * 0.8
            );
            ctx.lineTo(
                centerX + Math.cos(lineAngle) * eyeSize * 1.3,
                centerY + Math.sin(lineAngle) * eyeSize * 1.3
            );
            ctx.stroke();
        }
        
        // Barra de tempo de vida
        const lifeProgress = (gameTime - alien.spawnTime) / alien.lifeTime;
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(alien.x, alien.y + alien.height + 2, 
                    alien.width * (1 - lifeProgress), 2);
        
        ctx.restore();
    }
    
    ctx.restore();
}

function drawSpaceship(x, y, width, height, facingRight) {
    ctx.save();

    // Se for a skin STEALTH, use o novo desenho
    if (currentShipSkin === SHIP_SKINS.STEALTH) {
        // Configurações base
        const shipColor = player.isInvulnerable ? 
            (Math.sin(player.blinkTimer * 0.02) > 0 ? 'red' : '#860dff') : 
            '#860dff';
        const accentColor = '#00ff00';
        const cockpitColor = player.isInvulnerable ? 
            (Math.sin(player.blinkTimer * 0.02) > 0 ? '#ff0000' : '#ffff00') : 
            '#00ff00';
        
        // Efeito de propulsão
        if (keys['ArrowLeft'] || keys['ArrowRight'] || keys['ArrowUp'] || keys['ArrowDown']) {
            const thrusterX = facingRight ? x - 15 : x + width + 15;
            const thrusterY = y + height/2;
            
            // Chamas do motor
            const gradient = ctx.createRadialGradient(
                thrusterX, thrusterY, 0,
                thrusterX, thrusterY, 20
            );
            gradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
            gradient.addColorStop(0.5, 'rgba(0, 150, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(0, 50, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(
                thrusterX, thrusterY,
                20, 10,
                facingRight ? 0 : Math.PI,
                0, Math.PI * 2
            );
            ctx.fill();
        }

        // Transformações para a direção
        ctx.translate(x + width/2, y + height/2);
        if (!facingRight) {
            ctx.scale(-1, 1);
        }
        ctx.translate(-width/2, -height/2);

        // Corpo principal da nave (formato retangular angular)
        ctx.fillStyle = shipColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width * 0.7, 0);
        ctx.lineTo(width, height * 0.3);
        ctx.lineTo(width * 0.8, height * 0.5);
        ctx.lineTo(width, height * 0.7);
        ctx.lineTo(width * 0.7, height);
        ctx.lineTo(0, height);
        ctx.lineTo(width * 0.2, height * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // Detalhes em verde neon
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        
        // Linhas estruturais
        ctx.beginPath();
        ctx.moveTo(width * 0.2, height * 0.5);
        ctx.lineTo(width * 0.7, height * 0.5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(width * 0.44, 0);
        ctx.lineTo(width * 0.44, height);
        ctx.stroke();
        
        // Cockpit (centro da nave)
        ctx.fillStyle = 'rgba(0, 20, 0, 0.7)';
        ctx.beginPath();
        ctx.ellipse(
            width * 0.45, height * 0.5,
            width * 0.15, height * 0.2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Vidro do cockpit
        const cockpitGradient = ctx.createRadialGradient(
            width * 0.45, height * 0.5, 0,
            width * 0.45, height * 0.5, width * 0.15
        );
        cockpitGradient.addColorStop(0, cockpitColor);
        cockpitGradient.addColorStop(0.7, 'rgba(0, 255, 0, 0.3)');
        cockpitGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = cockpitGradient;
        ctx.beginPath();
        ctx.ellipse(
            width * 0.45, height * 0.5,
            width * 0.15, height * 0.2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Detalhes de armas (laterais)
        ctx.fillStyle = accentColor;
        ctx.fillRect(width * 0.7, height * 0.2, width * 0.1, height * 0.1);
        ctx.fillRect(width * 0.7, height * 0.7, width * 0.1, height * 0.1);
        
        // Efeito de energia quando o tiro especial está pronto
        if (player.spreadShotReady) {
            const pulse = Math.sin(player.spreadShotPulse * 2) * 0.2 + 0.8;
            ctx.fillStyle = `rgba(77, 228, 255, ${pulse * 0.8})`;
            ctx.beginPath();
            ctx.moveTo(width, height * 0.3);
            ctx.lineTo(width * 0.8, height * 0.5);
            ctx.lineTo(width, height * 0.7);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
        return; // Sai da função após desenhar a skin STEALTH
    }

    const thrusterIntensity = Math.sin(gameTime * 0.01) * 0.3 + 0.7;
    const thrusterLength = 8 + Math.random() * 4;
    
    // Determinar cor da nave baseado no estado de imunidade
    let shipColor = '#00ff00';
    let cockpitColor = '#ffffff';
    let wingColor = '#00aa00';
    let noseColor = '#00cc00'; // Cor padrão do bico
    
    if (player.isInvulnerable) {
        // Efeito de piscar durante imunidade
        const blinkPhase = Math.sin(player.blinkTimer * 0.02) > 0;
        shipColor = blinkPhase ? '#ff0000' : '#ffff00';
        cockpitColor = blinkPhase ? '#ffcccc' : '#ffffcc';
        wingColor = blinkPhase ? '#aa0000' : '#aaaa00';
        noseColor = blinkPhase ? '#ff3300' : '#ffcc00'; // Cores alternadas para o bico
    }

    // Efeito visual quando o tiro de espalhamento está pronto
    if (player.spreadShotReady) {
        const pulseSize = Math.sin(player.spreadShotPulse) * 2 + 5; // Tamanho menor
        const pulseAlpha = Math.abs(Math.sin(player.spreadShotPulse * 2)) * 0.4 + 0.2; // Pulsação mais intensa
        
        ctx.fillStyle = `rgba(255, 100, 0, ${pulseAlpha})`; // Laranja mais vibrante
        
        if (facingRight) {
            // Efeito no bico direito da nave
            ctx.beginPath();
            ctx.arc(x + width + pulseSize/2, y + height/2, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Efeito de energia acumulando
            const gradient = ctx.createRadialGradient(
                x + width, y + height/2, 0,
                x + width, y + height/2, pulseSize * 1.5
            );
            gradient.addColorStop(0, `rgba(255, 150, 0, ${pulseAlpha * 0.7})`);
            gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x + width, y + height/2, pulseSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Efeito no bico esquerdo da nave
            ctx.beginPath();
            ctx.arc(x - pulseSize/2, y + height/2, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Efeito de energia acumulando
            const gradient = ctx.createRadialGradient(
                x, y + height/2, 0,
                x, y + height/2, pulseSize * 1.5
            );
            gradient.addColorStop(0, `rgba(255, 150, 0, ${pulseAlpha * 0.7})`);
            gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y + height/2, pulseSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    if (facingRight) {
        // Nave virada para a direita
        // Chamas do motor (lado esquerdo quando virado para direita)
        const gradient = ctx.createLinearGradient(x - thrusterLength, y, x, y);
        gradient.addColorStop(0, `rgba(255, 100, 0, ${thrusterIntensity})`);
        gradient.addColorStop(0.5, `rgba(255, 200, 0, ${thrusterIntensity * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${thrusterIntensity * 0.6})`);

        if (keys['ArrowRight'] || keys['ArrowUp'] || keys['ArrowDown']) {
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(x, y + height * 0.3);
            ctx.lineTo(x - thrusterLength, y + height * 0.5);
            ctx.lineTo(x, y + height * 0.7);
            ctx.closePath();
            ctx.fill();
        }

        // Corpo principal
        ctx.fillStyle = shipColor;
        ctx.fillRect(x, y + 5, width - 8, height - 10);
        
        // Bico da nave
        ctx.fillStyle = noseColor; // Usando a cor definida pelo estado de imunidade
        ctx.beginPath();
        ctx.moveTo(x + width - 8, y + 5);
        ctx.lineTo(x + width, y + height / 2);
        ctx.lineTo(x + width - 8, y + height - 5);
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = cockpitColor;
        ctx.fillRect(x + 8, y + 7, 8, height - 14);
        
        // Motores
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(x - 2, y + 3, 4, 4);
        ctx.fillRect(x - 2, y + height - 7, 4, 4);
        
        // Asas
        ctx.fillStyle = wingColor;
        ctx.fillRect(x + 5, y, 10, 3);
        ctx.fillRect(x + 5, y + height - 3, 10, 3);
    } else {
        // Nave virada para a esquerda
        // Chamas do motor (lado direito quando virado para esquerda)
        const gradient = ctx.createLinearGradient(x + width, y, x + width + thrusterLength, y);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${thrusterIntensity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(255, 200, 0, ${thrusterIntensity * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 100, 0, ${thrusterIntensity})`);

        if (keys['ArrowLeft'] || keys['ArrowUp'] || keys['ArrowDown']) {
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(x + width, y + height * 0.3);
            ctx.lineTo(x + width + thrusterLength, y + height * 0.5);
            ctx.lineTo(x + width, y + height * 0.7);
            ctx.closePath();
            ctx.fill();        
        }

        // Corpo principal
        ctx.fillStyle = shipColor;
        ctx.fillRect(x + 8, y + 5, width - 8, height - 10);
        
        // Bico da nave
        ctx.fillStyle = noseColor; // Usando a cor definida pelo estado de imunidade
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 5);
        ctx.lineTo(x, y + height / 2);
        ctx.lineTo(x + 8, y + height - 5);
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = cockpitColor;
        ctx.fillRect(x + 14, y + 7, 8, height - 14);
        
        // Motores
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(x + width - 2, y + 3, 4, 4);
        ctx.fillRect(x + width - 2, y + height - 7, 4, 4);
        
        // Asas
        ctx.fillStyle = wingColor;
        ctx.fillRect(x + 15, y, 10, 3);
        ctx.fillRect(x + 15, y + height - 3, 10, 3);
    }
    
    ctx.restore();
}

function createSpreadShot() {
    const baseX = player.facingRight ? player.x + player.width : player.x;
    const baseY = player.y + player.height / 2;
    
    // Cria 5 tiros em leque
    for (let i = -2; i <= 2; i++) {
        const angle = i * 0.15 * (player.facingRight ? 1 : -1);
        const speed = player.facingRight ? 7 : -7;
        
        player.spreadShots.push({
            x: baseX,
            y: baseY,
            width: 6,
            height: 6,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`, // Tons de laranja/amarelo
            life: 100 // Duração do tiro
        });
    }
    
    // Efeito de recuo
    player.x += player.facingRight ? -5 : 5;
    
    // Ativa cooldown
    player.spreadShotReady = false;
    player.lastSpreadShot = gameTime;
}

function createLaser() {
    const laserX = player.facingRight ? player.x + player.width : player.x - player.laserWidth;
    const laserY = player.y + player.height / 2 - player.laserHeight / 2;
    
    player.lasers.push({
        x: laserX,
        y: laserY,
        width: player.laserWidth,
        height: player.laserHeight,
        speed: player.facingRight ? player.laserSpeed : -player.laserSpeed,
        color: '#00ffff',
        alpha: 1.0,
        trail: [] // Para efeitos visuais
    });
}

function applyDropEffect(drop) {
    // Efeito visual comum
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 40,
            maxLife: 40,
            color: drop.color,
            size: Math.random() * 3 + 2
        });
    }
    
    // Efeitos específicos
    switch(drop.type) {
        case 'health':
            player.health = Math.min(player.maxHealth, player.health + drop.amount);
            break;
        case 'blackhole':
            // Teletransportar para posição aleatória
            const newX = Math.max(50, Math.min(WORLD_WIDTH - player.width - 50, Math.random() * WORLD_WIDTH));
            const newY = Math.max(50, Math.min(WORLD_HEIGHT - player.height - 50, Math.random() * WORLD_HEIGHT));
            
            // Efeito especial de teletransporte
            for (let i = 0; i < 50; i++) {
                particles.push({
                    x: player.x + player.width/2,
                    y: player.y + player.height/2,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 60,
                    maxLife: 60,
                    color: '#aa00ff',
                    size: Math.random() * 4 + 2
                });
            }
            
            player.x = newX;
            player.y = newY;
            
            // Ativar imunidade temporária após teletransporte
            player.isInvulnerable = true;
            player.invulnerableTimer = 1500; // 1.5 segundos de imunidade
            break;
        case 'forcefield':
            player.isForceFieldActive = true;
            player.forceFieldEndTime = gameTime + drop.duration;
            break;
        case 'timebomb':
            freezeEnemiesInRadius(drop.x + drop.width/2, drop.y + drop.height/2, drop.radius, drop.freezeDuration);
            break;
    }
}

function updateDrops() {
    for (let i = gameState.drops.length - 1; i >= 0; i--) {
        const drop = gameState.drops[i];
        
        // Atualizar animação
        drop.animationTime += 0.1;
        
        // Comportamentos diferentes por tipo
        switch(drop.type) {
            case 'health':
                // Movimento com bounce
                if (drop.move) {
                    drop.y += drop.vy;
                    drop.x += Math.sin(drop.animationTime) * 0.5; // Movimento lateral
                }
                break;
            case 'blackhole':
                // Pulsação do buraco negro
                drop.size = drop.maxSize * (0.8 + 0.2 * Math.sin(drop.animationTime * drop.pulseSpeed));
                break;
            case 'timebomb':
                // Pulsação da bomba de tempo
                drop.size = drop.maxSize * (0.8 + 0.2 * Math.sin(drop.animationTime * drop.pulseSpeed));
                drop.rotation += drop.rotationSpeed;
                break;
        }
        
        // Verificar colisão com o jogador
        if (!drop.collected && 
            drop.x < player.x + player.width &&
            drop.x + drop.width > player.x &&
            drop.y < player.y + player.height &&
            drop.y + drop.height > player.y) {
            
            drop.collected = true;
            applyDropEffect(drop);
        }
        
        // Remover se coletado, saiu da tela ou tempo esgotado
        const shouldRemove = drop.collected || (drop.move && drop.y > WORLD_HEIGHT);
        
        if (shouldRemove) {
            gameState.drops.splice(i, 1);
        }
    }
}

function freezeEnemiesInRadius(x, y, radius, duration) {
    // Efeito de onda expansiva
    gameState.timeWave = {
        x: x,
        y: y,
        radius: 5,
        maxRadius: radius,
        growthSpeed: radius / 10, // Cresce até o raio máximo em 10 frames
        color: 'rgba(100, 200, 255, 0.7)',
        life: 60,
        startTime: gameTime
    };

    // Campo de força estático durante a duração
    const newTimeField = {
        x: x,
        y: y,
        radius: radius,
        color: 'rgba(100, 200, 255, 0.2)',
        endTime: gameTime + duration,
        segments: [],
        frozenAliens: new Set(),
        freezeDelay: 2000,
        alienTimers: new Map()
    };

    // Criar segmentos para o campo de força (para efeito de distorção)
    for (let i = 0; i < 36; i++) {
        newTimeField.segments.push({
            angle: (i / 36) * Math.PI * 2,
            length: radius * (0.8 + Math.random() * 0.4),
            speed: 0.5 + Math.random() * 0.5,
            offset: Math.random() * Math.PI * 2
        });
    }

    gameState.timeFields.push(newTimeField);

    // Efeito visual da explosão de tempo
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 60,
            maxLife: 60,
            color: `hsl(${Math.random() * 60 + 200}, 100%, 80%)`,
            size: Math.random() * 4 + 2
        });
    }
    
    // Congelar inimigos no raio
    aliens.forEach(alien => {
        const dx = alien.x + alien.width/2 - x;
        const dy = alien.y + alien.height/2 - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius) {
            // Salvar a velocidade atual
            const originalSpeed = alien.speed;
            const originalVx = alien.vx;
            const originalVy = alien.vy;
            const originalAttackRate = alien.attackRate;
            
            // Congelar (zerar velocidade e taxa de ataque)
            alien.speed = 0;
            alien.vx = 0;
            alien.vy = 0;
            alien.attackRate = 0;
            alien.isFrozen = true;
            
            // Criar partículas de gelo ao redor do alien
            for (let i = 0; i < 10; i++) {
                particles.push({
                    x: alien.x + alien.width/2,
                    y: alien.y + alien.height/2,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 80,
                    maxLife: 80,
                    color: '#aaddff',
                    size: Math.random() * 3 + 1
                });
            }
            
            // Agendar descongelamento após a duração
            setTimeout(() => {
                if (alien.speed === 0) { // Só restaurar se ainda estiver congelado
                    alien.speed = originalSpeed;
                    alien.vx = originalVx;
                    alien.vy = originalVy;
                    alien.attackRate = originalAttackRate;
                    alien.isFrozen = false;
                    
                    // Efeito de descongelamento
                    for (let i = 0; i < 10; i++) {
                        particles.push({
                            x: alien.x + alien.width/2,
                            y: alien.y + alien.height/2,
                            vx: (Math.random() - 0.5) * 3,
                            vy: (Math.random() - 0.5) * 3,
                            life: 40,
                            maxLife: 40,
                            color: '#ffffff',
                            size: Math.random() * 2 + 1
                        });
                    }
                }
            }, duration);
        }
    });
}

function checkContinuousFreeze(field) {
    const now = gameTime;
    
    aliens.forEach(alien => {
        const dx = alien.x + alien.width/2 - field.x;
        const dy = alien.y + alien.height/2 - field.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < field.radius && !field.frozenAliens.has(alien)) {
            if (!field.alienTimers.has(alien)) {
                field.alienTimers.set(alien, now);
            } else if (now - field.alienTimers.get(alien) > field.freezeDelay) {
                freezeAlien(alien, field);
            }
        } else {
            field.alienTimers.delete(alien);
        }
    });
}

function freezeAlien(alien, field) {
    // Marca como congelado
    field.frozenAliens.add(alien);
    field.alienTimers.delete(alien);
    
    // Salva estado original
    const originalSpeed = alien.speed;
    const originalVx = alien.vx;
    const originalVy = alien.vy;
    const originalAttackRate = alien.attackRate;
    
    // Congela o alien
    alien.speed = 0;
    alien.vx = 0;
    alien.vy = 0;
    alien.attackRate = 0;
    alien.isFrozen = true;
    
    // Efeito visual
    createSmallExplosion(alien.x + alien.width/2, alien.y + alien.height/2);
    
    // Agenda descongelamento
    setTimeout(() => {
        if (alien.speed === 0) { // Só restaurar se ainda estiver congelado
            alien.speed = originalSpeed;
            alien.vx = originalVx;
            alien.vy = originalVy;
            alien.attackRate = originalAttackRate;
            alien.isFrozen = false;
            field.frozenAliens.delete(alien);
            
            createSmallExplosion(alien.x + alien.width/2, alien.y + alien.height/2);
        }
    }, field.endTime - gameTime); // Descongela quando o campo acabar
}

function updateTimeFields() { // Renomeada para plural
    for (let i = gameState.timeFields.length - 1; i >= 0; i--) {
        const field = gameState.timeFields[i];
        
        if (gameTime > field.endTime) {
            // Descongelar aliens deste campo específico
            field.frozenAliens.forEach(alien => {
                // (O timeout já cuida do descongelamento)
            });
            gameState.timeFields.splice(i, 1);
            continue;
        }
        
        checkContinuousFreeze(field); // Passar o campo atual como parâmetro
    }
}

function updateAllies() {
    // Atualizar cooldown
    if (!player.allies.ready) {
        if (gameTime - player.allies.lastUse > player.allies.cooldown) {
            player.allies.ready = true;
            player.allies.pulse = 0;
        }
    }
    
    // Pulsação quando pronto
    if (player.allies.ready) {
        player.allies.pulse = (player.allies.pulse + 0.05) % (Math.PI * 2);
    }
    
    // Atualizar posição das naves aliadas
    for (let i = player.allies.ships.length - 1; i >= 0; i--) {
        const ally = player.allies.ships[i];
        
        // Mover para a direita
        ally.x += ally.speed;
        
        // Adicionar posição ao rastro (para efeito visual)
        ally.trail.push({ x: ally.x, y: ally.y + ally.height/2 });
        if (ally.trail.length > 15) {
            ally.trail.shift();
        }
        
        // Remover se sair da tela
        if (ally.x > WORLD_WIDTH + 50) {
            player.allies.ships.splice(i, 1);
        }
    }
}

function updatePlayer() {
    if (gameState.gameOver) return;

    // Atualiza Campo de Força
    if (player.isForceFieldActive && gameTime > player.forceFieldEndTime) {
        player.isForceFieldActive = false;
        player.forceFieldParticles = []; // Limpa partículas
    }

    // Gera partículas do efeito (enquanto ativo)
    if (player.isForceFieldActive && Math.random() < 0.3) {
        player.forceFieldParticles.push({
            x: player.x + player.width/2 + (Math.random() - 0.5) * 50,
            y: player.y + player.height/2 + (Math.random() - 0.5) * 50,
            size: Math.random() * 5 + 3,
            life: 30
        });
    }

    // Atualiza partículas
    player.forceFieldParticles = player.forceFieldParticles.filter(p => {
        p.life--;
        return p.life > 0;
    });
    
    // Atualizar temporizador de imunidade
    if (player.isInvulnerable) {
        player.invulnerableTimer -= 16; // Aproximadamente 60 FPS
        player.blinkTimer += 16;
        
        if (player.invulnerableTimer <= 0) {
            player.isInvulnerable = false;
            player.invulnerableTimer = 0;
            player.blinkTimer = 0;
        }
    }
    
    // Movimento
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
        player.facingRight = false;
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
        player.facingRight = true;;
    }
    if (keys['ArrowUp']) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown']) {
        player.y += player.speed;
    }
    
    // Limitar movimento do player ao mundo
    player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));
    player.y = Math.max(0, Math.min(WORLD_HEIGHT - player.height, player.y));
    
    // Tiro
    if (keys['z'] && gameTime - player.lastShot > player.shootDelay) {
        const bulletSpeed = player.facingRight ? 8 : -8;
        const bulletX = player.facingRight ? player.x + player.width : player.x - 8;
        
        player.bullets.push({
            x: bulletX,
            y: player.y + player.height / 2,
            width: 8,
            height: 3,
            speed: bulletSpeed,
            color: '#00ffff'
        });
        player.lastShot = gameTime;
    }
    
    // Atualizar balas
    player.bullets = player.bullets.filter(bullet => {
        bullet.x += bullet.speed;
        return bullet.x > -50 && bullet.x < WORLD_WIDTH + 50;
    });

    // Tiro laser com X
    if (keys['x'] && gameTime - player.lastLaserShot > player.laserDelay) {
        createLaser();
        player.lastLaserShot = gameTime;
    }

    if (keys['t'] && player.turboReady && !player.turboActive) {
        activateTurbo();
    }

    if (keys['b'] && player.nuclearBomb.ready) {
        activateNuclearBomb();
    }

    if (keys['a'] && player.allies.ready) {
        activateAllies();
    }

    if (keys['s'] && (!player.lastSkinSwitch || gameTime - player.lastSkinSwitch > 500)) {
        switchShipSkin();
        player.lastSkinSwitch = gameTime;
    }

    if (keys['v'] && player.shield.ready && !player.shield.active) {
        activateShield();
    }

    if (keys['d'] && player.drone.ready) {
        activateDrone();
    }

    updateTurbo();
    
    // Atualizar lasers
    player.lasers = player.lasers.filter(laser => {
        laser.x += laser.speed;
        
        // Adiciona posição atual ao rastro (para efeito visual)
        laser.trail.push({ x: laser.x, y: laser.y + laser.height/2 });
        if (laser.trail.length > 10) {
            laser.trail.shift();
        }
        
        return laser.x > -50 && laser.x < WORLD_WIDTH + 50;
    });

    // Atualizar cooldown do tiro de espalhamento
    if (!player.spreadShotReady && gameTime - player.lastSpreadShot > player.spreadShotCooldown) {
        player.spreadShotReady = true;
        player.spreadShotPulse = 0;
    }
    
    // Pulsação quando pronto
    if (player.spreadShotReady) {
        player.spreadShotPulse = (player.spreadShotPulse + 0.05) % (Math.PI * 2);
    }
    
    // Disparo de espalhamento com C
    if (keys['c'] && player.spreadShotReady) {
        createSpreadShot();
    }
    
    // Atualizar tiros de espalhamento
    player.spreadShots = player.spreadShots.filter(shot => {
        shot.x += shot.vx;
        shot.y += shot.vy;
        shot.life--;
        
        // Efeito de diminuição
        shot.width = Math.max(3, shot.width * 0.99);
        shot.height = Math.max(3, shot.height * 0.99);
        
        return shot.life > 0 && 
               shot.x > -50 && shot.x < WORLD_WIDTH + 50 &&
               shot.y > -50 && shot.y < WORLD_HEIGHT + 50;
    });
}

function updateAliens() {
    const now = gameTime;

    for (let i = aliens.length - 1; i >= 0; i--) {
        const alien = aliens[i];

        // Remover filhotes velhos
        if (alien.type === 'offspring' && now - alien.spawnTime > alien.lifeTime) {
            createSmallExplosion(alien.x + alien.width/2, alien.y + alien.height/2);
            aliens.splice(i, 1);
            continue; // Pular para o próximo alien
        }
    }
    
    aliens.forEach(alien => {
        // Atualizar animação
        alien.animationTime += 0.1;

        // Atualizar imunidade
        if (alien.isInvulnerable) {
            alien.invulnerableTimer -= 16; // Aproximadamente 60 FPS
            alien.blinkTimer += 16;
            
            if (alien.invulnerableTimer <= 0) {
                alien.isInvulnerable = false;
                alien.invulnerableTimer = 0;
                alien.blinkTimer = 0;
            }
        }

        if (alien.type === 'hunter') {
            const dx = player.x - alien.x;
            const dy = player.y - alien.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Se o jogador estiver no alcance de detecção
            if (distance < alien.detectionRange) {
                // Calcular ângulo para o jogador
                const angle = Math.atan2(dy, dx);
                
                // Mover-se na direção do jogador com velocidade aumentada
                alien.vx = Math.cos(angle) * alien.pursuitSpeed;
                alien.vy = Math.sin(angle) * alien.pursuitSpeed;
                
                // Atacar mais frequentemente quando perseguindo
                alien.attackRate = 0.006;
            } else {
                // Comportamento normal quando o jogador está longe
                alien.attackRate = 0.005;
            }
        }
        
        // Mudar direção ocasionalmente
        if (now - alien.lastDirectionChange > 2000 + Math.random() * 3000) {
            alien.vx = (Math.random() - 0.5) * alien.speed * 2;
            alien.vy = (Math.random() - 0.5) * alien.speed * 2;
            alien.lastDirectionChange = now;
        }
        
        // Atualizar direção baseada no movimento
        if (alien.vx > 0) {
            alien.facingRight = true;
        } else if (alien.vx < 0) {
            alien.facingRight = false;
        }
        
        // Mover alien
        alien.x += alien.vx;
        alien.y += alien.vy;
        
        // Fazer bounce nas bordas
        if (alien.x <= 0 || alien.x >= WORLD_WIDTH - alien.width) {
            alien.vx = -alien.vx;
            alien.facingRight = !alien.facingRight;
        }
        if (alien.y <= 0 || alien.y >= WORLD_HEIGHT - alien.height) {
            alien.vy = -alien.vy;
        }
        
        // Manter dentro dos limites
        alien.x = Math.max(0, Math.min(WORLD_WIDTH - alien.width, alien.x));
        alien.y = Math.max(0, Math.min(WORLD_HEIGHT - alien.height, alien.y));
        
        // Sistema de ataque
        alienAttack(alien);
        alienHeal(alien);
    });
    
    // Atualizar balas dos aliens
    updateAlienBullets();
}

function alienHeal(alien) {
    if (alien.type === 'medic') {
        // Primeiro verifica se pode curar aliados
        const now = gameTime;
        if (now - alien.lastHealTime > alien.healCooldown) {
            // Procura por aliados feridos próximos
            for (let i = 0; i < aliens.length; i++) {
                const otherAlien = aliens[i];
                
                // Não cura a si mesmo e só cura aliados feridos
                if (otherAlien !== alien && otherAlien.health < otherAlien.maxHealth) {
                    const dx = otherAlien.x - alien.x;
                    const dy = otherAlien.y - alien.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < alien.healRange) {
                        // Cura o aliado
                        otherAlien.health = Math.min(otherAlien.maxHealth, otherAlien.health + alien.healAmount);
                        alien.lastHealTime = now;
                        
                        // Efeito visual de cura
                        createHealEffect(
                            otherAlien.x + otherAlien.width/2,
                            otherAlien.y + otherAlien.height/2
                        );
                        
                        // Somente cura um aliado por vez
                        break;
                    }
                }
            }
        }
    }
}

function alienAttack(alien) {
    // Comportamento especial da mãe alien
    if (alien.type === 'mother') {
        const now = gameTime;
        
        if (now - alien.lastSpawn > alien.spawnCooldown && Math.random() < alien.spawnRate) {
            console.log("Spawning offspring!");
            spawnOffspring(alien);
            alien.lastSpawn = now;
        }
    }
    // Verificar se deve atacar (baseado na taxa de ataque)
    if (Math.random() < alien.attackRate) {
        const distanceToPlayer = Math.sqrt(
            Math.pow(player.x - alien.x, 2) + Math.pow(player.y - alien.y, 2)
        );
        
        // Só ataca se o player estiver em range razoável
        if (distanceToPlayer < 400) {
            if (alien.type === 'disco') {
                // Disco Alien: Atira em todas as direções (8 tiros)
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    alienBullets.push({
                        x: alien.x + alien.width / 2,
                        y: alien.y + alien.height / 2,
                        vx: Math.cos(angle) * alien.bulletSpeed,
                        vy: Math.sin(angle) * alien.bulletSpeed,
                        width: 6,
                        height: 6,
                        color: `hsl(${i * 45}, 100%, 50%)`, // Cores do arco-íris
                        type: 'disco',
                        damage: alien.damage,
                        life: 100 // Duração do tiro
                    });
                }
            } else if (alien.type === 'scout') {
                // Scout: Tiro simples na direção do player
                const angle = Math.atan2(player.y - alien.y, player.x - alien.x);
                alienBullets.push({
                    x: alien.x + alien.width / 2,
                    y: alien.y + alien.height / 2,
                    vx: Math.cos(angle) * alien.bulletSpeed,
                    vy: Math.sin(angle) * alien.bulletSpeed,
                    width: 4,
                    height: 4,
                    color: '#ff4444',
                    type: 'simple',
                    damage: alien.damage
                });
                
            } else if (alien.type === 'warrior') {
                // Warrior: Disparo triplo em leque
                const baseAngle = Math.atan2(player.y - alien.y, player.x - alien.x);
                for (let i = -1; i <= 1; i++) {
                    const angle = baseAngle + (i * 0.3);
                    alienBullets.push({
                        x: alien.x + alien.width / 2,
                        y: alien.y + alien.height / 2,
                        vx: Math.cos(angle) * alien.bulletSpeed,
                        vy: Math.sin(angle) * alien.bulletSpeed,
                        width: 6,
                        height: 6,
                        color: '#ff6600',
                        type: 'triple',
                        damage: alien.damage
                    });
                }
                
            } else if (alien.type === 'fast') {
                // Fast: Rajada rápida (3 tiros consecutivos)
                const angle = Math.atan2(player.y - alien.y, player.x - alien.x);
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        alienBullets.push({
                            x: alien.x + alien.width / 2,
                            y: alien.y + alien.height / 2,
                            vx: Math.cos(angle) * alien.bulletSpeed,
                            vy: Math.sin(angle) * alien.bulletSpeed,
                            width: 3,
                            height: 8,
                            color: '#ffff00',
                            type: 'burst',
                            damage: alien.damage
                        });
                    }, i * 100);
                }
            } else if (alien.type === 'tank') {
                // Tank: Tiro lento e poderoso
                const angle = Math.atan2(player.y - alien.y, player.x - alien.x);
                alienBullets.push({
                    x: alien.x + alien.width / 2,
                    y: alien.y + alien.height / 2,
                    vx: Math.cos(angle) * alien.bulletSpeed,
                    vy: Math.sin(angle) * alien.bulletSpeed,
                    width: 10,  // Tiro maior
                    height: 10,
                    color: '#ff0000',
                    type: 'tank',
                    damage: alien.damage * 1.5  // Dano aumentado
                });
            } else if (alien.type === 'hunter') {
                // Hunter: Disparo teleguiado
                const angle = Math.atan2(player.y - alien.y, player.x - alien.x);
                
                alienBullets.push({
                    x: alien.x + alien.width / 2,
                    y: alien.y + alien.height / 2,
                    vx: Math.cos(angle) * alien.bulletSpeed * (Math.random() * (1 - 0.4) + 0.4),
                    vy: Math.sin(angle) * alien.bulletSpeed * (Math.random() * (1 - 0.4) + 0.4),
                    width: 6,
                    height: 6,
                    color: '#ff00ff',
                    type: 'homing',
                    damage: alien.damage,
                    targetX: player.x + player.width/2, // Alvo inicial
                    targetY: player.y + player.height/2,
                    life: 100 // Duração do tiro
                });
            } else if (alien.type === 'eye') {
                // Eye Alien: Atira nas 4 direções cardeais
                const directions = [
                    { vx: 0, vy: -alien.bulletSpeed }, // Norte
                    { vx: alien.bulletSpeed, vy: 0 },  // Leste
                    { vx: 0, vy: alien.bulletSpeed },  // Sul
                    { vx: -alien.bulletSpeed, vy: 0 }  // Oeste
                ];
                
                directions.forEach(dir => {
                    alienBullets.push({
                        x: alien.x + alien.width / 2,
                        y: alien.y + alien.height / 2,
                        vx: dir.vx,
                        vy: dir.vy,
                        width: 6,
                        height: 6,
                        color: '#00ff88', // Cor verde-água para combinar com o alien
                        type: 'eye',
                        damage: alien.damage,
                        life: 100 // Duração do tiro
                    });
                });
            } else if (alien.type === 'medic') {
                // Médico: Tiro simples na direção do player
                const angle = Math.atan2(player.y - alien.y, player.x - alien.x);
                alienBullets.push({
                    x: alien.x + alien.width / 2,
                    y: alien.y + alien.height / 2,
                    vx: Math.cos(angle) * alien.bulletSpeed,
                    vy: Math.sin(angle) * alien.bulletSpeed,
                    width: 6,
                    height: 6,
                    color: alien.bulletColor || '#00aaff', // Azul claro para diferenciar
                    type: 'medic',
                    damage: alien.damage
                });
            } else if (alien.type === 'offspring') {
                // Offspring: Atira em padrão de enxame (3 tiros em pequeno leque)
                const baseAngle = Math.atan2(player.y - alien.y, player.x - alien.x);
                
                for (let i = -1; i <= 1; i++) {
                    const angle = baseAngle + (i * 0.2); // Pequeno ângulo entre tiros
                    
                    alienBullets.push({
                        x: alien.x + alien.width / 2,
                        y: alien.y + alien.height / 2,
                        vx: Math.cos(angle) * alien.bulletSpeed,
                        vy: Math.sin(angle) * alien.bulletSpeed,
                        width: 4,
                        height: 4,
                        color: alien.bulletColor || '#ff00ff',
                        type: alien.bulletType || 'swarm',
                        damage: alien.damage,
                        life: 80 // Duração do tiro
                    });
                }
            }
        }
    }
}

function spawnOffspring(motherAlien) {
    const type = offspringTypes[0]; // Usa o primeiro tipo de filhote

    const currentOffspring = aliens.filter(a => a.type === 'offspring').length;
    const maxOffspring = 8; // Limite máximo
    
    if (currentOffspring >= maxOffspring) {
        return; // Não spawna mais filhotes
    }
    
    for (let i = 0; i < 2; i++) { // Spawna 2 filhotes de cada vez
        aliens.push({
            x: motherAlien.x + (Math.random() - 0.5) * 30,
            y: motherAlien.y + (Math.random() - 0.5) * 30,
            width: type.width,
            height: type.height,
            color: type.color,
            speed: type.speed,
            points: type.points,
            type: type.type,
            attackRate: type.attackRate,
            bulletSpeed: type.bulletSpeed,
            damage: type.damage,
            vx: (Math.random() - 0.5) * type.speed,
            vy: (Math.random() - 0.5) * type.speed,
            lastDirectionChange: 0,
            facingRight: Math.random() > 0.5,
            animationTime: Math.random() * 100,
            lastAttack: 0,
            health: type.health,
            maxHealth: type.health,
            spawnTime: gameTime,  // Marca quando foi criado
            lifeTime: type.lifeTime  // Tempo máximo de vida
        });
    }
    
    // Efeito visual
    createSpawnEffect(motherAlien.x + motherAlien.width/2, motherAlien.y + motherAlien.height/2);
}

function createSpawnEffect(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 40 + Math.random() * 20,
            maxLife: 60,
            color: `hsl(${Math.random() * 60 + 280}, 100%, 50%)`, // Tons de roxo
            size: Math.random() * 3 + 2
        });
    }
}

function createHealEffect(x, y) {
    // Partículas verdes de cura
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            color: `hsl(${100 + Math.random() * 40}, 100%, 50%)`,
            size: Math.random() * 3 + 2
        });
    }
}

function updateAlienBullets() {
    for (let i = alienBullets.length - 1; i >= 0; i--) {
        const bullet = alienBullets[i];

        if (bullet.type === 'swarm') {
            // Movimento básico
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            // Adiciona pequenas variações no movimento (efeito de enxame)
            if (Math.random() < 0.1) {
                bullet.vx += (Math.random() - 0.5) * 0.3;
                bullet.vy += (Math.random() - 0.5) * 0.3;
            }
            
            // Remove quando a vida acaba
            if (bullet.life <= 0) {
                alienBullets.splice(i, 1);
            }
        }

        if (bullet.type === 'eye') {
            // Tiros do eye se movem em linha reta sem alteração
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;

            // Efeito de rastro
            if (!bullet.trail) bullet.trail = [];
            bullet.trail.push({ x: bullet.x, y: bullet.y });
            if (bullet.trail.length > 10) bullet.trail.shift();

            // Remove quando a vida acaba
            if (bullet.life <= 0) {
                alienBullets.splice(i, 1);
            }
        }

        if (bullet.type === 'disco') {
            // Efeito de espiral para tiros do Disco Alien
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            // Adiciona efeito de rastro colorido
            if (!bullet.trail) bullet.trail = [];
            bullet.trail.push({
                x: bullet.x,
                y: bullet.y,
                color: bullet.color
            });
            
            if (bullet.trail.length > 10) bullet.trail.shift();
            
            // Remove quando a vida acaba
            if (bullet.life <= 0) {
                alienBullets.splice(i, 1);
            }
        }
        if (bullet.type === 'homing') {
            // Atualizar alvo para a posição atual do player
            bullet.targetX = player.x + player.width/2;
            bullet.targetY = player.y + player.height/2;
            
            // Calcular direção para o alvo
            const dx = bullet.targetX - bullet.x;
            const dy = bullet.targetY - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Ajustar gradualmente a direção
            if (distance > 0) {
                const desiredAngle = Math.atan2(dy, dx);
                const currentAngle = Math.atan2(bullet.vy, bullet.vx);
                
                // Suavizar a mudança de direção
                let newAngle = currentAngle + (desiredAngle - currentAngle) * 0.1;
                const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                
                bullet.vx = Math.cos(newAngle) * speed;
                bullet.vy = Math.sin(newAngle) * speed;
            }
            
            bullet.life--;
        }
        
        // Mover bala
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Remover balas que saíram da tela
        if (bullet.x < -50 || bullet.x > WORLD_WIDTH + 50 || 
            bullet.y < -50 || bullet.y > WORLD_HEIGHT + 50) {
            alienBullets.splice(i, 1);
        }
    }
}

function isAlienVisible(alien) {
    const cameraLeft = gameState.camera.x;
    const cameraRight = gameState.camera.x + canvas.width;
    return (
        alien.x + alien.width >= cameraLeft && 
        alien.x <= cameraRight
    );
}

function checkBulletAlienCollision(bullet, alien) {
    return bullet.x < alien.x + alien.width &&
           bullet.x + bullet.width > alien.x &&
           bullet.y < alien.y + alien.height &&
           bullet.y + bullet.height > alien.y;
}

function checkCollisions() {
    // Balas do player vs Aliens
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        
        for (let j = aliens.length - 1; j >= 0; j--) {
            const alien = aliens[j];
            
            if (bullet.x < alien.x + alien.width &&
                bullet.x + bullet.width > alien.x &&
                bullet.y < alien.y + alien.height &&
                bullet.y + bullet.height > alien.y) {
                
                if (isAlienVisible(alien) && !alien.isInvulnerable) {
                    alien.health--;
                    
                    // Remove a bala
                    player.bullets.splice(i, 1);
                    
                    // Se saúde chegar a zero, destrói o alien
                    if (alien.health <= 0) {
                        createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
                        aliens.splice(j, 1);
                        enemyDestroyed(alien.points);
                        gameState.score += alien.points;
                        const drop = createDrop(alien.x + alien.width/2, alien.y + alien.height/2);
                        if (drop) {
                            gameState.drops.push(drop);
                        }
                    } else {
                        // Efeito de dano (piscar)
                        createSmallExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
                        
                        // Ativar imunidade se o alien tiver vida > 1 e invulnerableDuration > 0
                        if (alien.maxHealth > 1 && alien.invulnerableDuration > 0) {
                            alien.isInvulnerable = true;
                            alien.invulnerableTimer = alien.invulnerableDuration;
                            alien.blinkTimer = 0;
                        }
                    }
                }
                
                break;
            }
        }
    }
    
    // Balas dos aliens vs Player
    for (let i = alienBullets.length - 1; i >= 0; i--) {
        const bullet = alienBullets[i];
        
        // Verifica colisão com o player ou com o escudo
        const playerHit = bullet.x < player.x + player.width &&
                         bullet.x + bullet.width > player.x &&
                         bullet.y < player.y + player.height &&
                         bullet.y + bullet.height > player.y;
        
        // Verifica colisão com o escudo (se estiver ativo)
        const shieldHit = player.shield.active && 
                         Math.sqrt(
                             Math.pow(bullet.x + bullet.width/2 - (player.x + player.width/2), 2) + 
                             Math.pow(bullet.y + bullet.height/2 - (player.y + player.height/2), 2)
                         ) < player.shield.radius;
        
        if (!player.isInvulnerable && !player.isForceFieldActive && (playerHit || shieldHit)) {
            // Criar explosão
            createExplosion(bullet.x, bullet.y);
            
            // Remover bala
            alienBullets.splice(i, 1);
            
            if (player.shield.active) {
                // Se o escudo está ativo, reduz a força do escudo em vez da vida do jogador
                player.shield.strength -= bullet.damage * 0.5; // Escudo absorve 50% do dano
                
                // Verificar se o escudo foi destruído
                if (player.shield.strength <= 0) {
                    player.shield.active = false;
                    player.shield.strength = 0;
                    player.shield.ready = false;
                    player.shield.lastUse = gameTime; // inicia o cooldown a partir do momento em que o escudo quebra
                    createBigExplosion(player.x + player.width/2, player.y + player.height/2);
                } else {
                    // Efeito visual quando o escudo é atingido
                    createSmallExplosion(bullet.x, bullet.y);
                }
            } else if (playerHit) {
                // Se não há escudo e o tiro acertou o jogador
                player.health -= bullet.damage;
                
                // Verificar se a vida acabou
                if (player.health <= 0) {
                    player.health = 0;
                    gameState.lives--;
                    
                    // Reposicionar player e resetar vida
                    player.x = 100;
                    player.y = 300;
                    player.health = player.maxHealth;
                    
                    // Ativar imunidade
                    player.isInvulnerable = true;
                    player.invulnerableTimer = player.invulnerableDuration;
                    
                    if (gameState.lives <= 0) {
                        musicPlayer.stop();
                        gameState.gameOver = true;
                        deactivateControls();
                    }
                } else {
                    // Ativar imunidade temporária mesmo sem perder vida
                    player.isInvulnerable = true;
                    player.invulnerableTimer = player.invulnerableDuration;
                }
            }
            
            break;
        }
    }
    
    // Player vs Aliens (colisão direta)
    for (let i = aliens.length - 1; i >= 0; i--) {
        const alien = aliens[i];
        
        const playerHit = player.x < alien.x + alien.width &&
                         player.x + player.width > alien.x &&
                         player.y < alien.y + alien.height &&
                         player.y + player.height > alien.y;
        
        const shieldHit = player.shield.active && checkShieldCollision(alien);
        
        if (!player.isInvulnerable && !player.isForceFieldActive && (playerHit || shieldHit)) {
            createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
            
            if (player.shield.active) {
                if (!alien.isInvulnerable) {
                    // Efeito visual de impacto no escudo (descomente quando pronto)
                    createShieldImpact(alien.x + alien.width/2, alien.y + alien.height/2);
                    
                    // Empurrar o alien
                    const dx = alien.x - player.x;
                    const dy = alien.y - player.y;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    if (distance > 0) {
                        alien.vx = (dx / distance) * 8;
                        alien.vy = (dy / distance) * 8;
                    }
                    
                    // Dano ao escudo
                    const damage = alien.type === 'tank' ? 30 : 20;
                    player.shield.strength -= damage;
                    
                    if (player.shield.strength <= 0) {
                        player.shield.active = false;
                        player.shield.strength = 0;
                        player.shield.ready = false;
                        player.shield.lastUse = gameTime;
                        createBigExplosion(player.x + player.width/2, player.y + player.height/2);
                    }
                    
                    // Aplica dano ao alien usando a função auxiliar
                    applyAlienDamage(alien, i);
                }
                break;
            }
            else if (playerHit) {
                player.health -= alien.type === 'tank' ? 60 : 40;
                
                // Aplica dano ao alien usando a mesma função auxiliar
                applyAlienDamage(alien, i);
                
                if (player.health <= 0) {
                    player.health = 0;
                    gameState.lives--;
                    player.x = 100;
                    player.y = 300;
                    player.health = player.maxHealth;
                    player.isInvulnerable = true;
                    player.invulnerableTimer = player.invulnerableDuration;
                    
                    if (gameState.lives <= 0) {
                        musicPlayer.stop();
                        gameState.gameOver = true;
                        deactivateControls();
                    }
                } else {
                    player.isInvulnerable = true;
                    player.invulnerableTimer = player.invulnerableDuration;
                }
                break;
            }
        }
    }

    // Lasers do player vs Aliens
    for (let i = player.lasers.length - 1; i >= 0; i--) {
        const laser = player.lasers[i];
        
        for (let j = aliens.length - 1; j >= 0; j--) {
            const alien = aliens[j];
            
            if (laser.x < alien.x + alien.width &&
                laser.x + laser.width > alien.x &&
                laser.y < alien.y + alien.height &&
                laser.y + laser.height > alien.y) {
                
                if (isAlienVisible(alien) && !alien.isInvulnerable) {
                    alien.health--;
                    
                    // Remove a bala
                    player.bullets.splice(i, 1);
                    
                    // Se saúde chegar a zero, destrói o alien
                    if (alien.health <= 0) {
                        createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
                        aliens.splice(j, 1);
                        enemyDestroyed(alien.points);
                        gameState.score += alien.points;
                        const drop = createDrop(alien.x + alien.width/2, alien.y + alien.height/2);
                        if (drop) {
                            gameState.drops.push(drop);
                        }
                    } else {
                        // Efeito de dano (piscar)
                        createSmallExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
                        
                        // Ativar imunidade se o alien tiver vida > 1 e invulnerableDuration > 0
                        if (alien.maxHealth > 1 && alien.invulnerableDuration > 0) {
                            alien.isInvulnerable = true;
                            alien.invulnerableTimer = alien.invulnerableDuration;
                            alien.blinkTimer = 0;
                        }
                    }
                    break;
                }
            }
        }
    }

    // Tiros de espalhamento vs Aliens
    for (let i = player.spreadShots.length - 1; i >= 0; i--) {
        const shot = player.spreadShots[i];
        
        for (let j = aliens.length - 1; j >= 0; j--) {
            const alien = aliens[j];
            
            if (shot.x < alien.x + alien.width &&
                shot.x + shot.width > alien.x &&
                shot.y < alien.y + alien.height &&
                shot.y + shot.height > alien.y) {
                
                if (isAlienVisible(alien) && !alien.isInvulnerable) {
                    alien.health--;
                    
                    // Remove a bala
                    player.bullets.splice(i, 1);
                    
                    // Se saúde chegar a zero, destrói o alien
                    if (alien.health <= 0) {
                        createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
                        aliens.splice(j, 1);
                        enemyDestroyed(alien.points);
                        gameState.score += alien.points;
                        const drop = createDrop(alien.x + alien.width/2, alien.y + alien.height/2);
                        if (drop) {
                            gameState.drops.push(drop);
                        }
                    } else {
                        // Efeito de dano (piscar)
                        createSmallExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
                        
                        // Ativar imunidade se o alien tiver vida > 1 e invulnerableDuration > 0
                        if (alien.maxHealth > 1 && alien.invulnerableDuration > 0) {
                            alien.isInvulnerable = true;
                            alien.invulnerableTimer = alien.invulnerableDuration;
                            alien.blinkTimer = 0;
                        }
                    }
                    break;
                }
            }
        }
    }

    // Aliados vs Aliens
    for (let i = player.allies.ships.length - 1; i >= 0; i--) {
        const ally = player.allies.ships[i];
        
        for (let j = aliens.length - 1; j >= 0; j--) {
            const alien = aliens[j];
            
            // Verifica colisão entre aliado e alien
            if (ally.x < alien.x + alien.width &&
                ally.x + ally.width > alien.x &&
                ally.y < alien.y + alien.height &&
                ally.y + ally.height > alien.y) {
                
                if (!alien.isInvulnerable) {
                    alien.health -= player.allies.damage;
                    
                    // Se saúde chegar a zero, destrói o alien
                    if (alien.health <= 0) {
                        createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
                        aliens.splice(j, 1);
                        enemyDestroyed(alien.points);
                        gameState.score += alien.points;
                        const drop = createDrop(alien.x + alien.width/2, alien.y + alien.height/2);
                        if (drop) {
                            gameState.drops.push(drop);
                        }
                    } else {
                        createSmallExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
                        
                        // Ativar imunidade se o alien tiver vida > 1 e invulnerableDuration > 0
                        if (alien.maxHealth > 1 && alien.invulnerableDuration > 0) {
                            alien.isInvulnerable = true;
                            alien.invulnerableTimer = alien.invulnerableDuration;
                            alien.blinkTimer = 0;
                        }
                    }
                }
            }
        }
    }

    // Tiros do drone vs Aliens
    for (let i = player.drone.bullets.length - 1; i >= 0; i--) {
        const bullet = player.drone.bullets[i];
        
        for (let j = aliens.length - 1; j >= 0; j--) {
            const alien = aliens[j];
            
            if (checkBulletAlienCollision(bullet, alien)) {
                if (isAlienVisible(alien) && !alien.isInvulnerable) {
                    alien.health--;
                    
                    // Remove o tiro
                    player.drone.bullets.splice(i, 1);
                    
                    // Se saúde chegar a zero, destrói o alien
                    if (alien.health <= 0) {
                        createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
                        aliens.splice(j, 1);
                        enemyDestroyed(alien.points);
                        gameState.score += alien.points;
                        const drop = createDrop(alien.x + alien.width/2, alien.y + alien.height/2);
                        if (drop) {
                            gameState.drops.push(drop);
                        }
                    } else {
                        // Efeito de dano (piscar)
                        createSmallExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
                        
                        // Ativar imunidade se o alien tiver vida > 1 e invulnerableDuration > 0
                        if (alien.maxHealth > 1 && alien.invulnerableDuration > 0) {
                            alien.isInvulnerable = true;
                            alien.invulnerableTimer = alien.invulnerableDuration;
                            alien.blinkTimer = 0;
                        }
                    }
                    break;
                }
            }
        }
    }
}

function checkLightningCollisions() {
    if (!gameState.lightningEvent.active) return;
    
    gameState.lightningEvent.lightnings.forEach(lightning => {
        // Verificar colisão com o jogador
        const playerHit = lightning.x < player.x + player.width &&
                         lightning.x + lightning.width > player.x &&
                         lightning.y < player.y + player.height &&
                         lightning.y + lightning.height > player.y;
        
        if (playerHit && !player.isInvulnerable && !player.isForceFieldActive) {
            // Dano reduzido se estiver com escudo
            if (player.shield.active) {
                player.shield.strength -= lightning.damage * 0.7;
                createShieldImpact(
                    player.x + player.width/2,
                    player.y + player.height/2
                );
                
                if (player.shield.strength <= 0) {
                    player.shield.active = false;
                    player.shield.strength = 0;
                    createBigExplosion(
                        player.x + player.width/2,
                        player.y + player.height/2
                    );
                }
            } else {
                player.health -= lightning.damage;
                player.isInvulnerable = true;
                player.invulnerableTimer = player.invulnerableDuration;
                
                if (player.health <= 0) {
                    player.health = 0;
                    gameState.lives--;
                    
                    if (gameState.lives <= 0) {
                        musicPlayer.stop();
                        gameState.gameOver = true;
                        deactivateControls();
                    } else {
                        player.x = 100;
                        player.y = 300;
                        player.health = player.maxHealth;
                    }
                }
            }
            
            // Criar efeito de explosão
            createExplosion(
                player.x + player.width/2,
                player.y + player.height/2
            );
        }
    });
}

function checkAsteroidCollisions() {
    if (!gameState.asteroidEvent.active) return;

    // Verificar colisão com balas do jogador
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        
        for (let j = gameState.asteroidEvent.asteroids.length - 1; j >= 0; j--) {
            const asteroid = gameState.asteroidEvent.asteroids[j];
            
            if (asteroid.fading) continue;
            
            // Verificar colisão entre bala e asteroide
            const dx = bullet.x + bullet.width/2 - asteroid.x;
            const dy = bullet.y + bullet.height/2 - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < asteroid.size) {
                // Destruir asteroide
                createExplosion(asteroid.x, asteroid.y);
                gameState.asteroidEvent.asteroids.splice(j, 1);
                
                // Remover bala
                player.bullets.splice(i, 1);
                
                // Adicionar pontos
                gameState.score += 50; // Pontuação por destruir asteroide
                
                break; // Sair do loop de asteroides para esta bala
            }
        }
    }

    // Verificar colisão com lasers do jogador
    for (let i = player.lasers.length - 1; i >= 0; i--) {
        const laser = player.lasers[i];
        
        for (let j = gameState.asteroidEvent.asteroids.length - 1; j >= 0; j--) {
            const asteroid = gameState.asteroidEvent.asteroids[j];
            
            if (asteroid.fading) continue;
            
            // Verificar colisão entre laser e asteroide
            const dx = laser.x + laser.width/2 - asteroid.x;
            const dy = laser.y + laser.height/2 - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < asteroid.size) {
                // Destruir asteroide
                createExplosion(asteroid.x, asteroid.y);
                gameState.asteroidEvent.asteroids.splice(j, 1);
                
                // Remover laser
                player.lasers.splice(i, 1);
                
                // Adicionar pontos
                gameState.score += 50; // Pontuação por destruir asteroide
                
                break; // Sair do loop de asteroides para este laser
            }
        }
    }

    // Verificar colisão com tiros de espalhamento
    for (let i = player.spreadShots.length - 1; i >= 0; i--) {
        const shot = player.spreadShots[i];
        
        for (let j = gameState.asteroidEvent.asteroids.length - 1; j >= 0; j--) {
            const asteroid = gameState.asteroidEvent.asteroids[j];
            
            if (asteroid.fading) continue;
            
            // Verificar colisão entre tiro de espalhamento e asteroide
            const dx = shot.x + shot.width/2 - asteroid.x;
            const dy = shot.y + shot.height/2 - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < asteroid.size) {
                // Destruir asteroide
                createExplosion(asteroid.x, asteroid.y);
                gameState.asteroidEvent.asteroids.splice(j, 1);
                
                // Remover tiro de espalhamento
                player.spreadShots.splice(i, 1);
                
                // Adicionar pontos
                gameState.score += 50; // Pontuação por destruir asteroide
                
                break; // Sair do loop de asteroides para este tiro
            }
        }
    }
    
    for (let i = gameState.asteroidEvent.asteroids.length - 1; i >= 0; i--) {
        const asteroid = gameState.asteroidEvent.asteroids[i];

        if (asteroid.fading) continue;
        
        const dx = (player.x + player.width/2) - asteroid.x;
        const dy = (player.y + player.height/2) - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (asteroid.size + Math.max(player.width, player.height)/2)) {
            // 1º: Verifica se o Force Field está ativo (proteção máxima)
            if (player.isForceFieldActive) {
                // Bloqueia o dano completamente, sem afetar o escudo
            }
            // 2º: Se não tem Force Field, verifica o escudo
            else if (player.shield.active && distance < (asteroid.size + player.shield.radius)) {
                // Escudo absorve dano (reduzido em 30%)
                player.shield.strength -= asteroid.damage * 0.7;
                createShieldImpact(asteroid.x, asteroid.y);
                createExplosion(asteroid.x, asteroid.y);
                gameState.asteroidEvent.asteroids.splice(i, 1);

                // Escudo quebrado?
                if (player.shield.strength <= 0) {
                    player.shield.active = false;
                    player.shield.strength = 0;
                    player.shield.ready = false;
                    player.shield.lastUse = gameTime;
                    createBigExplosion(player.x + player.width/2, player.y + player.height/2);
                }
            }
            // 3º: Sem proteção (dano direto)
            else if (!player.isInvulnerable) {
                player.health -= asteroid.damage;
                createExplosion(asteroid.x, asteroid.y);
                gameState.asteroidEvent.asteroids.splice(i, 1);
                player.isInvulnerable = true;
                player.invulnerableTimer = player.invulnerableDuration;

                // Verifica morte do jogador
                if (player.health <= 0) {
                    player.health = 0;
                    gameState.lives--;
                    
                    if (gameState.lives <= 0) {
                        musicPlayer.stop();
                        gameState.gameOver = true;
                        deactivateControls();
                    } else {
                        // Respawn
                        player.x = 100;
                        player.y = 300;
                        player.health = player.maxHealth;
                        player.isInvulnerable = true;
                        player.invulnerableTimer = player.invulnerableDuration;
                    }
                }
            }
        }
    }

    // Verificar colisão entre aliados e asteroides
    for (let i = player.allies.ships.length - 1; i >= 0; i--) {
        const ally = player.allies.ships[i];
        
        for (let j = gameState.asteroidEvent.asteroids.length - 1; j >= 0; j--) {
            const asteroid = gameState.asteroidEvent.asteroids[j];
            
            if (asteroid.fading) continue;
            
            // Verificar colisão
            const dx = (ally.x + ally.width/2) - asteroid.x;
            const dy = (ally.y + ally.height/2) - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (asteroid.size + Math.max(ally.width, ally.height)/2)) {
                // Destruir ambos aliado e asteroide
                createExplosion(ally.x + ally.width/2, ally.y + ally.height/2);
                createExplosion(asteroid.x, asteroid.y);
                
                // Remover aliado
                player.allies.ships.splice(i, 1);
                
                // Remover asteroide
                gameState.asteroidEvent.asteroids.splice(j, 1);
                
                // Adicionar pontos por destruir asteroide
                gameState.score += 50;
                
                break; // Sair do loop de asteroides para este aliado
            }
        }
    }

    // Verificar colisão com a bomba nuclear (quando ativada)
    if (!player.nuclearBomb.ready && gameTime - player.nuclearBomb.lastUse < 1000) {
        const bombX = player.x + player.width/2;
        const bombY = player.y + player.height/2;
        
        for (let i = gameState.asteroidEvent.asteroids.length - 1; i >= 0; i--) {
            const asteroid = gameState.asteroidEvent.asteroids[i];
            
            if (asteroid.fading) continue;
            
            const dx = bombX - asteroid.x;
            const dy = bombY - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Se o asteroide estiver dentro do raio da bomba
            if (distance < player.nuclearBomb.radius) {
                // Destruir asteroide com efeito especial
                createBigExplosion(asteroid.x, asteroid.y);
                gameState.asteroidEvent.asteroids.splice(i, 1);
                
                // Adicionar pontos extras por destruir com bomba
                gameState.score += 100;
            }
        }
    }
}

function applyAlienDamage(alien, index) {
    if (alien.type === 'tank') {
        alien.health -= 2;
        
        if (alien.health <= 0) {
            aliens.splice(index, 1);
            gameState.score += alien.points;
            createBigExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
        } else {
            createSmallExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
            alien.isInvulnerable = true;
            alien.invulnerableTimer = alien.invulnerableDuration;
            alien.blinkTimer = 0;
        }
    } else if (alien.maxHealth > 1) {
        alien.health -= 1;
        
        if (alien.health <= 0) {
            aliens.splice(index, 1);
            gameState.score += alien.points;
            createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
        } else {
            createSmallExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
            alien.isInvulnerable = true;
            alien.invulnerableTimer = alien.invulnerableDuration || 500;
            alien.blinkTimer = 0;
        }
    } else {
        aliens.splice(index, 1);
        gameState.score += alien.points;
        createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
    }
}

function checkShieldCollision(object) {
    if (!player.shield.active) return false;
    
    const shieldCenterX = player.x + player.width/2;
    const shieldCenterY = player.y + player.height/2;
    const shieldRadius = player.shield.radius;
    
    // Encontra o ponto no retângulo mais próximo do centro do escudo
    const closestX = Math.max(object.x, Math.min(shieldCenterX, object.x + object.width));
    const closestY = Math.max(object.y, Math.min(shieldCenterY, object.y + object.height));
    
    // Calcula a distância entre o ponto mais próximo e o centro do escudo
    const distanceX = shieldCenterX - closestX;
    const distanceY = shieldCenterY - closestY;
    
    // Se a distância for menor que o raio, há colisão
    return (distanceX * distanceX + distanceY * distanceY) <= (shieldRadius * shieldRadius);
}

function createExplosion(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 30,
            maxLife: 30,
            color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`
        });
    }
}

function createBigExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 40,
            maxLife: 40,
            color: `hsl(${Math.random() * 30 + 10}, 100%, 50%)`, // Tons de vermelho/laranja
            size: Math.random() * 5 + 3
        });
    }
}

function createSmallExplosion(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 15,
            maxLife: 15,
            color: '#ff6600'
        });
    }
}

function createShieldImpact(impactX, impactY) {
    const centerX = player.x + player.width/2;
    const centerY = player.y + player.height/2;
    
    // 1. Partículas de energia que se espalham do ponto de impacto
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        const size = Math.random() * 4 + 2;
        const life = Math.random() * 40 + 30;
        
        player.shieldParticles.push({
            x: impactX,
            y: impactY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size,
            startSize: size,
            color: `hsla(${Math.random() * 60 + 180}, 100%, 50%, 0.8)`,
            life: life,
            maxLife: life,
            type: 'spark'
        });
    }
    
    // 2. Ondas de choque concêntricas (3 ondas com atraso)
    for (let wave = 1; wave <= 3; wave++) {
        setTimeout(() => {
            player.shieldParticles.push({
                x: impactX,
                y: impactY,
                radius: 5,
                maxRadius: player.shield.radius * 0.8,
                growthRate: wave * 2,
                color: `hsla(${200 + wave * 20}, 100%, 60%, ${0.6 - wave * 0.15})`,
                life: 30 - wave * 5,
                type: 'wave'
            });
        }, wave * 50); // Atraso entre ondas
    }
    
    // 3. Distorção luminosa (halo brilhante)
    player.shieldParticles.push({
        x: impactX,
        y: impactY,
        radius: 10,
        maxRadius: 40,
        growthRate: 3,
        color: 'hsla(180, 100%, 80%, 0.7)',
        life: 20,
        type: 'glow'
    });
    
    // 4. Efeito de "splash" no ponto de impacto (raio de partículas)
    const impactAngle = Math.atan2(impactY - centerY, impactX - centerX);
    for (let i = 0; i < 10; i++) {
        const angleVariation = (Math.random() - 0.5) * Math.PI/2;
        const angle = impactAngle + angleVariation;
        const speed = Math.random() * 2 + 1;
        const distance = Math.random() * player.shield.radius * 0.5;
        
        player.shieldParticles.push({
            x: impactX,
            y: impactY,
            angle: angle,
            speed: speed,
            distance: distance,
            size: Math.random() * 3 + 2,
            color: `hsla(${Math.random() * 40 + 160}, 100%, 70%, 0.9)`,
            life: Math.random() * 30 + 20,
            type: 'radial'
        });
    }
    
    // 5. Efeito de pulsação no escudo inteiro
    player.shieldParticles.push({
        x: centerX,
        y: centerY,
        radius: player.shield.radius * 0.9,
        pulseSize: player.shield.radius * 0.2,
        pulseSpeed: 0.1,
        color: 'hsla(190, 100%, 60%, 0.3)',
        life: 30,
        type: 'pulse'
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateCamera() {
    // Câmera segue o player com um offset
    const targetX = player.x - canvas.width / 3;
    gameState.camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, targetX));
}

function switchShipSkin() {
    currentShipSkin = (currentShipSkin + 1) % Object.keys(SHIP_SKINS).length;
    console.log(`Skin ativada: ${Object.keys(SHIP_SKINS)[currentShipSkin]}`);
}

// Adicionar após as outras funções de inicialização
function initAsteroidEvent() {
    gameState.asteroidEvent.active = true;
    gameState.asteroidEvent.startTime = gameTime;
    gameState.asteroidEvent.asteroids = [];
    gameState.asteroidEvent.nextEventTime = gameTime + ASTEROID_EVENT_INTERVAL + ASTEROID_EVENT_DURATION; // Próximo evento só depois do intervalo + duração
    
    console.log("Evento de Asteroides Iniciado!");
}

function endAsteroidEvent() {
    // Em vez de limpar imediatamente, marcamos os asteroides para desaparecerem
    gameState.asteroidEvent.asteroids.forEach(asteroid => {
        asteroid.fading = true;
        asteroid.fadeTime = 1000; // 1 segundo para desaparecer
        asteroid.startFadeTime = gameTime;
    });
    
    gameState.asteroidEvent.active = false;
    gameState.asteroidEvent.nextEventTime = gameTime + ASTEROID_EVENT_INTERVAL;
    console.log("Evento de Asteroides Terminando...");
}

function initNebulaEvent() {
    gameState.nebulaEvent.active = true;
    gameState.nebulaEvent.startTime = gameTime;
    gameState.nebulaEvent.clouds = [];
    gameState.nebulaEvent.nextEventTime = gameTime + NEBULA_EVENT_INTERVAL + NEBULA_EVENT_DURATION;
}

function endNebulaEvent() {
    gameState.nebulaEvent.active = false;
    gameState.nebulaEvent.nextEventTime = gameTime + NEBULA_EVENT_INTERVAL;
}

function spawnNebulaClouds() {
    if (!gameState.nebulaEvent.active) return;
    
    // Cria nuvens de névoa aleatórias
    if (gameTime - gameState.nebulaEvent.lastCloudSpawn > 1000) {
        const cloudCount = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < cloudCount; i++) {
            gameState.nebulaEvent.clouds.push({
                x: Math.random() * WORLD_WIDTH,
                y: Math.random() * WORLD_HEIGHT,
                width: 200 + Math.random() * 300,
                height: 100 + Math.random() * 200,
                opacity: 0.3 + Math.random() * 0.5,
                vx: (Math.random() - 0.5) * NEBULA_MOVEMENT_SPEED,
                vy: (Math.random() - 0.5) * NEBULA_MOVEMENT_SPEED
            });
        }
        
        gameState.nebulaEvent.lastCloudSpawn = gameTime;
    }
}

function spawnAsteroids() {
    if (!gameState.asteroidEvent.active) return;
    
    const count = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < count; i++) {
        const type = ASTEROID_TYPES[Math.floor(Math.random() * ASTEROID_TYPES.length)];
        const side = Math.floor(Math.random() * 4);
        
        let x, y, vx, vy;
        
        switch(side) {
            case 0: // Top
                x = Math.random() * WORLD_WIDTH;
                y = -type.size;
                vx = (Math.random() - 0.5) * 2;
                vy = type.speed;
                break;
            case 1: // Right
                x = WORLD_WIDTH + type.size;
                y = Math.random() * WORLD_HEIGHT;
                vx = -type.speed;
                vy = (Math.random() - 0.5) * 2;
                break;
            case 2: // Bottom
                x = Math.random() * WORLD_WIDTH;
                y = WORLD_HEIGHT + type.size;
                vx = (Math.random() - 0.5) * 2;
                vy = -type.speed;
                break;
            case 3: // Left
                x = -type.size;
                y = Math.random() * WORLD_HEIGHT;
                vx = type.speed;
                vy = (Math.random() - 0.5) * 2;
                break;
        }
        
        // Gerar a forma do asteroide apenas uma vez
        const points = 8 + Math.floor(Math.random() * 5);
        const shape = [];
        const radiusVariation = 0.2;
        
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = type.size * (1 - radiusVariation + Math.random() * radiusVariation * 2);
            shape.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        
        // Gerar crateras apenas uma vez
        const craters = [];
        for (let i = 0; i < 3; i++) {
            craters.push({
                x: (Math.random() - 0.5) * type.size * 0.8,
                y: (Math.random() - 0.5) * type.size * 0.8,
                size: type.size * (0.1 + Math.random() * 0.1)
            });
        }
        
        gameState.asteroidEvent.asteroids.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            size: type.size,
            damage: type.damage,
            color: type.color,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            shape: shape,  // Armazenar a forma gerada
            craters: craters  // Armazenar as crateras geradas
        });
    }
}

function initLightningEvent() {
    gameState.lightningEvent.active = true;
    gameState.lightningEvent.startTime = gameTime;
    gameState.lightningEvent.lightnings = [];
    gameState.lightningEvent.nextEventTime = gameTime + LIGHTNING_EVENT_INTERVAL + LIGHTNING_EVENT_DURATION;
    gameState.lightningEvent.warning = true;
    
    setTimeout(() => {
        gameState.lightningEvent.warning = false;
    }, 2000); // Warning dura 2 segundos
    
    console.log("Evento de Raios Cósmicos Iniciado!");
}

function endLightningEvent() {
    gameState.lightningEvent.active = false;
    gameState.lightningEvent.nextEventTime = gameTime + LIGHTNING_EVENT_INTERVAL;
    console.log("Evento de Raios Cósmicos Terminado!");
}

function spawnLightnings() {
    if (!gameState.lightningEvent.active || gameState.lightningEvent.warning) return;
    
    const count = Math.floor(Math.random() * 2) + 1; // 1-2 raios por spawn
    
    for (let i = 0; i < count; i++) {
        const type = LIGHTNING_TYPES[Math.floor(Math.random() * LIGHTNING_TYPES.length)];
        
        // Posição aleatória no topo da tela, mas não muito perto das bordas
        const x = 50 + Math.random() * (WORLD_WIDTH - 100);
        const y = -20; // Começa pouco acima da tela
        
        // Criar raio mais curto
        const segments = [];
        const segmentCount = 3; // Menos segmentos
        const maxLength = 150 + Math.random() * 100; // Comprimento menor (150-250px)
        const segmentLength = maxLength / segmentCount;
        
        // Primeiro segmento sempre reto (para dar tempo de reação)
        segments.push({
            x: 0,
            y: 0,
            width: type.width
        });
        
        // Segmentos seguintes com pequenos desvios
        for (let s = 1; s < segmentCount; s++) {
            const deviation = (Math.random() - 0.5) * 25;
            segments.push({
                x: deviation,
                y: s * segmentLength,
                width: type.width * (0.6 + Math.random() * 0.4) // Mais fino
            });
        }
        
        gameState.lightningEvent.lightnings.push({
            x: x,
            y: y,
            speed: type.speed * 0.8, // Mais lento
            width: type.width,
            height: maxLength,
            color: type.color,
            damage: type.damage,
            segments: segments,
            life: 60, // Vida mais curta
            alpha: 1,
            branchChance: 0.1 // Chance mínima de ramificação
        });
    }
}

function activateDrone() {
    if (!player.drone.ready || player.drone.active) return;

    player.drone.active = true;
    player.drone.ready = false;
    player.drone.lastUse = gameTime;
    player.drone.x = player.x + (player.facingRight ? 50 : -50); // Posição relativa ao jogador
    player.drone.y = player.y - 30;

    console.log("Drone aliado ativado!");
}

function activateShield() {
    if (!player.shield.ready || player.shield.active) return;
    
    player.shield.active = true;
    player.shield.ready = false;
    player.shield.lastUse = gameTime;
    player.shield.strength = player.shield.maxStrength;
    
    console.log("Escudo ativado!");
}

function activateAllies() {
    if (!player.allies.ready) return;
    
    player.allies.ready = false;
    player.allies.lastUse = gameTime;
    
    const canvasHeight = 600; // Altura do canvas (ajuste conforme seu jogo)
    const minDistance = 100; // Distância mínima entre naves
    const allyHeight = 15; // Altura da nave aliada
    const margin = 50; // Margem das bordas
    
    // Array para armazenar posições Y válidas
    const positions = [];
    
    // Gerar posições aleatórias com distância mínima
    for (let i = 0; i < 3; i++) {
        let validPosition = false;
        let y;
        
        // Tentar encontrar uma posição válida (máximo de 10 tentativas)
        for (let attempts = 0; attempts < 10 && !validPosition; attempts++) {
            y = margin + Math.random() * (canvasHeight - 2 * margin - allyHeight);
            validPosition = true;
            
            // Verificar distância das posições já definidas
            for (const pos of positions) {
                if (Math.abs(y - pos) < minDistance) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                positions.push(y);
            }
        }
        
        // Se não encontrou posição válida, usar posição calculada
        if (!validPosition) {
            // Fallback: distribuição uniforme
            y = margin + (i * (canvasHeight - 2 * margin) / 3);
        }
        
        player.allies.ships.push({
            x: -50,
            y: y,
            width: 25,
            height: allyHeight,
            speed: 8,
            color: `hsl(${200 + Math.random() * 40}, 100%, 50%)`, // Cores azuis variadas
            trail: [],
            direction: 0 // Adicionado para controle de rotação
        });
    }
    
    console.log("Aliados invocados com posicionamento inteligente!");
}

function activateTurbo() {
    if (!player.turboReady) return;
    
    player.turboActive = true;
    player.speed = player.turboSpeed;
    player.turboReady = false;
    player.lastTurboUse = gameTime;
    
    console.log("Turbo ativado! VROOOOM!");
}

function activateNuclearBomb() {
    if (!player.nuclearBomb.ready) return;
    
    player.nuclearBomb.ready = false;
    player.nuclearBomb.lastUse = gameTime;
    
    // Criar efeito de buraco negro
    const bombX = player.x + player.width/2;
    const bombY = player.y + player.height/2;
    
    // Causar dano a todos os aliens no raio
    for (let i = aliens.length - 1; i >= 0; i--) {
        const alien = aliens[i];
        const distance = Math.sqrt(
            Math.pow(alien.x + alien.width/2 - bombX, 2) + 
            Math.pow(alien.y + alien.height/2 - bombY, 2)
        );
        
        if (distance < player.nuclearBomb.radius) {
            alien.health -= 1; // 1 de dano para cada alien no raio
            
            if (alien.health <= 0) {
                createExplosion(alien.x + alien.width/2, alien.y + alien.height/2);
                aliens.splice(i, 1);
                enemyDestroyed(alien.points);
                gameState.score += alien.points;
                const drop = createDrop(alien.x + alien.width/2, alien.y + alien.height/2);
                if (drop) {
                    gameState.drops.push(drop);
                }
            } else {
                createSmallExplosion(alien.x + alien.width/2, alien.y + alien.height/2);
            }
        }
    }
    
    // Criar partículas do buraco negro
    for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * player.nuclearBomb.radius;
        
        player.blackHoleParticles.push({
            x: bombX + Math.cos(angle) * distance,
            y: bombY + Math.sin(angle) * distance,
            startX: bombX + Math.cos(angle) * distance,
            startY: bombY + Math.sin(angle) * distance,
            targetX: bombX,
            targetY: bombY,
            progress: 0,
            speed: Math.random() * 0.02 + 0.01,
            size: Math.random() * 3 + 1,
            color: `hsl(${Math.random() * 60 + 200}, 100%, 50%)`,
            life: 100
        });
    }
    
    console.log("Bomba nuclear ativada! BOOM!");
}

function updateDrone() {
    // Atualizar cooldown
    if (!player.drone.active && !player.drone.ready) {
        // Verifica se o tempo desde a última ativação (incluindo a duração) passou do cooldown total
        const timeSinceActivation = gameTime - player.drone.lastUse;
        if (timeSinceActivation > (player.drone.duration + player.drone.cooldown)) {
            player.drone.ready = true;
            player.drone.pulse = 0;
        }
    }

    // Pulsação quando pronto
    if (player.drone.ready) {
        player.drone.pulse = (player.drone.pulse + 0.05) % (Math.PI * 2);
    }

    // Comportamento quando ativo
    if (player.drone.active) {
        // Segue o jogador com um offset
        player.drone.x = player.x + (player.facingRight ? 0 : 0);
        player.drone.y = player.y - 35;

        // Atira em inimigos próximos
        if (gameTime - player.drone.lastShot > player.drone.shootDelay) {
            const target = findNearestAlien();
            if (target) {
                const angle = Math.atan2(
                    target.y + target.height/2 - player.drone.y, // Mira no centro do alien
                    target.x + target.width/2 - player.drone.x
                );
                
                player.drone.bullets.push({
                    x: player.drone.x,
                    y: player.drone.y,
                    vx: Math.cos(angle) * 9, // Velocidade aumentada para melhor acerto
                    vy: Math.sin(angle) * 9,
                    color: '#00aaff',
                    width: 2,  // Tiro ligeiramente maior
                    height: 2
                });
                
                player.drone.lastShot = gameTime;
            }
        }

        // Remove balas fora da tela
        player.drone.bullets = player.drone.bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            return bullet.x > 0 && bullet.x < WORLD_WIDTH && bullet.y > 0 && bullet.y < WORLD_HEIGHT;
        });

        // Desativa após 10 segundos
        if (gameTime - player.drone.lastUse > player.drone.duration) {
            player.drone.active = false;
            createExplosion(player.drone.x, player.drone.y); // Efeito de desativação
        }
    }
}

function findNearestAlien() {
    let nearest = null;
    let minDistance = Infinity;
    const droneX = player.drone.x;
    const droneY = player.drone.y;

    aliens.forEach(alien => {
        // Calcula apenas a distância direta
        const dx = alien.x - droneX;
        const dy = alien.y - droneY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Escolhe o alien mais próximo (dentro de 400px)
        if (distance < 400 && distance < minDistance) {
            minDistance = distance;
            nearest = alien;
        }
    });

    return nearest;
}

function updateLightnings() {
    // Verificar se deve iniciar o evento
    if (!gameState.lightningEvent.active && 
        gameTime > gameState.lightningEvent.nextEventTime) {
        initLightningEvent();
    }
    
    // Verificar se o evento terminou
    if (gameState.lightningEvent.active && 
        gameTime - gameState.lightningEvent.startTime > LIGHTNING_EVENT_DURATION) {
        endLightningEvent();
    }
    
    // Spawn de novos raios (com menos frequência)
    if (gameState.lightningEvent.active && !gameState.lightningEvent.warning) {
        if (Math.random() < 0.125) { // Reduzida a chance de spawn
            spawnLightnings();
        }
    }
    
    // Atualizar posição dos raios
    for (let i = gameState.lightningEvent.lightnings.length - 1; i >= 0; i--) {
        const lightning = gameState.lightningEvent.lightnings[i];
        
        lightning.y += lightning.speed;
        lightning.life--;
        
        // Fade out mais rápido
        if (lightning.life < 15) {
            lightning.alpha = lightning.life / 15;
        }
        
        // Remover raios que saíram da tela ou terminaram a vida
        if (lightning.life <= 0 || lightning.y > WORLD_HEIGHT) {
            gameState.lightningEvent.lightnings.splice(i, 1);
        }
    }
}

function updateNebulaClouds() {
    if (!gameState.nebulaEvent.active) return;

    spawnNebulaClouds();

    if (gameState.nebulaEvent.active && 
        gameTime - gameState.nebulaEvent.startTime > NEBULA_EVENT_DURATION) {
        endNebulaEvent();
    }
    
    // Atualiza posição das nuvens
    gameState.nebulaEvent.clouds.forEach(cloud => {
        cloud.x += cloud.vx;
        cloud.y += cloud.vy;
        
        // Adiciona um movimento mais caótico durante a dissipação
        const isEnding = (NEBULA_EVENT_DURATION - (gameTime - gameState.nebulaEvent.startTime)) < 3000;
        if (isEnding) {
            cloud.vx += (Math.random() - 0.5) * 0.2;
            cloud.vy += (Math.random() - 0.5) * 0.2;
        }
        
        // Mantém as nuvens dentro dos limites do mundo
        cloud.x = Math.max(-cloud.width, Math.min(WORLD_WIDTH + cloud.width, cloud.x));
        cloud.y = Math.max(-cloud.height, Math.min(WORLD_HEIGHT + cloud.height, cloud.y));
    });
}

function updateAsteroids() {
    // Verificar se o evento terminou mas ainda há asteroides desaparecendo
    const eventEnded = gameState.asteroidEvent.active && 
                      gameTime - gameState.asteroidEvent.startTime > ASTEROID_EVENT_DURATION;
    
    if (eventEnded) {
        endAsteroidEvent();
    }
    
    // Spawn de novos asteroides apenas se o evento estiver ativo
    if (gameState.asteroidEvent.active) {
        if (gameTime - gameState.asteroidEvent.startTime > 0 && 
            gameState.asteroidEvent.asteroids.length < 15) {
            if (Math.random() < 0.3) {
                spawnAsteroids();
            }
        }
    }
    
    // Atualizar posição dos asteroides
    for (let i = gameState.asteroidEvent.asteroids.length - 1; i >= 0; i--) {
        const asteroid = gameState.asteroidEvent.asteroids[i];
        
        // Se estiver desaparecendo, atualizar o tempo de fade
        if (asteroid.fading) {
            const elapsedFadeTime = gameTime - asteroid.startFadeTime;
            asteroid.alpha = 1 - (elapsedFadeTime / asteroid.fadeTime);
            
            // Remover quando totalmente transparente
            if (elapsedFadeTime >= asteroid.fadeTime) {
                gameState.asteroidEvent.asteroids.splice(i, 1);
                continue;
            }
        }
        
        // Movimento normal
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        asteroid.rotation += asteroid.rotationSpeed;
        
        // Remover asteroides que saíram da tela
        if (asteroid.x < -asteroid.size * 2 || asteroid.x > WORLD_WIDTH + asteroid.size * 2 ||
            asteroid.y < -asteroid.size * 2 || asteroid.y > WORLD_HEIGHT + asteroid.size * 2) {
            gameState.asteroidEvent.asteroids.splice(i, 1);
        }
    }
}

function updateShield() {
    // Atualizar cooldown apenas se o escudo não estiver ativo
    if (!player.shield.active && !player.shield.ready) {
        if (gameTime - player.shield.lastUse > player.shield.cooldown) {
            player.shield.ready = true;
            player.shield.pulse = 0;
        }
    }
    
    // Pulsação quando pronto
    if (player.shield.ready) {
        player.shield.pulse = (player.shield.pulse + 0.05) % (Math.PI * 2);
    }
}

function updateNuclearBomb() {
    // Atualizar cooldown
    if (!player.nuclearBomb.ready) {
        if (gameTime - player.nuclearBomb.lastUse > player.nuclearBomb.cooldown) {
            player.nuclearBomb.ready = true;
            player.nuclearBomb.pulse = 0;
        }
    }
    
    // Pulsação quando pronto
    if (player.nuclearBomb.ready) {
        player.nuclearBomb.pulse = (player.nuclearBomb.pulse + 0.05) % (Math.PI * 2);
    }
    
    // Atualizar partículas do buraco negro
    for (let i = player.blackHoleParticles.length - 1; i >= 0; i--) {
        const particle = player.blackHoleParticles[i];
        
        particle.progress += particle.speed;
        particle.x = particle.startX + (particle.targetX - particle.startX) * particle.progress;
        particle.y = particle.startY + (particle.targetY - particle.startY) * particle.progress;
        particle.life--;
        
        if (particle.life <= 0 || particle.progress >= 1) {
            player.blackHoleParticles.splice(i, 1);
        }
    }
}

function updateTurbo() {
    // Atualizar estado do turbo
    if (player.turboActive) {
        // Verificar se o turbo acabou
        if (gameTime - player.lastTurboUse > player.turboDuration) {
            player.turboActive = false;
            player.speed = player.baseSpeed;
            player.lastTurboUse = gameTime;
            
            // Criar explosão de partículas ao finalizar o turbo
            for (let i = 0; i < 30; i++) {
                player.turboParticles.push({
                    x: player.facingRight ? player.x - 10 : player.x + player.width + 10,
                    y: player.y + player.height / 2,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    size: Math.random() * 3 + 2,
                    color: `hsl(${Math.random() * 60 + 180}, 100%, 50%)`,
                    life: Math.random() * 30 + 20
                });
            }
        }
    }
    
    // Atualizar cooldown
    if (!player.turboReady && !player.turboActive) {
        if (gameTime - player.lastTurboUse > player.turboCooldown) {
            player.turboReady = true;
            player.turboPulse = 0;
        }
    }
    
    // Pulsação quando pronto
    if (player.turboReady) {
        player.turboPulse = (player.turboPulse + 0.05) % (Math.PI * 2);
    }
    
    // Atualizar partículas do turbo
    for (let i = player.turboParticles.length - 1; i >= 0; i--) {
        const particle = player.turboParticles[i];
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        if (particle.life <= 0) {
            player.turboParticles.splice(i, 1);
        }
    }
    
    // Criar novas partículas durante o turbo
    if (player.turboActive) {
        const particleX = player.facingRight ? 
            player.x - 5 : 
            player.x + player.width + 5;
        
        const particleY = player.y + player.height / 2 + (Math.random() - 0.5) * 10;
        
        player.turboParticles.push({
            x: particleX,
            y: particleY,
            vx: player.facingRight ? -Math.random() * 10 : Math.random() * 10,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 4 + 2,
            color: `hsl(${Math.random() * 60 + 180}, 100%, 50%)`,
            life: Math.random() * 20 + 10
        });
    }
}

function drawTimeEffects() {
    if (gameState.timeWave) {
        drawTimeWave();
    }

    gameState.timeFields.forEach(field => {
        drawTimeField(field);
    });
}

function drawTimeWave() {
    const wave = gameState.timeWave;
    const progress = (gameTime - wave.startTime) / (wave.maxRadius / wave.growthSpeed * 16);
    
    if (progress >= 1) {
        gameState.timeWave = null;
        return;
    }
    
    const currentRadius = wave.radius + (wave.maxRadius - wave.radius) * progress;
    const alpha = 0.7 * (1 - progress);
    
    ctx.save();
    ctx.strokeStyle = wave.color.replace('0.7', alpha.toFixed(2));
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
        wave.x - gameState.camera.x,
        wave.y,
        currentRadius,
        0,
        Math.PI * 2
    );
    ctx.stroke();
    
    // Efeito interno mais brilhante
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(
        wave.x - gameState.camera.x,
        wave.y,
        currentRadius * 0.9,
        0,
        Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
}

function drawTimeField(field) {
    const timeLeft = field.endTime - gameTime;
    if (timeLeft <= 0) return;
    
    const pulse = Math.sin(gameTime * 0.005) * 0.1 + 0.9;
    const centerX = field.x - gameState.camera.x;
    const centerY = field.y;
    
    ctx.save();
    
    // Campo de força principal
    const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, field.radius
    );
    gradient.addColorStop(0, 'rgba(100, 200, 255, 0.1)');
    gradient.addColorStop(0.7, 'rgba(80, 160, 220, 0.05)');
    gradient.addColorStop(1, 'rgba(60, 120, 180, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, field.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Bordas distorcidas
    ctx.strokeStyle = `rgba(150, 220, 255, ${0.3 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    const now = gameTime;
    for (let i = 0; i < field.segments.length; i++) {
        const segment = field.segments[i];
        const angle = segment.angle + Math.sin(now * 0.001 * segment.speed + segment.offset) * 0.2;
        const length = segment.length * (0.9 + Math.sin(now * 0.002 + segment.offset) * 0.1);
        const x = centerX + Math.cos(angle) * length;
        const y = centerY + Math.sin(angle) * length;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.closePath();
    ctx.stroke();
    
    // Efeito de pulsação no centro
    ctx.fillStyle = `rgba(200, 240, 255, ${0.4 * pulse})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Texto "TEMPO PARADO" (opcional)
    if (timeLeft > 1000) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * pulse})`;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TEMPO PARADO', centerX, centerY - 20);
        
        // Contador regressivo
        ctx.font = '14px Arial';
        ctx.fillText(`${(timeLeft/1000).toFixed(1)}s`, centerX, centerY + 10);
    }
    
    ctx.restore();
}

function drawDrone() {
    if (!player.drone.active) return;

    const drone = player.drone;
    const time = gameTime * 0.01; // Para animações baseadas em tempo
    
    ctx.save();
    // Posiciona o drone ajustando pela câmera
    ctx.translate(drone.x - gameState.camera.x + 15, drone.y + 15);
    
    // ---- Corpo principal ----
    // Formato hexagonal futurista
    ctx.fillStyle = '#0055ff';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, -5);
    ctx.lineTo(8, 5);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 5);
    ctx.lineTo(-8, -5);
    ctx.closePath();
    ctx.fill();
    
    // Detalhes luminosos
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // ---- Núcleo de energia ----
    const corePulse = Math.sin(time * 3) * 0.2 + 0.8;
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
    coreGradient.addColorStop(0, `rgba(0, 200, 255, ${corePulse})`);
    coreGradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // ---- Asas ----
    ctx.fillStyle = 'rgba(0, 150, 255, 0.7)';
    // Asa esquerda
    ctx.beginPath();
    ctx.moveTo(-5, -3);
    ctx.lineTo(-15, -8);
    ctx.lineTo(-15, 8);
    ctx.lineTo(-5, 3);
    ctx.closePath();
    ctx.fill();
    
    // Asa direita
    ctx.beginPath();
    ctx.moveTo(5, -3);
    ctx.lineTo(15, -8);
    ctx.lineTo(15, 8);
    ctx.lineTo(5, 3);
    ctx.closePath();
    ctx.fill();
    
    // ---- Propulsores ----
    const thrusterPulse = Math.sin(time * 5) * 0.3 + 0.7;
    // Propulsor esquerdo
    ctx.fillStyle = `rgba(0, 255, 255, ${thrusterPulse})`;
    ctx.beginPath();
    ctx.arc(-8, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Propulsor direito
    ctx.beginPath();
    ctx.arc(8, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // ---- Efeito de propulsão ----
    if (keys['ArrowLeft'] || keys['ArrowRight'] || keys['ArrowUp'] || keys['ArrowDown']) {
        ctx.fillStyle = `rgba(0, 200, 255, ${thrusterPulse * 0.5})`;
        // Esquerda
        ctx.beginPath();
        ctx.moveTo(-8, -2);
        ctx.lineTo(-18, -4);
        ctx.lineTo(-18, 4);
        ctx.lineTo(-8, 2);
        ctx.closePath();
        ctx.fill();
        
        // Direita
        ctx.beginPath();
        ctx.moveTo(8, -2);
        ctx.lineTo(18, -4);
        ctx.lineTo(18, 4);
        ctx.lineTo(8, 2);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.restore();

    // ---- Tiros do drone ----
    drone.bullets.forEach(bullet => {
        // Efeito de laser futurista
        const laserGradient = ctx.createLinearGradient(
            bullet.x - gameState.camera.x, bullet.y,
            bullet.x - gameState.camera.x + bullet.vx * 2, bullet.y + bullet.vy * 2
        );
        laserGradient.addColorStop(0, '#00ffff');
        laserGradient.addColorStop(0.5, '#0055ff');
        laserGradient.addColorStop(1, 'rgba(0, 85, 255, 0)');
        
        ctx.fillStyle = laserGradient;
        ctx.fillRect(bullet.x - gameState.camera.x - 2, bullet.y - 1, bullet.width + 4, bullet.height + 2);
        
        // Brilho do laser
        ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
        ctx.fillRect(bullet.x - gameState.camera.x - 4, bullet.y - 2, bullet.width + 8, bullet.height + 4);
    });
}

function drawSpreadShotCooldown() {
    if (!player.spreadShotReady) {
        const cooldownLeft = player.spreadShotCooldown - (gameTime - player.lastSpreadShot);
        const secondsLeft = (cooldownLeft / 1000).toFixed(1);
        
        ctx.fillStyle = '#ff9900'; // Laranja para indicar cooldown
        ctx.font = '14px Arial';
        ctx.fillText(
            `SPREADSHOT: ${secondsLeft}s`,
            17, // Posição X (ajuste conforme necessário)
            175  // Posição Y (abaixo do campo de força)
        );
    }
}

function drawDroneIndicator() {
    const indicatorWidth = 150;
    const indicatorHeight = 15;
    const indicatorX = 10;
    const indicatorY = 120;

    // Fundo
    ctx.fillStyle = '#333333';
    ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);

    // Barra de progresso
    if (player.drone.active) {
        const remainingTime = player.drone.duration - (gameTime - player.drone.lastUse);
        const progress = remainingTime / player.drone.duration;
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth * progress, indicatorHeight);

        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`DRONE ATIVO: ${(remainingTime / 1000).toFixed(1)}s`, indicatorX + 5, indicatorY + 12);
    } else if (!player.drone.ready) {
        // Calcula o tempo desde o fim da duração (não desde a ativação)
        const timeSinceDeactivation = gameTime - (player.drone.lastUse + player.drone.duration);
        const cooldownProgress = Math.min(1, timeSinceDeactivation / player.drone.cooldown);
        
        ctx.fillStyle = '#5555ff';
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth * cooldownProgress, indicatorHeight);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('DRONE REATIVANDO', indicatorX + 5, indicatorY + 12);
    } else {
        const pulse = Math.sin(player.drone.pulse * 2) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(0, 200, 255, ${pulse})`;
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('DRONE PRONTO (D)', indicatorX + 5, indicatorY + 12);
    }

    // Borda
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
}

function drawForceField() {
    if (!player.isForceFieldActive) return;

    const centerX = player.x + player.width/2 - gameState.camera.x;
    const centerY = player.y + player.height/2;

    // Campo de força principal
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#00aaff';
    ctx.fill();
    
    // Borda pulsante
    const pulse = Math.sin(gameTime * 0.01) * 5 + 45;
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Partículas de energia
    player.forceFieldParticles.forEach(p => {
        const alpha = p.life / 30;
        ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(
            p.x - gameState.camera.x,
            p.y,
            p.size * (alpha * 0.5),
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

function drawDrop(drop) {
    ctx.save();
    
    // Posição ajustada pela câmera
    const drawX = drop.x - gameState.camera.x;
    const drawY = drop.y;
    
    // Efeitos visuais diferentes por tipo
    switch(drop.type) {
        case 'health':
            // Efeito de pulsação com bounce
            const bounce = Math.sin(drop.animationTime * 3) * drop.bounceHeight;
            const pulse = Math.sin(drop.animationTime * 5) * 0.2 + 0.8;
            
            // Desenhar brilho
            const gradient = ctx.createRadialGradient(
                drawX + drop.width/2, drawY + drop.height/2 + bounce, 0,
                drawX + drop.width/2, drawY + drop.height/2 + bounce, drop.width * pulse
            );
            gradient.addColorStop(0, drop.glowColor);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                drawX - drop.width/2, 
                drawY - drop.height/2 + bounce, 
                drop.width * 2, 
                drop.height * 2
            );
            
            // Coração
            ctx.fillStyle = drop.color;
            ctx.beginPath();
            ctx.moveTo(drawX + drop.width/2, drawY + drop.height/4 + bounce);
            ctx.bezierCurveTo(
                drawX + drop.width, drawY + bounce,
                drawX + drop.width, drawY + drop.height/2 + bounce,
                drawX + drop.width/2, drawY + drop.height + bounce
            );
            ctx.bezierCurveTo(
                drawX, drawY + drop.height/2 + bounce,
                drawX, drawY + bounce,
                drawX + drop.width/2, drawY + drop.height/4 + bounce
            );
            ctx.closePath();
            ctx.fill();
            break;

        case 'blackhole':
            // Efeito de distorção (halo externo)
            const outerGlow = ctx.createRadialGradient(
                drawX + drop.width/2, drawY + drop.height/2, 0,
                drawX + drop.width/2, drawY + drop.height/2, drop.size * 1.5
            );
            outerGlow.addColorStop(0, 'rgba(150, 0, 255, 0)');
            outerGlow.addColorStop(0.7, 'rgba(150, 0, 255, 0.3)');
            outerGlow.addColorStop(1, 'rgba(150, 0, 255, 0)');
            
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(drawX + drop.width/2, drawY + drop.height/2, drop.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Halo interno
            const innerGlow = ctx.createRadialGradient(
                drawX + drop.width/2, drawY + drop.height/2, 0,
                drawX + drop.width/2, drawY + drop.height/2, drop.size
            );
            innerGlow.addColorStop(0, 'rgba(100, 0, 200, 0.8)');
            innerGlow.addColorStop(0.7, 'rgba(50, 0, 100, 0.5)');
            innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(drawX + drop.width/2, drawY + drop.height/2, drop.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Núcleo escuro
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(drawX + drop.width/2, drawY + drop.height/2, drop.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Anel de energia
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                drawX + drop.width/2, 
                drawY + drop.height/2, 
                drop.size * 0.7, 
                0, 
                Math.PI * 2
            );
            ctx.stroke();
            
            // Partículas orbitando
            for (let i = 0; i < 3; i++) {
                const angle = drop.animationTime * 2 + (i * Math.PI * 2 / 3);
                const orbitRadius = drop.size * 0.9;
                const particleX = drawX + drop.width/2 + Math.cos(angle) * orbitRadius;
                const particleY = drawY + drop.height/2 + Math.sin(angle) * orbitRadius;
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'forcefield':
            // Efeito de pulsação exclusivo para forcefield
            const forcefieldPulse = Math.sin(drop.animationTime * 5) * 0.2 + 0.8;
            const forcefieldSize = drop.width * forcefieldPulse;

            // 1. Halo externo (energia azul)
            const forcefieldOuterGlow = ctx.createRadialGradient(
                drawX + drop.width/2, drawY + drop.height/2, 0,
                drawX + drop.width/2, drawY + drop.height/2, forcefieldSize * 1.5
            );
            forcefieldOuterGlow.addColorStop(0, 'rgba(0, 100, 255, 0.3)');
            forcefieldOuterGlow.addColorStop(1, 'rgba(0, 50, 150, 0)');
            
            ctx.fillStyle = forcefieldOuterGlow;
            ctx.beginPath();
            ctx.arc(drawX + drop.width/2, drawY + drop.height/2, forcefieldSize * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // 2. Campo de força principal (esfera translúcida)
            const forcefieldInnerGlow = ctx.createRadialGradient(
                drawX + drop.width/2, drawY + drop.height/2, 0,
                drawX + drop.width/2, drawY + drop.height/2, forcefieldSize
            );
            forcefieldInnerGlow.addColorStop(0, 'rgba(0, 200, 255, 0.7)');
            forcefieldInnerGlow.addColorStop(0.7, 'rgba(0, 100, 255, 0.3)');
            forcefieldInnerGlow.addColorStop(1, 'rgba(0, 50, 255, 0)');
            
            ctx.fillStyle = forcefieldInnerGlow;
            ctx.beginPath();
            ctx.arc(drawX + drop.width/2, drawY + drop.height/2, forcefieldSize, 0, Math.PI * 2);
            ctx.fill();

            // 3. Efeito de distorção (padrão hexagonal)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            // Desenha um hexágono pulsante
            const sides = 6;
            for (let i = 0; i <= sides; i++) {
                const angle = (i / sides) * Math.PI * 2 + drop.animationTime;
                const radius = forcefieldSize * 0.8;
                const x = drawX + drop.width/2 + Math.cos(angle) * radius;
                const y = drawY + drop.height/2 + Math.sin(angle) * radius;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();

            // 4. Partículas flutuantes (3 partículas orbitando)
            for (let i = 0; i < 3; i++) {
                const angle = drop.animationTime * 3 + (i * Math.PI * 2 / 3);
                const orbitRadius = forcefieldSize * 0.6;
                const px = drawX + drop.width/2 + Math.cos(angle) * orbitRadius;
                const py = drawY + drop.height/2 + Math.sin(angle) * orbitRadius;
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'timebomb':
            // Efeito de pulsação
            const timeBombPulse = Math.sin(drop.animationTime * 5) * 0.2 + 0.8;
            const size = drop.size * timeBombPulse;
            
            // Halo externo
            const timeBombOuterGlow = ctx.createRadialGradient(
                drawX + drop.width/2, drawY + drop.height/2, 0,
                drawX + drop.width/2, drawY + drop.height/2, size * 1.5
            );
            timeBombOuterGlow.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
            timeBombOuterGlow.addColorStop(1, 'transparent');
            
            ctx.fillStyle = timeBombOuterGlow;
            ctx.beginPath();
            ctx.arc(drawX + drop.width/2, drawY + drop.height/2, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Esfera central
            const timeBombInnerGlow = ctx.createRadialGradient(
                drawX + drop.width/2, drawY + drop.height/2, 0,
                drawX + drop.width/2, drawY + drop.height/2, size
            );
            timeBombInnerGlow.addColorStop(0, 'rgba(200, 240, 255, 0.9)');
            timeBombInnerGlow.addColorStop(0.7, 'rgba(150, 200, 255, 0.5)');
            timeBombInnerGlow.addColorStop(1, 'rgba(100, 150, 255, 0)');
            
            ctx.fillStyle = timeBombInnerGlow;
            ctx.beginPath();
            ctx.arc(drawX + drop.width/2, drawY + drop.height/2, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Detalhes do relógio
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(drawX + drop.width/2, drawY + drop.height/2, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // Ponteiros do relógio
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            
            // Ponteiro dos minutos
            ctx.save();
            ctx.translate(drawX + drop.width/2, drawY + drop.height/2);
            ctx.rotate(drop.animationTime * 0.5);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -size * 0.25);
            ctx.stroke();
            ctx.restore();
            
            // Ponteiro das horas
            ctx.save();
            ctx.translate(drawX + drop.width/2, drawY + drop.height/2);
            ctx.rotate(drop.animationTime * 0.1);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -size * 0.15);
            ctx.stroke();
            ctx.restore();
            
            // Marcadores do relógio
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const markerSize = i % 3 === 0 ? 2 : 1;
                const markerX = drawX + drop.width/2 + Math.cos(angle) * size * 0.4;
                const markerY = drawY + drop.height/2 + Math.sin(angle) * size * 0.4;
                
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(markerX, markerY, markerSize, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
    }
    
    ctx.restore();
}

function drawLightnings() {
    if (!gameState.lightningEvent.active && gameState.lightningEvent.lightnings.length === 0) return;

    ctx.save();
    
    // Configurações para melhor aparência
    const MAX_BRANCHES = 3;
    const JAGGEDNESS = 25;
    const GLOW_INTENSITY = 0.4;

    // Verificar se o evento está terminando (últimos 2 segundos)
    const isEnding = !gameState.lightningEvent.active || 
                    (gameState.lightningEvent.active && 
                     gameTime - gameState.lightningEvent.startTime > LIGHTNING_EVENT_DURATION - 2000);

    for (let i = gameState.lightningEvent.lightnings.length - 1; i >= 0; i--) {
        const lightning = gameState.lightningEvent.lightnings[i];
        const drawX = lightning.x - gameState.camera.x;
        const drawY = lightning.y;
        
        // Pular raios que não estão visíveis
        if (drawX + lightning.width < 0 || drawX > canvas.width) {
            continue;
        }

        // Se o evento está terminando, fazer o raio desaparecer gradualmente
        if (isEnding) {
            // Reduzir alpha mais rapidamente nos últimos 2 segundos
            lightning.alpha -= 0.02;
            
            // Remover raio quando totalmente transparente
            if (lightning.alpha <= 0) {
                gameState.lightningEvent.lightnings.splice(i, 1);
                continue;
            }
        }

        ctx.globalAlpha = lightning.alpha;
        
        // 1. Desenho principal do raio com ramificações
        ctx.save();
        ctx.translate(drawX, drawY);
        
        // Função para gerar um caminho de raio (mesma da versão anterior)
        const generateLightningPath = (startX, startY, endX, endY, width, segments) => {
            const path = [];
            const segmentLength = (endY - startY) / segments;
            
            path.push({ x: startX, y: startY, width: width });
            
            for (let i = 1; i < segments; i++) {
                const y = startY + i * segmentLength;
                const deviation = Math.sin(i/segments * Math.PI) * JAGGEDNESS * (Math.random() - 0.5);
                const segmentWidth = width * (0.7 + Math.random() * 0.3);
                path.push({ 
                    x: startX + (endX - startX) * (i/segments) + deviation,
                    y: y,
                    width: segmentWidth
                });
            }
            
            path.push({ x: endX, y: endY, width: width * 0.5 });
            return path;
        };
        
        // Gerar caminho principal (com largura reduzida durante dissipação)
        const currentWidth = isEnding ? lightning.width * lightning.alpha : lightning.width;
        const mainPath = generateLightningPath(
            0, 0, 
            lightning.segments[lightning.segments.length-1].x, 
            lightning.height,
            currentWidth,
            8
        );
        
        // Desenhar o raio principal
        ctx.beginPath();
        ctx.moveTo(mainPath[0].x, mainPath[0].y);
        
        for (let i = 1; i < mainPath.length; i++) {
            ctx.lineTo(mainPath[i].x, mainPath[i].y);
        }
        
        // Gradiente com alpha ajustado para dissipação
        const gradient = ctx.createLinearGradient(0, 0, 0, lightning.height);
        gradient.addColorStop(0, lightning.color);
        gradient.addColorStop(0.7, lightenColor(lightning.color, 30));
        gradient.addColorStop(1, `rgba(255, 255, 255, ${lightning.alpha})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = mainPath[0].width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        // 2. Adicionar ramificações menores (menos ramificações durante dissipação)
        const branchCount = isEnding ? Math.floor(MAX_BRANCHES * lightning.alpha) : MAX_BRANCHES;
        
        for (let i = 0; i < branchCount; i++) {
            if (Math.random() > 0.6) continue;
            
            const branchPoint = Math.floor(Math.random() * (mainPath.length - 3)) + 1;
            const startX = mainPath[branchPoint].x;
            const startY = mainPath[branchPoint].y;
            
            const angle = (Math.random() - 0.5) * Math.PI/2;
            const length = Math.random() * lightning.height * 0.3 * (isEnding ? lightning.alpha : 1);
            const endX = startX + Math.sin(angle) * length;
            const endY = startY + Math.cos(angle) * length;
            
            const branchPath = generateLightningPath(
                startX, startY,
                endX, endY,
                currentWidth * 0.5,
                4
            );
            
            ctx.beginPath();
            ctx.moveTo(branchPath[0].x, branchPath[0].y);
            
            for (let i = 1; i < branchPath.length; i++) {
                ctx.lineTo(branchPath[i].x, branchPath[i].y);
            }
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${(0.7 + Math.random() * 0.3) * lightning.alpha})`;
            ctx.lineWidth = branchPath[0].width;
            ctx.stroke();
        }
        
        // 3. Efeito de brilho ao redor do raio (mais fraco durante dissipação)
        for (let i = 0; i < mainPath.length - 1; i++) {
            const p = mainPath[i];
            const next = mainPath[i+1];
            
            const glowGradient = ctx.createLinearGradient(
                p.x, p.y,
                next.x, next.y
            );
            glowGradient.addColorStop(0, `rgba(255, 255, 255, ${GLOW_INTENSITY * lightning.alpha * 0.7})`);
            glowGradient.addColorStop(1, `rgba(200, 230, 255, 0)`);
            
            ctx.strokeStyle = glowGradient;
            ctx.lineWidth = p.width * (isEnding ? 2 : 3);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
        }
        
        // 4. Efeito de impacto no solo (se necessário, mais fraco durante dissipação)
        if (drawY + lightning.height > WORLD_HEIGHT - 50) {
            const impactX = mainPath[mainPath.length-1].x;
            const impactY = mainPath[mainPath.length-1].y;
            
            const impactGradient = ctx.createRadialGradient(
                impactX, impactY, 0,
                impactX, impactY, lightning.width * (isEnding ? 2 : 4)
            );
            impactGradient.addColorStop(0, `rgba(255, 255, 255, ${lightning.alpha * (isEnding ? 0.4 : 0.8)})`);
            impactGradient.addColorStop(0.7, `rgba(200, 230, 255, ${lightning.alpha * (isEnding ? 0.15 : 0.3)})`);
            impactGradient.addColorStop(1, 'rgba(200, 230, 255, 0)');
            
            ctx.fillStyle = impactGradient;
            ctx.beginPath();
            ctx.arc(impactX, impactY, lightning.width * (isEnding ? 2 : 4), 0, Math.PI * 2);
            ctx.fill();
            
            // Menos partículas durante dissipação
            if (!isEnding || Math.random() > 0.7) {
                for (let i = 0; i < (isEnding ? 2 : 5); i++) {
                    particles.push({
                        x: drawX + impactX + (Math.random() - 0.5) * 20,
                        y: drawY + impactY + (Math.random() - 0.5) * 20,
                        vx: (Math.random() - 0.5) * 5,
                        vy: (Math.random() - 0.5) * 5,
                        life: 20 + Math.random() * 30,
                        color: '#ffffff',
                        size: 2 + Math.random() * 3
                    });
                }
            }
        }
        
        ctx.restore();
    }
    
    ctx.restore();
}

function drawLightningWarning() {
    if (!gameState.lightningEvent.active) return;
    
    const elapsedTime = gameTime - gameState.lightningEvent.startTime;
    const remainingTime = LIGHTNING_EVENT_DURATION - elapsedTime;
    const seconds = Math.ceil(remainingTime / 1000);

    const blink = Math.sin(gameTime * 0.01) > 0;

    if (blink) {
        ctx.save();
        // Texto principal (sempre visível durante o evento)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        // Efeito de texto brilhante (mais forte nos primeiros 3 segundos)
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 5;
        ctx.fillText(`TEMPESTADE DE RAIOS! ${seconds}s`, canvas.width / 2, 100);
        ctx.restore();               
    }
}

function drawNebulaClouds() {
    if (!gameState.nebulaEvent.active || gameState.nebulaEvent.clouds.length === 0) return;
    
    ctx.save();
    
    // Verifica se o evento está terminando (últimos 3 segundos)
    const isEnding = (NEBULA_EVENT_DURATION - (gameTime - gameState.nebulaEvent.startTime)) < 3000;
    
    gameState.nebulaEvent.clouds.forEach(cloud => {
        const drawX = cloud.x - gameState.camera.x;
        const drawY = cloud.y;
        
        // Calcula opacidade baseada no tempo restante do evento (apenas se estiver terminando)
        let opacity = cloud.opacity;
        if (isEnding) {
            const timeLeft = NEBULA_EVENT_DURATION - (gameTime - gameState.nebulaEvent.startTime);
            opacity = cloud.opacity * Math.min(1, timeLeft / 3000); // Dissipa nos últimos 3 segundos
        }
        
        // Cria gradiente para efeito de névoa com opacidade ajustada
        const gradient = ctx.createRadialGradient(
            drawX + cloud.width/2, drawY + cloud.height/2, 0,
            drawX + cloud.width/2, drawY + cloud.height/2, Math.max(cloud.width, cloud.height)/2
        );
        gradient.addColorStop(0, `rgba(100, 100, 150, ${opacity})`);
        gradient.addColorStop(1, `rgba(50, 50, 100, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(
            drawX + cloud.width/2, 
            drawY + cloud.height/2,
            cloud.width/2 * (isEnding ? 0.8 + 0.2 * (opacity / cloud.opacity) : 1), // Reduz tamanho durante dissipação
            cloud.height/2 * (isEnding ? 0.8 + 0.2 * (opacity / cloud.opacity) : 1),
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Efeito adicional de dissipação - partículas se espalhando
        if (isEnding && Math.random() < 0.1) {
            for (let i = 0; i < 3; i++) {
                particles.push({
                    x: drawX + cloud.width/2 + (Math.random() - 0.5) * cloud.width/2,
                    y: drawY + cloud.height/2 + (Math.random() - 0.5) * cloud.height/2,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 30 + Math.random() * 20,
                    maxLife: 50,
                    color: `rgba(100, 100, 150, ${opacity * 0.7})`,
                    size: 2 + Math.random() * 3
                });
            }
        }
    });
    
    ctx.restore();
}

function drawNebulaWarning() {
    if (!gameState.nebulaEvent.active) return;
    
    const remainingTime = NEBULA_EVENT_DURATION - (gameTime - gameState.nebulaEvent.startTime);
    const seconds = Math.ceil(remainingTime / 1000);
    
    // Efeito de alerta piscante
    const blink = Math.sin(gameTime * 0.01) > 0;
    
    if (blink) {
        ctx.save();
        ctx.fillStyle = 'rgba(100, 100, 255, 0.7)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`TEMPESTADE NEBULOSA! ${seconds}s`, canvas.width / 2, 70);
        ctx.restore();
    }
}

function drawAsteroidWarning() {
    if (!gameState.asteroidEvent.active) return;
    
    const remainingTime = ASTEROID_EVENT_DURATION - (gameTime - gameState.asteroidEvent.startTime);
    const seconds = Math.ceil(remainingTime / 1000);
    
    // Efeito de alerta piscante
    const blink = Math.sin(gameTime * 0.01) > 0;
    
    if (blink) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`CHUVA DE ASTEROIDES! ${seconds}s`, canvas.width / 2, 40);
        ctx.restore();
    }
}

function drawAsteroids() {
    if (gameState.asteroidEvent.asteroids.length === 0) return;
    
    ctx.save();
    
    gameState.asteroidEvent.asteroids.forEach(asteroid => {
        const drawX = asteroid.x - gameState.camera.x;
        const drawY = asteroid.y;
        
        if (asteroid.fading) {
            ctx.globalAlpha = asteroid.alpha || 1;
        }
        
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(asteroid.rotation);
        
        // Desenhar corpo principal com a forma pré-gerada
        ctx.fillStyle = asteroid.color;
        ctx.beginPath();
        
        // Usar a forma armazenada em vez de gerar nova
        ctx.moveTo(asteroid.shape[0].x, asteroid.shape[0].y);
        for (let i = 1; i < asteroid.shape.length; i++) {
            ctx.lineTo(asteroid.shape[i].x, asteroid.shape[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Detalhes na superfície
        ctx.strokeStyle = '#5D3A1A';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Desenhar crateras pré-geradas
        ctx.fillStyle = '#5D3A1A';
        asteroid.craters.forEach(crater => {
            ctx.beginPath();
            ctx.arc(crater.x, crater.y, crater.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
        
        // Efeito de brilho (opcional)
        if (!asteroid.fading) {
            const glow = ctx.createRadialGradient(
                drawX, drawY, 0,
                drawX, drawY, asteroid.size * 1.5
            );
            glow.addColorStop(0, 'rgba(139, 69, 19, 0.3)');
            glow.addColorStop(1, 'rgba(139, 69, 19, 0)');
            
            ctx.fillStyle = glow;
            ctx.fillRect(drawX - asteroid.size * 1.5, drawY - asteroid.size * 1.5, 
                        asteroid.size * 3, asteroid.size * 3);
        }
    });
    
    ctx.restore();
}

function drawShield() {
    if (!player.shield.active) return;
    
    const centerX = player.x + player.width/2 - gameState.camera.x;
    const centerY = player.y + player.height/2;

    // Desenhar partículas de efeito
    ctx.save();
    player.shieldParticles.forEach((particle, index) => {
        const drawX = particle.x - gameState.camera.x;
        const drawY = particle.y;
        const alpha = particle.life / particle.maxLife || 1;
        
        ctx.globalAlpha = alpha;
        
        switch(particle.type) {
            case 'spark':
                // Partículas que se espalham
                ctx.fillStyle = particle.color;
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
                
                // Safeguard against negative size
                const sparkSize = Math.max(0, particle.startSize * (particle.life / particle.maxLife));
                
                if (sparkSize > 0) { // Only draw if size is positive
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, sparkSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'wave':
                // Ondas de choque concêntricas
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(drawX, drawY, particle.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                particle.radius += particle.growthRate;
                particle.life--;
                break;
                
            case 'glow':
                // Halo brilhante
                const gradient = ctx.createRadialGradient(
                    drawX, drawY, 0,
                    drawX, drawY, particle.radius
                );
                gradient.addColorStop(0, particle.color);
                gradient.addColorStop(1, 'hsla(180, 100%, 80%, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(drawX, drawY, particle.radius, 0, Math.PI * 2);
                ctx.fill();
                
                particle.radius += particle.growthRate;
                particle.life--;
                break;
                
            case 'radial':
                // Partículas em raio a partir do ponto de impacto
                const progress = 1 - (particle.life / (particle.maxLife || 30));
                const currentDistance = particle.distance * progress;
                particle.x = player.x + player.width/2 + Math.cos(particle.angle) * currentDistance;
                particle.y = player.y + player.height/2 + Math.sin(particle.angle) * currentDistance;
                particle.life--;
                
                // Safeguard against negative size
                const radialSize = Math.max(0, particle.size * (1 - progress * 0.5));
                
                if (radialSize > 0) {
                    ctx.fillStyle = particle.color;
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, radialSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'pulse':
                // Pulsação do escudo inteiro
                const pulse = Math.sin(gameTime * particle.pulseSpeed) * particle.pulseSize;
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(drawX, drawY, particle.radius + pulse, 0, Math.PI * 2);
                ctx.stroke();
                particle.life--;
                break;
        }
        
        // Remover partículas com vida esgotada
        if (particle.life <= 0) {
            player.shieldParticles.splice(index, 1);
        }
    });
    ctx.restore();
    
    // Desenhar escudo ativo
    if (player.shield.active) {
        ctx.save();
        
        // Efeito de campo de força (mais fraco conforme o escudo é danificado)
        const shieldStrength = player.shield.strength / player.shield.maxStrength;
        const pulse = (Math.sin(gameTime * 0.01) * 0.1 + 0.9) * shieldStrength;
        
        // Gradiente para o escudo (mais transparente quando danificado)
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, player.shield.radius * pulse
        );
        gradient.addColorStop(0, `rgba(0, 200, 255, ${0.3 * shieldStrength})`);
        gradient.addColorStop(0.7, `rgba(0, 100, 255, ${0.1 * shieldStrength})`);
        gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, player.shield.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Padrão hexagonal de campo de força (mais irregular quando danificado)
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 * shieldStrength})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const hexSize = player.shield.radius * (0.8);
        for (let i = 0; i < 6; i++) {
            // Adiciona alguma irregularidade quando o escudo está danificado
            const angle = i * Math.PI / 3 + gameTime * 0.001 + (Math.random() - 0.5) * 0.1;
            const radius = hexSize * (1 + (Math.random() - 0.5) * 0.05);
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        // Linhas conectando ao centro (menos visíveis quando danificado)
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3 + gameTime * 0.001 + (Math.random() - 0.5) * 0.1;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * hexSize,
                centerY + Math.sin(angle) * hexSize
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

function drawShieldIndicator() {
    const indicatorWidth = 150;
    const indicatorHeight = 15;
    const indicatorX = 10;
    const indicatorY = 100; // Abaixo do indicador de aliados
    
    // Fundo do indicador
    ctx.fillStyle = '#333333';
    ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
    
    // Barra de progresso
    if (player.shield.active) {
        const shieldStrength = player.shield.strength / player.shield.maxStrength;
        
        // Cor muda conforme o escudo é danificado (verde -> amarelo -> vermelho)
        let shieldColor;
        if (shieldStrength > 0.6) {
            shieldColor = '#00aaff';
        } else if (shieldStrength > 0.3) {
            shieldColor = '#8c8c0a';
        } else {
            shieldColor = '#ff5555';
        }
        
        ctx.fillStyle = shieldColor;
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth * shieldStrength, indicatorHeight);
        
        // Efeito de brilho
        const glow = ctx.createRadialGradient(
            indicatorX + indicatorWidth * shieldStrength, indicatorY + indicatorHeight/2,
            0,
            indicatorX + indicatorWidth * shieldStrength, indicatorY + indicatorHeight/2,
            20
        );
        glow.addColorStop(0, `rgba(0, 200, 255, ${0.8 * shieldStrength})`);
        glow.addColorStop(1, 'rgba(0, 100, 255, 0)');
        
        ctx.fillStyle = glow;
        ctx.fillRect(
            indicatorX + indicatorWidth * shieldStrength - 20, 
            indicatorY - 10, 
            40, 
            indicatorHeight + 20
        );
        
        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`ESCUDO ${Math.round(shieldStrength * 100)}%`, indicatorX + 5, indicatorY + 12);
    } else if (!player.shield.ready) {
        const cooldownProgress = (gameTime - player.shield.lastUse) / player.shield.cooldown;
        
        ctx.fillStyle = '#5555ff';
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth * cooldownProgress, indicatorHeight);
        
        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('ESCUDO ENERGIZANDO', indicatorX + 5, indicatorY + 12);
    } else {
        const pulse = Math.sin(player.shield.pulse * 2) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(0, 200, 255, ${pulse})`;
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
        
        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('ESCUDO PRONTO (V)', indicatorX + 5, indicatorY + 12);
    }
    
    // Borda
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
}

function drawNuclearBombIndicator() {
    const indicatorWidth = 150;
    const indicatorHeight = 15;
    const indicatorX = 10;
    const indicatorY = 60; // Abaixo do indicador de turbo
    
    // Fundo do indicador
    ctx.fillStyle = '#333333';
    ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
    
    // Barra de progresso
    if (!player.nuclearBomb.ready) {
        const cooldownProgress = (gameTime - player.nuclearBomb.lastUse) / player.nuclearBomb.cooldown;
        
        ctx.fillStyle = '#ff5555';
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth * cooldownProgress, indicatorHeight);
        
        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('BOMBA REATIVANDO', indicatorX + 5, indicatorY + 12);
    } else {
        const pulse = Math.sin(player.nuclearBomb.pulse * 2) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, 50, 50, ${pulse})`;
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
        
        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('BOMBA PRONTA (B)', indicatorX + 5, indicatorY + 12);
    }
    
    // Borda
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
}

function drawBlackHoleEffect() {
    if (player.blackHoleParticles.length === 0) return;
    
    ctx.save();
    
    // Desenhar partículas com ajuste de câmera
    player.blackHoleParticles.forEach(particle => {
        const alpha = particle.life / 100;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        // Ajustar pela câmera
        const drawX = particle.x - gameState.camera.x;
        const drawY = particle.y;
        ctx.fillRect(drawX, drawY, particle.size, particle.size);
    });
    
    // Desenhar núcleo do buraco negro (com ajuste de câmera)
    const timeSinceUse = gameTime - player.nuclearBomb.lastUse;
    if (timeSinceUse < 1000) {
        // Posição na tela (considerando câmera)
        const bombX = player.x + player.width/2 - gameState.camera.x;
        const bombY = player.y + player.height/2;
        const pulse = Math.sin(timeSinceUse * 0.01) * 5 + 15;
        
        // Desenhar área de efeito (círculo transparente)
        ctx.fillStyle = 'rgba(100, 0, 150, 0.2)';
        ctx.beginPath();
        ctx.arc(bombX, bombY, player.nuclearBomb.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Desenhar borda da área de efeito
        ctx.strokeStyle = 'rgba(200, 0, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bombX, bombY, player.nuclearBomb.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Gradiente radial para o buraco negro
        const gradient = ctx.createRadialGradient(
            bombX, bombY, 0,
            bombX, bombY, pulse
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(0.7, 'rgba(70, 0, 100, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bombX, bombY, pulse, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}
function drawTurboIndicator() {
    const indicatorWidth = 150;
    const indicatorHeight = 15;
    const indicatorX = 10;
    const indicatorY = 40;
    
    // Fundo do indicador
    ctx.fillStyle = '#333333';
    ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
    
    // Barra de progresso
    if (player.turboActive) {
        const remainingTime = player.turboDuration - (gameTime - player.lastTurboUse);
        const progress = remainingTime / player.turboDuration;
        
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth * progress, indicatorHeight);
        
        // Efeito de brilho
        const glow = ctx.createRadialGradient(
            indicatorX + indicatorWidth * progress, indicatorY + indicatorHeight/2,
            0,
            indicatorX + indicatorWidth * progress, indicatorY + indicatorHeight/2,
            20
        );
        glow.addColorStop(0, 'rgba(0, 200, 255, 0.8)');
        glow.addColorStop(1, 'rgba(0, 100, 255, 0)');
        
        ctx.fillStyle = glow;
        ctx.fillRect(
            indicatorX + indicatorWidth * progress - 20, 
            indicatorY - 10, 
            40, 
            indicatorHeight + 20
        );
        
        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('TURBO ATIVO!', indicatorX + 5, indicatorY + 12);
    } else if (!player.turboReady) {
        const cooldownProgress = (gameTime - player.lastTurboUse) / player.turboCooldown;
        
        ctx.fillStyle = '#5555ff';
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth * cooldownProgress, indicatorHeight);
        
        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('TURBO REATIVANDO', indicatorX + 5, indicatorY + 12);
    } else {
        const pulse = Math.sin(player.turboPulse * 2) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(0, 200, 255, ${pulse})`;
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
        
        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('TURBO PRONTO (T)', indicatorX + 5, indicatorY + 12);
    }
    
    // Borda
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
}

function drawAllies() {
    player.allies.ships.forEach(ally => {
        // Efeito de rastro futurista
        if (ally.trail.length > 1) {
            // Gradiente para o rastro
            const trailGradient = ctx.createLinearGradient(
                ally.trail[0].x - gameState.camera.x, ally.trail[0].y,
                ally.trail[Math.floor(ally.trail.length/2)].x - gameState.camera.x, 
                ally.trail[Math.floor(ally.trail.length/2)].y
            );
            trailGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
            trailGradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.5)');
            trailGradient.addColorStop(1, 'rgba(0, 50, 255, 0)');

            // Linha principal do rastro
            ctx.strokeStyle = trailGradient;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            
            ctx.moveTo(ally.trail[0].x - gameState.camera.x, ally.trail[0].y);
            for (let i = 1; i < ally.trail.length; i++) {
                ctx.lineTo(ally.trail[i].x - gameState.camera.x, ally.trail[i].y);
            }
            ctx.stroke();

            // Efeito de partículas energéticas
            for (let i = 0; i < 3; i++) {
                const index = Math.floor(i * ally.trail.length / 3);
                if (ally.trail[index]) {
                    const size = Math.random() * 3 + 2;
                    ctx.fillStyle = `rgba(0, ${200 + Math.random() * 55}, 255, ${0.5 + Math.random() * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(
                        ally.trail[index].x - gameState.camera.x + (Math.random() * 6 - 3),
                        ally.trail[index].y + (Math.random() * 6 - 3),
                        size,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
            }
        }

        // Desenho da nave futurista
        ctx.save();
        ctx.translate(ally.x - gameState.camera.x + ally.width/2, ally.y + ally.height/2);
        
        // Rotação dinâmica se houver velocidade
        if (ally.velocityX !== undefined || ally.velocityY !== undefined) {
            const angle = Math.atan2(ally.velocityY || 0, ally.velocityX || 0.1);
            ctx.rotate(angle);
        }

        // Corpo principal aerodinâmico
        ctx.fillStyle = ally.color || '#1155ff';
        ctx.beginPath();
        ctx.moveTo(-ally.width*0.4, 0);
        ctx.lineTo(ally.width*0.3, -ally.height*0.4);
        ctx.lineTo(ally.width*0.4, 0);
        ctx.lineTo(ally.width*0.3, ally.height*0.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Asas delta futuristas
        ctx.fillStyle = '#0088ff';
        ctx.beginPath();
        // Asa superior
        ctx.moveTo(ally.width*0.1, -ally.height*0.2);
        ctx.lineTo(ally.width*0.4, -ally.height*0.5);
        ctx.lineTo(ally.width*0.6, -ally.height*0.3);
        ctx.lineTo(ally.width*0.3, -ally.height*0.1);
        // Asa inferior
        ctx.moveTo(ally.width*0.1, ally.height*0.2);
        ctx.lineTo(ally.width*0.4, ally.height*0.5);
        ctx.lineTo(ally.width*0.6, ally.height*0.3);
        ctx.lineTo(ally.width*0.3, ally.height*0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Motor de plasma
        const engineGradient = ctx.createRadialGradient(
            ally.width*0.45, 0, 0,
            ally.width*0.45, 0, ally.height*0.3
        );
        engineGradient.addColorStop(0, '#00ffff');
        engineGradient.addColorStop(0.7, '#0066ff');
        engineGradient.addColorStop(1, 'rgba(0, 50, 255, 0)');
        
        ctx.fillStyle = engineGradient;
        ctx.beginPath();
        ctx.arc(ally.width*0.45, 0, ally.height*0.3, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit holográfico
        const cockpitGradient = ctx.createRadialGradient(
            -ally.width*0.2, 0, 0,
            -ally.width*0.2, 0, ally.width*0.15
        );
        cockpitGradient.addColorStop(0, 'rgba(100, 255, 255, 0.9)');
        cockpitGradient.addColorStop(1, 'rgba(0, 100, 255, 0.3)');
        
        ctx.fillStyle = cockpitGradient;
        ctx.beginPath();
        ctx.arc(-ally.width*0.2, 0, ally.width*0.15, 0, Math.PI * 2);
        ctx.fill();

        // Detalhes de energia
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-ally.width*0.3, -ally.height*0.1);
        ctx.lineTo(ally.width*0.1, -ally.height*0.15);
        ctx.moveTo(-ally.width*0.3, ally.height*0.1);
        ctx.lineTo(ally.width*0.1, ally.height*0.15);
        ctx.stroke();

        // Efeito de escudo energético
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, ally.width*0.6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    });
}

function drawAlliesIndicator() {
    const indicatorWidth = 150;
    const indicatorHeight = 15;
    const indicatorX = 10;
    const indicatorY = 80; // Abaixo do indicador de bomba
    
    // Fundo do indicador
    ctx.fillStyle = '#333333';
    ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
    
    // Barra de progresso
    if (!player.allies.ready) {
        const cooldownProgress = (gameTime - player.allies.lastUse) / player.allies.cooldown;
        
        ctx.fillStyle = '#55aa55';
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth * cooldownProgress, indicatorHeight);
        
        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('ALIADOS RETORNANDO', indicatorX + 5, indicatorY + 12);
    } else {
        const pulse = Math.sin(player.allies.pulse * 2) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(100, 200, 100, ${pulse})`;
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
        
        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('ALIADOS PRONTOS (A)', indicatorX + 5, indicatorY + 12);
    }
    
    // Borda
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
}

let stablePulse = 0;

function drawStableState(eCtx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    stablePulse += 0.05;
    const radius = 15 + Math.sin(stablePulse) * 2;

    eCtx.strokeStyle = "#0f0";
    eCtx.lineWidth = 1;
    eCtx.beginPath();
    eCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    eCtx.stroke();

    // Linhas cruzadas
    eCtx.beginPath();
    eCtx.moveTo(cx - 20, cy);
    eCtx.lineTo(cx + 20, cy);
    eCtx.moveTo(cx, cy - 20);
    eCtx.lineTo(cx, cy + 20);
    eCtx.stroke();

    eCtx.fillText(">> NAVEGAÇÃO ESTÁVEL", 10, h - 10);
}

// Meteoros
let meteors = [];

function updateMeteoros() {
    if (meteors.length < 8 && Math.random() < 0.2) {
        meteors.push({
            x: Math.random() * 220,
            y: -10,
            vx: Math.random() * 1 - 0.5,
            vy: 2 + Math.random() * 1.5,
            size: 5 + Math.random() * 5
        });
    }
    meteors.forEach(m => {
        m.x += m.vx;
        m.y += m.vy;
    });
    meteors = meteors.filter(m => m.y < 160);
}

function drawMeteorShower(eCtx) {
    updateMeteoros();
    meteors.forEach(m => {
        const grad = eCtx.createLinearGradient(m.x, m.y, m.x - m.vx * 10, m.y - m.vy * 10);
        grad.addColorStop(0, "rgba(255, 165, 0, 0.7)");
        grad.addColorStop(1, "rgba(255, 0, 0, 0)");
        eCtx.strokeStyle = grad;
        eCtx.lineWidth = 2;
        eCtx.beginPath();
        eCtx.moveTo(m.x, m.y);
        eCtx.lineTo(m.x - m.vx * 10, m.y - m.vy * 10);
        eCtx.stroke();

        eCtx.fillStyle = "#A0522D";
        eCtx.beginPath();
        eCtx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        eCtx.fill();
    });
    eCtx.fillStyle = "#ff9933";
    eCtx.fillText(">> CHUVA DE METEOROS", 10, 150);
}

// Raios
let lightningTimer = 0;

function drawLightningStorm(eCtx, w, h) {
    lightningTimer++;
    if (lightningTimer % 15 === 0) {
        for (let i = 0; i < 2; i++) {
            const x = Math.random() * w;
            eCtx.strokeStyle = ["#00aaff", "#ffff00", "#ff00ff"][i % 3];
            eCtx.lineWidth = 1.5;
            eCtx.beginPath();
            let y = 0;
            eCtx.moveTo(x, y);
            while (y < h) {
                const offsetX = (Math.random() - 0.5) * 10;
                y += Math.random() * 10 + 5;
                eCtx.lineTo(x + offsetX, y);
            }
            eCtx.stroke();
        }
    }
    eCtx.fillStyle = "#88f";
    eCtx.fillText(">> TEMPESTADE DE RAIOS", 10, h - 10);
}

// Névoa
let nebulaParticles = [];

function updateNebula() {
    if (nebulaParticles.length < 25) {
        nebulaParticles.push({
            x: Math.random() * 220,
            y: Math.random() * 160,
            radius: 10 + Math.random() * 30,
            opacity: 0.05 + Math.random() * 0.1,
            vx: -0.2 + Math.random() * 0.4,
            vy: -0.2 + Math.random() * 0.4
        });
    }

    nebulaParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -50 || p.x > 270 || p.y < -50 || p.y > 210) {
            p.x = Math.random() * 220;
            p.y = Math.random() * 160;
        }
    });
}

function drawNebula(eCtx) {
    updateNebula();
    nebulaParticles.forEach(p => {
        eCtx.fillStyle = `rgba(150, 0, 255, ${p.opacity})`;
        eCtx.beginPath();
        eCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        eCtx.fill();
    });
    eCtx.fillStyle = "#d0f";
    eCtx.fillText(">> ZONA DE NEBULOSA", 10, 150);
}

let gridPulse = 0;

function drawDiamondGridBackground(eCtx, w, h) {
    gridPulse += 0.02;
    const alpha = 0.05 + Math.sin(gridPulse) * 0.03;

    eCtx.fillStyle = '#000';
    eCtx.fillRect(0, 0, w, h);

    eCtx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
    eCtx.lineWidth = 1;
    const spacing = 15;

    for (let x = -w; x < w * 2; x += spacing) {
        eCtx.beginPath();
        eCtx.moveTo(x, 0);
        eCtx.lineTo(x - h, h);
        eCtx.stroke();
    }

    for (let x = 0; x < w * 2; x += spacing) {
        eCtx.beginPath();
        eCtx.moveTo(x, 0);
        eCtx.lineTo(x + h, h);
        eCtx.stroke();
    }
}

function drawEventPanel() {
    const canvas = document.getElementById('eventCanvas');
    const eCtx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Fundo com grid em losango completo
    eCtx.fillStyle = '#000';
    eCtx.fillRect(0, 0, w, h);

    eCtx.strokeStyle = 'rgba(0, 255, 0, 0.08)';
    eCtx.lineWidth = 1;
    const spacing = 15;

    // Diagonais ↘
    for (let x = -h; x <= w + h; x += spacing) {
        eCtx.beginPath();
        eCtx.moveTo(x, 0);
        eCtx.lineTo(x + h, h);
        eCtx.stroke();
    }

    // Diagonais ↙
    for (let x = -h; x <= w + h; x += spacing) {
        eCtx.beginPath();
        eCtx.moveTo(x, 0);
        eCtx.lineTo(x - h, h);
        eCtx.stroke();
    }

    // Moldura do painel
    eCtx.strokeStyle = '#0f0';
    eCtx.lineWidth = 2;
    eCtx.strokeRect(0, 0, w, h);

    // Título
    eCtx.font = "13px monospace";
    eCtx.fillStyle = "#0f0";
    eCtx.fillText("⧉ MONITOR ESPACIAL ⧉", 10, 17.5);

    // Estados
    if (gameState.asteroidEvent.active) {
        drawMeteorShower(eCtx);
    } else if (gameState.lightningEvent.active) {
        drawLightningStorm(eCtx, w, h);
    } else if (gameState.nebulaEvent.active) {
        drawNebula(eCtx);
    } else {
        drawStableState(eCtx, w, h);
    }
}

let startScreenTime = 0;

const img = new Image();
img.src = "avatar.png";
img.onload = () => {
    imageLoaded = true;
};

let imageLoaded = false;

function drawStartScreen() {
    if (!gameState.isInStartScreen) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawLineGrid();

    // Brilho pulsante
    const glow = 10 + Math.sin(startScreenTime * 0.05) * 10;

    ctx.fillStyle = "#0f0";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "#0f0";
    ctx.shadowBlur = glow;
    ctx.fillText("DEFENDER", canvas.width / 2, 117);

    ctx.shadowBlur = 0;

    if (imageLoaded) {
        const x = canvas.width / 4;
        const y = 167;
        const width = 400;
        const height = 267;

        // Contorno neon
        ctx.save();
        ctx.shadowColor = "lime";
        ctx.shadowBlur = 20 + Math.sin(startScreenTime * 0.03) * 10;
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);
        ctx.restore();

        // Imagem
        ctx.drawImage(img, x, y, width, height);
    }

    ctx.fillStyle = 'white';
    ctx.font = "24px Arial";
    ctx.fillText("Pressione ENTER para iniciar", canvas.width / 2, 507);

    ctx.restore();

    // Aumentar tempo e animar novamente
    startScreenTime++;
    requestAnimationFrame(drawStartScreen);
}


let gridOffset = 0;

function drawLineGrid() {
    const spacing = 40;
    ctx.strokeStyle = "rgba(0, 255, 0, 0.1)";
    ctx.lineWidth = 1;

    // Animação do grid
    gridOffset += 0.5;

    for (let x = 0; x <= canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = -gridOffset % spacing; y <= canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function render() {
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = currentEnvironment.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Salvar contexto para transformações da câmera
    ctx.save();
    ctx.translate(-gameState.camera.x, -gameState.camera.y);
    
    // Desenhar estrelas
    ctx.fillStyle = currentEnvironment.starColor;
    stars.forEach(star => {
        ctx.globalAlpha = star.brightness;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;

    // Desenhar montanhas (antes do player para ficarem atrás)
    drawPlanets();
    drawEnvironment();
    
    // Desenhar player (formato de nave)
    drawSpaceship(player.x, player.y, player.width, player.height, player.facingRight);
    
    // Desenhar balas do player
    player.bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Desenhar aliens
    aliens.forEach(alien => {
        drawAlien(alien);
    });
    
    // Desenhar balas dos aliens
    alienBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        if (bullet.type === 'simple') {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        } else if (bullet.type === 'triple') {
            // Balas maiores e mais quadradas
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            // Borda brilhante
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(bullet.x, bullet.y, bullet.width, bullet.height);
        } else if (bullet.type === 'burst') {
            // Balas alongadas tipo laser
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            // Efeito de brilho
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(bullet.x + 1, bullet.y + 2, 1, bullet.height - 4);
        } else if (bullet.type === 'tank') {
            // Tiro do Tank - grande e com efeito de brilho
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            // Efeito de brilho vermelho
            const glow = ctx.createRadialGradient(
                bullet.x + bullet.width/2, bullet.y + bullet.height/2, 0,
                bullet.x + bullet.width/2, bullet.y + bullet.height/2, 15
            );
            glow.addColorStop(0, 'rgba(255, 100, 100, 0.8)');
            glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = glow;
            ctx.fillRect(bullet.x - 5, bullet.y - 5, bullet.width + 10, bullet.height + 10);
        } else if (bullet.type === 'homing') {
            // Tiro teleguiado do Hunter - efeito especial
            ctx.save();
            
            // Corpo principal do tiro
            const gradient = ctx.createRadialGradient(
                bullet.x, bullet.y, 0,
                bullet.x, bullet.y, bullet.width
            );
            gradient.addColorStop(0, '#ff00ff');
            gradient.addColorStop(0.7, '#aa00aa');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.width, 0, Math.PI * 2);
            ctx.fill();
            
            // Efeito de rastro
            if (bullet.trail && bullet.trail.length > 1) {
                ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
                for (let i = 1; i < bullet.trail.length; i++) {
                    ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
                }
                ctx.stroke();
            }
            
            // Olho central (que "olha" para o player)
            const angle = Math.atan2(bullet.vy, bullet.vx);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(
                bullet.x + Math.cos(angle) * 3,
                bullet.y + Math.sin(angle) * 3,
                2, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Efeito de pulsação baseado na vida do tiro
            const pulse = (bullet.life / 100) * 2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.width * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
            
            // Adiciona posição atual ao rastro (se não existir)
            if (!bullet.trail) bullet.trail = [];
            bullet.trail.push({ x: bullet.x, y: bullet.y });
            if (bullet.trail.length > 10) bullet.trail.shift();
        } else if (bullet.type === 'disco') {
            // Tiro do Disco Alien - efeito psicodélico
            ctx.save();
            
            // Desenhar rastro
            if (bullet.trail && bullet.trail.length > 1) {
                ctx.lineWidth = 3;
                for (let j = 0; j < bullet.trail.length - 1; j++) {
                    const alpha = j / bullet.trail.length;
                    ctx.strokeStyle = `${bullet.trail[j].color.replace(')', `, ${alpha})`)}`;
                    ctx.beginPath();
                    ctx.moveTo(bullet.trail[j].x, bullet.trail[j].y);
                    ctx.lineTo(bullet.trail[j+1].x, bullet.trail[j+1].y);
                    ctx.stroke();
                }
            }
            
            // Corpo principal do tiro
            const gradient = ctx.createRadialGradient(
                bullet.x, bullet.y, 0,
                bullet.x, bullet.y, bullet.width
            );
            gradient.addColorStop(0, bullet.color);
            gradient.addColorStop(0.7, '#ffffff');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.width, 0, Math.PI * 2);
            ctx.fill();
            
            // Efeito de pulsação
            const pulse = Math.sin(gameTime * 0.01) * 2 + 4;
            ctx.strokeStyle = `rgba(255, 255, 255, 0.7)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, pulse, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        } else if (bullet.type === 'eye') {
            // Tiro do Eye - cruz de energia verde
            ctx.save();
            
            // Efeito de núcleo brilhante
            const coreGradient = ctx.createRadialGradient(
                bullet.x, bullet.y, 0,
                bullet.x, bullet.y, bullet.width * 1.5
            );
            coreGradient.addColorStop(0, '#00ff88');
            coreGradient.addColorStop(0.7, '#00aa55');
            coreGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.width * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Cruz principal (4 direções)
            ctx.fillStyle = '#00ff88';
            // Horizontal
            ctx.fillRect(bullet.x - bullet.width*2, bullet.y - bullet.height/2, bullet.width*4, bullet.height);
            // Vertical
            ctx.fillRect(bullet.x - bullet.height/2, bullet.y - bullet.width*2, bullet.height, bullet.width*4);
            
            // Efeito de pulsação
            const pulse = Math.sin(gameTime * 0.05) * 0.5 + 1;
            ctx.strokeStyle = 'rgba(0, 255, 150, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.width * pulse, 0, Math.PI * 2);
            ctx.stroke();
            
            // Efeito de rastro
            if (bullet.trail && bullet.trail.length > 1) {
                ctx.strokeStyle = 'rgba(0, 255, 150, 0.3)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
                for (let i = 1; i < bullet.trail.length; i++) {
                    ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
                }
                ctx.stroke();
            }
            
            ctx.restore();
        } else if (bullet.type === 'medic') {
            // Tiro do médico com efeito de cura invertido (dano)
            ctx.fillStyle = bullet.color;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Efeito de aura
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.width/2 * 1.5, 0, Math.PI * 2);
            ctx.stroke();
        } else if (bullet.type === 'swarm') {
            // Efeito de partícula rastreadora
            ctx.save();
            ctx.globalAlpha = 0.7;
            
            // Gradiente para o tiro
            const gradient = ctx.createRadialGradient(
                bullet.x, bullet.y, 0,
                bullet.x, bullet.y, 6
            );
            gradient.addColorStop(0, bullet.color);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Núcleo brilhante
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    });

    // Desenhar lasers
    player.lasers.forEach(laser => {
        // Desenhar rastro
        ctx.strokeStyle = `rgba(0, 255, 255, ${laser.alpha * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        if (laser.trail.length > 1) {
            ctx.moveTo(laser.trail[0].x, laser.trail[0].y);
            for (let i = 1; i < laser.trail.length; i++) {
                ctx.lineTo(laser.trail[i].x, laser.trail[i].y);
            }
            ctx.stroke();
        }
        
        // Corpo principal do laser
        ctx.fillStyle = `rgba(0, 255, 255, ${laser.alpha})`;
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        
        // Brilho intenso no centro
        const glowGradient = ctx.createRadialGradient(
            laser.x + laser.width/2, laser.y + laser.height/2, 0,
            laser.x + laser.width/2, laser.y + laser.height/2, 10
        );
        glowGradient.addColorStop(0, `rgba(0, 255, 255, ${laser.alpha * 0.8})`);
        glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(laser.x - 5, laser.y - 5, laser.width + 10, laser.height + 10);
    });

    // Desenhar tiros de espalhamento
    player.spreadShots.forEach(shot => {
        // Efeito de brilho
        const glow = ctx.createRadialGradient(
            shot.x + shot.width/2, shot.y + shot.height/2, 0,
            shot.x + shot.width/2, shot.y + shot.height/2, 10
        );
        glow.addColorStop(0, shot.color);
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = glow;
        ctx.fillRect(shot.x - 5, shot.y - 5, shot.width + 10, shot.height + 10);
        
        // Corpo do tiro
        ctx.fillStyle = shot.color;
        ctx.fillRect(shot.x, shot.y, shot.width, shot.height);
    });
    
    // Desenhar partículas
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, 3, 3);
    });
    ctx.globalAlpha = 1;

    player.turboParticles.forEach(particle => {
        const alpha = Math.min(1, particle.life / 20);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;

    // Restaurar contexto
    ctx.restore();

    if (player.isForceFieldActive) {
        ctx.fillStyle = '#00aaff';
        ctx.font = '14px Arial';
        ctx.fillText(
            `CAMPO ATIVO: ${((player.forceFieldEndTime - gameTime) / 1000).toFixed(1)}s`,
            17,
            155
        );
    }

    // Desenhar indicador de turbo
    drawTurboIndicator();
    drawHealthBar();
    drawRespawnCountdown();
    drawNuclearBombIndicator();
    drawBlackHoleEffect();
    drawAllies();
    drawAlliesIndicator();
    drawShield();
    drawForceField();
    gameState.drops.forEach(drop => {
        drawDrop(drop);
    });
    drawShieldIndicator();
    drawSpreadShotCooldown();
    drawDrone();
    drawDroneIndicator();
    drawNeuralCanvas();
    drawAsteroids();
    drawTimeEffects();
    drawNebulaClouds();
    drawLightnings();
    drawAsteroidWarning();
    drawNebulaWarning();
    drawHealthMonitor();
    drawLightningWarning();
    drawRadar();
    drawEventPanel()
    applyCRTEffect();         
    drawGameOver();
}

function drawGameOver() {
    // Desenhar UI (fora da câmera)
    if (gameState.gameOver) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2.8);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Pontuação Final: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText('Pressione R para reiniciar', canvas.width / 2, canvas.height / 2 + 100);
        ctx.restore();
    }            
}

function applyCRTEffect() {
    if (!gameState.crtEffectEnabled) return;

    // 1. Scanlines horizontais
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 1);
    }
    
    // 2. Brilho verde (CRT glow)
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 3. Vignette (escurecimento nas bordas)
    const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, canvas.width/3,
        canvas.width/2, canvas.height/2, canvas.width/1.5
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function drawRespawnCountdown() {
    if (!gameState.isRespawning) return;

    // Efeito psicodélico de fundo (pulsante)
    const pulse = Math.sin(gameTime * 0.01) * 0.5 + 0.5; // Valor entre 0.5 e 1.0
    const hue = (gameTime * 0.1) % 360; // Rotação de cores
    
    // Gradiente radial psicodélico
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
    );
    gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, ${pulse * 0.3})`);
    gradient.addColorStop(1, `hsla(${(hue + 180) % 360}, 100%, 50%, ${pulse * 0.1})`);
    
    // Aplica o efeito
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = `hsl(${hue}, 100%, 70%)`; // Cor combina com o efeito
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        `Nova onda em: ${gameState.respawnCountdown}s`,
        canvas.width / 2,
        canvas.height / 2
    );
    ctx.restore();
}

function drawHealthBar() {
    const healthBarWidth = 150;
    const healthBarHeight = 20;
    const healthPercentage = player.health / player.maxHealth;
    
    // Posição da barra de vida (canto superior esquerdo)
    const healthBarX = 10;
    const healthBarY = 10;
    
    // Fundo da barra de vida
    ctx.fillStyle = '#333333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Vida atual
    if (healthPercentage > 0.6) {
        ctx.fillStyle = '#00ff00';
    } else if (healthPercentage > 0.3) {
        ctx.fillStyle = '#ffff00';
    } else {
        ctx.fillStyle = '#ff0000';
    }
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
    
    // Borda da barra de vida
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Texto com a vida atual/total (centralizado na barra)
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textX = healthBarX + healthBarWidth / 2;
    const textY = healthBarY + healthBarHeight / 2 + 1;
    ctx.fillText(`${Math.floor(player.health)}/${player.maxHealth}`, textX, textY);
    
    // Adiciona sombra para melhor contraste se necessário
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(`${Math.floor(player.health)}/${player.maxHealth}`, textX, textY);
    
    ctx.restore();
}

const neuralState = {
    nodes: [],
    maxNodes: 25,
    pulse: 0
};

function initNeuralNetwork() {
    const canvas = document.getElementById('neuralCanvas');
    const w = canvas.width;
    const h = canvas.height;

    for (let i = 0; i < neuralState.maxNodes; i++) {
        neuralState.nodes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }
}

function drawNeuralCanvas() {
    const canvas = document.getElementById('neuralCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const nodes = neuralState.nodes;
    const pulse = neuralState.pulse;
    const intensity = Math.min(1, (getNearbyEnemiesCount() * 0.05));

    // Atualizar posições
    nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
    });

    // Conexões (sinapses)
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 60 + intensity * 40) {
                const alpha = 1 - dist / 100;
                ctx.strokeStyle = `rgba(0,255,255,${alpha * intensity})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }
    }

    // Nós (neurônios)
    nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2 + intensity * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,200,${0.7 + 0.3 * Math.sin(gameTime / 100)})`;
        ctx.fill();
    });
}

function getNearbyEnemiesCount(radius = 300) {
    let count = 0;
    for (let alien of aliens) {
        const dx = player.x - alien.x;
        const dy = player.y - alien.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) count++;
    }
    return count;
}

const panelCanvas = document.getElementById("panelCanvas");
const pCtx = panelCanvas.getContext("2d");

let energyGraph = [];
const graphLength = 60;

let panelGraphMode = 0;
const totalGraphModes = 6; // altere se adicionar mais
let lastGraphSwitch = gameTime;
const GRAPH_SWITCH_INTERVAL = 12000; // troca a cada 12s

let binaryBuffer = Array(graphLength).fill(0);
let lastBit = 0;
let binaryTimer = 0;
const binaryTickSpeed = 100; // ms por bit novo
const bitHold = 4;
let bitHoldCounter = 0;

function updateBinarySignalBuffer() {
    const now = gameTime;
    if (now - binaryTimer > binaryTickSpeed) {
        binaryTimer = now;

        if (bitHoldCounter <= 0) {
            // Decide se muda o bit
            if (Math.random() > 0.6) {
                lastBit = lastBit === 1 ? 0 : 1;
            }

            bitHoldCounter = bitHold;
        }

        // Adiciona novo bit
        binaryBuffer.shift();
        binaryBuffer.push(lastBit);
        bitHoldCounter--;
    }
}

function updatePanel() {
    const w = panelCanvas.width;
    const h = panelCanvas.height;

    // Atualiza os dados do gráfico
    energyGraph.push(Math.sin(gameTime * 0.004) * 30 + 50 + Math.random() * 5);
    if (energyGraph.length > graphLength) energyGraph.shift();

    // Limpa
    pCtx.clearRect(0, 0, w, h);

    // Fundo com grade
    pCtx.strokeStyle = "rgba(0, 255, 0, 0.2)";
    pCtx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 20) {
        pCtx.beginPath();
        pCtx.moveTo(i, 0);
        pCtx.lineTo(i, h);
        pCtx.stroke();
    }
    for (let j = 0; j < h; j += 20) {
        pCtx.beginPath();
        pCtx.moveTo(0, j);
        pCtx.lineTo(w, j);
        pCtx.stroke();
    }

    // Gráfico de energia
    switch (panelGraphMode) {
        case 0:
            drawLineGraph(pCtx, w, h);
            break;
        case 1:
            drawBinarySignal(pCtx, w, h);
            break;
        case 2:
            drawSpikyWave(pCtx, w, h);
            break;
        case 3:
            drawRadarPulse(pCtx, w, h);
            break;
        case 4:
            updateCrossScan();
            drawCrossScan(pCtx, w, h);
            break;
        case 5:
            updateColumnFlow();
            drawColumnFlow(pCtx, w, h);
            break;
    }

    // // Indicadores visuais
    drawIndicator(10, 20, "Escudo", player.shield.active, player.shield.ready);
    drawIndicator(10, 40, "Turbo", player.turboActive, player.turboReady);
    drawIndicator(10, 60, "Drone", player.drone.active, player.drone.ready);

    // Pulsante 'nave ativa'
    const pulse = (Math.sin(gameTime * 0.005) + 1) / 2;
    pCtx.fillStyle = `rgba(0, 255, 0, ${0.2 + pulse * 0.3})`;
    pCtx.beginPath();
    pCtx.arc(w - 20, h - 140, 10 + pulse * 3, 0, Math.PI * 2);
    pCtx.fill();

    pCtx.fillStyle = "#0f0";
    pCtx.font = "10px monospace";
    pCtx.fillText("Nave Ativa", w - 68, h - 12);

    if (gameTime - lastGraphSwitch > GRAPH_SWITCH_INTERVAL) {
        panelGraphMode = (panelGraphMode + 1) % totalGraphModes;
        lastGraphSwitch = gameTime;
    }
}

function drawRadarPulse(ctx, w, h) {
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = 40 + Math.sin(gameTime * 0.005) * 10;

    ctx.strokeStyle = "rgba(0,255,150,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#00ff88";
    ctx.font = "10px monospace";
    ctx.fillText("VARREDURA", 8, h - 11);
}

function drawLineGraph(ctx, w, h) {
    ctx.beginPath();
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < energyGraph.length; i++) {
        const x = (i / graphLength) * w;
        const y = h - energyGraph[i];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function drawBinarySignal(ctx, w, h) {
    const midY = h / 1.6;
    const amplitude = h * 0.1;
    const bitWidth = w / binaryBuffer.length;

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.beginPath();

    let currentY = binaryBuffer[0] ? midY - amplitude : midY + amplitude;
    ctx.moveTo(0, currentY);

    for (let i = 0; i < binaryBuffer.length; i++) {
        const x = i * bitWidth;
        const nextY = binaryBuffer[i] ? midY - amplitude : midY + amplitude;

        if (nextY !== currentY) {
            ctx.lineTo(x, currentY);
            ctx.lineTo(x, nextY);
        }

        ctx.lineTo(x + bitWidth, nextY);
        currentY = nextY;
    }

    ctx.stroke();

    ctx.fillStyle = "#0f0";
    ctx.font = "10px monospace";
    ctx.fillText("Sinal Binário", 8, h - 11);
}

function drawSpikyWave(ctx, w, h) {
    ctx.beginPath();
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 1;
    for (let i = 0; i < energyGraph.length; i++) {
        const x = (i / graphLength) * w;
        const y = h - (energyGraph[i] + Math.sin(i * 0.5 + gameTime * 0.01) * 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

const columnCount = 20;
let columnHeights = Array(columnCount).fill(0).map(() => 0.5 + (Math.random() - 0.5) * 0.1);

function updateColumnFlow() {
    for (let i = 0; i < columnCount; i++) {
        // Transição suave
        const target = Math.random();
        columnHeights[i] += (target - columnHeights[i]) * 0.05;
    }
}

function drawColumnFlow(ctx, w, h) {
    const colWidth = w / columnCount;

    for (let i = 0; i < columnCount; i++) {
        const x = i * colWidth;
        const height = columnHeights[i] * h * 0.6;
        const y = h - height;

        ctx.fillStyle = "#00ff88";
        ctx.fillRect(x + 1, y - 30, colWidth - 2, height);
    }

    ctx.fillStyle = "#0f0";
    ctx.font = "10px monospace";
    ctx.fillText("Atividade Neural", 8, h - 11);
}

let scanAngle1 = 0;
let scanAngle2 = Math.PI / 2;

function updateCrossScan() {
    scanAngle1 += 0.01;
    scanAngle2 -= 0.013;
}

function drawCrossScan(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const length = Math.max(w, h);

    // Linha 1
    ctx.strokeStyle = "rgba(0,255,255,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(scanAngle1) * length, cy - Math.sin(scanAngle1) * length);
    ctx.lineTo(cx + Math.cos(scanAngle1) * length, cy + Math.sin(scanAngle1) * length);
    ctx.stroke();

    // Linha 2
    ctx.strokeStyle = "rgba(255,0,255,0.5)";
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(scanAngle2) * length, cy - Math.sin(scanAngle2) * length);
    ctx.lineTo(cx + Math.cos(scanAngle2) * length, cy + Math.sin(scanAngle2) * length);
    ctx.stroke();

    // Centro
    ctx.fillStyle = "#0f0";
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f0";
    ctx.font = "10px monospace";
    ctx.fillText("Scan Cruzado", 8, h - 11);
}

function drawIndicator(x, y, label, isActive, isReady) {
    let stateText;
    let statusColor;

    if (isActive) {
        stateText = "Ativo";
        statusColor = "#ffff00"; // amarelo
    } else if (!isReady) {
        stateText = "Recarregando";
        statusColor = "#ff0000"; // vermelho
    } else {
        stateText = "Pronto";
        statusColor = "#00ff00"; // verde
    }

    // Rótulo
    pCtx.fillStyle = "#0f0";
    pCtx.font = "11px monospace";
    pCtx.fillText(label + ":", x, y);

    // Estado
    pCtx.fillStyle = statusColor;
    pCtx.fillText(stateText, x + 50, y);
}

function drawPausedGame() {
    // Desenhar indicador de pausa (se o jogo estiver pausado)
    if (gameState.gamePaused && attributesPanel.style.display !== 'block') {
        ctx.save();
        
        // Fundo semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar grid diagonal no fundo
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
        ctx.lineWidth = 1;
        const spacing = 50; // Espaçamento entre as linhas
        
        // Diagonais ↘
        for (let x = -canvas.height; x <= canvas.width + canvas.height; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + canvas.height, canvas.height);
            ctx.stroke();
        }
        
        // Diagonais ↙
        for (let x = -canvas.height; x <= canvas.width + canvas.height; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x - canvas.height, canvas.height);
            ctx.stroke();
        }
        
        // Texto de pausa centralizado
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('JOGO PAUSADO', canvas.width/2, canvas.height/2 - 10);
        
        // Instruções
        ctx.font = '24px Arial';
        ctx.fillText('Pressione P para continuar', canvas.width/2, canvas.height/2 + 40);
        
        ctx.restore();
    }
}

function gameLoop() {
    const now = Date.now();
    const deltaTime = !gameState.gamePaused ? now - lastFrameTime : 0;
    gameTime += deltaTime;
    lastFrameTime = now;

    if (!gameState.gameOver && !gameState.isInStartScreen && !gameState.gamePaused) {
        if (!gameState.asteroidEvent.active && gameTime > gameState.asteroidEvent.nextEventTime) {
            initAsteroidEvent();
        }

        if (!gameState.nebulaEvent.active && gameTime > gameState.nebulaEvent.nextEventTime) {
            initNebulaEvent();
        }

        // Sistema de respawn integrado
        if (aliens.length === 0 && !gameState.isRespawning) {
            gameState.isRespawning = true;
            gameState.respawnCountdown = RESPAWN_TIME / 1000;
            gameState.lastRespawnTick = gameTime;
        }

        if (gameState.isRespawning) {
            if (gameTime - gameState.lastRespawnTick >= 1000) {
                gameState.respawnCountdown--;
                gameState.lastRespawnTick = gameTime;
                
                if (gameState.respawnCountdown <= 0) {
                    changeEnvironment();
                    spawnAliens();
                    gameState.isRespawning = false;
                }
            }
        }

        updateBinarySignalBuffer();
        updatePanel();
        updatePlayer();
        updateAliens();
        updateAllies();
        updateDrops();
        updateParticles();
        updateAsteroids();
        updateLightnings();
        updateDrone();
        updateNuclearBomb();
        updateNebulaClouds();
        updateTimeFields();
        checkCollisions();
        checkAsteroidCollisions();
        checkLightningCollisions();
        updateCamera();
        updateShield();
        render();
    }

    drawPausedGame();

    // Atualizar UI
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('aliens').textContent = aliens.length;
    
    requestAnimationFrame(gameLoop);
}

function activateControls() {
    document.getElementById('radarCanvas').style.display = 'block';
    document.getElementById('eventCanvas').style.display = 'block';
    document.getElementById('panelCanvas').style.display = 'block';
    document.getElementById('healthMonitorCanvas').style.display = 'block';
    document.getElementById('neuralCanvas').style.display = 'block';
    document.getElementById('musicControls').style.display = 'block';
    crtToggle.style.display = 'block';
}

function deactivateControls() {
    document.getElementById('radarCanvas').style.display = 'none';
    document.getElementById('eventCanvas').style.display = 'none';
    document.getElementById('panelCanvas').style.display = 'none';
    document.getElementById('healthMonitorCanvas').style.display = 'none';
    document.getElementById('neuralCanvas').style.display = 'none';
    document.getElementById('musicControls').style.display = 'none';
    crtToggle.style.display = 'none';
}

function resetGame() {
    gameState = {
        score: 0,
        lives: 3,
        gameOver: false,
        camera: { x: 0, y: 0 },
        isRespawning: false,
        respawnCountdown: 0,
        crtEffectEnabled: false,
        asteroidEvent: {
            active: false,
            startTime: 0,
            asteroids: [],
            nextEventTime: gameTime + ASTEROID_EVENT_INTERVAL // Reinicia o timer para o primeiro evento
        },
        nebulaEvent: {
            active: false,
            startTime: 0,
            nextEventTime: gameTime + NEBULA_EVENT_INTERVAL,
            clouds: [],
            lastCloudSpawn: 0
        },
        lightningEvent: {
            active: false,
            startTime: 0,
            lightnings: [],
            nextEventTime: gameTime + LIGHTNING_EVENT_INTERVAL,
            warning: false
        },
        drops: [],
        timeFields: [],
        playerLevel: 1,
        playerXP: 0,
        xpToNextLevel: 100,
        availablePoints: 0,
        attributes: {
            speed: { base: 5, bonus: 0, max: 7 }, // Velocidade base é 5, pode aumentar até +5
            health: { base: 100, bonus: 0, max: 150 }, // Vida base 100, pode aumentar até 150
            spreadCooldown: { base: 15000, bonus: 0, max: 5000 }, // Cooldown do tiro espalhado
            turboCooldown: { base: 10000, bonus: 0, max: 4500 } // Cooldown do turbo
        }
    };

    // Reset da interface de progressão
    document.getElementById('xpBar').style.width = '0%';
    document.getElementById('xpText').textContent = 'Level 1 (0/100)';
    
    // Atualiza os valores no painel de atributos (se estiver visível)
    updateAttributesPanel();
    
    // Esconde o painel de atributos se estiver visível
    document.getElementById('attributesPanel').style.display = 'none';
    
    // Garante que a barra de XP está visível
    document.getElementById('xpBarContainer').style.display = 'block';
    
    // Atualiza a exibição de vidas e score
    updateLevelDisplay();

    crtToggle.classList.toggle('active', gameState.crtEffectEnabled);
    crtToggle.textContent = `CRT Effect: ${gameState.crtEffectEnabled ? 'ON' : 'OFF'}`;
    
    player.x = 100;
    player.y = 300;
    player.bullets = [];
    player.lasers = [];
    player.health = player.maxHealth;
    player.isInvulnerable = false;
    player.invulnerableTimer = 0;
    player.blinkTimer = 0;
    player.spreadShots = [];
    player.spreadShotReady = true;
    player.spreadShotPulse = 0;
    player.turboActive = false;
    player.turboReady = true;
    player.turboPulse = 0;
    player.turboParticles = [];
    player.speed = player.baseSpeed;
    player.nuclearBomb = {
        ready: true,
        lastUse: 0,
        cooldown: 30000,
        pulse: 0,
        radius: 250
    };
    player.blackHoleParticles = [];
    player.allies = {
        ready: true,
        lastUse: 0,
        cooldown: 25000,
        pulse: 0,
        ships: [],
        damage: 1
    };
    player.shield = {
        active: false,
        ready: true,
        lastUse: 0,
        cooldown: 20000, // 20 segundos
        pulse: 0,
        radius: 40, // Raio do escudo
        strength: 100, // "Vida" do escudo
        maxStrength: 100
    };
    player.isForceFieldActive = false;
    player.forceFieldEndTime = 0;
    player.forceFieldParticles = [];
    player.drone = {
        active: false,
        ready: true,
        lastUse: 0,
        cooldown: 30000, // 30 segundos de cooldown
        duration: 10000, // 10 segundos de duração
        pulse: 0,
        x: 0,
        y: 0,
        bullets: [], // Limpa todos os tiros do drone
        lastShot: 0,
        shootDelay: 500 // Atira a cada 0.5 segundos
    };
    player.facingRight = true;
    
    aliens.length = 0;
    alienBullets.length = 0;
    particles.length = 0;

    aliens.forEach(alien => {
        alien.health = alien.maxHealth;
    });

    musicPlayer.togglePlay();
    
    spawnAliens();
}

crtToggle.addEventListener('click', () => {
    gameState.crtEffectEnabled = !gameState.crtEffectEnabled;
    crtToggle.classList.toggle('active', gameState.crtEffectEnabled);
    crtToggle.textContent = `CRT Effect: ${gameState.crtEffectEnabled ? 'ON' : 'OFF'}`;
});

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === 'Enter' && gameState.isInStartScreen) {
        gameState.isInStartScreen = false; // Sai da tela inicial
        init();
    }
    
    if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        resetGame();
        activateControls();
    }

    if (e.key.toLowerCase() === 'p' && !gameState.isInStartScreen) {
        gameState.gamePaused = !gameState.gamePaused;
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Iniciar jogo
drawStartScreen();

let hasAlerted = false;
let resizeTimeout;

function checkCanvasFitsScreen() {
    const canvas = document.getElementById('gameCanvas');
    const minWidth = 1350;
    const minHeight = 775;

    if (window.innerWidth < minWidth || window.innerHeight < minHeight) {
        if (!hasAlerted) {
            alert(`Seu dispositivo/tela é muito pequeno para rodar o jogo.\n\nRequisitos mínimos: ${minWidth}x${minHeight} pixels.\n\nAjuste o zoom ou use um dispositivo com tela maior.`);
            hasAlerted = true;
        }
        return false;
    }
    hasAlerted = false;
    return true;
}

// Verificação inicial
if (!checkCanvasFitsScreen()) {
    canvas.style.display = 'none';
}

// Listener para redimensionamento (com debounce)
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const canvas = document.getElementById('gameCanvas');
        if (!checkCanvasFitsScreen()) {
            canvas.style.display = 'none';
        } else {
            canvas.style.display = 'block';
        }
    }, 200);
});