// Criar estrelas aleatórias
const starsContainer = document.getElementById('stars');
const starCount = 200;

for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    
    // Tamanho aleatório entre 1px e 3px
    const size = Math.random() * 2 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    
    // Posição aleatória
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    
    // Tempo de animação aleatório
    star.style.animationDuration = `${Math.random() * 3 + 2}s`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    
    starsContainer.appendChild(star);
}

// Botão de play
document.getElementById('playBtn').addEventListener('click', () => {
    // Efeito de transição
    document.body.style.animation = 'fadeOut 1s forwards';
    
    // Redirecionar após a animação
    setTimeout(() => {
        window.location.href = 'game.html';
    }, 1000);
});

// Adicionar animação de fadeOut dinamicamente
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: scale(1.1);
        }
    }
`;
document.head.appendChild(style);