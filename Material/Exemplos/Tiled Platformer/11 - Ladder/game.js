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
  idle:      { src: "assets/player_idle.png",       frames: 5, fps: 6,  img: null },
  run:       { src: "assets/player_run.png",        frames: 7, fps: 12, img: null },
  jump:      { src: "assets/player_jump.png",       frames: 3, fps: 10, img: null },
  climbIdle: { src: "assets/player_climb_idle.png", frames: 1, fps: 1,  img: null },
  climb:     { src: "assets/player_climb.png",      frames: 8, fps: 10, img: null }
};

/* --- escadas (layer "Ladder", tileset "ladder" no .tmx) --- */
const LADDER_SRC = "assets/ladder.png";
const CLIMB_SPEED = 60;           // px/s subindo/descendo na escada
const CLIMB_REGRAB_DELAY = 0.25;  // s sem poder regarrar a escada logo após pular fora dela
const LADDER_EXIT_SNAP_TOLERANCE = 10; // px de tolerância: se o chão/plataforma estiver
                                         // até essa distância abaixo OU ACIMA dos pés ao
                                         // soltar da escada, já planta o jogador em cima
                                         // na hora (cobre também "quase no fim", não só
                                         // o exato último degrau)

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
const SHOOT_COOLDOWN = 0.33; // segundos entre disparos (jogador)

/* --- vida / dano --- */
const PLAYER_MAX_HP = 100;
const PLAYER_HIT_DAMAGE = 10;   // dano por bala inimiga
const PLAYER_INVULN_TIME = 0.6; // segundos de invencibilidade após tomar dano
const ENEMY_MAX_HP = 30;
const ENEMY_HIT_DAMAGE = 10;    // dano por bala do jogador (3 tiros mata)

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
const ENEMY_MIN_SHOT_DX = ARM_ATTACH.x + MUZZLE_OFFSET.x + ENEMY_W/2 + 8;
// distância horizontal mínima (px) até o jogador pra valer a pena atirar.
// O cano nasce a ARM_ATTACH.x + MUZZLE_OFFSET.x px à frente do inimigo;
// se o jogador estiver mais perto que isso (ex.: "grudado"/em cima dele),
// a bala já nasce depois do alvo e nunca cruza a hitbox dele — por isso
// somamos meia largura do personagem + uma margem de segurança.
const ENEMY_RETREAT_SPEED = 70;   // velocidade ao recuar tentando alinhar o tiro
const ENEMY_SHOOT_COOLDOWN = 0.9; // segundos entre disparos do guarda
const ENEMY_SHOT_DX_HYSTERESIS = 14; // px de "zona morta" ao redor de ENEMY_MIN_SHOT_DX
// evita que o inimigo fique alternando entre "para e atira" e "recua" (e,
// junto disso, entre encarar o jogador e virar de costas) quando o jogador
// se aproxima devagar e o dx fica raspando bem em cima do limiar — mesma
// ideia da histerese já usada em ENEMY_ALERT_RANGE_BONUS, mas aplicada aqui.

/* --- caixas destrutíveis (lidas da camada de objetos "Objects") ---
   id relativo (gid - firstgid do tileset "crates" no .tmx) -> definição.
   "hp" é quantos tiros do jogador a caixa aguenta antes de quebrar. */
const CRATE_DEFS = {
  0: { src: "assets/crates/blue_crate.png",        hp: 2, img: null }, // blue_crate  24x24
  1: { src: "assets/crates/blue_small_crate.png",  hp: 1, img: null }, // blue_small  16x16
  2: { src: "assets/crates/green_crate.png",       hp: 2, img: null }, // green_crate 24x24
  3: { src: "assets/crates/green_small_crate.png", hp: 1, img: null }, // green_small 16x16
  4: { src: "assets/crates/grey_crate.png",        hp: 2, img: null }, // grey_crate  24x24
  5: { src: "assets/crates/grey_small_crate.png",  hp: 1, img: null }, // grey_small  16x16
  6: { src: "assets/crates/red_crate.png",         hp: 2, img: null }, // red_crate   24x24
  7: { src: "assets/crates/red_small_crate.png",   hp: 1, img: null }  // red_small   16x16
};
const CRATE_HIT_FLASH_TIME = 0.08; // segundos de "flash" branco ao levar tiro

/* --- loot dropado por caixas (propriedade "Loot" do objeto no Tiled) --- */
const LOOT_DEFS = {
  life: { src: "assets/life.png", w: 12, h: 12, heal: 30, img: null }
};
const LOOT_BOB_AMPLITUDE = 2; // px de oscilação vertical do item já no chão
const LOOT_BOB_SPEED = 4;     // rad/s

/* --- plataformas "vai-e-volta" (lidas do objectgroup "Platforms",
   DIFERENTE da layer de tiles de mesmo nome que é o chão sólido normal) ---
   id relativo (gid - firstgid do tileset "platforms") -> sprite. Só define
   a imagem: tamanho e posição vêm do próprio objeto no .tmx. */
const PLATFORM_DEFS = {
  0: { src: "assets/platforms/0.png", img: null }, // 48x16
  1: { src: "assets/platforms/1.png", img: null }, // 48x16
  2: { src: "assets/platforms/2.png", img: null }, // 48x16
  3: { src: "assets/platforms/3.png", img: null }, // 24x16
  4: { src: "assets/platforms/4.png", img: null }, // 24x16
  7: { src: "assets/platforms/5.png", img: null }, // 16x16
  8: { src: "assets/platforms/6.png", img: null }  // 16x16
};
// plataformas sem a propriedade "Type" são estáticas (só o efeito
// one-way já as torna interessantes); "elevator" (vai-e-volta vertical),
// "horizontal" (vai-e-volta horizontal) e "circular" abaixo são os
// tipos com movimento.
const PLATFORM_ELEVATOR_SPEED = 40;    // px/s — default; sobrescrito pela propriedade "Speed" no objeto do mapa, se houver
const PLATFORM_ELEVATOR_PAUSE = 0.6;   // segundos — default; sobrescrito pela propriedade "Pause" no objeto do mapa, se houver
const PLATFORM_CIRCULAR_RADIUS = 40;   // px — default; sobrescrito pela propriedade "Radius" no objeto do mapa, se houver
const PLATFORM_CIRCULAR_PERIOD = 4;    // segundos — default; sobrescrito pela propriedade "Period" no objeto do mapa, se houver
const PLATFORM_DROP_TIME = 0.25;       // segundos que o jogador ignora plataformas one-way após pedir pra cair (Shift+Baixo)

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

  // Tileset "crates": precisamos do firstgid para calcular, a partir
  // do gid gravado em cada objeto, qual caixa é (índice em CRATE_DEFS).
  // Idem para "platforms" (plataformas one-way), mais abaixo.
  let crateFirstGid = null;
  let platformFirstGid = null;
  doc.querySelectorAll("map > tileset").forEach(tsEl => {
    if(tsEl.getAttribute("name") === "crates") crateFirstGid = parseInt(tsEl.getAttribute("firstgid"), 10);
    if(tsEl.getAttribute("name") === "platforms") platformFirstGid = parseInt(tsEl.getAttribute("firstgid"), 10);
  });

  // Caixas: objectgroup "Objects", um tile-object por caixa. O Tiled
  // ancora tile-objects no canto INFERIOR-esquerdo, então o "y" do
  // arquivo é a base da caixa — convertemos para o topo aqui, que é
  // o que o resto do jogo espera (igual x/y de tile normal).
  const crateSpawns = [];
  const objectsGroup = doc.querySelector('map > objectgroup[name="Objects"]');
  if(objectsGroup && crateFirstGid !== null){
    objectsGroup.querySelectorAll("object").forEach(objEl => {
      const gid = objEl.hasAttribute("gid") ? parseInt(objEl.getAttribute("gid"), 10) : 0;
      if(!gid) return;
      const localId = gid - crateFirstGid;
      if(!CRATE_DEFS[localId]) return; // gid de outro tileset (ex.: porta) — ignora
      const props = {};
      objEl.querySelectorAll("properties > property").forEach(p => {
        props[p.getAttribute("name")] = p.getAttribute("value");
      });
      const w = parseFloat(objEl.getAttribute("width"));
      const h = parseFloat(objEl.getAttribute("height"));
      crateSpawns.push({
        localId,
        x: parseFloat(objEl.getAttribute("x")),
        y: parseFloat(objEl.getAttribute("y")) - h, // base -> topo
        w, h,
        loot: props["Loot"] || null
      });
    });
  }

  // Plataformas one-way: objectgroup "Platforms" — nome
  // igual ao da layer de TILES (o chão sólido normal), mas são coisas
  // diferentes: um é <layer> (chão sólido), outro é <objectgroup>
  // (plataformas atravessáveis por baixo/pelas laterais). O querySelector
  // abaixo só pega objectgroup, então não há ambiguidade.
  //
  // Dentro dele tem dois tipos de <object>:
  //  - com "gid": é a plataforma de verdade (tile-object, ancorado no
  //    canto INFERIOR-esquerdo pelo Tiled — convertemos p/ topo, igual
  //    já fazemos com as caixas).
  //  - sem "gid": é um marcador retangular (ancorado no canto SUPERIOR-
  //    esquerdo, sem conversão) com a propriedade "floor" (parada de
  //    elevador, vertical) ou "stop" (parada de plataforma horizontal)
  //    — usado só pra marcar onde a plataforma deve parar, não é desenhado.
  const platformSpawns = [];
  const platformStops = [];   // marcadores "floor" — paradas verticais (elevator)
  const platformStopsH = [];  // marcadores "stop" — paradas horizontais (horizontal)
  const platformsGroup = doc.querySelector('map > objectgroup[name="Platforms"]');
  if(platformsGroup && platformFirstGid !== null){
    platformsGroup.querySelectorAll("object").forEach(objEl => {
      const w = parseFloat(objEl.getAttribute("width"));
      const h = parseFloat(objEl.getAttribute("height"));
      const attrX = parseFloat(objEl.getAttribute("x"));
      const attrY = parseFloat(objEl.getAttribute("y"));
      const props = {};
      objEl.querySelectorAll("properties > property").forEach(p => {
        props[p.getAttribute("name")] = p.getAttribute("value");
      });

      if(objEl.hasAttribute("gid")){
        const gid = parseInt(objEl.getAttribute("gid"), 10);
        const localId = gid - platformFirstGid;
        if(!PLATFORM_DEFS[localId]) return; // gid de outro tileset — ignora
        platformSpawns.push({
          localId,
          x: attrX, y: attrY - h, // base -> topo
          w, h,
          kind: (props["Type"] || "static").toLowerCase(), // "elevator" | "horizontal" | "circular" | "static"
          // Overrides por objeto (undefined -> usa os defaults PLATFORM_*
          // lá em cima, em spawnPlatforms). Números aceitam vírgula ou
          // ponto decimal (Tiled só permite ponto, mas por segurança).
          speed: props["Speed"] !== undefined ? parseFloat(props["Speed"].replace(",", ".")) : undefined,
          pause: props["Pause"] !== undefined ? parseFloat(props["Pause"].replace(",", ".")) : undefined,
          radius: props["Radius"] !== undefined ? parseFloat(props["Radius"].replace(",", ".")) : undefined,
          period: props["Period"] !== undefined ? parseFloat(props["Period"].replace(",", ".")) : undefined
        });
      } else {
        const floor = props["floor"] !== undefined ? parseFloat(props["floor"]) : null;
        const stop = props["stop"] !== undefined ? parseFloat(props["stop"]) : null;
        if(floor !== null){
          platformStops.push({ x: attrX, y: attrY, w, h, floor });
        } else if(stop !== null){
          platformStopsH.push({ x: attrX, y: attrY, w, h, stop });
        }
        // else: marcador sem nenhuma propriedade esperada — ignora
      }
    });
  }
  // Associa cada elevador aos marcadores "floor" que ficam na mesma
  // coluna dele (mesma faixa horizontal), ordenados pela propriedade
  // "floor". Idem para plataforma "horizontal" com marcadores "stop",
  // só que casados pela mesma LINHA (faixa vertical) em vez de coluna,
  // já que eles ficam lado a lado na horizontal, não empilhados.
  // A própria posição onde a plataforma foi desenhada no editor também
  // conta como parada — é de onde ela nasce no jogo.
  platformSpawns.forEach(p => {
    if(p.kind === "elevator"){
      const myStopsY = platformStops
        .filter(s => (s.x + s.w/2) > p.x && (s.x + s.w/2) < p.x + p.w)
        .sort((a,b) => a.floor - b.floor)
        .map(s => s.y);
      p.stops = [...new Set([p.y, ...myStopsY])].sort((a,b) => a - b);
    } else if(p.kind === "horizontal"){
      const myStopsX = platformStopsH
        .filter(s => (s.y + s.h/2) > p.y && (s.y + s.h/2) < p.y + p.h)
        .sort((a,b) => a.stop - b.stop)
        .map(s => s.x);
      p.stops = [...new Set([p.x, ...myStopsX])].sort((a,b) => a - b);
    }
  });

  return { width, height, layers, door, enemySpawns, crateSpawns, platformSpawns };
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
const fadeEl = document.getElementById('fade');

const keys = {};
let interactRequested = false;
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if(e.code === INTERACT_KEY) interactRequested = true;
  if(["ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

let tilesetImg = null;
let doorImg = null;
let gunImg = null;
let bulletImg = null;
let ladderImg = null;
let MAPS_RAW = null; // { map1: {width,height,layers,door,enemySpawns}, map2: {...} }

let currentMapId = "map1";
let currentMap = null;
let doorCooldown = 0;   // evita re-trigger imediato ao trocar de mapa
let nearDoor = false;   // usado pelo indicador visual

// --- transição de mapa (fade in/out) ---
const MAP_FADE_TIME = 0.28; // segundos de cada metade (ida/volta)
let transitioning = false;
let transitionPhase = null; // "out" | "in"
let transitionTimer = 0;
let pendingDestiny = null;
let promptT = 0;        // tempo acumulado p/ animação do indicador

let shootCooldown = 0;  // tempo restante até poder disparar de novo (jogador)
let bullets = [];       // {x,y,vx,vy,t,owner} — owner: "player" | "enemy"
let enemies = [];       // inimigos vivos do mapa atual
let crates = [];        // caixas vivas do mapa atual
let loots = [];         // itens dropados, caindo ou já no chão
let livePlatforms = []; // plataformas one-way vivas do mapa atual (estática/elevador/circular)

const player = {
  x: 0, y: 0,
  w: 12, h: 26,   // hitbox de colisão (menor que o sprite, ajustada ao contorno do personagem)
  vx: 0, vy: 0,
  onGround: false,
  facing: 1,
  animState: "idle",
  animFrame: 0,
  animTimer: 0,
  coyoteTimer: 0,   // tempo restante em que ainda é possível pular após sair do chão
  hp: PLAYER_MAX_HP,
  maxHp: PLAYER_MAX_HP,
  invulnT: 0,        // tempo restante de invencibilidade após tomar dano
  ridingPlatform: null,  // plataforma one-way em que está em cima agora (ver resolveOneWayY)
  dropThroughTimer: 0,   // > 0 enquanto ignora plataformas one-way (Shift+Baixo pra cair)
  climbing: false,        // true enquanto preso/escalando uma escada
  ladderRegrabTimer: 0,   // > 0 logo após pular fora da escada, evita regarrar na hora
  ladderExitPlatform: null // plataforma one-way sendo "atravessada pra baixo" ao entrar numa escada logo abaixo dela
};
let gameOver = false;
let gameStarted = false;

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
   PREPARAÇÃO DE UM MAPA
   ============================================================ */
function getLayer(mapData, ...names){
  for(const n of names){
    if(mapData.layers[n]) return mapData.layers[n];
  }
  return null;
}

function prepareMap(id){
  const raw = MAPS_RAW[id];
  const platforms = getLayer(raw, "Platforms");
  const background = getLayer(raw, "Background");
  const doorsTiles = getLayer(raw, "Doors");
  const ladder = getLayer(raw, "Ladder");
  return {
    id,
    width: raw.width,
    height: raw.height,
    pxWidth: raw.width * TILE,
    pxHeight: raw.height * TILE,
    background,
    platforms,
    doorsTiles,
    ladder,
    door: raw.door,
    enemySpawns: raw.enemySpawns || [],
    crateSpawns: raw.crateSpawns || [],
    platformSpawns: raw.platformSpawns || []
  };
}

function tileAt(layer, mapData, col, row){
  if(col < 0 || row < 0 || col >= mapData.width || row >= mapData.height) return 0;
  return layer[row * mapData.width + col];
}

function isSolidTile(mapData, worldX, worldY){
  const col = Math.floor(worldX / TILE);
  const row = Math.floor(worldY / TILE);
  return tileAt(mapData.platforms, mapData, col, row) !== 0;
}

// Retorna o índice da coluna se algum tile da layer "Ladder" cobrir a
// faixa vertical [topY, bottomY] na coluna de worldX — senão, null.
function ladderColumnAt(mapData, worldX, topY, bottomY){
  if(!mapData.ladder) return null;
  const col = Math.floor(worldX / TILE);
  const rowTop = Math.floor(topY / TILE);
  const rowBottom = Math.floor(bottomY / TILE);
  for(let row = rowTop; row <= rowBottom; row++){
    if(tileAt(mapData.ladder, mapData, col, row) !== 0) return col;
  }
  return null;
}

// Retorna a caixa viva (se houver) que contém o ponto do mundo dado.
function crateAt(worldX, worldY){
  for(const c of crates){
    if(worldX >= c.x && worldX < c.x + c.w && worldY >= c.y && worldY < c.y + c.h) return c;
  }
  return null;
}

// Checagem "por ponto" usada em lugares aproximados (IA, linha de
// visão, indicadores de chão/parede à frente) — conta tile sólido
// OU caixa viva. Para a resolução fina de colisão do player/inimigos
// (que precisa parar exatamente na borda da caixa, mesmo quando ela
// não está alinhada à grade de tiles), ver resolveCratesX/Y abaixo.
function isSolid(mapData, worldX, worldY){
  return isSolidTile(mapData, worldX, worldY) || !!crateAt(worldX, worldY);
}

/* ============================================================
   SPAWN DO JOGADOR EM UMA PORTA (ao trocar de mapa)
   ============================================================ */
// Varre para baixo, a partir de startY, na coluna sob centerX,
// até achar o primeiro tile sólido — retorna o Y do topo dele.
function findGroundY(mapData, centerX, startY){
  const col = Math.floor(centerX / TILE);
  let row = Math.max(0, Math.floor(startY / TILE));
  let tileGroundY = null;
  while(row < mapData.height){
    if(tileAt(mapData.platforms, mapData, col, row) !== 0){ tileGroundY = row * TILE; break; }
    row++;
  }
  // Além do chão sólido da camada de tiles, uma plataforma-objeto
  // (estática/elevador/circular/horizontal) também é um "chão" válido
  // pra encostar os pés — sem isso, posicionar um inimigo (ou o
  // jogador, via porta) em cima de uma dessas plataformas no editor
  // não funcionava: a busca simplesmente ignorava a plataforma e
  // descia até o próximo tile sólido, bem mais embaixo.
  // Usamos a posição de nascimento de cada plataforma (spawn.y) — é
  // onde ela está quando o mapa carrega, então é a referência certa
  // pra encostar alguém nela no frame inicial.
  let best = tileGroundY;
  for(const p of mapData.platformSpawns){
    if(centerX < p.x || centerX > p.x + p.w) continue; // fora da largura dela
    if(p.y < startY) continue; // está acima do ponto de partida, não serve de chão aqui
    if(best === null || p.y < best) best = p.y;
  }
  return best;
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
  player.invulnT = 0;
}

function goToMap(destinyId){
  currentMap = prepareMap(destinyId);
  currentMapId = destinyId;
  mapLabelEl.textContent = destinyId;
  spawnAtDoor(currentMap);
  spawnEnemies(currentMap);
  spawnCrates(currentMap);
  spawnPlatforms(currentMap);
  doorCooldown = 0.5;
  nearDoor = false;
  bullets = []; // balas não atravessam a troca de mapa
  loots = [];   // nem itens dropados
}

// Inicia a transição visual: escurece a tela, troca o mapa quando
// estiver totalmente preta, e depois clareia de volta. O jogo fica
// "congelado" (sem update de player/inimigos/balas) durante todo o
// processo — ver loop().
function startMapTransition(destinyId){
  if(transitioning) return; // já trocando, ignora novo trigger
  transitioning = true;
  transitionPhase = "out";
  transitionTimer = 0;
  pendingDestiny = destinyId;
}

function updateMapTransition(dt){
  transitionTimer += dt;
  const t = Math.min(1, transitionTimer / MAP_FADE_TIME);

  if(transitionPhase === "out"){
    fadeEl.style.opacity = String(t);
    if(t >= 1){
      goToMap(pendingDestiny);
      transitionPhase = "in";
      transitionTimer = 0;
    }
  } else if(transitionPhase === "in"){
    fadeEl.style.opacity = String(1 - t);
    if(t >= 1){
      fadeEl.style.opacity = "0";
      transitioning = false;
      transitionPhase = null;
      pendingDestiny = null;
    }
  }
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
    shootCooldown: 0,
    retreatDir: 0,            // 0 = não está recuando; -1/1 = direção comprometida (ver updateEnemy)
    farEnough: true,          // último resultado do teste de distância p/ atirar (histerese, ver updateEnemy)
    hp: ENEMY_MAX_HP,
    maxHp: ENEMY_MAX_HP,
    ridingPlatform: null      // plataforma one-way em que está em cima agora (ver resolveOneWayY)
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
   CAIXAS DESTRUTÍVEIS (lidas da camada de objetos "Objects")
   ============================================================ */
function spawnCrates(mapData){
  crates = [];
  for(const spawn of mapData.crateSpawns){
    const def = CRATE_DEFS[spawn.localId];
    if(!def) continue;
    crates.push({
      x: spawn.x, y: spawn.y, w: spawn.w, h: spawn.h,
      hp: def.hp, maxHp: def.hp,
      def,
      loot: spawn.loot,   // ex.: "life", ou null
      hitFlash: 0         // flash branco ao levar tiro (só visual)
    });
  }
}

// Chamado quando uma bala do jogador acerta uma caixa. Se o HP zerar,
// a caixa é destruída e, se tiver a propriedade Loot, dropa o item.
function damageCrate(crate){
  crate.hp -= 1;
  crate.hitFlash = CRATE_HIT_FLASH_TIME;
  if(crate.hp <= 0){
    if(crate.loot) spawnLoot(crate.loot, crate.x + crate.w/2, crate.y + crate.h/2);
    const idx = crates.indexOf(crate);
    if(idx !== -1) crates.splice(idx, 1);
  }
}

function updateCrates(dt){
  for(const c of crates){
    if(c.hitFlash > 0) c.hitFlash = Math.max(0, c.hitFlash - dt);
  }
}

/* ============================================================
   LOOT (itens dropados por caixas destruídas)
   ============================================================ */
function spawnLoot(type, centerX, centerY){
  const def = LOOT_DEFS[type];
  if(!def) return; // tipo de loot desconhecido: ignora silenciosamente
  loots.push({
    type, def,
    x: centerX - def.w/2, y: centerY - def.h/2,
    w: def.w, h: def.h,
    vy: 0,
    bobT: Math.random() * Math.PI * 2 // dessincroniza a oscilação entre itens
  });
}

function rectsOverlap(a, b){
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function applyLoot(type){
  if(type === "life"){
    player.hp = Math.min(player.maxHp, player.hp + LOOT_DEFS.life.heal);
  }
}

// Itens caem com a mesma gravidade do jogo, pousam sobre tiles ou
// caixas, e são coletados por overlap simples com o jogador (mesmo
// ainda caindo).
function updateLoots(dt){
  for(let i = loots.length - 1; i >= 0; i--){
    const l = loots[i];

    if(rectsOverlap(l, player)){
      applyLoot(l.type);
      loots.splice(i, 1);
      continue;
    }

    l.vy += PHYS.gravity * dt;
    if(l.vy > PHYS.maxFall) l.vy = PHYS.maxFall;

    let newY = l.y + l.vy * dt;
    const midX = l.x + l.w/2;
    const bottom = newY + l.h;
    if(isSolidTile(currentMap, midX, bottom) || crateAt(midX, bottom)){
      const row = Math.floor(bottom / TILE);
      newY = row * TILE - l.h;
      l.vy = 0;
    }
    l.y = Math.max(0, Math.min(currentMap.pxHeight - l.h, newY));
    l.bobT += dt * LOOT_BOB_SPEED;
  }
}

// Reinicia a partida sem recarregar a página: volta pro mapa inicial,
// restaura o jogador e os inimigos do zero, e limpa qualquer estado
// de transição/game over pendente. Os assets (imagens, .tmx) já
// carregados em init() são reaproveitados.
function resetGame(){
  currentMapId = "map1";
  currentMap = prepareMap(currentMapId);
  mapLabelEl.textContent = currentMapId;

  player.x = 40;
  player.y = 40;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.facing = 1;
  player.animState = "idle";
  player.animFrame = 0;
  player.animTimer = 0;
  player.coyoteTimer = 0;
  player.hp = PLAYER_MAX_HP;
  player.invulnT = 0;
  player.ridingPlatform = null;
  player.dropThroughTimer = 0;
  player.climbing = false;
  player.ladderRegrabTimer = 0;

  spawnEnemies(currentMap);
  spawnCrates(currentMap);
  spawnPlatforms(currentMap);
  bullets = [];
  loots = [];
  shootCooldown = 0;

  doorCooldown = 0;
  nearDoor = false;

  transitioning = false;
  transitionPhase = null;
  transitionTimer = 0;
  pendingDestiny = null;
  fadeEl.style.opacity = "0";

  gameOver = false;
}

/* ============================================================
   FÍSICA / COLISÃO (eixo X e Y resolvidos separadamente)
   ============================================================ */
// Colisão do player/inimigos contra tiles é resolvida "encaixando" na
// grade (TILE em TILE), o que é perfeito pra tiles mas quebraria em
// caixas que não são múltiplas de TILE (ex.: caixa 24x24 numa grade
// de 16px). Por isso caixas usam resolução de retângulo cheio,
// aplicada depois da resolução de tiles, parando exatamente na borda
// real da caixa (crate.x/crate.w), não na borda do tile mais próximo.
function resolveCratesX(entity, newX){
  const top = entity.y, bottom = entity.y + entity.h;
  for(const c of crates){
    if(bottom <= c.y || top >= c.y + c.h) continue;       // sem overlap vertical
    const left = newX, right = newX + entity.w;
    if(right <= c.x || left >= c.x + c.w) continue;        // sem overlap horizontal
    if(entity.vx > 0) newX = c.x - entity.w;
    else if(entity.vx < 0) newX = c.x + c.w;
    entity.vx = 0;
  }
  return newX;
}

function resolveCratesY(entity, newY){
  const left = entity.x, right = entity.x + entity.w;
  for(const c of crates){
    if(right <= c.x || left >= c.x + c.w) continue;        // sem overlap horizontal
    const top = newY, bottom = newY + entity.h;
    if(bottom <= c.y || top >= c.y + c.h) continue;         // sem overlap vertical
    if(entity.vy > 0){
      newY = c.y - entity.h;
      entity.onGround = true; // pode ficar em pé sobre a caixa
    } else if(entity.vy < 0){
      newY = c.y + c.h;
    }
    entity.vy = 0;
  }
  return newY;
}

/* ============================================================
   PLATAFORMAS ONE-WAY (lidas do objectgroup "Platforms" —
   estáticas, elevador ou circular)
   ============================================================ */
function spawnPlatforms(mapData){
  livePlatforms = [];
  for(const spawn of mapData.platformSpawns){
    const def = PLATFORM_DEFS[spawn.localId];
    if(!def) continue;
    const plat = {
      x: spawn.x, y: spawn.y, w: spawn.w, h: spawn.h,
      def, kind: spawn.kind,
      dx: 0, dy: 0 // deslocamento neste frame — usado p/ "carregar" quem está em cima
    };
    if(spawn.kind === "elevator" || spawn.kind === "horizontal"){
      // "elevator" vai-e-volta no eixo Y, "horizontal" no eixo X — fora
      // esse eixo, é a mesma lógica de paradas/velocidade/pausa (ver
      // updatePlatforms), então só guardamos qual propriedade usar.
      plat.axis = spawn.kind === "horizontal" ? "x" : "y";
      // "Speed"/"Pause" no objeto do mapa sobrescrevem os defaults;
      // isNaN cobre valor ausente (undefined) ou mal-formado no Tiled.
      plat.speed = !isNaN(spawn.speed) ? spawn.speed : PLATFORM_ELEVATOR_SPEED;
      plat.pause = !isNaN(spawn.pause) ? spawn.pause : PLATFORM_ELEVATOR_PAUSE;
      const startPos = spawn[plat.axis];
      plat.stops = (spawn.stops && spawn.stops.length > 1) ? spawn.stops : [startPos];
      plat.stopIndex = Math.max(0, plat.stops.indexOf(startPos));
      plat.dir = 1;    // sentido (índice na lista de paradas) do próximo destino
      plat.pauseT = 0; // tempo restante parado na parada atual
    } else if(spawn.kind === "circular"){
      // "Radius"/"Period" no objeto do mapa sobrescrevem os defaults.
      plat.radius = !isNaN(spawn.radius) ? spawn.radius : PLATFORM_CIRCULAR_RADIUS;
      plat.period = !isNaN(spawn.period) ? spawn.period : PLATFORM_CIRCULAR_PERIOD;
      // o ponto desenhado no editor é a base (ponto mais baixo) do
      // círculo: o centro fica acima dele, à distância do raio (agora
      // por-plataforma, plat.radius, em vez da constante fixa).
      plat.centerX = spawn.x + spawn.w/2;
      plat.centerY = spawn.y + spawn.h/2 - plat.radius;
      plat.angle = Math.PI / 2; // começa embaixo do centro (posição desenhada no editor)
    }
    livePlatforms.push(plat);
  }
}

function updatePlatforms(dt){
  for(const p of livePlatforms){
    const prevX = p.x, prevY = p.y;

    if((p.kind === "elevator" || p.kind === "horizontal") && p.stops.length > 1){
      // mesma máquina de estados pros dois tipos — só muda o eixo (p.axis)
      // que é movimentado: "y" pro elevator, "x" pro horizontal.
      const axis = p.axis;
      if(p.pauseT > 0){
        p.pauseT -= dt;
      } else {
        const target = p.stops[p.stopIndex];
        const diff = target - p[axis];
        if(Math.abs(diff) <= p.speed * dt){
          p[axis] = target;
          p.pauseT = p.pause;
          // ping-pong: inverte o sentido ao chegar numa das pontas da lista
          if(p.stopIndex === p.stops.length - 1) p.dir = -1;
          else if(p.stopIndex === 0) p.dir = 1;
          p.stopIndex += p.dir;
        } else {
          p[axis] += Math.sign(diff) * p.speed * dt;
        }
      }
    } else if(p.kind === "circular"){
      p.angle += (Math.PI * 2 / p.period) * dt; // sentido horário
      p.x = p.centerX + Math.cos(p.angle) * p.radius - p.w/2;
      p.y = p.centerY + Math.sin(p.angle) * p.radius - p.h/2;
    }

    p.dx = p.x - prevX;
    p.dy = p.y - prevY;
  }
}

// Colisão "one-way": só segura quem está CAINDO (vy >= 0) e cruzou o
// topo da plataforma vindo de cima — permite pular por baixo e
// atravessar de baixo pra cima livremente. "skipAll" (Shift+Baixo do
// jogador) ignora completamente a checagem, deixando cair através de
// qualquer uma. Não é sólida na horizontal (só a face de cima conta).
function resolveOneWayY(entity, newY, skipAll){
  entity.ridingPlatform = null;
  if(skipAll || entity.vy < 0) return newY;

  const left = entity.x + 1, right = entity.x + entity.w - 1;
  const prevBottom = entity.y + entity.h;
  const nextBottom = newY + entity.h;
  for(const p of livePlatforms){
    if(right <= p.x || left >= p.x + p.w) continue;          // sem overlap horizontal
    if(prevBottom <= p.y + 1 && nextBottom >= p.y){
      newY = p.y - entity.h;
      entity.vy = 0;
      entity.onGround = true;
      entity.ridingPlatform = p;
    }
  }
  return newY;
}

// Tenta plantar a entidade em pé em cima do chão sólido normal ou de
// uma plataforma one-way que esteja a até `tolerance` px abaixo dos
// pés (mesmo que não estejam exatamente encostados). Usada ao soltar
// da escada: sem isso, o jogador ficava "flutuando" por um instante
// bem em cima do chão/plataforma e a gravidade normal só pegava a
// colisão um frame depois — na prática, parecia que ele caía direto
// ao chegar no fim da escada e sair pro lado.
// Retorna true se encontrou algo e já ajustou entity.y/vy/onGround
// (e ridingPlatform, se for o caso).
function trySnapToGround(entity, tolerance){
  const left = entity.x + 1, right = entity.x + entity.w - 1;
  const feetY = entity.y + entity.h;

  // chão sólido normal (layer "platforms" do tileset) — procura a
  // partir de dy=0 pra fora (0, +1, -1, +2, -2...) pra sempre grudar
  // no chão mais PRÓXIMO dos pés, seja ele um pouco abaixo (o normal,
  // "quase" chegou) ou um pouco acima (parou de subir um pouco além
  // do necessário).
  for(let d = 0; d <= tolerance; d++){
    for(const dy of (d === 0 ? [0] : [d, -d])){
      const testY = feetY + dy;
      if(isSolidTile(currentMap, left, testY) || isSolidTile(currentMap, right, testY)){
        const row = Math.floor(testY / TILE);
        entity.y = row * TILE - entity.h;
        entity.vy = 0;
        entity.onGround = true;
        entity.dropThroughTimer = 0;
        return true;
      }
    }
  }

  // plataformas one-way (objectgroup "Platforms") — pega a mais
  // próxima dos pés (acima ou abaixo) dentre as que estão dentro da
  // tolerância, caso haja mais de uma na coluna.
  let best = null, bestDist = Infinity;
  for(const p of livePlatforms){
    if(right <= p.x || left >= p.x + p.w) continue; // sem overlap horizontal
    const dist = Math.abs(p.y - feetY);
    if(dist <= tolerance && dist < bestDist){ best = p; bestDist = dist; }
  }
  if(best){
    entity.y = best.y - entity.h;
    entity.vy = 0;
    entity.onGround = true;
    entity.ridingPlatform = best;
    entity.dropThroughTimer = 0;
    return true;
  }

  return false;
}


// Física enquanto o player está preso/escalando a escada: sem
// gravidade, move em linha reta na coluna da escada com Cima/Baixo.
// Sai da escada: Espaço (pula pra fora), Esquerda/Direita (sai pro
// lado), chão sólido normal logo abaixo, ou ao passar do topo/base
// da faixa de tiles de escada.
function updateClimbing(dt, midX){
  const wantsUp = keys["ArrowUp"] || keys["KeyW"];
  const wantsDown = keys["ArrowDown"] || keys["KeyS"];
  const wantsLeft = keys["ArrowLeft"] || keys["KeyA"];
  const wantsRight = keys["ArrowRight"] || keys["KeyD"];
  const wantsJumpOff = keys["Space"];

  if(wantsJumpOff){
    player.climbing = false;
    player.vy = PHYS.jumpVel;
    player.ladderRegrabTimer = CLIMB_REGRAB_DELAY;
    player.ladderExitPlatform = null;
    return;
  }

  // Esquerda/Direita: solta da escada e devolve o controle pro
  // movimento normal (o próximo frame já anda pro lado). O delay de
  // regarrar evita o mesmo "pisca-pisca" de sair/entrar quando Cima
  // (ou Baixo) continua pressionado junto com Esquerda/Direita.
  if(wantsLeft || wantsRight){
    player.climbing = false;
    player.vx = 0;
    player.vy = 0;
    player.ladderRegrabTimer = CLIMB_REGRAB_DELAY;
    player.ladderExitPlatform = null;
    trySnapToGround(player, LADDER_EXIT_SNAP_TOLERANCE);
    return;
  }

  player.vy = wantsUp ? -CLIMB_SPEED : (wantsDown ? CLIMB_SPEED : 0);
  let newY = player.y + player.vy * dt;

  const left = player.x + 1, right = player.x + player.w - 1;
  const prevBottom = player.y + player.h; // pés ANTES de mover neste frame

  if(player.vy > 0){
    // descendo: chão sólido normal embaixo interrompe e planta no chão
    const feetY = newY + player.h;
    if(isSolidTile(currentMap, left, feetY) || isSolidTile(currentMap, right, feetY)){
      const row = Math.floor(feetY / TILE);
      newY = row * TILE - player.h;
      player.climbing = false;
      player.vy = 0;
      player.onGround = true;
      player.ladderRegrabTimer = CLIMB_REGRAB_DELAY;
      player.ladderExitPlatform = null;
    }
  } else if(player.vy < 0){
    // subindo: tile sólido normal em cima trava a subida (evita
    // atravessar caso o último degrau coincida com uma plataforma)
    const headY = newY;
    if(isSolidTile(currentMap, left, headY) || isSolidTile(currentMap, right, headY)){
      const row = Math.floor(headY / TILE);
      newY = (row + 1) * TILE;
      player.vy = 0;
    }
  }

  // Plataformas one-way (objectgroup "Platforms"): planta o jogador em
  // pé nela assim que os pés alcançarem (ou já estiverem perto d)a sua
  // superfície. NÃO usamos só "cruzou este frame exato" — se o jogador
  // regarrar a escada já bem perto da plataforma (ex.: desceu só um
  // pouco antes de segurar de novo), os pés já começam praticamente na
  // altura dela, sem cruzamento nenhum acontecer, e essa checagem nunca
  // dispararia. Por isso comparamos os pés com uma janela de 1 tile ao
  // redor da superfície, tanto subindo quanto descendo, em vez de
  // exigir a transição exata dentro do mesmo frame.
  if(player.climbing && player.vy !== 0){
    const nextBottom = newY + player.h;
    for(const p of livePlatforms){
      if(right <= p.x || left >= p.x + p.w) continue; // sem overlap horizontal
      if(p === player.ladderExitPlatform){
        // Essa é a plataforma de onde o jogador acabou de descer pra
        // pegar a escada: enquanto os pés ainda estiverem dentro da
        // janela de "snap" dela, ignora — senão reachedFromAbove
        // replantaria ele de volta em cima dela no primeiro frame de
        // descida. Assim que os pés passarem bem abaixo, libera a
        // plataforma de novo (ex.: pra poder subir de volta nela depois).
        if(nextBottom > p.y + TILE) player.ladderExitPlatform = null;
        continue;
      }
      const reachedFromBelow = player.vy < 0 && nextBottom <= p.y && prevBottom > p.y - TILE;
      const reachedFromAbove = player.vy > 0 && nextBottom >= p.y && prevBottom < p.y + TILE;

      if(reachedFromAbove){
        // Antes de pousar, olha se a escada continua logo depois da
        // espessura desta plataforma (ela tem um "buraco" pra escada
        // atravessar — pode ser qualquer plataforma no meio do
        // caminho, não só a de origem). Se continuar, não pousa aqui:
        // deixa o jogador seguir descendo por ela normalmente.
        const belowSurfaceY = p.y + p.h;
        if(ladderColumnAt(currentMap, midX, belowSurfaceY, belowSurfaceY + 2) !== null){
          continue;
        }
      }

      if(reachedFromBelow || reachedFromAbove){
        newY = p.y - player.h;
        player.climbing = false;
        player.vy = 0;
        player.onGround = true;
        player.ridingPlatform = p;
        player.ladderRegrabTimer = CLIMB_REGRAB_DELAY;
        player.ladderExitPlatform = null;
        // Pousou de verdade: encerra qualquer "perdão" de colisão que
        // ainda estivesse de pé de um Shift+Baixo anterior (senão, numa
        // viagem rápida — cair e escalar de volta em menos de 0,25s —
        // esse timer ainda estaria ativo e faria a física normal do
        // próximo frame ignorar justamente esta plataforma, atravessando
        // ela de novo como se nunca tivesse pousado).
        player.dropThroughTimer = 0;
        break;
      }
    }
  }

  if(player.climbing){
    const stillOnLadder = ladderColumnAt(currentMap, midX, newY + 2, newY + player.h - 1) !== null;
    if(!stillOnLadder){
      // acabou a escada (topo ou base sem chão sólido): solta e deixa
      // a física normal (gravidade) resolver a partir daqui
      player.climbing = false;
      player.vy = 0;
      player.ladderRegrabTimer = CLIMB_REGRAB_DELAY;
      player.ladderExitPlatform = null;
    }
  }

  newY = Math.max(0, Math.min(currentMap.pxHeight - player.h, newY));
  player.y = newY;

  // Se a escada acabou de soltar o jogador agora (chegou no topo ou na
  // base sem chão sólido embaixo), tenta já plantar em cima do que
  // estiver logo abaixo dentro da tolerância, em vez de deixá-lo cair.
  if(!player.climbing){
    trySnapToGround(player, LADDER_EXIT_SNAP_TOLERANCE);
  }
}

function updatePlayer(dt){
  if(player.invulnT > 0) player.invulnT -= dt;

  // Precisa contar sempre, mesmo durante a escalada (que retorna cedo
  // logo abaixo) — senão, se o jogador agarrar uma escada bem no meio
  // de um drop-through (Shift+Baixo), esse timer fica "congelado" com
  // tempo sobrando, e quando a escalada termina (inclusive subindo de
  // volta pra plataforma de cima) ele ainda está ativo, fazendo o
  // jogador atravessar (cair through) a próxima plataforma one-way
  // que deveria pousá-lo.
  if(player.dropThroughTimer > 0) player.dropThroughTimer -= dt;

  if(gameOver){
    if(keys["KeyR"]) resetGame();
    return;
  }

  if(player.ladderRegrabTimer > 0) player.ladderRegrabTimer -= dt;

  // --- ESCADA: alinhamento horizontal com a layer "Ladder" ---
  const ladderMidX = player.x + player.w/2;
  let ladderCol = ladderColumnAt(currentMap, ladderMidX, player.y + 2, player.y + player.h - 1);

  if(player.climbing){
    updateClimbing(dt, ladderMidX);
    updateAnimState(player, ANIMS, dt);
    promptT += dt;
    return;
  }

  const wantsUp = keys["ArrowUp"] || keys["KeyW"];
  const wantsDown = keys["ArrowDown"] || keys["KeyS"];
  const wantsShift = keys["ShiftLeft"] || keys["ShiftRight"];

  // Escada logo abaixo de uma plataforma one-way: parado em pé em cima
  // dela, o corpo do jogador ainda não sobrepõe a escada (ela começa só
  // depois dos pés), então a checagem acima não a vê. Se está montado
  // numa plataforma (ridingPlatform) e aperta Baixo, olha também uma
  // faixinha bem abaixo dos pés — mas não quando Shift+Baixo é o
  // atalho de "cair através da plataforma" (wantsDropThrough): nesse
  // caso a intenção é cair, não agarrar a escada.
  let ladderJustBelowFeet = false;
  if(ladderCol === null && player.ridingPlatform && wantsDown && !wantsShift){
    const feetY = player.y + player.h;
    ladderCol = ladderColumnAt(currentMap, ladderMidX, feetY, feetY + 2);
    ladderJustBelowFeet = ladderCol !== null;
  }

  // Baixo só entra na escada se ainda não está no chão, OU se está em
  // pé sobre uma plataforma one-way com escada logo abaixo (senão, quem
  // acabou de descer e pousar no chão sólido reativaria a escalada
  // segurando a tecla, ficando "pulando" entre subir/descer/chão sem se
  // firmar — mas chão sólido nunca tem escada embaixo mesmo, então essa
  // exceção só importa pro caso da plataforma). Shift+Baixo nunca entra
  // na escada por essa via — é reservado pro drop-through.
  const canEnterLadder = wantsUp || (wantsDown && (!player.onGround || (player.ridingPlatform && !wantsShift)));
  if(ladderCol !== null && canEnterLadder && player.ladderRegrabTimer <= 0){
    // Se estava em pé numa plataforma bem em cima da escada, guarda qual
    // plataforma era: o primeiro frame descendo por ela ainda vai
    // "tocar" a mesma plataforma por trás (ver updateClimbing), e sem
    // isso o próprio código que replanta o jogador em cima de
    // plataformas encontradas durante a escalada devolveria ele pra
    // cima dela imediatamente.
    player.ladderExitPlatform = (wantsDown && player.ridingPlatform) ? player.ridingPlatform : null;
    player.climbing = true;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.ridingPlatform = null;
    player.x = ladderCol * TILE + TILE/2 - player.w/2;
    if(ladderJustBelowFeet){
      // Nesse caso a escada só foi vista pela faixinha logo abaixo dos
      // pés, não pelo corpo do jogador. Sem empurrar o jogador pra
      // dentro dela agora, o próximo frame checaria "ainda está na
      // escada?" usando a faixa do corpo de novo (que não alcança a
      // escada) e soltaria na hora se Baixo já não estiver mais
      // pressionado (toque rápido) — dando a sensação de "agarra e
      // solta". Empurrando alguns pixels pra baixo já de cara, o corpo
      // passa a sobrepor a escada e a checagem seguinte a enxerga.
      player.y += 4;
    }
    updateAnimState(player, ANIMS, dt);
    promptT += dt;
    return;
  }

  // "Carona": se no frame anterior o jogador estava em cima de uma
  // plataforma one-way em movimento, aplica o deslocamento dela ANTES
  // da física deste frame — senão ele vai ficando pra trás (ou caindo)
  // de plataformas que se movem mais rápido que a queda por gravidade.
  if(player.ridingPlatform){
    const prevTop = player.y;  // posição ANTES do empurrão, pra checagem "varrida" abaixo
    const prevLeft = player.x;
    player.x += player.ridingPlatform.dx;
    player.y += player.ridingPlatform.dy;

    // Esse empurrão é direto, sem checagem de colisão — e como a
    // plataforma se move independente do vx/vy do jogador (que aqui só
    // refletem input/gravidade, não a própria plataforma), os testes de
    // colisão lá embaixo (baseados em vy/vx do jogador) nunca pegam esse
    // caso. Sem isso o jogador atravessava qualquer tile sólido OU outra
    // plataforma one-way no caminho — seja subindo de elevador (dy<0),
    // seja sendo empurrado de lado por uma plataforma horizontal (dx!=0).
    if(player.ridingPlatform.dy < 0){
      const left = player.x + 1, right = player.x + player.w - 1;
      const newTop = player.y;
      let blockedAt = null;
      // Varre TODAS as linhas de tile entre o topo antigo e o novo (não só
      // o ponto final) — cobre qualquer soluço de frame que faça o elevador
      // avançar mais que um tile de uma vez, igual já fazíamos pra "outra
      // plataforma" logo abaixo.
      const newRow = Math.floor(newTop / TILE);
      const prevRow = Math.floor(prevTop / TILE);
      for(let row = newRow; row <= prevRow; row++){
        if(isSolidTile(currentMap, left, row * TILE) || isSolidTile(currentMap, right, row * TILE)){
          blockedAt = (row + 1) * TILE;
          break;
        }
      }
      if(blockedAt === null){
        for(const p of livePlatforms){
          if(p === player.ridingPlatform) continue; // a que ele já está montado não conta
          if(right <= p.x || left >= p.x + p.w) continue; // sem overlap horizontal
          const pBottom = p.y + p.h;
          // cruzou a face de baixo dela neste frame (estava abaixo, agora está no nível dela ou acima)
          if(prevTop >= pBottom && newTop <= pBottom){
            blockedAt = pBottom;
            break;
          }
        }
      }
      if(blockedAt !== null){
        player.y = blockedAt;
        player.vy = 0;
        player.ridingPlatform = null;
      }
    }

    // Mesma ideia pro empurrão horizontal (plataforma "horizontal"): sem
    // isso, o jogador atravessava qualquer tile sólido no caminho lateral.
    // Diferente do teto (dy<0), aqui NÃO soltamos ridingPlatform — o
    // jogador continua em pé em cima dela, só para de ser arrastado pro
    // lado (fica "para trás" contra a parede enquanto ela desliza embaixo).
    if(player.ridingPlatform && player.ridingPlatform.dx !== 0){
      const dir = player.ridingPlatform.dx > 0 ? 1 : -1;
      const newEdgeX = dir > 0 ? player.x + player.w : player.x;
      const prevEdgeX = dir > 0 ? prevLeft + player.w : prevLeft;
      const top = player.y + 1, bottom = player.y + player.h - 1;
      const topRow = Math.floor(top / TILE);
      const bottomRow = Math.floor(bottom / TILE);
      const newCol = Math.floor(newEdgeX / TILE);
      const prevCol = Math.floor(prevEdgeX / TILE);
      const colFrom = dir > 0 ? prevCol : newCol;
      const colTo = dir > 0 ? newCol : prevCol;
      let hitCol = null;
      for(let col = colFrom; col <= colTo && hitCol === null; col++){
        for(let row = topRow; row <= bottomRow; row++){
          if(isSolidTile(currentMap, col * TILE, row * TILE)){ hitCol = col; break; }
        }
      }
      if(hitCol !== null){
        player.x = dir > 0 ? (hitCol * TILE) - player.w : (hitCol + 1) * TILE;
      }
    }
  }

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

  const jumpPressed = keys["KeyW"] || keys["Space"];
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
    // Checa TODAS as linhas de tile que a hitbox ocupa, não só topo/fundo —
    // com player.h (26) maior que 1 tile (16), a hitbox pode cobrir 3 linhas
    // dependendo do offset vertical, e uma checagem de só 2 pontos pode
    // pular a linha do meio (é isso que causava o atravessamento ao lado
    // de plataformas normais enquanto o jogador andava de carona no elevador,
    // já que ali o y varia continuamente por todos os offsets possíveis).
    const topRow = Math.floor(top / TILE);
    const bottomRow = Math.floor(bottom / TILE);
    let hitWall = false;
    for(let row = topRow; row <= bottomRow; row++){
      if(isSolidTile(currentMap, edgeX, row * TILE)){ hitWall = true; break; }
    }
    if(hitWall){
      const col = Math.floor(edgeX / TILE);
      newX = dir > 0 ? (col * TILE) - player.w : (col + 1) * TILE;
      player.vx = 0;
    }
  }
  newX = resolveCratesX(player, newX);
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
    if(isSolidTile(currentMap, left, edgeY) || isSolidTile(currentMap, right, edgeY)){
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
  newY = resolveCratesY(player, newY);

  // --- plataformas one-way (estática/elevador/circular) ---
  // Shift + Baixo enquanto em cima de uma delas: ignora a colisão por
  // um tempinho, o suficiente pra cair através dela.
  const wantsDropThrough = (keys["ArrowDown"] || keys["KeyS"]) &&
                           (keys["ShiftLeft"] || keys["ShiftRight"]);
  newY = resolveOneWayY(player, newY, player.dropThroughTimer > 0);
  if(player.ridingPlatform && wantsDropThrough){
    player.dropThroughTimer = PLATFORM_DROP_TIME;
    player.ridingPlatform = null;
    player.onGround = false; // solta o chão neste frame pra já começar a cair
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
      startMapTransition(d.destiny);
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

    if(!dead){
      const crate = crateAt(b.x, b.y);
      if(crate){
        dead = true;
        if(b.owner === "player") damageCrate(crate); // bala inimiga só é bloqueada, não quebra caixa
      } else if(isSolidTile(currentMap, b.x, b.y)){
        dead = true;
      }
    }

    if(!dead && b.owner === "player"){
      for(let j = enemies.length - 1; j >= 0; j--){
        const enemy = enemies[j];
        if(hitsEntity(enemy, b.x, b.y)){
          enemy.hp -= ENEMY_HIT_DAMAGE;
          if(enemy.hp <= 0) enemies.splice(j, 1);
          dead = true;
          break;
        }
      }
    } else if(!dead && b.owner === "enemy"){
      if(hitsEntity(player, b.x, b.y)){
        dead = true;
        if(player.invulnT <= 0 && !gameOver){
          player.hp = Math.max(0, player.hp - PLAYER_HIT_DAMAGE);
          player.invulnT = PLAYER_INVULN_TIME;
          if(player.hp <= 0) gameOver = true;
        }
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
  let nextState;
  if(entity.climbing){
    nextState = Math.abs(entity.vy) > 1 ? "climb" : "climbIdle";
  } else {
    nextState = (animsSet.jump && !entity.onGround) ? "jump" : (moving ? "run" : "idle");
  }

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

// Diz se há "chão" (tile sólido OU o topo de uma plataforma-objeto) na
// posição dada — usado por canWalkDir pra reconhecer que o inimigo está
// apoiado numa plataforma-objeto, não só em tile sólido.
function groundSupportAt(x, feetY){
  if(isSolid(currentMap, x, feetY)) return true;
  for(const p of livePlatforms){
    if(x < p.x || x > p.x + p.w) continue;
    // feetY é ~1px abaixo dos pés; aceita uma pequena margem porque a
    // plataforma pode estar em movimento (subindo/descendo/circular) e
    // não fica sempre num pixel exato.
    if(feetY >= p.y - 2 && feetY <= p.y + 4) return true;
  }
  return false;
}

// Diz se o inimigo pode andar na direção "dir" (1 = direita, -1 =
// esquerda) sem esbarrar em parede/caixa ou andar pra fora de uma
// beirada — usado tanto na patrulha quanto ao recuar mirando o jogador.
function canWalkDir(enemy, dir){
  const aheadX = dir > 0 ? enemy.x + enemy.w + 1 : enemy.x - 1;
  const top = enemy.y + 1, bottom = enemy.y + enemy.h - 1;
  const wallAhead = isSolid(currentMap, aheadX, top) || isSolid(currentMap, aheadX, bottom);
  const groundAhead = groundSupportAt(aheadX, enemy.y + enemy.h + 1);
  return !wallAhead && groundAhead;
}

function updateEnemy(enemy, dt){
  // "Carona": mesma lógica do player (ver updatePlayer) — aplica o
  // deslocamento da plataforma one-way ANTES da física deste frame,
  // incluindo a mesma checagem "varrida" de bater a cabeça (tile sólido
  // ou outra plataforma) quando o elevador está subindo.
  if(enemy.ridingPlatform){
    const prevTop = enemy.y;
    const prevLeft = enemy.x;
    enemy.x += enemy.ridingPlatform.dx;
    enemy.y += enemy.ridingPlatform.dy;

    if(enemy.ridingPlatform.dy < 0){
      const left = enemy.x + 1, right = enemy.x + enemy.w - 1;
      const newTop = enemy.y;
      let blockedAt = null;
      const newRow = Math.floor(newTop / TILE);
      const prevRow = Math.floor(prevTop / TILE);
      for(let row = newRow; row <= prevRow; row++){
        if(isSolidTile(currentMap, left, row * TILE) || isSolidTile(currentMap, right, row * TILE)){
          blockedAt = (row + 1) * TILE;
          break;
        }
      }
      if(blockedAt === null){
        for(const p of livePlatforms){
          if(p === enemy.ridingPlatform) continue;
          if(right <= p.x || left >= p.x + p.w) continue;
          const pBottom = p.y + p.h;
          if(prevTop >= pBottom && newTop <= pBottom){
            blockedAt = pBottom;
            break;
          }
        }
      }
      if(blockedAt !== null){
        enemy.y = blockedAt;
        enemy.vy = 0;
        enemy.ridingPlatform = null;
      }
    }

    if(enemy.ridingPlatform && enemy.ridingPlatform.dx !== 0){
      const dir = enemy.ridingPlatform.dx > 0 ? 1 : -1;
      const newEdgeX = dir > 0 ? enemy.x + enemy.w : enemy.x;
      const prevEdgeX = dir > 0 ? prevLeft + enemy.w : prevLeft;
      const top = enemy.y + 1, bottom = enemy.y + enemy.h - 1;
      const topRow = Math.floor(top / TILE);
      const bottomRow = Math.floor(bottom / TILE);
      const newCol = Math.floor(newEdgeX / TILE);
      const prevCol = Math.floor(prevEdgeX / TILE);
      const colFrom = dir > 0 ? prevCol : newCol;
      const colTo = dir > 0 ? newCol : prevCol;
      let hitCol = null;
      for(let col = colFrom; col <= colTo && hitCol === null; col++){
        for(let row = topRow; row <= bottomRow; row++){
          if(isSolidTile(currentMap, col * TILE, row * TILE)){ hitCol = col; break; }
        }
      }
      if(hitCol !== null){
        enemy.x = dir > 0 ? (hitCol * TILE) - enemy.w : (hitCol + 1) * TILE;
      }
    }
  }

  const dx = (player.x + player.w/2) - (enemy.x + enemy.w/2);
  const dy = (player.y + player.h/2) - (enemy.y + enemy.h/2);
  const sameLevel = Math.abs(dy) <= ENEMY_SIGHT_VERT;
  // histerese: já alerta, só solta o jogador se ele se afastar bem mais
  const range = enemy.state === "alert" ? ENEMY_SIGHT_RANGE + ENEMY_ALERT_RANGE_BONUS : ENEMY_SIGHT_RANGE;
  const canSee = sameLevel && Math.abs(dx) <= range && hasLineOfSight(enemy, player);

  enemy.state = canSee ? "alert" : "patrol";

  if(enemy.state === "alert"){
    // Distância horizontal mínima pra valer a pena atirar (senão a
    // bala nasce depois do alvo — ver ENEMY_MIN_SHOT_DX). Se estiver
    // muito perto, o inimigo recua tentando abrir espaço em vez de
    // ficar parado desperdiçando tiro.
    // limiar diferente dependendo do estado anterior: se já estava
    // "longe o bastante" (parado atirando), só volta a recuar se dx cair
    // BEM abaixo do limiar; se já estava recuando, só para de recuar se
    // dx passar BEM acima. A zona morta no meio impede o flip.
    const shotThreshold = enemy.farEnough
      ? ENEMY_MIN_SHOT_DX - ENEMY_SHOT_DX_HYSTERESIS
      : ENEMY_MIN_SHOT_DX + ENEMY_SHOT_DX_HYSTERESIS;
    const farEnough = Math.abs(dx) >= shotThreshold;
    enemy.farEnough = farEnough;

    if(farEnough){
      // alinhado o bastante: para, encara o jogador e atira
      if(Math.abs(dx) > 2) enemy.facing = dx >= 0 ? 1 : -1;
      enemy.vx = 0;
      enemy.retreatDir = 0; // não está mais recuando: solta o compromisso de direção
      if(enemy.shootCooldown > 0) enemy.shootCooldown -= dt;
      if(enemy.shootCooldown <= 0){
        fireBulletFrom(enemy, "enemy");
        enemy.shootCooldown = ENEMY_SHOOT_COOLDOWN;
      }
    } else {
      enemy.shootCooldown = 0; // sai pronto pra atirar assim que alinhar

      // Escolhe a direção de fuga só quando precisa (ainda não está
      // recuando, ou a direção que estava usando ficou bloqueada) —
      // e depois MANTÉM essa escolha até conseguir distância. Antes
      // eu recalculava a cada frame pelo sinal de dx: isso fazia o
      // inimigo inverter de direção bem no instante em que cruzava a
      // posição x do jogador (já que dx trocava de sinal no meio do
      // caminho), ficando preso invertendo pra sempre. Comprometer
      // com uma direção resolve isso — mesmo que o caminho escolhido
      // passe perto do jogador (ele não é sólido), o que também
      // resolve o "ponto cego" de ficar parado quando só dá pra
      // escapar indo na direção dele.
      if(enemy.retreatDir === 0 || !canWalkDir(enemy, enemy.retreatDir)){
        const preferredDir = dx >= 0 ? -1 : 1; // se afasta do jogador
        if(canWalkDir(enemy, preferredDir)) enemy.retreatDir = preferredDir;
        else if(canWalkDir(enemy, -preferredDir)) enemy.retreatDir = -preferredDir;
        else enemy.retreatDir = 0; // encurralado dos dois lados
      }

      if(enemy.retreatDir !== 0){
        enemy.vx = enemy.retreatDir * ENEMY_RETREAT_SPEED;
        // vira de verdade pra direção que está correndo — encarar o
        // jogador andando de costas ficava com cara de "patinando"
        // (moonwalk). Volta a encarar assim que parar pra atirar.
        enemy.facing = enemy.retreatDir;
      } else {
        enemy.vx = 0; // preso/encurralado: só espera alinhar
      }
    }
  } else {
    enemy.shootCooldown = 0; // sai pronto pra atirar assim que reavistar
    enemy.retreatDir = 0;
    enemy.vx = enemy.facing * ENEMY_PHYS.patrolSpeed;

    // olha um passo à frente, na direção que está andando: se tiver
    // parede ou não tiver chão, vira antes de sair andando pro nada.
    if(!canWalkDir(enemy, enemy.facing)){
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
    // mesma correção aplicada ao player: checa todas as linhas de tile
    // que a hitbox ocupa, não só topo/fundo (ver comentário em updatePlayer).
    const topRow = Math.floor(top / TILE);
    const bottomRow = Math.floor(bottom / TILE);
    let hitWall = false;
    for(let row = topRow; row <= bottomRow; row++){
      if(isSolidTile(currentMap, edgeX, row * TILE)){ hitWall = true; break; }
    }
    if(hitWall){
      const col = Math.floor(edgeX / TILE);
      newX = dir > 0 ? (col * TILE) - enemy.w : (col + 1) * TILE;
      enemy.vx = 0;
      enemy.facing *= -1; // bateu de frente numa parede: vira
    }
  }
  const beforeCrateX = newX;
  newX = resolveCratesX(enemy, newX);
  if(newX !== beforeCrateX) enemy.facing *= -1; // bateu de frente numa caixa: vira
  newX = Math.max(0, Math.min(currentMap.pxWidth - enemy.w, newX));
  enemy.x = newX;

  // --- resolve Y ---
  let newY = enemy.y + enemy.vy * dt;
  enemy.onGround = false;
  if(enemy.vy !== 0){
    const dir = enemy.vy > 0 ? 1 : -1;
    const edgeY = dir > 0 ? newY + enemy.h : newY;
    const left = enemy.x + 1, right = enemy.x + enemy.w - 1;
    if(isSolidTile(currentMap, left, edgeY) || isSolidTile(currentMap, right, edgeY)){
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
  newY = resolveCratesY(enemy, newY);
  newY = resolveOneWayY(enemy, newY, false); // inimigos nunca atravessam de propósito
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
  // Guarda a posição CRUA (fracionária) além da versão inteira: a inteira
  // é usada só pro ctx.translate (mantém o tile background nítido); a
  // crua é usada em snapToCam() pra arredondar entidades em movimento
  // relativas à câmera, e não cada uma pro seu lado (ver snapToCam).
  return {x: camX, y: camY, xInt: Math.round(camX), yInt: Math.round(camY)};
}

// Câmera do frame de render atual — setada em render(), lida por
// snapToCam() nas funções de desenho (drawPlatforms, drawCharacter, etc).
let CURRENT_CAM = {x: 0, y: 0, xInt: 0, yInt: 0};

// Converte uma posição de MUNDO (fracionária) num ponto de desenho já
// dentro do sistema de coordenadas transladado por -CURRENT_CAM.xInt/yInt
// (ver render()). Faz UM ÚNICO Math.round sobre (posição - câmera crua)
// em vez de arredondar câmera e entidade cada um separadamente.
//
// Por quê: durante uma "carona" numa plataforma que se move rápido na
// horizontal (a circular, perto da base do círculo), a câmera (que segue
// o jogador) e a plataforma têm valores brutos que diferem por uma
// fração de pixel praticamente constante. Arredondando cada um pro seu
// lado, os dois cruzam o "meio pixel" em instantes ligeiramente
// diferentes, e a plataforma parece "tremer" 1px de um lado pro outro
// em relação à câmera. Arredondando a DIFERENÇA (que muda pouco de frame
// a frame quando o jogador está grudado nela) elimina esse descolamento.
function snapToCam(worldX, worldY){
  return {
    x: Math.round(worldX - CURRENT_CAM.x) + CURRENT_CAM.xInt,
    y: Math.round(worldY - CURRENT_CAM.y) + CURRENT_CAM.yInt
  };
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

function drawLadderTiles(layer, mapData){
  if(!layer || !ladderImg) return;
  for(let row=0; row<mapData.height; row++){
    for(let col=0; col<mapData.width; col++){
      if(!layer[row*mapData.width + col]) continue;
      ctx.drawImage(ladderImg, col*TILE, row*TILE, TILE, TILE);
    }
  }
}

function drawPlatforms(){
  for(const p of livePlatforms){
    // arredonda relativo à câmera (snapToCam), não cada um pro seu lado —
    // ver o comentário de snapToCam() pra explicação do "tremor" que isso
    // corrige na plataforma circular.
    const {x: drawX, y: drawY} = snapToCam(p.x, p.y);
    if(p.def.img){
      ctx.drawImage(p.def.img, drawX, drawY, p.w, p.h);
    } else {
      ctx.fillStyle = "#5a6b8a"; // fallback simples caso a imagem ainda não tenha carregado
      ctx.fillRect(drawX, drawY, p.w, p.h);
    }
  }
}

function drawCrates(){
  for(const c of crates){
    if(c.def.img){
      ctx.drawImage(c.def.img, c.x, c.y, c.w, c.h);
    } else {
      // fallback simples caso a imagem ainda não tenha carregado
      ctx.fillStyle = "#7a5230";
      ctx.fillRect(c.x, c.y, c.w, c.h);
    }
    if(c.hitFlash > 0){
      ctx.save();
      ctx.globalAlpha = (c.hitFlash / CRATE_HIT_FLASH_TIME) * 0.65;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.restore();
    }
  }
}

function drawLoots(){
  for(const l of loots){
    const bob = Math.sin(l.bobT) * LOOT_BOB_AMPLITUDE;
    if(l.def.img){
      ctx.drawImage(l.def.img, l.x, l.y + bob, l.w, l.h);
    } else {
      ctx.fillStyle = "#e05a5a";
      ctx.fillRect(l.x, l.y + bob, l.w, l.h);
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

function isBlinkHidden(entity){
  // pisca enquanto o jogador está invencível logo após tomar dano
  return entity === player && player.invulnT > 0 && Math.floor(player.invulnT * 12) % 2 === 0;
}

function drawCharacter(entity, animsSet){
  const anim = animsSet[entity.animState];
  const feetX = entity.x + entity.w/2;      // centro horizontal do hitbox
  const feetY = entity.y + entity.h;        // base do hitbox = chão

  // Só arredonda relativo à câmera (snapToCam) quando a entidade está
  // "grudada" numa plataforma em movimento (ridingPlatform) — é aí que
  // a posição muda por frações de pixel a cada frame e câmera/entidade
  // podem cruzar o "meio pixel" em instantes diferentes, causando o
  // tremor de 1px (mesmo motivo já corrigido em drawPlatforms).
  // Fora dessa situação (parado ou andando no chão, caso comum do
  // inimigo) a câmera NÃO acompanha a entidade da mesma forma, então
  // esse arredondamento pela diferença não faz sentido e só desloca a
  // entidade — por isso aqui volta a usar a posição fracionária normal.
  const drawFeet = entity.ridingPlatform ? snapToCam(feetX, feetY) : {x: feetX, y: feetY};

  // sombra no chão
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(drawFeet.x, drawFeet.y + 1, entity.w/2, 2, 0, 0, Math.PI*2);
  ctx.fill();

  if(!anim.img){
    // fallback simples caso os spritesheets ainda não tenham carregado
    ctx.fillStyle = "#3fb6e0";
    ctx.fillRect(drawFeet.x - entity.w/2, drawFeet.y - entity.h, entity.w, entity.h);
    return;
  }

  const sx = entity.animFrame * SPRITE_W;

  // pisca enquanto o jogador está invencível logo após tomar dano
  if(isBlinkHidden(entity)) return;

  ctx.save();
  ctx.translate(drawFeet.x, drawFeet.y - SPRITE_FEET_Y);
  ctx.scale(entity.facing, 1);
  ctx.drawImage(anim.img, sx, 0, SPRITE_W, SPRITE_H, -SPRITE_W/2, 0, SPRITE_W, SPRITE_H);
  ctx.restore();
}

function drawEnemyHealthBar(enemy){
  const spriteTop = enemy.y + enemy.h - SPRITE_FEET_Y; // topo do sprite desenhado
  const barW = 16, barH = 2;
  const barX = enemy.x + enemy.w/2 - barW/2;
  const barY = spriteTop + 6;
  const pct = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
  ctx.fillStyle = "#2a2e38";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = pct > 0.5 ? "#5fd15f" : (pct > 0.25 ? "#e8c14c" : "#e05a5a");
  ctx.fillRect(barX, barY, barW * pct, barH);
}

function drawArm(entity){
  if(!gunImg) return;
  const shoulder = getShoulderWorld(entity);
  // mesma condição de drawCharacter: só arredonda pela câmera quando
  // grudado numa plataforma em movimento, senão desalinha do resto
  const drawShoulder = entity.ridingPlatform ? snapToCam(shoulder.x, shoulder.y) : shoulder;
  ctx.save();
  ctx.translate(drawShoulder.x, drawShoulder.y);
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

function drawPlayerHealthBar(){
  const x = 760, y = 14, w = 180, h = 16;
  const pct = Math.max(0, Math.min(1, player.hp / player.maxHp));

  ctx.save();
  ctx.fillStyle = "rgba(5,6,10,0.75)";
  roundRect(x - 4, y - 4, w + 8, h + 8, 4);
  ctx.fill();
  ctx.strokeStyle = "#2b2f3a";
  ctx.lineWidth = 1;
  roundRect(x - 4, y - 4, w + 8, h + 8, 4);
  ctx.stroke();

  ctx.fillStyle = "#20242e";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = pct > 0.5 ? "#5fd15f" : (pct > 0.25 ? "#e8c14c" : "#e05a5a");
  ctx.fillRect(x, y, w * pct, h);
  ctx.strokeStyle = "#0b0d12";
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.fillStyle = "#dfe6f0";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("HP " + Math.ceil(player.hp) + "/" + player.maxHp, x + 6, y + h/2 + 1);
  ctx.restore();
}

function drawGameOver(){
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e05a5a";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VOCÊ MORREU", canvas.width/2, canvas.height/2 - 12);
  ctx.fillStyle = "#dfe6f0";
  ctx.font = "13px monospace";
  ctx.fillText("Aperte R para reiniciar", canvas.width/2, canvas.height/2 + 18);
  ctx.restore();
}

function drawStartScreen(){
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e8c14c";
  ctx.font = "bold 30px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GAME START", canvas.width/2, canvas.height/2 - 14);
  ctx.fillStyle = "#dfe6f0";
  ctx.font = "13px monospace";
  ctx.fillText("Aperte ENTER para começar", canvas.width/2, canvas.height/2 + 20);
  ctx.restore();
}

function render(){
  ctx.fillStyle = "#050608";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const cam = getCamera();
  CURRENT_CAM = cam;
  ctx.save();
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-cam.xInt, -cam.yInt);

  drawTileLayer(currentMap.background, currentMap);
  drawTileLayer(currentMap.platforms, currentMap);
  drawLadderTiles(currentMap.ladder, currentMap);
  drawPlatforms();
  drawCrates();
  drawDoorTiles(currentMap.doorsTiles, currentMap);
  drawDoorPrompt(currentMap);
  drawLoots();

  for(const enemy of enemies){
    drawCharacter(enemy, ENEMY_ANIMS);
    drawArm(enemy);
    drawEnemyHealthBar(enemy);
  }

  drawCharacter(player, ANIMS);
  if(!isBlinkHidden(player) && !player.climbing) drawArm(player);
  drawBullets();

  ctx.restore();

  drawPlayerHealthBar();
  if(gameOver) drawGameOver();
  if(!gameStarted) drawStartScreen();
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

  if(!gameStarted){
    // tela inicial: cena parada ao fundo, só espera o ENTER
    if(keys["Enter"] || keys["NumpadEnter"]) gameStarted = true;
  } else if(transitioning){
    // tela fechando/abrindo entre mapas: nada de gameplay roda
    updateMapTransition(dt);
  } else {
    updatePlatforms(dt); // continua animando mesmo depois do game over
    updatePlayer(dt);
    if(!gameOver){
      // depois que o jogador morre, os inimigos param de agir/atirar
      updateEnemies(dt);
      updateBullets(dt);
      updateCrates(dt);
      updateLoots(dt);
    }
  }

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
    const crateKeys = Object.keys(CRATE_DEFS);
    const lootKeys = Object.keys(LOOT_DEFS);
    const platformKeys = Object.keys(PLATFORM_DEFS);
    const [[tileset, door, gun, bullet, ladder], , , , , , mapsRaw] = await Promise.all([
      Promise.all([loadImage(TILESET_SRC), loadImage(DOOR_SRC), loadImage(GUN_SRC), loadImage(BULLET_SRC), loadImage(LADDER_SRC)]),
      Promise.all(animKeys.map(async key => { ANIMS[key].img = await loadImage(ANIMS[key].src); })),
      Promise.all(enemyAnimKeys.map(async key => { ENEMY_ANIMS[key].img = await loadImage(ENEMY_ANIMS[key].src); })),
      Promise.all(crateKeys.map(async key => { CRATE_DEFS[key].img = await loadImage(CRATE_DEFS[key].src); })),
      Promise.all(lootKeys.map(async key => { LOOT_DEFS[key].img = await loadImage(LOOT_DEFS[key].src); })),
      Promise.all(platformKeys.map(async key => { PLATFORM_DEFS[key].img = await loadImage(PLATFORM_DEFS[key].src); })),
      loadAllMaps()
    ]);
    tilesetImg = tileset;
    doorImg = door;
    gunImg = gun;
    bulletImg = bullet;
    ladderImg = ladder;
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
  spawnCrates(currentMap);
  spawnPlatforms(currentMap);
  requestAnimationFrame(loop);
}

init();
})();