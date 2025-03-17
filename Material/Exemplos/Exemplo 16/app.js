// Implementação de Perlin Noise
class PerlinNoise {
    constructor() {
        this.permutation = [];
        this.initialize();
    }
    
    initialize() {
        // Criar array de permutação
        const p = Array.from({length: 256}, (_, i) => i);
        
        // Embaralhar o array
        for (let i = p.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        // Estender o array para evitar overflow
        this.permutation = [...p, ...p];
    }
    
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    grad(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    noise(x, y) {
        // Encontrar unidade de grade que contém o ponto
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        // Posição relativa na unidade de grade
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        // Calcular função de atenuação
        const u = this.fade(x);
        const v = this.fade(y);
        
        // Hash para os 4 cantos da grade
        const a = this.permutation[X] + Y;
        const b = this.permutation[X + 1] + Y;
        const aa = this.permutation[a];
        const ab = this.permutation[a + 1];
        const ba = this.permutation[b];
        const bb = this.permutation[b + 1];
        
        // Misturar os resultados
        return this.lerp(
            this.lerp(
                this.grad(this.permutation[aa], x, y),
                this.grad(this.permutation[ba], x - 1, y),
                u
            ),
            this.lerp(
                this.grad(this.permutation[ab], x, y - 1),
                this.grad(this.permutation[bb], x - 1, y - 1),
                u
            ),
            v
        );
    }
    
    // Gerar ruído de Perlin em várias oitavas
    octaveNoise(x, y, octaves, persistence) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            total += this.noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        
        return total / maxValue;
    }
}

// Gerenciador do mundo
class WorldGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.perlin = new PerlinNoise();
        this.tileSize = 2; // Tamanho de cada tile em pixels
        this.width = Math.floor(canvas.width / this.tileSize);
        this.height = Math.floor(canvas.height / this.tileSize);
        this.biomes = [
            { name: "Oceano Profundo", color: "#0077be", threshold: 0.25 },
            { name: "Oceano", color: "#00a9e0", threshold: 0.35 },
            { name: "Água Rasa", color: "#add8e6", threshold: 0.40 },
            { name: "Praia", color: "#e2d9a2", threshold: 0.43 },
            { name: "Planície", color: "#90ee90", threshold: 0.55 },
            { name: "Floresta", color: "#228b22", threshold: 0.70 },
            { name: "Montanha", color: "#a0522d", threshold: 0.85 },
            { name: "Pico Nevado", color: "#f5f5f5", threshold: 1.00 }
        ];
        this.heightMap = []; // Armazenar valores de altura
        this.colorMap = [];  // Armazenar cores dos biomas
        this.brushSize = 1; 
    }

    increaseBrushSize() {
        if (this.brushSize < 32) {
            this.brushSize *= 2; 
        }
    }

    decreaseBrushSize() {
        if (this.brushSize > 1) {
            this.brushSize /= 2;
        }
    }

    getBiomeColor(value) {
        for (let i = 0; i < this.biomes.length; i++) {
            if (value <= this.biomes[i].threshold) {
                return this.biomes[i].color;
            }
        }
        return this.biomes[this.biomes.length - 1].color;
    }

    generate(scale, octaves, persistence) {
        // Limpar canvas e mapas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.heightMap = [];
        this.colorMap = [];

        const noiseScale = scale / 1000;
        const persistenceValue = persistence / 100;

        // Gerar um novo mundo
        this.perlin.initialize();

        // Desenhar cada tile e armazenar valores
        for (let y = 0; y < this.height; y++) {
            this.heightMap[y] = [];
            this.colorMap[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Gerar valor de altura usando Perlin Noise
                const nx = x * noiseScale;
                const ny = y * noiseScale;
                let value = this.perlin.octaveNoise(nx, ny, octaves, persistenceValue);
                value = (value + 1) / 2; // Normalizar para 0-1

                // Armazenar valor de altura e cor do bioma
                this.heightMap[y][x] = value;
                const color = this.getBiomeColor(value);
                this.colorMap[y][x] = color;

                // Desenhar o tile
                this.ctx.fillStyle = color;
                this.ctx.fillRect(
                    x * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
            }
        }
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('worldCanvas');
    const worldGen = new WorldGenerator(canvas);

    // Eventos de teclado para ajustar o tamanho da caneta
    document.addEventListener('keydown', (event) => {
        if (event.key === '+' || event.key === '=') {
            worldGen.increaseBrushSize();
        } else if (event.key === '-' || event.key === '_') {
            worldGen.decreaseBrushSize();
        }
    });
    
    const scaleSlider = document.getElementById('scale');
    const octavesSlider = document.getElementById('octaves');
    const persistenceSlider = document.getElementById('persistence');
    const tileSizeDropdown = document.getElementById('tileSize');
    const generateBtn = document.getElementById('generate');
    const exportCSVBtn = document.getElementById('exportCSV');

    let selectedColor = null; // Cor selecionada para pintura

    // Adicionar eventos de clique na legenda
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
        item.addEventListener('click', () => {
            // Obter a cor do bioma clicado
            const colorBox = item.querySelector('.color-box');
            selectedColor = colorBox.style.backgroundColor;
        });
    });

    // Adicionar evento de clique no canvas para pintura
    let isPainting = false;

    canvas.addEventListener('mousedown', (event) => {
        isPainting = true;
        paintTile(event); // Pintar o tile inicial
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isPainting) {
            paintTile(event); // Pintar enquanto o mouse se move
        }
    });

    canvas.addEventListener('mouseup', () => {
        isPainting = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isPainting = false;
    });

    function rgbToHex(rgb) {
        // Extrair os valores de r, g, b da string rgb()
        const [r, g, b] = rgb.match(/\d+/g).map(Number);
        
        // Converter para hexadecimal
        const toHex = (c) => {
            const hex = c.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function paintTile(event) {
        if (selectedColor) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = Math.floor((event.clientX - rect.left) / worldGen.tileSize);
            const mouseY = Math.floor((event.clientY - rect.top) / worldGen.tileSize);

            // Calcular o tamanho da área a ser pintada
            const brushRadius = Math.floor(worldGen.brushSize / 2);

            // Pintar a área proporcional ao tamanho da caneta
            for (let y = mouseY - brushRadius; y <= mouseY + brushRadius; y++) {
                for (let x = mouseX - brushRadius; x <= mouseX + brushRadius; x++) {
                    if (x >= 0 && x < worldGen.width && y >= 0 && y < worldGen.height) {
                        // Pintar o tile no canvas
                        worldGen.ctx.fillStyle = selectedColor;
                        worldGen.ctx.fillRect(
                            x * worldGen.tileSize,
                            y * worldGen.tileSize,
                            worldGen.tileSize,
                            worldGen.tileSize
                        );

                        // Atualizar o colorMap com a nova cor
                        worldGen.colorMap[y][x] = rgbToHex(selectedColor);
                    }
                }
            }
        }
    }
    
    function generateWorld() {
        const scale = parseInt(scaleSlider.value);
        const octaves = parseInt(octavesSlider.value);
        const persistence = parseInt(persistenceSlider.value);
        const tileSize = parseInt(tileSizeDropdown.value);
        
        // Atualizar o tamanho do tile
        worldGen.tileSize = tileSize;
        worldGen.width = Math.floor(canvas.width / tileSize);
        worldGen.height = Math.floor(canvas.height / tileSize);
        
        worldGen.generate(scale, octaves, persistence);
    }

    // Função para exportar o mapa como CSV
    function exportMapToCSV() {
        const csvData = [];
        
        // Mapear cores para números de biomas
        const biomeColorToNumber = {
            "#0077be": 0, // Oceano Profundo
            "#00a9e0": 1, // Oceano
            "#add8e6": 2, // Água Rasa
            "#e2d9a2": 3, // Praia
            "#90ee90": 4, // Planície
            "#228b22": 5, // Floresta
            "#a0522d": 6, // Montanha
            "#f5f5f5": 7  // Pico Nevado
        };
        
        // Percorrer a grid do mapa
        for (let y = 0; y < worldGen.height; y++) {
            const row = [];
            for (let x = 0; x < worldGen.width; x++) {
                // Obter a cor do bioma (usando os dados armazenados)
                const color = worldGen.colorMap[y][x];
                
                // Mapear a cor para o número do bioma
                const biomeNumber = biomeColorToNumber[color] ?? 8; // Usar 8 para cores desconhecidas
                row.push(biomeNumber); // Adicionar número do bioma à linha
            }
            csvData.push(row.join(',')); // Juntar valores da linha com vírgula
        }
        
        // Criar arquivo CSV
        const csvContent = "data:text/csv;charset=utf-8," + csvData.join("\n");
        
        // Criar link para download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "mapa_gerado.csv");
        document.body.appendChild(link);
        
        // Disparar o download
        link.click();
        document.body.removeChild(link); // Remover o link após o download
    }
    
    // Gerar mundo inicial
    generateWorld();
    
    // Adicionar eventos
    generateBtn.addEventListener('click', generateWorld);
    scaleSlider.addEventListener('change', generateWorld);
    octavesSlider.addEventListener('change', generateWorld);
    persistenceSlider.addEventListener('change', generateWorld);
    tileSizeDropdown.addEventListener('change', generateWorld);
    exportCSVBtn.addEventListener('click', exportMapToCSV);
    document.getElementById('exploreMap').addEventListener('click', () => {
        // Redirecionar para outra página
        window.location.href = 'game.html';
    });
});