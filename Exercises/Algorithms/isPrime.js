// Verificação de números primos
function isPrime(n) {
    if (n <= 1) {
        return false;
    }

    for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) {
            return false;
        }
    }

    return true;
}

// Exemplo de uso
console.log(isPrime(9)); // Não é primo
console.log(isPrime(7)); // É primo
