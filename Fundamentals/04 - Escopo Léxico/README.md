# Escopo Léxico

O escopo léxico, ou escopo de função, em JavaScript refere-se ao contexto em que as variáveis são declaradas dentro de uma função. Esse escopo é determinado no momento da escrita do código, ou seja, o escopo é definido pelo local físico no código onde as variáveis são declaradas.

Vamos ver um exemplo prático:

```js
// Exemplo de escopo léxico
function externa() {
  let mensagem = "Escopo externo";

  function interna() {
    console.log(mensagem);
  }

  interna();
}

externa(); // Saída: Escopo externo
```

Neste exemplo, a função `interna` tem acesso à variável `mensagem` que foi declarada no escopo da função `externa`. Isso ocorre porque o escopo léxico de `interna` inclui o escopo de `externa`.

O escopo léxico é importante para entender como as variáveis são acessadas e compartilhadas dentro de funções em JavaScript, especialmente quando se trabalha com closures e escopo de variáveis.