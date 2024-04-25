# Testes

Suponha que temos uma função `somar` que queremos testar:

```js
function somar(a, b) {
  return a + b;
}
```

Para testar essa função, podemos escrever um conjunto de afirmações que verificam se a função se comporta conforme o esperado em diferentes cenários:

```js
function testarSomar() {
  // Teste 1: Verificar se 2 + 2 é igual a 4
  const resultado1 = somar(2, 2);
  if (resultado1 === 4) {
    console.log('Teste 1 passou!');
  } else {
    console.error('Teste 1 falhou!');
  }

  // Teste 2: Verificar se -1 + 1 é igual a 0
  const resultado2 = somar(-1, 1);
  if (resultado2 === 0) {
    console.log('Teste 2 passou!');
  } else {
    console.error('Teste 2 falhou!');
  }

  // Teste 3: Verificar se 0 + 0 é igual a 0
  const resultado3 = somar(0, 0);
  if (resultado3 === 0) {
    console.log('Teste 3 passou!');
  } else {
    console.error('Teste 3 falhou!');
  }
}

// Executar os testes
testarSomar();
```

Neste exemplo, temos uma função `testarSomar` que contém três testes diferentes para a função `somar`. Cada teste verifica se a função `somar` retorna o resultado esperado para diferentes entradas. Se todas as afirmações forem verdadeiras, os testes passam; caso contrário, falham.

## Conclusão

Escrever testes em JavaScript puro pode ser um pouco trabalhoso e menos robusto do que usar frameworks de teste, mas ainda é possível. Basta definir suas afirmações e executar os testes para garantir que suas funções estejam funcionando corretamente. Lembre-se de adicionar mais testes para cobrir diferentes cenários e aumentar a confiabilidade do seu código.