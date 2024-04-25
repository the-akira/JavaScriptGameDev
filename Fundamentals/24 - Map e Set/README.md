# Map e Set

## Map

O objeto Map é uma coleção de pares chave/valor em que as chaves podem ser de qualquer tipo, incluindo objetos ou valores primitivos. Diferente de um objeto comum, um Map preserva a ordem de inserção de seus elementos.

Exemplo:

```js
// Criando um Map
const mapa = new Map();

// Adicionando elementos ao Map
mapa.set('chave1', 'valor1');
mapa.set('chave2', 'valor2');
mapa.set('chave3', 'valor3');

// Obtendo o valor de uma chave no Map
console.log(mapa.get('chave2')); // Saída: valor2

// Verificando se uma chave existe no Map
console.log(mapa.has('chave1')); // Saída: true

// Removendo um elemento do Map
mapa.delete('chave3');

// Iterando sobre os elementos do Map
mapa.forEach((valor, chave) => {
  console.log(`${chave}: ${valor}`);
});
```

## Set

O objeto Set é uma coleção de valores únicos, o que significa que cada valor pode ocorrer apenas uma vez na coleção. Diferente de um array, um Set não tem ordem definida de seus elementos.

Exemplo:

```js
// Criando um Set
const conjunto = new Set();

// Adicionando elementos ao Set
conjunto.add('valor1');
conjunto.add('valor2');
conjunto.add('valor3');

// Verificando se um valor existe no Set
console.log(conjunto.has('valor2')); // Saída: true

// Removendo um elemento do Set
conjunto.delete('valor3');

// Iterando sobre os elementos do Set
conjunto.forEach(valor => {
  console.log(valor);
});
```

## WeakMap e WeakSet

WeakMap e WeakSet são versões "fracas" de Map e Set, respectivamente. Isso significa que eles permitem apenas chaves/valores que são objetos e não mantêm essas referências vivas se não houver mais referências ao objeto em outras partes do código. Isso é útil para evitar vazamentos de memória em situações específicas.

Exemplo:

```js
// Criando um WeakMap
const mapaFraco = new WeakMap();

// Criando objetos para serem usados como chaves
const chave1 = {};
const chave2 = {};

// Adicionando elementos ao WeakMap
mapaFraco.set(chave1, 'valor1');
mapaFraco.set(chave2, 'valor2');

// Obtendo o valor associado a uma chave no WeakMap
console.log(mapaFraco.get(chave1)); // Saída: valor1

// Removendo um elemento do WeakMap
mapaFraco.delete(chave2);
```

## Conclusão 

Os objetos Map, Set, WeakMap e WeakSet fornecem maneiras convenientes de armazenar e manipular coleções de dados em JavaScript, cada um com suas características específicas. Eles são úteis em uma variedade de situações e podem ajudar a melhorar a legibilidade e a eficiência do seu código.