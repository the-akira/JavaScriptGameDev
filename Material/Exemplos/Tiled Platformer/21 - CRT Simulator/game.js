(function(){
"use strict";

/* ============================================================
   ARQUIVOS DO JOGO (carregados via fetch/<img>, devem estar
   na MESMA PASTA deste index.html)
   ============================================================ */
const MAP_FILES = { map1: "maps/map1.tmx", map2: "maps/map2.tmx", map3: "maps/map3.tmx" };
const TILESET_SRC = "assets/tileset.png";
const DOOR_SRC = "assets/door.png";
const GUN_SRC = "assets/gun.png";
const BULLET_SRC = "assets/bullet.png";
const CHAIN_GUN_SRC = "assets/chain_gun.png"; // braço/arma do inimigo "boss" (ver ENEMY_TYPES)
const BULLET2_SRC = "assets/bullet2.png";      // bala do "boss"
const SHOTGUN_SRC = "assets/shotgun.png"; // braço/arma do inimigo "gladiator"
const BULLET3_SRC = "assets/bullet3.png"; // bala do "gladiator"

/* ============================================================
   ÁUDIO — pasta sounds/, com music/ (trilha) e sfx/ (efeitos)
   ============================================================ */
const SOUNDS_DIR = "sounds/";
const MUSIC_DIR = SOUNDS_DIR + "music/";
const SFX_DIR = SOUNDS_DIR + "sfx/";

// trilha sonora: fica alternando entre essas 3 faixas em loop (ver
// playNextTrack), sem repetir a mesma duas vezes seguidas
const MUSIC_TRACKS = [
  MUSIC_DIR + "descent_into_cerberon.mp3",
  MUSIC_DIR + "showdown.mp3",
  MUSIC_DIR + "the_underworld.mp3"
];

// cada valor é um nome de arquivo (dentro de sfx/) ou uma LISTA de
// nomes — nesse caso playSfx escolhe uma variante aleatória a cada
// chamada (usado só por "pain" aqui)
const SFX_FILES = {
  adrenaline:         "adrenaline.wav",
  barrelExplosion:    "barrelExplosion.wav",
  bossShot:           "bossShot.wav",
  boxExplosion:       "boxExplosion.wav",
  button:             "button.wav",
  collect:            "collect.wav",
  dash:               "dash.wav",
  death:              "death.wav",
  door:               "door.wav",
  enemy1Shot:         "enemy1Shot.wav",
  enemy2Shot:         "enemy2Shot.wav",
  enemy1death:        "enemy1Death.wav",
  enemy2death:        "enemy2Death.wav",
  bossDeath:          "bossDeath.wav",
  health:             "health.wav",
  invulnerability:    "invulnerability.wav",
  jacket:             "jacket.wav",
  liquid:             "liquid.wav",
  medkit:             "medkit.wav",
  pain:               ["pain_0.wav", "pain_1.wav", "pain_2.wav", "pain_3.wav"],
  playerPistola:      "playerPistola.wav",
  playerMetralhadora: "playerMetralhadora.wav",
  playerRailgun:      "playerRailgun.wav",
  secret:             "secret.wav",
  weaponChange:       "weaponChange.wav"
};

const SFX_BASE_VOLUME = 0.8;    // ganho extra dos efeitos em relação ao volume mestre
const MUSIC_BASE_VOLUME = 0.5;  // idem pra música — mais baixa que os SFX, pra não abafar os efeitos
const VOLUME_STORAGE_KEY = "metroidvania_master_volume"; // localStorage — lembra o volume entre sessões
const DEFAULT_MASTER_VOLUME = 0.7;

const TILE = 16;           // tamanho de cada tile no tileset/mapa
const DOOR_TILE_GID = 257; // primeiro gid do tileset "door"
const ZOOM = 3;             // fator de escala na tela

/* --- minimapa (canto superior direito) ---
   Tamanho MÁXIMO em px na tela; a escala real é calculada por mapa
   (min(largura, altura)) pra manter a proporção mesmo com mapas de
   dimensões bem diferentes entre si (map1/map2/map3 etc.). */
const MINIMAP_MAX_W = 180;
const MINIMAP_MAX_H = 130;
const MINIMAP_MARGIN = 12; // distância da borda da tela
const INTERACT_KEY = "KeyE";
const SHOOT_KEY = "KeyX";
const DASH_KEY = "KeyZ";
const LIQUID_PHYSICS_TOGGLE_KEY = "KeyL"; // liga/desliga a física especial de líquidos (nadar/boiar) em runtime — ver liquidPhysicsEnabled

/* Sprite sheets do player: cada arquivo é uma tira horizontal de
   frames de mesmo tamanho (32x48), um estado por arquivo. */
const SPRITE_W = 32;
const SPRITE_H = 48;
const SPRITE_FEET_Y = 36; // linha (em px, dentro do frame) onde os pés tocam o chão
const ANIMS = {
  idle:        { src: "assets/player_idle.png",        frames: 5, fps: 6,  img: null },
  run:         { src: "assets/player_run.png",         frames: 7, fps: 12, img: null },
  jump:        { src: "assets/player_jump.png",        frames: 3, fps: 10, img: null },
  doubleJump:  { src: "assets/player_double_jump.png", frames: 7, fps: 12, img: null },
  climbIdle:   { src: "assets/player_climb_idle.png",  frames: 1, fps: 1,  img: null },
  climb:       { src: "assets/player_climb.png",       frames: 8, fps: 10, img: null },
  crouchIdle:  { src: "assets/player_crouch.png",       frames: 1, fps: 1,  img: null },
  crouch:      { src: "assets/player_crouch.png",       frames: 4, fps: 8,  img: null },
  dash:        { src: "assets/player_dash.png",         frames: 1, fps: 1,  img: null }
};

/* --- agachar (Ctrl + Baixo) ---
   player_crouch.png é uma tira 128x32 (4 frames de 32x32, mesma
   largura SPRITE_W mas metade da altura SPRITE_H). Diferente do
   sprite em pé, os pés nesse sprite ficam em y=24 dentro do frame
   (medido no próprio arquivo), não em SPRITE_FEET_Y — por isso os
   dois valores abaixo, usados só quando player.crouching é true. */
const CROUCH_SPRITE_H = 32;
const CROUCH_SPRITE_FEET_Y = 24;
const PLAYER_STAND_H = 26;   // hitbox em pé (igual ao valor original de player.h)
const PLAYER_CROUCH_H = 14;  // hitbox agachado — cabe num vão de 1 tile (16px) com folga
// Ponto de referência vertical da câmera, medido pra cima a partir dos
// pés — FIXO (baseado só na altura em pé), pra câmera não pular quando
// o crouch encolhe/expande a hitbox (os pés continuam no mesmo lugar
// ao trocar, mas o CENTRO do hitbox muda de altura junto com h; usando
// um valor fixo em vez de player.h/2, a câmera ignora essa mudança).
const CAMERA_EYE_OFFSET = PLAYER_STAND_H / 2;
// Hurtbox (só pra bala inimiga acertar o jogador) usada em vez da
// hitbox de colisão (PLAYER_CROUCH_H=14) quando agachado: a hitbox de
// colisão é propositalmente baixinha pra caber no vão de 1 tile, mas o
// sprite visível agachado ainda ocupa uma área bem maior (cabeça
// inclusa) — sem isso, um tiro que visualmente acerta a cabeça
// agachada atravessa sem causar dano, porque passa acima da hitbox de
// colisão minúscula. Medido a partir do conteúdo visível de
// player_crouch.png (topo ~y=4, pés em y=24 → ~20px de corpo).
const PLAYER_CROUCH_HURT_H = 20;
const DASH_SPEED = 280;     // velocidade horizontal fixa durante o dash (bem acima de PHYS.moveSpeed=95)
const DASH_TIME = 0.18;     // duração do dash (s)
const DASH_COOLDOWN = 0.6;  // tempo até poder dar outro dash (s)
// Ponto do ombro na pose agachada (ver ARM_ATTACH acima para a pose em
// pé) — estimado a partir da postura curvada do sprite; ajuste fino
// visual provavelmente necessário depois de ver em jogo.
const ARM_ATTACH_CROUCH = { x: -3, y: 13 };
const CROUCH_SPEED_MULT = 0.5; // multiplicador de PHYS.moveSpeed enquanto agachado

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

/* --- portas-laser e botões (objectgroup "Triggers" no .tmx) ---
   Cada porta-laser e cada botão têm uma propriedade "door" — o nome
   liga um ao outro (podem existir vários pares por mapa, cada um com
   seu próprio nome). Dois tipos de botão, distinguidos pelo gid usado
   no editor (tileset "buttons": id0 = botão-de-atirar, id1 = switch):
     - "toggle": liga/desliga com a tecla E, quantas vezes quiser.
     - "shoot": é atingido por bala; vai apagando a cada tiro (5
       sprites, 0=ligado .. 4=apagado) até desligar a porta de vez —
       não reacende sozinho, só quando o mapa é recarregado do zero. */
const LASER_SRC = ["assets/lasers/0.png", "assets/lasers/1.png", "assets/lasers/2.png", "assets/lasers/3.png"];
const LASER_ANIM_FRAME_TIME = 0.05; // s por frame da animação de ligar/desligar

// Barreira física: mesmo esquema do laser (objectgroup "Triggers",
// gid do tileset "barriers"), mas com sprite de barreira em vez de
// feixe de laser. 0 = fechada (bloqueia) .. 8 = totalmente aberta.
const BARRIER_SRC = ["assets/barriers/0.png", "assets/barriers/1.png", "assets/barriers/2.png", "assets/barriers/3.png", "assets/barriers/4.png", "assets/barriers/5.png", "assets/barriers/6.png", "assets/barriers/7.png", "assets/barriers/8.png"];
const BARRIER_ANIM_FRAME_TIME = 0.25; // s por frame da animação de abrir/fechar da barreira

const BUTTON_SHOOT_SRC = ["assets/triggers/button-0.png", "assets/triggers/button-1.png", "assets/triggers/button-2.png", "assets/triggers/button-3.png", "assets/triggers/button-4.png"];
const BUTTON_TOGGLE_ON_SRC = "assets/triggers/on.png";
const BUTTON_TOGGLE_OFF_SRC = "assets/triggers/off.png";
const BUTTON_HITS_TO_DISABLE = BUTTON_SHOOT_SRC.length - 1; // 4 tiros até apagar de vez

/* --- vida / dano --- */
const PLAYER_MAX_HP = 100;
const PLAYER_HIT_DAMAGE = 10;   // dano por bala inimiga
const PLAYER_INVULN_TIME = 0.6; // segundos de invencibilidade após tomar dano
const ENEMY_MAX_HP = 30;
const ENEMY_HIT_DAMAGE = 10;    // dano por bala do jogador (3 tiros mata)

/* ============================================================
   ITENS COLETÁVEIS (objectgroup "Items" do .tmx), ARMAS E MOCHILA
   ============================================================ */
const ITEMS_DIR = "assets/items/";   // adrenaline.png, jacket.png, medkit.png, ...
const WEAPON_ASSETS_DIR = "assets/"; // machine_gun.png, railgun.png, bullet4.png, bullet5.png

// --- efeitos dos consumíveis (ajuste à vontade) ---
const MEDKIT_HEAL = 50;              // HP curado (não gasta o item com a vida cheia)
const JACKET_SHIELD_AMOUNT = 50;     // escudo ganho por jaqueta
const PLAYER_MAX_SHIELD = 50;        // teto da barra de escudo
const ADRENALINE_DURATION = 8;       // s
const ADRENALINE_SPEED_MULT = 1.5;   // multiplica PHYS.moveSpeed enquanto ativo
const INVULN_ITEM_DURATION = 6;      // s
const MAX_ITEM_STACK = 99;
const ITEM_PICKUP_PADDING = 2;       // px extras ao redor do item para facilitar a coleta
const ITEM_BOB_SPEED = 3;            // rad/s da oscilação do item no chão

// Chave = nome do arquivo (sem .png). O mapeamento gid -> item é feito pelo
// NOME DO ARQUIVO no tileset "items" do .tmx (o firstgid muda de mapa pra
// mapa: 361 no map1/map3, 354 no map2), igual já é feito com botões/lasers.
const ITEM_DEFS = {
  adrenaline:       { file: "adrenaline.png",       kind: "consumable", name: "Adrenalina",       color: "#f0a030", desc: "Velocidade +" + Math.round((ADRENALINE_SPEED_MULT - 1) * 100) + "% por " + ADRENALINE_DURATION + "s", img: null },
  invulnerability:  { file: "invulnerability.png",  kind: "consumable", name: "Invulnerabilidade", color: "#ffd84a", desc: "Imune a dano por " + INVULN_ITEM_DURATION + "s", img: null },
  jacket:           { file: "jacket.png",           kind: "consumable", name: "Colete",           color: "#5ab8ff", desc: "+" + JACKET_SHIELD_AMOUNT + " de escudo (absorve dano)", img: null },
  medkit:           { file: "medkit.png",           kind: "consumable", name: "Medkit",           color: "#e05a5a", desc: "Cura " + MEDKIT_HEAL + " de vida", img: null },
  machine_gun_item: { file: "machine_gun_item.png", kind: "weapon", weapon: "machine_gun", name: "Metralhadora", img: null },
  railgun_item:     { file: "railgun_item.png",     kind: "weapon", weapon: "railgun",     name: "Railgun",      img: null }
};

// Ícone da pistola no painel de arma. Tenta a pasta de itens; se não achar, tenta
// "assets/item/" (singular). Se nenhuma existir, o HUD recorta o gun.png como antes.
const GUN_ICON_SRCS = [ITEMS_DIR + "gun_item.png", "assets/item/gun_item.png"];
const BACKPACK_TOGGLE_KEY = "KeyB";  // mostra/esconde o painel da mochila

// Ordem dos slots da mochila (de cima pra baixo) e as teclas de atalho.
const BACKPACK_ORDER = ["adrenaline", "invulnerability", "jacket", "medkit"];
const BACKPACK_HOTKEYS = ["Digit1", "Digit2", "Digit3", "Digit4"];

// Armas do jogador. A pistola usa os globais de sempre (gun.png/bullet.png).
// pivot/muzzle: o pivô (17,4) é o mesmo dos 3 sprites (a mão fica em x=17);
// muzzle = distância do ombro até a boca do cano.
// bulletSpeed: mantido abaixo de ~16px/frame a 30fps pra bala não atravessar
// paredes de 1 tile nem inimigos (a colisão da bala é por ponto).
const WEAPON_DEFS = {
  pistol: {
    name: "Pistola", itemKey: null,
    iconImg: null,                               // gun_item.png (ícone do painel de arma), carregado em init()
    armImg: null, bulletImg: null,               // preenchidos em init()
    armW: ARM_W, armH: ARM_H, armPivot: ARM_PIVOT, muzzle: MUZZLE_OFFSET,
    bulletW: BULLET_W, bulletH: BULLET_H, bulletSpeed: BULLET_SPEED,
    damage: ENEMY_HIT_DAMAGE, cooldown: SHOOT_COOLDOWN
  },
  machine_gun: {
    name: "Metralhadora", itemKey: "machine_gun_item",
    armSrc: WEAPON_ASSETS_DIR + "machine_gun.png", bulletSrc: WEAPON_ASSETS_DIR + "bullet4.png",
    armImg: null, bulletImg: null,
    armW: 40, armH: 10, armPivot: { x: 17, y: 4 }, muzzle: { x: 22, y: 0 },
    bulletW: 6, bulletH: 6, bulletSpeed: 340,
    damage: 5, cooldown: 0.25                    // ~9 tiros/s, dano baixo por tiro
  },
  railgun: {
    name: "Railgun", itemKey: "railgun_item",
    armSrc: WEAPON_ASSETS_DIR + "railgun.png", bulletSrc: WEAPON_ASSETS_DIR + "bullet5.png",
    armImg: null, bulletImg: null,
    armW: 42, armH: 10, armPivot: { x: 17, y: 4 }, muzzle: { x: 25, y: 0 },
    bulletW: 8, bulletH: 8, bulletSpeed: 380,
    damage: 15, cooldown: 0.9                    // tiro lento, mata guard de 1 tiro
  }
};

/* Inimigo "guard": mesma proporção de sprite do player (32x48,
   pés na mesma linha SPRITE_FEET_Y), patrulha e atira usando o
   mesmo sistema de braço/bala do jogador. */
const ENEMY_ANIMS = {
  idle: { src: "assets/enemy_idle.png", frames: 5, fps: 6,  img: null },
  run:  { src: "assets/enemy_run.png",  frames: 7, fps: 12, img: null }
};
const ENEMY_W = 12, ENEMY_H = 26; // mesma hitbox do player

/* Inimigo "boss": mesma IA de patrulha/tiro do "guard" (ver
   updateEnemy/ENEMY_TYPES), mas com sprite próprio, mais vida e
   cadência de tiro maior. boss_idle.png/boss_run.png têm frames de
   40x48 (mais largos que os 32x48 do player/guard), mas os pés ficam
   na mesma linha (y=36 dentro do frame) — por isso reaproveita
   SPRITE_H/SPRITE_FEET_Y e só BOSS_SPRITE_W muda. */
const BOSS_ANIMS = {
  idle: { src: "assets/boss_idle.png", frames: 5, fps: 6,  img: null },
  run:  { src: "assets/boss_run.png",  frames: 5, fps: 10, img: null }
};
const BOSS_SPRITE_W = 40;
const BOSS_W = 20, BOSS_H = 30; // hitbox maior que a do guard (ENEMY_W=12,H=26)
const BOSS_MAX_HP = 150;        // guard tem 30 (ver ENEMY_MAX_HP) — leva bem mais tiro pra cair
const BOSS_SHOOT_COOLDOWN = 0.4; // guard atira a cada 0.9s (ver ENEMY_SHOOT_COOLDOWN) — boss é bem mais rápido

/* Braço do boss (chain_gun.png, 46x10): mesmo esquema do ARM_* do
   player/guard (ver comentário acima de ARM_W), mas com pivô e ponto
   de cano próprios, medidos a partir do sprite — o "punho" (onde
   encosta no corpo) fica perto de x=20,y=4, e a ponta do cano perto
   de x=44,y=4. */
const BOSS_ARM_W = 46, BOSS_ARM_H = 10;
const BOSS_ARM_PIVOT = { x: 20, y: 4 };
const BOSS_MUZZLE_OFFSET = { x: 24, y: 0 };
// Ombro no corpo do boss: reaproveita o mesmo valor do player/guard
// (ARM_ATTACH) já que a pose e a linha dos pés são as mesmas — ajuste
// fino visual pode ser necessário depois de ver em jogo, já que o
// sprite do boss é 8px mais largo.
const BOSS_ARM_ATTACH = { x: -3, y: 20 };

/* Inimigo "gladiator": mesma proporção/hitbox do "guard" (32x48,
   ENEMY_W/H) — só muda o braço (shotgun.png), a bala (bullet3.png)
   e os status: um pouco mais forte que o guard. */
const GLADIATOR_ANIMS = {
  idle: { src: "assets/enemy2_idle.png", frames: 5, fps: 6,  img: null },
  run:  { src: "assets/enemy2_run.png",  frames: 7, fps: 12, img: null }
};
const GLADIATOR_MAX_HP = 45;           // guard tem 30 (ENEMY_MAX_HP)
const GLADIATOR_SHOOT_COOLDOWN = 0.65; // guard atira a cada 0.9s — gladiator é um pouco mais rápido

const ENEMY_PHYS = {
  gravity: 900,
  maxFall: 500,
  patrolSpeed: 40   // px/s — mais lento que o player (moveSpeed: 95)
};

// --- parâmetros de IA, ajuste livre ---
const ENEMY_SIGHT_RANGE = 100;    // distância horizontal (px) para notar o jogador
const ENEMY_SIGHT_VERT  = 60;     // tolerância vertical (px): só "vê" se estiver +- nessa altura
const ENEMY_ALERT_RANGE_BONUS = 100; // histerese: some da vista só além de SIGHT_RANGE + isso
const CRATE_SIGHT_BLOCK_MIN_H = 20;
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

/* Registro por tipo de inimigo (chave = "Type" do objeto no Tiled,
   já em minúsculas — ver spawnEnemies). Cada entrada pluga só o que
   difere de um tipo pro outro (animações, hitbox, vida, cadência de
   tiro e o braço/bala usados) no mesmo sistema de IA/desenho/tiro
   compartilhado (updateEnemy, drawCharacter, drawArm, fireBulletFrom).
   "guard" reaproveita literalmente as mesmas constantes ARM_ e o
   gunImg (sempre foi assim, antes desse registro existir) — só o
   "boss" tem braço/bala/sprite próprios. minShotDx é calculado logo
   abaixo, igual à fórmula que já existia em ENEMY_MIN_SHOT_DX. */
const ENEMY_TYPES = {
  guard: {
    anims: ENEMY_ANIMS,
    w: ENEMY_W, h: ENEMY_H,
    spriteW: SPRITE_W, spriteH: SPRITE_H, spriteFeetY: SPRITE_FEET_Y,
    maxHp: ENEMY_MAX_HP,
    shootCooldown: ENEMY_SHOOT_COOLDOWN,
    armImg: null, armW: ARM_W, armH: ARM_H, armPivot: ARM_PIVOT,
    muzzleOffset: MUZZLE_OFFSET, armAttach: ARM_ATTACH,
    bulletImg: null
  },
  boss: {
    anims: BOSS_ANIMS,
    w: BOSS_W, h: BOSS_H,
    spriteW: BOSS_SPRITE_W, spriteH: SPRITE_H, spriteFeetY: SPRITE_FEET_Y,
    maxHp: BOSS_MAX_HP,
    shootCooldown: BOSS_SHOOT_COOLDOWN,
    armImg: null, armW: BOSS_ARM_W, armH: BOSS_ARM_H, armPivot: BOSS_ARM_PIVOT,
    muzzleOffset: BOSS_MUZZLE_OFFSET, armAttach: BOSS_ARM_ATTACH,
    bulletImg: null
  },
  gladiator: {
    anims: GLADIATOR_ANIMS,
    w: ENEMY_W, h: ENEMY_H,
    spriteW: SPRITE_W, spriteH: SPRITE_H, spriteFeetY: SPRITE_FEET_Y,
    maxHp: GLADIATOR_MAX_HP,
    shootCooldown: GLADIATOR_SHOOT_COOLDOWN,
    armImg: null, armW: ARM_W, armH: ARM_H, armPivot: ARM_PIVOT,
    muzzleOffset: MUZZLE_OFFSET, armAttach: ARM_ATTACH,
    bulletImg: null
  }
};
for(const key in ENEMY_TYPES){
  const def = ENEMY_TYPES[key];
  // mesma fórmula de ENEMY_MIN_SHOT_DX, mas por tipo (arma/hitbox diferentes)
  def.minShotDx = def.armAttach.x + def.muzzleOffset.x + def.w/2 + 8;
}

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

// Efeito de explosão ao destruir uma caixa (assets/explosion/00..09.png).
// Diferente da nuvem do barril (EXPLOSION_SRC/mushroom): aqui o quadro é
// um estouro de partículas simétrico (60x60), desenhado centralizado no
// centro da caixa em vez de ancorado pela base — ver spawnExplosion/
// drawExplosions, que agora tratam os dois tipos ("barrel"/"crate").
const CRATE_EXPLOSION_SRC = ["assets/explosion/00.png","assets/explosion/01.png","assets/explosion/02.png","assets/explosion/03.png","assets/explosion/04.png","assets/explosion/05.png","assets/explosion/06.png","assets/explosion/07.png","assets/explosion/08.png","assets/explosion/09.png"];
const CRATE_EXPLOSION_FPS = 24; // 10 frames -> ~0.42s de animação

/* --- barris explosivos (lidos do objectgroup próprio "Barrels",
   separado de "Objects" de propósito — ver parseTMX). Só existe uma
   variante, então não precisamos de um dicionário por localId como
   CRATE_DEFS. */
const BARREL_SRC = "assets/barrel.png"; // 16x20 — 4px mais alto que a hitbox/tile-object (16x16); desenhado ancorado pela base, igual sprites do jogador maiores que a hitbox
const EXPLOSION_SRC = ["assets/mushroom/00.png","assets/mushroom/01.png","assets/mushroom/02.png","assets/mushroom/03.png","assets/mushroom/04.png","assets/mushroom/05.png","assets/mushroom/06.png","assets/mushroom/07.png","assets/mushroom/08.png","assets/mushroom/09.png"];
const EXPLOSION_FPS = 20; // 10 frames -> ~0.5s de animação
// Cada frame tem 48x110px, com a "base" da explosão (onde ela nasce)
// ~62px abaixo do topo do quadro (medido no 1º frame) — o resto do
// quadro é espaço vazio pra fumaça subir nos frames seguintes. Estimado
// a partir do sprite; ajuste se a explosão não parecer "grudada" no chão.
const EXPLOSION_GROUND_OFFSET = 62;
const BARREL_EXPLOSION_RADIUS_X = 36;      // px — alcance horizontal do dano, a partir do centro do barril
const BARREL_EXPLOSION_RADIUS_Y = 56;      // px — alcance vertical, maior que o horizontal: a nuvem do EXPLOSION_SRC sobe bem mais do que se espalha pros lados (ver EXPLOSION_GROUND_OFFSET) — sem isso, um pulo alto em cima do barril parecia visualmente "dentro" da explosão mas não tomava dano
const BARREL_EXPLOSION_DAMAGE_PLAYER = 40; // dano no jogador se estiver dentro do raio
const BARREL_EXPLOSION_DAMAGE_ENEMY = 40;  // dano no inimigo se estiver dentro do raio (mata de uma vez, já que ENEMY_MAX_HP é 30)
const BARREL_CHAIN_RADIUS = 40;    // px — distância (centro a centro) até onde um barril contagia outro, começando a reação em cadeia
const BARREL_CHAIN_DELAY = 0.15;   // segundos de atraso antes de um barril "contagiado" explodir de verdade — dá o efeito dominó em vez de todos sumirem no mesmo frame

/* --- passagens secretas (objectgroup "Secret", tileset "tiles" no
   .tmx, assets/tiles.png). Ver parseTMX pra entender a separação
   entre a parede/decoração que bloqueia a passagem (secretTiles) e os
   gatilhos que abrem essa passagem (secretTriggers). */
const TILES_SRC = "assets/tiles.png"; // 96x192, 72 tiles de 16x16, 6 colunas
const SECRET_DISSOLVE_TIME = 0.6; // s — duração total da desfragmentação (cada célula soma um vanishAt aleatório dentro dessa janela)
const SECRET_DISSOLVE_CELL = 4;   // px — tamanho de cada célula que desaparece; menor = mais granular/pixelado, porém mais drawImage por frame
const SECRET_DISSOLVE_FADE = 0.12; // s — janela de fade de cada célula antes de sumir de vez (evita um "pop" seco célula por célula)

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

/* --- líquidos (lidos do objectgroup "Liquid", tileset "liquid" no .tmx) ---
   Cada tile do tileset tem seu próprio arquivo de imagem (ex.: "water.png",
   "water_top.png") — igual botões/lasers/barreiras, não confiamos num id
   local fixo (o Tiled reindexa ids ao reimportar o tileset). Em vez disso,
   parseTMX classifica cada tile pelo NOME do arquivo em {kind, part} (ver
   liquidTileImages lá embaixo) e guarda isso em cada liquidSpawn. O
   dicionário abaixo só serve pra carregar/achar a imagem certa na hora de
   desenhar, indexado por "kind_part". */
const LIQUID_TILE_DEFS = {
  water_body:       { src: "assets/liquids/water.png",             img: null },
  water_top:        { src: "assets/liquids/water_top.png",         img: null },
  dirty_water_body: { src: "assets/liquids/dirty_water.png",       img: null },
  dirty_water_top:  { src: "assets/liquids/dirty_water_top.png",   img: null },
  slime_body:       { src: "assets/liquids/slime.png",             img: null },
  slime_top:        { src: "assets/liquids/slime_top.png",         img: null },
  lava_body:        { src: "assets/liquids/lava.png",              img: null },
  lava_top:         { src: "assets/liquids/lava_top.png",          img: null }
};
const LIQUID_ALPHA = 0.72; // transparência dos tiles de líquido ao desenhar (ver drawLiquids)

// Física/comportamento por "kind" de líquido, aplicado ao jogador enquanto
// submerso (ver updatePlayer): gravityMult/maxFall substituem PHYS.gravity/
// PHYS.maxFall (afunda mais devagar, "boiando"); swimVel é o impulso pra
// cima de cada "braçada" ao apertar o pulo submerso — diferente do pulo
// normal, não depende de estar no chão nem consome o pulo duplo, dá pra
// repetir quantas vezes quiser enquanto estiver dentro do líquido;
// speedMult reduz PHYS.moveSpeed (arrasto). damageTick > 0 causa dano
// periódico (ver LIQUID_LAVA_TICK_INVULN) enquanto o jogador estiver lá
// dentro — só a lava tem isso por padrão.
const LIQUID_KIND_DEFS = {
  water:       { gravityMult: 0.35, maxFall: 75, swimVel: -105, speedMult: 0.70, damageTick: 0 },
  dirty_water: { gravityMult: 0.35, maxFall: 75, swimVel: -105, speedMult: 0.70, damageTick: 0 },
  slime:       { gravityMult: 0.55, maxFall: 55, swimVel: -85,  speedMult: 0.45, damageTick: 0 }, // mais viscoso: afunda e nada mais devagar que a água
  lava:        { gravityMult: 0.35, maxFall: 75, swimVel: -105, speedMult: 0.55, damageTick: 8 }
};
const LIQUID_LAVA_TICK_INVULN = 0.35; // s entre ticks de dano da lava — menor que PLAYER_INVULN_TIME pra continuar doendo enquanto o jogador fica lá dentro

/* --- splash (mergulho/saída de líquido) — assets/splash/0..5.png, um
   arquivo por frame (mesmo esquema de LASER_SRC/BARRIER_SRC abaixo, não é
   um spritesheet único). Toca uma vez e some — ver spawnSplash/updateSplashes. */
const SPLASH_SRC = ["assets/splash/0.png", "assets/splash/1.png", "assets/splash/2.png", "assets/splash/3.png", "assets/splash/4.png", "assets/splash/5.png"];
const SPLASH_FPS = 14;
// Opacidade por frame (mesmo índice de SPLASH_SRC) — sobe rápido no
// impacto e depois esvai, dando a sensação de respingo se dissipando em
// vez de um sprite sólido entrando e saindo de cena. Ajuste os números
// se quiser um efeito mais/menos gradual.
const SPLASH_ALPHA = [0.85, 1, 0.85, 0.65, 0.45, 0.25];

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

  // Pode haver uma ou mais portas no objectgroup "Doors" — cada uma
  // com suas próprias propriedades Origin/Destiny no objeto (retângulo).
  const doors = [];
  const doorGroup = doc.querySelector('map > objectgroup[name="Doors"]');
  if(doorGroup){
    doorGroup.querySelectorAll("object").forEach(objEl => {
      const objProps = {};
      objEl.querySelectorAll("properties > property").forEach(p => {
        objProps[p.getAttribute("name")] = p.getAttribute("value");
      });
      doors.push({
        id: objProps["Id"],
        origin: objProps["Origin"],
        destiny: objProps["Destiny"],
        destinyDoor: objProps["DestinyDoor"],
        x: parseFloat(objEl.getAttribute("x")),
        y: parseFloat(objEl.getAttribute("y")),
        width: parseFloat(objEl.getAttribute("width")),
        height: parseFloat(objEl.getAttribute("height")),
      });
    });
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
  let barrelFirstGid = null;
  let tilesFirstGid = null;
  let tilesColumns = 1;
  let platformFirstGid = null;
  let buttonFirstGid = null;
  let laserFirstGid = null;
  let barrierFirstGid = null;
  // Para "buttons", "lasers" e "barriers" não dá pra confiar num id
  // local fixo (ex.: "id 0 é sempre o botão-de-atirar") — o Tiled
  // reindexa os ids sempre que uma imagem é trocada/reimportada no
  // tileset, então guardamos o nome do arquivo de cada <tile> e
  // decidimos o tipo por ele (ver classificação mais abaixo, ao ler
  // o objectgroup "Triggers").
  const buttonTileImages = {}; // localId -> nome do arquivo de imagem
  const laserTileImages = {};
  const barrierTileImages = {};
  // Líquidos: mesma ideia, mas já classificado em {kind, part} a partir do
  // nome do arquivo (ex.: "dirty_water_top.png" -> kind "dirty_water",
  // part "top") em vez de só guardar o nome cru — ver uso no objectgroup
  // "Liquid" mais abaixo.
  let liquidFirstGid = null;
  const liquidTileImages = {}; // localId -> {kind, part}
  // Itens coletáveis: localId -> chave do item (nome do arquivo sem .png)
  let itemsFirstGid = null;
  const itemTileKeys = {};
  doc.querySelectorAll("map > tileset").forEach(tsEl => {
    if(tsEl.getAttribute("name") === "crates") crateFirstGid = parseInt(tsEl.getAttribute("firstgid"), 10);
    if(tsEl.getAttribute("name") === "barrel") barrelFirstGid = parseInt(tsEl.getAttribute("firstgid"), 10);
    if(tsEl.getAttribute("name") === "tiles"){
      tilesFirstGid = parseInt(tsEl.getAttribute("firstgid"), 10);
      tilesColumns = parseInt(tsEl.getAttribute("columns"), 10) || 1;
    }
    if(tsEl.getAttribute("name") === "platforms") platformFirstGid = parseInt(tsEl.getAttribute("firstgid"), 10);
    if(tsEl.getAttribute("name") === "liquid"){
      liquidFirstGid = parseInt(tsEl.getAttribute("firstgid"), 10);
      tsEl.querySelectorAll("tile").forEach(tileEl => {
        const id = parseInt(tileEl.getAttribute("id"), 10);
        const imgEl = tileEl.querySelector("image");
        const filename = imgEl ? imgEl.getAttribute("source").split("/").pop() : "";
        const isTop = /_top\.png$/i.test(filename);
        const kind = filename.replace(/_top\.png$/i, "").replace(/\.png$/i, "");
        if(kind) liquidTileImages[id] = { kind, part: isTop ? "top" : "body" };
      });
    }
    if(tsEl.getAttribute("name") === "items"){
      itemsFirstGid = parseInt(tsEl.getAttribute("firstgid"), 10);
      tsEl.querySelectorAll("tile").forEach(tileEl => {
        const id = parseInt(tileEl.getAttribute("id"), 10);
        const imgEl = tileEl.querySelector("image");
        const filename = imgEl ? imgEl.getAttribute("source").split("/").pop() : "";
        itemTileKeys[id] = filename.replace(/\.png$/i, "");
      });
    }
    if(tsEl.getAttribute("name") === "buttons"){
      buttonFirstGid = parseInt(tsEl.getAttribute("firstgid"), 10);
      tsEl.querySelectorAll("tile").forEach(tileEl => {
        const id = parseInt(tileEl.getAttribute("id"), 10);
        const imgEl = tileEl.querySelector("image");
        const src = imgEl ? imgEl.getAttribute("source") : "";
        buttonTileImages[id] = src.split("/").pop(); // só o nome do arquivo
      });
    }
    if(tsEl.getAttribute("name") === "lasers"){
      laserFirstGid = parseInt(tsEl.getAttribute("firstgid"), 10);
      tsEl.querySelectorAll("tile").forEach(tileEl => {
        const id = parseInt(tileEl.getAttribute("id"), 10);
        const imgEl = tileEl.querySelector("image");
        const src = imgEl ? imgEl.getAttribute("source") : "";
        laserTileImages[id] = src.split("/").pop();
      });
    }
    if(tsEl.getAttribute("name") === "barriers"){
      barrierFirstGid = parseInt(tsEl.getAttribute("firstgid"), 10);
      tsEl.querySelectorAll("tile").forEach(tileEl => {
        const id = parseInt(tileEl.getAttribute("id"), 10);
        const imgEl = tileEl.querySelector("image");
        const src = imgEl ? imgEl.getAttribute("source") : "";
        barrierTileImages[id] = src.split("/").pop();
      });
    }
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

  // Barris explosivos: objectgroup PRÓPRIO "Barrels" (separado de
  // "Objects" de propósito — diferente das caixas, o barril NÃO é um
  // obstáculo físico: jogador e inimigo atravessam por cima dele
  // normalmente, só interage por explosão ao ser atingido por bala).
  const barrelSpawns = [];
  const barrelsGroup = doc.querySelector('map > objectgroup[name="Barrels"]');
  if(barrelsGroup && barrelFirstGid !== null){
    barrelsGroup.querySelectorAll("object").forEach(objEl => {
      const gid = objEl.hasAttribute("gid") ? parseInt(objEl.getAttribute("gid"), 10) : 0;
      if(!gid || gid - barrelFirstGid !== 0) return; // gid de outro tileset — ignora
      const w = parseFloat(objEl.getAttribute("width"));
      const h = parseFloat(objEl.getAttribute("height"));
      barrelSpawns.push({
        x: parseFloat(objEl.getAttribute("x")),
        y: parseFloat(objEl.getAttribute("y")) - h, // base -> topo
        w, h
      });
    });
  }

  // Passagens secretas: objectgroup "Secret", com o novo tileset "tiles"
  // (assets/tiles.png). A maioria dos objetos ali é só decoração
  // escondida (sem propriedade "trigger") — fica invisível e sem
  // colisão até alguém acionar um gatilho. Os poucos objetos COM a
  // propriedade "trigger" ("playerCollision" ou "bulletCollision") são
  // o gatilho em si: ficam sempre visíveis (pra dar a dica visual de
  // "aqui tem algo"), e revelam TODA a decoração escondida da mesma
  // layer quando tocados pelo jogador ou atingidos por bala.
  const secretTiles = [];
  const secretTriggers = [];
  const secretGroup = doc.querySelector('map > objectgroup[name="Secret"]');
  if(secretGroup && tilesFirstGid !== null){
    secretGroup.querySelectorAll("object").forEach(objEl => {
      const gid = objEl.hasAttribute("gid") ? parseInt(objEl.getAttribute("gid"), 10) : 0;
      if(!gid) return;
      const props = {};
      objEl.querySelectorAll("properties > property").forEach(p => {
        props[p.getAttribute("name")] = p.getAttribute("value");
      });
      const w = parseFloat(objEl.getAttribute("width"));
      const h = parseFloat(objEl.getAttribute("height"));
      const x = parseFloat(objEl.getAttribute("x"));
      const y = parseFloat(objEl.getAttribute("y")) - h; // base -> topo
      const trigger = props["trigger"] || null;
      if(trigger){
        secretTriggers.push({ x, y, w, h, gid, trigger });
      } else {
        secretTiles.push({ x, y, w, h, gid });
      }
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

  // Portas-laser e botões: objectgroup "Triggers". Cada object tem um
  // gid (do tileset "lasers" ou "buttons") e a propriedade "door" que
  // liga o botão à porta correspondente. Tile-objects são ancorados
  // no canto INFERIOR-esquerdo pelo Tiled — convertemos pra topo,
  // igual já fazemos com caixas/plataformas.
  const laserSpawns = [];
  const buttonSpawns = [];
  const triggersGroup = doc.querySelector('map > objectgroup[name="Triggers"]');
  if(triggersGroup){
    triggersGroup.querySelectorAll("object").forEach(objEl => {
      if(!objEl.hasAttribute("gid")) return;
      const gid = parseInt(objEl.getAttribute("gid"), 10);
      const props = {};
      objEl.querySelectorAll("properties > property").forEach(p => {
        props[p.getAttribute("name")] = p.getAttribute("value");
      });
      const door = props["door"] || null;
      if(!door) return; // sem porta associada — ignora
      const w = parseFloat(objEl.getAttribute("width"));
      const h = parseFloat(objEl.getAttribute("height"));
      const x = parseFloat(objEl.getAttribute("x"));
      const y = parseFloat(objEl.getAttribute("y")) - h; // base -> topo

      if(laserFirstGid !== null && laserTileImages[gid - laserFirstGid] !== undefined){
        laserSpawns.push({ x, y, w, h, door, kind: "laser" });
      } else if(barrierFirstGid !== null && barrierTileImages[gid - barrierFirstGid] !== undefined){
        laserSpawns.push({ x, y, w, h, door, kind: "barrier" });
      } else if(buttonFirstGid !== null && buttonTileImages[gid - buttonFirstGid] !== undefined){
        const img = buttonTileImages[gid - buttonFirstGid];
        // "button-N.png" é o botão-de-atirar; "on.png"/"off.png" é o switch
        const kind = /^button-\d/.test(img) ? "shoot" : "toggle";
        buttonSpawns.push({ x, y, w, h, door, kind });
      }
    });
  }

  // Líquidos: objectgroup "Liquid" — um tile-object por célula 16x16,
  // igual caixas/plataformas (ancorado no canto INFERIOR-esquerdo pelo
  // Tiled, convertemos pra topo). "kind" e "part" vêm da classificação
  // por nome de arquivo feita ali em cima (liquidTileImages).
  const liquidSpawns = [];
  const liquidGroup = doc.querySelector('map > objectgroup[name="Liquid"]');
  if(liquidGroup && liquidFirstGid !== null){
    liquidGroup.querySelectorAll("object").forEach(objEl => {
      if(!objEl.hasAttribute("gid")) return;
      const gid = parseInt(objEl.getAttribute("gid"), 10);
      const info = liquidTileImages[gid - liquidFirstGid];
      if(!info) return; // gid de outro tileset — ignora
      const w = parseFloat(objEl.getAttribute("width"));
      const h = parseFloat(objEl.getAttribute("height"));
      liquidSpawns.push({
        x: parseFloat(objEl.getAttribute("x")),
        y: parseFloat(objEl.getAttribute("y")) - h, // base -> topo
        w, h,
        kind: info.kind,
        part: info.part
      });
    });
  }

  // Itens coletáveis: objectgroup "Items", um tile-object por item. Ancorado
  // no canto INFERIOR-esquerdo pelo Tiled (y do arquivo = base), convertemos
  // pra topo igual às caixas. O "id" do objeto é único dentro do mapa e serve
  // pra lembrar o que já foi coletado (ver collectedItems).
  const itemSpawns = [];
  const itemsGroup = doc.querySelector('map > objectgroup[name="Items"]');
  if(itemsGroup && itemsFirstGid !== null){
    itemsGroup.querySelectorAll("object").forEach(objEl => {
      if(!objEl.hasAttribute("gid")) return;
      const gid = parseInt(objEl.getAttribute("gid"), 10);
      const key = itemTileKeys[gid - itemsFirstGid];
      if(!key || !ITEM_DEFS[key]) return; // gid de outro tileset ou item desconhecido
      const w = parseFloat(objEl.getAttribute("width"));
      const h = parseFloat(objEl.getAttribute("height"));
      itemSpawns.push({
        id: objEl.getAttribute("id"),
        type: key,
        x: parseFloat(objEl.getAttribute("x")),
        y: parseFloat(objEl.getAttribute("y")) - h, // base -> topo
        w, h
      });
    });
  }

  return { width, height, layers, doors, enemySpawns, crateSpawns, barrelSpawns, secretTiles, secretTriggers, tilesFirstGid, tilesColumns, platformSpawns, laserSpawns, buttonSpawns, liquidSpawns, itemSpawns };
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

// --- minimapa: variáveis declaradas aqui (em vez de perto das funções
// que as usam, lá embaixo) porque createMinimapDOM() já roda no
// carregamento do script, antes daquele trecho do arquivo ser
// executado — evitaria "temporal dead zone" se fossem let/const só ali. ---
let minimapCanvas = null;
let minimapCtx = null;
let minimapScale = 1;             // px do minimapa por px do mundo, calculado por mapa (mantém proporção)
let minimapTerrainCanvas = null;  // terreno sólido pré-desenhado (offscreen) — só recalculado ao trocar de mapa
let minimapWrap = null;           // container/overlay, só pra mostrar/esconder (ver drawMinimap)
createMinimapDOM(); // cria o <canvas> do minimapa em cima do jogo (sem precisar mexer no HTML)
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const mapLabelEl = document.getElementById('mapLabel');
const fadeEl = document.getElementById('fade');

/* ============================================================
   ÁUDIO — Web Audio API. Toda música e efeito é baixado e
   DECODIFICADO por completo em PCM durante o carregamento do jogo
   (dentro de init(), no mesmo Promise.all das imagens) — igual ao
   loadImage(). Depois disso, tocar qualquer som é só criar um
   AudioBufferSourceNode e chamar start(0): não tem rede, não tem
   decode, é praticamente instantâneo, então nunca mais trava o loop
   principal, nem no Enter nem numa troca de faixa no meio do jogo.

   Isso substitui a abordagem anterior com <audio>/HTMLMediaElement:
   lá, cada elemento tinha uma janela de "decode a frio" na primeira
   vez que tocava (mesmo com o arquivo em cache de rede), e era isso
   que travava o personagem no ar ao apertar Enter.
   ============================================================ */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const musicGain = audioCtx.createGain();
const sfxGain = audioCtx.createGain();
musicGain.connect(audioCtx.destination);
sfxGain.connect(audioCtx.destination);

let masterVolume = DEFAULT_MASTER_VOLUME;
{
  const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
  const parsed = saved !== null ? parseFloat(saved) : NaN;
  if(!isNaN(parsed)) masterVolume = Math.min(1, Math.max(0, parsed));
}
musicGain.gain.value = masterVolume * MUSIC_BASE_VOLUME;
sfxGain.gain.value = masterVolume * SFX_BASE_VOLUME;

// AudioBuffers já decodificados, por URL (música) ou nome de arquivo
// dentro de sfx/ (efeitos)
const audioBufferCache = new Map();

function loadAudioBuffer(url){
  return fetch(url)
    .then(res => res.arrayBuffer())
    .then(bytes => audioCtx.decodeAudioData(bytes))
    .then(buffer => { audioBufferCache.set(url, buffer); return buffer; });
}

// Pré-carrega TODA a música + TODOS os efeitos (inclusive as variantes
// de "pain") de uma vez. Chamado de dentro do Promise.all do init(),
// junto com as imagens — se algum som falhar, só loga o erro e segue
// (um efeito faltando não deveria derrubar o jogo inteiro).
function preloadAudio(){
  const sfxUrls = new Set();
  Object.values(SFX_FILES).forEach(entry => {
    (Array.isArray(entry) ? entry : [entry]).forEach(file => sfxUrls.add(SFX_DIR + file));
  });
  const urls = [...MUSIC_TRACKS, ...sfxUrls];
  return Promise.all(urls.map(url => loadAudioBuffer(url).catch(err => {
    console.error("Falha ao carregar áudio:", url, err);
  })));
}

// Toca o efeito sonoro identificado por uma chave de SFX_FILES. Se o
// valor for uma lista (ex.: "pain"), sorteia uma variante a cada
// chamada. Cada chamada cria seu próprio source node, então vários
// efeitos (ex.: tiros em sequência) tocam sobrepostos sem cortar um
// ao outro — sem precisar clonar elemento nenhum.
function playSfx(key){
  const entry = SFX_FILES[key];
  if(!entry) return;
  const file = Array.isArray(entry) ? entry[Math.floor(Math.random() * entry.length)] : entry;
  const buffer = audioBufferCache.get(SFX_DIR + file);
  if(!buffer) return; // não deveria acontecer depois do init(), mas não trava o jogo se acontecer
  const node = audioCtx.createBufferSource();
  node.buffer = buffer;
  node.connect(sfxGain);
  node.start(0);
}

let musicSource = null;  // source node da faixa tocando agora
let musicStarted = false;
let lastTrackIdx = -1;

function pickNextTrackIdx(){
  if(MUSIC_TRACKS.length <= 1) return 0;
  let idx;
  do { idx = Math.floor(Math.random() * MUSIC_TRACKS.length); } while(idx === lastTrackIdx);
  return idx;
}

function playNextTrack(){
  lastTrackIdx = pickNextTrackIdx();
  const buffer = audioBufferCache.get(MUSIC_TRACKS[lastTrackIdx]);
  if(!buffer) return; // não deveria acontecer depois do init()
  const node = audioCtx.createBufferSource();
  node.buffer = buffer;
  node.connect(musicGain);
  // dispara a próxima faixa quando essa termina (só se ainda for a
  // atual — evita disparo fantasma se algo trocar musicSource antes)
  node.onended = () => { if(node === musicSource) playNextTrack(); };
  musicSource = node;
  node.start(0);
}

// Chamado no Enter (gameStarted). audioCtx.resume() apenas liga a
// renderização de áudio (o navegador suspende o contexto até o
// primeiro gesto do usuário) — não baixa nem decodifica nada, já que
// os buffers foram todos preparados no loading. Por isso playNextTrack()
// aqui já sai instantâneo.
function startMusic(){
  if(musicStarted) return;
  musicStarted = true;
  audioCtx.resume().then(playNextTrack).catch(() => {});
}

let volumeFillEl = null;
let volumeIconEl = null;
function volumeIconFor(v){
  return v <= 0 ? "🔇" : (v < 0.5 ? "🔉" : "🔊");
}

function setMasterVolume(v){
  masterVolume = Math.min(1, Math.max(0, v));
  musicGain.gain.value = masterVolume * MUSIC_BASE_VOLUME;
  sfxGain.gain.value = masterVolume * SFX_BASE_VOLUME;
  localStorage.setItem(VOLUME_STORAGE_KEY, String(masterVolume));
  if(volumeFillEl) volumeFillEl.style.width = (masterVolume * 100) + "%";
  if(volumeIconEl) volumeIconEl.textContent = volumeIconFor(masterVolume);
}

// Cria o slider de volume (canto superior esquerdo) em JS puro, no
// mesmo espírito de createMinimapDOM: clique no ícone silencia/
// restaura, arrastar na barra ajusta o volume mestre (música + SFX).
function createVolumeControlDOM(){
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.left = MINIMAP_MARGIN + 'px';
  wrap.style.top = MINIMAP_MARGIN + 'px';
  wrap.style.display = 'flex';
  wrap.style.alignItems = 'center';
  wrap.style.gap = '7px';
  wrap.style.padding = '7px 9px';
  wrap.style.background = 'rgba(5,6,8,0.6)';
  wrap.style.border = '2px solid #2b2f3a';
  wrap.style.zIndex = '30';
  wrap.style.fontFamily = 'monospace';
  wrap.style.userSelect = 'none';

  volumeIconEl = document.createElement('span');
  volumeIconEl.textContent = volumeIconFor(masterVolume);
  volumeIconEl.style.cursor = 'pointer';
  volumeIconEl.style.fontSize = '14px';
  volumeIconEl.title = 'Silenciar / restaurar volume';

  const track = document.createElement('div');
  track.style.position = 'relative';
  track.style.width = '100px';
  track.style.height = '15px';
  track.style.background = '#2b2f3a';
  track.style.cursor = 'pointer';

  const fill = document.createElement('div');
  fill.style.position = 'absolute';
  fill.style.left = '0';
  fill.style.top = '0';
  fill.style.bottom = '0';
  fill.style.width = (masterVolume * 100) + '%';
  fill.style.background = '#e8c14c';
  volumeFillEl = fill;
  track.appendChild(fill);

  let preMuteVolume = masterVolume > 0 ? masterVolume : DEFAULT_MASTER_VOLUME;
  volumeIconEl.addEventListener('click', () => {
    if(masterVolume > 0){
      preMuteVolume = masterVolume;
      setMasterVolume(0);
    } else {
      setMasterVolume(preMuteVolume);
    }
  });

  function setFromClientX(clientX){
    const rect = track.getBoundingClientRect();
    setMasterVolume((clientX - rect.left) / rect.width);
  }
  let dragging = false;
  track.addEventListener('mousedown', e => { dragging = true; setFromClientX(e.clientX); });
  window.addEventListener('mousemove', e => { if(dragging) setFromClientX(e.clientX); });
  window.addEventListener('mouseup', () => { dragging = false; });
  track.addEventListener('touchstart', e => setFromClientX(e.touches[0].clientX), { passive: true });
  track.addEventListener('touchmove', e => setFromClientX(e.touches[0].clientX), { passive: true });

  wrap.appendChild(volumeIconEl);
  wrap.appendChild(track);
  document.body.appendChild(wrap);
}
createVolumeControlDOM();

/* ============================================================
   EFEITO CRT + AJUSTE DE COR — pós-processamento em WebGL
   ------------------------------------------------------------
   Como funciona: o jogo continua desenhando tudo no <canvas> 2D
   de sempre. No FIM de render() chamamos CRT.apply(), que copia
   o frame pronto (mundo + HUD) para uma textura WebGL, passa por
   dois shaders e desenha o resultado DE VOLTA no mesmo canvas.
   Por isso o resto do jogo não muda (mouse, minimapa, fade...).

   Com o CRT desligado E as cores no padrão, apply() sai logo na
   primeira linha: custo zero.

   Teclas:  C = liga/desliga o CRT   |   V = abre/fecha o painel
   ============================================================ */
const CRT = (function(){
  const STORAGE_KEY = "corredores_crt_settings"; // localStorage — lembra tudo entre sessões
  const TOGGLE_KEY = "KeyC";  // liga/desliga o efeito CRT
  const PANEL_KEY  = "KeyV";  // abre/fecha o painel de controles
  const PX = ZOOM;            // 1 "pixel do jogo" = ZOOM pixels do canvas → 1 scanline por pixel do jogo

  // [chave, rótulo, mín, máx, passo, padrão]  (padrões = valores da imagem de referência)
  const CRT_CONTROLS = [
    ["scanInt",    "Scanline Intensity",  0, 1, 0.01, 0.85],
    ["scanBright", "Scanline Brightness", 0, 1, 0.01, 0.45],
    ["ntscScan",   "NTSC Scanlines",      0, 1, 0.01, 0.15],
    ["ntscBlend",  "NTSC Blending",       0, 1, 0.01, 1.00],
    ["sharp",      "Sharpness",           0, 1, 0.01, 0.30],
    ["persist",    "Persistence",         0, 1, 0.01, 0.70],
    ["bleed",      "Bleeding",            0, 1, 0.01, 0.50],
    ["sat",        "Saturation",          0, 2, 0.01, 1.35]
  ];
  // Ajuste de cor geral — funciona com o CRT ligado OU desligado
  const COLOR_CONTROLS = [
    ["saturation", "Saturação",  0,   2,   0.01, 1],
    ["brightness", "Brilho",     0,   2,   0.01, 1],
    ["contrast",   "Contraste",  0,   2,   0.01, 1],
    ["hue",        "Hue",       -180, 180, 1,    0]
  ];

  /* ---------------- estado + persistência ---------------- */
  const state = { enabled: false, crt: {}, color: {} };
  for(const c of CRT_CONTROLS)   state.crt[c[0]]   = c[5];
  for(const c of COLOR_CONTROLS) state.color[c[0]] = c[5];
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if(saved){
      state.enabled = !!saved.enabled;
      for(const k in state.crt)   if(saved.crt   && typeof saved.crt[k]   === "number") state.crt[k]   = saved.crt[k];
      for(const k in state.color) if(saved.color && typeof saved.color[k] === "number") state.color[k] = saved.color[k];
    }
  } catch(e){ /* JSON inválido ou localStorage bloqueado: segue com os padrões */ }
  function save(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){}
  }
  function colorIsDefault(){
    return COLOR_CONTROLS.every(c => state.color[c[0]] === c[5]);
  }

  /* ---------------- shaders ---------------- */
  const VERT = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main(){
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }`;

  const COMMON = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  varying vec2 vUv;
  const mat3 RGB2YIQ = mat3(0.299, 0.596, 0.211,  0.587, -0.274, -0.523,  0.114, -0.322, 0.312);
  const mat3 YIQ2RGB = mat3(1.0, 1.0, 1.0,  0.956, -0.272, -1.106,  0.621, -0.647, 1.703);
  `;

  // PASSO A — "sinal" da TV: NTSC blending, bleeding, sharpness, saturação do CRT e persistência
  const FRAG_A = COMMON + `
  uniform sampler2D uSrc;   // frame do jogo
  uniform sampler2D uPrev;  // saída anterior deste passo (persistência do fósforo)
  uniform vec2  uRes;       // tamanho do canvas em px
  uniform float uPx;        // tamanho de 1 pixel do jogo, em px do canvas
  uniform float uNtsc;      // NTSC Scanlines
  uniform float uRowOff;    // paridade da linha do mundo no topo da tela (0 ou 1)
  uniform float uBlend;     // NTSC Blending
  uniform float uSharp;     // Sharpness
  uniform float uBleed;     // Bleeding
  uniform float uSat;       // Saturation (do CRT)
  uniform float uDecay;     // fração da luz anterior que ainda sobra neste frame
  uniform sampler2D uWorld; // frame só com o MUNDO (sem HUD) — serve pra achar onde o HUD foi desenhado
  uniform float uHasWorld;  // 1 = uWorld é válido neste frame
  uniform vec2  uCamD;      // quanto a câmera andou desde o frame anterior, em px do canvas (UV: y pra cima)
  uniform sampler2D uLock;  // máscara (alpha) do que está "preso" à câmera: jogador + plataforma em que ele está
  uniform float uHasLock;   // 1 = uLock é válido neste frame
  uniform vec2  uMaskSize;  // tamanho da máscara em pixels do jogo
  uniform float uMoving;    // 1 = a câmera andou desde o frame anterior

  vec3  gOwn;       // cor do próprio pixel (preenchido no main)
  float gOwnLock;   // 1 se o próprio pixel é "preso à câmera" (jogador / plataforma dele)

  // 1 se a posição fc (em px do canvas, coordenadas de gl_FragCoord) está "presa à câmera"
  float lockAt(vec2 fc){
    vec2 luv = vec2(fc.x / (uMaskSize.x * uPx), 1.0 - (uRes.y - fc.y) / (uMaskSize.y * uPx));
    return uHasLock * step(0.5, texture2D(uLock, luv).a);
  }

  // amostra o frame deslocado (dx, dy) em PIXELS DO JOGO.
  // Só lê pixels da MESMA camada do pixel de saída (cenário x preso à câmera). Se o tap cairia
  // na outra camada, usa o próprio pixel. Sem isso, o contorno do jogador/plataforma "vazava"
  // pros pixels vizinhos do cenário, que têm paridade diferente e trocam de lado a cada passo da
  // câmera — o contorno tremia mesmo com o miolo estável.
  //
  // A leitura do frame é BILINEAR: com deslocamento fracionário (NTSC Scanlines, Bleeding) ela mistura
  // os dois texels vizinhos. Por isso a checagem da máscara olha os DOIS lados (±0.5 px do canvas):
  // se qualquer um deles é da outra camada, o tap é descartado. Checar só o centro deixava passar
  // meio pixel do outro lado da borda, e era esse resto que ainda piscava.
  vec3 tap(float dx, float dy){
    vec3 sm = texture2D(uSrc, vUv + vec2(dx, dy) * uPx / uRes).rgb;
    if(uHasLock < 0.5) return sm;   // sem máscara neste frame: nada a checar (custo zero)
    vec2 p = gl_FragCoord.xy + vec2(dx, dy) * uPx;
    float l = max(abs(lockAt(p - vec2(0.5, 0.0)) - gOwnLock),
                  abs(lockAt(p + vec2(0.5, 0.0)) - gOwnLock));
    return mix(sm, gOwn, l);
  }

  void main(){
    // linha (contada do topo) → linhas pares/ímpares são deslocadas em sentidos
    // opostos, como os dois campos de um sinal NTSC entrelaçado
    float row = floor((uRes.y - gl_FragCoord.y) / uPx);
    // Paridade: o cenário usa a do MUNDO (uRowOff). Já o que está preso à câmera (jogador e a
    // plataforma em que ele está) usa a da TELA (0): esses ficam parados na tela enquanto a câmera
    // sobe/desce, e se a paridade deles acompanhasse a câmera, as linhas ficariam trocando de lado
    // a cada pixel de scroll (= tremor).
    gOwn     = texture2D(uSrc, vUv).rgb;
    gOwnLock = lockAt(gl_FragCoord.xy);
    float lk  = gOwnLock;
    float off = mix(uRowOff, 0.0, lk);
    float par = mod(row + off, 2.0) * 2.0 - 1.0;
    float sh  = par * uNtsc;

    vec3 c = tap(sh, 0.0);
    vec3 l = tap(sh - 1.0, 0.0);
    vec3 r = tap(sh + 1.0, 0.0);
    vec3 u = tap(sh, 1.0);
    vec3 d = tap(sh, -1.0);

    // NTSC Blending: mistura cada pixel com os vizinhos horizontais
    vec3 b = mix(c, 0.25 * l + 0.5 * c + 0.25 * r, uBlend);

    // Sharpness: realce só na luminância (dá aquele "chiado" de borda de TV)
    vec3 W = vec3(0.299, 0.587, 0.114);
    float yc   = dot(c, W);
    float yAvg = dot((l + r + u + d) * 0.25, W);
    vec3 yiq = RGB2YIQ * b;
    yiq.x += (yc - yAvg) * uSharp * 1.5;

    // Bleeding: a cor (I/Q) "escorre" pra direita do pixel, a luminância não
    vec2 iq = vec2(0.0);
    float ws = 0.0;
    for(int k = -4; k <= 4; k++){
      float fk = float(k);
      float w = exp(-fk * fk * 0.16);
      iq += (RGB2YIQ * tap(sh + (fk - 1.5) * uBleed * 1.5, 0.0)).yz * w;
      ws += w;
    }
    yiq.yz = mix(yiq.yz, iq / ws, clamp(uBleed * 3.0, 0.0, 1.0));

    // Saturation (do CRT)
    yiq.yz *= uSat;
    vec3 rgb = clamp(YIQ2RGB * yiq, 0.0, 1.0);

    // Persistence: o fósforo continua brilhando um pouco depois do frame passar.
    // O "- 0.006" impede que o 8-bit trave num resto de brilho que nunca some.
    //
    // Compensação de câmera: o histórico fica guardado em coordenadas de TELA. Se a câmera
    // andou, o mundo mudou de lugar na tela e o frame anterior apareceria deslocado (dobrando
    // a imagem e tremendo). Então lemos o histórico já deslocado pelo movimento da câmera:
    // o brilho residual acompanha o mundo, e só o que se move DE VERDADE deixa rastro.
    //
    // O que está PRESO À CÂMERA (jogador + plataforma dele) fica parado na tela, então o
    // histórico dele NÃO é deslocado (senão surgiria um fantasma deslocado a cada passo da câmera).
    // O alpha do histórico guarda a camada de cada pixel: 0 = cenário, 0.5 = preso à câmera, 1 = HUD.
    vec2 pUv = mix(vUv + uCamD / uRes, vUv, lk);
    float inside = step(0.0, pUv.x) * step(pUv.x, 1.0) * step(0.0, pUv.y) * step(pUv.y, 1.0);
    vec4 prevS = texture2D(uPrev, pUv);
    float hudP  = step(0.75, prevS.a);              // havia HUD (fixo na tela): sem fantasma dele
    float lockP = step(0.25, prevS.a) - hudP;       // estava preso à câmera
    // cenário: aceita histórico do cenário (e o "preso à câmera" só se a câmera não andou, pra
    // o rastro do jogador que se move continuar aparecendo); preso à câmera: só o dele mesmo
    float valid = mix((1.0 - hudP) * (1.0 - lockP * uMoving), lockP, lk);
    vec3 prev = prevS.rgb * (inside * valid);

    // HUD = pixels que mudaram entre "só mundo" e "mundo + HUD". Ele não tem persistência.
    vec3 wd = abs(gOwn - texture2D(uWorld, vUv).rgb);
    float hud = uHasWorld * step(0.004, max(wd.r, max(wd.g, wd.b)));

    vec3 glow = max(prev * uDecay - 0.006, 0.0);
    rgb = mix(max(rgb, glow), rgb, hud);

    gl_FragColor = vec4(rgb, max(hud, 0.5 * lk));   // alpha = camada do pixel (ver acima)
  }`;

  // PASSO B — "tela": scanlines + ajuste de cor (este último roda mesmo com o CRT desligado)
  const FRAG_B = COMMON + `
  uniform sampler2D uTex;
  uniform vec2  uRes;
  uniform float uPx;
  uniform float uCrt;         // 1 = CRT ligado
  uniform float uScanInt;     // Scanline Intensity
  uniform float uScanBright;  // Scanline Brightness
  uniform float uNtsc;        // NTSC Scanlines
  uniform float uRowOff;      // paridade da linha do mundo no topo da tela (0 ou 1)
  uniform float uSaturation;  // ajuste de cor
  uniform float uBrightness;
  uniform float uContrast;
  uniform float uHue;         // em radianos
  uniform sampler2D uLock;    // máscara do que está preso à câmera (ver passo A)
  uniform float uHasLock;
  uniform vec2  uMaskSize;

  void main(){
    vec3 c = texture2D(uTex, vUv).rgb;

    if(uCrt > 0.5){
      float rowF = (uRes.y - gl_FragCoord.y) / uPx;   // 1 unidade = 1 scanline
      float d = abs(fract(rowF) - 0.5) * 2.0;         // 0 no centro da linha, 1 no vão entre linhas
      float luma = dot(c, vec3(0.299, 0.587, 0.114));
      // Intensity = quão escuro é o vão; Brightness = quanto os pixels claros "alargam" o feixe e tapam o vão
      float dark = uScanInt * d * d * (1.0 - uScanBright * luma);
      c *= (1.0 - dark) * (1.0 + uScanInt * 0.25);    // o 2º fator devolve o brilho médio perdido
      // NTSC Scanlines: linhas ímpares um pouco mais escuras (combina com o deslocamento do passo A)
      vec2 lockUv = vec2(gl_FragCoord.x / (uMaskSize.x * uPx),
                         1.0 - (uRes.y - gl_FragCoord.y) / (uMaskSize.y * uPx));
      float lk  = uHasLock * step(0.5, texture2D(uLock, lockUv).a);
      float off = mix(uRowOff, 0.0, lk);
      c *= 1.0 - uNtsc * 0.18 * mod(floor(rowF) + off, 2.0);
    }

    // Ajuste de cor. Hue = mesma matriz do hue-rotate do CSS (gira as cores em volta do eixo do cinza)
    float cs = cos(uHue);
    float sn = sin(uHue);
    mat3 hueM = mat3(
      0.213 + cs * 0.787 - sn * 0.213,  0.213 - cs * 0.213 + sn * 0.143,  0.213 - cs * 0.213 - sn * 0.787,
      0.715 - cs * 0.715 - sn * 0.715,  0.715 + cs * 0.285 + sn * 0.140,  0.715 - cs * 0.715 + sn * 0.715,
      0.072 - cs * 0.072 + sn * 0.928,  0.072 - cs * 0.072 - sn * 0.283,  0.072 + cs * 0.928 + sn * 0.072);
    c = clamp(hueM * c, 0.0, 1.0);
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(lum), c, uSaturation);      // saturação
    c = (c - 0.5) * uContrast + 0.5;         // contraste (em volta do cinza médio)
    c *= uBrightness;                        // brilho

    gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
  }`;

  /* ---------------- WebGL ---------------- */
  let glCanvas = null, gl = null, ok = false, failed = false;
  let progA = null, progB = null, srcTex = null;
  let uA = {}, uB = {};
  const fboTex = [null, null], fbo = [null, null];
  let cur = 0;          // qual das duas texturas recebe a saída do passo A neste frame
  let lastT = 0;
  let wasCrt = false;
  let worldTex = null;       // cópia do frame só com o mundo (antes do HUD)
  let worldValid = false;    // true se snapWorld() rodou neste frame
  let lastCamX = 0, lastCamY = 0;  // câmera (inteira) do frame anterior — pra compensar a persistência
  let lockTex = null;        // máscara "preso à câmera" já na GPU
  let lockCanvas = null, lockCtx = null;  // canvas 2D pequeno (1 px = 1 pixel do jogo) onde a máscara é desenhada
  let lockValid = false;     // true se beginLock() rodou neste frame

  function compile(type, src){
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function makeProgram(fragSrc, uniformNames){
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    for(const n of uniformNames) u[n] = gl.getUniformLocation(p, n);
    return { p, u };
  }
  function makeTex(){
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function clearHistory(){
    gl.clearColor(0, 0, 0, 1);
    for(let i = 0; i < 2; i++){
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[i]);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  function allocTargets(w, h){
    for(let i = 0; i < 2; i++){
      if(fboTex[i]) gl.deleteTexture(fboTex[i]);
      if(fbo[i]) gl.deleteFramebuffer(fbo[i]);
      fboTex[i] = makeTex();
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      fbo[i] = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[i]);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex[i], 0);
    }
    clearHistory();
  }

  function initGL(){
    try {
      glCanvas = document.createElement('canvas');
      glCanvas.width = canvas.width;
      glCanvas.height = canvas.height;
      const opts = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false };
      gl = glCanvas.getContext('webgl', opts) || glCanvas.getContext('experimental-webgl', opts);
      if(!gl) throw new Error("WebGL indisponível neste navegador");
      glCanvas.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; ok = false; }); // apply() recria sozinho

      const A = makeProgram(FRAG_A, ["uSrc","uPrev","uRes","uPx","uNtsc","uRowOff","uBlend","uSharp","uBleed","uSat","uDecay","uWorld","uHasWorld","uCamD","uLock","uHasLock","uMaskSize","uMoving"]);
      const B = makeProgram(FRAG_B, ["uTex","uRes","uPx","uCrt","uScanInt","uScanBright","uNtsc","uRowOff","uSaturation","uBrightness","uContrast","uHue","uLock","uHasLock","uMaskSize"]);
      progA = A.p; uA = A.u;
      progB = B.p; uB = B.u;

      // quad de tela cheia (2 triângulos) — atributo 0 = aPos
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      srcTex = makeTex();
      worldTex = makeTex();
      gl.bindTexture(gl.TEXTURE_2D, worldTex);   // 1x1 vazio, só pra nunca ficar uma textura incompleta no sampler
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      lockTex = makeTex();
      gl.bindTexture(gl.TEXTURE_2D, lockTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);   // máscara: sem suavizar
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      allocTargets(canvas.width, canvas.height);
      ok = true;
      failed = false;
    } catch(err){
      console.warn("CRT: WebGL não pôde ser iniciado —", err);
      gl = null; ok = false; failed = true;
    }
    syncUI();
  }

  /* Chamada em render(): devolve um ctx 2D onde o jogo desenha a MÁSCARA do que está preso à câmera
     (jogador + plataforma em que ele está). Onde a máscara é opaca, o efeito NTSC usa a paridade
     de linha da TELA em vez da do mundo — assim quem fica parado na tela não treme quando a
     câmera dá um passo de 1px. Devolve null se não precisa (CRT desligado / NTSC Scanlines = 0). */
  function beginLock(){
    lockValid = false;
    if(!state.enabled || !ok || !gl || state.crt.ntscScan < 0.001) return null;
    const mw = Math.ceil(canvas.width / PX), mh = Math.ceil(canvas.height / PX);
    if(!lockCanvas){
      lockCanvas = document.createElement('canvas');
      lockCtx = lockCanvas.getContext('2d');
    }
    if(lockCanvas.width !== mw || lockCanvas.height !== mh){ lockCanvas.width = mw; lockCanvas.height = mh; }
    lockCtx.setTransform(1, 0, 0, 1, 0, 0);
    lockCtx.clearRect(0, 0, mw, mh);
    lockCtx.imageSmoothingEnabled = false;
    lockCtx.translate(-CURRENT_CAM.xInt, -CURRENT_CAM.yInt);   // mesmo sistema de coordenadas do mundo em render()
    lockValid = true;
    return lockCtx;
  }

  /* Chamada em render() logo DEPOIS de desenhar o mundo e ANTES do HUD: guarda uma cópia do
     canvas só com o mundo. O passo A compara essa cópia com o frame final pra saber onde o HUD
     está (o HUD é fixo na tela e não pode entrar na persistência compensada pela câmera). */
  function snapWorld(){
    worldValid = false;
    if(!state.enabled || !ok || !gl || state.crt.persist < 0.001) return;
    if(glCanvas.width !== canvas.width || glCanvas.height !== canvas.height) return;  // apply() redimensiona
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, worldTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.activeTexture(gl.TEXTURE0);
    worldValid = true;
  }

  /* Chamada no fim de render(): aplica CRT/cores no frame que já está no canvas. */
  function apply(){
    const needCrt = state.enabled;
    const needColor = !colorIsDefault();
    if(!needCrt && !needColor){ wasCrt = false; return; }   // nada a fazer: custo zero
    if(!gl && !failed) initGL();
    if(!ok || !gl) return;

    const w = canvas.width, h = canvas.height;
    if(glCanvas.width !== w || glCanvas.height !== h){
      glCanvas.width = w; glCanvas.height = h;
      allocTargets(w, h);
    }
    const now = performance.now();
    const dt = Math.min(0.1, Math.max(1/240, (now - lastT) / 1000));
    lastT = now;
    if(needCrt && !wasCrt) clearHistory();   // ligou agora: começa sem "fantasma" antigo

    // Quanto a câmera andou (em pixels do jogo) desde o último frame com CRT.
    let camDX = CURRENT_CAM.xInt - lastCamX, camDY = CURRENT_CAM.yInt - lastCamY;
    lastCamX = CURRENT_CAM.xInt; lastCamY = CURRENT_CAM.yInt;
    if(!wasCrt){ camDX = 0; camDY = 0; }
    // Pulo enorme (trocou de mapa, respawn...): o histórico não vale mais, recomeça limpo
    if(needCrt && (Math.abs(camDX) * PX > w * 0.25 || Math.abs(camDY) * PX > h * 0.25)){
      clearHistory(); camDX = 0; camDY = 0;
    }
    wasCrt = needCrt;

    gl.viewport(0, 0, w, h);

    // Paridade (0 ou 1) da linha do MUNDO que está no topo da tela. Some 1 a cada
    // pixel que a câmera desce/sobe, então o efeito NTSC "gruda" no conteúdo em vez de
    // ficar preso às linhas da tela (que fazia tudo tremer quando a câmera andava).
    const rowOff = ((CURRENT_CAM.yInt % 2) + 2) % 2;

    // 1) sobe o frame do canvas 2D como textura
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

    // 1b) sobe a máscara "preso à câmera" (textura 3). Sem máscara neste frame: fica a 1x1 vazia e uHasLock = 0
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, lockTex);
    if(lockValid){
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lockCanvas);
    }
    const hasLock = lockValid ? 1 : 0;
    const maskW = lockValid ? lockCanvas.width : 1, maskH = lockValid ? lockCanvas.height : 1;
    gl.activeTexture(gl.TEXTURE0);

    // 2) passo A (só com CRT ligado): frame + histórico → textura "cur"
    let finalTex = srcTex;
    if(needCrt){
      const s = state.crt;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[cur]);
      gl.useProgram(progA);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, fboTex[1 - cur]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, srcTex);
      gl.uniform1i(uA.uSrc, 0);
      gl.uniform1i(uA.uPrev, 1);
      gl.uniform2f(uA.uRes, w, h);
      gl.uniform1f(uA.uPx, PX);
      gl.uniform1f(uA.uNtsc, s.ntscScan);
      gl.uniform1f(uA.uRowOff, rowOff);
      gl.uniform1f(uA.uBlend, s.ntscBlend);
      gl.uniform1f(uA.uSharp, s.sharp);
      gl.uniform1f(uA.uBleed, s.bleed);
      gl.uniform1f(uA.uSat, s.sat);
      gl.uniform1f(uA.uDecay, Math.pow(s.persist * 0.9, dt * 60));   // independe do FPS
      gl.uniform2f(uA.uCamD, camDX * PX, -camDY * PX);   // y invertido: canvas cresce pra baixo, UV pra cima
      gl.uniform1f(uA.uMoving, (camDX !== 0 || camDY !== 0) ? 1 : 0);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, worldTex);
      gl.uniform1i(uA.uWorld, 2);
      gl.uniform1f(uA.uHasWorld, worldValid ? 1 : 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(uA.uLock, 3);
      gl.uniform1f(uA.uHasLock, hasLock);
      gl.uniform2f(uA.uMaskSize, maskW, maskH);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      finalTex = fboTex[cur];
      cur = 1 - cur;
    }

    // 3) passo B: scanlines + cores → tela do WebGL
    const s = state.crt, k = state.color;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(progB);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, finalTex);
    gl.uniform1i(uB.uTex, 0);
    gl.uniform2f(uB.uRes, w, h);
    gl.uniform1f(uB.uPx, PX);
    gl.uniform1f(uB.uCrt, needCrt ? 1 : 0);
    gl.uniform1f(uB.uScanInt, s.scanInt);
    gl.uniform1f(uB.uScanBright, s.scanBright);
    gl.uniform1f(uB.uNtsc, s.ntscScan);
    gl.uniform1f(uB.uRowOff, rowOff);
    gl.uniform1f(uB.uSaturation, k.saturation);
    gl.uniform1f(uB.uBrightness, k.brightness);
    gl.uniform1f(uB.uContrast, k.contrast);
    gl.uniform1f(uB.uHue, k.hue * Math.PI / 180);
    gl.uniform1i(uB.uLock, 3);
    gl.uniform1f(uB.uHasLock, hasLock);
    gl.uniform2f(uB.uMaskSize, maskW, maskH);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 4) devolve o resultado pro canvas do jogo ('copy' = substitui, sem misturar)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage(glCanvas, 0, 0);
    ctx.restore();
    worldValid = false;
    lockValid = false;
  }

  /* ---------------- painel de controles (DOM em JS puro) ---------------- */
  let btnEl = null, panelEl = null, onoffEl = null, msgEl = null;
  const tabs = {}, bodies = {}, sliderRows = [];

  function setEnabled(v){
    state.enabled = !!v;
    if(state.enabled && !gl && !failed) initGL();   // já descobre agora se o WebGL funciona
    syncUI();
    save();
  }
  function togglePanel(){
    if(!panelEl) return;
    panelEl.style.display = panelEl.style.display === 'none' ? 'block' : 'none';
  }
  function showTab(name){
    for(const n in tabs){
      tabs[n].classList.toggle('sel', n === name);
      bodies[n].style.display = n === name ? 'block' : 'none';
    }
  }
  function syncUI(){
    if(!panelEl) return;
    onoffEl.textContent = 'CRT: ' + (state.enabled ? 'LIGADO' : 'DESLIGADO') + '  (tecla C)';
    onoffEl.classList.toggle('on', state.enabled);
    btnEl.classList.toggle('on', state.enabled);
    msgEl.style.display = failed ? 'block' : 'none';
    msgEl.textContent = failed ? 'WebGL indisponível neste navegador — o efeito não pode ser aplicado.' : '';
  }
  const fmtVal = (step, v) => step >= 1 ? Math.round(v) + '°' : Number(v).toFixed(2);

  function makeRow(group, ctrl){
    const key = ctrl[0], label = ctrl[1], min = ctrl[2], max = ctrl[3], step = ctrl[4], def = ctrl[5];
    const row = document.createElement('div');
    row.className = 'crt-row';
    const lb = document.createElement('span');
    lb.className = 'crt-label';
    lb.textContent = label;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min; input.max = max; input.step = step;
    input.value = state[group][key];
    const val = document.createElement('span');
    val.className = 'crt-val';
    val.textContent = fmtVal(step, state[group][key]);
    input.addEventListener('input', () => {
      state[group][key] = parseFloat(input.value);
      val.textContent = fmtVal(step, state[group][key]);
      save();
    });
    input.addEventListener('dblclick', () => resetRow(r));   // duplo clique = volta esse slider ao padrão
    // tira o foco ao soltar: senão as setas do teclado ficariam mexendo no slider em vez do personagem
    input.addEventListener('pointerup', () => input.blur());
    row.append(lb, input, val);
    const r = { group, key, def, step, input, val };
    sliderRows.push(r);
    return { row, r };
  }
  function resetRow(r){
    state[r.group][r.key] = r.def;
    r.input.value = r.def;
    r.val.textContent = fmtVal(r.step, r.def);
    save();
  }
  function resetGroup(group){
    for(const r of sliderRows) if(r.group === group) resetRow(r);
  }
  function makeButton(text, onClick){
    const b = document.createElement('div');   // div (e não <button>) pra nunca roubar o foco do teclado
    b.className = 'crt-btn';
    b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
  }

  function buildUI(){
    const style = document.createElement('style');
    style.textContent = `
    #crtBtn{position:fixed;left:${MINIMAP_MARGIN}px;top:${MINIMAP_MARGIN + 44}px;z-index:30;width:35px;height:35px;
      display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;user-select:none;
      background:rgba(5,6,8,0.6);border:2px solid #2b2f3a;}
    #crtBtn.on{border-color:#e8c14c;}
    #crtPanel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:30;width:350px;max-height:90vh;overflow-y:auto;padding:10px 12px 10px;
          background:rgba(5,6,8,0.78);border:2px solid #2b2f3a;font-family:monospace;user-select:none;}
    #crtPanel .crt-tabs{display:flex;gap:6px;margin-bottom:10px;}
    #crtPanel .crt-tab{flex:1;text-align:center;padding:4px 0;cursor:pointer;color:#8b93a6;font:bold 12px monospace;border:2px solid #2b2f3a;}
    #crtPanel .crt-tab.sel{color:#e8c14c;border-color:#e8c14c;}
    #crtPanel .crt-btn{text-align:center;padding:5px 8px;margin-top:8px;cursor:pointer;color:#dfe6f0;font:bold 12px monospace;border:2px solid #2b2f3a;}
    #crtPanel .crt-btn:hover{border-color:#8b93a6;}
    #crtPanel .crt-btn.on{color:#e8c14c;border-color:#e8c14c;}
    #crtPanel .crt-msg{color:#ff8a7a;font:12px monospace;margin-top:8px;}
    #crtPanel .crt-row{display:grid;grid-template-columns:150px 1fr 44px;gap:8px;align-items:center;margin:7px 0;}
    #crtPanel .crt-label,#crtPanel .crt-val{color:#fff;font:bold 12px monospace;
      text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;}
    #crtPanel .crt-val{text-align:right;}
    #crtPanel input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:16px;margin:0;background:transparent;cursor:pointer;}
    #crtPanel input[type=range]::-webkit-slider-runnable-track{height:6px;background:#3a3f4c;border:1px solid #000;}
    #crtPanel input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;box-sizing:border-box;width:10px;height:16px;margin-top:-6px;background:#dfe6f0;border:2px solid #000;}
    #crtPanel input[type=range]::-moz-range-track{height:6px;background:#3a3f4c;border:1px solid #000;}
    #crtPanel input[type=range]::-moz-range-thumb{box-sizing:border-box;width:10px;height:16px;border-radius:0;background:#dfe6f0;border:2px solid #000;}
    `;
    document.head.appendChild(style);

    btnEl = document.createElement('div');
    btnEl.id = 'crtBtn';
    btnEl.textContent = '📺';
    btnEl.title = 'Painel de CRT / cores (tecla V)';
    btnEl.addEventListener('click', togglePanel);

    panelEl = document.createElement('div');
    panelEl.id = 'crtPanel';
    panelEl.style.display = 'none';
    panelEl.addEventListener('mousedown', e => e.stopPropagation());

    const tabBar = document.createElement('div');
    tabBar.className = 'crt-tabs';
    for(const [name, text] of [['crt', 'CRT'], ['color', 'Cores']]){
      const t = document.createElement('div');
      t.className = 'crt-tab';
      t.textContent = text;
      t.addEventListener('click', () => showTab(name));
      tabs[name] = t;
      tabBar.appendChild(t);
    }
    panelEl.appendChild(tabBar);

    // aba CRT
    bodies.crt = document.createElement('div');
    onoffEl = makeButton('', () => setEnabled(!state.enabled));
    onoffEl.style.marginTop = '0';
    bodies.crt.appendChild(onoffEl);
    msgEl = document.createElement('div');
    msgEl.className = 'crt-msg';
    msgEl.style.display = 'none';
    bodies.crt.appendChild(msgEl);
    for(const c of CRT_CONTROLS) bodies.crt.appendChild(makeRow('crt', c).row);
    bodies.crt.appendChild(makeButton('Restaurar padrão', () => resetGroup('crt')));

    // aba Cores
    bodies.color = document.createElement('div');
    for(const c of COLOR_CONTROLS) bodies.color.appendChild(makeRow('color', c).row);
    bodies.color.appendChild(makeButton('Restaurar padrão', () => resetGroup('color')));

    panelEl.appendChild(bodies.crt);
    panelEl.appendChild(bodies.color);
    document.body.appendChild(btnEl);
    document.body.appendChild(panelEl);
    showTab('crt');
    syncUI();
  }
  buildUI();

  window.addEventListener('keydown', e => {
    if(e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.code === TOGGLE_KEY) setEnabled(!state.enabled);
    else if(e.code === PANEL_KEY) togglePanel();
  });

  return { apply, snapWorld, beginLock, setEnabled, togglePanel, state };
})();


const keys = {};
let interactRequested = false;
let jumpRequested = false; // one-shot: true só no frame do keydown (não repete com a tecla segurada), consumido ao processar o pulo
let dashRequested = false; // one-shot, mesmo esquema do jumpRequested — ver DASH_KEY
// true = dentro de líquido o jogador boia/nada (gravidade reduzida, pulo
// vira braçada, arrasto — ver LIQUID_KIND_DEFS); false = líquido fica só
// decorativo (transparência/splash continuam, mas o jogador se move como
// se estivesse fora d'água, física normal do PHYS). Alternável em
// runtime com LIQUID_PHYSICS_TOGGLE_KEY, pra comparar os dois modos sem
// precisar editar código. Note que o dano da lava também é desligado
// junto (faz parte da mesma "física especial" do líquido); se quiser que
// a lava continue machucando mesmo com isso desligado, é só destacar
// aquele bloco em updatePlayer pra fora do "if(liquidDef)".
let liquidPhysicsEnabled = true;
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if(e.code === INTERACT_KEY) interactRequested = true;
  if((e.code === "Space" || e.code === "KeyW") && !e.repeat) jumpRequested = true;
  if(e.code === DASH_KEY && !e.repeat) dashRequested = true;
  if(e.code === "Tab"){
    e.preventDefault(); // Tab não pode mover o foco do navegador
    if(!e.repeat && canUseHud()) cycleWeapon();
  }
  if(e.code === BACKPACK_TOGGLE_KEY && !e.repeat && gameStarted) toggleBackpack();
  const hotkeyIdx = BACKPACK_HOTKEYS.indexOf(e.code);
  if(hotkeyIdx !== -1 && !e.repeat && canUseHud()) useConsumable(BACKPACK_ORDER[hotkeyIdx]);
  if(e.code === LIQUID_PHYSICS_TOGGLE_KEY && !e.repeat){
    liquidPhysicsEnabled = !liquidPhysicsEnabled;
    console.log("Física de líquidos:", liquidPhysicsEnabled ? "LIGADA" : "DESLIGADA");
  }
  if(["ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

let tilesetImg = null;
let doorImg = null;
let gunImg = null;
let bulletImg = null;
let chainGunImg = null; // braço do boss (ver ENEMY_TYPES.boss.armImg)
let bullet2Img = null;  // bala do boss (ver ENEMY_TYPES.boss.bulletImg)
let shotgunImg = null;  // braço do gladiator (ver ENEMY_TYPES.gladiator.armImg)
let bullet3Img = null;  // bala do gladiator (ver ENEMY_TYPES.gladiator.bulletImg)
let ladderImg = null;
let laserImgs = [];          // frames 0..3 (0=ligado .. 3=desligado)
let barrierImgs = [];        // frames 0..8 (0=fechada .. 8=totalmente aberta)
let buttonShootImgs = [];    // frames 0..4 (0=ligado .. 4=apagado de vez)
let buttonToggleOnImg = null;
let buttonToggleOffImg = null;
let splashImgs = [];         // frames 0..5 (ver SPLASH_SRC) — animação de mergulho/saída da água
let barrelImg = null;
let tilesImg = null;         // assets/tiles.png (tileset "tiles") — tiles da passagem secreta + os novos tiles da layer Platforms
let explosionImgs = [];      // frames 0..9 (ver EXPLOSION_SRC) — animação de explosão do barril
let crateExplosionImgs = []; // frames 0..9 (ver CRATE_EXPLOSION_SRC) — animação de explosão da caixa
let MAPS_RAW = null; // { map1: {width,height,layers,doors,enemySpawns}, map2: {...} }

let currentMapId = "map1";
let currentMap = null;
let doorCooldown = 0;   // evita re-trigger imediato ao trocar de mapa
let nearDoor = null;    // porta (objeto) perto do jogador agora, ou null — usado pelo indicador visual

// --- transição de mapa (fade in/out) ---
const MAP_FADE_TIME = 0.28; // segundos de cada metade (ida/volta)
let transitioning = false;
let transitionPhase = null; // "out" | "in"
let transitionTimer = 0;
let pendingDestiny = null;
let pendingDestinyDoor = null;
let promptT = 0;        // tempo acumulado p/ animação do indicador

let shootCooldown = 0;  // tempo restante até poder disparar de novo (jogador)
let bullets = [];       // {x,y,vx,vy,t,owner} — owner: "player" | "enemy"
let enemies = [];       // inimigos vivos do mapa atual
let crates = [];        // caixas vivas do mapa atual
let barrels = [];       // barris explosivos vivos do mapa atual
let explosions = [];    // efeitos de explosão ativos: {x, y, frame, timer} — ver spawnExplosion
let secretTiles = [];        // parede/decoração da passagem secreta do mapa atual: {x,y,w,h,gid} — visível e SÓLIDA até o gatilho abrir a passagem (secretOpened=true)
let liveSecretTriggers = []; // gatilhos vivos do mapa atual: {x,y,w,h,gid,trigger}
let secretOpened = false;    // true assim que QUALQUER gatilho dispara — libera a passagem NA HORA (física e pra não bloquear mais o jogador); a partir daqui é só resquício visual
let secretDissolving = false; // true durante a janela SECRET_DISSOLVE_TIME logo após o gatilho disparar — controla só a desfragmentação em células do desenho do tile (efeito visual, não bloqueia nem libera nada)
let secretDissolveT = 0;      // cronômetro (s) da desfragmentação, 0..SECRET_DISSOLVE_TIME
let loots = [];         // itens dropados, caindo ou já no chão
let livePlatforms = []; // plataformas one-way vivas do mapa atual (estática/elevador/circular)
let liveLasers = [];    // portas-laser vivas do mapa atual (objectgroup "Triggers")
let liveButtons = [];   // botões vivos do mapa atual (objectgroup "Triggers")
let nearButton = null;  // botão "toggle" perto do jogador agora (indicador visual "E")
let liveLiquids = [];   // tiles de líquido vivos do mapa atual (objectgroup "Liquid"), já com a imagem resolvida
let splashes = [];      // efeitos de splash ativos: {x, y, frame, timer} — ver spawnSplash
let liveItems = [];     // itens coletáveis ainda no chão do mapa atual (objectgroup "Items")

const player = {
  x: 0, y: 0,
  w: 12, h: PLAYER_STAND_H,   // hitbox de colisão (menor que o sprite, ajustada ao contorno do personagem)
  vx: 0, vy: 0,
  onGround: false,
  facing: 1,
  crouching: false, // true enquanto agachado (Ctrl + Baixo) — ver updatePlayer/canStandUp
  dashing: false,   // true durante o dash (Z) — ver updatePlayer
  dashT: 0,         // tempo restante do dash atual
  dashCooldown: 0,  // tempo até poder dar outro dash
  dashBlinkT: 0,    // tempo restante do efeito visual de piscar durante o dash (só visual, não dá i-frames — ver isBlinkHidden)
  animState: "idle",
  animFrame: 0,
  animTimer: 0,
  coyoteTimer: 0,   // tempo restante em que ainda é possível pular após sair do chão
  canDoubleJump: false,  // true depois do 1º pulo, até usar o 2º pulo no ar ou pousar de novo
  doubleJumping: false,  // true só durante 1 ciclo da animação doubleJump, ao acionar o 2º pulo
  doubleJumpAnimTimer: 0, // tempo restante desse ciclo (ver PHYS/ANIMS.doubleJump) — ao zerar, desliga doubleJumping mesmo se ainda estiver no ar
  hp: PLAYER_MAX_HP,
  maxHp: PLAYER_MAX_HP,
  invulnT: 0,        // tempo restante de invencibilidade após tomar dano
  ridingPlatform: null,  // plataforma one-way em que está em cima agora (ver resolveOneWayY)
  dropThroughTimer: 0,   // > 0 enquanto ignora plataformas one-way (Shift+Baixo pra cair)
  climbing: false,        // true enquanto preso/escalando uma escada
  ladderRegrabTimer: 0,   // > 0 logo após pular fora da escada, evita regarrar na hora
  ladderExitPlatform: null, // plataforma one-way sendo "atravessada pra baixo" ao entrar numa escada logo abaixo dela
  inLiquid: false,  // true quando o CENTRO da hitbox está dentro de um tile de líquido — ver updatePlayer
  liquidKind: null, // "water" | "dirty_water" | "slime" | "lava" | null — ver LIQUID_KIND_DEFS
  shield: 0,          // escudo do colete (jacket): absorve dano antes do HP — ver damagePlayer
  speedBoostT: 0,     // tempo restante da adrenalina
  invulnPowerT: 0,    // tempo restante da invulnerabilidade (item) — separado de invulnT (i-frames pós-dano)
  weapons: ["pistol"], // armas que o jogador possui (chaves de WEAPON_DEFS)
  weaponIdx: 0        // índice da arma equipada em player.weapons
};
let gameOver = false;
let victory = false; // true quando o boss é derrotado (usa a mesma tela do gameOver)
let gameStarted = false;

const PHYS = {
  gravity: 900,
  moveSpeed: 95,
  jumpVel: -300,
  doubleJumpVel: -300,  // impulso do 2º pulo (ar) — igual ao 1º por padrão, pode ajustar à parte
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
    doors: raw.doors || [],
    enemySpawns: raw.enemySpawns || [],
    crateSpawns: raw.crateSpawns || [],
    barrelSpawns: raw.barrelSpawns || [],
    secretTiles: raw.secretTiles || [],
    secretTriggers: raw.secretTriggers || [],
    tilesFirstGid: raw.tilesFirstGid,
    tilesColumns: raw.tilesColumns,
    platformSpawns: raw.platformSpawns || [],
    laserSpawns: raw.laserSpawns || [],
    buttonSpawns: raw.buttonSpawns || [],
    liquidSpawns: raw.liquidSpawns || [],
    itemSpawns: raw.itemSpawns || [],
    // Índice col,row -> kind do líquido, pra consulta O(1) na física (ver
    // liquidKindAt). Os líquidos não vêm de uma layer de tiles regular
    // como o chão (são tile-objects do objectgroup "Liquid", que podem
    // ter buracos), por isso o índice é montado à parte em vez de só
    // reusar tileAt/isSolidTile.
    liquidLookup: buildLiquidLookup(raw.liquidSpawns || []),
    // Mesma ideia, mas pros tiles da parede/decoração da passagem
    // secreta: cada tile ocupa exatamente 1 célula da grade (16x16),
    // então dá pra indexar por col,row e simplesmente somar essa
    // checagem em isSolidTile() — assim TODO código de colisão que já
    // existe (jogador, inimigo, bala, IA) passa a respeitar a
    // parede/gatilho que bloqueia a passagem até ela abrir, sem
    // duplicar lógica. Inclui a decoração inteira MAIS os gatilhos do
    // tipo "bulletCollision" (esses também bloqueiam fisicamente até
    // levar um tiro — diferente do "playerCollision", que precisa ficar
    // sempre atravessável pro jogador conseguir tocar nele).
    secretLookup: buildSecretLookup(
      (raw.secretTiles || []).concat((raw.secretTriggers || []).filter(t => t.trigger === "bulletCollision"))
    )
  };
}

function buildSecretLookup(secretTiles){
  const lookup = {};
  for(const t of secretTiles){
    const col = Math.round(t.x / TILE);
    const row = Math.round(t.y / TILE);
    lookup[col + "," + row] = t.gid;
  }
  return lookup;
}

function buildLiquidLookup(liquidSpawns){
  const lookup = {};
  for(const l of liquidSpawns){
    const col = Math.round(l.x / TILE);
    const row = Math.round(l.y / TILE);
    lookup[col + "," + row] = l.kind;
  }
  return lookup;
}

// Retorna o "kind" do líquido (ex.: "water", "lava") no tile que contém o
// ponto do mundo dado, ou null se não houver líquido ali.
function liquidKindAt(mapData, worldX, worldY){
  const col = Math.floor(worldX / TILE);
  const row = Math.floor(worldY / TILE);
  return mapData.liquidLookup[col + "," + row] || null;
}

// Sobe pela coluna de worldX, a partir do tile de worldY, até achar o
// tile de líquido mais alto da poça (a "superfície" de verdade) — usado
// pra posicionar o splash sempre no topo, mesmo quando a transição foi
// detectada em algum tile mais abaixo (ex.: o jogador entrando de lado,
// não de cima). Retorna a borda de cima desse tile.
function liquidSurfaceY(mapData, worldX, worldY){
  const col = Math.floor(worldX / TILE);
  let row = Math.floor(worldY / TILE);
  while(mapData.liquidLookup[col + "," + (row - 1)] !== undefined) row--;
  return row * TILE;
}

function tileAt(layer, mapData, col, row){
  if(col < 0 || row < 0 || col >= mapData.width || row >= mapData.height) return 0;
  return layer[row * mapData.width + col];
}

function isSolidTile(mapData, worldX, worldY){
  const col = Math.floor(worldX / TILE);
  const row = Math.floor(worldY / TILE);
  if(tileAt(mapData.platforms, mapData, col, row) !== 0) return true;
  // Parede/decoração da passagem secreta: bloqueia (sólida) até algum
  // gatilho abrir a passagem — ver openSecretPassage().
  if(!secretOpened && mapData.secretLookup[col + "," + row] !== undefined) return true;
  return false;
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

function spawnAtDoor(mapData, fromMapId, destinyDoorId){
  // Com várias portas por mapa, usa a que tem Origin == mapa de onde o
  // jogador veio (a porta "de volta"); se não achar (ex.: primeiro
  // spawn do jogo), cai pra primeira porta do mapa.
  const doors = mapData.doors || [];
  const d = (destinyDoorId && doors.find(door => door.id === destinyDoorId))
    || doors.find(door => door.origin === fromMapId)
    || doors[0]
    || null;
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

  player.ridingPlatform = null;
  if(groundY !== null){
    for(const p of livePlatforms){
      if(feetCenterX >= p.x && feetCenterX <= p.x + p.w && Math.abs(p.y - groundY) < 0.01){
        player.ridingPlatform = p;
        break;
      }
    }
  }

  player.vx = 0;
  player.vy = 0;
  player.facing = pushDir;
  player.onGround = true;
  player.coyoteTimer = PHYS.coyoteTime;
  player.invulnT = 0;
}

function goToMap(destinyId, destinyDoorId){
  const fromMapId = currentMapId; // captura antes de sobrescrever abaixo
  currentMap = prepareMap(destinyId);
  currentMapId = destinyId;
  bakeMinimapTerrain(currentMap); // mapa de destino pode ter dimensões diferentes do anterior
  mapLabelEl.textContent = destinyId;
  spawnPlatforms(currentMap);
  spawnAtDoor(currentMap, fromMapId, destinyDoorId);
  spawnEnemies(currentMap);
  spawnCrates(currentMap);
  spawnBarrels(currentMap);
  spawnSecrets(currentMap);
  spawnTriggers(currentMap);
  spawnLiquids(currentMap);
  spawnItems(currentMap);
  doorCooldown = 0.5;
  nearDoor = null;
  bullets = []; // balas não atravessam a troca de mapa
  loots = [];   // nem itens dropados
  explosions = []; // nem explosões em andamento
}

// Inicia a transição visual: escurece a tela, troca o mapa quando
// estiver totalmente preta, e depois clareia de volta. O jogo fica
// "congelado" (sem update de player/inimigos/balas) durante todo o
// processo — ver loop().
function startMapTransition(destinyId, destinyDoorId){
  if(transitioning) return; // já trocando, ignora novo trigger
  transitioning = true;
  transitionPhase = "out";
  transitionTimer = 0;
  pendingDestiny = destinyId;
  pendingDestinyDoor = destinyDoorId;
  playSfx('door');
}

function updateMapTransition(dt){
  transitionTimer += dt;
  const t = Math.min(1, transitionTimer / MAP_FADE_TIME);

  if(transitionPhase === "out"){
    fadeEl.style.opacity = String(t);
    if(t >= 1){
      goToMap(pendingDestiny, pendingDestinyDoor);
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
      pendingDestinyDoor = null;
    }
  }
}

/* ============================================================
   INIMIGOS (lidos da camada de objetos "Enemies" do .tmx)
   ============================================================ */
function makeEnemy(spawn){
  const def = ENEMY_TYPES[spawn.type];
  return {
    type: spawn.type,
    x: 0, y: 0,
    w: def.w, h: def.h,
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
    hp: def.maxHp,
    maxHp: def.maxHp,
    ridingPlatform: null      // plataforma one-way em que está em cima agora (ver resolveOneWayY)
  };
}

function spawnEnemies(mapData){
  enemies = [];
  for(const spawn of mapData.enemySpawns){
    if(!ENEMY_TYPES[spawn.type]) continue; // tipo desconhecido/não implementado: ignora
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
    const centerX = crate.x + crate.w/2;
    const centerY = crate.y + crate.h/2;
    if(crate.loot) spawnLoot(crate.loot, centerX, centerY);
    spawnExplosion(centerX, centerY, "crate");
    playSfx('boxExplosion');
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
   BARRIS EXPLOSIVOS (lidos do objectgroup próprio "Barrels")
   ============================================================ */
function spawnBarrels(mapData){
  barrels = [];
  for(const spawn of mapData.barrelSpawns){
    barrels.push({ x: spawn.x, y: spawn.y, w: spawn.w, h: spawn.h, fuseTimer: null }); // fuseTimer: null = normal; número = contagiado, contando pra explodir (ver updateBarrels)
  }
}

// Retorna o barril vivo (se houver) que contém o ponto do mundo dado —
// mesma forma de crateAt().
function barrelAt(worldX, worldY){
  for(const b of barrels){
    if(worldX >= b.x && worldX < b.x + b.w && worldY >= b.y && worldY < b.y + b.h) return b;
  }
  return null;
}

// Chamado quando uma bala (do jogador OU do inimigo) acerta um barril.
// Elipse em vez de círculo: como BARREL_EXPLOSION_RADIUS_Y é maior que
// BARREL_EXPLOSION_RADIUS_X, o alcance vertical do dano acompanha a
// nuvem subindo bem mais alto do que se espalhando pros lados.
function inBarrelBlast(dx, dy){
  return (dx*dx) / (BARREL_EXPLOSION_RADIUS_X*BARREL_EXPLOSION_RADIUS_X) +
         (dy*dy) / (BARREL_EXPLOSION_RADIUS_Y*BARREL_EXPLOSION_RADIUS_Y) <= 1;
}

// Remove o barril, cria o efeito visual de explosão e causa dano em
// área tanto no jogador quanto nos inimigos que estiverem dentro do
// raio — igual um "tiro amigo" reverso: um inimigo pode se ferir (ou
// ferir o jogador) atirando num barril perto de qualquer um dos dois.
function explodeBarrel(barrel){
  const idx = barrels.indexOf(barrel);
  if(idx === -1) return; // segurança: já processado neste frame
  barrels.splice(idx, 1);

  const centerX = barrel.x + barrel.w/2;
  const centerY = barrel.y + barrel.h/2;
  spawnExplosion(centerX, barrel.y + barrel.h);
  playSfx('barrelExplosion');

  if(!gameOver && player.invulnT <= 0){
    const dx = (player.x + player.w/2) - centerX;
    const dy = (player.y + player.h/2) - centerY;
    if(inBarrelBlast(dx, dy)){
      damagePlayer(BARREL_EXPLOSION_DAMAGE_PLAYER, PLAYER_INVULN_TIME);
    }
  }

  for(let i = enemies.length - 1; i >= 0; i--){
    const enemy = enemies[i];
    const dx = (enemy.x + enemy.w/2) - centerX;
    const dy = (enemy.y + enemy.h/2) - centerY;
    if(inBarrelBlast(dx, dy)){
      enemy.hp -= BARREL_EXPLOSION_DAMAGE_ENEMY;
      if(enemy.hp <= 0){
        playSfx(enemy.type === "boss" ? 'bossDeath' : enemy.type === "gladiator" ? 'enemy2death' : 'enemy1death');
        enemies.splice(i, 1);
        if(enemy.type === "boss") winGame();
      } else playSfx('pain');
    }
  }

  // Reação em cadeia: qualquer outro barril ainda vivo dentro do raio
  // de contágio (BARREL_CHAIN_RADIUS, medido centro a centro) não
  // explode na hora — só começa a "pegar fogo" (fuseTimer), e é
  // updateBarrels() que efetivamente detona depois do atraso. Isso dá
  // o efeito dominó (um estoura o próximo, que estoura o próximo...)
  // em vez de todos sumirem juntos no mesmo frame.
  for(const other of barrels){
    if(other.fuseTimer !== null) continue; // já contagiado por outra explosão nesta mesma cadeia
    const dx = (other.x + other.w/2) - centerX;
    const dy = (other.y + other.h/2) - centerY;
    if(Math.hypot(dx, dy) <= BARREL_CHAIN_RADIUS) other.fuseTimer = BARREL_CHAIN_DELAY;
  }
}

function updateBarrels(dt){
  for(let i = barrels.length - 1; i >= 0; i--){
    const b = barrels[i];
    if(b.fuseTimer === null) continue;
    b.fuseTimer -= dt;
    if(b.fuseTimer <= 0) explodeBarrel(b);
  }
}

/* ============================================================
   PASSAGENS SECRETAS (objectgroup "Secret")
   ============================================================ */
function spawnSecrets(mapData){
  secretTiles = mapData.secretTiles.map(t => ({ ...t }));
  liveSecretTriggers = mapData.secretTriggers.map(t => ({ ...t }));
  secretOpened = false;
  secretDissolving = false;
  secretDissolveT = 0;
}

// Monta, pra um tile de w x h, a grade de células (SECRET_DISSOLVE_CELL
// px cada) usada na desfragmentação: cada célula recebe um instante
// aleatório dentro de 0..SECRET_DISSOLVE_TIME em que "desaparece",
// então o tile inteiro vai se desfazendo célula por célula em ordem
// embaralhada, sem sair do lugar. Guardado direto no objeto do tile
// (t._dissolve) pra drawSecretTile usar.
function buildDissolveCells(t){
  const cellCols = Math.max(1, Math.round(t.w / SECRET_DISSOLVE_CELL));
  const cellRows = Math.max(1, Math.round(t.h / SECRET_DISSOLVE_CELL));
  const vanish = new Array(cellCols * cellRows);
  for(let i = 0; i < vanish.length; i++) vanish[i] = Math.random() * SECRET_DISSOLVE_TIME;
  t._dissolve = { cellCols, cellRows, vanish };
}

// Chamada por QUALQUER gatilho (playerCollision em updateSecrets, ou
// bulletCollision em updateBullets) — libera a passagem secreta inteira
// do mapa atual NA HORA (secretOpened=true já desbloqueia fisicamente,
// sem segurar o jogador esperando animação nenhuma). O que continua
// depois disso é só efeito visual: cada tile se desfragmenta em
// células ao longo de SECRET_DISSOLVE_TIME (ver buildDissolveCells /
// drawSecretTile), parado no lugar. Idempotente: se já tinha aberto,
// não faz nada.
function openSecretPassage(){
  if(secretOpened) return;
  secretOpened = true;
  secretDissolving = true;
  secretDissolveT = 0;
  playSfx('secret');
  for(const t of secretTiles.concat(liveSecretTriggers)) buildDissolveCells(t);
}

// Cuida do lado "playerCollision" (bulletCollision é tratado junto com
// o resto da física de bala em updateBullets, mesmo esquema do botão de
// atirar/barril) E avança o cronômetro da desfragmentação depois que
// QUALQUER gatilho dispara.
function updateSecrets(dt){
  if(secretDissolving){
    secretDissolveT += dt;
    if(secretDissolveT >= SECRET_DISSOLVE_TIME) secretDissolving = false;
  }
  if(secretOpened) return; // já liberada — nada mais pra checar (mesmo enquanto ainda anima visualmente)
  for(const trig of liveSecretTriggers){
    if(trig.trigger === "playerCollision" && rectsOverlap(player, trig)){
      openSecretPassage();
      break;
    }
  }
}

// x/y: ponto do mundo onde a explosão nasce (mesmo esquema de spawnSplash).
// kind escolhe o conjunto de sprites e como o ponto é interpretado:
// "barrel" (padrão) usa a nuvem do barril, y = BASE dela; "crate" usa o
// estouro de partículas da caixa, y = CENTRO (sprite simétrico, sem
// espaço vazio pra compensar — ver drawExplosions).
function spawnExplosion(x, y, kind = "barrel"){
  explosions.push({ x, y, frame: 0, timer: 0, kind });
}

function explosionFramesFor(kind){
  return kind === "crate" ? CRATE_EXPLOSION_SRC : EXPLOSION_SRC;
}

function updateExplosions(dt){
  for(let i = explosions.length - 1; i >= 0; i--){
    const e = explosions[i];
    const fps = e.kind === "crate" ? CRATE_EXPLOSION_FPS : EXPLOSION_FPS;
    const frameTime = 1 / fps;
    e.timer += dt;
    while(e.timer >= frameTime){
      e.timer -= frameTime;
      e.frame++;
    }
    if(e.frame >= explosionFramesFor(e.kind).length) explosions.splice(i, 1); // 1 ciclo só: acaba e some
  }
}

/* ============================================================
   PORTAS-LASER E BOTÕES (objectgroup "Triggers")
   ============================================================ */
function spawnTriggers(mapData){
  liveLasers = mapData.laserSpawns.map(spawn => ({
    x: spawn.x, y: spawn.y, w: spawn.w, h: spawn.h,
    door: spawn.door,
    kind: spawn.kind || "laser",  // "laser" | "barrier" — decide o sprite-sheet usado no draw
    on: true,        // estado lógico desejado: true = ativa: false = desligada
    blocking: true,  // estado REAL de colisão — só muda quando a animação termina (ver updateTriggers)
    frame: 0,        // índice em LASER_SRC/BARRIER_SRC — 0 ligado/fechado .. length-1 desligado/aberto
    targetFrame: 0,
    animTimer: 0
  }));
  liveButtons = mapData.buttonSpawns.map(spawn => ({
    x: spawn.x, y: spawn.y, w: spawn.w, h: spawn.h,
    door: spawn.door,
    kind: spawn.kind,   // "toggle" | "shoot"
    on: true,           // estado do switch (só "toggle")
    hits: 0,            // tiros levados até agora (só "shoot")
    disabled: false,    // true quando "shoot" chega ao fim — não reacende
    hitFlash: 0
  }));
  nearButton = null;
}

// Liga/desliga (com animação) todas as portas-laser associadas ao
// nome de porta indicado. Fechar bloqueia na hora; abrir só libera
// de verdade quando a animação termina (ver updateTriggers).
function setDoorOn(doorName, on){
  for(const l of liveLasers){
    if(l.door !== doorName) continue;
    l.on = on;
    const frameCount = (l.kind === "barrier" ? BARRIER_SRC : LASER_SRC).length;
    l.targetFrame = on ? 0 : frameCount - 1;
    if(on) l.blocking = true; // fechando: bloqueia já, mesmo durante a animação
  }
}

// Botão "toggle" (tecla E): alterna e já aplica o novo estado à porta.
function toggleButton(b){
  b.on = !b.on;
  setDoorOn(b.door, b.on);
  playSfx('button');
}

// Botão "shoot" (bala do jogador): vai apagando a cada tiro; ao
// chegar no fim, desliga a porta de vez (não reacende sozinho).
function hitShootButton(b){
  if(b.disabled) return;
  b.hits = Math.min(BUTTON_HITS_TO_DISABLE, b.hits + 1);
  b.hitFlash = CRATE_HIT_FLASH_TIME;
  playSfx('button');
  if(b.hits >= BUTTON_HITS_TO_DISABLE){
    b.disabled = true;
    setDoorOn(b.door, false);
  }
}

// Retorna a porta-laser LIGADA (se houver) que contém o ponto do
// mundo dado — mesma forma de crateAt(), usada pela colisão de bala.
function activeLaserAt(worldX, worldY){
  for(const l of liveLasers){
    if(!l.blocking) continue;
    if(worldX >= l.x && worldX < l.x + l.w && worldY >= l.y && worldY < l.y + l.h) return l;
  }
  return null;
}

function updateTriggers(dt){
  for(const l of liveLasers){
    if(l.frame === l.targetFrame) continue;
    const frameTime = l.kind === "barrier" ? BARRIER_ANIM_FRAME_TIME : LASER_ANIM_FRAME_TIME;
    l.animTimer += dt;
    while(l.animTimer >= frameTime && l.frame !== l.targetFrame){
      l.animTimer -= frameTime;
      l.frame += (l.targetFrame > l.frame) ? 1 : -1;
    }
    if(l.frame === l.targetFrame) l.blocking = l.on; // animação concluída: libera (ou confirma bloqueio) só agora
  }
  for(const b of liveButtons){
    if(b.hitFlash > 0) b.hitFlash = Math.max(0, b.hitFlash - dt);
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
    playSfx('health');
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

/* ============================================================
   ITENS COLETÁVEIS, ARMAS E MOCHILA (lógica + HUD)
   ============================================================ */
const inventory = {};              // { adrenaline: n, invulnerability: n, jacket: n, medkit: n } — itens empilhados
const collectedItems = new Set();  // "mapId:objectId" já coletados (os mapas são recriados a cada troca de porta)
const hud = { toastText: "", toastT: 0, hoverType: null, flash: {}, backpackVisible: true };

function resetInventory(){
  for(const k of BACKPACK_ORDER) inventory[k] = 0;
}
resetInventory();

// Atalhos/cliques só valem durante o jogo de verdade.
function canUseHud(){
  return gameStarted && !gameOver && !transitioning;
}

function showToast(text){
  hud.toastText = text;
  hud.toastT = 2;
}

function flashSlot(type){
  hud.flash[type] = 0.35;
}

/* --- armas --- */
function getCurrentWeapon(){
  return WEAPON_DEFS[player.weapons[player.weaponIdx]] || WEAPON_DEFS.pistol;
}

function cycleWeapon(){
  if(player.weapons.length < 2) return;
  player.weaponIdx = (player.weaponIdx + 1) % player.weapons.length;
  showToast(getCurrentWeapon().name + " equipada");
  playSfx('weaponChange');
}

function giveWeapon(weaponKey){
  if(player.weapons.includes(weaponKey)) return false;
  player.weapons.push(weaponKey);
  player.weaponIdx = player.weapons.length - 1; // equipa a arma nova na hora
  showToast(WEAPON_DEFS[weaponKey].name + " equipada! [Tab] troca de arma");
  playSfx('weaponChange');
  return true;
}

/* --- dano no jogador (ponto único: escudo, invulnerabilidade e i-frames) --- */
// Retorna true se o golpe realmente entrou. O escudo absorve primeiro; o que
// sobrar passa pro HP. Com a invulnerabilidade (item) ativa nada entra.
function damagePlayer(amount, invulnTime){
  if(gameOver || player.invulnT > 0 || player.invulnPowerT > 0) return false;
  let remaining = amount;
  if(player.shield > 0){
    const absorbed = Math.min(player.shield, remaining);
    player.shield -= absorbed;
    remaining -= absorbed;
  }
  player.hp = Math.max(0, player.hp - remaining);
  player.invulnT = invulnTime;
  if(player.hp <= 0){
    if(!gameOver) playSfx('death'); // só na transição, não se já estava game over
    gameOver = true;
  } else {
    playSfx('pain');
  }
  return true;
}

// Chamada quando o boss morre: reaproveita o estado gameOver
// (congela inimigos/balas, trava o HUD e aceita R pra reiniciar).
function winGame(){
  if(gameOver) return; // já morreu ou já venceu
  victory = true;
  gameOver = true;
}

/* --- consumíveis (mochila) --- */
function isEffectActive(type){
  if(type === "adrenaline") return player.speedBoostT > 0;
  if(type === "invulnerability") return player.invulnPowerT > 0;
  if(type === "jacket") return player.shield > 0;
  return false;
}

// Usa 1 unidade. Não gasta o item se ele não teria efeito (vida cheia,
// escudo cheio, efeito já ativo) — o slot só pisca em vermelho.
function useConsumable(type){
  if(!inventory[type] || inventory[type] <= 0){ flashSlot(type); return false; }
  let used = false;
  if(type === "medkit"){
    if(player.hp < player.maxHp){
      player.hp = Math.min(player.maxHp, player.hp + MEDKIT_HEAL);
      used = true;
    }
  } else if(type === "jacket"){
    if(player.shield < PLAYER_MAX_SHIELD){
      player.shield = Math.min(PLAYER_MAX_SHIELD, player.shield + JACKET_SHIELD_AMOUNT);
      used = true;
    }
  } else if(type === "adrenaline"){
    if(player.speedBoostT <= 0){
      player.speedBoostT = ADRENALINE_DURATION;
      used = true;
    }
  } else if(type === "invulnerability"){
    if(player.invulnPowerT <= 0){
      player.invulnPowerT = INVULN_ITEM_DURATION;
      used = true;
    }
  }
  if(used){
    inventory[type]--;
    playSfx(type); // adrenaline/invulnerability/jacket/medkit têm um SFX próprio, com a mesma chave do tipo
  } else {
    flashSlot(type);
  }
  return used;
}

function updatePowerups(dt){
  if(player.speedBoostT > 0) player.speedBoostT = Math.max(0, player.speedBoostT - dt);
  if(player.invulnPowerT > 0) player.invulnPowerT = Math.max(0, player.invulnPowerT - dt);
  if(hud.toastT > 0) hud.toastT -= dt;
  for(const k in hud.flash){
    if(hud.flash[k] > 0) hud.flash[k] -= dt;
  }
}

/* --- itens no chão do mapa --- */
function spawnItems(mapData){
  liveItems = [];
  for(const spawn of mapData.itemSpawns){
    const key = mapData.id + ":" + spawn.id;
    if(collectedItems.has(key)) continue; // já coletado (o mapa é recriado a cada troca de porta)
    const def = ITEM_DEFS[spawn.type];
    if(!def) continue;
    liveItems.push({
      key, type: spawn.type, def,
      x: spawn.x, y: spawn.y, w: spawn.w, h: spawn.h,
      bobT: Math.random() * Math.PI * 2
    });
  }
}

// Retorna true se o item foi consumido do mapa.
function collectItem(item){
  const def = item.def;
  if(def.kind === "weapon"){
    return giveWeapon(def.weapon); // já tem a arma: deixa o item lá
  }
  if(inventory[item.type] >= MAX_ITEM_STACK) return false;
  inventory[item.type]++;
  showToast("+1 " + def.name);
  playSfx('collect');
  return true;
}

function updateItems(dt){
  const pickupBox = { x: 0, y: 0, w: 0, h: 0 };
  for(let i = liveItems.length - 1; i >= 0; i--){
    const it = liveItems[i];
    it.bobT += dt * ITEM_BOB_SPEED;
    pickupBox.x = it.x - ITEM_PICKUP_PADDING;
    pickupBox.y = it.y - ITEM_PICKUP_PADDING;
    pickupBox.w = it.w + ITEM_PICKUP_PADDING * 2;
    pickupBox.h = it.h + ITEM_PICKUP_PADDING * 2;
    if(rectsOverlap(pickupBox, player) && collectItem(it)){
      collectedItems.add(it.key);
      liveItems.splice(i, 1);
    }
  }
}

function drawItems(){
  for(const it of liveItems){
    const bob = -(1 + Math.sin(it.bobT)); // sobe 0..2px, nunca afunda no chão
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(it.x + it.w/2, it.y + it.h, Math.max(2, it.w/2 - 1), 1.5, 0, 0, Math.PI*2);
    ctx.fill();
    if(it.def.img){
      ctx.drawImage(it.def.img, it.x, it.y + bob, it.w, it.h);
    } else {
      ctx.fillStyle = "#e8c14c";
      ctx.fillRect(it.x, it.y + bob, it.w, it.h);
    }
  }
}

// Aura/escudo em volta do jogador (espaço do mundo, depois do personagem).
function drawPlayerEffects(){
  if(gameOver) return;
  const c = player.ridingPlatform
    ? snapToCam(player.x + player.w/2, player.y + player.h/2)
    : { x: player.x + player.w/2, y: player.y + player.h/2 };
  const rx = player.w/2 + 5, ry = player.h/2 + 4;

  ctx.save();
  if(player.shield > 0){
    ctx.strokeStyle = "rgba(90,184,255,0.55)";
    ctx.fillStyle = "rgba(90,184,255,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  }
  if(player.invulnPowerT > 0){
    // nos últimos 1.5s pisca pra avisar que está acabando
    const ending = player.invulnPowerT < 1.5;
    if(!ending || Math.floor(player.invulnPowerT * 8) % 2 === 0){
      const pulse = 0.5 + 0.5 * Math.sin(promptT * 10);
      ctx.strokeStyle = "rgba(255,216,74," + (0.6 + 0.3 * pulse) + ")";
      ctx.fillStyle = "rgba(255,216,74," + (0.14 + 0.10 * pulse) + ")";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, rx + 1, ry + 1, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
  }
  if(player.speedBoostT > 0 && Math.abs(player.vx) > 5){
    // riscos de velocidade atrás do jogador
    ctx.strokeStyle = "rgba(240,160,48,0.7)";
    ctx.lineWidth = 1;
    const back = -Math.sign(player.vx);
    for(let k = 0; k < 3; k++){
      const yy = c.y - 8 + k * 8;
      const x0 = c.x + back * (player.w/2 + 2);
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + back * (6 + k * 2), yy); ctx.stroke();
    }
  }
  ctx.restore();
}

/* --- HUD: escudo, arma atual, efeitos ativos, mochila, aviso --- */
const HUD_RIGHT_X = 760, HUD_RIGHT_W = 180; // mesma coluna da barra de vida (drawPlayerHealthBar)

function drawPlayerShieldBar(){
  if(player.shield <= 0) return;
  const x = HUD_RIGHT_X, y = 39, w = HUD_RIGHT_W, h = 16;
  const pct = Math.max(0, Math.min(1, player.shield / PLAYER_MAX_SHIELD));
  ctx.save();
  ctx.fillStyle = "rgba(5,6,10,0.75)";
  roundRect(x - 4, y - 3, w + 8, h + 6, 4);
  ctx.fill();
  ctx.fillStyle = "#20242e";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#4aa8ff";
  ctx.fillRect(x, y, w * pct, h);
  ctx.strokeStyle = "#0b0d12";
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = "#dfe6f0";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("ESCUDO " + Math.ceil(player.shield) + "/" + PLAYER_MAX_SHIELD, x + 6, y + h/2 + 1);
  ctx.restore();
}

function drawWeaponHud(){
  const weapon = getCurrentWeapon();
  const x = HUD_RIGHT_X, w = HUD_RIGHT_W, h = 30;
  const y = player.shield > 0 ? 63 : 42;
  ctx.save();
  ctx.fillStyle = "rgba(5,6,10,0.75)";
  roundRect(x - 4, y - 4, w + 8, h + 8, 4);
  ctx.fill();
  // ícone (2x): sprite do item da arma; a pistola usa gun_item.png (weapon.iconImg).
  // Sem ele, recorta gun.png a partir da mão como fallback.
  const scale = 2;
  const itemImg = weapon.itemKey ? ITEM_DEFS[weapon.itemKey].img : weapon.iconImg;
  if(itemImg){
    ctx.drawImage(itemImg, x + 2, y + (h - itemImg.height*scale)/2, itemImg.width*scale, itemImg.height*scale);
  } else if(gunImg){
    const sx = 17, sw = ARM_W - sx;
    ctx.drawImage(gunImg, sx, 0, sw, ARM_H, x + 2, y + (h - ARM_H*scale)/2, sw*scale, ARM_H*scale);
  }
  ctx.fillStyle = "#dfe6f0";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(weapon.name, x + 58, y + 10);
  if(player.weapons.length > 1){
    ctx.fillStyle = "#8b95a7";
    ctx.font = "9px monospace";
    ctx.fillText("[Tab] trocar arma", x + 58, y + 23);
  }
  ctx.restore();
}

function drawEffectsHud(){
  const effects = [
    { type: "adrenaline",      t: player.speedBoostT,  max: ADRENALINE_DURATION },
    { type: "invulnerability", t: player.invulnPowerT, max: INVULN_ITEM_DURATION }
  ].filter(e => e.t > 0);
  if(effects.length === 0) return;

  let y = (player.shield > 0 ? 56 : 42) + 44;
  const x = HUD_RIGHT_X;
  ctx.save();
  for(const e of effects){
    const def = ITEM_DEFS[e.type];
    ctx.fillStyle = "rgba(5,6,10,0.75)";
    roundRect(x - 4, y - 3, HUD_RIGHT_W + 8, 22, 4);
    ctx.fill();
    if(def.img) ctx.drawImage(def.img, x, y + 8 - def.img.height/2, def.img.width, def.img.height);
    const barX = x + 22, barW = HUD_RIGHT_W - 22 - 34, barH = 6;
    ctx.fillStyle = "#20242e";
    ctx.fillRect(barX, y + 5, barW, barH);
    ctx.fillStyle = def.color;
    ctx.fillRect(barX, y + 5, barW * Math.max(0, Math.min(1, e.t / e.max)), barH);
    ctx.fillStyle = "#dfe6f0";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(e.t.toFixed(1) + "s", x + HUD_RIGHT_W, y + 8);
    y += 26;
  }
  ctx.restore();
}

/* --- mochila (painel lateral clicável) --- */
const BACKPACK_X = 890, BACKPACK_SLOT = 44, BACKPACK_GAP = 6, BACKPACK_PAD = 8, BACKPACK_TITLE_H = 14;

function getBackpackLayout(){
  const n = BACKPACK_ORDER.length;
  const w = BACKPACK_SLOT + BACKPACK_PAD * 2;
  const h = BACKPACK_TITLE_H + n * BACKPACK_SLOT + (n - 1) * BACKPACK_GAP + BACKPACK_PAD * 2;
  const x = BACKPACK_X;
  const y = Math.round((canvas.height - h) / 2); // centralizado na vertical, colado na esquerda
  const slots = BACKPACK_ORDER.map((type, i) => ({
    type,
    x: x + BACKPACK_PAD,
    y: y + BACKPACK_PAD + BACKPACK_TITLE_H + i * (BACKPACK_SLOT + BACKPACK_GAP),
    w: BACKPACK_SLOT, h: BACKPACK_SLOT
  }));
  return { x, y, w, h, slots };
}

function backpackSlotAt(px, py){
  if(!hud.backpackVisible) return null; // escondida: não recebe clique nem hover
  const L = getBackpackLayout();
  return L.slots.find(s => px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h) || null;
}

// Converte o evento do mouse pra coordenadas do canvas (funciona mesmo se o
// CSS redimensionar o canvas).
function canvasPointFromEvent(e){
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height)
  };
}

canvas.addEventListener('mousedown', e => {
  if(e.button !== 0 || !canUseHud()) return;
  const p = canvasPointFromEvent(e);
  const slot = backpackSlotAt(p.x, p.y);
  if(slot) useConsumable(slot.type);
});
canvas.addEventListener('mousemove', e => {
  const p = canvasPointFromEvent(e);
  const slot = backpackSlotAt(p.x, p.y);
  hud.hoverType = slot ? slot.type : null;
  canvas.style.cursor = (slot && canUseHud()) ? "pointer" : "";
});
canvas.addEventListener('mouseleave', () => {
  hud.hoverType = null;
  canvas.style.cursor = "";
});

function toggleBackpack(){
  hud.backpackVisible = !hud.backpackVisible;
  hud.hoverType = null;
  canvas.style.cursor = "";
}

function drawBackpack(){
  if(!gameStarted || !hud.backpackVisible) return;
  const L = getBackpackLayout();
  ctx.save();

  ctx.fillStyle = "rgba(5,6,10,0.75)";
  roundRect(L.x, L.y, L.w, L.h, 6);
  ctx.fill();
  ctx.strokeStyle = "#2b2f3a";
  ctx.lineWidth = 1;
  roundRect(L.x + 0.5, L.y + 0.5, L.w - 1, L.h - 1, 6);
  ctx.stroke();

  ctx.fillStyle = "#8b95a7";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MOCHILA", L.x + L.w/2, L.y + BACKPACK_PAD + 5);

  L.slots.forEach((s, i) => {
    const def = ITEM_DEFS[s.type];
    const count = inventory[s.type];
    const flashing = (hud.flash[s.type] || 0) > 0;
    const hovered = hud.hoverType === s.type;

    ctx.fillStyle = flashing ? "#4a2226" : "#20242e";
    roundRect(s.x, s.y, s.w, s.h, 4);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = flashing ? "#e05a5a"
                    : isEffectActive(s.type) ? def.color
                    : (hovered && count > 0) ? "#dfe6f0"
                    : "#2b2f3a";
    roundRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2, 4);
    ctx.stroke();

    if(def.img){
      const k = 2; // 2x: sprites de 16px viram 32px
      const iw = def.img.width * k, ih = def.img.height * k;
      ctx.globalAlpha = count > 0 ? 1 : 0.28;
      ctx.drawImage(def.img, Math.round(s.x + (s.w - iw)/2), Math.round(s.y + (s.h - ih)/2), iw, ih);
      ctx.globalAlpha = 1;
    }

    // número do atalho (1-4) no canto superior esquerdo
    ctx.fillStyle = "#8b95a7";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(String(i + 1), s.x + 4, s.y + 3);

    // quantidade empilhada no canto inferior direito
    if(count > 0){
      const label = "x" + count;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#000";
      ctx.fillText(label, s.x + s.w - 3, s.y + s.h - 2);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, s.x + s.w - 4, s.y + s.h - 3);
    }
  });

  // tooltip ao passar o mouse
  if(hud.hoverType){
    const s = L.slots.find(sl => sl.type === hud.hoverType);
    const def = ITEM_DEFS[hud.hoverType];
    ctx.font = "bold 11px monospace";
    const wName = ctx.measureText(def.name).width;
    ctx.font = "10px monospace";
    const wDesc = ctx.measureText(def.desc).width;
    const bw = Math.max(wName, wDesc) + 16, bh = 36;
    const bx = L.x + L.w + 6, by = s.y + (s.h - bh)/2;
    ctx.fillStyle = "rgba(5,6,10,0.9)";
    roundRect(bx, by, bw, bh, 4);
    ctx.fill();
    ctx.strokeStyle = "#2b2f3a";
    ctx.lineWidth = 1;
    roundRect(bx + 0.5, by + 0.5, bw - 1, bh - 1, 4);
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = def.color;
    ctx.font = "bold 11px monospace";
    ctx.fillText(def.name, bx + 8, by + 12);
    ctx.fillStyle = "#dfe6f0";
    ctx.font = "10px monospace";
    ctx.fillText(def.desc, bx + 8, by + 26);
  }
  ctx.restore();
}

function drawToast(){
  if(hud.toastT <= 0 || !hud.toastText) return;
  const alpha = Math.min(1, hud.toastT / 0.5); // some suave no último 0.5s
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "bold 13px monospace";
  const w = ctx.measureText(hud.toastText).width + 24, h = 26;
  const x = canvas.width/2 - w/2, y = canvas.height - 70;
  ctx.fillStyle = "rgba(5,6,10,0.8)";
  roundRect(x, y, w, h, 5);
  ctx.fill();
  ctx.fillStyle = "#e8c14c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(hud.toastText, canvas.width/2, y + h/2 + 1);
  ctx.restore();
}

/* ============================================================
   SPLASH (mergulho/saída de líquido)
   ============================================================ */
// centerX/surfaceY: ponto do mundo onde o splash é centralizado (ver
// chamada em updatePlayer, ao entrar/sair de um líquido).
function spawnSplash(centerX, surfaceY){
  splashes.push({ x: centerX, y: surfaceY, frame: 0, timer: 0 });
}

function updateSplashes(dt){
  const frameTime = 1 / SPLASH_FPS;
  for(let i = splashes.length - 1; i >= 0; i--){
    const s = splashes[i];
    s.timer += dt;
    while(s.timer >= frameTime){
      s.timer -= frameTime;
      s.frame++;
    }
    if(s.frame >= SPLASH_SRC.length) splashes.splice(i, 1); // animação de 1 ciclo só: acaba e some
  }
}

// Reinicia a partida sem recarregar a página: volta pro mapa inicial,
// restaura o jogador e os inimigos do zero, e limpa qualquer estado
// de transição/game over pendente. Os assets (imagens, .tmx) já
// carregados em init() são reaproveitados.
function resetGame(){
  currentMapId = "map1";
  currentMap = prepareMap(currentMapId);
  bakeMinimapTerrain(currentMap);
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
  player.canDoubleJump = false;
  player.doubleJumping = false;
  player.doubleJumpAnimTimer = 0;
  player.hp = PLAYER_MAX_HP;
  player.invulnT = 0;
  player.ridingPlatform = null;
  player.dropThroughTimer = 0;
  player.climbing = false;
  player.ladderRegrabTimer = 0;
  player.inLiquid = false;
  player.liquidKind = null;
  player.shield = 0;
  player.speedBoostT = 0;
  player.invulnPowerT = 0;
  player.weapons = ["pistol"];
  player.weaponIdx = 0;
  resetInventory();
  collectedItems.clear();
  hud.toastT = 0;
  hud.flash = {};

  spawnEnemies(currentMap);
  spawnCrates(currentMap);
  spawnBarrels(currentMap);
  spawnSecrets(currentMap);
  spawnPlatforms(currentMap);
  spawnTriggers(currentMap);
  spawnLiquids(currentMap);
  spawnItems(currentMap);
  bullets = [];
  loots = [];
  explosions = [];
  shootCooldown = 0;

  doorCooldown = 0;
  nearDoor = null;

  transitioning = false;
  transitionPhase = null;
  transitionTimer = 0;
  pendingDestiny = null;
  pendingDestinyDoor = null;
  fadeEl.style.opacity = "0";

  gameOver = false;
  victory = false;
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
  // Portas-laser (Triggers) bloqueiam do mesmo jeito que uma caixa —
  // só enquanto "blocking" (liberam de verdade só quando a animação
  // de abertura termina, ver updateTriggers).
  for(const l of liveLasers){
    if(!l.blocking) continue;
    if(bottom <= l.y || top >= l.y + l.h) continue;
    const left = newX, right = newX + entity.w;
    if(right <= l.x || left >= l.x + l.w) continue;
    if(entity.vx > 0) newX = l.x - entity.w;
    else if(entity.vx < 0) newX = l.x + l.w;
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
  for(const l of liveLasers){
    if(!l.blocking) continue;
    if(right <= l.x || left >= l.x + l.w) continue;
    const top = newY, bottom = newY + entity.h;
    if(bottom <= l.y || top >= l.y + l.h) continue;
    if(entity.vy > 0){
      newY = l.y - entity.h;
      entity.onGround = true;
    } else if(entity.vy < 0){
      newY = l.y + l.h;
    }
    entity.vy = 0;
  }
  return newY;
}

/* ============================================================
   LÍQUIDOS (objectgroup "Liquid")
   ============================================================ */
function spawnLiquids(mapData){
  liveLiquids = mapData.liquidSpawns.map(spawn => ({
    x: spawn.x, y: spawn.y, w: spawn.w, h: spawn.h,
    kind: spawn.kind,
    def: LIQUID_TILE_DEFS[spawn.kind + "_" + spawn.part] || null
  }));
  splashes = []; // splash de um mapa não deve continuar tocando no próximo
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
  const wantsJumpOff = keys["Space"] && !wantsUp && !wantsDown;

  if(wantsJumpOff){
    player.climbing = false;
    player.vy = 0;
    player.ladderRegrabTimer = CLIMB_REGRAB_DELAY;
    player.ladderExitPlatform = null;
    return;
  }

  // Esquerda/Direita: solta da escada e devolve o controle pro
  // movimento normal (o próximo frame já anda pro lado). O delay de
  // regarrar evita o mesmo "pisca-pisca" de sair/entrar quando Cima
  // (ou Baixo) continua pressionado junto com Esquerda/Direita.
  if((wantsLeft || wantsRight) && !wantsUp && !wantsDown){
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

// Diz se há espaço livre acima do jogador agachado pra ele ficar em pé
// de novo (pés no mesmo lugar, topo do hitbox voltando pra
// PLAYER_STAND_H) — checa tiles sólidos, caixas e portas-laser
// bloqueando na faixa que seria "liberada" ao levantar. Usada pra não
// deixar o jogador levantar dentro de um vão baixo (ele continua
// agachado até sair do vão, mesmo soltando Ctrl/Baixo).
function canStandUp(entity){
  const targetTop = entity.y + entity.h - PLAYER_STAND_H; // topo se ficasse em pé
  const left = entity.x + 1, right = entity.x + entity.w - 1;
  const rowTop = Math.floor(targetTop / TILE);
  const rowBottom = Math.floor(entity.y / TILE); // até o topo atual (agachado)
  for(let row = rowTop; row <= rowBottom; row++){
    if(isSolidTile(currentMap, left, row * TILE) || isSolidTile(currentMap, right, row * TILE)) return false;
  }
  for(const c of crates){
    if(right <= c.x || left >= c.x + c.w) continue;
    if(entity.y <= c.y || targetTop >= c.y + c.h) continue;
    return false;
  }
  for(const l of liveLasers){
    if(!l.blocking) continue;
    if(right <= l.x || left >= l.x + l.w) continue;
    if(entity.y <= l.y || targetTop >= l.y + l.h) continue;
    return false;
  }
  return true;
}

function updatePlayer(dt){
  if(player.invulnT > 0) player.invulnT -= dt;
  if(player.dashBlinkT > 0) player.dashBlinkT -= dt;

  // Guarda se o jogador estava no chão no início do frame — usado lá
  // embaixo (perto do coyote time) pra detectar o instante exato em
  // que ele deixa o chão, seja pulando OU simplesmente andando pra
  // fora de uma borda (queda livre), e liberar o pulo duplo nos dois
  // casos (ver comentário perto de "wasOnGround" mais abaixo).
  const wasOnGround = player.onGround;

  // Consome o pulo "one-shot" já aqui em cima, incondicionalmente —
  // se isso ficasse pra mais adiante (só no fluxo normal, depois do
  // early-return da escalada/gameOver), um Espaço apertado enquanto o
  // jogador está preso na escada ficaria "pendurado" em jumpRequested
  // até o primeiro frame livre da escada, disparando um pulo (ou até
  // um pulo duplo, já que canDoubleJump é recarregado ao agarrar a
  // escada) bem na hora de soltar dela.
  const wantsJump = jumpRequested;
  jumpRequested = false;

  // Mesmo esquema do pulo: consome aqui em cima incondicionalmente,
  // pra um Z apertado durante a escalada (ou game over) não ficar
  // "pendurado" e disparar um dash inesperado no primeiro frame livre.
  const wantsDash = dashRequested;
  dashRequested = false;

  // Precisa contar sempre, mesmo durante a escalada (que retorna cedo
  // logo abaixo) — senão, se o jogador agarrar uma escada bem no meio
  // de um drop-through (Shift+Baixo), esse timer fica "congelado" com
  // tempo sobrando, e quando a escalada termina (inclusive subindo de
  // volta pra plataforma de cima) ele ainda está ativo, fazendo o
  // jogador atravessar (cair through) a próxima plataforma one-way
  // que deveria pousá-lo.
  if(player.dropThroughTimer > 0) player.dropThroughTimer -= dt;

  // A animação doubleJump toca só 1 ciclo (não até pousar): decrementa
  // aqui embaixo, antes de qualquer return antecipado (gameOver ou
  // escalada), pro ciclo continuar contando mesmo nesses casos.
  if(player.doubleJumpAnimTimer > 0){
    player.doubleJumpAnimTimer -= dt;
    if(player.doubleJumpAnimTimer <= 0) player.doubleJumping = false;
  }

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
  const wantsHorizontal = keys["ArrowLeft"] || keys["KeyA"] || keys["ArrowRight"] || keys["KeyD"];

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
  const canEnterLadder = (wantsUp && !wantsHorizontal) || (wantsDown && (!player.onGround || (player.ridingPlatform && !wantsShift)));
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
    player.coyoteTimer = 0;
    // Agarrar a escada NÃO recarrega o pulo duplo (mesmo que ele ainda
    // estivesse disponível de antes) — senão dá pra ficar saindo com
    // Espaço e regarrando com Cima repetidas vezes, encadeando pulos
    // duplos "de graça" e subindo bem mais rápido que a escalada normal.
    // Só um pulo de verdade a partir do chão/coyote libera de novo.
    player.canDoubleJump = false;
    player.doubleJumping = false;
    player.doubleJumpAnimTimer = 0;
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

  // --- agachar: Ctrl + Baixo (só no chão) ---
  // Encolhe/expande a hitbox mantendo os pés (player.y + player.h) no
  // mesmo lugar no mundo. Só entra agachado com player.onGround true —
  // no ar (pulando/caindo) o crouch fica bloqueado. Levantar só é
  // permitido se canStandUp() confirmar espaço livre acima — senão o
  // jogador continua agachado mesmo soltando as teclas (ou saindo do
  // chão, ex.: andando pra fora de uma beirada agachado), até sair de
  // baixo do vão.
  const wantsCrouch = wantsDown && (keys["ControlLeft"] || keys["ControlRight"]) && player.onGround;
  if(wantsCrouch && !player.crouching){
    player.y += PLAYER_STAND_H - PLAYER_CROUCH_H;
    player.h = PLAYER_CROUCH_H;
    player.crouching = true;
  } else if(!wantsCrouch && player.crouching && canStandUp(player)){
    player.y -= PLAYER_STAND_H - PLAYER_CROUCH_H;
    player.h = PLAYER_STAND_H;
    player.crouching = false;
  }

  // --- líquidos: detecta se o CENTRO da hitbox está submerso (ver
  // LIQUID_KIND_DEFS/liquidKindAt) — usar o centro em vez dos pés evita
  // contar como "dentro" só de encostar de leve na borda de cima de um
  // tile de líquido. Ao cruzar a superfície de VERDADE (entrando OU
  // saindo pelo tile mais alto da poça — ver liquidSurfaceY), dispara o
  // splash. Se o jogador entrar/sair por baixo ou pelo lado (ex.: nadando
  // por um túnel submerso, ou "mergulhando pelo canto" numa parte mais
  // funda da poça sem cruzar a superfície), NÃO conta como splash — só
  // quando a linha do tile onde a transição aconteceu é a própria linha
  // da superfície.
  const liquidCenterX = player.x + player.w/2;
  const liquidCenterY = player.y + player.h/2;
  const newLiquidKind = liquidKindAt(currentMap, liquidCenterX, liquidCenterY);
  if(!!newLiquidKind !== player.inLiquid){
    playSfx('liquid'); // toca só ao ENTRAR no líquido, não ao sair
    // Entrando: o centro já está dentro do líquido, sobe a partir dele.
    // Saindo: o centro já saiu, então sobe a partir do tile logo abaixo
    // (o último ainda submerso) — senão liquidSurfaceY não acha nada.
    const startY = newLiquidKind ? liquidCenterY : liquidCenterY + TILE;
    const startRow = Math.floor(startY / TILE);
    const surfaceY = liquidSurfaceY(currentMap, liquidCenterX, startY);
    if(startRow === Math.floor(surfaceY / TILE)){
      // X = posição real do jogador, EXCETO nas extremidades da poça:
      // se não há líquido no tile vizinho (esquerda/direita, na mesma
      // linha da superfície), o splash não tem "vizinho" pra cobrir a
      // sobra e vazaria pra fora d'água — nesse caso, trava no centro
      // do próprio tile em vez de seguir o jogador.
      const col = Math.floor(liquidCenterX / TILE);
      const hasLeftNeighbor = !!liquidKindAt(currentMap, col * TILE - 1, surfaceY);
      const hasRightNeighbor = !!liquidKindAt(currentMap, col * TILE + TILE, surfaceY);
      const splashX = (hasLeftNeighbor && hasRightNeighbor) ? liquidCenterX : (col * TILE + TILE / 2);
      spawnSplash(splashX, surfaceY);
    }
  }
  player.inLiquid = !!newLiquidKind;
  player.liquidKind = newLiquidKind;
  const liquidDef = (player.inLiquid && liquidPhysicsEnabled) ? LIQUID_KIND_DEFS[player.liquidKind] : null;

  // Lava machuca em ticks, reaproveitando o mesmo invulnT (e o piscar de
  // isBlinkHidden) já usado no dano de tiro — LIQUID_LAVA_TICK_INVULN é
  // menor que PLAYER_INVULN_TIME, então continua doendo enquanto o
  // jogador ficar lá dentro, só não a cada frame.
  if(liquidDef && liquidDef.damageTick > 0){
    damagePlayer(liquidDef.damageTick, LIQUID_LAVA_TICK_INVULN);
  }

  // --- dash: tecla Z ---
  // Trava vx em DASH_SPEED na direção que o jogador está olhando e
  // ignora gravidade (vy fica travado em 0) enquanto dura, pra sair
  // reto — não some com o input de movimento nem muda de direção no
  // meio do dash. Usa dashBlinkT (separado de invulnT) só pra reaproveitar
  // o piscar do sprite em isBlinkHidden como efeito visual do dash —
  // sem dar i-frames: invulnT não é tocado aqui, então um tiro inimigo
  // continua causando dano normalmente durante o dash.
  if(player.dashCooldown > 0) player.dashCooldown -= dt;
  if(wantsDash && player.dashCooldown <= 0 && !player.dashing && !player.crouching){
    player.dashing = true;
    player.dashT = DASH_TIME;
    player.dashCooldown = DASH_COOLDOWN;
    player.dashBlinkT = DASH_TIME;
    player.vx = player.facing * DASH_SPEED;
    player.vy = 0;
    playSfx('dash');
  }
  if(player.dashing){
    player.dashT -= dt;
    if(player.dashT <= 0) player.dashing = false;
  }

  let moveDir = 0;
  if(!player.dashing){
    if(keys["ArrowLeft"] || keys["KeyA"]) moveDir -= 1;
    if(keys["ArrowRight"] || keys["KeyD"]) moveDir += 1;
  }

  // Arrasto: dentro de um líquido, a velocidade máxima horizontal é
  // reduzida por liquidDef.speedMult (ver LIQUID_KIND_DEFS) — some com o
  // multiplicador de agachado normalmente.
  const currentMaxSpeed = (player.crouching ? PHYS.moveSpeed * CROUCH_SPEED_MULT : PHYS.moveSpeed) * (liquidDef ? liquidDef.speedMult : 1) * (player.speedBoostT > 0 ? ADRENALINE_SPEED_MULT : 1);
  if(player.dashing){
    // vx já travado em DASH_SPEED lá em cima — sem accel/friction aqui
  } else if(moveDir !== 0){
    player.vx += moveDir * PHYS.accel * dt;
    player.vx = Math.max(-currentMaxSpeed, Math.min(currentMaxSpeed, player.vx));
    player.facing = moveDir;
  } else {
    const f = PHYS.friction * dt;
    if(Math.abs(player.vx) <= f) player.vx = 0;
    else player.vx -= Math.sign(player.vx) * f;
  }

  // Pulo (chão/coyote) e pulo duplo (ar) — wantsJump já veio capturado
  // e consumido (one-shot) lá no topo da função. Ignorado durante o
  // dash pra não misturar vy do pulo com o vy travado em 0 do dash.
  // Submerso, o pulo vira uma "braçada" pra cima (liquidDef.swimVel):
  // não depende de estar no chão/coyote, não consome o pulo duplo (que
  // fica intacto pra quando ele sair d'água) e pode ser repetida quantas
  // vezes o jogador quiser enquanto estiver dentro do líquido.
  if(wantsJump && !player.dashing){
    if(liquidDef){
      player.vy = liquidDef.swimVel;
    } else if(player.onGround || player.coyoteTimer > 0){
      player.vy = PHYS.jumpVel;
      player.onGround = false;
      player.coyoteTimer = 0; // consumido: evita pulo duplo no ar
      player.canDoubleJump = true;  // 1º pulo feito: libera o 2º no ar
      player.doubleJumping = false;
      player.doubleJumpAnimTimer = 0;
    } else if(player.canDoubleJump){
      player.vy = PHYS.doubleJumpVel;
      player.canDoubleJump = false; // só um pulo extra por salto
      player.doubleJumping = true;  // liga a animação doubleJump por 1 ciclo (ver timer abaixo)
      player.doubleJumpAnimTimer = ANIMS.doubleJump.frames / ANIMS.doubleJump.fps;
    }
  }

  if(!player.dashing){
    const gravity = liquidDef ? PHYS.gravity * liquidDef.gravityMult : PHYS.gravity;
    const maxFall = liquidDef ? liquidDef.maxFall : PHYS.maxFall;
    player.vy += gravity * dt;
    if(player.vy > maxFall) player.vy = maxFall;
  }

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
    player.canDoubleJump = false; // só é liberado de novo pelo 1º pulo (ver bloco de pulo acima)
    player.doubleJumping = false;
    player.doubleJumpAnimTimer = 0;
  } else if(player.coyoteTimer > 0){
    player.coyoteTimer -= dt;
  }

  // Libera o pulo duplo também ao sair do chão sem ter pulado (ex.:
  // andar pra fora de uma borda e cair) — sem isso, canDoubleJump só
  // virava true dentro do bloco de pulo acima, e quem caía de uma
  // borda sem apertar o pulo ficava em queda livre sem poder usar o
  // ar-pulo. wasOnGround captura o estado do início do frame (antes de
  // toda a física acima), então essa condição só é verdadeira no
  // exato frame em que o jogador deixa o chão — não reconcede o pulo
  // duplo repetidamente enquanto ele já está no ar.
  if(wasOnGround && !player.onGround){
    player.canDoubleJump = true;
  }

  // --- checagem das portas (pode haver mais de uma por mapa): apenas
  //     indica proximidade; troca de mapa só acontece se o jogador
  //     apertar o botão de interação perto de uma delas ---
  if(doorCooldown > 0) doorCooldown -= dt;
  nearDoor = null;
  for(const d of currentMap.doors){
    const overlap = player.x < d.x + d.width &&
                     player.x + player.w > d.x &&
                     player.y < d.y + d.height &&
                     player.y + player.h > d.y;
    if(overlap){
      nearDoor = d;
      if(interactRequested && doorCooldown <= 0){
        startMapTransition(d.destiny, d.destinyDoor);
      }
      break; // já achou a porta que o jogador está tocando
    }
  }

  // --- botão "toggle" (Triggers): liga/desliga a porta-laser
  //     associada com a mesma tecla E. O botão "shoot" não entra
  //     aqui — ele é acionado por bala, ver updateBullets. ---
  nearButton = null;
  for(const b of liveButtons){
    if(b.kind !== "toggle") continue;
    if(rectsOverlap(player, b)){
      nearButton = b;
      break;
    }
  }
  if(nearButton && interactRequested && doorCooldown <= 0){
    toggleButton(nearButton);
  }
  interactRequested = false; // consumido a cada frame (one-shot)

  // --- tiro ---
  if(shootCooldown > 0) shootCooldown -= dt;
  if(keys[SHOOT_KEY] && shootCooldown <= 0){
    fireBulletFrom(player, "player");
    shootCooldown = getCurrentWeapon().cooldown;
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
// Def de tipo de inimigo da entidade, ou null se for o player (que não
// tem "type") ou um guard, que segue os globais ARM_*/gunImg direto
// como sempre fez — só usamos isso pra achar as diferenças do boss.
function enemyDefFor(entity){
  return ENEMY_TYPES[entity.type] || null;
}

function getShoulderWorld(entity){
  const def = enemyDefFor(entity);
  const feetX = entity.x + entity.w/2;
  const feetY = entity.y + entity.h;
  const feetYOffset = entity.crouching ? CROUCH_SPRITE_FEET_Y : (def ? def.spriteFeetY : SPRITE_FEET_Y);
  const attach = entity.crouching ? ARM_ATTACH_CROUCH : (def ? def.armAttach : ARM_ATTACH);
  const frameTopY = feetY - feetYOffset;
  return {
    x: feetX + entity.facing * attach.x,
    y: frameTopY + attach.y
  };
}

function fireBulletFrom(entity, owner){
  const def = enemyDefFor(entity);
  // só o jogador usa WEAPON_DEFS (inimigos continuam com ENEMY_TYPES)
  const weapon = (entity === player) ? getCurrentWeapon() : null;
  const muzzleOffset = def ? def.muzzleOffset : (weapon ? weapon.muzzle : MUZZLE_OFFSET);
  const shoulder = getShoulderWorld(entity);
  const mx = shoulder.x + entity.facing * muzzleOffset.x;
  const my = shoulder.y + muzzleOffset.y;
  bullets.push({
    x: mx, y: my,
    vx: entity.facing * (weapon ? weapon.bulletSpeed : BULLET_SPEED),
    vy: 0,
    t: 0,
    owner,
    // dano e tamanho próprios (só balas do jogador); sem isso valem os padrões
    damage: weapon ? weapon.damage : undefined,
    w: weapon ? weapon.bulletW : undefined,
    h: weapon ? weapon.bulletH : undefined,
    // qual sprite desenhar (ver drawBullets) — guard/player usam o
    // bulletImg padrão (bullet.png), boss usa a bala própria (bullet2.png)
    img: def ? def.bulletImg : (weapon ? weapon.bulletImg : bulletImg)
  });
  // SFX do disparo: varia por arma (jogador) ou por tipo de inimigo
  if(entity === player){
    const weaponKey = player.weapons[player.weaponIdx];
    if(weaponKey === "machine_gun") playSfx('playerMetralhadora');
    else if(weaponKey === "railgun") playSfx('playerRailgun');
    else playSfx('playerPistola');
  } else if(entity.type === "boss"){
    playSfx('bossShot');
  } else if(entity.type === "gladiator"){
    playSfx('enemy2Shot');
  } else {
    playSfx('enemy1Shot'); // guard
  }
}

function hitsEntity(entity, x, y){
  // Intervalo semiaberto ([x, x+w) e [y, y+h)) em vez de aberto dos dois
  // lados: com desigualdade estrita nas duas pontas, um ponto que caia
  // EXATAMENTE na costura entre dois tiles vizinhos (ex.: bala voando na
  // altura y=48, com um trigger terminando em y=48 e o próximo começando
  // em y=48) não pertencia a nenhum dos dois — "buraco" de 0px na emenda.
  // Com >= na borda inicial e < na final, cada ponto cai em exatamente um
  // dos retângulos adjacentes, sem sobreposição nem buraco.
  return x >= entity.x && x < entity.x + entity.w &&
         y >= entity.y && y < entity.y + entity.h;
}

// Área usada pra bala inimiga acertar o jogador — igual à hitbox de
// colisão normalmente, mas mais alta (cobrindo o sprite visível
// inteiro) enquanto agachado. Ver PLAYER_CROUCH_HURT_H.
function getPlayerHurtbox(){
  if(!player.crouching) return player;
  const feetY = player.y + player.h;
  return { x: player.x, y: feetY - PLAYER_CROUCH_HURT_H, w: player.w, h: PLAYER_CROUCH_HURT_H };
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
      const barrel = barrelAt(b.x, b.y);
      const crate = barrel ? null : crateAt(b.x, b.y);
      // Qualquer gatilho secreto vivo bloqueia a bala (some, "morre" ao
      // bater), mas só o do tipo bulletCollision efetivamente abre a
      // passagem — o playerCollision só barra o tiro mesmo, sem revelar
      // nada (é o jogador encostando que abre esse, não uma bala).
      const secretHit = (barrel || crate || secretOpened) ? null : liveSecretTriggers.find(t => hitsEntity(t, b.x, b.y));
      if(barrel){
        dead = true;
        explodeBarrel(barrel); // bala do jogador OU do inimigo faz o barril explodir
      } else if(crate){
        dead = true;
        damageCrate(crate); // bala inimiga só é bloqueada, não quebra caixa
      } else if(secretHit){
        dead = true;
        if(secretHit.trigger === "bulletCollision") openSecretPassage(); // bala do jogador OU do inimigo abre a passagem secreta
      } else if(isSolidTile(currentMap, b.x, b.y)){
        dead = true;
      } else if(activeLaserAt(b.x, b.y)){
        dead = true; // porta-laser ligada bloqueia bala, igual parede — não tem "dano" nela
      } else {
        const btn = liveButtons.find(bb => bb.kind === "shoot" && !bb.disabled && hitsEntity(bb, b.x, b.y));
        if(btn){
          dead = true;
          if(b.owner === "player") hitShootButton(btn); // bala inimiga só é bloqueada, não acerta o botão
        }
      }
    }

    if(!dead && b.owner === "player"){
      for(let j = enemies.length - 1; j >= 0; j--){
        const enemy = enemies[j];
        if(hitsEntity(enemy, b.x, b.y)){
          enemy.hp -= (b.damage || ENEMY_HIT_DAMAGE);
          if(enemy.hp <= 0){
            playSfx(enemy.type === "boss" ? 'bossDeath' : enemy.type === "gladiator" ? 'enemy2death' : 'enemy1death');
            enemies.splice(j, 1);
            if(enemy.type === "boss") winGame();
          } else playSfx('pain');
          dead = true;
          break;
        }
      }
    } else if(!dead && b.owner === "enemy"){
      if(hitsEntity(getPlayerHurtbox(), b.x, b.y)){
        dead = true;
        damagePlayer(PLAYER_HIT_DAMAGE, PLAYER_INVULN_TIME);
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
  } else if(entity.dashing && animsSet.dash){
    nextState = "dash";
  } else if(entity.crouching && animsSet.crouch){
    nextState = moving ? "crouch" : "crouchIdle";
  } else if(entity.doubleJumping && animsSet.doubleJump){
    nextState = "doubleJump";
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

function crateBlocksSightAt(worldX, worldY){
  const c = crateAt(worldX, worldY);
  return (c && c.h >= CRATE_SIGHT_BLOCK_MIN_H) ? c : null;
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
    const x = ex + (tx-ex)*t, y = ey + (ty-ey)*t;
    if(isSolidTile(currentMap, x, y) || crateBlocksSightAt(x, y)) return false;
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
    const def = ENEMY_TYPES[enemy.type];
    // Distância horizontal mínima pra valer a pena atirar (senão a
    // bala nasce depois do alvo — ver def.minShotDx, calculado junto
    // com ENEMY_TYPES). Se estiver muito perto, o inimigo recua
    // tentando abrir espaço em vez de ficar parado desperdiçando tiro.
    // limiar diferente dependendo do estado anterior: se já estava
    // "longe o bastante" (parado atirando), só volta a recuar se dx cair
    // BEM abaixo do limiar; se já estava recuando, só para de recuar se
    // dx passar BEM acima. A zona morta no meio impede o flip.
    const shotThreshold = enemy.farEnough
      ? def.minShotDx - ENEMY_SHOT_DX_HYSTERESIS
      : def.minShotDx + ENEMY_SHOT_DX_HYSTERESIS;
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
        enemy.shootCooldown = def.shootCooldown; // guard: 0.9s / boss: 0.4s (bem mais rápido)
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

  updateAnimState(enemy, ENEMY_TYPES[enemy.type].anims, dt);
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
  let camY = (player.y + player.h - CAMERA_EYE_OFFSET) - viewH/2;
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
   MINIMAPA (canto superior direito, só aparece com gameStarted)
   ============================================================ */
// Cria o <canvas> do minimapa em JS puro e o encaixa como overlay fixo
// na tela, sem precisar editar o HTML (o projeto só tem o game.js
// como arquivo entregue). Chamado uma única vez, no carregamento do script.
function createMinimapDOM(){
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.top = MINIMAP_MARGIN + 'px';
  wrap.style.right = MINIMAP_MARGIN + 'px';
  wrap.style.padding = '3px';
  wrap.style.background = 'rgba(5,6,8,0.6)';
  wrap.style.border = '4px solid #2b2f3a';
  wrap.style.lineHeight = '0';       // evita espaço extra abaixo do canvas
  wrap.style.pointerEvents = 'none'; // não atrapalha cliques no jogo
  wrap.style.zIndex = '20';
  wrap.style.display = 'none';       // só aparece quando gameStarted (ver drawMinimap)

  minimapCanvas = document.createElement('canvas');
  minimapCanvas.width = MINIMAP_MAX_W;
  minimapCanvas.height = MINIMAP_MAX_H;
  minimapCanvas.style.display = 'block';
  minimapCanvas.style.imageRendering = 'pixelated';
  minimapCtx = minimapCanvas.getContext('2d');

  wrap.appendChild(minimapCanvas);
  document.body.appendChild(wrap);
  minimapWrap = wrap;
}

// Pré-desenha (bake) o terreno sólido do mapa atual (layer "Platforms")
// num canvas offscreen na resolução final do minimapa — feito UMA VEZ
// por troca de mapa, não todo frame (mesma ideia de offscreen canvas
// já usada no resto do jogo). O canvas visível também é redimensionado
// aqui, já que cada mapa pode ter uma proporção/tamanho diferente.
function bakeMinimapTerrain(mapData){
  const scale = Math.min(MINIMAP_MAX_W / mapData.pxWidth, MINIMAP_MAX_H / mapData.pxHeight);
  const w = Math.max(1, Math.round(mapData.pxWidth * scale));
  const h = Math.max(1, Math.round(mapData.pxHeight * scale));
  minimapScale = scale;

  minimapTerrainCanvas = document.createElement('canvas');
  minimapTerrainCanvas.width = w;
  minimapTerrainCanvas.height = h;
  const tctx = minimapTerrainCanvas.getContext('2d');
  tctx.fillStyle = "#11151c";
  tctx.fillRect(0, 0, w, h);
  tctx.fillStyle = "#4a5568";
  // Limites de cada coluna/linha calculados uma vez (floor acumulado),
  // em vez de um tamanho fixo por tile: assim cada tile ocupa
  // exatamente o espaço até o PRÓXIMO começar — nada de sobra
  // (overlap) nem de falta (seam), igual a grade real do jogo.
  const colX = new Array(mapData.width + 1);
  for(let col = 0; col <= mapData.width; col++) colX[col] = Math.floor(col * TILE * scale);
  const rowY = new Array(mapData.height + 1);
  for(let row = 0; row <= mapData.height; row++) rowY[row] = Math.floor(row * TILE * scale);

  for(let row = 0; row < mapData.height; row++){
    for(let col = 0; col < mapData.width; col++){
      if(tileAt(mapData.platforms, mapData, col, row) !== 0){
        tctx.fillRect(colX[col], rowY[row], colX[col+1] - colX[col], rowY[row+1] - rowY[row]);
      }
    }
  }

  // escadas (layer "Ladder") — mesmos limites colX/rowY acima
  if(mapData.ladder){
    tctx.fillStyle = "#e0c068";
    for(let row = 0; row < mapData.height; row++){
      for(let col = 0; col < mapData.width; col++){
        if(tileAt(mapData.ladder, mapData, col, row) !== 0){
          tctx.fillRect(colX[col], rowY[row], colX[col+1] - colX[col], rowY[row+1] - rowY[row]);
        }
      }
    }
  }

  if(minimapCanvas){
    minimapCanvas.width = w;
    minimapCanvas.height = h;
  }
}

// Desenha um retângulo do MUNDO (x,y,w,h) já escalado pro minimapa,
// com uma largura/altura mínima de MINIMAP_MIN_DOT px pra objetos
// pequenos (barril, botão) não sumirem virando menos de 1px.
const MINIMAP_MIN_DOT = 2;
function drawMinimapRect(x, y, w, h, color){
  // Arredonda início E FIM (em vez de posição + tamanho separados) —
  // assim, quando o fim de um retângulo no MUNDO é o começo do
  // próximo (ex.: plataformas-objeto coladas lado a lado), os dois
  // caem exatamente no mesmo pixel aqui, sem sobrar aquela linha fina
  // de antialiasing entre eles (o que acontecia usando w*scale como
  // tamanho fixo em vez de recalcular o fim a partir de x+w).
  const x1 = Math.floor(x * minimapScale);
  const y1 = Math.floor(y * minimapScale);
  const x2 = Math.floor((x + w) * minimapScale);
  const y2 = Math.floor((y + h) * minimapScale);
  minimapCtx.fillStyle = color;
  minimapCtx.fillRect(
    x1, y1,
    Math.max(MINIMAP_MIN_DOT, x2 - x1), Math.max(MINIMAP_MIN_DOT, y2 - y1)
  );
}

function drawMinimap(){
  if(!minimapWrap) return;
  if(!gameStarted){ minimapWrap.style.display = 'none'; return; }
  if(!minimapCtx || !minimapTerrainCanvas || !currentMap) return;
  minimapWrap.style.display = 'block';

  const w = minimapCanvas.width, h = minimapCanvas.height;
  minimapCtx.clearRect(0, 0, w, h);
  minimapCtx.drawImage(minimapTerrainCanvas, 0, 0);

  // líquidos (água, lodo, lava etc.)
  for(const l of liveLiquids) drawMinimapRect(l.x, l.y, l.w, l.h, "rgba(70,140,210,0.65)");

  // plataformas one-way (estática/elevador/circular/horizontal)
  for(const p of livePlatforms) drawMinimapRect(p.x, p.y, p.w, p.h, "#c9902f");

  // caixas destrutíveis
  for(const c of crates) drawMinimapRect(c.x, c.y, c.w, c.h, "#9a6a38");

  // barris explosivos
  for(const b of barrels) drawMinimapRect(b.x, b.y, b.w, b.h, "#d2732c");

  // portas de transição entre mapas (objectgroup "Doors")
  for(const d of (currentMap.doors || [])) drawMinimapRect(d.x, d.y, d.width, d.height, "#5fb8d1");

  // portas-laser/barreiras (objectgroup "Triggers") — vermelho bloqueando, verde liberada
  for(const l of liveLasers) drawMinimapRect(l.x, l.y, l.w, l.h, l.blocking ? "#e05a5a" : "#5fd15f");

  for(const b of liveButtons) drawMinimapRect(b.x, b.y, b.w, b.h, b.disabled ? "#6b6b6b" : "#c77dd1");

  // itens coletáveis ainda no chão — quadradinho verde de tamanho fixo (3px)
  // com contorno escuro, pra não sumir em cima das plataformas; some ao coletar
  for(const it of liveItems){
    const ix = Math.round((it.x + it.w/2) * minimapScale) - 1;
    const baseY = Math.floor((it.y + it.h) * minimapScale);
    minimapCtx.fillStyle = "#0b0d12";
    minimapCtx.fillRect(ix - 1, baseY - 4, 5, 4);
    minimapCtx.fillStyle = "#7dff9a";
    minimapCtx.fillRect(ix, baseY - 3, 3, 3);
  }

  if(!secretOpened || secretDissolving){
    for(const t of secretTiles) drawMinimapRect(t.x, t.y, t.w, t.h, "#4fd1c5");
    for(const trig of liveSecretTriggers) drawMinimapRect(trig.x, trig.y, trig.w, trig.h, "#4fd1c5");
  }

  // inimigos vivos
  minimapCtx.fillStyle = "#e05a5a";
  for(const e of enemies){
    minimapCtx.beginPath();
    minimapCtx.arc((e.x + e.w/2) * minimapScale, (e.y + e.h/2) * minimapScale, 2, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  // retângulo mostrando a área visível na câmera agora
  const viewW = canvas.width / ZOOM, viewH = canvas.height / ZOOM;
  minimapCtx.strokeStyle = "rgba(255,255,255,0.55)";
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(CURRENT_CAM.xInt * minimapScale, CURRENT_CAM.yInt * minimapScale, viewW * minimapScale, viewH * minimapScale);

  // jogador (destaque)
  const px = (player.x + player.w/2) * minimapScale, py = (player.y + player.h/2) * minimapScale;
  minimapCtx.fillStyle = "#e8c14c";
  minimapCtx.beginPath();
  minimapCtx.arc(px, py, 3, 0, Math.PI * 2);
  minimapCtx.fill();
  minimapCtx.strokeStyle = "#0b0d12";
  minimapCtx.lineWidth = 1;
  minimapCtx.stroke();
}

/* ============================================================
   RENDER
   ============================================================ */
function drawTileLayer(layer, mapData){
  if(!layer) return;
  const tilesFirstGid = mapData.tilesFirstGid; // tileset "tiles" (assets/tiles.png) — pode aparecer misturado na mesma layer (ex.: Platforms), ver parseTMX
  for(let row=0; row<mapData.height; row++){
    for(let col=0; col<mapData.width; col++){
      const gid = layer[row*mapData.width + col];
      if(!gid) continue;
      if(tilesFirstGid !== null && gid >= tilesFirstGid){
        if(!tilesImg) continue;
        const idx = gid - tilesFirstGid;
        const sx = (idx % mapData.tilesColumns) * TILE;
        const sy = Math.floor(idx / mapData.tilesColumns) * TILE;
        ctx.drawImage(tilesImg, sx, sy, TILE, TILE, col*TILE, row*TILE, TILE, TILE);
        continue;
      }
      if(gid >= DOOR_TILE_GID) continue; // outro tileset com desenho próprio (porta, etc.) — ignora aqui
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

function drawBarrels(){
  for(const b of barrels){
    if(barrelImg){
      // imagem (16x20) é 4px mais alta que a hitbox/tile-object (16x16)
      // — ancorada pela BASE, igual sprites do jogador maiores que a
      // hitbox (ver SPRITE_FEET_Y), pra sobrar pra cima e não pra baixo.
      ctx.drawImage(barrelImg, b.x, b.y + b.h - barrelImg.height, barrelImg.width, barrelImg.height);
    } else {
      ctx.fillStyle = "#8a5a2a"; // fallback simples caso a imagem ainda não tenha carregado
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    if(b.fuseTimer !== null){
      // "Contagiado" por uma explosão em cadeia: overlay vermelho que
      // fica mais forte conforme o fuseTimer se esgota, avisando que
      // esse barril também vai estourar.
      const progress = 1 - Math.max(0, b.fuseTimer) / BARREL_CHAIN_DELAY;
      ctx.save();
      ctx.globalAlpha = 0.25 + progress * 0.5;
      ctx.fillStyle = "#ff3b30";
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    }
  }
}

function drawExplosions(){
  if(explosions.length === 0) return;
  ctx.save();
  for(const e of explosions){
    const img = (e.kind === "crate" ? crateExplosionImgs : explosionImgs)[e.frame];
    if(!img) continue;
    if(e.kind === "crate"){
      // Sprite simétrico (60x60, sem espaço vazio sobrando) — desenhado
      // centralizado no próprio ponto de spawn (centro da caixa).
      ctx.drawImage(img, e.x - img.width/2, e.y - img.height/2, img.width, img.height);
    } else {
      // Ancorado pela base (e.y = base do barril), com EXPLOSION_GROUND_OFFSET
      // deslocando o quadro pra cima até a "linha do chão" do sprite bater
      // com esse ponto — mesmo esquema de drawSplashes, só que com esse
      // offset extra por causa do espaço vazio acima na spritesheet.
      ctx.drawImage(img, e.x - img.width/2, e.y - EXPLOSION_GROUND_OFFSET, img.width, img.height);
    }
  }
  ctx.restore();
}

function drawSecretTile(t, firstGid, cols){
  const idx = t.gid - firstGid;
  const sx = (idx % cols) * TILE;
  const sy = Math.floor(idx / cols) * TILE;

  if(!secretDissolving || !t._dissolve){
    ctx.drawImage(tilesImg, sx, sy, TILE, TILE, t.x, t.y, t.w, t.h);
    return;
  }

  // Desfragmentando: desenha só as células cuja vez ainda não chegou,
  // cada uma amostrando o pedaço correspondente da própria arte do
  // tile (sem sair do lugar), com um fadezinho (SECRET_DISSOLVE_FADE)
  // logo antes de sumir de vez pra não "piscar" seco.
  const { cellCols, cellRows, vanish } = t._dissolve;
  const cellW = t.w / cellCols, cellH = t.h / cellRows;
  const srcCellW = TILE / cellCols, srcCellH = TILE / cellRows;
  for(let row = 0; row < cellRows; row++){
    for(let col = 0; col < cellCols; col++){
      const vanishAt = vanish[row * cellCols + col];
      const alpha = Math.max(0, Math.min(1, (vanishAt - secretDissolveT) / SECRET_DISSOLVE_FADE));
      if(alpha <= 0) continue; // célula já sumiu de vez
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        tilesImg,
        sx + col * srcCellW, sy + row * srcCellH, srcCellW, srcCellH,
        t.x + col * cellW, t.y + row * cellH, cellW, cellH
      );
    }
  }
}

function drawSecrets(){
  if(!tilesImg || currentMap.tilesFirstGid === null) return;
  if(secretOpened && !secretDissolving) return; // já sumiu de vez, sem resquício de animação

  const firstGid = currentMap.tilesFirstGid;
  const cols = currentMap.tilesColumns;
  ctx.save();
  for(const t of secretTiles) drawSecretTile(t, firstGid, cols);
  for(const trig of liveSecretTriggers) drawSecretTile(trig, firstGid, cols);
  ctx.restore();
}

function drawLasers(){
  for(const l of liveLasers){
    const imgs = l.kind === "barrier" ? barrierImgs : laserImgs;
    const img = imgs[l.frame];
    if(img){
      ctx.drawImage(img, l.x, l.y, l.w, l.h);
    } else {
      // fallback simples caso a imagem ainda não tenha carregado
      ctx.fillStyle = l.blocking ? "#c0392b" : "#3a3a3a";
      ctx.fillRect(l.x, l.y, l.w, l.h);
    }
  }
}

function drawButtons(){
  for(const b of liveButtons){
    let img;
    if(b.kind === "toggle") img = b.on ? buttonToggleOnImg : buttonToggleOffImg;
    else img = buttonShootImgs[b.hits];

    if(img){
      ctx.drawImage(img, b.x, b.y, b.w, b.h);
    } else {
      ctx.fillStyle = "#888888";
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    if(b.hitFlash > 0){
      ctx.save();
      ctx.globalAlpha = (b.hitFlash / CRATE_HIT_FLASH_TIME) * 0.65;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(b.x, b.y, b.w, b.h);
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

// Desenha os tiles de líquido com transparência (LIQUID_ALPHA). Um
// ctx.save()/restore() só em volta do laço inteiro (não por tile) evita
// ficar trocando globalAlpha repetidamente à toa.
function drawLiquids(){
  if(liveLiquids.length === 0) return;
  ctx.save();
  ctx.globalAlpha = LIQUID_ALPHA;
  for(const l of liveLiquids){
    if(l.def && l.def.img){
      ctx.drawImage(l.def.img, l.x, l.y, l.w, l.h);
    } else {
      // fallback simples caso a imagem ainda não tenha carregado
      ctx.fillStyle = l.kind === "lava" ? "#c0392b" : "#3a7bd5";
      ctx.fillRect(l.x, l.y, l.w, l.h);
    }
  }
  ctx.restore();
}

function drawSplashes(){
  if(splashes.length === 0) return;
  ctx.save();
  for(const s of splashes){
    const img = splashImgs[s.frame];
    if(!img) continue;
    ctx.globalAlpha = SPLASH_ALPHA[s.frame] !== undefined ? SPLASH_ALPHA[s.frame] : 1;
    // Ancorado pela BASE (não pelo centro): s.y já é a borda de CIMA do
    // tile de superfície (ver liquidSurfaceY), então o splash fica
    // encostado em cima dele, sem "afundar" metade pra dentro da água.
    ctx.drawImage(img, s.x - img.width/2, s.y - img.height, img.width, img.height);
  }
  ctx.restore();
}

// Balãozinho "E" flutuante, usado tanto pela porta de transição de
// mapa quanto pelo botão "toggle" — (centerX, topY) é o topo/centro
// do objeto sobre o qual o balão deve flutuar.
function drawInteractPrompt(centerX, topY){
  const bounce = Math.sin(promptT * 6) * 1.6;
  const cx = centerX;
  const cy = topY - 8 + bounce;

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

function drawDoorPrompt(){
  if(!nearDoor) return;
  drawInteractPrompt(nearDoor.x + nearDoor.width/2, nearDoor.y);
}

function drawButtonPrompt(){
  if(!nearButton) return;
  drawInteractPrompt(nearButton.x + nearButton.w/2, nearButton.y);
}

function isBlinkHidden(entity){
  if(entity !== player) return false;
  // pisca enquanto o jogador está invencível logo após tomar dano...
  if(player.invulnT > 0) return Math.floor(player.invulnT * 12) % 2 === 0;
  // ...ou, sem dar invencibilidade, só o efeito visual durante o dash
  if(player.dashBlinkT > 0) return Math.floor(player.dashBlinkT * 12) % 2 === 0;
  return false;
}

// c = onde desenhar (padrão: o canvas do jogo); skipShadow = não desenha a sombra (usado na máscara do CRT)
function drawCharacter(entity, animsSet, c = ctx, skipShadow = false){
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
  if(!skipShadow){
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.beginPath();
    c.ellipse(drawFeet.x, drawFeet.y + 1, entity.w/2, 2, 0, 0, Math.PI*2);
    c.fill();
  }

  if(!anim.img){
    // fallback simples caso os spritesheets ainda não tenham carregado
    c.fillStyle = "#3fb6e0";
    c.fillRect(drawFeet.x - entity.w/2, drawFeet.y - entity.h, entity.w, entity.h);
    return;
  }

  // largura do frame: só o boss difere (40px vs 32px do player/guard —
  // ver BOSS_SPRITE_W), por isso passa pelo ENEMY_TYPES do tipo
  const def = enemyDefFor(entity);
  const spriteW = def ? def.spriteW : SPRITE_W;
  const sx = entity.animFrame * spriteW;

  // pisca enquanto o jogador está invencível logo após tomar dano
  if(isBlinkHidden(entity)) return;

  // agachado usa um frame mais baixo (32px) com a linha dos pés em
  // outra posição dentro do frame — ver CROUCH_SPRITE_H/FEET_Y
  const spriteH = entity.crouching ? CROUCH_SPRITE_H : (def ? def.spriteH : SPRITE_H);
  const feetYOffset = entity.crouching ? CROUCH_SPRITE_FEET_Y : (def ? def.spriteFeetY : SPRITE_FEET_Y);

  c.save();
  c.translate(drawFeet.x, drawFeet.y - feetYOffset);
  c.scale(entity.facing, 1);
  c.drawImage(anim.img, sx, 0, spriteW, spriteH, -spriteW/2, 0, spriteW, spriteH);
  c.restore();
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

function drawArm(entity, c = ctx){
  // player/guard usam o braço padrão (gun.png); boss usa o próprio
  // (chain_gun.png, def.armImg) — ver ENEMY_TYPES/enemyDefFor
  const def = enemyDefFor(entity);
  const weapon = (entity === player) ? getCurrentWeapon() : null;
  const img = def ? def.armImg : (weapon ? weapon.armImg : gunImg);
  if(!img) return;
  const armW = def ? def.armW : (weapon ? weapon.armW : ARM_W);
  const armH = def ? def.armH : (weapon ? weapon.armH : ARM_H);
  const pivot = def ? def.armPivot : (weapon ? weapon.armPivot : ARM_PIVOT);
  const shoulder = getShoulderWorld(entity);
  // mesma condição de drawCharacter: só arredonda pela câmera quando
  // grudado numa plataforma em movimento, senão desalinha do resto
  const drawShoulder = entity.ridingPlatform ? snapToCam(shoulder.x, shoulder.y) : shoulder;
  c.save();
  c.translate(drawShoulder.x, drawShoulder.y);
  c.scale(entity.facing, 1);
  c.drawImage(img, 0, 0, armW, armH, -pivot.x, -pivot.y, armW, armH);
  c.restore();
}

function drawBullets(){
  for(const b of bullets){
    // cada bala guarda seu próprio sprite (ver fireBulletFrom): bala
    // padrão (bullet.png) pro player/guard, bullet2.png pro boss
    const img = b.img || bulletImg;
    if(!img) continue;
    const bw = b.w || BULLET_W, bh = b.h || BULLET_H;
    ctx.drawImage(img, b.x - bw/2, b.y - bh/2, bw, bh);
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
  ctx.fillStyle = victory ? "#6adf7a" : "#e05a5a"; // verde na vitória, vermelho na derrota
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(victory ? "VOCÊ VENCEU" : "VOCÊ MORREU", canvas.width/2, canvas.height/2 - 12);
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
  drawSecrets();
  drawLadderTiles(currentMap.ladder, currentMap);
  drawPlatforms();
  drawCrates();
  drawBarrels();
  drawLasers();
  drawButtons();
  drawDoorTiles(currentMap.doorsTiles, currentMap);
  drawDoorPrompt();
  drawButtonPrompt();
  drawLoots();
  drawItems();

  for(const enemy of enemies){
    drawCharacter(enemy, ENEMY_TYPES[enemy.type].anims);
    drawArm(enemy);
    drawEnemyHealthBar(enemy);
  }

  drawCharacter(player, ANIMS);
  if(!isBlinkHidden(player) && !player.climbing) drawArm(player);
  drawPlayerEffects();

  // Redesenha a camada de tiles SÓLIDOS (plataformas/paredes) por cima
  // do personagem+braço, só nos dois casos em que isso é necessário:
  // 1) Agachado, o sprite (32px) é mais alto que a hitbox (14px) usada
  //    pra caber no vão de 1 tile — a cabeça pode visualmente avançar
  //    por cima do tile do teto.
  // 2) Submerso num líquido, perto de um canto/parede enquanto o braço
  //    aponta pra lá — o braço podia ficar visualmente na frente da
  //    parede, o que parecia estranho.
  // Fora desses dois casos, o personagem/braço continuam desenhados por
  // cima das plataformas normalmente (comportamento padrão).
  /* if(player.crouching || player.inLiquid) */ drawTileLayer(currentMap.platforms, currentMap);
  drawSecrets();

  drawBullets();

  // Desenhada por cima de personagens/balas — os tiles translúcidos de
  // líquido ficam na frente do jogador/inimigos (efeito de "estar
  // dentro" da água), não atrás.
  drawLiquids();
  drawSplashes();
  drawExplosions();

  ctx.restore();

  CRT.snapWorld(); // guarda o frame só com o mundo (antes do HUD) — usado pela persistência do CRT

  // Máscara do que está "preso à câmera" (jogador + plataforma em que ele está): o CRT usa a
  // paridade de linha da TELA nesses pixels, pra não tremerem quando a câmera anda 1px.
  const lockCtx2d = CRT.beginLock();
  if(lockCtx2d){
    const rp = player.ridingPlatform;
    if(rp){
      const rpPos = snapToCam(rp.x, rp.y);   // mesma posição usada em drawPlatforms
      if(rp.def.img) lockCtx2d.drawImage(rp.def.img, rpPos.x, rpPos.y, rp.w, rp.h);
      else lockCtx2d.fillRect(rpPos.x, rpPos.y, rp.w, rp.h);
    }
    drawCharacter(player, ANIMS, lockCtx2d, true);
    if(!isBlinkHidden(player) && !player.climbing) drawArm(player, lockCtx2d);
  }

  drawPlayerHealthBar();
  drawPlayerShieldBar();
  drawWeaponHud();
  drawEffectsHud();
  drawBackpack();
  drawToast();
  drawMinimap(); // controla sua própria visibilidade (só some/aparece via gameStarted)
  if(gameOver) drawGameOver();
  if(!gameStarted) drawStartScreen();

  CRT.apply(); // pós-processamento CRT / cores (não faz nada se estiver desligado)
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
    if(keys["Enter"] || keys["NumpadEnter"]){ gameStarted = true; startMusic(); }
  } else if(transitioning){
    // tela fechando/abrindo entre mapas: nada de gameplay roda
    updateMapTransition(dt);
  } else {
    updatePlatforms(dt); // continua animando mesmo depois do game over
    updatePlayer(dt);
    updateExplosions(dt); // continua animando mesmo depois do game over (ex.: morreu pro próprio barril)
    updateBarrels(dt); // idem: reação em cadeia continua mesmo depois do game over
    if(!gameOver){
      // depois que o jogador morre, os inimigos param de agir/atirar
      updateEnemies(dt);
      updateBullets(dt);
      updateCrates(dt);
      updateTriggers(dt);
      updateSecrets(dt);
      updateLoots(dt);
      updateItems(dt);
      updatePowerups(dt);
      updateSplashes(dt);
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
    const bossAnimKeys = Object.keys(BOSS_ANIMS);
    const gladiatorAnimKeys = Object.keys(GLADIATOR_ANIMS);
    const crateKeys = Object.keys(CRATE_DEFS);
    const lootKeys = Object.keys(LOOT_DEFS);
    const platformKeys = Object.keys(PLATFORM_DEFS);
    const liquidTileKeys = Object.keys(LIQUID_TILE_DEFS);
    const [[tileset, door, gun, bullet, chainGun, bullet2, shotgun, bullet3, ladder, barrel, tiles], , , , , , , , mapsRaw, laserFrames, barrierFrames, buttonShootFrames, [toggleOn, toggleOff], , splashFrames, explosionFrames, crateExplosionFrames, ] = await Promise.all([
      Promise.all([loadImage(TILESET_SRC), loadImage(DOOR_SRC), loadImage(GUN_SRC), loadImage(BULLET_SRC), loadImage(CHAIN_GUN_SRC), loadImage(BULLET2_SRC), loadImage(SHOTGUN_SRC), loadImage(BULLET3_SRC), loadImage(LADDER_SRC), loadImage(BARREL_SRC), loadImage(TILES_SRC)]),
      Promise.all(animKeys.map(async key => { ANIMS[key].img = await loadImage(ANIMS[key].src); })),
      Promise.all(enemyAnimKeys.map(async key => { ENEMY_ANIMS[key].img = await loadImage(ENEMY_ANIMS[key].src); })),
      Promise.all(bossAnimKeys.map(async key => { BOSS_ANIMS[key].img = await loadImage(BOSS_ANIMS[key].src); })),
      Promise.all(gladiatorAnimKeys.map(async key => { GLADIATOR_ANIMS[key].img = await loadImage(GLADIATOR_ANIMS[key].src); })),
      Promise.all(crateKeys.map(async key => { CRATE_DEFS[key].img = await loadImage(CRATE_DEFS[key].src); })),
      Promise.all(lootKeys.map(async key => { LOOT_DEFS[key].img = await loadImage(LOOT_DEFS[key].src); })),
      Promise.all(platformKeys.map(async key => { PLATFORM_DEFS[key].img = await loadImage(PLATFORM_DEFS[key].src); })),
      loadAllMaps(),
      Promise.all(LASER_SRC.map(src => loadImage(src))),
      Promise.all(BARRIER_SRC.map(src => loadImage(src))),
      Promise.all(BUTTON_SHOOT_SRC.map(src => loadImage(src))),
      Promise.all([loadImage(BUTTON_TOGGLE_ON_SRC), loadImage(BUTTON_TOGGLE_OFF_SRC)]),
      Promise.all(liquidTileKeys.map(async key => { LIQUID_TILE_DEFS[key].img = await loadImage(LIQUID_TILE_DEFS[key].src); })),
      Promise.all(SPLASH_SRC.map(src => loadImage(src))),
      Promise.all(EXPLOSION_SRC.map(src => loadImage(src))),
      Promise.all(CRATE_EXPLOSION_SRC.map(src => loadImage(src))),
      preloadAudio(), // decodifica música + SFX inteiros durante o loading, pra tocar sem travar depois
      // itens coletáveis + sprites/balas das armas novas (atribuídos direto
      // nos defs, igual LOOT_DEFS — por isso não precisa entrar na desestruturação)
      Promise.all([
        ...Object.keys(ITEM_DEFS).map(async key => { ITEM_DEFS[key].img = await loadImage(ITEMS_DIR + ITEM_DEFS[key].file); }),
        (async () => {
          for(const src of GUN_ICON_SRCS){
            try { WEAPON_DEFS.pistol.iconImg = await loadImage(src); break; } catch(e){ /* tenta o próximo */ }
          }
        })(), // opcional: nunca derruba o carregamento do jogo
        ...Object.keys(WEAPON_DEFS).filter(key => WEAPON_DEFS[key].armSrc).map(async key => {
          const w = WEAPON_DEFS[key];
          [w.armImg, w.bulletImg] = await Promise.all([loadImage(w.armSrc), loadImage(w.bulletSrc)]);
        })
      ])
    ]);
    tilesetImg = tileset;
    doorImg = door;
    gunImg = gun;
    bulletImg = bullet;
    chainGunImg = chainGun;
    bullet2Img = bullet2;
    shotgunImg = shotgun;
    bullet3Img = bullet3;
    ladderImg = ladder;
    barrelImg = barrel;
    tilesImg = tiles;
    MAPS_RAW = mapsRaw;
    laserImgs = laserFrames;
    barrierImgs = barrierFrames;
    buttonShootImgs = buttonShootFrames;
    buttonToggleOnImg = toggleOn;
    buttonToggleOffImg = toggleOff;
    splashImgs = splashFrames;
    explosionImgs = explosionFrames;
    crateExplosionImgs = crateExplosionFrames;

    // plugando os braços/balas carregados nos ENEMY_TYPES (ver
    // enemyDefFor/drawArm/fireBulletFrom/drawBullets) — feito aqui, e
    // não direto no objeto, porque as imagens só existem depois do load
    ENEMY_TYPES.guard.armImg = gunImg;
    ENEMY_TYPES.guard.bulletImg = bulletImg;
    ENEMY_TYPES.boss.armImg = chainGunImg;
    ENEMY_TYPES.boss.bulletImg = bullet2Img;
    ENEMY_TYPES.gladiator.armImg = shotgunImg;
    ENEMY_TYPES.gladiator.bulletImg = bullet3Img;
    WEAPON_DEFS.pistol.armImg = gunImg;
    WEAPON_DEFS.pistol.bulletImg = bulletImg;
  } catch(err){
    showLoadError(err);
    return;
  }
  currentMap = prepareMap(currentMapId);
  bakeMinimapTerrain(currentMap);
  mapLabelEl.textContent = currentMapId;
  player.x = 10;
  player.y = 70;
  spawnEnemies(currentMap);
  spawnCrates(currentMap);
  spawnBarrels(currentMap);
  spawnSecrets(currentMap);
  spawnPlatforms(currentMap);
  spawnTriggers(currentMap);
  spawnLiquids(currentMap);
  spawnItems(currentMap);
  requestAnimationFrame(loop);
}

init();
})();