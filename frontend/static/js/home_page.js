document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const particlesContainer = document.getElementById('particles-container');

    loginBtn?.addEventListener('click', () => {
        window.location.href = '/frontend/index.html';
    });

    const gases = [
        { symbol: 'O₂', color: '#1c4482' },
        { symbol: 'H₂', color: '#ef7f1b' },
        { symbol: 'N₂', color: '#000000' },
        { symbol: 'DA', color: '#666666' }
    ];

    function createParticle() {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const gas = gases[Math.floor(Math.random() * gases.length)];
        const size = Math.random() * 40 + 35;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.backgroundColor = `${gas.color}33`;
        particle.style.border = `2px solid ${gas.color}66`;
        particle.style.animationDuration = `${Math.random() * 8 + 12}s`;
        particle.style.animationDelay = `${Math.random() * 3}s`;
        particle.textContent = gas.symbol;
        
        particlesContainer.appendChild(particle);
        
        setTimeout(() => particle.remove(), 
            (parseFloat(particle.style.animationDuration) + parseFloat(particle.style.animationDelay)) * 1000
        );
    }

    for (let i = 0; i < 6; i++) {
        setTimeout(() => createParticle(), i * 600);
    }

    setInterval(createParticle, 2500);
});
