# Métodos de Array de Alta Ordem 

Os métodos de array de alta ordem são poderosas ferramentas em JavaScript que permitem manipular e transformar arrays de forma eficiente e expressiva. Vamos explorar alguns desses métodos com explicações e exemplos práticos:

## Map

O método `map()` é usado para transformar cada elemento de um array usando uma função de callback e retornar um novo array com os resultados das chamadas de função.

Exemplo:

```js
const numeros = [1, 2, 3, 4, 5];

const dobrados = numeros.map(numero => numero * 2);
console.log(dobrados); // Saída: [2, 4, 6, 8, 10]
```

## Filter

O método `filter()` é usado para filtrar elementos de um array com base em uma condição especificada em uma função de callback, retornando um novo array contendo apenas os elementos que passam no teste.

Exemplo:

```js
const numeros = [1, 2, 3, 4, 5];

const pares = numeros.filter(numero => numero % 2 === 0);
console.log(pares); // Saída: [2, 4]
```

## Reduce

O método `reduce()` é usado para reduzir um array a um único valor, aplicando uma função de callback para cada elemento do array.

Exemplo:

```js
const numeros = [1, 2, 3, 4, 5];

const soma = numeros.reduce((acumulador, numero) => acumulador + numero, 0);
console.log(soma); // Saída: 15
```

## forEach

O método `forEach()` é usado para executar uma função de callback para cada elemento do array.

Exemplo:

```js
const numeros = [1, 2, 3, 4, 5];

numeros.forEach(numero => console.log(numero * 2));
// Saída:
// 2
// 4
// 6
// 8
// 10
```

## Conclusão

Os métodos de array de alta ordem em JavaScript, como `map`, `filter`, `reduce` e `forEach`, são ferramentas poderosas para manipulação de dados em arrays. Eles permitem escrever código mais legível e expressivo, reduzindo a necessidade de loops e condicionais complexos. Esses métodos são amplamente utilizados em programação funcional e são fundamentais para trabalhar eficientemente com arrays em JavaScript.