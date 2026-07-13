function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var lines = [];

    for(var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = ctx.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        }
        else {
            line = testLine;
        }
    }
    lines.push(line);

    for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, y);
        y += lineHeight;
    }
}

const magicSound = new Audio('sounds/magic.wav');
magicSound.volume = 0.4;

const themeMusic = new Audio('sounds/TownTheme.mp3');
themeMusic.loop = true;
themeMusic.volume = 0.035;

class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;

        this.character = new Character(50, 460, 50, 73, 3);
        this.background = new Background('assets/background/background1.png', 1425, 600);
        this.cameraX = 0;
        this.currentMap = 'background1';

        this.portalCooldown = 0; 
        this.portalCooldownTime = 2000; 
        this.portals = [
            new Portal(1150, 453, 80, 80, 'background1', 'background2'),
            new Portal(100, 453, 80, 80, 'background2', 'background3'),
            new Portal(1150, 453, 80, 80, 'background3', 'background4'),
            new Portal(350, 453, 80, 80, 'background4', 'background1'),  
        ];

        this.npcs = [
            new NPC(500, 451, 37, 80, 'background1', "<b>Luiz, o Capitão:</b> Navegar pelos mares da vida requer coragem, determinação e liderança. Em meio às tempestades e às calmarias, um verdadeiro líder mantém a calma, inspira confiança e guia sua tripulação com sabedoria e justiça.", "assets/npcs/luiz.png", [
                "Já enfrentei tempestades que pareciam o fim do mundo, e sempre voltei ao porto.",
                "Se um dia se sentir perdido, lembre-se: até o mar mais calmo já foi tempestade."
            ]),
            new NPC(820, 450, 44, 80, 'background1', "<b>Uriel, o Viajante:</b> Em cada estrada percorrida e em cada passo dado, encontramos não apenas novos destinos, mas também novas versões de nós mesmos. A jornada é tão importante quanto o destino, e cada encontro é uma oportunidade de crescimento e transformação.", "assets/npcs/uriel.png"),
            new NPC(630, 450, 40, 80, 'background2', "<b>Alexandre, o Diplomata:</b> Na arte da diplomacia, aprendemos que a verdadeira força está na paciência e na compreensão. Cada desafio é uma oportunidade para cultivar a paz e encontrar soluções que beneficiem a todos.", "assets/npcs/alexandre.png"),
            new NPC(860, 450, 44, 80, 'background2', "<b>Ana, a Curiosa:</b> A curiosidade é a chama que ilumina o caminho da sabedoria. Cada pergunta nos leva a novos horizontes de entendimento, e cada descoberta nos enriquece com o poder do conhecimento.", "assets/npcs/ana.png"),
            new NPC(120, 450, 44, 80, 'background4', "<b>Youssef, o Caridoso:</b> Na caridade encontramos a essência da humanidade. Cada ato de bondade e compaixão é uma expressão do amor universal que une todos os seres vivos. Na generosidade do coração, encontramos a verdadeira riqueza da alma.", "assets/npcs/youssef.png"),
            new NPC(670, 443, 58, 87, 'background3', "<b>Minotauro, o Senhor do Labirinto:</b> Nos labirintos da mente e do coração, encontramos nossos maiores desafios e nossas mais profundas verdades. A coragem de enfrentar nossos medos e a determinação de buscar o caminho certo nos libertam das próprias prisões.", "assets/npcs/minotauro.png"),
            new NPC(900, 450, 51, 80, 'background3', "<b>Godofredo, o Padeiro:</b> No calor do forno e no aroma do pão recém-assado, encontramos a essência da generosidade. Cada pedaço de pão compartilhado é um gesto de amor e solidariedade que alimenta não apenas o corpo, mas também a alma.", "assets/npcs/godofredo.png"),
            new NPC(250, 420, 60, 110, 'background3', "<b>O Ministro das Trevas:</b> Na sombra mais profunda reside a luz mais brilhante. O verdadeiro poder não está na escuridão, mas sim na capacidade de superá-la com coragem, bondade e compaixão.", "assets/npcs/ministro.png"),
            new NPC(600, 451, 42, 79, 'background4', "<b>O Corvo Aristocrata:</b> Na simplicidade do voo solitário, encontramos a verdadeira essência da liberdade. Não são as riquezas materiais que nos definem, mas sim a nobreza de nossas escolhas e a pureza de nossos ideais.", "assets/npcs/corvo.png"),
            new NPC(950, 450, 47, 80, 'background4', "<b>A Raposa Engenhosa:</b> A astúcia é uma aliada valiosa na jornada da vida. Com perspicácia e sagacidade, podemos superar obstáculos e alcançar nossos objetivos, sempre lembrando que a honestidade é a mais poderosa das armas.", "assets/npcs/fox.png"),
        ];

        this.bird = new Bird(1425, 50, 50, 50, 2, 'assets/bird');
        this.owl = new Owl(0, 50, 2, 'assets/owl');

        this.nearbyNPC = null;   // NPC dentro do alcance de colisão agora
        this.nearbyPortal = null; // Portal dentro do alcance de colisão agora
        this.dialogueOpen = false;
        this.activeNPC = null;   // NPC cujo diálogo está sendo exibido
        this.dialoguePageIndex = 0;

        this.keys = {
            left: false,
            right: false,
            up: false,
        };

        document.addEventListener("keydown", (event) => this.keyDownHandler(event));
        document.addEventListener("keyup", (event) => this.keyUpHandler(event));

        this.gameLoop();
    }

    drawCooldownIndicator() {
        let cooldownIndicatorWidth = 100;
        let cooldownIndicatorHeight = 30;

        if (this.portalCooldown > 0) {
            const remainingCooldownPercentage = this.portalCooldown / this.portalCooldownTime;
            const remainingCooldownWidth = cooldownIndicatorWidth * remainingCooldownPercentage;
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.fillRect(20, 20, remainingCooldownWidth, cooldownIndicatorHeight);
        }
    }

    drawDashCooldownIndicator() {
        let barWidth = 100;
        let barHeight = 12;
        let barX = 20;
        let barY = 60; // logo abaixo do indicador do portal
 
        if (!this.character.canDash) {
            const remainingPercentage = this.character.dashCooldownTimer / this.character.dashCooldownTime;
            const remainingWidth = barWidth * remainingPercentage;
            this.ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
            this.ctx.fillRect(barX, barY, barWidth - remainingWidth, barHeight);
        }
    }

    openDialogue(npc) {
        this.dialogueOpen = true;
        this.activeNPC = npc;
        this.dialoguePageIndex = 0;
    }
 
    advanceDialogue() {
        if (!this.activeNPC) {
            return;
        }
        this.dialoguePageIndex++;
        if (this.dialoguePageIndex >= this.activeNPC.dialoguePages.length) {
            this.closeDialogue(); // acabaram as frases, fecha sozinho
        }
    }
 
    closeDialogue() {
        this.dialogueOpen = false;
        this.activeNPC = null;
        this.dialoguePageIndex = 0;
    }
 
    drawInteractHint() {
        if (!this.nearbyNPC || this.dialogueOpen) {
            return;
        }
 
        const npc = this.nearbyNPC;
        const hintX = npc.x - this.cameraX + npc.width / 2; // centralizado sobre o NPC
        const hintBottomY = npc.y - 14; // um pouco acima da cabeça do NPC
 
        this.ctx.save();
 
        this.ctx.font = 'bold 13px Delius, sans-serif';
        this.ctx.textAlign = 'center';
 
        const text = 'Pressione X';
        const paddingX = 8;
        const boxWidth = this.ctx.measureText(text).width + paddingX * 2;
        const boxHeight = 22;
        const boxX = hintX - boxWidth / 2;
        const boxY = hintBottomY - boxHeight;
 
        // Balãozinho de fundo
        this.ctx.fillStyle = 'rgba(15, 30, 45, 0.85)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeStyle = '#BCE8D5';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
 
        // Texto
        this.ctx.fillStyle = '#BCE8D5';
        this.ctx.fillText(text, hintX, boxY + boxHeight - 7);
 
        this.ctx.restore();
    }

    drawPortalHint() {
        if (!this.nearbyPortal || this.dialogueOpen) {
            return;
        }
 
        const portal = this.nearbyPortal;
        const centerX = portal.x - this.cameraX + portal.width / 2; // centralizado sobre o portal
        const bounce = Math.sin(performance.now() / 200) * 4; // balanço suave pra chamar atenção
        const arrowBottomY = portal.y - 10 + bounce;
        const arrowHeight = 16;
        const arrowWidth = 20;
 
        this.ctx.save();
 
        this.ctx.fillStyle = '#BCE8D5';
        this.ctx.strokeStyle = 'rgba(15, 30, 45, 0.9)';
        this.ctx.lineWidth = 2;
        this.ctx.lineJoin = 'round';
 
        // Triângulo apontando pra cima
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, arrowBottomY - arrowHeight);       // ponta de cima
        this.ctx.lineTo(centerX - arrowWidth / 2, arrowBottomY);    // canto inferior esquerdo
        this.ctx.lineTo(centerX + arrowWidth / 2, arrowBottomY);    // canto inferior direito
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
 
        this.ctx.restore();
    }
 
    drawDialogueBox() {
        if (!this.dialogueOpen || !this.activeNPC) {
            return;
        }
 
        const pages = this.activeNPC.dialoguePages;
        const currentPage = pages[this.dialoguePageIndex];
        const isLastPage = this.dialoguePageIndex === pages.length - 1;
 
        const boxMargin = 20;
        const boxHeight = 140;
        const boxX = boxMargin;
        const boxY = this.canvasHeight - boxHeight - boxMargin;
        const boxWidth = this.canvasWidth - boxMargin * 2;
        const padding = 16;
 
        // Painel de fundo
        this.ctx.fillStyle = 'rgba(15, 30, 45, 0.9)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeStyle = '#BCE8D5';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
 
        // Nome do NPC
        this.ctx.fillStyle = '#BCE8D5';
        this.ctx.font = 'bold 18px Delius, sans-serif';
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.fillText(this.activeNPC.dialogueName, boxX + padding, boxY + padding + 14);
 
        // Indicador de página (ex: "2/3"), só aparece se houver mais de uma frase
        if (pages.length > 1) {
            this.ctx.textAlign = 'right';
            this.ctx.font = '13px Delius, sans-serif';
            this.ctx.fillText(`${this.dialoguePageIndex + 1}/${pages.length}`, boxX + boxWidth - padding, boxY + padding + 14);
            this.ctx.textAlign = 'left';
        }
 
        // Texto da frase atual, quebrado em várias linhas
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '15px Delius, sans-serif';
        wrapText(this.ctx, currentPage, boxX + padding, boxY + padding + 42, boxWidth - padding * 2, 20);
 
        // Dica de como continuar/fechar
        this.ctx.fillStyle = 'rgba(188, 232, 213, 0.75)';
        this.ctx.font = '13px Delius, sans-serif';
        const hint = isLastPage ? 'X para fechar   •   ESC para sair' : 'X para continuar   •   ESC para sair';
        this.ctx.fillText(hint, boxX + padding, boxY + boxHeight - 13);
    }

    keyDownHandler(event) {
        if (event.key === "ArrowLeft") {
            this.keys.left = true;
            this.character.isMoving = true;
            this.character.direction = 'left';
        } else if (event.key === "ArrowRight") {
            this.keys.right = true;
            this.character.isMoving = true;
            this.character.direction = 'right'; 
        } else if (event.key === "ArrowUp") {
            this.keys.up = true;
        } else if (event.code === "Space") {
            event.preventDefault(); // Evita rolar a página
            if (!this.keys.space) {
                this.character.jump();
            }
            this.keys.space = true;
        } else if (event.key === "Shift") {
            if (!this.keys.shift) {
                this.character.dash();
            }
            this.keys.shift = true;
        } else if (event.key.toLowerCase() === "x") {
            if (this.dialogueOpen) {
                this.advanceDialogue(); // passa pra próxima frase (ou fecha, se era a última)
            } else if (this.nearbyNPC) {
                this.openDialogue(this.nearbyNPC);
            }
        } else if (event.key === "Escape") {
            if (this.dialogueOpen) {
                this.closeDialogue(); // sai da conversa em qualquer frase
            }
        }

        if (event.key == "ArrowLeft" || event.key == "ArrowRight") {
            themeMusic.play();
        }

        if (this.keys.left && this.keys.right) {
            this.character.isMoving = false;
        } else {
            this.character.isMoving = this.keys.left || this.keys.right;
        }
    }

    keyUpHandler(event) {
        if (event.key === "ArrowLeft") {
            this.keys.left = false;
            this.character.isMoving = false;
        } else if (event.key === "ArrowRight") {
            this.keys.right = false;
            this.character.isMoving = false;
        } else if (event.key === "ArrowUp") {
            this.keys.up = false;
        } else if (event.code === "Space") {
            this.keys.space = false;
        } else if (event.key === "Shift") {
            this.keys.shift = false;
        }

        if (this.keys.left && this.keys.right) {
            this.character.isMoving = false;
        } else {
            this.character.isMoving = this.keys.left || this.keys.right;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.background.draw(this.ctx, this.cameraX);

        for (const npc of this.npcs) {
            if (npc.map === this.currentMap) {
                npc.draw(this.ctx, this.cameraX);
            }
        }

        this.character.draw(this.ctx);

        this.bird.draw(this.ctx, this.cameraX);
        this.owl.draw(this.ctx, this.cameraX);

        for (const portal of this.portals) {
            if (portal.originMap === this.currentMap) {
                portal.draw(this.ctx, this.cameraX);
            }
        }

        this.drawInteractHint();
        this.drawPortalHint();
        this.drawCooldownIndicator();
        this.drawDashCooldownIndicator();
        this.drawDialogueBox();
    }

    update() {
        const isDashing = this.character.isDashing;
        const moveSpeed = isDashing ? this.character.dashSpeed : this.character.speed;
        const moveLeft = this.keys.left || (isDashing && this.character.direction === 'left');
        const moveRight = this.keys.right || (isDashing && this.character.direction === 'right');
 
        if (moveLeft) {
            this.character.x = Math.max(0, this.character.x - moveSpeed);
            this.cameraX = Math.max(0, this.cameraX - moveSpeed);
        }
        if (moveRight) {
            this.character.x = Math.min(this.canvasWidth - this.character.width, this.character.x + moveSpeed);
            this.cameraX = Math.min(this.background.width - this.canvasWidth, this.cameraX + moveSpeed);
        }

        this.character.update(16);

        const currentTime = performance.now();
        this.nearbyPortal = null;
        for (const portal of this.portals) {
            portal.update(currentTime);
            const destinationMap = portal.checkCollision(this.character.x + this.cameraX, this.character.y, this.character.width, this.character.height);
            if (destinationMap && this.currentMap === portal.originMap) {
                this.nearbyPortal = portal; // jogador está na área do portal
            }
            if (destinationMap && this.keys.up && this.currentMap === portal.originMap && this.portalCooldown <= 0) {
                magicSound.play();
                this.currentMap = destinationMap;
                this.changeMap(this.currentMap);
                this.portalCooldown = this.portalCooldownTime;
                break;
            }
        }

        this.bird.update(currentTime);
        this.owl.update(currentTime);

        if (this.portalCooldown > 0) {
            this.portalCooldown -= 16;
        }

        let collidedNPC = null;
        for (const npc of this.npcs) {
            if (npc.checkCollision(this.character.x + this.cameraX, this.character.y, this.character.width, this.character.height) && this.currentMap === npc.map) {
                collidedNPC = npc;
                break;
            }
        }
        this.nearbyNPC = collidedNPC;
 
        // Fecha o diálogo sozinho se o jogador se afastar do NPC com quem estava falando
        if (this.dialogueOpen && this.activeNPC !== this.nearbyNPC) {
            this.closeDialogue();
        }
    }

    changeMap(destinationMap) {
        this.background.image.src = `assets/background/${destinationMap}.png`;
        this.character.x = this.character.x;
        this.character.y = this.character.y;
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

class Character {
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.isMoving = false; 

        this.idleSprites = [];
        this.walkingSprites = [];
        this.loadSprites();

        this.currentSprites = this.idleSprites; 
        this.spriteIndex = 0; 
        this.frameCounter = 0;

        this.walkingAnimationSpeed = 3;
        this.idleAnimationSpeed = 0.25;

        this.direction = 'right';

        this.groundY = y;
        this.velocityY = 0;
        this.gravity = 0.7;
        this.jumpPower = -13;
        this.isJumping = false;
 
        this.isDashing = false;
        this.dashSpeed = 11;
        this.dashDuration = 160;
        this.dashTimer = 0;
        this.dashCooldownTime = 700;
        this.dashCooldownTimer = 0;
        this.canDash = true;
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = this.jumpPower;
            this.isJumping = true;
        }
    }
 
    dash() {
        if (this.canDash && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            this.canDash = false;
            this.dashCooldownTimer = this.dashCooldownTime;
        }
    }

    loadSprites() {
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = `assets/hero/idle/idle${i}.png`;
            this.idleSprites.push(img);
        }

        for (let i = 1; i <= 6; i++) {
            const img = new Image();
            img.src = `assets/hero/walking/walking${i}.png`;
            this.walkingSprites.push(img);
        }
    }

    update(dt) {
        if (this.isMoving) {
            this.currentSprites = this.walkingSprites;
            this.animationSpeed = this.walkingAnimationSpeed;
        } else {
            if (this.currentSprites !== this.idleSprites) {
                this.spriteIndex = 0;
            }
            this.currentSprites = this.idleSprites;
            this.animationSpeed = this.idleAnimationSpeed;
        }

        this.frameCounter++;

        // Usa Math.floor para suavizar a animação com velocidade reduzida
        if (this.frameCounter >= 10 / this.animationSpeed) {
            this.spriteIndex = (this.spriteIndex + 1) % this.currentSprites.length;
            this.frameCounter = 0;
        }

        // --- Física do pulo ---
        if (this.isJumping) {
            this.y += this.velocityY;
            this.velocityY += this.gravity;
 
            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.velocityY = 0;
                this.isJumping = false;
            }
        }
 
        // --- Timers do dash ---
        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        }
 
        if (!this.canDash) {
            this.dashCooldownTimer -= dt;
            if (this.dashCooldownTimer <= 0) {
                this.dashCooldownTimer = 0;
                this.canDash = true;
            }
        }
    }

    draw(ctx) {
        if (this.currentSprites[this.spriteIndex] instanceof HTMLImageElement) {
            ctx.save(); 
            if (this.direction === 'left') {
                ctx.translate(this.x, this.y); 
                ctx.scale(-1, 1);
                ctx.drawImage(this.currentSprites[this.spriteIndex], -this.width, 0, this.width, this.height);
            } else {
                ctx.drawImage(this.currentSprites[this.spriteIndex], this.x, this.y, this.width, this.height);
            }
            ctx.restore();
        }
    }
}

class Bird {
    constructor(x, y, width, height, speed, spriteFolder) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.spriteIndex = 0;
        this.sprites = this.loadSprites(spriteFolder, 8); // Carrega 8 sprites para a animação do pássaro
        this.frameInterval = 100; // Intervalo de tempo entre cada quadro da animação
        this.lastUpdateTime = 0;
    }

    loadSprites(folderPath, spriteCount) {
        const sprites = [];
        for (let i = 1; i <= spriteCount; i++) {
            const img = new Image();
            img.src = `${folderPath}/bird${i}.png`;
            sprites.push(img);
        }
        return sprites;
    }

    update(currentTime) {
        if (currentTime - this.lastUpdateTime > this.frameInterval) {
            this.spriteIndex = (this.spriteIndex + 1) % this.sprites.length;
            this.lastUpdateTime = currentTime;
        }
        // Movimento horizontal
        this.x -= this.speed;
        // Movimento senoidal vertical
        const sinValue = Math.sin(this.x / 50) * 2; // Valor do seno para o movimento vertical
        // Limitando a altura máxima e mínima
        const maxHeight = 100; // Altura máxima
        const minHeight = 50; // Altura mínima
        this.y += sinValue;
        if (this.y < minHeight) {
            this.y = minHeight;
        } else if (this.y > maxHeight) {
            this.y = maxHeight;
        }
        // Se o pássaro sair da tela pelo lado esquerdo, reinicia do lado direito
        if (this.x + this.width < 0) {
            this.x = 1425;
        }
    }

    draw(ctx, cameraX) {
        const sprite = this.sprites[this.spriteIndex];
        ctx.drawImage(sprite, this.x - cameraX, this.y, this.width, this.height);
    }
}

class Owl {
    constructor(x, y, speed, spriteFolder) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.spriteIndex = 0;
        this.sprites = this.loadSprites(spriteFolder, 5); // Carrega 8 sprites para a animação do pássaro
        this.frameInterval = 110; // Intervalo de tempo entre cada quadro da animação
        this.lastUpdateTime = 0;
    }

    loadSprites(folderPath, spriteCount) {
        const sprites = [];
        for (let i = 1; i <= spriteCount; i++) {
            const img = new Image();
            img.src = `${folderPath}/owl${i}.png`;
            img.onload = () => {
                this.width = img.width; // Define a largura do sprite como a largura da imagem carregada
                this.height = img.height; // Define a altura do sprite como a altura da imagem carregada
            };
            sprites.push(img);
        }
        return sprites;
    }

    update(currentTime) {
        if (currentTime - this.lastUpdateTime > this.frameInterval) {
            this.spriteIndex = (this.spriteIndex + 1) % this.sprites.length;
            this.lastUpdateTime = currentTime;
        }
        // Movimento horizontal
        this.x += this.speed;
        // Movimento senoidal vertical
        const sinValue = Math.cos(this.x / 30) * 1.5; // Valor do seno para o movimento vertical
        // Limitando a altura máxima e mínima
        const maxHeight = 240; // Altura máxima
        const minHeight = 200; // Altura mínima
        this.y += sinValue;
        if (this.y < minHeight) {
            this.y = minHeight;
        } else if (this.y > maxHeight) {
            this.y = maxHeight;
        }
        // Se o pássaro sair da tela pelo lado esquerdo, reinicia do lado direito
        if (this.x + this.width > 1425) {
            this.x = 0;
        }
    }

    draw(ctx, cameraX) {
        const sprite = this.sprites[this.spriteIndex];
        ctx.drawImage(sprite, this.x - cameraX, this.y, this.width, this.height);
    }
}

class Portal {
    constructor(x, y, width, height, originMap, destinationMap) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.originMap = originMap;
        this.destinationMap = destinationMap;
        this.sprites = [];
        this.loadSprites();
        this.spriteIndex = 0; 
        this.lastUpdateTime = 0;
        this.frameInterval = 200; 
    }

    loadSprites() {
        for (let i = 1; i <= 5; i++) {
            const img = new Image();
            img.src = `assets/portal/portal${i}.png`;
            this.sprites.push(img);
        }
    }

    update(currentTime) {
        if (currentTime - this.lastUpdateTime > this.frameInterval) {
            this.spriteIndex = (this.spriteIndex + 1) % this.sprites.length;
            this.lastUpdateTime = currentTime;
        }
    }

    checkCollision(playerX, playerY, playerWidth, playerHeight) {
        if (
            playerX < this.x + this.width &&
            playerX + playerWidth > this.x &&
            playerY < this.y + this.height &&
            playerY + playerHeight > this.y
        ) {
            return this.destinationMap;
        }
        return null;
    }

    draw(ctx, cameraX) {
        if (this.sprites[this.spriteIndex] instanceof HTMLImageElement) {
            const adjustedX = this.x - cameraX; // Ajusta a posição do portal em relação à posição da câmera
            ctx.drawImage(this.sprites[this.spriteIndex], adjustedX, this.y, this.width, this.height);
        }
    }
}

class NPC {
    constructor(x, y, width, height, map, message, srcImage, extraMessages = []) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.map = map;
        this.message = message;
        this.sprite = new Image();
        this.sprite.src = srcImage;

        // A mensagem vem como "<b>Nome:</b> texto".
        // Isso separa o nome (pra desenhar em destaque) do texto (pra quebrar em linhas).
        const match = message.match(/<b>(.*?)<\/b>\s*(.*)/);
        if (match) {
            this.dialogueName = match[1].replace(/:\s*$/, ''); // remove o ":" do final
            this.dialoguePages = [match[2], ...extraMessages];
        } else {
            this.dialogueName = '';
            this.dialoguePages = [message, ...extraMessages];
        }
    }

    draw(ctx, cameraX) {
        if (this.sprite instanceof HTMLImageElement) {
            const adjustedX = this.x - cameraX; // Ajusta a posição do portal em relação à posição da câmera
            ctx.drawImage(this.sprite, adjustedX, this.y, this.width, this.height);
        }
    }

    // Método para verificar colisão com o jogador
    checkCollision(playerX, playerY, playerWidth, playerHeight) {
        return (
            playerX < this.x + this.width &&
            playerX + playerWidth > this.x &&
            playerY < this.y + this.height &&
            playerY + playerHeight > this.y
        );
    }
}


class Background {
    constructor(imagePath, width, height) {
        this.image = new Image();
        this.image.src = imagePath;
        this.width = width;
        this.height = height;
    }

    draw(ctx, cameraX) {
        ctx.drawImage(this.image, -cameraX, 0, this.width, this.height);
    }
}

new Game();