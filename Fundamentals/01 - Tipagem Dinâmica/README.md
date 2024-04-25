# Tipagem Dinâmica

A tipagem dinâmica em JavaScript significa que você não precisa declarar explicitamente o tipo de uma variável ao criá-la. Em vez disso, o tipo de uma variável é determinado em tempo de execução com base no valor que ela contém.

Por exemplo, você pode atribuir um número a uma variável e, em seguida, atribuir uma string à mesma variável sem qualquer problema. O JavaScript é flexível nesse aspecto.

Aqui está um exemplo prático:

```js
let exemplo = 42; // aqui 'exemplo' é do tipo número
console.log(typeof exemplo); // Saída: number

exemplo = "Olá, mundo!"; // agora 'exemplo' é do tipo string
console.log(typeof exemplo); // Saída: string
```

Este código cria uma variável chamada `exemplo`, inicialmente atribuída a um número. Mais tarde, o mesmo nome de variável é atribuído a uma string. Isso é permitido em JavaScript devido à sua tipagem dinâmica.