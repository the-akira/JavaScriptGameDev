# Funções de Primeira Classe

As funções de primeira classe em JavaScript tratam as funções como cidadãos de primeira classe, o que significa que elas podem ser tratadas da mesma forma que qualquer outra variável. Isso inclui passar funções como argumentos para outras funções, retornar funções de outras funções e atribuir funções a variáveis.

Aqui está um exemplo prático:

```js
function saudacao(nome) {
  return "Olá, " + nome + "!";
}

function executaFuncao(funcao, nome) {
  return funcao(nome);
}

let resultado = executaFuncao(saudacao, "João");
console.log(resultado); // Saída: Olá, João!
```

Neste exemplo, a função `saudacao` é passada como argumento para a função `executaFuncao`. Dentro de `executaFuncao`, a função passada é então invocada com um parâmetro.

As funções de primeira classe são uma parte importante do paradigma funcional em JavaScript e permitem um código mais flexível e poderoso.