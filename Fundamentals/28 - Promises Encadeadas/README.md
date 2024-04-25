# Promises Encadeadas

As Promises encadeadas são uma técnica poderosa em JavaScript para lidar com operações assíncronas de forma sequencial e fácil de entender. Vamos explorar como funciona esse encadeamento com uma explicação intuitiva e exemplos práticos.

## Explicação

Quando temos várias operações assíncronas que precisam ser executadas em sequência, podemos encadear Promises para garantir que cada operação seja realizada apenas após a conclusão da anterior. Isso é feito retornando uma nova Promise em cada `.then()` da Promise anterior, permitindo que continuemos a encadear chamadas de métodos `.then()`.

## Exemplo

Vamos considerar um exemplo em que precisamos realizar três operações assíncronas em sequência:

1. Fazer uma requisição HTTP para obter dados de um servidor.
2. Processar os dados obtidos.
3. Enviar os dados processados de volta para o servidor.

```js
// Função para fazer a requisição HTTP
function fazerRequisicao(url) {
  return new Promise((resolve, reject) => {
    // Simulação de uma requisição assíncrona
    setTimeout(() => {
      resolve({ dados: 'dados da requisição' });
    }, 1000);
  });
}

// Função para processar os dados
function processarDados(dados) {
  return new Promise((resolve, reject) => {
    // Simulação de um processamento assíncrono
    setTimeout(() => {
      resolve({ dadosProcessados: dados + ' processados' });
    }, 1000);
  });
}

// Função para enviar os dados processados de volta para o servidor
function enviarDadosProcessados(dados) {
  return new Promise((resolve, reject) => {
    // Simulação de um envio assíncrono
    setTimeout(() => {
      resolve('Dados processados enviados com sucesso');
    }, 1000);
  });
}

// Encadeando as Promises
fazerRequisicao('http://exemplo.com/api/dados')
  .then(response => processarDados(response.dados))
  .then(response => enviarDadosProcessados(response.dadosProcessados))
  .then(response => {
    console.log(response); // Saída: Dados processados enviados com sucesso
  })
  .catch(error => {
    console.error('Ocorreu um erro:', error);
  });
```

Neste exemplo, cada `.then()` recebe o resultado da Promise anterior e retorna uma nova Promise que representa a próxima operação assíncrona a ser realizada. Isso permite que as operações sejam executadas em sequência, de forma clara e legível.

## Conclusão

As Promises encadeadas são uma maneira poderosa e elegante de lidar com operações assíncronas em JavaScript. Elas permitem que você escreva código assíncrono de forma sequencial e fácil de entender, evitando a "pirâmide de callback" e melhorando a legibilidade do código. 