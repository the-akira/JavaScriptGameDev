# Assíncrono

Vamos abordar o assíncrono em JavaScript, explicando cada conceito (callbacks, Promises, async/await) e mostrando exemplos práticos de como lidar com chamadas de API usando o `fetch`.

## 1. Callbacks:

Callbacks são funções passadas como argumentos para outras funções e são executadas após a conclusão de uma operação assíncrona. Eles eram uma das principais maneiras de lidar com operações assíncronas em JavaScript antes do surgimento de Promises e async/await.

Exemplo de Callback:

```js
function getData(callback) {
  setTimeout(function() {
    const data = { message: "Dados obtidos" };
    callback(data);
  }, 1000);
}

function processData(data) {
  console.log(data.message);
}

getData(processData);
```

## 2. Promises:

Promises são objetos que representam o resultado de uma operação assíncrona. Elas têm estados (pendente, resolvida ou rejeitada) e permitem que você encadeie operações assíncronas de forma mais clara e legível.

Exemplo de Promises:

```js
function getData() {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      const data = { message: "Dados obtidos" };
      resolve(data);
    }, 1000);
  });
}

getData().then(function(data) {
  console.log(data.message);
});
```

## 3.Async/Await:

Async/Await é uma sintaxe que torna o código assíncrono mais legível e fácil de entender. `async` é usado para declarar uma função assíncrona, enquanto `await` é usado para esperar que uma Promise seja resolvida antes de continuar a execução do código.

```js
async function getData() {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      const data = { message: "Dados obtidos" };
      resolve(data);
    }, 1000);
  });
}

async function processData() {
  try {
    const data = await getData();
    console.log(data.message);
  } catch (error) {
    console.error(error);
  }
}

processData();
```

## Chamada de API usando fetch

Agora, vamos mostrar como você pode usar o fetch para fazer chamadas de API de forma assíncrona e lidar com a resposta usando Promises ou async/await.

1. Exemplo de Chamada de API usando fetch e Promises:

```js
fetch('https://jsonplaceholder.typicode.com/posts/1')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

2. Exemplo de Chamada de API usando fetch e Async/Await:

```js
async function fetchData() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

fetchData();
```

Esses exemplos demonstram diferentes maneiras de lidar com chamadas de API assíncronas em JavaScript, desde a abordagem tradicional com callbacks até as mais modernas com Promises e async/await, utilizando o fetch para fazer as requisições.
