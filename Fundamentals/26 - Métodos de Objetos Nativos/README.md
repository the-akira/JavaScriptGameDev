# Métodos de Objetos Nativos

Os métodos de objetos nativos em JavaScript são funcionalidades embutidas que estão disponíveis nos objetos fundamentais da linguagem, como Object, Array, String, entre outros. Vamos explorar alguns desses métodos com explicações e exemplos práticos:

## Métodos de Objeto (Object)

O objeto `Object` fornece uma variedade de métodos úteis para trabalhar com objetos em JavaScript, como `Object.keys()`, `Object.values()`, `Object.entries()`, entre outros.

Exemplo:

```js
const pessoa = {
  nome: 'João',
  idade: 30,
  cidade: 'São Paulo'
};

// Obtendo as chaves do objeto
const chaves = Object.keys(pessoa);
console.log(chaves); // Saída: ['nome', 'idade', 'cidade']

// Obtendo os valores do objeto
const valores = Object.values(pessoa);
console.log(valores); // Saída: ['João', 30, 'São Paulo']

// Obtendo as entradas [chave, valor] do objeto
const entradas = Object.entries(pessoa);
console.log(entradas); // Saída: [['nome', 'João'], ['idade', 30], ['cidade', 'São Paulo']]
```

## Métodos de Array

O objeto `Array` fornece uma ampla variedade de métodos para manipular arrays em JavaScript, como `push()`, `pop()`, `map()`, `filter()`, entre outros.

Exemplo:

```js
const numeros = [1, 2, 3, 4, 5];

// Adicionando um elemento ao final do array
numeros.push(6);
console.log(numeros); // Saída: [1, 2, 3, 4, 5, 6]

// Removendo o último elemento do array
numeros.pop();
console.log(numeros); // Saída: [1, 2, 3, 4, 5]

// Mapeando os elementos do array para o dobro de cada valor
const dobrados = numeros.map(numero => numero * 2);
console.log(dobrados); // Saída: [2, 4, 6, 8, 10]
```

## Métodos de String

O objeto `String` fornece métodos para manipular strings em JavaScript, como `toUpperCase()`, `toLowerCase()`, `split()`, `startsWith()`, entre outros.

Exemplo:

```js
const frase = 'Olá, mundo!';

// Convertendo a string para maiúsculas
const maiusculas = frase.toUpperCase();
console.log(maiusculas); // Saída: OLÁ, MUNDO!

// Dividindo a string em um array de substrings
const palavras = frase.split(' ');
console.log(palavras); // Saída: ['Olá,', 'mundo!']

// Verificando se a string começa com um determinado prefixo
const comecaComOla = frase.startsWith('Olá');
console.log(comecaComOla); // Saída: true
```

## Conclusão 

Os métodos de objetos nativos em JavaScript fornecem uma variedade de funcionalidades úteis para manipular e trabalhar com objetos, arrays e strings. Eles são fundamentais para o desenvolvimento em JavaScript e são amplamente utilizados em muitos cenários.