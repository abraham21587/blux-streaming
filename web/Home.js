const API = 'http://localhost:8080';
let todoElCatalogo = [];
let heroItems = [];
let heroIndex = 0;
let heroTimer = null;
let favoritosSet = new Set();
let contenidoActual = null;

// Helper para obtener el ID de MongoDB
function getId(item) {
    return String(item._id || item.id || '');
}

window.addEventListener('load', () => {
    const correo = localStorage.getItem('userEmail');
    if (!correo) { window.location.href = 'index.html'; return; }

    const nombre = localStorage.getItem('activeProfileName') || 'Usuario';
    const avatar = localStorage.getItem('activeProfileAvatar') || 'imagenes/perfil1.jpg';
    document.getElementById('navName').textContent = nombre;
    document.getElementById('navAvatar').src = avatar;

    cargarFavoritos().then(() => cargarHome());

    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
    });
    document.getElementById('navbar').classList.add('scrolled');
});

async function cargarHome() {
    try {
        const res = await fetch(`${API}/v1/flux/home`);
        const data = await res.json();
        const catalogo = data.catalogo || [];
        const enVivo = data.en_vivo || [];

        todoElCatalogo = catalogo;

        // Hero solo con primeras películas/series
        heroItems = catalogo.slice(0, 5);
        if (heroItems.length > 0) {
            renderHero(heroItems[0]);
            iniciarHeroAuto();
        }

        // Agrupar catálogo por sección
        const secciones = {};
        catalogo.forEach(c => {
            const sec = c.seccion || 'Otros';
            if (!secciones[sec]) secciones[sec] = [];
            secciones[sec].push(c);
        });
        renderSecciones(secciones);

        // En vivo al final
        if (enVivo.length > 0) renderEnVivo(enVivo);

    } catch (e) {
        console.error("Error cargando home:", e);
    }
}

function renderHero(item) {
    document.getElementById('heroBg').style.backgroundImage = `url('${item.imagen}')`;
    document.getElementById('heroTitle').textContent = item.titulo;
    document.getElementById('heroDesc').textContent = item.descripcion || `Disponible en ${item.plataforma || ''}`;
    document.getElementById('heroMeta').innerHTML = `
        <span>🎬 ${item.tipo || 'Película'}</span>
        <span class="dot"></span>
        <span>${item.plataforma || ''}</span>
        ${item.seccion ? `<span class="dot"></span><span>${item.seccion}</span>` : ''}
    `;
    const hc = document.getElementById('heroContent');
    hc.style.animation = 'none'; hc.offsetHeight; hc.style.animation = 'heroIn 0.6s ease forwards';
    document.getElementById('heroPlayBtn').onclick = () => abrirUrl(item.url);
    document.getElementById('heroInfoBtn').onclick = () => abrirModal(item);
}

function iniciarHeroAuto() {
    const DURACION = 7000;
    let inicio = Date.now();
    clearInterval(heroTimer);
    heroTimer = setInterval(() => {
        const elapsed = Date.now() - inicio;
        document.getElementById('heroProgressBar').style.width = Math.min((elapsed / DURACION) * 100, 100) + '%';
        if (elapsed >= DURACION) {
            heroIndex = (heroIndex + 1) % heroItems.length;
            renderHero(heroItems[heroIndex]);
            inicio = Date.now();
            document.getElementById('heroProgressBar').style.width = '0%';
        }
    }, 100);
}

function renderSecciones(secciones) {
    const container = document.getElementById('seccionesContainer');
    container.innerHTML = '';
    Object.entries(secciones).forEach(([seccion, items]) => {
        const section = document.createElement('section');
        section.className = 'content-section';
        section.innerHTML = `<div class="section-header"><h2>${seccion}</h2></div><div class="cards-row"></div>`;
        container.appendChild(section);
        const row = section.querySelector('.cards-row');
        items.forEach(item => row.appendChild(crearCard(item)));
    });
}

function renderEnVivo(streams) {
    const liveSection = document.getElementById('liveSection');
    const liveGrid = document.getElementById('liveGrid');
    liveSection.style.display = 'block';
    liveGrid.innerHTML = '';
    streams.slice(0, 15).forEach(s => liveGrid.appendChild(crearCard(s)));
}

function crearCard(item) {
    const div = document.createElement('div');
    div.className = 'content-card';
    const itemId = getId(item);
    const esFav = favoritosSet.has(itemId);
    const esLive = item.tipo === 'LIVE';

    div.innerHTML = `
        <div class="card-img-wrap">
            <img src="${item.imagen}" alt="${item.titulo}" loading="lazy"
                 onerror="this.src='imagenes/perfil1.jpg'">
            ${esLive ? '<div class="card-live-badge">LIVE</div>' : ''}
        </div>
        <div class="card-info">
            <div class="card-info-title">${item.titulo}</div>
            <div class="card-info-meta">
                <span>${item.plataforma || ''}</span>
                ${item.seccion ? `<span>·</span><span>${item.seccion}</span>` : ''}
            </div>
            <div class="card-info-actions">
                <button class="card-btn card-btn-play"
                    onclick="event.stopPropagation();abrirUrl('${item.url}')">▶ Play</button>
                <button class="card-btn card-btn-fav ${esFav ? 'active' : ''}"
                    onclick="event.stopPropagation();toggleFavCard('${itemId}', this)">
                    ${esFav ? '♥' : '♡'}
                </button>
            </div>
        </div>
    `;
    div.addEventListener('click', (e) => {
        if (!e.target.classList.contains('card-btn')) abrirModal(item);
    });
    return div;
}

function abrirModal(item) {
    contenidoActual = item;
    const itemId = getId(item);
    const esLive = item.tipo === 'LIVE';
    const esFav = favoritosSet.has(itemId);

    document.getElementById('modalImg').src = item.imagen;
    document.getElementById('modalTitle').textContent = item.titulo;
    document.getElementById('modalBadges').innerHTML = `
        <span class="modal-badge ${esLive ? 'purple' : 'blue'}">${esLive ? '🔴 LIVE' : item.tipo || 'Película'}</span>
        <span class="modal-badge">${item.plataforma || ''}</span>
        ${item.seccion ? `<span class="modal-badge">${item.seccion}</span>` : ''}
    `;
    document.getElementById('modalPlayBtn').onclick = () => abrirUrl(item.url);

    const favBtn = document.getElementById('modalFavBtn');
    favBtn.classList.toggle('active', esFav);
    favBtn.innerHTML = `
        <svg width="18" height="18" fill="${esFav ? 'currentColor' : 'none'}"
             stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3
                     c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3
                     19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"
                  stroke-width="2"/>
        </svg>
        ${esFav ? 'En Mi Lista' : 'Mi Lista'}
    `;
    document.getElementById('modalDetail').innerHTML = `
        <p><strong style="color:white">Plataforma:</strong> ${item.plataforma || 'N/A'}</p>
        <p style="margin-top:8px"><strong style="color:white">Tipo:</strong> ${item.tipo || 'Película'}</p>
        ${item.descripcion ? `<p style="margin-top:8px">${item.descripcion}</p>` : ''}
        ${item.seccion ? `<p style="margin-top:8px"><strong style="color:white">Sección:</strong> ${item.seccion}</p>` : ''}
        ${item.año ? `<p style="margin-top:8px"><strong style="color:white">Año:</strong> ${item.año}</p>` : ''}
        ${item.rating ? `<p style="margin-top:8px"><strong style="color:white">Rating:</strong> ⭐ ${item.rating}/10</p>` : ''}
    `;
    document.getElementById('modalOverlay').classList.add('show');
    document.getElementById('contentModal').classList.add('show');
}

function cerrarModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('contentModal').classList.remove('show');
    contenidoActual = null;
}

async function cargarFavoritos() {
    const correo = localStorage.getItem('userEmail');
    if (!correo) return;
    try {
        const res = await fetch(`${API}/v1/favoritos/mis-favoritos?correo=${correo}`);
        const favs = await res.json();
        // favs es array de objetos { contenidoId, titulo, ... }
        favoritosSet = new Set(favs.map(f => String(f.contenidoId)));
    } catch (e) {
        console.error('Error cargando favoritos:', e);
    }
}

async function toggleFavorito() {
    if (!contenidoActual) return;
    const correo = localStorage.getItem('userEmail');
    const itemId = getId(contenidoActual);
    const esFav = favoritosSet.has(itemId);

    try {
        if (esFav) {
            await fetch(`${API}/v1/favoritos/eliminar?correo=${correo}&contenidoId=${itemId}`, {
                method: 'DELETE'
            });
            favoritosSet.delete(itemId);
        } else {
            await fetch(`${API}/v1/favoritos/agregar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contenidoId: itemId })
            });
            favoritosSet.add(itemId);
        }
        abrirModal(contenidoActual); // refresca modal
    } catch (e) {
        console.error('Error toggleFavorito:', e);
    }
}

async function toggleFavCard(itemId, btn) {
    const correo = localStorage.getItem('userEmail');
    const esFav = favoritosSet.has(itemId);
    try {
        if (esFav) {
            await fetch(`${API}/v1/favoritos/eliminar?correo=${correo}&contenidoId=${itemId}`, {
                method: 'DELETE'
            });
            favoritosSet.delete(itemId);
            btn.textContent = '♡';
            btn.classList.remove('active');
        } else {
            await fetch(`${API}/v1/favoritos/agregar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contenidoId: itemId })
            });
            favoritosSet.add(itemId);
            btn.textContent = '♥';
            btn.classList.add('active');
        }
    } catch (e) {
        console.error('Error toggleFavCard:', e);
    }
}

let searchTimer = null;
async function buscarContenido(e) {
    const query = e.target.value.trim();
    clearTimeout(searchTimer);
    if (query.length < 2) {
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        return;
    }
    searchTimer = setTimeout(async () => {
        try {
            const res = await fetch(`${API}/v1/flux/buscar?query=${encodeURIComponent(query)}`);
            const items = await res.json();
            document.getElementById('mainContent').style.display = 'none';
            document.getElementById('searchResults').style.display = 'block';
            const grid = document.getElementById('searchGrid');
            grid.innerHTML = '';
            if (items.length === 0) {
                grid.innerHTML = '<p style="color:#888;padding:20px">Sin resultados.</p>';
            } else {
                items.forEach(item => grid.appendChild(crearCard(item)));
            }
        } catch (e) {
            console.error('Error búsqueda:', e);
        }
    }, 400);
}

function toggleSearch() { document.getElementById('searchInput').focus(); }
function abrirUrl(url) { if (url) window.open(url, '_blank'); }
function toggleProfileMenu() { document.getElementById('profileDropdown').classList.toggle('show'); }
function cerrarSesion() { localStorage.clear(); window.location.href = 'index.html'; }

document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-profile'))
        document.getElementById('profileDropdown')?.classList.remove('show');
});