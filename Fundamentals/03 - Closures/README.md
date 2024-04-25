# Closures

Closures são uma característica poderosa do JavaScript que ocorre quando uma função é capaz de lembrar e acessar seu escopo léxico, mesmo quando a função é executada fora desse escopo. Isso significa que uma função interna tem acesso às variáveis da função externa, mesmo após a execução da função externa ter sido concluída.

```js
function saudacao(nome) {
  let mensagem = "Olá, " + nome + "!";

  function mostrarMensagem() {
    console.log(mensagem);
  }

  return mostrarMensagem;
}

let saudacaoParaJoao = saudacao("João");
saudacaoParaJoao();
```

Neste exemplo, a função `saudacao` retorna outra função chamada `mostrarMensagem`. Apesar de mensagem estar definida dentro de saudacao, a função interna `mostrarMensagem` ainda tem acesso a ela. Isso é possível devido à closure.

As closures são úteis para criar funções que encapsulam dados e comportamentos específicos, tornando-as mais modulares e reutilizáveis.