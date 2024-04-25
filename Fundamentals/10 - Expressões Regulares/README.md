# Expressões Regulares

Expressões regulares são padrões de texto que descrevem conjuntos de strings. Elas são usadas para busca, validação, substituição e manipulação de texto de maneira poderosa e flexível.

## Sintaxe Básica

- Uma expressão regular é definida entre barras (`/`), por exemplo: `/padrão/`.
- Os caracteres normais na expressão regular correspondem exatamente aos mesmos caracteres no texto de entrada.
- Metacaracteres, como `.`, `*`, `+`, `?`, `\`, `[`, `]`, `{`, `}`, `^`, `$`, `|` têm significados especiais e são usados para definir padrões mais complexos.

## Exemplo Prático

Vamos criar uma expressão regular simples para validar se uma string contém um formato de e-mail válido.

```js
// Expressão Regular para validar e-mails
const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Função para validar e-mail
function validarEmail(email) {
  return regexEmail.test(email);
}

// Testando a função com alguns exemplos
console.log(validarEmail('usuario@dominio.com')); // Saída: true
console.log(validarEmail('email_invalido@dominio')); // Saída: false
```

## Explicação do Exemplo

- A expressão regular `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` é usada para validar e-mails.
- `^` e `$` indicam o início e o fim da string, respectivamente.
- `[a-zA-Z0-9._%+-]+` corresponde a um ou mais caracteres alfanuméricos, pontos, underscores, porcentagens, sinais de mais e hífens antes do símbolo `@`.
- `@` corresponde literalmente ao caractere `@`.
- `[a-zA-Z0-9.-]+` corresponde a um ou mais caracteres alfanuméricos e hífens após o símbolo `@`.
- `\.` corresponde literalmente a um ponto.
- `[a-zA-Z]{2,}` corresponde a dois ou mais caracteres alfabéticos após o ponto (o TLD, como `.com`, `.org`, `.net`, etc.).

## Benefícios

- Expressões regulares fornecem uma maneira poderosa e flexível de manipular texto.
- Permitem encontrar padrões complexos em strings.
- São amplamente utilizadas em tarefas de validação, busca e substituição de texto.