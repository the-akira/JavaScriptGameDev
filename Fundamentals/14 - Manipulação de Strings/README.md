# Manipulação de Strings

Uma string é uma sequência de caracteres, como texto, delimitada por aspas simples (`'`) ou aspas duplas (`"`). Strings são usadas para representar texto em JavaScript.

Exemplo de String:

```js
const nome = 'Alice';
const mensagem = "Olá, mundo!";
```

## Propriedades e Métodos de Strings

JavaScript fornece uma variedade de propriedades e métodos embutidos para manipular strings. Aqui estão alguns dos mais comuns.

### length

A propriedade `length` retorna o número de caracteres em uma string.

```js
const nome = 'Alice';
console.log(nome.length); // Saída: 5
```

### charAt() e charCodeAt()

- O método `charAt()` retorna o caractere em uma posição específica em uma string.
- O método `charCodeAt()` retorna o código Unicode do caractere em uma posição específica em uma string.

```js
const mensagem = 'Olá, mundo!';
console.log(mensagem.charAt(0)); // Saída: O
console.log(mensagem.charCodeAt(1)); // Saída: 108 (código Unicode para 'l')
```

### toUpperCase() e toLowerCase()

- O método `toUpperCase()` retorna a string com todos os caracteres em maiúsculas.
- O método `toLowerCase()` retorna a string com todos os caracteres em minúsculas.

```js
const nome = 'Alice';
console.log(nome.toUpperCase()); // Saída: ALICE
console.log(nome.toLowerCase()); // Saída: alice
```

### indexOf() e lastIndexOf()

- O método `indexOf()` retorna a posição da primeira ocorrência de um determinado valor em uma string.
- O método `lastIndexOf()` retorna a posição da última ocorrência de um determinado valor em uma string.

```js
const mensagem = 'Olá, mundo!';
console.log(mensagem.indexOf('mundo')); // Saída: 5
console.log(mensagem.lastIndexOf('o')); // Saída: 8
```

### split()

O método `split()` divide uma string em um array de substrings com base em um separador especificado.

```js
const frase = 'Olá, mundo!';
const palavras = frase.split(' ');
console.log(palavras); // Saída: ['Olá,', 'mundo!']
```

### replace()

O método `replace()` substitui uma substring por outra em uma string.

```js
const mensagem = 'Olá, mundo!';
const novaMensagem = mensagem.replace('mundo', 'amigo');
console.log(novaMensagem); // Saída: Olá, amigo!
```

## Conclusão

As strings em JavaScript são usadas para representar texto e podem ser manipuladas de várias maneiras usando propriedades e métodos embutidos. Compreender essas funcionalidades é fundamental para trabalhar eficientemente com strings em JavaScript.