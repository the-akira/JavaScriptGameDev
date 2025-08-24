const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimap = document.getElementById('minimap');
const minimapCtx = minimap.getContext('2d');
const nodeInfo = document.getElementById('nodeInfo');
const closeBtn = document.getElementById('closeBtn');
const closeBtnNote = document.getElementById('closeBtnNote');
const closeBtnDialog = document.getElementById('closeBtnDialog');

// Maps
const maps = [
    {
        name: "Mapa 1",
        nodes: [
            {
                x: 300, y: 200, 
                title: "Inteligência Artificial",
                content: "A IA representa a simulação da inteligência humana em máquinas. Envolve aprendizado, raciocínio e autocorreção. Sistemas neurais processam padrões complexos, emergindo comportamentos aparentemente conscientes.",
                connections: [1, 3, 7],
                color: '#ff6600',
                size: 25,
                links: [
                    { label: "Wikipedia", url: "https://pt.wikipedia.org/wiki/Intelig%C3%AAncia_artificial" },
                    { label: "Artigo IEEE", url: "https://ieeexplore.ieee.org/document/1234567" },
                    { label: "Vídeo YouTube", url: "https://www.youtube.com/watch?v=abcdef" }
                ]
            },
            {
                x: 600, y: 150,
                title: "Redes Neurais",
                content: "Estruturas computacionais inspiradas no cérebro humano. Neurônios artificiais conectados processam informações através de camadas. Backpropagation permite aprendizado através do ajuste de pesos sinápticos.",
                connections: [0, 2, 4],
                color: '#0066ff',
                size: 22
            },
            {
                x: 800, y: 350,
                title: "Machine Learning",
                content: "Algoritmos que melhoram performance através da experiência. Supervised, unsupervised e reinforcement learning representam diferentes paradigmas de aprendizado automático.",
                connections: [1, 5, 8],
                color: '#ff0066',
                size: 28
            },
            {
                x: 200, y: 500,
                title: "Cyberpunk",
                content: "Gênero que explora a fusão entre alta tecnologia e baixa qualidade de vida. Corporações dominam, hackers resistem, e a realidade virtual oferece escape de distopias urbanas.",
                connections: [0, 6, 9],
                color: '#ff00ff',
                size: 30
            },
            {
                x: 900, y: 200,
                title: "Deep Learning",
                content: "Subcampo do ML usando redes neurais profundas. Múltiplas camadas ocultas extraem características hierárquicas dos dados, revolucionando visão computacional e NLP.",
                connections: [1, 2, 10],
                color: '#00ffff',
                size: 26
            },
            {
                x: 1200, y: 400,
                title: "Natural Language Processing",
                content: "NPL permite que máquinas compreendam texto humano. Transformers e attention mechanisms revolucionaram a área, possibilitando modelos como GPT e BERT.",
                connections: [2, 4, 11],
                color: '#ffff00',
                size: 24
            },
            {
                x: 400, y: 700,
                title: "Realidade Virtual",
                content: "Simulação computacional de ambientes tridimensionais. Headsets imersivos criam experiências sensoriais convincentes, borrando fronteiras entre real e virtual.",
                connections: [3, 12],
                color: '#ff6666',
                size: 27
            },
            {
                x: 100, y: 300,
                title: "Filosofia da Mente",
                content: "Investiga a natureza da consciência e cognição. O problema mente-corpo questiona como processos físicos geram experiências subjetivas.",
                connections: [0, 8],
                color: '#6600ff',
                size: 23
            },
            {
                x: 700, y: 600,
                title: "Algoritmos Genéticos",
                content: "Otimização inspirada na evolução biológica. Seleção, mutação e crossover simulam pressões evolutivas para resolver problemas complexos.",
                connections: [2, 7, 13],
                color: '#00ff66',
                size: 21
            },
            {
                x: 500, y: 900,
                title: "Matrix Digital",
                content: "Conceito de realidade simulada digitalmente. Questiona a natureza da existência: vivemos em uma simulação? A tecnologia nos conecta ou nos aprisiona?",
                connections: [3, 6, 14],
                color: '#66ff00',
                size: 29
            },
            {
                x: 1100, y: 100,
                title: "Computer Vision",
                content: "Permite que máquinas 'vejam' e interpretem imagens. CNNs reconhecem padrões visuais, desde detecção de objetos até geração de arte artificial.",
                connections: [4, 5],
                color: '#ff3300',
                size: 25
            },
            {
                x: 1400, y: 600,
                title: "Chatbots e Assistentes",
                content: "IAs conversacionais que simulam diálogo humano. Combinam NLP, knowledge graphs e personalidade artificial para interações naturais.",
                connections: [5],
                color: '#3300ff',
                size: 22
            },
            {
                x: 300, y: 1000,
                title: "Metaverso",
                content: "Convergência de realidade virtual, aumentada e internet. Mundos persistentes onde avatares digitais vivem, trabalham e socializam em economia virtual.",
                connections: [6, 9],
                color: '#ff9900',
                size: 28
            },
            {
                x: 1000, y: 800,
                title: "Vida Artificial",
                content: "Simulação de processos vitais em sistemas computacionais. Autômatos celulares, sistemas complexos emergentes e evolução digital.",
                connections: [8],
                color: '#9900ff',
                size: 24
            },
            {
                x: 800, y: 1100,
                title: "Singularidade Tecnológica",
                content: "Hipotético momento quando IA supera inteligência humana. Crescimento exponencial da tecnologia pode levar a mudanças imprevisíveis na civilização.",
                connections: [9],
                color: '#ff0099',
                size: 31
            }
        ],
        npcs: [
            {
                x: 350, y: 1200,
                name: "Dra. Lúmina",
                spriteColor: "#00ffff",
                dialog: [
                    "Olá, viajante do conhecimento!",
                    "Eu sou a Dra. Lúmina, especialista em Inteligência Artificial.",
                    "A IA é a simulação da inteligência humana em máquinas.",
                    "Ela envolve aprendizado, raciocínio e adaptação.",
                    "Explore os nodes de Redes Neurais, Machine Learning e Deep Learning para entender mais!"
                ]
            },
            {
                x: 1500, y: 150,
                name: "Eng. Visionário",
                spriteColor: "#ff6600",
                dialog: [
                    "Saudações, explorador!",
                    "Eu sou o Eng. Visionário, pesquisador em Computer Vision.",
                    "A visão computacional permite que máquinas 'vejam' e interpretem imagens.",
                    "Ela é usada em carros autônomos, reconhecimento facial e até geração de arte.",
                    "Procure o node de Computer Vision e veja as conexões!"
                ]
            }
        ],
        portals: [
            { x: 1800, y: 1400, size: 30, color: "#00ffff", targetMap: 1, spawnX: 1800, spawnY: 1900 }
        ],
        width: 2000,
        height: 1500,
    },
    {
        name: "Mapa 2",
        nodes: [
            { x: 300, y: 300, title: "CPU (Processador Central)", content: "Cérebro do computador. Executa instruções e coordena operações. Contém Unidade de Controle, ALU e registradores.", connections: [1,2,3,4,5], color: "#00ccff", size: 30 },

            { x: 600, y: 250, title: "ISA (Conjunto de Instruções)", content: "Define as instruções que a CPU pode executar. Exemplos: x86, ARM, RISC-V. É a ponte entre hardware e software.", connections: [0,3,5], color: "#44eeff", size: 24 },

            { x: 200, y: 500, title: "Unidade de Controle", content: "Orquestra a execução das instruções, coordenando registradores, ALU e memória.", connections: [0,3], color: "#66ddff", size: 23 },

            { x: 500, y: 500, title: "ALU (Unidade Lógico-Aritmética)", content: "Executa cálculos matemáticos e operações lógicas. Essencial para processar qualquer dado.", connections: [0,2,4], color: "#00ffaa", size: 24 },

            { x: 350, y: 150, title: "Registradores", content: "Memória ultrarrápida dentro da CPU. Guardam dados temporários e endereços de execução.", connections: [0,3,6], color: "#22ff88", size: 23 },

            { x: 900, y: 300, title: "Pipeline", content: "Divide a execução em etapas (buscar, decodificar, executar, escrever). Aumenta a velocidade do processador.", connections: [0,1,7], color: "#ffbb00", size: 25 },

            { x: 200, y: 700, title: "Cache (L1/L2/L3)", content: "Memória muito rápida próxima da CPU. Reduz a diferença de velocidade entre CPU e RAM.", connections: [4,8,9], color: "#ff6666", size: 25 },

            { x: 1200, y: 400, title: "GPU (Placa de Vídeo)", content: "Processa gráficos em alta velocidade e tarefas paralelas. Ideal para jogos e inteligência artificial.", connections: [5,10], color: "#ff6600", size: 26 },

            { x: 400, y: 1000, title: "Memória RAM", content: "Memória de curto prazo. Armazena dados temporários dos programas em execução. Rápida, mas volátil.", connections: [6,9,11], color: "#66ff00", size: 27 },

            { x: 700, y: 900, title: "Memória Virtual", content: "Gerenciada pelo Sistema Operacional. Usa disco/SSD como extensão da RAM para rodar programas maiores.", connections: [6,8,11], color: "#11ffee", size: 24 },

            { x: 1300, y: 800, title: "Armazenamento (HD/SSD)", content: "Guarda arquivos e programas de forma permanente. SSDs são muito mais rápidos que HDs tradicionais.", connections: [7,8,11,12], color: "#ffaa00", size: 28 },

            { x: 800, y: 1200, title: "Sistema Operacional", content: "Gerencia o hardware e fornece interface para o usuário. Ex.: Windows, Linux, macOS.", connections: [8,9,10,12,13], color: "#ff00ff", size: 28 },

            { x: 1500, y: 1000, title: "Placa-Mãe", content: "Conecta todos os componentes: CPU, memória, GPU, armazenamento e periféricos.", connections: [10,11,13,15], color: "#44bbff", size: 26 },

            { x: 1200, y: 1300, title: "Periféricos", content: "Teclado, mouse, monitor, impressora. Permitem interação entre usuário e computador.", connections: [11,12,14], color: "#ff4444", size: 25 },

            { x: 700, y: 1500, title: "Rede & Internet", content: "Permite comunicação entre computadores. Protocolos como TCP/IP viabilizam a navegação e troca de informações.", connections: [11,13], color: "#33ddff", size: 25 },

            { x: 1600, y: 600, title: "Energia & Fonte", content: "Converte a energia da tomada em níveis adequados para cada componente.", connections: [12], color: "#ffcc66", size: 23 }
        ],
        npcs: [
            {
                x: 1650, y: 400,
                name: "Dr. Holograma",
                spriteColor: "#00ffff", // cor ou futuramente sprite
                dialog: [
                    "Olá, viajante digital!",
                    "Eu sou o Dr. Holograma.",
                    "Estou aqui para explicar o papel da CPU.",
                    "A CPU é o cérebro do computador. Quer saber mais? Explore os nodes!"
                ]
            }
        ],
        portals: [
            { x: 100, y: 100, size: 30, color: "#ff9900", targetMap: 0, spawnX: 100, spawnY: 100 }
        ],
        width: 2000,
        height: 2000,
    }
];

const quizzes = {
    0: [ // Mapa 1
        {
            q: "O que é Inteligência Artificial?",
            options: [
                "Um sistema que simula inteligência humana",
                "Um programa que sempre vence no xadrez",
                "Um banco de dados de informações fixas"
            ],
            answer: 0
        },
        {
            q: "O que é Deep Learning?",
            options: [
                "Uma técnica de aprendizado profundo com redes neurais",
                "Um método para armazenar dados em HDs",
                "Uma linguagem de programação"
            ],
            answer: 0
        }
    ],
    1: [ // Mapa 2
        {
            q: "Qual é a função da CPU?",
            options: [
                "Armazenar permanentemente os arquivos",
                "Executar instruções e coordenar operações",
                "Renderizar gráficos em alta qualidade",
                "Guardar programas em execução."
            ],
            answer: 1
        },
        {
            q: "O que é a ALU?",
            options: [
                "Unidade Lógico-Aritmética",
                "Unidade de Armazenamento Local",
                "Um tipo de registrador"
            ],
            answer: 0
        },
        {
            q: "Para que serve a memória RAM?",
            options: [
                "Armazenar dados temporários e instruções em uso",
                "Conservar dados mesmo sem energia",
                "Processar cálculos matemáticos complexos"
            ],
            answer: 0
        },
        {
            q: "O que caracteriza a memória Cache?",
            options: [
                "Armazenamento secundário de grande capacidade",
                "Memória muito rápida usada para acesso frequente",
                "Um tipo de memória gráfica dedicada a vídeos"
            ],
            answer: 1
        },
        {
            q: "O que são registradores?",
            options: [
                "Memórias externas conectadas via USB",
                "Armazenamento magnético em discos rígidos",
                "Pequenas áreas de memória dentro da CPU"
            ],
            answer: 2
        },
        {
            q: "Qual a função da Unidade de Controle (UC)?",
            options: [
                "Interpretar instruções e coordenar os componentes",
                "Ampliar a capacidade de armazenamento",
                "Realizar operações gráficas avançadas"
            ],
            answer: 0
        },
        {
            q: "O que são barramentos no computador?",
            options: [
                "Linhas de comunicação que transportam dados e sinais",
                "Programas que gerenciam o sistema operacional",
                "Processadores auxiliares para cálculos matemáticos"
            ],
            answer: 0
        }
    ]
};

const quizBtn = document.getElementById("quizBtn");
const quizModal = document.getElementById("quizModal");
const quizQuestions = document.getElementById("quizQuestions");
const quizResult = document.getElementById("quizResult");

let currentQuizMap = null;
let currentQuestionIndex = 0;
let selectedAnswers = [];
let answerStates = [];

quizBtn.addEventListener("click", () => {
    openQuiz(currentMapIndex);
});

document.getElementById("closeQuiz").addEventListener("click", () => {
    quizModal.style.display = "none";
    quizResult.style.marginTop = "0px";
});

function openQuiz(mapIndex) {
    currentQuizMap = mapIndex;
    currentQuestionIndex = 0;
    selectedAnswers = new Array(quizzes[mapIndex].length).fill(null);
    answerStates = new Array(quizzes[mapIndex].length).fill(null); // reset
    quizResult.textContent = "";
    showQuestion();
    quizModal.style.display = "flex";
}

function showQuestion() {
    quizQuestions.innerHTML = "";
    const questions = quizzes[currentQuizMap];
    const item = questions[currentQuestionIndex];

    const div = document.createElement("div");
    div.innerHTML = `<p><strong>${currentQuestionIndex + 1}. ${item.q}</strong></p>`;

    item.options.forEach((opt, j) => {
        const optionDiv = document.createElement("div");
        optionDiv.classList.add("optionBox");

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "q" + currentQuestionIndex;
        input.value = j;

        if (selectedAnswers[currentQuestionIndex] === j) {
            input.checked = true;
        }

        if (answerStates[currentQuestionIndex] === "correct" && j === questions[currentQuestionIndex].answer) {
            optionDiv.classList.add("correct");
        } else if (answerStates[currentQuestionIndex] === "wrong" && j === selectedAnswers[currentQuestionIndex]) {
            optionDiv.classList.add("wrong");
        }

        const label = document.createElement("span");
        label.textContent = opt;

        optionDiv.appendChild(input);
        optionDiv.appendChild(label);
        optionDiv.addEventListener("click", () => {
            input.checked = true;
            selectedAnswers[currentQuestionIndex] = j; // guarda a escolha
        });
        div.appendChild(optionDiv);
    });

    quizQuestions.appendChild(div);

    // Botões de navegação
    const navDiv = document.createElement("div");
    navDiv.style.marginTop = "15px";

    if (currentQuestionIndex > 0) {
        const prevBtn = document.createElement("button");
        prevBtn.textContent = "Anterior";
        prevBtn.addEventListener("click", () => {
            currentQuestionIndex--;
            showQuestion();
        });
        navDiv.appendChild(prevBtn);
    }

    if (currentQuestionIndex < questions.length - 1) {
        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Próxima";
        nextBtn.addEventListener("click", () => {
            currentQuestionIndex++;
            showQuestion();
        });
        navDiv.appendChild(nextBtn);
    } else {
        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Enviar Quiz";
        submitBtn.addEventListener("click", submitQuiz);
        navDiv.appendChild(submitBtn);
    }

    quizQuestions.appendChild(navDiv);
}

function submitQuiz() {
    const questions = quizzes[currentQuizMap];

    // Verifica se todas foram respondidas
    const unanswered = selectedAnswers.some(ans => ans === null);
    if (unanswered) {
        quizResult.textContent = "Você precisa responder todas as perguntas!";
        quizResult.style.color = "#ff4444";
        quizResult.style.marginTop = "15px";
        return; // não continua
    }

    // Se todas foram respondidas → corrige
    let score = 0;
    questions.forEach((item, i) => {
        if (selectedAnswers[i] === item.answer) {
            score++;
            answerStates[i] = "correct";
        } else {
            answerStates[i] = "wrong";
        }
    });

    quizResult.textContent = `Você acertou ${score} de ${questions.length}!`;
    quizResult.style.color = "#00ff00";
    quizResult.style.marginTop = "15px";

    showQuestion(); // redesenha para aplicar estilos
}

// Exemplo de flashcards (cada mapa pode ter os seus)
const flashcards = {
    0: [ // Mapa 1
        {
            title: "O que é Inteligência Artificial?",
            text: "Simulação da inteligência humana em máquinas.",
            img: "images/ai.png"
        },
        {
            title: "Redes Neurais Artificiais",
            text: "Estruturas computacionais inspiradas no cérebro humano.",
            img: "images/nn.jpg"
        }
    ],
    1: [ // Mapa 2
        {
            title: "Qual a função da CPU?",
            text: "A CPU (Unidade Central de Processamento) é o cérebro do computador. Ela busca, decodifica e executa instruções, coordenando operações entre registradores, ALU, unidade de controle, cache, memória RAM, armazenamento e periféricos por meio dos barramentos.",
            img: "images/cpu.png"
        },
        {
            title: "O que é a Placa-Mãe?",
            text: "Componente que conecta todos os dispositivos: CPU, RAM, GPU e periféricos.",
            img: "images/motherboard.png"
        },
        {
            title: "O que são Periféricos?",
            text: "Dispositivos de entrada e saída, como teclado, mouse e monitor.",
            img: "images/peripherals.png"
        },
        {
            title: "Para que serve a Memória RAM?",
            text: "Armazena dados temporários e instruções em uso, é rápida mas volátil.",
            img: "images/ram.png"
        },
        {
            title: "O que é Armazenamento (HD/SSD)?",
            text: "Memória permanente para guardar programas e arquivos. SSDs são mais rápidos.",
            img: "images/storage.png"
        },
        {
            title: "O que é um Sistema Operacional?",
            text: "Software que gerencia hardware e fornece interface para o usuário.",
            img: "images/os.png"
        },
    ]
};

let currentFlashcards = [];
let currentFlashcardIndex = 0;

const flashcardBtn = document.getElementById("flashcardBtn");
const flashcardModal = document.getElementById("flashcardModal");
const closeFlashcard = document.getElementById("closeFlashcard");
const flashcardTitle = document.getElementById("flashcardTitle");
const flashcardText = document.getElementById("flashcardText");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

flashcardBtn.addEventListener("click", () => {
    openFlashcards(currentMapIndex);
});

closeFlashcard.addEventListener("click", () => {
    flashcardModal.style.display = "none";
});

function openFlashcards(mapIndex) {
    currentFlashcards = flashcards[mapIndex] || [];
    currentFlashcardIndex = 0;
    if (currentFlashcards.length === 0) {
        flashcardTitle.innerHTML = "<p>Sem flashcards para este mapa!</p>";
        flashcardText.innerHTML = "";
        return;
    }
    flashcardModal.style.display = "flex";
    showFlashcard();
}

function showFlashcard() {
    const card = currentFlashcards[currentFlashcardIndex];
    flashcardTitle.innerHTML = `<p><b>${card.title}</b></p>`;
    flashcardText.innerHTML = `<p>${card.text}</p>` + (card.img ? `<img src="${card.img}" />` : "");
}

prevBtn.addEventListener("click", () => {
    currentFlashcardIndex = (currentFlashcardIndex - 1 + currentFlashcards.length) % currentFlashcards.length;
    showFlashcard();
});

nextBtn.addEventListener("click", () => {
    currentFlashcardIndex = (currentFlashcardIndex + 1) % currentFlashcards.length;
    showFlashcard();
});

// Configurações do jogo
const PLAYER_SPEED = 5;
const NODE_INTERACTION_DISTANCE = 20;
const PORTAL_INTERACTION_DISTANCE = 18;

// Nodes de conhecimento
let currentMapIndex = 0;
let currentMap = maps[currentMapIndex];
let knowledgeNodes = maps[currentMapIndex].nodes;
let portals = maps[currentMapIndex].portals;

let currentNpc = null;
let currentDialogIndex = 0;

// Redimensionar canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Camera
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
};

// Player
const player = {
    x: currentMap.width / 2,
    y: currentMap.height / 2 - 100,
    size: 15,
    color: '#00ff00',
    glowIntensity: 0,
    trail: []
};

// Input handling
const keys = {};
let mousePos = { x: 0, y: 0 };

document.addEventListener('keydown', (e) => {
    const noteInput = document.getElementById("noteInput");

    if (noteInput && document.activeElement === noteInput) {
        // Se estamos digitando na nota, ignorar WASD e 'E'
        const ignoreKeys = ["w", "W", "a", "A", "s", "S", "d", "D", "e", "E"];
        if (ignoreKeys.includes(e.key)) {
            e.stopPropagation(); // evita que o jogo capture
            return;
        }
    }

    keys[e.key.toLowerCase()] = true;

    if (e.key === 'Escape') {
        nodeInfo.style.display = 'none';
    }

    if (e.key.toLowerCase() === 'e' && player.nearNode) {
        showNodeInfo(player.nearNode.node, player.nearNode.index);
        openNode(player.nearNode.node, player.nearNode.index);
    }

    if (e.key.toLowerCase() === 'e' && player.nearNpc) {
        openDialog(player.nearNpc.npc);
    }

    if (e.key === "Escape" && noteBox.style.display === "block") {
        noteBox.style.display = "none";
        currentNodeId = null;
        return;
    }

    if (e.key === "Escape" && quizModal.style.display === "flex") {
        quizModal.style.display = "none";
        quizResult.style.marginTop = "0px";
        return;
    }

    if (e.key === "Escape" && flashcardModal.style.display === "flex") {
        flashcardModal.style.display = "none";
        return;
    }

    if (e.key === "Escape" && currentNpc) {
        closeDialog();
        return;
    }

    if (e.key === " " && currentNpc) {
        e.preventDefault(); // evita scroll da página
        currentDialogIndex++;
        if (currentDialogIndex < currentNpc.dialog.length) {
            document.getElementById("dialogText").textContent = currentNpc.dialog[currentDialogIndex];
        } else {
            closeDialog();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
    
    // Converter para coordenadas do mundo
    const worldX = mousePos.x + camera.x;
    const worldY = mousePos.y + camera.y;
    
    // Verificar clique em nodes
    knowledgeNodes.forEach((node, index) => {
        const dx = worldX - node.x;
        const dy = worldY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < node.size + 10) {
            showNodeInfo(node, index);
            openNode(node, index);
        }
    });
});

closeBtn.addEventListener('click', () => {
    nodeInfo.style.display = 'none';
});

closeBtnNote.addEventListener('click', () => {
    document.getElementById("noteBox").style.display = 'none';
});

closeBtnDialog.addEventListener('click', () => {
    document.getElementById("dialogBox").style.display = 'none';
});

function openDialog(npc) {
    currentNpc = npc;
    currentDialogIndex = 0;
    document.getElementById("dialogBox").style.display = "block";
    document.getElementById("npcName").textContent = npc.name;
    document.getElementById("dialogText").textContent = npc.dialog[currentDialogIndex];
}

function closeDialog() {
    document.getElementById("dialogBox").style.display = "none";
    currentNpc = null;
}

function showNodeInfo(node, index) {
    noteInput.value = "";

    document.getElementById('nodeTitle').textContent = node.title;
    document.getElementById('nodeContent').textContent = node.content;
    
    // Mostrar conexões
    const connectionsDiv = document.getElementById('nodeConnections');
    connectionsDiv.innerHTML = '<strong>Conexões:</strong><br>';
    node.connections.forEach(connIndex => {
        const connNode = knowledgeNodes[connIndex];
        connectionsDiv.innerHTML += `<span style="color: ${connNode.color}; display: inline-block; margin-top: 2px;">• ${connNode.title}</span><br>`;
    });

    // Mostrar links
    const linksDiv = document.getElementById('nodeLinks');
    linksDiv.innerHTML = "";

    if (node.links && node.links.length > 0) {
        linksDiv.innerHTML = "<br><strong>Links externos:</strong>";
        const ul = document.createElement("ul");
        ul.style.paddingLeft = "20px"; 
        node.links.forEach(link => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = link.url;
            a.textContent = link.label;
            a.target = "_blank";
            a.style.color = "#00ff66";
            li.appendChild(a);
            ul.appendChild(li);
        });
        linksDiv.appendChild(ul);
    }
    
    nodeInfo.style.display = 'block';
}

function updatePlayer() {
    let newX = player.x;
    let newY = player.y;
    
    // Movimento
    if (keys['w'] || keys['arrowup']) newY -= PLAYER_SPEED;
    if (keys['s'] || keys['arrowdown']) newY += PLAYER_SPEED;
    if (keys['a'] || keys['arrowleft']) newX -= PLAYER_SPEED;
    if (keys['d'] || keys['arrowright']) newX += PLAYER_SPEED;
    
    // Limites do mundo
    newX = Math.max(player.size, Math.min(currentMap.width - player.size, newX));
    newY = Math.max(player.size, Math.min(currentMap.height - player.size, newY));
    
    player.x = newX;
    player.y = newY;
    
    // Atualizar glow baseado na proximidade de nodes
    let closestDistance = Infinity;
    knowledgeNodes.forEach(node => {
        const dx = player.x - node.x;
        const dy = player.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        closestDistance = Math.min(closestDistance, distance);
    });
    
    player.glowIntensity = Math.max(0, 1 - closestDistance / 200);

    // Adicionar posição atual ao trail
    player.trail.push({
        x: player.x,
        y: player.y,
        life: 30 // duração em frames
    });

    // Remover trail velho
    for (let i = 0; i < player.trail.length; i++) {
        player.trail[i].life--;
    }
    player.trail = player.trail.filter(p => p.life > 0);

    // Detectar node próximo para interação
    player.nearNode = null;
    knowledgeNodes.forEach((node, index) => {
        const dx = player.x - node.x;
        const dy = player.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < node.size + NODE_INTERACTION_DISTANCE) {
            player.nearNode = { node, index };
        }
    });

    player.nearPortal = null;
    portals.forEach((portal, index) => {
        const dx = player.x - portal.x;
        const dy = player.y - portal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < portal.size + PORTAL_INTERACTION_DISTANCE) {
            player.nearPortal = index; // guarda índice do portal
        }

        if (distance < portal.size + PORTAL_INTERACTION_DISTANCE && keys['e']) {
            // Trocar de mapa
            currentMapIndex = portal.targetMap;
            currentMap = maps[currentMapIndex];
            knowledgeNodes = maps[currentMapIndex].nodes;
            portals = maps[currentMapIndex].portals;

            // Mover jogador para o spawn do mapa de destino
            player.trail = [];
            player.x = portal.spawnX;
            player.y = portal.spawnY;
        }
    });

    player.nearNpc = null;
    currentMap.npcs?.forEach((npc, index) => {
        const dx = player.x - npc.x;
        const dy = player.y - npc.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 38) { // distância para interagir
            player.nearNpc = { npc, index };
        }
    });
}

function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    
    // Limites da câmera
    camera.x = Math.max(0, Math.min(currentMap.width - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(currentMap.height - canvas.height, camera.y));
}

function drawGrid() {
    ctx.strokeStyle = '#003311';
    ctx.lineWidth = 0.5;
    
    const gridSize = 50;
    const startX = Math.floor(camera.x / gridSize) * gridSize;
    const startY = Math.floor(camera.y / gridSize) * gridSize;
    
    for (let x = startX; x < camera.x + canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x - camera.x, 0);
        ctx.lineTo(x - camera.x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = startY; y < camera.y + canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y - camera.y);
        ctx.lineTo(canvas.width, y - camera.y);
        ctx.stroke();
    }
}

function drawPortals() {
    portals.forEach((portal, index) => {
        const screenX = portal.x - camera.x;
        const screenY = portal.y - camera.y;

        const isNear = player.nearPortal === index;

        // Halo pulsante se próximo
        if (isNear) {
            const pulse = Math.sin(Date.now() * 0.005) * 5 + 10;
            ctx.beginPath();
            ctx.arc(screenX, screenY, portal.size + pulse, 0, Math.PI * 2);
            ctx.strokeStyle = portal.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        ctx.beginPath();
        ctx.arc(screenX, screenY, portal.size, 0, Math.PI * 2);
        ctx.strokeStyle = portal.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = portal.color;
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
    });
}

function drawNpcs() {
    currentMap.npcs?.forEach((npc, index) => {
        const screenX = npc.x - camera.x;
        const screenY = npc.y - camera.y;

        const isNear = player.nearNpc && player.nearNpc.index === index;

        // Se estiver perto → halo pulsante
        if (isNear) {
            const pulse = Math.sin(Date.now() * 0.005) * 5 + 15; 
            ctx.beginPath();
            ctx.arc(screenX, screenY, 25 + pulse, 0, Math.PI * 2);
            ctx.strokeStyle = npc.spriteColor;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Glow holográfico externo
        ctx.beginPath();
        ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
        ctx.fillStyle = npc.spriteColor + "88";
        ctx.fill();

        // Corpo principal do NPC
        ctx.beginPath();
        ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
        ctx.fillStyle = npc.spriteColor;
        ctx.fill();

        // Nome acima do NPC
        ctx.fillStyle = "#fff";
        ctx.font = "14px Courier New";
        ctx.textAlign = "center";
        ctx.fillText(npc.name, screenX, screenY - 30);
    });
}

function drawConnections() {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    
    knowledgeNodes.forEach((node, index) => {
        node.connections.forEach(connIndex => {
            if (connIndex > index) { // Evitar duplicatas
                const connNode = knowledgeNodes[connIndex];
                ctx.beginPath();
                ctx.moveTo(node.x - camera.x, node.y - camera.y);
                ctx.lineTo(connNode.x - camera.x, connNode.y - camera.y);
                ctx.stroke();
            }
        });
    });
}

function drawNodes() {
    const time = Date.now() * 0.005;
    
    knowledgeNodes.forEach((node, index) => {
        const screenX = node.x - camera.x;
        const screenY = node.y - camera.y;
        
        // Verificar se está na tela
        if (screenX > -node.size && screenX < canvas.width + node.size &&
            screenY > -node.size && screenY < canvas.height + node.size) {
            
            // Efeito de pulsação
            const pulse = 1 + Math.sin(time + index) * 0.1;
            const currentSize = node.size * pulse;

            const isNear = player.nearNode && player.nearNode.index === index;

            if (isNear) {
                const pulseSize = currentSize * 1.4 + Math.sin(Date.now() * 0.01) * 4;
                ctx.beginPath();
                ctx.arc(screenX, screenY, pulseSize, 0, Math.PI * 2);
                ctx.strokeStyle = node.color;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.7;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            
            // Glow
            ctx.shadowColor = node.color;
            ctx.shadowBlur = 20;
            
            // Círculo principal
            ctx.beginPath();
            ctx.arc(screenX, screenY, currentSize, 0, Math.PI * 2);
            ctx.fillStyle = node.color + '88';
            ctx.fill();
            
            // Círculo interno
            ctx.beginPath();
            ctx.arc(screenX, screenY, currentSize * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Título
            ctx.shadowBlur = 5;
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(node.title, screenX, screenY + currentSize + 20);
            
            ctx.shadowBlur = 0;
        }
    });
}

function drawPlayer() {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    // === Trail ===
    for (let i = 0; i < player.trail.length; i++) {
        const point = player.trail[i];
        const alpha = point.life / 30;
        const size = (i / player.trail.length) * player.size;

        ctx.fillStyle = `rgba(0, 255, 136, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(point.x - camera.x, point.y - camera.y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // === Glow do jogador ===
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 10 + player.glowIntensity * 30;
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawMinimap() {
    minimap.width = currentMap.width / 10;
    minimap.height = currentMap.height / 10;

    minimapCtx.clearRect(0, 0, minimap.width, minimap.height);
    
    // Usar o espaço total do minimap
    const mw = minimap.width;
    const mh = minimap.height;
    const scaleX = mw / currentMap.width;
    const scaleY = mh / currentMap.height;
    minimapCtx.clearRect(0, 0, mw, mh);
    
    // Nodes no minimap
    knowledgeNodes.forEach(node => {
        const minimapX = node.x * scaleX;
        const minimapY = node.y * scaleY;
        
        minimapCtx.beginPath();
        minimapCtx.arc(minimapX, minimapY, 3, 0, Math.PI * 2);
        minimapCtx.fillStyle = node.color;
        minimapCtx.fill();
    });

    // NPCs no minimap
    if (currentMap.npcs) {
        currentMap.npcs.forEach(npc => {
            const minimapX = npc.x * scaleX;
            const minimapY = npc.y * scaleY;

            minimapCtx.beginPath();
            minimapCtx.arc(minimapX, minimapY, 4, 0, Math.PI * 2); // raio 4 px
            minimapCtx.fillStyle = npc.spriteColor;
            minimapCtx.fill();
        });
    }

    // Portais no minimap
    if (portals) {
        portals.forEach(portal => {
            const minimapX = portal.x * scaleX;
            const minimapY = portal.y * scaleY;

            minimapCtx.beginPath();
            minimapCtx.arc(minimapX, minimapY, 5, 0, Math.PI * 2); // tamanho fixo 5px
            minimapCtx.strokeStyle = portal.color;
            minimapCtx.lineWidth = 2;
            minimapCtx.stroke();
        });
    }
    
    // Player no minimap
    let playerX = player.x * scaleX;
    let playerY = player.y * scaleY;
    const r = 4; // raio do player no minimap

    // Garante que o círculo nunca ultrapasse as bordas
    playerMinimapX = Math.max(r, Math.min(minimap.width - r, playerX));
    playerMinimapY = Math.max(r, Math.min(minimap.height - r, playerY));

    minimapCtx.beginPath();
    minimapCtx.arc(playerMinimapX, playerMinimapY, r, 0, Math.PI * 2);
    minimapCtx.fillStyle = "#0f0";
    minimapCtx.fill();
    
    // Glow do player no minimap
    minimapCtx.shadowColor = '#00ff00';
    minimapCtx.shadowBlur = 8;
    minimapCtx.beginPath();
    minimapCtx.arc(playerMinimapX, playerMinimapY, 2, 0, Math.PI * 2);
    minimapCtx.fillStyle = '#ffffff';
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;
    
    // Camera viewport no minimap
    const viewportWidth = canvas.width * scaleX;
    const viewportHeight = canvas.height * scaleY;
    const viewportX = camera.x * scaleX;
    const viewportY = camera.y * scaleY;
    
    minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    minimapCtx.lineWidth = 2;
    minimapCtx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
    
    // Área de viewport com transparência
    minimapCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    minimapCtx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
}

function drawMinimapConnections() {
    const scaleX = minimap.width / currentMap.width;
    const scaleY = minimap.height / currentMap.height;

    minimapCtx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    minimapCtx.lineWidth = 1;

    knowledgeNodes.forEach((node, index) => {
        node.connections.forEach(connIndex => {
            if (connIndex > index) { // Evitar duplicatas
                const connNode = knowledgeNodes[connIndex];
                const nodeX = node.x * scaleX;
                const nodeY = node.y * scaleY;
                const connX = connNode.x * scaleX;
                const connY = connNode.y * scaleY;

                minimapCtx.beginPath();
                minimapCtx.moveTo(nodeX, nodeY);
                minimapCtx.lineTo(connX, connY);
                minimapCtx.stroke();
            }
        });
    });
}

function gameLoop() {
    // Update
    updatePlayer();
    updateCamera();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw
    drawGrid();
    drawConnections();
    drawNodes();
    drawPortals();
    drawNpcs();
    drawPlayer();
    drawMinimap();
    drawMinimapConnections();
    
    requestAnimationFrame(gameLoop);
}

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("KnowledgeExplorerDB", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("notes")) {
                db.createObjectStore("notes", { keyPath: "nodeId" });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function saveNote(nodeId, text) {
    const db = await openDB();
    const tx = db.transaction("notes", "readwrite");
    const store = tx.objectStore("notes");
    store.put({ nodeId, text });
    return tx.complete;
}

async function loadNote(nodeId) {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction("notes", "readonly");
        const store = tx.objectStore("notes");
        const req = store.get(nodeId);
        req.onsuccess = () => resolve(req.result ? req.result.text : "");
    });
}

let currentNodeId = null;

async function openNode(node, index) {
    currentNodeId = `${currentMapIndex}_${index}`;
    const noteBox = document.getElementById("noteBox");
    noteBox.style.display = "block";
    document.getElementById("noteTitle").innerText = node.title;

    const text = await loadNote(currentNodeId);
    const input = document.getElementById("noteInput");
    input.value = text;
    input.focus();
}

document.getElementById("saveNote").addEventListener("click", async () => {
    if (currentNodeId !== null) {
        const text = document.getElementById("noteInput").value;
        await saveNote(currentNodeId, text);
        showToast("Nota salva com sucesso!");
    }
});

document.getElementById("exportNote").addEventListener("click", () => {
    if (currentNodeId !== null) {
        const nodeTitle = document.getElementById("noteTitle").innerText;
        const text = document.getElementById("noteInput").value;

        // Montar conteúdo do arquivo
        const fileContent = `# ${nodeTitle}\n\n${text}`;

        // Criar blob e link de download
        const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${nodeTitle.replace(/\s+/g, "_")}.txt`; // nome do arquivo
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

document.getElementById("clearNote").addEventListener("click", () => {
    const noteInput = document.getElementById("noteInput");
    noteInput.value = "";

    // Atualiza o banco de dados com nota vazia
    if (currentNodeId !== undefined) {
        saveNote(currentNodeId, "");
        showToast("Nota limpa com sucesso!");
    }
});

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000); // desaparece após 2s
}

// Iniciar o jogo
gameLoop();