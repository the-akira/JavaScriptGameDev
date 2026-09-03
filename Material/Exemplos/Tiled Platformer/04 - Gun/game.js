(function(){
"use strict";

/* ============================================================
   ARQUIVOS DO JOGO (carregados via fetch/<img>, devem estar
   na MESMA PASTA deste index.html)
   ============================================================ */
const MAP_FILES = { map1: "maps/map1.tmx", map2: "maps/map2.tmx" };
const TILESET_SRC = "assets/tileset.png";
const DOOR_SRC = "assets/door.png";
const GUN_SRC = "assets/gun.png";
const BULLET_SRC = "assets/bullet.png";

const TILE = 16;           // tamanho de cada tile no tileset/mapa
const DOOR_TILE_GID = 257; // primeiro gid do tileset "door"
const ZOOM = 3;             // fator de escala na tela
const INTERACT_KEY = "KeyE";
const SHOOT_KEY = "KeyX";

/* Sprite sheets do player: cada arquivo é uma tira horizontal de
   frames de mesmo tamanho (32x48), um estado por arquivo. */
const SPRITE_W = 32;
const SPRITE_H = 48;
const SPRITE_FEET_Y = 36; // linha (em px, dentro do frame) onde os pés tocam o chão
const ANIMS = {
  idle: { src: "assets/player_idle.png", frames: 5, fps: 6,  img: null },
  run:  { src: "assets/player_run.png",  frames: 7, fps: 12, img: null },
  jump: { src: "assets/player_jump.png", frames: 3, fps: 10, img: null }
};

/* Braço/arma (gun.png, 40x10): o desenho não ocupa a tela toda —
   o "ombro" (ponto onde encosta no corpo) fica perto de x=17,y=4
   e o cano aponta para a direita, com a ponta perto de x=38,y=4.
   ARM_PIVOT é o ponto do sprite que é ancorado ao corpo do jogador;
   MUZZLE_OFFSET é, a partir desse pivô, onde a bala nasce. */
const ARM_W = 40, ARM_H = 10;
const ARM_PIVOT = { x: 17, y: 4 };
const MUZZLE_OFFSET = { x: 21, y: 0 };
// Onde o ombro fica no corpo do jogador (relativo ao pé/centro do
// hitbox): X segue a direção que o personagem está olhando, Y é
// medido a partir do topo do frame do sprite (0 = topo da cabeça).
const ARM_ATTACH = { x: -4, y: 20 };

const BULLET_W = 4, BULLET_H = 4;
const BULLET_SPEED = 320;   // px/s
const BULLET_LIFETIME = 1.2; // segundos até desaparecer, mesmo sem colidir
const SHOOT_COOLDOWN = 0.18; // segundos entre disparos

/* ============================================================
   CARREGAMENTO
   ============================================================ */
function loadImage(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem: " + src));
    img.src = src;
  });
}

function parseCSVData(text){
  return text.replace(/\s+/g, "").split(",").filter(s => s !== "").map(Number);
}

function parseTMX(xmlText){
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  const mapEl = doc.querySelector("map");
  if(!mapEl) throw new Error("XML de mapa inválido");
  const width = parseInt(mapEl.getAttribute("width"), 10);
  const height = parseInt(mapEl.getAttribute("height"), 10);

  const layers = {};
  doc.querySelectorAll("map > layer").forEach(layerEl => {
    const name = layerEl.getAttribute("name");
    const dataEl = layerEl.querySelector("data");
    layers[name] = parseCSVData(dataEl.textContent);
  });

  let door = null;
  doc.querySelectorAll("map > objectgroup").forEach(og => {
    const props = {};
    og.querySelectorAll("properties > property").forEach(p => {
      props[p.getAttribute("name")] = p.getAttribute("value");
    });
    const objEl = og.querySelector("object");
    if(objEl){
      door = {
        origin: props["Origin"],
        destiny: props["Destiny"],
        x: parseFloat(objEl.getAttribute("x")),
        y: parseFloat(objEl.getAttribute("y")),
        width: parseFloat(objEl.getAttribute("width")),
        height: parseFloat(objEl.getAttribute("height")),
      };
    }
  });

  return { width, height, layers, door };
}

async function loadMapFile(id){
  const res = await fetch(MAP_FILES[id]);
  if(!res.ok) throw new Error("Falha ao carregar " + MAP_FILES[id] + " (HTTP " + res.status + ")");
  const text = await res.text();
  return parseTMX(text);
}

async function loadAllMaps(){
  const ids = Object.keys(MAP_FILES);
  const entries = await Promise.all(ids.map(async id => [id, await loadMapFile(id)]));
  return Object.fromEntries(entries);
}

/* ============================================================
   ESTADO DO JOGO
   ============================================================ */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const mapLabelEl = document.getElementById('mapLabel');

const keys = {};
let interactRequested = false;
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if(e.code === INTERACT_KEY) interactRequested = true;
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

let tilesetImg = null;
let doorImg = null;
let gunImg = null;
let bulletImg = null;
let MAPS_RAW = null; // { map1: {width,height,layers,door}, map2: {...} }

let currentMapId = "map1";
let currentMap = null;
let doorCooldown = 0;   // evita re-trigger imediato ao trocar de mapa
let nearDoor = false;   // usado pelo indicador visual
let promptT = 0;        // tempo acumulado p/ animação do indicador

let shootCooldown = 0;  // tempo restante até poder disparar de novo
let bullets = [];       // {x,y,vx,vy,t} — x,y é o centro da bala

const player = {
  x: 0, y: 0,
  w: 12, h: 26,   // hitbox de colisão (menor que o sprite, ajustada ao contorno do personagem)
  vx: 0, vy: 0,
  onGround: false,
  facing: 1,
  animState: "idle",
  animFrame: 0,
  animTimer: 0,
  coyoteTimer: 0   // tempo restante em que ainda é possível pular após sair do chão
};

const PHYS = {
  gravity: 900,
  moveSpeed: 95,
  jumpVel: -300,
  maxFall: 500,
  friction: 780,
  accel: 900,
  coyoteTime: 0.1  // janela (s) de tolerância para pular após deixar uma plataforma
};

/* ============================================================
   PREPARAÇÃO DE UM MAPA (localizar camadas por nome, com
   tolerância ao nome real gravado no .tmx: "Plaforms")
   ============================================================ */
function getLayer(mapData, ...names){
  for(const n of names){
    if(mapData.layers[n]) return mapData.layers[n];
  }
  return null;
}

function prepareMap(id){
  const raw = MAPS_RAW[id];
  const platforms = getLayer(raw, "Platforms", "Plaforms");
  const background = getLayer(raw, "Background");
  const doorsTiles = getLayer(raw, "Doors");
  return {
    id,
    width: raw.width,
    height: raw.height,
    pxWidth: raw.width * TILE,
    pxHeight: raw.height * TILE,
    background,
    platforms,
    doorsTiles,
    door: raw.door
  };
}

function tileAt(layer, mapData, col, row){
  if(col < 0 || row < 0 || col >= mapData.width || row >= mapData.height) return 0;
  return layer[row * mapData.width + col];
}

function isSolid(mapData, worldX, worldY){
  const col = Math.floor(worldX / TILE);
  const row = Math.floor(worldY / TILE);
  return tileAt(mapData.platforms, mapData, col, row) !== 0;
}

/* ============================================================
   SPAWN DO JOGADOR EM UMA PORTA (ao trocar de mapa)
   ============================================================ */
// Varre para baixo, a partir de startY, na coluna sob centerX,
// até achar o primeiro tile sólido — retorna o Y do topo dele.
function findGroundY(mapData, centerX, startY){
  const col = Math.floor(centerX / TILE);
  let row = Math.max(0, Math.floor(startY / TILE));
  while(row < mapData.height){
    if(tileAt(mapData.platforms, mapData, col, row) !== 0) return row * TILE;
    row++;
  }
  return null; // nenhum chão encontrado abaixo da porta
}

function spawnAtDoor(mapData){
  const d = mapData.door;
  if(!d){
    player.x = 20; player.y = 20;
    player.vx = 0; player.vy = 0;
    player.onGround = true;
    player.coyoteTimer = PHYS.coyoteTime;
    return;
  }
  const doorCenterX = d.x + d.width/2;
  const mapMidX = mapData.pxWidth / 2;
  const pushDir = doorCenterX < mapMidX ? 1 : -1;
  player.x = doorCenterX - player.w/2 + pushDir * 34;

  // Em vez de posicionar com base na altura da porta (que pode não
  // coincidir com o chão real e fazer o jogador "cair" ao entrar),
  // procura o chão de verdade logo abaixo do topo da porta e já
  // encosta os pés nele.
  const feetCenterX = player.x + player.w/2;
  const groundY = findGroundY(mapData, feetCenterX, d.y);
  player.y = (groundY !== null) ? groundY - player.h : d.y + d.height - player.h - 1;

  player.vx = 0;
  player.vy = 0;
  player.facing = pushDir;
  player.onGround = true;
  player.coyoteTimer = PHYS.coyoteTime;
}

function goToMap(destinyId){
  currentMap = prepareMap(destinyId);
  currentMapId = destinyId;
  mapLabelEl.textContent = destinyId;
  spawnAtDoor(currentMap);
  doorCooldown = 0.5;
  nearDoor = false;
  bullets = []; // balas não atravessam a troca de mapa
}

/* ============================================================
   FÍSICA / COLISÃO (eixo X e Y resolvidos separadamente)
   ============================================================ */
function updatePlayer(dt){
  let moveDir = 0;
  if(keys["ArrowLeft"] || keys["KeyA"]) moveDir -= 1;
  if(keys["ArrowRight"] || keys["KeyD"]) moveDir += 1;

  if(moveDir !== 0){
    player.vx += moveDir * PHYS.accel * dt;
    player.vx = Math.max(-PHYS.moveSpeed, Math.min(PHYS.moveSpeed, player.vx));
    player.facing = moveDir;
  } else {
    const f = PHYS.friction * dt;
    if(Math.abs(player.vx) <= f) player.vx = 0;
    else player.vx -= Math.sign(player.vx) * f;
  }

  const jumpPressed = keys["ArrowUp"] || keys["KeyW"] || keys["Space"];
  if(jumpPressed && (player.onGround || player.coyoteTimer > 0)){
    player.vy = PHYS.jumpVel;
    player.onGround = false;
    player.coyoteTimer = 0; // consumido: evita pulo duplo no ar
  }

  player.vy += PHYS.gravity * dt;
  if(player.vy > PHYS.maxFall) player.vy = PHYS.maxFall;

  // --- resolve X ---
  let newX = player.x + player.vx * dt;
  if(player.vx !== 0){
    const dir = player.vx > 0 ? 1 : -1;
    const edgeX = dir > 0 ? newX + player.w : newX;
    const top = player.y + 1;
    const bottom = player.y + player.h - 1;
    if(isSolid(currentMap, edgeX, top) || isSolid(currentMap, edgeX, bottom)){
      const col = Math.floor(edgeX / TILE);
      newX = dir > 0 ? (col * TILE) - player.w : (col + 1) * TILE;
      player.vx = 0;
    }
  }
  newX = Math.max(0, Math.min(currentMap.pxWidth - player.w, newX));
  player.x = newX;

  // --- resolve Y ---
  let newY = player.y + player.vy * dt;
  player.onGround = false;
  if(player.vy !== 0){
    const dir = player.vy > 0 ? 1 : -1;
    const edgeY = dir > 0 ? newY + player.h : newY;
    const left = player.x + 1;
    const right = player.x + player.w - 1;
    if(isSolid(currentMap, left, edgeY) || isSolid(currentMap, right, edgeY)){
      const row = Math.floor(edgeY / TILE);
      if(dir > 0){
        newY = (row * TILE) - player.h;
        player.onGround = true;
      } else {
        newY = (row + 1) * TILE;
      }
      player.vy = 0;
    }
  }
  newY = Math.max(0, Math.min(currentMap.pxHeight - player.h, newY));
  player.y = newY;

  // --- coyote time: reabastece enquanto no chão, esgota no ar ---
  if(player.onGround){
    player.coyoteTimer = PHYS.coyoteTime;
  } else if(player.coyoteTimer > 0){
    player.coyoteTimer -= dt;
  }

  // --- checagem da porta: apenas indica proximidade; troca de mapa
  //     só acontece se o jogador apertar o botão de interação ---
  if(doorCooldown > 0) doorCooldown -= dt;
  const d = currentMap.door;
  nearDoor = false;
  if(d){
    const overlap = player.x < d.x + d.width &&
                     player.x + player.w > d.x &&
                     player.y < d.y + d.height &&
                     player.y + player.h > d.y;
    nearDoor = overlap;
    if(overlap && interactRequested && doorCooldown <= 0){
      goToMap(d.destiny);
    }
  }
  interactRequested = false; // consumido a cada frame (one-shot)

  // --- tiro ---
  if(shootCooldown > 0) shootCooldown -= dt;
  if(keys[SHOOT_KEY] && shootCooldown <= 0){
    fireBullet();
    shootCooldown = SHOOT_COOLDOWN;
  }
  updateBullets(dt);

  updateAnimation(dt);
  promptT += dt;
}

/* ============================================================
   ARMA / TIRO
   ============================================================ */
// Ponto do "ombro" no mundo, onde o braço é ancorado ao corpo —
// mesma referência usada tanto para desenhar o braço quanto para
// calcular de onde a bala nasce.
function getShoulderWorld(){
  const feetX = player.x + player.w/2;
  const feetY = player.y + player.h;
  const frameTopY = feetY - SPRITE_FEET_Y;
  return {
    x: feetX + player.facing * ARM_ATTACH.x,
    y: frameTopY + ARM_ATTACH.y
  };
}

function fireBullet(){
  const shoulder = getShoulderWorld();
  const mx = shoulder.x + player.facing * MUZZLE_OFFSET.x;
  const my = shoulder.y + MUZZLE_OFFSET.y;
  bullets.push({
    x: mx, y: my,
    vx: player.facing * BULLET_SPEED,
    vy: 0,
    t: 0
  });
}

function updateBullets(dt){
  for(let i = bullets.length - 1; i >= 0; i--){
    const b = bullets[i];
    b.t += dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    let dead = b.t >= BULLET_LIFETIME ||
               b.x < 0 || b.x > currentMap.pxWidth ||
               b.y < 0 || b.y > currentMap.pxHeight;

    if(!dead && isSolid(currentMap, b.x, b.y)) dead = true;

    if(dead) bullets.splice(i, 1);
  }
}

/* ============================================================
   ANIMAÇÃO (idle / run — jump entra depois)
   ============================================================ */
function updateAnimation(dt){
  const grounded = player.onGround;
  const moving = Math.abs(player.vx) > 5;
  const nextState = !grounded ? "jump" : (moving ? "run" : "idle");

  if(nextState !== player.animState){
    player.animState = nextState;
    player.animFrame = 0;
    player.animTimer = 0;
  }

  const anim = ANIMS[player.animState];
  const frameDur = 1 / anim.fps;
  player.animTimer += dt;
  while(player.animTimer >= frameDur){
    player.animTimer -= frameDur;
    player.animFrame = (player.animFrame + 1) % anim.frames;
  }
}

/* ============================================================
   CÂMERA
   ============================================================ */
function getCamera(){
  const viewW = canvas.width / ZOOM;
  const viewH = canvas.height / ZOOM;
  let camX = (player.x + player.w/2) - viewW/2;
  let camY = (player.y + player.h/2) - viewH/2;
  camX = Math.max(0, Math.min(currentMap.pxWidth - viewW, camX));
  camY = Math.max(0, Math.min(currentMap.pxHeight - viewH, camY));
  if(currentMap.pxWidth < viewW) camX = -(viewW - currentMap.pxWidth)/2;
  if(currentMap.pxHeight < viewH) camY = -(viewH - currentMap.pxHeight)/2;
  return {x:camX, y:camY};
}

/* ============================================================
   RENDER
   ============================================================ */
function drawTileLayer(layer, mapData){
  if(!layer) return;
  for(let row=0; row<mapData.height; row++){
    for(let col=0; col<mapData.width; col++){
      const gid = layer[row*mapData.width + col];
      if(!gid || gid >= DOOR_TILE_GID) continue;
      const idx = gid - 1;
      const sx = (idx % 16) * TILE;
      const sy = Math.floor(idx / 16) * TILE;
      ctx.drawImage(tilesetImg, sx, sy, TILE, TILE, col*TILE, row*TILE, TILE, TILE);
    }
  }
}

function drawDoorTiles(layer, mapData){
  if(!layer || !doorImg) return;
  const dw = doorImg.width, dh = doorImg.height;
  for(let row=0; row<mapData.height; row++){
    for(let col=0; col<mapData.width; col++){
      const gid = layer[row*mapData.width + col];
      if(gid < DOOR_TILE_GID) continue;
      const dx = col * TILE;
      const dy = (row+1) * TILE - dh;
      ctx.drawImage(doorImg, dx, dy, dw, dh);
    }
  }
}

function drawDoorPrompt(mapData){
  if(!nearDoor || !mapData.door) return;
  const d = mapData.door;
  const bounce = Math.sin(promptT * 6) * 1.6;
  const cx = d.x + d.width/2;
  const cy = d.y - 8 + bounce;

  ctx.save();
  ctx.translate(cx, cy);

  // rabinho do balão
  ctx.beginPath();
  ctx.moveTo(-3, 5);
  ctx.lineTo(0, 9);
  ctx.lineTo(3, 5);
  ctx.closePath();
  ctx.fillStyle = "rgba(10,12,18,0.85)";
  ctx.fill();

  // balão
  ctx.fillStyle = "rgba(10,12,18,0.85)";
  ctx.strokeStyle = "#e8c14c";
  ctx.lineWidth = 1;
  roundRect(-9, -9, 18, 14, 3);
  ctx.fill();
  ctx.stroke();

  // letra "E"
  ctx.fillStyle = "#e8c14c";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("E", 0, -2);

  ctx.restore();
}

function drawPlayer(){
  const anim = ANIMS[player.animState];
  const feetX = player.x + player.w/2;      // centro horizontal do hitbox
  const feetY = player.y + player.h;        // base do hitbox = chão

  // sombra no chão
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(feetX, feetY + 1, player.w/2, 2, 0, 0, Math.PI*2);
  ctx.fill();

  if(!anim.img){
    // fallback simples caso os spritesheets ainda não tenham carregado
    ctx.fillStyle = "#3fb6e0";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    return;
  }

  const sx = player.animFrame * SPRITE_W;

  ctx.save();
  ctx.translate(feetX, feetY - SPRITE_FEET_Y);
  ctx.scale(player.facing, 1);
  ctx.drawImage(anim.img, sx, 0, SPRITE_W, SPRITE_H, -SPRITE_W/2, 0, SPRITE_W, SPRITE_H);
  ctx.restore();
}

function drawArm(){
  if(!gunImg) return;
  const shoulder = getShoulderWorld();
  ctx.save();
  ctx.translate(shoulder.x, shoulder.y);
  ctx.scale(player.facing, 1);
  ctx.drawImage(gunImg, 0, 0, ARM_W, ARM_H, -ARM_PIVOT.x, -ARM_PIVOT.y, ARM_W, ARM_H);
  ctx.restore();
}

function drawBullets(){
  if(!bulletImg) return;
  for(const b of bullets){
    ctx.drawImage(bulletImg, b.x - BULLET_W/2, b.y - BULLET_H/2, BULLET_W, BULLET_H);
  }
}

function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function render(){
  ctx.fillStyle = "#050608";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const cam = getCamera();
  ctx.save();
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-cam.x, -cam.y);

  drawTileLayer(currentMap.background, currentMap);
  drawTileLayer(currentMap.platforms, currentMap);
  drawDoorTiles(currentMap.doorsTiles, currentMap);
  drawDoorPrompt(currentMap);
  drawPlayer();
  drawArm();
  drawBullets();

  ctx.restore();
}

/* ============================================================
   TELA DE ERRO (arquivos não encontrados / bloqueados por CORS)
   ============================================================ */
function showLoadError(err){
  console.error(err);
  ctx.fillStyle = "#0b0d12";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#e8c14c";
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  const lines = [
    "Navegadores bloqueiam fetch() ao abrir o arquivo direto (file://).",
    "Sirva a pasta com um servidor local, por exemplo:",
    "python -m http.server  →  http://localhost:8000"
  ];
  lines.forEach((line,i) => ctx.fillText(line, canvas.width/2, canvas.height/2 - 66 + i*20));
}

/* ============================================================
   LOOP PRINCIPAL
   ============================================================ */
let lastTime = 0;
function loop(t){
  const dt = Math.min(0.033, (t - lastTime) / 1000 || 0);
  lastTime = t;
  updatePlayer(dt);
  render();
  requestAnimationFrame(loop);
}

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
async function init(){
  try {
    const animKeys = Object.keys(ANIMS);
    const [[tileset, door, gun, bullet], , mapsRaw] = await Promise.all([
      Promise.all([loadImage(TILESET_SRC), loadImage(DOOR_SRC), loadImage(GUN_SRC), loadImage(BULLET_SRC)]),
      Promise.all(animKeys.map(async key => { ANIMS[key].img = await loadImage(ANIMS[key].src); })),
      loadAllMaps()
    ]);
    tilesetImg = tileset;
    doorImg = door;
    gunImg = gun;
    bulletImg = bullet;
    MAPS_RAW = mapsRaw;
  } catch(err){
    showLoadError(err);
    return;
  }
  currentMap = prepareMap(currentMapId);
  mapLabelEl.textContent = currentMapId;
  player.x = 40;
  player.y = 40;
  requestAnimationFrame(loop);
}

init();
})();