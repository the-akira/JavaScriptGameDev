var canvas = document.getElementById("meuCanvas");
var context = canvas.getContext("2d");

// Definindo variáveis para os parâmetros do fillRect
var x = 50;       // Coordenada x do canto superior esquerdo do retângulo
var y = 50;       // Coordenada y do canto superior esquerdo do retângulo
var width = 100;  // Largura do retângulo
var height = 100; // Altura do retângulo

context.fillStyle = "red";

// Desenha um retângulo vermelho nas coordenadas (x, y) com largura e altura definidas
context.fillRect(x, y, width, height);