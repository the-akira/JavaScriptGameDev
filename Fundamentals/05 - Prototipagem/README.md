# Prototipagem

A prototipagem é um dos conceitos fundamentais em JavaScript para a implementação de herança e compartilhamento de propriedades e métodos entre objetos. Em JavaScript, cada objeto tem uma referência para um objeto protótipo, de onde ele herda propriedades e métodos.

Vamos a um exemplo prático:

```js
// Criando um objeto protótipo
let animalPrototype = {
  fazerBarulho: function() {
    console.log(this.barulho);
  }
};

// Criando um objeto "animal" que herda do protótipo
let gato = Object.create(animalPrototype);
gato.barulho = "Miau";
gato.fazerBarulho(); // Saída: Miau

// Criando outro objeto "animal" que herda do mesmo protótipo
let cachorro = Object.create(animalPrototype);
cachorro.barulho = "Au Au";
cachorro.fazerBarulho(); // Saída: Au Au
```

Neste exemplo, `animalPrototype` é um objeto que define um método `fazerBarulho`. Os objetos `gato` e `cachorro` são criados com `Object.create()`, e eles herdam o método `fazerBarulho` do protótipo `animalPrototype`. Cada objeto então define sua própria propriedade barulho.

A prototipagem é uma maneira eficiente de compartilhar comportamento entre objetos em JavaScript e é amplamente utilizada em bibliotecas e frameworks. 