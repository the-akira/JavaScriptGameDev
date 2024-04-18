// Obter o elemento do canvas
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var player = {
    x: 50,
    y: 50,
    width: 50,
    height: 50,
    speed: 10
};

document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowRight" && player.x + player.width + player.speed <= canvas.width) {
        player.x += player.speed;
    } else if (event.key === "ArrowLeft" && player.x - player.speed >= 0) {
        player.x -= player.speed;
    } else if (event.key === "ArrowDown" && player.y + player.height + player.speed <= canvas.height) {
        player.y += player.speed;
    } else if (event.key === "ArrowUp" && player.y - player.speed >= 0) {
        player.y -= player.speed;
    }
});

function drawPlayer() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    requestAnimationFrame(drawPlayer);
}

drawPlayer();