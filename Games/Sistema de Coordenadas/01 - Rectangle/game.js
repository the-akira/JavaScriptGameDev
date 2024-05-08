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

    // Desenhar linhas de coordenadas
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ctx.canvas.width, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, ctx.canvas.height);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "blue";
    ctx.stroke();
    ctx.lineWidth = 1;
}

// Função para desenhar um retângulo e linhas ligando às coordenadas
function drawRectangleWithCoords(ctx, x, y, width, height) {
    // Desenhar retângulo
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fillStyle = "purple";
    ctx.fill();
    ctx.closePath();

    // Desenhar linhas para coordenadas
    ctx.beginPath();
    // Linha para o eixo x
    ctx.moveTo(x, y);
    ctx.lineTo(x, 0);
    // Linha para o eixo y
    ctx.moveTo(x, y);
    ctx.lineTo(0, y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "blue";
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

    // Desenhar um retângulo com coordenadas (100, 150), largura 50 e altura 50 pixels
    drawRectangleWithCoords(ctx, 100, 150, 50, 50);
}

// Chamada da função principal
main();