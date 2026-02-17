const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const video = document.getElementById('video-source');
const texture = new THREE.VideoTexture(video);
let backgroundMesh;
let menuRevealed = false;

function revealMenu() {
    if (menuRevealed) return;
    menuRevealed = true;
    gsap.to(".menu-item", { duration: 1, opacity: 1, x: 0, stagger: 0.15, ease: "expo.out" });
}

function updateCover() {
    const distance = 70;
    camera.position.z = distance;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const height = 2 * Math.tan(vFOV / 2) * distance;
    const width = height * camera.aspect;
    const videoAspect = 16 / 9;
    let meshW, meshH;
    if (camera.aspect > videoAspect) { meshW = width; meshH = width / videoAspect; }
    else { meshH = height; meshW = height * videoAspect; }
    const safetyMargin = 1.4;
    meshW *= safetyMargin; meshH *= safetyMargin;

    if (!backgroundMesh) {
        backgroundMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ map: texture })
        );
        scene.add(backgroundMesh);
        revealMenu();
    }
    backgroundMesh.scale.set(meshW, meshH, 1);
}

// Vídeo carregou normalmente
video.onloadedmetadata = () => { updateCover(); video.play(); };

// Vídeo deu erro (arquivo ausente, formato não suportado, etc.)
video.onerror = () => { revealMenu(); };

// Se o vídeo já estava em cache e já tem dados
if (video.readyState >= 1) { updateCover(); video.play().catch(() => { }); }

// Fallback de segurança: se após 2s o menu ainda não apareceu, mostra mesmo assim
setTimeout(() => { revealMenu(); }, 2000);

// --- Áudio ---
const bgAudio = new Audio('/resources/last.mp3');
bgAudio.loop = true;
bgAudio.volume = 0.6;

// Dica de música seguindo o cursor
const musicHint = document.createElement('div');
musicHint.textContent = 'Ativar Música';
Object.assign(musicHint.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '9999',
    color: '#ffffff',
    fontSize: '4rem',
    fontFamily: "'p5', 'Impact', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '3px',
    textShadow: '4px 4px 0px #000',
    whiteSpace: 'nowrap',
    opacity: '0',
    transform: 'translate(22px, 22px)',
    transition: 'opacity 0.4s ease',
});
document.body.appendChild(musicHint);

window.addEventListener('mousemove', (e) => {
    musicHint.style.left = e.clientX + 'px';
    musicHint.style.top = e.clientY + 'px';
});

function hideMusicHint() {
    gsap.to(musicHint, { opacity: 0, duration: 0.4, onComplete: () => musicHint.remove() });
}

function playAudio() {
    bgAudio.play()
        .then(() => { hideMusicHint(); })
        .catch(() => { });
}

// Tenta tocar imediatamente
playAudio();

// Se o browser bloqueou, mostra a dica e aguarda interação
bgAudio.play().catch(() => {
    gsap.to(musicHint, { opacity: 1, duration: 0.5, delay: 0.5 });
});

['click', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, () => { playAudio(); }, { once: true });
});

window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;

    if (backgroundMesh) {
        gsap.to(backgroundMesh.rotation, { y: -x * 0.15, x: y * 0.12, duration: 2.5, ease: "power2.out" });
        gsap.to(backgroundMesh.position, { x: -x * 15, y: y * 12, duration: 2.5, ease: "power2.out" });
    }

    gsap.to(".menu-item", {
        y: (i, t) => -y * t.dataset.speed * 1.5,
        x: (i, t) => -x * 60,
        rotateY: -25 + (x * 15),
        rotateX: 10 + (y * -10),
        duration: 2,
        ease: "power3.out",
        stagger: 0.05
    });

    document.querySelectorAll('.menu-item').forEach(item => {
        const shiftX = x * -50;
        const shiftY = y * -50;
        item.style.setProperty('--shiftX_move', `${shiftX}px`);
        item.style.setProperty('--shiftY_move', `${shiftY}px`);
    });
});

const dotsElement = document.getElementById('dots');
let dotCount = 0;

function startLoadingSequence(url) {
    const screen = document.getElementById('loading-screen');
    screen.style.display = 'flex';
    setInterval(() => { dotCount = (dotCount + 1) % 4; dotsElement.textContent = ".".repeat(dotCount); }, 400);
    gsap.to(screen, {
        opacity: 1, duration: 0.4, onComplete: () => {
            setTimeout(() => { window.location.href = url; }, 5000);
        }
    });
}

document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const url = this.getAttribute('href');
        const rect = this.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        // OTIMIZAÇÃO: Reduzido de 120 para 40 partículas
        const particleCount = 40;
        const particles = [];

        // Iniciar tela de loading imediatamente após 1s da explosão
        setTimeout(() => {
            startLoadingSequence(url);
        }, 1000);

        // Criar todas as partículas primeiro (mais eficiente)
        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('div');
            p.className = 'smoke-particle';
            const size = Math.random() * 100 + 40;
            p.style.width = p.style.height = `${size}px`;
            p.style.background = Math.random() > 0.5 ? '#000' : '#d30000';
            p.style.left = `${cx}px`;
            p.style.top = `${cy}px`;
            document.body.appendChild(p);
            particles.push(p);
        }

        // Animar todas de uma vez com requestAnimationFrame
        particles.forEach((p, i) => {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const distance = Math.random() * 800 + 400;
            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance;

            const tl = gsap.timeline();

            // Fase 1: Explosão (1.2s)
            tl.to(p, {
                x: targetX,
                y: targetY,
                rotation: Math.random() * 720,
                scale: Math.random() * 15 + 10,
                duration: 1.2,
                ease: "power2.out",
                delay: Math.random() * 0.05
            })
                // Fase 2: Permanência (0.8s) - elementos ficam visíveis
                .to(p, {
                    duration: 0.8
                })
                // Fase 3: Fade out suave (0.6s)
                .to(p, {
                    opacity: 0,
                    duration: 0.6,
                    ease: "power2.inOut",
                    onComplete: () => {
                        p.remove();
                    }
                });
        });
    });
});

function animate() { requestAnimationFrame(animate); renderer.render(scene, camera); }
animate();
gsap.set(".menu-item", { x: 500 });
window.addEventListener('resize', () => { renderer.setSize(window.innerWidth, window.innerHeight); updateCover(); });