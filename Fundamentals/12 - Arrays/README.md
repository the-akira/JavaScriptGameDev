# Arrays

Arrays são objetos que permitem armazenar vários valores em uma única variável. Eles podem conter qualquer tipo de dado e são usados para armazenar coleções de itens relacionados.

Exemplo de Declaração de Array:

```js
const numeros = [1, 2, 3, 4, 5];
const frutas = ['Maçã', 'Banana', 'Morango'];
const misto = [1, 'dois', true, { chave: 'valor' }];
```

## Métodos de Array

JavaScript fornece uma variedade de métodos embutidos para manipular arrays. Aqui estão alguns dos métodos mais comuns:

### push() e pop()

- `push()`: Adiciona um ou mais elementos ao final do array.
- `pop()`: Remove o último elemento do array e retorna esse elemento.

```js
const cores = ['vermelho', 'verde', 'azul'];
cores.push('amarelo');
console.log(cores); // Saída: ['vermelho', 'verde', 'azul', 'amarelo']

const ultimoElemento = cores.pop();
console.log(ultimoElemento); // Saída: 'amarelo'
console.log(cores); // Saída: ['vermelho', 'verde', 'azul']
```

### shift() e unshift()

- `shift()`: Remove o primeiro elemento do array e retorna esse elemento.
- `unshift()`: Adiciona um ou mais elementos ao início do array.
javascript

```js
const numeros = [2, 3, 4, 5];
numeros.unshift(1);
console.log(numeros); // Saída: [1, 2, 3, 4, 5]

const primeiroElemento = numeros.shift();
console.log(primeiroElemento); // Saída: 1
console.log(numeros); // Saída: [2, 3, 4, 5]
```

### forEach()

Executa uma função para cada elemento do array.

```js
const numeros = [1, 2, 3, 4, 5];

numeros.forEach(function(numero) {
  console.log(numero);
});
// Saída:
// 1
// 2
// 3
// 4
// 5
```

### map()

Cria um novo array com os resultados da chamada de uma função para cada elemento do array.

```js
const numeros = [1, 2, 3, 4, 5];

const numerosDobrados = numeros.map(function(numero) {
  return numero * 2;
});

console.log(numerosDobrados); // Saída: [2, 4, 6, 8, 10]
```

### filter()

Cria um novo array com todos os elementos que passaram no teste implementado pela função fornecida.

```js
const numeros = [1, 2, 3, 4, 5];

const numerosPares = numeros.filter(function(numero) {
  return numero % 2 === 0;
});

console.log(numerosPares); // Saída: [2, 4]
```

Esses são apenas alguns dos métodos de array disponíveis em JavaScript. Eles tornam a manipulação e a iteração de arrays mais simples e eficientes.