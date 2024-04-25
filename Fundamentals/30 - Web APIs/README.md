# Web APIs

As Web APIs em JavaScript fornecem funcionalidades poderosas para interagir com recursos do navegador, como fazer requisições HTTP, armazenar dados localmente, acessar a geolocalização do usuário e muito mais. Vamos explorar algumas dessas APIs com exemplos práticos e melhorar gradualmente até um exemplo mais complexo.

## API Fetch

A API Fetch é usada para fazer requisições HTTP de forma assíncrona, permitindo buscar recursos de uma URL.

Exemplo:

```js
fetch('https://jsonplaceholder.typicode.com/todos/1')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Erro:', error));
```

## API localStorage

A API localStorage permite armazenar dados localmente no navegador do usuário.

Exemplo:

```js
// Salvando dados no localStorage
localStorage.setItem('nome', 'João');

// Obtendo dados do localStorage
const nome = localStorage.getItem('nome');
console.log(nome); // Saída: João
```

## Buscando dados de uma API e armazenando no localStorage

Vamos buscar dados de uma API pública e armazená-los no localStorage para uso posterior.

```js
fetch('https://api.github.com/users/octocat')
  .then(response => response.json())
  .then(data => {
    // Armazenando dados no localStorage
    localStorage.setItem('perfilGitHub', JSON.stringify(data));
    console.log('Dados do perfil do GitHub salvos no localStorage:', data);
  })
  .catch(error => console.error('Erro:', error));
```

Este exemplo busca os dados do perfil do usuário "octocat" do GitHub e os armazena no localStorage. Os dados ficarão disponíveis localmente para uso futuro, mesmo após o navegador ser fechado.

## Conclusão

As Web APIs em JavaScript oferecem uma variedade de funcionalidades poderosas para interagir com recursos do navegador e do ambiente web. Desde fazer requisições HTTP até armazenar dados localmente, essas APIs fornecem as ferramentas necessárias para criar aplicações web ricas e interativas. 