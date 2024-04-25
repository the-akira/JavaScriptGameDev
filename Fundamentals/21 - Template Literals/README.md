## Template Literals

Os "template literals" são uma maneira de criar strings mais legíveis e flexíveis em JavaScript, permitindo a interpolação de variáveis e a escrita de strings de várias linhas de forma mais simples.

## Sintaxe

Os template literals são definidos usando crases (`...`) em vez de aspas simples ou duplas.

```js
const nome = 'João';
const idade = 30;

const frase = `Olá, meu nome é ${nome} e tenho ${idade} anos.`;
console.log(frase); // Saída: Olá, meu nome é João e tenho 30 anos.
```

## Interpolação de Variáveis

Dentro de um template literal, podemos incorporar variáveis JavaScript usando `${...}`. Isso permite que as variáveis sejam inseridas diretamente na string.

```js
const nome = 'Maria';
const idade = 25;

const frase = `Olá, meu nome é ${nome} e tenho ${idade} anos.`;
console.log(frase); // Saída: Olá, meu nome é Maria e tenho 25 anos.
```

## Expressões

Além de variáveis, também podemos incluir expressões dentro de `${...}`.

```js
const preco = 20;
const desconto = 0.1;

const total = `O preço com desconto é $${preco * (1 - desconto)}.`;
console.log(total); // Saída: O preço com desconto é $18.
```

## Strings de Múltiplas Linhas

Com template literals, podemos criar strings de várias linhas sem a necessidade de caracteres de escape.

```js
const poema = `
  No meio do caminho tinha uma pedra
  Tinha uma pedra no meio do caminho
  Tinha uma pedra
  No meio do caminho tinha uma pedra.
`;

console.log(poema);
```

## Vantagens

- Mais legibilidade: torna o código mais fácil de ler com interpolação de variáveis diretamente na string.
- Facilidade de escrita: permite a criação de strings de várias linhas sem a necessidade de caracteres de escape.

## Conclusão

Os template literals são uma adição poderosa à linguagem JavaScript, tornando a criação de strings mais flexível e legível. Eles são amplamente utilizados em muitos contextos, como construção de mensagens, geração de HTML dinâmico e muito mais.