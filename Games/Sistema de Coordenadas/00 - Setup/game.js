// Função para desenhar a grid e as linhas de coordenadas
function drawGrid(ctx, step, color) {
    ctx.beginPath();
    // Desenhar linhas verticais
    for (let x = 0; x <= ctx.canvas.width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ctx.canvas.height);
    }
    // Desenhar linhas horizontais
    for (let y = 0; y <= ctx.canvas.height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(ctx.canvas.width, y);
    }
    ctx.strokeStyle = color;
    ctx.stroke();
}

// Função principal
function main() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar a grid e as linhas de coordenadas com um passo de 50 pixels
    drawGrid(ctx, 10, '#bdbdbd');
    drawGrid(ctx, 50, '#545454');
}

// Chamada da função principal
main();