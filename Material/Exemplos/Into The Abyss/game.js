// ─── CANVAS & CONTEXT ──────────────────────────────────────────────────────
const canvas    = document.getElementById('game');
let ctx         = canvas.getContext('2d');
const mmCanvas  = document.getElementById('minimap');
const mmCtx     = mmCanvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const TILE       = 32;
const GRAVITY    = 0.55;
const MAX_FALL   = 14;
const PLAYER_SPD = 3.2;
const JUMP_FORCE = -11;
const LADDER_SPD = 2.5; 

// ─── SHIELD CONSTANTS ──────────────────────────────────────────────────────
const SHIELD_MANA_COST  = 30;   // mana consumida ao ativar
const SHIELD_MAX_HP     = 3;    // golpes que o escudo aguenta
const SHIELD_COOLDOWN   = 6.0;  // segundos de cooldown após quebrar

// ─── TILE TYPES ────────────────────────────────────────────────────────────
const T = {
  AIR:    0,
  SOLID:  1,  // basic wall/floor
  SPIKE:  2,  // kills player
  LADDER: 3,
  PLAT:   4,  // one-way platform
  WALL:  5,
  DOOR_R: 6,  // transition right
  DOOR_L: 7,
  DOOR_U: 8,
  DOOR_D: 9,
  BRICK:  10, // dungeon brick (solid, different look)
  GRASS:  11, // grass on top of dirt
  DIRT:   12, // earth/soil block
  DARK:   13, // dark stone with purple veins
  BREAK:  14, // breakable block (destroyed on attack)
  CRUMBLE:15,
  HEX: 16,
  CHESS: 17,
  PILLAR: 18,
  IRON_GATE: 19,
  VOID_STONE: 20,
  CRATE: 21,
  WOOD_PLANKS: 22,
  FENCE: 23,
  MOSAIC: 24,
  AZULEJO: 25,
  OBSIDIAN: 26,
  DEAD_GRASS: 27,
  DUNGEON_FLOOR: 28,
  ECHO_PILLAR: 29,
  BRICK_COBBLE: 30,
  OBSIDIAN_BRICK: 31,
  DARK_DIRT: 32,
  DARK_ENERGY: 33,
  MYSTIC_STONE: 34,
};

// ─── COLOR PALETTE ─────────────────────────────────────────────────────────
const PALETTE = {
  bg:       '#0a0a0f',
  solid:    '#1a1a2e',
  solidEdge:'#2a2a4e',
  spike:    '#664f22',
  ladder:   '#3d2b1f',
  platform: '#2a2a3e',
  door:     '#1a3a1a',
  doorEdge: '#2a6a2a',
  brick:    '#2a1a10',
  brickEdge:'#5a3a20',
  brickMortar:'#150d08',
  grass:    '#1a3a0a',
  grassTop: '#2a6a10',
  grassHighlight: '#3a8a18',
  dirt:     '#3a2010',
  dirtEdge: '#5a3018',
  dark:     '#0d0010',
  darkVein: '#3a0050',
  darkShine:'#1a0030',
  breakFull:'#3a2a1a',
  breakEdge:'#7a5a3a',
  breakCrack:'#1a1008',
  crumbleFull:'#263545',
  crumbleEdge:'#4a8aaa',
  crumbleShine:'#6ab0d0',
  crumbleCrack:'#0e1a22',
  mosaicBg:    '#080010',
  mosaicA:     '#1a0030',
  mosaicB:     '#0a0020',
  mosaicC:     '#220040',
  mosaicD:     '#2a004a',
  mosaicGrout: '#050008',
  mosaicShine: '#5500aa',
  mosaicGlow:  '#330066',
  azulejoBg:   '#060a12',
  azulejoBase: '#0c1828',
  azulejoEdge: '#1a3050',
  azulejoLine: '#0a1e38',
  azulejoHi:   '#1e4070',
  azulejoDim:  '#081020',
  azulejoGold: '#1a1408',
  azulejoGoldHi: '#2e2410',
  obsidianBase:  '#050508',
  obsidianDeep:  '#020204',
  obsidianSheen: '#0d0d18',
  obsidianGlass: '#12101e',
  obsidianEdge:  '#1a1830',
  obsidianHiCold:'#2a2850',
  obsidianHiWarm:'#1e1428',
  obsidianVein:  '#08060f',
  deadGrassDirt:  '#1a1008',
  deadGrassDirtHi:'#2a1a0e',
  deadGrassBase:  '#2e1e0a',
  deadGrassDark:  '#120c04',
  deadStalkA:     '#3a2a0e',
  deadStalkB:     '#4a3612',
  deadStalkC:     '#5c4418',
  deadStalkTip:   '#2a1e08',
  deadCharA:      '#1e1608',
  deadCharB:      '#28200c',
  deadAshA:       '#2e2e2e',
  deadAshB:       '#222222',
  obsidBrickBase:   '#0c0a12', // corpo do tijolo — negro arroxeado
  obsidBrickLit:    '#121020', // tijolo levemente mais claro (variação)
  obsidBrickDeep:   '#06050c', // interior mais fundo — profundidade do vidro
  obsidBrickMortar: '#020107', // rejunte — quase preto, mais escuro que o tijolo
  obsidBrickEdge:   '#201d3c', // aresta superior/esquerda — frida e roxa
  obsidBrickSheen:  '#1c193a', // reflexo frio em alguns tijolos
};

// ─── MAP DEFINITIONS ───────────────────────────────────────────────────────
// Each map: { id, name, cols, rows, tiles[], enemies[], spawnX, spawnY }
// Connections are declared via connectMaps() after all maps are defined.

// Conecta dois mapas vizinhos de forma bidirecional.
// Cuida de: connections, doors e tiles visuais — em uma só chamada.
//
// connectMaps(mapA, 'right', mapB, [6, 8])
//   → mapA.right = mapB  e  mapB.left = mapA
//   → abre a porta nas linhas 6-8 da parede direita de A e esquerda de B
//
// Para conexões verticais use 'down'/'up'; rows é o intervalo de colunas.
function connectMaps(mapA, dirA, mapB, range) {
  const opposite = { right: 'left', left: 'right', down: 'up', up: 'down' };
  const dirB     = opposite[dirA];

  // 1. Connections
  if (!mapA.connections) mapA.connections = {};
  if (!mapB.connections) mapB.connections = {};
  mapA.connections[dirA] = mapB.id;
  mapB.connections[dirB] = mapA.id;

  // 2. Doors
  if (!mapA.doors) mapA.doors = {};
  if (!mapB.doors) mapB.doors = {};
  mapA.doors[dirA] = range;
  mapB.doors[dirB] = range;

  // 3. Tiles visuais na borda
  const doorTileA = { right: T.DOOR_R, left: T.DOOR_L, down: T.DOOR_D, up: T.DOOR_U };
  const doorTileB = { right: T.DOOR_L, left: T.DOOR_R, down: T.DOOR_U, up: T.DOOR_D };
  const paintBorder = (map, dir, r) => {
    const isHoriz = dir === 'right' || dir === 'left';
    const edgeCol = dir === 'right' ? map.cols - 1 : dir === 'left' ? 0 : null;
    const edgeRow = dir === 'down'  ? map.rows - 1 : dir === 'up'   ? 0 : null;
    for (let i = r[0]; i <= r[1]; i++) {
      const idx = isHoriz
        ? i * map.cols + edgeCol
        : edgeRow * map.cols + i;
      map.tiles[idx] = isHoriz ? doorTileA[dir] : (dir === 'down' ? T.DOOR_D : T.DOOR_U);
    }
  };
  paintBorder(mapA, dirA, range);
  // Para mapB, o tile visual é o oposto
  const paintBorderB = (map, dir, r) => {
    const isHoriz = dir === 'right' || dir === 'left';
    const edgeCol = dir === 'right' ? map.cols - 1 : dir === 'left' ? 0 : null;
    const edgeRow = dir === 'down'  ? map.rows - 1 : dir === 'up'   ? 0 : null;
    const tileType = doorTileB[dirA]; // tile visual do lado B
    for (let i = r[0]; i <= r[1]; i++) {
      const idx = isHoriz
        ? i * map.cols + edgeCol
        : edgeRow * map.cols + i;
      map.tiles[idx] = tileType;
    }
  };
  paintBorderB(mapB, dirB, range);
}

// Map 0 – The Crypt (starting area)
const MAP_CRYPT = {
  id: 0,
  name: 'A CRIPTA',
  cols: 25,
  rows: 15,
  tiles: parseTiles(
    '5555555555555555555555555' +
    '50000000i000000i000000005' +
    '50000000i000000i000000005' +
    '5000jjj0i000000i000000005' +
    '5sss444sss00000i0000ssss5' +
    '50000000i0000ssss00000005' +
    '50000000i000000i0000jjjj5' +
    '500000sssss0000i0000ssss5' +
    '50000000i000000i000000005' +
    '5sss0000i0000sssss0000005' +
    '50000000i000000i00s000005' +
    '500000sssss0000i000000005' +
    '50000000i000000i000000ss5' +
    '50000000i000000i0jjjssss5' +
    '5555555555555555555555555'
  ),
  spawnX: 3,  spawnY: 14,
  crumbleBridge: true,
  enemies: [
    { type: 'WALKER', tx: 18, ty: 14 },
    { type: 'WALKER', tx: 7, ty: 8 },
    { type: 'WALKER', tx: 7, ty: 11 },
    { type: 'FLIER',  tx: 15, ty:  3 },
    { type: 'GUNNER', tx: 22, ty: 7 },
    { type: 'GUNNER', tx: 22, ty: 4 },
    { type: 'GUNNER', tx: 2, ty: 4 },
  ],
  candles: [
    { tx: 2, ty: 13 }, { tx: 2, ty: 8 }, { tx: 14, ty: 4 }, 
    { tx: 1, ty: 3 }, { tx: 23, ty: 3 },
  ],
  gravestones: [
    { tx: 10, ty: 13 },
    { tx: 5, ty: 13 },
  ],
  arrowTraps: [
    { tx: 24, ty: 6,  dir: 'left',  range: 220 },  // parede direita
    { tx:  0, ty: 3, dir: 'right', range: 180 },  // parede esquerda, andar baixo
    { tx:  7, ty: 0, dir: 'down', range: 180 },
    { tx:  5, ty: 14, dir: 'up', range: 180 },
  ],
  npcs: [
    {
      tx: 16, ty: 8,
      name: 'Guardião da Cripta',
      drawFn: drawNpcGuardian,
      lines: [
        'Eu guardei esta cripta por séculos.',
        'Meu corpo já não existe. Só o dever permanece.',
      ]
    }
  ],
  stars: [{ tx: 22, ty: 3 }, { tx: 2, ty: 3 }],
};

// Map 1 – The Abyss (right of crypt)
const MAP_ABYSS = {
  id: 1,
  name: 'O ABISMO',
  cols: 25,
  rows: 15,
  // prettier-ignore
  tiles: parseTiles(
    'ddddddddddddddddddddddddd' +
    'do0000000000000000000000d' +
    'do0000000000000000000000d' +
    'doooo000000ooo000000ooood' +
    'd00000000000000000oo0000d' +
    'd00000000000000000000000d' +
    'd000ooooo000oooo00000000d' +
    'd0000000000000000000ooood' +
    'd00000000000000000000000d' +
    'doooooo00000000ooo000000d' +
    'd00000000000000000000000d' +
    'd00000000ooooo00000oooood' +
    'doooo0000000000000000000d' +
    'dooooo000000000000000000d' +
    'ddddddddddddddddddddddddd'
  ),
  spawnX: 3,  spawnY: 11,
  enemies: [
    { type: 'SPECTER', tx: 10, ty: 14 },
    { type: 'SPECTER', tx: 10, ty: 11 },
    { type: 'SPECTER', tx: 12, ty: 6 },
    { type: 'SPECTER', tx: 5, ty: 6 },
    { type: 'SPECTER', tx: 21, ty: 3 },
    { type: 'SPECTER', tx: 3, ty: 3 },
    { type: 'SPECTER', tx: 4, ty: 9 },
    { type: 'SPECTER', tx: 21, ty: 11 },
  ],
  mushrooms: [
    { tx: 20,  ty: 13, color: '#7722ee', scale: 1.2 },
    { tx: 9,  ty: 13, color: '#2255ff', scale: 1.7 },
    { tx: 4,  ty: 8, color: '#aa33ff', scale: 1.3 },
    { tx: 7,  ty: 5, color: '#3366ff', scale: 1.4 },
    { tx: 14,  ty: 5, color: '#6611cc', scale: 1.5 },
    { tx: 20,  ty: 2, color: '#4433ff', scale: 1.6 },
    { tx: 3,  ty: 2, color: '#7722ee', scale: 1.1 },
    { tx: 21,  ty: 10, color: '#2255ff', scale: 1.8 },
    { tx: 12,  ty: 10, color: '#aa33ff', scale: 1.3 },
  ],
  npcs: [
    {
      tx: 12, ty: 2,
      name: 'Cogumelo',
      drawFn: drawNpcMushroom,
      lines: [
        'Oi! Você é novo aqui? Eu adoro gente nova!',
        'Essa caverna é minha casa faz... hmm. Muito tempo. Perdi a conta.',
        'As pedras cantam à noite, sabia? A maioria não consegue ouvir.',
        'Os espectros estão desconectados da natureza, suas almas estão agitadas...',
      ]
    }
  ],
  stars: [{ tx: 23, ty: 2 }, { tx: 2, ty: 2 }],
  potion: { tx: 23, ty: 6 },
};

// Map 2 – Underground (below crypt)
const MAP_UNDERGROUND = {
  id: 2,
  name: 'CATACUMBAS',
  cols: 25,
  rows: 15,
  // prettier-ignore
  tiles: parseTiles(
    'wwwwwwwwwwwwwwwwwwwwwwwww' +
    'w00000000000000000000mmmw' +
    'w00000000000000000000mmmw' +
    'w00000000000nnn000000mmmw' +
    'wrrrr000000rrrrr00000rrrw' +
    'w00000000rr00000r0000000w' +
    'w0000000000000000rr00000w' +
    'w0000rr00000000000000000w' +
    'w00rr00000000000nnn00000w' +
    'w00000000rrrrrrr444rrrrrw' +
    'w00000000000000000000000w' +
    'wrrrrr000000000000000000w' +
    'wmmmmm00000000000000000rw' +
    'wmmmmm000000000000000rrww' +
    'wrrrrrrrrrrrrrrrrrrrrwwww'
  ),
  spawnX: 12,
  spawnY: 3,
  enemies: [
    { type: 'MIMIC',  tx:  3, ty: 14 },
    { type: 'MIMIC',  tx:  10, ty: 14 },
    { type: 'VOID_CASTER',  tx:  22, ty: 4 },
    { type: 'VOID_CASTER',  tx:  2, ty: 4 },
    { type: 'REVENANT', tx: 18, ty: 14 },
    { type: 'REVENANT', tx:  12, ty:  9 },
    { type: 'REVENANT', tx:  19, ty:  9 },
    { type: 'REVENANT', tx: 4, ty:  14 },
    { type: 'BOMBER', tx: 4, ty:  11 },
    { type: 'BOMBER', tx: 14, ty:  4 },
  ],
  woodenCrosses: [
    { tx: 12, ty: 13 },
    { tx: 19, ty: 13 },
    { tx: 14, ty: 8 },
    { tx: 22, ty: 8 },
    { tx: 3, ty: 10 },
  ],
  coffins: [
    { tx: 15, ty: 13 },
    { tx: 11, ty: 8 },
    { tx: 3, ty: 3 },
  ],
  npcs: [
    {
      tx: 5, ty: 6,
      name: 'Acólito',
      drawFn: drawNpcAcolyte,
      lines: [
        'A ordem me enviou para catalogar os ecos. Já faz semanas.',
        'Cada câmara ressoa diferente. Como se as salas respirassem.',
        'Este tomo já tem mais páginas do que quando cheguei. Escreve sozinho à noite.',
        'Não me pergunte se tenho medo. Me pergunte se ainda importa.',
      ]
    }
  ],
  stars: [{ tx: 1, ty: 13 }],
  orb: { tx: 4, ty: 7, destMap: 8, destTx: 9, destTy: 13 },
};

// Map 3 – The Depths (right of underground / below abyss)
const MAP_DEPTHS = {
  id: 3,
  name: 'AS PROFUNDEZAS',
  cols: 25,
  rows: 15,
  // prettier-ignore
  tiles: parseTiles(
    'qqqqqqqqqqqqqqqqqqqqqqqqq' +
    'q00000000000000000000000q' +
    'q00000000000000000000000q' +
    'qvvv00000000vvvvvvvvvvvvq' +
    'q00000000000000000000000q' +
    'q00000vvvv00000000000000q' +
    'q00000000000000000000000q' +
    'qvvv000000000vvvvvvvvvvvq' +
    'q00000000000000000000000q' +
    'q00000vvvv00000000000000q' +
    'q000000000v0000000000000q' +
    'q0000000000000vvvvvvv000q' +
    'qvvv00000000000000000000q' +
    'qvvvv0000000000000000000q' +
    'qqqqqqqqqqqqqqqqqqqqqqqqq'
  ),
  spawnX: 3,
  spawnY: 7,
  enemies: [
    { type: 'SUMMONER', tx: 18, ty: 14 },
    { type: 'SUMMONER', tx: 21, ty: 6 },
    { type: 'SUMMONER', tx: 10, ty: 14 },
    { type: 'SUMMONER', tx: 16, ty: 2 },
    { type: 'VOID_CASTER', tx: 3, ty:  3 },
    { type: 'VOID_CASTER', tx: 3, ty:  6 },
    { type: 'VOID_CASTER', tx: 3, ty: 13 },
    { type: 'VOID_CASTER', tx: 18, ty: 11 },
  ],
  gravestones2: [
    { tx: 7, ty: 13 },
    { tx: 17, ty: 13 },
    { tx: 21, ty: 6 },
  ],
  urns: [
    { tx: 15, ty: 6 },
    { tx: 8, ty: 4 },
  ],
  candles: [
    { tx: 2, ty: 11 },
    { tx: 2, ty: 6 },
    { tx: 2, ty: 2 },
    { tx: 12, ty: 2 },
    { tx: 15, ty: 2 },
    { tx: 18, ty: 2 },
    { tx: 21, ty: 2 },
  ],
  npcs: [
    {
      tx: 15, ty: 10,
      name: 'Gárgula',
      drawFn: drawNpcGargoyle,
      lines: [
        '...',
        'Você ainda está vivo. Interessante.',
        'Guardei esta masmorra há mais tempo do que sua linhagem existe.',
        'Não me pergunte o que há além. Algumas respostas pesam mais do que pedra.',
      ]
    }
  ],
  stars: [{ tx: 1, ty: 2 }, { tx: 21, ty: 13 }, { tx: 23, ty: 6 }],
  manaPotion: { tx: 7, ty: 8 },
};

const ALL_MAPS = [MAP_CRYPT, MAP_ABYSS, MAP_UNDERGROUND, MAP_DEPTHS];

// ── MAP 4 — Santuário Corrompido ───────────────────────────────────────────
const MAP_SANCTUARY = {
  id: 4,
  name: 'SANTUÁRIO CORROMPIDO',
  cols: 25,
  rows: 15,
  // prettier-ignore
  tiles: parseTiles(
    'ccccccccccccccccccccccccc' +
    'c00000000000000000000000c' +
    'c0nnn0000000000000000000c' +
    'cbbbbb000000000000000bbbc' +
    'c000000000000bbbbbbbb000c' +
    'c00000000000000000000000c' +
    'c000000bbbb0000000000000c' +
    'c00000000000000000000000c' +
    'cbbb000000000000bbb00000c' +
    'c00000000000bbbb00000000c' +
    'c00000000bbb0000000000bbc' +
    'cbbbbb00000000000000bb00c' +
    'c0000e00000000000000e000c' +
    'c0000e0000000nn00000e000c' +
    'cbbbbbbbbbbbbbbbbbbbbbbbc'
  ),
  spawnX: 3, spawnY: 2,
  enemies: [
    { type: 'JUMPER',  tx:  2, ty: 14 },
    { type: 'JUMPER',  tx:  10, ty: 14 },
    { type: 'JUMPER',  tx:  19, ty: 14 },
    { type: 'JUMPER',  tx:  14, ty: 14 },
    { type: 'JUMPER',  tx: 14, ty: 5 },
    { type: 'JUMPER',  tx: 18, ty: 5 },
    { type: 'JUMPER',  tx:  14, ty: 10 },
    { type: 'DASHER',  tx:  3, ty: 12 },
    { type: 'DASHER',  tx:  3, ty: 4 },
    { type: 'FLIER',  tx:  13, ty: 3 },
    { type: 'FLIER',  tx:  21, ty: 8 },
  ],
  pines: [
    { tx: 13, ty: 8 },
    { tx: 15, ty: 13 },
    { tx: 8, ty: 13 },
    { tx: 8, ty: 5 },
  ],
  leafBushes: [
    { tx: 17, ty: 3 },
    { tx: 15, ty: 3 },
    { tx: 4, ty: 10 },
    { tx: 2, ty: 13 },
  ],
  trees: [
    { tx: 11, ty: 13 },
    { tx: 2, ty: 7 },
  ],
  skullPedestals: [
    { tx: 10, ty: 9, eyeColor: '#aa44ff' },
  ],
  slenderTrees: [
    { tx: 21, ty: 10 },
    { tx: 9, ty: 5 },
  ],
  flowers: [
    { tx: 2, ty: 10 },
    { tx: 19, ty: 3 },
    { tx: 9, ty: 13 },
  ],
  violets: [
    { tx: 17, ty: 7 },
    { tx: 3, ty: 13 },
    { tx: 21, ty: 13 },
  ],
  retractableSpikes: [
    { tx: 21, ty: 3, period: 4.0, standTime: 2.0, retractTime: 6.0,  offset: 0.25},
    { tx: 17, ty: 14, period: 3.5, standTime: 3.0, retractTime: 5.0,  offset: 1},
    { tx: 22, ty: 14, period: 3.5, standTime: 3.0, retractTime: 7.0, offset: 1 },
  ],
  npcs: [
    {
      tx: 16, ty: 7,
      name: 'Monge Silente',
      drawFn: drawNpcMonk,
      lines: [
        '...',
        'Você interrompeu minha oração. Mas tudo acontece por uma razão.',
        'Este lugar guarda um silêncio que poucos conseguem ouvir.',
        'Continue seu caminho. Os ecos irão guiá-lo.',
      ]
    }
  ],
  stars: [{ tx: 1, ty: 13 }, { tx: 23, ty: 9 }],
  speedBoost: { tx: 23, ty: 13 },
};

// ── MAP 5 — O Vazio ────────────────────────────────────────────────────────
const MAP_VOID = {
  id: 5,
  name: 'O VAZIO',
  cols: 25,
  rows: 15,
  // prettier-ignore
  tiles: parseTiles(
    'ggggggggggggggggggggggggg' +
    'g00000000000000000000000g' +
    'g00000000000000000000000g' +
    'g44440000044400000000000g' +
    'g000000000000000000kkkkkg' +
    'gkkkkk000000000000000000g' +
    'g000000000kkkkk000000000g' +
    'g00000000ggggggg00000000g' +
    'gkkkkkk000kkkkk000kkkkkkg' +
    'g00000000000000000000000g' +
    'g00000000000000000000000g' +
    'gkkkkkk44444444444kkkkkkg' +
    'g00000000000000000000000g' +
    'g00000000000000000000000g' +
    'ggggggggggggggggggggggggg'
  ),
  spawnX: 12, spawnY: 3,
  enemies: [
    { type: 'EYE_OF_VOID', tx:  5, ty:  6 },
    { type: 'EYE_OF_VOID', tx: 19, ty:  6 },
    { type: 'EYE_OF_VOID', tx: 5, ty: 11 },
    { type: 'EYE_OF_VOID', tx: 19, ty: 11 },
    { type: 'EYE_OF_VOID', tx: 13, ty: 13 },
    { type: 'EYE_OF_VOID', tx: 13, ty: 4 },
    { type: 'GHOST', tx: 3, ty: 14 },
    { type: 'GHOST', tx: 22, ty: 14 },
    { type: 'GHOST', tx: 3, ty: 3 },
    { type: 'GHOST', tx: 3, ty: 8 },
    { type: 'GHOST', tx: 20, ty: 3 },
    { type: 'GHOST', tx: 20, ty: 7 },
  ],
  energyOrbs: [
    { tx:  12, ty:  5, color: '#6633ff' },  // plataforma topo-esquerda
    { tx: 21, ty:  7, color: '#3366ff' },  // plataforma topo-direita
    { tx: 12, ty: 13, color: '#8833ff' },  // plataforma central (row 11)
    { tx:  8, ty: 13, color: '#4455ff' },  // chão — esquerda
    { tx: 16, ty: 13, color: '#5533ff' },  // chão — direita
  ],
  magicEyes: [
    { tx:  8, ty:  4, color: '#aa33ff' },
    { tx: 21, ty:  2, color: '#5533ee' },
    { tx: 16, ty:  4, color: '#6644ff' },
    { tx:  8, ty: 9, color: '#cc44ff' },
    { tx: 16, ty: 9, color: '#4422dd' },
  ],
  hexagrams: [
    { tx:  3, ty:  6.5, color: '#aa22ff', size: 18 },
    { tx: 3, ty:  9.5, color: '#5544ff', size: 22 },
    { tx: 3, ty:  12.65, color: '#5544ff', size: 22 },
    { tx:  3, ty: 3.6, color: '#cc33ee', size: 16 },
    { tx: 20, ty:  9.5, color: '#3322dd', size: 22 },
    { tx: 17, ty:  5.8, color: '#aa22ff', size: 24 },
    { tx: 20, ty:  12.55, color: '#8833ff', size: 22 },
  ],
  npcs: [
    {
      tx: 13, ty: 5,
      name: 'Espectro',
      drawFn: drawNpcSpecter,
      lines: [
        'Você consegue me ver? Poucos ainda conseguem.',
        'Eu habitei este corpo há muito tempo. Agora habito o espaço entre as pedras.',
        'A Câmara não deixa ninguém partir completamente. Isso é uma maldição... ou um privilégio.',
        'Não sei mais distinguir as duas coisas.',
      ]
    }
  ],
  stars: [{ tx: 1, ty: 2 }, { tx: 23, ty: 10 }],
};

// ── MAP 6 — A Forja Maldita ────────────────────────────────────────────────
const MAP_SINGULARITY = {
  id: 6,
  name: 'SINGULARIDADE MISTERIOSA',
  cols: 25,
  rows: 15,
  // prettier-ignore
  tiles: parseTiles(
    'xxxxxxxxxxxxxxxxxxxxxxxxx' +
    'x00000000000000000000000x' +
    'x00000000000000000000000x' +
    'x00004440000000000000000x' +
    'x000000000000000000fffyyx' +
    'xyyyy000fffff00440000000x' +
    'x00000000000000000000000x' +
    'x00000000000000000000000x' +
    'x000yyyy000000yyyy0000yyx' +
    'x00000000000000000000000x' +
    'x00000000000000000000000x' +
    'xyyyyy000fffff0000yyyyyyx' +
    'x00000000000000000000000x' +
    'x00000000000000000000000x' +
    'xxxxxxxxxxxxxxxxxxxxxxxxx'
  ),
  spawnX: 21, spawnY: 7,
  enemies: [
    { type: 'VOID_SPECTER', tx:  2, ty:  2 },
    { type: 'VOID_SPECTER', tx: 21, ty:  2 },
    { type: 'VOID_SPECTER', tx: 20, ty:  8 },
    { type: 'VOID_SPECTER', tx: 10, ty:  9 },
    { type: 'VOID_SPECTER', tx: 3, ty:  9 },
    { type: 'CHAIN_SPECTER', tx: 12, ty: 14 },
    { type: 'CHAIN_SPECTER', tx: 20, ty: 14 },
    { type: 'CHAIN_SPECTER', tx: 2, ty: 14 },
    { type: 'CHAIN_SPECTER', tx: 22, ty: 11 },
    { type: 'CHAIN_SPECTER', tx: 10, ty: 5 },
    { type: 'CHAIN_SPECTER', tx: 23, ty: 4 },
    { type: 'VOID_TENDRIL',  tx:  6, ty: 14 },
    { type: 'VOID_TENDRIL',  tx: 13, ty: 14 },
    { type: 'VOID_TENDRIL',  tx:  5, ty:  8 },
    { type: 'VOID_TENDRIL',  tx: 19, ty: 11 },
    { type: 'VOID_TENDRIL',  tx: 4, ty: 11 },
  ],
  voidCrystals: [
    { tx:  3, ty: 13, count: 3, scale: 1.1 },
    { tx:  8, ty: 13, count: 2, scale: 0.9 },
    { tx: 16, ty: 13, count: 3, scale: 1.2 },
    { tx: 20, ty: 13, count: 2, scale: 1.0 },
    { tx:  3, ty:  4, count: 2, scale: 0.85 },
    { tx: 11, ty: 13, count: 3, scale: 1.05 },
    { tx: 16, ty:  7, count: 2, scale: 0.80 },
    { tx:  3, ty: 10, count: 2, scale: 0.95 },
    { tx: 21, ty: 10, count: 3, scale: 1.15 },
  ],
  singularityMirrors: [
    { tx:  6, ty: 7 },
    { tx: 11, ty: 10 },
    { tx: 21, ty: 3 },
    { tx:  10, ty:  4 },
  ],
  npcs: [
    {
      tx: 14, ty: 7,
      name: 'Oráculo',
      drawFn: drawNpcOracle,
      lines: [
        'Os ecos não são sons. São perguntas que o tempo esqueceu de responder.',
        'Você carrega algo que não sabe que tem. Continue adiante.',
      ]
    }
  ],
  stars: [{ tx: 1, ty: 13 }, { tx: 23, ty: 3 }],
};

// ── MAP 7 — Torre dos Ecos ─────────────────────────────────────────────────
const MAP_TOWER = {
  id: 7,
  name: 'TORRE DOS ECOS',
  cols: 25,
  rows: 15,
  // prettier-ignore
  tiles: parseTiles(
    'aaaaaaaaaaaaaaaaaaaaaaaaa' +
    'a0000000t0000000t0000000a' +
    'a000l000t0000000t0000000a' +
    'a000l000t0000000t0000uuua' +
    'auuuu000t0000000t0000000a' +
    'a0000000uuu000uuuuu00000a' +
    'a0000000t0000000t0000000a' +
    'a0000000t0000000t0000uuua' +
    'auuu000uuu000000t0000000a' +
    'a0000000t0000000t0000000a' +
    'a0000000t00000uuuuuuuuuua' +
    'auu000uuuuu00000t0000l00a' +
    'a0000000t0000000t0000l00a' +
    'a0000000t0000000t0000l00a' +
    'aaaaaaaaaaaaaaaaaaaaaaaaa'
  ),
  spawnX: 3, spawnY: 7,
  enemies: [
    { type: 'SHOOTER', tx: 21, ty: 10 },
    { type: 'SHOOTER', tx: 15, ty: 10 },
    { type: 'SHOOTER', tx: 4, ty: 14 },
    { type: 'SHOOTER', tx: 19, ty: 14 },
    { type: 'SHOOTER', tx: 7, ty: 11 },
    { type: 'SHOOTER', tx: 15, ty: 5 },
    { type: 'BOMBER', tx: 3, ty: 4 },
    { type: 'BOMBER', tx: 22, ty: 4 },
    { type: 'FLIER', tx: 13, ty: 2 },
    { type: 'SENTINEL', tx: 11, ty: 9 },
    { type: 'SENTINEL', tx: 11, ty: 4 },
  ],
  torches: [
    { tx: 2, ty: 7 }, { tx: 22, ty: 6 }, { tx: 9, ty: 10 },
    { tx: 19, ty: 9 }, { tx: 13, ty: 13 }, { tx: 3, ty: 3 }
  ],
  mineTrap: [
    { tx: 11, ty: 14 },
    { tx: 18, ty: 14 },
  ],
  npcs: [
    {
      tx: 2, ty: 10,
      name: 'Minotauro',
      drawFn: drawNpcMinotaur,
      lines: [
        '...',
        'Você é pequeno.',
        'Os pequenos costumam ser os mais perigosos. Aprendi isso da pior forma.',
        'Esta torre me prendeu há muito tempo. Já não lembro se quero sair.',
      ]
    }
  ],
  stars: [{ tx: 23, ty: 2 }, { tx: 1, ty: 3 }],
  doubleJump: { tx: 23, ty: 6 }
};

// ── MAP 8 — Câmara do Fim ──────────────────────────────────────────────────
const MAP_FINAL = {
  id: 8,
  name: 'CÂMARA DO FIM',
  cols: 25,
  rows: 15,
  // prettier-ignore
  tiles: parseTiles(
    'hhhhhhhhhhhhhhhhhhhhhhhhh' +
    'h00003000000000000000003h' +
    'h00003000000000000000003h' +
    'hpppp3000000000000000003h' +
    'h00003000ppp000000ppppp3h' +
    'h0000300p00000000p000003h' +
    'h00003000000000000000003h' +
    'hpppp30000000pp000000003h' +
    'h0000300000pppp000000ppph' +
    'h00003000pppppp000000000h' +
    'h0000300p000000000000000h' +
    'hpppp300000000000ppppppph' +
    'h00003000000000000000000h' +
    'h00003000000000000000000h' +
    'hhhhhhhhhhhhhhhhhhhhhhhhh'
  ),
  spawnX: 3, spawnY: 7,
  enemies: [
    { type: 'WRAITH_MAGE', tx: 13, ty:  14 },
    { type: 'WRAITH_MAGE', tx: 2, ty:  14 },
    { type: 'WRAITH_MAGE', tx: 22, ty:  14 },
    { type: 'WRAITH_MAGE', tx: 20, ty:  11 },
    { type: 'WATCHER', tx:  7, ty: 6 },
    { type: 'WATCHER', tx: 18, ty: 4 },
    { type: 'WATCHER', tx: 11, ty: 7 },
    { type: 'WATCHER', tx: 19, ty: 7 },
    { type: 'VOID_CASTER', tx: 11, ty: 8 },
  ],
  altars: [
    { tx: 11, ty: 13 },
  ],
  chandeliers: [
    { tx: 9, ty: 0, chainLen: 40 },   // ty = tile de TETO de onde a corrente parte
    { tx: 14, ty: 0, chainLen: 40 },  // chainLen opcional (px, padrão 16)
  ],
  eyePyramids: [
    { tx:  7, ty: 13 },
    { tx: 15, ty: 13 },
  ],
  skullPedestals: [
    { tx: 2, ty: 6, eyeColor: '#aa44ff' },
    { tx: 2, ty: 10, eyeColor: '#aa44ff' },
    { tx: 19, ty: 10, eyeColor: '#aa44ff' },
  ],
  candles: [
    { tx: 20, ty: 13 },
    { tx: 2, ty: 2 },
    { tx: 20, ty: 3 },
  ],
  npcs: [
    {
      tx: 11, ty: 3,
      name: 'Magister Vael',
      drawFn: drawNpcEyeMage,
      lines: [
        'Não se assuste. Eu era humano uma vez.',
        'Décadas buscando a visão perfeita me custaram todas as outras.',
        'Mas este único olho enxerga o que nenhum par jamais conseguiria.',
        'Você, por exemplo. Vejo que carrega um peso que ainda não tem nome.',
      ]
    }
  ],
  stars: [{ tx: 23, ty: 13 }, { tx: 1, ty: 2 }],
};

// ── Registra todos os mapas (ordem = índice = id) ──────────────────────────
ALL_MAPS.push(MAP_SANCTUARY, MAP_VOID, MAP_SINGULARITY, MAP_TOWER, MAP_FINAL);

// ── Conexões — grade 3×3 ───────────────────────────────────────────────────
// connectMaps(A, direção, B, [linhas/colunas da abertura])
// Cuida automaticamente de: connections, doors e tiles visuais em A e B.
//
//   col  0              1              2
// row 0  CRYPT(0)   → ABYSS(1)    → TOWER(7)
//           ↓              ↓              ↓
// row 1  UNDERGR(2) → DEPTHS(3)   → SANCTUARY(4)
//           ↓              ↓              ↓
// row 2  SINGULARITY(6)   → VOID(5)     → FINAL(8)

// Horizontais — row 0
connectMaps(MAP_CRYPT,       'right', MAP_ABYSS,      [10, 11]);
connectMaps(MAP_ABYSS,       'right', MAP_TOWER,      [12, 13]);
// Horizontais — row 1
connectMaps(MAP_UNDERGROUND, 'right', MAP_DEPTHS,     [10, 11]);
connectMaps(MAP_DEPTHS,      'right', MAP_SANCTUARY,  [1, 2]);
// Horizontais — row 2
connectMaps(MAP_SINGULARITY,       'right', MAP_VOID,       [12, 13]);
connectMaps(MAP_VOID,        'right', MAP_FINAL,      [12, 13]);

// Verticais — col 0
connectMaps(MAP_CRYPT,       'down',  MAP_UNDERGROUND, [13, 14]);
connectMaps(MAP_UNDERGROUND, 'down',  MAP_SINGULARITY,       [6, 7]);
// Verticais — col 1
connectMaps(MAP_ABYSS,       'down',  MAP_DEPTHS,      [14, 15]);
connectMaps(MAP_DEPTHS,      'down',  MAP_VOID,        [10, 12]);
// Verticais — col 2
connectMaps(MAP_TOWER,       'down',  MAP_SANCTUARY,   [22, 23]);
connectMaps(MAP_SANCTUARY,   'down',  MAP_FINAL,       [18, 19]);

const _originalTiles = {};
for (const map of ALL_MAPS) {
  _originalTiles[map.id] = map.tiles.slice();
}

function resetBreakableTiles() {
  for (const key of Object.keys(breakableState)) delete breakableState[key];
  for (const map of ALL_MAPS) {
    const snap = _originalTiles[map.id];
    if (snap) map.tiles.set ? map.tiles.set(snap) : snap.forEach((v, i) => { map.tiles[i] = v; });
  }
  for (const map of ALL_MAPS) _invalidateMinimapCell(map.id);
}

// ─── UTILITIES ─────────────────────────────────────────────────────────────

// Verifica se um tile de borda está na faixa de abertura da porta
function isBorderOpen(map, edge, tileIndex) {
  const range = map.doors?.[edge];
  if (!range) return false;
  return tileIndex >= range[0] && tileIndex <= range[1];
}

// ─── TILE PARSER para mapas com tiles estéticos ────────────────────────────
// Converte caracteres em números de tile (T.AIR, T.SOLID, T.BRICK, etc.)
function parseTiles(str) {
  const mapping = {
    '0': T.AIR,
    '1': T.SOLID,
    '2': T.SPIKE,
    '3': T.LADDER,
    '4': T.PLAT,
    '5': T.WALL,
    'a': T.BRICK,
    'b': T.GRASS,
    'c': T.DIRT,
    'd': T.DARK,
    'e': T.BREAK,
    'f': T.CRUMBLE,
    'g': T.HEX,
    'h': T.CHESS,
    'i': T.PILLAR,
    'j': T.IRON_GATE,
    'k': T.VOID_STONE,
    'l': T.CRATE,
    'm': T.WOOD_PLANKS,
    'n': T.FENCE,
    'o': T.MOSAIC,
    'p': T.AZULEJO,
    'q': T.OBSIDIAN,
    'r': T.DEAD_GRASS,
    's': T.DUNGEON_FLOOR,
    't': T.ECHO_PILLAR,
    'u': T.BRICK_COBBLE,  
    'v': T.OBSIDIAN_BRICK,
    'w': T.DARK_DIRT,
    'x': T.DARK_ENERGY,
    'y': T.MYSTIC_STONE,
  };
  
  return str.split('').filter(c => c.trim() !== '' && c !== '\n').map(c => {
    const val = mapping[c];
    if (val === undefined) {
      console.warn(`Caractere desconhecido no tilemap: "${c}", usando T.AIR`);
      return T.AIR;
    }
    return val;
  });
}

function getTile(map, tx, ty) {
  if (tx < 0)         return isBorderOpen(map, 'left',  ty) ? T.AIR : T.SOLID;
  if (tx >= map.cols) return isBorderOpen(map, 'right', ty) ? T.AIR : T.SOLID;
  if (ty < 0)         return isBorderOpen(map, 'up',    tx) ? T.AIR : T.SOLID;
  if (ty >= map.rows) return isBorderOpen(map, 'down',  tx) ? T.AIR : T.SOLID;
  const _t = map.tiles[ty * map.cols + tx];
  if (_t === T.CRUMBLE) {
    const _cs = crumbleGet(currentMapId, tx, ty);
    if (_cs && _cs.phase === 'gone') return T.AIR;
  }
  return _t;
}

function tileRect(tx, ty) {
  return { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function isSolid(t) { return t === T.SOLID || t === T.BRICK || t === T.GRASS || t === T.DIRT || t === T.DARK || t === T.BREAK || t === T.CRUMBLE || t === T.WALL || t === T.HEX || t === T.CHESS || t === T.CRATE || t === T.MOSAIC || t === T.DEAD_GRASS || t === T.DUNGEON_FLOOR || t === T.BRICK_COBBLE || t === T.OBSIDIAN || t === T.OBSIDIAN_BRICK || t === T.DARK_DIRT || t === T.AZULEJO || t === T.VOID_STONE || t === T.DARK_ENERGY || t === T.MYSTIC_STONE; }

// Tiles que servem como "chão caminhável" para o lookahead dos inimigos.
// Inclui tiles sólidos + plataformas unidirecionais e portas de transição
// (DOOR_D, DOOR_U, DOOR_L, DOOR_R) para que os inimigos não virem
// ao chegar em tiles de transição de mapa.
function isWalkableGround(t) {
  return isSolid(t) || t === T.PLAT || t === T.DOOR_D || t === T.DOOR_U || t === T.DOOR_L || t === T.DOOR_R;
}

// ─── BREAKABLE TILES ───────────────────────────────────────────────────────
// Maps "mapId:tx:ty" → hp remaining (starts at 3 hits)
const breakableState = {};

function getBreakKey(mapId, tx, ty) { return `${mapId}:${tx}:${ty}`; }

function getBreakHp(mapId, tx, ty) {
  const k = getBreakKey(mapId, tx, ty);
  if (!(k in breakableState)) breakableState[k] = 3;
  return breakableState[k];
}

function hitBreakable(mapId, map, tx, ty) {
  const k = getBreakKey(mapId, tx, ty);
  if (!(k in breakableState)) breakableState[k] = 3;
  breakableState[k]--;
  const cx = tx * TILE + TILE / 2;
  const cy = ty * TILE + TILE / 2;
  spawnParticles(cx, cy, '#7a5a3a', 6, 3);
  if (breakableState[k] <= 0) {
    // Remove the tile from the map
    map.tiles[ty * map.cols + tx] = T.AIR;
    spawnParticles(cx, cy, '#5a4030', 18, 5);
    spawnParticles(cx, cy, '#c8a060', 8, 4);
  }
}

function hitCrate(mapId, map, tx, ty) {
  const k = getBreakKey(mapId, tx, ty);
  if (!(k in breakableState)) breakableState[k] = 2; // 2 golpes para destruir
  breakableState[k]--;
  const cx = tx * TILE + TILE / 2;
  const cy = ty * TILE + TILE / 2;
  // Lascas de madeira + estilhaços metálicos
  spawnParticles(cx, cy, '#6a4020', 8, 4);
  spawnParticles(cx, cy, '#3a2208', 5, 2);
  if (breakableState[k] <= 0) {
    map.tiles[ty * map.cols + tx] = T.AIR;
    spawnParticles(cx, cy, '#8b5a2a', 20, 6);
    spawnParticles(cx, cy, '#c8a060', 10, 4); // pregos/metal voando
    spawnParticles(cx, cy, '#3a2208', 12, 3);
  }
}

// Verifica se há linha de visão entre dois pontos usando Bresenham
function hasLineOfSight(map, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  let tileX = Math.floor(x0 / TILE), tileY = Math.floor(y0 / TILE);
  const tileX1 = Math.floor(x1 / TILE), tileY1 = Math.floor(y1 / TILE);
 
  const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1;
 
  // distância ao longo do raio até o próximo cruzamento de borda em X e Y
  const tDeltaX = dx !== 0 ? Math.abs(TILE / dx) : Infinity;
  const tDeltaY = dy !== 0 ? Math.abs(TILE / dy) : Infinity;
 
  let tMaxX = dx !== 0
    ? ((dx > 0 ? (tileX + 1) * TILE : tileX * TILE) - x0) / dx
    : Infinity;
  let tMaxY = dy !== 0
    ? ((dy > 0 ? (tileY + 1) * TILE : tileY * TILE) - y0) / dy
    : Infinity;
 
  while (true) {
    if (isSolid(getTile(map, tileX, tileY))) return false;
    if (tileX === tileX1 && tileY === tileY1) return true;
    if (tMaxX < tMaxY) { tMaxX += tDeltaX; tileX += stepX; }
    else               { tMaxY += tDeltaY; tileY += stepY; }
  }
}

// ─── ARROW TRAP SYSTEM ─────────────────────────────────────────────────────
// Armadilhas posicionadas nos mapas via arrowTraps: [{ tx, ty, dir, range }]
// dir: 'left' | 'right' | 'up' | 'down'
// range: distância de detecção em pixels (padrão: 180)
// Ficam escondidas (integradas à parede) até que o jogador entre na linha de visão.
// Ao detectar, exibem animação de carga e disparam uma flecha.
 
const ARROW_TRAP_COOLDOWN = 3.0;   // segundos entre disparos
const ARROW_TRAP_WARMUP   = 0.55;  // telegraf antes de disparar
const ARROW_TRAP_RANGE    = 180;   // alcance padrão em px
const ARROW_TRAP_SPD      = 7.5;   // velocidade da flecha
const ARROW_TRAP_DMG      = 22;    // dano da flecha
 
// Estado de cada armadilha: 'hidden' | 'warmup' | 'cooldown'
// Inicializamos ao carregar o mapa.
let arrowTraps = []; // lista de instâncias ativas no mapa atual
 
function initArrowTraps(map) {
  arrowTraps = [];
  if (!map.arrowTraps) return;
  for (const def of map.arrowTraps) {
    arrowTraps.push({
      tx:    def.tx,
      ty:    def.ty,
      dir:   def.dir  ?? 'right',
      range: def.range ?? ARROW_TRAP_RANGE,
      state: 'hidden',   // 'hidden' | 'warmup' | 'cooldown'
      timer: 0,
      revealed: false,   // true depois do primeiro disparo (fica visível)
    });
  }
}
 
function _trapCanSeePlayer(trap, map, px, py) {
  const cx  = trap.tx * TILE + TILE / 2;
  const cy  = trap.ty * TILE + TILE / 2;
  const dvx = trap.dir === 'right' ?  1 : trap.dir === 'left' ? -1 : 0;
  const dvy = trap.dir === 'down'  ?  1 : trap.dir === 'up'   ? -1 : 0;
  const isHoriz = dvy === 0;
 
  if (isHoriz) {
    // Armadilha horizontal (left/right): jogador deve estar na mesma faixa vertical
    if (Math.abs(py - cy) > TILE * 0.6) return false;
    // E do lado correto (à frente da boca)
    if ((px - cx) * dvx <= 0) return false;
    // Dentro do range
    if (Math.abs(px - cx) > trap.range) return false;
  } else {
    // Armadilha vertical (up/down): jogador deve estar na mesma faixa horizontal
    if (Math.abs(px - cx) > TILE * 0.6) return false;
    // E do lado correto (à frente da boca)
    if ((py - cy) * dvy <= 0) return false;
    // Dentro do range
    if (Math.abs(py - cy) > trap.range) return false;
  }
 
  // Sem obstáculos sólidos entre a boca e o jogador
  const mx = cx + dvx * (TILE * 0.5 + 2);
  const my = cy + dvy * (TILE * 0.5 + 2);
  return hasLineOfSight(map, mx, my, px, py);
}
 
function updateArrowTraps(dt, map, player) {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;

  for (const trap of arrowTraps) {
    const cx  = trap.tx * TILE + TILE / 2;
    const cy  = trap.ty * TILE + TILE / 2;
    const dvx = trap.dir === 'right' ?  1 : trap.dir === 'left' ? -1 : 0;
    const dvy = trap.dir === 'down'  ?  1 : trap.dir === 'up'   ? -1 : 0;
    const mx  = cx + dvx * (TILE * 0.5 + 2);
    const my  = cy + dvy * (TILE * 0.5 + 2);

    switch (trap.state) {
      case 'hidden':
        if (!_trapCanSeePlayer(trap, map, px, py)) break;
        trap.state = 'warmup';
        trap.timer = ARROW_TRAP_WARMUP;
        break;

      case 'cooldown':
        trap.timer -= dt;
        if (trap.timer <= 0) trap.state = 'hidden';
        break;

      case 'warmup':
        trap.timer -= dt;
        if (trap.timer > 0) break;
        // Dispara
        trap.revealed = true;
        const arrow = { x: mx, y: my, vx: dvx * ARROW_TRAP_SPD, vy: dvy * ARROW_TRAP_SPD,
          owner: 'enemy', dmg: ARROW_TRAP_DMG, color: '#c8a060',
          w: 14, h: 4, life: 2.0, isArrow: true };
        projectiles.push(arrow);
        spawnParticles(mx, my, '#c8a060', 5, 2);
        trap.state = 'cooldown';
        trap.timer = ARROW_TRAP_COOLDOWN;
        break;
    }
  }
}
 
function drawArrowTraps(map, cam, time) {
  for (const trap of arrowTraps) {
    // Escondida e nunca revelada: não desenha nada —
    // o tile SOLID do mapa já está renderizado por drawMap.
    if (!trap.revealed && trap.state === 'hidden') continue;

    const px2 = trap.tx * TILE - cam.x;
    const py2 = trap.ty * TILE - cam.y;
    const cx  = px2 + TILE / 2;
    const cy  = py2 + TILE / 2;

    const dvx = trap.dir === 'right' ?  1 : trap.dir === 'left' ? -1 : 0;
    const dvy = trap.dir === 'down'  ?  1 : trap.dir === 'up'   ? -1 : 0;
    const angle = Math.atan2(dvy, dvx);
    const isHoriz = trap.dir === 'left' || trap.dir === 'right';

    ctx.save();

    // ── Revelada / em warmup / em cooldown: mostra a armadilha ─────────

    // Corpo da armadilha (madeira escura)
    const tw = isHoriz ? TILE * 0.55 : TILE * 0.75;
    const th = isHoriz ? TILE * 0.75 : TILE * 0.55;
    ctx.fillStyle = '#3a2010';
    ctx.strokeStyle = '#7a5030';
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx - tw / 2, cy - th / 2, tw, th);
    ctx.strokeRect(cx - tw / 2, cy - th / 2, tw, th);

    // Canal do mecanismo (sulco central)
    ctx.fillStyle = '#1a0e08';
    if (isHoriz) {
      ctx.fillRect(cx - tw / 2 + 2, cy - 2, tw - 4, 4);
    } else {
      ctx.fillRect(cx - 2, cy - th / 2 + 2, 4, th - 4);
    }

    // Rebites / detalhes metálicos
    ctx.fillStyle = '#6a5040';
    const corners = [
      [cx - tw/2 + 3, cy - th/2 + 3],
      [cx + tw/2 - 3, cy - th/2 + 3],
      [cx - tw/2 + 3, cy + th/2 - 3],
      [cx + tw/2 - 3, cy + th/2 - 3],
    ];
    for (const [rx, ry] of corners) {
      ctx.beginPath();
      ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Warmup: indicador visual pulsante (corda esticando)
    if (trap.state === 'warmup') {
      const frac  = 1 - trap.timer / ARROW_TRAP_WARMUP; // 0→1
      const pulse = Math.abs(Math.sin(time * 22));

      // Anel de alerta laranja
      ctx.strokeStyle = `rgba(255, 160, 30, ${0.5 + 0.5 * pulse})`;
      ctx.lineWidth   = 1.5;
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur  = 8 + 6 * pulse;
      ctx.beginPath();
      ctx.arc(cx, cy, TILE * 0.45 * (0.6 + frac * 0.4), 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Flecha parcialmente saindo (carregando) — sem rotate, usa trig direta
      const arrowLen = frac * TILE * 0.7;
      const bx  = cx + dvx * arrowLen;
      const by  = cy + dvy * arrowLen;
      const perpX = -dvy * 3;   // perpendicular ao eixo de disparo
      const perpY =  dvx * 3;
      // Haste
      ctx.strokeStyle = '#c8a060';
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(bx, by);
      ctx.stroke();
      // Ponta metálica
      ctx.fillStyle = '#aaaaaa';
      ctx.beginPath();
      ctx.moveTo(bx + dvx * 5, by + dvy * 5);
      ctx.lineTo(bx - perpX,   by - perpY);
      ctx.lineTo(bx + perpX,   by + perpY);
      ctx.closePath();
      ctx.fill();
    }

    // Em cooldown: brilho de disparo diminuindo
    if (trap.state === 'cooldown') {
      const glow = Math.max(0, 1 - (ARROW_TRAP_COOLDOWN - trap.timer) * 3);
      if (glow > 0) {
        ctx.globalAlpha = glow * 0.6;
        ctx.fillStyle   = '#ff8800';
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur  = 16;
        ctx.beginPath();
        ctx.arc(cx + dvx * TILE * 0.3, cy + dvy * TILE * 0.3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }
}

// ─── MINE TRAP SYSTEM ──────────────────────────────────────────────────────
// Minas colocadas no chão via mineTrap: [{ tx, ty }]
// Ficam camufladas até o jogador entrar no raio de detecção.
// Ao detectar, piscam por um breve warmup e então explodem em AOE.
// Minas são destruídas após explodir (sem respawn).

const MINE_TRIGGER_RADIUS = 36;   // px — raio de detecção
const MINE_BLAST_RADIUS   = 80;   // px — raio da explosão
const MINE_WARMUP         = 1.1;  // segundos de alerta antes de explodir
const MINE_DMG            = 38;   // dano ao jogador

let mineTraps = [];

function initMineTraps(map) {
  mineTraps = [];
  if (!map.mineTrap) return;
  for (const def of map.mineTrap) {
    mineTraps.push({
      tx:       def.tx,
      ty:       def.ty,
      state:    'hidden',   // 'hidden' | 'warmup' | 'exploded'
      timer:    0,
      revealed: false,
    });
  }
}

function updateMineTraps(dt, player) {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;

  for (let i = mineTraps.length - 1; i >= 0; i--) {
    const mine = mineTraps[i];
    if (mine.state === 'exploded') { mineTraps.splice(i, 1); continue; }

    const cx = mine.tx * TILE + TILE / 2;
    const cy = mine.ty * TILE + TILE / 2;

    switch (mine.state) {
      case 'hidden': {
        const dist = Math.hypot(px - cx, py - cy);
        if (dist <= MINE_TRIGGER_RADIUS) {
          mine.state    = 'warmup';
          mine.timer    = MINE_WARMUP;
          mine.revealed = true;
        }
        break;
      }
      case 'warmup': {
        mine.timer -= dt;
        if (mine.timer > 0) break;

        // ── Explosão ─────────────────────────────────────────────────
        const distBlast = Math.hypot(px - cx, py - cy);
        if (distBlast <= MINE_BLAST_RADIUS) {
          const falloff = 1 - distBlast / MINE_BLAST_RADIUS;
          damagePlayer(player, Math.round(MINE_DMG * (0.5 + 0.5 * falloff)));
        }

        // Partículas da explosão
        spawnParticles(cx, cy, '#ff6600', 22, 6.5);
        spawnParticles(cx, cy, '#ffaa00', 16, 5.0);
        spawnParticles(cx, cy, '#cc2200', 12, 4.0);
        spawnParticles(cx, cy, '#444444', 10, 3.5); // fumaça
        spawnParticles(cx, cy, '#888888',  8, 2.5);

        mine.state = 'exploded';
        break;
      }
    }
  }
}

function drawMineTraps(cam, time) {
  for (const mine of mineTraps) {
    if (!mine.revealed && mine.state === 'hidden') continue;

    const px = mine.tx * TILE - cam.x;
    const py = mine.ty * TILE - cam.y;
    const cx = px + TILE / 2;
    const cy = py + TILE / 2;

    ctx.save();

    const frac = mine.state === 'warmup'
      ? 1 - mine.timer / MINE_WARMUP   // 0→1
      : 1;

    // ── Disco metálico (corpo da mina) ───────────────────────────────
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#383838';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aresta metálica superior
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 10, 5, 0, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Detalhe central (parafuso)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 3, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Indicador de estado ──────────────────────────────────────────
    if (mine.state === 'hidden') {
      // Luz apagada — quase invisível
      ctx.fillStyle = '#330000';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (mine.state === 'warmup') {
      // Pisca cada vez mais rápido conforme o frac aumenta
      const blinkRate = 6 + frac * 18;
      const on = Math.sin(time * blinkRate) > 0;

      // Luz vermelha piscando
      ctx.fillStyle = on ? '#ff2200' : '#550000';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 2.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Brilho do LED quando aceso
      if (on) {
        ctx.globalAlpha = 0.25 + 0.2 * frac;
        ctx.fillStyle   = '#ff4400';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Anel de alerta crescente no chão
      ctx.strokeStyle = `rgba(255, 80, 0, ${0.15 + 0.2 * frac})`;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(cx, cy + 5, MINE_TRIGGER_RADIUS * (0.4 + 0.6 * frac), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ─── RETRACTABLE SPIKE SYSTEM ──────────────────────────────────────────────
// Definido no mapa via retractableSpikes: [{ tx, ty, period, offset }]
// period = duração total do ciclo em segundos (padrão 2s)
// offset = fase inicial do ciclo 0..1 (permite desincronizar grupos)

const SPIKE_DMG = 25;

let retractableSpikes = [];
let spikeTime = 0; // tempo global acumulado

function initRetractableSpikes(map) {
  retractableSpikes = [];
  if (!map.retractableSpikes) return;
  for (const def of map.retractableSpikes) {
    retractableSpikes.push({
      tx:          def.tx,
      ty:          def.ty,
      period:      def.period      ?? 2.0,
      standTime:   def.standTime   ?? 0,
      retractTime: def.retractTime ?? 1.0,
      offset:      def.offset      ?? 0,
    });
  }
}

function _spikeUpDown(spike) {
  const stand      = spike.standTime   ?? 0;
  const retract    = spike.retractTime ?? 1.0;
  const halfPeriod = spike.period / 2;
  const totalCycle = halfPeriod + stand + halfPeriod + retract;
  const t          = (spikeTime + (spike.offset ?? 0) * totalCycle) % totalCycle;

  if      (t < halfPeriod)                          return t / halfPeriod;                          // subindo
  else if (t < halfPeriod + stand)                  return 1;                                        // parado no ápice
  else if (t < halfPeriod + stand + halfPeriod)     return 1 - (t - halfPeriod - stand) / halfPeriod; // descendo
  else                                              return 0;                                        // retraído
}

function updateRetractableSpikes(dt, player) {
  spikeTime += dt;
  for (const spike of retractableSpikes) {
    const upDown = _spikeUpDown(spike);
    const spikeH = Math.round(upDown * 24);
    if (spikeH < 3 || player.invincible > 0) continue;
    const spikeWorldX = spike.tx * TILE;
    const spikeWorldY = spike.ty * TILE - spikeH;
    const overlapX = player.x < spikeWorldX + TILE && player.x + player.w > spikeWorldX;
    const overlapY = player.y < spikeWorldY + spikeH && player.y + player.h > spikeWorldY;
    if (overlapX && overlapY) damagePlayer(player, SPIKE_DMG);
  }
}

function initRetractableSpikes(map) {
  retractableSpikes = [];
  if (!map.retractableSpikes) return;
  for (const def of map.retractableSpikes) {
    retractableSpikes.push({
      tx:          def.tx,
      ty:          def.ty,
      period:      def.period      ?? 2.0,
      standTime:   def.standTime   ?? 0,
      retractTime: def.retractTime ?? 1.0,
      offset:      def.offset      ?? 0,
    });
  }
}

function drawRetractableSpikes(cam) {
  for (const spike of retractableSpikes) {
    const px = spike.tx * TILE - cam.x;
    const py = spike.ty * TILE - cam.y;

    const upDown = _spikeUpDown(spike); // ← usa o helper correto
    const spikeH = Math.round(upDown * 24);
    if (spikeH < 1) continue;

    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py - 32, TILE, 32);
    ctx.clip();

    // Espinhos
    for (let i = 0; i < 4; i++) {
      const bx   = px + i * 8 + 1;
      const tipY = py - spikeH;

      ctx.fillStyle = '#b0b8c0';
      ctx.fillRect(bx + 2, tipY + 4, 3, Math.max(0, spikeH - 4));
      ctx.fillRect(bx + 2, tipY + 2, 3, 3);
      ctx.fillRect(bx + 2, tipY + 1, 2, 2);
      ctx.fillRect(bx + 3, tipY,     1, 2);
      ctx.fillStyle = '#d8e0e8';
      ctx.fillRect(bx + 2, tipY + 1, 1, Math.max(0, spikeH - 2));
    }

    ctx.restore();
  }
}

// ─── INPUT ─────────────────────────────────────────────────────────────────
const keys = {};

// ─── GRIMÓRIO STATE ────────────────────────────────────────────────────────
let grimoireOpen   = false;
let grimoireScroll = 0;
const GRIMOIRE_SCROLL_SPD = 22;

const GRIMOIRE_LORE = [
  {
    title: 'PRÓLOGO',
    lines: [
      'Nos tempos anteriores à memória, o Abismo existia',
      'antes do próprio mundo. Uma ferida primordial no',
      'tecido da existência, de onde escapa a escuridão',
      'que corrói toda luz.',
      '',
      'Você é o último Errante — aquele que não pertence',
      'nem ao mundo dos vivos nem ao dos mortos. Sua',
      'missão: descer ao coração do Abismo e selar',
      'o que nunca deveria ter existido.',
      '',
      'As estrelas que brilham nesta escuridão não são',
      'simples fragmentos de luz. São as almas de todos',
      'que tentaram esta jornada antes de você — e',
      'falharam. Colete-as. Honre-as. Liberte-as.',
    ]
  },
  {
    title: 'A CRIPTA',
    lines: [
      'O ponto de partida de toda jornada sombria.',
      'Estas câmaras foram escavadas há séculos por',
      'monges que buscavam comunhão com os mortos.',
      '',
      'As chamas das tochas nunca se apagam — são',
      'alimentadas pelo ressentimento das almas presas.',
      'Os Guardiões que vagam aqui foram corrompidos',
      'pelo próprio ritual que deveriam proteger.',
      '',
      'Armadilhas de flechas são herança dos monges,',
      'projetadas para manter os curiosos longe dos',
      'segredos mais profundos da cripta.',
    ]
  },
  {
    title: 'O ABISMO',
    lines: [
      'Além da cripta, onde o chão cede à escuridão.',
      'O Abismo não é um lugar — é uma ausência.',
      '',
      'Aqui, os Espectros nasceram do silêncio entre',
      'os mundos: ecos de vozes que ninguém ouviu.',
      'Os cogumelos que crescem neste reino absorvem',
      'energia void e pulsam com vida estranha.',
      '',
      'Os Espectros não atacam por maldade, mas por',
      'confusão. Eles não sabem que o mundo dos vivos',
      'ainda existe. Para eles, você é o fantasma.',
    ]
  },
  {
    title: 'AS CATACUMBAS',
    lines: [
      'Sob a cripta estendem-se as catacumbas: labirinto',
      'de corredores escavados em terra escura. Aqui',
      'foram enterrados os heréticos — aqueles que',
      'tentaram fazer pactos com o Vazio.',
      '',
      'Os Revenants retornaram do pacto transformados.',
      'Os Mimics assumem a forma de baús para atrair',
      'os gananciosos. Os Bombardeiros explodem com',
      'energia acumulada por décadas de isolamento.',
      '',
      'Um Orbe de teletransporte aguarda em algum canto',
      '— uma passagem para além do alcance comum.',
    ]
  },
  {
    title: 'AS PROFUNDEZAS',
    lines: [
      'Pedra obsidiana forma as paredes desta câmara',
      'primordial. As Profundezas existem desde antes',
      'da cripta — formadas por pressão geológica e',
      'energia void que cristalizou a rocha em vidro.',
      '',
      'Os Convocadores trabalham em círculos, chamando',
      'entidades de planos distantes. Com seus escudos',
      'místicos ativados são quase invulneráveis.',
      'Use magia para quebrar a barreira antes de',
      'atacar diretamente — ou pereça na tentativa.',
    ]
  },
  {
    title: 'SANTUÁRIO CORROMPIDO',
    lines: [
      'Havia um tempo em que este era um jardim sagrado,',
      'protegido por druidas que conheciam o equilíbrio',
      'entre luz e trevas.',
      '',
      'A corrupção entrou quando um Portador do Vazio',
      'plantou uma semente negra no coração do jardim.',
      'Árvores retorcidas cresceram. Flores murcharam',
      'e renasceram em formas grotescas.',
      '',
      'Os Saltadores e Corredores que habitam aqui são',
      'os guardiões transformados — memórias fragmentadas',
      'de uma devoção que o Vazio distorceu.',
    ]
  },
  {
    title: 'O VAZIO',
    lines: [
      'Este é o lugar que existe entre existir e não',
      'existir. O Vazio não é trevas — é a ausência',
      'de qualquer coisa que possa ser chamada de',
      'realidade.',
      '',
      'Os Olhos do Vazio são observadores eternos,',
      'testemunhas da criação e da destruição de mundos.',
      'Os Fantasmas aqui são mais antigos que o próprio',
      'mundo — alguns dizem serem os primeiros pensamentos',
      'que o universo teve antes de aprender a pensar.',
    ]
  },
  {
    title: 'SINGULARIDADE MISTERIOSA',
    lines: [
      'Um ponto onde as leis físicas se dobram sobre si.',
      'A Singularidade nasceu quando um experimento',
      'arcano falhou catastroficamente, dobrando o',
      'espaço em um nó impossível de desfazer.',
      '',
      'Os Espectros aqui são prisioneiros do dobramento',
      '— incapazes de escapar, incapazes de morrer.',
      'Os Espelhos da Singularidade distorcem a realidade;',
      'evite contemplá-los por tempo demais.',
    ]
  },
  {
    title: 'TORRE DOS ECOS',
    lines: [
      'Uma torre que existe em múltiplos tempos',
      'simultaneamente. Cada pedra carrega o eco de',
      'batalhas que aconteceram, acontecem e ainda',
      'vão acontecer — todas ao mesmo tempo.',
      '',
      'Os Pilares de Eco amplificam qualquer som:',
      'um sussurro torna-se trovão. Os inimigos que',
      'habitam a torre ouvem cada passo seu.',
      '',
      'Mova-se com sabedoria. A arquitetura da torre',
      'foi construída para confundir — e também',
      'para ser usada como vantagem.',
    ]
  },
  {
    title: 'A CONVERGÊNCIA',
    lines: [
      'O destino final. Aqui, todas as energias do',
      'Abismo convergem em um único ponto — o núcleo',
      'de tudo que corrompeu este mundo.',
      '',
      'As estrelas que coletou ao longo da jornada',
      'são as almas dos que tentaram antes de você.',
      'Juntas, elas possuem o poder de selar o Abismo.',
      '',
      'Carregue-as com honra até o fim. Sua missão',
      'não é apenas selar o Vazio — é trazer de volta',
      'aqueles que ele consumiu ao longo dos séculos.',
      '',
      'Colete todas as estrelas para alcançar',
      'a Salvação e completar sua jornada.',
    ]
  },
];

window.addEventListener('keydown', e => {
  // Grimoire toggle
  if (gamePhase === 'playing' && (e.code === 'KeyG')) {
    grimoireOpen = !grimoireOpen;
    if (grimoireOpen) grimoireScroll = 0;
    e.preventDefault();
    return;
  }
  // When grimoire is open, intercept Escape + arrows for scrolling
  if (grimoireOpen) {
    if (e.code === 'Escape')    grimoireOpen = false;
    if (e.code === 'ArrowUp' || e.code === 'ArrowLeft')   grimoireScroll -= GRIMOIRE_SCROLL_SPD;
    if (e.code === 'ArrowDown' || e.code === 'ArrowRight') grimoireScroll += GRIMOIRE_SCROLL_SPD;
    e.preventDefault();
    return;
  }
  keys[e.code] = true;
  e.preventDefault();
});
window.addEventListener('keyup',   e => { keys[e.code] = false; });

function isDown(...codes) { return codes.some(c => keys[c]); }

// ─── PARTICLES ─────────────────────────────────────────────────────────────
const particles = [];

const MAX_PARTICLES = 200; // cap global — evita acúmulo em mapas com muitos inimigos

function spawnParticles(x, y, color, count = 8, speed = 3) {
  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) break; // descarta o excesso silenciosamente
    const angle = Math.random() * Math.PI * 2;
    const spd   = speed * (0.5 + Math.random());
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 1,
      life: 1, maxLife: 0.6 + Math.random() * 0.4,
      color, size: 2 + Math.random() * 3,
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(cam) {
  ctx.save();
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life) * 0.9;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - cam.x, p.y - cam.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// ─── PROJECTILES ───────────────────────────────────────────────────────────
const projectiles = [];

function spawnProjectile(x, y, vx, vy, owner, dmg, color, w = 8, h = 4) {
  projectiles.push({ x, y, vx, vy, owner, dmg, color, w, h, life: 1.5 });
}

function updateProjectiles(dt, map) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt;

    // Homing fraco para projéteis do VOID_TENDRIL
    if (p.vtHoming && p.homingTarget && p.life > 0.4) {
      const tx2 = p.homingTarget.x + p.homingTarget.w / 2;
      const ty2 = p.homingTarget.y + p.homingTarget.h / 2;
      const spd = Math.hypot(p.vx, p.vy) || 1;
      const dx2 = (tx2 - p.x) / (Math.hypot(tx2 - p.x, ty2 - p.y) || 1);
      const dy2 = (ty2 - p.y) / (Math.hypot(tx2 - p.x, ty2 - p.y) || 1);
      p.vx += (dx2 * spd - p.vx) * p.homingTurn;
      p.vy += (dy2 * spd - p.vy) * p.homingTurn;
      // Mantém velocidade constante
      const newSpd = Math.hypot(p.vx, p.vy) || 1;
      p.vx = (p.vx / newSpd) * spd;
      p.vy = (p.vy / newSpd) * spd;
    }

    const tx = Math.floor(p.x / TILE);
    const ty = Math.floor(p.y / TILE);
    const t  = getTile(map, tx, ty);

    if (isSolid(t) || p.life <= 0) {
      // Projéteis do jogador destroem blocos destrutíveis
      if (t === T.BREAK && p.owner === 'player') {
        hitBreakable(map.id, map, tx, ty);
      }
      if (t === T.CRATE && p.owner === 'player') {
        hitCrate(map.id, map, tx, ty);
      }
      spawnParticles(p.x, p.y, p.color, 5, 2);
      projectiles.splice(i, 1);
    }
  }
}

function drawProjectiles(cam) {
  projectiles.forEach(p => {
    ctx.save();

    if (p.isArrow) {
      // Flecha desenhada como linha + ponta, sem depender de rotate no fillRect
      const angle = Math.atan2(p.vy, p.vx);
      const sx = p.x - cam.x;
      const sy = p.y - cam.y;
      const L  = 14; // comprimento da haste
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      // Haste — linha da traseira até a ponta
      const tailX = sx - cos * (L / 2);
      const tailY = sy - sin * (L / 2);
      const tipX  = sx + cos * (L / 2);
      const tipY  = sy + sin * (L / 2);
      ctx.strokeStyle = '#c8a060';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      // Ponta metálica — triângulo na frente
      const perpX = -sin * 3;
      const perpY =  cos * 3;
      ctx.fillStyle = '#cccccc';
      ctx.beginPath();
      ctx.moveTo(tipX + cos * 5, tipY + sin * 5);
      ctx.lineTo(tipX - perpX,   tipY - perpY);
      ctx.lineTo(tipX + perpX,   tipY + perpY);
      ctx.closePath();
      ctx.fill();
      // Plumas — dois traços na traseira perpendiculares à haste
      ctx.strokeStyle = '#8b3a10';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tailX - perpX * 1.2, tailY - perpY * 1.2);
      ctx.lineTo(tailX + perpX * 1.2, tailY + perpY * 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tailX + cos * 4 - perpX, tailY + sin * 4 - perpY);
      ctx.lineTo(tailX + cos * 4 + perpX, tailY + sin * 4 + perpY);
      ctx.stroke();
    } else if (p.spectral) {
      // Orbe espectral do GHOST — esfera translúcida azul-fria pulsante
      const sx  = p.x - cam.x;
      const sy  = p.y - cam.y;
      const r   = p.w / 2;
      // life vai de 3.2 → 0; usamos para fade-out nos últimos 0.5s
      const age = Math.max(0, Math.min(1, p.life / 0.5));  // 1 quando novo, <1 nos últimos 0.5s
      const alpha = Math.min(1, age);

      ctx.globalAlpha = alpha * 0.92;

      // Halo externo difuso (2 círculos)
      ctx.fillStyle = 'rgba(140,200,255,0.10)';
      ctx.beginPath(); ctx.arc(sx, sy, r + 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(140,200,255,0.18)';
      ctx.beginPath(); ctx.arc(sx, sy, r + 4, 0, Math.PI * 2); ctx.fill();

      // Corpo translúcido — gradiente radial do núcleo branco à borda azul-gelo
      const orbG = ctx.createRadialGradient(sx - r * 0.28, sy - r * 0.30, r * 0.04, sx, sy, r);
      orbG.addColorStop(0,    'rgba(240,248,255,0.92)');
      orbG.addColorStop(0.25, 'rgba(180,220,255,0.80)');
      orbG.addColorStop(0.65, 'rgba(120,180,255,0.60)');
      orbG.addColorStop(1,    'rgba(80,130,220,0.30)');
      ctx.fillStyle = orbG;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();

      // Borda fina azul-clara
      ctx.strokeStyle = 'rgba(180,230,255,0.55)';
      ctx.lineWidth   = 0.8;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();

      // Reflexo especular pequeno (ponto branco)
      ctx.fillStyle = 'rgba(255,255,255,0.70)';
      ctx.beginPath();
      ctx.ellipse(sx - r * 0.30, sy - r * 0.32, r * 0.22, r * 0.14, -0.5, 0, Math.PI * 2);
      ctx.fill();

      // Trilha de partículas espectrais (simulada com círculos semi-transparentes atrás)
      const trail = 3;
      for (let i = 1; i <= trail; i++) {
        const tr = r * (1 - i * 0.22);
        const tx2 = sx - (p.vx / p.w) * i * 4.5;
        const ty2 = sy - (p.vy / p.w) * i * 4.5;
        ctx.globalAlpha = alpha * (0.18 - i * 0.05);
        ctx.fillStyle = 'rgba(160,210,255,1)';
        ctx.beginPath(); ctx.arc(tx2, ty2, tr, 0, Math.PI * 2); ctx.fill();
      }

      ctx.globalAlpha = 1;
    } else if (p.chainShot) {
      // Fragmento/projétil do CHAIN_SPECTER — orbe ciano com rastro encadeado
      const sx  = p.x - cam.x;
      const sy  = p.y - cam.y;
      const r   = p.w / 2;
      const spd = Math.hypot(p.vx, p.vy) || 1;

      // Rastro — 3 cópias decrescentes atrás do orbe
      for (let i = 1; i <= 3; i++) {
        const tr  = r * (1 - i * 0.22);
        const tx2 = sx - (p.vx / spd) * i * 4;
        const ty2 = sy - (p.vy / spd) * i * 4;
        ctx.globalAlpha = 0.20 - i * 0.05;
        ctx.fillStyle = '#00ccff';
        ctx.beginPath(); ctx.arc(tx2, ty2, tr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Halo externo
      ctx.fillStyle = 'rgba(0,180,255,0.12)';
      ctx.beginPath(); ctx.arc(sx, sy, r + 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,200,255,0.22)';
      ctx.beginPath(); ctx.arc(sx, sy, r + 3, 0, Math.PI * 2); ctx.fill();

      // Corpo do orbe — ciano brilhante
      ctx.fillStyle = '#00ccff';
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();

      // Núcleo branco
      ctx.fillStyle = 'rgba(200,240,255,0.90)';
      ctx.beginPath(); ctx.arc(sx - r * 0.28, sy - r * 0.30, r * 0.38, 0, Math.PI * 2); ctx.fill();

      // Anel fino — indica ricochete disponível
      if (p.bounces > 0) {
        ctx.strokeStyle = 'rgba(0,255,255,0.55)';
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.arc(sx, sy, r + 5, 0, Math.PI * 2); ctx.stroke();
      }

    } else {
      ctx.fillStyle = `rgba(${p.glowColor || '100,100,255'},0.12)`;
      ctx.fillRect(p.x - p.w/2 - 5 - cam.x, p.y - p.h/2 - 5 - cam.y, p.w + 10, p.h + 10);
      ctx.fillStyle = `rgba(${p.glowColor || '100,100,255'},0.20)`;
      ctx.fillRect(p.x - p.w/2 - 2 - cam.x, p.y - p.h/2 - 2 - cam.y, p.w + 4,  p.h + 4);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.w/2 - cam.x, p.y - p.h/2 - cam.y, p.w, p.h);
    }

    ctx.restore();
  });
}

// ─── ENEMY DEFINITIONS ─────────────────────────────────────────────────────
const ENEMY_DEFS = {
  WALKER: {
    w: 20, h: 26, hp: 40, speed: 1.2, dmg: 10, color: '#4a1a1a',
    edgeColor: '#8b3333', detRange: 260, gravity: true,
    update(e, dt, map, player) {
      e.vx = e.dir * e.speed;
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }
      moveEntity(e, dt, map);

      // flip at edges / walls
      const fx    = e.x + (e.dir > 0 ? e.w : 0);
      const ty    = Math.floor((e.y + e.h + 2) / TILE);
      const tx    = Math.floor(fx / TILE);
      const ahead = getTile(map, tx, ty);

      // Tile de parede no nível do corpo — detecta portais de transição
      const wallTy   = Math.floor((e.y + e.h / 2) / TILE);
      const wallAhead = getTile(map, tx, wallTy);
      const hitsPortal = wallAhead === T.DOOR_R || wallAhead === T.DOOR_L;

      if (e.wallHit || !isWalkableGround(ahead) || hitsPortal) e.dir *= -1;
      e.wallHit = false;

      // Clamp duro: nunca entra nas colunas de borda (onde ficam os portais)
      const _mapW = map.cols * TILE;
      if (e.x < TILE) { e.x = TILE; e.dir = 1; }
      else if (e.x + e.w > _mapW - TILE) { e.x = _mapW - TILE - e.w; e.dir = -1; }

      if (e.groundTimer === undefined) e.groundTimer = 0;
    },
  },
  VOID_TENDRIL: {
    w: 18, h: 28, hp: 50, speed: 0, dmg: 14, color: '#220033',
    edgeColor: '#aa00ff', detRange: 320, gravity: true,
    update(e, dt, map, player) {
      // Fica no chão (gravidade normal, mas nunca se move horizontalmente)
      e.vx = 0;
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }
      moveEntity(e, dt, map);

      // Inicialização de estado
      if (!e.vtState) {
        e.vtState    = 'idle';
        e.vtTimer    = 0;
        e.shootCool  = 1.5 + Math.random() * 1.5;
        e.floatT     = Math.random() * Math.PI * 2;
        e.aimDir     = { x: 0, y: -1 };
      }

      e.floatT    += dt;
      e.shootCool  = Math.max(0, e.shootCool - dt);

      const cx   = e.x + e.w / 2;
      const cy   = e.y + e.h / 2;
      const px2  = player.x + player.w / 2;
      const py2  = player.y + player.h / 2;
      const dx   = px2 - cx;
      const dy   = py2 - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const los  = dist < e.detRange &&
                   hasLineOfSight(map, cx, cy, px2, py2);

      // Sempre olha na direção horizontal do jogador
      e.dir = Math.sign(dx) || 1;

      switch (e.vtState) {
        case 'idle':
          if (los && e.shootCool <= 0) {
            e.vtState  = 'windup';
            e.vtTimer  = 0.65;
            e.aimDir   = { x: dx / dist, y: dy / dist };
          }
          // Partículas de aura passiva suaves
          if (Math.random() < 0.07) {
            spawnParticles(
              cx + (Math.random() - 0.5) * e.w,
              e.y + Math.random() * e.h,
              Math.random() < 0.5 ? '#550066' : '#330044', 1, 0.8
            );
          }
          break;

        case 'windup':
          e.vtTimer -= dt;
          // Atualiza mira enquanto carrega
          if (los && dist > 1) e.aimDir = { x: dx / dist, y: dy / dist };
          // Partículas de carga convergindo para a ponta
          if (Math.random() < 0.30) {
            const ang = Math.random() * Math.PI * 2;
            const r   = 14 + Math.random() * 10;
            spawnParticles(
              cx + Math.cos(ang) * r,
              e.y + 4 + Math.sin(ang) * r,
              Math.random() < 0.5 ? '#cc00ff' : '#6600aa', 1, 1.0
            );
          }
          if (e.vtTimer <= 0) {
            // Dispara projétil com homing fraco
            const SPD = 3.2;
            const proj = {
              x: cx, y: e.y + 4,
              vx: e.aimDir.x * SPD,
              vy: e.aimDir.y * SPD,
              owner: 'enemy', dmg: e.dmg,
              color: '#cc00ff', glowColor: '180,0,255',
              w: 9, h: 9,
              life: 3.0,
              // dados de homing
              homingTarget: player,
              homingTurn:   0.028,
              vtHoming: true,
            };
            projectiles.push(proj);
            spawnParticles(cx, e.y + 4, '#cc00ff', 10, 3.5);
            spawnParticles(cx, e.y + 4, '#440055',  5, 2.0);
            e.shootCool = 3.0 + Math.random() * 1.5;
            e.vtState   = 'idle';
          }
          break;
      }
    },
  },
  CHAIN_SPECTER: {
    w: 20, h: 24, hp: 45, speed: 1.0, dmg: 11, color: '#0a1a22',
    edgeColor: '#00ccff', detRange: 240, gravity: true,
    update(e, dt, map, player) {
      if (!e.csState) {
        e.csState   = 'patrol';
        e.shootCool = 1.8 + Math.random() * 1.2;
        e.aimTimer  = 0;
        e.aimDir    = { x: 1, y: 0 };
        e.floatT    = Math.random() * Math.PI * 2;
      }

      e.floatT += dt;

      // Gravidade suave — leve flutuação
      const bob = Math.sin(e.floatT * 2.5) * 0.15;
      if (e.onGround) { e.vy = 1 + bob; }
      else { e.vy += GRAVITY * 0.72; if (e.vy > MAX_FALL * 0.85) e.vy = MAX_FALL * 0.85; }

      const cx  = e.x + e.w / 2;
      const cy  = e.y + e.h / 2;
      const dx  = (player.x + player.w / 2) - cx;
      const dy  = (player.y + player.h / 2) - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const los  = dist < e.detRange &&
                   hasLineOfSight(map, cx, cy, player.x + player.w / 2, player.y + player.h / 2);

      switch (e.csState) {
        case 'patrol':
          e.vx = e.dir * e.speed;
          moveEntity(e, dt, map);
          // vira em paredes e bordas (igual WALKER)
          { const fx  = e.x + (e.dir > 0 ? e.w + 1 : -1);
            const fty = Math.floor((e.y + e.h + 2) / TILE);
            const ftx = Math.floor(fx / TILE);
            if (e.wallHit || (e.onGround && !isWalkableGround(getTile(map, ftx, fty)))) e.dir *= -1;
            e.wallHit = false; }
          // Clamp de mapa
          { const mW = map.cols * TILE;
            if (e.x < TILE)       { e.x = TILE;       e.dir =  1; }
            if (e.x + e.w > mW - TILE) { e.x = mW - TILE - e.w; e.dir = -1; } }

          e.shootCool = Math.max(0, e.shootCool - dt);
          if (los && e.shootCool <= 0) {
            e.csState  = 'aim';
            e.aimTimer = 0.55;
            e.aimDir   = { x: dx / dist, y: dy / dist };
            e.vx       = 0;
            e.dir      = Math.sign(dx);
          }
          break;

        case 'aim':
          e.vx = 0;
          moveEntity(e, dt, map);
          e.aimTimer -= dt;
          // Atualiza mira enquanto carrega
          if (dist > 1) e.aimDir = { x: dx / dist, y: dy / dist };
          if (e.aimTimer <= 0) {
            const SPD = 4.2;
            projectiles.push({
              x: cx, y: cy,
              vx: e.aimDir.x * SPD, vy: e.aimDir.y * SPD,
              owner: 'enemy', dmg: e.dmg,
              color: '#00ccff', glowColor: '0,200,255',
              w: 8, h: 8, life: 2.0,
              chainShot: true,   // visual diferenciado
            });
            spawnParticles(cx, cy, '#00ccff', 7, 2.5);
            e.shootCool = 2.2 + Math.random() * 1.0;
            e.csState   = 'patrol';
          }
          break;
      }
    },
  },
  VOID_SPECTER: {
    w: 22, h: 22, hp: 70, speed: 1.1, dmg: 13, color: '#220033',
    edgeColor: '#cc00ff', detRange: 999, gravity: false,
    update(e, dt, map, player) {
      // ── Inicialização ──────────────────────────────────────────────────────
      if (!e.vsState) {
        e.vsState    = 'drift';   // drift | charge | burst | retreat
        e.vsTimer    = 0;
        e.floatT     = Math.random() * Math.PI * 2; // fase aleatória por instância
        e.shootAngle = Math.random() * Math.PI * 2; // ângulo inicial do burst
        e.shootCool  = 2.0 + Math.random() * 1.5;
        e.burstCount = 0;        // rajadas restantes
        e.homeX      = e.x;
        e.homeY      = e.y;
      }

      e.floatT  += dt;
      e.vsTimer -= dt;

      const cx   = e.x + e.w / 2;
      const cy   = e.y + e.h / 2;
      const px2  = player.x + player.w / 2;
      const py2  = player.y + player.h / 2;
      const dx   = px2 - cx;
      const dy   = py2 - cy;
      const dist = Math.hypot(dx, dy) || 1;

      switch (e.vsState) {
        case 'drift': {
          // Flutua em torno da posição home com suave deriva em direção ao jogador
          const floatX = Math.sin(e.floatT * 1.3) * 28;
          const floatY = Math.cos(e.floatT * 1.7) * 18;
          const targetX = e.homeX + floatX + (dx / dist) * 18;
          const targetY = e.homeY + floatY + (dy / dist) * 14;

          e.vx += (targetX - cx) * 0.04;
          e.vy += (targetY - cy) * 0.04;
          const spd = Math.hypot(e.vx, e.vy);
          if (spd > e.speed) { e.vx = (e.vx / spd) * e.speed; e.vy = (e.vy / spd) * e.speed; }
          e.x += e.vx;
          e.y += e.vy;

          // Partículas de rastro suave
          if (Math.random() < 0.12) {
            spawnParticles(cx, cy,
              Math.random() < 0.5 ? '#660044' : '#003322', 1, 0.7);
          }

          e.shootCool = Math.max(0, e.shootCool - dt);
          if (e.shootCool <= 0 && dist < e.detRange) {
            e.vsState    = 'charge';
            e.vsTimer    = 0.8;
            e.shootAngle = Math.atan2(dy, dx); // alinha o primeiro raio ao jogador
            e.vx *= 0.2;
            e.vy *= 0.2;
          }
          break;
        }

        case 'charge': {
          // Para no ar e pulsa — telegrafando o burst
          e.vx *= 0.85;
          e.vy *= 0.85;
          e.x  += e.vx;
          e.y  += e.vy;

          // Partículas de carga convergindo para o centro
          if (Math.random() < 0.30) {
            const ang = Math.random() * Math.PI * 2;
            const r   = 20 + Math.random() * 14;
            spawnParticles(
              e.x + e.w / 2 + Math.cos(ang) * r,
              e.y + e.h / 2 + Math.sin(ang) * r,
              Math.random() < 0.5 ? '#cc00ff' : '#00ffcc', 1, 0.8
            );
          }

          if (e.vsTimer <= 0) {
            e.vsState    = 'burst';
            e.vsTimer    = 0;
            e.burstCount = 3;   // 3 rajadas em sequência
          }
          break;
        }

        case 'burst': {
          // Dispara 8 projéteis em volta, levemente rotacionados entre rajadas
          e.vx *= 0.90;
          e.vy *= 0.90;
          e.x  += e.vx;
          e.y  += e.vy;

          if (e.vsTimer <= 0 && e.burstCount > 0) {
            const COUNT = 8;
            const SPD   = 3.8;
            const rotStep = (Math.PI * 2 / COUNT);
            // rotação alternada: rajadas pares/ímpares deslocadas por meio passo
            const angleOff = (e.burstCount % 2 === 0) ? 0 : rotStep * 0.5;
            for (let i = 0; i < COUNT; i++) {
              const a  = e.shootAngle + angleOff + i * rotStep;
              const col = (i % 2 === 0) ? '#cc00ff' : '#00ffcc';
              spawnProjectile(
                e.x + e.w / 2, e.y + e.h / 2,
                Math.cos(a) * SPD, Math.sin(a) * SPD,
                'enemy', e.dmg, col, 7, 7
              );
            }
            spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#cc00ff', 10, 3.5);
            spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#00ffcc',  6, 2.5);

            e.shootAngle += Math.PI / COUNT; // gira levemente para a próxima rajada
            e.burstCount--;
            e.vsTimer = 0.22; // pausa entre rajadas
          }

          if (e.burstCount <= 0 && e.vsTimer <= 0) {
            e.vsState   = 'retreat';
            e.vsTimer   = 1.2;
            e.shootCool = 2.8 + Math.random() * 1.8;
            // afasta suavemente do jogador
            e.vx = -(dx / dist) * e.speed * 0.9;
            e.vy = -(dy / dist) * e.speed * 0.9;
          }
          break;
        }

        case 'retreat': {
          // Recua e retorna ao ciclo de flutuação
          e.vx *= 0.92;
          e.vy *= 0.92;
          e.x  += e.vx;
          e.y  += e.vy;
          if (e.vsTimer <= 0) {
            e.vsState = 'drift';
            // Atualiza o home para ficar próximo ao ponto atual
            e.homeX = e.x + (e.homeX - e.x) * 0.4;
            e.homeY = e.y + (e.homeY - e.y) * 0.4;
          }
          break;
        }
      }

      // Clamp dentro do mapa
      const minX = TILE, maxX = map.cols * TILE - TILE - e.w;
      const minY = TILE, maxY = map.rows * TILE - TILE - e.h;
      if (e.x < minX) { e.x = minX; e.vx = Math.abs(e.vx); e.homeX = e.x; }
      if (e.x > maxX) { e.x = maxX; e.vx = -Math.abs(e.vx); e.homeX = e.x; }
      if (e.y < minY) { e.y = minY; e.vy = Math.abs(e.vy); e.homeY = e.y; }
      if (e.y > maxY) { e.y = maxY; e.vy = -Math.abs(e.vy); e.homeY = e.y; }
    },
  },
  EYE_OF_VOID: {
    w: 28, h: 28, hp: 70, speed: 1.1, dmg: 15, color: '#060010',
    edgeColor: '#9922ff', detRange: 280, gravity: false,
    update(e, dt, map, player) {
      // ── Inicialização ────────────────────────────────────────────────
      if (!e.evState) {
        e.evState     = 'drift';
        e.evTimer     = 0;
        e.evCooldown  = 1.5 + Math.random() * 1.0;
        e.floatT      = Math.random() * Math.PI * 2;
        e.aimDir      = { x: 1, y: 0 };
        e.pupilDilate = 0;  // 0 = fenda, 1 = circular/vermelho
      }

      e.floatT    += dt;
      e.evCooldown = Math.max(0, e.evCooldown - dt);

      const ecx  = e.x + e.w / 2;
      const ecy  = e.y + e.h / 2;
      const dx   = (player.x + player.w / 2) - ecx;
      const dy   = (player.y + player.h / 2) - ecy;
      const dist = Math.hypot(dx, dy);

      // Sempre olha na direção do jogador
      if (dist > 1) e.dir = Math.sign(dx);

      const margin = TILE * 1.5;
      const _mW    = map.cols * TILE;
      const _mH    = map.rows * TILE;

      switch (e.evState) {

        case 'drift': {
          // Flutuação senoidal — deriva suavemente pelo ar
          const driftVX = e.dir * e.speed * (0.4 + 0.5 * Math.abs(Math.sin(e.floatT * 0.45)));
          const driftVY = Math.sin(e.floatT * 1.1) * 0.55;
          e.vx = e.vx * 0.88 + driftVX * 0.12;
          e.vy = e.vy * 0.88 + driftVY * 0.12;
          e.x += e.vx;
          e.y += e.vy;

          // Inverte nas bordas
          if (e.x < margin)               { e.x = margin;                e.dir =  1; }
          if (e.x + e.w > _mW - margin)   { e.x = _mW - margin - e.w;   e.dir = -1; }
          if (e.y < margin)               { e.y = margin;                e.vy =  0.5; }
          if (e.y + e.h > _mH - margin)   { e.y = _mH - margin - e.h;   e.vy = -0.5; }

          e.pupilDilate = Math.max(0, e.pupilDilate - dt * 2.5);

          const los = dist < e.detRange &&
                      hasLineOfSight(map, ecx, ecy,
                                     player.x + player.w / 2, player.y + player.h / 2);
          if (los && e.evCooldown <= 0) {
            e.evState = 'aim';
            e.evTimer = 1.2;
            e.aimDir  = { x: dx / dist, y: dy / dist };
            e.vx      = 0;
            e.vy      = 0;
          }
          break;
        }

        case 'aim': {
          // Para no ar e carrega
          e.vx       = 0;
          e.vy       = 0;
          e.evTimer -= dt;

          // Atualiza mira enquanto carrega
          if (dist > 1) e.aimDir = { x: dx / dist, y: dy / dist };

          // Pupila dilata progressivamente
          e.pupilDilate = 1 - Math.max(0, e.evTimer / 1.2);

          // Partículas de carregamento convergindo para o olho
          if (Math.random() < 0.22) {
            const angle = Math.random() * Math.PI * 2;
            const r     = 22 + Math.random() * 14;
            spawnParticles(
              ecx + Math.cos(angle) * r,
              ecy + Math.sin(angle) * r,
              '#9922ff', 1, 1.4
            );
          }

          if (e.evTimer <= 0) {
            // Salva de 3 projéteis em spread de ±18°
            const baseA  = Math.atan2(e.aimDir.y, e.aimDir.x);
            const SPD    = 4.8;
            for (const off of [0, -0.31, 0.31]) {
              const a = baseA + off;
              spawnProjectile(ecx, ecy,
                Math.cos(a) * SPD, Math.sin(a) * SPD,
                'enemy', e.dmg, '#7700cc', 9, 9);
            }
            spawnParticles(ecx, ecy, '#cc44ff', 14, 4.5);
            spawnParticles(ecx, ecy, '#220044',  8, 2.5);
            e.evCooldown = 3.5 + Math.random() * 1.5;
            e.evState    = 'retreat';
            e.evTimer    = 1.0;
          }
          break;
        }

        case 'retreat': {
          // Recua pelo ar em direção oposta ao jogador
          e.evTimer -= dt;
          if (dist > 1) {
            const retreatVX = -(dx / dist) * e.speed * 1.7;
            const retreatVY = -(dy / dist) * e.speed * 1.0;
            e.vx = e.vx * 0.75 + retreatVX * 0.25;
            e.vy = e.vy * 0.75 + retreatVY * 0.25;
          }
          e.x += e.vx;
          e.y += e.vy;

          if (e.x < margin)               { e.x = margin;                e.vx = 0; }
          if (e.x + e.w > _mW - margin)   { e.x = _mW - margin - e.w;   e.vx = 0; }
          if (e.y < margin)               { e.y = margin;                e.vy = 0; }
          if (e.y + e.h > _mH - margin)   { e.y = _mH - margin - e.h;   e.vy = 0; }

          e.pupilDilate = Math.max(0, e.pupilDilate - dt * 3.5);

          if (e.evTimer <= 0) {
            e.evState = 'drift';
            e.evTimer = 0;
          }
          break;
        }
      }
    },
  },
  WATCHER: {
    w: 24, h: 24, hp: 55, speed: 1.0, dmg: 14, color: '#0a0014',
    edgeColor: '#cc00ff', detRange: 320, gravity: false,
    update(e, dt, map, player) {
      // ── Inicialização ───────────────────────────────────────────────────
      if (!e.wtState) {
        e.wtState    = 'patrol';
        e.wtTimer    = 0;
        e.shootCool  = 1.5 + Math.random();
        e.floatT     = Math.random() * Math.PI * 2;
        e.homeY      = e.y;
      }

      e.floatT += dt;

      // ── Flutuação vertical passiva (senoide em torno de homeY) ──────────
      const floatTarget = e.homeY + Math.sin(e.floatT * 1.6) * 10;
      e.y += (floatTarget - e.y) * 0.05;

      const dx   = (player.x + player.w / 2) - (e.x + e.w / 2);
      const dy   = (player.y + player.h / 2) - (e.y + e.h / 2);
      const dist = Math.hypot(dx, dy);
      const los  = dist < e.detRange &&
                   hasLineOfSight(map, e.x + e.w / 2, e.y + e.h / 2,
                                       player.x + player.w / 2, player.y + player.h / 2);

      e.shootCool = Math.max(0, e.shootCool - dt);

      switch (e.wtState) {
        case 'patrol': {
          e.vx = e.dir * e.speed;
          e.x += e.vx;

          // Vira em paredes
          const ex  = e.x + (e.dir > 0 ? e.w + 1 : -1);
          const etx = Math.floor(ex / TILE);
          const ety = Math.floor((e.y + e.h / 2) / TILE);
          if (isSolid(getTile(map, etx, ety))) { e.dir *= -1; e.x -= e.vx * 2; }

          // Clamp de borda
          const _mW = map.cols * TILE;
          if (e.x < TILE)              { e.x = TILE;              e.dir =  1; }
          if (e.x + e.w > _mW - TILE)  { e.x = _mW - TILE - e.w; e.dir = -1; }

          if (los && e.shootCool <= 0) {
            e.wtState = 'windup';
            e.wtTimer = 0.7;
            e.vx      = 0;
            e.dir     = Math.sign(dx) || e.dir;
          }
          break;
        }

        case 'windup':
          e.wtTimer -= dt;
          e.vx = 0;
          // Partículas de carregamento convergindo para o olho
          if (Math.random() < 0.25) {
            const angle = Math.random() * Math.PI * 2;
            const r     = 18 + Math.random() * 10;
            spawnParticles(
              e.x + e.w / 2 + Math.cos(angle) * r,
              e.y + e.h / 2 + Math.sin(angle) * r,
              '#cc00ff', 1, 1.0
            );
          }
          if (e.wtTimer <= 0) {
            const spd   = 4.2;
            const norm  = dist > 1 ? dist : 1;
            const vx    = (dx / norm) * spd;
            const vy    = (dy / norm) * spd;
            projectiles.push({
              x: e.x + e.w / 2, y: e.y + e.h / 2,
              vx, vy,
              owner: 'enemy', dmg: e.dmg,
              color: '#cc00ff', glowColor: '200,0,255',
              w: 8, h: 8,
              life: 2.2,
            });
            spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#cc00ff', 10, 3.5);
            e.shootCool = 2.5 + Math.random() * 1.0;
            e.wtState   = 'patrol';
          }
          break;
      }
    },
  },
  WRAITH_MAGE: {
    w: 22, h: 32, hp: 90, speed: 0, dmg: 18, color: '#0a0018',
    edgeColor: '#cc0066', detRange: 999, gravity: true,
    update(e, dt, map, player) {
      const CAST_WINDUP  = 1.1;  // seg de animação antes de soltar o orbe
      const TP_WINDUP    = 0.5;  // seg de flash antes de teleportar
      const IDLE_TIME    = 2.2;  // seg parado antes de agir
      const ORB_SPD      = 3;  // velocidade inicial do orbe (lenta)
      const ORB_TURN     = 0.032; // quão agressivo o homing gira por frame
      const ORB_LIFE     = 6.0;  // segundos até o orbe morrer
      const ORB_DMG      = 18;

      // Inicialização
      if (!e.wmState) {
        e.wmState    = 'idle';
        e.wmTimer    = IDLE_TIME * (0.5 + Math.random());
        e.wmPhase    = 0;   // 0=cast orbe, 1=teleportar, 2=cast orbe, ...
        e.wmFlashAlpha = 0;
        e.floatT     = 0;
      }

      e.floatT += dt;
      // Sempre olha pro jogador
      e.dir = (player.x + player.w / 2) < (e.x + e.w / 2) ? -1 : 1;

      // Física
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }
      moveEntity(e, dt, map);

      const dx   = (player.x + player.w / 2) - (e.x + e.w / 2);
      const dy   = (player.y + player.h / 2) - (e.y + e.h / 2);
      const dist = Math.hypot(dx, dy);

      switch (e.wmState) {

        case 'idle':
          e.wmTimer -= dt;
          // Partículas de aura passiva
          if (Math.random() < 0.04) {
            spawnParticles(
              e.x + e.w / 2 + (Math.random() - 0.5) * e.w,
              e.y + Math.random() * e.h,
              '#880044', 2, 1.2
            );
          }
          if (e.wmTimer <= 0) {
            const los = hasLineOfSight(map, e.x + e.w / 2, e.y + e.h / 2,
                                            player.x + player.w / 2, player.y + player.h / 2);
            // Alterna entre lançar orbe e teleportar
            if (e.wmPhase % 2 === 0) {
              if (los) {
                // Tem visão — carrega e atira
                e.wmState = 'cast';
                e.wmTimer = CAST_WINDUP;
                e.wmPhase++;
              } else {
                // Sem visão — teleporta para tentar encontrar o jogador
                e.wmState = 'teleport';
                e.wmTimer = TP_WINDUP;
                // Não incrementa wmPhase: na próxima tentativa volta a querer atirar
              }
            } else {
              e.wmState = 'teleport';
              e.wmTimer = TP_WINDUP;
              e.wmPhase++;
            }
          }
          break;

        case 'cast':
          e.wmTimer -= dt;
          // Partículas de carregamento
          if (Math.random() < 0.18) {
            spawnParticles(
              e.x + e.w / 2 + (Math.random() - 0.5) * 20,
              e.y + e.h * 0.3 + (Math.random() - 0.5) * 20,
              Math.random() < 0.5 ? '#ff3399' : '#cc0066', 3, 2.0
            );
          }
          if (e.wmTimer <= 0) {
            // Lança orbe homing em direção ao jogador
            const angle = Math.atan2(dy, dx);
            const proj  = {
              x: e.x + e.w / 2, y: e.y + e.h * 0.35,
              vx: Math.cos(angle) * ORB_SPD,
              vy: Math.sin(angle) * ORB_SPD,
              owner: 'enemy', dmg: ORB_DMG,
              color: '#ff3399', w: 7, h: 7,
              life: ORB_LIFE,
              homing: true, homingTarget: player, homingTurn: ORB_TURN,
            };
            projectiles.push(proj);
            spawnParticles(e.x + e.w / 2, e.y + e.h * 0.35, '#ff3399', 14, 3.5);
            spawnParticles(e.x + e.w / 2, e.y + e.h * 0.35, '#440022',  8, 2.0);
            e.wmState = 'idle';
            e.wmTimer = IDLE_TIME;
          }
          break;

        case 'teleport':
          e.wmTimer -= dt;
          e.wmFlashAlpha = Math.max(0, e.wmTimer / TP_WINDUP); // fade-out branco
          // Partículas de dissolução
          if (Math.random() < 0.25) {
            spawnParticles(
              e.x + Math.random() * e.w,
              e.y + Math.random() * e.h,
              '#cc0066', 4, 2.5
            );
          }
          if (e.wmTimer <= 0) {
            // ── Coleta TODOS os slots de chão válidos do mapa ───────────────
            const MAP_W = map.cols * TILE;
            const validSlots = [];
            for (let col = 2; col < map.cols - 2; col++) {
              for (let row = 1; row < map.rows - 2; row++) {
                const tHere  = getTile(map, col, row);
                const tBelow = getTile(map, col, row + 1);
                // Slot válido: tile aqui é ar e tile abaixo é sólido
                if (!isSolid(tHere) && isSolid(tBelow)) {
                  validSlots.push({ tx: col, ty: row });
                }
              }
            }

            // ── Pontua cada slot e escolhe o melhor ─────────────────────────
            // Critérios (todos normalizados para a mesma escala):
            //   + longe do jogador        (evita aparecer em cima dele)
            //   + longe de onde ele está  (força exploração real do mapa)
            //   + tem LOS do jogador      (bônus — útil para atirar logo)
            //   - candidato já visitado   (penalidade via wmLastTx)
            const px2  = player.x + player.w / 2;
            const py2  = player.y + player.h / 2;
            const ex2  = e.x + e.w / 2;
            const ey2  = e.y + e.h / 2;
            const lastTx = e.wmLastTx ?? -999;

            let bestX = e.x, bestY = e.y, bestScore = -Infinity;

            // Amostra até 18 slots aleatórios para não travar o frame
            const sample = validSlots.length <= 18
              ? validSlots
              : Array.from({ length: 18 }, () => validSlots[Math.floor(Math.random() * validSlots.length)]);

            for (const slot of sample) {
              const sx = slot.tx * TILE + TILE / 2;
              const sy = slot.ty * TILE - e.h;

              const distPlayer  = Math.hypot(sx - px2, sy - py2);
              const distSelf    = Math.hypot(sx - ex2, sy - ey2);
              const sameColPenalty = Math.abs(slot.tx - lastTx) < 3 ? -120 : 0;
              const losBonusDest  = hasLineOfSight(map, sx, sy + e.h / 2, px2, py2) ? 80 : 0;

              // Descarta posições muito perto do jogador ou de si mesmo
              if (distPlayer < 64 || distSelf < 48) continue;

              const score = distPlayer * 0.6 + distSelf * 0.9 + losBonusDest + sameColPenalty;
              if (score > bestScore) { bestScore = score; bestX = sx; bestY = sy; e.wmLastTx = slot.tx; }
            }

            // Fallback seguro: se nenhum candidato passou nos filtros, usa o melhor sem restrição
            if (bestScore === -Infinity && validSlots.length > 0) {
              const slot = validSlots[Math.floor(Math.random() * validSlots.length)];
              bestX = slot.tx * TILE + TILE / 2;
              bestY = slot.ty * TILE - e.h;
            }
            spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ff3399', 20, 5);
            spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#220011', 10, 3);
            e.x = bestX - e.w / 2;
            e.y = bestY;
            e.vy = 0;
            e.wmFlashAlpha = 1.0; // flash de chegada (vai decaindo no draw)
            spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ff3399', 20, 5);
            e.wmState = 'idle';
            e.wmTimer = IDLE_TIME * 0.6;
          }
          break;
      }
    },
  },
  REVENANT: {
    w: 20, h: 28, hp: 55, speed: 0.6, dmg: 10, color: '#1a2a10',
    edgeColor: '#44aa22', detRange: 260, gravity: true,
    update(e, dt, map, player) {
      const RISE_TIME   = 5.0;  // tempo morto antes de ressuscitar
      const SHOOT_RANGE = 220;  // distância máxima para atirar
      const SHOOT_COOL  = 2;  // cooldown entre disparos (segundos)
      const BONE_SPD    = 3.8;

      // Inicialização de estado
      if (!e.rvState) {
        e.rvState      = 'patrol';  // patrol | aim | shoot | dead_temp | rising
        e.rvShootCool  = 1.5 + Math.random(); // delay inicial aleatório
        e.rvAimTimer   = 0;
        e.rvDeadTimer  = 0;
        e.rvDeaths     = 0;        // quantas vezes já "morreu"
        e.rvRisePulse  = 0;
        e.floatT       = 0;
      }

      e.floatT     += dt;
      e.rvRisePulse += dt;

      // ── Estado: deitado temporariamente ────────────────────────────────
      if (e.rvState === 'dead_temp') {
        e.vx = 0;
        e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL;
        moveEntity(e, dt, map);
        e.rvDeadTimer -= dt;

        // Efeito de fumaça verde saindo do corpo
        if (Math.random() < 0.08) {
          spawnParticles(e.x + e.w / 2, e.y + e.h * 0.3,
            Math.random() < 0.5 ? '#225511' : '#334422', 3, 1.5);
        }

        if (e.rvDeadTimer <= 0) {
          // Ressuscita!
          e.rvState = 'rising';
          e.rvDeadTimer = 0.7; // animação de levantar
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#44ff22', 18, 4);
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#226611', 10, 3);
        }
        return;
      }

      // ── Estado: levantando ──────────────────────────────────────────────
      if (e.rvState === 'rising') {
        e.vx = 0;
        e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL;
        moveEntity(e, dt, map);
        e.rvDeadTimer -= dt;
        if (e.rvDeadTimer <= 0) {
          // Volta à vida com HP cheio, mais agressivo
          e.hp    = e.maxHp;
          e.dead  = false;
          e.rvState      = 'patrol';
          e.rvShootCool  = 0.8; // mais agressivo após ressuscitar
          e.color        = '#0d1a08'; // fica um pouco mais escuro/putrefato
          e.edgeColor    = '#66ff33';
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#88ff44', 24, 5);
        }
        return;
      }

      // ── Física ──────────────────────────────────────────────────────────
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }

      const dx   = (player.x + player.w / 2) - (e.x + e.w / 2);
      const dy   = (player.y + player.h / 2) - (e.y + e.h / 2);
      const dist = Math.hypot(dx, dy);
      const los  = dist < e.detRange &&
                   hasLineOfSight(map, e.x + e.w / 2, e.y + e.h / 2,
                                       player.x + player.w / 2, player.y + player.h / 2);

      e.rvShootCool = Math.max(0, e.rvShootCool - dt);

      switch (e.rvState) {
        case 'patrol': {
          const _mW2 = map.cols * TILE;

          if (los) {
            const wantDir = Math.sign(dx) || e.dir;
            e.vx = dist < 80 ? 0 : wantDir * e.speed * 0.5;

            // Move primeiro — assim wallHit reflete o frame atual
            e.wallHit = false;
            moveEntity(e, dt, map);

            // Só aceita a nova direção se não bateu na parede nessa direção
            if (!e.wallHit) e.dir = wantDir;
            else            e.vx  = 0;

            if (e.rvShootCool <= 0 && dist < SHOOT_RANGE) {
              e.rvState    = 'aim';
              e.rvAimTimer = 0.7;
              e.rvAimDir   = { x: dx / dist, y: dy / dist };
              e.vx = 0;
            }
          } else {
            e.wallHit = false;
            e.vx = e.dir * e.speed;
            moveEntity(e, dt, map);
            const fx   = e.x + (e.dir > 0 ? e.w + 2 : -2);
            const fty2 = Math.floor((e.y + e.h + 2) / TILE);
            const ftx2 = Math.floor(fx / TILE);
            if (e.wallHit || (e.onGround && !isWalkableGround(getTile(map, ftx2, fty2)))) e.dir *= -1;
            e.wallHit = false;
          }

          if (e.x < TILE)               { e.x = TILE;               e.vx = 0; e.dir =  1; }
          if (e.x + e.w > _mW2 - TILE) { e.x = _mW2 - TILE - e.w; e.vx = 0; e.dir = -1; }
          break;
        }

        case 'aim':
          e.vx = 0;
          moveEntity(e, dt, map);
          e.rvAimTimer -= dt;
          // Atualiza mira enquanto carrega
          if (dist > 1) e.rvAimDir = { x: dx / dist, y: dy / dist };
          if (e.rvAimTimer <= 0) {
            // Dispara osso em 3 rajadas espaçadas
            const spread = 0.12;
            for (let i = -1; i <= 1; i++) {
              const angle = Math.atan2(e.rvAimDir.y, e.rvAimDir.x) + spread * i;
              spawnProjectile(
                e.x + e.w / 2, e.y + e.h * 0.4,
                Math.cos(angle) * BONE_SPD, Math.sin(angle) * BONE_SPD,
                'enemy', e.dmg, '#aabb88', 8, 5
              );
            }
            spawnParticles(e.x + e.w / 2, e.y + e.h * 0.4, '#778866', 8, 2.5);
            e.rvShootCool = SHOOT_COOL + Math.random() * 0.8;
            e.rvState     = 'patrol';
          }
          break;
      }
    },
  },
  VOID_CASTER: {
    w: 22, h: 30, hp: 70, speed: 0, dmg: 0, color: '#020010',
    edgeColor: '#3300cc', detRange: 999, gravity: true,
    update(e, dt, map, player) {
      // Física (parado no chão)
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }
      moveEntity(e, dt, map);

      // Inicializa estado
      if (!e.vcState) {
        e.vcState      = 'idle';
        e.vcCastCool   = 2.5;   // tempo até primeira invocação
        e.vcCastTimer  = 0;
        e.activeRifts  = [];    // [{ x, y, timer, maxTimer }]
        e.floatT       = 0;
      }

      e.floatT       += dt;
      e.vcCastCool    = Math.max(0, e.vcCastCool - dt);
      e.dir = (player.x + player.w / 2) < (e.x + e.w / 2) ? -1 : 1;

      // ── Atualiza rifts ativos ────────────────────────────────────────────
      const RIFT_DMG = 12;
      e.activeRifts = e.activeRifts.filter(r => {
        r.timer -= dt;
        if (r.timer <= 0) {
          // Explode — 6 projéteis em anel
          const SPD   = 3.6;
          const COUNT = 6;
          for (let i = 0; i < COUNT; i++) {
            const a = (i / COUNT) * Math.PI * 2;
            spawnProjectile(r.x, r.y, Math.cos(a) * SPD, Math.sin(a) * SPD,
              'enemy', RIFT_DMG, '#2200ff', 7, 7);
          }
          spawnParticles(r.x, r.y, '#3300cc', 10, 4);
          spawnParticles(r.x, r.y, '#6644ff',  5, 2.5);
          return false; // remove rift
        }
        return true;
      });

      // ── Máquina de estados ───────────────────────────────────────────────
      const dx   = (player.x + player.w / 2) - (e.x + e.w / 2);
      const dist = Math.abs(dx);

      switch (e.vcState) {
        case 'idle':
          if (e.vcCastCool <= 0 && e.activeRifts.length < 2 && dist < e.detRange) {
            e.vcState     = 'casting';
            e.vcCastTimer = 1.3; // duração da animação de cast
          }
          break;

        case 'casting':
          e.vcCastTimer -= dt;
          if (e.vcCastTimer <= 0) {
            // Posiciona o rift nos pés do jogador (centro X, chão)
            const riftOffsetX = (Math.random() - 0.5) * 96; // ±48 px na horizontal
            const riftOffsetY = Math.random() * -32;          // 0 a -32 px acima dos pés
            const riftX = player.x + player.w / 2 + riftOffsetX;
            const riftY = player.y + player.h     + riftOffsetY;
            e.activeRifts.push({ x: riftX, y: riftY, timer: 1.8, maxTimer: 1.8 });
            spawnParticles(riftX, riftY - 8, '#220088', 7, 2);
            e.vcCastCool = 4.0;
            e.vcState    = 'idle';
          }
          break;
      }
    },
  },
  GUNNER: {
    w: 20, h: 26, hp: 45, speed: 0.9, dmg: 12, color: '#1a1a0a',
    edgeColor: '#aaaa22', detRange: 300, gravity: true,
    update(e, dt, map, player) {
      if (!e.gunState) { e.gunState = 'patrol'; e.shootCool = 0; e.chargeTimer = 0; e.aimDir = { x: 0, y: 0 }; }
 
      const dx   = (player.x + player.w / 2) - (e.x + e.w / 2);
      const dy   = (player.y + player.h / 2) - (e.y + e.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const los  = dist < e.detRange &&
                   hasLineOfSight(map, e.x + e.w / 2, e.y + e.h / 2,
                                       player.x + player.w / 2, player.y + player.h / 2);
 
      // Gravidade sempre
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }
 
      switch (e.gunState) {
        case 'patrol':
          e.vx = e.dir * e.speed;
          moveEntity(e, dt, map);
          { const fx  = e.x + (e.dir > 0 ? e.w + 2 : -2);
            const fty = Math.floor((e.y + e.h + 2) / TILE);
            const ftx = Math.floor(fx / TILE);
            if (e.wallHit || (e.onGround && !isWalkableGround(getTile(map, ftx, fty)))) e.dir *= -1;
            e.wallHit = false; }
          e.shootCool = Math.max(0, e.shootCool - dt);
          if (los && e.shootCool <= 0) {
            e.gunState    = 'charge';
            e.chargeTimer = 0.45;
            e.aimDir      = { x: dx / dist, y: dy / dist };
            e.vx          = 0;
            e.dir         = Math.sign(dx);
          }
          break;
 
        case 'charge':
          e.vx = 0;
          moveEntity(e, dt, map);
          e.chargeTimer -= dt;
          if (dist > 1) e.aimDir = { x: dx / dist, y: dy / dist };
          if (e.chargeTimer <= 0) {
            const spd = 5;
            spawnProjectile(e.x + e.w / 2, e.y + e.h / 2,
              e.aimDir.x * spd, e.aimDir.y * spd,
              'enemy', e.dmg, '#ffff44');
            spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ffff44', 6, 2);
            e.shootCool = 2.0;
            e.gunState  = 'patrol';
          }
          break;
      }
    },
  },
  // MIMIC: fica parado se passando por um baú. Quando o jogador se aproxima,
  // "abre" (fase REVEAL) e parte para o ataque corpo-a-corpo (fase HUNT).
  // Enquanto em repouso não aparece na barra de HP nem reage a ataques.
  MIMIC: {
    w: 24, h: 20, hp: 60, speed: 1.8, dmg: 18, color: '#3a2200',
    edgeColor: '#c8860a', detRange: 72, gravity: true,
    update(e, dt, map, player) {
      if (!e.mimicState) {
        e.mimicState  = 'chest';
        e.revealTimer = 0;
        e.aggroRange  = e.detRange;
        e.resetTimer  = 0;
      }
 
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }
 
      const dx   = (player.x + player.w / 2) - (e.x + e.w / 2);
      const dy   = (player.y + player.h / 2) - (e.y + e.h / 2);
      const dist = Math.hypot(dx, dy);
      const los  = hasLineOfSight(map, e.x + e.w / 2, e.y + e.h / 2,
                                       player.x + player.w / 2, player.y + player.h / 2);
 
      switch (e.mimicState) {
        case 'chest':
          e.vx = 0;
          e.resetTimer = 0;
          moveEntity(e, dt, map);
          // Só revela se o jogador estiver perto E tiver linha de visão
          if (dist < e.aggroRange && los) {
            e.mimicState  = 'reveal';
            e.revealTimer = 0.6;
            spawnParticles(e.x + e.w / 2, e.y, '#c8860a', 10, 3);
          }
          break;
 
        case 'reveal':
          e.vx = 0;
          moveEntity(e, dt, map);
          e.revealTimer -= dt;
          if (e.revealTimer <= 0) e.mimicState = 'hunt';
          break;
 
        case 'hunt':
          if (los) {
            e.resetTimer = 0;
            const PREFERRED_DIST = 15; // para quando chega nessa distância do jogador
 
            if (dist > PREFERRED_DIST) {
              e.vx  = Math.sign(dx) * e.speed;
              e.dir = Math.sign(dx);
            } else {
              e.vx  = 0;
              e.dir = Math.sign(dx); // continua olhando pro jogador
            }
          } else {
            e.vx = 0;
            e.resetTimer += dt;
            if (e.resetTimer >= 0.3) {
              e.mimicState  = 'chest';
              e.resetTimer  = 0;
              e.hp          = Math.min(e.maxHp, e.hp + 10);
            }
          }
          moveEntity(e, dt, map);
          break;
      }
    },
  },
  BOMBER: {
    w: 20, h: 22, hp: 35, speed: 1.1, dmg: 8, color: '#3a0a00',
    edgeColor: '#ff4400', detRange: 0, gravity: true,
    update(e, dt, map, player) {
      // Movimento igual ao WALKER
      e.vx = e.dir * e.speed;
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }
      moveEntity(e, dt, map);
      const fx  = e.x + (e.dir > 0 ? e.w + 2 : -2);
      const fty = Math.floor((e.y + e.h + 2) / TILE);
      const ftx = Math.floor(fx / TILE);
      if (e.wallHit || (e.onGround && !isWalkableGround(getTile(map, ftx, fty)))) e.dir *= -1;
      e.wallHit = false;
    },
  },
  SUMMONER: {
    w: 22, h: 30, hp: 80, speed: 0, dmg: 0, color: '#1a002a',
    edgeColor: '#cc00ff', detRange: 999, gravity: true,
    update(e, dt, map, player) {
      // Física básica (fica no chão)
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }
      moveEntity(e, dt, map);
 
      // Inicializa estado
      if (!e.summonState) {
        e.summonState   = 'idle';
        e.summonTimer   = 2.0;   // primeira invocação após 3s
        e.summonedIds   = [];
        e.shieldPulse   = 0;
        e.castTimer     = 0;
        e.shieldCooldown = 0;    // janela de vulnerabilidade após perder o escudo
        e.wasShielded   = false;
      }
 
      e.shieldPulse    += dt;
      e.summonTimer     = Math.max(0, e.summonTimer - dt);
      e.shieldCooldown  = Math.max(0, e.shieldCooldown - dt);
 
      // Conta invocados ainda vivos
      const prevCount = e.summonedIds.length;
      e.summonedIds = e.summonedIds.filter(minion => !minion.dead);
 
      // Detecta quando o último minion acabou de morrer → abre janela de vulnerabilidade
      if (prevCount > 0 && e.summonedIds.length === 0) {
        e.shieldCooldown = 3.5; // 3.5s sem escudo e sem invocar
        e.summonTimer    = Math.max(e.summonTimer, e.shieldCooldown + 1.0);
      }
 
      // Escudo ativo só se tiver invocados E não estiver em cooldown
      e.shielded = e.summonedIds.length > 0 && e.shieldCooldown <= 0;
 
      // Inicia invocação quando timer zera e tem menos de 3 invocados
      if (e.summonTimer <= 0 && e.summonedIds.length < 3 && e.summonState === 'idle') {
        e.summonState = 'casting';
        e.castTimer   = 1.2; // animação de cast
      }
 
      if (e.summonState === 'casting') {
        e.castTimer -= dt;
        if (e.castTimer <= 0) {
          // Invoca um WALKER ao lado
          const side   = e.summonedIds.length % 2 === 0 ? 1 : -1;
          const spawnX = e.x + e.w / 2 + side * 48;
          const spawnY = e.y;
          const minion = createEnemy('WALKER', 0, 0);
          minion.x     = spawnX - minion.w / 2;
          minion.y     = spawnY;
          e.summonedIds.push(minion);
          enemies.push(minion);
          spawnParticles(spawnX, spawnY + 16, '#cc00ff', 8, 4);
          spawnParticles(spawnX, spawnY + 16, '#ff88ff',  4, 3);
          e.summonTimer = 5.0; // intervalo entre invocações
          e.summonState = 'idle';
        }
      }
    },
  },
  // GHOST: atravessa paredes, flutua em direção ao jogador.
  // Alterna entre INTANGÍVEL (não recebe dano, semi-transparente) e
  // MATERIALIZADO (recebe dano, ataca). Materializa quando está perto do jogador.
  GHOST: {
    w: 20, h: 24, hp: 40, speed: 1.2, dmg: 14, color: '#aaccff',
    edgeColor: '#ddeeff', detRange: 280, gravity: false,
    update(e, dt, map, player) {
      if (!e.ghostState) {
        e.ghostState  = 'intangible';
        e.stateTimer  = 0;
        e.floatT      = 0;
        e.shootCool   = 1.8 + Math.random() * 1.2;
        e.windupTimer = 0;
        e.isWindup    = false;
      }
 
      const dx   = (player.x + player.w / 2) - (e.x + e.w / 2);
      const dy   = (player.y + player.h / 2) - (e.y + e.h / 2);
      const dist = Math.hypot(dx, dy);
 
      e.floatT  += dt;
      e.stateTimer = Math.max(0, e.stateTimer - dt);
 
      switch (e.ghostState) {
        case 'intangible': {
          // Flutua em direção ao jogador atravessando tudo
          if (!e.isWindup) {
            if (dist < e.detRange) {
              e.vx += (dx / dist) * 0.18;
              e.vy += (dy / dist) * 0.18;
            } else {
              e.vy += Math.sin(e.floatT * 1.5) * 0.04;
            }
            { const spd = Math.hypot(e.vx, e.vy);
              if (spd > e.speed) { e.vx = (e.vx / spd) * e.speed; e.vy = (e.vy / spd) * e.speed; } }
            e.x += e.vx;
            e.y += e.vy;
          } else {
            // Windup: para no ar e carrega o disparo
            e.vx *= 0.80;
            e.vy *= 0.80;
            e.x  += e.vx;
            e.y  += e.vy;
            e.windupTimer -= dt;
            // Partículas de carga convergindo para o ghost
            if (Math.random() < 0.28) {
              const ang = Math.random() * Math.PI * 2;
              const r   = 18 + Math.random() * 12;
              spawnParticles(
                e.x + e.w / 2 + Math.cos(ang) * r,
                e.y + e.h / 2 + Math.sin(ang) * r,
                Math.random() < 0.5 ? '#aaccff' : '#6688cc', 1, 0.9
              );
            }
            if (e.windupTimer <= 0) {
              // Dispara orbe espectral lento em direção ao jogador
              if (dist > 1) {
                const SPD = 2.8;
                projectiles.push({
                  x: e.x + e.w / 2, y: e.y + e.h / 2,
                  vx: (dx / dist) * SPD, vy: (dy / dist) * SPD,
                  owner: 'enemy', dmg: Math.round(e.dmg * 0.65),
                  color: '#aaddff', glowColor: '140,200,255',
                  w: 10, h: 10, life: 3.2,
                  spectral: true,
                });
                spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#aaccff', 10, 2.5);
                spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ffffff',  5, 1.5);
              }
              e.isWindup  = false;
              e.shootCool = 2.5 + Math.random() * 1.5;
            }
          }
          // Cooldown do disparo
          if (!e.isWindup) {
            e.shootCool = Math.max(0, e.shootCool - dt);
            const los = dist < e.detRange &&
                        hasLineOfSight(map, e.x + e.w / 2, e.y + e.h / 2,
                                            player.x + player.w / 2, player.y + player.h / 2);
            if (e.shootCool <= 0 && los && dist > 55) {
              e.isWindup    = true;
              e.windupTimer = 0.55;
            }
          }
          // Materializa quando perto (prioridade sobre o disparo)
          if (dist < 60 && e.stateTimer <= 0) {
            e.isWindup   = false;
            e.ghostState = 'materializing';
            e.stateTimer = 0.6;
          }
          break;
        }
 
        case 'materializing':
          e.vx *= 0.85;
          e.vy *= 0.85;
          e.x  += e.vx;
          e.y  += e.vy;
          if (e.stateTimer <= 0) {
            e.ghostState = 'material';
            e.stateTimer = 2.5; // fica material por 2.5s
            e.vx = 0; e.vy = 0;
          }
          break;
 
        case 'material':
          // Quando material, usa física normal mas sem gravidade
          e.vx *= 0.85;
          e.vy *= 0.85;
          if (dist < e.detRange) {
            e.vx += (dx / dist) * 0.12;
            e.vy += (dy / dist) * 0.12;
          }
          { const spd = Math.hypot(e.vx, e.vy);
            if (spd > e.speed * 0.7) { e.vx = (e.vx / spd) * e.speed * 0.7; e.vy = (e.vy / spd) * e.speed * 0.7; } }
          e.x += e.vx;
          e.y += e.vy;
          if (e.stateTimer <= 0) {
            e.ghostState  = 'intangible';
            e.stateTimer  = 1.0; // cooldown antes de poder materializar de novo
            e.hitFlash    = 0;
          }
          break;
      }
    },
  },
  SPECTER: {
    w: 18, h: 26, hp: 45, speed: 2.0, dmg: 12, color: '#0d0020',
    edgeColor: '#8833cc', detRange: 300, gravity: true,
    update(e, dt, map, player) {
      if (!e.specterState) {
        e.specterState = 'patrol';
        e.shootCool    = 1.5;
        e.chargeTimer  = 0;
        e.aimDir       = { x: 1, y: 0 };
        e.floatT       = 0;
      }

      e.floatT += dt;

      // Gravidade suave — flutuação leve sobreposta
      const floatBob = Math.sin(e.floatT * 2.8) * 0.18;
      if (e.onGround) { e.vy = 1 + floatBob; } else { e.vy += GRAVITY * 0.7; if (e.vy > MAX_FALL * 0.8) e.vy = MAX_FALL * 0.8; }

      const dx   = (player.x + player.w / 2) - (e.x + e.w / 2);
      const dy   = (player.y + player.h / 2) - (e.y + e.h / 2);
      const dist = Math.hypot(dx, dy);
      const los  = dist < e.detRange &&
                   hasLineOfSight(map, e.x + e.w / 2, e.y + e.h / 2,
                                       player.x + player.w / 2, player.y + player.h / 2);

      switch (e.specterState) {
        case 'patrol':
          e.vx = e.dir * e.speed;
          moveEntity(e, dt, map);
          // clamp dentro dos limites do mapa — evita sumir pela borda
          { const minX = TILE;
            const maxX = map.cols * TILE - TILE - e.w;
            if (e.x < minX) { e.x = minX; e.dir =  1; }
            if (e.x > maxX) { e.x = maxX; e.dir = -1; } }
          // vira em paredes e bordas (igual ao WALKER)
          { const fx  = e.x + (e.dir > 0 ? e.w + 1 : -1);
            const fty = Math.floor((e.y + e.h + 2) / TILE);
            const ftx = Math.floor(fx / TILE);
            if (e.wallHit || (e.onGround && !isWalkableGround(getTile(map, ftx, fty)))) e.dir *= -1;
            e.wallHit = false; }
          e.shootCool = Math.max(0, e.shootCool - dt);
          // detecta LOS → telegrafar tiro
          if (los && e.shootCool <= 0) {
            e.specterState = 'charge';
            e.chargeTimer  = 0.5;
            e.aimDir       = { x: dx / dist, y: dy / dist };
            e.vx           = 0;
            e.dir          = Math.sign(dx);
          }
          break;

        case 'charge':
          // Para e carrega — rastro de partículas aumenta
          e.vx = 0;
          moveEntity(e, dt, map);
          e.chargeTimer -= dt;
          // atualiza mira enquanto carrega
          if (dist > 1) e.aimDir = { x: dx / dist, y: dy / dist };
          if (e.chargeTimer <= 0) {
            // dispara projétil espectral
            const spd = 4.5;
            spawnProjectile(
              e.x + e.w / 2, e.y + e.h / 2,
              e.aimDir.x * spd, e.aimDir.y * spd,
              'enemy', e.dmg, '#cc55ff', 7, 7
            );
            spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#8833cc', 8, 2.5);
            e.shootCool    = 2.2;
            e.specterState = 'patrol';
          }
          break;
      }
    },
  },
  FLIER: {
    w: 22, h: 18, hp: 30, speed: 1.6, dmg: 8, color: '#1a1a4a',
    edgeColor: '#3333aa', detRange: 300, gravity: false,
    update(e, dt, map, player) {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const MIN_DIST = 28;
      if (dist < e.detRange) {
        e.vx *= 0.90;
        e.vy *= 0.90;
        if (dist > MIN_DIST) {
          e.vx += (dx / dist) * 0.25;
          e.vy += (dy / dist) * 0.25;
        }
        // dentro do MIN_DIST: só o amortecimento age, sem repulsão — freia suavemente
      } else {
        // float
        e.floatT = (e.floatT || 0) + dt * 2;
        e.vy += Math.sin(e.floatT) * 0.05;
        e.vx *= 0.95;
      }
      // cap speed
      const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
      if (spd > e.speed) { e.vx = (e.vx / spd) * e.speed; e.vy = (e.vy / spd) * e.speed; }
      e.x += e.vx;
      e.y += e.vy;
    },
  },
  SHOOTER: {
    w: 20, h: 28, hp: 60, speed: 0, dmg: 15, color: '#2a0a2a',
    edgeColor: '#6a3a6a', detRange: 350, gravity: true,
    shootCool: 0,
    update(e, dt, map, player) {
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }
      moveEntity(e, dt, map);
 
      e.shootCool = (e.shootCool || 2) - dt;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < e.detRange && e.shootCool <= 0 &&
          hasLineOfSight(map, e.x + e.w / 2, e.y + e.h / 2, player.x + player.w / 2, player.y + player.h / 2)) {
        const spd = 4;
        spawnProjectile(e.x + e.w / 2, e.y + e.h / 2,
          (dx / dist) * spd, (dy / dist) * spd,
          'enemy', e.dmg, '#9b59b6');
        e.shootCool = 2.5;
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#9b59b6', 5, 2);
      }
    },
  },
  // DASHER: patrulha devagar; ao detectar o jogador telegrafeia e dispara um dash veloz.
  // Estados: 'patrol' → 'windup' → 'dashing' → 'stunned' → 'patrol'
  DASHER: {
    w: 22, h: 24, hp: 50, speed: 0.8, dmg: 22, color: '#1a0a2e',
    edgeColor: '#aa22ff', detRange: 240, gravity: true,
    update(e, dt, map, player) {
      // Inicializa estado
      if (!e.dashState) { e.dashState = 'patrol'; e.dashTimer = 0; e.dashDir = 1; }
 
      // Gravidade sempre
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }
 
      const dx   = player.x - e.x;
      const dist = Math.abs(dx);
 
      switch (e.dashState) {
        case 'patrol': {
          e.vx = e.dir * e.speed;
          moveEntity(e, dt, map);
          const fx  = e.x + (e.dir > 0 ? e.w + 2 : -2);
          const fty = Math.floor((e.y + e.h + 2) / TILE);
          const ftx = Math.floor(fx / TILE);

          // ── Impede sair pelas bordas do mapa ──────────────────────────
          const _mapW = map.cols * TILE;
          if (e.x < TILE || e.x + e.w > _mapW - TILE) {
            e.x = Math.max(TILE, Math.min(_mapW - e.w - TILE, e.x));
            e.wallHit = true;
          }
          // ─────────────────────────────────────────────────────────────

          if (e.wallHit || (e.onGround && !isWalkableGround(getTile(map, ftx, fty)))) e.dir *= -1;
          e.wallHit = false;

          if (e.onGround && dist < e.detRange &&
              hasLineOfSight(map, e.x + e.w / 2, e.y + e.h / 2,
                                  player.x + player.w / 2, player.y + player.h / 2)) {
            e.dashState = 'windup';
            e.dashTimer = 0.55;
            e.dashDir   = Math.sign(dx);
            e.vx        = 0;
          }
          break;
        }
 
        case 'windup':
          e.vx = 0;
          moveEntity(e, dt, map);
          e.dashTimer -= dt;
          if (e.dashTimer <= 0) {
            e.dashState = 'dashing';
            e.dashTimer = 0.45;   // duração do dash
            e.vx        = e.dashDir * 10;
            spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#aa22ff', 10, 3);
          }
          break;
 
        case 'dashing':
          e.vx = e.dashDir * 10;
          moveEntity(e, dt, map);
          e.dashTimer -= dt;
          if (Math.random() < 0.4) spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#aa22ff', 2, 2);

          // ── Impede que o dash atravesse bordas/portais ──────────────────
          const _mapW    = map.cols * TILE;
          const _mapH    = map.rows * TILE;
          const _outLeft  = e.x < TILE;
          const _outRight = e.x + e.w > _mapW - TILE;
          const _outVert  = e.y < 0 || e.y + e.h > _mapH;
          if (_outLeft || _outRight || _outVert) {
            e.x = Math.max(TILE, Math.min(_mapW - e.w - TILE, e.x));
            e.y = Math.max(0,    Math.min(_mapH - e.h,        e.y));
            e.wallHit = true;
          }
          // ───────────────────────────────────────────────────────────────

          if (e.wallHit || e.dashTimer <= 0) {
            e.dashState = 'stunned';
            e.dashTimer = 0.9;
            e.vx        = 0;
            if (e.wallHit) spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ffffff', 14, 4);
            e.wallHit = false;
          }
          break;
 
        case 'stunned':
          e.vx = 0;
          moveEntity(e, dt, map);
          e.dashTimer -= dt;
          if (e.dashTimer <= 0) {
            e.dashState = 'patrol';
            e.dir       = -e.dashDir; // vira ao sair do atordoamento
          }
          break;
      }
    },
  },
  SENTINEL: {
    w: 26, h: 26, hp: 50, speed: 0, dmg: 12, color: '#1a000a',
    edgeColor: '#ff3300', detRange: 340, gravity: false,
    update(e, dt, map, player) {
      // Guarda a posição de spawn na primeira vez
      if (e.homeX === undefined) { e.homeX = e.x; e.homeY = e.y; }
 
      // Flutuação lenta em torno do ponto de origem
      e.floatT     = (e.floatT     || 0) + dt;
      e.shootAngle = (e.shootAngle || 0) + dt * 1.1; // anel gira continuamente
      e.x = e.homeX + Math.sin(e.floatT * 1.4) * 5;
      e.y = e.homeY + Math.sin(e.floatT * 2.1) * 6;
 
      e.shootCool = (e.shootCool ?? 3.5) - dt;
 
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
 
      if (e.shootCool <= 0 &&
          Math.hypot(player.x - cx, player.y - cy) < e.detRange &&
          hasLineOfSight(map, cx, cy, player.x + player.w / 2, player.y + player.h / 2)) {
        // 8 projeteis em circulo completo
        const COUNT = 8;
        const SPD   = 3.2;
        for (let i = 0; i < COUNT; i++) {
          const a = (i / COUNT) * Math.PI * 2 + e.shootAngle;
          spawnProjectile(cx, cy, Math.cos(a) * SPD, Math.sin(a) * SPD,
            'enemy', e.dmg, '#ff3300', 6, 6);
        }
        spawnParticles(cx, cy, '#ff3300', 14, 3);
        e.shootCool = 2.8;
      }
    },
  },
  // JUMPER: persegue o jogador com saltos rápidos e muda de direção no ar
  JUMPER: {
    w: 18, h: 20, hp: 55, speed: 2.8, dmg: 18, color: '#1a2a0a',
    edgeColor: '#4a8a1a', detRange: 280, gravity: true,
    update(e, dt, map, player) {
      e.jumpCool = (e.jumpCool ?? 0) - dt;
      if (e.onGround) { e.vy = 2; } else { e.vy += GRAVITY; if (e.vy > MAX_FALL) e.vy = MAX_FALL; }
      moveEntity(e, dt, map);
      e.wallHit = false;
 
      const dx   = player.x - e.x;
      const dist = Math.abs(dx);
 
      // Quando no chão e o cooldown acabou, salta em direção ao jogador
      if (e.onGround && e.jumpCool <= 0 && dist < e.detRange) {
        e.vy       = -9.5;
        e.vx       = Math.sign(dx) * e.speed;
        e.dir      = Math.sign(dx);
        e.jumpCool = 1.2;
        e.onGround = false;
        spawnParticles(e.x + e.w / 2, e.y + e.h, '#4a8a1a', 6, 2);
      }
 
      // Enquanto no ar, mantém impulso horizontal
      if (!e.onGround) {
        e.vx += Math.sign(dx) * 0.08;
        const maxSpd = e.speed * 1.4;
        if (Math.abs(e.vx) > maxSpd) e.vx = Math.sign(e.vx) * maxSpd;
      } else {
        e.vx *= 0.7; // freio ao pousar
      }
    },
  },
};

function createEnemy(type, tx, ty) {
  const def = ENEMY_DEFS[type];
  return {
    ...def,
    type,
    x: tx * TILE + (TILE - def.w) / 2,
    y: ty * TILE - def.h,
    vx: 0, vy: 0,
    dir: 1,
    hp: def.hp,
    maxHp: def.hp,
    onGround: false,
    wallHit: false,
    hitFlash: 0,
    dead: false,
    speed: def.speed,
    detRange: def.detRange,
  };
}

// ─── PHYSICS / MOVE ENTITY ─────────────────────────────────────────────────
function moveEntity(e, dt, map) {
  // Horizontal
  e.x += e.vx;
  const rectH = { x: e.x, y: e.y + 1, w: e.w, h: e.h - 2 };
  resolveHorizontal(e, rectH, map);

  // Vertical
  e.y += e.vy;
  const rectV = { x: e.x + 1, y: e.y, w: e.w - 2, h: e.h };
  resolveVertical(e, rectV, map);
}

function resolveHorizontal(e, rect, map) {
  const x0 = Math.floor(rect.x / TILE);
  const x1 = Math.floor((rect.x + rect.w - 1) / TILE);
  const y0 = Math.floor(rect.y / TILE);
  const y1 = Math.floor((rect.y + rect.h - 1) / TILE);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isSolid(getTile(map, tx, ty))) continue;
      // Só corrige se o tile sólido está na coluna que o jogador está ENTRANDO
      if (e.vx > 0 && tx === x1) {
        e.x = tx * TILE - e.w;
        e.wallHit = true;
        e.vx = 0;
        return; // sai imediatamente — um único hit é suficiente
      }
      if (e.vx < 0 && tx === x0) {
        e.x = (tx + 1) * TILE;
        e.wallHit = true;
        e.vx = 0;
        return;
      }
    }
  }
}

function resolveVertical(e, rect, map) {
  const x0 = Math.floor(rect.x / TILE);
  const x1 = Math.floor((rect.x + rect.w - 1) / TILE);
  const y0 = Math.floor(rect.y / TILE);
  const y1 = Math.floor((rect.y + rect.h - 1) / TILE);

  e.onGround = false;
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = getTile(map, tx, ty);
      if (isSolid(t)) {
        const tileTop    = ty * TILE;
        const tileBottom = (ty + 1) * TILE;
        const overlapY   = Math.min(e.y + e.h, tileBottom) - Math.max(e.y, tileTop);

        if (e.vy > 0 && overlapY > 1) {
          e.y = tileTop - e.h;
          e.onGround = true;
          e.vy = 0;
        } else if (e.vy < 0 && overlapY > 1) {
          e.y = tileBottom;
          e.vy = 0;
        }
      }
      // One-way platform (PLAT e DOOR_D — exceto quando dropThrough ativo)
      if ((t === T.PLAT || t === T.DOOR_D) && e.vy > 0 &&
          (!e.dropThrough || ty !== e.dropThroughTileY)) {
        const bottom = e.y + e.h;
        const top    = ty * TILE;
        if (bottom - e.vy <= top + 1) {
          e.y = top - e.h;
          e.vy = 0;
          e.onGround = true;
        }
      }
    }
  }
}

// ─── ARCANE STORM ──────────────────────────────────────────────────────────
const ARCANE_STORM_COOLDOWN  = 18;   // segundos de cooldown
const ARCANE_STORM_DURATION  = 3.5;  // segundos de duração
const ARCANE_STORM_DMG       = 35;   // dano por explosão
const ARCANE_STORM_INTERVAL  = 0.12; // segundos entre explosões
const ARCANE_STORM_RADIUS    = 40;   // raio de dano de cada explosão
const ARCANE_STORM_MIN_MP    = 30;   // mana mínima para ativar

let arcaneStorm = {
  active:        false,
  timer:         0,    // tempo restante de duração
  cooldown:      0,    // cooldown restante
  spawnTimer:    0,    // contador para próxima explosão
  blasts:        [],   // explosões visuais ativas: { x, y, life, maxLife, r }
};

function updateArcaneStorm(dt, player, map, enemies) {
  // Cooldown sempre regride
  if (arcaneStorm.cooldown > 0) arcaneStorm.cooldown -= dt;

  // Atualiza visuais das explosões ativas
  for (let i = arcaneStorm.blasts.length - 1; i >= 0; i--) {
    arcaneStorm.blasts[i].life -= dt;
    if (arcaneStorm.blasts[i].life <= 0) arcaneStorm.blasts.splice(i, 1);
  }

  if (!arcaneStorm.active) return;

  arcaneStorm.timer      -= dt;
  arcaneStorm.spawnTimer -= dt;

  if (arcaneStorm.timer <= 0) {
    arcaneStorm.active   = false;
    arcaneStorm.cooldown = ARCANE_STORM_COOLDOWN;
    return; // ← encerra aqui, antes de spawnar mais explosões
  }

  // Spawna nova explosão no intervalo
  if (arcaneStorm.spawnTimer <= 0) {
    arcaneStorm.spawnTimer = ARCANE_STORM_INTERVAL;

    // Posição aleatória no mapa (em tiles sólidos não — só no ar)
    let bx, by, attempts = 0;
    do {
      bx = Math.random() * map.cols * TILE;
      by = Math.random() * map.rows * TILE;
      attempts++;
    } while (getTile(map, Math.floor(bx / TILE), Math.floor(by / TILE)) === T.SOLID && attempts < 10);

    // Dano nos inimigos no raio
    for (const e of enemies) {
      if (e.dead) continue;
      const ecx  = e.x + e.w / 2;
      const ecy  = e.y + e.h / 2;
      const dist = Math.hypot(ecx - bx, ecy - by);
      if (dist <= ARCANE_STORM_RADIUS) {
        const falloff = 1 - dist / ARCANE_STORM_RADIUS;
        e.hp      -= Math.round(ARCANE_STORM_DMG * (0.5 + 0.5 * falloff));
        e.hitFlash = 0.1;
        if (e.hp <= 0) killEnemy(e, player);
      }
    }

    // Partículas da explosão
    spawnParticles(bx, by, '#cc44ff', 14, 5.0);
    spawnParticles(bx, by, '#ffffff',  6, 7.0);
    spawnParticles(bx, by, '#4400aa',  8, 3.5);

    // Registra visual
    arcaneStorm.blasts.push({
      x: bx, y: by,
      life: 0.25, maxLife: 0.25,
      r: ARCANE_STORM_RADIUS,
    });
  }
}

function drawArcaneStorm(cam) {
  for (const blast of arcaneStorm.blasts) {
    const sx   = blast.x - cam.x;
    const sy   = blast.y - cam.y;
    const frac = blast.life / blast.maxLife; // 1→0

    // Anel expansivo
    const ringR = Math.round(blast.r * (1 - frac) + 6);
    ctx.strokeStyle = `rgba(180, 80, 255, ${frac * 0.8})`;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Segundo anel menor
    ctx.strokeStyle = `rgba(255, 255, 255, ${frac * 0.5})`;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(sx, sy, ringR * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Núcleo brilhante
    const coreR = Math.round(frac * 12);
    if (coreR > 0) {
      ctx.fillStyle = `rgba(220, 160, 255, ${frac * 0.9})`;
      ctx.beginPath();
      ctx.arc(sx, sy, coreR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${frac * 0.7})`;
      ctx.beginPath();
      ctx.arc(sx, sy, coreR * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Raios — 6 linhas saindo do centro
    ctx.strokeStyle = `rgba(180, 80, 255, ${frac * 0.6})`;
    ctx.lineWidth   = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const len   = ringR * 0.8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
      ctx.stroke();
    }
  }

  // Overlay pulsando na tela enquanto ativo
  if (arcaneStorm.active) {
    const pulse = Math.sin(Date.now() / 60) * 0.03 + 0.04;
    ctx.fillStyle = `rgba(80, 0, 160, ${pulse})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ─── FAMILIAR SYSTEM ───────────────────────────────────────────────────────
const FAMILIAR_DURATION      = 12;   // segundos de duração
const FAMILIAR_COOLDOWN      = 20;   // segundos de cooldown
const FAMILIAR_ATTACK_RATE   = 1.2;  // segundos entre ataques
const FAMILIAR_DMG           = 18;   // dano por ataque
const FAMILIAR_DETECT_RADIUS = 180;  // raio de detecção de inimigos
const FAMILIAR_SPEED         = 4.5;  // velocidade de movimento
const FAMILIAR_DIVE_SPEED    = 7.0;  // velocidade ao mergulhar no inimigo

let familiar = {
  active:       false,
  x: 0, y: 0,
  vx: 0, vy: 0,
  timer:        0,
  cooldown:     0,
  attackTimer:  0,
  state:        'follow',  // 'follow' | 'dive' | 'return'
  target:       null,
  diveOriginX:  0,
  diveOriginY:  0,
  dir: 1,
};

function updateFamiliar(dt, player, enemies) {
  if (familiar.cooldown > 0) familiar.cooldown -= dt;
  if (!familiar.active) return;

  familiar.timer -= dt;
  if (familiar.timer <= 0) {
    familiar.active   = false;
    familiar.cooldown = FAMILIAR_COOLDOWN;
    familiar.state    = 'follow';
    familiar.target   = null;
    spawnParticles(familiar.x, familiar.y, '#88ccff', 10, 3);
    return;
  }

  if (familiar.state === 'follow') {
    familiar.dir = player.dir;
  } else if (Math.abs(familiar.vx) > 0.5) {
    familiar.dir = familiar.vx >= 0 ? 1 : -1;
  }

  familiar.attackTimer -= dt;

  const pcx = player.x + player.w / 2;
  const pcy = player.y + player.h / 2;

  // ── Procura alvo vivo mais próximo ────────────────────────────────
  if (familiar.state === 'follow' && familiar.attackTimer <= 0) {
    let closest = null, closestDist = FAMILIAR_DETECT_RADIUS;
    for (const e of enemies) {
      if (e.dead) continue;
      if (e.type === 'GHOST' && e.ghostState !== 'material') continue;
      if (e.type === 'SUMMONER' && e.shielded) continue;
      if (e.type === 'REVENANT' && (e.rvState === 'dead_temp' || e.rvState === 'rising')) continue;
      if (e.type === 'MIMIC' && e.mimicState === 'chest') continue;
      const dist = Math.hypot((e.x + e.w / 2) - familiar.x, (e.y + e.h / 2) - familiar.y);
      if (dist < closestDist) { closestDist = dist; closest = e; }
    }
    if (closest) {
      familiar.state       = 'dive';
      familiar.target      = closest;
      familiar.diveOriginX = familiar.x;
      familiar.diveOriginY = familiar.y;
    }
  }

  // ── Valida alvo (pode ter morrido) ────────────────────────────────
  if (familiar.state === 'dive' && (!familiar.target || familiar.target.dead)) {
    familiar.state  = 'return';
    familiar.target = null;
  }

  switch (familiar.state) {

    case 'follow': {
      // Orbita acima e levemente à frente do jogador
      const targetX = pcx + player.dir * 16;
      const targetY = pcy - 28;
      const dx = targetX - familiar.x;
      const dy = targetY - familiar.y;
      familiar.vx += dx * 0.12;
      familiar.vy += dy * 0.12;
      familiar.vx *= 0.75;
      familiar.vy *= 0.75;
      familiar.x  += familiar.vx;
      familiar.y  += familiar.vy;
      break;
    }

    case 'dive': {
      const ecx = familiar.target.x + familiar.target.w / 2;
      const ecy = familiar.target.y + familiar.target.h / 2;
      const dx   = ecx - familiar.x;
      const dy   = ecy - familiar.y;
      const dist = Math.hypot(dx, dy) || 1;

      familiar.vx = (dx / dist) * FAMILIAR_DIVE_SPEED;
      familiar.vy = (dy / dist) * FAMILIAR_DIVE_SPEED;
      familiar.x += familiar.vx;
      familiar.y += familiar.vy;

      // Acertou o inimigo
      if (dist < 10) {
        familiar.target.hp     -= FAMILIAR_DMG;
        familiar.target.hitFlash = 0.12;
        familiar.attackTimer    = FAMILIAR_ATTACK_RATE;

        spawnParticles(familiar.x, familiar.y, '#88ccff', 8, 3);
        spawnParticles(familiar.x, familiar.y, '#ffffff',  4, 4);

        if (familiar.target.hp <= 0) killEnemy(familiar.target, player);

        familiar.state  = 'return';
        familiar.target = null;
      }
      break;
    }

    case 'return': {
      const targetX = pcx + player.dir * 16;
      const targetY = pcy - 28;
      const dx = targetX - familiar.x;
      const dy = targetY - familiar.y;
      const dist = Math.hypot(dx, dy) || 1;

      familiar.vx = (dx / dist) * FAMILIAR_SPEED;
      familiar.vy = (dy / dist) * FAMILIAR_SPEED;
      familiar.x += familiar.vx;
      familiar.y += familiar.vy;

      if (dist < 16) familiar.state = 'follow';
      break;
    }
  }
}

function drawFamiliar(cam, time) {
  if (!familiar.active) return;

  const sx = familiar.x - cam.x;
  const sy = familiar.y - cam.y;

  const frac    = familiar.timer / FAMILIAR_DURATION;
  const flap    = Math.sin(time * 14) * 0.5 + 0.5; // 0→1 batida de asa
  const isDiving = familiar.state === 'dive';

  // Direção de movimento
  const dir = familiar.dir ?? 1;

  ctx.save();
  ctx.translate(sx, sy);
  if (dir === -1) ctx.scale(-1, 1); // espelha para esquerda

  // Trilha de partículas mágicas (aura)
  const auraAlpha = 0.15 + 0.1 * Math.sin(time * 6);
  ctx.fillStyle = `rgba(136, 204, 255, ${auraAlpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  // ── Asas ──────────────────────────────────────────────────────────
  if (isDiving) {
    // Asas fechadas ao mergulhar — presas ao corpo
    ctx.fillStyle = '#5599cc';
    ctx.fillRect(-6, -1, 4, 3);
    ctx.fillRect( 3, -1, 4, 3);
  } else {
    // Asa traseira (mais escura)
    const wingBackY = Math.round(flap * 5) - 3;
    ctx.fillStyle = '#3a7aaa';
    ctx.fillRect(-7, wingBackY,      5, 3);
    ctx.fillRect(-7, wingBackY + 1,  3, 2);
    // Asa dianteira
    const wingFrontY = -Math.round(flap * 5) - 1;
    ctx.fillStyle = '#66aadd';
    ctx.fillRect( 2, wingFrontY,     6, 3);
    ctx.fillRect( 2, wingFrontY + 1, 4, 2);
  }

  // ── Corpo ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#88bbee';
  ctx.fillRect(-4, -3, 8, 6);
  // Barriga mais clara
  ctx.fillStyle = '#aaddff';
  ctx.fillRect(-3, -1, 5, 4);
  // Costas escuras
  ctx.fillStyle = '#4488bb';
  ctx.fillRect(-4, -3, 8, 2);

  // ── Cauda ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#5599cc';
  ctx.fillRect(-6, 2, 3, 2);
  ctx.fillRect(-7, 3, 2, 1);

  // ── Cabeça ────────────────────────────────────────────────────────
  ctx.fillStyle = '#99ccff';
  ctx.fillRect( 2, -5, 6, 5);
  // Bico
  ctx.fillStyle = '#ffcc44';
  ctx.fillRect( 8, -3, 3, 2);
  ctx.fillStyle = '#ddaa22';
  ctx.fillRect( 8, -2, 3, 1);
  // Olho
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect( 5, -4, 2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect( 5, -4, 1, 1);

  // ── Brilho mágico nas pontas das asas ─────────────────────────────
  if (!isDiving) {
    const glowAlpha = 0.4 + 0.4 * flap;
    ctx.fillStyle = `rgba(180, 230, 255, ${glowAlpha})`;
    ctx.fillRect(-7, Math.round(flap * 5) - 3, 2, 2);
    ctx.fillRect( 7, -Math.round(flap * 5) - 1, 2, 2);
  }

  ctx.restore();

  // ── Timer acima do familiar ────────────────────────────────────────
  if (frac < 0.3) {
    const alpha = frac / 0.3;
    ctx.fillStyle = `rgba(136, 200, 255, ${alpha * 0.9})`;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(familiar.timer) + 's', sx, sy - 14);
  }
}

const DASH_FORCE     = 9;    // velocidade horizontal do dash
const DASH_DURATION  = 0.18; // segundos de duração
const DASH_COOLDOWN  = 1.2;  // segundos de cooldown

function drawDashTrail(cam, time) {
  if (player.dashTimer <= 0) return;

  const frac = player.dashTimer / DASH_DURATION; // 1→0
  const sx   = player.x - cam.x;
  const sy   = player.y - cam.y;

  // Rastro em 3 cópias fantasma atrás do jogador
  for (let i = 1; i <= 3; i++) {
    const offsetX  = -player.dashDir * i * 7;
    const alpha    = (frac * 0.5) / i;
    ctx.fillStyle  = `rgba(160, 160, 255, ${alpha})`;
    ctx.fillRect(sx + offsetX, sy, player.w, player.h);
  }

  // Brilho nas bordas do jogador
  ctx.fillStyle = `rgba(200, 200, 255, ${frac * 0.3})`;
  ctx.fillRect(sx - 2, sy - 2, player.w + 4, player.h + 4);
}

// ─── HEAL SPELL CONSTANTS ──────────────────────────────────────────
const HEAL_MANA_COST = 30;   // mana consumida ao lançar
const HEAL_AMOUNT    = 20;   // HP recuperado
const HEAL_COOLDOWN  = 8.0;  // segundos de cooldown

// ─── DOUBLE JUMP ITEM ──────────────────────────────────────────────────────
const DOUBLE_JUMP_FORCE   = -7.5; // força do segundo pulo (um pouco menor)
let collectedDoubleJumps  = new Set();

function drawDoubleJumpItem(map, cam, time) {
  if (!map.doubleJump) return;
  if (collectedDoubleJumps.has(map.id)) return;

  const s     = map.doubleJump;
  const cx    = s.tx * TILE + TILE / 2 - cam.x;
  const cy    = s.ty * TILE + TILE / 2 - cam.y + Math.sin(time * 2.8) * 4;
  const pulse = 0.6 + 0.4 * Math.sin(time * 4);

  ctx.save();

  // Núcleo — pena central com gradiente azul celeste
  const grad = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, 10);
  grad.addColorStop(0,   'rgba(220, 245, 255, 0.98)');
  grad.addColorStop(0.4, 'rgba(100, 180, 255, 0.92)');
  grad.addColorStop(0.8, 'rgba(40,  100, 220, 0.85)');
  grad.addColorStop(1,   'rgba(10,   40, 120, 0.80)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();

  // Anel pulsante
  ctx.strokeStyle = `rgba(136, 200, 255, ${0.5 + 0.4 * pulse})`;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.stroke();

  // Símbolo — estrela de 5 pontas pixel art
  ctx.fillStyle = `rgba(255, 255, 255, ${0.85 + 0.15 * pulse})`;
  // Ponta do topo
  ctx.fillRect(cx - 1, cy - 6, 2, 3);
  // Diagonal superior esq
  ctx.fillRect(cx - 4, cy - 4, 2, 2);
  // Diagonal superior dir
  ctx.fillRect(cx + 2, cy - 4, 2, 2);
  // Miolo central
  ctx.fillRect(cx - 3, cy - 2, 6, 2);
  ctx.fillRect(cx - 1, cy - 2, 2, 6);
  // Braços laterais
  ctx.fillRect(cx - 6, cy - 1, 4, 2);
  ctx.fillRect(cx + 2, cy - 1, 4, 2);
  // Pernas inferiores
  ctx.fillRect(cx - 4, cy + 2, 2, 2);
  ctx.fillRect(cx + 2, cy + 2, 2, 2);
  // Ponta inferior esq/dir
  ctx.fillRect(cx - 5, cy + 3, 2, 2);
  ctx.fillRect(cx + 3, cy + 3, 2, 2);
  // Destaque central
  ctx.fillStyle = `rgba(180, 230, 255, ${0.7 + 0.3 * pulse})`;
  ctx.fillRect(cx - 1, cy - 1, 2, 4);
  ctx.fillRect(cx - 2, cy - 0, 4, 2);

  // Reflexo
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy - 3, 2.5, 1.5, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function checkDoubleJumpCollection(player, map) {
  if (!map.doubleJump) return;
  if (collectedDoubleJumps.has(map.id)) return;
  if (fadeState !== 'idle') return;

  const s    = map.doubleJump;
  const px   = player.x + player.w / 2;
  const py   = player.y + player.h / 2;
  const sx   = s.tx * TILE + TILE / 2;
  const sy   = s.ty * TILE + TILE / 2;

  if (Math.hypot(px - sx, py - sy) < TILE * 0.9) {
    collectedDoubleJumps.add(map.id);
    player.hasDoubleJump = true;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        spawnParticles(sx, sy, '#88ccff', 14, 5);
        spawnParticles(sx, sy, '#ffffff',  6, 3);
      }, i * 70);
    }
  }
}

function resetDoubleJumps() {
  collectedDoubleJumps.clear();
}

// ─── PLAYER ────────────────────────────────────────────────────────────────
function createPlayer(tx, ty) {
  return {
    x: tx * TILE, y: ty * TILE,
    w: 18, h: 28,
    vx: 0, vy: 0,
    onGround: false,
    hp: 100, maxHp: 100,
    mp: 100, maxMp: 100,
    dir: 1, // facing direction
    attackTimer: 0,
    attackCooldown: 0.35,
    magicCooldown: 0,
    invincible: 0,
    wallHit: false,
    jumpBuffer: 0,
    coyoteTime: 0,
    dropThrough: false,  // cair por DOOR_D ao pressionar baixo
    dropTimer: 0,
    onDoorD: false,      // jogador está em cima de uma porta-baixo
    onLadder: false, 
    speedBoostTimer: 0,  // segundos restantes do boost de velocidade
    speedBoostMax: 0,    // duração total do boost atual (para a barra de HUD)
    shieldActive:   false, // escudo está ativo e absorvendo dano
    shieldHp:       0,     // vida restante do escudo (máx: SHIELD_MAX_HP)
    shieldCooldown: 0,     // cooldown após quebrar (segundos)
    shieldPulse:    0,     // timer interno para animação
    healCooldown:  0,  
    dropThroughTileY: -1,
    hasDoubleJump:     false,
    doubleJumpUsed:    false,
    dashTimer:    0,  // tempo restante do dash ativo
    dashCooldown: 0,  // cooldown restante
    dashDir:      1,  // direção do dash
  };
}

// ─── LADDER HELPER ─────────────────────────────────────────────────────────
// Verifica se o jogador está sobreposto a um tile de escada.
// Checa o centro, a cabeça e os pés do jogador para cobrir transições suaves.
function playerOnLadder(player, map) {
  const cx  = player.x + player.w / 2;
  const tx  = Math.floor(cx / TILE);
  const tyCenter = Math.floor((player.y + player.h / 2) / TILE);
  const tyFeet   = Math.floor((player.y + player.h - 4) / TILE);
  const tyHead   = Math.floor((player.y + 4)            / TILE);
  return getTile(map, tx, tyCenter) === T.LADDER ||
         getTile(map, tx, tyFeet)   === T.LADDER ||
         getTile(map, tx, tyHead)   === T.LADDER;
}

function updatePlayer(player, dt, map, enemies) {
  // Timers
  player.attackTimer   = Math.max(0, player.attackTimer - dt);
  player.invincible    = Math.max(0, player.invincible  - dt);
  player.healCooldown  = Math.max(0, player.healCooldown  - dt);
  player.magicCooldown = Math.max(0, player.magicCooldown - dt);
  player.jumpBuffer    = Math.max(0, player.jumpBuffer - dt);
  player.coyoteTime    = Math.max(0, player.coyoteTime - dt);
  player.speedBoostTimer = Math.max(0, player.speedBoostTimer - dt);
  player.shieldCooldown  = Math.max(0, player.shieldCooldown - dt);
  player.shieldPulse    += dt;

  // Timer do drop-through
  if (player.dropTimer > 0) {
    player.dropTimer = Math.max(0, player.dropTimer - dt);
    if (player.dropTimer <= 0) { player.dropThrough = false; player.dropThroughTileY = -1; }
  }

  // Detecta se o jogador está em cima de DOOR_D ou PLAT
  {
    const btxC = Math.floor((player.x + player.w / 2) / TILE);
    const btxL = Math.floor((player.x + 2)             / TILE);
    const btxR = Math.floor((player.x + player.w - 2)  / TILE);
    const bty  = Math.floor((player.y + player.h + 4)  / TILE);
    const tbC  = getTile(map, btxC, bty);
    const tbL  = getTile(map, btxL, bty);
    const tbR  = getTile(map, btxR, bty);
    player.onDoorD = player.onGround && (tbC === T.DOOR_D || tbL === T.DOOR_D || tbR === T.DOOR_D);
    player.onPlat  = player.onGround && (tbC === T.PLAT   || tbL === T.PLAT   || tbR === T.PLAT);
  }

  // Pressionar baixo em cima de DOOR_D ou PLAT → cair
  const pressingDown = isDown('ArrowDown', 'KeyS');
  const pressingUp   = isDown('ArrowUp', 'KeyW');
 
  // ── Detecção de escada ──────────────────────────────────────────────────
  const touchingLadder = playerOnLadder(player, map);
 
  // Entra na escada ao pressionar cima ou baixo sobre ela
  if (touchingLadder && (pressingUp || pressingDown)) {
    player.onLadder = true;
  }
  // Sai da escada se não estiver mais em contato com ela
  if (!touchingLadder) {
    player.onLadder = false;
  }
 
  if (pressingDown && (player.onDoorD || player.onPlat) && !player.dropThrough && !player.onLadder) {
    player.dropThrough = true;
    player.dropTimer   = 0.6;
    const _dtx = Math.floor((player.x + player.w / 2) / TILE);
    const _dty = Math.floor((player.y + player.h + 4) / TILE);
    player.dropThroughTileY = _dty;
  }

  // Horizontal movement
  const left  = isDown('ArrowLeft',  'KeyA');
  const right = isDown('ArrowRight', 'KeyD');
  const spdMult = player.speedBoostTimer > 0 ? 1.85 : 1;

  if (left)  { player.vx = -PLAYER_SPD * spdMult; player.dir = -1; }
  else if (right) { player.vx =  PLAYER_SPD * spdMult; player.dir =  1; }
  else       { player.vx *= 0.75; }

  const jumpPressed = isDown('Space');
  const jumpJustPressed = jumpPressed && !player._prevJump;
  player._prevJump = jumpPressed;
  if (jumpPressed) player.jumpBuffer = 0.12;
 
  if (player.jumpBuffer > 0 && (player.onGround || player.coyoteTime > 0 || player.onLadder)) {
    player.vy = JUMP_FORCE;
    player.onGround  = false;
    player.onLadder  = false;   // pula e sai da escada
    player.jumpBuffer = 0;
    player.coyoteTime = 0;
    player.doubleJumpUsed = false; 
    spawnParticles(player.x + player.w / 2, player.y + player.h, '#555', 6, 2);
  } else if (jumpJustPressed && !player.onGround && player.hasDoubleJump && !player.doubleJumpUsed && !player.onLadder) {
    player.vy             = JUMP_FORCE; // mesma força do pulo normal
    player.doubleJumpUsed = true;
    player.jumpBuffer     = 0;
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#88ccff', 10, 3);
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ffffff',  5, 2);
  }

  // Reset do doubleJump ao pousar
  if (player.onGround) player.doubleJumpUsed = false;

  // ── Física da escada ────────────────────────────────────────────────────
  if (player.onLadder && touchingLadder) {
    if (pressingUp)        player.vy = -LADDER_SPD;
    else if (pressingDown) player.vy =  LADDER_SPD;
    else                   player.vy =  0;           // parado na escada
  }

  // Gravity
  if (player.onLadder && touchingLadder) {
    // sem gravidade — física da escada já definiu vy acima
  } else if (player.onGround) {
    player.vy = 2;
  } else {
    player.vy += GRAVITY;
    if (player.vy > MAX_FALL) player.vy = MAX_FALL;
  }

  // Aplica velocidade do dash — sobrescreve vx e anula gravidade durante o dash
  if (player.dashTimer > 0) {
    player.vx = player.dashDir * DASH_FORCE;
    player.vy = 0; // sem gravidade durante o dash
  }

  // Move
  const wasOnGround = player.onGround;
  if (fadeState === 'idle') {          // ← ADICIONAR esta condição
    moveEntity(player, dt, map);
    if (wasOnGround && !player.onGround) player.coyoteTime = 0.1;
  }

  // Attack
  if (isDown('KeyJ', 'KeyZ') && player.attackTimer <= 0) {
    player.attackTimer = player.attackCooldown;
    doMeleeAttack(player, enemies, map);
  }

  // Magic
  if (isDown('KeyK', 'KeyX') && player.magicCooldown <= 0 && player.mp >= 20) {
    player.mp -= 20;
    player.magicCooldown = 0.6;
    const spd = 7;
    spawnProjectile(
      player.x + player.w / 2, player.y + player.h / 2,
      player.dir * spd, 0, 'player', 25, '#2980b9', 10, 5
    );
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#2980b9', 8, 2);
  }

  // Heal — H: cura o jogador
  if (isDown('KeyH', 'KeyQ') && player.healCooldown <= 0 && player.mp >= HEAL_MANA_COST && player.hp < player.maxHp) {
      player.mp          -= HEAL_MANA_COST;
      player.healCooldown = HEAL_COOLDOWN;
      player.hp           = Math.min(player.maxHp, player.hp + HEAL_AMOUNT);

      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      spawnParticles(cx, cy, '#00ff88', 14, 3);
      spawnParticles(cx, cy, '#aaffcc',  8, 2);
      spawnParticles(cx, cy - 10, '#00cc66',  6, 1.5);
  }

  // Arcane Storm — F: consome toda a mana, explode o mapa
  if (isDown('KeyF') && arcaneStorm.cooldown <= 0 && !arcaneStorm.active && player.mp >= ARCANE_STORM_MIN_MP) {
    arcaneStorm.active     = true;
    arcaneStorm.timer      = ARCANE_STORM_DURATION;
    arcaneStorm.spawnTimer = 0;
    // ← sem cooldown aqui
    player.mp = 0;

    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#aa44ff', 24, 6);
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ffffff', 12, 8);
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#6600cc', 16, 4);
  }

  // Familiar — R: invoca o pássaro familiar
  if (isDown('KeyR') && !familiar.active && familiar.cooldown <= 0 && player.mp >= player.maxMp * 0.5) {
    player.mp        -= 50; // consome metade da mana
    familiar.active   = true;
    familiar.timer    = FAMILIAR_DURATION;
    familiar.cooldown = 0;
    familiar.x        = player.x + player.w / 2;
    familiar.y        = player.y - 20;
    familiar.vx       = 0;
    familiar.vy       = 0;
    familiar.state    = 'follow';
    familiar.target   = null;
    familiar.attackTimer = 0;

    spawnParticles(familiar.x, familiar.y, '#88ccff', 12, 3.5);
    spawnParticles(familiar.x, familiar.y, '#ffffff',  6, 2.5);
  }

  // Ativa o dash — Shift
  if (isDown('ShiftLeft') && player.dashCooldown <= 0 && player.dashTimer <= 0) {
    player.mp -= 10;
    player.dashTimer    = DASH_DURATION;
    player.dashCooldown = DASH_COOLDOWN;
    player.dashDir      = player.dir;
    player.invincible   = Math.max(player.invincible, DASH_DURATION); // i-frames durante o dash
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#aaaaff', 10, 4);
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ffffff',  5, 3);
  }

  // Tick dos timers
  if (player.dashCooldown > 0) player.dashCooldown -= dt;
  if (player.dashTimer    > 0) player.dashTimer    -= dt;

  // Escudo — L / C: ativa escudo mágico
  if (isDown('KeyL', 'KeyC') && player.shieldCooldown <= 0 && !player.shieldActive && player.mp >= SHIELD_MANA_COST) {
    player.mp          -= SHIELD_MANA_COST;
    player.shieldActive = true;
    player.shieldHp     = SHIELD_MAX_HP;
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#00ccff', 14, 3);
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ffffff',  6, 2);
  }

  // MP regen
  if (player.mp < player.maxMp) player.mp = Math.min(player.maxMp, player.mp + dt * 4);

  // Spike damage
  const tx = Math.floor((player.x + player.w / 2) / TILE);
  const ty = Math.floor((player.y + player.h - 2) / TILE);
  if (getTile(map, tx, ty) === T.SPIKE && player.invincible <= 0) {
    damagePlayer(player, 20);
  }
}

// ─── KILL ENEMY ─────────────────────────────────────────────────────────────
// Ponto central de morte de inimigo — trata efeitos especiais por tipo.
// Sempre chame esta função em vez de setar e.dead = true diretamente.
const BOMBER_RADIUS = 64; // raio da explosão em px
 
function killEnemy(e, player) {
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;

  // ── REVENANT: morte temporária na primeira vez ─────────────────────────
  if (e.type === 'REVENANT') {
    e.rvDeaths = (e.rvDeaths || 0) + 1;
    if (e.rvDeaths < 2) {
      // Primeira morte: derruba temporariamente, não remove do jogo
      e.hp          = 1; // reseta para 1 para não triggerar killEnemy novamente
      e.rvState     = 'dead_temp';
      e.rvDeadTimer = 5.0; // segundos deitado
      e.vx          = 0;
      e.dead        = false; // NÃO está realmente morto
      // Partículas de "morte" falsa
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          spawnParticles(cx, cy, '#335522', 16, 4);
          spawnParticles(cx, cy, '#223311',  8, 3);
        }, i * 80);
      }
      player.mp = Math.min(player.maxMp, player.mp + 8); // menos MP por morte falsa
      return;
    }
    // Segunda morte: morre de verdade
    e.dead = true;
    spawnParticles(cx, cy, '#44ff22', 24, 6);
    spawnParticles(cx, cy, '#115500', 16, 4);
    player.mp = Math.min(player.maxMp, player.mp + 15);
    return;
  }

  e.dead = true;

  if (e.type === 'CHAIN_SPECTER') {
    // ── Explode em 8 fragmentos ricocheteantes ─────────────────────────────
    const SPD   = 3.6;
    const COUNT = 8;
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      projectiles.push({
        x: cx, y: cy,
        vx: Math.cos(a) * SPD, vy: Math.sin(a) * SPD,
        owner: 'enemy', dmg: Math.round(e.dmg * 0.6),
        color: '#00ccff', glowColor: '0,200,255',
        w: 7, h: 7, life: 2.2,
        chainShot: true,
        bounces: 1,        // ricochetes restantes
      });
    }
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        spawnParticles(cx, cy, '#00ccff', 14, 5);
        spawnParticles(cx, cy, '#aaeeff',  8, 3);
      }, i * 55);
    }
    player.mp = Math.min(player.maxMp, player.mp + 15);
    return;
  }
 
  if (e.type === 'BOMBER') {
    // ── Explosão em área ────────────────────────────────────────────────
    // Partículas de fogo em 3 ondas
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        spawnParticles(cx, cy, '#ff6600', 20, 6);
        spawnParticles(cx, cy, '#ffcc00', 12, 4);
        spawnParticles(cx, cy, '#ff2200',  8, 8);
      }, i * 60);
    }
    // Dano ao jogador se estiver no raio
    const dx   = (player.x + player.w / 2) - cx;
    const dy   = (player.y + player.h / 2) - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < BOMBER_RADIUS && player.invincible <= 0) {
      // Dano diminui com a distância
      const falloff = 1 - dist / BOMBER_RADIUS;
      damagePlayer(player, Math.round(30 * falloff));
    }
    // Dano a outros inimigos no raio
    for (const other of enemies) {
      if (other === e || other.dead) continue;
      const odx  = (other.x + other.w / 2) - cx;
      const ody  = (other.y + other.h / 2) - cy;
      const odist = Math.hypot(odx, ody);
      if (odist < BOMBER_RADIUS) {
        const falloff = 1 - odist / BOMBER_RADIUS;
        other.hp -= Math.round(40 * falloff);
        other.hitFlash = 0.2;
        if (other.hp <= 0) killEnemy(other, player);
      }
    }
  } else {
    // Morte padrão
    spawnParticles(cx, cy, '#8b0000', 20, 5);
  }
 
  // Recupera MP ao matar qualquer inimigo
  player.mp = Math.min(player.maxMp, player.mp + 15);
}

function doMeleeAttack(player, enemies, map) {
  const reach = 30;
  const ax = player.dir > 0 ? player.x + player.w : player.x - reach;
  const attackRect = { x: ax, y: player.y + 4, w: reach, h: player.h - 8 };

  enemies.forEach(e => {
    if (e.dead) return;
    const er = { x: e.x, y: e.y, w: e.w, h: e.h };
    if (rectsOverlap(attackRect, er)) {
      if (e.type === 'GHOST' && e.ghostState !== 'material') return;
      if (e.type === 'REVENANT' && (e.rvState === 'dead_temp' || e.rvState === 'rising')) return;
      if (e.type === 'SUMMONER' && e.shielded) {
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#cc00ff', 6, 3);
        return;
      }
      if (e.type === 'MIMIC' && e.mimicState === 'chest') {
        // Golpear o baú o revela imediatamente
        e.mimicState  = 'reveal';
        e.revealTimer = 0.4;
        spawnParticles(e.x + e.w / 2, e.y, '#c8860a', 14, 4);
        return;
      }
      e.hp -= 20;
      e.hitFlash = 0.15;
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      spawnParticles(cx, cy, '#c0392b', 10, 3);
      if (e.hp <= 0) killEnemy(e, player);
    }
  });

  // Break breakable tiles in melee range
  const txMin = Math.floor(attackRect.x / TILE);
  const txMax = Math.floor((attackRect.x + attackRect.w) / TILE);
  const tyMin = Math.floor(attackRect.y / TILE);
  const tyMax = Math.floor((attackRect.y + attackRect.h) / TILE);
  for (let bty = tyMin; bty <= tyMax; bty++) {
    for (let btx = txMin; btx <= txMax; btx++) {
      if (getTile(map, btx, bty) === T.BREAK) {
        hitBreakable(currentMapId, map, btx, bty);
      }
      if (getTile(map, btx, bty) === T.CRATE) {
        hitCrate(currentMapId, map, btx, bty);
      }
    }
  }
}

function damagePlayer(player, dmg) {
  if (player.invincible > 0) return;
  // ── Escudo intercepta o dano ──────────────────────────────────────────────
  if (player.shieldActive) {
    player.shieldHp--;
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#00ccff', 10, 3);
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ffffff',  5, 2);
    player.invincible = 0.3; // breve i-frame ao absorver
    if (player.shieldHp <= 0) {
      // Escudo quebrado
      player.shieldActive   = false;
      player.shieldCooldown = SHIELD_COOLDOWN;
      spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#00aaff', 22, 5);
      spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ffffff', 10, 4);
    }
    return; // dano bloqueado
  }
  player.hp -= dmg;
  player.invincible = 1.2;
  spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#c0392b', 12, 3);
}

// ─── CAMERA ────────────────────────────────────────────────────────────────
let _camX = 0, _camY = 0, _currentMapId = 0; _drawTime = 0;
function createCamera() { return { x: 0, y: 0 }; }

function updateCamera(cam, player, map) {
  const mapW = map.cols * TILE;
  const mapH = map.rows * TILE;

  const targetX = player.x + player.w / 2 - W / 2;
  const targetY = player.y + player.h / 2 - H / 2;

  cam.x += (targetX - cam.x) * 0.10;
  cam.y += (targetY - cam.y) * 0.10;

  cam.x = Math.max(0, Math.min(mapW - W, cam.x));
  cam.y = Math.max(0, Math.min(mapH - H, cam.y));
}

let portalCanvas = null; // canvas offscreen único — baked uma vez
 
// Paleta pixel-art do portal — sem nenhuma operação cara
const _PC = {
  bg:      '#02000a',
  core0:   '#c050ff',  // centro brilhante
  core1:   '#8020d0',  // anel médio
  core2:   '#400090',  // anel externo
  dark:    '#150030',  // fundo roxo escuro
  spark:   '#e8b0ff',  // pontos de luz
  border:  '#7000cc',  // borda
  borderHi:'#aa44ff',  // borda highlight
};
 
// Desenha o portal estático em um canvas 32×32 — baked uma única vez
function _bakePortalFrame() {
  const oc   = document.createElement('canvas');
  oc.width   = TILE;
  oc.height  = TILE;
  const o    = oc.getContext('2d');
  const cx   = TILE / 2;   // 16
  const cy   = TILE / 2;   // 16
 
  // 1. Fundo
  o.fillStyle = _PC.bg;
  o.fillRect(0, 0, TILE, TILE);
 
  // 2. Círculos concêntricos pixel-art (sem clip, sem gradiente)
  //    — preenchidos do maior pro menor para criar ilusão de profundidade
  const circles = [
    { r: 13, color: _PC.dark  },
    { r: 10, color: _PC.core2 },
    { r:  7, color: _PC.core1 },
    { r:  4, color: _PC.core0 },
    { r:  2, color: _PC.spark },
  ];
  for (const { r, color } of circles) {
    o.fillStyle = color;
    o.beginPath();
    o.arc(cx, cy, r, 0, Math.PI * 2);
    o.fill();
  }
 
  // 3. "Anéis" — 8 traços curtos em torno do núcleo, ângulo fixo
  const arcCount = 8;
  for (let i = 0; i < arcCount; i++) {
    const a     = (i / arcCount) * Math.PI * 2;
    const inner = 8;
    const outer = 12;
    // arco de ~60° por segmento, alternando opacidade
    const alpha = i % 2 === 0 ? 0.85 : 0.35;
    o.strokeStyle = `rgba(160, 60, 255, ${alpha})`;
    o.lineWidth   = 2;
    o.beginPath();
    o.arc(cx, cy, (inner + outer) / 2, a, a + Math.PI / arcCount * 1.4);
    o.stroke();
  }
 
  // 5. Borda pixel-art — 1px sólida + highlight no canto superior-esquerdo
  o.strokeStyle = _PC.border;
  o.lineWidth   = 1;
  o.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);
  // highlight (2 segmentos top e left)
  o.strokeStyle = _PC.borderHi;
  o.beginPath();
  o.moveTo(0, 0); o.lineTo(TILE, 0);   // top
  o.moveTo(0, 0); o.lineTo(0, TILE);   // left
  o.stroke();
 
  return oc;
}
 
// Pré-renderiza o portal UMA VEZ ao carregar
(function _initPortalFrames() {
  portalCanvas = _bakePortalFrame();
})();
 
// Retorna o canvas estático do portal
function getPortalFrame() {
  return portalCanvas;
}

// ─── RENDER TILE ───────────────────────────────────────────────────────────
function drawTile(t, px, py) {
  switch (t) {
    case T.SOLID:
      ctx.fillStyle = PALETTE.solid;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PALETTE.solidEdge;
      ctx.fillRect(px, py, TILE, 2);
      ctx.fillRect(px, py, 2, TILE);
      break;

    case T.MYSTIC_STONE: {
      // ── Pedra Mística — chão da Singularidade Misteriosa ──────────────────
      // Lajes de pedra abissal em grade 2×2 com continuidade perfeita entre
      // tiles vizinhos. Cada laje tem:
      //   • Corpo negro-arroxeado com variação sutil por posição global
      //   • Junta fina de energia (brilho de borda com cor mística)
      //   • Aresta superior iluminada (luz mística vinda de cima)
      //   • Glifos/runas em alguns blocos — padrão hash estável
      //   • Pontos de energia pulsante em cruzamentos de juntas
      //
      // OBS: o tile NÃO usa `time` na geometria da laje — apenas nos pontos
      //      de energia, que pulsam sutilmente sem quebrar o bake da câmera.

      const SLAB_W = 16;
      const SLAB_H = 16;
      const JOINT  = 1;

      // Fundo — rejunte abissal (quase preto com tintura roxa)
      ctx.fillStyle = '#0e0022';
      ctx.fillRect(px, py, TILE, TILE);

      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();

      const firstCol = Math.floor(px / SLAB_W);
      const lastCol  = Math.floor((px + TILE - 1) / SLAB_W);
      const firstRow = Math.floor(py / SLAB_H);
      const lastRow  = Math.floor((py + TILE - 1) / SLAB_H);

      for (let row = firstRow; row <= lastRow; row++) {
        for (let col = firstCol; col <= lastCol; col++) {
          // Hash estável por posição — continuidade entre tiles vizinhos
          const hash  = ((col * 11 + row * 17) ^ (col * 5 + row * 3)) & 0xff;
          const hash2 = ((col * 29 + row * 37) ^ (col * 7)) & 0xff;

          const bx = col * SLAB_W + JOINT;
          const by = row * SLAB_H + JOINT;
          const bw = SLAB_W - JOINT * 2;
          const bh = SLAB_H - JOINT * 2;

          // ── Tom base da laje — negro-arroxeado, variação suave ─────────────
          const rBase = 22 + (hash % 10);        // 22–31
          const gBase = 0;
          const bBase = 48 + (hash % 10) * 3;    // 48–75
          ctx.fillStyle = `rgb(${rBase},${gBase},${bBase})`;
          ctx.fillRect(bx, by, bw, bh);

          // ── Veio de energia transversal — ~40% das lajes ──────────────────
          // Uma linha horizontal ou diagonal fina com cor roxa translúcida
          if ((hash & 0x18) === 0x08) {
            const veiaY = by + Math.floor(bh * 0.45) + ((hash >> 1) & 3);
            ctx.strokeStyle = `rgba(${60 + (hash2 % 40)},0,${130 + (hash2 % 60)},0.35)`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(bx + 1, veiaY);
            ctx.lineTo(bx + bw - 1, veiaY + ((hash & 1) ? 1 : -1));
            ctx.stroke();
          }

          // ── Glifo rúnico — em ~20% das lajes ─────────────────────────────
          // Traço simples (2-3 linhas) que lembra uma runa angular
          if ((hash & 0xe0) === 0x40) {
            const gcx = bx + Math.floor(bw / 2);
            const gcy = by + Math.floor(bh / 2);
            const gs  = 3 + (hash2 & 1); // tamanho: 3 ou 4
            ctx.strokeStyle = `rgba(${80 + (hash2 % 60)},0,${160 + (hash2 % 60)},0.50)`;
            ctx.lineWidth = 0.8;
            // Traço vertical central
            ctx.beginPath();
            ctx.moveTo(gcx, gcy - gs);
            ctx.lineTo(gcx, gcy + gs);
            ctx.stroke();
            // Traço transversal curto (forma de runa ᛏ / ᚹ)
            ctx.beginPath();
            ctx.moveTo(gcx - gs + 1, gcy - 1);
            ctx.lineTo(gcx + gs - 1, gcy - 1);
            ctx.stroke();
            // Ramo inferior em ~50% dos glifos
            if (hash2 & 0x08) {
              ctx.beginPath();
              ctx.moveTo(gcx, gcy + gs - 1);
              ctx.lineTo(gcx - 2, gcy + gs + 1);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(gcx, gcy + gs - 1);
              ctx.lineTo(gcx + 2, gcy + gs + 1);
              ctx.stroke();
            }
          }

          // ── Aresta superior — luz mística (onde o jogador pisa) ────────────
          const litR = rBase + 50;
          const litB = Math.min(255, bBase + 120);
          ctx.fillStyle = `rgb(${litR},0,${litB})`;
          ctx.fillRect(bx, by, bw, 1);
          // Canto superior-esquerdo um pouco mais brilhante
          ctx.fillStyle = `rgb(${litR + 10},0,${Math.min(255, litB + 20)})`;
          ctx.fillRect(bx, by, Math.min(3, bw), 1);

          // ── Aresta esquerda — reflexo lateral frio ─────────────────────────
          ctx.fillStyle = `rgb(${rBase + 22},0,${Math.min(255, bBase + 55)})`;
          ctx.fillRect(bx, by + 1, 1, bh - 2);

          // ── Aresta inferior + direita — sombra total ───────────────────────
          ctx.fillStyle = `rgb(${Math.max(0, rBase - 4)},0,${Math.max(0, bBase - 8)})`;
          ctx.fillRect(bx, by + bh - 1, bw, 1);
          ctx.fillRect(bx + bw - 1, by + 1, 1, bh - 2);

          // ── Mancha de energia concentrada — ~12% das lajes ────────────────
          if ((hash & 0xf0) === 0x20) {
            const spotX = bx + Math.floor(bw * 0.40) + ((hash >> 3) & 3);
            const spotY = by + Math.floor(bh * 0.40) + ((hash >> 4) & 3);
            ctx.fillStyle = `rgba(100,0,200,0.22)`;
            ctx.beginPath();
            ctx.ellipse(spotX, spotY, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ── Pontos de energia nos cruzamentos das juntas (animados) ───────────
      // Nos 4 cruzamentos internos do tile (grade 2×2 = 1 cruzamento central
      // e borda compartilhada com vizinhos). Pulsam suavemente.
      const pulse_ms = 0.5 + 0.5 * Math.sin(time * 2.6 + (px * 0.03 + py * 0.07));
      const jAlpha   = (0.45 + 0.30 * pulse_ms).toFixed(2);
      const jR       = 1.4 + pulse_ms * 0.6;

      // Centro do tile — cruzamento das 4 lajes
      const jcx = px + TILE / 2;
      const jcy = py + TILE / 2;
      ctx.fillStyle = `rgba(180,0,255,${jAlpha})`;
      ctx.beginPath();
      ctx.arc(jcx, jcy, jR, 0, Math.PI * 2);
      ctx.fill();

      // 4 bordas do tile — cruzamentos com tiles vizinhos
      for (const [jx, jy] of [[px, py], [px + TILE, py], [px, py + TILE], [px + TILE, py + TILE]]) {
        const pEdge = 0.5 + 0.5 * Math.sin(time * 2.6 + (jx * 0.03 + jy * 0.07));
        ctx.fillStyle = `rgba(140,0,220,${(0.30 + 0.25 * pEdge).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(jx, jy, 1.0 + pEdge * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Linha de sombra interna no topo (reforça que é chão, não parede) ──
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(px, py, TILE, 2);

      ctx.restore();
      break;
    }

    case T.DARK_ENERGY: {
      // ── Pedra de Energia Negra — temática "SINGULARIDADE" ────────────────
      // Bloco de pedra abissal com um vórtice de energia negra no centro,
      // bordas rachadas e veias de energia roxa irradiando para fora.
      const t_de  = time; // referência ao tempo global (animação)
      const mcx   = px + TILE / 2;
      const mcy   = py + TILE / 2;

      // ── Fundo — pedra negra profunda ───────────────────────────────────
      ctx.fillStyle = '#04000c';
      ctx.fillRect(px, py, TILE, TILE);

      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();

      // ── Textura da pedra — variação sutil de tons ───────────────────────
      // Bloco principal com gradiente de profundidade
      const stoneG = ctx.createLinearGradient(px, py, px + TILE, py + TILE);
      stoneG.addColorStop(0,    '#08000f');
      stoneG.addColorStop(0.35, '#0e0019');
      stoneG.addColorStop(0.65, '#09000e');
      stoneG.addColorStop(1,    '#050008');
      ctx.fillStyle = stoneG;
      ctx.fillRect(px, py, TILE, TILE);

      // Aresta superior-esquerda — luz fria (fio de brilho roxo frio)
      ctx.fillStyle = 'rgba(80,0,140,0.45)';
      ctx.fillRect(px, py, TILE, 1);          // borda topo
      ctx.fillRect(px, py, 1, TILE);          // borda esquerda

      // Aresta inferior-direita — sombra total
      ctx.fillStyle = 'rgba(0,0,0,0.70)';
      ctx.fillRect(px, py + TILE - 1, TILE, 1);  // borda fundo
      ctx.fillRect(px + TILE - 1, py, 1, TILE);  // borda direita

      // ── Veias de energia irradiando do centro ─────────────────────────────
      // 8 veias em ângulos fixos, comprimento variável, cor roxa intensa
      const numVeins = 8;
      for (let vi = 0; vi < numVeins; vi++) {
        const angle    = (vi / numVeins) * Math.PI * 2;
        const maxR     = 11;
        const minR     = 4;
        // Comprimento levemente assimétrico por veia para aspecto orgânico
        const r        = minR + ((vi * 3 + 7) % 5) * 1.4;
        const vx1      = mcx + Math.cos(angle) * minR;
        const vy1      = mcy + Math.sin(angle) * minR;
        const vx2      = mcx + Math.cos(angle) * r;
        const vy2      = mcy + Math.sin(angle) * r;

        ctx.strokeStyle = 'rgba(120,0,200,0.55)';
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.moveTo(vx1, vy1);
        ctx.lineTo(vx2, vy2);
        ctx.stroke();
      }

      // ── Rachaduras na pedra ────────────────────────────────────────────────
      // 3 rachaduras irregulares em direções fixas (não animadas — são da pedra)
      const cracks = [
        { ax: px + 3,  ay: py + 2,  bx: px + 9,  by: py + 8  },
        { ax: px + 22, ay: py + 4,  bx: px + 16, by: py + 11 },
        { ax: px + 5,  ay: py + 26, bx: px + 13, by: py + 20 },
      ];
      ctx.strokeStyle = 'rgba(100,0,180,0.40)';
      ctx.lineWidth   = 0.7;
      for (const cr of cracks) {
        ctx.beginPath();
        ctx.moveTo(cr.ax, cr.ay);
        ctx.lineTo(cr.bx, cr.by);
        ctx.stroke();
      }

      // ── Núcleo de energia negra — vórtice animado ─────────────────────────
      // Camada 1: halo exterior pulsante (glow roxo escuro)
      const pulse = 0.5 + 0.5 * Math.sin(t_de * 3.8);
      const haloR = 7 + pulse * 1.5;
      const haloG = ctx.createRadialGradient(mcx, mcy, 0, mcx, mcy, haloR);
      haloG.addColorStop(0,   `rgba(120,0,220,${(0.55 + 0.20 * pulse).toFixed(2)})`);
      haloG.addColorStop(0.5, `rgba(80,0,160,${(0.25 + 0.15 * pulse).toFixed(2)})`);
      haloG.addColorStop(1,   'rgba(40,0,80,0)');
      ctx.fillStyle = haloG;
      ctx.beginPath();
      ctx.arc(mcx, mcy, haloR, 0, Math.PI * 2);
      ctx.fill();

      // Camada 2: anel de borda do vórtice — roxo médio
      ctx.strokeStyle = `rgba(160,0,255,${(0.60 + 0.25 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 1.2;
      ctx.beginPath();
      ctx.arc(mcx, mcy, 5.5, 0, Math.PI * 2);
      ctx.stroke();

      // Camada 3: espiral interna girando (3 arcos em 120°)
      const spinA = t_de * 2.4;
      ctx.strokeStyle = `rgba(200,60,255,${(0.50 + 0.30 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 0.9;
      for (let si = 0; si < 3; si++) {
        const startA = spinA + (si / 3) * Math.PI * 2;
        const endA   = startA + Math.PI * 0.7;
        ctx.beginPath();
        ctx.arc(mcx, mcy, 3.5, startA, endA);
        ctx.stroke();
      }

      // Camada 4: núcleo central — buraco negro (quase totalmente escuro)
      ctx.fillStyle = '#000005';
      ctx.beginPath();
      ctx.arc(mcx, mcy, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Ponto de singularidade — pixel roxo intenso no centro
      ctx.fillStyle = `rgba(220,80,255,${(0.7 + 0.3 * pulse).toFixed(2)})`;
      ctx.fillRect(mcx - 0.8, mcy - 0.8, 1.6, 1.6);

      ctx.restore();
      break;
    }

    case T.DARK_DIRT: {
      // ── Terra escura compactada — combina com DEAD_GRASS ─────────────────────
      // Fundo base
      ctx.fillStyle = PALETTE.deadGrassDirt;
      ctx.fillRect(px, py, TILE, TILE);

      // Torrões e pedrinhas espalhados pelo tile inteiro (0–32 px)
      ctx.fillStyle = PALETTE.deadGrassDark;
      ctx.fillRect(px + 4,  py + 4,  4, 2);  // topo-esq
      ctx.fillRect(px + 18, py + 3,  3, 2);  // topo-dir
      ctx.fillRect(px + 28, py + 10, 3, 2);  // meio-dir
      ctx.fillRect(px + 9,  py + 14, 4, 2);  // centro-esq
      ctx.fillRect(px + 22, py + 16, 3, 3);  // centro-dir
      ctx.fillRect(px + 2,  py + 22, 4, 2);  // baixo-esq
      ctx.fillRect(px + 14, py + 24, 5, 2);  // baixo-centro
      ctx.fillRect(px + 26, py + 26, 3, 2);  // baixo-dir
      ctx.fillRect(px + 7,  py + 29, 4, 2);  // rodapé-esq
      ctx.fillRect(px + 20, py + 29, 3, 2);  // rodapé-dir

      // Pontos de tom mais claro — variação de solo, bem distribuídos
      ctx.fillStyle = PALETTE.deadGrassDirtHi;
      ctx.fillRect(px + 12, py + 8,  2, 2);  // topo-centro
      ctx.fillRect(px + 27, py + 5,  2, 1);  // topo-dir
      ctx.fillRect(px + 3,  py + 15, 2, 2);  // meio-esq
      ctx.fillRect(px + 17, py + 19, 2, 2);  // meio-centro
      ctx.fillRect(px + 29, py + 20, 2, 1);  // meio-dir
      ctx.fillRect(px + 8,  py + 26, 2, 2);  // baixo-esq
      ctx.fillRect(px + 24, py + 23, 2, 2);  // baixo-dir

      // Partículas de cinza — pontilhado espalhado por todo o tile
      ctx.fillStyle = PALETTE.deadAshA;
      ctx.fillRect(px + 1,  py + 5,  1, 1);
      ctx.fillRect(px + 10, py + 2,  1, 1);
      ctx.fillRect(px + 23, py + 7,  1, 1);
      ctx.fillRect(px + 30, py + 14, 1, 1);
      ctx.fillRect(px + 5,  py + 18, 1, 1);
      ctx.fillRect(px + 16, py + 21, 1, 1);
      ctx.fillRect(px + 28, py + 24, 1, 1);
      ctx.fillRect(px + 11, py + 28, 1, 1);
      ctx.fillRect(px + 25, py + 30, 1, 1);

      ctx.fillStyle = PALETTE.deadAshB;
      ctx.fillRect(px + 6,  py + 9,  1, 1);
      ctx.fillRect(px + 19, py + 12, 1, 1);
      ctx.fillRect(px + 29, py + 3,  1, 1);
      ctx.fillRect(px + 2,  py + 27, 1, 1);
      ctx.fillRect(px + 14, py + 16, 1, 1);
      ctx.fillRect(px + 21, py + 23, 1, 1);
      ctx.fillRect(px + 8,  py + 31, 1, 1);
      ctx.fillRect(px + 27, py + 17, 1, 1);
      break;
    }

    case T.BRICK_COBBLE: {
      // Padrão de cobblestones em coord. globais — continuidade perfeita
      // entre tiles vizinhos. Cada cobble: 7×7px com 1px de rejunte.
      const _CELL = 8;    // período: 7px cobble + 1px rejunte
      const _CSZ  = _CELL - 1;  // = 7

      // Fundo = rejunte
      ctx.fillStyle = PALETTE.brickMortar;
      ctx.fillRect(px, py, TILE, TILE);

      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();

      const _fc = Math.floor(px / _CELL);
      const _lc = Math.floor((px + TILE - 1) / _CELL);
      const _fr = Math.floor(py / _CELL);
      const _lr = Math.floor((py + TILE - 1) / _CELL);

      for (let _row = _fr; _row <= _lr; _row++) {
        for (let _col = _fc; _col <= _lc; _col++) {
          const _bx   = _col * _CELL;
          const _by   = _row * _CELL;
          const _hash = ((_col * 7 + _row * 13) ^ (_col * 3 + _row)) & 0xff;

          // Tom base — leve variação por cobble
          const _v = _hash & 3;
          ctx.fillStyle = _v === 0 ? '#311d12'
                        : _v === 1 ? '#2a1a10'
                        : _v === 2 ? '#2e1c11'
                        :            '#281808';
          ctx.fillRect(_bx, _by, _CSZ, _CSZ);

          // Bevel: topo e esquerda claros (luz vinda de cima)
          ctx.fillStyle = '#4e2e18';
          ctx.fillRect(_bx,          _by, _CSZ, 1);
          ctx.fillStyle = '#3a2214';
          ctx.fillRect(_bx,          _by, 1, _CSZ);

          // Bevel: base e direita escuros (sombra)
          ctx.fillStyle = '#160c06';
          ctx.fillRect(_bx,          _by + _CSZ - 1, _CSZ, 1);
          ctx.fillRect(_bx + _CSZ-1, _by,            1,    _CSZ);
        }
      }

      ctx.restore();

      // Borda superior do tile — superfície onde o jogador pisa
      ctx.fillStyle = PALETTE.brickEdge;
      ctx.fillRect(px, py, TILE, 1);

      break;
    }

    case T.OBSIDIAN_BRICK: {
      // ── Tijolo de Obsidiana — pedras negras fundidas em fileiras muradas ──────
      // Mesma família de cores da obsidiana (negros com toque frio roxo-azulado),
      // porém organizadas em fiadas de alvenaria clássica com rejunte escuro.
      // Cada tijolo preserva a profundidade vítrea e o reflexo frio da obsidiana,
      // mas a textura é angular e estrutural — não lisa.

      const BW = 15; // largura do tijolo (px)
      const BH = 10; // altura do tijolo — 3 fiadas × 10 + 2 rejuntes × 1 = 32 ✓
      const MR = 1;  // espessura do rejunte

      // ── 1. Fundo base — rejunte (mais escuro que qualquer tijolo) ─────────
      ctx.fillStyle = PALETTE.obsidBrickMortar;
      ctx.fillRect(px, py, TILE, TILE);

      // ── 2. Fiadas de tijolos (3 linhas) ───────────────────────────────────
      for (let row = 0; row < 3; row++) {
        const by = py + row * (BH + MR);

        // Alternância clássica: fiadas ímpares deslocadas por meio tijolo
        const offset = (row % 2 === 0) ? 0 : ((BW + MR) >> 1);

        for (let col = -1; col <= 2; col++) {
          const bx = px + col * (BW + MR) + offset;

          // Clip para não vazar além das bordas do tile
          const cx = Math.max(bx, px);
          const cw = Math.min(bx + BW, px + TILE) - cx;
          if (cw <= 0) continue;

          // Hash estável por tijolo — sem ruído aleatório por frame
          const bh = ((bx * 13 + by * 29 + px * 7 + py * 19) & 0xff);

          // ── 2a. Corpo do tijolo — cor base com leve variação ──────────────
          ctx.fillStyle = (bh & 3) > 1
            ? PALETTE.obsidBrickLit    // ~50% dos tijolos levemente mais claros
            : PALETTE.obsidBrickBase;
          ctx.fillRect(cx, by, cw, BH);

          // ── 2b. Núcleo interno — profundidade vítrea (como obsidiana) ─────
          if (cw > 5) {
            ctx.fillStyle = PALETTE.obsidBrickDeep;
            ctx.fillRect(cx + 2, by + 2, cw - 4, BH - 4);
          }

          // ── 2c. Reflexo frio no topo do tijolo (~40% dos tijolos) ─────────
          // Referência direta à obsidiana: lâmina de luz fria rasante
          if (bh > 150 && cw > 4) {
            ctx.fillStyle = PALETTE.obsidBrickSheen;
            ctx.fillRect(cx + 1, by + 1, cw - 2, 1);
            // Variante: reflexo extra em 15% dos tijolos (brilho de ponto)
            if (bh > 230 && cw > 8) {
              ctx.fillStyle = 'rgba(40, 35, 80, 0.55)';
              ctx.fillRect(cx + 2, by + 1, 3, 1);
            }
          }

          // ── 2d. Sombra interna — fundo e lateral direita do tijolo ────────
          // Dá volume: o tijolo "afunda" no rejunte
          ctx.fillStyle = 'rgba(0,0,0,0.52)';
          ctx.fillRect(cx, by + BH - 2, cw, 2); // sombra inferior
          if (bx + BW <= px + TILE) {            // sombra lateral direita
            ctx.fillRect(bx + BW - 2, by, 2, BH);
          }

          // ── 2e. Micro-veio ocasional — herança da textura da obsidiana ────
          // ~12% dos tijolos exibem uma fratura curta diagonal, como vidro
          if ((bh & 0x1f) === 0x0a && cw > 8) {
            ctx.strokeStyle = 'rgba(8, 6, 18, 0.80)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(cx + 3,      by + 3);
            ctx.lineTo(cx + cw - 4, by + BH - 4);
            ctx.stroke();
          }
        }
      }

      // ── 3. Bordas do tile — aresta vítrea fria (topo/esq) e sombra (inf/dir)
      ctx.fillStyle = PALETTE.obsidBrickEdge;
      ctx.fillRect(px,           py,           TILE, 1); // topo
      ctx.fillRect(px,           py,           1, TILE); // esquerda
      // Ponto de luz mais brilhante no canto sup-esq (como obsidiana)
      ctx.fillStyle = 'rgba(38, 34, 72, 0.70)';
      ctx.fillRect(px,           py,           6, 1);
      ctx.fillRect(px,           py,           1, 6);

      ctx.fillStyle = 'rgba(0,0,0,0.88)';
      ctx.fillRect(px,           py + TILE - 1, TILE, 1); // base
      ctx.fillRect(px + TILE - 1, py,           1, TILE); // direita

      break;
    }

    case T.SPIKE:
      ctx.fillStyle = PALETTE.spike;
      // draw triangle spikes
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(px + i * 8, py + TILE);
        ctx.lineTo(px + i * 8 + 4, py + 4);
        ctx.lineTo(px + i * 8 + 8, py + TILE);
        ctx.fill();
      }
      break;

    case T.ECHO_PILLAR: {
      const _shW = 14;
      const _shX = px + (TILE - _shW) / 2;   // shaft centrado, 9px cada lado

      // ── Fuste — corpo de tijolo ──────────────────────────────────────
      ctx.fillStyle = PALETTE.brick;
      ctx.fillRect(_shX, py, _shW, TILE);

      // Curvatura cilíndrica: sombras nas bordas do fuste
      ctx.fillStyle = 'rgba(0,0,0,0.36)';
      ctx.fillRect(_shX,           py, 2, TILE);
      ctx.fillRect(_shX + _shW - 2, py, 2, TILE);
      // Destaque central quente
      ctx.fillStyle = 'rgba(100,48,14,0.20)';
      ctx.fillRect(_shX + 4, py, 5, TILE);

      // Aresta esquerda — brickEdge
      ctx.fillStyle = PALETTE.brickEdge;
      ctx.fillRect(_shX, py, 1, TILE);

      // ── Juntas de argamassa — alinhadas globalmente (period 8) ───────
      // O padrão é calculado nas coords de tela (consistente entre tiles
      // vizinhos na mesma frame) → continuidade perfeita ao empilhar.
      ctx.fillStyle = PALETTE.brickMortar;
      const _off = ((py % 8) + 8) % 8;
      const _ms  = py + (8 - _off) % 8;
      for (let _my = _ms; _my < py + TILE; _my += 8) {
        ctx.fillRect(_shX, _my, _shW, 1);
      }

      break;
    }

    case T.DUNGEON_FLOOR: {
      // ── Pedras de Masmorra — lajes irregulares de pedra medieval ─────────
      // Padrão calculado em coordenadas globais para perfeita continuidade
      // entre tiles vizinhos (as juntas nunca quebram na borda do tile).
      //
      // Layout: 4 lajes por tile em grade 2×2, cada laje com:
      //   • Corpo com variação sutil de tom por posição global
      //   • Junta escura (2px) entre lajes
      //   • Aresta superior clara (luz vinda de cima — o jogador anda aqui)
      //   • Aresta inferior escura (sombra)
      //   • Chanfro esquerdo levemente claro
      //   • Micro-detalhe: rachado + musgo em alguns blocos

      const SLAB_W = 16;  // largura da laje (px)
      const SLAB_H = 16;  // altura da laje (px)
      const JOINT  = 1;   // espessura da junta
      const STEP_X = SLAB_W; // passo horizontal total (sem junta extra — a junta faz parte da laje)
      const STEP_Y = SLAB_H;

      // Fundo geral — juntas escuras
      ctx.fillStyle = PALETTE.dungeonDeep;
      ctx.fillRect(px, py, TILE, TILE);

      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();

      // Primeira laje visível neste tile (em coord. globais)
      const firstCol = Math.floor(px / STEP_X);
      const lastCol  = Math.floor((px + TILE - 1) / STEP_X);
      const firstRow = Math.floor(py / STEP_Y);
      const lastRow  = Math.floor((py + TILE - 1) / STEP_Y);

      for (let row = firstRow; row <= lastRow; row++) {
        for (let col = firstCol; col <= lastCol; col++) {
          // Hash estável por posição global — dá variação visual consistente
          const hash = ((col * 7 + row * 13) ^ (col * 3)) & 0xff;

          // Margem interna da laje (cria junta visual)
          const bx = col * STEP_X + JOINT;
          const by = row * STEP_Y + JOINT;
          const bw = SLAB_W - JOINT * 2;
          const bh = SLAB_H - JOINT * 2;

          // ── Tom base da laje — varia por posição ────────────────────────
          const base  = 30 + (hash % 8) * 2;   // 30–44, pedra escura
          const light = base + 12;
          const dark  = base - 8;

          // Face principal
          ctx.fillStyle = `rgb(${base},${Math.round(base*0.92)},${Math.round(base*0.72)})`;
          ctx.fillRect(bx, by, bw, bh);

          // ── Gradiente de profundidade (faixa escura no centro-baixo) ────
          // Simula a concavidade leve das pedras gastas
          ctx.fillStyle = `rgba(0,0,0,${0.08 + (hash % 3) * 0.04})`;
          ctx.fillRect(bx, by + Math.floor(bh * 0.55), bw, Math.floor(bh * 0.45));

          // ── Aresta superior — luz rasante (onde o jogador pisa) ─────────
          ctx.fillStyle = `rgb(${light+4},${Math.round((light+4)*0.92)},${Math.round((light+4)*0.72)})`;
          ctx.fillRect(bx, by, bw, 1);
          // Sub-pixel extra brilhante nos primeiros 4px (canto)
          ctx.fillStyle = `rgb(${light+10},${Math.round((light+10)*0.88)},${Math.round((light+10)*0.68)})`;
          ctx.fillRect(bx, by, Math.min(4, bw), 1);

          // ── Aresta esquerda — levemente clara (chanfro lateral) ─────────
          ctx.fillStyle = `rgb(${base+6},${Math.round((base+6)*0.90)},${Math.round((base+6)*0.70)})`;
          ctx.fillRect(bx, by + 1, 1, bh - 2);

          // ── Aresta inferior + direita — sombra ──────────────────────────
          ctx.fillStyle = `rgb(${dark},${Math.round(dark*0.90)},${Math.round(dark*0.70)})`;
          ctx.fillRect(bx, by + bh - 1, bw, 1);     // base
          ctx.fillRect(bx + bw - 1, by + 1, 1, bh - 2); // direita

          // ── Rachadura diagonal — ~35% das lajes ─────────────────────────
          if ((hash & 0x1c) === 0x04) {
            ctx.strokeStyle = `rgba(0,0,0,${0.30 + (hash & 3) * 0.08})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            // Rachadura vai de ~25% ao ~75% da laje, levemente diagonal
            const crackX1 = bx + Math.floor(bw * 0.20) + (hash & 3);
            const crackY1 = by + Math.floor(bh * 0.30);
            const crackX2 = bx + Math.floor(bw * 0.65) + ((hash >> 2) & 2);
            const crackY2 = by + Math.floor(bh * 0.72);
            ctx.moveTo(crackX1, crackY1);
            ctx.lineTo(crackX2, crackY2);
            ctx.stroke();
            // Segundo segmento curto saindo da rachadura
            if (hash & 1) {
              ctx.beginPath();
              ctx.moveTo(crackX2, crackY2);
              ctx.lineTo(crackX2 + (hash & 2 ? 3 : -3), crackY2 + 2);
              ctx.stroke();
            }
          }

          // ── Musgo nas juntas — pontinhos verdes escuros (~20% dos blocos) ─
          if ((hash & 0xe0) === 0x60) {
            ctx.fillStyle = PALETTE.dungeonMoss;
            // Musgo aparece na borda inferior da laje (próximo à junta)
            const mossY = by + bh - 1;
            for (let m = 0; m < 3; m++) {
              const mx = bx + Math.floor(bw * 0.2 * (m + 1)) + (hash & 1);
              if (mx >= bx && mx < bx + bw) {
                ctx.fillRect(mx, mossY, 1, 1);
              }
            }
          }

          // ── Ponto de desgaste — mancha escura circular em ~15% ──────────
          if ((hash & 0xf0) === 0x30) {
            const spotX = bx + Math.floor(bw * 0.45) + ((hash >> 4) & 3) - 1;
            const spotY = by + Math.floor(bh * 0.45) + ((hash >> 3) & 2) - 1;
            ctx.fillStyle = `rgba(0,0,0,0.18)`;
            ctx.beginPath();
            ctx.ellipse(spotX, spotY, 2.5, 1.8, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ── Linha de sombra interna superior (reforça que é chão) ────────────
      // Sutilíssima sombra no topo do tile — ajuda a diferenciar piso de parede
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(px, py, TILE, 2);

      ctx.restore();
      break;
    }

    case T.LADDER:
      ctx.fillStyle = PALETTE.ladder;
      ctx.fillRect(px + 6, py, 4, TILE);
      ctx.fillRect(px + 22, py, 4, TILE);
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(px + 6, py + i * 8 + 2, 20, 3);
      }
      break;

    case T.PLAT:
      ctx.fillStyle = PALETTE.platform;
      ctx.fillRect(px, py, TILE, 6);
      ctx.fillStyle = PALETTE.solidEdge;
      ctx.fillRect(px, py, TILE, 2);
      break;

    case T.FENCE: {
      // Cerca de fazenda decorativa — dois trilhos horizontais + mourões verticais
      // Padrão contínuo calculado em coordenadas globais.
 
      // Posições verticais dos dois trilhos (relativos ao tile)
      const rail1Y = py + 8;   // trilho superior
      const rail2Y = py + 22;  // trilho inferior
      const railH  = 3;        // espessura do trilho
      const postW  = 4;        // largura do mourão
      const postH  = TILE;     // mourão vai do topo à base do tile
 
      // Passo dos mourões — calculado globalmente para continuidade
      const POST_STEP = 16; // um mourão a cada 16px
 
      // Tom de madeira velha
      const woodDark  = '#3a2208';
      const woodMid   = '#4a2e12';
      const woodLight = '#5a3a1a';
      const woodEdge  = '#6a4520';
 
      // helper: desenha uma peça de madeira com gradiente lateral e aresta clara
      function woodPiece(wx, wy, ww, wh) {
        const g = ctx.createLinearGradient(wx, wy, wx + ww, wy);
        g.addColorStop(0,    woodDark);
        g.addColorStop(0.2,  woodMid);
        g.addColorStop(0.5,  woodLight);
        g.addColorStop(0.8,  woodMid);
        g.addColorStop(1,    woodDark);
        ctx.fillStyle = g;
        ctx.fillRect(wx, wy, ww, wh);
        // aresta superior clara
        ctx.fillStyle = woodEdge;
        ctx.fillRect(wx, wy, ww, 1);
        // aresta esquerda clara
        ctx.fillRect(wx, wy, 1, wh);
        // aresta inferior escura
        ctx.fillStyle = '#1e1208';
        ctx.fillRect(wx, wy + wh - 1, ww, 1);
      }
 
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();
 
      // ── Mourões verticais (calculados globalmente) ───────────────────────
      const firstPost = Math.floor(px / POST_STEP);
      const lastPost  = Math.floor((px + TILE - 1) / POST_STEP);
      for (let p = firstPost; p <= lastPost; p++) {
        const bx = p * POST_STEP + (POST_STEP / 2) - postW / 2;
        woodPiece(bx, py, postW, postH);
      }
 
      // ── Trilho superior ──────────────────────────────────────────────────
      woodPiece(px, rail1Y, TILE, railH);
 
      // ── Trilho inferior ──────────────────────────────────────────────────
      woodPiece(px, rail2Y, TILE, railH);
 
      // ── Pregos nos cruzamentos (mourão × trilho) ─────────────────────────
      ctx.fillStyle = '#555';
      for (let p = firstPost; p <= lastPost; p++) {
        const ncx = p * POST_STEP + POST_STEP / 2;
        for (const ny of [rail1Y + railH / 2, rail2Y + railH / 2]) {
          ctx.beginPath();
          ctx.arc(ncx, ny, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.beginPath();
          ctx.arc(ncx - 0.4, ny - 0.4, 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#555';
        }
      }
 
      ctx.restore();
      break;
    }

    case T.WOOD_PLANKS: {
      // Tábuas verticais de madeira — decorativo, não bloqueia passagem
      // Padrão calculado em coordenadas globais para continuidade perfeita
      // entre tiles vizinhos (tábuas não quebram na junção).
 
      const PLANK_W  = 7;  // largura de cada tábua (px)
      const GAP_W    = 1;  // largura da fresta entre tábuas
      const STEP     = PLANK_W + GAP_W; // 8px — passo total
 
      // Fundo — fresta escura entre tábuas
      ctx.fillStyle = '#0d0806';
      ctx.fillRect(px, py, TILE, TILE);
 
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();
 
      // Primeira tábua visível neste tile (calculado em coord. globais)
      const firstPlank = Math.floor(px / STEP);
      const lastPlank  = Math.floor((px + TILE - 1) / STEP);
 
      for (let p = firstPlank; p <= lastPlank; p++) {
        const worldX = p * STEP;
        const bx     = worldX; // coord. de tela (drawTile já recebe px em tela)
 
        // Tom base da tábua — varia por índice global para parecer madeira real
        const seed  = (p * 13 + 7) & 0xf;          // 0–15, estável
        const base  = 38 + (seed % 6) * 4;          // 38–58, marrom escuro
        const light = base + 10;
        const dark  = base - 10;
 
        // Face principal da tábua
        const plankGrad = ctx.createLinearGradient(bx, py, bx + PLANK_W, py);
        plankGrad.addColorStop(0,    `rgb(${dark},${Math.round(dark*0.65)},${Math.round(dark*0.35)})`);
        plankGrad.addColorStop(0.25, `rgb(${base},${Math.round(base*0.65)},${Math.round(base*0.35)})`);
        plankGrad.addColorStop(0.55, `rgb(${light},${Math.round(light*0.65)},${Math.round(light*0.35)})`);
        plankGrad.addColorStop(0.8,  `rgb(${base},${Math.round(base*0.65)},${Math.round(base*0.35)})`);
        plankGrad.addColorStop(1,    `rgb(${dark},${Math.round(dark*0.65)},${Math.round(dark*0.35)})`);
        ctx.fillStyle = plankGrad;
        ctx.fillRect(bx, py, PLANK_W, TILE);
 
        // Veio central — linha escura sutil ao longo da tábua
        const veinX = bx + Math.floor(PLANK_W * 0.45);
        ctx.fillStyle = `rgba(0,0,0,${0.10 + (seed % 3) * 0.04})`;
        ctx.fillRect(veinX, py, 1, TILE);
 
        // Nó de madeira — só em algumas tábuas, posição estável por tile global
        if (seed % 4 === 0) {
          const knotY  = py + ((seed * 17 + p * 7) % (TILE - 6)) + 3;
          const knotCX = bx + PLANK_W / 2;
          // Anel externo do nó
          ctx.strokeStyle = `rgba(0,0,0,0.30)`;
          ctx.lineWidth   = 1;
          ctx.beginPath();
          ctx.ellipse(knotCX, knotY, 2.5, 1.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          // Núcleo do nó
          ctx.fillStyle = `rgba(0,0,0,0.20)`;
          ctx.beginPath();
          ctx.ellipse(knotCX, knotY, 1.2, 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
 
        // Aresta esquerda levemente mais clara (borda da tábua)
        ctx.fillStyle = `rgba(255,255,255,0.06)`;
        ctx.fillRect(bx, py, 1, TILE);
      }
 
      ctx.restore();
      break;
    }

    case T.CRATE: {
      const m = 0; // sem margem — caixote preenche o tile todo
 
      // HP do caixote (2 golpes para destruir)
      const ctxT = Math.round((px + (typeof _camX !== 'undefined' ? _camX : 0)) / TILE);
      const ctyT = Math.round((py + (typeof _camY !== 'undefined' ? _camY : 0)) / TILE);
      const chp  = (() => { const k = getBreakKey(_currentMapId, ctxT, ctyT); return k in breakableState ? breakableState[k] : 2; })();
 
      // ── Fundo escuro (sombra ao redor do caixote) ────────────────────────
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(px, py, TILE, TILE);
 
      // ── Face principal — madeira velha ───────────────────────────────────
      const woodGrad = ctx.createLinearGradient(px + m, py + m, px + m, py + TILE - m);
      woodGrad.addColorStop(0,   '#5a3a1a');
      woodGrad.addColorStop(0.5, '#4a2e12');
      woodGrad.addColorStop(1,   '#3a2208');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(px + m, py + m, TILE - m * 2, TILE - m * 2);
 
      // ── Tábuas verticais — veios de madeira ──────────────────────────────
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px + m + 9,  py + m, 1, TILE - m * 2);
      ctx.fillRect(px + m + 19, py + m, 1, TILE - m * 2);
 
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(px + m + 1,  py + m + 1, 1, TILE - m * 2 - 2);
      ctx.fillRect(px + m + 10, py + m + 1, 1, TILE - m * 2 - 2);
      ctx.fillRect(px + m + 20, py + m + 1, 1, TILE - m * 2 - 2);
 
      // ── Reforço metálico — cantoneiras nas 4 bordas ──────────────────────
      const cw = 5;
      const ch = 5;
      const metalColor = '#2a2a2a';
      const metalShine = '#484848';
 
      const corners = [
        [px + m,             py + m            ],
        [px + TILE - m - cw, py + m            ],
        [px + m,             py + TILE - m - ch],
        [px + TILE - m - cw, py + TILE - m - ch],
      ];
      for (const [cx2, cy2] of corners) {
        ctx.fillStyle = metalColor;
        ctx.fillRect(cx2, cy2, cw, ch);
        ctx.fillStyle = metalShine;
        ctx.fillRect(cx2, cy2, cw, 1);
        ctx.fillRect(cx2, cy2, 1, ch);
      }
 
      // ── Faixa metálica horizontal central ────────────────────────────────
      const bandY = py + m + (TILE - m * 2) / 2 - 1;
      ctx.fillStyle = metalColor;
      ctx.fillRect(px + m, bandY, TILE - m * 2, 3);
      ctx.fillStyle = metalShine;
      ctx.fillRect(px + m, bandY, TILE - m * 2, 1);
 
      // Pregos na faixa central (3 pregos)
      ctx.fillStyle = '#555';
      for (const nailX of [px + m + 5, px + TILE / 2, px + TILE - m - 6]) {
        ctx.beginPath();
        ctx.arc(nailX, bandY + 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(nailX - 0.5, bandY + 0.5, 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#555';
      }
 
      // ── Borda externa do caixote ──────────────────────────────────────────
      ctx.fillStyle = '#6a4520';
      ctx.fillRect(px + m, py + m, TILE - m * 2, 1);
      ctx.fillRect(px + m, py + m, 1, TILE - m * 2);
      ctx.fillStyle = '#1e1208';
      ctx.fillRect(px + m, py + TILE - m - 2, TILE - m * 2, 2);
      ctx.fillRect(px + TILE - m - 1, py + m, 1, TILE - m * 2);
 
      // ── Dano — overlay de rachaduras por cima de tudo ────────────────────
      if (chp <= 1) {
        // Escurece — quase destruído
        ctx.fillStyle = 'rgba(0,0,0,0.40)';
        ctx.fillRect(px, py, TILE, TILE);
        // Rachaduras diagonais nas tábuas
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px + 4,  py + 4);  ctx.lineTo(px + 14, py + 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 18, py + 6);  ctx.lineTo(px + 10, py + 28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 22, py + 14); ctx.lineTo(px + 30, py + 26); ctx.stroke();
        // Lascas abertas — linhas de madeira exposta mais clara
        ctx.strokeStyle = 'rgba(180,110,50,0.55)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(px + 5,  py + 5);  ctx.lineTo(px + 13, py + 19); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 19, py + 7);  ctx.lineTo(px + 11, py + 27); ctx.stroke();
      }
 
      break;
    }

    case T.WALL: {
      const brickW  = 13;  // largura do tijolo
      const brickH  = 7;   // altura do tijolo
      const mortarX = 2;   // espessura do rejunte horizontal
      const mortarY = 1;   // espessura do rejunte vertical
      const period  = brickW + mortarX; // 15px por "slot"

      // Fundo — cor do rejunte
      ctx.fillStyle = '#1c1c28';
      ctx.fillRect(px, py, TILE, TILE);

      for (let row = 0; row < 5; row++) {
        const ry     = py + row * (brickH + mortarY) + mortarY;
        const offset = (row % 2) * 8; // running bond: fileiras pares/ímpares deslocadas

        for (let col = -1; col <= 2; col++) {
          const rx = px + col * period + offset;

          // Corta nas bordas do tile
          const x1 = Math.max(px, rx);
          const x2 = Math.min(px + TILE, rx + brickW);
          if (x2 <= x1) continue;

          // Cor do tijolo com leve variação entre fileiras/colunas
          const shade = ((row + col) % 2 === 0) ? '#383848' : '#353545';
          ctx.fillStyle = shade;
          ctx.fillRect(x1, ry, x2 - x1, brickH);

          // Highlight sutil no topo do tijolo
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          ctx.fillRect(x1, ry, x2 - x1, 1);

          // Sombra sutil na base do tijolo
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.fillRect(x1, ry + brickH - 1, x2 - x1, 1);
        }
      }
      break;
    }

    case T.DOOR_R: case T.DOOR_L: case T.DOOR_U: case T.DOOR_D: {
      // Cola o frame do portal pré-renderizado no offscreen canvas (sem shadow no ctx principal)
      ctx.drawImage(getPortalFrame(time), px, py);
      break;
    }

    case T.VOID_STONE: {
      // ── Pedra Negra das Trevas ───────────────────────────────────────────────
      // Simetria de 4 pontos: losangos nos 4 cantos convergindo ao centro,
      // paleta baseada no HEX (roxo profundo + magenta escuro).
      const half = TILE / 2; // 16

      // Fundo — vazio entre as pedras (rejunte de trevas)
      ctx.fillStyle = '#0c0220';
      ctx.fillRect(px, py, TILE, TILE);

      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();

      // 4 losangos nos cantos — cada um centrado num vértice do tile.
      // Com half = TILE/2, cada losango ocupa exatamente 1 quadrante → simetria perfeita.
      const verts = [
        [px,        py       ],
        [px + TILE, py       ],
        [px,        py + TILE],
        [px + TILE, py + TILE],
      ];

      for (const [cx, cy] of verts) {
        // Variação de tom por posição — estável, igual ao HEX
        const seed  = (Math.abs(cx * 3 + cy * 7) & 0xf);
        const shift = (seed % 3) * 4; // 0, 4 ou 8

        // ── Face principal do losango ─────────────────────────────────────────
        ctx.beginPath();
        ctx.moveTo(cx,        cy - half);
        ctx.lineTo(cx + half, cy       );
        ctx.lineTo(cx,        cy + half);
        ctx.lineTo(cx - half, cy       );
        ctx.closePath();
        ctx.fillStyle = `rgb(${30 + shift},${4 + shift},${52 + shift})`;
        ctx.fill();

        // ── Aresta superior-esquerda — luz (simulação 3D) ─────────────────────
        // topo → esquerda
        ctx.beginPath();
        ctx.moveTo(cx,            cy - half + 1);
        ctx.lineTo(cx - half + 1, cy           );
        ctx.lineTo(cx - half + 3, cy           );
        ctx.lineTo(cx,            cy - half + 3);
        ctx.closePath();
        ctx.fillStyle = '#4a1860';
        ctx.fill();

        // ── Aresta inferior-direita — sombra ──────────────────────────────────
        ctx.beginPath();
        ctx.moveTo(cx,            cy + half - 1);
        ctx.lineTo(cx + half - 1, cy           );
        ctx.lineTo(cx + half - 3, cy           );
        ctx.lineTo(cx,            cy + half - 3);
        ctx.closePath();
        ctx.fillStyle = '#06011a';
        ctx.fill();

        // ── Borda do losango — fio magenta escuro ─────────────────────────────
        ctx.beginPath();
        ctx.moveTo(cx,        cy - half);
        ctx.lineTo(cx + half, cy       );
        ctx.lineTo(cx,        cy + half);
        ctx.lineTo(cx - half, cy       );
        ctx.closePath();
        ctx.strokeStyle = '#3c1050';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ── Núcleo central — losango pequeno de trevas ────────────────────────
      const r = 5;
      const mcx = px + half;
      const mcy = py + half;
      ctx.beginPath();
      ctx.moveTo(mcx,     mcy - r);
      ctx.lineTo(mcx + r, mcy    );
      ctx.lineTo(mcx,     mcy + r);
      ctx.lineTo(mcx - r, mcy    );
      ctx.closePath();
      ctx.fillStyle = '#08011c';
      ctx.fill();
      ctx.strokeStyle = '#642866';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ponto de brilho magenta no núcleo
      ctx.fillStyle = '#7a2878';
      ctx.fillRect(mcx - 1, mcy - 1, 2, 2);

      ctx.restore();
      break;
    }

    case T.HEX: {
      const half = TILE / 2;  // 16 — metade do tile = "raio" do losango

      // Fundo — junta entre losangos
      ctx.fillStyle = '#140630';
      ctx.fillRect(px, py, TILE, TILE);

      // Itera pelos 9 centros necessários para cobrir o tile sem lacunas
      // (losangos nas bordas são cortados pelo clip abaixo)
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();

      for (let row = 0; row <= 1; row++) {
        for (let col = 0; col <= 1; col++) {
          const cx = px + col * TILE;
          const cy = py + row * TILE;
          const isLight = (col + row) % 2 === 0;

          // Corpo do losango
          ctx.beginPath();
          ctx.moveTo(cx,          cy - half);
          ctx.lineTo(cx + half,   cy);
          ctx.lineTo(cx,          cy + half);
          ctx.lineTo(cx - half,   cy);
          ctx.closePath();
          ctx.fillStyle = isLight ? '#320640' : '#080640';
          ctx.fill();
          // Borda fina
          ctx.strokeStyle = '#642866';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.restore();
      break;
    }

    case T.PILLAR: {
      const cx = px + TILE / 2;
 
      // ── Fundo — pedra de parede atrás do pilar ──────────────────────────
      ctx.fillStyle = '#181818';
      ctx.fillRect(px, py, TILE, TILE);
 
      // ── Fuste — corpo central do pilar ──────────────────────────────────
      // Ligeiramente cônico: mais largo no meio que nas extremidades (entasis)
      const shaftW  = 14;  // largura no centro
      const shaftX  = cx - shaftW / 2;
 
      // Gradiente lateral para simular curvatura cilíndrica
      const shaftGrad = ctx.createLinearGradient(shaftX, py, shaftX + shaftW, py);
      shaftGrad.addColorStop(0,    '#1e1e1e');   // sombra esquerda
      shaftGrad.addColorStop(0.18, '#2e2e2e');
      shaftGrad.addColorStop(0.42, '#484848');   // luz central
      shaftGrad.addColorStop(0.58, '#484848');
      shaftGrad.addColorStop(0.82, '#2e2e2e');
      shaftGrad.addColorStop(1,    '#1a1a1a');   // sombra direita
      ctx.fillStyle = shaftGrad;
      ctx.fillRect(shaftX, py, shaftW, TILE);
 
      // Estrias verticais no fuste (caneluras clássicas)
      ctx.strokeStyle = 'rgba(0,0,0,0.30)';
      ctx.lineWidth = 1;
      for (let s = 1; s <= 2; s++) {
        const sx = shaftX + (shaftW / 3) * s;
        ctx.beginPath();
        ctx.moveTo(sx, py);
        ctx.lineTo(sx, py + TILE);
        ctx.stroke();
      }
 
      // Highlight central — reflexo de luz
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(cx - 2, py, 4, TILE);
 
      // ── Capitel — topo do pilar ──────────────────────────────────────────
      // Ábaco (placa plana no topo)
      ctx.fillStyle = '#3c3c3c';
      ctx.fillRect(px, py, TILE, 5);
      // Highlight do ábaco
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(px, py, TILE, 1);
      // Sombra inferior do ábaco
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(px, py + 4, TILE, 2);
 
      // Equino (moldura arredondada abaixo do ábaco)
      ctx.fillStyle = '#333';
      ctx.fillRect(px + 2, py + 5, TILE - 4, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(px + 2, py + 5, TILE - 4, 1);
 
      // ── Base — plinto na base do pilar ──────────────────────────────────
      // Toro (moldura curva)
      ctx.fillStyle = '#333';
      ctx.fillRect(px + 2, py + TILE - 9, TILE - 4, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(px + 2, py + TILE - 9, TILE - 4, 1);
 
      // Plinto (base plana)
      ctx.fillStyle = '#3c3c3c';
      ctx.fillRect(px, py + TILE - 5, TILE, 5);
      // Highlight do plinto
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(px, py + TILE - 5, TILE, 1);
      // Sombra na base
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(px, py + TILE - 1, TILE, 1);
 
      // ── Sombras laterais — profundidade na parede ────────────────────────
      // Sombra esquerda (parede atrás do pilar)
      const shadowL = ctx.createLinearGradient(px, py, shaftX, py);
      shadowL.addColorStop(0, 'rgba(0,0,0,0.55)');
      shadowL.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowL;
      ctx.fillRect(px, py, shaftX - px, TILE);
 
      // Sombra direita
      const shadowR = ctx.createLinearGradient(shaftX + shaftW, py, px + TILE, py);
      shadowR.addColorStop(0, 'rgba(0,0,0,0)');
      shadowR.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = shadowR;
      ctx.fillRect(shaftX + shaftW, py, (px + TILE) - (shaftX + shaftW), TILE);
 
      break;
    }

    case T.CHESS: {
      const cell = TILE / 4; // 8px por quadrinho — 4×4 quadrinhos por tile
 
      // Fundo base — cinza carvão profundo
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(px, py, TILE, TILE);
 
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const isLight = (col + row) % 2 === 0;
          if (!isLight) continue; // carvão já está no fundo
 
          const qx = px + col * cell;
          const qy = py + row * cell;
 
          // Quadrado claro — cinza médio-escuro
          ctx.fillStyle = '#3a3a3a';
          ctx.fillRect(qx, qy, cell, cell);
 
          // Highlight sutil no canto superior-esquerdo (dá volume de pedra)
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(qx, qy, cell, 1);
          ctx.fillRect(qx, qy, 1, cell);
 
          // Sombra no canto inferior-direito
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(qx, qy + cell - 1, cell, 1);
          ctx.fillRect(qx + cell - 1, qy, 1, cell);
        }
      }
 
      // Grade de rejunte muito fina por cima de tudo
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(px + i * cell, py);
        ctx.lineTo(px + i * cell, py + TILE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px, py + i * cell);
        ctx.lineTo(px + TILE, py + i * cell);
        ctx.stroke();
      }
 
      break;
    }

    case T.IRON_GATE: {
      // Decorativo — não bloqueia passagem, desenhado por cima do fundo
 
      // ── Fundo transparente (ar) — não preenche o tile ───────────────────
      // (o background já foi desenhado pelo drawBackground)
 
      const barW    = 3;   // largura de cada barra
      const spacing = 8;   // distância entre centros das barras
      const bars    = 4;   // número de barras verticais
      const startX  = px + (TILE - (bars - 1) * spacing) / 2;
 
      // ── Barras horizontais — travessa superior e inferior ────────────────
      const crossY1 = py + 5;   // travessa do topo
      const crossY2 = py + TILE - 6; // travessa da base
 
      // Gradiente metálico horizontal (igual para todas as peças)
      function ironGrad(x1, x2, y) {
        const g = ctx.createLinearGradient(x1, y, x2, y);
        g.addColorStop(0,    '#1a1a1a');
        g.addColorStop(0.25, '#3a3a3a');
        g.addColorStop(0.5,  '#555');
        g.addColorStop(0.75, '#3a3a3a');
        g.addColorStop(1,    '#1a1a1a');
        return g;
      }
 
      // Travessa superior
      ctx.fillStyle = ironGrad(px, px + TILE, crossY1);
      ctx.fillRect(px + 2, crossY1, TILE - 4, barW);
      // Highlight superior
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(px + 2, crossY1, TILE - 4, 1);
 
      // Travessa inferior
      ctx.fillStyle = ironGrad(px, px + TILE, crossY2);
      ctx.fillRect(px + 2, crossY2, TILE - 4, barW);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(px + 2, crossY2, TILE - 4, 1);
 
      // ── Barras verticais ─────────────────────────────────────────────────
      for (let b = 0; b < bars; b++) {
        const bx = startX + b * spacing - barW / 2;
 
        // Corpo da barra — gradiente metálico lateral
        const vg = ctx.createLinearGradient(bx, py, bx + barW, py);
        vg.addColorStop(0,   '#1a1a1a');
        vg.addColorStop(0.3, '#484848');
        vg.addColorStop(0.6, '#555');
        vg.addColorStop(1,   '#1e1e1e');
        ctx.fillStyle = vg;
        ctx.fillRect(bx, py, barW, TILE);
 
        // Highlight lateral esquerdo
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(bx, py, 1, TILE);
 
        // ── Ponta de lança no topo de cada barra ────────────────────────
        const tipCX = bx + barW / 2;
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(tipCX,        py - 5);   // ponta
        ctx.lineTo(tipCX + barW, py + 3);   // base direita
        ctx.lineTo(tipCX - barW, py + 3);   // base esquerda
        ctx.closePath();
        ctx.fill();
        // Brilho na ponta
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.moveTo(tipCX,            py - 5);
        ctx.lineTo(tipCX + 0.5,      py + 1);
        ctx.lineTo(tipCX - 0.5,      py + 1);
        ctx.closePath();
        ctx.fill();
 
        // ── Rebite no cruzamento com as travessas ────────────────────────
        for (const ry of [crossY1 + barW / 2, crossY2 + barW / 2]) {
          ctx.fillStyle = '#666';
          ctx.beginPath();
          ctx.arc(tipCX, ry, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.beginPath();
          ctx.arc(tipCX - 0.5, ry - 0.5, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
 
      // ── Ferrugem sutil — manchas escuras aleatórias por tile ────────────
      ctx.fillStyle = 'rgba(60,25,10,0.22)';
      // posições fixas baseadas na posição do tile (pseudoaleatório estável)
      const seed = (px * 7 + py * 13) % 17;
      ctx.fillRect(startX + (seed % bars) * spacing - 1, py + 10 + (seed * 3) % 12, 2, 3);
      ctx.fillRect(startX + ((seed + 2) % bars) * spacing - 1, py + 20 + (seed * 5) % 8, 1, 4);
 
      break;
    }

    case T.BRICK:
      // Dungeon brick — tijolo alternado com rejunte
      ctx.fillStyle = PALETTE.brick;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PALETTE.brickMortar;
      // horizontal mortar lines
      ctx.fillRect(px, py + 10, TILE, 2);
      ctx.fillRect(px, py + 22, TILE, 2);
      // vertical mortar — offset alternado por fila
      const brickOffEven = (Math.floor((py + 0)  / TILE) % 2 === 0);
      const offA = brickOffEven ? 0 : 16;
      ctx.fillRect(px + offA,      py,      2, 10);
      ctx.fillRect(px + offA + 16, py,      2, 10);
      ctx.fillRect(px + offA - 16 + 32, py, 2, 10); // wrap right side
      const offB = brickOffEven ? 16 : 0;
      ctx.fillRect(px + offB,      py + 12, 2, 10);
      ctx.fillRect(px + offB + 16, py + 12, 2, 10);
      ctx.fillRect(px + offB + 32, py + 12, 2, 10);
      ctx.fillRect(px + offA,      py + 24, 2, 8);
      ctx.fillRect(px + offA + 16, py + 24, 2, 8);
      // edge highlight top-left
      ctx.fillStyle = PALETTE.brickEdge;
      ctx.fillRect(px, py, TILE, 1);
      ctx.fillRect(px, py, 1, TILE);
      break;

    case T.GRASS:
      // Terra com topo gramado
      ctx.fillStyle = PALETTE.dirt;
      ctx.fillRect(px, py, TILE, TILE);
      // dirt texture dots
      ctx.fillStyle = PALETTE.dirtEdge;
      ctx.fillRect(px + 6,  py + 10, 3, 2);
      ctx.fillRect(px + 18, py + 18, 2, 3);
      ctx.fillRect(px + 10, py + 24, 4, 2);
      ctx.fillRect(px + 24, py + 8,  2, 2);
      // grass top layer
      ctx.fillStyle = PALETTE.grass;
      ctx.fillRect(px, py, TILE, 7);
      // grass highlight strands
      ctx.fillStyle = PALETTE.grassHighlight;
      for (let gi = 0; gi < 8; gi++) {
        const gx = px + gi * 4 + 1;
        ctx.fillRect(gx, py,     1, 3);
        ctx.fillRect(gx + 2, py, 1, 5);
      }
      // under-grass shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px, py + 7, TILE, 3);
      break;

    case T.DIRT:
      // Solo / terra pura
      ctx.fillStyle = PALETTE.dirt;
      ctx.fillRect(px, py, TILE, TILE);
      // subtle edge
      ctx.fillStyle = PALETTE.dirtEdge;
      ctx.fillRect(px, py, TILE, 2);
      ctx.fillRect(px, py, 2, TILE);
      // pebble details
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(px + 5,  py + 5,  4, 3);
      ctx.fillRect(px + 20, py + 14, 3, 4);
      ctx.fillRect(px + 10, py + 22, 5, 3);
      ctx.fillRect(px + 25, py + 6,  3, 3);
      break;

    case T.DARK:
      // Pedra sombria com veios roxos
      ctx.fillStyle = PALETTE.dark;
      ctx.fillRect(px, py, TILE, TILE);
      // vein lines — diagonais e curvas
      ctx.strokeStyle = PALETTE.darkVein;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 4,  py + 2);
      ctx.lineTo(px + 14, py + 18);
      ctx.lineTo(px + 8,  py + 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + 20, py + 0);
      ctx.lineTo(px + 28, py + 12);
      ctx.lineTo(px + 18, py + 28);
      ctx.stroke();
      // subtle glow points
      ctx.fillStyle = PALETTE.darkShine;
      ctx.fillRect(px + 12, py + 10, 2, 2);
      ctx.fillRect(px + 24, py + 20, 2, 2);
      // faint purple edge
      ctx.fillStyle = 'rgba(80,0,100,0.4)';
      ctx.fillRect(px, py, TILE, 1);
      ctx.fillRect(px, py, 1, TILE);
      break;

    case T.CRUMBLE: {
      // Tile que desaparece ao pisar — pedra cristalina azul-acinzentada
      const _ck = `${_currentMapId}:${Math.round((px + _camX) / TILE)}:${Math.round((py + _camY) / TILE)}`;
      const _cs = crumbleStates[_ck] || { phase: 'idle', timer: 0 };
      const _phase = _cs.phase;
 
      if (_phase === 'gone') break; // não desenha nada quando sumido
 
      // Fator de progresso da animação (0=completo, 1=quase caindo)
      const _prog  = _phase === 'shaking'   ? 1 - (_cs.timer / CRUMBLE_SHAKE_T)  : 0;
      const _rprog = _phase === 'respawning' ? 1 - (_cs.timer / CRUMBLE_RESP_T)  : 0;
 
      // Tremor horizontal quando shaking
      const _shk = _phase === 'shaking'
        ? Math.sin(_drawTime * 55) * _prog * 2.5
        : 0;
 
      // Opacidade do respawn
      const _alpha = _phase === 'respawning' ? _rprog : 1.0;
 
      ctx.save();
      ctx.globalAlpha = _alpha;
      ctx.translate(_shk, 0);
 
      // Fundo
      ctx.fillStyle = _phase === 'shaking'
        ? `rgb(${Math.floor(38 + _prog * 30)}, ${Math.floor(53 - _prog * 20)}, ${Math.floor(69 - _prog * 30)})`
        : PALETTE.crumbleFull;
      ctx.fillRect(px, py, TILE, TILE);
 
      // Padrão cristalino — linhas diagonais internas
      ctx.strokeStyle = PALETTE.crumbleCrack;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px + 8,  py);     ctx.lineTo(px,      py + 8);  ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + 24, py);     ctx.lineTo(px,      py + 24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + TILE, py + 8); ctx.lineTo(px + 8, py + TILE); ctx.stroke();
 
      // Borda superior brilhante
      ctx.fillStyle = PALETTE.crumbleEdge;
      ctx.fillRect(px, py, TILE, 2);
      ctx.fillRect(px, py, 2, TILE);
 
      // Reflexo de cristal no canto superior esquerdo
      ctx.fillStyle = PALETTE.crumbleShine;
      ctx.fillRect(px + 3, py + 3, 6, 1);
      ctx.fillRect(px + 3, py + 3, 1, 5);
 
      // Rachaduras progressivas conforme _prog avança
      ctx.strokeStyle = PALETTE.crumbleEdge;
      ctx.lineWidth = 1;
      if (_prog > 0.2) {
        ctx.beginPath(); ctx.moveTo(px + 16, py + 4);  ctx.lineTo(px + 10, py + 16); ctx.stroke();
      }
      if (_prog > 0.45) {
        ctx.beginPath(); ctx.moveTo(px + 20, py + 8);  ctx.lineTo(px + 28, py + 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 6,  py + 14); ctx.lineTo(px + 14, py + 28); ctx.stroke();
      }
      if (_prog > 0.7) {
        ctx.beginPath(); ctx.moveTo(px + 12, py + 2);  ctx.lineTo(px + 4,  py + 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 24, py + 10); ctx.lineTo(px + 18, py + 30); ctx.stroke();
        // Escurece bastante antes de cair
        ctx.fillStyle = `rgba(0,0,0,${_prog * 0.5})`;
        ctx.fillRect(px, py, TILE, TILE);
      }
 
      // Shimmer do respawn — anel de brilho se expandindo
      if (_phase === 'respawning' && _rprog > 0.4) {
        const _sr = (_rprog - 0.4) / 0.6;
        ctx.strokeStyle = `rgba(106, 176, 208, ${(1 - _sr) * 0.8})`;
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.rect(px + (1 - _sr) * TILE * 0.5, py + (1 - _sr) * TILE * 0.5,
                 TILE * _sr, TILE * _sr);
        ctx.stroke();
      }
 
      ctx.restore();
      break;
    }

    case T.MOSAIC: {
      // ── Mosaico dark — peças irregulares em tons de roxo profundo ─────────
      // Fundo (rejunte escuro)
      ctx.fillStyle = PALETTE.mosaicGrout;
      ctx.fillRect(px, py, TILE, TILE);

      // Grade de teselas (peças do mosaico) — 5×5 células com tamanho variável
      // por posição de tile para parecer orgânico mas ser estável (sem random())
      const CELL = 6.48; // tamanho base de cada célula em px
      const GAP  = 1; // espessura do rejunte

      // Paleta cíclica de 5 tons dark-purple para as peças
      const mColors = [
        PALETTE.mosaicA, // roxo muito escuro
        PALETTE.mosaicB, // quase preto com tinte
        PALETTE.mosaicC, // roxo médio-escuro
        PALETTE.mosaicD, // roxo profundo
        '#180028',       // mais escuro ainda
      ];

      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          // Hash estável por posição global (sem Math.random)
          const hash = ((px + col * CELL) * 13 + (py + row * CELL) * 7) & 0xff;

          // Deslocamento leve da peça para parecer quebrado/irregular
          const offX = (hash & 3) - 1;        // -1, 0, 1, 2
          const offY = ((hash >> 2) & 3) - 1;
          // Tamanho levemente variável (4–6px)
          const sz   = CELL - GAP - (hash & 1);

          const tx2 = px + col * CELL + offX;
          const ty2 = py + row * CELL + offY;

          // Escolhe cor com base no hash
          const colorIdx = hash % mColors.length;
          ctx.fillStyle = mColors[colorIdx];
          ctx.fillRect(tx2, ty2, sz, sz);

          // Highlight no canto superior-esquerdo de algumas peças — imita vitral
          if ((hash & 0x18) === 0x08) { // ~25% das peças
            ctx.fillStyle = 'rgba(170, 0, 255, 0.18)';
            ctx.fillRect(tx2, ty2, sz, 1);
            ctx.fillRect(tx2, ty2, 1, sz);
          }

          // Peça de "destaque" — uma em ~16 com brilho roxo mais intenso
          if ((hash & 0x0f) === 0x05) {
            ctx.fillStyle = 'rgba(120, 0, 200, 0.45)';
            ctx.fillRect(tx2 + 1, ty2 + 1, sz - 2, sz - 2);
          }
        }
      }

      // ── Veios de rejunte perpendiculares visíveis por cima ────────────────
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(px + i * CELL, py);
        ctx.lineTo(px + i * CELL, py + TILE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px,       py + i * CELL);
        ctx.lineTo(px + TILE, py + i * CELL);
        ctx.stroke();
      }

      // ── Borda externa — frame de pedra escura ─────────────────────────────
      ctx.fillStyle = 'rgba(80, 0, 120, 0.30)';
      ctx.fillRect(px, py, TILE, 1);       // topo
      ctx.fillRect(px, py, 1, TILE);       // esquerda
      ctx.fillStyle = 'rgba(0, 0, 0, 0.50)';
      ctx.fillRect(px, py + TILE - 1, TILE, 1); // base
      ctx.fillRect(px + TILE - 1, py, 1, TILE); // direita

      // ── Padrão central — losango em roxo fundo (símbolo ritual) ──────────
      const cx3 = px + TILE / 2;
      const cy3 = py + TILE / 2;
      const r3  = 7;
      ctx.strokeStyle = 'rgba(100, 0, 180, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx3,      cy3 - r3); // topo
      ctx.lineTo(cx3 + r3, cy3);      // direita
      ctx.lineTo(cx3,      cy3 + r3); // base
      ctx.lineTo(cx3 - r3, cy3);      // esquerda
      ctx.closePath();
      ctx.stroke();

      // Ponto central brilhante
      ctx.fillStyle = 'rgba(150, 0, 220, 0.60)';
      ctx.beginPath();
      ctx.arc(cx3, cy3, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      break;
    }

    case T.DEAD_GRASS: {
      // ── Grama morta / queimada sobre terra escura ─────────────────────────
      // Solo: terra escura compactada, igual ao DIRT mas mais fria e seca
      ctx.fillStyle = PALETTE.deadGrassDirt;
      ctx.fillRect(px, py, TILE, TILE);

      // Textura de terra — pedrinhas e torrões escuros
      ctx.fillStyle = PALETTE.deadGrassDark;
      ctx.fillRect(px + 4,  py + 10, 4, 2);
      ctx.fillRect(px + 16, py + 16, 3, 3);
      ctx.fillRect(px + 9,  py + 22, 5, 2);
      ctx.fillRect(px + 23, py + 12, 2, 2);
      ctx.fillRect(px + 2,  py + 24, 3, 2);
      ctx.fillRect(px + 20, py + 20, 4, 2);
      // Pontos de tom ligeiramente mais claro — variação de solo
      ctx.fillStyle = PALETTE.deadGrassDirtHi;
      ctx.fillRect(px + 11, py + 14, 2, 2);
      ctx.fillRect(px + 25, py + 8,  2, 1);
      ctx.fillRect(px + 6,  py + 19, 2, 2);

      // ── Sombra sob os caules — escurece o topo do solo ────────────────────
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(px, py + 7, TILE, 5);

      // ── Faixa de base dos caules — crosta queimada ────────────────────────
      ctx.fillStyle = PALETTE.deadCharA;
      ctx.fillRect(px, py + 4, TILE, 5);
      // Manchas de carvão irregulares
      ctx.fillStyle = PALETTE.deadCharB;
      ctx.fillRect(px + 3,  py + 4, 5, 2);
      ctx.fillRect(px + 14, py + 5, 4, 3);
      ctx.fillRect(px + 22, py + 4, 4, 2);
      ctx.fillRect(px + 8,  py + 6, 3, 2);

      // ── Caules mortos — posições pseudo-aleatórias estáveis por tile ──────
      // Cada caule: cor, posição X, altura, curvatura, se tem cinza no topo
      const seed = (px * 7 + py * 13) & 0xff;
      const stalks = [
        // [xOffset, height, lean, colorKey, ashTip]
        [1,                    9 + (seed & 3),       -1, 'B', false],
        [3 + ((seed >> 1)&3),  7 + ((seed>>2)&3),     0, 'A', true ],
        [6 + ((seed >> 3)&2),  10+ ((seed>>1)&2),     1, 'C', false],
        [9,                    8 + ((seed>>4)&3),     -1, 'A', true ],
        [12+ ((seed>>2)&3),    9 + (seed & 2),        0, 'B', false],
        [13+ ((seed>>2)&3),    9 + (seed & 2),        0, 'B', true],
        [15+ ((seed>>1)&2),    7 + ((seed>>3)&3),     1, 'C', true ],
        [18,                   10+ ((seed>>2)&2),     -1, 'A', false],
        [20+ ((seed>>4)&3),    8 + ((seed>>1)&3),     0, 'B', true ],
        [23+ ((seed>>3)&2),    9 + ((seed>>2)&2),     1, 'C', false],
        [26+ (seed&2),         7 + ((seed>>4)&3),    -1, 'A', true ],
        [28+ (seed&2),         7 + ((seed>>4)&3),    -1, 'A', true ],
        [30+ ((seed>>4)&3),    8 + ((seed>>1)&3),     0, 'B', true ],
      ];

      const stalkColors = {
        A: PALETTE.deadStalkA,
        B: PALETTE.deadStalkB,
        C: PALETTE.deadStalkC,
      };

      for (const [xOff, h, lean, colorKey, hasAsh] of stalks) {
        const sx = px + xOff;
        if (sx < px || sx >= px + TILE) continue; // fora do tile

        // Base do caule — mais escura, queimada
        ctx.fillStyle = PALETTE.deadCharA;
        ctx.fillRect(sx, py + 5, 1, 3);

        // Corpo do caule
        ctx.fillStyle = stalkColors[colorKey];
        // Caule levemente inclinado (lean: -1 esq, 0 reto, 1 dir)
        for (let seg = 0; seg < h; seg++) {
          const segX = sx + (lean !== 0 && seg > h * 0.4 ? lean : 0);
          if (segX >= px && segX < px + TILE) {
            ctx.fillRect(segX, py + 4 - seg, 1, 1);
          }
        }

        // Ponta do caule — queimada ou com toco seco
        if (hasAsh) {
          // Toco com cinza — caule que se partiu e tem cinza no topo
          ctx.fillStyle = PALETTE.deadAshA;
          const tipX = sx + (lean !== 0 && h > 4 ? lean : 0);
          if (tipX >= px && tipX < px + TILE) {
            ctx.fillRect(tipX - 1, py + 4 - h, 3, 1);
          }
        } else {
          // Ponta apenas mais escura e seca
          ctx.fillStyle = PALETTE.deadStalkTip;
          const tipX = sx + (lean !== 0 ? lean : 0);
          if (tipX >= px && tipX < px + TILE) {
            ctx.fillRect(tipX, py + 4 - h, 1, 1);
          }
        }

        // Folha lateral morta — pequeno traço diagonal em ~metade dos caules
        if ((seed ^ xOff) & 1) {
          ctx.fillStyle = stalkColors[colorKey];
          const leafDir = lean >= 0 ? 1 : -1;
          const leafY   = py + 4 - Math.floor(h * 0.55);
          const leafX   = sx + leafDir;
          if (leafX >= px && leafX < px + TILE) {
            ctx.fillRect(leafX, leafY,     1, 1);
            ctx.fillRect(leafX + leafDir, leafY + 1, 1, 1);
          }
        }
      }

      // ── Partículas de cinza — pontilhado de cinza sobre o solo ────────────
      ctx.fillStyle = PALETTE.deadAshA;
      ctx.fillRect(px + 5,  py + 7, 1, 1);
      ctx.fillRect(px + 13, py + 8, 1, 1);
      ctx.fillRect(px + 21, py + 7, 1, 1);
      ctx.fillRect(px + 28, py + 9, 1, 1);
      ctx.fillStyle = PALETTE.deadAshB;
      ctx.fillRect(px + 9,  py + 9, 1, 1);
      ctx.fillRect(px + 18, py + 8, 1, 1);
      ctx.fillRect(px + 25, py + 7, 1, 1);

      // ── Borda superior — carvão escuro (topo do tile, nivel do chão) ──────
      ctx.fillStyle = PALETTE.deadCharA;
      ctx.fillRect(px, py, TILE, 1);

      break;
    }

    case T.OBSIDIAN: {
      // ── Obsidiana — vidro vulcânico negro com reflexos vítreos frios ──────
      // A obsidiana é formada por lava resfriada rapidamente: superfície
      // lisa e brilhante, quase um espelho escuro com reflexos azul/roxo frios.

      // ── 1. Corpo base — negro profundo ────────────────────────────────────
      ctx.fillStyle = PALETTE.obsidianBase;
      ctx.fillRect(px, py, TILE, TILE);

      // ── 2. Variação interna de profundidade (camadas de resfriamento) ─────
      // Hash estável por posição para variar levemente cada bloco
      const ohash = ((px * 17 + py * 31) & 0xff);

      // Plano interno levemente mais claro — simula espessura do vidro
      ctx.fillStyle = PALETTE.obsidianGlass;
      ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);

      // Núcleo ainda mais escuro — profundidade
      ctx.fillStyle = PALETTE.obsidianDeep;
      ctx.fillRect(px + 5, py + 5, TILE - 10, TILE - 10);

      // ── 3. Veios de fratura natural ───────────────────────────────────────
      // Obsidiana tem fraturas concoidais — curvas suaves, não retas
      ctx.strokeStyle = PALETTE.obsidianVein;
      ctx.lineWidth = 1;

      // Fratura principal — diagonal suave variando por bloco
      const fDir = (ohash & 1); // 0 = diagonal ↘, 1 = diagonal ↗
      ctx.beginPath();
      if (fDir === 0) {
        ctx.moveTo(px + 3 + (ohash & 3),        py + 2);
        ctx.quadraticCurveTo(
          px + TILE / 2 + ((ohash >> 2) & 5) - 2,
          py + TILE / 2,
          px + TILE - 4 - (ohash & 3),            py + TILE - 3
        );
      } else {
        ctx.moveTo(px + TILE - 4 - (ohash & 3),  py + 2);
        ctx.quadraticCurveTo(
          px + TILE / 2 - ((ohash >> 2) & 5) + 2,
          py + TILE / 2,
          px + 3 + (ohash & 3),                   py + TILE - 3
        );
      }
      ctx.stroke();

      // Fratura secundária menor — quase horizontal ou vertical
      ctx.strokeStyle = 'rgba(8,6,16,0.9)';
      ctx.lineWidth = 0.5;
      if ((ohash & 0x18) === 0x08) {
        // pequena fratura extra (~25% dos blocos)
        ctx.beginPath();
        ctx.moveTo(px + 6,       py + 10 + (ohash & 7));
        ctx.lineTo(px + 18,      py + 8  + ((ohash >> 3) & 7));
        ctx.stroke();
      }

      // ── 4. Reflexo vítreo principal — lâmina de luz fria ─────────────────
      // É o elemento mais característico da obsidiana: um reflexo nítido
      // que atravessa o bloco diagonalmente, como num espelho escuro.

      // Faixa de brilho larga — difusa
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();

      // Reflexo principal — faixa diagonal do canto sup-esq ao centro
      ctx.fillStyle = 'rgba(60, 55, 110, 0.18)';
      ctx.beginPath();
      ctx.moveTo(px,           py);
      ctx.lineTo(px + 14,      py);
      ctx.lineTo(px,           py + 14);
      ctx.closePath();
      ctx.fill();

      // Segundo reflexo — mais estreito, mais brilhante, levemente deslocado
      ctx.fillStyle = 'rgba(80, 70, 150, 0.22)';
      ctx.beginPath();
      ctx.moveTo(px + 2,       py);
      ctx.lineTo(px + 9,       py);
      ctx.lineTo(px,           py + 9);
      ctx.lineTo(px,           py + 2);
      ctx.closePath();
      ctx.fill();

      // Linha de reflexo nítida — 1px, alta opacidade, coração do brilho
      ctx.strokeStyle = 'rgba(100, 90, 180, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 1, py + 1);
      ctx.lineTo(px + 10, py + 1);
      ctx.moveTo(px + 1, py + 1);
      ctx.lineTo(px + 1, py + 10);
      ctx.stroke();

      // ── 5. Micro-reflexo secundário — canto oposto (reflexo de ambiente) ──
      // Blocos de obsidiana real mostram reflexos duplos
      ctx.fillStyle = 'rgba(40, 30, 80, 0.12)';
      ctx.beginPath();
      ctx.moveTo(px + TILE,     py + TILE);
      ctx.lineTo(px + TILE - 8, py + TILE);
      ctx.lineTo(px + TILE,     py + TILE - 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // ── 6. Borda: aresta de corte vítrea ─────────────────────────────────
      // Topo e esquerda: aresta brilhante fria (luz rasante)
      ctx.fillStyle = PALETTE.obsidianHiCold;
      ctx.fillRect(px,     py,     TILE, 1); // topo
      ctx.fillRect(px,     py,     1, TILE); // esquerda
      // Sub-pixel ainda mais brilhante nos primeiros 8px do topo
      ctx.fillStyle = 'rgba(70, 65, 130, 0.70)';
      ctx.fillRect(px,     py,     8,    1);
      ctx.fillRect(px,     py,     1,    8);

      // Base e direita: sombra densa (face voltada para baixo/sombra)
      ctx.fillStyle = 'rgba(0,0,0,0.80)';
      ctx.fillRect(px,           py + TILE - 1, TILE, 1);
      ctx.fillRect(px + TILE - 1, py,           1, TILE);

      // Borda média (2px interna) — reforça a sensação de espessura do vidro
      ctx.fillStyle = PALETTE.obsidianEdge;
      ctx.fillRect(px + 1,       py + 1,        TILE - 2, 1);
      ctx.fillRect(px + 1,       py + 1,        1, TILE - 2);

      break;
    }

    case T.AZULEJO: {
      // ── Azulejo dark — padrão português em azul noturno com dourado envelhecido
      // Cada tile contém um padrão de 4 sub-azulejos (2×2), com motivo geométrico
      // contínuo calculado em coordenadas globais.

      const S = TILE / 2; // tamanho de cada sub-azulejo = 16px

      // Fundo geral — cor do rejunte escuro
      ctx.fillStyle = PALETTE.azulejoBg;
      ctx.fillRect(px, py, TILE, TILE);

      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, TILE, TILE);
      ctx.clip();

      // Desenha os 4 sub-azulejos (2 colunas × 2 linhas)
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          const ax = px + col * S;
          const ay = py + row * S;
          const cx4 = ax + S / 2;
          const cy4 = ay + S / 2;

          // ── Face do azulejo ─────────────────────────────────────────────
          // Gradiente simulado com retângulos (performático, sem gradiente API)
          ctx.fillStyle = PALETTE.azulejoBase;
          ctx.fillRect(ax + 1, ay + 1, S - 2, S - 2);

          // Variação de tonalidade por posição — alguns levemente mais claros
          const tileHash = ((ax * 5 + ay * 11) & 0xf);
          if (tileHash < 5) {
            ctx.fillStyle = 'rgba(18, 40, 75, 0.45)';
            ctx.fillRect(ax + 1, ay + 1, S - 2, S - 2);
          }

          // ── Motivo geométrico: estrela de 4 pontas / padrão cruzado ─────
          // Base do motivo — losango central
          ctx.fillStyle = PALETTE.azulejoLine;
          ctx.beginPath();
          ctx.moveTo(cx4,          ay + 3);   // topo
          ctx.lineTo(ax + S - 3,   cy4);      // direita
          ctx.lineTo(cx4,          ay + S - 3); // base
          ctx.lineTo(ax + 3,       cy4);      // esquerda
          ctx.closePath();
          ctx.fill();

          // Interior do losango — mais claro
          ctx.fillStyle = PALETTE.azulejoHi;
          ctx.beginPath();
          ctx.moveTo(cx4,          ay + 5);
          ctx.lineTo(ax + S - 5,   cy4);
          ctx.lineTo(cx4,          ay + S - 5);
          ctx.lineTo(ax + 5,       cy4);
          ctx.closePath();
          ctx.fill();

          // Centro do losango — ponto escuro
          ctx.fillStyle = PALETTE.azulejoDim;
          ctx.fillRect(cx4 - 1, cy4 - 1, 3, 3);

          // ── Quadrados nos 4 cantos do sub-azulejo ──────────────────────
          // (parte do padrão contínuo — os quadrados dos 4 tiles se juntam)
          const cornerSize = 3;
          const corners = [
            [ax + 1,       ay + 1      ],
            [ax + S - 1 - cornerSize, ay + 1      ],
            [ax + 1,       ay + S - 1 - cornerSize],
            [ax + S - 1 - cornerSize, ay + S - 1 - cornerSize],
          ];
          ctx.fillStyle = PALETTE.azulejoGold;
          for (const [cx5, cy5] of corners) {
            ctx.fillRect(cx5, cy5, cornerSize, cornerSize);
            // Ponto de brilho dourado envelhecido
            ctx.fillStyle = PALETTE.azulejoGoldHi;
            ctx.fillRect(cx5, cy5, 1, 1);
            ctx.fillStyle = PALETTE.azulejoGold;
          }

          // ── Borda interna do sub-azulejo (rejunte) ─────────────────────
          ctx.fillStyle = PALETTE.azulejoBg;
          ctx.fillRect(ax,         ay,         S, 1);   // topo
          ctx.fillRect(ax,         ay,         1, S);   // esquerda
          ctx.fillRect(ax,         ay + S - 1, S, 1);   // base
          ctx.fillRect(ax + S - 1, ay,         1, S);   // direita

          // ── Highlight: canto superior-esquerdo de cada sub-azulejo ─────
          ctx.fillStyle = 'rgba(40, 80, 140, 0.35)';
          ctx.fillRect(ax + 1, ay + 1, S - 2, 1);
          ctx.fillRect(ax + 1, ay + 1, 1, S - 2);

          // ── Sombra: canto inferior-direito ─────────────────────────────
          ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
          ctx.fillRect(ax + 1, ay + S - 2, S - 2, 1);
          ctx.fillRect(ax + S - 2, ay + 1, 1, S - 2);
        }
      }

      // ── Rejunte central (cruz que divide os 4 sub-azulejos) ──────────────
      ctx.fillStyle = PALETTE.azulejoBg;
      ctx.fillRect(px + S - 1, py,     2, TILE); // vertical
      ctx.fillRect(px,     py + S - 1, TILE, 2); // horizontal

      // ── Borda externa do tile inteiro ─────────────────────────────────────
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(px,           py + TILE - 1, TILE, 1); // base
      ctx.fillRect(px + TILE - 1, py,           1, TILE); // direita
      ctx.fillStyle = 'rgba(30, 60, 110, 0.30)';
      ctx.fillRect(px, py, TILE, 1); // topo
      ctx.fillRect(px, py, 1, TILE); // esquerda

      ctx.restore();
      break;
    }

    case T.BREAK: {
      const btx = Math.round((px + (typeof _camX !== 'undefined' ? _camX : 0)) / TILE);
      const bty = Math.round((py + (typeof _camY !== 'undefined' ? _camY : 0)) / TILE);
      const bhp = getBreakHp(_currentMapId, btx, bty);

      // fundo — terra
      ctx.fillStyle = PALETTE.dirt;
      ctx.fillRect(px, py, TILE, TILE);

      // pedrinhas base do dirt
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(px + 5,  py + 5,  4, 3);
      ctx.fillRect(px + 20, py + 14, 3, 4);
      ctx.fillRect(px + 10, py + 22, 5, 3);
      ctx.fillRect(px + 25, py + 6,  3, 3);

      // rachaduras — tom escuro de terra
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px + 16, py + 4);  ctx.lineTo(px + 10, py + 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + 20, py + 8);  ctx.lineTo(px + 28, py + 24); ctx.stroke();

      if (bhp <= 2) {
        ctx.beginPath(); ctx.moveTo(px + 6,  py + 12); ctx.lineTo(px + 16, py + 26); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 22, py + 2);  ctx.lineTo(px + 14, py + 14); ctx.stroke();
      }

      if (bhp <= 1) {
        // quase destruído — escurece com tom de terra úmida
        ctx.fillStyle = 'rgba(20,10,0,0.45)';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.beginPath(); ctx.moveTo(px + 2,  py + 20); ctx.lineTo(px + 14, py + 6);  ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 26, py + 4);  ctx.lineTo(px + 18, py + 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + 8,  py + 28); ctx.lineTo(px + 24, py + 16); ctx.stroke();
      }

      break;
    }
  }
}

const DYNAMIC_TILES = new Set([
  T.BREAK, T.CRUMBLE, T.CRATE,
  T.DOOR_R, T.DOOR_L, T.DOOR_U, T.DOOR_D,
  T.PLAT, T.IRON_GATE
]);

const _tileCache = {}; // key: tile type → HTMLCanvasElement

function _bakeStaticTile(t) {
  const off  = document.createElement('canvas');
  off.width  = TILE;
  off.height = TILE;
  const octx = off.getContext('2d');

  // Redireciona ctx para o offscreen temporariamente
  const realCtx = ctx;
  // eslint-disable-next-line no-global-assign
  ctx = octx;
  _camX = 0; _camY = 0; _currentMapId = 0;
  drawTile(t, 0, 0);
  // eslint-disable-next-line no-global-assign
  ctx = realCtx;

  return off;
}

function getTileCached(t) {
  if (!_tileCache[t]) {
    _tileCache[t] = _bakeStaticTile(t);
  }
  return _tileCache[t];
}

// Invalida o cache de um tile (chamar quando o estado muda, ex: BREAK danificado)
function invalidateTileCache(t) {
  delete _tileCache[t];
}

function drawMap(map, cam) {
  const x0 = Math.max(0, Math.floor(cam.x / TILE));
  const x1 = Math.min(map.cols - 1, Math.floor((cam.x + W) / TILE) + 1);
  const y0 = Math.max(0, Math.floor(cam.y / TILE));
  const y1 = Math.min(map.rows - 1, Math.floor((cam.y + H) / TILE) + 1);

  // Expõe coordenadas de câmera para tiles dinâmicos que precisam de lookup
  _camX = cam.x; _camY = cam.y;
  _currentMapId = currentMapId;

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t  = getTile(map, tx, ty);
      if (t === T.AIR) continue;

      const sx = tx * TILE - cam.x;
      const sy = ty * TILE - cam.y;

      if (DYNAMIC_TILES.has(t)) {
        // Tile dinâmico — renderiza normalmente (precisa de estado por frame)
        drawTile(t, sx, sy);
      } else {
        // Tile estático — usa imagem cacheada (drawImage é muito mais rápido)
        ctx.drawImage(getTileCached(t), sx, sy);
      }
    }
  }
}

// ─── DRAW PLAYER ───────────────────────────────────────────────────────────
function drawPlayer(player, cam, time) {
  if (player.invincible > 0 && Math.floor(time * 10) % 2 === 0) return;
 
  const px = player.x - cam.x;
  const py = player.y - cam.y;
  const w  = player.w;
  const h  = player.h;
 
  ctx.save();
  ctx.translate(px + w / 2, py + h / 2);
  ctx.scale(player.dir, 1);
 
  const attacking = player.attackTimer > player.attackCooldown * 0.5;
 
  // ── Robe / corpo (trapézio largo embaixo) ──────────────────────────────
  ctx.shadowBlur  = 10;
  ctx.shadowColor = '#8800ff';
  ctx.fillStyle   = '#1a0a2e';
  ctx.beginPath();
  ctx.moveTo(-w / 2 - 2, h / 2);
  ctx.lineTo( w / 2 + 2, h / 2);
  ctx.lineTo( w / 2 - 2, -h / 2 + 10);
  ctx.lineTo(-w / 2 + 2, -h / 2 + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a1a6e';
  ctx.lineWidth   = 1;
  ctx.stroke();
 
  // ── Cabeça ─────────────────────────────────────────────────────────────
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = '#2a1a1a';
  ctx.fillRect(-5, -h / 2 + 1, 10, 9);
 
  // ── Chapéu — aba + cone ────────────────────────────────────────────────
  ctx.shadowColor = '#8800ff';
  ctx.shadowBlur  = 6;
  ctx.fillStyle   = '#0d0020';
  // cone — mais alto, ligeiramente curvado no topo
  ctx.beginPath();
  ctx.moveTo(-7, -h / 2 + 4);
  ctx.lineTo( 7, -h / 2 + 4);
  ctx.quadraticCurveTo( 6, -h / 2 + 2,  2, -h / 2 - 8); // era -4 e -16
  ctx.quadraticCurveTo( 0, -h / 2 - 11, -2, -h / 2 - 8); // era -20 e -16
  ctx.quadraticCurveTo(-6, -h / 2 + 2, -7, -h / 2 + 4);  // era -4
  ctx.closePath();
  ctx.fill();
  // aba — larga e levemente curvada para baixo nas pontas
  ctx.beginPath();
  ctx.moveTo(-11, -h / 2 + 3);
  ctx.lineTo(6, -h / 2 + 5);
  ctx.lineTo(11, -h / 2 + 2);
  ctx.lineTo(-11, -h / 2 + 2);
  ctx.closePath();
  ctx.fill();
 
  // ── Olhos brilhantes ───────────────────────────────────────────────────
  ctx.fillStyle   = '#cc44ff';
  ctx.shadowColor = '#cc44ff';
  ctx.shadowBlur  = 8;
  ctx.fillRect(1, -h / 2 + 4, 3, 2);
  ctx.fillStyle   = '#ff88ff';
  ctx.shadowBlur  = 0;
  ctx.fillRect(2, -h / 2 + 4, 1, 1);            // reflexo
 
  // ── Cajado ─────────────────────────────────────────────────────────────
  ctx.shadowColor = '#8844ff';
  ctx.shadowBlur  = attacking ? 14 : 4;
  ctx.strokeStyle = '#5a3a8a';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(-w / 2 - 1, h / 2);
  ctx.lineTo(-w / 2 + 1, -h / 2 + 3);
  ctx.stroke();
  // orbe do cajado — pulsa suavemente
  const orbGlow  = 0.7 + 0.3 * Math.sin(time * 4);
  ctx.fillStyle  = attacking ? '#ff88ff' : `rgba(180,100,255,${orbGlow})`;
  ctx.shadowColor = '#cc44ff';
  ctx.shadowBlur  = attacking ? 18 : 8;
  ctx.beginPath();
  ctx.arc(-w / 2 + 1, -h / 2 + 1, attacking ? 4 : 2.5, 0, Math.PI * 2);
  ctx.fill();
 
  // ── Projétil mágico ao atacar ──────────────────────────────────────────
  if (attacking) {
    ctx.fillStyle = '#aaa';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.fillRect(w / 2, -h / 4, 22, 3);
    ctx.fillStyle = '#6a3a1a';
    ctx.fillRect(w / 2 - 2, -h / 4 - 3, 5, 9);
  }
 
  ctx.shadowBlur = 0;
  ctx.restore();

  // ── Escudo mágico (desenhado fora do ctx com scale) ──────────────────────
  if (player.shieldActive || player.shieldCooldown > 0) {
    const scx = player.x + player.w / 2 - cam.x;
    const scy = player.y + player.h / 2 - cam.y;
 
    if (player.shieldActive) {
      const pulse   = 0.7 + 0.3 * Math.sin(player.shieldPulse * 5);
      const shieldR = 20 + Math.sin(player.shieldPulse * 4) * 2;
 
      ctx.save();
      ctx.translate(scx, scy);
 
      // Anel externo pulsante
      ctx.strokeStyle = `rgba(0, 200, 255, ${(0.5 + 0.3 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 2.5;
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur  = 16;
      ctx.beginPath();
      ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
      ctx.stroke();
 
      // 6 nós girando
      ctx.save();
      ctx.rotate(player.shieldPulse * 1.8);
      for (let i = 0; i < 6; i++) {
        const a  = (i / 6) * Math.PI * 2;
        const nx = Math.cos(a) * shieldR;
        const ny = Math.sin(a) * shieldR;
        ctx.fillStyle   = `rgba(0, 230, 255, ${(0.6 + 0.4 * pulse).toFixed(2)})`;
        ctx.shadowColor = '#00eeff';
        ctx.shadowBlur  = 10;
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
 
      // Segmentos de vida do escudo
      for (let i = 0; i < SHIELD_MAX_HP; i++) {
        const a  = ((i / SHIELD_MAX_HP) - 0.5) * Math.PI * 0.8;
        const r1 = shieldR + 5;
        const r2 = shieldR + 9;
        ctx.strokeStyle = i < player.shieldHp ? 'rgba(0,255,220,0.9)' : 'rgba(0,80,100,0.4)';
        ctx.lineWidth   = 3;
        ctx.shadowBlur  = i < player.shieldHp ? 8 : 0;
        ctx.shadowColor = '#00ffcc';
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
      }

      ctx.restore();
 
    } else {
      // Cooldown — arcos fragmentados indicando recarga
      const frac = player.shieldCooldown / SHIELD_COOLDOWN;
      ctx.save();
      ctx.translate(scx, scy);
      ctx.rotate(player.shieldPulse * 0.5);
      for (let i = 0; i < 6; i++) {
        const startA = (i / 6) * Math.PI * 2;
        const arc    = (Math.PI * 2 / 6) * frac * 0.55;
        ctx.strokeStyle = `rgba(0, 100, 140, ${(0.25 + frac * 0.3).toFixed(2)})`;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 0;
        ctx.beginPath();
        ctx.arc(0, 0, 20, startA, startA + arc);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

// ─── DRAW ENEMY ────────────────────────────────────────────────────────────
function drawEnemy(e, cam, time) {
  if (e.dead) return;
  const px = e.x - cam.x;
  const py = e.y - cam.y;

  // Culling de visibilidade — não desenha inimigos fora da tela
  if (px + e.w < -16 || px > W + 16 || py + e.h < -16 || py > H + 16) return;

  ctx.save();
  if (e.hitFlash > 0) {
    ctx.filter = 'brightness(3)';
  }

  // Body
  ctx.fillStyle = e.color;

  switch (e.type) {
    case 'WALKER': {
      ctx.fillStyle = 'rgba(139,51,51,0.12)';
      ctx.fillRect(px - 5, py - 5, e.w + 10, e.h + 10);
      ctx.fillStyle = 'rgba(139,51,51,0.20)';
      ctx.fillRect(px - 2, py - 2, e.w + 4, e.h + 4);

      // Corpo
      ctx.fillStyle = e.color;
      ctx.fillRect(px, py, e.w, e.h);

      // Olhos
      ctx.fillStyle = e.edgeColor;
      ctx.fillRect(px + (e.dir > 0 ? e.w - 5 : 0), py + 4, 5, 4);

      // Pernas
      ctx.fillStyle = '#8b0000';
      const legOff = Math.sin(time * 8) * 4;
      ctx.fillRect(px + 2,       py + e.h - 8, 6, 8 + legOff);
      ctx.fillRect(px + e.w - 8, py + e.h - 8, 6, 8 - legOff);
      break;
    }

    case 'VOID_TENDRIL': {
      const cx     = px + e.w / 2;
      const baseY  = py + e.h;           // pé do inimigo (chão)
      const isWind = e.vtState === 'windup';
      const pulse  = 0.5 + 0.5 * Math.sin((e.floatT || 0) * 3.5);
      const windFr = isWind ? Math.max(0, 1 - (e.vtTimer / 0.65)) : 0; // 0→1 durante windup

      // ── Raiz — elipse achatada no chão ───────────────────────────────────
      ctx.fillStyle = 'rgba(60,0,80,0.55)';
      ctx.beginPath();
      ctx.ellipse(cx, baseY - 2, e.w / 2 + 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Tronco central — 3 galhos que convergem para a ponta ─────────────
      // Oscilam levemente (sway senoidal suave)
      const sway = Math.sin((e.floatT || 0) * 2.2) * 2.5;

      // Galho central (mais grosso, vai direto à ponta)
      const tipX = cx + sway * 0.6;
      const tipY = py + 5;

      // Galhos laterais — partem da base e se unem perto do topo
      const branchMid = baseY - e.h * 0.45;

      ctx.lineWidth   = 3.5;
      ctx.strokeStyle = '#330044';
      ctx.lineCap     = 'round';

      // Galho esquerdo
      ctx.beginPath();
      ctx.moveTo(cx - 5, baseY - 4);
      ctx.quadraticCurveTo(cx - 8 + sway, branchMid, tipX - 3, tipY + 4);
      ctx.stroke();
      // Galho direito
      ctx.beginPath();
      ctx.moveTo(cx + 5, baseY - 4);
      ctx.quadraticCurveTo(cx + 8 + sway, branchMid, tipX + 3, tipY + 4);
      ctx.stroke();
      // Galho central
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 4);
      ctx.quadraticCurveTo(cx + sway * 0.8, branchMid + 8, tipX, tipY + 2);
      ctx.stroke();

      // ── Filamentos secundários — raminhos finos saindo dos galhos ─────────
      ctx.lineWidth   = 1.0;
      ctx.strokeStyle = `rgba(160,0,220,0.45)`;
      const filaments = [
        [cx - 6, baseY - e.h * 0.25, cx - 14 + sway, baseY - e.h * 0.45],
        [cx + 6, baseY - e.h * 0.25, cx + 13 + sway, baseY - e.h * 0.40],
        [cx - 4, baseY - e.h * 0.55, cx - 10 + sway * 0.5, baseY - e.h * 0.72],
        [cx + 4, baseY - e.h * 0.55, cx + 9  + sway * 0.5, baseY - e.h * 0.68],
      ];
      for (const [x1, y1, x2, y2] of filaments) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // ── Ponta — orbe de energia pulsante ─────────────────────────────────
      const orbR  = isWind ? 5 + windFr * 5 : 4 + pulse * 1.5;
      const orbColor = isWind
        ? `rgba(220,0,255,${(0.85 + 0.15 * windFr).toFixed(2)})`
        : `rgba(170,0,220,${(0.65 + 0.25 * pulse).toFixed(2)})`;

      // Halo externo (fake glow em camadas)
      ctx.fillStyle = `rgba(180,0,255,${(isWind ? 0.18 * windFr : 0.08).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, orbR + 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(200,0,255,${(isWind ? 0.25 * windFr : 0.12).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, orbR + 5, 0, Math.PI * 2);
      ctx.fill();
      // Núcleo do orbe
      ctx.fillStyle = orbColor;
      ctx.beginPath();
      ctx.arc(tipX, tipY, orbR, 0, Math.PI * 2);
      ctx.fill();
      // Brilho especular
      ctx.fillStyle = `rgba(255,200,255,${(0.55 + 0.35 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(tipX - orbR * 0.28, tipY - orbR * 0.30, orbR * 0.30, 0, Math.PI * 2);
      ctx.fill();

      // ── Anel de aviso durante windup ──────────────────────────────────────
      if (isWind) {
        const ringR = 11 + windFr * 7;
        ctx.globalAlpha = 0.55 * windFr;
        ctx.strokeStyle = '#ff44ff';
        ctx.lineWidth   = 1.2;
        ctx.beginPath();
        ctx.arc(tipX, tipY, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // ── Partículas de energia passiva subindo pelo tronco ─────────────────
      // (spawned no update; aqui só deixamos o draw limpo)

      break;
    }

    case 'CHAIN_SPECTER': {
      // ── Espectro Encadeado — corpo translúcido ciano-escuro ───────────────
      const cx2    = px + e.w / 2;
      const cy2    = py + e.h / 2;
      const ft     = e.floatT || 0;
      const pulse  = 0.5 + 0.5 * Math.sin(ft * 3.8);
      const isAim  = e.csState === 'aim';
      const aimFr  = isAim ? Math.max(0, 1 - (e.aimTimer || 0) / 0.55) : 0;
      const floatY = Math.sin(ft * 2.5) * 2.5; // oscilação vertical suave

      // ── Sombra no chão — elipse translúcida ─────────────────────────────
      ctx.fillStyle = `rgba(0,180,255,${(0.10 + 0.06 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx2, py + e.h + 1, e.w * 0.55, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Correntes — 3 arcos curvos que pendem do corpo ───────────────────
      const chainAlpha = (0.28 + 0.14 * pulse).toFixed(2);
      ctx.strokeStyle = `rgba(0,180,220,${chainAlpha})`;
      ctx.lineWidth   = 1.2;
      ctx.lineCap     = 'round';
      for (let ci = 0; ci < 3; ci++) {
        const angle = (ci / 3) * Math.PI * 2 + ft * 0.5;
        const bx1   = cx2 + Math.cos(angle) * (e.w * 0.32);
        const by1   = cy2 + Math.sin(angle) * (e.h * 0.22) + floatY;
        const bx2   = cx2 + Math.cos(angle + 0.9) * (e.w * 0.55);
        const by2   = cy2 + Math.sin(angle + 0.9) * (e.h * 0.38) + floatY + 8;
        // elo 1
        ctx.beginPath();
        ctx.moveTo(bx1, by1);
        ctx.quadraticCurveTo(
          cx2 + Math.cos(angle + 0.45) * (e.w * 0.60),
          cy2 + Math.sin(angle + 0.45) * (e.h * 0.45) + floatY + 5,
          bx2, by2
        );
        ctx.stroke();
        // ponta do elo — pequeno círculo
        ctx.fillStyle = `rgba(0,220,255,${(0.45 + 0.30 * pulse).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(bx2, by2, 2, 0, Math.PI * 2); ctx.fill();
      }

      // ── Aura externa — camadas de fake glow ─────────────────────────────
      const auraR = isAim ? (14 + aimFr * 8) : (9 + pulse * 4);
      const auraA = isAim ? (0.16 + 0.14 * aimFr) : (0.07 + 0.07 * pulse);
      ctx.fillStyle = `rgba(0,180,255,${(auraA * 0.35).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2 + floatY, auraR + 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(0,200,255,${(auraA * 0.65).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2 + floatY, auraR + 2, 0, Math.PI * 2); ctx.fill();

      // Anel fino
      ctx.strokeStyle = isAim
        ? `rgba(0,255,255,${(0.5 + 0.4 * aimFr).toFixed(2)})`
        : `rgba(0,200,255,${(0.20 + 0.15 * pulse).toFixed(2)})`;
      ctx.lineWidth = isAim ? 1.8 : 1;
      ctx.beginPath(); ctx.arc(cx2, cy2 + floatY, auraR, 0, Math.PI * 2); ctx.stroke();

      // ── Corpo principal — elipse ciano-escura translúcida ────────────────
      ctx.fillStyle = isAim ? '#0a2a33' : '#0a1a22';
      ctx.beginPath();
      ctx.ellipse(cx2, cy2 + floatY, e.w * 0.44, e.h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      // borda ciano
      ctx.strokeStyle = `rgba(0,204,255,${(0.50 + 0.28 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.ellipse(cx2, cy2 + floatY, e.w * 0.44, e.h * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Cauda espectral — 2 elipses abaixo do corpo
      for (let i = 0; i < 2; i++) {
        const ty2 = cy2 + e.h * 0.38 + floatY + i * 5;
        const tw  = e.w * 0.28 * (1 - i * 0.35);
        ctx.fillStyle = `rgba(0,180,220,${(0.30 - i * 0.10).toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(cx2, ty2, tw, 3 - i, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Olhos — duas fendas ciano brilhantes ─────────────────────────────
      const eyeOffX = e.dir > 0 ? 3 : -3;
      const eyeA    = (0.75 + 0.22 * pulse).toFixed(2);
      // halo dos olhos
      ctx.fillStyle = `rgba(0,200,255,${(+eyeA * 0.22).toFixed(2)})`;
      ctx.fillRect(cx2 + eyeOffX - 6, cy2 - 4 + floatY, 6, 6);
      ctx.fillRect(cx2 + eyeOffX + 0, cy2 - 4 + floatY, 6, 6);
      // olhos
      ctx.fillStyle = isAim ? '#ffffff' : `rgba(0,220,255,${eyeA})`;
      ctx.fillRect(cx2 + eyeOffX - 5, cy2 - 3 + floatY, 4, 3);
      ctx.fillRect(cx2 + eyeOffX + 1, cy2 - 3 + floatY, 4, 3);

      // ── Anel de mira ao carregar ──────────────────────────────────────────
      if (isAim) {
        const cr = e.w * 0.58 + aimFr * e.w * 0.28;
        ctx.globalAlpha = 0.55 * aimFr;
        ctx.strokeStyle = 'rgba(0,255,255,0.5)';
        ctx.lineWidth   = 4;
        ctx.beginPath(); ctx.arc(cx2, cy2 + floatY, cr + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.arc(cx2, cy2 + floatY, cr, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      break;
    }

    case 'VOID_SPECTER': {
      // ── Espectro de Energia da Singularidade ─────────────────────────────
      // Paleta: roxo-magenta profundo + ciano-verde frio (#220033/#660044/#00ffcc/#cc00ff)
      const cx2   = px + e.w / 2;
      const cy2   = py + e.h / 2;
      const ft    = e.floatT || 0;
      const pulse = 0.5 + 0.5 * Math.sin(ft * 3.5);
      const vs    = e.vsState || 'drift';
      const isCharge = vs === 'charge';
      const isBurst  = vs === 'burst';

      // ── Aura externa em camadas
      const auraR = isCharge ? (18 + pulse * 8) : (12 + pulse * 5);
      const auraA = isCharge ? (0.18 + 0.14 * pulse) : (0.08 + 0.08 * pulse);
      // camada mais externa — magenta
      ctx.fillStyle = `rgba(180,0,255,${(auraA * 0.30).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, auraR + 10, 0, Math.PI * 2); ctx.fill();
      // camada intermédia — ciano
      ctx.fillStyle = `rgba(0,220,170,${(auraA * 0.45).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, auraR + 4,  0, Math.PI * 2); ctx.fill();
      // anel fino
      ctx.strokeStyle = isCharge
        ? `rgba(0,255,204,${(0.55 + 0.35 * pulse).toFixed(2)})`
        : `rgba(180,0,255,${(0.22 + 0.16 * pulse).toFixed(2)})`;
      ctx.lineWidth = isCharge ? 2 : 1;
      ctx.beginPath(); ctx.arc(cx2, cy2, auraR, 0, Math.PI * 2); ctx.stroke();

      // ── Anel giratório duplo ────────────────────────────────────────────
      const spin1 = ft * 1.6;
      const spin2 = -ft * 1.0 + 0.8;

      // anel 1 — magenta
      ctx.save();
      ctx.translate(cx2, cy2);
      ctx.rotate(spin1);
      ctx.strokeStyle = `rgba(204,0,255,${(0.30 + 0.18 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.w * 0.72, e.h * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      // 4 orbes no anel 1
      for (let i = 0; i < 4; i++) {
        const a  = (i / 4) * Math.PI * 2;
        const ox = Math.cos(a) * e.w * 0.72;
        const oy = Math.sin(a) * e.h * 0.22;
        ctx.fillStyle = `rgba(204,0,255,${(0.20 + 0.14 * pulse).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(ox, oy, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,80,255,${(0.65 + 0.30 * pulse).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(ox, oy, 1.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // anel 2 — ciano
      ctx.save();
      ctx.translate(cx2, cy2);
      ctx.rotate(spin2);
      ctx.strokeStyle = `rgba(0,220,170,${(0.22 + 0.14 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.w * 0.58, e.h * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();
      // 4 orbes no anel 2
      for (let i = 0; i < 4; i++) {
        const a  = (i / 4) * Math.PI * 2;
        const ox = Math.cos(a) * e.w * 0.58;
        const oy = Math.sin(a) * e.h * 0.18;
        ctx.fillStyle = `rgba(0,255,200,${(0.50 + 0.35 * pulse).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(ox, oy, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // ── Corpo — núcleo sólido + halo ────────────────────────────────────
      // halo do corpo
      ctx.fillStyle = isCharge
        ? `rgba(100,0,180,${(0.20 + 0.18 * pulse).toFixed(2)})`
        : `rgba(60,0,100,${(0.12 + 0.10 * pulse).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, e.w * 0.54, 0, Math.PI * 2); ctx.fill();

      // corpo principal — elipse roxa escura
      ctx.fillStyle = isCharge ? '#330044' : '#220033';
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, e.w * 0.42, e.h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      // borda fina magenta
      ctx.strokeStyle = `rgba(204,0,255,${(0.55 + 0.30 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, e.w * 0.42, e.h * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();

      // ── Núcleo central pulsante ─────────────────────────────────────────
      const coreA = (0.80 + 0.18 * pulse).toFixed(2);
      const coreR = isBurst ? 6 + pulse * 3 : 4 + pulse * 2;
      // halo do core
      ctx.fillStyle = isBurst
        ? `rgba(0,255,200,${(0.25 + 0.20 * pulse).toFixed(2)})`
        : `rgba(180,0,255,${(0.18 + 0.14 * pulse).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, coreR + 5, 0, Math.PI * 2); ctx.fill();
      // core
      ctx.fillStyle = isBurst ? `rgba(0,255,204,${coreA})` : `rgba(180,0,255,${coreA})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, coreR, 0, Math.PI * 2); ctx.fill();
      // ponto brilhante
      ctx.fillStyle = isBurst ? 'rgba(200,255,240,0.9)' : 'rgba(240,180,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(cx2 - coreR * 0.3, cy2 - coreR * 0.35, coreR * 0.28, coreR * 0.22, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // ── Tentáculos de carga (charge state) ──────────────────────────────
      if (isCharge) {
        const tentCount = 6;
        const chargeT   = e.vsTimer || 0;
        const chargeFr  = Math.max(0, 1 - chargeT / 0.8);
        const baseRad   = e.w * 0.9;
        for (let i = 0; i < tentCount; i++) {
          const ang  = (i / tentCount) * Math.PI * 2 + ft * 0.6;
          const tipX = cx2 + Math.cos(ang) * baseRad;
          const tipY = cy2 + Math.sin(ang) * baseRad;
          const cpX  = cx2 + Math.cos(ang + 0.7) * baseRad * 0.5;
          const cpY  = cy2 + Math.sin(ang + 0.7) * baseRad * 0.5;
          const col  = (i % 2 === 0) ? `rgba(204,0,255,${(0.4 + 0.4 * chargeFr).toFixed(2)})`
                                      : `rgba(0,220,170,${(0.3 + 0.4 * chargeFr).toFixed(2)})`;
          ctx.strokeStyle = col;
          ctx.lineWidth   = 1.2 + chargeFr;
          ctx.lineCap     = 'round';
          ctx.beginPath();
          ctx.moveTo(cx2, cy2);
          ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
          ctx.stroke();
          // ponta brilhante
          ctx.fillStyle = i % 2 === 0 ? `rgba(255,80,255,${(0.6 + 0.3 * chargeFr).toFixed(2)})`
                                       : `rgba(0,255,204,${(0.5 + 0.3 * chargeFr).toFixed(2)})`;
          ctx.beginPath(); ctx.arc(tipX, tipY, 2, 0, Math.PI * 2); ctx.fill();
        }
        // anel de carga crescente
        const cr     = e.w * 0.6 + chargeFr * e.w * 0.35;
        ctx.globalAlpha = 0.5 * chargeFr;
        ctx.strokeStyle = 'rgba(0,255,200,0.4)';
        ctx.lineWidth   = 4;
        ctx.beginPath(); ctx.arc(cx2, cy2, cr + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.arc(cx2, cy2, cr, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // ── Flash de burst ────────────────────────────────────────────────────
      if (isBurst && e.vsTimer > 0 && e.vsTimer < 0.08) {
        ctx.fillStyle = 'rgba(0,255,200,0.18)';
        ctx.beginPath(); ctx.arc(cx2, cy2, e.w * 1.1, 0, Math.PI * 2); ctx.fill();
      }

      break;
    }

    case 'EYE_OF_VOID': {
      // ── Centro do inimigo ────────────────────────────────────────────────
      const cx2     = px + e.w / 2;
      const cy2     = py + e.h / 2;
      const evs     = e.evState || 'drift';
      const dil     = e.pupilDilate || 0;     // 0=fenda, 1=circular/vermelho
      const pulse   = 0.5 + 0.5 * Math.sin((e.floatT || 0) * 3.2);
      const isAim   = evs === 'aim';
      const isBurst = evs === 'retreat' && (e.evTimer || 0) > 0.7;  // recém-disparou

      // ── Aura externa — múltiplas camadas
      const auraR  = isAim ? (20 + (1-dil) * 10) : (14 + pulse * 6);
      const auraA  = isAim ? 0.22 + 0.20 * dil   : 0.08 + 0.10 * pulse;
      ctx.fillStyle = `rgba(80,0,180,${(auraA * 0.35).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, auraR + 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(100,0,220,${(auraA * 0.60).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, auraR + 4,  0, Math.PI * 2); ctx.fill();

      // ── Anel orbital girando (igual ao decorator magicEye) ───────────────
      const ringAng = (e.floatT || 0) * 1.3;
      ctx.save();
      ctx.translate(cx2, cy2);
      ctx.rotate(ringAng);
      ctx.strokeStyle = `rgba(153,34,255,${(0.30 + 0.18 * pulse).toFixed(2)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.w * 0.75, e.h * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(cx2, cy2);
      ctx.rotate(-ringAng * 0.65 + 1.05);
      ctx.strokeStyle = `rgba(153,34,255,${(0.18 + 0.12 * pulse).toFixed(2)})`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.w * 0.62, e.h * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ── Flash branco de disparo (frame imediato após BURST) ──────────────
      if (isBurst) {
        const bFrac = Math.max(0, (e.evTimer - 0.7) / 0.3);
        ctx.fillStyle = `rgba(255,255,255,${(bFrac * 0.55).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(cx2, cy2, e.w * 0.65, 0, Math.PI * 2); ctx.fill();
      }

      // ── Tentáculos AIM — 8 tentáculos que se recolhem para o centro ──────
      if (isAim) {
        const tentCount = 8;
        const tentFr    = dil;  // 0=abertos, 1=recolhidos
        const baseRad   = e.w * 0.85 * (1 - tentFr * 0.55);
        ctx.save();
        for (let i = 0; i < tentCount; i++) {
          const ang  = (i / tentCount) * Math.PI * 2 + (e.floatT || 0) * 0.4;
          const tipX = cx2 + Math.cos(ang) * baseRad;
          const tipY = cy2 + Math.sin(ang) * baseRad;
          const cpX  = cx2 + Math.cos(ang + 0.5) * baseRad * 0.55;
          const cpY  = cy2 + Math.sin(ang + 0.5) * baseRad * 0.55;
          const alpha = (0.50 + 0.40 * tentFr).toFixed(2);
          ctx.strokeStyle = `rgba(120,0,200,${alpha})`;
          ctx.lineWidth   = 1.5 + tentFr * 1.0;
          ctx.lineCap     = 'round';
          ctx.beginPath();
          ctx.moveTo(cx2, cy2);
          ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
          ctx.stroke();
          // ponto brilhante na ponta do tentáculo
          ctx.fillStyle = `rgba(180,60,255,${(0.55 + 0.35 * tentFr).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(tipX, tipY, 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ── Trilha de partículas enquanto se move ─────────────────────────────
      if (evs === 'drift' && (Math.abs(e.vx) > 0.2 || Math.abs(e.vy) > 0.2)) {
        if (Math.random() < 0.30) {
          // partícula inline (sem spawnParticles para não poluir o pool com coord mundo)
          const tx2 = cx2 - e.vx * 2 + (Math.random() - 0.5) * 4;
          const ty2 = cy2 - e.vy * 2 + (Math.random() - 0.5) * 4;
          spawnParticles(
            e.x + e.w / 2 + (Math.random() - 0.5) * 6,
            e.y + e.h / 2 + (Math.random() - 0.5) * 6,
            Math.random() < 0.5 ? '#9922ff' : '#5500cc', 1, 0.8
          );
        }
      }

      // ── Corpo — esclera grande com íris giratória (= magicEyes decorativo) ─
      // Halo da esclera
      ctx.fillStyle = isAim
        ? `rgba(60,0,120,${(0.22 + 0.20 * dil).toFixed(2)})`
        : `rgba(40,0,80,${(0.14 + 0.10 * pulse).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, e.w * 0.60, 0, Math.PI * 2); ctx.fill();

      // Esclera — branco envelhecido (levemente amarelado, igual ao decorator)
      ctx.fillStyle = isAim ? '#2a1040' : '#180830';
      ctx.beginPath(); ctx.arc(cx2, cy2, e.w * 0.46, 0, Math.PI * 2); ctx.fill();
      // face visível da esclera (bege-amarelada)
      ctx.fillStyle = '#c8b090';
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, e.w * 0.40, e.h * 0.30, 0, 0, Math.PI * 2);
      ctx.fill();
      // sombra inferior da esclera
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(cx2, cy2 + e.h * 0.08, e.w * 0.36, e.h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Íris giratória ────────────────────────────────────────────────────
      const irisAngle = (e.floatT || 0) * 0.9;
      const irisRX    = e.w * 0.28;
      const irisRY    = e.h * 0.20;
      ctx.save();
      ctx.translate(cx2, cy2);
      ctx.rotate(irisAngle);
      // cor da íris: roxa normal → vermelha intensa no AIM
      const irisR_val = isAim ? `rgba(${Math.round(180 + 70 * dil)},${Math.round(20 * (1-dil))},${Math.round(255 * (1-dil))},0.92)` : 'rgba(140,0,220,0.90)';
      ctx.fillStyle = irisR_val;
      ctx.beginPath(); ctx.ellipse(0, 0, irisRX + 2, irisRY + 1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isAim
        ? `rgba(${Math.round(220 + 35 * dil)},${Math.round(20 * (1-dil))},${Math.round(200 * (1-dil))},0.95)`
        : 'rgba(180,0,255,0.90)';
      ctx.beginPath(); ctx.ellipse(0, 0, irisRX, irisRY, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // ── Pupila: fenda (DRIFT/RETREAT) → circular/vermelha (AIM) ──────────
      ctx.fillStyle = '#000';
      if (dil < 0.5) {
        // fenda vertical
        ctx.beginPath();
        ctx.ellipse(cx2, cy2, e.w * 0.055 * (1 - dil * 0.7), e.h * 0.17, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // circular e vermelha
        const pupR = e.w * 0.09 + e.w * 0.09 * (dil - 0.5) * 2;
        ctx.fillStyle = `rgba(180,0,0,${(0.65 + 0.30 * dil).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(cx2, cy2, pupR + 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(cx2, cy2, pupR, 0, Math.PI * 2); ctx.fill();
      }

      // ── Reflexo especular brilhante ───────────────────────────────────────
      ctx.fillStyle = `rgba(255,210,255,${(0.55 + 0.20 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx2 - e.w * 0.13, cy2 - e.h * 0.13, e.w * 0.07, e.h * 0.05, -0.5, 0, Math.PI * 2);
      ctx.fill();

      // ── Cílios — 4 traços finos saindo da esclera (= decorator) ──────────
      ctx.strokeStyle = 'rgba(60,0,100,0.45)';
      ctx.lineWidth   = 0.8;
      const cilioAngles2 = [-0.6, -0.2, 0.2, 0.6];
      for (const ca of cilioAngles2) {
        ctx.beginPath();
        ctx.moveTo(cx2 + Math.cos(ca) * e.w * 0.40, cy2 - Math.abs(Math.sin(ca)) * e.h * 0.28);
        ctx.lineTo(cx2 + Math.cos(ca) * e.w * 0.57, cy2 - Math.abs(Math.sin(ca)) * e.h * 0.42);
        ctx.stroke();
      }

      // ── Anel de carregamento AIM — contorno pulsante externo ─────────────
      if (isAim) {
        const chargeFr = 1 - Math.max(0, (e.evTimer || 0) / 1.2);
        const cr       = e.w * 0.65 + chargeFr * e.w * 0.30;
        const ca_alpha = (0.3 + 0.6 * chargeFr).toFixed(2);
        // halo externo
        ctx.strokeStyle = `rgba(255,50,200,${(+ca_alpha * 0.4).toFixed(2)})`;
        ctx.lineWidth   = 4;
        ctx.beginPath(); ctx.arc(cx2, cy2, cr + 3, 0, Math.PI * 2); ctx.stroke();
        // anel fino brilhante
        ctx.strokeStyle = `rgba(255,80,220,${ca_alpha})`;
        ctx.lineWidth   = 1.5;
        ctx.beginPath(); ctx.arc(cx2, cy2, cr, 0, Math.PI * 2); ctx.stroke();
      }

      break;
    }

    case 'WATCHER': {
      const cx2    = px + e.w / 2;
      const cy2    = py + e.h / 2;
      const pulse  = 0.5 + 0.5 * Math.sin((e.floatT || 0) * 3.5);
      const isWind = e.wtState === 'windup';
      const windFr = isWind ? Math.max(0, 1 - (e.wtTimer || 0) / 0.7) : 0;

      // ── Fake glow externo — 3 arcos em opacidade decrescente ─────────
      const auraR = isWind ? (14 + windFr * 10) : (10 + pulse * 4);
      const auraA = isWind ? (0.18 + 0.22 * windFr) : (0.08 + 0.10 * pulse);
      ctx.fillStyle = `rgba(180,0,255,${(auraA * 0.4).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, auraR + 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(180,0,255,${(auraA * 0.7).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, auraR + 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = isWind
        ? `rgba(255,0,220,${(0.4 + 0.5 * windFr).toFixed(2)})`
        : `rgba(180,0,255,${(0.20 + 0.20 * pulse).toFixed(2)})`;
      ctx.lineWidth = isWind ? 2.5 : 1.5;
      ctx.beginPath(); ctx.arc(cx2, cy2, auraR, 0, Math.PI * 2); ctx.stroke();

      // ── Anel secundário giratório ─────────────────────────────────────
      ctx.save();
      ctx.translate(cx2, cy2);
      ctx.rotate((e.floatT || 0) * (isWind ? 4.5 : 1.2));
      ctx.strokeStyle = `rgba(200,0,255,${(0.25 + 0.15 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
      // 4 nós no anel — fake glow com 2 círculos por nó
      for (let i = 0; i < 4; i++) {
        const a  = (i / 4) * Math.PI * 2;
        const nx = Math.cos(a) * 11;
        const ny = Math.sin(a) * 11;
        ctx.fillStyle = `rgba(200,0,255,${(0.18 + 0.12 * pulse).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(nx, ny, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(220,80,255,${(0.55 + 0.35 * pulse).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(nx, ny, 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // ── Globo ocular — esclera + fake glow ───────────────────────────
      // halo da esclera
      ctx.fillStyle = isWind
        ? `rgba(120,0,180,${(0.20 + 0.20 * windFr).toFixed(2)})`
        : `rgba(80,0,140,${(0.12 + 0.08 * pulse).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, 13, 0, Math.PI * 2); ctx.fill();
      // esclera
      ctx.fillStyle = isWind ? '#1a0028' : '#0a0014';
      ctx.beginPath(); ctx.arc(cx2, cy2, 9, 0, Math.PI * 2); ctx.fill();

      // ── Íris — fake glow com 2 camadas ───────────────────────────────
      const irisR = isWind ? (5 + windFr * 2) : 5;
      ctx.fillStyle = isWind
        ? `rgba(255,0,255,${(0.18 + 0.22 * windFr).toFixed(2)})`
        : `rgba(160,0,255,${(0.15 + 0.10 * pulse).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, irisR + 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isWind
        ? `rgba(255,${Math.floor(200 * (1 - windFr))},255,0.95)`
        : `rgba(180,0,255,${(0.80 + 0.15 * pulse).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, irisR, 0, Math.PI * 2); ctx.fill();

      // ── Pupila vertical (fenda) ───────────────────────────────────────
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, isWind ? 1.2 : 1.8, isWind ? 3.8 : 3.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Reflexo brilhante ─────────────────────────────────────────────
      ctx.fillStyle = 'rgba(255,200,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(cx2 - 2, cy2 - 2.5, 1.5, 1, -0.5, 0, Math.PI * 2);
      ctx.fill();

      // ── Veias ao redor do olho ────────────────────────────────────────
      ctx.strokeStyle = `rgba(140,0,200,${(0.35 + 0.20 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 0.8;
      for (let i = 0; i < 6; i++) {
        const a  = (i / 6) * Math.PI * 2 + (e.floatT || 0) * 0.3;
        const r0 = 9;
        const r1 = 13 + Math.sin((e.floatT || 0) * 2 + i) * 2;
        ctx.beginPath();
        ctx.moveTo(cx2 + Math.cos(a) * r0, cy2 + Math.sin(a) * r0);
        ctx.lineTo(cx2 + Math.cos(a) * r1, cy2 + Math.sin(a) * r1);
        ctx.stroke();
      }
      break;
    }

    case 'WRAITH_MAGE': {
      const wm       = e.wmState || 'idle';
      const isCast   = wm === 'cast';
      const isTP     = wm === 'teleport';
      const castFr   = isCast ? Math.max(0, 1 - (e.wmTimer || 0) / 1.1) : 0;
      const pulse    = 0.5 + 0.5 * Math.sin((e.floatT || 0) * 3.2);
      const cx2      = px + e.w / 2;
      const floatOff = Math.sin((e.floatT || 0) * 2.0) * 3; // flutua levemente

      // Flash de teleporte (aparece/some)
      if (isTP || (e.wmFlashAlpha || 0) > 0) {
        if (!isTP) e.wmFlashAlpha = Math.max(0, (e.wmFlashAlpha || 0) - 0.05);
        const fa = Math.min(1, e.wmFlashAlpha || 0);
        ctx.fillStyle = `rgba(255,100,200,${(fa * 0.55).toFixed(2)})`;
        ctx.fillRect(px - 6, py + floatOff - 4, e.w + 12, e.h + 8);
      }

      // Aura sombria pulsante
      const glowRgb = isCast ? '255,50,150' : '180,0,80';
      const auraA1  = (0.06 + 0.06 * pulse).toFixed(2);
      const auraA2  = (0.13 + 0.10 * pulse).toFixed(2);
      ctx.fillStyle = `rgba(${glowRgb},${auraA1})`;
      ctx.fillRect(cx2 - e.w / 2 - 10, py + floatOff - 6, e.w + 20, e.h + 12);
      ctx.fillStyle = `rgba(${glowRgb},${auraA2})`;
      ctx.fillRect(cx2 - e.w / 2 - 4,  py + floatOff - 2, e.w + 8,  e.h + 4);

      // Robe — trapézio afunilado, flutua
      ctx.fillStyle = isTP ? `rgba(10,0,24,${(0.3 + 0.7 * (e.wmFlashAlpha || 0)).toFixed(2)})` : '#0a0018';
      ctx.beginPath();
      ctx.moveTo(cx2 - 3,         py + 14 + floatOff);
      ctx.lineTo(cx2 + 3,         py + 14 + floatOff);
      ctx.lineTo(cx2 + e.w / 2,   py + e.h + floatOff);
      ctx.lineTo(cx2 - e.w / 2,   py + e.h + floatOff);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = isCast ? '#ff3399' : '#550033';
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Farrapos na borda do robe
      for (let fi = 0; fi < 5; fi++) {
        const fx2 = cx2 - e.w / 2 + fi * (e.w / 4);
        const fh  = 4 + ((fi * 5 + Math.floor((e.floatT || 0) * 3)) % 5);
        ctx.fillStyle = `rgba(${glowRgb},0.35)`;
        ctx.fillRect(fx2, py + e.h + floatOff - 1, 3, fh);
      }

      // Capuz / cabeça
      ctx.fillStyle = '#0d001f';
      ctx.beginPath();
      ctx.arc(cx2, py + 8 + floatOff, 9, Math.PI, 0);
      ctx.lineTo(cx2 + 7, py + 15 + floatOff);
      ctx.lineTo(cx2 - 7, py + 15 + floatOff);
      ctx.closePath();
      ctx.fill();
      // sombra interna do capuz
      ctx.fillStyle = '#06000f';
      ctx.fillRect(cx2 - 4, py + 12 + floatOff, 8, 4);

      // Olhos — dois pontos rosas brilhantes
      const eyeA   = (0.7 + 0.3 * pulse).toFixed(2);
      const eyeRgb = isCast ? '255,150,220' : '220,0,100';
      ctx.fillStyle = `rgba(${eyeRgb},${(+eyeA * 0.3).toFixed(2)})`;
      ctx.fillRect(cx2 - 6, py + 5 + floatOff, 6, 6);
      ctx.fillRect(cx2 + 0, py + 5 + floatOff, 6, 6);
      ctx.fillStyle = `rgba(${eyeRgb},${eyeA})`;
      ctx.beginPath(); ctx.arc(cx2 - 3, py + 8 + floatOff, 2.0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx2 + 3, py + 8 + floatOff, 2.0, 0, Math.PI * 2); ctx.fill();

      // Braços ossudos
      const armRaise = isCast ? -9 * castFr : 0;
      const armY     = py + 16 + floatOff;
      ctx.strokeStyle = '#200035';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(cx2 - 3, armY);
      ctx.lineTo(cx2 - 9, armY + 5 + armRaise);
      ctx.lineTo(cx2 - e.w / 2 - 2, armY + 1 + armRaise);
      ctx.moveTo(cx2 + 3, armY);
      ctx.lineTo(cx2 + 9, armY + 5 + armRaise);
      ctx.lineTo(cx2 + e.w / 2 + 2, armY + 1 + armRaise);
      ctx.stroke();

      // Orbe de cast nas mãos
      if (isCast) {
        const orbR = 2 + castFr * 5;
        const lx   = cx2 - e.w / 2 - 2;
        const rx   = cx2 + e.w / 2 + 2;
        const oy   = armY + 1 + armRaise;
        ctx.fillStyle = `rgba(255,50,150,${(castFr * 0.18).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(lx, oy, orbR + 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, oy, orbR + 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,80,180,${(0.5 + 0.5 * castFr).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(lx, oy, orbR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, oy, orbR, 0, Math.PI * 2); ctx.fill();
        // linha de energia entre as mãos
        ctx.strokeStyle = `rgba(255,100,200,${(castFr * 0.7).toFixed(2)})`;
        ctx.lineWidth   = 1.5;
        ctx.beginPath(); ctx.moveTo(lx, oy); ctx.lineTo(rx, oy); ctx.stroke();
      }

      // Runas no robe (3 traços horizontais)
      ctx.fillStyle = `rgba(${glowRgb},${(0.3 + 0.2 * pulse).toFixed(2)})`;
      for (let r2 = 0; r2 < 3; r2++) {
        const ry2 = py + 18 + floatOff + r2 * 4;
        const rw2 = 3 + r2 * 1.5;
        ctx.fillRect(cx2 - rw2, ry2, rw2 * 2, 1);
      }
      break;
    }

    case 'REVENANT': {
      const rv     = e.rvState || 'patrol';
      const isDead = rv === 'dead_temp';
      const isRise = rv === 'rising';
      const isAim  = rv === 'aim';
      const isMoving  = rv === 'patrol' && Math.abs(e.vx || 0) > 0.2;
      const cx2    = px + e.w / 2;
      const pulse  = 0.5 + 0.5 * Math.sin((e.floatT || 0) * 3.5);

      // Glow verde-cadaverico
      const glowRgb = isDead ? '34,85,17' : (isAim ? '102,255,51' : '68,170,34');
      const glowSz  = isDead ? 4 : (isAim ? 14 + pulse * 8 : 7 + pulse * 4);
      ctx.fillStyle = `rgba(${glowRgb},0.08)`;
      ctx.fillRect(px - glowSz, py - glowSz, e.w + glowSz * 2, e.h + glowSz * 2);

      if (isDead || isRise) {
        // corpo deitado — desenha pequeno e achatado diretamente no chão
        const riseAng = isRise
          ? (Math.PI / 2) * (1 - Math.max(0, (e.rvDeadTimer || 0) / 0.7))
          : Math.PI / 2;
        const flatW = e.h * 0.7;  // largura deitado (era a altura)
        const flatH = e.w * 0.45; // altura achatada (muito menor)
        const bx2   = px + e.w / 2;
        const by2   = py + e.h - flatH; // base na base do sprite

        ctx.save();
        ctx.translate(bx2, by2 + flatH / 2);

        // corpo achatado
        ctx.fillStyle = '#1a2a10';
        ctx.fillRect(-flatW / 2, -flatH / 2, flatW, flatH);
        // cabeca oval no lado
        ctx.fillStyle = '#223318';
        ctx.beginPath();
        ctx.ellipse(flatW / 2 + 4, 0, 5, flatH / 2 - 1, 0, 0, Math.PI * 2);
        ctx.fill();
        // olhos fechados
        ctx.fillStyle = '#44aa22';
        ctx.fillRect(flatW / 2, -1, 5, 1);
        // pulso de podridao
        const rotPulse = 0.5 + 0.5 * Math.sin((e.rvRisePulse || 0) * 4);
        ctx.fillStyle = `rgba(68,255,34,${(0.08 + 0.10 * rotPulse).toFixed(2)})`;
        ctx.fillRect(-flatW / 2, -flatH / 2, flatW, flatH);
        ctx.restore();
      } else {
        // Robe esfarrapado
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(px,        py + e.h);
        ctx.lineTo(px + e.w,  py + e.h);
        ctx.lineTo(px + e.w - 3, py + 10);
        ctx.lineTo(px + 3,    py + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = e.edgeColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Farrapos
        if (isMoving) {
          for (let fi = 0; fi < 4; fi++) {
            const fx2 = px + 2 + fi * 5;
            const fh  = 3 + ((fi * 7 + Math.floor((e.floatT || 0) * 2)) % 4);
            ctx.fillStyle = `rgba(${glowRgb},0.4)`;
            ctx.fillRect(fx2, py + e.h - 1, 3, fh);
          }
        }

        // Cabeca - cranio
        ctx.fillStyle = '#223318';
        ctx.fillRect(px + 2, py, e.w - 4, 12);
        ctx.fillStyle = '#1a2810';
        ctx.fillRect(px + 4, py + 8, e.w - 8, 5);

        // Olhos putrefatos
        const eyeX2 = e.dir > 0 ? px + e.w - 8 : px + 2;
        ctx.fillStyle = `rgba(${glowRgb},${(0.6 + 0.4 * pulse).toFixed(2)})`;
        ctx.fillRect(eyeX2, py + 3, 5, 3);
        ctx.fillStyle = '#ccff88';
        ctx.fillRect(eyeX2 + 1, py + 3, 2, 1);

        // Bracos
        const armRaise = isAim ? -8 * (1 - Math.max(0, (e.rvAimTimer || 0) / 0.7)) : 0;
        ctx.fillStyle = '#1a2a10';
        ctx.fillRect(px - 4, py + 12 + armRaise, 5, 10);
        ctx.fillRect(px + e.w - 1, py + 12 + armRaise, 5, 10);

        // Osso na mao ao mirar
        if (isAim) {
          const handX = e.dir > 0 ? px + e.w + 3 : px - 10;
          const handY = py + 13 + armRaise;
          const aimAlpha = (0.5 + 0.5 * Math.abs(Math.sin(time * 12))).toFixed(2);
          ctx.fillStyle = `rgba(170,187,136,${aimAlpha})`;
          ctx.fillRect(handX, handY, 8, 3);
          ctx.fillRect(handX + 1, handY - 2, 2, 7);
        }

        // Pernas arrastadas — só animam quando está patrulhando
        const legSway   = isMoving ? Math.sin((e.floatT || 0) * 5) * 2 : 0;
        ctx.fillStyle = '#111f0a';
        ctx.fillRect(px + 2,       py + e.h - 8, 5, 8 + legSway);
        ctx.fillRect(px + e.w - 7, py + e.h - 8, 5, 8 - legSway);
      }

      // Barra de ressurreicao
      if (isDead) {
        const barW = e.w;
        const prog = 1 - Math.max(0, (e.rvDeadTimer || 0) / 5.0);
        ctx.fillStyle = '#111';
        ctx.fillRect(px, py + e.h + 3, barW, 4);
        ctx.fillStyle = `rgba(${glowRgb},0.9)`;
        ctx.fillRect(px, py + e.h + 3, barW * prog, 4);
      }
      break;
    }

    case 'VOID_CASTER': {
      const cx2    = px + e.w / 2;
      const cast   = e.vcState === 'casting';
      const castFr = cast ? Math.max(0, 1 - (e.vcCastTimer / 1.3)) : 0;
      const pulse  = 0.5 + 0.5 * Math.sin((e.floatT || 0) * 2.8);

      // ── Robe — fake glow azul-vazio com rects expandidos ──────────────
      if (cast) {
        // aura exterior (maior, mais transparente)
        ctx.fillStyle = `rgba(51,0,204,${(0.06 + 0.06 * castFr).toFixed(2)})`;
        ctx.fillRect(cx2 - e.w / 2 - 8, py + 6, e.w + 16, e.h - 6 + 8);
        // aura interior
        ctx.fillStyle = `rgba(51,0,204,${(0.12 + 0.08 * castFr).toFixed(2)})`;
        ctx.fillRect(cx2 - e.w / 2 - 4, py + 8, e.w + 8, e.h - 8 + 4);
      }

      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(cx2 - 2,         py + 14);
      ctx.lineTo(cx2 + 2,         py + 14);
      ctx.lineTo(cx2 + e.w / 2,   py + e.h);
      ctx.lineTo(cx2 - e.w / 2,   py + e.h);
      ctx.closePath();
      ctx.fill();
      // borda do robe
      ctx.strokeStyle = '#0a0035';
      ctx.lineWidth   = 1;
      ctx.stroke();

      // ── Padrão de runas no robe ────────────────────────────────────────
      ctx.fillStyle = `rgba(60,20,180,${(0.4 + 0.3 * pulse).toFixed(2)})`;
      for (let r = 0; r < 3; r++) {
        const ry = py + 18 + r * 4;
        const rw = 3 + r * 1.5;
        ctx.fillRect(cx2 - rw, ry, rw * 2, 1);
      }

      // ── Cabeça ─────────────────────────────────────────────────────────
      ctx.fillStyle = '#08001a';
      ctx.beginPath();
      ctx.arc(cx2, py + 8, 8, Math.PI, 0);
      ctx.lineTo(cx2 + 6, py + 14);
      ctx.lineTo(cx2 - 6, py + 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#050012';
      ctx.fillRect(cx2 - 5, py + 12, 10, 4);

      // ── Olhos — fake glow com rects em camada ─────────────────────────
      const eyeA    = cast ? (0.8 + 0.2 * castFr) : (0.6 + 0.35 * pulse);
      const eyeRgb  = cast ? '180,120,255' : '60,0,220';
      // halo externo (2px ao redor de cada olho)
      ctx.fillStyle = `rgba(${eyeRgb},${(eyeA * 0.35).toFixed(2)})`;
      ctx.fillRect(cx2 - 8, py + 4, 8, 6);
      ctx.fillRect(cx2 + 0, py + 4, 8, 6);
      // olho principal
      ctx.fillStyle = `rgba(${eyeRgb},${eyeA.toFixed(2)})`;
      ctx.fillRect(cx2 - 6, py + 6, 4, 2);
      ctx.fillRect(cx2 + 2, py + 6, 4, 2);
      // brilho central (1px branco)
      if (cast) {
        ctx.fillStyle = `rgba(255,240,255,${(0.7 * castFr).toFixed(2)})`;
        ctx.fillRect(cx2 - 5, py + 6, 2, 1);
        ctx.fillRect(cx2 + 3, py + 6, 2, 1);
      }

      // ── Braços ─────────────────────────────────────────────────────────
      const armRaise = cast ? -12 * castFr : 0;
      const armY     = py + 16;
      ctx.strokeStyle = '#0a0028';
      ctx.lineWidth   = 2.5;
      // agrupados em 1 beginPath para reduzir overhead
      ctx.beginPath();
      ctx.moveTo(cx2 - 3, armY);       ctx.lineTo(cx2 - 9, armY + 4 + armRaise);
      ctx.moveTo(cx2 - 9, armY + 4 + armRaise); ctx.lineTo(cx2 - e.w / 2 - 2, armY - 1 + armRaise);
      ctx.moveTo(cx2 + 3, armY);       ctx.lineTo(cx2 + 9, armY + 4 + armRaise);
      ctx.moveTo(cx2 + 9, armY + 4 + armRaise); ctx.lineTo(cx2 + e.w / 2 + 2, armY - 1 + armRaise);
      ctx.stroke();

      // ── Orbe do vazio nas mãos durante cast — fake glow ───────────────
      if (cast) {
        const orbR  = 3 + castFr * 5;
        const orbA  = (0.6 + 0.4 * castFr).toFixed(2);
        const lx    = cx2 - e.w / 2 - 2;
        const rx    = cx2 + e.w / 2 + 2;
        const orbY  = armY - 1 + armRaise;
        const halon = Math.round(orbR + 5);
        // halo externo
        ctx.fillStyle = `rgba(85,51,255,${(castFr * 0.18).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(lx, orbY, halon, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, orbY, halon, 0, Math.PI * 2); ctx.fill();
        // halo médio
        ctx.fillStyle = `rgba(85,51,255,${(castFr * 0.30).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(lx, orbY, orbR + 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, orbY, orbR + 2, 0, Math.PI * 2); ctx.fill();
        // núcleo
        ctx.fillStyle = `rgba(30,0,120,${orbA})`;
        ctx.beginPath(); ctx.arc(lx, orbY, orbR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, orbY, orbR, 0, Math.PI * 2); ctx.fill();
        // brilho central
        ctx.fillStyle = `rgba(180,140,255,${(castFr * 0.6).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(lx - 1, orbY - 1, orbR * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx - 1, orbY - 1, orbR * 0.35, 0, Math.PI * 2); ctx.fill();
        // tendão
        ctx.strokeStyle = `rgba(100,40,255,${(0.5 * castFr).toFixed(2)})`;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(lx, orbY);
        ctx.lineTo(rx, orbY);
        ctx.stroke();
      }

      // ── Indicador de rifts ativos ──────────────────────────────────────
      if (e.activeRifts && e.activeRifts.length > 0) {
        const dotX = px + e.w + 4;
        const dotY = py + 4;
        for (let i = 0; i < e.activeRifts.length; i++) {
          const dy = dotY + i * 6;
          ctx.fillStyle = 'rgba(85,51,255,0.30)';
          ctx.beginPath(); ctx.arc(dotX, dy, 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#5533ff';
          ctx.beginPath(); ctx.arc(dotX, dy, 2.5, 0, Math.PI * 2); ctx.fill();
        }
      }

      break;
    }

    case 'FLIER':
      // body
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.ellipse(px + e.w / 2, py + e.h / 2, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // wings
      const wingFlap = Math.sin(time * 12) * 6;
      ctx.fillStyle = 'rgba(80,80,180,0.5)';
      ctx.beginPath();
      ctx.ellipse(px - 8, py + e.h / 2 - wingFlap, 10, 5, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px + e.w + 8, py + e.h / 2 + wingFlap, 10, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // eyes
      ctx.fillStyle = '#aaaaff';
      ctx.shadowColor = '#aaaaff';
      ctx.shadowBlur = 6;
      ctx.fillRect(px + e.w / 2 - 3, py + e.h / 2 - 3, 3, 3);
      ctx.fillRect(px + e.w / 2 + 2, py + e.h / 2 - 3, 3, 3);
      break;

    case 'SPECTER': {
      const ss       = e.specterState || 'patrol';
      const isCharge = ss === 'charge';
      const cx2      = px + e.w / 2;
      const floatY   = Math.sin((e.floatT || 0) * 2.8) * 2.5;
      const pulse    = 0.5 + 0.5 * Math.sin((e.floatT || 0) * 4.0);

      // Glow no chão — 2 ellipses empilhadas (sem createRadialGradient)
      const glowBaseAlpha = (0.18 + 0.10 * pulse).toFixed(2);
      ctx.fillStyle = `rgba(136,51,204,${glowBaseAlpha})`;
      ctx.beginPath();
      ctx.ellipse(cx2, py + e.h, e.w * 0.9, e.w * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(136,51,204,${(+glowBaseAlpha * 0.4).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx2, py + e.h, e.w * 1.4, e.w * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cauda espectral
      for (let i = 0; i < 3; i++) {
        const ty2  = py + e.h - 2 + i * 5 + floatY;
        const tw   = (e.w / 2 - 1) * (1 - i * 0.3);
        ctx.fillStyle = `rgba(136,51,204,${(0.35 - i * 0.10).toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(cx2, ty2, tw, 4 - i, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const glowRgb  = isCharge ? '221,136,255' : '136,51,204';
      const glowSize = isCharge ? Math.round(20 + pulse * 10) : Math.round(10 + pulse * 6);
      const g1 = Math.round(glowSize * 0.4);
      const g2 = Math.round(glowSize * 0.7);
      ctx.fillStyle = `rgba(${glowRgb},0.06)`;
      ctx.fillRect(px - g2, py + floatY - g2, e.w + g2 * 2, e.h - 6 + g2 * 2);
      ctx.fillStyle = `rgba(${glowRgb},0.10)`;
      ctx.fillRect(px - g1, py + floatY - g1, e.w + g1 * 2, e.h - 6 + g1 * 2);

      // Corpo
      ctx.fillStyle = e.color;
      ctx.fillRect(px, py + floatY, e.w, e.h - 6);

      // Borda roxa
      ctx.fillStyle = `rgba(136,51,204,${(0.5 + 0.2 * pulse).toFixed(2)})`;
      ctx.fillRect(px,           py + floatY, 2, e.h - 6);
      ctx.fillRect(px + e.w - 2, py + floatY, 2, e.h - 6);
      ctx.fillRect(px,           py + floatY, e.w, 2);

      // Pernas
      ctx.fillStyle  = '#1a0030';
      const legOff   = ss === 'patrol' ? Math.sin(time * 9) * 4 : 0;
      ctx.fillRect(px + 2,       py + e.h - 8 + floatY, 5, 8 + legOff);
      ctx.fillRect(px + e.w - 7, py + e.h - 8 + floatY, 5, 8 - legOff);

      const eyeX     = e.dir > 0 ? px + e.w - 6 : px + 1;
      const eyeRgb   = isCharge ? '255,255,255' : '204,136,255';
      const eg       = isCharge ? 4 : 2;
      ctx.fillStyle  = `rgba(${eyeRgb},0.18)`;
      ctx.fillRect(eyeX - eg, py + 5 + floatY - eg, 5 + eg * 2, 4 + eg * 2);
      ctx.fillStyle  = isCharge ? '#ffffff' : '#cc88ff';
      ctx.fillRect(eyeX, py + 5 + floatY, 5, 4);

      // Anel de aviso (charge)
      if (isCharge) {
        const frac = 1 - (e.chargeTimer / 0.5);
        const radius = e.w * 0.7 + frac * 8;
        ctx.globalAlpha = 0.6 * frac;
        // halo externo (fake glow)
        ctx.lineWidth   = 5;
        ctx.strokeStyle = 'rgba(204,85,255,0.15)';
        ctx.beginPath();
        ctx.arc(cx2, py + e.h / 2 + floatY, radius, 0, Math.PI * 2);
        ctx.stroke();
        // borda fina
        ctx.lineWidth   = 1.2;
        ctx.strokeStyle = '#cc55ff';
        ctx.beginPath();
        ctx.arc(cx2, py + e.h / 2 + floatY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      break;
    }

    case 'MIMIC': {
      const cx2    = px + e.w / 2;
      const ms     = e.mimicState || 'chest';
      const reveal = ms === 'reveal';
      const hunt   = ms === 'hunt';
      const openAmt = reveal ? 1 - (e.revealTimer / 0.6)  // 0→1 enquanto abre
                     : hunt  ? 1 : 0;
 
      // ── Modo baú (chest + reveal) ───────────────────────────────────────
      // Base do baú
      ctx.shadowColor = hunt ? '#ff4400' : '#c8860a';
      ctx.shadowBlur  = hunt ? 12 : 6;
      ctx.fillStyle   = hunt ? '#2a0800' : '#3a2200';
      ctx.fillRect(px, py + 8, e.w, e.h - 8);         // corpo principal
      // faixas metálicas
      ctx.fillStyle = hunt ? '#882200' : '#8b6000';
      ctx.fillRect(px,            py + 8,  e.w, 3);    // topo do corpo
      ctx.fillRect(px,            py + e.h - 3, e.w, 3); // base
      ctx.fillRect(px + e.w/2 - 2, py + 8, 4, e.h - 8);  // faixa central
      // rebites nos cantos
      ctx.fillStyle = '#ffcc44';
      ctx.shadowBlur = 0;
      [[2,2],[e.w-4,2],[2,e.h-6],[e.w-4,e.h-6]].forEach(([rx,ry]) => {
        ctx.beginPath();
        ctx.arc(px + rx, py + 8 + ry, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
 
      // Tampa — só aparece nos modos chest e reveal (some ao virar hunt)
      if (!hunt) {
        ctx.save();
        ctx.translate(px + e.w / 2, py + 8); // pivô no topo do corpo
        ctx.fillStyle   = '#3a2200';
        ctx.shadowColor = '#c8860a';
        ctx.shadowBlur  = 6;
        ctx.fillRect(-e.w / 2, -8, e.w, 8);  // tampa
        // faixa metálica da tampa
        ctx.fillStyle = '#8b6000';
        ctx.fillRect(-e.w / 2, -3, e.w, 3);
        // fechadura
        ctx.fillStyle  = '#ffcc44';
        ctx.shadowBlur = 0;
        ctx.fillRect(-3, -6, 6, 4);
        ctx.fillRect(-1, -3, 2, 3);
        ctx.restore();
      }
 
      // ── Olhos que aparecem dentro do baú ao abrir (reveal) ────────────
      if (!hunt && openAmt > 0.3) {
        const eyeAlpha = Math.min(1, (openAmt - 0.3) / 0.4);
        const eyeY     = py + 10 - openAmt * 4;
        ctx.fillStyle   = `rgba(255, 80, 0, ${eyeAlpha})`;
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur  = 10 * eyeAlpha;
        ctx.beginPath(); ctx.ellipse(cx2 - 5, eyeY, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx2 + 5, eyeY, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
 
      // ── Modo hunt — cabeça monstruosa ciclope emerge do baú ───────────
      if (hunt) {
        const headBob  = Math.sin(time * 6) * 2;
        const headCY   = py + 1 + headBob;
        const eyePulse = 0.85 + 0.15 * Math.sin(time * 9);
        const pupilX   = cx2 + (e.dir || 1) * 2;
 
        // pescoço curto conectando ao baú
        ctx.fillStyle   = '#2a0800';
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur  = 8;
        ctx.fillRect(cx2 - 5, py + 4, 10, 6);
 
        // cabeça principal — elipse escura e irregular
        ctx.fillStyle   = '#1a0500';
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur  = 16;
        ctx.beginPath();
        ctx.ellipse(cx2, headCY, e.w * 0.44, 11, 0, 0, Math.PI * 2);
        ctx.fill();
 
        // verrugas / irregularidades na silhueta
        ctx.fillStyle   = '#150300';
        ctx.shadowBlur  = 0;
        ctx.beginPath();
        ctx.ellipse(cx2 - 9, headCY - 5, 4, 3, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx2 + 9, headCY - 6, 3, 3, 0.5, 0, Math.PI * 2);
        ctx.fill();
 
        // ── Olho único central ──────────────────────────────────────────
        // esclera amarelada
        ctx.fillStyle   = '#ffddaa';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur  = 18;
        ctx.beginPath();
        ctx.ellipse(cx2, headCY - 1, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
 
        // íris laranja pulsante
        ctx.fillStyle   = `rgba(255, 90, 0, ${eyePulse})`;
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur  = 22;
        ctx.beginPath();
        ctx.ellipse(pupilX, headCY - 1, 5.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
 
        // pupila vertical (fenda de réptil)
        ctx.fillStyle  = '#000';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.ellipse(pupilX, headCY - 1, 1.8, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();
 
        // reflexo brilhante no olho
        ctx.fillStyle = 'rgba(255, 240, 180, 0.65)';
        ctx.beginPath();
        ctx.ellipse(pupilX - 2.5, headCY - 3.5, 2, 1.2, -0.4, 0, Math.PI * 2);
        ctx.fill();
 
        // ── Boca com dentes triangulares ────────────────────────────────
        const mouthOpen = 0.35 + 0.45 * Math.abs(Math.sin(time * 4.5));
        const mouthY    = headCY + 7;
 
        // interior escuro da boca
        ctx.fillStyle   = '#060000';
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur  = 6;
        ctx.beginPath();
        ctx.ellipse(cx2, mouthY, 9, 4 * mouthOpen, 0, 0, Math.PI * 2);
        ctx.fill();
 
        // ── Pernas animadas ─────────────────────────────────────────────
        ctx.fillStyle   = '#3a2200';
        ctx.shadowBlur  = 0;
        const legAnim = Math.sin(time * 10) * 3;
        ctx.fillRect(px + 3,       py + e.h - 2, 5, 6 + legAnim);
        ctx.fillRect(px + e.w - 8, py + e.h - 2, 5, 6 - legAnim);
      }
 
      ctx.shadowBlur = 0;
      break;
    }

    case 'BOMBER': {
      const lowHp   = e.hp < e.maxHp * 0.3;
      const flashOn = lowHp && Math.floor(time * 8) % 2 === 0;
      const cx2     = px + e.w / 2;
      const cy2     = py + e.h / 2;
      const pulse   = 0.6 + 0.4 * Math.sin(time * 5);

      // ── Halo de corpo (fake glow externo) ────────────────────────────────
      const bodyRgb = flashOn ? '255,40,0' : '100,0,180';
      ctx.fillStyle = `rgba(${bodyRgb},${(0.06 + 0.04 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, e.w / 2 + 10, e.h / 2 + 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${bodyRgb},${(0.10 + 0.06 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, e.w / 2 + 5, e.h / 2 + 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Orbes orbitando ───────────────────────────────────────────────────
      const orbRgb = flashOn ? '255,50,0' : '120,0,180';
      for (let i = 0; i < 6; i++) {
        const a  = (i / 6) * Math.PI * 2 + time * 2.5;
        const or = 12 + Math.sin(time * 1.4 + i) * 2;
        const ox = cx2 + Math.cos(a) * or;
        const oy = cy2 + Math.sin(a) * or * 0.7;
        const orbA = (0.35 + 0.35 * pulse).toFixed(2);
        // halo do orbe
        ctx.fillStyle = `rgba(${orbRgb},${(+orbA * 0.35).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(ox, oy, 4 + pulse, 0, Math.PI * 2);
        ctx.fill();
        // núcleo
        ctx.fillStyle = `rgba(${orbRgb},${orbA})`;
        ctx.beginPath();
        ctx.arc(ox, oy, 2 + pulse * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Corpo — elipse escura disforme ───────────────────────────────────
      ctx.fillStyle = flashOn ? '#1a0000' : '#0d0018';
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, e.w / 2 - 1, e.h / 2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Borda fina do corpo
      ctx.strokeStyle = `rgba(${bodyRgb},${(0.30 + 0.20 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, e.w / 2 - 1, e.h / 2 - 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      // ── Núcleo interno pulsante ───────────────────────────────────────────
      const coreRgb = flashOn ? '255,80,0' : '160,0,220';
      // halo do núcleo
      ctx.fillStyle = `rgba(${coreRgb},${(0.15 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, 8 * pulse, 8 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${coreRgb},${(0.25 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, 6 * pulse, 6 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      // núcleo sólido
      ctx.fillStyle = `rgba(${coreRgb},${pulse.toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, 4 * pulse, 4 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Olhos — fendas com halo por rects expandidos ──────────────────────
      const eyeRgb = flashOn ? '255,100,0' : '200,68,255';
      // halo dos olhos
      ctx.fillStyle = `rgba(${eyeRgb},0.18)`;
      ctx.fillRect(cx2 - 8, cy2 - 6, 8, 6);
      ctx.fillRect(cx2 + 0, cy2 - 6, 8, 6);
      // fenda
      ctx.fillStyle = flashOn ? '#ff6600' : '#cc44ff';
      ctx.fillRect(cx2 - 6, cy2 - 4, 4, 2);
      ctx.fillRect(cx2 + 2, cy2 - 4, 4, 2);

      // ── Tentáculos ────────────────────────────────────────────────────────
      const sway      = Math.sin(time * 7) * 4;
      const tentRgb   = flashOn ? '80,0,0' : '30,0,50';
      const tentEdge  = flashOn ? '255,40,0' : '100,0,180';
      ctx.lineWidth   = 3;

      // halo do tentáculo (linha mais grossa e transparente atrás)
      ctx.strokeStyle = `rgba(${tentEdge},0.20)`;
      ctx.lineWidth   = 6;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(cx2 - 4, cy2 + e.h / 2 - 4);
      ctx.quadraticCurveTo(cx2 - 8, cy2 + e.h / 2 + 2, cx2 - 5 + sway, cy2 + e.h / 2 + 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx2 + 4, cy2 + e.h / 2 - 4);
      ctx.quadraticCurveTo(cx2 + 8, cy2 + e.h / 2 + 2, cx2 + 5 - sway, cy2 + e.h / 2 + 7);
      ctx.stroke();
      // tentáculo sólido
      ctx.strokeStyle = `rgb(${tentRgb})`;
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.moveTo(cx2 - 4, cy2 + e.h / 2 - 4);
      ctx.quadraticCurveTo(cx2 - 8, cy2 + e.h / 2 + 2, cx2 - 5 + sway, cy2 + e.h / 2 + 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx2 + 4, cy2 + e.h / 2 - 4);
      ctx.quadraticCurveTo(cx2 + 8, cy2 + e.h / 2 + 2, cx2 + 5 - sway, cy2 + e.h / 2 + 7);
      ctx.stroke();

      break;
    }

    case 'SUMMONER': {
      const cx2      = px + e.w / 2;
      const pulse    = 0.5 + 0.5 * Math.sin(time * 3);
      const cast     = e.summonState === 'casting';
      const castFr   = cast ? 1 - (e.castTimer / 1.2) : 0;
      const vulnerable = !e.shielded && e.summonedIds && e.summonedIds.length === 0;
      const vulnFlash  = vulnerable && Math.floor(time * 6) % 2 === 0;
      const bodyColor  = vulnFlash ? '#3a0000' : '#0a0015';
      const glowRgb    = vulnerable ? '255,51,51' : '170,0,255';

      if (e.shielded) {
        const shieldR   = e.w / 2 + 10 + Math.sin(e.shieldPulse * 4) * 2;
        const shieldRot = e.shieldPulse * 1.5;
        const shieldA   = (0.3 + 0.3 * pulse).toFixed(2);

        ctx.strokeStyle = `rgba(200,0,255,${(+shieldA * 0.35).toFixed(2)})`;
        ctx.lineWidth   = 5;
        ctx.beginPath(); ctx.arc(cx2, py + e.h / 2, shieldR + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(180,0,255,${shieldA})`;
        ctx.lineWidth   = 2;
        ctx.beginPath(); ctx.arc(cx2, py + e.h / 2, shieldR, 0, Math.PI * 2); ctx.stroke();

        // orbes orbitando — desenhados sem save/rotate (cálculo direto)
        ctx.fillStyle = `rgba(220,80,255,${shieldA})`;
        const cosRot = Math.cos(shieldRot), sinRot = Math.sin(shieldRot);
        for (let i = 0; i < 6; i++) {
          const a  = (i / 6) * Math.PI * 2;
          const ca = Math.cos(a) * shieldR * 0.85;
          const sa = Math.sin(a) * shieldR * 0.85;
          // rotação manual: evita ctx.save/translate/rotate
          const ox = cx2 + ca * cosRot - sa * sinRot;
          const oy = (py + e.h / 2) + ca * sinRot + sa * cosRot;
          // halo do orbe
          ctx.fillStyle = `rgba(200,0,255,${(+shieldA * 0.30).toFixed(2)})`;
          ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill();
          // núcleo
          ctx.fillStyle = `rgba(220,80,255,${shieldA})`;
          ctx.beginPath(); ctx.arc(ox, oy, 3, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ── Aura do corpo — fake glow (rects expandidos) ───────────────────
      const auraA1 = (vulnerable ? 0.12 : 0.05).toFixed(2);
      const auraA2 = (vulnerable ? 0.20 : 0.10).toFixed(2);
      ctx.fillStyle = `rgba(${glowRgb},${auraA1})`;
      ctx.fillRect(cx2 - e.w / 2 - 8, py - 4, e.w + 16, e.h + 8);
      ctx.fillStyle = `rgba(${glowRgb},${auraA2})`;
      ctx.fillRect(cx2 - e.w / 2 - 3, py - 1, e.w + 6, e.h + 3);

      // ── Robe — trapézio largo ──────────────────────────────────────────
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(cx2 - 3,          py + 14);
      ctx.lineTo(cx2 + 3,          py + 14);
      ctx.lineTo(cx2 + e.w / 2,    py + e.h);
      ctx.lineTo(cx2 - e.w / 2,    py + e.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = vulnFlash ? '#550000' : '#2a0044';
      ctx.lineWidth   = 1;
      ctx.stroke();

      // ── Crânio ─────────────────────────────────────────────────────────
      ctx.fillStyle = vulnFlash ? '#5a1010' : '#1e0030';
      ctx.beginPath();
      ctx.arc(cx2, py + 8, 8, Math.PI, 0);
      ctx.lineTo(cx2 + 6, py + 13);
      ctx.lineTo(cx2 - 6, py + 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = vulnFlash ? '#4a0808' : '#160024';
      ctx.fillRect(cx2 - 5, py + 12, 10, 5);
      ctx.fillStyle = '#ccbbdd';
      ctx.fillRect(cx2 - 4, py + 14, 2, 3);
      ctx.fillRect(cx2 - 1, py + 14, 2, 3);
      ctx.fillRect(cx2 + 2, py + 14, 2, 3);

      // ── Olhos — fake glow por camadas ─────────────────────────────────
      const eyeRgb = cast ? '255,136,255' : (vulnerable ? '255,34,0' : `${Math.round(180+75*pulse)},0,255`);
      const eyeA   = (cast ? (0.8 + 0.2 * castFr) : (0.7 + 0.3 * pulse)).toFixed(2);
      // soquetes
      ctx.fillStyle = '#000000';
      ctx.beginPath(); ctx.ellipse(cx2 - 3, py + 7, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx2 + 3, py + 7, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
      // halo externo
      ctx.fillStyle = `rgba(${eyeRgb},${(+eyeA * 0.30).toFixed(2)})`;
      ctx.fillRect(cx2 - 6, py + 4, 7, 7);
      ctx.fillRect(cx2 - 1, py + 4, 7, 7);
      // brilho interno
      ctx.fillStyle = `rgba(${eyeRgb},${eyeA})`;
      ctx.beginPath(); ctx.ellipse(cx2 - 3, py + 7, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx2 + 3, py + 7, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();

      // ── Costelas ────────────────────────────────────────────────────────
      ctx.strokeStyle = vulnFlash ? '#330000' : '#3a0055';
      ctx.lineWidth   = 1;
      for (let r = 0; r < 3; r++) {
        const ry = py + 17 + r * 4;
        const rw = 4 + r * 2;
        ctx.beginPath();
        ctx.moveTo(cx2 - 1, ry);
        ctx.quadraticCurveTo(cx2 - rw, ry + 1, cx2 - rw - 1, ry + 3);
        ctx.moveTo(cx2 + 1, ry);
        ctx.quadraticCurveTo(cx2 + rw, ry + 1, cx2 + rw + 1, ry + 3);
      }
      ctx.stroke();

      // ── Braços ossudos — agrupados ──────────────────────────────────────
      const armRaise = cast ? -10 * castFr : 0;
      const armY     = py + 16;
      ctx.strokeStyle = vulnFlash ? '#5a1010' : '#1e0030';
      ctx.lineWidth   = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx2 - 3, armY);             ctx.lineTo(cx2 - 9, armY + 4 + armRaise);
      ctx.moveTo(cx2 - 9, armY + 4 + armRaise); ctx.lineTo(cx2 - e.w / 2 - 3, armY - 2 + armRaise);
      ctx.moveTo(cx2 + 3, armY);             ctx.lineTo(cx2 + 9, armY + 4 + armRaise);
      ctx.moveTo(cx2 + 9, armY + 4 + armRaise); ctx.lineTo(cx2 + e.w / 2 + 3, armY - 2 + armRaise);
      ctx.stroke();
      // juntas dos cotovelos
      ctx.fillStyle = vulnFlash ? '#5a1010' : '#1e0030';
      ctx.beginPath(); ctx.arc(cx2 - 9, armY + 4 + armRaise, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx2 + 9, armY + 4 + armRaise, 2, 0, Math.PI * 2); ctx.fill();

      // ── Orbes nas mãos durante cast — fake glow ────────────────────────
      if (cast) {
        const orbR = 3 + castFr * 4;
        const lx   = cx2 - e.w / 2 - 3;
        const rx   = cx2 + e.w / 2 + 3;
        const oy   = armY - 2 + armRaise;
        // halo externo
        ctx.fillStyle = `rgba(220,100,255,${(castFr * 0.20).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(lx, oy, orbR + 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, oy, orbR + 6, 0, Math.PI * 2); ctx.fill();
        // halo médio
        ctx.fillStyle = `rgba(220,100,255,${(castFr * 0.35).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(lx, oy, orbR + 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, oy, orbR + 2, 0, Math.PI * 2); ctx.fill();
        // núcleo
        ctx.fillStyle = `rgba(220,100,255,${(0.5 + 0.5 * castFr).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(lx, oy, orbR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, oy, orbR, 0, Math.PI * 2); ctx.fill();
        // brilho branco central
        ctx.fillStyle = `rgba(255,220,255,${(0.6 * castFr).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(lx - 1, oy - 1, orbR * 0.38, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx - 1, oy - 1, orbR * 0.38, 0, Math.PI * 2); ctx.fill();
        // linha de energia
        ctx.strokeStyle = `rgba(238,150,255,${(castFr * 0.8).toFixed(2)})`;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(lx, oy);
        ctx.lineTo(rx, oy);
        ctx.stroke();
      }

      break;
    }

    case 'GHOST': {
      const gs      = e.ghostState || 'intangible';
      const cx2     = px + e.w / 2;
      const cy2     = py + e.h / 2;
      const floatY  = Math.sin((e.floatT || 0) * 2.2) * 3;
      const pulse   = 0.5 + 0.5 * Math.sin((e.floatT || 0) * 3);
 
      // Opacidade varia com o estado
      const alpha = gs === 'intangible'    ? 0.28 + 0.12 * pulse
                  : gs === 'materializing' ? 0.28 + 0.7 * (1 - (e.stateTimer / 0.6))
                  : /* material */           0.92;
 
      ctx.save();
      ctx.globalAlpha = alpha;
 
      // Cauda fantasmagórica (3 elipses decrescentes abaixo do corpo)
      for (let i = 0; i < 3; i++) {
        const ty2  = cy2 + e.h / 2 - 2 + i * 5 + floatY;
        const tw   = (e.w / 2 - 2) * (1 - i * 0.28);
        const th   = 5 - i * 1.2;
        const talpha = 0.6 - i * 0.18;
        ctx.fillStyle = `rgba(180,210,255,${talpha})`;
        ctx.beginPath();
        ctx.ellipse(cx2, ty2, tw, th, 0, 0, Math.PI * 2);
        ctx.fill();
      }
 
      // Corpo principal — elipse translúcida azul-fria
      ctx.shadowColor = gs === 'material' ? '#aaddff' : '#6699cc';
      ctx.shadowBlur  = gs === 'material' ? 18 : 8;
      ctx.fillStyle   = gs === 'material' ? '#cce8ff' : '#8ab4d8';
      ctx.beginPath();
      ctx.ellipse(cx2, cy2 - 2 + floatY, e.w / 2, e.h / 2 - 1, 0, 0, Math.PI * 2);
      ctx.fill();
 
      // Brilho interno
      ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.2 * pulse})`;
      ctx.beginPath();
      ctx.ellipse(cx2 - 3, cy2 - 5 + floatY, e.w / 4, e.h / 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
 
      // Olhos — duas manchas escuras vazias
      const eyeAlpha = gs === 'material' ? 0.9 : 0.5 + 0.3 * pulse;
      ctx.fillStyle  = `rgba(10,10,30,${eyeAlpha})`;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(cx2 - 5, cy2 - 3 + floatY, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx2 + 5, cy2 - 3 + floatY, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
 
      // Quando materializando — anel de aviso pulsante
      if (gs === 'materializing') {
        const frac = 1 - (e.stateTimer / 0.6);
        ctx.globalAlpha = frac * 0.7;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1.5;
        ctx.shadowColor = '#aaddff';
        ctx.shadowBlur  = 10;
        ctx.beginPath();
        ctx.arc(cx2, cy2 + floatY, (e.w / 2 + 4) * (1 + frac * 0.3), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Windup de disparo — anel de carga azul-gelo crescendo ao redor do ghost
      if (gs === 'intangible' && e.isWindup) {
        const wFrac  = Math.max(0, 1 - (e.windupTimer / 0.55)); // 0→1 durante o windup
        const wPulse = Math.abs(Math.sin(time * 18));
        const wR     = e.w * 0.55 + wFrac * e.w * 0.45;

        ctx.globalAlpha = (0.45 + 0.40 * wFrac) * alpha;

        // halo externo difuso
        ctx.strokeStyle = `rgba(180,230,255,${(0.18 + 0.20 * wFrac).toFixed(2)})`;
        ctx.lineWidth   = 5;
        ctx.shadowColor = '#aaddff';
        ctx.shadowBlur  = 8 + wFrac * 10;
        ctx.beginPath(); ctx.arc(cx2, cy2 + floatY, wR + 4, 0, Math.PI * 2); ctx.stroke();

        // anel fino brilhante
        ctx.strokeStyle = `rgba(220,245,255,${(0.55 + 0.40 * wFrac).toFixed(2)})`;
        ctx.lineWidth   = 1.2;
        ctx.beginPath(); ctx.arc(cx2, cy2 + floatY, wR, 0, Math.PI * 2); ctx.stroke();

        // 4 nós orbitando no anel (telepáticos/etéreos)
        ctx.shadowBlur = 6;
        for (let i = 0; i < 4; i++) {
          const na  = (i / 4) * Math.PI * 2 + time * 3.5;
          const nx  = cx2 + Math.cos(na) * wR;
          const ny  = cy2 + floatY + Math.sin(na) * wR;
          ctx.fillStyle = `rgba(200,235,255,${(0.40 + 0.55 * wFrac * wPulse).toFixed(2)})`;
          ctx.beginPath(); ctx.arc(nx, ny, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur  = 0;
      }
 
      ctx.restore();
      break;
    }

    case 'GUNNER': {
      // Fake glow amarelado ao redor do corpo
      ctx.fillStyle = 'rgba(170,170,34,0.10)';
      ctx.fillRect(px - 5, py - 5, e.w + 10, e.h + 10);
      ctx.fillStyle = 'rgba(170,170,34,0.18)';
      ctx.fillRect(px - 2, py - 2, e.w + 4, e.h + 4);

      // Corpo
      ctx.fillStyle = e.color;
      ctx.fillRect(px, py, e.w, e.h);

      // Cano da arma
      const isCharging = e.gunState === 'charge';
      const gunLen = 10;
      const gx = px + e.w / 2;
      const gy = py + e.h / 2 - 2;
      const gAngle = (isCharging && e.aimDir)
        ? Math.atan2(e.aimDir.y, e.aimDir.x)
        : (e.dir > 0 ? 0 : Math.PI);

      ctx.strokeStyle = e.edgeColor;
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + Math.cos(gAngle) * gunLen, gy + Math.sin(gAngle) * gunLen);
      ctx.stroke();

      // Olhos
      ctx.fillStyle = e.edgeColor;
      ctx.fillRect(px + (e.dir > 0 ? e.w - 5 : 0), py + 4, 5, 4);

      // Pernas
      ctx.fillStyle = '#3a3a00';
      const legOff2 = isCharging ? 0 : Math.sin(time * 8) * 4;
      ctx.fillRect(px + 2,       py + e.h - 8, 6, 8 + legOff2);
      ctx.fillRect(px + e.w - 8, py + e.h - 8, 6, 8 - legOff2);

      if (isCharging) {
        const tipX = gx + Math.cos(gAngle) * gunLen;
        const tipY = gy + Math.sin(gAngle) * gunLen;
        const frac = 1 - (e.chargeTimer / 0.45);
        const r    = 2 + frac * 5;

        // halo externo
        ctx.fillStyle = `rgba(255,255,0,${(0.12 + frac * 0.10).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(tipX, tipY, r + 6, 0, Math.PI * 2);
        ctx.fill();
        // halo médio
        ctx.fillStyle = `rgba(255,255,0,${(0.20 + frac * 0.15).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(tipX, tipY, r + 3, 0, Math.PI * 2);
        ctx.fill();
        // núcleo brilhante
        ctx.fillStyle = `rgba(255,255,${Math.round(frac * 200)},${(0.5 + frac * 0.5).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(tipX, tipY, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'SHOOTER': {
      const ex = px;
      const ey = py;
      const ew = e.w;
      const eh = e.h;
      const cx = ex + ew / 2;

      // ── Base da torre ─────────────────────────────────────────────────
      ctx.fillStyle = '#3d1a3d';
      ctx.fillRect(ex - 3, ey + eh * 0.5, ew + 6, eh * 0.5);

      ctx.fillStyle = '#4e224e';
      ctx.fillRect(ex - 3, ey + eh * 0.5,     ew + 6, 2);
      ctx.fillRect(cx - 1, ey + eh * 0.5 + 2, 2, eh * 0.5 - 2);

      ctx.fillStyle = '#5e2a5e';
      ctx.fillRect(ex - 3, ey + eh * 0.5, 2, eh * 0.5);

      // ── Corpo da torre ────────────────────────────────────────────────
      ctx.fillStyle = '#4a1f4a';
      ctx.fillRect(ex, ey + eh * 0.2, ew, eh * 0.35);

      ctx.fillStyle = '#2e122e';
      ctx.fillRect(ex,          ey + eh * 0.2,      ew / 2, 2);
      ctx.fillRect(ex + ew / 2, ey + eh * 0.2 + 8,  ew / 2, 2);
      ctx.fillRect(ex,          ey + eh * 0.2 + 16,  ew / 2, 2);

      ctx.fillStyle = '#7a3a7a';
      ctx.fillRect(ex, ey + eh * 0.2, 2, eh * 0.35);

      // ── Ameias do topo ────────────────────────────────────────────────
      ctx.fillStyle = '#3d1a3d';
      ctx.fillRect(ex - 2,      ey, 8, eh * 0.22);
      ctx.fillRect(cx - 3,      ey, 7, eh * 0.22);
      ctx.fillRect(ex + ew - 6, ey, 8, eh * 0.22);

      ctx.fillStyle = '#200e20';
      ctx.fillRect(ex + 6, ey, cx - ex - 9,       eh * 0.22);
      ctx.fillRect(cx + 4, ey, ex + ew - cx - 10, eh * 0.22);

      ctx.fillStyle = '#7a3a7a';
      ctx.fillRect(ex - 2,      ey, 2, eh * 0.22);
      ctx.fillRect(cx - 3,      ey, 2, eh * 0.22);
      ctx.fillRect(ex + ew - 6, ey, 2, eh * 0.22);

      // ── Olho mágico ───────────────────────────────────────────────────
      ctx.fillStyle = '#1a0a1a';
      ctx.fillRect(ex + 4, ey + eh * 0.32, ew - 8, 7);

      ctx.fillStyle = '#9b59b6';
      ctx.fillRect(cx - 4, ey + eh * 0.32 + 2, 8, 3);

      ctx.fillStyle = '#c07de0';
      ctx.fillRect(cx - 2, ey + eh * 0.32 + 2, 4, 3);

      ctx.fillStyle = '#e8c0f8';
      ctx.fillRect(cx - 1, ey + eh * 0.32 + 2, 1, 1);

      break;
    }

    case 'DASHER': {
      const isWindup  = e.dashState === 'windup';
      const isDashing = e.dashState === 'dashing';
      const isStunned = e.dashState === 'stunned';
 
      // Corpo
      ctx.fillStyle = isStunned ? '#3a2a4e' : e.color;
      ctx.shadowBlur  = isDashing ? 20 : 8;
      ctx.shadowColor = e.edgeColor;
      ctx.beginPath();
      ctx.ellipse(px + e.w / 2, py + e.h / 2, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
 
      // Chifres / antenas
      ctx.strokeStyle = e.edgeColor;
      ctx.lineWidth   = 2;
      const hornDir = e.dashDir ?? e.dir;
      ctx.beginPath();
      ctx.moveTo(px + e.w / 2 - 5, py + 4);
      ctx.lineTo(px + e.w / 2 - 5 - hornDir * 4, py - 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + e.w / 2 + 5, py + 4);
      ctx.lineTo(px + e.w / 2 + 5 + hornDir * 4, py - 5);
      ctx.stroke();
 
      // Olhos — pulsam no windup, giram no stun
      ctx.fillStyle   = isStunned ? '#ffff44' : '#aa22ff';
      ctx.shadowColor = isStunned ? '#ffff44' : '#aa22ff';
      ctx.shadowBlur  = isWindup ? 18 + Math.sin(time * 20) * 10 : 8;
      const eyeSize = isWindup ? 5 + Math.abs(Math.sin(time * 15)) * 3 : 4;
      ctx.beginPath();
      ctx.arc(px + e.w / 2 - 4, py + e.h / 2 - 2, eyeSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + e.w / 2 + 4, py + e.h / 2 - 2, eyeSize / 2, 0, Math.PI * 2);
      ctx.fill();
 
      // Indicador de dash — risco na frente
      if (isWindup) {
        ctx.strokeStyle = `rgba(170,34,255,${0.4 + 0.5 * Math.abs(Math.sin(time * 15))})`;
        ctx.lineWidth   = 2;
        ctx.setLineDash([3, 3]);
        const rx = px + e.w / 2 + (e.dashDir > 0 ? e.w / 2 : -e.w / 2);
        ctx.beginPath();
        ctx.moveTo(rx, py + e.h / 2);
        ctx.lineTo(rx + e.dashDir * 24, py + e.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
 
      // Espiral atordoado
      if (isStunned) {
        ctx.strokeStyle = 'rgba(255,255,100,0.6)';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.2) {
          const r  = 4 + a;
          const sx = px + e.w / 2 + Math.cos(a + time * 6) * r;
          const sy = py - 6 - Math.sin(a + time * 6) * r * 0.5;
          a === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
      break;
    }

    case 'SENTINEL': {
      const cx       = px + e.w / 2;
      const cy       = py + e.h / 2;
      const angle    = e.shootAngle || 0;
      const radius   = e.w / 2;
      const charging = e.shootCool < 0.6;
      const pulse    = 0.5 + 0.5 * Math.sin(time * (charging ? 9 : 3));

      // ── Anel de halo externo difuso (fake glow do corpo) ─────────────────
      ctx.fillStyle = charging
        ? `rgba(255,51,0,${(0.06 + 0.05 * pulse).toFixed(2)})`
        : `rgba(255,51,0,0.04)`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = charging
        ? `rgba(255,80,0,${(0.10 + 0.06 * pulse).toFixed(2)})`
        : `rgba(255,51,0,0.07)`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
      ctx.fill();

      // ── Anel externo rotativo com 8 canhões ──────────────────────────────
      for (let i = 0; i < 8; i++) {
        const a   = (i / 8) * Math.PI * 2 + angle;
        const r1  = radius - 1;
        const r2  = radius + 7;
        const ex  = Math.cos(a);
        const ey  = Math.sin(a);
        const isPrimary = i % 2 === 0;

        // Halo do canhão (círculo difuso na ponta)
        ctx.fillStyle = isPrimary
          ? `rgba(255,51,0,${charging ? 0.18 : 0.09})`
          : `rgba(255,80,0,${charging ? 0.10 : 0.05})`;
        ctx.beginPath();
        ctx.arc(cx + ex * r2, cy + ey * r2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Traço do canhão
        ctx.strokeStyle = isPrimary
          ? (charging ? '#ff5500' : e.edgeColor)
          : `rgba(255,80,0,${charging ? 0.7 : 0.4})`;
        ctx.lineWidth = isPrimary ? 2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + ex * r1, cy + ey * r1);
        ctx.lineTo(cx + ex * r2, cy + ey * r2);
        ctx.stroke();
      }

      // ── Corpo central ────────────────────────────────────────────────────
      // Camada de halo interno
      ctx.fillStyle = `rgba(180,0,0,${(0.12 + 0.06 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 1, 0, Math.PI * 2);
      ctx.fill();
      // Face
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
      ctx.fill();
      // Anel de borda fino
      ctx.strokeStyle = `rgba(255,51,0,${charging ? 0.55 : 0.28})`;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
      ctx.stroke();

      // ── Iris (olho central) ───────────────────────────────────────────────
      const pulseR   = charging ? 7 + pulse * 3 : 5;
      const eyeAlpha = (charging ? 0.85 + 0.15 * pulse : 0.70).toFixed(2);

      // Halo do olho em camadas
      ctx.fillStyle = charging
        ? `rgba(255,200,150,${(0.12 + 0.10 * pulse).toFixed(2)})`
        : `rgba(255,80,0,0.07)`;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = charging
        ? `rgba(255,150,80,${(0.20 + 0.12 * pulse).toFixed(2)})`
        : `rgba(255,51,0,0.12)`;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR + 3, 0, Math.PI * 2);
      ctx.fill();
      // Núcleo do olho
      ctx.fillStyle = charging
        ? `rgba(255,240,220,${eyeAlpha})`
        : `rgba(255,51,0,${eyeAlpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.fill();

      // Pupila
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Reflexo especular (ponto branco pequeno)
      ctx.fillStyle = `rgba(255,255,255,${charging ? 0.60 : 0.30})`;
      ctx.beginPath();
      ctx.arc(cx - pulseR * 0.28, cy - pulseR * 0.30, pulseR * 0.22, 0, Math.PI * 2);
      ctx.fill();

      break;
    }

    case 'JUMPER': {
      // corpo comprimido quando no chão, esticado no ar
      const squash  = e.onGround ? 1.2 : 0.75;
      const stretch = e.onGround ? 0.8 : 1.3;
      const jw  = e.w * squash;
      const jh  = e.h * stretch;
      const joy = e.h - jh;
      // corpo
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.ellipse(px + e.w / 2, py + joy + jh / 2, jw / 2, jh / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // padrão de escamas
      ctx.fillStyle = e.edgeColor;
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(px + e.w / 2, py + joy + jh * (0.25 + i * 0.25), jw * 0.35, jh * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // olhos
      const eyeY = py + joy + jh * 0.25;
      ctx.fillStyle = '#aaffaa';
      ctx.shadowColor = '#4a8a1a';
      ctx.shadowBlur = 8;
      ctx.fillRect(px + e.w / 2 - 6, eyeY, 4, 4);
      ctx.fillRect(px + e.w / 2 + 2, eyeY, 4, 4);
      // rastro de salto
      if (!e.onGround) {
        ctx.fillStyle = 'rgba(74,138,26,0.3)';
        ctx.beginPath();
        ctx.ellipse(px + e.w / 2, py + e.h, jw * 0.4, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  } // fim do switch

  // HP bar
  if (e.hp < e.maxHp &&
      !(e.type === 'MIMIC' && e.mimicState === 'chest') &&
      !(e.type === 'REVENANT' && (e.rvState === 'dead_temp' || e.rvState === 'rising'))) {
    ctx.filter = 'none';
    ctx.fillStyle = '#111';
    ctx.fillRect(px, py - 7, e.w, 4);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(px, py - 7, e.w * (e.hp / e.maxHp), 4);
  }
  ctx.restore();
  e.hitFlash = Math.max(0, e.hitFlash - 1 / 60);
}

function drawSingularityMirrors(map, cam, time) {
  if (!map.singularityMirrors || map.singularityMirrors.length === 0) return;

  map.singularityMirrors.forEach((m, idx) => {
    const bx   = m.tx * TILE + TILE / 2 - cam.x;
    const by   = (m.ty + 1) * TILE       - cam.y;
    const seed = idx * 6.13 + 1.77;

    // Culling
    if (bx < -80 || bx > W + 80 || by < -130 || by > H + 20) return;

    ctx.save();

    // ── Dimensões gerais ──────────────────────────────────────────────────
    const fW   = 36;   // largura total da moldura
    const fH   = 56;   // altura total (~1.75 tiles)
    const bord = 6;    // espessura da borda de pedra
    const capH = 8;    // altura da verga (topo da moldura) — levemente arqueada
    const baseH= 10;   // altura do pedestal (base)
    const baseW= fW + 8; // base mais larga que a moldura

    const fX = bx - fW / 2;           // topo-esq da moldura
    const fY = by - fH - baseH;       // topo da moldura
    const mirX = fX + bord;           // topo-esq da superfície interna
    const mirY = fY + capH;           // topo da superfície interna
    const mirW = fW - bord * 2;       // largura da superfície
    const mirH = fH - capH - bord;    // altura da superfície
    const mirCX = mirX + mirW / 2;    // centro X da superfície
    const mirCY = mirY + mirH / 2;    // centro Y da superfície

    // ── Helper: pedra mística (gradiente H arroxeado escuro) ─────────────
    function mysticStone(x0, x1, lit = false) {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      if (lit) {
        g.addColorStop(0,   '#2e1050');
        g.addColorStop(0.25,'#3a1860');
        g.addColorStop(0.6, '#301450');
        g.addColorStop(1,   '#1c0830');
      } else {
        g.addColorStop(0,   '#180830');
        g.addColorStop(0.3, '#220c40');
        g.addColorStop(0.7, '#1e0a38');
        g.addColorStop(1,   '#0e0418');
      }
      return g;
    }

    // ── Sombra no chão ────────────────────────────────────────────────────
    const shdG = ctx.createRadialGradient(bx, by, 0, bx, by, 28);
    shdG.addColorStop(0, 'rgba(0,0,0,0.45)');
    shdG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shdG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 28, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Pedestal (base) ───────────────────────────────────────────────────
    const baseX = bx - baseW / 2;
    const baseY = by - baseH;
    // corpo trapezoidal
    ctx.fillStyle = mysticStone(baseX, baseX + baseW);
    ctx.beginPath();
    ctx.moveTo(baseX + 3,          baseY);
    ctx.lineTo(baseX + baseW - 3,  baseY);
    ctx.lineTo(baseX + baseW,      by);
    ctx.lineTo(baseX,              by);
    ctx.closePath();
    ctx.fill();
    // aresta topo iluminada
    ctx.fillStyle = 'rgba(160,80,255,0.30)';
    ctx.fillRect(baseX + 3, baseY, baseW - 6, 1);
    // aresta inferior escura
    ctx.fillStyle = 'rgba(0,0,0,0.50)';
    ctx.fillRect(baseX, by - 1, baseW, 1);
    // chanfro esq
    ctx.fillStyle = 'rgba(160,80,255,0.10)';
    ctx.fillRect(baseX, baseY, 1, baseH);
    // chanfro dir — sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(baseX + baseW - 1, baseY, 1, baseH);
    // runa entalhada na base
    ctx.strokeStyle = 'rgba(160,60,240,0.40)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bx - 7, baseY + 4);
    ctx.lineTo(bx,     baseY + 7);
    ctx.lineTo(bx + 7, baseY + 4);
    ctx.moveTo(bx,     baseY + 2);
    ctx.lineTo(bx,     baseY + 8);
    ctx.stroke();

    // ── Pilares laterais da moldura ───────────────────────────────────────
    const pilH = fH - capH;
    const pilY = fY + capH;

    // Pilar esquerdo
    ctx.fillStyle = mysticStone(fX, fX + bord);
    ctx.fillRect(fX, pilY, bord, pilH);
    ctx.fillStyle = 'rgba(160,80,255,0.18)';   // aresta esq iluminada
    ctx.fillRect(fX, pilY, 1, pilH);
    ctx.fillStyle = 'rgba(0,0,0,0.40)';         // aresta dir em sombra
    ctx.fillRect(fX + bord - 1, pilY, 1, pilH);
    // estria vertical decorativa
    ctx.fillStyle = 'rgba(120,40,200,0.20)';
    ctx.fillRect(fX + 2, pilY + 4, 1, pilH - 8);
    ctx.fillRect(fX + 4, pilY + 6, 1, pilH - 12);

    // Pilar direito
    const rPilX = fX + fW - bord;
    ctx.fillStyle = mysticStone(rPilX, rPilX + bord);
    ctx.fillRect(rPilX, pilY, bord, pilH);
    ctx.fillStyle = 'rgba(160,80,255,0.10)';
    ctx.fillRect(rPilX, pilY, 1, pilH);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(rPilX + bord - 1, pilY, 1, pilH);
    ctx.fillStyle = 'rgba(120,40,200,0.18)';
    ctx.fillRect(rPilX + 1, pilY + 4, 1, pilH - 8);
    ctx.fillRect(rPilX + 3, pilY + 6, 1, pilH - 12);

    // Barra inferior da moldura
    ctx.fillStyle = mysticStone(fX, fX + fW, true);
    ctx.fillRect(fX, pilY + pilH - bord, fW, bord);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(fX, pilY + pilH - 1, fW, 1);

    // ── Verga superior (arco levemente pontiagudo) ────────────────────────
    // Forma: trapézio com o topo chanfrado — leve arco gótico
    ctx.fillStyle = mysticStone(fX - 2, fX + fW + 2, true);
    ctx.beginPath();
    ctx.moveTo(fX - 2,        fY + capH);          // base-esq
    ctx.lineTo(fX + fW + 2,   fY + capH);          // base-dir
    ctx.lineTo(fX + fW,       fY + 2);             // topo-dir
    ctx.lineTo(fX + fW / 2,   fY);                 // ponta central (gótico leve)
    ctx.lineTo(fX,             fY + 2);             // topo-esq
    ctx.closePath();
    ctx.fill();
    // aresta topo — linha de luz roxa
    ctx.strokeStyle = 'rgba(180,80,255,0.45)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(fX,             fY + 2);
    ctx.lineTo(fX + fW / 2,   fY);
    ctx.lineTo(fX + fW,       fY + 2);
    ctx.stroke();
    // aresta inferior da verga (sombra sobre o espelho)
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(fX - 2, fY + capH - 1, fW + 4, 1);
    // pedra entalhada: círculo com olho no centro da verga
    const vCX = bx;
    const vCY = fY + capH * 0.52;
    ctx.strokeStyle = 'rgba(200,100,255,0.50)';
    ctx.lineWidth   = 0.8;
    ctx.beginPath();
    ctx.arc(vCX, vCY, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(140,40,220,0.45)';
    ctx.beginPath();
    ctx.arc(vCX, vCY, 2, 0, Math.PI * 2);
    ctx.fill();
    // pupila brilhante
    const eyePulse = 0.5 + 0.5 * Math.sin(time * 3.1 + seed);
    ctx.fillStyle = `rgba(220,120,255,${(0.50 + 0.35 * eyePulse).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(vCX, vCY, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // ── Superfície do espelho — efeito de distorção/vórtice ──────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(mirX, mirY, mirW, mirH);
    ctx.clip();

    // Fundo abissal do espelho
    const bgG = ctx.createLinearGradient(mirX, mirY, mirX, mirY + mirH);
    bgG.addColorStop(0,   '#06000f');
    bgG.addColorStop(0.4, '#0a0018');
    bgG.addColorStop(1,   '#04000a');
    ctx.fillStyle = bgG;
    ctx.fillRect(mirX, mirY, mirW, mirH);

    // Ondas concêntricas distorcidas — anéis elípticos com fase variável
    const numRings = 6;
    const spinT    = time * 0.55 + seed;
    for (let ri = 0; ri < numRings; ri++) {
      const phase  = ri / numRings;
      const wave   = (time * 0.8 + seed + phase * 2.1) % (Math.PI * 2);
      const expand = phase + 0.12 * Math.sin(wave);
      const rx     = (mirW * 0.52) * expand;
      const ry     = (mirH * 0.52) * expand;
      if (rx < 0.5 || ry < 0.5) continue;

      const alpha = (0.28 - phase * 0.04 + 0.08 * Math.sin(wave + ri)) * (1 - expand * 0.4);
      if (alpha <= 0) continue;

      // Cor alterna levemente entre roxo frio e violeta quente
      const r = 100 + Math.round(60 * Math.sin(ri * 1.3));
      const b = 220 + Math.round(35 * Math.cos(ri * 0.9));
      ctx.strokeStyle = `rgba(${r},0,${b},${alpha.toFixed(2)})`;
      ctx.lineWidth   = 1.1 - phase * 0.4;

      // Elipse levemente rotacionada — simula a distorção do vórtice
      ctx.save();
      ctx.translate(mirCX, mirCY);
      ctx.rotate(spinT * (ri % 2 === 0 ? 0.06 : -0.04) + ri * 0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry * 0.72, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Raios irradiando do centro — 8 linhas tênues como luz "vazando"
    const rayT = time * 0.30 + seed;
    for (let ri = 0; ri < 8; ri++) {
      const a     = (ri / 8) * Math.PI * 2 + rayT;
      const alpha = (0.07 + 0.05 * Math.sin(time * 1.4 + seed + ri)).toFixed(2);
      ctx.strokeStyle = `rgba(180,60,255,${alpha})`;
      ctx.lineWidth   = 0.6;
      ctx.beginPath();
      ctx.moveTo(mirCX, mirCY);
      ctx.lineTo(mirCX + Math.cos(a) * mirW * 0.6, mirCY + Math.sin(a) * mirH * 0.55);
      ctx.stroke();
    }

    // Núcleo central — gradiente radial do centro (mais brilhante) para fora
    const coreP  = 0.5 + 0.5 * Math.sin(time * 2.3 + seed);
    const coreRx = mirW * (0.18 + 0.06 * coreP);
    const coreRy = mirH * (0.14 + 0.04 * coreP);
    const coreG  = ctx.createRadialGradient(mirCX, mirCY, 0, mirCX, mirCY, coreRx);
    coreG.addColorStop(0,   `rgba(220,120,255,${(0.55 + 0.30 * coreP).toFixed(2)})`);
    coreG.addColorStop(0.35,`rgba(160, 40,230,${(0.28 + 0.18 * coreP).toFixed(2)})`);
    coreG.addColorStop(0.70,`rgba(100,  0,180,${(0.10 + 0.08 * coreP).toFixed(2)})`);
    coreG.addColorStop(1,   'rgba(60,0,120,0)');
    ctx.fillStyle = coreG;
    ctx.beginPath();
    ctx.ellipse(mirCX, mirCY, coreRx, coreRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ponto de singularidade — pixel puro no centro
    ctx.fillStyle = `rgba(255,220,255,${(0.70 + 0.28 * coreP).toFixed(2)})`;
    ctx.fillRect(mirCX - 1, mirCY - 1, 2, 2);

    // Reflexo de luz na borda esquerda do espelho (brilho de moldura)
    const edgeG = ctx.createLinearGradient(mirX, 0, mirX + 5, 0);
    edgeG.addColorStop(0,   `rgba(160,60,255,${(0.20 + 0.12 * coreP).toFixed(2)})`);
    edgeG.addColorStop(1,   'rgba(100,20,200,0)');
    ctx.fillStyle = edgeG;
    ctx.fillRect(mirX, mirY, 5, mirH);

    ctx.restore(); // fim do clip do espelho

    // ── Borda interna da moldura — chanfro de profundidade ───────────────
    // Sombra interna nas 4 bordas do recorte (simula o espelho estar encaixado)
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(mirX, mirY, mirW, 2);          // topo
    ctx.fillRect(mirX, mirY, 2, mirH);          // esq
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(mirX, mirY + mirH - 2, mirW, 2); // fundo
    ctx.fillRect(mirX + mirW - 2, mirY, 2, mirH); // dir
    // filete de luz roxo na borda topo e esq (chanfro positivo)
    ctx.fillStyle = 'rgba(140,40,220,0.22)';
    ctx.fillRect(mirX, mirY, mirW, 1);
    ctx.fillRect(mirX, mirY, 1, mirH);

    ctx.restore();
  });
}

function drawVoidRifts(cam, time) {
  // Pré-calcula constante de tempo reutilizável
  const timeRot = time * 0.8;
  const PI2 = Math.PI * 2;

  for (const e of enemies) {
    if (e.dead || e.type !== 'VOID_CASTER' || !e.activeRifts) continue;
    for (const r of e.activeRifts) {
      const cx  = r.x - cam.x;
      const cy  = r.y - cam.y;
      // Culling de visibilidade — skip rifts fora da tela
      if (cx < -60 || cx > W + 60 || cy < -60 || cy > H + 60) continue;

      const pct = 1 - r.timer / r.maxTimer;
      const rad = 6 + pct * 22;
      const warning = r.timer < 0.45;
      const wFlash  = warning && Math.floor(time * 10) % 2 === 0;
      const rad03   = rad * 0.3; // reutilizado varias vezes

      ctx.save();

      // ── Sombra no chão ────────────────────────────────────────────────
      ctx.fillStyle = `rgba(0,0,10,${(0.45 + pct * 0.25).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rad * 1.1, rad * 0.32, 0, 0, PI2);
      ctx.fill();

      // ── Disco central ─────────────────────────────────────────────────
      ctx.fillStyle = wFlash
        ? `rgba(40,0,80,0.85)`
        : `rgba(10,0,30,${(0.60 + pct * 0.20).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rad, rad03, 0, 0, PI2);
      ctx.fill();

      // ── Anéis concêntricos — agrupa paths para reduzir stroke calls ───
      ctx.lineWidth = wFlash ? 1.8 : 1.2;
      const t0 = time * 4;
      for (let i = 0; i < 3; i++) {
        const t     = t0 + i * (PI2 / 3);
        const rRing = rad * (0.35 + 0.22 * i) + Math.sin(t) * 1.5;
        const alpha = wFlash ? 0.9 : (0.5 + 0.35 * Math.sin(t));
        ctx.strokeStyle = wFlash
          ? `rgba(180,50,255,${alpha.toFixed(2)})`
          : `rgba(80,30,200,${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rRing, rRing * 0.3, 0, 0, PI2);
        ctx.stroke();
      }

      // ── Marcas de runas — path único ─────────────────────────────────
      const runeAlpha = wFlash ? 0.95 : 0.55 + pct * 0.3;
      ctx.strokeStyle = wFlash
        ? `rgba(220,120,255,${runeAlpha.toFixed(2)})`
        : `rgba(100,60,220,${runeAlpha.toFixed(2)})`;
      ctx.lineWidth = 1;
      const r0s = rad * 0.55;
      const r1s = rad * 0.92;
      const r0y = r0s * 0.3;
      const r1y = r1s * 0.3;
      // Agrupa todos os 6 traços em 1 único path → 1 stroke() em vez de 6
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * PI2 + timeRot;
        const ca = Math.cos(a), sa = Math.sin(a);
        ctx.moveTo(cx + ca * r0s, cy + sa * r0y);
        ctx.lineTo(cx + ca * r1s, cy + sa * r1y);
      }
      ctx.stroke();

      // ── Flash de aviso ────────────────────────────────────────────────
      if (warning) {
        ctx.strokeStyle = `rgba(255,${wFlash ? 30 : 80},200,${wFlash ? 0.9 : 0.5})`;
        ctx.lineWidth   = 2.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rad + 2, (rad + 2) * 0.3, 0, 0, PI2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}

const _bgGrad = ctx.createLinearGradient(0, 0, 0, H);
_bgGrad.addColorStop(0, '#06060f');
_bgGrad.addColorStop(1, '#0a0a1a');

// ─── DRAW BACKGROUND ───────────────────────────────────────────────────────
function drawBackground(cam, time) {
  // gradient sky
  ctx.fillStyle = _bgGrad;
  ctx.fillRect(0, 0, W, H);

  // atmospheric particles / dust
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 40; i++) {
    const ox = ((i * 137 + time * 8) % (W + 20)) - 10;
    const oy = ((i * 97  + time * 5) % (H + 20)) - 10;
    ctx.rect(ox, oy, 1, 1);
  }
  ctx.fill();
  ctx.restore();
}

// ─── MAP TRANSITION ────────────────────────────────────────────────────────
let transition = null;

function checkMapTransition(player, currentMapId, maps) {
  const map  = maps[currentMapId];
  const mapW = map.cols * TILE;
  const mapH = map.rows * TILE;
  const px   = player.x + player.w / 2;
  const py   = player.y + player.h / 2;

  const playerTileY = Math.floor(py / TILE);
  const playerTileX = Math.floor(px / TILE);

  // Offset em pixels do topo do sprite dentro do espaço do mapa.
  // Usado pelo getSpawnForEntry para reproduzir a posição vertical/horizontal
  // exata no novo mapa, sem o erro de "player.h" que causava a queda.
  const playerOffsetY = player.y; // topo do sprite em pixels (coord. mundo)
  const playerOffsetX = player.x; // esquerda do sprite em pixels

  if (map.connections.right !== null && px > mapW - TILE &&
      isBorderOpen(map, 'right', playerTileY))
    return { nextId: map.connections.right, entryEdge: 'left',   playerTileY, playerOffsetY };

  if (map.connections.left !== null && px < TILE &&
      isBorderOpen(map, 'left', playerTileY))
    return { nextId: map.connections.left,  entryEdge: 'right',  playerTileY, playerOffsetY };

  if (map.connections.down !== null && py > mapH - TILE &&
      isBorderOpen(map, 'down', playerTileX))
    return { nextId: map.connections.down,  entryEdge: 'top',    playerTileX, playerOffsetX };

  if (map.connections.up !== null && py < TILE &&
      isBorderOpen(map, 'up', playerTileX))
    return { nextId: map.connections.up,    entryEdge: 'bottom', playerTileX, playerOffsetX };

  return null;
}

// Spawn na borda correta do novo mapa, mantendo a posição relativa do jogador
function getSpawnForEntry(map, entryEdge, playerTile, playerOffset) {
  const clampX = (tx) => Math.max(2, Math.min(map.cols - 3, tx));
  const clampY = (ty) => Math.max(2, Math.min(map.rows - 3, ty));

  // Quando temos o offset exato em pixels, preservamos diretamente em pixels
  // e só clampamos dentro dos limites do mapa em pixels — sem converter para
  // tiles inteiros, o que causava o jogador "flutuar" um frame ao entrar pela
  // borda direita/esquerda estando no tile y=13 (linha mais baixa).
  const clampOffsetY = (offsetPx) => {
    const minPx = 1 * TILE;
    const maxPx = (map.rows - 1) * TILE - player.h;
    return Math.max(minPx, Math.min(maxPx, offsetPx));
  };
  const clampOffsetX = (offsetPx) => {
    const minPx = 1 * TILE;
    const maxPx = (map.cols - 2) * TILE;
    return Math.max(minPx, Math.min(maxPx, offsetPx));
  };

  switch (entryEdge) {
    case 'left': {
      // Entra pela esquerda: X fixo perto da borda, Y vem do offset em pixels
      if (playerOffset != null) {
        const yPx = clampOffsetY(playerOffset);
        return { x: 1.5, y: yPx / TILE };
      }
      return { x: 1.5, y: clampY(playerTile) };
    }
    case 'right': {
      if (playerOffset != null) {
        const yPx = clampOffsetY(playerOffset);
        return { x: map.cols - 2, y: yPx / TILE };
      }
      return { x: map.cols - 2, y: clampY(playerTile) };
    }
    case 'top': {
      if (playerOffset != null) {
        const xPx = clampOffsetX(playerOffset);
        return { x: xPx / TILE, y: 1 };
      }
      return { x: clampX(playerTile), y: 1 };
    }
    case 'bottom': {
      if (playerOffset != null) {
        const xPx = clampOffsetX(playerOffset);
        const yPx = (map.rows - 1) * TILE - player.h;  
        return { x: xPx / TILE, y: yPx / TILE };
      }
      return { x: clampX(playerTile), y: map.rows - 2 };
    }
    default:
      return { x: map.spawnX ?? Math.floor(map.cols / 2),
               y: map.spawnY ?? Math.floor(map.rows / 2) };
  }
}

// ─── MINIMAP ───────────────────────────────────────────────────────────────
// Layout geográfico 3×3:
//   col  0               1              2
// row 0  CRYPT(0)        ABYSS(1)       TOWER(7)
// row 1  UNDERGROUND(2)  DEPTHS(3)      SANCTUARY(4)
// row 2  SINGULARITY(6)        VOID(5)        FINAL(8)
const MINIMAP_LAYOUT = [
  [0, 1, 7],
  [2, 3, 4],
  [6, 5, 8],
];

// Cache de minimapas pré-renderizados: mapId → HTMLCanvasElement
// Invalidado ao mudar de mapa (tiles breakáveis, crumble, etc. podem mudar).
const _mmCache = {};

function _bakeMinimapCell(map, cellW, cellH) {
  const off  = document.createElement('canvas');
  off.width  = cellW;
  off.height = cellH;
  const c    = off.getContext('2d');

  // Fundo escuro da sala
  c.fillStyle = '#0d0d10';
  c.fillRect(0, 0, cellW, cellH);

  // Escala: quantos px de minimap por tile do mapa
  const scaleX = (cellW - 2) / map.cols;
  const scaleY = (cellH - 2) / map.rows;

  // Cores por categoria de tile (agrupadas para minimizar fillStyle swaps)
  const SOLID_COLOR    = '#2e2e42'; // paredes/chão sólido
  const PLAT_COLOR     = '#3a4a3a'; // plataformas (1-way) — verde escuro
  const SPIKE_COLOR    = '#5a1010'; // espinhos — vermelho
  const LADDER_COLOR   = '#3a2a18'; // escadas — marrom
  const DOOR_COLOR     = '#1a3a1a'; // portais — verde musgo
  const SPECIAL_COLOR  = '#2a2040'; // tiles especiais (obsidiana, mosaico, etc.)

  for (let ty = 0; ty < map.rows; ty++) {
    for (let tx = 0; tx < map.cols; tx++) {
      const t = map.tiles[ty * map.cols + tx];
      if (t === T.AIR) continue;

      let color;
      switch (t) {
        case T.SPIKE:                        color = SPIKE_COLOR;   break;
        case T.PLAT:                         color = PLAT_COLOR;    break;
        case T.LADDER:                       color = LADDER_COLOR;  break;
        case T.DOOR_R: case T.DOOR_L:
        case T.DOOR_U: case T.DOOR_D:        color = DOOR_COLOR;    break;
        case T.FENCE: case T.IRON_GATE:
        case T.ECHO_PILLAR:  case T.CRUMBLE:
        case T.WOOD_PLANKS:   case T.PILLAR:       color = SPECIAL_COLOR; break;
        default:                             color = SOLID_COLOR;   break;
      }

      const px = 1 + tx * scaleX;
      const py = 1 + ty * scaleY;
      const pw = Math.max(1, scaleX - 0.3);
      const ph = Math.max(1, scaleY - 0.3);

      c.fillStyle = color;
      c.fillRect(px, py, pw, ph);
    }
  }

  return off;
}

function _invalidateMinimapCell(mapId) {
  delete _mmCache[mapId];
}

function drawMinimap(maps, currentMapId, player) {
  const mmW   = mmCanvas.width;   // 90
  const mmH   = mmCanvas.height;  // 90
  const COLS  = 3, ROWS = 3;
  const cellW = mmW / COLS;       // 30
  const cellH = mmH / ROWS;       // 30

  // Fundo geral
  mmCtx.fillStyle = '#050505';
  mmCtx.fillRect(0, 0, mmW, mmH);

  // Monta lookup gx/gy por mapId para reutilizar abaixo
  const gridLookup = {};

  MINIMAP_LAYOUT.forEach((row, gy) => {
    row.forEach((mapId, gx) => {
      if (mapId < 0) return;
      gridLookup[mapId] = { gx, gy };

      const ox      = gx * cellW;
      const oy      = gy * cellH;
      const visited = visitedMaps.has(mapId);
      const current = mapId === currentMapId;
      const map     = maps[mapId];

      if (visited && map) {
        // ── Geometria dos tiles (baked em offscreen canvas) ─────────────
        if (!_mmCache[mapId]) {
          _mmCache[mapId] = _bakeMinimapCell(map, cellW, cellH);
        }
        mmCtx.drawImage(_mmCache[mapId], ox, oy);

        // Tint de destaque na sala atual
        if (current) {
          mmCtx.fillStyle = 'rgba(80,200,80,0.08)';
          mmCtx.fillRect(ox + 1, oy + 1, cellW - 2, cellH - 2);
        }
      }

      // ── Borda da célula ─────────────────────────────────────────────────
      mmCtx.strokeStyle = current  ? '#5d5'
                        : visited  ? '#2a2a3a'
                        :            '#141418';
      mmCtx.lineWidth = 1;
      mmCtx.strokeRect(ox + 0.5, oy + 0.5, cellW - 1, cellH - 1);

      // ── Névoa de guerra — sala não visitada ─────────────────────────────
      if (!visited) {
        mmCtx.fillStyle = 'rgba(5,5,8,0.88)';
        mmCtx.fillRect(ox + 1, oy + 1, cellW - 2, cellH - 2);
        // Ponto de interrogação sutil
        mmCtx.fillStyle = '#777';
        mmCtx.font = '18px monospace';
        mmCtx.textAlign = 'center';
        mmCtx.textBaseline = 'middle';
        mmCtx.fillText('?', ox + cellW / 2, oy + cellH / 2);
      }
    });
  });

  // ── Estrelas no minimap ──────────────────────────────────────────────────
  MINIMAP_LAYOUT.forEach((row, gy) => {
    row.forEach((mapId, gx) => {
      if (mapId < 0 || !visitedMaps.has(mapId)) return;
      const map   = maps[mapId];
      const stars = _getStars ? _getStars(map) : (map.star ? [map.star] : []);
      if (stars.length === 0) return;
      const ox = gx * cellW;
      const oy = gy * cellH;
      const scaleX = (cellW - 2) / map.cols;
      const scaleY = (cellH - 2) / map.rows;
      for (const s of stars) {
        const key = `${mapId}:${s.tx}:${s.ty}`;
        if (collectedStars.has(key)) continue;
        const sx = ox + 1 + (s.tx + 0.5) * scaleX;
        const sy = oy + 1 + (s.ty + 0.5) * scaleY;
        mmCtx.fillStyle   = '#ffd700';
        mmCtx.shadowColor = '#ffd700';
        mmCtx.shadowBlur  = 3;
        mmCtx.beginPath();
        mmCtx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        mmCtx.fill();
        mmCtx.shadowBlur = 0;
      }
    });
  });

  // ── Ponto do jogador ────────────────────────────────────────────────────
  const gp = gridLookup[currentMapId];
  if (gp) {
    const m   = maps[currentMapId];
    const pdx = gp.gx * cellW + 1 + (player.x / (m.cols * TILE)) * (cellW - 2);
    const pdy = gp.gy * cellH + 1 + (player.y / (m.rows * TILE)) * (cellH - 2);
    mmCtx.fillStyle   = '#e74c3c';
    mmCtx.shadowColor = '#e74c3c';
    mmCtx.shadowBlur  = 5;
    mmCtx.beginPath();
    mmCtx.arc(pdx, pdy, 2, 0, Math.PI * 2);
    mmCtx.fill();
    mmCtx.shadowBlur = 0;
  }
}

// ─── HUD ───────────────────────────────────────────────────────────────────
function updateHUD(player) {
  _hudHp.style.width = (Math.max(0, player.hp) / player.maxHp * 100) + '%';
  _hudMp.style.width = (player.mp / player.maxMp * 100) + '%';
}

// ─── FADE TRANSITION ───────────────────────────────────────────────────────
// Transição em 3 fases:
//   FASE 1 — "fade_out": tela escurece (alpha 0 → 1)  duração: FADE_HALF
//   FASE 2 — "swap":     mapa é trocado no pico do escuro
//   FASE 3 — "fade_in":  tela clareia (alpha 1 → 0)   duração: FADE_HALF
//
// Durante o fade o jogador fica congelado (inputs ignorados) e a câmera
// vai direto para a posição correta no novo mapa — sem nenhum slide.

const FADE_HALF = 0.35;   // segundos por metade (total = 0.7 s)

let fadeState  = 'idle';  // 'idle' | 'fade_out' | 'fade_in'
let fadeAlpha  = 0;       // 0 = transparente, 1 = preto total
let fadeTimer  = 0;

// Dados da transição pendente (usados na virada do fade_out → fade_in)
let pendingTransition = null; // { nextId, entryEdge, playerTile, exactSpawn? }

// Easing suave (ease-in-out cúbico)
function easeInOut(t) {
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
}

// Chama quando o jogador toca uma porta — inicia o fade_out
function startFade(nextId, entryEdge, playerTile, exactSpawn, playerOffset) {
  if (fadeState !== 'idle') return;
  pendingTransition = { nextId, entryEdge, playerTile, exactSpawn, playerOffset };
  fadeState = 'fade_out';
  fadeTimer = 0;
  fadeAlpha = 0;
}

// Atualizado a cada frame; retorna true enquanto o fade está ativo
function updateFade(dt) {
  if (fadeState === 'idle') return false;
 
  fadeTimer += dt;
 
  if (fadeState === 'fade_out') {
    fadeAlpha = easeInOut(Math.min(fadeTimer / FADE_HALF, 1));
    if (fadeTimer >= FADE_HALF) {
      // Pico do escuro — troca o mapa agora
      fadeAlpha = 1;
      const { nextId, entryEdge, playerTile, exactSpawn, playerOffset } = pendingTransition;
      _doLoadMap(nextId, entryEdge, playerTile, exactSpawn, playerOffset);
      fadeState = 'fade_in';
      fadeTimer = 0;
    }
  } else if (fadeState === 'fade_in') {
    fadeAlpha = 1 - easeInOut(Math.min(fadeTimer / FADE_HALF, 1));
    if (fadeTimer >= FADE_HALF) {
      fadeAlpha  = 0;
      fadeState  = 'idle';
      pendingTransition = null;
    }
  }
 
  return true;
}

// Desenha o overlay preto por cima de tudo
function drawFadeOverlay() {
  if (fadeAlpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = fadeAlpha;
  ctx.fillStyle   = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Versões de slide mantidas como stubs vazios para não quebrar chamadas existentes
let slideActive = false;
function startSlide() {}
function updateSlide() {}

// ─── GAME STATE ────────────────────────────────────────────────────────────
let gamePhase          = 'start'; // 'start' | 'playing' | 'dead' | 'victory'
let gameRunning        = false;
let currentMapId       = 0;
let player             = null;
let enemies            = [];
let cam                = createCamera();
let time               = 0;
let visitedMaps        = new Set();
let transitionCooldown = 0;
let collectedStars     = new Set(); // IDs dos mapas cujas estrelas foram coletadas

// Executa a troca de mapa de verdade (chamado no pico do fade, tela totalmente preta)
function _doLoadMap(mapId, entryEdge, playerTile, exactSpawn, playerOffset) {
  currentMapId = mapId;
  visitedMaps.add(mapId);
  const map   = ALL_MAPS[mapId];
  const spawn = exactSpawn ?? getSpawnForEntry(map, entryEdge, playerTile, playerOffset);
  enemies     = map.enemies.map(e => createEnemy(e.type, e.tx, e.ty));
  player.x    = spawn.x * TILE;
  player.y    = exactSpawn ? (spawn.y + 1) * TILE - player.h : spawn.y * TILE;
  player.vx   = 0;
  player.vy   = 0;
  player.dropThrough = false;
  player.dropThroughTileY = -1;
  player.dropTimer   = 0;
  player.onDoorD     = false;
  projectiles.length = 0;
  particles.length   = 0;
  initArrowTraps(map);
  initMineTraps(map);
  initRetractableSpikes(map);
  initNpcs(map);
  transitionCooldown = FADE_HALF + 0.1; // espera o fade_in terminar
  document.getElementById('map-name').innerHTML = `<b>Mapa:</b> ${map.name}`;

  if (familiar.active) {
    familiar.state  = 'follow';
    familiar.target = null;
    familiar.x      = player.x + player.w / 2;
    familiar.y      = player.y - 20;
    familiar.vx     = 0;
    familiar.vy     = 0;
  }
 
  // Câmera já posicionada corretamente no novo mapa — sem slide
  const mapW = map.cols * TILE;
  const mapH = map.rows * TILE;
  cam.x = Math.max(0, Math.min(mapW - W, player.x + player.w/2 - W/2));
  cam.y = Math.max(0, Math.min(mapH - H, player.y + player.h/2 - H/2));
}

// Ponto de entrada público: inicia o fade que levará à troca
function loadMap(mapId, entryEdge, playerTile, playerOffset) {
  startFade(mapId, entryEdge, playerTile, null, playerOffset);
}

let _hudHp, _hudMp, _hudSpeedWrap, _hudSpeedFill, _hudSpeedLabel;
let _hudShieldWrap, _hudShieldFill, _hudShieldLabel;

function startGame() {
  player  = createPlayer(MAP_CRYPT.spawnX, MAP_CRYPT.spawnY);
  cam     = createCamera();
  particles.length   = 0;
  projectiles.length = 0;
  visitedMaps        = new Set([0]);
  collectedStars     = new Set();
  fadeState          = 'idle';
  fadeAlpha          = 0;
  transitionCooldown = 0;
  _doLoadMap(0, 'default');
  gameRunning = true;
  gamePhase   = 'playing';

  // Reset arcane storm
  arcaneStorm.active     = false;
  arcaneStorm.timer      = 0;
  arcaneStorm.cooldown   = 0;
  arcaneStorm.spawnTimer = 0;
  arcaneStorm.blasts     = [];

  familiar.active   = false;
  familiar.timer    = 0;
  familiar.cooldown = 0;
  familiar.state    = 'follow';
  familiar.target   = null;
  
  document.getElementById('hud').style.display = 'block';
  document.getElementById('minimap').style.display = 'block';
  document.getElementById('star-count').style.display = 'block';
  updateStarDisplay();
  resetPotions();
  resetManaPotions();
  resetCrumbleTiles();
  resetOrbs();
  resetSpeedBoosts();
  resetBreakableTiles();

  _hudHp         = document.getElementById('hp-fill');
  _hudMp         = document.getElementById('mp-fill');
  _hudSpeedWrap  = document.getElementById('speed-hud');
  _hudSpeedFill  = document.getElementById('speed-fill');
  _hudSpeedLabel = document.getElementById('speed-label');
  _hudShieldWrap  = document.getElementById('shield-hud');
  _hudShieldFill  = document.getElementById('shield-fill');
  _hudShieldLabel = document.getElementById('shield-label');
  _hudArcane      = document.getElementById('arcane-hud');
  _hudArcaneFill  = document.getElementById('arcane-fill');
  _hudArcaneLabel = document.getElementById('arcane-label');
  _hudDash      = document.getElementById('dash-hud');
  _hudDashFill  = document.getElementById('dash-fill');
  _hudDashLabel = document.getElementById('dash-label');

  resetDoubleJumps();
  player.hasDoubleJump  = false;
  player.doubleJumpUsed = false;
}

// ── Cache de decorações estáticas por mapa ─────────────────────────────────
const _staticDecoCache = {}; // mapId → HTMLCanvasElement

function _bakeStaticDecorations(map, cam) {
  const off = document.createElement('canvas');
  off.width  = map.cols * TILE;
  off.height = map.rows * TILE;
  const octx = off.getContext('2d');

  // Redireciona ctx temporariamente para o offscreen
  const realCtx = ctx;
  ctx = octx;

  // Câmera zerada — o cache é em coordenadas de mundo
  const fakeCam = { x: 0, y: 0 };

  drawGravestones(map,    fakeCam, 0);
  drawGravestones2(map,   fakeCam, 0);
  drawWoodenCrosses(map,  fakeCam, 0);
  drawCoffins(map,        fakeCam, 0);
  drawAltars(map,         fakeCam, 0);
  drawSkullPedestals(map, fakeCam, 0);
  drawUrns(map,           fakeCam, 0);
  drawPines(map,          fakeCam, 0);
  drawEyePyramids(map,    fakeCam, 0);
  drawFlowers(map,        fakeCam, 0);
  drawLeafBushes(map,     fakeCam, 0);
  drawViolets(map,        fakeCam, 0);
  drawTrees(map,          fakeCam, 0);
  drawSlenderTrees(map,   fakeCam, 0);
  drawEnergyOrbs(map,     fakeCam, 0);
  drawMagicEyes(map,      fakeCam, 0);
  drawHexagrams(map,      fakeCam, 0);
  drawVoidCrystals(map,   fakeCam, 0);
  drawSingularityMirrors(map, fakeCam, 0);

  ctx = realCtx;
  return off;
}

function drawStaticDecorations(map, cam) {
  if (!_staticDecoCache[map.id]) {
    _staticDecoCache[map.id] = _bakeStaticDecorations(map);
  }

  ctx.drawImage(_staticDecoCache[map.id], -cam.x, -cam.y);
}

// ─── SPEED BOOST SYSTEM ─────────────────────────────────────────────────────
// Item relâmpago que aumenta a velocidade do jogador temporariamente.
// Duração: SPEED_BOOST_DURATION segundos. Multiplicador: 1.85×.
// Visual: raio elétrico flutuante com aura ciano. HUD mostra barra de duração.
 
const SPEED_BOOST_DURATION = 7;  // segundos de duração
const SPEED_BOOST_RADIUS   = 7;  // raio do item em px
 
const collectedSpeedBoosts = new Set();
 
function drawSpeedBoost(map, cam, time) {
  if (!map.speedBoost) return;
  if (collectedSpeedBoosts.has(map.id)) return;
 
  const s     = map.speedBoost;
  const cx    = s.tx * TILE + TILE / 2 - cam.x;
  const cy    = s.ty * TILE + TILE / 2 - cam.y + Math.sin(time * 3.1) * 4;
  const pulse = 0.6 + 0.4 * Math.sin(time * 5);
 
  ctx.save();
 
  // Aura elétrica giratória
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 2.2);
  for (let i = 0; i < 8; i++) {
    const a  = (i / 8) * Math.PI * 2;
    const r  = SPEED_BOOST_RADIUS + 5 + Math.sin(time * 8 + i) * 2;
    const ax = Math.cos(a) * r;
    const ay = Math.sin(a) * r;
    ctx.fillStyle   = i % 2 === 0
      ? `rgba(255, 240, 0, ${0.4 + 0.4 * pulse})`
      : `rgba(255, 255, 160, ${0.2 + 0.3 * pulse})`;
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.arc(ax, ay, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
 
  // Corpo do item — gradiente azul-elétrico
  ctx.shadowColor = '#ffea00';
  ctx.shadowBlur  = 18 + 10 * pulse;
  const grad = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, SPEED_BOOST_RADIUS * 1.2);
  grad.addColorStop(0,   'rgba(200, 255, 255, 0.98)');
  grad.addColorStop(0.4, 'rgba(255,   200, 0, 0.92)');
  grad.addColorStop(0.8, 'rgba(200,    80, 0, 0.85)');
  grad.addColorStop(1,   'rgba(100,    20, 0, 0.8)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, SPEED_BOOST_RADIUS, 0, Math.PI * 2);
  ctx.fill();
 
  // Anel externo pulsante
  ctx.strokeStyle = `rgba(255, 240, 0, ${0.5 + 0.4 * pulse})`;
  ctx.lineWidth   = 1.5;
  ctx.shadowBlur  = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, SPEED_BOOST_RADIUS + 2.5, 0, Math.PI * 2);
  ctx.stroke();
 
  // Reflexo interno
  ctx.shadowBlur = 0;
  ctx.fillStyle  = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy - 2.5, 2.5, 1.5, -0.5, 0, Math.PI * 2);
  ctx.fill();
 
  ctx.restore();
}
 
function checkSpeedBoostCollection(player, map) {
  if (!map.speedBoost) return;
  if (collectedSpeedBoosts.has(map.id)) return;
  if (fadeState !== 'idle') return;
 
  const s    = map.speedBoost;
  const px   = player.x + player.w / 2;
  const py   = player.y + player.h / 2;
  const sx   = s.tx * TILE + TILE / 2;
  const sy   = s.ty * TILE + TILE / 2;
  const dist = Math.hypot(px - sx, py - sy);
 
  if (dist < TILE * 0.9) {
    collectedSpeedBoosts.add(map.id);
    player.speedBoostTimer = SPEED_BOOST_DURATION;
    player.speedBoostMax   = SPEED_BOOST_DURATION;
    // Partículas elétricas
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        spawnParticles(sx, sy, '#00eeff', 16, 5);
        spawnParticles(sx, sy, '#aaffff',  8, 3);
      }, i * 60);
    }
  }
}
 
function resetSpeedBoosts() {
  collectedSpeedBoosts.clear();
}

// ─── STAR SYSTEM ───────────────────────────────────────────────────────────
const STAR_SIZE  = 6; // raio da estrela em px

// Normaliza: garante que map.stars seja sempre um array (ou [])
function _getStars(map) {
  if (map.stars && Array.isArray(map.stars)) return map.stars;
  if (map.star && typeof map.star.tx === 'number') return [map.star];
  return [];
}

const STAR_TOTAL = ALL_MAPS.reduce((sum, map) => sum + _getStars(map).length, 0);

function _starKey(mapId, s) { return `${mapId}:${s.tx}:${s.ty}`; }

function updateStarDisplay() {
    const starCountElement = document.getElementById('star-count');
    if (starCountElement) {
        starCountElement.innerHTML = `<b>Estrelas:</b> ${collectedStars.size} / ${STAR_TOTAL}`;
    }
}
updateStarDisplay();

function _drawOneStar(s, mapId, cam, time) {
  if (collectedStars.has(_starKey(mapId, s))) return;

  const cx = s.tx * TILE + TILE / 2 - cam.x;
  const cy = s.ty * TILE + TILE / 2 - cam.y + Math.sin(time * 2.5) * 4;

  const pulse = 0.6 + 0.4 * Math.sin(time * 3);
  const rays  = 5;
  const outer = STAR_SIZE * (0.9 + 0.1 * pulse);
  const inner = outer * 0.42;

  ctx.save();
  ctx.translate(cx, cy);

  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, outer * 2.2);
  glow.addColorStop(0,   `rgba(255,220,60,${(0.22 * pulse).toFixed(2)})`);
  glow.addColorStop(0.5, `rgba(255,180,0,${(0.10 * pulse).toFixed(2)})`);
  glow.addColorStop(1,   'rgba(255,160,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, outer * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Anel intermediário mais concentrado
  ctx.fillStyle = `rgba(255,210,40,${(0.12 + 0.08 * pulse).toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(0, 0, outer * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // ── 4 raios de luz cruzados (lensflare leve) ──────────────────────────────
  ctx.save();
  ctx.rotate(time * 0.4);
  ctx.strokeStyle = `rgba(255,240,120,${(0.18 + 0.12 * pulse).toFixed(2)})`;
  ctx.lineWidth   = 1;
  ctx.lineCap     = 'round';
  for (let i = 0; i < 4; i++) {
    const a   = (i / 4) * Math.PI;
    const len = outer * (1.5 + 0.3 * pulse);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * outer * 0.6,           Math.sin(a) * outer * 0.6);
    ctx.lineTo(Math.cos(a) * len,                    Math.sin(a) * len);
    ctx.moveTo(Math.cos(a + Math.PI) * outer * 0.6, Math.sin(a + Math.PI) * outer * 0.6);
    ctx.lineTo(Math.cos(a + Math.PI) * len,          Math.sin(a + Math.PI) * len);
    ctx.stroke();
  }
  ctx.restore();

  // ── Forma da estrela ──────────────────────────────────────────────────────
  ctx.rotate(time * 0.8);
  ctx.beginPath();
  for (let i = 0; i < rays * 2; i++) {
    const r     = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / rays - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else         ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();

  const grad = ctx.createRadialGradient(0, -outer * 0.3, 0, 0, 0, outer);
  grad.addColorStop(0,   '#fffde0');
  grad.addColorStop(0.5, '#ffd700');
  grad.addColorStop(1,   '#ff9900');
  ctx.fillStyle = grad;
  ctx.fill();

  // Borda fina dourada
  ctx.strokeStyle = `rgba(255,255,180,${(0.35 + 0.30 * pulse).toFixed(2)})`;
  ctx.lineWidth   = 0.8;
  ctx.stroke();

  // ── Reflexo especular ─────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.70)';
  ctx.beginPath();
  ctx.ellipse(-outer * 0.15, -outer * 0.2, outer * 0.18, outer * 0.10, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStar(map, cam, time) {
  for (const s of _getStars(map)) {
    _drawOneStar(s, map.id, cam, time);
  }
}

function checkStarCollection(player, map) {
  const stars = _getStars(map);
  if (stars.length === 0) return;

  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;

  for (const s of stars) {
    const key = _starKey(map.id, s);
    if (collectedStars.has(key)) continue;

    const sx   = s.tx * TILE + TILE / 2;
    const sy   = s.ty * TILE + TILE / 2;
    const dist = Math.hypot(px - sx, py - sy);

    if (dist < TILE * 0.9) {
      collectedStars.add(key);
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          spawnParticles(sx, sy, '#ffd700', 18, 5);
          spawnParticles(sx, sy, '#fffde0', 10, 3);
        }, i * 80);
      }
      updateStarDisplay();
      if (collectedStars.size >= STAR_TOTAL) {
        gameRunning = false;
        gamePhase   = 'victory';
      }
    }
  }
}

function drawCandles(map, cam, time) {
  if (!map.candles || map.candles.length === 0) return;

  // helper reutilizável — definido fora do loop
  function flameShape(cx2, tip, baseW, height) {
    ctx.beginPath();
    ctx.moveTo(cx2, tip);
    ctx.bezierCurveTo(cx2 + baseW * 1.1, tip + height * 0.4,
                      cx2 + baseW,        tip + height, cx2, tip + height);
    ctx.bezierCurveTo(cx2 - baseW,        tip + height,
                      cx2 - baseW * 1.1,  tip + height * 0.4, cx2, tip);
    ctx.closePath();
  }

  map.candles.forEach((c, idx) => {
    const seed  = idx * 2.731;
    const flick = Math.sin(time * 11.3 + seed) * 0.9
                + Math.sin(time *  6.7 + seed + 1.2) * 0.6;

    const bx = c.tx * TILE + TILE / 2 - cam.x;
    const by = c.ty * TILE + TILE     - cam.y;

    // Culling — skip velas fora da tela
    if (bx < -40 || bx > W + 40 || by < -40 || by > H + 40) return;

    ctx.save();

    // ── Pool de luz no chão — 2 fillRect em vez de radialGradient ──────
    // Aproximação barata: elipse escura + overlay alaranjado fixo
    const poolAlpha = (0.10 + 0.04 * Math.sin(time * 5 + seed)).toFixed(2);
    ctx.fillStyle = `rgba(255,140,20,${poolAlpha})`;
    ctx.beginPath();
    ctx.ellipse(bx, by, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,100,0,0.04)';
    ctx.beginPath();
    ctx.ellipse(bx, by, 28, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Corpo da vela ─────────────────────────────────────────────────
    const cw = 5, ch = 11;
    const cx = bx - cw / 2;
    const cy = by - ch;

    ctx.fillStyle = '#d4c9a8';
    ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(cx + cw - 1, cy + 2, 2, ch - 2);

    // pavio
    ctx.strokeStyle = '#3a2a10';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(bx, cy);
    ctx.lineTo(bx + flick * 0.4, cy - 4);
    ctx.stroke();

    // ── Chama — substituída por versão sem createLinearGradient ────────
    const flameCX = bx + flick * 0.8;
    const flameTY = cy - 4;
    const fW = 3.2 + Math.abs(flick) * 0.4;
    const fH = 7   + flick * 0.5;

    // Camada 1: chama externa — cor plana laranja (evita createLinearGradient)
    ctx.fillStyle = `rgba(220,90,0,0.75)`;
    flameShape(flameCX, flameTY - fH, fW, fH);
    ctx.fill();
    // sobreposição mais clara no topo da chama
    ctx.fillStyle = `rgba(255,140,0,0.55)`;
    flameShape(flameCX, flameTY - fH * 0.6, fW * 0.7, fH * 0.55);
    ctx.fill();

    // Camada 2: núcleo amarelo
    ctx.fillStyle = `rgba(255,240,120,${(0.75 + 0.2 * Math.abs(flick / 1.5)).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(flameCX, flameTY - 0.5, fW * 0.75, fW * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawChandeliers(map, cam, time) {
  if (!map.chandeliers || map.chandeliers.length === 0) return;
 
  // Helper de forma de chama — definido fora do loop (não recria função por vela)
  function chanFlame(fx, tip, bw, bh) {
    ctx.beginPath();
    ctx.moveTo(fx, tip);
    ctx.bezierCurveTo(fx + bw * 1.1, tip + bh * 0.4, fx + bw, tip + bh, fx, tip + bh);
    ctx.bezierCurveTo(fx - bw, tip + bh, fx - bw * 1.1, tip + bh * 0.4, fx, tip);
    ctx.closePath();
  }
 
  map.chandeliers.forEach((ch, chIdx) => {
    const seed = chIdx * 5.123 + 11.7;
 
    // Balanço suave de pêndulo (um seno é suficiente — mais leve que dois)
    const totalSwing = Math.sin(time * 0.72 + seed) * 2.0;   // ≈ ±2 px
 
    // Ponto de ancoragem: fundo do tile de teto
    const ax = ch.tx * TILE + TILE / 2 - cam.x;
    const ay = ch.ty * TILE + TILE     - cam.y;
 
    const cx       = ax + totalSwing;
    const chainLen = ch.chainLen || 16;
    const bodyY    = ay + chainLen;   // topo do frame
    const frameW   = 26;              // meia-largura da barra
    const frameY   = bodyY;
    const holderY  = frameY + 5;     // base das argolas das velas
 
    ctx.save();
 
    // ── 2. Corrente — linha + 3 elos simples (sem loop de ellipse) ───────
    ctx.strokeStyle = '#2a2018';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(cx, bodyY);
    ctx.stroke();
 
    // 3 elos representativos (topo, meio, base) em vez de loop completo
    ctx.fillStyle = '#3a2c18';
    const step = chainLen / 3;
    for (let i = 0; i <= 3; i++) {
      const t  = i / 3;
      const lx = ax + (cx - ax) * t;
      const ly = ay + (bodyY - ay) * t;
      ctx.fillRect(lx - 1, ly - 2, 2, 4);
    }
 
    // ── 3. Frame de ferro ─────────────────────────────────────────────────
    // Nó central
    ctx.fillStyle = '#1e1510';
    ctx.fillRect(cx - 3, frameY - 3, 6, 6);
 
    // Barra horizontal — cor plana com 1 highlight em vez de gradiente 5-stops
    ctx.fillStyle = '#2a1e0e';
    ctx.fillRect(cx - frameW, frameY - 2, frameW * 2, 4);
 
    // Highlight quente único (1 fillRect)
    ctx.fillStyle = 'rgba(255,190,70,0.10)';
    ctx.fillRect(cx - frameW + 3, frameY - 2, frameW * 2 - 6, 1);
 
    // Ponteiras nas extremidades (2 triângulos simples)
    ctx.fillStyle = '#1a1208';
    ctx.beginPath();
    ctx.moveTo(cx - frameW, frameY - 2);
    ctx.lineTo(cx - frameW - 3, frameY + 1);
    ctx.lineTo(cx - frameW, frameY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + frameW, frameY - 2);
    ctx.lineTo(cx + frameW + 3, frameY + 1);
    ctx.lineTo(cx + frameW, frameY + 5);
    ctx.closePath();
    ctx.fill();
 
    // ── 4. Glow compartilhado das 3 chamas (1 radial gradient central) ───
    // Um único halo quente no centro do frame substitui as 3 auras individuais
    const glowA  = 0.14 + 0.05 * Math.sin(time * 5.1 + seed);
    const glow   = ctx.createRadialGradient(cx, frameY - 8, 0, cx, frameY - 8, 38);
    glow.addColorStop(0,   `rgba(255,140,20,${glowA.toFixed(3)})`);
    glow.addColorStop(1,   'rgba(255,60,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(cx, frameY - 8, 38, 30, 0, 0, Math.PI * 2);
    ctx.fill();
 
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur  = 8;
 
    // ── 5. As 3 velas ─────────────────────────────────────────────────────
    const candleOffsets = [-frameW, 0, +frameW];
 
    candleOffsets.forEach((ox, ci) => {
      const cSeed = seed + ci * 1.73 + 0.5;
      // Flicker: 2 senos em vez de 3 (economia mínima, mas acumula)
      const flick = Math.sin(time * 11.3 + cSeed) * 0.9
                  + Math.sin(time *  6.7 + cSeed + 1.2) * 0.6;  // ≈ ±1.5
 
      const candleX  = cx + ox;
      const cw = 4, ch = 9;
      const candleTop = holderY - ch;
 
      ctx.shadowBlur = 0;
      ctx.fillStyle  = '#1e1510';
      ctx.fillRect(candleX - 5, holderY - 3, 10, 3);
 
      // Corpo da vela — cor sólida (sem gradiente)
      ctx.fillStyle = '#ddd0b0';
      ctx.fillRect(candleX - cw / 2, candleTop, cw, ch);
 
      // Sombra lateral direita (volume)
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.fillRect(candleX + cw / 2 - 1, candleTop + 2, 1, ch - 2);
 
      // Pavio (linha simples, sem strokeStyle por vela)
      ctx.fillStyle = '#2a1a08';
      ctx.fillRect(candleX - 0.5, candleTop - 3, 1, 3);
 
      // ── Chama (2 layers em vez de 4) ─────────────────────────────────
      const fCX = candleX + flick * 0.7;
      const fTY = candleTop - 3;
      const fW  = 2.4 + Math.abs(flick) * 0.25;
      const fH  = 6.0 + flick * 0.4;
 
      ctx.shadowBlur = 8;
      const og = ctx.createLinearGradient(fCX, fTY - fH, fCX, fTY);
      og.addColorStop(0,   'rgba(255,140,0,0.0)');
      og.addColorStop(0.1, 'rgba(255,140,0,0.88)');
      og.addColorStop(1,   'rgba(200,55,0,0.90)');
      ctx.fillStyle = og;
      chanFlame(fCX, fTY - fH, fW, fH);
      ctx.fill();
 
      // Layer 2 — núcleo branco-amarelo (1 radial gradient pequeno)
      const cg = ctx.createRadialGradient(fCX, fTY - 1, 0, fCX, fTY - 1, fW);
      cg.addColorStop(0,   'rgba(255,255,210,0.95)');
      cg.addColorStop(1,   'rgba(255,160,0,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(fCX, fTY - 1, fW, fW * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
 
    ctx.shadowBlur = 0;
    ctx.restore();
  });
}

// Bake do corpo da tocha (madeira + cesto) — feito uma vez por tocha
function _bakeTorchBody(t) {
  const off  = document.createElement('canvas');
  off.width  = TILE * 2;
  off.height = TILE * 2;
  const c    = off.getContext('2d');
  const bx   = TILE, by = TILE * 2; // centro no canvas

  const stickW = 5, stickH = 22;
  const stickX = bx - stickW / 2;
  const stickY = by - stickH;

  // Sombra de volume
  c.fillStyle = 'rgba(0,0,0,0.30)';
  c.fillRect(stickX + stickW - 1, stickY + 3, 2, stickH - 3);

  // Madeira — baked com gradiente (executado 1× por tocha)
  const woodGrad = c.createLinearGradient(stickX, stickY, stickX, stickY + stickH);
  woodGrad.addColorStop(0,   '#6b3a1f');
  woodGrad.addColorStop(0.3, '#7d4a28');
  woodGrad.addColorStop(1,   '#3d1e0a');
  c.fillStyle = woodGrad;
  c.fillRect(stickX, stickY, stickW, stickH);

  // Veios
  c.fillStyle = 'rgba(120,70,30,0.25)';
  c.fillRect(stickX + 1, stickY + 5, 1, stickH - 8);
  c.fillRect(stickX + 3, stickY + 9, 1, stickH - 14);

  // Aro do cesto
  c.fillStyle = '#2a1a08';
  c.beginPath();
  c.ellipse(bx, stickY - 1, stickW / 2 + 3, 3, 0, 0, Math.PI * 2);
  c.fill();

  return { canvas: off, ox: TILE, oy: TILE * 2 };
}

function drawTorches(map, cam, time) {
  if (!map.torches || map.torches.length === 0) return;

  // Helper de chama — definido UMA VEZ fora do loop
  function torchFlame(cx2, tip, baseW, height) {
    ctx.beginPath();
    ctx.moveTo(cx2, tip);
    ctx.bezierCurveTo(cx2 + baseW * 1.15, tip + height * 0.38,
                      cx2 + baseW,         tip + height, cx2, tip + height);
    ctx.bezierCurveTo(cx2 - baseW,         tip + height,
                      cx2 - baseW * 1.15,  tip + height * 0.38, cx2, tip);
    ctx.closePath();
  }

  map.torches.forEach((t, idx) => {
    // Bake do corpo na primeira vez
    if (!t._bodyCache) t._bodyCache = _bakeTorchBody(t);

    const seed  = idx * 3.937 + 7.1;
    const flkA  = Math.sin(time * 10.1 + seed) * 1.2;
    const flkB  = Math.sin(time *  6.3 + seed + 2.1) * 0.8;
    const flkC  = Math.sin(time * 19.7 + seed + 4.5) * 0.35;
    const flick = flkA + flkB + flkC;

    const bx = t.tx * TILE + TILE / 2 - cam.x;
    const by = t.ty * TILE + TILE     - cam.y;

    ctx.save();

    // Pool de calor — substituído por 2 ellipses simples (sem createRadialGradient)
    const poolA = (0.09 + 0.035 * Math.sin(time * 4.4 + seed)).toFixed(2);
    ctx.fillStyle = `rgba(255,140,30,${poolA})`;
    ctx.beginPath();
    ctx.ellipse(bx, by, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,90,0,${(+poolA * 0.4).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(bx, by, 44, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo baked (madeira + cesto) — 1 drawImage
    const bc = t._bodyCache;
    ctx.drawImage(bc.canvas, bx - bc.ox, by - bc.oy);

    // Reflexo da chama no bastão (animado — barato)
    const stickY = by - 22;
    ctx.fillStyle = `rgba(255,160,30,${(0.10 + 0.06 * Math.abs(flick / 2.35)).toFixed(2)})`;
    ctx.fillRect(bx - 2, stickY, 1, 22);

    // Brasa (animada)
    ctx.fillStyle = `rgba(255,110,0,${(0.55 + 0.2 * Math.sin(time * 8.8 + seed)).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(bx, stickY - 6, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    const flameCX = bx + flick * 1.1;
    const cupY    = stickY - 4;
    const flameTY = cupY - 2;
    const fW = 5.5 + Math.abs(flick) * 0.6;
    const fH = 14  + flick * 0.7;

    // Halo de calor — 1 ellipse simples
    ctx.fillStyle = `rgba(255,110,10,${(0.20 + 0.08 * Math.abs(flick / 2.35)).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(flameCX, flameTY - fH * 0.35, fW * 2.5, fW * 2.4, 0, 0, Math.PI * 2);
    ctx.fill();

    const outerG = ctx.createLinearGradient(flameCX, flameTY - fH, flameCX, flameTY);
    outerG.addColorStop(0,    'rgba(255,100,0,0.0)');
    outerG.addColorStop(0.08, 'rgba(255,100,0,0.88)');
    outerG.addColorStop(1,    'rgba(190,50,0,0.92)');
    ctx.fillStyle = outerG;
    torchFlame(flameCX, flameTY - fH, fW, fH);
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,180,${(0.85 + 0.1 * Math.abs(flick / 2.35)).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(flameCX, flameTY - 1, fW * 0.7, fW * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawGravestones(map, cam, time) {
  if (!map.gravestones || map.gravestones.length === 0) return;

  map.gravestones.forEach((g, idx) => {
    const bx = g.tx * TILE + TILE / 2 - cam.x;
    const by = (g.ty + 1) * TILE - cam.y; // base no chão do tile

    ctx.save();

    // ── Sombra no chão ───────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(bx, by, 0, bx, by, 14);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.35)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Base — bloco retangular estreito ─────────────────────────────────
    const baseW = 18, baseH = 4;
    const baseX = bx - baseW / 2;
    const baseY = by - baseH;
    ctx.fillStyle = '#2e2e2e';
    ctx.fillRect(baseX, baseY, baseW, baseH);
    ctx.fillStyle = '#444';
    ctx.fillRect(baseX, baseY, baseW, 1);

    // ── Placa principal ───────────────────────────────────────────────────
    const stoneW = 14, stoneH = 20;
    const stoneX = bx - stoneW / 2;
    const stoneY = baseY - stoneH;

    const stoneGrad = ctx.createLinearGradient(stoneX, stoneY, stoneX + stoneW, stoneY);
    stoneGrad.addColorStop(0,    '#222');
    stoneGrad.addColorStop(0.25, '#333');
    stoneGrad.addColorStop(0.5,  '#3e3e3e');
    stoneGrad.addColorStop(0.75, '#333');
    stoneGrad.addColorStop(1,    '#1e1e1e');
    ctx.fillStyle = stoneGrad;
    ctx.fillRect(stoneX, stoneY, stoneW, stoneH);

    // Arestas
    ctx.fillStyle = '#555';
    ctx.fillRect(stoneX, stoneY, stoneW, 1);
    ctx.fillRect(stoneX, stoneY, 1, stoneH);
    ctx.fillStyle = '#111';
    ctx.fillRect(stoneX + stoneW - 1, stoneY, 1, stoneH);
    ctx.fillRect(stoneX, stoneY + stoneH - 1, stoneW, 1);

    // ── Topo em arco ─────────────────────────────────────────────────────
    const archR = stoneW / 2;
    ctx.fillStyle = stoneGrad;
    ctx.beginPath();
    ctx.arc(bx, stoneY, archR, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, stoneY, archR - 0.5, Math.PI, 0);
    ctx.stroke();

    // ── Cruz gravada ──────────────────────────────────────────────────────
    const crossCY = stoneY + 8;
    ctx.fillStyle = 'rgba(0,0,0,0.50)';
    ctx.fillRect(bx - 1, crossCY - 6, 2, 12);
    ctx.fillRect(bx - 5, crossCY - 2, 10, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(bx,     crossCY - 6, 1, 12);
    ctx.fillRect(bx - 5, crossCY - 2, 10, 1);

    // ── Musgo na base ─────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(40,60,20,0.45)';
    ctx.fillRect(stoneX + 2, stoneY + stoneH - 5, 3, 2);
    ctx.fillRect(stoneX + 8, stoneY + stoneH - 4, 4, 2);
    ctx.fillRect(stoneX + 1, stoneY + stoneH - 3, 2, 1);

    ctx.restore();
  });
}

function drawGravestones2(map, cam, time) {
  if (!map.gravestones2 || map.gravestones2.length === 0) return;

  map.gravestones2.forEach((g, idx) => {
    const bx = g.tx * TILE + TILE / 2 - cam.x;
    const by = (g.ty + 1) * TILE - cam.y;

    ctx.save();
    ctx.translate(bx, by);

    // ── Sombra no chão ───────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.40)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Base larga ────────────────────────────────────────────────────────
    const baseW = 24, baseH = 5;
    const baseX = -baseW / 2;
    const baseY = -baseH;
    ctx.fillStyle = '#272727';
    ctx.fillRect(baseX, baseY, baseW, baseH);
    // aresta superior iluminada
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(baseX, baseY, baseW, 1);
    // aresta direita escura
    ctx.fillStyle = '#111';
    ctx.fillRect(baseX + baseW - 1, baseY, 1, baseH);

    // ── Placa principal — mais larga e alta ───────────────────────────────
    const stoneW = 20, stoneH = 30;
    const stoneX = -stoneW / 2;
    const stoneY = baseY - stoneH;

    const stoneGrad = ctx.createLinearGradient(stoneX, stoneY, stoneX + stoneW, stoneY);
    stoneGrad.addColorStop(0,    '#1a1a1a');
    stoneGrad.addColorStop(0.2,  '#2c2c2c');
    stoneGrad.addColorStop(0.5,  '#363636');
    stoneGrad.addColorStop(0.8,  '#2a2a2a');
    stoneGrad.addColorStop(1,    '#161616');
    ctx.fillStyle = stoneGrad;
    ctx.fillRect(stoneX, stoneY, stoneW, stoneH);

    // arestas
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(stoneX,          stoneY, stoneW, 1);
    ctx.fillRect(stoneX,          stoneY, 1, stoneH);
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(stoneX + stoneW - 1, stoneY, 1, stoneH);
    ctx.fillRect(stoneX, stoneY + stoneH - 1, stoneW, 1);

    // ── Topo pontiagudo gótico ────────────────────────────────────────────
    //   dois degraus + ponta central
    //   degrau exterior
    ctx.fillStyle = stoneGrad;
    ctx.beginPath();
    ctx.moveTo(stoneX,            stoneY);           // base-esq
    ctx.lineTo(stoneX + stoneW,   stoneY);           // base-dir
    ctx.lineTo(stoneX + stoneW - 3, stoneY - 7);    // ombro-dir
    ctx.lineTo(0,                 stoneY - 16);      // ponta
    ctx.lineTo(stoneX + 3,        stoneY - 7);      // ombro-esq
    ctx.closePath();
    ctx.fill();

    // borda iluminada do lado esquerdo do topo
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(stoneX,     stoneY);
    ctx.lineTo(stoneX + 3, stoneY - 7);
    ctx.lineTo(0,          stoneY - 16);
    ctx.stroke();
    // borda escura lado direito
    ctx.strokeStyle = '#0d0d0d';
    ctx.beginPath();
    ctx.moveTo(stoneX + stoneW,     stoneY);
    ctx.lineTo(stoneX + stoneW - 3, stoneY - 7);
    ctx.lineTo(0,                   stoneY - 16);
    ctx.stroke();

    // ── Caveira gravada ───────────────────────────────────────────────────
    const skCY = stoneY + 13; // centro vertical da caveira
    const skCX = 0;

    // crânio (elipse)
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(skCX, skCY - 2, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // reflexo interno
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.ellipse(skCX - 1, skCY - 3, 3, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // olhos
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath();
    ctx.ellipse(skCX - 2.5, skCY - 2, 1.8, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(skCX + 2.5, skCY - 2, 1.8, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // nariz (losango)
    ctx.beginPath();
    ctx.moveTo(skCX,      skCY + 0.5);
    ctx.lineTo(skCX + 1,  skCY + 2);
    ctx.lineTo(skCX,      skCY + 3.5);
    ctx.lineTo(skCX - 1,  skCY + 2);
    ctx.closePath();
    ctx.fill();

    // mandíbula
    ctx.fillStyle = 'rgba(0,0,0,0.50)';
    ctx.fillRect(skCX - 5, skCY + 3, 10, 3);
    // dentes — 3 retângulos claros
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(skCX - 4, skCY + 3, 2, 3);
    ctx.fillRect(skCX - 1, skCY + 3, 2, 3);
    ctx.fillRect(skCX + 2, skCY + 3, 2, 3);

    // ── Rachaduras ────────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth   = 0.8;

    // rachadura diagonal longa
    ctx.beginPath();
    ctx.moveTo(stoneX + 4,  stoneY + 4);
    ctx.lineTo(stoneX + 7,  stoneY + 10);
    ctx.lineTo(stoneX + 5,  stoneY + 18);
    ctx.stroke();

    // rachadura curta direita
    ctx.beginPath();
    ctx.moveTo(stoneX + 14, stoneY + 8);
    ctx.lineTo(stoneX + 17, stoneY + 14);
    ctx.stroke();

    // reflexo de luz nas rachaduras (sobreposto, mais claro)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    ctx.moveTo(stoneX + 5,  stoneY + 4);
    ctx.lineTo(stoneX + 8,  stoneY + 10);
    ctx.lineTo(stoneX + 6,  stoneY + 18);
    ctx.stroke();

    // ── Musgo — manchas irregulares na base ───────────────────────────────
    ctx.fillStyle = 'rgba(30,55,15,0.50)';
    ctx.fillRect(stoneX + 1,  stoneY + stoneH - 6, 5, 2);
    ctx.fillRect(stoneX + 9,  stoneY + stoneH - 5, 4, 3);
    ctx.fillRect(stoneX + 14, stoneY + stoneH - 7, 3, 2);
    ctx.fillRect(stoneX + 3,  stoneY + stoneH - 3, 2, 1);

    ctx.restore();
  });
}

function drawWoodenCrosses(map, cam, time) {
  if (!map.woodenCrosses || map.woodenCrosses.length === 0) return;

  map.woodenCrosses.forEach((g, idx) => {
    const bx = g.tx * TILE + TILE / 2 - cam.x;
    const by = (g.ty + 1) * TILE - cam.y;

    ctx.save();
    ctx.translate(bx, by);

    // ── Sombra no chão ───────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(0, 0, 0, 0, 0, 13);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.35)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Dimensões ─────────────────────────────────────────────────────────
    const poleW  = 5;   // largura do poste vertical
    const poleH  = 34;  // altura total do poste
    const poleX  = -poleW / 2;
    const poleY  = -poleH;

    const armW   = 22;  // largura total do braço horizontal
    const armH   = 5;   // espessura do braço
    const armY   = poleY + 9; // posição vertical do braço (perto do topo)

    // ── Poste vertical ────────────────────────────────────────────────────
    const woodGrad = ctx.createLinearGradient(poleX, 0, poleX + poleW, 0);
    woodGrad.addColorStop(0,   '#1c0e06');
    woodGrad.addColorStop(0.2, '#3a1e0a');
    woodGrad.addColorStop(0.5, '#4a2810');
    woodGrad.addColorStop(0.8, '#331608');
    woodGrad.addColorStop(1,   '#150804');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(poleX, poleY, poleW, poleH);

    // veio de madeira central (longo)
    ctx.fillStyle = 'rgba(100,55,15,0.22)';
    ctx.fillRect(poleX + 1, poleY + 3, 1, poleH - 5);
    // veio secundário
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(poleX + 3, poleY + 6, 1, poleH - 10);

    // aresta esquerda iluminada
    ctx.fillStyle = 'rgba(180,100,40,0.18)';
    ctx.fillRect(poleX, poleY + 2, 1, poleH - 3);
    // aresta direita escura
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(poleX + poleW - 1, poleY + 2, 1, poleH - 3);

    // ── Braço horizontal ──────────────────────────────────────────────────
    const armX = -armW / 2;
    const armGrad = ctx.createLinearGradient(armX, armY, armX, armY + armH);
    armGrad.addColorStop(0,   '#1c0e06');
    armGrad.addColorStop(0.4, '#3a1e0a');
    armGrad.addColorStop(1,   '#4a2810');
    ctx.fillStyle = armGrad;
    ctx.fillRect(armX, armY, armW, armH);

    // veio do braço
    ctx.fillStyle = 'rgba(140,80,25,0.25)';
    ctx.fillRect(armX + 2, armY + 1, armW - 4, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(armX + 2, armY + 3, armW - 4, 1);

    // aresta superior iluminada do braço
    ctx.fillStyle = 'rgba(220,140,60,0.30)';
    ctx.fillRect(armX + 1, armY, armW - 2, 1);
    // aresta inferior escura
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(armX + 1, armY + armH - 1, armW - 2, 1);

    // ── Junção — corda/cordão que amarra os dois pedaços ──────────────────
    // quadrado escuro central onde se cruzam
    ctx.fillStyle = '#1a0a04';
    ctx.fillRect(poleX - 1, armY - 1, poleW + 2, armH + 2);

    // duas linhas diagonais simulando enrolamento de corda
    ctx.strokeStyle = '#2e1808';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(poleX - 1, armY - 1);
    ctx.lineTo(poleX + poleW + 1, armY + armH + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(poleX + poleW + 1, armY - 1);
    ctx.lineTo(poleX - 1, armY + armH + 1);
    ctx.stroke();

    // highlight da corda
    ctx.strokeStyle = 'rgba(160,90,30,0.20)';
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    ctx.moveTo(poleX, armY);
    ctx.lineTo(poleX + poleW, armY + armH);
    ctx.stroke();

    // ── Topo do poste — ponta ligeiramente lascada ────────────────────────
    ctx.fillStyle = '#2a1408';
    ctx.beginPath();
    ctx.moveTo(poleX,          poleY);
    ctx.lineTo(poleX + poleW,  poleY);
    ctx.lineTo(poleX + poleW - 1, poleY - 3);
    ctx.lineTo(poleX + 1,         poleY - 3);
    ctx.closePath();
    ctx.fill();
    // reflexo no topo
    ctx.fillStyle = 'rgba(200,120,50,0.15)';
    ctx.fillRect(poleX + 1, poleY - 3, 2, 3);

    // ── Pontas do braço — levemente lascadas ─────────────────────────────
    ctx.fillStyle = '#2a1408';
    // ponta esquerda
    ctx.beginPath();
    ctx.moveTo(armX,     armY);
    ctx.lineTo(armX,     armY + armH);
    ctx.lineTo(armX - 2, armY + armH - 1);
    ctx.lineTo(armX - 2, armY + 1);
    ctx.closePath();
    ctx.fill();
    // ponta direita
    ctx.beginPath();
    ctx.moveTo(armX + armW,     armY);
    ctx.lineTo(armX + armW,     armY + armH);
    ctx.lineTo(armX + armW + 2, armY + armH - 1);
    ctx.lineTo(armX + armW + 2, armY + 1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawUrns(map, cam, time) {
  if (!map.urns || map.urns.length === 0) return;

  map.urns.forEach((u, idx) => {
    const bx = u.tx * TILE + TILE / 2 - cam.x;
    const by = (u.ty + 1) * TILE - cam.y;

    const seed = idx * 3.53 + 0.8;

    ctx.save();

    // ── Sombra no chão ───────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(bx, by, 0, bx, by, 14);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.40)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Dimensões gerais ──────────────────────────────────────────────────
    const bodyH  = 26;   // altura do corpo
    const bodyRX = 11;   // raio horizontal máximo (barriga)
    const bodyRY = 13;   // raio vertical do corpo (elipse)
    const neckW  = 6;    // largura do gargalo
    const neckH  = 6;    // altura do gargalo
    const baseH  = 4;    // altura do pé
    const baseW  = 14;   // largura do pé

    const bodyY  = by - baseH - bodyH * 0.5; // centro vertical do corpo

    // gradiente lateral — pedra cinza escura com reflexo central
    function stoneGrad(x0, x1) {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0,    '#1a1a1e');
      g.addColorStop(0.18, '#2e2e36');
      g.addColorStop(0.45, '#3c3c46');
      g.addColorStop(0.55, '#3c3c46');
      g.addColorStop(0.82, '#28282e');
      g.addColorStop(1,    '#141418');
      return g;
    }

    // ── Pé / base ─────────────────────────────────────────────────────────
    const baseX = bx - baseW / 2;
    const baseY = by - baseH;
    ctx.fillStyle = stoneGrad(baseX, baseX + baseW);
    ctx.beginPath();
    ctx.moveTo(baseX + 2,          baseY);
    ctx.lineTo(baseX + baseW - 2,  baseY);
    ctx.lineTo(baseX + baseW,      by);
    ctx.lineTo(baseX,              by);
    ctx.closePath();
    ctx.fill();
    // aresta superior da base
    ctx.fillStyle = '#4a4a54';
    ctx.fillRect(baseX + 2, baseY, baseW - 4, 1);
    // aresta inferior (chão)
    ctx.fillStyle = '#0e0e12';
    ctx.fillRect(baseX, by - 1, baseW, 1);

    // ── Corpo — elipse larga ───────────────────────────────────────────────
    ctx.fillStyle = stoneGrad(bx - bodyRX, bx + bodyRX);
    ctx.beginPath();
    ctx.ellipse(bx, bodyY, bodyRX, bodyRY, 0, 0, Math.PI * 2);
    ctx.fill();

    // recorta o fundo do corpo (parte abaixo da base não deve aparecer)
    // — pintamos por cima com a sombra de chão, mas a elipse já fica coberta

    // highlight lateral esquerdo (luz vinda de cima-esq)
    const hiGrad = ctx.createRadialGradient(
      bx - bodyRX * 0.4, bodyY - bodyRY * 0.35, 1,
      bx - bodyRX * 0.4, bodyY - bodyRY * 0.35, bodyRX * 1.1
    );
    hiGrad.addColorStop(0,   'rgba(180,180,200,0.13)');
    hiGrad.addColorStop(1,   'rgba(180,180,200,0)');
    ctx.fillStyle = hiGrad;
    ctx.beginPath();
    ctx.ellipse(bx, bodyY, bodyRX, bodyRY, 0, 0, Math.PI * 2);
    ctx.fill();

    // sombra interna direita
    const shGrad = ctx.createRadialGradient(
      bx + bodyRX * 0.5, bodyY + bodyRY * 0.2, 2,
      bx + bodyRX * 0.5, bodyY + bodyRY * 0.2, bodyRX
    );
    shGrad.addColorStop(0,   'rgba(0,0,0,0.30)');
    shGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = shGrad;
    ctx.beginPath();
    ctx.ellipse(bx, bodyY, bodyRX, bodyRY, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Motivo decorativo — faixa horizontal com runas/ranhuras ──────────
    const bandY = bodyY + 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.40)';
    ctx.lineWidth   = 1;
    // faixa superior
    ctx.beginPath();
    ctx.moveTo(bx - 8, bandY - 3);
    ctx.lineTo(bx + 8, bandY - 3);
    ctx.stroke();
    // faixa inferior
    ctx.beginPath();
    ctx.moveTo(bx - 9, bandY + 4);
    ctx.lineTo(bx + 9, bandY + 4);
    ctx.stroke();
    // ranhuras verticais entre as faixas (simulam runa/ornamento)
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth   = 0.8;
    for (let i = -3; i <= 3; i++) {
      const rx = bx + i * 2.6;
      ctx.beginPath();
      ctx.moveTo(rx, bandY - 2);
      ctx.lineTo(rx, bandY + 3);
      ctx.stroke();
    }
    // reflexo das ranhuras
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth   = 0.5;
    for (let i = -3; i <= 3; i++) {
      const rx = bx + i * 2.6 + 0.5;
      ctx.beginPath();
      ctx.moveTo(rx, bandY - 2);
      ctx.lineTo(rx, bandY + 3);
      ctx.stroke();
    }

    // ── Gargalo ───────────────────────────────────────────────────────────
    const neckX = bx - neckW / 2;
    const neckY = by - baseH - bodyH - neckH + 2; // topo do corpo
    ctx.fillStyle = stoneGrad(neckX, neckX + neckW);
    ctx.beginPath();
    // trapézio levemente alargado na base do gargalo
    ctx.moveTo(neckX - 2,         neckY + neckH);
    ctx.lineTo(neckX + neckW + 2, neckY + neckH);
    ctx.lineTo(neckX + neckW,     neckY);
    ctx.lineTo(neckX,             neckY);
    ctx.closePath();
    ctx.fill();
    // aresta lateral esquerda iluminada
    ctx.fillStyle = 'rgba(180,180,200,0.12)';
    ctx.fillRect(neckX, neckY, 1, neckH);
    // aresta lateral direita escura
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(neckX + neckW - 1, neckY, 1, neckH);

    // ── Tampa — disco achatado com pequeno puxador ────────────────────────
    const lidRX  = neckW / 2 + 4;   // raio da tampa (um pouco maior que o gargalo)
    const lidH   = 4;
    const lidY   = neckY - lidH;
    const knobW  = 4;
    const knobH  = 4;
    const knobY  = lidY - knobH;

    // corpo da tampa
    ctx.fillStyle = stoneGrad(bx - lidRX, bx + lidRX);
    ctx.beginPath();
    ctx.moveTo(bx - lidRX + 1, lidY + lidH);   // base-esq
    ctx.lineTo(bx + lidRX - 1, lidY + lidH);   // base-dir
    ctx.lineTo(bx + lidRX,     lidY + 1);       // ombro-dir
    ctx.lineTo(bx - lidRX,     lidY + 1);       // ombro-esq
    ctx.closePath();
    ctx.fill();
    // aresta superior da tampa (iluminada)
    ctx.fillStyle = '#50505c';
    ctx.fillRect(bx - lidRX, lidY + 1, lidRX * 2, 1);
    // aresta inferior da tampa (sombra sobre o gargalo)
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(bx - lidRX + 1, lidY + lidH - 1, (lidRX - 1) * 2, 1);

    // puxador arredondado
    const knobGrad = ctx.createLinearGradient(bx - knobW / 2, knobY, bx + knobW / 2, knobY);
    knobGrad.addColorStop(0,   '#1e1e24');
    knobGrad.addColorStop(0.4, '#38383e');
    knobGrad.addColorStop(1,   '#18181c');
    ctx.fillStyle = knobGrad;
    ctx.beginPath();
    ctx.ellipse(bx, knobY + knobH * 0.55, knobW / 2, knobH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // reflexo no puxador
    ctx.fillStyle = 'rgba(200,200,220,0.10)';
    ctx.beginPath();
    ctx.ellipse(bx - 0.5, knobY + knobH * 0.35, knobW * 0.28, knobH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Musgo / mancha de umidade na base ────────────────────────────────
    ctx.fillStyle = 'rgba(30,55,15,0.42)';
    ctx.fillRect(baseX + 1, baseY + 1, 3, 2);
    ctx.fillRect(baseX + 7, baseY + 2, 4, 1);
    ctx.fillRect(baseX + 3, baseY + 3, 2, 1);

    ctx.restore();
  });
}

function drawEnergyOrbs(map, cam, time) {
  if (!map.energyOrbs || map.energyOrbs.length === 0) return;

  map.energyOrbs.forEach((o, idx) => {
    const bx   = o.tx * TILE + TILE / 2 - cam.x;
    const by   = (o.ty + 1) * TILE - cam.y;
    const seed = idx * 5.17 + 2.3;

    // Animações
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.8 + seed);        // 0..1 lento
    const bob   = Math.sin(time * 2.1 + seed) * 2.8;              // flutuação ±px
    const rgb   = hexToRgb(o.color || '#8844ff');

    ctx.save();

    // ── Sombra no chão ────────────────────────────────────────────────────
    const shadowA = (0.20 + 0.12 * pulse).toFixed(2);
    const shdG = ctx.createRadialGradient(bx, by, 0, bx, by, 20);
    shdG.addColorStop(0, `rgba(0,0,0,${shadowA})`);
    shdG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shdG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Pedestal ─────────────────────────────────────────────────────────
    const baseW = 24, baseH = 8;
    const colW  = 10, colH  = 14;
    const capW  = 16, capH  = 4;

    const baseX = bx - baseW / 2;
    const baseY = by - baseH;
    const colX  = bx - colW  / 2;
    const colY  = baseY - colH;
    const capX  = bx - capW  / 2;
    const capY  = colY  - capH;

    function voidStone(x0, x1) {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0,   '#0e0c18');
      g.addColorStop(0.3, '#1a1828');
      g.addColorStop(0.6, '#161424');
      g.addColorStop(1,   '#080610');
      return g;
    }

    // Base trapezoidal
    ctx.fillStyle = voidStone(baseX, baseX + baseW);
    ctx.beginPath();
    ctx.moveTo(baseX + 2,         baseY);
    ctx.lineTo(baseX + baseW - 2, baseY);
    ctx.lineTo(baseX + baseW,     by);
    ctx.lineTo(baseX,             by);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a2840';   // aresta topo — pedra exposta
    ctx.fillRect(baseX + 2, baseY, baseW - 4, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.40)'; // aresta fundo
    ctx.fillRect(baseX, by - 1, baseW, 1);
    // runa entalhada na base (sem glow, só contorno)
    ctx.strokeStyle = `rgba(${rgb},0.22)`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(bx - 5, baseY + 3);
    ctx.lineTo(bx,     baseY + 6);
    ctx.lineTo(bx + 5, baseY + 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx, baseY + 2);
    ctx.lineTo(bx, baseY + 7);
    ctx.stroke();

    // Coluna central
    ctx.fillStyle = voidStone(colX, colX + colW);
    ctx.fillRect(colX, colY, colW, colH);
    // estrias verticais
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(colX + 2, colY + 2, 1, colH - 4);
    ctx.fillRect(colX + 5, colY + 3, 1, colH - 5);
    ctx.fillRect(colX + 7, colY + 2, 1, colH - 4);
    // aresta esq — reflexo frio
    ctx.fillStyle = 'rgba(160,140,220,0.07)';
    ctx.fillRect(colX, colY, 1, colH);
    // aresta dir — sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(colX + colW - 1, colY, 1, colH);
    // veia de energia pulsando na coluna
    const veinA = (0.08 + 0.14 * pulse).toFixed(2);
    ctx.fillStyle = `rgba(${rgb},${veinA})`;
    ctx.fillRect(colX + 4, colY + 1, 1, colH - 2);

    // Capitel (topo da coluna)
    ctx.fillStyle = voidStone(capX, capX + capW);
    ctx.beginPath();
    ctx.moveTo(capX + 2,         capY);
    ctx.lineTo(capX + capW - 2,  capY);
    ctx.lineTo(capX + capW,      capY + capH);
    ctx.lineTo(capX,             capY + capH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#302e48';   // aresta topo
    ctx.fillRect(capX + 2, capY, capW - 4, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; // aresta fundo
    ctx.fillRect(capX, capY + capH - 1, capW, 1);
    // chanfros laterais
    ctx.fillStyle = 'rgba(160,140,220,0.06)';
    ctx.fillRect(capX, capY, 1, capH);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(capX + capW - 1, capY, 1, capH);

    // ── Orb flutuante ─────────────────────────────────────────────────────
    const orbR  = 10;
    const orbCX = bx;
    const orbCY = capY - orbR - 4 + bob;   // flutua suavemente

    // Aura externa ampla
    const auraR = orbR * (2.1 + 0.7 * pulse);
    const auraG = ctx.createRadialGradient(orbCX, orbCY, orbR * 0.4, orbCX, orbCY, auraR);
    auraG.addColorStop(0,   `rgba(${rgb},${(0.28 + 0.10 * pulse).toFixed(2)})`);
    auraG.addColorStop(0.45,`rgba(${rgb},${(0.10 + 0.06 * pulse).toFixed(2)})`);
    auraG.addColorStop(1,   `rgba(${rgb},0)`);
    ctx.fillStyle = auraG;
    ctx.beginPath();
    ctx.ellipse(orbCX, orbCY, auraR, auraR * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();

    // Anéis orbitais — elipses finas girando (sem blur, só alpha)
    const ang = time * 1.3 + seed;
    ctx.save();
    ctx.translate(orbCX, orbCY);
    ctx.rotate(ang);
    ctx.strokeStyle = `rgba(${rgb},${(0.22 + 0.14 * pulse).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, orbR + 6, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(orbCX, orbCY);
    ctx.rotate(-ang * 0.65 + 1.05);
    ctx.strokeStyle = `rgba(${rgb},${(0.14 + 0.10 * pulse).toFixed(2)})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, orbR + 4, 2.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Corpo da orb — radialGradient do núcleo branco até a cor da borda
    const orbG = ctx.createRadialGradient(
      orbCX - orbR * 0.28, orbCY - orbR * 0.30, orbR * 0.04,
      orbCX, orbCY, orbR
    );
    orbG.addColorStop(0,    `rgba(255,255,255,${(0.80 + 0.15 * pulse).toFixed(2)})`);
    orbG.addColorStop(0.16, `rgba(${rgb},0.95)`);
    orbG.addColorStop(0.55, `rgba(${rgb},0.85)`);
    orbG.addColorStop(1,    `rgba(${rgb},0.50)`);
    ctx.fillStyle = orbG;
    ctx.beginPath();
    ctx.arc(orbCX, orbCY, orbR, 0, Math.PI * 2);
    ctx.fill();

    // Borda escura — profundidade da esfera
    const rimG = ctx.createRadialGradient(orbCX, orbCY, orbR * 0.55, orbCX, orbCY, orbR);
    rimG.addColorStop(0, 'rgba(0,0,0,0)');
    rimG.addColorStop(0.7,'rgba(0,0,0,0.10)');
    rimG.addColorStop(1,  'rgba(0,0,0,0.48)');
    ctx.fillStyle = rimG;
    ctx.beginPath();
    ctx.arc(orbCX, orbCY, orbR, 0, Math.PI * 2);
    ctx.fill();

    // Reflexo especular
    const specG = ctx.createRadialGradient(
      orbCX - orbR * 0.30, orbCY - orbR * 0.32, 0,
      orbCX - orbR * 0.30, orbCY - orbR * 0.32, orbR * 0.40
    );
    specG.addColorStop(0,   `rgba(255,255,255,${(0.70 + 0.20 * pulse).toFixed(2)})`);
    specG.addColorStop(0.5, 'rgba(255,255,255,0.14)');
    specG.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = specG;
    ctx.beginPath();
    ctx.arc(orbCX, orbCY, orbR, 0, Math.PI * 2);
    ctx.fill();

    // Reflexo de luz no capitel (brilho que a orb projeta para baixo)
    const capGlowA = (0.08 + 0.10 * pulse).toFixed(2);
    const capGlow  = ctx.createRadialGradient(orbCX, capY + capH, 0, orbCX, capY + capH, 10);
    capGlow.addColorStop(0,  `rgba(${rgb},${capGlowA})`);
    capGlow.addColorStop(1,  `rgba(${rgb},0)`);
    ctx.fillStyle = capGlow;
    ctx.beginPath();
    ctx.ellipse(orbCX, capY + capH, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawSkullPedestals(map, cam, time) {
  if (!map.skullPedestals || map.skullPedestals.length === 0) return;

  map.skullPedestals.forEach((s, idx) => {
    const bx = s.tx * TILE + TILE / 2 - cam.x;
    const by = (s.ty + 1) * TILE - cam.y;

    const seed  = idx * 3.19 + 1.6;
    // brilho dos olhos pulsa lentamente
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + seed);

    ctx.save();

    // ── Sombra no chão ───────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(bx, by, 0, bx, by, 16);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.45)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── helpers ───────────────────────────────────────────────────────────
    function stoneGrad(x0, x1) {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0,    '#181820');
      g.addColorStop(0.2,  '#2c2c38');
      g.addColorStop(0.5,  '#363644');
      g.addColorStop(0.8,  '#26262e');
      g.addColorStop(1,    '#121218');
      return g;
    }

    // ── Pedestal ──────────────────────────────────────────────────────────
    // topo do pedestal (plataforma onde a caveira assenta)
    const capW  = 20, capH  = 4;
    const capX  = bx - capW / 2;
    const capY  = by - 38; // altura total ~38px

    // coluna central
    const colW  = 12, colH  = 18;
    const colX  = bx - colW / 2;
    const colY  = capY + capH;

    // base larga
    const baseW = 22, baseH = 16;
    const baseX = bx - baseW / 2;
    const baseY = by - baseH;

    // ── Base ──────────────────────────────────────────────────────────────
    ctx.fillStyle = stoneGrad(baseX, baseX + baseW);
    ctx.beginPath();
    ctx.moveTo(baseX + 2,         baseY);
    ctx.lineTo(baseX + baseW - 2, baseY);
    ctx.lineTo(baseX + baseW,     by);
    ctx.lineTo(baseX,             by);
    ctx.closePath();
    ctx.fill();
    // aresta superior
    ctx.fillStyle = '#44444e';
    ctx.fillRect(baseX + 2, baseY, baseW - 4, 1);
    // aresta inferior
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(baseX, by - 1, baseW, 1);
    // musgo
    ctx.fillStyle = 'rgba(28,52,14,0.42)';
    ctx.fillRect(baseX + 1, baseY + 1, 3, 2);
    ctx.fillRect(baseX + 9, baseY + 2, 4, 1);
    ctx.fillRect(baseX + 16, baseY + 1, 3, 2);

    // ── Coluna ────────────────────────────────────────────────────────────
    ctx.fillStyle = stoneGrad(colX, colX + colW);
    ctx.fillRect(colX, colY, colW, colH);
    // estrias verticais
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(colX + 2, colY + 2, 1, colH - 4);
    ctx.fillRect(colX + 5, colY + 3, 1, colH - 5);
    ctx.fillRect(colX + 8, colY + 2, 1, colH - 4);
    // aresta esq iluminada
    ctx.fillStyle = 'rgba(200,200,220,0.07)';
    ctx.fillRect(colX, colY, 1, colH);
    // aresta dir escura
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(colX + colW - 1, colY, 1, colH);

    // ── Capitel (topo da coluna) ──────────────────────────────────────────
    ctx.fillStyle = stoneGrad(capX, capX + capW);
    ctx.beginPath();
    ctx.moveTo(capX + 2,         capY);
    ctx.lineTo(capX + capW - 2,  capY);
    ctx.lineTo(capX + capW,      capY + capH);
    ctx.lineTo(capX,             capY + capH);
    ctx.closePath();
    ctx.fill();
    // aresta superior (mais clara — superfície exposta)
    ctx.fillStyle = '#48485a';
    ctx.fillRect(capX + 2, capY, capW - 4, 1);
    // aresta inferior
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(capX, capY + capH - 1, capW, 1);
    // chanfro esq/dir
    ctx.fillStyle = 'rgba(200,200,220,0.06)';
    ctx.fillRect(capX, capY, 1, capH);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(capX + capW - 1, capY, 1, capH);

    // ── Caveira ────────────────────────────────────────────────────────────
    const skCY = capY - 10; // centro do crânio
    const skRX = 9, skRY = 9;

    // ── Mandíbula ─────────────────────────────────────────────────────────
    const jawY  = skCY + 5;
    const jawW  = 13, jawH = 7;
    const jawGrad = ctx.createLinearGradient(bx - jawW / 2, jawY, bx + jawW / 2, jawY);
    jawGrad.addColorStop(0,   '#1e1a14');
    jawGrad.addColorStop(0.4, '#2e2820');
    jawGrad.addColorStop(1,   '#181410');
    ctx.fillStyle = jawGrad;
    ctx.beginPath();
    ctx.moveTo(bx - jawW / 2,     jawY);
    ctx.lineTo(bx + jawW / 2,     jawY);
    ctx.lineTo(bx + jawW / 2 - 1, jawY + jawH);
    ctx.lineTo(bx - jawW / 2 + 1, jawY + jawH);
    ctx.closePath();
    ctx.fill();

    // ── Crânio principal ──────────────────────────────────────────────────
    const skullGrad = ctx.createRadialGradient(
      bx - skRX * 0.25, skCY - skRY * 0.3, 1,
      bx, skCY, skRX * 1.4
    );
    skullGrad.addColorStop(0,   '#3a3428');
    skullGrad.addColorStop(0.4, '#2a241c');
    skullGrad.addColorStop(1,   '#141008');
    ctx.fillStyle = skullGrad;
    ctx.beginPath();
    ctx.ellipse(bx, skCY, skRX, skRY, 0, 0, Math.PI * 2);
    ctx.fill();

    // contorno sutil
    ctx.strokeStyle = 'rgba(255,255,220,0.07)';
    ctx.lineWidth   = 0.8;
    ctx.beginPath();
    ctx.ellipse(bx, skCY, skRX - 0.5, skRY - 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // highlight no topo-esquerdo
    ctx.fillStyle = 'rgba(220,210,180,0.09)';
    ctx.beginPath();
    ctx.ellipse(bx - skRX * 0.3, skCY - skRY * 0.38, skRX * 0.55, skRY * 0.38, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // ── Cavidade nasal ────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.70)';
    ctx.beginPath();
    ctx.moveTo(bx,      skCY + 2);
    ctx.lineTo(bx + 2,  skCY + 5);
    ctx.lineTo(bx,      skCY + 7);
    ctx.lineTo(bx - 2,  skCY + 5);
    ctx.closePath();
    ctx.fill();

    // ── Fissura craniana ──────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(0,0,0,0.50)';
    ctx.lineWidth   = 0.8;
    ctx.beginPath();
    ctx.moveTo(bx + 2,  skCY - skRY + 2);
    ctx.lineTo(bx + 4,  skCY - 3);
    ctx.lineTo(bx + 2,  skCY + 1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,200,0.04)';
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    ctx.moveTo(bx + 3,  skCY - skRY + 2);
    ctx.lineTo(bx + 5,  skCY - 3);
    ctx.lineTo(bx + 3,  skCY + 1);
    ctx.stroke();

    // ── Olhos — brilho sobrenatural pulsante ──────────────────────────────
    const eyeOffsets = [-3.2, 3.2];
    const eyeColor   = s.eyeColor || '#00ffaa'; // cor customizável por instância

    eyeOffsets.forEach(ox => {
      const ex = bx + ox;
      const ey = skCY - 1;

      // cavidade (buraco escuro)
      ctx.fillStyle = 'rgba(0,0,0,0.80)';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 2.8, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // aura externa do brilho
      const aura = ctx.createRadialGradient(ex, ey, 0, ex, ey, 7 + pulse * 3);
      aura.addColorStop(0,   `rgba(${hexToRgb(eyeColor)},${(0.25 + 0.15 * pulse).toFixed(2)})`);
      aura.addColorStop(1,   `rgba(${hexToRgb(eyeColor)},0)`);
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 7 + pulse * 3, 6 + pulse * 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // núcleo brilhante
      ctx.shadowColor = eyeColor;
      ctx.shadowBlur  = 6 + pulse * 8;
      ctx.fillStyle   = `rgba(${hexToRgb(eyeColor)},${(0.6 + 0.4 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 1.6, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur  = 0;
    });

    ctx.restore();
  });
}

// converte hex '#rrggbb' para string 'r,g,b' para uso em rgba()
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function drawCoffins(map, cam, time) {
  if (!map.coffins || map.coffins.length === 0) return;

  map.coffins.forEach((c, idx) => {
    const bx = c.tx * TILE + TILE / 2 - cam.x;
    const by = (c.ty + 1) * TILE - cam.y; // base no chão

    ctx.save();

    // ── Sombra no chão ───────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(bx, by, 0, bx, by, 20);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.40)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dimensões do caixão — 2 tiles de altura
    const cW  = 20; // largura total
    const cH  = 52; // altura total (~2 tiles)
    const cX  = bx - cW / 2;
    const cY  = by - cH;

    // ── Silhueta hexagonal do caixão (forma clássica) ─────────────────────
    // Corte nos ombros: 4px de cada lado a 12px do topo
    const shoulderY = cY + 12;
    const shoulderCut = 4;

    ctx.beginPath();
    ctx.moveTo(cX + shoulderCut, cY);           // topo-esq
    ctx.lineTo(cX + cW - shoulderCut, cY);      // topo-dir
    ctx.lineTo(cX + cW, shoulderY);             // ombro-dir
    ctx.lineTo(cX + cW, cY + cH - 3);          // base-dir
    ctx.lineTo(cX + cW - 3, cY + cH);          // pé-dir
    ctx.lineTo(cX + 3, cY + cH);               // pé-esq
    ctx.lineTo(cX, cY + cH - 3);               // base-esq
    ctx.lineTo(cX, shoulderY);                  // ombro-esq
    ctx.closePath();

    // Gradiente lateral — madeira escura com reflexo central
    const woodGrad = ctx.createLinearGradient(cX, cY, cX + cW, cY);
    woodGrad.addColorStop(0,    '#1e0e04');
    woodGrad.addColorStop(0.2,  '#3a1e08');
    woodGrad.addColorStop(0.45, '#4e2a0e');
    woodGrad.addColorStop(0.55, '#4e2a0e');
    woodGrad.addColorStop(0.8,  '#3a1e08');
    woodGrad.addColorStop(1,    '#160a02');
    ctx.fillStyle = woodGrad;
    ctx.fill();

    // ── Borda — arestas iluminadas e sombreadas ───────────────────────────
    ctx.strokeStyle = '#6a3a10';
    ctx.lineWidth = 1;
    // lado esquerdo e topo (iluminados)
    ctx.beginPath();
    ctx.moveTo(cX + shoulderCut, cY);
    ctx.lineTo(cX + cW - shoulderCut, cY);
    ctx.moveTo(cX + shoulderCut, cY);
    ctx.lineTo(cX, shoulderY);
    ctx.lineTo(cX, cY + cH - 3);
    ctx.stroke();
    // lado direito e base (sombra)
    ctx.strokeStyle = '#0e0604';
    ctx.beginPath();
    ctx.moveTo(cX + cW - shoulderCut, cY);
    ctx.lineTo(cX + cW, shoulderY);
    ctx.lineTo(cX + cW, cY + cH - 3);
    ctx.lineTo(cX + cW - 3, cY + cH);
    ctx.lineTo(cX + 3, cY + cH);
    ctx.stroke();

    // ── Veios verticais de madeira ────────────────────────────────────────
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.5;
    for (const vx of [cX + 5, cX + 8, cX + 11, cX + 15]) {
      ctx.beginPath();
      ctx.moveTo(vx, shoulderY + 1);
      ctx.lineTo(vx, cY + cH - 5);
      ctx.stroke();
    }

    // ── Tampa — linha de divisão com fechadura ────────────────────────────
    // Linha central vertical (junta da tampa)
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, cY + 2);
    ctx.lineTo(bx, cY + cH - 2);
    ctx.stroke();

    // ── Cruz na parte superior ────────────────────────────────────────────
    const crCY = cY + 7;
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.fillRect(bx - 1, crCY - 4, 2, 8);
    ctx.fillRect(bx - 4, crCY - 1, 8, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(bx,     crCY - 4, 1, 8);
    ctx.fillRect(bx - 4, crCY,     8, 1);

    ctx.restore();
  });
}

function initMushroomCache(m, idx) {
  const scale = m.scale || 1.0;
  const col   = m.color || '#8833ff';

  // Pre-computa valores fixos uma única vez
  m._rgb      = hexToRgb(col);
  m._col      = col;
  m._colLight = shiftColor(col,  20);
  m._colMid   = shiftColor(col, -15);
  m._colDark  = shiftColor(col, -55);
  m._stemW    = Math.round(4  * scale);
  m._stemH    = Math.round(11 * scale);
  m._capRX    = Math.round(9  * scale);
  m._capRY    = Math.round(5  * scale);
  m._seed     = idx * 5.23 + 2.1;

  // Bake das partes ESTÁTICAS em um offscreen canvas
  const { _stemW: sW, _stemH: sH, _capRX: cRX, _capRY: cRY } = m;
  const pad = 6;
  const cW  = (cRX + pad) * 2;
  const cH  = sH + cRY + pad * 2;
  const ox  = cW / 2;       // centro horizontal dentro do offscreen
  const oy  = cH - pad;     // base (y) dentro do offscreen

  const off = document.createElement('canvas');
  off.width  = cW;
  off.height = cH;
  const c = off.getContext('2d');

  const stemX = ox - sW / 2;
  const stemY = oy - sH;
  const capY  = stemY;

  // Sombra no chão
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.beginPath();
  c.ellipse(ox, oy, sW * 1.4, sW * 0.5, 0, 0, Math.PI * 2);
  c.fill();

  // Haste orgânica
  const stemGrad = c.createLinearGradient(stemX, stemY, stemX + sW, stemY);
  stemGrad.addColorStop(0,   '#3b284a');
  stemGrad.addColorStop(0.4, '#2c2038');
  stemGrad.addColorStop(1,   '#312840');
  c.fillStyle = stemGrad;
  c.beginPath();
  c.moveTo(stemX, oy);
  c.quadraticCurveTo(stemX - sW * 0.4, oy - sH * 0.5, stemX + sW * 0.1, stemY);
  c.lineTo(stemX + sW * 0.9, stemY);
  c.quadraticCurveTo(stemX + sW * 1.4, oy - sH * 0.5, stemX + sW, oy);
  c.closePath();
  c.fill();

  // Sombra projetada embaixo do chapéu
  c.fillStyle = 'rgba(0,0,0,0.45)';
  c.beginPath();
  c.ellipse(ox, capY + cRY * 0.5, cRX * 0.9, cRY * 0.6, 0, 0, Math.PI * 2);
  c.fill();

  // Chapéu — gradiente radial
  const capGrad = c.createRadialGradient(
    ox - cRX * 0.2, capY - cRY * 0.3, 0,
    ox, capY, cRX * 1.3
  );
  capGrad.addColorStop(0,   m._colLight);
  capGrad.addColorStop(0.5, m._colMid);
  capGrad.addColorStop(1,   m._colDark);
  c.fillStyle = capGrad;
  c.beginPath();
  c.ellipse(ox, capY, cRX, cRY, 0, 0, Math.PI * 2);
  c.fill();

  // Pintas estáticas
  const spots = [
    { ox: -cRX * 0.45, oy: -cRY * 0.20, r: 1.5 * scale, a: 0.28 },
    { ox:  cRX * 0.32, oy: -cRY * 0.42, r: 1.1 * scale, a: 0.22 },
    { ox: -cRX * 0.15, oy: -cRY * 0.55, r: 0.9 * scale, a: 0.18 },
    { ox:  cRX * 0.60, oy: -cRY * 0.15, r: 0.8 * scale, a: 0.14 },
  ];
  spots.forEach(sp => {
    c.fillStyle = `rgba(255,255,255,${sp.a})`;
    c.beginPath();
    c.arc(ox + sp.ox, capY + sp.oy, sp.r, 0, Math.PI * 2);
    c.fill();
  });

  m._cache   = off;
  m._cacheOX = ox;
  m._cacheOY = oy;
}

function drawVoidCrystals(map, cam, time) {
  if (!map.voidCrystals || map.voidCrystals.length === 0) return;

  map.voidCrystals.forEach((cluster, ci) => {
    const baseBX = cluster.tx * TILE + TILE / 2 - cam.x;
    const baseBY = (cluster.ty + 1) * TILE       - cam.y;

    // Culling
    if (baseBX < -80 || baseBX > W + 80 || baseBY < -120 || baseBY > H + 20) return;

    // Cada cluster tem 1–3 cristais definidos por seed determinística
    const clusterSeed = ci * 7.31 + 3.17;
    const count = cluster.count ?? 2; // padrão: 2 cristais por cluster

    // Configuração de cada cristal no cluster (offsets e escalas fixas)
    const CRYSTAL_CONFIGS = [
      { ox:  0,   scale: 1.00, angle:  0.00, seed: 0.00 }, // central — maior
      { ox: -10,  scale: 0.72, angle: -0.18, seed: 2.61 }, // esquerdo — menor, levemente inclinado
      { ox:  9,   scale: 0.60, angle:  0.14, seed: 5.05 }, // direito — menor ainda
    ];

    // Sombra elíptica no chão — uma só para o cluster inteiro
    const shadowA = (0.18 + 0.08 * Math.sin(time * 1.6 + clusterSeed)).toFixed(2);
    const shdG = ctx.createRadialGradient(baseBX, baseBY, 0, baseBX, baseBY, 22);
    shdG.addColorStop(0, `rgba(0,0,0,${shadowA})`);
    shdG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shdG;
    ctx.beginPath();
    ctx.ellipse(baseBX, baseBY, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Desenha cristais de trás para frente (central por último = frente)
    const order = count === 3 ? [1, 2, 0] : count === 2 ? [1, 0] : [0];

    for (const ci2 of order) {
      const cfg   = CRYSTAL_CONFIGS[ci2];
      const seed  = clusterSeed + cfg.seed;
      const bx    = baseBX + cfg.ox;
      const by    = baseBY;
      const sc    = cfg.scale * (cluster.scale ?? 1.0);
      const angle = cfg.angle;

      // Dimensões do cristal (em coordenadas locais, antes do scale)
      // Forma: hexágono alongado — ponta em cima, base larga embaixo
      const W_top  = 5  * sc;   // meia-largura da ponta
      const W_mid  = 10 * sc;   // meia-largura do ventre
      const W_base = 7  * sc;   // meia-largura da base
      const H_top  = 28 * sc;   // altura da ponta ao ventre
      const H_bot  = 10 * sc;   // altura do ventre à base

      // Pulso lento e independente por cristal
      const pulse  = 0.5 + 0.5 * Math.sin(time * 1.9 + seed);
      const pulse2 = 0.5 + 0.5 * Math.sin(time * 2.7 + seed + 1.4);

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(angle);

      // ── Clip no contorno do cristal (para todos os fills internos) ────────
      ctx.beginPath();
      ctx.moveTo(0,       -H_top - H_bot);   // ponta
      ctx.lineTo( W_top,  -H_top - H_bot + 4 * sc);
      ctx.lineTo( W_mid,  -H_bot);            // ventre direito
      ctx.lineTo( W_base,  0);               // base direita
      ctx.lineTo(-W_base,  0);               // base esquerda
      ctx.lineTo(-W_mid,  -H_bot);           // ventre esquerdo
      ctx.lineTo(-W_top,  -H_top - H_bot + 4 * sc);
      ctx.closePath();
      ctx.save();
      ctx.clip();

      // ── Corpo base — gradiente vertical, negro-arroxeado ─────────────────
      const bodyG = ctx.createLinearGradient(0, -H_top - H_bot, 0, 0);
      bodyG.addColorStop(0,    `rgba(60,0,110,${(0.85 + 0.10 * pulse).toFixed(2)})`);
      bodyG.addColorStop(0.30, `rgba(40,0, 85,0.95)`);
      bodyG.addColorStop(0.65, `rgba(25,0, 55,0.98)`);
      bodyG.addColorStop(1,    `rgba(10,0, 25,1.00)`);
      ctx.fillStyle = bodyG;
      ctx.fillRect(-W_mid - 2, -H_top - H_bot - 2, W_mid * 2 + 4, H_top + H_bot + 4);

      // ── Núcleo interno — coluna de luz roxa pulsante ─────────────────────
      const coreW = W_mid * 0.30;
      const coreG = ctx.createLinearGradient(0, -H_top - H_bot, 0, -H_bot * 0.3);
      coreG.addColorStop(0,   `rgba(200, 80,255,${(0.00).toFixed(2)})`);
      coreG.addColorStop(0.15,`rgba(200, 80,255,${(0.18 + 0.22 * pulse).toFixed(2)})`);
      coreG.addColorStop(0.50,`rgba(160, 40,220,${(0.28 + 0.18 * pulse).toFixed(2)})`);
      coreG.addColorStop(0.85,`rgba(120,  0,180,${(0.14 + 0.10 * pulse).toFixed(2)})`);
      coreG.addColorStop(1,   `rgba(80,   0,140,0.00)`);
      ctx.fillStyle = coreG;
      ctx.fillRect(-coreW, -H_top - H_bot, coreW * 2, H_top + H_bot);

      // ── Veias laterais — reflexo de faceta ────────────────────────────────
      // Faceta esquerda iluminada (como luz vinda do topo-esq)
      const facetG = ctx.createLinearGradient(-W_mid, 0, 0, 0);
      facetG.addColorStop(0,   `rgba(130,40,220,${(0.30 + 0.14 * pulse2).toFixed(2)})`);
      facetG.addColorStop(0.4, `rgba(100,20,180,${(0.12 + 0.08 * pulse2).toFixed(2)})`);
      facetG.addColorStop(1,   'rgba(60,0,120,0)');
      ctx.fillStyle = facetG;
      ctx.fillRect(-W_mid, -H_top - H_bot, W_mid, H_top + H_bot);

      // Faceta direita em sombra
      const shadowFacet = ctx.createLinearGradient(0, 0, W_mid, 0);
      shadowFacet.addColorStop(0,   'rgba(0,0,0,0)');
      shadowFacet.addColorStop(0.5, 'rgba(0,0,0,0.18)');
      shadowFacet.addColorStop(1,   'rgba(0,0,0,0.45)');
      ctx.fillStyle = shadowFacet;
      ctx.fillRect(0, -H_top - H_bot, W_mid + 2, H_top + H_bot + 2);

      // ── Linha de fratura interna — diagonal da ponta ao ventre ────────────
      ctx.strokeStyle = `rgba(180,60,255,${(0.18 + 0.14 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 0.7;
      ctx.beginPath();
      ctx.moveTo(-W_top * 0.4, -H_top - H_bot + 3 * sc);
      ctx.lineTo( W_mid * 0.3, -H_bot * 0.6);
      ctx.stroke();

      ctx.restore(); // fim do clip

      // ── Contorno do cristal — arestas definidas sem blur ─────────────────
      // Aresta esquerda (iluminada)
      ctx.strokeStyle = `rgba(160,50,240,${(0.55 + 0.20 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 1.0;
      ctx.beginPath();
      ctx.moveTo(0,       -H_top - H_bot);
      ctx.lineTo(-W_top,  -H_top - H_bot + 4 * sc);
      ctx.lineTo(-W_mid,  -H_bot);
      ctx.lineTo(-W_base,  0);
      ctx.stroke();

      // Aresta direita (sombra)
      ctx.strokeStyle = `rgba(60,0,120,${(0.55 + 0.15 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 1.0;
      ctx.beginPath();
      ctx.moveTo(0,      -H_top - H_bot);
      ctx.lineTo( W_top, -H_top - H_bot + 4 * sc);
      ctx.lineTo( W_mid, -H_bot);
      ctx.lineTo( W_base, 0);
      ctx.stroke();

      // Linha do ventre (horizontal) — divide a forma em dois registros
      ctx.strokeStyle = `rgba(100,20,180,${(0.35 + 0.15 * pulse2).toFixed(2)})`;
      ctx.lineWidth   = 0.7;
      ctx.beginPath();
      ctx.moveTo(-W_mid, -H_bot);
      ctx.lineTo( W_mid, -H_bot);
      ctx.stroke();

      // ── Reflexo especular na ponta — pequeno losango brilhante ───────────
      // Simula a face superior do cristal pegando luz
      const specA = (0.40 + 0.35 * pulse).toFixed(2);
      ctx.fillStyle = `rgba(220,150,255,${specA})`;
      ctx.beginPath();
      ctx.moveTo( 0,               -H_top - H_bot);          // ponta
      ctx.lineTo(-W_top * 0.6,     -H_top - H_bot + 5 * sc); // esq
      ctx.lineTo( 0,               -H_top - H_bot + 9 * sc); // meio
      ctx.lineTo( W_top * 0.3,     -H_top - H_bot + 4 * sc); // dir
      ctx.closePath();
      ctx.fill();

      // Ponto de pico — 1 px de brilho puro na ponta
      ctx.fillStyle = `rgba(255,220,255,${(0.60 + 0.35 * pulse).toFixed(2)})`;
      ctx.fillRect(-0.8, -H_top - H_bot - 0.5, 1.6, 1.6);

      ctx.restore(); // fim do translate/rotate
    }
  });
}

function drawMushrooms(map, cam, time) {
  if (!map.mushrooms || map.mushrooms.length === 0) return;

  map.mushrooms.forEach((m, idx) => {
    // Bake na primeira vez que o cogumelo for desenhado
    if (!m._cache) initMushroomCache(m, idx);

    const bx  = m.tx * TILE + TILE / 2 - cam.x;
    const by  = (m.ty + 1) * TILE - cam.y;

    // Desenha o cache estático com drawImage (muito mais rápido)
    ctx.drawImage(m._cache, bx - m._cacheOX, by - m._cacheOY);

    // ── Apenas os elementos animados pelo pulso ──────────────────────────
    const pulse  = 0.5 + 0.5 * Math.sin(time * 1.8 + m._seed);
    const rgb    = m._rgb;
    const cRX    = m._capRX;
    const cRY    = m._capRY;
    const sW     = m._stemW;
    const sH     = m._stemH;
    const capY   = by - sH;
    const stemX  = bx - sW / 2;

    // Reflexo bioluminescente lateral da haste
    ctx.fillStyle = `rgba(${rgb},${(0.12 + 0.08 * pulse).toFixed(2)})`;
    ctx.fillRect(stemX + 1, by - sH + 2, 1, sH - 4);

    // Highlight pulsante no topo do chapéu
    ctx.fillStyle = `rgba(${rgb},${(0.14 + 0.06 * pulse).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(bx - cRX * 0.2, capY - cRY * 0.25, cRX * 0.45, cRY * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Borda pulsante
    ctx.strokeStyle = `rgba(${rgb},${(0.30 + 0.12 * pulse).toFixed(2)})`;
    ctx.lineWidth   = 0.8;
    ctx.beginPath();
    ctx.ellipse(bx, capY, cRX, cRY, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = m._col;
    ctx.shadowBlur  = 6 + pulse * 8;
    ctx.fillStyle   = `rgba(${rgb},${(0.06 + 0.05 * pulse).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(bx, capY, cRX - 2, cRY - 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Lamelas
    ctx.strokeStyle = `rgba(${rgb},${(0.18 + 0.08 * pulse).toFixed(2)})`;
    ctx.lineWidth   = 0.6;
    for (let i = 0; i < 6; i++) {
      const a  = Math.PI + (i / 5) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(bx, capY);
      ctx.lineTo(bx + Math.cos(a) * (cRX - 1), capY + Math.sin(a) * (cRY - 1));
      ctx.stroke();
    }
  });
}

// clareia ou escurece uma cor hex por 'amount' (positivo = clareia)
function shiftColor(hex, amount) {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1,3), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3,5), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5,7), 16) + amount));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function drawAltars(map, cam, time) {
  if (!map.altars || map.altars.length === 0) return;

  map.altars.forEach((a, idx) => {
    const bx = a.tx * TILE + TILE / 2 - cam.x;
    const by = (a.ty + 1) * TILE - cam.y;

    const seed = idx * 4.11 + 6.7;

    ctx.save();

    // ── Sombra no chão ───────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(bx, by, 0, bx, by, 36);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.50)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 36, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Dimensões ─────────────────────────────────────────────────────────
    const altarW  = 56;   // largura total (~1.75 tiles)
    const altarH  = 28;   // altura total
    const slabH   = 6;    // espessura da laje do topo
    const legW    = 10;   // largura de cada pilar lateral
    const legH    = altarH - slabH;   // altura dos pilares

    const altarX  = bx - altarW / 2;
    const slabY   = by - altarH;
    const legY    = slabY + slabH;

    // helper — gradiente horizontal de pedra escura
    function stoneH(x0, x1, dark = false) {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      if (dark) {
        g.addColorStop(0,    '#141418');
        g.addColorStop(0.3,  '#222228');
        g.addColorStop(0.7,  '#1e1e24');
        g.addColorStop(1,    '#0e0e12');
      } else {
        g.addColorStop(0,    '#1c1c22');
        g.addColorStop(0.2,  '#30303a');
        g.addColorStop(0.5,  '#3a3a46');
        g.addColorStop(0.8,  '#2c2c36');
        g.addColorStop(1,    '#16161c');
      }
      return g;
    }

    // ── Pilar esquerdo ────────────────────────────────────────────────────
    ctx.fillStyle = stoneH(altarX, altarX + legW);
    ctx.fillRect(altarX, legY, legW, legH);
    // aresta esquerda iluminada
    ctx.fillStyle = 'rgba(200,200,220,0.08)';
    ctx.fillRect(altarX, legY, 1, legH);
    // aresta direita escura
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(altarX + legW - 1, legY, 1, legH);
    // estrias verticais
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(altarX + 3, legY + 2, 1, legH - 4);
    ctx.fillRect(altarX + 6, legY + 4, 1, legH - 6);

    // ── Pilar direito ─────────────────────────────────────────────────────
    const rLegX = altarX + altarW - legW;
    ctx.fillStyle = stoneH(rLegX, rLegX + legW);
    ctx.fillRect(rLegX, legY, legW, legH);
    ctx.fillStyle = 'rgba(200,200,220,0.08)';
    ctx.fillRect(rLegX, legY, 1, legH);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(rLegX + legW - 1, legY, 1, legH);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(rLegX + 3, legY + 2, 1, legH - 4);
    ctx.fillRect(rLegX + 6, legY + 4, 1, legH - 6);

    // ── Frente do altar (parede frontal entre os pilares) ─────────────────
    const frontX = altarX + legW;
    const frontW = altarW - legW * 2;
    ctx.fillStyle = stoneH(frontX, frontX + frontW, true);
    ctx.fillRect(frontX, legY, frontW, legH);

    // ── Painel entalhado no frontal ────────────────────────────────────────
    // moldura rebaixada
    const panelX = frontX + 4;
    const panelY = legY + 4;
    const panelW = frontW - 8;
    const panelH = legH - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    // aresta superior e esq (sombra interna)
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(panelX,          panelY, panelW, 1);
    ctx.fillRect(panelX,          panelY, 1, panelH);
    // aresta inferior e dir (reflexo interno)
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(panelX,          panelY + panelH - 1, panelW, 1);
    ctx.fillRect(panelX + panelW - 1, panelY, 1, panelH);
    // símbolo central — olho estilizado / runa
    const sc = { x: frontX + frontW / 2, y: legY + legH / 2 + 1 };
    // elipse externa
    ctx.strokeStyle = 'rgba(120,80,160,0.45)';
    ctx.lineWidth   = 0.8;
    ctx.beginPath();
    ctx.ellipse(sc.x, sc.y, 6, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    // pupila
    ctx.fillStyle = 'rgba(80,40,120,0.50)';
    ctx.beginPath();
    ctx.ellipse(sc.x, sc.y, 2.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // brilho roxo
    ctx.fillStyle = 'rgba(160,80,220,0.25)';
    ctx.beginPath();
    ctx.ellipse(sc.x - 0.5, sc.y - 0.5, 1, 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Laje do topo — mais larga que os pilares (saliência) ──────────────
    const slabX    = altarX - 3;
    const slabW    = altarW + 6;
    const slabGrad = ctx.createLinearGradient(slabX, slabY, slabX, slabY + slabH);
    slabGrad.addColorStop(0,   '#424250');
    slabGrad.addColorStop(0.3, '#36363e');
    slabGrad.addColorStop(1,   '#22222a');
    ctx.fillStyle = slabGrad;
    ctx.beginPath();
    ctx.moveTo(slabX + 2,          slabY);           // topo-esq
    ctx.lineTo(slabX + slabW - 2,  slabY);           // topo-dir
    ctx.lineTo(slabX + slabW,      slabY + slabH);   // base-dir
    ctx.lineTo(slabX,              slabY + slabH);   // base-esq
    ctx.closePath();
    ctx.fill();
    // aresta superior iluminada
    ctx.fillStyle = '#585868';
    ctx.fillRect(slabX + 2, slabY, slabW - 4, 1);
    // aresta inferior (sombra sobre os pilares)
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.fillRect(slabX, slabY + slabH - 1, slabW, 1);
    // rachadura sutil na laje
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth   = 0.7;
    ctx.beginPath();
    ctx.moveTo(bx - 8, slabY + 1);
    ctx.lineTo(bx - 4, slabY + 4);
    ctx.lineTo(bx - 6, slabY + slabH - 1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    ctx.moveTo(bx - 7, slabY + 1);
    ctx.lineTo(bx - 3, slabY + 4);
    ctx.lineTo(bx - 5, slabY + slabH - 1);
    ctx.stroke();

    // ── Manchas de sangue / líquido escuro na superfície ──────────────────
    ctx.fillStyle = 'rgba(80,10,10,0.55)';
    ctx.beginPath();
    ctx.ellipse(bx + 6, slabY + 2, 5, 2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bx + 8, slabY + 3, 2, 1, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // gota escorrendo pela frente da laje
    ctx.fillStyle = 'rgba(70,8,8,0.45)';
    ctx.fillRect(bx + 7, slabY + slabH - 1, 2, 3);
    ctx.fillRect(bx + 7, slabY + slabH + 2, 1, 2);

    // ── Duas velas pequenas sobre a laje ──────────────────────────────────
    const candlePositions = [bx - 18, bx + 18];
    candlePositions.forEach((cx, ci) => {
      const cSeed  = seed + ci * 2.3;
      const flick  = Math.sin(time * 11.0 + cSeed) * 0.8
                   + Math.sin(time *  6.5 + cSeed + 1.5) * 0.5;

      // cera derramada na base
      ctx.fillStyle = 'rgba(210,200,170,0.30)';
      ctx.beginPath();
      ctx.ellipse(cx, slabY, 4, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // corpo da vela
      const cw = 4, ch = 9;
      ctx.fillStyle = '#ccc0a0';
      ctx.fillRect(cx - cw / 2, slabY - ch, cw, ch);
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.fillRect(cx + cw / 2 - 1, slabY - ch + 2, 1, ch - 2);

      // pavio
      ctx.fillStyle = '#2a1a08';
      ctx.fillRect(cx - 0.5, slabY - ch - 3, 1, 3);

      // chama
      const fCX = cx + flick * 0.7;
      const fTY = slabY - ch - 3;
      const fW  = 2.2 + Math.abs(flick) * 0.2;
      const fH  = 5.5 + flick * 0.35;

      // aura roxo-escura (altar sombrio)
      const aura = ctx.createRadialGradient(fCX, fTY - fH * 0.4, 0, fCX, fTY - fH * 0.4, fW * 3.5);
      aura.addColorStop(0,   `rgba(140,40,200,${0.18 + 0.06 * Math.abs(flick)})`);
      aura.addColorStop(1,   'rgba(80,0,120,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.ellipse(fCX, fTY - fH * 0.4, fW * 3.5, fW * 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // chama externa — roxo-laranja
      ctx.shadowColor = '#aa00ff';
      ctx.shadowBlur  = 8;
      const outerG = ctx.createLinearGradient(fCX, fTY - fH, fCX, fTY);
      outerG.addColorStop(0,   'rgba(180,60,255,0.0)');
      outerG.addColorStop(0.1, 'rgba(180,60,255,0.85)');
      outerG.addColorStop(1,   'rgba(100,20,160,0.90)');
      ctx.fillStyle = outerG;
      ctx.beginPath();
      ctx.moveTo(fCX, fTY - fH);
      ctx.bezierCurveTo(fCX + fW * 1.1, fTY - fH * 0.4, fCX + fW, fTY, fCX, fTY);
      ctx.bezierCurveTo(fCX - fW,       fTY, fCX - fW * 1.1, fTY - fH * 0.4, fCX, fTY - fH);
      ctx.fill();

      // núcleo branco-lilás
      ctx.shadowColor = '#dd88ff';
      ctx.shadowBlur  = 10;
      ctx.fillStyle   = `rgba(240,210,255,${0.80 + 0.15 * Math.abs(flick / 1.3)})`;
      ctx.beginPath();
      ctx.ellipse(fCX, fTY - 0.5, fW * 0.7, fW * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    });

    // ── Musgo nos pilares ─────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(28,52,14,0.45)';
    ctx.fillRect(altarX + 1,     by - 4, 4, 2);
    ctx.fillRect(altarX + 5,     by - 3, 2, 2);
    ctx.fillRect(rLegX + 1,      by - 5, 3, 2);
    ctx.fillRect(rLegX + 5,      by - 3, 3, 3);

    ctx.restore();
  });
}

function drawPines(map, cam, time) {
  if (!map.pines || map.pines.length === 0) return;

  map.pines.forEach((p, idx) => {
    const bx = p.tx * TILE + TILE / 2 - cam.x;
    const by = (p.ty + 1) * TILE - cam.y;

    ctx.save();

    // ── Sombra no chão ───────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(bx, by, 0, bx, by, 14);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.30)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Tronco — mais alto e visível ─────────────────────────────────────
    ctx.fillStyle = '#1e0e04';
    ctx.fillRect(bx - 3, by - 18, 5, 18); // caule mais alto: 18px
    // veio de madeira
    ctx.fillStyle = '#2e1808';
    ctx.fillRect(bx - 3, by - 18, 1, 18);
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(bx - 2, by - 18, 1, 18);
    // aresta direita escura
    ctx.fillStyle = '#120804';
    ctx.fillRect(bx + 2, by - 18, 1, 18);

    // ── Três camadas triangulares sobrepostas — forma de pinheiro ─────────
    // Camada base (mais larga, mais escura)
    // Camada média
    // Camada topo (mais estreita, mais clara, pontuda)
    const layers = [
      { baseW: 26, topW: 10, y: by - 24, h: 14, color: '#1a2e0e' },
      { baseW: 20, topW:  6, y: by - 36, h: 14, color: '#223a12' },
      { baseW: 14, topW:  2, y: by - 48, h: 14, color: '#2a4418' },
    ];

    for (const l of layers) {
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.moveTo(bx - l.topW / 2, l.y);           // topo-esq
      ctx.lineTo(bx + l.topW / 2, l.y);           // topo-dir
      ctx.lineTo(bx + l.baseW / 2, l.y + l.h);   // base-dir
      ctx.lineTo(bx - l.baseW / 2, l.y + l.h);   // base-esq
      ctx.closePath();
      ctx.fill();

      // Highlight lateral esquerdo — luz vinda do topo-esq
      ctx.fillStyle = 'rgba(140,210,80,0.07)';
      ctx.beginPath();
      ctx.moveTo(bx - l.topW / 2, l.y);
      ctx.lineTo(bx + l.topW / 2, l.y);
      ctx.lineTo(bx, l.y + l.h * 0.5);
      ctx.closePath();
      ctx.fill();

      // Sombra lateral direita
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.moveTo(bx, l.y + l.h * 0.5);
      ctx.lineTo(bx + l.baseW / 2, l.y + l.h);
      ctx.lineTo(bx - l.baseW / 2, l.y + l.h);
      ctx.closePath();
      ctx.fill();
    }

    // ── Ponta final — triângulo fino no topo ──────────────────────────────
    ctx.fillStyle = '#334e1e';
    ctx.beginPath();
    ctx.moveTo(bx,      by - 58); // ponta
    ctx.lineTo(bx + 3,  by - 48);
    ctx.lineTo(bx - 3,  by - 48);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(140,210,80,0.10)';
    ctx.beginPath();
    ctx.moveTo(bx,     by - 58);
    ctx.lineTo(bx + 3, by - 48);
    ctx.lineTo(bx,     by - 52);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  });
}

function drawEyePyramids(map, cam, time) {
  if (!map.eyePyramids || map.eyePyramids.length === 0) return;

  map.eyePyramids.forEach((p, idx) => {
    const bx   = p.tx * TILE + TILE / 2 - cam.x;
    const by   = (p.ty + 1) * TILE      - cam.y;
    const seed = idx * 3.17 + 1.4;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + seed);

    // Culling
    if (bx < -60 || bx > W + 60 || by < -80 || by > H + 10) return;

    ctx.save();

    // ── Sombra elíptica no chão ──────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.beginPath();
    ctx.ellipse(bx, by, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Dimensões da pirâmide ────────────────────────────────────────────
    const baseW  = 40;   // largura da base
    const pyrH   = 44;   // altura total
    const baseY  = by;
    const tipY   = by - pyrH;
    const baseL  = bx - baseW / 2;
    const baseR  = bx + baseW / 2;

    // ── Face principal (esquerda — mais clara, "iluminada") ──────────────
    ctx.fillStyle = '#1e1a28';
    ctx.beginPath();
    ctx.moveTo(bx,    tipY);
    ctx.lineTo(baseL, baseY);
    ctx.lineTo(bx,    baseY);
    ctx.closePath();
    ctx.fill();
    // highlight sutil na aresta esquerda
    ctx.fillStyle = 'rgba(160,140,200,0.10)';
    ctx.beginPath();
    ctx.moveTo(bx,        tipY);
    ctx.lineTo(baseL,     baseY);
    ctx.lineTo(baseL + 3, baseY);
    ctx.lineTo(bx,        tipY + 4);
    ctx.closePath();
    ctx.fill();

    // ── Face direita (mais escura, "sombreada") ──────────────────────────
    ctx.fillStyle = '#120e1c';
    ctx.beginPath();
    ctx.moveTo(bx,    tipY);
    ctx.lineTo(bx,    baseY);
    ctx.lineTo(baseR, baseY);
    ctx.closePath();
    ctx.fill();

    // ── Aresta central (linha de divisão das faces) ──────────────────────
    ctx.strokeStyle = 'rgba(80,60,120,0.55)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(bx, tipY);
    ctx.lineTo(bx, baseY);
    ctx.stroke();

    // ── Aresta esquerda iluminada ────────────────────────────────────────
    ctx.strokeStyle = 'rgba(140,120,180,0.35)';
    ctx.beginPath();
    ctx.moveTo(bx,    tipY);
    ctx.lineTo(baseL, baseY);
    ctx.stroke();

    // ── Aresta direita escura ────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.moveTo(bx,    tipY);
    ctx.lineTo(baseR, baseY);
    ctx.stroke();

    // ── Faixa horizontal de pedra na base ────────────────────────────────
    const degrauH = 5;
    ctx.fillStyle = '#2a2436';
    ctx.beginPath();
    ctx.moveTo(baseL,      baseY - degrauH);
    ctx.lineTo(baseR,      baseY - degrauH);
    ctx.lineTo(baseR,      baseY);
    ctx.lineTo(baseL,      baseY);
    ctx.closePath();
    ctx.fill();
    // aresta superior do degrau
    ctx.fillStyle = 'rgba(160,140,200,0.12)';
    ctx.fillRect(baseL, baseY - degrauH, baseW, 1);
    // aresta inferior
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.fillRect(baseL, baseY - 1, baseW, 1);

    // ── Runas gravadas nas faces (linhas finas) ───────────────────────────
    ctx.strokeStyle = 'rgba(80,60,120,0.30)';
    ctx.lineWidth   = 0.7;
    // face esquerda — 2 linhas paralelas à aresta
    for (let r = 0; r < 2; r++) {
      const t = 0.3 + r * 0.25;
      ctx.beginPath();
      ctx.moveTo(bx + (baseL - bx) * t,         tipY + (baseY - tipY) * t);
      ctx.lineTo(bx + (baseL - bx) * (t + 0.18), tipY + (baseY - tipY) * t);
      ctx.stroke();
    }
    // face direita — idem
    for (let r = 0; r < 2; r++) {
      const t = 0.3 + r * 0.25;
      ctx.beginPath();
      ctx.moveTo(bx + (baseR - bx) * t,         tipY + (baseY - tipY) * t);
      ctx.lineTo(bx + (baseR - bx) * (t - 0.18), tipY + (baseY - tipY) * t);
      ctx.stroke();
    }

    // ── Olho que tudo vê — posicionado no terço superior da pirâmide ─────
    const eyeCX = bx;
    const eyeCY = tipY + pyrH * 0.35;

    // Triângulo de brilho atrás do olho (raios de luz) — fake glow em arco
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const a    = (i / rayCount) * Math.PI * 2;
      const rIn  = 7;
      const rOut = 12 + pulse * 5;
      const alpha = (0.06 + 0.06 * pulse).toFixed(2);
      ctx.strokeStyle = `rgba(200,160,255,${alpha})`;
      ctx.lineWidth   = 1.2;
      ctx.beginPath();
      ctx.moveTo(eyeCX + Math.cos(a) * rIn,  eyeCY + Math.sin(a) * rIn);
      ctx.lineTo(eyeCX + Math.cos(a) * rOut, eyeCY + Math.sin(a) * rOut);
      ctx.stroke();
    }

    // Halo externo do olho (fake glow — 3 círculos)
    ctx.fillStyle = `rgba(140,0,220,${(0.06 + 0.06 * pulse).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(eyeCX, eyeCY, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(160,40,255,${(0.12 + 0.10 * pulse).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(eyeCX, eyeCY, 8,  0, Math.PI * 2); ctx.fill();

    // Esclera — branco-amarelado envelhecido
    ctx.fillStyle = '#d8c8a0';
    ctx.beginPath();
    ctx.ellipse(eyeCX, eyeCY, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // sombra interna da esclera
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.beginPath();
    ctx.ellipse(eyeCX, eyeCY + 1.5, 5.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Íris — roxa pulsante
    const irisR = 3 + pulse * 0.6;
    ctx.fillStyle = `rgba(130,0,200,${(0.80 + 0.15 * pulse).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(eyeCX, eyeCY, irisR + 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(180,60,255,0.90)`;
    ctx.beginPath(); ctx.arc(eyeCX, eyeCY, irisR, 0, Math.PI * 2); ctx.fill();

    // Pupila vertical
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(eyeCX, eyeCY, 1.0, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Reflexo brilhante
    ctx.fillStyle = 'rgba(255,220,255,0.60)';
    ctx.beginPath();
    ctx.ellipse(eyeCX - 1.2, eyeCY - 1.5, 1.0, 0.7, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Cílios — 4 traços finos saindo da esclera
    ctx.strokeStyle = 'rgba(60,0,100,0.50)';
    ctx.lineWidth   = 0.8;
    const cilioAngles = [-0.6, -0.2, 0.2, 0.6];
    for (const ca of cilioAngles) {
      ctx.beginPath();
      ctx.moveTo(eyeCX + Math.cos(ca) * 6, eyeCY - Math.abs(Math.sin(ca)) * 4.5);
      ctx.lineTo(eyeCX + Math.cos(ca) * 9, eyeCY - Math.abs(Math.sin(ca)) * 7.5);
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawHexagrams(map, cam, time) {
  if (!map.hexagrams || map.hexagrams.length === 0) return;

  // Desenha um triângulo equilátero centrado em (cx,cy), raio r, rotacionado por angle
  function equiTriangle(cx, cy, r, angle) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = angle + (i / 3) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  map.hexagrams.forEach((h, idx) => {
    const seed  = idx * 5.13 + 0.7;
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.6 + seed);
    const bob   = Math.sin(time * 0.7 + seed) * 4;
    const spin  = time * 0.18 + seed;           // rotação lenta dos triângulos
    const r     = (h.size || 18);               // raio da estrela

    const cx = h.tx * TILE + TILE / 2 - cam.x;
    const cy = h.ty * TILE + TILE / 2 - cam.y + bob;

    if (cx < -80 || cx > W + 80 || cy < -80 || cy > H + 80) return;

    const rgb = hexToRgb(h.color || '#8833ff');

    ctx.save();

    // ── Aura externa — 3 círculos concêntricos crescentes (fake glow) ─────
    const a3 = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.4);
    a3.addColorStop(0,   `rgba(${rgb},${(0.22 + 0.10 * pulse).toFixed(2)})`);
    a3.addColorStop(0.4, `rgba(${rgb},${(0.08 + 0.06 * pulse).toFixed(2)})`);
    a3.addColorStop(1,   `rgba(${rgb},0)`);
    ctx.fillStyle = a3;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // ── Linhas de conexão dos 6 vértices (pentagrama interior) ───────────
    // desenhadas antes dos triângulos para ficar "por baixo"
    ctx.strokeStyle = `rgba(${rgb},${(0.12 + 0.08 * pulse).toFixed(2)})`;
    ctx.lineWidth   = 0.7;
    for (let i = 0; i < 6; i++) {
      const a  = spin + (i / 6) * Math.PI * 2 - Math.PI / 2;
      const a2 = spin + ((i + 2) / 6) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a)  * r, cy + Math.sin(a)  * r);
      ctx.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
      ctx.stroke();
    }

    // ── Triângulo 1 (apontando para cima) — preenchimento suave ──────────
    equiTriangle(cx, cy, r, spin);
    const tg1 = ctx.createRadialGradient(cx, cy - r * 0.3, 0, cx, cy, r);
    tg1.addColorStop(0,   `rgba(${rgb},${(0.28 + 0.12 * pulse).toFixed(2)})`);
    tg1.addColorStop(0.6, `rgba(${rgb},${(0.12 + 0.06 * pulse).toFixed(2)})`);
    tg1.addColorStop(1,   `rgba(${rgb},0.04)`);
    ctx.fillStyle = tg1;
    ctx.fill();

    // contorno do triângulo 1
    ctx.strokeStyle = `rgba(${rgb},${(0.70 + 0.25 * pulse).toFixed(2)})`;
    ctx.lineWidth   = 1.2;
    ctx.lineJoin    = 'round';
    equiTriangle(cx, cy, r, spin);
    ctx.stroke();

    // ── Triângulo 2 (apontando para baixo — invertido) ────────────────────
    equiTriangle(cx, cy, r, spin + Math.PI);
    const tg2 = ctx.createRadialGradient(cx, cy + r * 0.3, 0, cx, cy, r);
    tg2.addColorStop(0,   `rgba(${rgb},${(0.24 + 0.10 * pulse).toFixed(2)})`);
    tg2.addColorStop(0.6, `rgba(${rgb},${(0.10 + 0.05 * pulse).toFixed(2)})`);
    tg2.addColorStop(1,   `rgba(${rgb},0.04)`);
    ctx.fillStyle = tg2;
    ctx.fill();

    ctx.strokeStyle = `rgba(${rgb},${(0.70 + 0.25 * pulse).toFixed(2)})`;
    ctx.lineWidth   = 1.2;
    equiTriangle(cx, cy, r, spin + Math.PI);
    ctx.stroke();

    // ── Hexágono central (interseção dos dois triângulos) ─────────────────
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = spin + (i / 6) * Math.PI * 2 - Math.PI / 6;
      const hx = cx + Math.cos(a) * r * 0.577;  // r * tan(30°) ≈ 0.577
      const hy = cy + Math.sin(a) * r * 0.577;
      i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    const hexG = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.577);
    hexG.addColorStop(0,   `rgba(${rgb},${(0.60 + 0.30 * pulse).toFixed(2)})`);
    hexG.addColorStop(0.5, `rgba(${rgb},${(0.30 + 0.15 * pulse).toFixed(2)})`);
    hexG.addColorStop(1,   `rgba(${rgb},0.08)`);
    ctx.fillStyle = hexG;
    ctx.fill();

    // ── 6 vértices — pontos brilhantes nas pontas da estrela ──────────────
    for (let i = 0; i < 6; i++) {
      const a  = spin + (i / 6) * Math.PI * 2 - Math.PI / 2;
      const vx = cx + Math.cos(a) * r;
      const vy = cy + Math.sin(a) * r;

      // halo do vértice (radialGradient pequeno)
      const vg = ctx.createRadialGradient(vx, vy, 0, vx, vy, 4 + 2 * pulse);
      vg.addColorStop(0,   `rgba(${rgb},${(0.80 + 0.15 * pulse).toFixed(2)})`);
      vg.addColorStop(1,   `rgba(${rgb},0)`);
      ctx.fillStyle = vg;
      ctx.beginPath();
      ctx.arc(vx, vy, 4 + 2 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // núcleo branco do vértice
      ctx.fillStyle = `rgba(255,255,255,${(0.55 + 0.35 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(vx, vy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Núcleo central — ponto branco-vivo pulsante ───────────────────────
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.25);
    cg.addColorStop(0,   `rgba(255,255,255,${(0.90 + 0.08 * pulse).toFixed(2)})`);
    cg.addColorStop(0.4, `rgba(${rgb},${(0.70 + 0.25 * pulse).toFixed(2)})`);
    cg.addColorStop(1,   `rgba(${rgb},0)`);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // ── Raios do núcleo (6 linhas finas para cada vértice) ────────────────
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 6; i++) {
      const a  = spin + (i / 6) * Math.PI * 2 - Math.PI / 2;
      const rAlpha = (0.25 + 0.15 * pulse).toFixed(2);
      ctx.strokeStyle = `rgba(255,255,255,${rAlpha})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55);
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawMagicEyes(map, cam, time) {
  if (!map.magicEyes || map.magicEyes.length === 0) return;

  map.magicEyes.forEach((e, idx) => {
    const seed  = idx * 4.71 + 2.3;
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.8 + seed);
    const bob   = Math.sin(time * 0.85 + seed) * 5;
    const sway  = Math.sin(time * 0.55 + seed + 1.1) * 2.5;

    // Centro do olho — flutua livremente no ar
    const cx = e.tx * TILE + TILE / 2 - cam.x + sway;
    const cy = e.ty * TILE + TILE / 2 - cam.y + bob;

    // Culling
    if (cx < -60 || cx > W + 60 || cy < -60 || cy > H + 60) return;

    const eyeColor = e.color || '#8833ff';
    const rgb      = hexToRgb(eyeColor);

    ctx.save();

    // ── Aura externa difusa
    const auraR = 22 + 5 * pulse;
    const aura  = ctx.createRadialGradient(cx, cy, 4, cx, cy, auraR);
    aura.addColorStop(0,   `rgba(${rgb},${(0.22 + 0.10 * pulse).toFixed(2)})`);
    aura.addColorStop(0.45,`rgba(${rgb},${(0.08 + 0.05 * pulse).toFixed(2)})`);
    aura.addColorStop(1,   `rgba(${rgb},0)`);
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(cx, cy, auraR, auraR * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Tentáculos — 8 filamentos curvos orbitando lentamente ─────────────
    const tCount = 8;
    const rotOff = time * 0.22 + seed;
    ctx.lineCap  = 'round';

    for (let i = 0; i < tCount; i++) {
      const a    = (i / tCount) * Math.PI * 2 + rotOff;
      const aEnd = a + 0.4;
      const x0   = cx + Math.cos(a) * 9;
      const y0   = cy + Math.sin(a) * 7;
      const x1   = cx + Math.cos(aEnd) * (16 + 3 * pulse);
      const y1   = cy + Math.sin(aEnd) * (13 + 2 * pulse);
      const cpx  = cx + Math.cos(a + 0.2) * 13;
      const cpy  = cy + Math.sin(a + 0.2) * 10;

      ctx.strokeStyle = `rgba(${rgb},${(0.28 + 0.18 * pulse).toFixed(2)})`;
      ctx.lineWidth   = 1.1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cpx, cpy, x1, y1);
      ctx.stroke();

      // ponta do tentáculo — pequeno ponto
      ctx.fillStyle = `rgba(${rgb},${(0.50 + 0.20 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x1, y1, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Esclera — elipse branco-violácea ─────────────────────────────────
    const scleraG = ctx.createRadialGradient(cx - 4, cy - 3, 1, cx, cy, 11);
    scleraG.addColorStop(0,   '#ece5ff');
    scleraG.addColorStop(0.5, '#c8b4e8');
    scleraG.addColorStop(1,   '#7a5ab0');
    ctx.fillStyle = scleraG;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 11, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // veias — duas curvas finas avermelhadas
    ctx.strokeStyle = 'rgba(190,0,70,0.30)';
    ctx.lineWidth   = 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy + 1.5);
    ctx.quadraticCurveTo(cx - 3, cy - 2, cx - 1, cy + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 1);
    ctx.quadraticCurveTo(cx + 3, cy + 2, cx + 1, cy - 0.5);
    ctx.stroke();

    // sombra interna inferior (profundidade da esclera)
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2.5, 8.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Cílios curtos na borda da esclera ─────────────────────────────────
    const cilioCount = 12;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < cilioCount; i++) {
      const a  = (i / cilioCount) * Math.PI * 2;
      const x0 = cx + Math.cos(a) * 11;
      const y0 = cy + Math.sin(a) * 8.5;
      const x1 = cx + Math.cos(a) * 15;
      const y1 = cy + Math.sin(a) * 11.5;
      ctx.strokeStyle = `rgba(${rgb},${(0.40 + 0.20 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // ── Íris — disco colorido girando devagar ─────────────────────────────
    const irisR   = 5.5 + 0.5 * pulse;
    const irisAng = time * 0.35 + seed;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(irisAng);

    const irisG = ctx.createRadialGradient(-1, -1, 0.5, 0, 0, irisR);
    irisG.addColorStop(0,   `rgba(${rgb},0.95)`);
    irisG.addColorStop(0.6, `rgba(${rgb},0.75)`);
    irisG.addColorStop(1,   `rgba(${rgb},0.35)`);
    ctx.fillStyle = irisG;
    ctx.beginPath();
    ctx.arc(0, 0, irisR, 0, Math.PI * 2);
    ctx.fill();

    // raios internos da íris
    const rayCount = 10;
    ctx.lineWidth  = 0.6;
    for (let i = 0; i < rayCount; i++) {
      const ra = (i / rayCount) * Math.PI * 2;
      ctx.strokeStyle = `rgba(${rgb},0.30)`;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ra) * 1.5, Math.sin(ra) * 1.5);
      ctx.lineTo(Math.cos(ra) * irisR, Math.sin(ra) * irisR);
      ctx.stroke();
    }

    ctx.restore(); // desfaz rotate da íris

    // ── Pupila vertical (fenda) ────────────────────────────────────────────
    ctx.fillStyle = '#06020e';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 1.6, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    // brilho roxo dentro da fenda (profundidade)
    ctx.fillStyle = `rgba(${rgb},0.14)`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 0.5, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Reflexos especulares ──────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.beginPath();
    ctx.ellipse(cx - 2.8, cy - 2.6, 1.5, 1.1, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.arc(cx + 2.0, cy + 1.8, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // ── Anel orbital de energia (contra-rotação) ──────────────────────────
    const ringAng = -time * 0.5 + seed;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ringAng);
    ctx.strokeStyle = `rgba(${rgb},${(0.20 + 0.12 * pulse).toFixed(2)})`;
    ctx.lineWidth   = 0.9;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13.5, 10.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // dois marcadores brilhantes no anel (0° e 180°)
    ctx.fillStyle = `rgba(${rgb},${(0.55 + 0.25 * pulse).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(13.5,  0, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-13.5, 0, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.restore();
  });
}

function drawFlowers(map, cam, time) {
  if (!map.flowers || map.flowers.length === 0) return;

  map.flowers.forEach((f, idx) => {
    const bx = f.tx * TILE + TILE / 2 - cam.x;
    const by = (f.ty + 1) * TILE - cam.y;

    const seed  = idx * 2.13;
    // leve balanço da haste com o tempo
    const sway  = Math.sin(time * 1.8 + seed) * 0.6;

    ctx.save();

    // ── Sombra no chão ───────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(bx, by, 0, bx, by, 8);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.22)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Haste curta ───────────────────────────────────────────────────────
    const hasteH = 10;
    const topX   = bx + sway;
    const topY   = by - hasteH;

    ctx.strokeStyle = '#2a4a10';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(topX, topY);
    ctx.stroke();

    // Folhinha lateral
    ctx.fillStyle = '#2a4a10';
    ctx.beginPath();
    ctx.ellipse(topX - 3, topY + 4, 4, 2, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // ── Centro da flor — miolo amarelo ───────────────────────────────────
    const cx2 = topX;
    const cy2 = topY - 4;
    const mioloR = 3;

    // ── Pétalas — 8 pétalas ao redor do miolo ────────────────────────────
    const petalCount = 8;
    const petalL = 5;   // comprimento
    const petalW = 2.5; // largura

    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const px2   = cx2 + Math.cos(angle) * (mioloR + petalL * 0.5);
      const py2   = cy2 + Math.sin(angle) * (mioloR + petalL * 0.5);

      ctx.fillStyle = i % 2 === 0 ? '#d8d0b0' : '#e8e0c0'; // alternância leve
      ctx.beginPath();
      ctx.ellipse(px2, py2, petalW, petalL * 0.55, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    // Miolo — círculo amarelo com gradiente
    const mioloG = ctx.createRadialGradient(cx2 - 0.5, cy2 - 0.5, 0, cx2, cy2, mioloR);
    mioloG.addColorStop(0,   '#ffe060');
    mioloG.addColorStop(0.6, '#d4a820');
    mioloG.addColorStop(1,   '#a07010');
    ctx.fillStyle = mioloG;
    ctx.beginPath();
    ctx.arc(cx2, cy2, mioloR, 0, Math.PI * 2);
    ctx.fill();

    // Pontilhado no miolo — textura de pólen
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    for (const [dx, dy] of [[-1,-1],[1,0],[0,1],[-1,1],[1,-1]]) {
      ctx.beginPath();
      ctx.arc(cx2 + dx, cy2 + dy, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

function drawLeafBushes(map, cam, time) {
  if (!map.leafBushes || map.leafBushes.length === 0) return;

  map.leafBushes.forEach((b, idx) => {
    const bx = b.tx * TILE + TILE / 2 - cam.x;
    const by = (b.ty + 1) * TILE - cam.y;

    ctx.save();

    // ── Sombra no chão ───────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(bx, by, 0, bx, by, 13);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.28)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Nuvem de folhas — círculos menores, copa elevada ──────────────────
    // Copa começa a partir de by-14 para deixar caule visível embaixo
    const back = [
      { ox: -6, oy: -18, r: 7,  color: '#162408' },
      { ox:  6, oy: -18, r: 7,  color: '#162408' },
      { ox:  0, oy: -16, r: 7,  color: '#1a2a0a' },
      { ox: -4, oy: -23, r: 6,  color: '#1a2a0a' },
      { ox:  4, oy: -23, r: 6,  color: '#1a2a0a' },
    ];
    const front = [
      { ox: -5, oy: -25, r: 6,  color: '#243814' },
      { ox:  5, oy: -25, r: 6,  color: '#243814' },
      { ox:  0, oy: -28, r: 7,  color: '#2c4418' },
      { ox: -2, oy: -20, r: 5,  color: '#22360e' },
      { ox:  2, oy: -20, r: 5,  color: '#22360e' },
      { ox:  0, oy: -33, r: 5,  color: '#334e1e' },
    ];

    for (const l of [...back, ...front]) {
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.arc(bx + l.ox, by + l.oy, l.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Highlight ─────────────────────────────────────────────────────────
    const hlG = ctx.createRadialGradient(bx - 4, by - 30, 0, bx - 4, by - 30, 12);
    hlG.addColorStop(0, 'rgba(140,220,80,0.12)');
    hlG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hlG;
    ctx.beginPath();
    ctx.arc(bx, by - 24, 13, 0, Math.PI * 2);
    ctx.fill();

    // ── Sombra interna na base da copa ────────────────────────────────────
    const darkG = ctx.createRadialGradient(bx, by - 16, 2, bx, by - 16, 10);
    darkG.addColorStop(0,   'rgba(0,0,0,0.25)');
    darkG.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = darkG;
    ctx.beginPath();
    ctx.arc(bx, by - 16, 10, 0, Math.PI * 2);
    ctx.fill();

    // ── Caule — desenhado por cima da copa para garantir visibilidade ─────
    ctx.fillStyle = '#1e0e04';
    ctx.fillRect(bx - 2, by - 10, 3, 10);
    ctx.fillStyle = '#2e1808';
    ctx.fillRect(bx - 2, by - 10, 1, 10);

    ctx.restore();
  });
}

function drawViolets(map, cam, time) {
  if (!map.violets || map.violets.length === 0) return;

  map.violets.forEach((v, idx) => {
    const bx = v.tx * TILE + TILE / 2 - cam.x;
    const by = (v.ty + 1) * TILE - cam.y;

    const seed = idx * 1.87;
    const sway = Math.sin(time * 1.6 + seed) * 0.7;

    ctx.save();

    // ── Sombra no chão ───────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(bx, by, 0, bx, by, 8);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.22)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Haste ─────────────────────────────────────────────────────────────
    const hasteH = 11;
    const topX   = bx + sway;
    const topY   = by - hasteH;

    ctx.strokeStyle = '#2a4a10';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(topX, topY);
    ctx.stroke();

    // Folhinha lateral
    ctx.fillStyle = '#2a4a10';
    ctx.beginPath();
    ctx.ellipse(topX + 4, topY + 5, 4, 2, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // ── Centro da flor ────────────────────────────────────────────────────
    const cx2 = topX;
    const cy2 = topY - 5;

    // ── 5 pétalas violetas arredondadas ───────────────────────────────────
    const petalCount = 5;
    const petalL     = 5.5;
    const petalW     = 3;

    for (let i = 0; i < petalCount; i++) {
      const angle  = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
      const px2    = cx2 + Math.cos(angle) * (petalL * 0.55);
      const py2    = cy2 + Math.sin(angle) * (petalL * 0.55);
      // pétalas inferiores ligeiramente mais escuras
      const bright = i < 2 ? '#7a3a9a' : '#9a4ab8';
      ctx.fillStyle = bright;
      ctx.beginPath();
      ctx.ellipse(px2, py2, petalW, petalL * 0.58, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    // Veio central em cada pétala (linha mais clara)
    ctx.strokeStyle = 'rgba(200,150,255,0.25)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx2, cy2);
      ctx.lineTo(cx2 + Math.cos(angle) * petalL, cy2 + Math.sin(angle) * petalL);
      ctx.stroke();
    }

    // ── Miolo — amarelo-esverdeado pequeno ────────────────────────────────
    const mioloG = ctx.createRadialGradient(cx2 - 0.5, cy2 - 0.5, 0, cx2, cy2, 2.5);
    mioloG.addColorStop(0,   '#fff080');
    mioloG.addColorStop(0.6, '#c8a020');
    mioloG.addColorStop(1,   '#806010');
    ctx.fillStyle = mioloG;
    ctx.beginPath();
    ctx.arc(cx2, cy2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawTrees(map, cam, time) {
  if (!map.trees || map.trees.length === 0) return;

  map.trees.forEach((t, idx) => {
    const bx = t.tx * TILE + TILE / 2 - cam.x;
    const by = (t.ty + 1) * TILE - cam.y;

    const seed = idx * 3.71 + 5.3;
    // balanceio suave dos galhos
    const sway = Math.sin(time * 0.9 + seed) * 1.2;

    ctx.save();

    // ── Sombra elíptica no chão ──────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(bx, by, 0, bx, by, 22);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.40)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Tronco ────────────────────────────────────────────────────────────
    const trunkH = 38;
    const trunkW = 8;
    const trunkX = bx - trunkW / 2;
    const trunkY = by - trunkH;

    // gradiente de madeira escura
    const trunkGrad = ctx.createLinearGradient(trunkX, trunkY, trunkX + trunkW, trunkY);
    trunkGrad.addColorStop(0,   '#120808');
    trunkGrad.addColorStop(0.3, '#2a1208');
    trunkGrad.addColorStop( .6, '#361808');
    trunkGrad.addColorStop(1,   '#0e0604');
    ctx.fillStyle = trunkGrad;
    ctx.fillRect(trunkX, trunkY, trunkW, trunkH);

    // veios verticais
    ctx.fillStyle = 'rgba(80,40,10,0.25)';
    ctx.fillRect(trunkX + 1, trunkY + 4, 1, trunkH - 6);
    ctx.fillRect(trunkX + 5, trunkY + 8, 1, trunkH - 12);

    // ── Galhos laterais (2 por lado) ──────────────────────────────────────
    const branchColor = '#1c0e06';
    ctx.strokeStyle = branchColor;
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';

    // galho esquerdo superior
    ctx.beginPath();
    ctx.moveTo(bx - 2, trunkY + 10);
    ctx.quadraticCurveTo(bx - 14 + sway, trunkY + 2,  bx - 22 + sway * 1.5, trunkY - 4);
    ctx.stroke();
    // galho esquerdo inferior
    ctx.beginPath();
    ctx.moveTo(bx - 2, trunkY + 22);
    ctx.quadraticCurveTo(bx - 10 + sway * 0.7, trunkY + 16, bx - 18 + sway, trunkY + 12);
    ctx.stroke();

    // galho direito superior
    ctx.beginPath();
    ctx.moveTo(bx + 2, trunkY + 10);
    ctx.quadraticCurveTo(bx + 14 + sway, trunkY + 2,  bx + 22 + sway * 1.5, trunkY - 4);
    ctx.stroke();
    // galho direito inferior
    ctx.beginPath();
    ctx.moveTo(bx + 2, trunkY + 22);
    ctx.quadraticCurveTo(bx + 10 + sway * 0.7, trunkY + 16, bx + 18 + sway, trunkY + 12);
    ctx.stroke();

    // ── Copa — 3 círculos de folhagem sobrepostos (estilo pixel-art sombrio) ─
    // base (mais larga, mais escura)
    const canopeY = trunkY + 4;

    const leafLayers = [
      { ox: sway * 0.5,  oy: 0,   rx: 24, ry: 18, color: '#0e1e06' },
      { ox: sway * 0.8,  oy: -10, rx: 20, ry: 16, color: '#142808' },
      { ox: sway * 1.0,  oy: -20, rx: 14, ry: 12, color: '#1a3210' },
    ];

    for (const ll of leafLayers) {
      const lx = bx + ll.ox;
      const ly = canopeY + ll.oy;

      // camada base de folhagem
      ctx.fillStyle = ll.color;
      ctx.beginPath();
      ctx.ellipse(lx, ly, ll.rx, ll.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // silhueta de "dentes" / folhas no contorno — pequenos arcos irregulares
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      const bumps = 7;
      for (let i = 0; i < bumps; i++) {
        const a    = (i / bumps) * Math.PI * 2 + seed * 0.5;
        const bumpX = lx + Math.cos(a) * (ll.rx - 2);
        const bumpY = ly + Math.sin(a) * (ll.ry - 2);
        ctx.beginPath();
        ctx.arc(bumpX, bumpY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // brilho sutil no topo-esquerdo
      ctx.fillStyle = 'rgba(80,130,30,0.08)';
      ctx.beginPath();
      ctx.ellipse(lx - ll.rx * 0.2, ly - ll.ry * 0.3, ll.rx * 0.55, ll.ry * 0.4, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Sombra interior da copa (profundidade) ────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.beginPath();
    ctx.ellipse(bx + sway * 0.6, canopeY + 4, 18, 13, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawSlenderTrees(map, cam, time) {
  if (!map.slenderTrees || map.slenderTrees.length === 0) return;

  map.slenderTrees.forEach((t, idx) => {
    const bx = t.tx * TILE + TILE / 2 - cam.x;
    const by = (t.ty + 1) * TILE - cam.y;

    const seed = idx * 4.17 + 2.9;
    // balanceio mais perceptível por ser árvore fina e alta
    const sway = Math.sin(time * 0.75 + seed) * 1.8;

    ctx.save();

    // ── Sombra no chão (estreita) ─────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(bx, by, 0, bx, by, 12);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.35)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Tronco fino e alto ────────────────────────────────────────────────
    const trunkH = 56;
    const trunkW = 4;
    const trunkX = bx - trunkW / 2;
    const trunkY = by - trunkH;

    const trunkGrad = ctx.createLinearGradient(trunkX, trunkY, trunkX + trunkW, trunkY);
    trunkGrad.addColorStop(0,   '#0e0606');
    trunkGrad.addColorStop(0.4, '#251008');
    trunkGrad.addColorStop(1,   '#0a0402');
    ctx.fillStyle = trunkGrad;
    ctx.fillRect(trunkX, trunkY, trunkW, trunkH);

    // veio central
    ctx.fillStyle = 'rgba(70,30,8,0.30)';
    ctx.fillRect(trunkX + 1, trunkY + 6, 1, trunkH - 10);

    // ── Copa — oval alongada verticalmente (estreita e alta) ──────────────
    const canopeY = trunkY - 2;

    const leafLayers = [
      { ox: sway * 0.4, oy:  4, rx: 14, ry: 22, color: '#0d1c06' },
      { ox: sway * 0.7, oy: -8, rx: 10, ry: 17, color: '#132408' },
      { ox: sway * 1.0, oy:-20, rx:  7, ry: 12, color: '#192e0e' },
    ];

    for (const ll of leafLayers) {
      const lx = bx + ll.ox;
      const ly = canopeY + ll.oy;

      ctx.fillStyle = ll.color;
      ctx.beginPath();
      ctx.ellipse(lx, ly, ll.rx, ll.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // bordas irregulares — menos bumps, menores
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      const bumps = 6;
      for (let i = 0; i < bumps; i++) {
        const a     = (i / bumps) * Math.PI * 2 + seed * 0.6;
        const bumpX = lx + Math.cos(a) * (ll.rx - 1);
        const bumpY = ly + Math.sin(a) * (ll.ry - 2);
        ctx.beginPath();
        ctx.arc(bumpX, bumpY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // reflexo topo
      ctx.fillStyle = 'rgba(70,120,25,0.07)';
      ctx.beginPath();
      ctx.ellipse(lx - ll.rx * 0.15, ly - ll.ry * 0.35, ll.rx * 0.45, ll.ry * 0.32, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Sombra interna da copa ────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(bx + sway * 0.5, canopeY + 8, 9, 15, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

// ─── POTION SYSTEM ──────────────────────────────────────────────────────────
// Poções reaparecem ao trocar de mapa (não são persistentes como as estrelas).
// Cada mapa tem no máximo uma poção, definida por { tx, ty } no objeto do mapa.
const POTION_HEAL    = 30;   // HP recuperado por poção
const POTION_RADIUS  = 7;    // raio do frasco em px
 
// Guarda quais mapas já tiveram a poção coletada nesta sessão de jogo
const collectedPotions = new Set();
 
function drawPotion(map, cam, time) {
  if (!map.potion) return;
  if (collectedPotions.has(map.id)) return;
 
  const p  = map.potion;
  const cx = p.tx * TILE + TILE / 2 - cam.x;
  const cy = p.ty * TILE + TILE / 2 - cam.y + Math.sin(time * 2.2) * 3; // flutua
  const R  = POTION_RADIUS;
  const pulse = 0.7 + 0.3 * Math.sin(time * 4);
 
  ctx.save();
 
  // Brilho externo verde
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur  = 14 + 8 * pulse;
 
  // Corpo do frasco (oval)
  const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R * 1.2);
  grad.addColorStop(0,   'rgba(180, 255, 200, 0.95)');
  grad.addColorStop(0.5, 'rgba(0,   200, 100, 0.9)');
  grad.addColorStop(1,   'rgba(0,   100,  50, 0.85)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, R, R * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
 
  // Gargalo do frasco
  ctx.fillStyle   = 'rgba(160, 240, 180, 0.9)';
  ctx.shadowBlur  = 4;
  ctx.fillRect(cx - 3, cy - R * 1.2 - 5, 6, 7);
 
  // Rolha
  ctx.fillStyle   = '#8b5e3c';
  ctx.shadowBlur  = 0;
  ctx.fillRect(cx - 3.5, cy - R * 1.2 - 7, 7, 4);
 
  // Reflexo interno
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(cx - R * 0.3, cy - R * 0.2, R * 0.25, R * 0.5, -0.4, 0, Math.PI * 2);
  ctx.fill();
 
  // Cruz de cura pulsante acima do frasco
  const crossY = cy - R * 1.6 - 10 + Math.sin(time * 3) * 2;
  ctx.fillStyle   = `rgba(0, 255, 120, ${0.6 + 0.4 * pulse})`;
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur  = 8;
  ctx.fillRect(cx - 5, crossY - 2, 10, 4);
  ctx.fillRect(cx - 2, crossY - 5, 4, 10);
 
  ctx.shadowBlur = 0;
  ctx.restore();
}
 
function checkPotionCollection(player, map) {
  if (!map.potion) return;
  if (collectedPotions.has(map.id)) return;
  if (player.hp >= player.maxHp) return; // não coleta se cheio
 
  const p    = map.potion;
  const px   = player.x + player.w / 2;
  const py   = player.y + player.h / 2;
  const sx   = p.tx * TILE + TILE / 2;
  const sy   = p.ty * TILE + TILE / 2;
  const dist = Math.hypot(px - sx, py - sy);
 
  if (dist < TILE * 0.9) {
    collectedPotions.add(map.id);
    player.hp = Math.min(player.maxHp, player.hp + POTION_HEAL);
    // Partículas verdes de cura
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        spawnParticles(sx, sy, '#00ff88', 14, 4);
        spawnParticles(sx, sy, '#aaffcc', 8,  3);
      }, i * 70);
    }
  }
}
 
function resetPotions() {
  collectedPotions.clear();
}

// ─── CRUMBLE TILE SYSTEM ────────────────────────────────────────────────────
// Tile (T.CRUMBLE / char 'f') que treme e desaparece ao pisar, depois reaparece.
// Estado por tile: { phase, timer }
//   'idle'      → sólido, aspecto normal
//   'shaking'   → contagem regressiva antes de cair (CRUMBLE_SHAKE_T s)
//   'gone'      → invisível e sem colisão    (CRUMBLE_GONE_T  s)
//   'respawning'→ animação de reaparecimento (CRUMBLE_RESP_T  s)
 
const CRUMBLE_SHAKE_T = 1.2;   // segundos tremendo antes de cair
const CRUMBLE_GONE_T  = 3.0;   // segundos sumido
const CRUMBLE_RESP_T  = 0.55;  // segundos de animação de reaparecimento
 
const crumbleStates = {};       // chave: "mapId:tx:ty"
 
function crumbleKey(mapId, tx, ty) { return `${mapId}:${tx}:${ty}`; }
 
function crumbleGet(mapId, tx, ty) {
  const k = crumbleKey(mapId, tx, ty);
  if (!crumbleStates[k]) crumbleStates[k] = { phase: 'idle', timer: 0 };
  return crumbleStates[k];
}
 
function updateCrumbleTiles(dt, map, player) {
  const mid = currentMapId;
 
  // Detecta em quais tiles CRUMBLE o jogador está pisando (pés do player)
  if (player.onGround) {
    const footY = Math.floor((player.y + player.h + 2) / TILE);
    const x0    = Math.floor(player.x / TILE);
    const x1    = Math.floor((player.x + player.w - 1) / TILE);
    for (let tx = x0; tx <= x1; tx++) {
      // Lê o tile RAW (sem override) para detectar CRUMBLE independente do estado
      const raw = map.tiles[footY * map.cols + tx];
      if (raw === T.CRUMBLE) {
        const cs = crumbleGet(mid, tx, footY);
        if (cs.phase === 'idle') {
          cs.phase = 'shaking';
          cs.timer = CRUMBLE_SHAKE_T;
        }
      }
    }
  }
 
  // Avança a máquina de estados de todos os tiles CRUMBLE activos
  for (const [k, cs] of Object.entries(crumbleStates)) {
    if (cs.phase === 'idle') continue;
 
    cs.timer -= dt;
 
    if (cs.phase === 'shaking' && cs.timer <= 0) {
      // Cai! Spawn de partículas de pedra
      const [_mid, _tx, _ty] = k.split(':').map(Number);
      if (_mid === mid) {
        const cx2 = _tx * TILE + TILE / 2;
        const cy2 = _ty * TILE + TILE / 2;
        spawnParticles(cx2, cy2, '#4a8aaa', 10, 4);
        spawnParticles(cx2, cy2, '#263545',  6, 3);
      }
      cs.phase = 'gone';
      cs.timer = CRUMBLE_GONE_T;
    }
    else if (cs.phase === 'gone' && cs.timer <= 0) {
      cs.phase = 'respawning';
      cs.timer = CRUMBLE_RESP_T;
    }
    else if (cs.phase === 'respawning' && cs.timer <= 0) {
      cs.phase = 'idle';
      cs.timer = 0;
    }
  }
}
 
function resetCrumbleTiles() {
  for (const k in crumbleStates) delete crumbleStates[k];
}

// ─── MANA POTION SYSTEM ─────────────────────────────────────────────────────
const MANA_POTION_RESTORE = 50;
const MANA_POTION_RADIUS  = 7;
const collectedManaPotions = new Set();
 
function drawManaPotion(map, cam, time) {
  if (!map.manaPotion) return;
  if (collectedManaPotions.has(map.id)) return;
 
  const p     = map.manaPotion;
  const cx    = p.tx * TILE + TILE / 2 - cam.x;
  const cy    = p.ty * TILE + TILE / 2 - cam.y + Math.sin(time * 2.6) * 3;
  const R     = MANA_POTION_RADIUS;
  const pulse = 0.7 + 0.3 * Math.sin(time * 4.5);
 
  ctx.save();
  ctx.shadowColor = "#4488ff";
  ctx.shadowBlur  = 14 + 8 * pulse;
 
  const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R * 1.2);
  grad.addColorStop(0,   "rgba(180, 210, 255, 0.95)");
  grad.addColorStop(0.5, "rgba(40,  100, 230, 0.9)");
  grad.addColorStop(1,   "rgba(20,   40, 130, 0.85)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, R, R * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
 
  ctx.fillStyle  = "rgba(140, 180, 255, 0.9)";
  ctx.shadowBlur = 4;
  ctx.fillRect(cx - 3, cy - R * 1.2 - 5, 6, 7);
 
  ctx.fillStyle  = "#5a3a8a";
  ctx.shadowBlur = 0;
  ctx.fillRect(cx - 3.5, cy - R * 1.2 - 7, 7, 4);
 
  ctx.fillStyle = "rgba(200, 220, 255, 0.45)";
  ctx.beginPath();
  ctx.ellipse(cx - R * 0.3, cy - R * 0.2, R * 0.25, R * 0.5, -0.4, 0, Math.PI * 2);
  ctx.fill();
 
  const symY = cy - R * 1.6 - 10 + Math.sin(time * 3.2) * 2;
  const symS = 5 + pulse * 1.5;
  ctx.fillStyle   = "rgba(100, 180, 255, " + (0.6 + 0.4 * pulse) + ")";
  ctx.shadowColor = "#4488ff";
  ctx.shadowBlur  = 10;
  ctx.beginPath();
  ctx.moveTo(cx,        symY - symS);
  ctx.lineTo(cx + symS, symY);
  ctx.lineTo(cx,        symY + symS);
  ctx.lineTo(cx - symS, symY);
  ctx.closePath();
  ctx.fill();
 
  ctx.shadowBlur = 0;
  ctx.restore();
}
 
function checkManaPotionCollection(player, map) {
  if (!map.manaPotion) return;
  if (collectedManaPotions.has(map.id)) return;
  if (player.mp >= player.maxMp) return;
 
  const p    = map.manaPotion;
  const px   = player.x + player.w / 2;
  const py   = player.y + player.h / 2;
  const sx   = p.tx * TILE + TILE / 2;
  const sy   = p.ty * TILE + TILE / 2;
  const dist = Math.hypot(px - sx, py - sy);
 
  if (dist < TILE * 0.9) {
    collectedManaPotions.add(map.id);
    player.mp = Math.min(player.maxMp, player.mp + MANA_POTION_RESTORE);
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        spawnParticles(sx, sy, "#4488ff", 14, 4);
        spawnParticles(sx, sy, "#aaccff", 8,  3);
      }, i * 70);
    }
  }
}
 
function resetManaPotions() {
  collectedManaPotions.clear();
}

const collectedOrbs = new Set();
const ORB_RADIUS    = 7;
 
function drawOrb(map, cam, time) {
  if (!map.orb) return;
  if (collectedOrbs.has(map.id)) return;
 
  const o  = map.orb;
  const cx = o.tx * TILE + TILE / 2 - cam.x;
  const cy = o.ty * TILE + TILE / 2 - cam.y + Math.sin(time * 1.8) * 4;
  const R  = ORB_RADIUS;
  const pulse = 0.6 + 0.4 * Math.sin(time * 3.5);
 
  ctx.save();
 
  // Aura externa giratória
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 1.1);
  for (let i = 0; i < 6; i++) {
    const a  = (i / 6) * Math.PI * 2;
    const ax = Math.cos(a) * (R + 5);
    const ay = Math.sin(a) * (R + 5);
    ctx.fillStyle   = `rgba(80, 180, 255, ${0.3 + 0.3 * pulse})`;
    ctx.shadowColor = '#44aaff';
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.arc(ax, ay, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
 
  // Corpo do orbe — gradiente azul/ciano
  ctx.shadowColor = '#44aaff';
  ctx.shadowBlur  = 16 + 10 * pulse;
  const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, 0, cx, cy, R);
  grad.addColorStop(0,   'rgba(200, 240, 255, 0.98)');
  grad.addColorStop(0.4, 'rgba(80,  180, 255, 0.92)');
  grad.addColorStop(0.8, 'rgba(20,  80,  200, 0.85)');
  grad.addColorStop(1,   'rgba(0,   30,  120, 0.8)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
 
  // Anel externo
  ctx.strokeStyle = `rgba(120, 200, 255, ${0.5 + 0.4 * pulse})`;
  ctx.lineWidth   = 1.5;
  ctx.shadowBlur  = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
  ctx.stroke();
 
  // Reflexo
  ctx.shadowBlur = 0;
  ctx.fillStyle  = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - R * 0.25, cy - R * 0.3, R * 0.22, R * 0.12, -0.5, 0, Math.PI * 2);
  ctx.fill();
 
  // Seta ↗ no centro indicando teleporte
  ctx.fillStyle   = `rgba(220, 240, 255, ${0.7 + 0.3 * pulse})`;
  ctx.font        = 'bold 9px monospace';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur  = 6;
  ctx.fillText('↗', cx, cy);
  ctx.shadowBlur  = 0;
 
  ctx.restore();
}
 
function checkOrbCollection(player, map) {
  if (!map.orb) return;
  if (collectedOrbs.has(map.id)) return;
  if (fadeState !== 'idle') return;
 
  const o    = map.orb;
  const px   = player.x + player.w / 2;
  const py   = player.y + player.h / 2;
  const sx   = o.tx * TILE + TILE / 2;
  const sy   = o.ty * TILE + TILE / 2;
  const dist = Math.hypot(px - sx, py - sy);
 
  if (dist < TILE * 0.9) {
    collectedOrbs.add(map.id);
    // Partículas de teletransporte
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        spawnParticles(sx, sy, '#44aaff', 16, 5);
        spawnParticles(sx, sy, '#aaddff',  8, 3);
      }, i * 60);
    }
    // Teleporta para o mapa e coordenadas definidas no orbe
    startFade(o.destMap, 'default', null, { x: o.destTx, y: o.destTy });
  }
}
 
function resetOrbs() {
  collectedOrbs.clear();
}

// ─── NPC SYSTEM ────────────────────────────────────────────────────────────
// NPCs definidos no mapa via npcs: [{ tx, ty, name, lines: [...] }]
// O jogador pressiona E para iniciar/avançar o diálogo.

const NPC_INTERACT_RADIUS = 40; // px — distância para interagir

let npcs          = [];
let npcDialogue   = null; // { npc, lineIndex } | null — diálogo ativo
let npcInteractJustPressed = false; // evita segurar E avançar tudo

function initNpcs(map) {
  npcs = [];
  npcDialogue = null;
  if (!map.npcs) return;
  for (const def of map.npcs) {
    npcs.push({
      tx:     def.tx,
      ty:     def.ty,
      name:   def.name   ?? 'NPC',
      lines:  def.lines  ?? ['...'],
      drawFn: def.drawFn ?? drawNpcDefault, // fallback genérico
      cx: def.tx * TILE + TILE / 2,
      cy: def.ty * TILE + TILE / 2,
    });
  }
}

function updateNpcs(player) {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;

  // Fecha o diálogo com ESC imediatamente
  if (npcDialogue && isDown('Escape')) {
    npcDialogue = null;
    return;
  }

  // Detecta press de E (borda de subida — não segurável)
  const eDown = isDown('KeyE');
  const justPressedE = eDown && !npcInteractJustPressed;
  npcInteractJustPressed = eDown;

  if (justPressedE) {
    // Se há diálogo ativo, avança ou fecha
    if (npcDialogue) {
      npcDialogue.lineIndex++;
      if (npcDialogue.lineIndex >= npcDialogue.npc.lines.length) {
        npcDialogue = null; // fim do diálogo
      }
      return;
    }

    // Tenta iniciar diálogo com o NPC mais próximo
    let closest = null;
    let closestDist = NPC_INTERACT_RADIUS;
    for (const npc of npcs) {
      const dist = Math.hypot(px - npc.cx, py - npc.cy);
      if (dist < closestDist) { closestDist = dist; closest = npc; }
    }
    if (closest) {
      npcDialogue = { npc: closest, lineIndex: 0 };
    }
  }
}

function drawNpcs(cam, time) {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;

  for (const npc of npcs) {
    const sx = npc.cx - cam.x;
    const sy = npc.cy - cam.y;

    ctx.save();
    npc.drawFn(sx, sy, time); // cada um cuida do próprio visual
    ctx.restore();

    // Indicador [E] — igual para todos
    const dist = Math.hypot(px - npc.cx, py - npc.cy);
    if (dist <= NPC_INTERACT_RADIUS && !npcDialogue) {
      const bob = Math.sin(time * 4) * 2;
      ctx.save();
      ctx.fillStyle = 'rgba(255,240,180,0.92)';
      ctx.fillRect(sx - 12, sy - 32 + bob, 24, 14);
      ctx.fillRect(sx - 3,  sy - 18 + bob, 6, 4);
      ctx.fillStyle = '#3a2800';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[E]', sx, sy - 22 + bob);
      ctx.restore();
    }
  }
}

function drawNpcDialogue() {
  if (!npcDialogue) return;

  const W = canvas.width;
  const H = canvas.height;

  const boxH  = 110;
  const boxY  = H - boxH - 16;
  const padX  = 24;
  const boxW  = W - padX * 2;

  ctx.save();

  // Fundo da caixa
  ctx.fillStyle = 'rgba(10, 6, 20, 0.92)';
  ctx.fillRect(padX, boxY, boxW, boxH);

  // Borda
  ctx.strokeStyle = '#5a3a80';
  ctx.lineWidth = 2;
  ctx.strokeRect(padX, boxY, boxW, boxH);

  // Nome do NPC
  ctx.fillStyle = '#c8a0ff';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(npcDialogue.npc.name, padX + 14, boxY + 20);

  // Separador
  ctx.fillStyle = '#3a2058';
  ctx.fillRect(padX + 14, boxY + 28, boxW - 28, 1);

  // Texto da fala atual
  ctx.fillStyle = '#e8deff';
  ctx.font = '13px "Courier New", monospace';
  const line = npcDialogue.npc.lines[npcDialogue.lineIndex];
  // Quebra linha longa automaticamente
  const maxW = boxW - 28;
  const words = line.split(' ');
  let row = '', rowY = boxY + 48;
  for (const word of words) {
    const test = row + (row ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxW && row) {
      ctx.fillText(row, padX + 14, rowY);
      row = word; rowY += 18;
    } else { row = test; }
  }
  ctx.fillText(row, padX + 14, rowY);

  // Indicador de avançar
  const isLast = npcDialogue.lineIndex >= npcDialogue.npc.lines.length - 1;
  ctx.fillStyle = '#9060c0';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(isLast ? '[E] Fechar' : '[E] Continuar ▶', padX + boxW - 10, boxY + boxH - 10);

  // Contador de linhas
  ctx.fillStyle = '#5a3a70';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${npcDialogue.lineIndex + 1} / ${npcDialogue.npc.lines.length}`, padX + 14, boxY + boxH - 10);

  ctx.restore();
}

// ── Fallback genérico ─────────────────────────────────────────────────────
function drawNpcDefault(sx, sy, time) {
  ctx.fillStyle = '#555';
  ctx.fillRect(sx - 6, sy - 14, 12, 20);
  ctx.fillStyle = '#888';
  ctx.fillRect(sx - 5, sy - 22, 10, 10);
}

// ── Guardião da Cripta — armadura pesada enferrujada ───────────────────────
function drawNpcGuardian(sx, sy, time) {
  // Pernas
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(sx - 6, sy + 6,  5, 10);
  ctx.fillRect(sx + 1, sy + 6,  5, 10);
  // Bota
  ctx.fillStyle = '#222230';
  ctx.fillRect(sx - 7, sy + 13,  6, 4);
  ctx.fillRect(sx + 1, sy + 13,  6, 4);
  // Corpo / armadura
  ctx.fillStyle = '#4a4a5a';
  ctx.fillRect(sx - 8, sy - 4, 16, 12);
  // Placa central enferrujada
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(sx - 4, sy - 2,  8, 8);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(sx - 1, sy,  2, 5);
  // Ombros
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(sx - 11, sy - 4, 5, 5);
  ctx.fillRect(sx +  6, sy - 4, 5, 5);
  // Cabeça / elmo
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(sx - 6, sy - 14, 12, 12);
  // Viseira
  ctx.fillStyle = '#111118';
  ctx.fillRect(sx - 4, sy - 9,  8, 4);
  // Brilho nos olhos (fantasma dentro da armadura)
  const pulse = Math.sin(time * 2) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(80, 180, 255, ${pulse})`;
  ctx.fillRect(sx - 3, sy - 8, 2, 2);
  ctx.fillRect(sx + 1, sy - 8, 2, 2);
  // Crista do elmo
  ctx.fillStyle = '#5a1a1a';
  ctx.fillRect(sx - 2, sy - 18, 4, 6);
}

// ── Minotauro ─────────────────────────────────────────────────────────────
function drawNpcMinotaur(sx, sy, time) {
  const breathe = Math.sin(time * 1.0) * 1.5;
  const pulse   = Math.sin(time * 2.5) * 0.5 + 0.5;
  const nostril = Math.sin(time * 1.8) * 0.4 + 0.6;

  sy += 4;

  ctx.translate(sx, sy);
  ctx.scale(0.70, 0.70);
  ctx.translate(-sx, -sy);

  // ── Cascos / pés ──────────────────────────────────────────────────
  ctx.fillStyle = '#1a1010';
  ctx.fillRect(sx - 10, sy + 10, 8, 6);
  ctx.fillRect(sx +  2, sy + 10, 8, 6);
  // Divisão do casco
  ctx.fillStyle = '#0e0808';
  ctx.fillRect(sx - 7,  sy + 10, 1, 6);
  ctx.fillRect(sx +  5, sy + 10, 1, 6);

  // ── Pernas musculosas ─────────────────────────────────────────────
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(sx - 10, sy - 2, 9, 14);
  ctx.fillRect(sx +  1, sy - 2, 9, 14);
  // Músculo da panturrilha
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(sx - 9,  sy,     5, 8);
  ctx.fillRect(sx +  4, sy,     5, 8);
  // Pelo das pernas
  ctx.fillStyle = '#2a1a0e';
  ctx.fillRect(sx - 10, sy - 2, 2, 14);
  ctx.fillRect(sx +  8, sy - 2, 2, 14);

  // ── Tanga / veste ─────────────────────────────────────────────────
  ctx.fillStyle = '#2a1a08';
  ctx.fillRect(sx - 8, sy - 4, 16, 6);
  // Fivela metálica
  ctx.fillStyle = '#6a5020';
  ctx.fillRect(sx - 2, sy - 3,  4, 4);
  ctx.fillStyle = '#8a7030';
  ctx.fillRect(sx - 1, sy - 2,  2, 2);

  // ── Torso enorme ──────────────────────────────────────────────────
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(sx - 12, sy - 18 + breathe, 24, 16);
  // Peitoral dividido
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(sx - 11, sy - 17 + breathe, 10, 8);
  ctx.fillRect(sx +  1, sy - 17 + breathe, 10, 8);
  // Sulco central
  ctx.fillStyle = '#2a1a0e';
  ctx.fillRect(sx -  1, sy - 18 + breathe,  2, 16);
  // Costelas laterais
  ctx.fillStyle = '#2e1c10';
  ctx.fillRect(sx - 12, sy - 14 + breathe,  2, 10);
  ctx.fillRect(sx + 10, sy - 14 + breathe,  2, 10);
  // Pelo do peito
  ctx.fillStyle = '#2a1a0e';
  ctx.fillRect(sx -  3, sy - 16 + breathe,  6,  4);
  ctx.fillRect(sx -  2, sy - 13 + breathe,  4,  3);

  // ── Corrente / argola no pescoço ──────────────────────────────────
  ctx.fillStyle = '#5a4818';
  ctx.fillRect(sx - 6, sy - 20 + breathe, 12,  3);
  ctx.fillStyle = '#7a6828';
  ctx.fillRect(sx - 5, sy - 20 + breathe, 10,  1);
  // Argolas da corrente
  ctx.fillStyle = '#6a5820';
  ctx.fillRect(sx - 3, sy - 20 + breathe,  2,  3);
  ctx.fillRect(sx + 1, sy - 20 + breathe,  2,  3);

  // ── Braços possantes ──────────────────────────────────────────────
  // Braço esquerdo
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(sx - 20, sy - 16 + breathe, 10, 8);
  ctx.fillRect(sx - 18, sy -  8 + breathe, 8, 10);
  // Músculo do bíceps
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(sx - 19, sy - 14 + breathe, 6, 6);
  // Punho
  ctx.fillStyle = '#2e1c10';
  ctx.fillRect(sx - 18, sy +  2 + breathe, 8, 6);
  // Dedos / garras
  ctx.fillStyle = '#1a1008';
  ctx.fillRect(sx - 19, sy +  6 + breathe, 3, 4);
  ctx.fillRect(sx - 15, sy +  7 + breathe, 3, 4);
  ctx.fillRect(sx - 11, sy +  6 + breathe, 2, 3);

  // Braço direito (espelho, levemente diferente)
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(sx + 10, sy - 16 + breathe, 10, 8);
  ctx.fillRect(sx + 10, sy -  8 + breathe, 8, 10);
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(sx + 13, sy - 14 + breathe, 6, 6);
  ctx.fillStyle = '#2e1c10';
  ctx.fillRect(sx + 10, sy +  2 + breathe, 8, 6);
  ctx.fillStyle = '#1a1008';
  ctx.fillRect(sx + 16, sy +  6 + breathe, 3, 4);
  ctx.fillRect(sx + 12, sy +  7 + breathe, 3, 4);
  ctx.fillRect(sx +  9, sy +  6 + breathe, 2, 3);

  // ── Pescoço touro ─────────────────────────────────────────────────
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(sx - 6, sy - 26 + breathe, 12, 8);
  ctx.fillStyle = '#2a1a0e';
  ctx.fillRect(sx - 6, sy - 26 + breathe,  2, 8);

  // ── Cabeça de touro ───────────────────────────────────────────────
  // Crânio
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(sx - 9, sy - 40 + breathe, 18, 16);
  // Focinho largo
  ctx.fillStyle = '#4a2e1c';
  ctx.fillRect(sx - 7, sy - 30 + breathe, 14, 8);
  ctx.fillRect(sx - 6, sy - 26 + breathe, 12, 4);
  // Narinas pulsantes
  ctx.fillStyle = '#1a0c08';
  ctx.fillRect(sx - 5, sy - 28 + breathe, 4, 3);
  ctx.fillRect(sx + 1, sy - 28 + breathe, 4, 3);
  ctx.fillStyle = `rgba(180, 60, 20, ${nostril * 0.7})`;
  ctx.fillRect(sx - 4, sy - 27 + breathe, 2, 2);
  ctx.fillRect(sx + 2, sy - 27 + breathe, 2, 2);
  // Boca fechada / rígida
  ctx.fillStyle = '#1a0c08';
  ctx.fillRect(sx - 4, sy - 24 + breathe, 8, 1);
  // Queixo
  ctx.fillStyle = '#2e1c10';
  ctx.fillRect(sx - 5, sy - 23 + breathe, 10, 3);

  // Pelo da cabeça / topete
  ctx.fillStyle = '#1e1008';
  ctx.fillRect(sx - 6, sy - 42 + breathe, 12, 4);
  ctx.fillRect(sx - 4, sy - 44 + breathe,  8, 4);
  ctx.fillRect(sx - 2, sy - 45 + breathe,  4, 3);
  // Textura do pelo
  ctx.fillStyle = '#2a1a0e';
  ctx.fillRect(sx - 3, sy - 43 + breathe,  2, 5);
  ctx.fillRect(sx + 1, sy - 43 + breathe,  2, 4);

  // Orelhas
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(sx - 13, sy - 38 + breathe, 5, 6);
  ctx.fillRect(sx +  8, sy - 38 + breathe, 5, 6);
  // Interior da orelha
  ctx.fillStyle = '#5a3428';
  ctx.fillRect(sx - 12, sy - 37 + breathe, 3, 4);
  ctx.fillRect(sx +  9, sy - 37 + breathe, 3, 4);

  // ── Chifres ───────────────────────────────────────────────────────
  // Chifre esquerdo (curva simulada em blocos)
  ctx.fillStyle = '#c8b880';
  ctx.fillRect(sx - 14, sy - 42 + breathe, 6, 4);
  ctx.fillRect(sx - 17, sy - 46 + breathe, 5, 4);
  ctx.fillRect(sx - 18, sy - 50 + breathe, 4, 4);
  ctx.fillRect(sx - 17, sy - 54 + breathe, 3, 4);
  // Ponta do chifre esq
  ctx.fillStyle = '#a09060';
  ctx.fillRect(sx - 16, sy - 57 + breathe, 2, 4);
  ctx.fillRect(sx - 15, sy - 59 + breathe, 1, 3);
  // Chifre direito (espelho com curva oposta)
  ctx.fillStyle = '#c8b880';
  ctx.fillRect(sx +  8, sy - 42 + breathe, 6, 4);
  ctx.fillRect(sx + 12, sy - 46 + breathe, 5, 4);
  ctx.fillRect(sx + 14, sy - 50 + breathe, 4, 4);
  ctx.fillRect(sx + 14, sy - 54 + breathe, 3, 4);
  ctx.fillStyle = '#a09060';
  ctx.fillRect(sx + 14, sy - 57 + breathe, 2, 4);
  ctx.fillRect(sx + 14, sy - 59 + breathe, 1, 3);

  // ── Olhos vermelhos ───────────────────────────────────────────────
  ctx.fillStyle = '#0e0808';
  ctx.fillRect(sx - 6, sy - 37 + breathe, 5, 4);
  ctx.fillRect(sx + 1, sy - 37 + breathe, 5, 4);
  ctx.fillStyle = `rgba(200, 30, 10, ${0.7 + 0.3 * pulse})`;
  ctx.fillRect(sx - 6, sy - 37 + breathe, 5, 2);
  ctx.fillRect(sx + 1, sy - 37 + breathe, 5, 2);
  ctx.fillStyle = `rgba(255, 80, 40, ${0.5 + 0.4 * pulse})`;
  ctx.fillRect(sx - 5, sy - 37 + breathe, 3, 2);
  ctx.fillRect(sx + 2, sy - 37 + breathe, 3, 2);
  // Reflexo
  ctx.fillStyle = 'rgba(255,180,160,0.6)';
  ctx.fillRect(sx - 5, sy - 37 + breathe, 1, 1);
  ctx.fillRect(sx + 2, sy - 37 + breathe, 1, 1);

  // Vapor das narinas (respiro)
  for (let i = 0; i < 2; i++) {
    const t     = (time * 1.2 + i * 0.5) % 1;
    const side  = i === 0 ? -3 : 3;
    const alpha = (1 - t) * 0.4 * nostril;
    ctx.fillStyle = `rgba(220, 220, 230, ${alpha})`;
    ctx.fillRect(sx + side + Math.sin(time * 3 + i) * 2, sy - 28 - t * 10 + breathe, 3, 3);
  }
}

// ── Acólito ───────────────────────────────────────────────────────────────
function drawNpcAcolyte(sx, sy, time) {
  const pulse     = Math.sin(time * 3.0) * 0.5 + 0.5;
  const flicker   = Math.sin(time * 8.5 + Math.cos(time * 5.3)) * 0.3 + 0.7;
  const cloakSway = Math.sin(time * 1.2) * 1;

  sy += 3;

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(sx - 7, sy + 14, 14, 4);

  // ── Manto longo (base) ────────────────────────────────────────────
  ctx.fillStyle = '#1a1228';
  ctx.fillRect(sx - 7 + cloakSway, sy + 2,  6, 12); // painel esq
  ctx.fillRect(sx + 1 - cloakSway, sy + 2,  6, 12); // painel dir
  // Dobras do manto
  ctx.fillStyle = '#120e1e';
  ctx.fillRect(sx - 7 + cloakSway, sy + 6,  2, 8);
  ctx.fillRect(sx + 5 - cloakSway, sy + 4,  2, 10);
  ctx.fillRect(sx - 1,             sy + 2,  2, 12);
  // Borda inferior do manto
  ctx.fillStyle = '#261840';
  ctx.fillRect(sx - 8 + cloakSway, sy + 12, 7, 2);
  ctx.fillRect(sx + 1 - cloakSway, sy + 12, 7, 2);

  // ── Corpo / hábito ────────────────────────────────────────────────
  ctx.fillStyle = '#1e1530';
  ctx.fillRect(sx - 6, sy - 8, 12, 12);
  // Faixa da ordem — bordado no peito
  ctx.fillStyle = '#3d1a5a';
  ctx.fillRect(sx - 1, sy - 6,  2, 10);
  ctx.fillRect(sx - 4, sy - 2,  8,  2);
  // Símbolo no centro (losango)
  ctx.fillStyle = `rgba(160, 80, 255, ${0.5 + 0.4 * pulse})`;
  ctx.fillRect(sx - 1, sy - 4,  2,  1);
  ctx.fillRect(sx - 2, sy - 3,  4,  1);
  ctx.fillRect(sx - 1, sy - 2,  2,  1);
  // Borda lateral do hábito
  ctx.fillStyle = '#2a1c40';
  ctx.fillRect(sx - 6, sy - 8,  2, 12);

  // ── Braço esquerdo — segura o tomo ────────────────────────────────
  ctx.fillStyle = '#1e1530';
  ctx.fillRect(sx - 10, sy - 6, 5, 8);
  // Tomo / livro sagrado
  ctx.fillStyle = '#2a0e0e';
  ctx.fillRect(sx - 14, sy - 7, 6, 9);
  // Capa do tomo
  ctx.fillStyle = '#3a1212';
  ctx.fillRect(sx - 13, sy - 7, 5, 9);
  // Lombada
  ctx.fillStyle = '#1a0808';
  ctx.fillRect(sx - 14, sy - 7, 2, 9);
  // Páginas
  ctx.fillStyle = '#d4c8a8';
  ctx.fillRect(sx - 12, sy - 6, 4, 7);
  // Linhas de texto
  ctx.fillStyle = '#a89870';
  ctx.fillRect(sx - 12, sy - 5, 4, 1);
  ctx.fillRect(sx - 12, sy - 3, 4, 1);
  ctx.fillRect(sx - 12, sy - 1, 3, 1);
  // Fecho do tomo
  ctx.fillStyle = '#8a6020';
  ctx.fillRect(sx - 8,  sy - 4, 1, 3);

  // ── Braço direito — segura a vela ─────────────────────────────────
  ctx.fillStyle = '#1e1530';
  ctx.fillRect(sx + 5, sy - 6, 5, 8);
  // Castiçal
  ctx.fillStyle = '#5a4820';
  ctx.fillRect(sx + 9, sy + 1, 3, 3);
  ctx.fillRect(sx + 10, sy - 1, 1, 3);
  // Vela
  ctx.fillStyle = '#e8e0c8';
  ctx.fillRect(sx + 9, sy - 7, 3, 9);
  // Pavio
  ctx.fillStyle = '#1a1010';
  ctx.fillRect(sx + 10, sy - 8, 1, 2);
  // Chama — oscila com flicker
  const flameH = Math.round(flicker * 3 + 2);
  ctx.fillStyle = `rgba(255, 180, 40, ${flicker})`;
  ctx.fillRect(sx + 9,  sy - 8 - flameH, 3, flameH + 1);
  ctx.fillStyle = `rgba(255, 240, 120, ${flicker * 0.9})`;
  ctx.fillRect(sx + 10, sy - 9 - flameH, 1, flameH);
  // Topo da vela (cera derretida)
  ctx.fillStyle = '#d0c8b0';
  ctx.fillRect(sx + 9,  sy - 7, 3, 2);
  ctx.fillStyle = '#b8b098';
  ctx.fillRect(sx + 8,  sy - 6, 1, 2);
  ctx.fillRect(sx + 12, sy - 6, 1, 2);

  // ── Capuz e cabeça ────────────────────────────────────────────────
  // Capuz (parte de trás, mais larga)
  ctx.fillStyle = '#120e1e';
  ctx.fillRect(sx - 7, sy - 20, 14, 14);
  // Capuz (frente)
  ctx.fillStyle = '#1a1228';
  ctx.fillRect(sx - 5, sy - 20, 10, 12);
  // Borda frontal do capuz — cria sombra no rosto
  ctx.fillStyle = '#0e0a18';
  ctx.fillRect(sx - 6, sy - 20, 2, 12);
  ctx.fillRect(sx + 4, sy - 20, 2, 12);
  ctx.fillRect(sx - 5, sy - 21, 10, 3);
  // Bordado do capuz
  ctx.fillStyle = '#3d1a5a';
  ctx.fillRect(sx - 5, sy - 21, 10, 1);

  // Rosto em sombra
  ctx.fillStyle = '#2a1e10';
  ctx.fillRect(sx - 3, sy - 18, 6, 8);
  // Olhos — brilham levemente com o reflexo da vela
  ctx.fillStyle = '#0a0610';
  ctx.fillRect(sx - 2, sy - 15, 2, 2);
  ctx.fillRect(sx + 1, sy - 15, 2, 2);
  ctx.fillStyle = `rgba(220, 140, 40, ${0.35 + 0.2 * flicker})`;
  ctx.fillRect(sx - 2, sy - 15, 2, 1);
  ctx.fillRect(sx + 1, sy - 15, 2, 1);
  // Boca em repouso
  ctx.fillStyle = '#1a100a';
  ctx.fillRect(sx - 1, sy - 11, 3, 1);
}

// ── Gárgula ───────────────────────────────────────────────────────────────
function drawNpcGargoyle(sx, sy, time) {
  const pulse  = Math.sin(time * 2.0) * 0.5 + 0.5;
  const blink  = Math.sin(time * 0.4) > 0.92; // pisca raramente

  sy += 3;

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(sx - 14, sy + 14, 28, 5);

  // ── Asas abertas (atrás do corpo) ─────────────────────────────────
  // Asa esquerda
  ctx.fillStyle = '#2a2535';
  ctx.fillRect(sx - 22, sy - 14, 10, 20);
  ctx.fillRect(sx - 18, sy - 18, 8,  6);
  ctx.fillRect(sx - 16, sy - 20, 5,  4);
  // Membranas da asa esq
  ctx.fillStyle = '#1e1a28';
  ctx.fillRect(sx - 20, sy - 10, 8, 14);
  ctx.fillRect(sx - 17, sy - 16, 5,  6);
  // Nervuras
  ctx.fillStyle = '#363048';
  ctx.fillRect(sx - 21, sy - 14, 1, 18);
  ctx.fillRect(sx - 17, sy - 18, 1, 16);
  ctx.fillRect(sx - 14, sy - 14, 1, 12);

  // Asa direita (espelho)
  ctx.fillStyle = '#2a2535';
  ctx.fillRect(sx + 12, sy - 14, 10, 20);
  ctx.fillRect(sx + 10, sy - 18, 8,  6);
  ctx.fillRect(sx + 11, sy - 20, 5,  4);
  ctx.fillStyle = '#1e1a28';
  ctx.fillRect(sx + 12, sy - 10, 8, 14);
  ctx.fillRect(sx + 12, sy - 16, 5,  6);
  ctx.fillStyle = '#363048';
  ctx.fillRect(sx + 20, sy - 14, 1, 18);
  ctx.fillRect(sx + 16, sy - 18, 1, 16);
  ctx.fillRect(sx + 13, sy - 14, 1, 12);

  // ── Pernas agachadas ──────────────────────────────────────────────
  ctx.fillStyle = '#3a3448';
  ctx.fillRect(sx - 8, sy + 4,  6, 8);
  ctx.fillRect(sx + 2, sy + 4,  6, 8);
  // Garras dos pés
  ctx.fillStyle = '#2a2535';
  ctx.fillRect(sx - 10, sy + 10, 4, 3);
  ctx.fillRect(sx - 12, sy + 11, 3, 2);
  ctx.fillRect(sx +  6, sy + 10, 4, 3);
  ctx.fillRect(sx +  9, sy + 11, 3, 2);
  // Joelhos proeminentes
  ctx.fillStyle = '#4a4460';
  ctx.fillRect(sx - 9, sy + 6, 4, 3);
  ctx.fillRect(sx + 5, sy + 6, 4, 3);

  // ── Corpo ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#3a3448';
  ctx.fillRect(sx - 8, sy - 10, 16, 16);
  // Placas pectorais
  ctx.fillStyle = '#4a4460';
  ctx.fillRect(sx - 7, sy - 9,  6, 7);
  ctx.fillRect(sx + 1, sy - 9,  6, 7);
  // Sulco central
  ctx.fillStyle = '#2a2535';
  ctx.fillRect(sx - 1, sy - 10, 2, 16);
  // Borda lateral
  ctx.fillStyle = '#504a68';
  ctx.fillRect(sx - 8, sy - 10, 2, 16);

  // Braços musculosos
  ctx.fillStyle = '#3a3448';
  ctx.fillRect(sx - 13, sy - 8, 6, 10);
  ctx.fillRect(sx +  7, sy - 8, 6, 10);
  // Cotovelo
  ctx.fillStyle = '#4a4460';
  ctx.fillRect(sx - 14, sy - 4, 4, 4);
  ctx.fillRect(sx + 10, sy - 4, 4, 4);
  // Garras das mãos apoiadas no chão
  ctx.fillStyle = '#2a2535';
  ctx.fillRect(sx - 14, sy + 2, 3, 3);
  ctx.fillRect(sx - 16, sy + 3, 3, 2);
  ctx.fillRect(sx - 12, sy + 4, 3, 2);
  ctx.fillRect(sx + 11, sy + 2, 3, 3);
  ctx.fillRect(sx + 13, sy + 3, 3, 2);
  ctx.fillRect(sx +  9, sy + 4, 3, 2);

  // ── Cabeça ────────────────────────────────────────────────────────
  ctx.fillStyle = '#3a3448';
  ctx.fillRect(sx - 7, sy - 22, 14, 14);
  // Maxilar inferior proeminente
  ctx.fillStyle = '#2e2840';
  ctx.fillRect(sx - 6, sy - 12, 12,  4);
  ctx.fillRect(sx - 5, sy -  9, 10,  2);
  // Dentes
  ctx.fillStyle = '#c8c0a8';
  ctx.fillRect(sx - 4, sy - 11, 2, 3);
  ctx.fillRect(sx - 1, sy - 11, 2, 2);
  ctx.fillRect(sx + 2, sy - 11, 2, 3);
  // Testa plana / crânio achatado
  ctx.fillStyle = '#4a4460';
  ctx.fillRect(sx - 7, sy - 22, 14, 4);
  ctx.fillStyle = '#504a68';
  ctx.fillRect(sx - 7, sy - 22, 2, 14);

  // Chifres
  ctx.fillStyle = '#2a2535';
  ctx.fillRect(sx - 6, sy - 26, 3, 6);
  ctx.fillRect(sx - 5, sy - 28, 2, 4);
  ctx.fillRect(sx + 3, sy - 26, 3, 6);
  ctx.fillRect(sx + 3, sy - 28, 2, 4);
  // Ponta dos chifres
  ctx.fillStyle = '#1a1525';
  ctx.fillRect(sx - 5, sy - 30, 1, 3);
  ctx.fillRect(sx + 4, sy - 30, 1, 3);

  // Nariz achatado
  ctx.fillStyle = '#2a2535';
  ctx.fillRect(sx - 2, sy - 16, 4, 3);
  ctx.fillRect(sx - 3, sy - 15, 2, 2);
  ctx.fillRect(sx + 1, sy - 15, 2, 2);

  // ── Olhos brilhantes ──────────────────────────────────────────────
  if (!blink) {
    // Cavidade escura
    ctx.fillStyle = '#0e0a18';
    ctx.fillRect(sx - 5, sy - 20, 4, 4);
    ctx.fillRect(sx + 1, sy - 20, 4, 4);
    // Brilho âmbar / laranja
    ctx.fillStyle = `rgba(220, 140, 20, ${0.7 + 0.3 * pulse})`;
    ctx.fillRect(sx - 5, sy - 20, 4, 2);
    ctx.fillRect(sx + 1, sy - 20, 4, 2);
    // Núcleo
    ctx.fillStyle = `rgba(255, 200, 60, ${0.6 + 0.4 * pulse})`;
    ctx.fillRect(sx - 4, sy - 20, 2, 2);
    ctx.fillRect(sx + 2, sy - 20, 2, 2);
  } else {
    // Olho fechado — linha fina
    ctx.fillStyle = '#2a2535';
    ctx.fillRect(sx - 5, sy - 19, 4, 1);
    ctx.fillRect(sx + 1, sy - 19, 4, 1);
  }

  // Halo de pedra — partículas de rocha soltando
  for (let i = 0; i < 3; i++) {
    const t     = (time * 0.5 + i * 0.33) % 1;
    const ox    = (i - 1) * 8 + Math.sin(time + i) * 3;
    const alpha = (1 - t) * 0.35;
    ctx.fillStyle = `rgba(180, 170, 200, ${alpha})`;
    ctx.fillRect(sx + ox, sy - 22 - t * 10, 2, 2);
  }
}

// ── Cogumelo Mágico ───────────────────────────────────────────────────────
function drawNpcMushroom(sx, sy, time) {
  const bob   = Math.sin(time * 1.4) * 1.5;
  const pulse = Math.sin(time * 3.0) * 0.5 + 0.5;
  const sy2   = sy + bob;

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(sx - 8, sy + 14, 16, 4);

  // ── Pezinhos ──────────────────────────────────────────────────────
  ctx.fillStyle = '#c8b89a';
  ctx.fillRect(sx - 6, sy2 + 8,  4, 6);
  ctx.fillRect(sx + 2, sy2 + 8,  4, 6);
  // Sapatinhos
  ctx.fillStyle = '#8a7060';
  ctx.fillRect(sx - 7, sy2 + 12, 5, 3);
  ctx.fillRect(sx + 2, sy2 + 12, 5, 3);

  // ── Caule / corpo ─────────────────────────────────────────────────
  ctx.fillStyle = '#e8dcc8';
  ctx.fillRect(sx - 6, sy2 - 4, 12, 14);
  // Textura do caule
  ctx.fillStyle = '#d0c4b0';
  ctx.fillRect(sx - 6, sy2 - 1, 12, 2);
  ctx.fillRect(sx - 6, sy2 + 4, 12, 2);
  // Borda lateral
  ctx.fillStyle = '#f0e8d8';
  ctx.fillRect(sx - 6, sy2 - 4,  2, 14);

  // Bracinhos
  ctx.fillStyle = '#e8dcc8';
  ctx.fillRect(sx - 10, sy2 + 1, 5, 4);
  ctx.fillRect(sx +  5, sy2 + 1, 5, 4);
  // Mãozinhas arredondadas
  ctx.fillStyle = '#d0c4b0';
  ctx.fillRect(sx - 11, sy2 + 1, 3, 3);
  ctx.fillRect(sx +  8, sy2 + 1, 3, 3);

  // Olhinhos
  ctx.fillStyle = '#1a0e00';
  ctx.fillRect(sx - 3, sy2 + 1, 2, 3);
  ctx.fillRect(sx + 1, sy2 + 1, 2, 3);
  // Reflexo dos olhos
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx - 3, sy2 + 1, 1, 1);
  ctx.fillRect(sx + 1, sy2 + 1, 1, 1);
  // Bochecha corada
  ctx.fillStyle = 'rgba(255, 120, 120, 0.35)';
  ctx.fillRect(sx - 5, sy2 + 3, 3, 2);
  ctx.fillRect(sx + 2, sy2 + 3, 3, 2);
  // Sorriso
  ctx.fillStyle = '#1a0e00';
  ctx.fillRect(sx - 2, sy2 + 5, 4, 1);
  ctx.fillRect(sx - 3, sy2 + 4, 1, 1);
  ctx.fillRect(sx + 2, sy2 + 4, 1, 1);

  // ── Chapéu (píleo) ────────────────────────────────────────────────
  // Aba do chapéu
  ctx.fillStyle = '#cc2200';
  ctx.fillRect(sx - 12, sy2 - 8,  24, 5);
  ctx.fillStyle = '#aa1a00';
  ctx.fillRect(sx - 12, sy2 - 8,   2, 5);
  ctx.fillRect(sx + 10, sy2 - 8,   2, 5);
  ctx.fillRect(sx - 12, sy2 - 4,  24, 1);

  // Corpo do chapéu
  ctx.fillStyle = '#dd2800';
  ctx.fillRect(sx - 10, sy2 - 18, 20, 12);
  ctx.fillRect(sx -  8, sy2 - 22, 16,  6);
  ctx.fillRect(sx -  5, sy2 - 25, 10,  5);
  // Cume
  ctx.fillStyle = '#ee3300';
  ctx.fillRect(sx -  3, sy2 - 27,  6,  4);
  // Borda lateral do chapéu
  ctx.fillStyle = '#bb2000';
  ctx.fillRect(sx - 10, sy2 - 18,  2, 12);
  ctx.fillRect(sx -  8, sy2 - 22,  2,  6);

  // Pintas do chapéu (pulsam levemente)
  const spotAlpha = 0.85 + 0.15 * pulse;
  ctx.fillStyle = `rgba(255, 245, 230, ${spotAlpha})`;
  ctx.fillRect(sx - 6, sy2 - 20, 5, 4); // pinta grande esq
  ctx.fillRect(sx + 2, sy2 - 16, 4, 4); // pinta grande dir
  ctx.fillRect(sx - 2, sy2 - 26, 3, 3); // pinta topo
  ctx.fillRect(sx + 4, sy2 - 23, 2, 2); // pinta pequena
  ctx.fillRect(sx - 7, sy2 - 13, 2, 2); // pinta pequena aba
  // Brilho das pintas
  ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * pulse})`;
  ctx.fillRect(sx - 6, sy2 - 20, 1, 1);
  ctx.fillRect(sx + 2, sy2 - 16, 1, 1);

  // ── Esporinhos de magia saindo do chapéu ──────────────────────────
  for (let i = 0; i < 4; i++) {
    const t  = (time * 0.8 + i * 0.25) % 1;
    const ox = (i - 1.5) * 6 + Math.sin(time * 2 + i) * 2;
    const alpha = (1 - t) * 0.6;
    ctx.fillStyle = `rgba(255, 180, 80, ${alpha})`;
    ctx.fillRect(sx + ox - 1, sy2 - 28 - t * 14, 2, 2);
  }
}

// ── Oráculo — figura etérea flutuante ─────────────────────────────────────
function drawNpcOracle(sx, sy, time) {
  const bob = Math.sin(time * 2.5) * 3;
  const sy2 = sy + bob;

  // Sombra no chão (esmaece conforme flutua)
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(sx - 7, sy + 8, 14, 4);

  // Manto esvoaçante (base larga)
  ctx.fillStyle = '#1a0a2e';
  ctx.fillRect(sx - 9, sy2 + 2,  18, 8);
  ctx.fillRect(sx - 7, sy2 - 4,  14, 8);
  // Borda do manto em lilás
  ctx.fillStyle = '#3a1a5a';
  ctx.fillRect(sx - 9, sy2 + 2,  2, 8);
  ctx.fillRect(sx + 7, sy2 + 2,  2, 8);
  ctx.fillRect(sx - 7, sy2 - 4,  2, 8);

  // Corpo / tronco
  ctx.fillStyle = '#120820';
  ctx.fillRect(sx - 5, sy2 - 10, 10, 8);

  // Cabeça encapuzada
  ctx.fillStyle = '#1a0a2e';
  ctx.fillRect(sx - 6, sy2 - 20, 12, 12);
  ctx.fillRect(sx - 5, sy2 - 22, 10, 4);

  // Olhos brilhantes
  const glow = Math.sin(time * 3) * 0.2 + 0.8;
  ctx.fillStyle = `rgba(180, 100, 255, ${glow})`;
  ctx.fillRect(sx - 3, sy2 - 15, 2, 2);
  ctx.fillRect(sx + 1, sy2 - 15, 2, 2);

  // Orbe nas mãos
  ctx.fillStyle = '#2a0a3e';
  ctx.fillRect(sx - 3, sy2 - 2, 6, 6);
  ctx.fillStyle = `rgba(160, 80, 255, ${glow})`;
  ctx.fillRect(sx - 1, sy2,     2, 2);
}

// ── Monge em Oração ───────────────────────────────────────────────────────
function drawNpcMonk(sx, sy, time) {
  // Respiração lenta durante a oração
  const breathe = Math.sin(time * 1.2) * 1;

  sy += 4;

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(sx - 8, sy + 12, 16, 4);

  // Pernas dobradas (sentado em seiza)
  ctx.fillStyle = '#8b6914';
  ctx.fillRect(sx - 10, sy + 4,  20, 8);
  // Dobra do tecido nas pernas
  ctx.fillStyle = '#6b4f10';
  ctx.fillRect(sx - 10, sy + 4,   2, 8);
  ctx.fillRect(sx +  8, sy + 4,   2, 8);
  ctx.fillRect(sx -  2, sy + 6,   4, 2);

  // Corpo / hábito
  ctx.fillStyle = '#a07820';
  ctx.fillRect(sx - 6, sy - 8 + breathe, 12, 14);
  // Faixa central do hábito
  ctx.fillStyle = '#6b4f10';
  ctx.fillRect(sx - 1, sy - 6 + breathe,  2, 12);
  // Borda lateral
  ctx.fillStyle = '#c09030';
  ctx.fillRect(sx - 6, sy - 8 + breathe,  2, 14);

  // Braços juntos à frente (mãos em oração)
  ctx.fillStyle = '#8b6914';
  ctx.fillRect(sx - 5, sy - 4 + breathe,  4, 8); // braço esq
  ctx.fillRect(sx + 1, sy - 4 + breathe,  4, 8); // braço dir

  // Mãos unidas
  ctx.fillStyle = '#c8956a';
  ctx.fillRect(sx - 3, sy + 2 + breathe,  6, 5);
  // Dedos indicados para cima
  ctx.fillRect(sx - 2, sy - 2 + breathe,  4, 5);

  // Cabeça inclinada para baixo (em reverência)
  ctx.fillStyle = '#c8956a';
  ctx.fillRect(sx - 5, sy - 18 + breathe, 10, 10);
  // Inclinação — escurece a parte de baixo da cabeça
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(sx - 5, sy - 11 + breathe, 10, 3);

  // Cabeça raspada (brilho sutil no topo)
  ctx.fillStyle = '#d4a070';
  ctx.fillRect(sx - 4, sy - 18 + breathe, 8, 4);
  ctx.fillStyle = 'rgba(255,220,160,0.3)';
  ctx.fillRect(sx - 2, sy - 18 + breathe, 4, 2);

  // Olhos fechados (em meditação)
  ctx.fillStyle = '#5a3010';
  ctx.fillRect(sx - 3, sy - 12 + breathe, 2, 1);
  ctx.fillRect(sx + 1, sy - 12 + breathe, 2, 1);

  // Partículas de incenso / energia espiritual
  const t1 = (time * 0.7) % 1;
  const t2 = (time * 0.7 + 0.5) % 1;
  ctx.fillStyle = `rgba(200, 170, 80, ${(1 - t1) * 0.5})`;
  ctx.fillRect(sx - 1 + Math.sin(time * 2) * 2, sy - 20 - t1 * 18, 2, 2);
  ctx.fillStyle = `rgba(200, 170, 80, ${(1 - t2) * 0.5})`;
  ctx.fillRect(sx + 1 + Math.sin(time * 2 + 1) * 2, sy - 20 - t2 * 18, 2, 2);
}

// ── Mago do Olho ─────────────────────────────────────────────────────────
function drawNpcEyeMage(sx, sy, time) {
  const bob   = Math.sin(time * 1.6) * 2;
  const pulse = Math.sin(time * 4.0) * 0.5 + 0.5;
  const sy2   = sy + bob;

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(sx - 7, sy + 14, 14, 4);

  // Pernas / base do manto
  ctx.fillStyle = '#1c0a30';
  ctx.fillRect(sx - 5, sy2 + 6,  4, 8);
  ctx.fillRect(sx + 1, sy2 + 6,  4, 8);
  ctx.fillStyle = '#120620';
  ctx.fillRect(sx - 5, sy2 + 12, 4, 2);
  ctx.fillRect(sx + 1, sy2 + 12, 4, 2);

  // Manto principal
  ctx.fillStyle = '#1c0a30';
  ctx.fillRect(sx - 7, sy2 - 4, 14, 12);
  // Borda do manto
  ctx.fillStyle = '#2e1248';
  ctx.fillRect(sx - 7, sy2 - 4,  2, 12);
  ctx.fillRect(sx + 5, sy2 - 4,  2, 12);
  // Detalhe central — runa bordada
  ctx.fillStyle = '#6a20a0';
  ctx.fillRect(sx - 1, sy2 - 2,  2, 8);
  ctx.fillRect(sx - 3, sy2 + 1,  6, 2);

  // Braços
  ctx.fillStyle = '#1c0a30';
  ctx.fillRect(sx - 11, sy2 - 2, 5, 4);
  ctx.fillRect(sx +  6, sy2 - 2, 5, 4);
  // Mãos — dedos finos
  ctx.fillStyle = '#c8a060';
  ctx.fillRect(sx - 13, sy2 - 1, 3, 3);
  ctx.fillRect(sx +  10, sy2 - 1, 3, 3);
  // Detalhes dos dedos
  ctx.fillStyle = '#a07840';
  ctx.fillRect(sx - 13, sy2 + 1, 1, 1);
  ctx.fillRect(sx - 11, sy2 + 1, 1, 1);
  ctx.fillRect(sx +  10, sy2 + 1, 1, 1);
  ctx.fillRect(sx +  12, sy2 + 1, 1, 1);

  // Cajado na mão direita
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(sx + 13, sy2 - 20, 2, 24);
  // Cristal no topo do cajado
  ctx.fillStyle = '#8820c0';
  ctx.fillRect(sx + 12, sy2 - 26, 4, 7);
  ctx.fillStyle = `rgba(180, 60, 255, ${0.5 + 0.5 * pulse})`;
  ctx.fillRect(sx + 13, sy2 - 25, 2, 5);
  ctx.fillStyle = 'rgba(220,160,255,0.9)';
  ctx.fillRect(sx + 13, sy2 - 25, 1, 2);

  // Pescoço
  ctx.fillStyle = '#c8a060';
  ctx.fillRect(sx - 2, sy2 - 8, 4, 5);

  // ── Cabeça — o grande olho ────────────────────────────────────────

  // Pálpebra superior (capuz / sobrancelha)
  ctx.fillStyle = '#1c0a30';
  ctx.fillRect(sx - 10, sy2 - 22, 20, 8);
  ctx.fillRect(sx -  8, sy2 - 24, 16, 4);
  // Borda inferior da pálpebra
  ctx.fillStyle = '#2e1248';
  ctx.fillRect(sx - 10, sy2 - 15, 20, 2);

  // Esclera (branco do olho)
  ctx.fillStyle = '#ddeedd';
  ctx.fillRect(sx - 9, sy2 - 22, 18, 14);

  // Íris
  ctx.fillStyle = '#7a20c0';
  ctx.fillRect(sx - 5, sy2 - 20, 10, 10);

  // Pupila — segue levemente o tempo (olha para os lados)
  const pupilX = Math.round(Math.sin(time * 0.8) * 2);
  const pupilY = Math.round(Math.sin(time * 0.5) * 1);
  ctx.fillStyle = '#0a0010';
  ctx.fillRect(sx - 3 + pupilX, sy2 - 17 + pupilY, 6, 6);

  // Brilho da íris pulsante
  ctx.fillStyle = `rgba(180, 80, 255, ${0.4 + 0.4 * pulse})`;
  ctx.fillRect(sx - 5, sy2 - 20, 10, 2);
  ctx.fillRect(sx - 5, sy2 - 20, 2, 10);

  // Reflexo no olho
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(sx - 2 + pupilX, sy2 - 16 + pupilY, 2, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(sx + 1 + pupilX, sy2 - 14 + pupilY, 1, 1);

  // Pálpebra inferior
  ctx.fillStyle = '#1c0a30';
  ctx.fillRect(sx - 9, sy2 - 9, 18, 4);

  // Cílios superiores
  ctx.fillStyle = '#0a0418';
  ctx.fillRect(sx - 8, sy2 - 23, 2, 3);
  ctx.fillRect(sx - 3, sy2 - 25, 2, 4);
  ctx.fillRect(sx + 2, sy2 - 25, 2, 4);
  ctx.fillRect(sx + 6, sy2 - 23, 2, 3);

  // Energia mágica irradiando do olho
  for (let i = 0; i < 4; i++) {
    const angle = time * 1.2 + i * (Math.PI / 2);
    const r     = 14 + Math.sin(time * 3 + i) * 2;
    const ox    = Math.cos(angle) * r;
    const oy    = Math.sin(angle) * r * 0.6;
    const alpha = 0.2 + 0.2 * Math.sin(time * 4 + i);
    ctx.fillStyle = `rgba(160, 60, 255, ${alpha})`;
    ctx.fillRect(sx + ox - 1, sy2 - 15 + oy - 1, 2, 2);
  }
}

// ── Espectro Mágico ───────────────────────────────────────────────────────
function drawNpcSpecter(sx, sy, time) {
  const bob   = Math.sin(time * 2.0) * 4;
  const pulse = Math.sin(time * 3.5) * 0.5 + 0.5;
  const sy2   = sy + bob;

  // Sombra esmaecida no chão (some conforme flutua)
  ctx.fillStyle = 'rgba(0, 200, 180, 0.08)';
  ctx.fillRect(sx - 8, sy + 10, 16, 5);

  // Cauda etérea (base do espectro — irregular)
  ctx.fillStyle = 'rgba(0, 180, 160, 0.25)';
  ctx.fillRect(sx - 7, sy2 + 6,  4, 6);
  ctx.fillRect(sx - 3, sy2 + 8,  4, 8);
  ctx.fillRect(sx + 1, sy2 + 5,  3, 7);
  ctx.fillRect(sx + 4, sy2 + 7,  3, 5);

  // Manto principal do corpo
  ctx.fillStyle = '#0a2e2a';
  ctx.fillRect(sx - 8, sy2 - 2, 16, 14);

  // Camada interna mais clara (translucidez simulada)
  ctx.fillStyle = '#0e3d38';
  ctx.fillRect(sx - 6, sy2,     12, 10);

  // Brilho interno pulsante
  ctx.fillStyle = `rgba(0, 220, 200, ${0.12 + 0.1 * pulse})`;
  ctx.fillRect(sx - 4, sy2 + 2,  8, 6);

  // Braços flutuando levemente
  const armWave = Math.sin(time * 1.8) * 2;
  ctx.fillStyle = '#0a2e2a';
  ctx.fillRect(sx - 13, sy2 + armWave,      6, 4); // braço esq
  ctx.fillRect(sx +  7, sy2 - armWave,      6, 4); // braço dir
  // Mãos (névoa)
  ctx.fillStyle = 'rgba(0, 180, 160, 0.5)';
  ctx.fillRect(sx - 15, sy2 + armWave,      4, 4);
  ctx.fillRect(sx +  11, sy2 - armWave,     4, 4);

  // Cabeça
  ctx.fillStyle = '#0c3530';
  ctx.fillRect(sx - 6, sy2 - 14, 12, 14);

  // Véu / capuz
  ctx.fillStyle = '#071e1c';
  ctx.fillRect(sx - 7, sy2 - 16,  14, 6);
  ctx.fillRect(sx - 6, sy2 - 18,  12, 4);
  ctx.fillStyle = '#0e3d38';
  ctx.fillRect(sx - 7, sy2 - 16,   2, 6);

  // Olhos — fendas vazias brilhantes
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 4, sy2 - 10,  3, 4);
  ctx.fillRect(sx + 1, sy2 - 10,  3, 4);
  // Brilho dos olhos pulsante
  ctx.fillStyle = `rgba(0, 255, 220, ${0.7 + 0.3 * pulse})`;
  ctx.fillRect(sx - 4, sy2 - 10,  3, 2);
  ctx.fillRect(sx + 1, sy2 - 10,  3, 2);

  // Partículas de energia mágica ao redor
  for (let i = 0; i < 3; i++) {
    const angle  = time * 1.5 + i * (Math.PI * 2 / 3);
    const radius = 12 + Math.sin(time * 2 + i) * 3;
    const ox = Math.cos(angle) * radius;
    const oy = Math.sin(angle) * radius * 0.5; // achatado — orbita elíptica
    const alpha = 0.4 + 0.3 * Math.sin(time * 3 + i * 2);
    ctx.fillStyle = `rgba(0, 220, 200, ${alpha})`;
    ctx.fillRect(sx + ox - 1, sy2 - 4 + oy - 1, 3, 3);
  }

  // Névoa saindo do topo
  const t1 = (time * 0.6) % 1;
  const t2 = (time * 0.6 + 0.4) % 1;
  const t3 = (time * 0.6 + 0.7) % 1;
  ctx.fillStyle = `rgba(0, 200, 180, ${(1 - t1) * 0.3})`;
  ctx.fillRect(sx - 1 + Math.sin(time * 1.5)     * 3, sy2 - 18 - t1 * 16, 3, 3);
  ctx.fillStyle = `rgba(0, 200, 180, ${(1 - t2) * 0.3})`;
  ctx.fillRect(sx + 2 + Math.sin(time * 1.5 + 1) * 3, sy2 - 18 - t2 * 16, 2, 2);
  ctx.fillStyle = `rgba(0, 200, 180, ${(1 - t3) * 0.3})`;
  ctx.fillRect(sx - 3 + Math.sin(time * 1.5 + 2) * 3, sy2 - 18 - t3 * 16, 2, 2);
}

// ─── MAIN LOOP ─────────────────────────────────────────────────────────────
let lastTime = 0;

const _vignetteGrad = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.8);
_vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
_vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.7)');

let _spdHud       = document.getElementById('speed-hud');
let _spdFill      = document.getElementById('speed-fill');
let _spdLabel     = document.getElementById('speed-label');
let _shieldHud    = document.getElementById('shield-hud');
let _shieldFill   = document.getElementById('shield-fill');
let _shieldLabel  = document.getElementById('shield-label');
let _healHud      = document.getElementById('heal-hud');
let _healFill     = document.getElementById('heal-fill');
let _healLabel    = document.getElementById('heal-label');
let _hudArcane      = document.getElementById('arcane-hud');
let _hudArcaneFill  = document.getElementById('arcane-fill');
let _hudArcaneLabel = document.getElementById('arcane-label');
let _hudFamiliar      = document.getElementById('familiar-hud');
let _hudFamiliarFill  = document.getElementById('familiar-fill');
let _hudFamiliarLabel = document.getElementById('familiar-label');
let _hudDash      = document.getElementById('dash-hud');
let _hudDashFill  = document.getElementById('dash-fill');
let _hudDashLabel = document.getElementById('dash-label');

function gameLoop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  time    += dt;

  if (!gameRunning) {
    if (gamePhase === 'start')   drawStartScreen(mouseX, mouseY);
    if (gamePhase === 'dead')    drawDeathScreen(mouseX, mouseY);
    if (gamePhase === 'victory') drawVictoryScreen(mouseX, mouseY);
    if (grimoireOpen) drawGrimoire();
    requestAnimationFrame(gameLoop);
    return;
  }

  // ── Update ──────────────────────────────────────────────────────
  const map = ALL_MAPS[currentMapId];

  // Pausa o jogo enquanto o grimório está aberto
  if (grimoireOpen) {
    const _dm = ALL_MAPS[currentMapId];
    drawBackground(cam, time);
    drawMap(_dm, cam);
    drawFadeOverlay();
    drawGrimoire();
    requestAnimationFrame(gameLoop);
    return;
  }

  updatePlayer(player, dt, map, enemies);
  updateCrumbleTiles(dt, map, player);
  updateArrowTraps(dt, map, player);
  updateRetractableSpikes(dt, player);
  updateMineTraps(dt, player);
  updateNpcs(player);
  updateArcaneStorm(dt, player, map, enemies);
  updateFamiliar(dt, player, enemies);

  // Player projectiles vs enemies
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (p.owner !== 'player') continue;
    for (const e of enemies) {
      if (e.dead) continue;
      // GHOST só recebe dano quando materializado
      if (e.type === 'GHOST' && e.ghostState !== 'material') continue;
      if (e.type === 'REVENANT' && (e.rvState === 'dead_temp' || e.rvState === 'rising')) continue;
      // SUMMONER com escudo bloqueia o projétil
      if (e.type === 'SUMMONER' && e.shielded) {
        if (rectsOverlap({ x: p.x - p.w/2, y: p.y - p.h/2, w: p.w, h: p.h },
                         { x: e.x, y: e.y, w: e.w, h: e.h })) {
          spawnParticles(e.x + e.w/2, e.y + e.h/2, '#cc00ff', 6, 3);
          p.life = 0;
          break;
        }
        continue;
      }
      // MIMIC em modo baú — projétil o revela mas não causa dano
      if (e.type === 'MIMIC' && e.mimicState === 'chest') {
        if (rectsOverlap({ x: p.x - p.w/2, y: p.y - p.h/2, w: p.w, h: p.h },
                         { x: e.x, y: e.y, w: e.w, h: e.h })) {
          e.mimicState  = 'reveal';
          e.revealTimer = 0.4;
          spawnParticles(e.x + e.w/2, e.y, '#c8860a', 14, 4);
          p.life = 0;
          break;
        }
        continue;
      }
      // Hit normal
      if (rectsOverlap({ x: p.x - p.w/2, y: p.y - p.h/2, w: p.w, h: p.h },
                       { x: e.x, y: e.y, w: e.w, h: e.h })) {
        e.hp -= p.dmg;
        e.hitFlash = 0.15;
        spawnParticles(e.x + e.w/2, e.y + e.h/2, '#2980b9', 8, 3);
        if (e.hp <= 0) killEnemy(e, player);
        p.life = 0;
        break;
      }
    }
  }

  // Enemies: update + contact damage + separação física
  for (const e of enemies) {
    if (e.dead) continue;
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    ENEMY_DEFS[e.type].update(e, dt, map, player);

    const pRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    const eRect = { x: e.x,      y: e.y,      w: e.w,      h: e.h };

    if (rectsOverlap(pRect, eRect)) {
      // Dano de contato
      if (e.type === 'GHOST' && e.ghostState !== 'material') continue;
      if (e.type === 'MIMIC' && e.mimicState === 'chest') continue;
      if (e.type === 'REVENANT' && (e.rvState === 'dead_temp' || e.rvState === 'rising')) continue;
      if (player.invincible <= 0) damagePlayer(player, e.dmg);
    }
  }

  if (!gameLoop._purgeClock) gameLoop._purgeClock = 0;
  gameLoop._purgeClock += dt;
  if (gameLoop._purgeClock >= 5) {
    gameLoop._purgeClock = 0;
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].dead) enemies.splice(i, 1);
    }
  }

  // Enemy projectiles vs player
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (p.owner !== 'enemy') continue;
    if (rectsOverlap({ x: p.x - p.w/2, y: p.y - p.h/2, w: p.w, h: p.h },
                     { x: player.x, y: player.y, w: player.w, h: player.h })) {
      damagePlayer(player, p.dmg);
      p.life = 0;
    }
  }

  updateProjectiles(dt, map);
  updateParticles(dt);

  // Coleta de estrela
  checkStarCollection(player, map);
  checkPotionCollection(player, map);
  checkManaPotionCollection(player, map);
  checkOrbCollection(player, map);
  checkSpeedBoostCollection(player, map);
  checkDoubleJumpCollection(player, map);

  // Câmera: lerp normal (sem slide)
  updateCamera(cam, player, map);

  // Fade e cooldown de transição
  updateFade(dt);
  if (transitionCooldown > 0) transitionCooldown -= dt;

  if (transitionCooldown <= 0 && fadeState === 'idle') {
    const tr = checkMapTransition(player, currentMapId, ALL_MAPS);
    if (tr) {
      const { nextId, entryEdge, playerTileY, playerTileX, playerOffsetY, playerOffsetX } = tr;
      const playerTile   = playerTileY   ?? playerTileX;
      const playerOffset = playerOffsetY ?? playerOffsetX;
      loadMap(nextId, entryEdge, playerTile, playerOffset);
    }
  }

  // ── Draw ────────────────────────────────────────────────────────
  const drawMap_ = ALL_MAPS[currentMapId];

  drawBackground(cam, time);
  drawMap(drawMap_, cam);
  drawCandles(drawMap_, cam, time);
  drawTorches(drawMap_, cam, time);
  drawChandeliers(drawMap_, cam, time);
  drawMushrooms(drawMap_, cam, time);
  drawStaticDecorations(drawMap_, cam);
  drawStar(drawMap_, cam, time);
  drawPotion(drawMap_, cam, time);
  drawManaPotion(drawMap_, cam, time);
  drawDoubleJumpItem(drawMap_, cam, time);
  drawOrb(drawMap_, cam, time);
  drawSpeedBoost(drawMap_, cam, time);
  drawArrowTraps(drawMap_, cam, time);
  drawRetractableSpikes(cam);
  drawMineTraps(cam, time);
  drawVoidRifts(cam, time);
  drawParticles(cam);
  drawProjectiles(cam);
  drawNpcs(cam, time);
  drawNpcDialogue();
  drawDashTrail(cam, time);

  for (let _ei = 0; _ei < enemies.length; _ei++) {
    const e = enemies[_ei];
    if (e.dead) continue;
    drawEnemy(e, cam, time);
  }

  drawPlayer(player, cam, time);
  drawArcaneStorm(cam);
  drawFamiliar(cam, time);

  // ── Trail elétrico quando boost ativo ──────────────────────────────────
  if (player.speedBoostTimer > 0 && (Math.abs(player.vx) > 0.5)) {
    if (Math.random() < 0.55) {
      const tx2 = player.x + player.w / 2 - player.vx * 0.5;
      const ty2 = player.y + player.h * (0.3 + Math.random() * 0.5);
      spawnParticles(tx2, ty2, Math.random() < 0.5 ? '#fffb00' : '#ffcc00', 1, 1.5);
    }
  }

  // Vignette
  ctx.fillStyle = _vignetteGrad;
  ctx.fillRect(0, 0, W, H);

  // Fade de transição (overlay preto por cima de tudo)
  drawFadeOverlay();

  // Atualiza HUD antes do death check para que a barra zere antes de mudar de fase
  updateHUD(player);
  drawMinimap(ALL_MAPS, currentMapId, player);

  // ── HUD do speed boost ─────────────────────────────────────────────────
  if (player.speedBoostTimer > 0) {
    _spdHud.style.display = 'block';
    const pct = (player.speedBoostTimer / player.speedBoostMax) * 100;
    _spdFill.style.width = pct + '%';
    // Pisca nos últimos 2s
    const flash = player.speedBoostTimer < 2 && Math.floor(time * 6) % 2 === 0;
    _spdLabel.style.opacity = flash ? '0.3' : '1';
  } else {
    _spdHud.style.display = 'none';
  }

  // ── HUD do escudo ──────────────────────────────────────────────────────
  if (player.shieldActive) {
    _shieldHud.style.display = 'block';
    _shieldFill.style.width  = (player.shieldHp / SHIELD_MAX_HP * 100) + '%';
    if (_shieldLabel.textContent !== 'ESCUDO') {
      _shieldFill.style.background = 'linear-gradient(90deg,#00aaff,#00eeff)';
      _shieldLabel.textContent = 'ESCUDO';
      _shieldLabel.style.color = '#00ccff';
    }
    _shieldLabel.style.opacity = '1';
  } else if (player.shieldCooldown > 0) {
    _shieldHud.style.display = 'block';
    const cdPct = (1 - player.shieldCooldown / SHIELD_COOLDOWN) * 100;
    _shieldFill.style.width  = cdPct + '%';
    if (_shieldLabel.textContent !== 'RECARGA') {
      _shieldFill.style.background = 'linear-gradient(90deg,#003344,#005566)';
      _shieldLabel.textContent = `RECARGA ${Math.ceil(player.shieldCooldown)}`;
      _shieldLabel.style.color = '#336677';
    }
    const cdFlash = Math.floor(time * 4) % 2 === 0;
    _shieldLabel.style.opacity = cdFlash ? '0.5' : '1';
  } else {
    _shieldHud.style.display = 'none';
  }

  if (player.healCooldown > 0) {
      _healHud.style.display     = 'block';
      const cdPct                = (1 - player.healCooldown / HEAL_COOLDOWN) * 100;
      _healFill.style.width      = cdPct + '%';
      _healFill.style.background = 'linear-gradient(90deg,#003322,#005544)';
      _healLabel.textContent     = `RECARGA  ${Math.ceil(player.healCooldown)}s`;
      _healLabel.style.color     = '#336655';
      const cdFlash              = Math.floor(time * 4) % 2 === 0;
      _healLabel.style.opacity   = cdFlash ? '0.5' : '1';
  } else {
      _healHud.style.display = 'none';
  }

  if (arcaneStorm.active) {
    _hudArcane.style.display      = '';
    _hudArcaneLabel.textContent   = 'TEMPESTADE';
    _hudArcaneLabel.style.color   = '#cc44ff';
    _hudArcaneFill.style.width    = (arcaneStorm.timer / ARCANE_STORM_DURATION * 100) + '%';
    _hudArcaneFill.style.background = 'linear-gradient(90deg,#6600cc,#cc44ff)';
  } else if (arcaneStorm.cooldown > 0) {
    _hudArcane.style.display      = '';
    _hudArcaneLabel.textContent   = `RECARGA ${Math.ceil(arcaneStorm.cooldown)}s`;
    _hudArcaneLabel.style.color   = '#6622aa';
    _hudArcaneFill.style.width    = ((1 - arcaneStorm.cooldown / ARCANE_STORM_COOLDOWN) * 100) + '%';
    _hudArcaneFill.style.background = 'linear-gradient(90deg,#2a0a44,#6622aa)';
  } else {
    _hudArcane.style.display = 'none';
  }

  if (familiar.active) {
    _hudFamiliar.style.display    = '';
    _hudFamiliarLabel.textContent = 'FAMILIAR';
    _hudFamiliarLabel.style.color = '#88ccff';
    _hudFamiliarFill.style.width  = (familiar.timer / FAMILIAR_DURATION * 100) + '%';
    _hudFamiliarFill.style.background = 'linear-gradient(90deg,#2255aa,#88ccff)';
  } else if (familiar.cooldown > 0) {
    _hudFamiliar.style.display    = '';
    _hudFamiliarLabel.textContent = `FAMILIAR ${Math.ceil(familiar.cooldown)}s`;
    _hudFamiliarLabel.style.color = '#336699';
    _hudFamiliarFill.style.width  = ((1 - familiar.cooldown / FAMILIAR_COOLDOWN) * 100) + '%';
    _hudFamiliarFill.style.background = 'linear-gradient(90deg,#112244,#336699)';
  } else {
    _hudFamiliar.style.display = 'none';
  }

  if (player.dashTimer > 0) {
    _hudDash.style.display   = '';
    _hudDashLabel.textContent = 'DASH';
    _hudDashLabel.style.color = '#aaaaff';
    _hudDashFill.style.width  = (player.dashTimer / DASH_DURATION * 100) + '%';
    _hudDashFill.style.background = 'linear-gradient(90deg,#3333aa,#aaaaff)';
  } else if (player.dashCooldown > 0) {
    _hudDash.style.display    = '';
    _hudDashLabel.textContent = `DASH ${player.dashCooldown.toFixed(1)}s`;
    _hudDashLabel.style.color = '#555588';
    _hudDashFill.style.width  = ((1 - player.dashCooldown / DASH_COOLDOWN) * 100) + '%';
    _hudDashFill.style.background = 'linear-gradient(90deg,#111133,#555588)';
  } else {
    _hudDash.style.display = 'none';
  }

  // Death check
  if (player.hp <= 0) {
    gameRunning = false;
    gamePhase   = 'dead';
  }

  // Grimório sobre tudo
  if (grimoireOpen) drawGrimoire();

  requestAnimationFrame(gameLoop);
}

// ─── GRIMÓRIO DRAWING ──────────────────────────────────────────────────────
function _grimRoundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function _grimBuildLines() {
  const out = [];
  for (const sec of GRIMOIRE_LORE) {
    out.push({ type: 'gap' });
    out.push({ type: 'title', text: sec.title });
    out.push({ type: 'rule' });
    for (const l of sec.lines) {
      out.push({ type: 'body', text: l });
    }
  }
  out.push({ type: 'gap' });
  return out;
}

function drawGrimoire() {
  const t  = time;
  const bw = 620, bh = 390;
  const bx = (W - bw) / 2;
  const by = (H - bh) / 2;

  // ── Overlay escuro ──────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.87)';
  ctx.fillRect(0, 0, W, H);

  // ── Glow externo ────────────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor = '#6600cc';
  ctx.shadowBlur  = 22 + 8;
  ctx.strokeStyle = '#4400aa';
  ctx.lineWidth   = 2;
  _grimRoundRect(bx - 5, by - 5, bw + 10, bh + 10, 8);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // ── Corpo do grimório ───────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
  bgGrad.addColorStop(0,   '#100818');
  bgGrad.addColorStop(0.5, '#0c0614');
  bgGrad.addColorStop(1,   '#070410');
  ctx.fillStyle = bgGrad;
  _grimRoundRect(bx, by, bw, bh, 5);
  ctx.fill();

  // Textura de linhas de página
  ctx.strokeStyle = 'rgba(90,40,140,0.10)';
  ctx.lineWidth   = 0.5;
  for (let ly2 = by + 54; ly2 < by + bh - 14; ly2 += 15) {
    ctx.beginPath();
    ctx.moveTo(bx + 22, ly2);
    ctx.lineTo(bx + bw - 22, ly2);
    ctx.stroke();
  }

  // Borda interna
  ctx.strokeStyle = '#3a1a6a';
  ctx.lineWidth   = 1;
  _grimRoundRect(bx + 9, by + 9, bw - 18, bh - 18, 4);
  ctx.stroke();

  // Coluna de margem esquerda (como um grimório real com margem iluminada)
  ctx.fillStyle = 'rgba(60,20,100,0.08)';
  ctx.fillRect(bx + 14, by + 48, 6, bh - 62);

  // ── Título ──────────────────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor = '#bb55ff';
  ctx.shadowBlur  = 14 + 5 * Math.sin(t * 2.1);
  ctx.fillStyle   = '#dd99ff';
  ctx.font        = 'bold 16px "Courier New", monospace';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GRIMÓRIO DO ABISMO', W / 2, by + 28);
  ctx.restore();

  // Linha separadora do título com ornamentos
  const sepY = by + 44;
  ctx.strokeStyle = '#5a2a9a';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(bx + 22, sepY); ctx.lineTo(bx + bw - 22, sepY); ctx.stroke();

  // ── Área de conteúdo (com clipping) ─────────────────────────────────────
  const cx2 = bx + 26;
  const cy2  = by + 52;
  const cw   = bw - 44;   // deixa espaço para scrollbar
  const ch   = bh - 74;

  ctx.save();
  ctx.beginPath();
  ctx.rect(cx2, cy2, cw, ch);
  ctx.clip();

  const lines2  = _grimBuildLines();
  const lineH   = 17;
  const totalH2 = lines2.length * lineH;
  const maxScr  = Math.max(0, totalH2 - ch);
  grimoireScroll = Math.max(0, Math.min(grimoireScroll, maxScr));

  let lY = cy2 - grimoireScroll;
  for (const l of lines2) {
    if (lY + lineH >= cy2 - lineH && lY < cy2 + ch + lineH) {
      ctx.save();
      switch (l.type) {
        case 'title': {
          ctx.shadowColor = '#9933ff';
          ctx.shadowBlur  = 7;
          ctx.fillStyle   = '#cc77ff';
          ctx.font        = 'bold 18px "Courier New", monospace';
          ctx.textAlign   = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(l.text, cx2 + 8, lY + lineH / 2);
          break;
        }
        case 'rule': {
          ctx.strokeStyle = 'rgba(100,40,160,0.4)';
          ctx.lineWidth   = 0.5;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(cx2 + 8, lY + lineH / 2);
          ctx.lineTo(cx2 + cw - 8, lY + lineH / 2);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }
        case 'body': {
          if (l.text !== '') {
            // Destaque para linhas com estrelas
            const isStar = l.text.includes('★');
            ctx.fillStyle    = isStar ? '#ffdd88' : '#c0a0e0';
            ctx.font         = isStar
              ? 'bold 16px "Courier New", monospace'
              : '16px "Courier New", monospace';
            ctx.textAlign    = isStar ? 'center' : 'left';
            ctx.textBaseline = 'middle';
            const tx2 = isStar ? cx2 + cw / 2 : cx2 + 14;
            if (isStar) { ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 5; }
            ctx.fillText(l.text, tx2, lY + lineH / 2);
          }
          break;
        }
        case 'gap':
        default:
          break;
      }
      ctx.restore();
    }
    lY += lineH;
  }

  ctx.restore(); // fim do clip

  // ── Scrollbar ────────────────────────────────────────────────────────────
  const sbX2 = bx + bw - 16;
  const sbY2 = cy2;
  const sbH2 = ch;
  ctx.strokeStyle = '#2a0a4a';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(sbX2, sbY2); ctx.lineTo(sbX2, sbY2 + sbH2); ctx.stroke();

  if (totalH2 > ch) {
    const tH = Math.max(24, (ch / totalH2) * sbH2);
    const tY = sbY2 + (grimoireScroll / maxScr) * (sbH2 - tH);
    ctx.fillStyle = 'rgba(110,40,180,0.7)';
    ctx.fillRect(sbX2 - 3, tY, 6, tH);
    // Brilho no thumb
    ctx.fillStyle = 'rgba(180,100,255,0.4)';
    ctx.fillRect(sbX2 - 2, tY, 2, tH);
  }

  // Indicadores de scroll nas bordas (fade superior/inferior)
  if (grimoireScroll > 0) {
    const fadeTop = ctx.createLinearGradient(cx2, cy2, cx2, cy2 + 28);
    fadeTop.addColorStop(0, 'rgba(10,5,20,0.85)');
    fadeTop.addColorStop(1, 'rgba(10,5,20,0)');
    ctx.fillStyle = fadeTop;
    ctx.fillRect(cx2, cy2, cw, 28);
    // Seta ▲
    ctx.fillStyle = 'rgba(160,100,220,0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▲', cx2 + cw / 2, cy2 + 5);
  }
  if (grimoireScroll < maxScr) {
    const fadeBtm = ctx.createLinearGradient(cx2, cy2 + ch - 28, cx2, cy2 + ch);
    fadeBtm.addColorStop(0, 'rgba(10,5,20,0)');
    fadeBtm.addColorStop(1, 'rgba(10,5,20,0.85)');
    ctx.fillStyle = fadeBtm;
    ctx.fillRect(cx2, cy2 + ch - 28, cw, 28);
    // Seta ▼
    ctx.fillStyle = 'rgba(160,100,220,0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▼', cx2 + cw / 2, cy2 + ch + 5);
  }

  ctx.restore();
}

// ─── CANVAS MENUS ──────────────────────────────────────────────────────────
function drawCanvasButton(label, cx, cy, cyLabel, hovered) {
  const pw = ctx.measureText(label).width + 48;
  const ph = 42;
  const px = cx - pw / 2;
  const py = cy - ph / 2;
  ctx.strokeStyle = hovered ? '#8800ff' : '#777';
  ctx.lineWidth   = 1;
  ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle   = hovered ? '#8800ff' : '#888';
  ctx.fillText(label, cx, cy + cyLabel);
  return { x: px, y: py, w: pw, h: ph };
}

// Guarda os bounds dos botões para hit-test
const menuButtons = {};

function drawStartScreen(mx, my) {
  ctx.fillStyle = 'rgba(0,0,0,0.92)';
  ctx.fillRect(0, 0, W, H);

  // Título
  ctx.save();
  ctx.shadowColor = '#8800ff';
  ctx.shadowBlur  = 40;
  ctx.fillStyle   = '#8800ff';
  ctx.font        = 'bold 48px "Courier New", monospace';
  ctx.textAlign   = 'center';
  ctx.fillText('Into The Abyss', W / 2, H / 2 - 75);
  ctx.restore();

  // Subtítulo
  ctx.fillStyle   = '#777';
  ctx.font        = '26px "Courier New", monospace';
  ctx.textAlign   = 'center';
  ctx.fillText('Journey Through The Dark', W / 2, H / 2 - 22);

  // Botão iniciar
  ctx.font = '16px "Courier New", monospace';
  const hovered = menuButtons.start &&
    mx >= menuButtons.start.x && mx <= menuButtons.start.x + menuButtons.start.w &&
    my >= menuButtons.start.y && my <= menuButtons.start.y + menuButtons.start.h;
  menuButtons.start = drawCanvasButton('[ INICIAR ]', W / 2, H / 2 + 45, 5, hovered);
  canvas.style.cursor = hovered ? 'pointer' : 'default';
}

function drawVictoryScreen(mx, my) {
  ctx.fillStyle = 'rgba(0,0,0,0.93)';
  ctx.fillRect(0, 0, W, H);

  // Estrelas de fundo animadas
  const t = time;

  // Título
  ctx.save();
  ctx.shadowColor = '#8800ff';
  ctx.shadowBlur  = 40 + 10 * Math.sin(t * 2);
  ctx.fillStyle   = '#8800ff';
  ctx.font        = 'bold 36px "Courier New", monospace';
  ctx.textAlign   = 'center';
  ctx.fillText('SALVAÇÃO!', W / 2, H / 2 - 80);
  ctx.restore();

  // Subtítulo
  ctx.fillStyle   = '#777';
  ctx.font      = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TODAS AS ESTRELAS COLETADAS', W / 2, H / 2 - 30);

  // Botão jogar novamente
  ctx.shadowBlur = 0;
  ctx.font = '16px "Courier New", monospace';
  const hovered = menuButtons.victory &&
    mx >= menuButtons.victory.x && mx <= menuButtons.victory.x + menuButtons.victory.w &&
    my >= menuButtons.victory.y && my <= menuButtons.victory.y + menuButtons.victory.h;
  ctx.fillStyle = hovered ? '#ffd700' : '#888';
  menuButtons.victory = drawCanvasButton('[ JOGAR NOVAMENTE ]', W / 2, H / 2 + 70, 5, hovered);
  canvas.style.cursor = hovered ? 'pointer' : 'default';
}

function drawDeathScreen(mx, my) {
  ctx.fillStyle = 'rgba(0,0,0,0.93)';
  ctx.fillRect(0, 0, W, H);

  // Título
  ctx.save();
  ctx.shadowColor = '#8800ff';
  ctx.shadowBlur  = 20;
  ctx.fillStyle   = '#8800ff';
  ctx.font        = 'bold 28px "Courier New", monospace';
  ctx.textAlign   = 'center';
  ctx.letterSpacing = '8px';
  ctx.fillText('VOCÊ MORREU', W / 2, H / 2 - 30);
  ctx.restore();

  // Botão retry
  ctx.font = '16px "Courier New", monospace';
  const hovered = menuButtons.retry &&
    mx >= menuButtons.retry.x && mx <= menuButtons.retry.x + menuButtons.retry.w &&
    my >= menuButtons.retry.y && my <= menuButtons.retry.y + menuButtons.retry.h;
  menuButtons.retry = drawCanvasButton('[ TENTAR NOVAMENTE ]', W / 2, H / 2 + 40, 5, hovered);
  canvas.style.cursor = hovered ? 'pointer' : 'default';
}

// Rastreia posição do mouse para hover
let mouseX = 0, mouseY = 0;
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  mouseX = (e.clientX - rect.left) * scaleX;
  mouseY = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;   // 800 / largura_visual
  const scaleY = canvas.height / rect.height; // 480 / altura_visual
  
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  if (gamePhase === 'start' && menuButtons.start) {
    const b = menuButtons.start;
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) startGame();
  }
  if (gamePhase === 'dead' && menuButtons.retry) {
    const b = menuButtons.retry;
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) startGame();
  }
  if (gamePhase === 'victory' && menuButtons.victory) {
    const b = menuButtons.victory;
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) startGame();
  }
});

// ─── KICK OFF ──────────────────────────────────────────────────────────────
requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(gameLoop); });