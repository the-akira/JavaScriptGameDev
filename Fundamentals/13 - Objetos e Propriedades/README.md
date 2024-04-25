# Objetos e Propriedades

Objetos são coleções de pares chave-valor, onde cada chave é uma string (também chamada de propriedade) e cada valor pode ser de qualquer tipo de dado, incluindo outros objetos.

Vamos criar um exemplo de um objeto representando um personagem de um jogo de RPG e adicionar métodos para ilustrar melhor a ideia de objeto em JavaScript.

## Objeto Personagem de RPG

Vamos criar um objeto `personagem` com propriedades como nome, classe, nível e vida. Também adicionaremos métodos para o personagem atacar e receber dano.

Exemplo de Objeto Personagem:

```js
const personagem = {
  nome: 'Aragorn',
  classe: 'Guerreiro',
  nivel: 10,
  vida: 100,

  // Método para o personagem atacar
  atacar: function(inimigo) {
    console.log(this.nome + ' ataca ' + inimigo + '!');
  },

  // Método para o personagem receber dano
  receberDano: function(dano) {
    this.vida -= dano;
    console.log(this.nome + ' recebe ' + dano + ' pontos de dano!');
    console.log('Vida restante: ' + this.vida);
  }
};
```

## Acesso a Propriedades do Personagem

As propriedades do personagem podem ser acessadas usando a notação de ponto (`personagem.propriedade`).

Exemplos de Acesso a Propriedades:

```js
console.log(personagem.nome); // Saída: Aragorn
console.log(personagem.nivel); // Saída: 10
```

## Chamada de Métodos do Personagem

Os métodos do personagem podem ser chamados usando a notação de ponto (`personagem.metodo()`).

Exemplos de Chamada de Métodos:

```js
personagem.atacar('Orc');
// Saída: Aragorn ataca Orc!

personagem.receberDano(20);
// Saída: Aragorn recebe 20 pontos de dano!
// Saída: Vida restante: 80
```

## Iteração sobre Propriedades do Personagem

Podemos iterar sobre as propriedades do personagem usando loops `for...in`.

Exemplo de Iteração sobre Propriedades:

```js
for (const chave in personagem) {
  console.log(chave + ': ' + personagem[chave]);
}
// Saída:
// nome: Aragorn
// classe: Guerreiro
// nivel: 10
// vida: 80
```

## Objetos como Parâmetros de Função

Objetos podem ser passados como parâmetros para funções, permitindo manipular personagens de forma dinâmica.

Exemplo de Objeto como Parâmetro de Função:

```js
function mostrarDetalhes(personagem) {
  console.log('Nome: ' + personagem.nome);
  console.log('Classe: ' + personagem.classe);
  console.log('Nível: ' + personagem.nivel);
  console.log('Vida: ' + personagem.vida);
}

mostrarDetalhes(personagem);
// Saída:
// Nome: Aragorn
// Classe: Guerreiro
// Nível: 10
// Vida: 80
```

## Conclusão

Os objetos em JavaScript permitem representar entidades complexas, como personagens de jogos de RPG, de forma organizada e eficiente. Eles podem conter propriedades para representar características do objeto e métodos para descrever seu comportamento.