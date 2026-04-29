'use strict';
// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════
const W = 800, H = 480;
const TS = 32;           // tile size
const COLS = 165;
const ROWS = 15;
const GRAV = 0.52;
const MAX_FALL = 14;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ═══════════════════════════════════════════════════════
//  TILE IDs
// ═══════════════════════════════════════════════════════
const T = { EMPTY:0, GROUND:1, BRICK:2, QUESTION:3, SOLID:4,
            PIPE_TL:5, PIPE_TR:6, PIPE_BL:7, PIPE_BR:8, USED:9, EARTH: 10 };

// ═══════════════════════════════════════════════════════
//  AUDIO  (Web Audio API – initialised on first keydown)
// ═══════════════════════════════════════════════════════
let audio = null;

function initAudio() {
  if (audio) return;
  try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
}

function beep(freq, endFreq, dur, vol=0.22, type='square') {
  if (!audio) return;
  try {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.connect(g); g.connect(audio.destination);
    o.frequency.setValueAtTime(freq, audio.currentTime);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, audio.currentTime + dur);
    g.gain.setValueAtTime(vol, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    o.start(); o.stop(audio.currentTime + dur);
  } catch(e) {}
}

const SFX = {
  jump:   () => beep(280, 560, 0.14, 0.2),
  coin:   () => { beep(880, 880, 0.05, 0.15); setTimeout(()=>beep(1760,1760,0.1,0.1),60); },
  stomp:  () => beep(120, 60,  0.1,  0.25),
  brick:  () => beep(200, 100, 0.12, 0.2),
  hurt:   () => beep(400, 100, 0.3,  0.25),
  death:  () => { beep(440,220,0.15,0.2); setTimeout(()=>beep(180,90,0.5,0.2),200); },
  question:()=> { beep(600,600,0.05,0.12); setTimeout(()=>beep(900,900,0.08,0.1),60); },
  win:    () => { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,f,0.15,0.18),i*130)); },
};

// ═══════════════════════════════════════════════════════
//  LEVEL MAP  (15 rows × 165 cols)
//
//  Legenda de caracteres:
//    .  =  vazio
//    G  =  chão grama (ground)
//    E  =  terra (earth)
//    B  =  tijolo (brick)
//    ?  =  bloco interrogação (question)
//    S  =  plataforma sólida (solid)
//    [  =  cano topo-esquerdo   ]  =  cano topo-direito
//    (  =  cano corpo-esquerdo  )  =  cano corpo-direito
//    X  =  bloco usado (used)
//
//  Dica: cada coluna = 32px, cada linha = 32px
//  O nível tem 165 colunas → largura total de 5280px
// ═══════════════════════════════════════════════════════
const LEVEL_MAP = [
  '.....................................................................................................................................................................',
  '.....................................................................................................................................................................',
  '.....................................................................................................................................................................',
  '.....................................................................................................................................................................',
  '.....................................................................................................................................................................',
  '...........................................................................................................................................................S.........',
  '.......................................................................?SB................................................SS..............................SS.........',
  '....................................................?BB?.................................................................................................SSS.........',
  '........................................................................................................................................................SSSS.........',
  '........BB?B?B......BS?SS?SB........................................SSB?SS?BS...................S?S?S?S?S...........S?S?S....B?B?B.....................SSSSS.........',
  '...................................GG.............SBSSBSS.........................GGG..........................[].....................................SSSSSS.........',
  '..................................GEE....[]......................................GEEEG.........................().....................[].............SSSSSSS.........',
  '.................................GEEE[]..()...................[]................GEEEEEG........................().....................()............SSSSSSSS.........',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEE()GG()G....GGGGGGGGGGGGGG()GGGGGGGGGGGGGGGGEEEEEEEG....GGGGGGGGGGGGGGGGGGG()GGGGGGGGGGGGGGGGGGGGG()GGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE()EE()E....EEEEEEEEEEEEEE()EEEEEEEEEEEEEEEEEEEEEEEE....EEEEEEEEEEEEEEEEEEE()EEEEEEEEEEEEEEEEEEEEE()EEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
];

// ── Parser ──────────────────────────────────────────────
// Converte os caracteres do LEVEL_MAP para IDs de tile
const TILE_CHAR = {
  '.': T.EMPTY, 'G': T.GROUND, 'B': T.BRICK,  '?': T.QUESTION,
  'S': T.SOLID, '[': T.PIPE_TL, ']': T.PIPE_TR,
  '(': T.PIPE_BL, ')': T.PIPE_BR, 'X': T.USED, 'E': T.EARTH
};

function buildLevel() {
  const m = Array.from({length: ROWS}, () => new Uint8Array(COLS));
  for (let r = 0; r < ROWS; r++) {
    const row = LEVEL_MAP[r] || '';
    for (let c = 0; c < COLS; c++) {
      const ch = row[c] ?? '.';
      m[r][c] = TILE_CHAR[ch] ?? T.EMPTY;
    }
  }
  return m;
}

// ═══════════════════════════════════════════════════════
//  TILE DRAWING
// ═══════════════════════════════════════════════════════
function drawTile(type, x, y, anim) {
  const s = TS;
  switch(type) {
    case T.GROUND: {
      // earth
      ctx.fillStyle='#6b3d1e'; ctx.fillRect(x,y,s,s);
      // dirt texture
      ctx.fillStyle='#7a4620';
      ctx.fillRect(x+4,y+10,8,4); ctx.fillRect(x+18,y+18,6,3); ctx.fillRect(x+8,y+24,7,3);
      // top grass strip
      ctx.fillStyle='#3ea832'; ctx.fillRect(x,y,s,9);
      ctx.fillStyle='#52c440'; ctx.fillRect(x+2,y,s-4,5);
      // grass tufts
      ctx.fillStyle='#60d050';
      ctx.fillRect(x+5,y-1,3,3); ctx.fillRect(x+14,y-2,3,4); ctx.fillRect(x+23,y-1,3,3);
      break;
    }
    case T.EARTH: {
      // earth base
      ctx.fillStyle='#6b3d1e'; ctx.fillRect(x,y,s,s);
      // dirt texture — manchas claras
      ctx.fillStyle='#7a4620';
      ctx.fillRect(x+4,y+10,8,4); ctx.fillRect(x+18,y+18,6,3); ctx.fillRect(x+8,y+24,7,3);
      break;
    }
    case T.BRICK: {
      ctx.fillStyle='#b84020'; ctx.fillRect(x,y,s,s);
      ctx.fillStyle='#d05030';
      ctx.fillRect(x+1,y+1,s/2-2,s/2-2);
      ctx.fillRect(x+s/2+1,y+1,s/2-2,s/2-2);
      ctx.fillRect(x+s/4,y+s/2+1,s/2,s/2-2);
      ctx.fillStyle='#8a2c14';
      ctx.fillRect(x,y+s/2-1,s,2); ctx.fillRect(x,y+s-1,s,1);
      ctx.fillRect(x+s/2-1,y,2,s/2); ctx.fillRect(x+s/4-1,y+s/2,2,s/2);
      ctx.fillRect(x+3*s/4-1,y+s/2,2,s/2);
      break;
    }
    case T.QUESTION:
    case T.USED: {
      const u = type===T.USED;
      ctx.fillStyle= u ? '#706050' : '#e8a000';
      ctx.fillRect(x,y,s,s);
      // border
      ctx.fillStyle= u ? '#504030' : '#c07800';
      ctx.fillRect(x,y,s,4); ctx.fillRect(x,y+s-4,s,4);
      ctx.fillRect(x,y,4,s); ctx.fillRect(x+s-4,y,4,s);
      // inner
      if(!u) {
        const pulse = 0.85 + Math.sin(anim*0.12)*0.15;
        ctx.fillStyle=`hsl(45,100%,${Math.round(55*pulse)}%)`;
        ctx.fillRect(x+4,y+4,s-8,s-8);
      }
      // symbol
      ctx.fillStyle= u ? '#908070' : '#ffffff';
      ctx.font=`bold ${s*0.55}px monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(u?'×':'?', x+s/2, y+s/2+1);
      break;
    }
    case T.SOLID: {
      ctx.fillStyle='#987030'; ctx.fillRect(x,y,s,s);
      ctx.fillStyle='#b89040'; ctx.fillRect(x+1,y+1,s-2,s-2);
      ctx.fillStyle='#c8a050'; ctx.fillRect(x+4,y+4,s-8,s-8);
      ctx.fillStyle='#a07828'; ctx.fillRect(x+4,y+4,s-8,3);
      ctx.fillRect(x+4,y+4,3,s-8);
      break;
    }
    case T.PIPE_TL: {
      ctx.fillStyle='#1a7800'; ctx.fillRect(x,y,s,s);
      ctx.fillStyle='#28a000'; ctx.fillRect(x+2,y+2,s-4,s-2);
      ctx.fillStyle='#50cc20'; ctx.fillRect(x+4,y+4,7,s-5);
      ctx.fillStyle='#0e5800'; ctx.fillRect(x+s-5,y,5,s);
      ctx.fillRect(x,y+s-5,s,5);
      break;
    }
    case T.PIPE_TR: {
      ctx.fillStyle='#1a7800'; ctx.fillRect(x,y,s,s);
      ctx.fillStyle='#28a000'; ctx.fillRect(x+2,y+2,s-4,s-2);
      ctx.fillStyle='#50cc20'; ctx.fillRect(x+8,y+4,5,s-5);
      ctx.fillStyle='#0e5800'; ctx.fillRect(x,y,5,s);
      ctx.fillRect(x,y+s-5,s,5);
      break;
    }
    case T.PIPE_BL: {
      ctx.fillStyle='#1a7800'; ctx.fillRect(x,y,s,s);
      ctx.fillStyle='#28a000'; ctx.fillRect(x+2,y,s-6,s);
      ctx.fillStyle='#50cc20'; ctx.fillRect(x+4,y+4,6,s-8);
      ctx.fillStyle='#0e5800'; ctx.fillRect(x+s-5,y,5,s);
      break;
    }
    case T.PIPE_BR: {
      ctx.fillStyle='#1a7800'; ctx.fillRect(x,y,s,s);
      ctx.fillStyle='#28a000'; ctx.fillRect(x+4,y,s-6,s);
      ctx.fillStyle='#50cc20'; ctx.fillRect(x+8,y+4,5,s-8);
      ctx.fillStyle='#0e5800'; ctx.fillRect(x,y,5,s);
      break;
    }
  }
}

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
function overlap(a, b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function clamp(v,lo,hi){ return v<lo?lo:v>hi?hi:v; }

// Score pop-ups
const popups = [];
function popup(x, y, text, color='#ffd700') {
  popups.push({x, y, text, color, life:55, max:55});
}

// Screen shake
let shake = 0;
function triggerShake(amt) { shake = Math.max(shake, amt); }

// ═══════════════════════════════════════════════════════
//  PARTICLE
// ═══════════════════════════════════════════════════════
class Particle {
  constructor(x,y,vx,vy,color,life,size=5,gravity=0.3){
    Object.assign(this,{x,y,vx,vy,color,life,maxLife:life,size,gravity});
  }

  update(){ this.x+=this.vx; this.y+=this.vy; this.vy+=this.gravity; this.life--; }

  draw(cx,cy){
    const a = this.life/this.maxLife;
    ctx.globalAlpha=a;
    ctx.fillStyle=this.color;
    ctx.fillRect(this.x-cx-this.size/2, this.y-cy-this.size/2, this.size, this.size);
    ctx.globalAlpha=1;
  }
}

// ═══════════════════════════════════════════════════════
//  COIN (collectible & block-eject)
// ═══════════════════════════════════════════════════════
class Coin {
  constructor(x,y,ejected=false){
    Object.assign(this,{x,y,vy:ejected?-9:0,startY:y,ejected,alive:true,anim:0,timer:0});
  }

  update(){
    this.anim++;
    if(this.ejected){
      this.vy+=0.55; this.y+=this.vy; this.timer++;
      if(this.y>=this.startY+2 && this.timer>12) this.alive=false;
    }
  }

  draw(cx,cy){
    if(!this.alive) return;
    const sx=this.x-cx, sy=this.y-cy;
    const scaleX=Math.abs(Math.sin(this.anim*0.09))*0.8+0.2;
    ctx.save();
    ctx.translate(sx,sy);
    ctx.scale(scaleX,1);
    ctx.fillStyle='#f5c518';
    ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffd700';
    ctx.beginPath(); ctx.arc(-1,-2,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffee88';
    ctx.fillRect(-2,-6,3,4);
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════
//  ENEMY
// ═══════════════════════════════════════════════════════
class Enemy {
  constructor(x,y,type='goomba'){
    Object.assign(this,{x,y,w:26,h:26,vx:type==='koopa'?-1:(-1.3),vy:0,
      type,alive:true,squished:false,squishT:0,onGround:false,anim:0,animT:0,dir:-1});
  }

  isSolid(map,c,r){
    if(r<0||r>=ROWS||c<0||c>=COLS) return c<0||c>=COLS;
    return map[r][c]!==T.EMPTY;
  }

  update(map,parts){
    if(!this.alive) return;
    if(this.squished){ this.squishT--; if(this.squishT<=0) this.alive=false; return; }

    this.animT++; if(this.animT>14){this.anim^=1;this.animT=0;}
    this.vy+=GRAV; if(this.vy>MAX_FALL) this.vy=MAX_FALL;

    // X
    this.x+=this.vx;
    const L=Math.floor(this.x/TS), R=Math.floor((this.x+this.w-1)/TS);
    const T1=Math.floor((this.y+2)/TS), B=Math.floor((this.y+this.h-1)/TS);
    if(this.vx<0){
      if(this.isSolid(map,L,T1)||this.isSolid(map,L,B)){this.x = (L+1)*TS; this.vx *= -1; this.dir = 1;}
    } else {
      if(this.isSolid(map,R,T1)||this.isSolid(map,R,B)){this.x=R*TS-this.w;this.vx*=-1;this.dir=-1;}
    }
    // Y
    this.y+=this.vy;
    const L2=Math.floor(this.x/TS), R2=Math.floor((this.x+this.w-1)/TS);
    const B2=Math.floor((this.y+this.h)/TS), Top=Math.floor(this.y/TS);
    this.onGround=false;
    if(this.vy>=0 && (this.isSolid(map,L2,B2)||this.isSolid(map,R2,B2))){
      this.y=B2*TS-this.h; this.vy=0; this.onGround=true;
    } else if(this.vy<0 && (this.isSolid(map,L2,Top)||this.isSolid(map,R2,Top))){
      this.y=(Top+1)*TS; this.vy=0;
    }
    // Edge turn
    if(this.onGround){
      const frontC = this.vx>0 ? Math.floor((this.x+this.w+2)/TS) : Math.floor((this.x-2)/TS);
      const belowR = Math.floor((this.y+this.h+1)/TS);
      if(!this.isSolid(map, frontC, belowR)){ this.vx *= -1; this.dir = this.vx > 0 ? 1 : -1; }
    }
    // Die if fallen
    if(this.y>ROWS*TS+100) this.alive=false;
  }

  squish(parts){
    this.squished=true; this.squishT=22; this.vx=0; this.vy=0;
    for(let i=0;i<8;i++)
      parts.push(new Particle(this.x+this.w/2,this.y+this.h/2,
        (Math.random()-0.5)*5,-Math.random()*4,
        this.type==='koopa'?'#3daa00':'#7a3010',28,5));
  }

  draw(cx,cy){
    if(!this.alive) return;
    const sx=this.x-cx, sy=this.y-cy;
    if(this.type==='goomba') this.drawGoomba(sx,sy);
    else this.drawKoopa(sx,sy);
  }

  drawGoomba(sx,sy){
    const w=this.w, h=this.squished?8:this.h, oy=this.h-h;
    const bx=sx, by=sy+oy;
    // body
    ctx.fillStyle='#7a3010'; ctx.fillRect(bx,by+h*0.35,w,h*0.65);
    // head ellipse
    ctx.fillStyle='#a04520';
    ctx.beginPath();
    ctx.ellipse(bx+w/2,by+h*0.38,w*0.52,h*0.42,0,0,Math.PI*2); ctx.fill();
    if(!this.squished){
      // eyes white
      ctx.fillStyle='#fff';
      ctx.fillRect(bx+4,by+3,8,7); ctx.fillRect(bx+w-12,by+3,8,7);
      // pupils (angry inward)
      ctx.fillStyle='#000';
      ctx.fillRect(bx+6,by+5,4,4); ctx.fillRect(bx+w-10,by+5,4,4);
      // brows
      ctx.fillStyle='#3a1000';
      ctx.save();
      ctx.translate(bx+2,by-2); ctx.rotate(0.45); ctx.fillRect(0,0,9,3); ctx.restore();
      ctx.save();
      ctx.translate(bx+w-10,by+2); ctx.rotate(-0.45); ctx.fillRect(0,0,9,3); ctx.restore();
      // feet
      ctx.fillStyle='#4a1808';
      const lf=this.anim===0?2:0;
      ctx.fillRect(bx,by+h-8,10,8+lf);
      ctx.fillRect(bx+w-10,by+h-8,10,8+(2-lf));
    }
  }

  drawKoopa(sx,sy){
    const w=this.w, h=this.h;
    ctx.save();
    ctx.translate(sx+w/2, sy+h/2);
    if(this.dir===1) ctx.scale(-1,1);
    ctx.translate(-w/2,-h/2);
    // shell
    ctx.fillStyle='#1a6800';
    ctx.beginPath(); ctx.ellipse(w/2,h*0.62,w/2,h*0.45,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#28a000';
    ctx.beginPath(); ctx.ellipse(w/2,h*0.58,w*0.38,h*0.35,0,0,Math.PI*2); ctx.fill();
    // pattern
    ctx.fillStyle='#20800a';
    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.arc(w/2+(i-1)*8,h*0.55,4,0,Math.PI*2); ctx.fill();
    }
    // head (facing left by default, dir=-1)
    ctx.fillStyle='#5cb800';
    ctx.beginPath(); ctx.ellipse(w*0.28,h*0.15,w*0.22,h*0.2,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#000'; ctx.fillRect(w*0.18,h*0.08,4,4);
    ctx.fillStyle='#fff'; ctx.fillRect(w*0.19,h*0.09,2,2);
    // feet
    ctx.fillStyle='#3a8800';
    const lf=this.anim===0?2:0;
    ctx.fillRect(2,h-8,10,8+lf);
    ctx.fillRect(w-12,h-8,10,8+(2-lf));
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════
//  PLAYER
// ═══════════════════════════════════════════════════════
class Player {
  constructor(x,y){
    Object.assign(this,{
      x,y,w:22,h:28,vx:0,vy:0,onGround:false,
      dir:1,anim:0,animT:0,dead:false,deathT:0,invT:0,
      score:0,coins:0,lives:3,running:false,
      coyoteT:0,jumpBuffer:0
    });
  }

  isSolid(map,c,r){
    if(r<0) return false;
    if(r>=ROWS) return false;
    return map[r][c]!==T.EMPTY;
  }

  update(keys,map,enemies,coins,parts,game){
    if(this.dead){
      this.vy+=0.5; this.y+=this.vy; this.deathT++;
      if(this.deathT>130) game.respawn();
      return;
    }
    if(this.invT>0) this.invT--;

    const spd = (keys.ShiftLeft||keys.ShiftRight) ? 5.2 : 3.6;
    this.running = !!(keys.ShiftLeft||keys.ShiftRight) && this.onGround;

    // Horizontal
    if(keys.ArrowLeft||keys.KeyA){ this.vx-=0.9; if(this.vx<-spd)this.vx=-spd; this.dir=-1; }
    else if(keys.ArrowRight||keys.KeyD){ this.vx+=0.9; if(this.vx>spd)this.vx=spd; this.dir=1; }
    else { this.vx*=0.78; if(Math.abs(this.vx)<0.1)this.vx=0; }

    // Jump buffer & coyote time
    if(keys.Space||keys.KeyZ||keys.ArrowUp) this.jumpBuffer=10;
    else if(this.jumpBuffer>0) this.jumpBuffer--;

    if(this.onGround) this.coyoteT=8;
    else if(this.coyoteT>0) this.coyoteT--;

    if(this.jumpBuffer>0 && this.coyoteT>0){
      this.vy=-13; this.coyoteT=0; this.jumpBuffer=0;
      spawnPuff(this,parts); SFX.jump();
    }
    // Variable jump height
    if(!(keys.Space||keys.KeyZ||keys.ArrowUp) && this.vy<-4) this.vy=-4;

    // Gravity
    this.vy+=GRAV; if(this.vy>MAX_FALL) this.vy=MAX_FALL;

    // Move & collide
    const prevOnGround=this.onGround;
    this.onGround=false;
    this.x+=this.vx; this.resolveX(map);
    this.y+=this.vy; this.resolveY(map,coins,parts,game);

    // Land dust
    if(!prevOnGround && this.onGround){
      for(let i=0;i<5;i++)
        parts.push(new Particle(this.x+this.w/2+(Math.random()-0.5)*14,
          this.y+this.h,(Math.random()-0.5)*3,-(Math.random()*2),'#c8a870',18,4,0.1));
    }

    // Animate
    this.animT++;
    if(this.onGround && Math.abs(this.vx)>0.3){
      if(this.animT>Math.max(3,10-Math.abs(this.vx)*1.5)){this.anim=(this.anim+1)%4;this.animT=0;}
    } else if(!this.onGround){ this.anim=2; }
    else { this.anim=0; this.animT=0; }

    // Enemy collision
    if(this.invT===0){
      let wasStomping = this.vy>1;  // ← ADICIONADO
      for(const e of enemies){
        if(!e.alive||e.squished) continue;
        if(overlap(this,e)){
          if(wasStomping && this.y+this.h < e.y+e.h*0.55){  // ← ALTERADO
            e.squish(parts); this.vy=-9; this.score+=100;
            popup(e.x+e.w/2,e.y,'+100'); SFX.stomp();
            wasStomping=true;  // ← ADICIONADO
          } else {
            this.hurt(parts); break;
          }
        }
      }
    }

    // Collect coins
    for(const c of coins){
      if(!c.alive||c.ejected) continue;
      if(overlap(this,{x:c.x-8,y:c.y-8,w:16,h:16})){
        c.alive=false; this.coins++; this.score+=50;
        popup(c.x,c.y,'+50'); SFX.coin();
        if(this.coins>=100){this.coins-=100;this.lives++;}
      }
    }

    // Kill by pit
    if(this.y>ROWS*TS+60 && !this.dead){
      this.lives=0; this.dead=true; this.vy=-13; SFX.death(); triggerShake(8);
    }
    // Win
    if(this.x>158*TS) game.win();

    // Keep in world bounds (esquerda e direita)
    if(this.x<0){this.x=0;this.vx=0;}
    if(this.x+this.w>COLS*TS){this.x=COLS*TS-this.w;this.vx=0;}
  }

  resolveX(map){
    const t=Math.floor((this.y+4)/TS), b=Math.floor((this.y+this.h-4)/TS);
    if(this.vx<0){
      const L=Math.floor(this.x/TS);
      if(this.isSolid(map,L,t)||this.isSolid(map,L,b)){this.x=(L+1)*TS;this.vx=0;}
    } else if(this.vx>0){
      const R=Math.floor((this.x+this.w)/TS);
      if(this.isSolid(map,R,t)||this.isSolid(map,R,b)){this.x=R*TS-this.w;this.vx=0;}
    }
  }

  resolveY(map,coins,parts,game){
    const l=Math.floor((this.x+3)/TS), r=Math.floor((this.x+this.w-4)/TS);
    if(this.vy>=0){
      const B=Math.floor((this.y+this.h)/TS);
      if(this.isSolid(map,l,B)||this.isSolid(map,r,B)){
        this.y=B*TS-this.h; this.vy=0; this.onGround=true;
      }
    } else {
      const Top=Math.floor(this.y/TS);
      if(this.isSolid(map,l,Top)||this.isSolid(map,r,Top)){
        let hc=Math.floor((this.x+this.w/2)/TS);
        if(!this.isSolid(map,hc,Top)) hc = this.isSolid(map,l,Top) ? l : r;
        const tile=map[Top]?.[hc]??0;
        if(tile===T.QUESTION||tile===T.USED){
          if(tile===T.QUESTION){
            coins.push(new Coin(hc*TS+TS/2,Top*TS,true));
            this.coins++; this.score+=50;
            map[Top][hc]=T.USED;
            popup(hc*TS+TS/2,Top*TS,'+50'); SFX.question();
          }
        } else if(tile===T.BRICK){
          for(let i=0;i<10;i++)
            parts.push(new Particle(hc*TS+TS/2,Top*TS+TS/2,
              (Math.random()-0.5)*7,-Math.random()*8-2,'#c04020',40,7));
          map[Top][hc]=T.EMPTY;
          this.score+=20; SFX.brick(); triggerShake(3);
        }
        this.y=(Top+1)*TS; this.vy=2;
      }
    }
  }

  hurt(parts,pit=false){
    if(this.invT>0) return;
    this.lives--;
    if(this.lives<=0){ this.dead=true; this.vy=-13; SFX.death(); triggerShake(8); return; }
    this.invT=150; this.vy=-7;
    for(let i=0;i<12;i++)
      parts.push(new Particle(this.x+this.w/2,this.y+this.h/2,
        (Math.random()-0.5)*7,-Math.random()*6,'#ff4040',35,6));
    SFX.hurt(); triggerShake(5);
    if(pit){ this.y=2*TS; this.vy=0; this.vx=0; }
  }

  draw(cx,cy){
    if(this.dead){
      if(Math.floor(this.deathT/4)%2===0) this._drawSprite(cx,cy);
      return;
    }
    if(this.invT>0 && Math.floor(this.invT/5)%2===1) return;
    this._drawSprite(cx,cy);
  }

  _drawSprite(cx,cy){
    const sx = Math.round(this.x - cx);
    const sy = Math.round(this.y - cy - 8);
    ctx.save();
    ctx.translate(sx+this.w/2, sy+this.h/2);
    if(this.dir===1) ctx.scale(-1,1);
    ctx.translate(-this.w/2,-this.h/2);

    const f=this.anim;
    const legA = this.onGround ? (f===1||f===3?3:0) : 0;
    const armA = this.onGround ? (f===0||f===2?0:3) : -1;

    // === MARIO SPRITE ===
    // Hat
    ctx.fillStyle='#cc0000';
    ctx.fillRect(2,0,18,6);
    ctx.fillRect(0,4,22,5);
    // Hair under hat
    ctx.fillStyle='#5a2200';
    ctx.fillRect(3,8,16,3);
    // Face
    ctx.fillStyle='#f8c880';
    ctx.fillRect(3,8,16,10);
    // Mustache
    ctx.fillStyle='#5a2200';
    ctx.fillRect(2,14,18,4);
    ctx.fillStyle='#f8c880';
    ctx.fillRect(4,14,14,2);
    // Eyes
    ctx.fillStyle='#000';
    ctx.fillRect(5,9,4,4);
    ctx.fillStyle='#fff'; ctx.fillRect(6,10,2,2);
    // Overalls (body)
    ctx.fillStyle='#2244cc';
    ctx.fillRect(3,18,16,9);
    // Buttons
    ctx.fillStyle='#ffd700'; ctx.fillRect(4,20,3,3); ctx.fillRect(15,20,3,3);
    // Straps
    ctx.fillStyle='#cc0000';
    ctx.fillRect(2,16,5,12); ctx.fillRect(15,16,5,12);
    // Arms
    ctx.fillStyle='#cc0000';
    ctx.fillRect(-3,18+armA,5,8); ctx.fillRect(20,18-armA,5,8);
    ctx.fillStyle='#f8c880';
    ctx.fillRect(-3,24+armA,5,4); ctx.fillRect(20,24-armA,5,4);
    // Legs
    ctx.fillStyle='#2244cc';
    ctx.fillRect(3,27,8,5); ctx.fillRect(11,27-legA,8,5);
    // Shoes
    ctx.fillStyle='#222';
    ctx.fillRect(2,31,9,5); ctx.fillRect(10,29-legA+2,10,5);

    ctx.restore();
  }
}

function spawnPuff(p,parts){
  for(let i=0;i<5;i++)
    parts.push(new Particle(p.x+p.w/2+(Math.random()-0.5)*12,p.y+p.h,
      (Math.random()-0.5)*2.5,Math.random()*2,'#fff',16,4,0.05));
}

// ═══════════════════════════════════════════════════════
//  BACKGROUND
// ═══════════════════════════════════════════════════════
const CLOUDS=[
  {bx:100,y:55,w:140,h:55},{bx:400,y:35,w:180,h:65},{bx:700,y:65,w:110,h:48},
  {bx:1050,y:42,w:160,h:60},{bx:1400,y:60,w:130,h:52},{bx:1800,y:38,w:170,h:62},
  {bx:2200,y:55,w:120,h:50},{bx:2600,y:42,w:155,h:58},{bx:3000,y:68,w:100,h:44},
  {bx:3400,y:48,w:145,h:56},{bx:3800,y:35,w:175,h:63},{bx:4200,y:60,w:115,h:50},
];

const HILLS=[
  {bx:0,r:160},{bx:500,r:120},{bx:900,r:145},{bx:1350,r:110},
  {bx:1800,r:165},{bx:2300,r:125},{bx:2800,r:155},{bx:3300,r:115},
  {bx:3800,r:160},{bx:4300,r:130},
];

function drawBackground(camX){
  // Sky
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#3a85c8'); g.addColorStop(1,'#7abfee');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  // Distant hills
  const maxX=COLS*TS;
  ctx.fillStyle='#5aaa40';
  for(const h of HILLS){
    let hx=h.bx-camX*0.45;
    hx=((hx%maxX)+maxX)%maxX;
    for(let rep=-1;rep<=1;rep++){
      const fx=hx+rep*maxX;
      if(fx+h.r*2<-h.r||fx-h.r>W+h.r) continue;
      ctx.beginPath(); ctx.arc(fx,H-60+h.r*0.4,h.r,0,Math.PI*2); ctx.fill();
    }
  }

  // Clouds
  ctx.fillStyle='rgba(255,255,255,0.92)';
  for(const cl of CLOUDS){
    let cx=cl.bx-camX*0.28;
    cx=((cx%(W+cl.w+300))+W+cl.w+300)%(W+cl.w+300)-cl.w;
    drawCloud(cx,cl.y + 18,cl.w,cl.h);
  }
}

function drawCloud(x,y,w,h){
  const r=h/2;
  ctx.beginPath();
  ctx.arc(x+w*0.22,y+h*0.65,r*0.75,0,Math.PI*2);
  ctx.arc(x+w*0.45,y+h*0.38,r,0,Math.PI*2);
  ctx.arc(x+w*0.68,y+h*0.52,r*0.85,0,Math.PI*2);
  ctx.arc(x+w*0.5, y+h*0.72,r*1.05,0,Math.PI*2);
  ctx.fill();
}

// ═══════════════════════════════════════════════════════
//  HUD
// ═══════════════════════════════════════════════════════
function drawHUD(pl,time,anim){
  ctx.save();
  ctx.textBaseline='alphabetic';
  // Panel
  ctx.fillStyle='rgba(0,0,0,0.62)';
  ctx.fillRect(0,0,W,38);
  ctx.fillStyle='rgba(255,255,255,0.08)';
  ctx.fillRect(0,37,W,1);
 
  // Lives (tiny Mario sprite)
  ctx.fillStyle='#cc0000'; ctx.fillRect(12,12,14,5); ctx.fillRect(10,15,18,4);
  ctx.fillStyle='#f8c880'; ctx.fillRect(13,18,12,7);
  ctx.fillStyle='#5a2200'; ctx.fillRect(12,23,14,3);
  ctx.fillStyle='#fff'; ctx.font='bold 13px monospace'; ctx.textAlign='left';
  ctx.fillText(`×${pl.lives}`, 33, 23);
 
  // Coins (spinning)
  const sc=Math.abs(Math.sin(anim*0.08))*0.7+0.3;
  ctx.save(); ctx.translate(80,19); ctx.scale(sc,1);
  ctx.fillStyle='#f5c518'; ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.fillStyle='#ffd700'; ctx.font='bold 13px monospace'; ctx.textAlign='left';
  ctx.fillText(`×${String(pl.coins).padStart(2,'0')}`, 92,23);
 
  // Score
  ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
  ctx.fillText('SCORE',W/2,15);
  ctx.fillStyle='#ffffff'; ctx.font='bold 16px monospace';
  ctx.fillText(String(pl.score).padStart(7,'0'),W/2,30);
 
  // Time
  ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='bold 10px monospace'; ctx.textAlign='right';
  ctx.fillText('TIME',W-10,15);
  ctx.fillStyle= time<100?'#ff6060':'#fff'; ctx.font='bold 16px monospace';
  ctx.fillText(String(Math.max(0,time)).padStart(3,'0'),W-10,30);
  ctx.restore();
}

// ═══════════════════════════════════════════════════════
//  ENEMY & COIN SPAWN DATA
// ═══════════════════════════════════════════════════════
const ENEMY_DEFS=[
  {x:12,y:11,t:'goomba'},{x:18,y:11,t:'goomba'},{x:22,y:7,t:'goomba'},
  {x:26,y:7,t:'koopa'},{x:49,y:11,t:'goomba'},{x:53,y:11,t:'goomba'},
  {x:58,y:5,t:'goomba'},{x:67,y:5,t:'goomba'},{x:70,y:5,t:'koopa'},
  {x:74,y:5,t:'goomba'},{x:78,y:3,t:'goomba'},{x:93,y:11,t:'goomba'},
  {x:102,y:5,t:'koopa'},{x:104,y:7,t:'goomba'},{x:117,y:7,t:'koopa'},
  {x:122,y:11,t:'goomba'},{x:127,y:11,t:'goomba'},{x:131,y:11,t:'koopa'},
  {x:136,y:11,t:'goomba'},{x:140,y:11,t:'goomba'},{x:143,y:11,t:'goomba'},
];

const COIN_DEFS=[
  {x:8.5,y:8},{x:9.5,y:8},{x:10.5,y:8},
  {x:20.5,y:11},{x:22.5,y:11},{x:24.5,y:8},
  {x:49.5,y:9},{x:51.5,y:9},{x:54.5,y:9},
  {x:66.5,y:8},{x:68.5,y:8},{x:70.5,y:6},
  {x:92.5,y:12},{x:94.5,y:12},{x:96.5,y:12},
  {x:113.5,y:8},{x:115.5,y:8},{x:118.5,y:8},
  {x:124.5,y:12},{x:126.5,y:12},{x:128.5,y:8},
];

// ═══════════════════════════════════════════════════════
//  GAME CLASS
// ═══════════════════════════════════════════════════════
const STATE={MENU:0,PLAY:1,PAUSE:2,WIN:3,OVER:4};

class Game{
  constructor(){
    this.state=STATE.MENU;
    this.keys={};
    this.anim=0;
    this._init();
  }

  _init(){
    this.map=buildLevel();
    this.player=new Player(2*TS,9*TS);
    this.enemies=ENEMY_DEFS.map(d=>new Enemy(d.x*TS,d.y*TS,d.t));
    this.coins=COIN_DEFS.map(d=>new Coin(d.x*TS,d.y*TS,false));
    this.parts=[];
    this.camX=0; this.camY=0;
    this.time=380; this.timeT=0;
    this.winT=0;
    this.frame=0;
  }

  win(){ if(this.state!==STATE.PLAY)return; this.state=STATE.WIN; this.winT=0; SFX.win(); }

  respawn(){
    const p=this.player;
    if(p.lives<=0){this.state=STATE.OVER;return;}
    p.x=2*TS; p.y=9*TS; p.vx=0; p.vy=0; p.dead=false; p.deathT=0; p.invT=180;
  }

  restart(){ this._init(); this.state=STATE.PLAY; }

  update(){
    this.anim++;
    // Screen shake decay
    if(shake>0) shake*=0.8;
    if(this.state===STATE.MENU) return;
    if(this.state===STATE.PAUSE||this.state===STATE.OVER) return;
    if(this.state===STATE.WIN){this.winT++;return;}

    this.frame++;
    // Timer
    this.timeT++;
    if(this.timeT>=60){this.time=Math.max(0,this.time-1);this.timeT=0;}
    if(this.time===0) this.player.hurt(this.parts,true);

    // Update all
    this.player.update(this.keys,this.map,this.enemies,this.coins,this.parts,this);
    for(const e of this.enemies) e.update(this.map,this.parts);
    for(const c of this.coins) c.update();
    for(const p of this.parts) p.update();

    // Cleanup
    this.parts=this.parts.filter(p=>p.life>0);
    this.coins=this.coins.filter(c=>c.alive);
    for(let i=popups.length-1;i>=0;i--){popups[i].life--;if(popups[i].life<=0)popups.splice(i,1);}

    // Camera X (smooth follow)
    const tgtX=this.player.x-W*0.38;
    this.camX+=clamp(tgtX-this.camX,-12,12)*0.18;
    // Hard bounds X: jogador nunca sai das margens da tela
    const psx=this.player.x-this.camX;
    if(psx < W*0.08)               this.camX=this.player.x-W*0.08;
    if(psx+this.player.w > W*0.92) this.camX=this.player.x+this.player.w-W*0.92;
    this.camX=clamp(this.camX,0,COLS*TS-W);
    // Camera Y (vertical follow — mantém jogador abaixo do HUD)
    const HUD_H=38, viewH=H-HUD_H;
    const tgtY=this.player.y-viewH*0.55;
    this.camY+=(tgtY-this.camY)*0.12;
    // Hard bounds Y
    const psy=this.player.y-this.camY;
    if(psy < viewH*0.08)               this.camY=this.player.y-viewH*0.08;
    if(psy+this.player.h > viewH*0.95) this.camY=this.player.y+this.player.h-viewH*0.95;
    this.camY=clamp(this.camY,0,Math.max(0,ROWS*TS-viewH));
  }

  draw(){
    ctx.save();
    // Screen shake
    if(shake>0.5){
      ctx.translate(Math.round((Math.random()-0.5)*shake),Math.round((Math.random()-0.5)*shake*0.5));
    }

    if(this.state===STATE.MENU){this.drawMenu();ctx.restore();return;}

    // Arredonda a câmera para pixels inteiros → evita frestas entre tiles
    const cx = Math.round(this.camX);
    const cy = Math.round(this.camY) - 38; // desloca o mundo para baixo do HUD

    // ── World ──
    drawBackground(cx);

    // Tiles (only visible)
    const sc=Math.max(0,Math.floor(cx/TS)-1);
    const ec=Math.min(COLS,sc+Math.ceil(W/TS)+2);
    const sr=0, er=ROWS;
    for(let r=sr;r<er;r++)
      for(let c=sc;c<ec;c++){
        const tile=this.map[r][c];
        if(tile!==T.EMPTY)
          drawTile(tile,c*TS-cx,r*TS-cy,this.anim);
      }

    // Flag pole
    const fpx=158*TS-cx;
    if(fpx>-TS&&fpx<W+TS){
      // shadow
      ctx.fillStyle='rgba(0,0,0,0.2)';
      ctx.fillRect(fpx+TS/2-2,2*TS-cy,6,(ROWS-4)*TS);
      // pole
      ctx.fillStyle='#aaa';
      ctx.fillRect(fpx+TS/2-2,2*TS-cy,4,(ROWS-4)*TS);
      // flag
      ctx.fillStyle='#cc0000';
      ctx.fillRect(fpx+TS/2+2,2*TS-cy,32,22);
      ctx.fillStyle='#002153'; ctx.fillRect(fpx+TS/2+2,2*TS-cy,32,7);
      ctx.fillStyle='#cc0000'; ctx.fillRect(fpx+TS/2+2,2*TS-cy+14,32,8);
      // ball
      ctx.fillStyle='#ffd700';
      ctx.beginPath(); ctx.arc(fpx+TS/2,2*TS-cy-3,7,0,Math.PI*2); ctx.fill();
    }

    // Coins
    for(const c of this.coins) c.draw(cx,cy);
    // Enemies
    for(const e of this.enemies) e.draw(cx,cy);
    // Particles
    for(const p of this.parts) p.draw(cx,cy);
    // Player
    this.player.draw(cx,cy);

    // Score popups
    for(const s of popups){
      const a=s.life/s.max;
      ctx.globalAlpha=a;
      ctx.fillStyle=s.color;
      ctx.font='bold 15px monospace';
      ctx.textAlign='center';
      ctx.fillText(s.text, s.x-cx, s.y-cy-((1-a)*32));
    }
    ctx.globalAlpha=1;

    // HUD
    drawHUD(this.player,this.time,this.anim);

    // Overlays
    if(this.state===STATE.PAUSE) this.drawPause();
    if(this.state===STATE.WIN)   this.drawWin();
    if(this.state===STATE.OVER)  this.drawOver();

    ctx.restore();
  }

  drawMenu(){
    // Deep space bg
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#06061a'); g.addColorStop(1,'#0d0d28');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    // Title shadow
    ctx.save();
    ctx.shadowColor='#cc0000'; ctx.shadowBlur=25;
    ctx.fillStyle='#cc0000'; ctx.font='bold 48px monospace'; ctx.textAlign='center';
    ctx.fillText('SUPER',W/2,H/2-90);
    ctx.shadowColor='#ffd700'; ctx.shadowBlur=20;
    ctx.fillStyle='#ffd700'; ctx.font='bold 64px monospace';
    ctx.fillText('CHICO',W/2,H/2-28);
    ctx.shadowColor='#fff'; ctx.shadowBlur=12;
    ctx.fillStyle='#fff'; ctx.font='bold 44px monospace';
    ctx.fillText('BROS',W/2,H/2+32);
    ctx.restore();

    // Blink ENTER
    if(Math.floor(this.anim/28)%2===0){
      ctx.fillStyle='#aaddff'; ctx.font='bold 17px monospace'; ctx.textAlign='center';
      ctx.fillText('PRESSIONE ENTER PARA INICIAR',W/2,H/2+90);
    }

    // Controls
    ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='12px monospace'; ctx.textAlign='center';
    ctx.fillText('← → / A D: Mover    ↑ Z ESPAÇO: Pular    SHIFT: Correr    ESC: Pausar',W/2,H-22);
  }

  drawPause(){
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
    ctx.save();
    ctx.shadowColor='#fff'; ctx.shadowBlur=15;
    ctx.fillStyle='#fff'; ctx.font='bold 44px monospace'; 
    ctx.textAlign='center';
    ctx.fillText('PAUSADO',W/2,H/2-10);
    ctx.restore();
    ctx.textAlign='center';
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='16px monospace';
    ctx.fillText('Pressione ESC para continuar',W/2,H/2+38);
  }

  drawWin(){
    ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(0,0,W,H);
    ctx.save();
    ctx.shadowColor='#ffd700'; ctx.shadowBlur=30;
    ctx.fillStyle='#ffd700'; ctx.font='bold 52px monospace'; ctx.textAlign='center';
    ctx.fillText('VOCÊ GANHOU!',W/2,H/2-60);
    ctx.restore();
    ctx.fillStyle='#fff'; ctx.font='bold 20px monospace'; ctx.textAlign='center';
    ctx.fillText(`Pontuação: ${String(this.player.score).padStart(7,'0')}`,W/2,H/2+5);
    ctx.fillText(`Moedas coletadas: ${this.player.coins}`,W/2,H/2+38);
    if(this.winT>100){
      ctx.fillStyle='#aaddff';
      if(Math.floor(this.winT/25)%2===0){
        ctx.font='16px monospace';
        ctx.fillText('Pressione ENTER para jogar novamente',W/2,H/2+85);
      }
    }
  }

  drawOver(){
    ctx.fillStyle='rgba(0,0,0,0.78)'; ctx.fillRect(0,0,W,H);
    ctx.save();
    ctx.shadowColor='#cc0000'; ctx.shadowBlur=30;
    ctx.fillStyle='#cc0000'; ctx.font='bold 56px monospace'; 
    ctx.textAlign='center';
    ctx.fillText('GAME OVER',W/2,H/2-30);
    ctx.restore();
    ctx.textAlign='center';
    ctx.fillStyle='#fff'; ctx.font='bold 18px monospace';
    ctx.fillText(`Pontuação Final: ${String(this.player.score).padStart(7,'0')}`,W/2,H/2+25);
    ctx.fillStyle='#aaddff';
    if(Math.floor(this.anim/28)%2===0){
      ctx.font='15px monospace';
      ctx.fillText('Pressione ENTER para tentar novamente',W/2,H/2+65);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════
const game = new Game();

window.addEventListener('keydown', e => {
  initAudio();
  game.keys[e.code]=true;

  if(e.code==='Enter' || e.code==='NumpadEnter'){
    if(game.state===STATE.MENU||game.state===STATE.OVER||(game.state===STATE.WIN&&game.winT>100)){
      game.restart();
    }
  }
  if(e.code==='Escape'){
    if(game.state===STATE.PLAY)  game.state=STATE.PAUSE;
    else if(game.state===STATE.PAUSE) game.state=STATE.PLAY;
  }
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))
    e.preventDefault();
});

window.addEventListener('keyup',e=>{ game.keys[e.code]=false; });

// Mobile touch controls (simple)
function addTouch(btn, code){
  btn.addEventListener('touchstart',e=>{e.preventDefault();game.keys[code]=true;initAudio();},{passive:false});
  btn.addEventListener('touchend',e=>{e.preventDefault();game.keys[code]=false;},{passive:false});
}

function loop(){
  game.update();
  game.draw();
  requestAnimationFrame(loop);
}

loop();