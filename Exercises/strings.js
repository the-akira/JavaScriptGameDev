// Função para substituir todas as ocorrências de um caractere por outro em uma string
function substituirCaractere(string, caractereAntigo, caractereNovo) {
    return string.split(caractereAntigo).join(caractereNovo);
}

// Função para concatenar duas strings
function concatenarStrings(string1, string2) {
    return `${string1} ${string2}`;
}

// Função para verificar se uma string contém um determinado padrão
function verificarPadrao(string, padrao) {
    return string.includes(padrao);
}

// Exemplos de uso das funções
const frase = "Olá mundo!";
console.log("String original:", frase);
console.log("Substituir 'mundo' por 'JavaScript':", substituirCaractere(frase, "mundo", "JavaScript"));
console.log("Concatenar com 'Bem-vindo':", concatenarStrings(frase, "Bem-vindo"));
console.log("Verificar se contém 'mundo':", verificarPadrao(frase, "mundo"));