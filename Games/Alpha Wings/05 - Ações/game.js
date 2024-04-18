var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var player = {
    x: 50,
    y: 50,
    width: 50,
    height: 50,
    speed: 5,
    vx: 0,
    vy: 0
};

var keysPressed = {};
var projectiles = [];
var lastShotTime = 0;
var shootDelay = 350;

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

function updateProjectiles() {
    for (var i = 0; i < projectiles.length; i++) {
        projectiles[i].y -= projectiles[i].speed;
        if (projectiles[i].y < 0) {
            projectiles.splice(i, 1);
            i--;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar borda do jogador
    ctx.strokeStyle = "black"; // Defina a cor da borda
    ctx.lineWidth = 2; // Defina a largura da borda
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    
    // Desenhar jogador
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Desenhar projéteis
    ctx.fillStyle = "red";
    for (var i = 0; i < projectiles.length; i++) {
        ctx.beginPath();
        ctx.arc(projectiles[i].x, projectiles[i].y, projectiles[i].radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Atualizar jogador e projéteis
    updatePlayer();
    updateProjectiles();

    requestAnimationFrame(draw);
}

function shoot() {
    var currentTime = Date.now();
    if (currentTime - lastShotTime > shootDelay && 'q' in keysPressed) {
        projectiles.push({
            x: player.x + player.width / 2,
            y: player.y,
            radius: 5,
            speed: 5
        });
        lastShotTime = currentTime;
    }
}

function teleport() {
    if ('t' in keysPressed) { 
        player.x = Math.random() * (canvas.width - player.width);
        player.y = Math.random() * (canvas.height - player.height);
    }
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

setInterval(shoot, 100);
setInterval(teleport, 200);

draw();