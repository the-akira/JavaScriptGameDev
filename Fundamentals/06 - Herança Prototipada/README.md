# Herança Prototipada

A herança prototipada em JavaScript é um padrão de herança baseado em protótipos, onde um objeto herda propriedades e métodos de outro objeto chamado de "protótipo". Ao contrário de linguagens que utilizam classes, como Java ou C++, onde a herança é baseada em classes, JavaScript utiliza herança prototipada, o que significa que não existem classes no sentido tradicional, apenas objetos que servem como protótipos.

Vamos a um exemplo prático:

```js
// Definindo um "pai"
let Animal = function(nome) {
  this.nome = nome;
};

Animal.prototype.saudacao = function() {
  return "Olá, eu sou " + this.nome;
};

// Definindo um "filho" que herda de Animal
let Gato = function(nome, cor) {
  Animal.call(this, nome);
  this.cor = cor;
};

Gato.prototype = Object.create(Animal.prototype);
Gato.prototype.constructor = Gato;

Gato.prototype.miar = function() {
  return "Miau!";
};

// Criando uma instância de Gato
let meuGato = new Gato("Bola", "Preto");
console.log(meuGato.saudacao()); // Saída: Olá, eu sou Bola
console.log(meuGato.miar()); // Saída: Miau!
```

Neste exemplo, `Animal` é uma função construtora que define propriedades e métodos para objetos do tipo animal. `Gato` é uma função construtora que herda de `Animal` usando `Object.create()`. Isso permite que `Gato` tenha acesso aos métodos e propriedades de `Animal`, enquanto também pode definir seus próprios métodos, como `miar`.