// Busca linear
function linearSearch(array, target) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === target) {
            return i; // posição encontrada
        }
    }

    return -1; // não encontrado
}

// Exemplo de uso
console.log(linearSearch([10, 20, 30, 40], 30)); // 2
