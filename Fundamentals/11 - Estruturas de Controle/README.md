# Estruturas de Controle

## 1. if e else

O `if` é uma estrutura de controle que executa um bloco de código se uma condição especificada for verdadeira. O `else` é opcional e executa um bloco de código se a condição for falsa.

```js
const numero = 10;

if (numero > 0) {
  console.log("O número é positivo");
} else {
  console.log("O número é negativo ou zero");
}
```

## 2. switch

O `switch` é usado para selecionar um dos muitos blocos de código a serem executados.

```js
const diaDaSemana = 1;
let nomeDoDia;

switch (diaDaSemana) {
  case 1:
    nomeDoDia = "Domingo";
    break;
  case 2:
    nomeDoDia = "Segunda-feira";
    break;
  case 3:
    nomeDoDia = "Terça-feira";
    break;
  // Adicione mais casos conforme necessário
  default:
    nomeDoDia = "Dia inválido";
}

console.log("Hoje é " + nomeDoDia);
```

## 3. Loops

Os loops são usados para executar um bloco de código várias vezes. Existem três tipos principais de loops em JavaScript: `for`, `while` e `do-while`.

### 3.1. Loop for

O loop `for` é usado para iterar sobre uma sequência de valores com base em uma condição.

```js
for (let i = 0; i < 5; i++) {
  console.log("O valor de i é: " + i);
}
```

### 3.2. Loop for...of

O loop `for...of` é usado para iterar sobre os valores de um objeto iterável, como um array.

```js
const numeros = [1, 2, 3, 4, 5];

for (const numero of numeros) {
  console.log("O valor do número é: " + numero);
}
```

### 3.3. Loop for...in

O loop `for...in` é usado para iterar sobre as propriedades enumeráveis de um objeto.

```js
const pessoa = {
  nome: "João",
  idade: 30,
  cidade: "São Paulo"
};

for (const chave in pessoa) {
  console.log(chave + ": " + pessoa[chave]);
}
```

### 3.4. Loop while

O `while` é usado para executar um bloco de código enquanto uma condição especificada for verdadeira.

```js
let contador = 0;

while (contador < 5) {
  console.log("O contador é: " + contador);
  contador++;
}
```

### 3.5. Loop do-while

O `do-while` é semelhante ao `while`, mas garante que o bloco de código seja executado pelo menos uma vez, mesmo que a condição seja falsa.

```js
let x = 0;

do {
  console.log("O valor de x é: " + x);
  x++;
} while (x < 5);
```

## Conclusão

As estruturas de controle em JavaScript, como `if`, `else`, `switch` e `loops`, são essenciais para controlar o fluxo de um programa e executar blocos de código com base em condições específicas ou repetidamente. Compreender essas estruturas é fundamental para escrever código eficiente e funcional.