// Função para desenhar a grid e as linhas de coordenadas
function drawGrid(ctx, step, color, drawCoordinates) {
    // Definir a espessura da linha para evitar aumento de espessura
    ctx.lineWidth = 1;

    ctx.beginPath();
    // Desenhar linhas verticais e os números das coordenadas no eixo X
    for (let x = 0; x <= ctx.canvas.width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ctx.canvas.height);
        // Desenhar número da coordenada no eixo X
        if (drawCoordinates && x > 0) {
            ctx.font = "bold 16px Arial";
            ctx.fillStyle = "blue";
            ctx.textAlign = "right";
            ctx.fillText(x.toString(), x - 5, 17);
        }
    }
    // Desenhar linhas horizontais e os números das coordenadas no eixo Y
    for (let y = 0; y <= ctx.canvas.height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(ctx.canvas.width, y);
        // Desenhar número da coordenada no eixo Y
        if (drawCoordinates && y > 0) {
            ctx.font = "bold 16px Arial";
            ctx.fillStyle = "blue";
            ctx.textAlign = "left";
            ctx.fillText(y.toString(), 5, y + 18);
        }
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

// Função para desenhar as coordenadas do retângulo
function drawRectangleCoordinates(ctx, x, y) {
    document.getElementById("coordinates").innerHTML = `(x: ${x}, y: ${y})`;
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

    // Desenhar as coordenadas do retângulo
    drawRectangleCoordinates(ctx, x, y);
}

// Função para desenhar um círculo e mostrar suas coordenadas em tempo real
function drawCircleWithCoords(ctx, x, y, radius) {
    // Desenhar círculo
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();

    // Desenhar as coordenadas do círculo
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(`(x: ${x}, y: ${y})`, x + radius + 6, y + 3);
}

// Função para verificar a colisão entre um círculo e um retângulo
function isCollision(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
    // Encontrar a distância do centro do círculo ao retângulo
    let distX = Math.abs(circleX - rectX - rectWidth / 2);
    let distY = Math.abs(circleY - rectY - rectHeight / 2);

    // Se a distância do centro do círculo ao retângulo for maior do que a soma dos raios, não há colisão
    if (distX > (rectWidth / 2 + circleRadius) || distY > (rectHeight / 2 + circleRadius)) {
        return false;
    }

    // Se a distância for menor ou igual à soma dos raios, há colisão
    if (distX <= (rectWidth / 2) || distY <= (rectHeight / 2)) {
        return true;
    }

    // Verificar colisão com os cantos do retângulo
    let dx = distX - rectWidth / 2;
    let dy = distY - rectHeight / 2;
    return (dx * dx + dy * dy <= (circleRadius * circleRadius));
}

// Função principal
function main() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Definir as coordenadas do retângulo principal
    let rectX = 100;
    let rectY = 150;
    const rectWidth = 50;
    const rectHeight = 50;

    // Inicializar as coordenadas e o raio do círculo
    let circleX = canvas.width; // Começa da direita
    let circleY = Math.floor(Math.random() * canvas.height); // Posição aleatória no eixo Y
    const circleRadius = 20;

    // Controlar se um novo círculo pode ser spawnado
    let canSpawnCircle = true;

    // Loop de spawn contínuo de círculos
    function spawnCircle() {
        if (circleX < -circleRadius) {
            canSpawnCircle = true;
        }
        if (canSpawnCircle) {
            circleX = canvas.width; // Começa da direita
            circleY = Math.floor(Math.random() * canvas.height); // Posição aleatória no eixo Y
            canSpawnCircle = false;
        }
    }

    // Loop de animação usando requestAnimationFrame
    function animate() {
        // Limpar o canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Desenhar a grid e as linhas de coordenadas com um passo de 50 pixels
        drawGrid(ctx, 10, '#bdbdbd', false);
        drawGrid(ctx, 50, '#545454', true);

        // Desenhar o retângulo principal
        drawRectangleWithCoords(ctx, rectX, rectY, rectWidth, rectHeight);

        // Desenhar o círculo
        drawCircleWithCoords(ctx, circleX, circleY, circleRadius);

        // Movimentar o círculo da direita para a esquerda
        circleX -= 1;

        // Spawnar um novo círculo se possível
        spawnCircle();

        // Verificar colisão entre o círculo e o retângulo (jogador)
        if (isCollision(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight)) {
            // Se houver colisão, destruir o círculo
            circleX = -circleRadius - 200; // Mover o círculo para fora da tela para simular a destruição
            canSpawnCircle = true; // Permitir que um novo círculo seja spawnado
        }

        // Solicitar próxima animação
        requestAnimationFrame(animate);
    }

    // Iniciar a animação
    animate();

    // Mapear códigos de teclas para nomes mais legíveis
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

        if ("ArrowLeft" in keysPressed) {
            dx -= 10;
        }
        if ("ArrowUp" in keysPressed) {
            dy -= 10;
        }
        if ("ArrowRight" in keysPressed) {
            dx += 10;
        }
        if ("ArrowDown" in keysPressed) {
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
        }
    }
}

// Chamada da função principal
main();