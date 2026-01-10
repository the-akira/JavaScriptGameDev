function factorial(n) {
    let result = 1;
    let expression = "";

    for (let i = 1; i <= n; i++) {
        result *= i;
        expression += i + (i < n ? " × " : "");
    }

    return expression + " = " + result;
}

console.log(factorial(7));
