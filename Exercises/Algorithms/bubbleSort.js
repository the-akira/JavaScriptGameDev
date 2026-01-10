function bubbleSort(array) {
    const n = array.length;
    let swapped;

    do {
        swapped = false;
        for (let i = 0; i < n - 1; i++) {
            if (array[i] > array[i + 1]) {
                // Troca os elementos de posição
                [array[i], array[i + 1]] = [array[i + 1], array[i]];
                swapped = true;
            }
        }
    } while (swapped);

    return array;
}

// Exemplo de uso:
const arr = [64, 34, 25, 12, 22, 11, 90];
console.log("Array original:", arr);
console.log("Array ordenado:", bubbleSort(arr));