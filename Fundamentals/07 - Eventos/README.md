# Eventos

Eventos em JavaScript são ações que ocorrem em um documento HTML e que podem ser detectadas e manipuladas pelo código JavaScript. Essas ações podem ser coisas como cliques de mouse, pressionamentos de teclas, envio de formulários, carregamento de páginas, entre outros.

Vamos ver um exemplo prático usando um evento de clique:

```html
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Eventos em JavaScript</title>
</head>
<body>

<button id="meuBotao">Clique Aqui</button>

<script>
  // Adicionando um evento de clique ao botão
  document.getElementById("meuBotao").addEventListener("click", function() {
    alert("Você clicou no botão!");
  });
</script>

</body>
</html>
```

Neste exemplo, estamos adicionando um evento de clique a um botão. Quando o botão é clicado, a função de callback é executada, exibindo um alerta com a mensagem "Você clicou no botão!".

Eventos são fundamentais para a interatividade em páginas da web, permitindo que os usuários interajam com os elementos da página e desencadeiem ações específicas.