const API = 'http://localhost:8080';
let miLista = [];
let contenidoActual = null;

// Carrusel circular
let angleOffset = 0;
let autoSpin = null;
let isPaused = false;

const RADIUS = 320;
const CARD_W = 200;
const CARD_H = 300;
const SPIN_SPEED = 0.25;
const ITEMS_IN_WHEEL = 5;

window.addEventListener('load', () => {
    const correo = localStorage.getItem('userEmail');
    if (!correo) { window.location.href = 'index.html'; return; }

    const nombre = localStorage.getItem('activeProfileName') || 'Usuario';
    const avatar = localStorage.getItem('activeProfileAvatar') || 'imagenes/perfil1.jpg';
    document.getElementById('navName').textContent = nombre;
    document.getElementById('navAvatar').src = avatar;

    cargarMiLista();
});

async function cargarMiLista() {
    const correo = localStorage.getItem('userEmail');
    try {
        // 1. Obtener favoritos (ya vienen con toda la info necesaria)
        const resFavs = await fetch(`${API}/v1/favoritos/mis-favoritos?correo=${correo}`);
        const favs = await resFavs.json();

        if (!favs || favs.length === 0) { mostrarVacio(); return; }

        // 2. Mapear favoritos al formato que usa el frontend
        miLista = favs.map(f => ({
            id:         f.contenidoId,
            _id:        f.contenidoId,
            titulo:     f.titulo     || 'Sin título',
            imagen:     f.imagen     || 'imagenes/perfil1.jpg',
            url:        f.url        || '',
            tipo:       f.tipo       || 'Película',
            plataforma: f.plataforma || '',
            seccion:    f.seccion    || ''
        }));

        document.getElementById('listCount').textContent =
            `${miLista.length} título${miLista.length !== 1 ? 's' : ''} guardado${miLista.length !== 1 ? 's' : ''}`;
        document.getElementById('listMain').style.display = 'block';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('gridCount').textContent = miLista.length;

        iniciarCarrusel();
        renderGrid();

    } catch (e) {
        console.error("Error cargando Mi Lista:", e);
        mostrarVacio();
    }
}

function mostrarVacio() {
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('listMain').style.display = 'none';
}

/* ══════════════════════════════════════
   CARRUSEL 3D CIRCULAR
══════════════════════════════════════ */
function iniciarCarrusel() {
    const track = document.getElementById('wheelTrack');
    track.innerHTML = '';

    const items = miLista.length < 5
        ? [...miLista, ...miLista, ...miLista, ...miLista, ...miLista].slice(0, 10)
        : [...miLista, ...miLista];

    items.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = 'wheel-card';
        card.dataset.index = i;
        card.innerHTML = `
            <img src="${item.imagen}" alt="${item.titulo}"
                 onerror="this.src='imagenes/perfil1.jpg'" loading="lazy">
            <div class="wheel-card-shine"></div>
            <div class="wheel-card-info">
                <div class="wheel-card-title">${item.titulo}</div>
                <div class="wheel-card-meta">${item.plataforma} · ${item.tipo || 'Película'}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            const realItem = miLista[i % miLista.length];
            abrirModal(realItem);
        });
        track.appendChild(card);
    });

    iniciarSpin();
}

function iniciarSpin() {
    if (autoSpin) cancelAnimationFrame(autoSpin);

    function frame() {
        if (!isPaused) {
            angleOffset += SPIN_SPEED;
        }
        posicionarCards();
        autoSpin = requestAnimationFrame(frame);
    }
    autoSpin = requestAnimationFrame(frame);
}

function posicionarCards() {
    const track = document.getElementById('wheelTrack');
    if (!track) return;
    const cards = track.querySelectorAll('.wheel-card');
    const total = cards.length;
    const section = document.querySelector('.wheel-section');
    if (!section) return;

    const centerX = section.offsetWidth / 2;
    const centerY = section.offsetHeight / 1.1;

    cards.forEach((card, i) => {
        const angleDeg = (i * (360 / total)) + angleOffset;
        const angleRad = (angleDeg * Math.PI) / 180;

        const x = centerX + RADIUS * Math.sin(angleRad) - CARD_W / 2;
        const y = centerY - RADIUS * Math.cos(angleRad) - CARD_H / 2;

        const cosVal = Math.cos(angleRad);
        const depth = (cosVal + 1) / 2;

        const scale   = 0.55 + depth * 0.65;
        const opacity = 0.25 + depth * 0.75;
        const zIndex  = Math.round(depth * 100);
        const blur    = (1 - depth) * 4;

        const sinVal = Math.sin(angleRad);
        const rotZ   = sinVal * -12;

        const visible = cosVal > -0.3;

        card.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${CARD_W}px;
            transform: scale(${scale}) rotate(${rotZ}deg);
            transform-origin: center center;
            opacity: ${visible ? opacity : 0};
            z-index: ${zIndex};
            filter: blur(${blur}px) brightness(${0.5 + depth * 0.5});
            transition: opacity 0.3s;
            pointer-events: ${visible ? 'auto' : 'none'};
            border-radius: 18px;
            overflow: hidden;
            cursor: pointer;
            box-shadow: ${depth > 0.7
                ? `0 ${Math.round(depth * 30)}px ${Math.round(depth * 50)}px rgba(0,0,0,0.7), 0 0 ${Math.round(depth * 30)}px rgba(0,156,243,${(depth - 0.5).toFixed(2)})`
                : 'none'};
        `;

        const info = card.querySelector('.wheel-card-info');
        if (info) info.style.opacity = depth > 0.85 ? '1' : '0';
    });
}

function pausarYDeslizar(dir) {
    isPaused = true;
    const step = 360 / document.querySelectorAll('.wheel-card').length;
    angleOffset += dir * step;
    setTimeout(() => { isPaused = false; }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
    const section = document.querySelector('.wheel-section');
    if (section) {
        section.addEventListener('mouseenter', () => { isPaused = true; });
        section.addEventListener('mouseleave', () => { isPaused = false; });
    }
});

/* ══════════════════════════════════════
   GRID
══════════════════════════════════════ */
function renderGrid() {
    const grid = document.getElementById('listGrid');
    grid.innerHTML = '';
    miLista.forEach(item => {
        const card = document.createElement('div');
        card.className = 'grid-card';
        card.innerHTML = `
            <img src="${item.imagen}" alt="${item.titulo}"
                 onerror="this.src='imagenes/perfil1.jpg'" loading="lazy">
            <div class="grid-card-overlay">
                <div class="grid-card-title">${item.titulo}</div>
                <button class="grid-card-play"
                    onclick="event.stopPropagation();abrirUrl('${item.url}')">▶ Play</button>
            </div>
            <button class="grid-card-remove"
                onclick="event.stopPropagation();quitarDirecto('${item.id}')"
                title="Quitar de Mi Lista">✕</button>
        `;
        card.addEventListener('click', () => abrirModal(item));
        grid.appendChild(card);
    });
}

/* ══════════════════════════════════════
   MODAL
══════════════════════════════════════ */
function abrirModal(item) {
    contenidoActual = item;
    document.getElementById('modalImg').src = item.imagen;
    document.getElementById('modalTitle').textContent = item.titulo;
    document.getElementById('modalBadges').innerHTML = `
        <span class="modal-badge blue">${item.tipo || 'Película'}</span>
        <span class="modal-badge">${item.plataforma || ''}</span>
        ${item.seccion ? `<span class="modal-badge">${item.seccion}</span>` : ''}
    `;
    document.getElementById('modalPlayBtn').onclick = () => abrirUrl(item.url);
    document.getElementById('modalDetail').innerHTML = `
        <p><strong style="color:white">Plataforma:</strong> ${item.plataforma || 'N/A'}</p>
        <p style="margin-top:8px"><strong style="color:white">Tipo:</strong> ${item.tipo || 'Película'}</p>
        ${item.seccion ? `<p style="margin-top:8px"><strong style="color:white">Sección:</strong> ${item.seccion}</p>` : ''}
    `;
    document.getElementById('modalOverlay').classList.add('show');
    document.getElementById('contentModal').classList.add('show');
    isPaused = true;
}

function cerrarModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('contentModal').classList.remove('show');
    contenidoActual = null;
    isPaused = false;
}

async function quitarDeLista() {
    if (!contenidoActual) return;
    await quitarDirecto(contenidoActual.id);
    cerrarModal();
}

async function quitarDirecto(id) {
    const correo = localStorage.getItem('userEmail');
    try {
        const res = await fetch(
            `${API}/v1/favoritos/eliminar?correo=${correo}&contenidoId=${id}`,
            { method: 'DELETE' }
        );
        if (!res.ok) {
            console.error('Error al quitar favorito:', await res.json());
            return;
        }
        miLista = miLista.filter(c => c.id !== id && c._id !== id);
        if (miLista.length === 0) { mostrarVacio(); return; }
        document.getElementById('listCount').textContent =
            `${miLista.length} título${miLista.length !== 1 ? 's' : ''} guardado${miLista.length !== 1 ? 's' : ''}`;
        document.getElementById('gridCount').textContent = miLista.length;
        iniciarCarrusel();
        renderGrid();
    } catch (e) {
        console.error("Error quitando favorito:", e);
    }
}

function abrirUrl(url) { if (url) window.open(url, '_blank'); }
function toggleProfileMenu() { document.getElementById('profileDropdown').classList.toggle('show'); }
function cerrarSesion() { localStorage.clear(); window.location.href = 'index.html'; }
document.addEventListener('click', e => {
    if (!e.target.closest('.nav-profile'))
        document.getElementById('profileDropdown')?.classList.remove('show');
});