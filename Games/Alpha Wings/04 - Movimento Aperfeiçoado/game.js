// Obter o elemento do canvas
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var player = {
    x: 50,
    y: 50,
    width: 50,
    height: 50,
    speed: 5
};

var keysPressed = {};

function handleKeyDown(event) {
    keysPressed[event.key] = true;
    event.preventDefault();
}

function handleKeyUp(event) {
    delete keysPressed[event.key];
}

function updatePlayer() {
    player.vx = 0;
    player.vy = 0;

    if ('ArrowUp' in keysPressed) {
        player.vy = -player.speed;
    }
    if ('ArrowDown' in keysPressed) {
        player.vy = player.speed;
    }
    if ('ArrowLeft' in keysPressed) {
        player.vx = -player.speed;
    }
    if ('ArrowRight' in keysPressed) {
        player.vx = player.speed;
    }

    player.x += player.vx;
    player.y += player.vy;

    // Limitar jogador dentro do canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function drawPlayer() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    updatePlayer();
    requestAnimationFrame(drawPlayer);
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
drawPlayer();