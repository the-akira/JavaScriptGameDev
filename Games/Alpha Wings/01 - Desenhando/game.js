var canvas = document.getElementById("meuCanvas");
var ctx = canvas.getContext("2d");

function drawRectangle(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawLine(x1, y1, x2, y2, color, lineWidth) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
}

function drawPentagon(centerX, centerY, radius, color) {
    var sides = 5;
    var rotationAngle = 2.95 / Math.PI;

    ctx.beginPath();
    ctx.moveTo(centerX + radius * Math.cos(0 + rotationAngle), centerY + radius * Math.sin(0 + rotationAngle));

    for (var i = 1; i <= sides; i++) {
        ctx.lineTo(centerX + radius * Math.cos((i * 2 * Math.PI / sides) + rotationAngle), centerY + radius * Math.sin((i * 2 * Math.PI / sides) + rotationAngle));
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawTriangle(x1, y1, x2, y2, x3, y3, color) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawEquilateralTriangle(x, y, sideLength, color) {
    var x1 = x;
    var y1 = y;
    var x2 = x1 + sideLength * Math.cos(Math.PI / 3);
    var y2 = y1 + sideLength * Math.sin(Math.PI / 3);
    var x3 = x1 - sideLength * Math.cos(Math.PI / 3);
    var y3 = y1 + sideLength * Math.sin(Math.PI / 3);

    drawTriangle(x1, y1, x2, y2, x3, y3, color);
}

function drawHexagon(centerX, centerY, radius, color) {
    var sides = 6;

    ctx.beginPath();
    ctx.moveTo(centerX + radius * Math.cos(0), centerY + radius * Math.sin(0));

    for (var i = 1; i <= sides; i++) {
        ctx.lineTo(centerX + radius * Math.cos(i * 2 * Math.PI / sides), centerY + radius * Math.sin(i * 2 * Math.PI / sides));
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawOctagon(centerX, centerY, radius, color) {
    var sides = 8;

    ctx.beginPath();
    ctx.moveTo(centerX + radius * Math.cos(0), centerY + radius * Math.sin(0));

    for (var i = 1; i <= sides; i++) {
        ctx.lineTo(centerX + radius * Math.cos(i * 2 * Math.PI / sides), centerY + radius * Math.sin(i * 2 * Math.PI / sides));
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

// Chamar as funções para desenhar cada objeto com argumentos específicos
drawRectangle(50, 50, 100, 75, "blue");
drawCircle(150, 300, 50, "red");
drawLine(600, 80, 400, 80, "green", 3);
drawPentagon(400, 300, 60, "purple");
drawTriangle(600, 450, 600, 500, 450, 450, "gray");
drawEquilateralTriangle(900, 300, 100, "black");
drawHexagon(700, 300, 50, "orange");
drawOctagon(200, 500, 50, "magenta");