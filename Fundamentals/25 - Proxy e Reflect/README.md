# Proxy e Reflect

Os objetos Proxy e Reflect são recursos avançados em JavaScript que permitem controlar o comportamento de objetos de uma forma mais flexível e poderosa. Vamos explorar cada um deles com exemplos práticos.

## Proxy

O objeto Proxy permite definir comportamentos personalizados para operações básicas em objetos, como leitura, gravação, enumeração de propriedades e muito mais. Ele atua como um intermediário entre o código cliente e o objeto alvo, interceptando as operações e permitindo que você as modifique conforme necessário.

Exemplo:

```js
// Criando um objeto alvo
const alvo = {
  nome: 'João',
  idade: 30
};

// Criando um Proxy para o objeto alvo
const proxy = new Proxy(alvo, {
  // Interceptando a leitura de uma propriedade
  get(target, prop) {
    console.log(`Lendo a propriedade "${prop}"`);
    return target[prop];
  },
  // Interceptando a gravação de uma propriedade
  set(target, prop, valor) {
    console.log(`Gravando o valor "${valor}" na propriedade "${prop}"`);
    target[prop] = valor;
    return true;
  }
});

// Lendo uma propriedade do Proxy
console.log(proxy.nome); // Saída: Lendo a propriedade "nome", João

// Gravando uma propriedade no Proxy
proxy.idade = 35; // Saída: Gravando o valor "35" na propriedade "idade"
```

## Reflect

O objeto Reflect fornece métodos estáticos para operações comuns em objetos, permitindo que você manipule objetos de forma mais fácil e segura. Ele fornece um conjunto de métodos que correspondem diretamente às operações que podem ser realizadas em proxies, tornando-os úteis para trabalhar com proxies e objetos nativos em geral.

Exemplo:

```Js
// Criando um objeto alvo
const alvo = {};

// Adicionando uma propriedade usando Reflect
Reflect.set(alvo, 'nome', 'Maria');

// Verificando se uma propriedade existe usando Reflect
console.log(Reflect.has(alvo, 'nome')); // Saída: true

// Obtendo o valor de uma propriedade usando Reflect
console.log(Reflect.get(alvo, 'nome')); // Saída: Maria

// Removendo uma propriedade usando Reflect
Reflect.deleteProperty(alvo, 'nome');
```

## Conclusão

Os objetos Proxy e Reflect são recursos poderosos em JavaScript que permitem controlar e manipular objetos de uma maneira flexível e segura. Eles são úteis em muitos cenários, como validação de entrada, tratamento de erros, implementação de lógica de negócios personalizada e muito mais.