const API = 'http://localhost:8080';
let todasLasPeliculas = [];
let peliculasFiltradas = [];
let favoritosSet = new Set(); // guarda strings de _id
let contenidoActual = null;

window.addEventListener('load', () => {
    const correo = localStorage.getItem('userEmail');
    if (!correo) { window.location.href = 'index.html'; return; }

    const nombre = localStorage.getItem('activeProfileName') || 'Usuario';
    const avatar = localStorage.getItem('activeProfileAvatar') || 'imagenes/perfil1.jpg';
    document.getElementById('navName').textContent = nombre;
    document.getElementById('navAvatar').src = avatar;

    cargarFavoritos().then(() => cargarPeliculas());
});

async function cargarPeliculas() {
    document.getElementById('loadingState').classList.add('show');
    try {
        const res = await fetch(`${API}/v1/flux/catalogo`);
        const data = await res.json();

        // /catalogo devuelve { total, page, limit, items } o array directo
        todasLasPeliculas = Array.isArray(data) ? data : (data.items || []);
        peliculasFiltradas = [...todasLasPeliculas];

        document.getElementById('loadingState').classList.remove('show');

        if (todasLasPeliculas.length > 0) renderHero(todasLasPeliculas[0]);

        generarFiltros();
        renderGrid();

    } catch (e) {
        console.error('Error cargando catálogo:', e);
        document.getElementById('loadingState').innerHTML = '<p style="color:#ff6b6b">Error cargando catálogo.</p>';
    }
}

function renderHero(item) {
    document.getElementById('heroBg').style.backgroundImage = `url('${item.imagen}')`;
    document.getElementById('heroTitle').textContent = item.titulo;
    document.getElementById('heroDesc').textContent = item.descripcion || `Disponible en ${item.plataforma || ''}`;
    document.getElementById('heroPlayBtn').onclick = () => abrirUrl(item.url);
    document.getElementById('heroInfoBtn').onclick = () => abrirModal(item);
}

function generarFiltros() {
    const secciones = new Set(todasLasPeliculas.map(p => p.seccion).filter(Boolean));
    const bar = document.getElementById('filtersScroll');
    bar.innerHTML = '<button class="filter-btn active" onclick="filtrarPorSeccion(\'all\', this)">Todas</button>';
    secciones.forEach(sec => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = sec;
        btn.onclick = () => filtrarPorSeccion(sec, btn);
        bar.appendChild(btn);
    });
}

function filtrarPorSeccion(sec, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    peliculasFiltradas = sec === 'all'
        ? [...todasLasPeliculas]
        : todasLasPeliculas.filter(p => p.seccion === sec);
    document.getElementById('moviesTitle').textContent =
        sec === 'all' ? 'Todas las películas' : sec;
    renderGrid();
}

function filtrarPeliculas(e) {
    const q = e.target.value.toLowerCase().trim();
    peliculasFiltradas = q.length < 2
        ? [...todasLasPeliculas]
        : todasLasPeliculas.filter(p =>
            p.titulo?.toLowerCase().includes(q) ||
            p.seccion?.toLowerCase().includes(q)
        );
    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('moviesGrid');
    grid.innerHTML = '';
    document.getElementById('moviesCount').textContent = `${peliculasFiltradas.length} títulos`;
    peliculasFiltradas.forEach(item => grid.appendChild(crearMovieCard(item)));
}

function getId(item) {
    // MongoDB usa _id, compatibilidad con ambos
    return String(item._id || item.id || '');
}

function crearMovieCard(item) {
    const div = document.createElement('div');
    div.className = 'movie-card';
    const itemId = getId(item);
    const esFav = favoritosSet.has(itemId);

    div.innerHTML = `
        <img class="movie-img" src="${item.imagen}" alt="${item.titulo}"
             loading="lazy" onerror="this.src='imagenes/perfil1.jpg'">
        <div class="movie-card-overlay">
            <div class="movie-card-title">${item.titulo}</div>
            <div class="movie-card-meta">${item.plataforma || ''}${item.seccion ? ' · ' + item.seccion : ''}</div>
            <button class="movie-card-play"
                onclick="event.stopPropagation();abrirUrl('${item.url}')">▶ Play</button>
        </div>
        <button class="movie-fav-btn ${esFav ? 'active' : ''}"
            onclick="event.stopPropagation();toggleFavBtn('${itemId}', this)">
            ${esFav ? '♥' : '♡'}
        </button>
    `;
    div.addEventListener('click', () => abrirModal(item));
    return div;
}

function abrirModal(item) {
    contenidoActual = item;
    const itemId = getId(item);
    const esFav = favoritosSet.has(itemId);

    document.getElementById('modalImg').src = item.imagen;
    document.getElementById('modalTitle').textContent = item.titulo;
    document.getElementById('modalBadges').innerHTML = `
        <span class="modal-badge blue">${item.tipo || 'Película'}</span>
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
            await fetch(
                `${API}/v1/favoritos/eliminar?correo=${correo}&contenidoId=${itemId}`,
                { method: 'DELETE' }
            );
            favoritosSet.delete(itemId);
        } else {
            await fetch(`${API}/v1/favoritos/agregar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contenidoId: itemId })
            });
            favoritosSet.add(itemId);
        }
        abrirModal(contenidoActual); // refresca el modal
        renderGrid();                // refresca los corazones
    } catch (e) {
        console.error('Error toggling favorito:', e);
    }
}

async function toggleFavBtn(itemId, btn) {
    const correo = localStorage.getItem('userEmail');
    const esFav = favoritosSet.has(itemId);
    try {
        if (esFav) {
            await fetch(
                `${API}/v1/favoritos/eliminar?correo=${correo}&contenidoId=${itemId}`,
                { method: 'DELETE' }
            );
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
        console.error('Error toggleFavBtn:', e);
    }
}

function abrirUrl(url) { if (url) window.open(url, '_blank'); }
function toggleProfileMenu() { document.getElementById('profileDropdown').classList.toggle('show'); }
function cerrarSesion() { localStorage.clear(); window.location.href = 'index.html'; }
document.addEventListener('click', e => {
    if (!e.target.closest('.nav-profile'))
        document.getElementById('profileDropdown')?.classList.remove('show');
});