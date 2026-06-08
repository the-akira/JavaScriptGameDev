// ============================================================
// CONFIG — altere aqui para ajustar o jogo inteiro
// ============================================================
const CFG = {
  tileSize  : 16,
  cols      : 10,
  rows      : 8,
  scale     : 3,
  fpsCap    : 60,
  hudHeight : 16,
};

// Dimensões derivadas (não edite)
const T  = CFG.tileSize;
const GW = CFG.cols * T;
const GH_PLAY = CFG.rows * T;
const GH = GH_PLAY + CFG.hudHeight;
const S = CFG.scale;

// ============================================================
// IDs DE TILE — adicione novos aqui e implemente em TILES.draw
// ============================================================
const TILE_ID = {
  WALL   : 0,
  FLOOR  : 1,
  GRASS  : 2,
  TREE   : 3,
  WATER  : 4,
  PATH   : 5,
  SAND   : 6,
  CHEST  : 7,
  STAIRS : 8,
  FLOWER : 9,
};
const { WALL, FLOOR, GRASS, TREE, WATER, PATH, SAND, CHEST, STAIRS, FLOWER } = TILE_ID;
const SOLID = new Set([WALL, TREE, WATER]);

// Aliases curtos para os tilemaps (facilitam a leitura das salas)
const [_W,_F,_G,_T,_w,_P,_S,_C,_X,_L] = [WALL,FLOOR,GRASS,TREE,WATER,PATH,SAND,CHEST,STAIRS,FLOWER];

// ============================================================
// PALETA DE CORES — altere aqui para re-tematizar o jogo
// ============================================================
const COLOR = {
  // Tiles
  floorA:'#e0cc96', floorB:'#ccb47a',
  wallA: '#3a2818', wallB: '#5c4030', wallTop:'#7a5840',
  waterA:'#2c6cc0', waterB:'#4890e8', waterC:'#80b8ff',
  grassA:'#48a030', grassB:'#30782a',
  treeA: '#1a640a', treeB: '#0e4808', treeC:'#2a8010',
  pathA: '#b89848', pathB: '#9a7c34',
  sandA: '#e4c068', sandB: '#c8a048',
  chestA:'#a07820', chestB:'#d4a800', chestL:'#f0cc40',
  stairA:'#504040', stairB:'#706060',
  flowerP:'#e02868', flowerY:'#ffdc00',
  // Jogador
  pSkin:'#f0c080', pHair:'#3c1a00', pTunic:'#1850a0',
  pPants:'#10306c', pSword:'#c8dced', pSwordG:'#a0b820', pShield:'#c02020',
  // Inimigos
  slimeA:'#28c028', slimeB:'#167016', slimeE:'#eefaee',
  batA:  '#7028b0', batB:  '#48187a', batE:'#ff9090',
  knightA:'#c03028', knightB:'#7c1818', knightC:'#c8a000',
  // HUD
  hudBg: 'rgba(8,6,20,0.88)', hudText:'#e8dca8',
  heartFull:'#ff2828', heartEmpty:'#501010',
  crystalOn:'#60c8ff', crystalOff:'#203040',
  // Misc
  black:'#000000', white:'#ffffff', shadow:'rgba(0,0,0,0.22)',
};

// ============================================================
// CANVAS
// ============================================================
const canvas = document.getElementById('gc');
canvas.width  = GW * S;
canvas.height = GH * S;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

/** Converte coordenada de jogo → pixel no canvas */
const px = x => Math.round(x) * S;

/** Desenha um retângulo em coordenadas de jogo */
function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(px(x), px(y), w * S, h * S);
}

// ============================================================
// INPUT — teclas pressionadas e "just pressed" (consumíveis)
// ============================================================
const Input = (() => {
  const held = {};
  const just = {};

  addEventListener('keydown', e => {
    if (!held[e.code]) just[e.code] = true;
    held[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))
      e.preventDefault();
  });
  addEventListener('keyup', e => { held[e.code] = false; });

  return {
    isHeld   : code => !!held[code],
    consume  : code => { const v = just[code]; delete just[code]; return !!v; },
    clearJust: ()   => { for (const k in just) delete just[k]; },
    /** Retorna true (e consome) se qualquer tecla de ação foi pressionada */
    action: () =>
      Input.consume('KeyZ') || Input.consume('Space') || Input.consume('KeyX'),
  };
})();

// ============================================================
// RENDERER DE TILES — um case por tile; fácil de adicionar novos
// ============================================================
const Tiles = {
  draw(id, gx, gy) {
    const C = COLOR;
    switch (id) {

      case FLOOR:
        rect(gx,gy,16,16,C.floorA);
        rect(gx,gy,16,1,C.floorB); rect(gx,gy,1,16,C.floorB);
        break;

      case WALL:
        rect(gx,gy,16,4,C.wallTop);
        rect(gx,gy+4,16,12,C.wallA);
        rect(gx,gy+4,16,1,C.wallB);
        rect(gx+5,gy,1,4,C.wallB); rect(gx+11,gy,1,4,C.wallB);
        break;

      case GRASS:
        rect(gx,gy,16,16,C.grassA);
        rect(gx+2,gy+3,1,5,C.grassB); rect(gx+5,gy+5,1,4,C.grassB);
        rect(gx+9,gy+2,1,5,C.grassB); rect(gx+13,gy+4,1,3,C.grassB);
        rect(gx+7,gy+7,1,3,C.grassB);
        break;

      case TREE:
        rect(gx,gy,16,16,C.treeB);
        rect(gx+2,gy+2,12,12,C.treeA);
        rect(gx+4,gy+4,8,8,C.treeB);
        rect(gx+6,gy+5,4,3,C.treeA);
        rect(gx+3,gy+1,2,2,C.treeC); rect(gx+11,gy+2,2,2,C.treeC);
        break;

      case WATER:
        rect(gx,gy,16,16,C.waterA);
        rect(gx+1,gy+4,6,2,C.waterB); rect(gx+9,gy+4,4,2,C.waterB);
        rect(gx+3,gy+10,8,2,C.waterB);
        rect(gx+2,gy+5,4,1,C.waterC); rect(gx+10,gy+11,3,1,C.waterC);
        break;

      case PATH:
        rect(gx,gy,16,16,C.pathA);
        rect(gx+3,gy+6,3,2,C.pathB); rect(gx+10,gy+2,3,2,C.pathB);
        rect(gx+1,gy,1,16,C.pathB); rect(gx+14,gy,1,16,C.pathB);
        break;

      case SAND:
        rect(gx,gy,16,16,C.sandA);
        rect(gx+4,gy+3,2,2,C.sandB); rect(gx+11,gy+9,2,2,C.sandB);
        rect(gx+7,gy+6,1,1,C.sandB); rect(gx+2,gy+12,2,1,C.sandB);
        break;

      case CHEST:
        rect(gx,gy,16,16,C.floorA);
        rect(gx,gy,16,1,C.floorB); 
        rect(gx,gy,1,16,C.floorB);
        rect(gx+3,gy+5,10,8,C.chestA);
        rect(gx+3,gy+5,10,3,C.chestB);
        rect(gx+3,gy+8,10,1,C.chestA);
        rect(gx+7,gy+6,2,3,C.chestL);
        rect(gx+4,gy+6,1,1,C.chestL); 
        rect(gx+11,gy+6,1,1,C.chestL);
        break;

      case STAIRS:
        rect(gx,gy,16,16,C.floorA);
        for (let i = 0; i < 4; i++) {
          rect(gx+1+i,gy+3+i*3, 14-i*2, 2, C.stairA);
          rect(gx+1+i,gy+4+i*3, 14-i*2, 1, C.stairB);
        }
        break;

      case FLOWER:
        rect(gx,gy,16,16,C.grassA);
        rect(gx+2,gy+3,1,5,C.grassB); rect(gx+13,gy+4,1,3,C.grassB);
        rect(gx+5,gy+4,6,6,C.flowerP);
        rect(gx+7,gy+5,2,4,C.flowerP);
        rect(gx+5,gy+7,6,2,C.flowerP);
        rect(gx+6,gy+6,4,4,C.flowerY);
        rect(gx+7,gy+7,2,2,C.white);
        break;

      default:
        rect(gx, gy, 16, 16, '#ff00ff'); // tile desconhecido (magenta = erro visível)
    }
  },
};

// ============================================================
// RENDERER DE SPRITES — personagens desenhados por código
// ============================================================
const Sprites = {

  drawPlayer(gx, gy, facing, attacking, walkFrame, hurtTimer) {
    if (hurtTimer > 0 && Math.floor(hurtTimer / 4) % 2 === 0) return; // pisca ao levar dano

    const C = COLOR;
    rect(gx+4, gy+14, 8, 2, C.shadow);        // sombra

    // Corpo
    rect(gx+4,  gy+7,  8, 7, C.pTunic);
    rect(gx+4,  gy+12, 3, 3, C.pPants);
    rect(gx+9,  gy+12, 3, 3, C.pPants);

    // Botas (animação de caminhada)
    if (walkFrame === 1) {
      rect(gx+3,  gy+14, 3, 2, C.pHair);
      rect(gx+10, gy+14, 3, 2, C.pHair);
    } else {
      rect(gx+4,  gy+14, 3, 2, C.pHair);
      rect(gx+9,  gy+14, 3, 2, C.pHair);
    }

    // Cabeça e cabelo
    rect(gx+4, gy+2, 8, 6, C.pSkin);
    rect(gx+4, gy+2, 8, 2, C.pHair);

    // Olhos (dependem da direção)
    if (facing !== 'up') {
      if (facing === 'left')       rect(gx+5, gy+5, 2, 2, C.pHair);
      else if (facing === 'right') rect(gx+9, gy+5, 2, 2, C.pHair);
      else { rect(gx+5, gy+5, 2, 2, C.pHair); rect(gx+9, gy+5, 2, 2, C.pHair); }
    }

    // Espada e escudo ao atacar
    if (attacking) {
      switch (facing) {
        case 'right':
          rect(gx+12,gy+7,10,2,C.pSword); rect(gx+12,gy+6,2,4,C.pSwordG);
          rect(gx+3, gy+7,3, 3,C.pShield); break;
        case 'left':
          rect(gx-6, gy+7,10,2,C.pSword); rect(gx+2,gy+6,2,4,C.pSwordG);
          rect(gx+10,gy+7,3, 3,C.pShield); break;
        case 'up':
          rect(gx+7, gy-8,2,10,C.pSword); rect(gx+6,gy,4,2,C.pSwordG);
          rect(gx+10,gy+7,3, 3,C.pShield); break;
        case 'down':
          rect(gx+7, gy+13,2,10,C.pSword); rect(gx+6,gy+11,4,2,C.pSwordG);
          rect(gx+3, gy+7, 3, 3,C.pShield); break;
      }
    }
  },

  drawEnemy(type, gx, gy, hp, maxHp, frame, flash) {
    if (flash > 0 && Math.floor(flash / 3) % 2 === 1) ctx.globalAlpha = 0.35;
    const C = COLOR;
    rect(gx+2, gy+14, 12, 2, C.shadow);

    if (type === 'slime') {
      const b = frame === 1 ? 2 : 0;
      rect(gx+2, gy+6-b, 12, 8+b, C.slimeA);
      rect(gx+4, gy+7-b,  8, 5,   C.slimeB);
      rect(gx+5, gy+8-b,  2, 2,   C.slimeE); rect(gx+9, gy+8-b, 2, 2, C.slimeE);
      rect(gx+5, gy+9-b,  1, 1,   C.black);  rect(gx+9, gy+9-b, 1, 1, C.black);
      rect(gx+7, gy+5-b,  2, 2,   C.slimeB);

    } else if (type === 'bat') {
      const w = frame === 0 ? 3 : 5;
      rect(gx-w, gy+3, w+5, 7, C.batA);
      rect(gx+11,gy+3, w+5, 7, C.batA);
      rect(gx+4, gy+3, 8,   7, C.batB);
      rect(gx+5, gy+5, 2,   2, C.batE); rect(gx+9, gy+5, 2, 2, C.batE);
      rect(gx+6, gy+8, 4,   2, C.batA);
      rect(gx+4, gy+10,2,   3, C.batA); rect(gx+10,gy+10, 2, 3, C.batA);

    } else if (type === 'knight') {
      // Pernas — alternam com o frame (marcha)
      const legL = frame === 0 ? 1 : 0;
      const legR = frame === 0 ? 0 : 1;
      rect(gx+3,  gy+12+legL, 3, 3, C.knightB); // perna esquerda sobe/desce
      rect(gx+10, gy+12+legR, 3, 3, C.knightB); // perna direita oposta

      // Mão
      rect(gx+10, gy+5+legR, 6, 3, C.knightB);

      // Corpo e armadura (estáticos)
      rect(gx+3, gy+2,  10, 11, C.knightA);
      rect(gx+4, gy+2,   8,  5, C.knightB);
      rect(gx+5, gy+5,   6,  2, C.knightC);
      rect(gx+5, gy+4,   2,  2, C.white); rect(gx+9, gy+4, 2, 2, C.white);

      // Lança — balança levemente com o frame
      const lanceOff = frame === 0 ? 0 : 1;
      rect(gx+14, gy+1+lanceOff, 2, 13, C.knightC);
      rect(gx+13, gy+lanceOff,   4,  3, C.white);
    }

    ctx.globalAlpha = 1;

    // Barra de HP mini acima do inimigo
    if (hp < maxHp) {
      rect(gx+2, gy-1, 12, 2, C.black);
      const barColor = hp > maxHp * 0.5 ? C.slimeA : C.pShield;
      rect(gx+2, gy-1, Math.ceil(12 * hp / maxHp), 2, barColor);
    }
  },

  drawHeartShape(gx, gy, size) {
    const pattern = [
      "0110110","1111111","1111111",
      "0111110","0011100","0001000","0000000",
    ];
    for (let y = 0; y < pattern.length; y++)
      for (let x = 0; x < pattern[y].length; x++)
        if (pattern[y][x] === '1')
          rect(gx + x, gy + y, 1, 1, ctx.fillStyle);
  },

  drawHeart(gx, gy, size, filled) {
    const C = COLOR;
    ctx.fillStyle = C.heartEmpty;
    this.drawHeartShape(gx, gy, size);
    if (filled >= 2) {
      ctx.fillStyle = C.heartFull;
      this.drawHeartShape(gx, gy, size);
    } else if (filled >= 1) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(px(gx), px(gy), size * S / 2, size * S + 2);
      ctx.clip();
      ctx.fillStyle = C.heartFull;
      this.drawHeartShape(gx, gy, size);
      ctx.restore();
    }
  },

  drawCrystalIcon(gx, gy, active) {
    const col = active ? COLOR.crystalOn : COLOR.crystalOff;
    rect(gx+3, gy,   2, 2, col);
    rect(gx+1, gy+2, 6, 4, col);
    rect(gx+2, gy+6, 4, 1, col);
    if (active) rect(gx+3, gy+1, 1, 2, COLOR.white);
  },
};

// ============================================================
// MUNDO — grade 3×3 de salas
// ============================================================
/**
* Cria um objeto de sala. Adicionar uma nova sala é só chamar makeRoom().
* {string} name       - Nome exibido no HUD
* {number[][]} tiles  - Grade 8×10 de IDs de tile
* {Array} enemies     - Lista de {type, tx, ty}
* {boolean} hasCrystal - Se o baú desta sala contém um cristal
*/
function makeRoom(name, tiles, enemies = [], hasCrystal = false) {
  return { name, tiles, enemies, hasCrystal, crystalCollected: false };
}

/**
* worldGrid[linha][coluna] — grade 3×3.
* Para expandir o mundo: aumente as dimensões do array
* e ajuste os limites de transição em Room.checkTransition().
*/
const worldGrid = [
  // ── Linha 0 (norte) ──────────────────────────────────────
  [
    makeRoom('Floresta NW', [
      [_T,_T,_T,_T,_T,_T,_T,_T,_T,_T],
      [_T,_G,_G,_G,_G,_G,_G,_G,_G,_T],
      [_T,_G,_T,_G,_L,_G,_G,_T,_G,_T],
      [_T,_G,_G,_G,_G,_G,_G,_G,_G,_G],
      [_T,_G,_L,_G,_T,_G,_L,_G,_G,_G],
      [_T,_G,_G,_G,_G,_G,_G,_T,_G,_T],
      [_T,_G,_T,_G,_G,_L,_G,_G,_G,_T],
      [_T,_T,_T,_T,_G,_G,_T,_T,_T,_T],
    ], [
      {type:'bat',  tx:3,ty:2},
      {type:'bat',  tx:5,ty:6},
      {type:'slime',tx:5,ty:4},
    ]),

    makeRoom('Floresta Central', [
      [_T,_T,_T,_T,_T,_T,_T,_T,_T,_T],
      [_T,_G,_G,_P,_P,_P,_P,_G,_G,_T],
      [_T,_T,_G,_P,_G,_G,_P,_G,_T,_T],
      [_G,_G,_G,_P,_G,_G,_P,_G,_G,_G],
      [_G,_G,_G,_P,_G,_G,_P,_G,_G,_G],
      [_T,_G,_G,_P,_G,_L,_P,_G,_T,_T],
      [_T,_G,_G,_P,_P,_P,_P,_G,_G,_T],
      [_T,_T,_T,_T,_P,_P,_T,_T,_T,_T],
    ], [
      {type:'slime',tx:5,ty:2},
      {type:'bat',  tx:2,ty:5},
    ]),

    makeRoom('Ruínas Antigas', [
      [_T,_T,_T,_T,_T,_T,_T,_T,_T,_T],
      [_T,_F,_F,_W,_F,_F,_W,_F,_F,_T],
      [_T,_F,_F,_F,_F,_F,_F,_F,_F,_T],
      [_G,_G,_F,_F,_F,_F,_F,_F,_W,_T],
      [_G,_G,_F,_F,_C,_F,_F,_F,_W,_T],
      [_T,_F,_F,_F,_F,_F,_F,_F,_F,_T],
      [_T,_F,_W,_F,_F,_F,_W,_F,_F,_T],
      [_T,_T,_T,_T,_G,_G,_T,_T,_T,_T],
    ], [
      {type:'knight',tx:6,ty:2},
    ], true),
  ],

  // ── Linha 1 (centro) ─────────────────────────────────────
  [
    makeRoom('Campos do Oeste', [
      [_W,_W,_W,_W,_G,_G,_W,_W,_W,_W],
      [_W,_F,_F,_F,_F,_F,_F,_F,_F,_W],
      [_W,_F,_F,_F,_W,_F,_F,_F,_F,_W],
      [_W,_F,_F,_F,_F,_F,_F,_F,_F,_F],
      [_W,_F,_F,_F,_F,_F,_F,_F,_F,_F],
      [_W,_F,_F,_F,_F,_W,_F,_F,_F,_W],
      [_W,_F,_F,_F,_F,_F,_F,_F,_F,_W],
      [_W,_W,_W,_W,_F,_F,_W,_W,_W,_W],
    ], [
      {type:'slime', tx:3,ty:2},
      {type:'slime', tx:7,ty:5},
      {type:'knight',tx:5,ty:4},
    ]),

    makeRoom('Vila (início)', [
      [_W,_W,_W,_W,_F,_F,_W,_W,_W,_W],
      [_W,_F,_F,_F,_F,_F,_F,_F,_F,_W],
      [_W,_F,_L,_F,_F,_F,_F,_L,_F,_W],
      [_F,_F,_F,_F,_F,_F,_F,_F,_F,_F],
      [_F,_F,_F,_F,_F,_F,_F,_F,_F,_F],
      [_W,_F,_F,_F,_F,_F,_F,_F,_F,_W],
      [_W,_F,_F,_W,_F,_F,_W,_F,_F,_W],
      [_W,_W,_W,_W,_F,_F,_W,_W,_W,_W],
    ] /* sala inicial — sem inimigos */),

    makeRoom('Templo do Leste', [
      [_W,_W,_W,_W,_F,_F,_W,_W,_W,_W],
      [_W,_F,_F,_W,_F,_F,_W,_F,_F,_W],
      [_W,_F,_F,_F,_F,_F,_F,_F,_F,_W],
      [_F,_F,_F,_F,_F,_F,_F,_F,_W,_W],
      [_F,_F,_F,_F,_C,_F,_F,_F,_W,_W],
      [_W,_F,_F,_F,_F,_F,_F,_F,_F,_W],
      [_W,_F,_W,_F,_F,_F,_F,_W,_F,_W],
      [_W,_W,_W,_W,_F,_F,_W,_W,_W,_W],
    ], [
      {type:'knight',tx:3,ty:2},
      {type:'knight',tx:7,ty:5},
      {type:'slime', tx:5,ty:3},
    ], true),
  ],

  // ── Linha 2 (sul) ────────────────────────────────────────
  [
    makeRoom('Pântano do Sul', [
      [_W,_W,_W,_W,_G,_G,_W,_W,_W,_W],
      [_W,_G,_w,_G,_G,_G,_G,_w,_G,_W],
      [_W,_G,_G,_w,_w,_G,_w,_G,_G,_W],
      [_W,_F,_G,_w,_C,_G,_w,_G,_G,_F],
      [_W,_F,_G,_G,_G,_G,_G,_w,_G,_F],
      [_W,_G,_w,_G,_G,_w,_G,_G,_G,_W],
      [_W,_G,_G,_G,_G,_G,_G,_G,_G,_W],
      [_W,_W,_W,_W,_W,_W,_W,_W,_W,_W],
    ], [
      {type:'bat',  tx:2,ty:2},
      {type:'bat',  tx:8,ty:5},
      {type:'slime',tx:6,ty:1},
    ], true),

    makeRoom('Porto Costeiro', [
      [_W,_W,_W,_W,_F,_F,_W,_W,_W,_W],
      [_W,_S,_S,_S,_S,_S,_S,_S,_S,_W],
      [_W,_S,_w,_w,_S,_S,_w,_w,_S,_W],
      [_F,_F,_S,_w,_S,_S,_w,_S,_S,_F],
      [_F,_F,_S,_S,_S,_S,_S,_S,_S,_F],
      [_W,_S,_X,_S,_S,_S,_S,_S,_S,_W],
      [_W,_S,_S,_S,_S,_S,_S,_S,_S,_W],
      [_W,_W,_W,_W,_W,_W,_W,_W,_W,_W],
    ], [
      {type:'slime',tx:3,ty:5},
      {type:'slime',tx:7,ty:3},
      {type:'bat',  tx:5,ty:2},
    ]),

    makeRoom('Caverna do Mar', [
      [_W,_W,_W,_W,_F,_F,_W,_W,_W,_W],
      [_W,_F,_F,_F,_F,_F,_F,_F,_F,_W],
      [_W,_F,_W,_F,_F,_F,_F,_W,_F,_W],
      [_F,_F,_F,_F,_w,_w,_F,_F,_F,_W],
      [_F,_F,_F,_w,_w,_w,_w,_F,_F,_W],
      [_W,_F,_F,_F,_w,_w,_F,_F,_F,_W],
      [_W,_F,_F,_F,_F,_F,_F,_C,_F,_W],
      [_W,_W,_W,_W,_W,_W,_W,_W,_W,_W],
    ], [
      {type:'knight',tx:7,ty:4},
      {type:'bat',   tx:5,ty:6},
    ], true),
  ],
];

// ============================================================
// ENTIDADES
// ============================================================
class Player {
  constructor() {
    this.x = GW / 2 - T / 2;
    this.y = GH_PLAY / 2 - T / 2;
    this.speed        = 1.4;
    this.hp           = 6;
    this.maxHp        = 6;
    this.crystals     = 0;
    this.crystalMax   = 4;
    this.facing       = 'down';
    this.isAttacking  = false;
    this.attackTimer  = 0;
    this.attackDur    = 18;
    this.attackCool   = 0;
    this.hurtTimer    = 0;
    this.hurtDur      = 50;
    this.walkFrame    = 0;
    this.walkClock    = 0;
  }

  /** Hitbox de movimento */
  bounds() { return { x: this.x+3, y: this.y+2, w: 10, h: 14 }; }

  /** Hitbox do ataque (depende da direção) */
  attackBox() {
    const ax = 14, ay = 10;
    switch (this.facing) {
      case 'right': return { x: this.x+T+2,    y: this.y+4,     w: ax, h: ay };
      case 'left':  return { x: this.x-ax,      y: this.y+4,     w: ax, h: ay };
      case 'up':    return { x: this.x+4,        y: this.y-ay-2,  w: ay, h: ax };
      case 'down':  return { x: this.x+4,        y: this.y+T+2,   w: ay, h: ax };
    }
  }

  update(tiles) {
    // Ataque
    if (this.attackCool <= 0 && Input.action()) {
      this.isAttacking = true;
      this.attackTimer = this.attackDur;
      this.attackCool  = 28;
    }
    if (this.attackTimer > 0 && --this.attackTimer === 0) this.isAttacking = false;
    if (this.attackCool  > 0) this.attackCool--;
    if (this.hurtTimer   > 0) this.hurtTimer--;

    // Movimento
    let dx = 0, dy = 0;
    if (Input.isHeld('ArrowLeft')  || Input.isHeld('KeyA')) { dx = -this.speed; if (!this.isAttacking) this.facing = 'left';  }
    if (Input.isHeld('ArrowRight') || Input.isHeld('KeyD')) { dx =  this.speed; if (!this.isAttacking) this.facing = 'right'; }
    if (Input.isHeld('ArrowUp')    || Input.isHeld('KeyW')) { dy = -this.speed; if (!this.isAttacking) this.facing = 'up';    }
    if (Input.isHeld('ArrowDown')  || Input.isHeld('KeyS')) { dy =  this.speed; if (!this.isAttacking) this.facing = 'down';  }

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; } // diagonal normalizada
    this._move(dx, 0, tiles);
    this._move(0, dy, tiles);

    // Animação de caminhada
    if (dx !== 0 || dy !== 0) {
      if (++this.walkClock >= 9) { this.walkFrame = 1 - this.walkFrame; this.walkClock = 0; }
    } else {
      this.walkFrame = 0;
    }
  }

  _move(dx, dy, tiles) {
    const nx = this.x + dx, ny = this.y + dy;
    const b  = { x: nx+3, y: ny+2, w: 11, h: 15 };
    const corners = [
      { tx: ~~(b.x / T),           ty: ~~(b.y / T)           },
      { tx: ~~((b.x+b.w-1) / T),   ty: ~~(b.y / T)           },
      { tx: ~~(b.x / T),           ty: ~~((b.y+b.h-1) / T)   },
      { tx: ~~((b.x+b.w-1) / T),   ty: ~~((b.y+b.h-1) / T)  },
    ];
    for (const { tx, ty } of corners) {
      // Clamp: tiles fora do mapa tratados como borda da sala aberta
      const cx = Math.max(0, Math.min(CFG.cols-1, tx));
      const cy = Math.max(0, Math.min(CFG.rows-1, ty));
      if (SOLID.has(tiles[cy][cx])) return;
    }
    this.x = nx; this.y = ny;
  }

  hurt(dmg) {
    if (this.hurtTimer > 0) return;
    this.hp = Math.max(0, this.hp - dmg);
    this.hurtTimer = this.hurtDur;
  }

  draw() {
    Sprites.drawPlayer(this.x, this.y, this.facing, this.isAttacking, this.walkFrame, this.hurtTimer);
  }
}

// Stats por tipo de inimigo — adicione novos tipos aqui
const ENEMY_STATS = {
  slime : { hp: 2, speed: 0.5,  dmg: 1 },
  bat   : { hp: 1, speed: 1.1,  dmg: 1 },
  knight: { hp: 4, speed: 0.5,  dmg: 2 },
};

// ============================================================
// A* PATHFINDING — busca caminho em grid de tiles
// ============================================================
const AStar = {

  find(tiles, fromTx, fromTy, toTx, toTy) {
    // Mesma célula — sem necessidade de mover
    if (fromTx === toTx && fromTy === toTy) return [];
 
    const cols = CFG.cols, rows = CFG.rows;
    const key  = (x, y) => y * cols + x;
 
    // Heurística de Manhattan (sem diagonais aqui para simplificar custo)
    const h = (x, y) => Math.abs(x - toTx) + Math.abs(y - toTy);
 
    // Nós
    const gScore  = new Map();
    const fScore  = new Map();
    const cameFrom = new Map();
    const open    = new Set();
    const closed  = new Set();
 
    const startK = key(fromTx, fromTy);
    gScore.set(startK, 0);
    fScore.set(startK, h(fromTx, fromTy));
    open.add(startK);
 
    // Nó atual com menor fScore
    const popBest = () => {
      let best = null, bestF = Infinity;
      for (const k of open) {
        const f = fScore.get(k) ?? Infinity;
        if (f < bestF) { bestF = f; best = k; }
      }
      return best;
    };
 
    // 4 direções + diagonais (custo diagonal ≈ 1.414)
    const DIRS = [
      [ 1, 0,1],[-1, 0,1],[ 0, 1,1],[ 0,-1,1],
      [ 1, 1,1.414],[-1, 1,1.414],[ 1,-1,1.414],[-1,-1,1.414],
    ];
 
    while (open.size > 0) {
      const curK = popBest();
      if (curK === null) break;
 
      const cx = curK % cols;
      const cy = ~~(curK / cols);
 
      if (cx === toTx && cy === toTy) {
        // Reconstrói caminho
        const path = [];
        let k = curK;
        while (cameFrom.has(k)) {
          path.push({ tx: k % cols, ty: ~~(k / cols) });
          k = cameFrom.get(k);
        }
        path.reverse();
        return path;
      }
 
      open.delete(curK);
      closed.add(curK);
 
      for (const [dx, dy, cost] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        if (SOLID.has(tiles[ny][nx])) continue;
 
        // Para diagonais, verifica se os dois tiles adjacentes são livres
        // (evita cortar quinas de paredes)
        if (dx !== 0 && dy !== 0) {
          if (SOLID.has(tiles[cy][nx]) || SOLID.has(tiles[ny][cx])) continue;
        }
 
        const nk = key(nx, ny);
        if (closed.has(nk)) continue;
 
        const tentG = (gScore.get(curK) ?? Infinity) + cost;
        if (tentG < (gScore.get(nk) ?? Infinity)) {
          cameFrom.set(nk, curK);
          gScore.set(nk, tentG);
          fScore.set(nk, tentG + h(nx, ny));
          open.add(nk);
        }
      }
    }
 
    return []; // sem caminho
  },

  findCardinal(tiles, fromTx, fromTy, toTx, toTy) {
    if (fromTx === toTx && fromTy === toTy) return [];

    const cols = CFG.cols, rows = CFG.rows;
    const key  = (x, y) => y * cols + x;
    const h    = (x, y) => Math.abs(x - toTx) + Math.abs(y - toTy);

    const gScore   = new Map();
    const fScore   = new Map();
    const cameFrom = new Map();
    const open     = new Set();
    const closed   = new Set();

    const startK = key(fromTx, fromTy);
    gScore.set(startK, 0);
    fScore.set(startK, h(fromTx, fromTy));
    open.add(startK);

    const popBest = () => {
      let best = null, bestF = Infinity;
      for (const k of open) {
        const f = fScore.get(k) ?? Infinity;
        if (f < bestF) { bestF = f; best = k; }
      }
      return best;
    };

    // Só 4 direções — sem diagonal
    const DIRS = [ [1,0],[-1,0],[0,1],[0,-1] ];

    while (open.size > 0) {
      const curK = popBest();
      if (curK === null) break;
      const cx = curK % cols;
      const cy = ~~(curK / cols);

      if (cx === toTx && cy === toTy) {
        const path = [];
        let k = curK;
        while (cameFrom.has(k)) {
          path.push({ tx: k % cols, ty: ~~(k / cols) });
          k = cameFrom.get(k);
        }
        path.reverse();
        return path;
      }

      open.delete(curK);
      closed.add(curK);

      for (const [dx, dy] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        if (SOLID.has(tiles[ny][nx])) continue;

        const nk = key(nx, ny);
        if (closed.has(nk)) continue;

        const tentG = (gScore.get(curK) ?? Infinity) + 1;
        if (tentG < (gScore.get(nk) ?? Infinity)) {
          cameFrom.set(nk, curK);
          gScore.set(nk, tentG);
          fScore.set(nk, tentG + h(nx, ny));
          open.add(nk);
        }
      }
    }

    return [];
  },
};

class Enemy {
  constructor(def) {
    this.type    = def.type;
    this.x       = def.tx * T;
    this.y       = def.ty * T;
    const s      = ENEMY_STATS[this.type] ?? ENEMY_STATS.slime;
    this.hp      = s.hp; this.maxHp = s.hp;
    this.speed   = s.speed;
    this.dmg     = s.dmg;
    this.vx      = (Math.random() > 0.5 ? 1 : -1) * this.speed;
    this.vy      = (Math.random() > 0.5 ? 1 : -1) * this.speed;
    this.dead    = false;
    this.flash   = 0;
    this.frame   = 0;
    this.fClock  = 0;
    this.aiClock = 0;
    // A* state
    this._path       = [];   // caminho atual [{tx,ty}, ...]
    this._pathClock  = 0;    // quando recalcular
    // Morcego não usa A* — vaga livremente
    this._useAStar   = (this.type !== 'bat');
  }

  bounds() { return { x: this.x+2, y: this.y+5, w: 12, h: 9 }; }

  overlaps(b) {
    const a = this.bounds();
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  _tilePos() {
    return {
      tx: Math.max(0, Math.min(CFG.cols-1, ~~((this.x + T/2) / T))),
      ty: Math.max(0, Math.min(CFG.rows-1, ~~((this.y + T/2) / T))),
    };
  }
 
  update(tiles, player) {
    if (this.dead) return;
    this.aiClock++;
    this._pathClock++;
 
    if (this.type === 'bat') {
      // ── Morcego: vagueia aleatoriamente (sem A*) ─────────
      if (this.aiClock % 35 === 0) {
        this.vx = (Math.random()*2-1) * this.speed;
        this.vy = (Math.random()*2-1) * this.speed;
      }
    } else {
      // ── Slime / Knight: A* para contornar obstáculos ────
      const pdx  = player.x - this.x;
      const pdy  = player.y - this.y;
      const dist = Math.hypot(pdx, pdy);
 
      // Recalcula o caminho a cada ~20 frames (ou quando chegou ao fim)
      const recalcInterval = this.type === 'knight' ? 15 : 20;
      if (this._pathClock >= recalcInterval || this._path.length === 0) {
        this._pathClock = 0;
 
        if (dist < 160) {
          // Dentro do raio de perseguição — usa A*
          const me  = this._tilePos();
          const ptx = Math.max(0, Math.min(CFG.cols-1, ~~((player.x + T/2) / T)));
          const pty = Math.max(0, Math.min(CFG.rows-1, ~~((player.y + T/2) / T)));
          this._path = this.type === 'knight'
            ? AStar.findCardinal(tiles, me.tx, me.ty, ptx, pty)
            : AStar.find(tiles, me.tx, me.ty, ptx, pty);
        } else {
          // Longe demais — vagueia um pouco
          if (this.aiClock % 60 === 0) {
            const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
            const d = dirs[~~(Math.random() * 4)];
            this.vx = d[0] * this.speed;
            this.vy = d[1] * this.speed;
          }
          this._path = [];
        }
      }
 
      // Segue o próximo tile do caminho
      if (this._path.length > 0) {
        const next  = this._path[0];
        const targX = next.tx * T;
        const targY = next.ty * T;
        const ddx   = targX - this.x;
        const ddy   = targY - this.y;
        const dlen  = Math.hypot(ddx, ddy);
 
        // Chega perto do centro do tile-alvo → avança para o próximo
        if (dlen < this.speed + 1) {
          this._path.shift();
          // Snapping suave ao tile quando chega bem perto
          if (dlen < 1) { this.x = targX; this.y = targY; }
        }
 
        if (dlen > 0.5) {
          let spd = this.speed;
          // Carga do knight quando muito próximo
          if (this.type === 'knight' && dist < 48) spd *= 1.25;
          this.vx = (ddx / dlen) * spd;
          this.vy = (ddy / dlen) * spd;
        }
      }
    }
 
    this._move(this.vx, 0, tiles);
    this._move(0, this.vy, tiles);
 
    if (++this.fClock >= 12) { this.frame = 1 - this.frame; this.fClock = 0; }
    if (this.flash > 0) this.flash--;
  }
 
  _move(dx, dy, tiles) {
    if (dx === 0 && dy === 0) return;
 
    // Hitbox de movimento: 2px menor em cada lado vs. hitbox de combate.
    // Isso dá margem suficiente para o slime deslizar por cantos sem travar.
    const MX = 3, MY = 6, MW = 8, MH = 6; // offsets dentro da sprite
 
    const isSolid = (px, py) => {
      const tx = ~~(px / T), ty = ~~(py / T);
      if (tx < 0 || tx >= CFG.cols || ty < 0 || ty >= CFG.rows) return true;
      return SOLID.has(tiles[ty][tx]);
    };
 
    const blocked = (ex, ey) => {
      const l = ex + MX, r = ex + MX + MW - 1;
      const t = ey + MY, b = ey + MY + MH - 1;
      return isSolid(l,t) || isSolid(r,t) || isSolid(l,b) || isSolid(r,b);
    };
 
    const nx = this.x + dx, ny = this.y + dy;
    if (!blocked(nx, ny)) { this.x = nx; this.y = ny; return; }
 
    // Bloqueado — tenta o eixo individual
    if (dx !== 0 && !blocked(nx, this.y)) { this.x = nx; return; }
    if (dy !== 0 && !blocked(this.x, ny)) { this.y = ny; return; }
 
    // Ainda bloqueado num único eixo: micro-snap para escapar de cantos.
    // Verifica se o hitbox está ultrapassando o canto de um tile por menos
    // de SNAP pixels — se sim, alinha e tenta mover de novo.
    const SNAP = 3;
 
    if (dx !== 0) {
      // Movendo em X: verifica se dá para alinhar Y ao grid para escapar do canto
      const ey = this.y + MY;
      const snapUp   = Math.ceil(ey / T) * T - MY;        // alinha borda de cima ao tile acima
      const snapDown = Math.floor(ey / T) * T - MY;       // alinha borda de cima ao tile atual
      for (const sy of [snapUp, snapDown]) {
        if (Math.abs(sy - this.y) <= SNAP && !blocked(nx, sy)) {
          this.y = sy; this.x = nx; return;
        }
      }
    }
 
    if (dy !== 0) {
      // Movendo em Y: verifica se dá para alinhar X ao grid para escapar do canto
      const ex = this.x + MX;
      const snapLeft  = Math.ceil(ex / T) * T - MX;
      const snapRight = Math.floor(ex / T) * T - MX;
      for (const sx of [snapLeft, snapRight]) {
        if (Math.abs(sx - this.x) <= SNAP && !blocked(sx, ny)) {
          this.x = sx; this.y = ny; return;
        }
      }
    }
  }

  hit(dmg) {
    this.hp -= dmg; this.flash = 16;
    if (this.hp <= 0) this.dead = true;
    return this.dead;
  }

  draw() {
    Sprites.drawEnemy(this.type, this.x, this.y, this.hp, this.maxHp, this.frame, this.flash);
  }
}

class Particle {
  constructor(x, y, color) {
    this.color   = color;
    this.x       = x + Math.random()*8 - 4;
    this.y       = y + Math.random()*8 - 4;
    this.vx      = Math.random()*4 - 2;
    this.vy      = Math.random()*4 - 5;
    this.life    = 20 + ~~(Math.random() * 20);
    this.maxLife = this.life;
    this.size    = 2 + Math.random()*3;
  }

  update() { this.x += this.vx; this.y += this.vy; this.vy += 0.22; this.life--; }
  isDead()  { return this.life <= 0; }

  draw() {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = this.color;
    const s = this.size * S;
    ctx.fillRect(px(this.x) - s/2, px(this.y) - s/2, s, s);
    ctx.globalAlpha = 1;
  }
}

// ============================================================
// GAME STATE — variáveis globais do estado atual
// ============================================================
let gameState = 'title'; // 'title' | 'playing' | 'dead' | 'win'
let player    = new Player();
let enemies   = [];
let particles = [];
let screenshake   = 0;
let titleAnim     = 0;

// Sala atual
let roomRow     = 1;
let roomCol     = 1;
let currentRoom = null;
let roomTiles   = null;

// Guarda tiles modificados (baús abertos) para preservar ao voltar à sala
const modifiedTilesCache = new Map();

// Transição de câmera entre salas
let transition = null;
// transition = { dir, prog, speed, oldTiles, newTiles, nextRow, nextCol, px, py }

// ============================================================
// SISTEMA DE SALAS
// ============================================================
const Room = {

  getTiles(row, col) {
    const key = `${row},${col}`;
    return modifiedTilesCache.has(key)
      ? modifiedTilesCache.get(key)
      : worldGrid[row][col].tiles.map(r => [...r]);
  },

  saveTiles(row, col, tiles) {
    modifiedTilesCache.set(`${row},${col}`, tiles);
  },

  enter(row, col, spawnX, spawnY) {
    roomRow     = row;
    roomCol     = col;
    currentRoom = worldGrid[row][col];
    roomTiles   = this.getTiles(row, col);
    enemies     = currentRoom.enemies.map(e => new Enemy(e));
    if (spawnX !== undefined) player.x = spawnX;
    if (spawnY !== undefined) player.y = spawnY;
  },

  /** Verifica se o jogador saiu da tela e inicia transição */
  checkTransition() {
    if (transition) return;
    const b   = player.bounds();
    let nr    = roomRow, nc = roomCol, dir = null;
    let npx   = player.x, npy = player.y;

    const maxRow = worldGrid.length - 1;
    const maxCol = worldGrid[0].length - 1;

    if      (b.x + b.w >= GW   && nc < maxCol) { nc++; dir = 'east';  npx = 2; }
    else if (b.x        <= 0   && nc > 0      ) { nc--; dir = 'west';  npx = GW - T - 4; }
    else if (b.y + b.h >= GH_PLAY && nr < maxRow) { nr++; dir = 'south'; npy = 2; }
    else if (b.y        <= 0   && nr > 0      ) { nr--; dir = 'north'; npy = GH_PLAY - T - 4; }

    if (!dir) return;

    transition = {
      dir, prog: 0, speed: 1/18,
      oldTiles : roomTiles,
      newTiles : this.getTiles(nr, nc),
      nextRow  : nr, nextCol : nc,
      px: npx, py: npy,
    };

    // Atualiza posição do jogador já para a nova sala
    // para ele deslizar junto com a câmera
    player.x = npx;
    player.y = npy;
  },

  updateTransition() {
    if (!transition) return;
    transition.prog += transition.speed;
    if (transition.prog >= 1) {
      this.enter(transition.nextRow, transition.nextCol, transition.px, transition.py);
      transition = null;
    }
  },
};

// ============================================================
// COMBATE E INTERAÇÕES
// ============================================================
const Combat = {

  checkPlayerAttacks() {
    // Só registra o hit no primeiro frame do swing
    if (!player.isAttacking || player.attackTimer !== player.attackDur - 1) return;
    const ab = player.attackBox();
    for (const e of enemies) {
      if (e.dead) continue;
      const eb  = e.bounds();
      const hit = ab.x < eb.x+eb.w && ab.x+ab.w > eb.x &&
                  ab.y < eb.y+eb.h && ab.y+ab.h > eb.y;
      if (hit) {
        const died = e.hit(1);
        this.spawnHitParticles(e.x+8, e.y+8, died);
        if (died) screenshake = 4;
      }
    }
    enemies = enemies.filter(e => !e.dead);
  },

  checkEnemyContact() {
    if (player.hurtTimer > 0) return; // i-frames ativas
    const pb = player.bounds();
    for (const e of enemies) {
      if (!e.dead && e.overlaps(pb)) {
        player.hurt(e.dmg);
        return; // um dano por frame
      }
    }
  },

  checkChestInteraction() {
    const b = player.bounds();
    for (let ty = 0; ty < CFG.rows; ty++) {
      for (let tx = 0; tx < CFG.cols; tx++) {
        if (roomTiles[ty][tx] !== CHEST) continue;
        const cb   = { x: tx*T+3, y: ty*T+5, w: 10, h: 8 };
        const near = b.x < cb.x+cb.w+8 && b.x+b.w > cb.x-8 &&
                     b.y < cb.y+cb.h+8 && b.y+b.h > cb.y-8;
        if (near && Input.action()) {
          this.openChest(tx, ty);
          return;
        }
      }
    }
  },

  openChest(tx, ty) {
    roomTiles[ty][tx] = FLOOR;
    Room.saveTiles(roomRow, roomCol, roomTiles);
    const cx = tx*T + 8, cy = ty*T + 8;

    if (currentRoom.hasCrystal && !currentRoom.crystalCollected) {
      currentRoom.crystalCollected = true;
      player.crystals++;
      for (let i = 0; i < 12; i++) particles.push(new Particle(cx, cy, COLOR.crystalOn));
      for (let i = 0; i <  6; i++) particles.push(new Particle(cx, cy, COLOR.white));
      screenshake = 8;
      if (player.crystals >= 4) setTimeout(() => { gameState = 'win'; }, 1200);
    } else {
      // Baú comum: cura
      player.hp = Math.min(player.maxHp, player.hp + 2);
      for (let i = 0; i < 8; i++) particles.push(new Particle(cx, cy, COLOR.heartFull));
    }
  },

  spawnHitParticles(x, y, death) {
    const col = death ? COLOR.pShield : COLOR.pSword;
    const n   = death ? 8 : 3;
    for (let i = 0; i < n; i++) particles.push(new Particle(x, y, col));
    if (death) for (let i = 0; i < 4; i++) particles.push(new Particle(x, y, COLOR.flowerY));
  },
};

// ============================================================
// RENDERING — salas, entidades, HUD e telas
// ============================================================
const Render = {

  room(tiles, ox, oy) {
    ctx.save();
    ctx.translate(ox * S, oy * S);
    ctx.beginPath();
    ctx.rect(-ox * S, 0, GW * S, GH_PLAY * S);
    ctx.clip();
    for (let r = 0; r < CFG.rows; r++)
      for (let c = 0; c < CFG.cols; c++)
        Tiles.draw(tiles[r][c], c * T, r * T);
    ctx.restore();
  },

  entities(ox, oy) {
    ctx.save();
    ctx.translate(ox * S, oy * S);
    ctx.beginPath();
    ctx.rect(-ox * S, 0, GW * S, GH_PLAY * S);
    ctx.clip();
    // Y-sort para perspectiva correta (entidades mais ao sul por cima)
    [...enemies, player].sort((a, b) => a.y - b.y).forEach(e => e.draw());
    ctx.restore();
  },

  hud() {
    const hy = GH_PLAY;
    ctx.fillStyle = COLOR.hudBg;
    ctx.fillRect(0, hy * S, GW * S, CFG.hudHeight * S);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, hy * S, GW * S, S);

    // Corações
    const hearts   = Math.ceil(player.maxHp / 2);
    const hpHalves = player.hp;
    for (let i = 0; i < hearts; i++) {
      const hx     = GW - 4 - (hearts - i) * 9;
      const filled = Math.max(0, hpHalves - i * 2);
      Sprites.drawHeart(hx, hy + 5, 7, filled);
    }

    // Cristais
    for (let i = 0; i < player.crystalMax; i++)
      Sprites.drawCrystalIcon(4 + i * 10, hy + 4, i < player.crystals);

    // Nome da sala
    ctx.fillStyle  = 'rgba(232,220,168,0.55)';
    ctx.font       = `bold ${4 * S}px 'Courier New'`;
    ctx.textAlign  = 'center';
    ctx.fillText(currentRoom?.name ?? '', GW * S / 2, (hy + 10) * S);
  },

  titleScreen() {
    const grd = ctx.createLinearGradient(0, 0, 0, GH * S);
    grd.addColorStop(0, '#0e0820');
    grd.addColorStop(1, '#1a102e');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, GW * S, GH * S);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#c0e8ff';
    ctx.font      = `bold ${11 * S}px 'Courier New'`;
    ctx.fillText('CRYSTAL', GW * S / 2, 32 * S);
    ctx.fillStyle = '#f0d860';
    ctx.fillText('QUEST',   GW * S / 2, 46 * S);

    ctx.fillStyle = 'rgba(200,240,200,0.8)';
    ctx.font      = `${5 * S}px 'Courier New'`;
    ctx.fillText('Encontre os 4 Cristais', GW * S / 2, 67 * S);
    ctx.fillText('e salve o reino!',       GW * S / 2, 75 * S);

    if (Math.floor(titleAnim / 20) % 2 === 0) {
      ctx.fillStyle = COLOR.hudText;
      ctx.font      = `bold ${6 * S}px 'Courier New'`;
      ctx.fillText('[ Z ou SPACE ]', GW * S / 2, 95 * S);
    }

    ctx.fillStyle = 'rgba(200,240,200,0.8)';
    ctx.font      = `${4 * S}px 'Courier New'`;
    ctx.fillText('Setas: Mover  ·  Z/Space: Atacar/Abrir', GW * S / 2, 112 * S);
    ctx.fillText('Baú adjacente + Z = Abrir',              GW * S / 2, 120 * S);

    titleAnim++;
  },

  gameOverScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, GW * S, GH * S);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff3030';
    ctx.font      = `bold ${12 * S}px 'Courier New'`;
    ctx.fillText('GAME OVER', GW * S / 2, 56 * S);

    ctx.fillStyle = '#80dfff';
    ctx.font      = `${6 * S}px 'Courier New'`;
    ctx.fillText(`Cristais: ${player.crystals} / 4`, GW * S / 2, 76 * S);

    ctx.fillStyle = COLOR.hudText;
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.font = `bold ${6 * S}px 'Courier New'`;
      ctx.fillText('[ Z para Recomeçar ]', GW * S / 2, 96 * S);
    }
  },

  winScreen() {
    const t = Date.now() / 1000;
    const grd = ctx.createLinearGradient(0, 0, GW * S, GH * S);
    grd.addColorStop(0,   '#001840');
    grd.addColorStop(0.5, '#002860');
    grd.addColorStop(1,   '#001840');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, GW * S, GH * S);

    ctx.textAlign   = 'center';
    ctx.fillStyle   = '#f0d040';
    ctx.font        = `bold ${9 * S}px 'Courier New'`;
    ctx.shadowColor = '#f0d040';
    ctx.shadowBlur  = 20;
    ctx.fillText('VITÓRIA!', GW * S / 2, 32 * S);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = '#80dfff';
    ctx.font      = `${5 * S}px 'Courier New'`;
    ctx.fillText('Todos os cristais foram', GW * S / 2, 50 * S);
    ctx.fillText('encontrados!',            GW * S / 2, 58 * S);

    for (let i = 0; i < 4; i++)
      Sprites.drawCrystalIcon(GW/2 - 22 + i*12, 75, true);

    ctx.fillStyle = COLOR.hudText;
    ctx.font      = `${5 * S}px 'Courier New'`;
    ctx.fillText('O reino está salvo!', GW * S / 2, 104 * S);

    if (Math.floor(t * 2) % 2 === 0) {
      ctx.font = `bold ${5 * S}px 'Courier New'`;
      ctx.fillText('[ Z para jogar de novo ]', GW * S / 2, 116 * S);
    }
  },
};

// ============================================================
// LOOP PRINCIPAL
// ============================================================
function resetGame() {
  player = new Player();
  modifiedTilesCache.clear();
  for (let r = 0; r < worldGrid.length; r++)
    for (let c = 0; c < worldGrid[r].length; c++)
      worldGrid[r][c].crystalCollected = false;
  particles  = [];
  screenshake= 0;
  Room.enter(1, 1);
  gameState  = 'playing';
}

function update() {
  // Telas de menu — qualquer tecla de ação reinicia/começa
  if (gameState !== 'playing') {
    if (Input.action()) resetGame();
    return;
  }

  if (transition) {
    Room.updateTransition();
    return; // bloqueia input durante transição de sala
  }

  // Baú tem prioridade: checa ANTES de player.update consumir a tecla
  Combat.checkChestInteraction();

  player.update(roomTiles);
  if (player.hp <= 0) { gameState = 'dead'; return; }

  enemies.forEach(e => e.update(roomTiles, player));
  enemies = enemies.filter(e => !e.dead || e.flash > 0);

  Combat.checkPlayerAttacks();
  Combat.checkEnemyContact();
  Room.checkTransition();

  particles.forEach(p => p.update());
  particles = particles.filter(p => !p.isDead());

  if (screenshake > 0) screenshake--;
}

function render() {
  ctx.save();

  if (screenshake > 0 && gameState === 'playing') {
    ctx.translate(
      (Math.random()*4 - 2) * S,
      (Math.random()*4 - 2) * S
    );
  }

  // ── Tela de título ─────────────────────────────────────
  if (gameState === 'title') {
    Render.titleScreen();
    ctx.restore();
    return;
  }

  // ── Fundo ──────────────────────────────────────────────
  ctx.fillStyle = '#0a0614';
  ctx.fillRect(0, 0, GW * S, GH * S);

  // ── Sala(s): durante transição desenha as duas ─────────
  if (transition) {
    const p = transition.prog;
    let ox = 0, oy = 0, nrx = 0, nry = 0;
    switch (transition.dir) {
      case 'east':  ox = -p*GW;       nrx =  GW*(1-p);       break;
      case 'west':  ox =  p*GW;       nrx = -GW*(1-p);       break;
      case 'south': oy = -p*GH_PLAY;  nry =  GH_PLAY*(1-p);  break;
      case 'north': oy =  p*GH_PLAY;  nry = -GH_PLAY*(1-p);  break;
    }
    Render.room(transition.oldTiles, ox, oy);
    Render.room(transition.newTiles, nrx, nry);

    // Jogador desliza com a nova sala
    ctx.save();
    ctx.translate(nrx * S, nry * S);
    ctx.beginPath();
    ctx.rect(-nrx * S, 0, GW * S, GH_PLAY * S);
    ctx.clip();
    player.draw();
    ctx.restore();
  } else {
    Render.room(roomTiles, 0, 0);
    Render.entities(0, 0);
    particles.forEach(p => p.draw());
  }

  // ── HUD ────────────────────────────────────────────────
  if (gameState === 'playing' || gameState === 'dead') Render.hud();

  // ── Overlays ───────────────────────────────────────────
  if (gameState === 'dead') Render.gameOverScreen();
  if (gameState === 'win')  Render.winScreen();

  ctx.restore();
}

// ============================================================
// BOOTSTRAP
// ============================================================
Room.enter(1, 1);
gameState = 'title';

let lastTimestamp = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  if (ts - lastTimestamp < 1000 / CFG.fpsCap) return;
  lastTimestamp = ts;
  update();
  render();
  Input.clearJust();
}

// Simula um pequeno delay para garantir que tudo está pronto
setTimeout(() => {
  canvas.style.display = 'block';
  requestAnimationFrame(loop);
}, 100);