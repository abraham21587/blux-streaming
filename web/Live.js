const API = 'http://localhost:8080';
let todosLosStreams = [];
let streamsFiltrados = [];
let categoriaActual = 'all';

window.addEventListener('load', () => {
    const correo = localStorage.getItem('userEmail');
    if (!correo) { window.location.href = 'index.html'; return; }

    const nombre = localStorage.getItem('activeProfileName') || 'Usuario';
    const avatar = localStorage.getItem('activeProfileAvatar') || 'imagenes/perfil1.jpg';
    document.getElementById('navName').textContent = nombre;
    document.getElementById('navAvatar').src = avatar;
    document.getElementById('sidebarName').textContent = nombre;

    cargarStreams();
});

async function cargarStreams() {
    document.getElementById('loadingState').style.display = 'flex';
    try {
        const res = await fetch(`${API}/v1/flux/en-vivo`);
        todosLosStreams = await res.json();
        streamsFiltrados = [...todosLosStreams];

        document.getElementById('loadingState').style.display = 'none';

        renderSidebar();
        renderFeatured();
        renderGrid();
        renderStreamers();

    } catch (e) {
        document.getElementById('loadingState').innerHTML = '<p style="color:#ff6b6b">Error cargando streams.</p>';
    }
}

// ── SIDEBAR ──
function renderSidebar() {
    const top = todosLosStreams.slice(0, 5);
    const rest = todosLosStreams.slice(5, 12);

    document.getElementById('sidebarChannels').innerHTML = top.map(s => crearSidebarItem(s)).join('');
    document.getElementById('sidebarRecommended').innerHTML = rest.map(s => crearSidebarItem(s)).join('');
}

function crearSidebarItem(s) {
    const inicial = (s.plataforma || s.titulo || 'S')[0].toUpperCase();
    const viewers = formatViewers(Math.floor(Math.random() * 30000) + 300);
    return `
        <div class="sidebar-channel" onclick="abrirModal(${JSON.stringify(s).replace(/"/g,'&quot;')})">
            <div class="sidebar-ch-thumb-placeholder">${inicial}</div>
            <div class="sidebar-ch-info">
                <div class="sidebar-ch-name">${s.plataforma || 'Canal'}</div>
                <div class="sidebar-ch-game">${s.seccion || 'Streaming'} · ${viewers} espectadores</div>
            </div>
            <div class="sidebar-ch-live"></div>
        </div>
    `;
}

// ── FEATURED ──
function renderFeatured() {
    const grid = document.getElementById('featuredGrid');
    const featured = streamsFiltrados.slice(0, 3);
    grid.innerHTML = '';
    featured.forEach(s => grid.appendChild(crearFeaturedCard(s)));
}

function crearFeaturedCard(s) {
    const div = document.createElement('div');
    div.className = 'featured-card';
    const inicial = (s.plataforma || s.titulo || 'S')[0].toUpperCase();
    const viewers = formatViewers(Math.floor(Math.random() * 50000) + 1000);
    div.innerHTML = `
        <div class="featured-thumb">
            <img src="${s.imagen}" alt="${s.titulo}" onerror="this.src='imagenes/perfil1.jpg'" loading="lazy">
            <div class="featured-live-pill"><span class="live-dot-sm"></span> VIVO</div>
        </div>
        <div class="featured-info">
            <div class="featured-streamer-row">
                <div class="featured-avatar">${inicial}</div>
                <div>
                    <div class="featured-ch-name">${s.plataforma || 'Canal'}</div>
                    <div class="featured-viewers">👁 ${viewers} espectadores</div>
                </div>
            </div>
            <div class="featured-title">${s.titulo}</div>
            <div class="featured-tags">
                ${s.seccion ? `<span class="tag purple">${s.seccion}</span>` : ''}
                <span class="tag">Twitch</span>
                <span class="tag">Español</span>
            </div>
        </div>
    `;
    div.onclick = () => abrirModal(s);
    return div;
}

// ── GRID ──
function renderGrid() {
    const grid = document.getElementById('streamsGrid');
    const resto = streamsFiltrados.slice(3);
    grid.innerHTML = '';
    document.getElementById('streamCount').textContent = `${streamsFiltrados.length} canales`;

    resto.forEach(s => {
        const div = document.createElement('div');
        div.className = 'stream-card';
        const inicial = (s.plataforma || s.titulo || 'S')[0].toUpperCase();
        const viewers = formatViewers(Math.floor(Math.random() * 20000) + 100);
        div.innerHTML = `
            <div class="stream-thumb">
                <img src="${s.imagen}" alt="${s.titulo}" onerror="this.src='imagenes/perfil1.jpg'" loading="lazy">
                <span class="stream-live-pill">LIVE</span>
                <span class="stream-viewers-pill">👁 ${viewers}</span>
            </div>
            <div class="stream-info">
                <div class="stream-avatar">${inicial}</div>
                <div class="stream-details">
                    <div class="stream-title">${s.titulo}</div>
                    <div class="stream-name">${s.plataforma || 'Canal'}</div>
                    <div class="stream-game">${s.seccion || 'Streaming'}</div>
                </div>
            </div>
        `;
        div.onclick = () => abrirModal(s);
        grid.appendChild(div);
    });
}

// ── STREAMERS (fila de burbujas) ──
function renderStreamers() {
    const row = document.getElementById('streamersRow');
    const streamers = todosLosStreams.slice(0, 14);
    row.innerHTML = streamers.map(s => {
        const inicial = (s.plataforma || 'S')[0].toUpperCase();
        const followers = formatViewers(Math.floor(Math.random() * 10000000) + 100000);
        return `
            <div class="streamer-bubble" onclick="abrirModal(${JSON.stringify(s).replace(/"/g,'&quot;')})">
                <div class="streamer-bubble-placeholder">${inicial}</div>
                <div class="streamer-bubble-name">${s.plataforma || 'Canal'}</div>
                <div class="streamer-bubble-followers">${followers} seg.</div>
            </div>
        `;
    }).join('');
}

// ── FILTROS ──
function filtrarPorCategoria(cat, btn) {
    categoriaActual = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    streamsFiltrados = cat === 'all'
        ? [...todosLosStreams]
        : todosLosStreams.filter(s => s.seccion?.toLowerCase().includes(cat.toLowerCase()));
    renderFeatured();
    renderGrid();
}

function filtrarStreams(e) {
    const q = e.target.value.toLowerCase().trim();
    const base = categoriaActual === 'all' ? todosLosStreams : todosLosStreams.filter(s => s.seccion?.toLowerCase().includes(categoriaActual.toLowerCase()));
    streamsFiltrados = q.length < 2 ? [...base] : base.filter(s =>
        s.titulo?.toLowerCase().includes(q) || s.plataforma?.toLowerCase().includes(q) || s.seccion?.toLowerCase().includes(q)
    );
    renderFeatured();
    renderGrid();
}

// ── MODAL ──
function abrirModal(s) {
    const inicial = (s.plataforma || s.titulo || 'S')[0].toUpperCase();
    const viewers = formatViewers(Math.floor(Math.random() * 40000) + 500);
    document.getElementById('modalImg').src = s.imagen;
    document.getElementById('modalImg').onerror = () => { document.getElementById('modalImg').src = 'imagenes/perfil1.jpg'; };
    document.getElementById('modalAvatar').textContent = inicial;
    document.getElementById('modalName').textContent = s.plataforma || 'Canal';
    document.getElementById('modalGame').textContent = s.seccion || 'Streaming';
    document.getElementById('modalTitle').textContent = s.titulo;
    document.getElementById('modalWatchBtn').href = s.url || '#';
    document.getElementById('modalTags').innerHTML = `
        ${s.seccion ? `<span class="tag purple">${s.seccion}</span>` : ''}
        <span class="tag">🔴 En vivo</span>
        <span class="tag">👁 ${viewers} espectadores</span>
        <span class="tag">Español</span>
    `;
    document.getElementById('modalOverlay').classList.add('show');
    document.getElementById('streamModal').classList.add('show');
}

function cerrarModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('streamModal').classList.remove('show');
}

function formatViewers(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

function toggleProfileMenu() { document.getElementById('profileDropdown').classList.toggle('show'); }
function cerrarSesion() { localStorage.clear(); window.location.href = 'index.html'; }
document.addEventListener('click', e => { if (!e.target.closest('.nav-profile')) document.getElementById('profileDropdown')?.classList.remove('show'); });