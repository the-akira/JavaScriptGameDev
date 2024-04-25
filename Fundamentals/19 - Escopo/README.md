# Escopo

O escopo em JavaScript determina a acessibilidade e visibilidade de variáveis e funções em diferentes partes do código. Existem dois tipos principais de escopo em JavaScript: escopo global e escopo local.

## Escopo Global

Variáveis e funções declaradas fora de qualquer função têm escopo global. Isso significa que elas podem ser acessadas de qualquer lugar do código, tanto dentro quanto fora de funções.

Exemplo:

```js
let globalVar = 'Variável global';

function funcao1() {
  console.log(globalVar); // Saída: Variável global
}

function funcao2() {
  console.log(globalVar); // Saída: Variável global
}

funcao1();
funcao2();
```

Neste exemplo, `globalVar` é uma variável global e pode ser acessada de dentro de `funcao1` e `funcao2`.

## Escopo Local

Variáveis declaradas dentro de uma função têm escopo local. Isso significa que elas só podem ser acessadas dentro da função em que foram declaradas.

Exemplo:

```js
function funcao() {
  let localVar = 'Variável local';
  console.log(localVar); // Saída: Variável local
}

funcao();
console.log(localVar); // Erro: localVar is not defined
```

Neste exemplo, `localVar` é uma variável local e só pode ser acessada dentro da função `funcao`.

## Bloco de Escopo (let e const)

Com a introdução do `let` e `const` no ECMAScript 2015, temos escopo de bloco. Variáveis declaradas com `let` e `const` têm escopo de bloco, o que significa que elas só podem ser acessadas dentro do bloco em que foram declaradas.

Exemplo:

```js
if (true) {
  let blockVar = 'Variável de bloco';
  console.log(blockVar); // Saída: Variável de bloco
}

console.log(blockVar);
```

Neste exemplo, `blockVar` é uma variável de bloco e só pode ser acessada dentro do bloco `if`.

## Escopo de Função Aninhada

Funções definidas dentro de outras funções têm acesso ao escopo da função externa. Isso significa que as funções internas podem acessar variáveis da função externa, mas não o contrário.

Exemplo:

```js
function externa() {
  let outerVar = 'Variável externa';

  function interna() {
    console.log(outerVar); // Saída: Variável externa
  }

  interna();
}

externa();
console.log(outerVar); // Erro: outerVar is not defined
``` 

Neste exemplo, `interna` tem acesso ao escopo da função `externa`, então pode acessar `outerVar`, mas `externa` não pode acessar variáveis declaradas dentro de `interna`.

## Conclusão

Entender escopo é fundamental para escrever código JavaScript eficiente e correto. Ao compreender onde as variáveis e funções estão disponíveis para uso, você pode evitar bugs e escrever código mais legível e organizado.