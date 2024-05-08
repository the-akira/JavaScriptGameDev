// Função para desenhar a grid e as linhas de coordenadas
function drawGrid(ctx, step, color) {
    // Definir a espessura da linha para evitar aumento de espessura
    ctx.lineWidth = 1;

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

    // Definir as coordenadas do retângulo
    let rectX = 100;
    let rectY = 150;
    const rectWidth = 50;
    const rectHeight = 50;

    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar a grid e as linhas de coordenadas com um passo de 50 pixels
    drawGrid(ctx, 10, '#bdbdbd');
    drawGrid(ctx, 50, '#545454');

    // Desenhar um retângulo com coordenadas (100, 150), largura 50 e altura 50 pixels
    drawRectangleWithCoords(ctx, rectX, rectY, rectWidth, rectHeight);

    const keyMap = {
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown"
    };

    const keysPressed = {};

    document.addEventListener('keydown', function(event) {
        const key = keyMap[event.keyCode];
        if (key) {
            keysPressed[key] = true;
            moveRectangle();
            event.preventDefault();
        }
    });

    document.addEventListener('keyup', function(event) {
        const key = keyMap[event.keyCode];
        if (key) {
            delete keysPressed[key];
        }
    });

    function moveRectangle() {
        let dx = 0;
        let dy = 0;

        if (keysPressed["ArrowLeft"]) {
            dx -= 10;
        }
        if (keysPressed["ArrowUp"]) {
            dy -= 10;
        }
        if (keysPressed["ArrowRight"]) {
            dx += 10;
        }
        if (keysPressed["ArrowDown"]) {
            dy += 10;
        }

        if (dx !== 0 || dy !== 0) {
            const newRectX = rectX + dx;
            const newRectY = rectY + dy;
            
            if (newRectX >= 0 && newRectX <= canvas.width - rectWidth) {
                rectX = newRectX;
            }
            if (newRectY >= 0 && newRectY <= canvas.height - rectHeight) {
                rectY = newRectY;
            }
            
            redraw();
        }
    }

    // Função para redesenhar o canvas com o retângulo atualizado
    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(ctx, 10, '#bdbdbd');
        drawGrid(ctx, 50, '#545454');
        drawRectangleWithCoords(ctx, rectX, rectY, rectWidth, rectHeight);
    }
}

// Chamada da função principal
main();