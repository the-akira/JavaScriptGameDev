// Função que gera sequência fibonacci
function fibonacci(n) {
    const result = [];

    if (n < 0) {
        return result;
    }

    let a = 0;
    let b = 1;

    for (let i = 0; i <= n; i++) {
        result.push(a);
        [a, b] = [b, a + b];
    }

    return result;
}

// Exemplo de uso
console.log(fibonacci(10));
