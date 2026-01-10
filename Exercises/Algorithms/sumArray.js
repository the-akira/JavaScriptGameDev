function sumArray(array, index = 0) {
    if (index === array.length) {
        return 0;
    }

    return array[index] + sumArray(array, index + 1);
}

console.log(sumArray([1,2,3,4,5]));
