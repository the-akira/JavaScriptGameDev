// ============================================================
// VETOR 2D — bloco fundamental de toda a matemática do jogo
// ============================================================
class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
  scale(s) { return new Vec2(this.x * s, this.y * s); }
  length() { return Math.hypot(this.x, this.y); }
  normalize() {
    const len = this.length();
    return len === 0 ? new Vec2(0, 0) : new Vec2(this.x / len, this.y / len);
  }
  angle() { return Math.atan2(this.y, this.x); }
}

// ============================================================
// CÂMERA — converte coordenadas de MUNDO em coordenadas de TELA
// ============================================================
class Camera {
  constructor(canvas) {
    this.pos = new Vec2(0, 0);   // posição da câmera no mundo (canto sup. esquerdo da view)
    this.canvas = canvas;
    this.smooth = true;
    this.lerpFactor = 0.08;
    this.zoom = 1;                // 1 = escala normal. >1 = zoom in, <1 = zoom out
    this.minZoom = 0.4;
    this.maxZoom = 2.5;
  }
  setZoom(z) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, z));
  }
  // Segue um alvo, centralizando-o na tela.
  // Com zoom, a "janela" visível em unidades de MUNDO mede
  // (canvas.width/zoom) x (canvas.height/zoom) — por isso dividimos.
  follow(targetPos) {
    const desired = new Vec2(
      targetPos.x - (this.canvas.width / this.zoom) / 2,
      targetPos.y - (this.canvas.height / this.zoom) / 2
    );
    if (this.smooth) {
      this.pos.x += (desired.x - this.pos.x) * this.lerpFactor;
      this.pos.y += (desired.y - this.pos.y) * this.lerpFactor;
    } else {
      this.pos = desired;
    }
  }
  snapTo(targetPos) {
    this.pos = new Vec2(
      targetPos.x - (this.canvas.width / this.zoom) / 2,
      targetPos.y - (this.canvas.height / this.zoom) / 2
    );
  }
  // MUNDO -> TELA: subtrai a posição da câmera e ESCALA pelo zoom
  worldToScreen(worldPos) {
    return new Vec2(
      (worldPos.x - this.pos.x) * this.zoom,
      (worldPos.y - this.pos.y) * this.zoom
    );
  }
  // TELA -> MUNDO: primeiro desfaz a escala, depois soma a posição da câmera
  screenToWorld(screenPos) {
    return new Vec2(
      screenPos.x / this.zoom + this.pos.x,
      screenPos.y / this.zoom + this.pos.y
    );
  }
}


// ============================================================
// ENTIDADE BASE
// ============================================================
class Entity {
  constructor(x, y, w, h) {
    this.pos = new Vec2(x, y);
    this.vel = new Vec2(0, 0);
    this.w = w; this.h = h;
    this.angle = 0;
    this.alive = true;
    this.hp = 1;
  }
  // AABB (Axis-Aligned Bounding Box) para colisão
  getAABB() {
    return {
      left: this.pos.x - this.w / 2,
      right: this.pos.x + this.w / 2,
      top: this.pos.y - this.h / 2,
      bottom: this.pos.y + this.h / 2
    };
  }
  update(dt) {
    this.pos = this.pos.add(this.vel.scale(dt));
  }
}

function aabbIntersect(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

// ============================================================
// PROJÉTIL
// ============================================================
class Bullet extends Entity {
  constructor(x, y, dir, speed, fromPlayer, life) {
    super(x, y, 6, 6);
    this.vel = dir.scale(speed);
    this.fromPlayer = fromPlayer;
    this.life = life; // segundos de vida
  }
  update(dt) {
    super.update(dt);
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }
}

// ============================================================
// JOGADOR
// ============================================================
class Player extends Entity {
  constructor(x, y) {
    super(x, y, 28, 28);
    this.speed = 260;
    this.fireCooldown = 0;
    this.fireRate = 0.22;
    this.maxHp = 5;
    this.hp = this.maxHp;
    // Invulnerabilidade temporária após tomar dano
    this.invulnerable = 0;          // segundos restantes de imunidade
    this.invulnerableDuration = 1.2; // duração total da imunidade após ser atingido
    this.blinkInterval = 0.08;       // troca visível/invisível a cada X segundos
    this.blinkTimer = 0;
    this.visible = true;             // usado pelo render pra "piscar"
  }
  update(dt, input, mouseWorld, bullets) {
    const dir = new Vec2(
      (input.right ? 1 : 0) - (input.left ? 1 : 0),
      (input.down ? 1 : 0) - (input.up ? 1 : 0)
    ).normalize();
    this.vel = dir.scale(this.speed);
    super.update(dt);

    const aim = mouseWorld.sub(this.pos);
    this.angle = aim.angle();

    this.fireCooldown -= dt;
    if (input.firing && this.fireCooldown <= 0) {
      this.fireCooldown = this.fireRate;
      bullets.push(new Bullet(this.pos.x, this.pos.y, aim.normalize(), 520, true, 2.5));
    }

    // Contagem regressiva da invulnerabilidade + alternância do "piscar"
    if (this.invulnerable > 0) {
      this.invulnerable -= dt;
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) {
        this.blinkTimer = this.blinkInterval;
        this.visible = !this.visible;
      }
      if (this.invulnerable <= 0) {
        this.invulnerable = 0;
        this.visible = true; // garante que termina visível, não "travado" invisível
      }
    }
  }
  // Chamado quando o jogador é atingido; retorna true se o dano foi de fato aplicado
  takeHit() {
    if (this.invulnerable > 0) return false;
    this.hp--;
    this.invulnerable = this.invulnerableDuration;
    this.blinkTimer = this.blinkInterval;
    this.visible = false; // já pisca a partir do frame do hit
    return true;
  }
}

// ============================================================
// INIMIGO
// ============================================================
class Enemy extends Entity {
  constructor(x, y) {
    super(x, y, 24, 24);
    this.speed = 90;
    this.hp = 2;
    this.fireCooldown = 1 + Math.random() * 2;
  }
  update(dt, playerPos, bullets) {
    const toPlayer = playerPos.sub(this.pos);
    this.angle = toPlayer.angle();
    if (toPlayer.length() > 40) {
      this.vel = toPlayer.normalize().scale(this.speed);
    } else {
      this.vel = new Vec2(0, 0);
    }
    super.update(dt);

    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0 && toPlayer.length() < 500) {
      this.fireCooldown = 1.6 + Math.random();
      bullets.push(new Bullet(this.pos.x, this.pos.y, toPlayer.normalize(), 260, false, 5));
    }
  }
}

// ============================================================
// JOGO
// ============================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

const camera = new Camera(canvas);
const player = new Player(400, 400);
camera.snapTo(player.pos);
let enemies = [];
let bullets = [];
let score = 0;
let gameOver = false;
let selectedEntity = player;

const WORLD_W = 3000, WORLD_H = 3000;
const GRID_SIZE = 100;

function spawnEnemy() {
  const margin = 200;
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) { x = player.pos.x - 500 - Math.random() * 300; y = player.pos.y + (Math.random() - 0.5) * 600; }
  else if (edge === 1) { x = player.pos.x + 500 + Math.random() * 300; y = player.pos.y + (Math.random() - 0.5) * 600; }
  else if (edge === 2) { x = player.pos.x + (Math.random() - 0.5) * 600; y = player.pos.y - 500 - Math.random() * 300; }
  else { x = player.pos.x + (Math.random() - 0.5) * 600; y = player.pos.y + 500 + Math.random() * 300; }
  x = Math.max(30, Math.min(WORLD_W - 30, x));
  y = Math.max(30, Math.min(WORLD_H - 30, y));
  enemies.push(new Enemy(x, y));
}
for (let i = 0; i < 5; i++) spawnEnemy();
setInterval(() => { if (enemies.length < 8) spawnEnemy(); }, 2200);

// ---- Input ----
const input = { up: false, down: false, left: false, right: false, firing: false };
const mouseScreen = new Vec2(0, 0);
window.addEventListener('keydown', e => {
  if (e.key === 'w' || e.key === 'ArrowUp') input.up = true;
  if (e.key === 's' || e.key === 'ArrowDown') input.down = true;
  if (e.key === 'a' || e.key === 'ArrowLeft') input.left = true;
  if (e.key === 'd' || e.key === 'ArrowRight') input.right = true;
  if (e.key === 'g' || e.key === 'G') overlays.grid = !overlays.grid;
  if (e.key === 'h' || e.key === 'H') overlays.hitbox = !overlays.hitbox;
  if (e.key === 'v' || e.key === 'V') overlays.vectors = !overlays.vectors;
  if (e.key === 'c' || e.key === 'C') camera.smooth = !camera.smooth;
  if (e.key === '+' || e.key === '=') camera.setZoom(camera.zoom * 1.1);
  if (e.key === '-' || e.key === '_') camera.setZoom(camera.zoom / 1.1);
  if (e.key === 'm' || e.key === 'M') overlays.minimap = !overlays.minimap;
  if (e.key === 'r' || e.key === 'R') {
    camera.zoom = 1;           // volta ao zoom original (1 = escala normal)
    camera.snapTo(player.pos); // centraliza na nave sem lerp (posição exata, na hora)
  }
  if (gameOver && (e.key === 'Enter' || e.key === ' ')) resetGame();
});
document.getElementById('restartBtn').addEventListener('click', resetGame);
window.addEventListener('keyup', e => {
  if (e.key === 'w' || e.key === 'ArrowUp') input.up = false;
  if (e.key === 's' || e.key === 'ArrowDown') input.down = false;
  if (e.key === 'a' || e.key === 'ArrowLeft') input.left = false;
  if (e.key === 'd' || e.key === 'ArrowRight') input.right = false;
});
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseScreen.x = e.clientX - rect.left;
  mouseScreen.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => input.firing = true);
canvas.addEventListener('mouseup', () => input.firing = false);
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  // deltaY negativo (scroll pra cima) = zoom in; positivo = zoom out
  const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
  camera.setZoom(camera.zoom * factor);
}, { passive: false });

const overlays = { grid: true, hitbox: true, vectors: true, minimap: true };

// ---- Loop ----
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  if (!gameOver) update(dt);
  render();
  requestAnimationFrame(loop);
}

// Mostra a tela de derrota com a pontuação final
function triggerGameOver() {
  gameOver = true;
  document.getElementById('finalScore').textContent = `Pontuação final: ${score}`;
  document.getElementById('gameOverScreen').style.display = 'flex';
}

// Reinicia todo o estado do jogo pro valor inicial
function resetGame() {
  player.pos = new Vec2(400, 400);
  player.vel = new Vec2(0, 0);
  player.hp = player.maxHp;
  player.alive = true;
  player.fireCooldown = 0;
  player.invulnerable = 0;
  player.visible = true;
  camera.zoom = 1;
  camera.snapTo(player.pos);
  enemies = [];
  bullets = [];
  score = 0;
  gameOver = false;
  for (let i = 0; i < 5; i++) spawnEnemy();
  document.getElementById('gameOverScreen').style.display = 'none';
}

function update(dt) {
  const mouseWorld = camera.screenToWorld(mouseScreen);
  player.update(dt, input, mouseWorld, bullets);
  player.pos.x = Math.max(0, Math.min(WORLD_W, player.pos.x));
  player.pos.y = Math.max(0, Math.min(WORLD_H, player.pos.y));

  enemies.forEach(en => en.update(dt, player.pos, bullets));
  bullets.forEach(b => b.update(dt));

  // Colisões bala <-> inimigo / jogador
  bullets.forEach(b => {
    if (!b.alive) return;
    const bBox = b.getAABB();
    if (b.fromPlayer) {
      enemies.forEach(en => {
        if (en.alive && aabbIntersect(bBox, en.getAABB())) {
          en.hp--; b.alive = false;
          if (en.hp <= 0) { en.alive = false; score += 10; }
        }
      });
    } else {
      if (player.alive && aabbIntersect(bBox, player.getAABB())) {
        b.alive = false; // a bala é destruída mesmo se o dano não for aplicado (jogador imune)
        if (player.takeHit()) {
          if (player.hp <= 0) {
            player.hp = 0;
            player.alive = false;
            triggerGameOver();
          }
        }
      }
    }
  });

  bullets = bullets.filter(b => b.alive);
  enemies = enemies.filter(en => en.alive);

  camera.follow(player.pos);
}

function worldToScreenRect(entity) {
  const s = camera.worldToScreen(entity.pos);
  return { x: s.x, y: s.y };
}

// Desenha o "chão" da área jogável e escurece tudo que fica fora dela,
// para deixar claro onde o jogador PODE ir.
function drawPlayableArea() {
  const topLeft = camera.worldToScreen(new Vec2(0, 0));
  const bottomRight = camera.worldToScreen(new Vec2(WORLD_W, WORLD_H));

  // Fora do mapa: textura hachurada cobrindo a tela toda
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dentro do mapa: fundo sólido por cima, cobrindo a hachura
  ctx.fillStyle = '#0a0f1c';
  ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);

  // Borda grossa marcando o limite exato do mapa
  ctx.strokeStyle = '#ffd27a';
  ctx.lineWidth = 3;
  ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
}

function drawGrid() {
  const topLeft = camera.worldToScreen(new Vec2(0, 0));
  const bottomRight = camera.worldToScreen(new Vec2(WORLD_W, WORLD_H));
 
  // Região visível do MAPA na tela (interseção do retângulo do mundo com o canvas)
  const viewLeft = Math.max(0, topLeft.x);
  const viewRight = Math.min(canvas.width, bottomRight.x);
  const viewTop = Math.max(0, topLeft.y);
  const viewBottom = Math.min(canvas.height, bottomRight.y);
  if (viewRight <= viewLeft || viewBottom <= viewTop) return; // mapa fora da tela
 
  ctx.strokeStyle = 'rgba(90,120,180,0.18)';
  ctx.fillStyle = 'rgba(120,150,210,0.6)';
  const fontSize = Math.max(9, Math.round(16 * camera.zoom));
  ctx.font = `${fontSize}px monospace`;
  ctx.lineWidth = 1;

  // Deslocamentos dos rótulos derivados do tamanho da fonte, não fixos —
  // assim continuam "colados" certinho na linha em qualquer zoom.
  // Em zoom=1 (fontSize=16) isso reproduz os valores originais: +20 e +19.
  const labelPadX = Math.max(3, Math.round(8 * camera.zoom));
  const labelOffX = fontSize + 4;
  const labelOffY = fontSize + 3;

  const startX = Math.max(0, Math.floor(camera.pos.x / GRID_SIZE) * GRID_SIZE);
  const endX = Math.min(WORLD_W, camera.pos.x + canvas.width / camera.zoom);
  const startY = Math.max(0, Math.floor(camera.pos.y / GRID_SIZE) * GRID_SIZE);
  const endY = Math.min(WORLD_H, camera.pos.y + canvas.height / camera.zoom);

  // Em zoom muito baixo, o espaçamento entre linhas na tela fica menor
  // que um número cabe — nesse caso mantém as linhas mas esconde o texto,
  // pra não ficar tudo embolhado e ilegível.
  const cellPx = GRID_SIZE * camera.zoom;
  const showLabels = cellPx >= 34;

  // Os rótulos ficam colados na borda VISÍVEL da área jogável (viewTop/viewLeft),
  // não numa posição fixa da tela — por isso não somem perto dos limites do mapa.
  for (let x = startX; x <= endX; x += GRID_SIZE) {
    const sx = (x - camera.pos.x) * camera.zoom;
    if (sx < viewLeft - 1 || sx > viewRight + 1) continue;
    ctx.beginPath(); ctx.moveTo(sx, viewTop); ctx.lineTo(sx, viewBottom); ctx.stroke();
    if (showLabels) ctx.fillText(x, sx + labelPadX, viewTop + labelOffX);
  }
  for (let y = startY; y <= endY; y += GRID_SIZE) {
    const sy = (y - camera.pos.y) * camera.zoom;
    if (sy < viewTop - 1 || sy > viewBottom + 1) continue;
    ctx.beginPath(); ctx.moveTo(viewLeft, sy); ctx.lineTo(viewRight, sy); ctx.stroke();
    if (showLabels && y !== 0) ctx.fillText(y, viewLeft + labelPadX, sy + labelOffY); // evita sobrepor o "0" já escrito pelo eixo X
  }
}

function drawEntity(entity, color) {
  const s = camera.worldToScreen(entity.pos);
  if (entity.visible !== false) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(entity.angle);
    ctx.scale(camera.zoom, camera.zoom); // tamanho também precisa escalar com o zoom
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(entity.w / 2, 0);
    ctx.lineTo(-entity.w / 2, entity.h / 2.5);
    ctx.lineTo(-entity.w / 3, 0);
    ctx.lineTo(-entity.w / 2, -entity.h / 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (overlays.hitbox) {
    const box = entity.getAABB();
    const topLeft = camera.worldToScreen(new Vec2(box.left, box.top));
    ctx.strokeStyle = 'rgba(255,90,90,0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(topLeft.x, topLeft.y, entity.w * camera.zoom, entity.h * camera.zoom);
  }
  if (overlays.vectors && entity.vel.length() > 1) {
    const from = s;
    const to = s.add(entity.vel.scale(0.25 * camera.zoom));
    drawArrow(from, to, '#7dffb0');
  }
}

const MM_SIZE = 220;   // tamanho do mini-mapa na tela (px)
const MM_MARGIN = 14;
 
function drawMinimap() {
  const mmX = canvas.width - MM_SIZE - MM_MARGIN;
  const mmY = MM_MARGIN;
  const scaleX = MM_SIZE / WORLD_W;
  const scaleY = MM_SIZE / WORLD_H;
 
  // Fundo do mini-mapa
  ctx.fillStyle = 'rgba(10,14,26,0.85)';
  ctx.fillRect(mmX, mmY, MM_SIZE, MM_SIZE);
  ctx.strokeStyle = '#2a3550';
  ctx.lineWidth = 1;
  ctx.strokeRect(mmX, mmY, MM_SIZE, MM_SIZE);
 
  // Contorno do MUNDO (0,0) até (WORLD_W, WORLD_H)
  ctx.strokeStyle = '#ffd27a';
  ctx.strokeRect(mmX, mmY, WORLD_W * scaleX, WORLD_H * scaleY);
 
  // Inimigos e jogador como pontos, na escala do mini-mapa
  ctx.fillStyle = '#ff5a5a';
  enemies.forEach(en => {
    ctx.beginPath();
    ctx.arc(mmX + en.pos.x * scaleX, mmY + en.pos.y * scaleY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#7ad0ff';
  ctx.beginPath();
  ctx.arc(mmX + player.pos.x * scaleX, mmY + player.pos.y * scaleY, 3.5, 0, Math.PI * 2);
  ctx.fill();
 
  // Retângulo da CÂMERA: canto (camera.pos.x, camera.pos.y),
  // tamanho em unidades de MUNDO = canvas / zoom (zoom in = janela
  // menor = vê menos mundo; zoom out = janela maior = vê mais mundo).
  const camRectX = mmX + camera.pos.x * scaleX;
  const camRectY = mmY + camera.pos.y * scaleY;
  const camRectW = (canvas.width / camera.zoom) * scaleX;
  const camRectH = (canvas.height / camera.zoom) * scaleY;
 
  ctx.fillStyle = 'rgba(122,208,255,0.15)';
  ctx.fillRect(camRectX, camRectY, camRectW, camRectH);
  ctx.strokeStyle = '#7ad0ff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(camRectX, camRectY, camRectW, camRectH);
 
  // Coordenada (x,y) e zoom da câmera colados no canto do retângulo —
  // são exatamente os valores de camera.pos/camera.zoom usados no código.
  ctx.font = '11px monospace';
  ctx.fillStyle = '#7ad0ff';
  const label = `(${camera.pos.x.toFixed(0)}, ${camera.pos.y.toFixed(0)}) ${camera.zoom.toFixed(2)}x`;
  // Se o retângulo estiver perto do topo do mini-mapa, escreve o
  // rótulo por baixo do canto pra não vazar pra fora da área.
  const labelY = camRectY > mmY + 12 ? camRectY - 4 : camRectY + 12;
  ctx.fillText(label, Math.max(mmX + 2, camRectX + 2), labelY);
}

// Barra de vida do jogador, fixa no canto da TELA (não do mundo — por isso
// não passa pelo camera.worldToScreen, é desenhada direto em coordenadas de tela).
function drawHealthBar() {
  const x = 16, y = 16, barW = 220, barH = 22;
  const pct = Math.max(0, player.hp) / player.maxHp;

  ctx.fillStyle = 'rgba(10,14,26,0.85)';
  ctx.fillRect(x - 3, y - 3, barW + 6, barH + 6);
  ctx.strokeStyle = '#2a3550';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 3, y - 3, barW + 6, barH + 6);

  ctx.fillStyle = '#2a1414'; // trilho vazio (vida perdida)
  ctx.fillRect(x, y, barW, barH);

  // Cor interpola de vermelho (pct=0) pra verde (pct=1) via HSL —
  // mesma ideia de interpolação usada no lerp da câmera, só que na cor.
  ctx.fillStyle = `hsl(${pct * 110}, 70%, 50%)`;
  ctx.fillRect(x, y, barW * pct, barH);

  ctx.strokeStyle = '#ffd27a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barW, barH);

  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`HP ${Math.max(0, player.hp)}/${player.maxHp}`, x + barW / 2, y + barH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawArrow(from, to, color) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - 8 * Math.cos(angle - 0.4), to.y - 8 * Math.sin(angle - 0.4));
  ctx.lineTo(to.x - 8 * Math.cos(angle + 0.4), to.y - 8 * Math.sin(angle + 0.4));
  ctx.closePath(); ctx.fill();
}

function render() {
  drawPlayableArea();
  if (overlays.grid) drawGrid();

  bullets.forEach(b => {
    const s = camera.worldToScreen(b.pos);
    ctx.fillStyle = b.fromPlayer ? '#7ad0ff' : '#ff7a7a';
    ctx.beginPath(); ctx.arc(s.x, s.y, 4 * camera.zoom, 0, Math.PI * 2); ctx.fill();
  });

  enemies.forEach(en => drawEntity(en, '#ff5a5a'));
  drawEntity(player, '#7ad0ff');

  // Linha de mira: vetor jogador -> mouse
  if (overlays.vectors) {
    const s = camera.worldToScreen(player.pos);
    drawArrow(s, mouseScreen, 'rgba(255,210,122,0.6)');
  }

  if (overlays.minimap) drawMinimap();
  drawHealthBar();

  updateHUD();
}

function updateHUD() {
  const mouseWorld = camera.screenToWorld(mouseScreen);
  const aim = mouseWorld.sub(player.pos);
  document.getElementById('hud').innerHTML = `
    <b>Jogador (mundo)</b> x:${player.pos.x.toFixed(0)} y:${player.pos.y.toFixed(0)}<br>
    <b>Câmera (mundo)</b> x:${camera.pos.x.toFixed(0)} y:${camera.pos.y.toFixed(0)} | <b>Zoom</b> ${camera.zoom.toFixed(2)}x<br>
    <b>Velocidade</b> (${player.vel.x.toFixed(0)}, ${player.vel.y.toFixed(0)}) |v|=${player.vel.length().toFixed(0)}<br>
    <b>Ângulo de mira</b> ${(player.angle * 180 / Math.PI).toFixed(1)}°<br>
    <b>Vetor mira normalizado</b> (${aim.normalize().x.toFixed(2)}, ${aim.normalize().y.toFixed(2)})<br>
    <b>Inimigos</b> ${enemies.length} | <b>Balas</b> ${bullets.length} | <b>Score</b> ${score}<br>
    <span class="${overlays.grid ? 'toggle-on' : 'toggle-off'}">Grid</span> ·
    <span class="${overlays.hitbox ? 'toggle-on' : 'toggle-off'}">Hitboxes</span> ·
    <span class="${overlays.minimap ? 'toggle-on' : 'toggle-off'}">Mini-mapa</span> ·
    <span class="${overlays.vectors ? 'toggle-on' : 'toggle-off'}">Vetores</span> ·
    <span class="${camera.smooth ? 'toggle-on' : 'toggle-off'}">Câmera suave</span>
  `;
}

requestAnimationFrame(loop);