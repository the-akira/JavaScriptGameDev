# Hoisting

Hoisting é um comportamento em JavaScript onde as declarações de variáveis e funções são movidas para o topo do seu escopo durante a fase de compilação. Isso significa que você pode acessar uma variável ou função antes mesmo de ela ser declarada no código.

## Variáveis

Em JavaScript, todas as declarações de variáveis (`var`, `let`, `const`) são hoisted para o topo do seu escopo. No entanto, apenas a declaração é hoisted, não a inicialização.

```js
console.log(x); // Saída: undefined
var x = 10;
console.log(x); // Saída: 10
```

No exemplo acima, a declaração da variável `x` é hoisted para o topo, mas sua inicialização não. Portanto, `console.log(x)` antes da inicialização retorna `undefined`.

Com `let` e `const`, a hoisting ocorre apenas para a declaração, mas não para a inicialização.

```js
console.log(y); // Erro: y is not defined
let y = 20;
```

## Funções

As declarações de função também são hoisted para o topo do seu escopo. Isso significa que você pode chamar uma função antes mesmo de ela ser declarada no código.

```js
foo(); // Saída: Olá, mundo!

function foo() {
  console.log('Olá, mundo!');
}
```

No exemplo acima, a função `foo` é hoisted para o topo, então podemos chamá-la antes mesmo de sua declaração.

No entanto, as expressões de função (funções atribuídas a variáveis) não são hoisted como as declarações de função.

```js
bar(); // Erro: bar is not a function
var bar = function() {
  console.log('Olá, mundo!');
};
```

Neste caso, a variável `bar` é hoisted para o topo, mas sua atribuição (a função) não é, então a chamada resulta em um erro.

## Classes (ECMAScript 2015)

Com as classes introduzidas no ECMAScript 2015, a hoisting não se aplica da mesma forma que com as declarações de função. As classes em JavaScript não são hoisted.

```js
const obj = new MyClass(); // Erro: MyClass is not defined
class MyClass {
  constructor() {
    console.log('Objeto criado!');
  }
}
```

Neste exemplo, tentamos criar uma instância da classe MyClass antes de sua declaração, o que resulta em um erro.

## Conclusão

Hoisting é um comportamento sutil em JavaScript que pode afetar a ordem de execução do seu código. Embora possa facilitar algumas coisas, também pode levar a bugs difíceis de diagnosticar se não for compreendido corretamente. Portanto, é importante entender como o hoisting funciona e como ele pode impactar o seu código.