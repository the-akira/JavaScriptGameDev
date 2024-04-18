var canvas = document.getElementById("meuCanvas");
var ctx = canvas.getContext("2d");

var square = {
    x: 0,
    y: 50,
    width: 100,
    height: 100,
}

var circle = {
    x: 100,
    y: 100,
    radius: 20,
    speedX: 2,
    speedY: 2
};

function animate() {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Cria o gradiente
    var gradient = ctx.createLinearGradient(square.x, 50, square.x + 100, 150);
    gradient.addColorStop(0, "red");
    gradient.addColorStop(1, "blue");
    
    // Define o gradiente como preenchimento do retângulo
    ctx.fillStyle = gradient;
    
    // Desenha o retângulo animado com gradiente
    ctx.fillRect(square.x, square.y, square.width, square.height);
    
    // Atualiza a posição do retângulo animado
    square.x += 1;
    if (square.x > canvas.width) {
        square.x = 0;
    }

    // Desenha o círculo
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Atualiza a posição do círculo
    circle.x += circle.speedX;
    circle.y += circle.speedY;
    
    // Verifica colisões com as paredes do canvas
    if (circle.x + circle.radius > canvas.width || circle.x - circle.radius < 0) {
        circle.speedX *= -1; // Inverte a direção horizontal ao atingir as bordas laterais
    }
    
    if (circle.y + circle.radius > canvas.height || circle.y - circle.radius < 0) {
        circle.speedY *= -1; // Inverte a direção vertical ao atingir as bordas superior ou inferior
    }
    
    // Chama a próxima animação
    requestAnimationFrame(animate);
}

// Inicia a animação
animate();