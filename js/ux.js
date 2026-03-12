// ==================== BACKGROUND AURA & CUSTOM CURSOR ====================

document.addEventListener('DOMContentLoaded', () => {
    createBackgroundAura();
    createCustomCursor();
});

function createBackgroundAura() {
    const auraContainer = document.createElement('div');
    auraContainer.className = 'background-aura';
    auraContainer.innerHTML = `
        <div class="aura-blob blob-1"></div>
        <div class="aura-blob blob-2"></div>
        <div class="aura-blob blob-3"></div>
    `;
    document.body.appendChild(auraContainer);
}

function createCustomCursor() {
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    });

    function animateRing() {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        requestAnimationFrame(animateRing);
    }
    animateRing();

    document.addEventListener('mousedown', () => {
        ring.classList.add('active');
    });
    document.addEventListener('mouseup', () => {
        ring.classList.remove('active');
    });
}

