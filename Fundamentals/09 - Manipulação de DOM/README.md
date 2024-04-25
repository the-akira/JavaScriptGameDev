# Manipulação de DOM

Manipulação de DOM (Document Object Model) refere-se à capacidade do JavaScript de interagir com os elementos HTML de uma página web. Isso inclui adicionar, remover e modificar elementos HTML, atributos e estilos, bem como lidar com eventos.

Vamos criar um exemplo prático que demonstre como manipular o DOM para adicionar um novo elemento à página:

```html
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manipulação de DOM</title>
</head>
<body>

<div id="conteudo">
  <h1>Lista de Tarefas</h1>
  <input type="text" id="nova-tarefa" placeholder="Digite uma nova tarefa">
  <button id="adicionar-tarefa">Adicionar Tarefa</button>
  <ul id="lista-tarefas">
    <li class="tarefa">Estudar JavaScript</li>
    <li class="tarefa">Fazer exercícios físicos</li>
  </ul>
</div>

<script>
  // Selecionando elementos
  const botaoAdicionar = document.getElementById('adicionar-tarefa');
  const inputNovaTarefa = document.getElementById('nova-tarefa');
  const listaTarefas = document.getElementById('lista-tarefas');

  // Adicionando uma nova tarefa quando o botão é clicado
  botaoAdicionar.addEventListener('click', function() {
    adicionarTarefa();
  });

  // Adicionando uma nova tarefa quando a tecla Enter é pressionada no campo de entrada
  inputNovaTarefa.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      adicionarTarefa();
    }
  });

  // Função para adicionar uma nova tarefa à lista
  function adicionarTarefa() {
    const novaTarefaTexto = inputNovaTarefa.value.trim(); // Remove espaços em branco extras do texto

    if (novaTarefaTexto !== '') { // Verifica se o campo de entrada não está vazio
      const novaTarefa = document.createElement('li');
      novaTarefa.classList.add('tarefa');
      novaTarefa.innerHTML = `${novaTarefaTexto}`;
      listaTarefas.appendChild(novaTarefa); // Adiciona a nova tarefa à lista
      inputNovaTarefa.value = ''; // Limpa o campo de entrada
    }
  }
</script>

</body>
</html>
```

## Explicação

1. **Seleção de Elementos:** Utiliza `document.getElementById()` para selecionar os elementos HTML com base em seus IDs. Isso permite que o JavaScript interaja com esses elementos.
2. **Adição de Event Listeners:** Adiciona ouvintes de evento para o botão "Adicionar Tarefa" e para a tecla "Enter" pressionada no campo de entrada. Quando um desses eventos ocorre, a função `adicionarTarefa()` é chamada.
3. **Função adicionarTarefa():** Esta função cria um novo elemento `<li>` (item de lista) e atribui o texto digitado no campo de entrada a ele. Esse elemento é então adicionado à lista de tarefas (`<ul>`).

Essencialmente, este exemplo demonstra como adicionar dinamicamente elementos ao DOM em resposta a eventos de usuário, como clicar em um botão ou pressionar Enter em um campo de entrada.