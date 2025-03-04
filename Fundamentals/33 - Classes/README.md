# Classes em JavaScript

Classes em JavaScript foram introduzidas no ECMAScript 2015 (ES6) como uma maneira mais clara e organizada de criar objetos e tratar heranças. Antes de ES6, usávamos funções construtoras e protótipos para atingir os mesmos objetivos. As classes fornecem uma sintaxe mais clara e similar à de outras linguagens de programação orientadas a objetos.

## Definindo uma Classe Player

Vamos criar uma classe `Player` que representa um jogador como uma figura geométrica em um jogo. Este jogador terá propriedades como posição (x, y), tamanho (width, height), cor e métodos para desenhar, atualizar e confinar-se dentro dos limites do canvas.

## Exemplo de Classe Player

```js
// Definindo a classe Player
class Player {
  // O construtor define as propriedades iniciais do jogador
  constructor(x, y, width, height, color, canvasWidth, canvasHeight) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.speed = 3;
    this.vx = 0;
    this.vy = 0;
  }

  // Método para desenhar o jogador no canvas
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // Método para atualizar a posição do jogador
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.constrain();
  }

  // Método para confinar o jogador dentro dos limites do canvas
  constrain() {
    if (this.x < 0) this.x = 0;
    if (this.y < 0) this.y = 0;
    if (this.x + this.width > this.canvasWidth) this.x = this.canvasWidth - this.width;
    if (this.y + this.height > this.canvasHeight) this.y = this.canvasHeight - this.height;
  }

  // Método para mudar a cor do jogador
  setColor(newColor) {
    this.color = newColor;
  }

  // Método para redimensionar o jogador
  resize(newWidth, newHeight) {
    this.width = newWidth;
    this.height = newHeight;
    this.constrain();
  }
}

// Configurando o canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Criando uma instância do Player
const player = new Player(50, 50, 30, 30, 'blue', canvas.width, canvas.height);
const keys = {};

// Captura das teclas pressionadas
window.addEventListener('keydown', (event) => {
  keys[event.key] = true;
});

window.addEventListener('keyup', (event) => {
  keys[event.key] = false;
});

// Função para capturar e processar entrada do jogador
function handleInput() {
  player.vx = 0;
  player.vy = 0;

  if (keys["ArrowUp"]) player.vy = -player.speed;
  if (keys["ArrowDown"]) player.vy = player.speed;
  if (keys["ArrowLeft"]) player.vx = -player.speed;
  if (keys["ArrowRight"]) player.vx = player.speed;
  if (keys["c"]) player.setColor("red");
  if (keys["s"]) player.resize(50, 50);
}

// Função de atualização do jogo
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleInput();
  player.update();
  player.draw(ctx);
  requestAnimationFrame(gameLoop);
}

// Inicia o loop do jogo
gameLoop();
```

## Explicação do Código

### 1. Definição da Classe Player

- **Construtor:** Define as propriedades iniciais do jogador, incluindo as dimensões do canvas (`canvasWidth` e `canvasHeight`), que serão usadas para confinar o jogador dentro dos limites do canvas.
- **Método `draw`:** Desenha o jogador no canvas.
- **Método `update`:** Atualiza a posição do jogador conforme sua velocidade e chama `constrain` para manter os limites.
- **Método `constrain`:** Ajusta a posição do jogador para que ele não saia dos limites do canvas.
- **Método `setColor`:** Permite mudar a cor do jogador.
- **Método `resize`:** Permite redimensionar o jogador e chama `constrain` para garantir que o novo tamanho não ultrapasse os limites do canvas.

### 2. Configuração do Canvas

- Selecionamos o elemento canvas do HTML e obtemos seu contexto de desenho 2D.

### 3. Criação de uma Instância do Player

- Criamos uma instância do `Player` com uma posição inicial, tamanho, cor e dimensões do canvas.

### 4. Movimento Suave do Jogador

- O código usa um **sistema de teclas pressionadas (`keys`)**, armazenando quais teclas estão ativas.
- Em cada quadro, verificamos as teclas pressionadas e ajustamos a velocidade (`vx`, `vy`).
- Isso evita atraso ou interrupções no movimento ao pressionar várias teclas ao mesmo tempo.

### 5. Loop de Atualização Contínuo

- A função `gameLoop` é chamada continuamente usando `requestAnimationFrame`.
- Isso permite um movimento suave e contínuo do jogador sem necessidade de pressionar várias vezes as teclas.

## Conclusão

O conceito de classes em JavaScript permite uma estruturação mais clara e organizada do código, especialmente em projetos maiores como jogos. No exemplo acima, usamos uma classe `Player` para encapsular todas as propriedades e métodos relacionados ao jogador, facilitando a manutenção e expansão do código.