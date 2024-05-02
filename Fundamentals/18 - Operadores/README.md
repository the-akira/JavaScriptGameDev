# Operadores

Os operadores em JavaScript são símbolos que permitem realizar operações em operandos, como variáveis, valores ou expressões. Existem diferentes tipos de operadores, incluindo aritméticos, lógicos e de comparação.

## Operadores Aritméticos

Os operadores aritméticos são usados para realizar operações matemáticas em operandos. Os principais operadores aritméticos são:

- `+`: Adição
- `-`: Subtração
- `*`: Multiplicação
- `/`: Divisão
- `%`: Resto da divisão (Módulo)
- `++`: Incremento
- `--`: Decremento

Exemplos:

```js
let x = 10;
let y = 5;

console.log(x + y); // Saída: 15
console.log(x - y); // Saída: 5
console.log(x * y); // Saída: 50
console.log(x / y); // Saída: 2
console.log(x % y); // Saída: 0 (resto da divisão)
```

## Operadores de Comparação

Os operadores de comparação são usados para comparar dois valores e retornar um valor booleano (true ou false). Os principais operadores de comparação são:

- `==`: Igual a
- `!=`: Diferente de
- `===`: Estritamente igual a (igualdade de valor e tipo)
- `!==`: Estritamente diferente de
- `>`: Maior que
- `<`: Menor que
- `>=`: Maior ou igual a
- `<=`: Menor ou igual a

```js
let a = 5;
let b = 10;

console.log(a == b); // Saída: false
console.log(a != b); // Saída: true
console.log(a === b); // Saída: false
console.log(a !== b); // Saída: true
console.log(a > b); // Saída: false
console.log(a < b); // Saída: true
console.log(a >= b); // Saída: false
console.log(a <= b); // Saída: true
```

## Operadores Lógicos

Os operadores lógicos são usados para combinar expressões booleanas e retornar um valor booleano. Os principais operadores lógicos são:

- `&&`: E lógico (AND)
- `||`: Ou lógico (OR)
- `!`: Negação lógica (NOT)

```js
let idade = 25;
let possuiCarteira = true;

// Verifica se a pessoa tem mais de 18 anos e possui carteira de motorista
if (idade >= 18 && possuiCarteira) {
  console.log('Pode dirigir!');
} else {
  console.log('Não pode dirigir!');
}

let chove = true;
let fazSol = !chove;

// Verifica se está chovendo ou fazendo sol
if (chove || !fazSol) {
  console.log('O clima está instável.');
} else {
  console.log('O clima está estável.');
}

let valor = 100;

// Verifica se o valor não é igual a zero
if (!valor) {
  console.log('O valor é zero.');
} else {
  console.log('O valor não é zero.');
}
```

## Conclusão

Os operadores em JavaScript são ferramentas poderosas para realizar diferentes tipos de operações em seus programas. Compreender como e quando usar cada tipo de operador é fundamental para escrever código eficiente e correto.
