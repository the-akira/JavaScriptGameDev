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

console.log(fibonacci(10));
