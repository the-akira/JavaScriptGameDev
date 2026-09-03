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
const ARM_ATTACH = { x: -3, y: 20 };

const BULLET_W = 4, BULLET_H = 4;
const BULLET_SPEED = 320;   // px/s
const BULLET_LIFETIME = 1.2; // segundos até desaparecer, mesmo sem colidir
const SHOOT_COOLDOWN = 0.18; // segundos entre disparos (jogador)

/* Inimigo "guard": mesma proporção de sprite do player (32x48,
   pés na mesma linha SPRITE_FEET_Y), patrulha e atira usando o
   mesmo sistema de braço/bala do jogador. */
const ENEMY_ANIMS = {
  idle: { src: "assets/enemy_idle.png", frames: 5, fps: 6,  img: null },
  run:  { src: "assets/enemy_run.png",  frames: 7, fps: 12, img: null }
};
const ENEMY_W = 12, ENEMY_H = 26; // mesma hitbox do player

const ENEMY_PHYS = {
  gravity: 900,
  maxFall: 500,
  patrolSpeed: 40   // px/s — mais lento que o player (moveSpeed: 95)
};

// --- parâmetros de IA, ajuste livre ---
const ENEMY_SIGHT_RANGE = 100;    // distância horizontal (px) para notar o jogador
const ENEMY_SIGHT_VERT  = 60;     // tolerância vertical (px): só "vê" se estiver +- nessa altura
const ENEMY_ALERT_RANGE_BONUS = 100; // histerese: some da vista só além de SIGHT_RANGE + isso
const ENEMY_SHOOT_COOLDOWN = 0.9; // segundos entre disparos do guarda

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

  // A porta fica num objectgroup próprio chamado "Doors" — as
  // propriedades Origin/Destiny estão no grupo, não no objeto.
  let door = null;
  const doorGroup = doc.querySelector('map > objectgroup[name="Doors"]');
  if(doorGroup){
    const groupProps = {};
    doorGroup.querySelectorAll("properties > property").forEach(p => {
      groupProps[p.getAttribute("name")] = p.getAttribute("value");
    });
    const objEl = doorGroup.querySelector("object");
    if(objEl){
      door = {
        origin: groupProps["Origin"],
        destiny: groupProps["Destiny"],
        x: parseFloat(objEl.getAttribute("x")),
        y: parseFloat(objEl.getAttribute("y")),
        width: parseFloat(objEl.getAttribute("width")),
        height: parseFloat(objEl.getAttribute("height")),
      };
    }
  }

  // Inimigos: objectgroup "Enemies", um object (point) por inimigo,
  // cada um com sua própria propriedade "Type" (ex.: "guard").
  const enemySpawns = [];
  const enemyGroup = doc.querySelector('map > objectgroup[name="Enemies"]');
  if(enemyGroup){
    enemyGroup.querySelectorAll("object").forEach(objEl => {
      const props = {};
      objEl.querySelectorAll("properties > property").forEach(p => {
        props[p.getAttribute("name")] = p.getAttribute("value");
      });
      enemySpawns.push({
        x: parseFloat(objEl.getAttribute("x")),
        y: parseFloat(objEl.getAttribute("y")),
        // normalizado em minúsculas: o map1 usa "guard" e o map2 "Guard"
        type: (props["Type"] || props["type"] || "").toLowerCase()
      });
    });
  }

  return { width, height, layers, door, enemySpawns };
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
let MAPS_RAW = null; // { map1: {width,height,layers,door,enemySpawns}, map2: {...} }

let currentMapId = "map1";
let currentMap = null;
let doorCooldown = 0;   // evita re-trigger imediato ao trocar de mapa
let nearDoor = false;   // usado pelo indicador visual
let promptT = 0;        // tempo acumulado p/ animação do indicador

let shootCooldown = 0;  // tempo restante até poder disparar de novo (jogador)
let bullets = [];       // {x,y,vx,vy,t,owner} — owner: "player" | "enemy"
let enemies = [];       // inimigos vivos do mapa atual

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
    door: raw.door,
    enemySpawns: raw.enemySpawns || []
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
  spawnEnemies(currentMap);
  doorCooldown = 0.5;
  nearDoor = false;
  bullets = []; // balas não atravessam a troca de mapa
}

/* ============================================================
   INIMIGOS (lidos da camada de objetos "Enemies" do .tmx)
   ============================================================ */
function makeEnemy(spawn){
  return {
    type: spawn.type,
    x: 0, y: 0,
    w: ENEMY_W, h: ENEMY_H,
    vx: 0, vy: 0,
    onGround: false,
    facing: 1,               // se corrige sozinho no 1º frame (ver updateEnemy)
    animState: "idle",
    animFrame: 0,
    animTimer: 0,
    state: "patrol",         // "patrol" | "alert"
    shootCooldown: 0
  };
}

function spawnEnemies(mapData){
  enemies = [];
  for(const spawn of mapData.enemySpawns){
    if(spawn.type !== "guard") continue; // outros tipos entram depois
    const e = makeEnemy(spawn);
    // O ponto do Tiled é só uma referência aproximada de onde o
    // level designer clicou — encostamos os pés no chão de
    // verdade abaixo dele, igual fazemos com o jogador na porta.
    const groundY = findGroundY(mapData, spawn.x, spawn.y);
    e.x = spawn.x - e.w/2;
    e.y = (groundY !== null) ? groundY - e.h : spawn.y - e.h;
    e.onGround = true;
    enemies.push(e);
  }
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
    fireBulletFrom(player, "player");
    shootCooldown = SHOOT_COOLDOWN;
  }

  updateAnimState(player, ANIMS, dt);
  promptT += dt;
}

/* ============================================================
   ARMA / TIRO (usado tanto pelo jogador quanto pelos inimigos)
   ============================================================ */
// Ponto do "ombro" no mundo, onde o braço é ancorado ao corpo —
// mesma referência usada tanto para desenhar o braço quanto para
// calcular de onde a bala nasce. Funciona para qualquer entidade
// (player ou inimigo) que tenha x,y,w,h,facing.
function getShoulderWorld(entity){
  const feetX = entity.x + entity.w/2;
  const feetY = entity.y + entity.h;
  const frameTopY = feetY - SPRITE_FEET_Y;
  return {
    x: feetX + entity.facing * ARM_ATTACH.x,
    y: frameTopY + ARM_ATTACH.y
  };
}

function fireBulletFrom(entity, owner){
  const shoulder = getShoulderWorld(entity);
  const mx = shoulder.x + entity.facing * MUZZLE_OFFSET.x;
  const my = shoulder.y + MUZZLE_OFFSET.y;
  bullets.push({
    x: mx, y: my,
    vx: entity.facing * BULLET_SPEED,
    vy: 0,
    t: 0,
    owner
  });
}

function hitsEntity(entity, x, y){
  return x > entity.x && x < entity.x + entity.w &&
         y > entity.y && y < entity.y + entity.h;
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

    if(!dead && b.owner === "player"){
      for(let j = enemies.length - 1; j >= 0; j--){
        if(hitsEntity(enemies[j], b.x, b.y)){
          enemies.splice(j, 1); // guarda morre com um tiro só, por enquanto
          dead = true;
          break;
        }
      }
    } else if(!dead && b.owner === "enemy"){
      if(hitsEntity(player, b.x, b.y)){
        dead = true; // TODO: aplicar dano quando houver sistema de vida
      }
    }

    if(dead) bullets.splice(i, 1);
  }
}

/* ============================================================
   ANIMAÇÃO (genérica — usada pelo player e pelos inimigos)
   ============================================================ */
function updateAnimState(entity, animsSet, dt){
  const moving = Math.abs(entity.vx) > 5;
  const nextState = (animsSet.jump && !entity.onGround) ? "jump" : (moving ? "run" : "idle");

  if(nextState !== entity.animState){
    entity.animState = nextState;
    entity.animFrame = 0;
    entity.animTimer = 0;
  }

  const anim = animsSet[entity.animState];
  const frameDur = 1 / anim.fps;
  entity.animTimer += dt;
  while(entity.animTimer >= frameDur){
    entity.animTimer -= frameDur;
    entity.animFrame = (entity.animFrame + 1) % anim.frames;
  }
}

/* ============================================================
   IA DO INIMIGO "guard": patrulha a plataforma sem cair, e se
   avistar o jogador dentro do alcance, para e atira nele.
   ============================================================ */
// Linha reta simplificada entre o centro do inimigo e o alvo —
// se algum ponto no caminho cair dentro de um tile sólido, não
// há linha de visão (ex.: jogador atrás de uma parede/plataforma).
function hasLineOfSight(enemy, target){
  const steps = 8;
  const ex = enemy.x + enemy.w/2, ey = enemy.y + enemy.h/2;
  const tx = target.x + target.w/2, ty = target.y + target.h/2;
  for(let i = 1; i < steps; i++){
    const t = i / steps;
    if(isSolid(currentMap, ex + (tx-ex)*t, ey + (ty-ey)*t)) return false;
  }
  return true;
}

function updateEnemy(enemy, dt){
  const dx = (player.x + player.w/2) - (enemy.x + enemy.w/2);
  const dy = (player.y + player.h/2) - (enemy.y + enemy.h/2);
  const sameLevel = Math.abs(dy) <= ENEMY_SIGHT_VERT;
  // histerese: já alerta, só solta o jogador se ele se afastar bem mais
  const range = enemy.state === "alert" ? ENEMY_SIGHT_RANGE + ENEMY_ALERT_RANGE_BONUS : ENEMY_SIGHT_RANGE;
  const canSee = sameLevel && Math.abs(dx) <= range && hasLineOfSight(enemy, player);

  enemy.state = canSee ? "alert" : "patrol";

  if(enemy.state === "alert"){
    enemy.vx = 0;
    enemy.facing = dx >= 0 ? 1 : -1;
    if(enemy.shootCooldown > 0) enemy.shootCooldown -= dt;
    if(enemy.shootCooldown <= 0){
      fireBulletFrom(enemy, "enemy");
      enemy.shootCooldown = ENEMY_SHOOT_COOLDOWN;
    }
  } else {
    enemy.shootCooldown = 0; // sai pronto pra atirar assim que reavistar
    enemy.vx = enemy.facing * ENEMY_PHYS.patrolSpeed;

    // olha um passo à frente, na direção que está andando: se tiver
    // parede ou não tiver chão, vira antes de sair andando pro nada.
    const dir = enemy.facing;
    const aheadX = dir > 0 ? enemy.x + enemy.w + 1 : enemy.x - 1;
    const top = enemy.y + 1, bottom = enemy.y + enemy.h - 1;
    const wallAhead = isSolid(currentMap, aheadX, top) || isSolid(currentMap, aheadX, bottom);
    const groundAhead = isSolid(currentMap, aheadX, enemy.y + enemy.h + 1);

    if(wallAhead || !groundAhead){
      enemy.facing *= -1;
      enemy.vx = 0;
    }
  }

  enemy.vy += ENEMY_PHYS.gravity * dt;
  if(enemy.vy > ENEMY_PHYS.maxFall) enemy.vy = ENEMY_PHYS.maxFall;

  // --- resolve X (mesma lógica de colisão do player) ---
  let newX = enemy.x + enemy.vx * dt;
  if(enemy.vx !== 0){
    const dir = enemy.vx > 0 ? 1 : -1;
    const edgeX = dir > 0 ? newX + enemy.w : newX;
    const top = enemy.y + 1, bottom = enemy.y + enemy.h - 1;
    if(isSolid(currentMap, edgeX, top) || isSolid(currentMap, edgeX, bottom)){
      const col = Math.floor(edgeX / TILE);
      newX = dir > 0 ? (col * TILE) - enemy.w : (col + 1) * TILE;
      enemy.vx = 0;
      enemy.facing *= -1; // bateu de frente numa parede: vira
    }
  }
  newX = Math.max(0, Math.min(currentMap.pxWidth - enemy.w, newX));
  enemy.x = newX;

  // --- resolve Y ---
  let newY = enemy.y + enemy.vy * dt;
  enemy.onGround = false;
  if(enemy.vy !== 0){
    const dir = enemy.vy > 0 ? 1 : -1;
    const edgeY = dir > 0 ? newY + enemy.h : newY;
    const left = enemy.x + 1, right = enemy.x + enemy.w - 1;
    if(isSolid(currentMap, left, edgeY) || isSolid(currentMap, right, edgeY)){
      const row = Math.floor(edgeY / TILE);
      if(dir > 0){
        newY = (row * TILE) - enemy.h;
        enemy.onGround = true;
      } else {
        newY = (row + 1) * TILE;
      }
      enemy.vy = 0;
    }
  }
  newY = Math.max(0, Math.min(currentMap.pxHeight - enemy.h, newY));
  enemy.y = newY;

  updateAnimState(enemy, ENEMY_ANIMS, dt);
}

function updateEnemies(dt){
  for(const enemy of enemies) updateEnemy(enemy, dt);
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
  return {x: Math.round(camX), y: Math.round(camY)};
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
  ctx.fillText("E", 0, -1);

  ctx.restore();
}

function drawCharacter(entity, animsSet){
  const anim = animsSet[entity.animState];
  const feetX = entity.x + entity.w/2;      // centro horizontal do hitbox
  const feetY = entity.y + entity.h;        // base do hitbox = chão

  // sombra no chão
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(feetX, feetY + 1, entity.w/2, 2, 0, 0, Math.PI*2);
  ctx.fill();

  if(!anim.img){
    // fallback simples caso os spritesheets ainda não tenham carregado
    ctx.fillStyle = "#3fb6e0";
    ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
    return;
  }

  const sx = entity.animFrame * SPRITE_W;

  ctx.save();
  ctx.translate(feetX, feetY - SPRITE_FEET_Y);
  ctx.scale(entity.facing, 1);
  ctx.drawImage(anim.img, sx, 0, SPRITE_W, SPRITE_H, -SPRITE_W/2, 0, SPRITE_W, SPRITE_H);
  ctx.restore();
}

function drawArm(entity){
  if(!gunImg) return;
  const shoulder = getShoulderWorld(entity);
  ctx.save();
  ctx.translate(shoulder.x, shoulder.y);
  ctx.scale(entity.facing, 1);
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

  for(const enemy of enemies){
    drawCharacter(enemy, ENEMY_ANIMS);
    drawArm(enemy);
  }

  drawCharacter(player, ANIMS);
  drawArm(player);
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
  updateEnemies(dt);
  updateBullets(dt);
  render();
  requestAnimationFrame(loop);
}

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
async function init(){
  try {
    const animKeys = Object.keys(ANIMS);
    const enemyAnimKeys = Object.keys(ENEMY_ANIMS);
    const [[tileset, door, gun, bullet], , , mapsRaw] = await Promise.all([
      Promise.all([loadImage(TILESET_SRC), loadImage(DOOR_SRC), loadImage(GUN_SRC), loadImage(BULLET_SRC)]),
      Promise.all(animKeys.map(async key => { ANIMS[key].img = await loadImage(ANIMS[key].src); })),
      Promise.all(enemyAnimKeys.map(async key => { ENEMY_ANIMS[key].img = await loadImage(ENEMY_ANIMS[key].src); })),
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
  spawnEnemies(currentMap);
  requestAnimationFrame(loop);
}

init();
})();