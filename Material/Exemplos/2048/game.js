(function(){
  var N = 4, boardEl = document.getElementById('board'), msg = document.getElementById('msg');
  var tiles, score, best = 0, nextId, won, over, keepGoing;

  try { best = parseInt(localStorage.getItem('best2048')) || 0; } catch(e){}
  for (var i = 0; i < N*N; i++) { var c = document.createElement('div'); c.className = 'cell'; boardEl.insertBefore(c, msg); }

  function color(v){
    if (v === 2) return ['#cfd8e3','#1d2530'];
    if (v === 4) return ['#a9c4de','#1d2530'];
    var n = Math.log2(v);
    return ['hsl(' + ((170 + (n-3)*28) % 360) + ' 62% ' + Math.max(36, 52 - n) + '%)', '#fff'];
  }

  function makeEl(t){
    t.el = document.createElement('div');
    t.el.className = 'tile new';
    t.el.innerHTML = '<div class="t"></div>';
    boardEl.insertBefore(t.el, msg);
    draw(t);
  }

  function draw(t){
    t.el.style.setProperty('--r', t.r);
    t.el.style.setProperty('--c', t.c);
    var inner = t.el.firstChild, col = color(t.v);
    inner.textContent = t.v;
    inner.style.background = col[0];
    inner.style.color = col[1];
    inner.className = 't' + (t.v >= 1000 ? (t.v >= 10000 ? ' huge' : ' big') : '');
  }

  function spawn(){
    var used = {};
    tiles.forEach(function(t){ used[t.r*N + t.c] = 1; });
    var free = [];
    for (var i = 0; i < N*N; i++) if (!used[i]) free.push(i);
    if (!free.length) return;
    var p = free[Math.floor(Math.random()*free.length)];
    var t = { id: nextId++, v: Math.random() < 0.9 ? 2 : 4, r: Math.floor(p/N), c: p % N };
    tiles.push(t); makeEl(t);
  }

  function setScore(){
    document.getElementById('score').textContent = score;
    if (score > best) {
      best = score;
      try { localStorage.setItem('best2048', best); } catch(e){}
    }
    document.getElementById('best').textContent = best;
  }

  function start(){
    if (tiles) tiles.forEach(function(t){ t.el.remove(); });
    tiles = []; score = 0; nextId = 1; won = false; over = false; keepGoing = false;
    msg.classList.remove('on');
    spawn(); spawn(); setScore();
  }

  // dr/dc: direção do movimento
  function move(dr, dc){
    if (over || (won && !keepGoing)) return;
    var moved = false, removed = [];
    for (var i = 0; i < N; i++) {
      var line = tiles.filter(function(t){ return dr ? t.c === i : t.r === i; });
      // mais próximo da borda de destino primeiro
      line.sort(function(a, b){ return dr ? (b.r - a.r)*dr : (b.c - a.c)*dc; });
      var p = 0, prev = null;
      line.forEach(function(t){
        var pos;
        if (prev && prev.v === t.v && !prev.merged) {
          prev.v *= 2; prev.merged = true; score += prev.v;
          removed.push(t);
          pos = prev.pos; moved = true;
        } else {
          pos = (dr + dc > 0) ? N - 1 - p : p;
          p++; prev = t; t.pos = pos;
        }
        var nr = dr ? pos : t.r, nc = dr ? t.c : pos;
        if (nr !== t.r || nc !== t.c) moved = true;
        t.r = nr; t.c = nc;
      });
    }
    if (!moved) return;
    removed.forEach(function(t){
      draw(t);
      tiles.splice(tiles.indexOf(t), 1);
      setTimeout(function(){ t.el.remove(); }, 130);
    });
    tiles.forEach(function(t){
      t.el.classList.remove('new', 'pop');
      draw(t);
      if (t.merged) { void t.el.offsetWidth; t.el.classList.add('pop'); t.merged = false;
        if (t.v === 2048 && !won) won = true; }
    });
    spawn(); setScore();
    setTimeout(check, 200);
  }

  function canMove(){
    if (tiles.length < N*N) return true;
    var g = {};
    tiles.forEach(function(t){ g[t.r + ',' + t.c] = t.v; });
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      if (g[r + ',' + c] === g[r + ',' + (c+1)] || g[r + ',' + c] === g[(r+1) + ',' + c]) return true;
    }
    return false;
  }

  function show(title, btn, fn){
    document.getElementById('msgTitle').textContent = title;
    var b = document.getElementById('msgBtn');
    b.style.display = btn ? '' : 'none';
    b.textContent = btn || ''; b.onclick = fn;
    msg.classList.add('on');
  }

  function check(){
    if (won && !keepGoing) {
      show('Você chegou ao 2048!', 'Continuar', function(){ keepGoing = true; msg.classList.remove('on'); });
    } else if (!canMove()) {
      over = true; show('Fim de jogo', null);
    }
  }

  document.getElementById('restart').onclick = start;
  document.getElementById('msgNew').onclick = start;

  var keys = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1],
               w:[-1,0], s:[1,0], a:[0,-1], d:[0,1] };
  document.addEventListener('keydown', function(e){
    var m = keys[e.key]; if (!m) return;
    e.preventDefault(); move(m[0], m[1]);
  });

  var sx, sy;
  boardEl.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, {passive:true});
  boardEl.addEventListener('touchend', function(e){
    if (sx == null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(0, dx > 0 ? 1 : -1); else move(dy > 0 ? 1 : -1, 0);
  }, {passive:true});

  start();
})();