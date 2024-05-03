function contarPalavras(texto) {
    // Remover espaços em branco extras no início e no final da string
    texto = texto.trim();
    
    // Dividir a string em palavras usando espaços em branco como delimitadores
    const palavras = texto.split(/\s+/);
    
    // Retornar o número de palavras
    return palavras.length;
}

// Exemplo de uso da função
const texto = "Este é um exemplo de frase com várias palavras.";
console.log("Número de palavras:", contarPalavras(texto));