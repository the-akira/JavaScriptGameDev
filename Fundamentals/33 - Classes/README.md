# Classes em JavaScript

Classes em JavaScript foram introduzidas no ECMAScript 2015 (ES6) como uma maneira mais clara e organizada de criar objetos e tratar heranças. Antes de ES6, usávamos funções construtoras e protótipos para atingir os mesmos objetivos. As classes fornecem uma sintaxe mais clara e similar à de outras linguagens de programação orientadas a objetos.

## Definindo uma Classe Player

Vamos criar uma classe `Player` que representa um jogador como uma figura geométrica em um jogo. Este jogador terá propriedades como posição (x, y), tamanho (width, height), cor e métodos para desenhar, mover-se e confinar-se dentro dos limites do canvas.

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
  }

  // Método para desenhar o jogador no canvas
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // Método para mover o jogador
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
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

// Função para atualizar o jogo
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas
  player.draw(ctx); // Desenha o jogador
  requestAnimationFrame(update); // Chama a função de atualização novamente
}

// Inicia a atualização do jogo
update();

// Exemplo de movimento do jogador e mudança de cor
document.addEventListener('keydown', function(event) {
  const step = 5;
  if (event.key === 'ArrowUp') player.move(0, -step);
  if (event.key === 'ArrowDown') player.move(0, step);
  if (event.key === 'ArrowLeft') player.move(-step, 0);
  if (event.key === 'ArrowRight') player.move(step, 0);
  if (event.key === 'c') player.setColor('red'); // Muda a cor para vermelho
  if (event.key === 's') player.resize(50, 50); // Redimensiona o jogador
});
```

## Explicação do Código

### 1. Definição da Classe Player

- **Construtor:** O construtor define as propriedades iniciais do jogador, incluindo as dimensões do canvas (`canvasWidth` e `canvasHeight`), que serão usadas para confinar o jogador dentro dos limites do canvas.
- **Método `draw`:** Desenha o jogador no canvas.
- **Método `move`:** Move o jogador e chama o método `constrain` para garantir que ele fique dentro dos limites do canvas.
- **Método `constrain`:** Ajusta a posição do jogador para que ele não saia dos limites do canvas.
- **Método `setColor`:** Permite mudar a cor do jogador.
- **Método `resize`:** Permite redimensionar o jogador e chama `constrain` para garantir que o novo tamanho não ultrapasse os limites do canvas.

### 2. Configuração do Canvas

- Selecionamos o elemento canvas do HTML e obtemos seu contexto de desenho 2D.

### 3. Criação de uma Instância do Player

- Criamos uma instância do `Player` com uma posição inicial, tamanho, cor e dimensões do canvas.

### 4. Função de Atualização do Jogo

- A função `update` é responsável por limpar o canvas e redesenhar o jogador em cada frame. `requestAnimationFrame` é usado para criar um loop de animação suave.

### 5. Movimento do Jogador e Mudança de Cor

- Adicionamos um ouvinte de eventos para capturar pressionamentos de teclas. Além de mover o jogador, podemos mudar sua cor e redimensioná-lo.

## Conclusão

O conceito de classes em JavaScript permite uma estruturação mais clara e organizada do código, especialmente em projetos maiores como jogos. No exemplo acima, usamos uma classe `Player` para encapsular todas as propriedades e métodos relacionados ao jogador, facilitando a manutenção e expansão do código. Com a adição de métodos para confinar o jogador dentro dos limites do canvas, mudar a cor e redimensioná-lo, a classe `Player` se torna mais robusta e versátil, ilustrando melhor as capacidades de orientação a objetos em JavaScript.