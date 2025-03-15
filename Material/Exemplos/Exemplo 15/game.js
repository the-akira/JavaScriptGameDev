// Configuração do Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const stateDisplay = document.getElementById('currentState');
const scoreDisplay = document.getElementById('score');
const enemiesDisplay = document.getElementById('enemies');
const positionDisplay = document.getElementById('position');

// Constantes do jogo
const GRAVITY = 0.6;
const TILE_SIZE = 50;
const MAP_WIDTH = 40; // 40 tiles de largura
const MAP_HEIGHT = 12; // 12 tiles de altura

// Variáveis do jogo
let score = 0;
let camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
};

// Adicione esta variável ao seu estado de jogo
let isDayNightTransitioning = false;
let isNightTime = false;
let transitionProgress = 0;
const transitionDuration = 350; // Tempo de transição (3 segundos a 60 FPS)
let transitionDirection = 1; // 1 = para noite, -1 = para dia

// Função para alternar entre dia e noite
function toggleDayNight() {
    if (!isDayNightTransitioning) {
        isDayNightTransitioning = true;
        transitionProgress = 0;
        transitionDirection = isNightTime ? -1 : 1; // Alternar entre noite e dia
    }
}

// Atualizar a transição a cada frame
function updateDayNightTransition() {
    if (isDayNightTransitioning) {
        transitionProgress += 1;

        if (transitionProgress >= transitionDuration) {
            isDayNightTransitioning = false;
            isNightTime = !isNightTime; // Alterna entre dia e noite ao completar a transição
        }
    }
}

setInterval(toggleDayNight, 30000);

// Classe para gerenciar o mapa
class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        // Definir o mapa como uma grid (matriz de strings ou números)
        const mapGrid = [
            "0000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000",
            "0000111000000000000000000000000000000000",
            "0000000000000000011100000011000011100000",
            "0000000000000000000000001100000000000000",
            "0000000001111000000000000000000000000000",
            "0000000000000000000000000000000000000000",
            "0000000000000000000000000000111110000000",
            "1111111111111111111111111111111111111111",
        ];
        // Converter a grid em uma matriz de números
        for (let y = 0; y < mapGrid.length; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < mapGrid[y].length; x++) {
                this.tiles[y][x] = parseInt(mapGrid[y][x]); // Converter string para número
            }
        }    
        // Gerar posições aleatórias para montanhas e pinheiros
        this.generateBackground();
    }
    
    // Gerar elementos de fundo
    generateBackground() {
        // Gerar perfis de montanhas (múltiplas camadas)
        this.mountains = [];
        
        // Primeira camada de montanhas (mais distante)
        const mountainLayer1 = {
            color: '#6B8E23', // Cor verde oliva
            points: [],
            y: 150,
            amplitude: 50,
            frequency: 0.02
        };

        // Segunda camada de montanhas (intermediária)
        const mountainLayer2 = {
            color: '#556B2F', // Cor verde escuro
            points: [],
            y: 170,
            amplitude: 70,
            frequency: 0.03
        };

        // Terceira camada de montanhas (mais próxima)
        const mountainLayer3 = {
            color: '#2F4F4F', // Cor cinza escuro esverdeado
            points: [],
            y: 200,
            amplitude: 100,
            frequency: 0.04
        };
        
        // Gerar pontos para cada camada de montanhas
        for (let layer of [mountainLayer1, mountainLayer2, mountainLayer3]) {
            for (let x = 0; x < this.width * TILE_SIZE + 200; x += 5) {
                const y = layer.y - Math.abs(Math.sin(x * layer.frequency) * layer.amplitude);
                layer.points.push({x, y});
            }
            this.mountains.push(layer);
        }

        // Definir posições das nuvens no mundo do jogo (similar aos pinheiros)
        const cloudPositions = [
            { x: 200, y: 90, width: 120, height: 60 },
            { x: 530, y: 130, width: 150, height: 70 },
            { x: 900, y: 80, width: 100, height: 50 },
            { x: 1300, y: 95, width: 180, height: 80 },
            { x: 1700, y: 70, width: 130, height: 65 },
            { x: 2100, y: 80, width: 160, height: 75 },
        ];

        // Inicializar o array de nuvens
        this.clouds = [];

        // Usar diretamente as posições definidas
        this.clouds = [...cloudPositions];

        // Alternativa: Usar as posições definidas com pequenas variações aleatórias
        cloudPositions.forEach(position => {
            // Adicionar pequenas variações para criar naturalidade
            const xVariation = Math.random() * 30 - 15; // Variação de -15 a +15 pixels
            const yVariation = Math.random() * 10 - 5; // Variação de -5 a +5 pixels
            const sizeVariation = Math.random() * 20 - 10; // Variação de -10 a +10 pixels
            
            this.clouds.push({
                x: position.x + xVariation,
                y: position.y + yVariation,
                width: position.width + sizeVariation,
                height: position.height + sizeVariation / 2 // Mantém proporcionalidade
            });
        });
        
        // Gerar pinheiros
        const pinePositions = [
            { x: 80, y: 550, size: 80, depth: 1.6 },
            { x: 190, y: 550, size: 50, depth: 1.2 },
            { x: 350, y: 550, size: 40, depth: 0.8 },
            { x: 600, y: 550, size: 60, depth: 1.5 },
            { x: 700, y: 550, size: 65, depth: 1.5 },
            { x: 815, y: 550, size: 100, depth: 1.5 },
            { x: 850, y: 550, size: 45, depth: 1.0 },
            { x: 1100, y: 550, size: 55, depth: 1.3 },
            { x: 1400, y: 550, size: 35, depth: 0.7 },
            { x: 1400, y: 510, size: 70, depth: 1.2 },
            { x: 1700, y: 550, size: 65, depth: 1.4 },
            { x: 2000, y: 550, size: 50, depth: 1.1 },
        ];

        // Inicializar o array de pinheiros
        this.pines = [];

        // Opção 1: Usar diretamente as posições definidas
        this.pines = [...pinePositions];

        // Opção 2: Usar as posições definidas com pequenas variações aleatórias
        pinePositions.forEach(position => {
            // Adicionar pequenas variações para criar naturalidade
            const xVariation = Math.random() * 30 - 15; // Variação de -15 a +15 pixels
            const sizeVariation = Math.random() * 10 - 5; // Variação de -5 a +5 pixels
            const depthVariation = (Math.random() * 0.2) - 0.1; // Variação de -0.1 a +0.1 na profundidade
            
            this.pines.push({
                x: position.x + xVariation,
                y: position.y,
                size: position.size + sizeVariation,
                depth: position.depth + depthVariation
            });
        });

        // Opção 3: Combinação de posições manuais e algumas aleatórias
        this.pines = [...pinePositions]; // Começar com as posições manuais
    }
    
    // Verificar se uma posição tem um bloco sólido
    isSolid(x, y) {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        // Verificar limites do mapa
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return false;
        }
        return this.tiles[tileY][tileX] === 1; // 1 = bloco sólido
    }

    // Método para desenhar uma nuvem
    drawCloud(x, y, width, height, offsetY) {
        // Ajustar posição Y com o offset fornecido
        const drawY = y + offsetY;
        
        // Criar um gradiente para a nuvem
        const cloudGradient = ctx.createLinearGradient(x, drawY, x, drawY + height);
        cloudGradient.addColorStop(0, '#FFFFFF'); // Branco no topo
        cloudGradient.addColorStop(1, '#E6E6FA'); // Lavanda bem clara na base
        
        ctx.fillStyle = cloudGradient;
        
        // Desenhar forma da nuvem usando círculos combinados
        const radius = height / 2;
        
        // Círculo principal (centro)
        ctx.beginPath();
        ctx.arc(x, drawY + radius, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculo à esquerda
        ctx.beginPath();
        ctx.arc(x - width / 4, drawY + radius, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculo à direita
        ctx.beginPath();
        ctx.arc(x + width / 4, drawY + radius, radius * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculo superior
        ctx.beginPath();
        ctx.arc(x, drawY + radius * 0.5, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculo inferior esquerdo
        ctx.beginPath();
        ctx.arc(x - width / 3, drawY + radius * 1.2, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculo inferior direito
        ctx.beginPath();
        ctx.arc(x + width / 3, drawY + radius * 1.3, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Desenhar um pinheiro
    drawPine(x, y, size, offsetY) {
        // Ajustar a posição Y com o offset fornecido
        const drawY = y + offsetY;

        // Gradiente para o tronco
        const trunkGradient = ctx.createLinearGradient(
            x - size/10, drawY - size/2, // Ponto inicial
            x + size/10, drawY - size/2  // Ponto final
        );
        trunkGradient.addColorStop(0, '#8B4513'); // Marrom escuro
        trunkGradient.addColorStop(1, '#A0522D'); // Marrom mais claro
        ctx.fillStyle = trunkGradient;
        ctx.fillRect(x - size/10, drawY - size/2, size/5, size/2);

        // Gradiente para a folhagem
        const foliageGradient = ctx.createRadialGradient(
            x, drawY - size * 1.2, size * 0.2, // Centro do gradiente
            x, drawY - size * 1.2, size * 0.8  // Raio do gradiente
        );
        foliageGradient.addColorStop(0, '#6ade4e'); // Verde escuro no centro
        foliageGradient.addColorStop(1, '#008000'); // Verde mais claro nas bordas
        ctx.fillStyle = foliageGradient;

        // Primeiro triângulo (base)
        ctx.beginPath();
        ctx.moveTo(x - size/2, drawY - size/2);
        ctx.lineTo(x + size/2, drawY - size/2);
        ctx.lineTo(x, drawY - size);
        ctx.closePath();
        ctx.fill();

        // Segundo triângulo (meio)
        ctx.beginPath();
        ctx.moveTo(x - size/2.07, drawY - size/1.4);
        ctx.lineTo(x + size/2.07, drawY - size/1.4);
        ctx.lineTo(x, drawY - size * 1.2);
        ctx.closePath();
        ctx.fill();

        // Terceiro triângulo (topo)
        ctx.beginPath();
        ctx.moveTo(x - size/2.5, drawY - size/1.02);
        ctx.lineTo(x + size/2.5, drawY - size/1.02);
        ctx.lineTo(x, drawY - size * 1.4);
        ctx.closePath();
        ctx.fill();
    }

    interpolateColor(color1, color2, factor) {
        return {
            r: Math.round(color1.r + (color2.r - color1.r) * factor),
            g: Math.round(color1.g + (color2.g - color1.g) * factor),
            b: Math.round(color1.b + (color2.b - color1.b) * factor)
        };
    }
    
    // Desenhar o fundo
    drawBackground(camera) {
        // Usar apenas a posição horizontal da câmera para parallax
        const cameraX = camera.x;
    
        // Calcular o offset vertical para compensar a posição da câmera
        // Assumindo que queremos manter o background fixo verticalmente
        const offsetY = -camera.y;
        
        // Desenhar céu
        const gradient = ctx.createLinearGradient(0, 0, 0, camera.height);
        
        // Se estamos em transição, calcular cores interpoladas
        if (isDayNightTransitioning) {
            const progress = transitionProgress / transitionDuration;
            
            // Cores para o topo do céu
            const dayTopColor = {r: 135, g: 206, b: 235}; // #87CEEB
            const nightTopColor = {r: 10, g: 26, b: 42}; // #0a1a2a
            
            // Cores para a base do céu
            const dayBottomColor = {r: 224, g: 247, b: 250}; // #E0F7FA
            const nightBottomColor = {r: 42, g: 58, b: 74}; // #2a3a4a
            
            // Interpolar cores com base na direção da transição
            let topColor, bottomColor;
            
            if (transitionDirection > 0) { // Para noite
                topColor = this.interpolateColor(dayTopColor, nightTopColor, progress);
                bottomColor = this.interpolateColor(dayBottomColor, nightBottomColor, progress);
            } else { // Para dia
                topColor = this.interpolateColor(nightTopColor, dayTopColor, progress);
                bottomColor = this.interpolateColor(nightBottomColor, dayBottomColor, progress);
            }
            
            gradient.addColorStop(0, `rgb(${topColor.r},${topColor.g},${topColor.b})`);
            gradient.addColorStop(1, `rgb(${bottomColor.r},${bottomColor.g},${bottomColor.b})`);
        } else {
            // Sem transição, cores normais
            if (isNightTime) {
                gradient.addColorStop(0, '#0a1a2a');  // Azul escuro no topo
                gradient.addColorStop(1, '#2a3a4a');  // Azul claro na base
            } else {
                gradient.addColorStop(0, '#87CEEB');  // Azul claro no topo
                gradient.addColorStop(1, '#E0F7FA');  // Azul bem claro na base
            }
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, camera.width, camera.height);
        
        // Desenhar sol ou lua com transição
        if (isDayNightTransitioning) {
            const progress = transitionProgress / transitionDuration;
            const fadeProgress = Math.sin(progress * Math.PI); // Cria um efeito de fade in/out
            
            if (transitionDirection > 0) { // De dia para noite
                // Sol descendo
                const sunY = 80 + progress * 150;
                const sunAlpha = Math.max(0, 1 - progress * 2); // Desaparece na primeira metade
                
                // Lua subindo
                const moonY = 230 - progress * 150;
                const moonAlpha = Math.max(0, progress * 2 - 1); // Aparece na segunda metade
                
                // Desenhar sol se ainda visível
                if (sunAlpha > 0) {
                    ctx.globalAlpha = sunAlpha;
                    ctx.fillStyle = '#FFFF00';
                    ctx.beginPath();
                    ctx.arc(camera.width - 100, sunY, 40, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
                
                // Desenhar lua se começou a aparecer
                if (moonAlpha > 0) {
                    ctx.globalAlpha = moonAlpha;
                    ctx.fillStyle = '#E6E6E6';
                    ctx.beginPath();
                    ctx.arc(camera.width - 100, moonY, 40, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Cratera simples para a lua
                    ctx.fillStyle = '#CCCCCC';
                    ctx.beginPath();
                    ctx.arc(camera.width - 110, moonY - 10, 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            } else { // De noite para dia
                // Lua descendo
                const moonY = 80 + progress * 150;
                const moonAlpha = Math.max(0, 1 - progress * 2); // Desaparece na primeira metade
                
                // Sol subindo
                const sunY = 230 - progress * 150;
                const sunAlpha = Math.max(0, progress * 2 - 1); // Aparece na segunda metade
                
                // Desenhar lua se ainda visível
                if (moonAlpha > 0) {
                    ctx.globalAlpha = moonAlpha;
                    ctx.fillStyle = '#E6E6E6';
                    ctx.beginPath();
                    ctx.arc(camera.width - 100, moonY, 40, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Cratera simples para a lua
                    ctx.fillStyle = '#CCCCCC';
                    ctx.beginPath();
                    ctx.arc(camera.width - 110, moonY - 10, 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
                
                // Desenhar sol se começou a aparecer
                if (sunAlpha > 0) {
                    ctx.globalAlpha = sunAlpha;
                    ctx.fillStyle = '#FFFF00';
                    ctx.beginPath();
                    ctx.arc(camera.width - 100, sunY, 40, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            }
        } else {
            // Desenhar sol ou lua sem transição
            if (isNightTime) {
                // Lua
                ctx.fillStyle = '#E6E6E6';
                ctx.beginPath();
                ctx.arc(camera.width - 100, 80, 40, 0, Math.PI * 2);
                ctx.fill();
                
                // Crater simples para a lua
                ctx.fillStyle = '#CCCCCC';
                ctx.beginPath();
                ctx.arc(camera.width - 110, 70, 10, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Sol
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(camera.width - 100, 80, 40, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Desenhar montanhas com parallax (apenas no eixo X)
        for (let i = 0; i < this.mountains.length; i++) {
            const mountain = this.mountains[i];
            const parallaxFactor = 0.1 + i * 0.2; // Diferentes velocidades para cada camada
            
            ctx.fillStyle = mountain.color;
            ctx.beginPath();

            // Ajustar a posição Y base com o offset da câmera
            const baseY = camera.height + offsetY + 500;
            
            // Começar na base da tela
            ctx.moveTo(0, baseY);
            
            // Desenhar o contorno da montanha
            for (let point of mountain.points) {
                const x = point.x - cameraX * parallaxFactor;
                const y = point.y + offsetY + 300;
                if (x >= -100 && x <= camera.width + 100) {
                    ctx.lineTo(x, y);
                }
            }
            
            // Fechar o caminho na base da tela
            ctx.lineTo(camera.width, baseY);
            ctx.closePath();
            ctx.fill();
        }

        // Desenhar nuvens em posições fixas no mundo do jogo (sem parallax)
        for (let cloud of this.clouds) {
            // Ajustar apenas pelo offset da câmera, sem parallax
            const x = cloud.x - cameraX;
            const y = cloud.y + offsetY;
            
            // Desenhar apenas nuvens visíveis
            if (x >= -cloud.width && x <= camera.width + cloud.width) {
                this.drawCloud(x, y, cloud.width, cloud.height, 0);
            }
        }
        
        // Desenhar pinheiros com parallax (apenas no eixo X)
        for (let pine of this.pines) {
            const parallaxFactor = 0.4 + pine.depth * 0.4;
            const x = pine.x - cameraX * parallaxFactor;
            
            // Desenhar apenas pinheiros visíveis
            if (x >= -100 && x <= camera.width + 100) {
                this.drawPine(x, pine.y, pine.size, offsetY);
            }
        }
    }
    
    // Desenhar o mapa (apenas a parte visível na câmera)
    draw(camera) {
        // Primeiro desenhar o fundo
        this.drawBackground(camera);
        
        const startX = Math.floor(camera.x / TILE_SIZE);
        const endX = Math.ceil((camera.x + camera.width) / TILE_SIZE);
        const startY = Math.floor(camera.y / TILE_SIZE);
        const endY = Math.ceil((camera.y + camera.height) / TILE_SIZE);
        
        // Garantir que estamos dentro dos limites do mapa
        const visibleStartX = Math.max(0, startX);
        const visibleEndX = Math.min(this.width - 1, endX);
        const visibleStartY = Math.max(0, startY);
        const visibleEndY = Math.min(this.height - 1, endY);
        
        // Desenhar tiles visíveis
        for (let y = visibleStartY; y <= visibleEndY; y++) {
            for (let x = visibleStartX; x <= visibleEndX; x++) {
                if (this.tiles[y][x] !== 1) continue; // Ignorar tiles vazios
                
                // Posição na tela do tile atual
                const screenX = Math.floor(x * TILE_SIZE - camera.x);
                const screenY = Math.floor(y * TILE_SIZE - camera.y);
                
                // Aqui usamos a posição mundial (x,y) para gerar a textura
                this.drawDirtTexture(screenX, screenY, TILE_SIZE, x, y);
                
                // Desenhar grama nos blocos superiores
                if (y > 0 && this.tiles[y - 1][x] === 0) {
                    this.drawGrassTexture(screenX, screenY, TILE_SIZE, x, y);
                }
            }
        }
    }

    // Função para desenhar textura de terra - note os parâmetros worldX e worldY adicionados
    drawDirtTexture(screenX, screenY, size, worldX, worldY) {
        // Arredondar para pixels inteiros
        const x = Math.floor(screenX);
        const y = Math.floor(screenY);
        
        // Desenhar fundo sólido
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, size, size);
        
        // Margem de segurança para evitar vazamentos
        const margin = 2;
        const safeSize = size - margin * 2;
        
        // Cores para os detalhes
        const darkBrown = '#6B3300';
        const lightBrown = '#A26633';
        
        // Usar coordenadas do mundo para seed
        const seed = (worldX * 13 + worldY * 17) % 100;
        
        // Pontos maiores espalhados (mais escuros)
        ctx.fillStyle = darkBrown;
        for (let i = 0; i < 6; i++) {
            const px = x + margin + ((seed * 7 + i * 13) % safeSize);
            const py = y + margin + ((seed * 11 + i * 19) % safeSize);
            ctx.fillRect(px, py, 2, 2);
        }
        
        // Pontos menores espalhados (mais claros)
        ctx.fillStyle = lightBrown;
        for (let i = 0; i < 8; i++) {
            const px = x + margin + ((seed * 3 + i * 23) % safeSize);
            const py = y + margin + ((seed * 5 + i * 29) % safeSize);
            ctx.fillRect(px, py, 1, 1);
        }
    }

    // Função para desenhar textura de grama, também com clipping
    drawGrassTexture(screenX, screenY, size, worldX, worldY) {
        ctx.save();
        
        // Definir um retângulo de recorte para a grama
        ctx.beginPath();
        ctx.rect(screenX, screenY, size, 5); // Apenas para a altura da grama
        ctx.clip();
        
        // Desenhar a base da grama
        ctx.fillStyle = '#228B22';
        ctx.fillRect(screenX, screenY, size, 5);
        
        // Usar um padrão semi-aleatório mas determinístico baseado na posição MUNDIAL
        const seed = (worldX * 29 + worldY * 31) % 100;
        
        // Adicionar algumas "folhas" de grama
        for (let i = 0; i < 8; i++) {
            const offsetX = 2 + (seed + i * 7) % (size - 4);
            
            // Desenhar uma folha de grama
            ctx.fillStyle = (i % 3 === 0) ? '#196619' : '#32CD32';
            ctx.beginPath();
            ctx.moveTo(screenX + offsetX, screenY + 5);
            ctx.lineTo(screenX + offsetX - 2, screenY);
            ctx.lineTo(screenX + offsetX + 2, screenY);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// Classe para o inimigo
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.velocityX = Math.random() > 0.5 ? 1 : -1;
        this.velocityY = 0;
        this.isAlive = true;
        this.detectRange = 150;
        this.health = 100;
        this.movementTimer = 0;
        this.invulnerableTime = 0; // Tempo de invulnerabilidade após ser atingido
        this.directionChangeCooldown = 0;
        this.maxDirectionChangeCooldown = 65; // Adjust this value as needed (frames)
    }

    update(map, character) {
        if (!this.isAlive) return;

        // Verificar se o inimigo está no ar
        const isOnGround = map.isSolid(this.x, this.y + 1) || map.isSolid(this.x + this.width, this.y + 1);

        // Atualizar estado de knockback
        if (this.isKnockedBack) {
            this.knockbackTimer--;
            if (this.knockbackTimer <= 0) {
                this.isKnockedBack = false;
                // Resetar a velocidade X para um valor base quando sair do knockback
                this.velocityX = this.velocityX > 0 ? 1 : -1;
            }
        }

        // Decrementar o cooldown de mudança de direção
        if (this.directionChangeCooldown > 0) {
            this.directionChangeCooldown--;
        }

        // Só executar a lógica de movimento normal se NÃO estiver em knockback
        if (!this.isKnockedBack) {
            // Calcular distância horizontal e vertical ao jogador
            const distX = Math.abs(this.x - character.x);
            const distY = Math.abs(this.y - character.y);
            const isPlayerAbove = character.y < this.y - 20;
            const isPlayerBelow = character.y > this.y + 20;

            let isChasingPlayer = false;

            // Verificar se o jogador está alinhado verticalmente
            const isAlignedVertically = Math.abs(this.x - character.x) < 20 && (isPlayerAbove || isPlayerBelow);

            // Verificar se o inimigo deve perseguir o jogador
            if (distX < this.detectRange && isOnGround && !isAlignedVertically) {
                const newDirection = character.x > this.x ? 1 : -1;
                
                // Só muda a direção se não estiver em cooldown ou se está indo na mesma direção
                if (this.directionChangeCooldown <= 0 || newDirection === Math.sign(this.velocityX)) {
                    // Se mudar de direção, ativa o cooldown
                    if (newDirection !== Math.sign(this.velocityX)) {
                        this.directionChangeCooldown = this.maxDirectionChangeCooldown;
                    }
                    this.velocityX = newDirection;
                    isChasingPlayer = true;
                }
            }

            // Se não estiver perseguindo e não estiver alinhado verticalmente, usar movimento padrão
            if (!isChasingPlayer && isOnGround && !isAlignedVertically) {
                this.movementTimer++;
                if (this.movementTimer > 100 && this.directionChangeCooldown <= 0) {
                    this.velocityX *= -1;
                    this.movementTimer = 0;
                    this.directionChangeCooldown = this.maxDirectionChangeCooldown;
                }
            }
        }

        // Aplicar gravidade
        this.velocityY += GRAVITY;

        // Limitar velocidade máxima para evitar que vá para muito longe
        const maxVelocity = 8;
        if (Math.abs(this.velocityX) > maxVelocity) {
            this.velocityX = Math.sign(this.velocityX) * maxVelocity;
        }

        // Atualizar posição
        this.x += this.velocityX;
        this.y += this.velocityY;

        const mapWidth = map.width * TILE_SIZE;
        const mapHeight = map.height * TILE_SIZE;

        // Impedir que saia pela esquerda
        if (this.x < 0) {
            this.x = 0;
        }
        
        // Impedir que saia pela direita
        if (this.x + this.width > mapWidth) {
            this.x = mapWidth - this.width;
        }

        // Colisão com o chão
        if (map.isSolid(this.x, this.y + 1) || 
            map.isSolid(this.x + this.width, this.y + 1)) {
            this.y = Math.floor(this.y / TILE_SIZE) * TILE_SIZE;
            this.velocityY = 0;
        }

        // Colisão com paredes (horizontal) - só inverter direção se não estiver em knockback
        if (this.velocityX > 0) {
            if (map.isSolid(this.x + this.width, this.y - this.height + 10) ||
                map.isSolid(this.x + this.width, this.y - 5)) {
                this.x = Math.floor((this.x + this.width) / TILE_SIZE) * TILE_SIZE - this.width;
                if (!this.isKnockedBack && this.directionChangeCooldown <= 0) {
                    this.velocityX = -1;
                    this.directionChangeCooldown = this.maxDirectionChangeCooldown;
                } else if (this.isKnockedBack) {
                    this.velocityX *= -0.5; // Reduz a velocidade e inverte na colisão durante knockback
                }
            }
        } else if (this.velocityX < 0) {
            if (map.isSolid(this.x, this.y - this.height + 10) ||
                map.isSolid(this.x, this.y - 5)) {
                this.x = Math.ceil(this.x / TILE_SIZE) * TILE_SIZE;
                if (!this.isKnockedBack && this.directionChangeCooldown <= 0) {
                    this.velocityX = 1;
                    this.directionChangeCooldown = this.maxDirectionChangeCooldown;
                } else if (this.isKnockedBack) {
                    this.velocityX *= -0.5; // Reduz a velocidade e inverte na colisão durante knockback
                }
            }
        }

        // Verificar ataque do personagem
        if (character.state instanceof AttackState && this.invulnerableTime <= 0) {
            const characterFacingRight = character.facing === 'right';
            const attackRangeStartX = characterFacingRight ? character.x + character.width : character.x - 30;
            const attackRangeEndX = characterFacingRight ? character.x + character.width + 30 : character.x;

            if (this.x < attackRangeEndX && 
                this.x + this.width > attackRangeStartX &&
                Math.abs(this.y - character.y) < 50) {
                // Damage
                this.health -= Math.floor(Math.random() * (25 - 5 + 1)) + 5;

                // Knockback
                const isInAir = !(map.isSolid(this.x, this.y + 1) || map.isSolid(this.x + this.width, this.y + 1));
                
                // Reduzir knockback quando no ar
                const knockbackForceX = isInAir ? 1 : 2;
                const knockbackForceY = isInAir ? -1 : -3;
                
                this.velocityX = characterFacingRight ? knockbackForceX : -knockbackForceX;
                this.velocityY = knockbackForceY;

                // Ativar o modo knockback
                this.isKnockedBack = true;
                this.knockbackTimer = 20; // Duração do knockback em frames

                // Ativar invulnerabilidade
                this.invulnerableTime = 60; // 1 segundo de invulnerabilidade (60 frames)
                this.directionChangeCooldown = 5;

                if (this.health <= 0) {
                    this.isAlive = false;
                    score += 100;
                    scoreDisplay.textContent = `Pontos: ${score}`;
                }
            }
        }

        // Verificar colisão com o personagem
        if (this.isCollidingWith(character) && 
            !(character.state instanceof AttackState)) {
            character.takeDamage();
        }

        // Atualizar tempo de invulnerabilidade
        if (this.invulnerableTime > 0) {
            this.invulnerableTime--;
        }
    }

    isCollidingWith(character) {
        return this.x < character.x + character.width &&
               this.x + this.width > character.x &&
               this.y - this.height < character.y &&
               this.y > character.y - character.height;
    }

    draw(camera) {
        if (!this.isAlive) return;

        // Piscar se invulnerável
        if (this.invulnerableTime > 0 && this.invulnerableTime % 10 < 5) {
            return; // Não desenhar o inimigo em alguns frames
        }

        // Corpo do inimigo
        ctx.fillStyle = 'crimson';
        ctx.fillRect(
            this.x - camera.x, 
            this.y - this.height - camera.y, 
            this.width, 
            this.height
        );

        // Olhos do inimigo
        ctx.fillStyle = 'black';
        const eyeX = this.velocityX > 0 ? this.x + 26 - camera.x : this.x + 9 - camera.x;
        ctx.fillRect(eyeX, this.y - 40 - camera.y, 5, 5);

        // Botas 
        ctx.fillStyle = '#3D2B1F';
        ctx.fillRect(this.x - camera.x + 5, this.y - this.height - camera.y + this.height - 5, 10, 5);
        ctx.fillRect(this.x - camera.x + this.width - 15, this.y - this.height - camera.y + this.height - 5, 10, 5);

        // Barra de vida
        const healthPercent = this.health / 100;
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - camera.x, this.y - this.height - 10 - camera.y, this.width, 5);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - camera.x, this.y - this.height - 10 - camera.y, this.width * healthPercent, 5);

        // Desenhar o raio de visão (cone)
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // Cor vermelha com transparência
        ctx.beginPath();

        // Centro do cone (centro do inimigo)
        const centerX = this.x + this.width / 2 - camera.x;
        const centerY = this.y - this.height / 2 - camera.y;

        // Raio do cone (alcance de detecção)
        const radius = this.detectRange - 25;

        // Ângulo de abertura do cone (em radianos)
        const coneAngle = Math.PI / 4; // 45 graus (ajuste conforme necessário)

        // Direção do cone (depende da direção do inimigo)
        const startAngle = this.velocityX > 0 ? -coneAngle / 2 : Math.PI - coneAngle / 2;
        const endAngle = this.velocityX > 0 ? coneAngle / 2 : Math.PI + coneAngle / 2;

        // Desenhar o arco do cone
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);

        // Conectar as extremidades do arco ao centro para formar o cone
        ctx.lineTo(centerX, centerY);
        ctx.closePath();

        // Preencher o cone
        ctx.fill();
    }
}

// Classe de Personagem
class Character {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.velocityX = 0;
        this.velocityY = 0;
        this.state = new IdleState(this);
        this.facing = 'right'; // direção que o personagem está olhando
        this.attackTime = 0;
        this.jumpCount = 0;
        this.isInAir = false;
        this.prevState = null;
        this.health = 100;
        this.invulnerableTime = 0;
    }
    
    setState(state) {
        if (!(state instanceof AttackState)) {
            this.prevState = this.state;
        }
        
        this.state = state;
        stateDisplay.textContent = `Estado Atual: ${this.state.getName()}`;
    }
    
    update(map) {
        this.state.update();
        
        // Atualizar invulnerabilidade
        if (this.invulnerableTime > 0) {
            this.invulnerableTime--;
        }
        
        // Verificar se está no ar
        this.isInAir = true;
        
        // Aplicar gravidade
        this.velocityY += GRAVITY;
        
        // Aplicar física em X primeiro (para colisões laterais)
        this.x += this.velocityX;
        
        // Colisão com paredes
        if (this.velocityX > 0) {
            if (map.isSolid(this.x + this.width, this.y - this.height + 20) ||
                map.isSolid(this.x + this.width, this.y - 5)) {
                this.x = Math.floor((this.x + this.width) / TILE_SIZE) * TILE_SIZE - this.width;
            }
        } else if (this.velocityX < 0) {
            if (map.isSolid(this.x, this.y - this.height + 20) ||
                map.isSolid(this.x, this.y - 5)) {
                this.x = Math.ceil(this.x / TILE_SIZE) * TILE_SIZE;
            }
        }
        
        // Depois aplicar física em Y (para colisões com o chão)
        this.y += this.velocityY;
        
        // Colisão com o chão
        if (this.velocityY > 0) {
            // Verificar múltiplos pontos ao longo da largura do personagem
            let groundCollision = false;
            for (let checkX = this.x + 2; checkX < this.x + this.width - 2; checkX += 5) {
                if (map.isSolid(checkX, this.y)) {
                    this.y = Math.floor(this.y / TILE_SIZE) * TILE_SIZE;
                    this.velocityY = 0;
                    this.jumpCount = 0;
                    this.isInAir = false;
                    groundCollision = true;
                    break;
                }
            }
        }
        
        // Colisão com o teto
        if (this.velocityY < 0) {
            // Verificar múltiplos pontos ao longo da largura do personagem
            for (let checkX = this.x + 2; checkX < this.x + this.width - 2; checkX += 5) {
                if (map.isSolid(checkX, this.y - this.height)) {
                    this.y = Math.ceil((this.y - this.height) / TILE_SIZE) * TILE_SIZE + this.height;
                    this.velocityY = 0;
                    break;
                }
            }
        }
        
        // Limitar personagem às bordas do mapa
        if (this.x < 0) this.x = 0;
        if (this.x > MAP_WIDTH * TILE_SIZE - this.width) {
            this.x = MAP_WIDTH * TILE_SIZE - this.width;
        }

        // Adicionar limite vertical para o topo do mapa
        if (this.y - this.height < 0) {
            this.y = this.height;
            this.velocityY = 0;
        }
        
        // Atualizar posição na tela
        positionDisplay.textContent = `Posição: ${Math.floor(this.x / TILE_SIZE)}, ${Math.floor(this.y / TILE_SIZE)}`;
        
        // Diminuir o timer de ataque
        if (this.attackTime > 0) {
            this.attackTime--;
        }
    }
    
    takeDamage() {
        if (this.invulnerableTime > 0) return;
        
        this.health -= 10;
        this.invulnerableTime = 60; // 1 segundo de invulnerabilidade
        
        // Knockback
        this.velocityY = -8;
        this.velocityX = this.facing === 'right' ? -5 : 5;
        
        // Respawn se a vida acabar
        if (this.health <= 0) {
            this.health = 100;
            this.x = 50;
            this.y = 150;
            score = Math.max(0, score - 50);
            scoreDisplay.textContent = `Pontos: ${score}`;
        }
    }
    
    draw(camera) {
        // Piscar se invulnerável
        if (this.invulnerableTime > 0 && this.invulnerableTime % 6 > 3) {
            return;
        }
        
        // Corpo do personagem
        ctx.fillStyle = '#c2a8ff';
        ctx.fillRect(
            this.x - camera.x, 
            this.y - this.height - camera.y, 
            this.width, 
            this.height
        );
        
        // Olhos para indicar direção
        ctx.fillStyle = 'black';
        if (this.facing === 'right') {
            ctx.fillRect(this.x + 27 - camera.x, this.y - 50 - camera.y, 5, 5);
        } else {
            ctx.fillRect(this.x + 8 - camera.x, this.y - 50 - camera.y, 5, 5);
        }

        // Cinto
        ctx.fillStyle = '#5A3D1E';
        ctx.fillRect(this.x - camera.x, this.y - this.height - camera.y + this.height - 30, this.width, 5);

        // Botas 
        ctx.fillStyle = '#3D2B1F';
        ctx.fillRect(this.x - camera.x + 5, this.y - this.height - camera.y + this.height - 10, 10, 10);
        ctx.fillRect(this.x - camera.x + this.width - 15, this.y - this.height - camera.y + this.height - 10, 10, 10);
        
        // Desenhar arma ao atacar
        if (this.state instanceof AttackState) {
            ctx.fillStyle = 'red';
            if (this.facing === 'right') {
                ctx.fillRect(this.x + this.width - camera.x, this.y - 40 - camera.y, 30, 10);
            } else {
                ctx.fillRect(this.x - 30 - camera.x, this.y - 40 - camera.y, 30, 10);
            }
        }
        
        // Efeitos de estado
        if (this.state instanceof RunningState) {
            ctx.fillStyle = 'rgba(146, 140, 255, 0.6)';
            if (this.facing === 'right') {
                ctx.fillRect(this.x - 10 - camera.x, this.y - this.height + 13 - camera.y, 10, 30);
            } else {
                ctx.fillRect(this.x + this.width - camera.x, this.y - this.height + 13 - camera.y, 10, 30);
            }
        }
        
        if (this.state instanceof JumpingState || 
            (this.state instanceof AttackState && this.isInAir)) {
            ctx.fillStyle = 'rgba(146, 140, 255, 0.6)';
            ctx.fillRect(this.x + 10 - camera.x, this.y - camera.y, 20, 20);
        }
        
        // Barra de vida
        const healthPercent = this.health / 100;
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - camera.x, this.y - this.height - 10 - camera.y, this.width, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - camera.x, this.y - this.height - 10 - camera.y, this.width * healthPercent, 5);
    }
    
    moveLeft() {
        this.velocityX = -5;
        this.facing = 'left';
        if (!this.isInAir && !(this.state instanceof AttackState)) {
            this.setState(new RunningState(this));
        }
    }
    
    moveRight() {
        this.velocityX = 5;
        this.facing = 'right';
        if (!this.isInAir && !(this.state instanceof AttackState)) {
            this.setState(new RunningState(this));
        }
    }
    
    idle() {
        this.velocityX = 0;
        if (!this.isInAir && !(this.state instanceof AttackState)) {
            this.setState(new IdleState(this));
        }
    }
    
    jump() {
        if (this.jumpCount < 1) {
            this.velocityY = -15;
            this.jumpCount++;
            this.isInAir = true; // Garante que isInAir seja true imediatamente
            
            if (!(this.state instanceof AttackState)) {
                this.setState(new JumpingState(this));
            }
        }
    }
    
    attack() {
        if (this.attackTime <= 0) {
            this.setState(new AttackState(this));
            this.attackTime = 30; // duração do ataque em frames
        }
    }
    
    restorePreviousState() {
        if (this.isInAir) {
            this.setState(new JumpingState(this));
        } else if (this.velocityX !== 0) {
            this.setState(new RunningState(this));
        } else {
            this.setState(new IdleState(this));
        }
    }
}

// Estado Parado
class IdleState {
    constructor(character) {
        this.character = character;
    }
    
    getName() {
        return "Parado";
    }
    
    update() {
        // Lógica específica do estado parado
    }
}

// Estado Correndo
class RunningState {
    constructor(character) {
        this.character = character;
    }
    
    getName() {
        return "Correndo";
    }
    
    update() {
        // Lógica específica do estado correndo
    }
}

// Estado Pulando
class JumpingState {
    constructor(character) {
        this.character = character;
    }
    
    getName() {
        return "Pulando";
    }
    
    update() {
        // Verificar se o personagem aterrissou
        if (!this.character.isInAir) {
            if (this.character.velocityX !== 0) {
                this.character.setState(new RunningState(this.character));
            } else {
                this.character.setState(new IdleState(this.character));
            }
        }
    }
}

// Estado Atacando
class AttackState {
    constructor(character) {
        this.character = character;
        this.frameCount = 0;
        this.wasInAir = character.isInAir;
    }
    
    getName() {
        if (this.character.isInAir) {
            return "Atacando no Ar";
        } else if (Math.abs(this.character.velocityX) > 0) {
            return "Atacando Correndo";
        } else {
            return "Atacando";
        }
    }
    
    update() {
        this.frameCount++;
        
        // Concluir ataque após 20 frames
        if (this.frameCount >= 20) {
            this.character.restorePreviousState();
        }
    }
}

// Inicialização do jogo
const gameMap = new GameMap(MAP_WIDTH, MAP_HEIGHT);
const character = new Character(50, 350);
const enemies = [];

// Criar alguns inimigos
enemies.push(new Enemy(600, 150));
enemies.push(new Enemy(900, 150));
enemies.push(new Enemy(1200, 150));
enemies.push(new Enemy(1500, 150));
enemies.push(new Enemy(1800, 150));

// Atualizar contador de inimigos
enemiesDisplay.textContent = `Inimigos: ${enemies.length}`;

const keys = {};

// Manipuladores de eventos de teclado
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Evitar comportamento padrão para teclas que podem rolar a página
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Loop principal do jogo
function gameLoop() {
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Processar input do jogador
    if (keys['ArrowLeft']) {
        character.moveLeft();
    } else if (keys['ArrowRight']) {
        character.moveRight();
    } else {
        character.idle();
    }
    
    if (keys[' '] && !character.isInAir) {
        character.jump();
    }
    
    if (keys['z'] && character.attackTime <= 0) {
        character.attack();
    }
    
    // Atualizar posição da câmera para seguir o personagem
    camera.x = character.x - canvas.width / 2 + character.width / 2;
    camera.y = character.y - canvas.height / 2 + character.height / 2;
    
    // Limitar câmera às bordas do mapa
    if (camera.x < 0) camera.x = 0;
    if (camera.x > MAP_WIDTH * TILE_SIZE - camera.width) {
        camera.x = MAP_WIDTH * TILE_SIZE - camera.width;
    }

    if (camera.y < 0) camera.y = 0;
    if (camera.y > MAP_HEIGHT * TILE_SIZE - camera.height) {
        camera.y = MAP_HEIGHT * TILE_SIZE - camera.height;
    }
    
    // Atualizar personagem
    character.update(gameMap);
    
    // Atualizar inimigos
    let aliveEnemies = 0;
    for (const enemy of enemies) {
        enemy.update(gameMap, character);
        if (enemy.isAlive) aliveEnemies++;
    }
    
    // Atualizar contador de inimigos
    enemiesDisplay.textContent = `Inimigos: ${aliveEnemies}`;
    
    // Desenhar o fundo
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar o mapa
    gameMap.draw(camera);
    updateDayNightTransition();
    
    // Desenhar inimigos
    for (const enemy of enemies) {
        enemy.draw(camera);
    }
    
    // Desenhar personagem
    character.draw(camera);
    
    // Continuar loop
    requestAnimationFrame(gameLoop);
}

// Iniciar o jogo
gameLoop();