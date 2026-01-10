// Função para calcular a média de uma lista de números
function calcularMedia(numeros) {
    // Verificar se a lista de números está vazia
    if (numeros.length === 0) {
        return "Lista de números vazia";
    }

    // Calcular a soma dos números na lista
    const soma = numeros.reduce((acumulador, numero) => acumulador + numero, 0);

    // Calcular a média
    const media = soma / numeros.length;

    // Retornar a média
    return media;
}

// Exemplo de uso da função
const listaNumeros = [10, 15, 20, 25, 30];
console.log("Média dos números:", calcularMedia(listaNumeros));