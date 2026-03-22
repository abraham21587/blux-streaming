const API = 'http://localhost:8080';
let catalogo = [];
let catalogoFiltrado = [];
let idAEliminar = null;
let modoEdicion = false;

// Helper ID MongoDB
function getId(item) {
    return String(item._id || item.id || '');
}

// ── INIT ──
window.addEventListener('load', () => {
    const correo = localStorage.getItem('userEmail');
    const rol = localStorage.getItem('userRol');

    if (!correo || rol !== 'ADMIN') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('adminEmail').textContent = correo;
    cargarCatalogo();
});

// ── NAVEGACIÓN SIDEBAR ──
function mostrarTab(tabId, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    if (el) el.classList.add('active');
    if (tabId === 'agregar' && !modoEdicion) limpiarFormulario();
}

// ── CARGAR CATÁLOGO ──
async function cargarCatalogo() {
    try {
        const res = await fetch(`${API}/v1/flux/catalogo`);
        const data = await res.json();

        // Soporta array directo o { items: [] }
        catalogo = Array.isArray(data) ? data : (data.items || []);
        catalogoFiltrado = [...catalogo];
        actualizarStats();
        renderTabla();
    } catch (e) {
        console.error("Error cargando catálogo:", e);
    }
}

function actualizarStats() {
    document.getElementById('statTotal').textContent = catalogo.length;
    document.getElementById('statPeliculas').textContent =
        catalogo.filter(c => c.tipo?.toLowerCase().includes('pelicula') || c.tipo?.toLowerCase().includes('película')).length;
    document.getElementById('statSeries').textContent =
        catalogo.filter(c => c.tipo?.toLowerCase().includes('serie')).length;
    const secciones = new Set(catalogo.map(c => c.seccion).filter(Boolean));
    document.getElementById('statSecciones').textContent = secciones.size;
}

function onSeccionChange() {
    const sel = document.getElementById('fSeccionSelect');
    const customInput = document.getElementById('fSeccionCustom');
    const hidden = document.getElementById('fSeccion');

    if (sel.value === '_custom') {
        customInput.style.display = 'block';
        customInput.focus();
        hidden.value = customInput.value;
    } else {
        customInput.style.display = 'none';
        hidden.value = sel.value;
    }
    actualizarPreview();
}

document.addEventListener('DOMContentLoaded', () => {
    const customInput = document.getElementById('fSeccionCustom');
    if (customInput) {
        customInput.addEventListener('input', () => {
            document.getElementById('fSeccion').value = customInput.value;
        });
    }
    document.getElementById('deleteOverlay').addEventListener('click', cerrarDeleteModal);
});

function renderTabla() {
    const tbody = document.getElementById('catalogTable');
    const empty = document.getElementById('emptyState');

    if (catalogoFiltrado.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = catalogoFiltrado.map(item => {
        const itemId = getId(item);
        const titulo = (item.titulo || '').replace(/'/g, "\\'");
        return `
        <tr>
            <td>
                <img class="table-img" src="${item.imagen || ''}" alt="${item.titulo}"
                     onerror="this.style.background='#222';this.src=''">
            </td>
            <td>
                <div class="table-title">
                    ${item.titulo}
                    <p>${item.url || 'Sin URL'}</p>
                </div>
            </td>
            <td><span class="badge badge-gray">${item.plataforma || '-'}</span></td>
            <td><span class="badge badge-blue">${item.tipo || '-'}</span></td>
            <td><span class="badge badge-green">${item.seccion || '-'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editarContenido('${itemId}')">✏️ Editar</button>
                    <button class="btn-del" onclick="confirmarDelete('${itemId}', '${titulo}')">🗑️ Eliminar</button>
                </div>
            </td>
        </tr>
    `}).join('');
}

function filtrarCatalogo(e) {
    const q = e.target.value.toLowerCase().trim();
    catalogoFiltrado = q.length < 1
        ? [...catalogo]
        : catalogo.filter(c =>
            c.titulo?.toLowerCase().includes(q) ||
            c.plataforma?.toLowerCase().includes(q) ||
            c.tipo?.toLowerCase().includes(q) ||
            c.seccion?.toLowerCase().includes(q)
        );
    renderTabla();
}

// ── PREVIEW EN TIEMPO REAL ──
function actualizarPreview() {
    const titulo = document.getElementById('fTitulo').value;
    const plataforma = document.getElementById('fPlataforma').value;
    const tipo = document.getElementById('fTipo').value;
    const previewInfo = document.getElementById('previewInfo');

    if (titulo || plataforma) {
        previewInfo.style.display = 'block';
        document.getElementById('previewTitle').textContent = titulo || 'Sin título';
        document.getElementById('previewMeta').textContent = [plataforma, tipo].filter(Boolean).join(' · ');
    } else {
        previewInfo.style.display = 'none';
    }
}

let imgTimer = null;
function actualizarImagenPreview() {
    actualizarPreview();
    clearTimeout(imgTimer);
    imgTimer = setTimeout(() => {
        const url = document.getElementById('fImagen').value.trim();
        const img = document.getElementById('previewImg');
        const placeholder = document.getElementById('previewPlaceholder');
        if (url) {
            img.src = url;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            img.onerror = () => {
                img.style.display = 'none';
                placeholder.style.display = 'flex';
            };
        } else {
            img.style.display = 'none';
            placeholder.style.display = 'flex';
        }
    }, 600);
}

// ── GUARDAR CONTENIDO ──
async function guardarContenido() {
    const correo = localStorage.getItem('userEmail');
    const editId = document.getElementById('editId').value;
    const titulo = document.getElementById('fTitulo').value.trim();
    const plataforma = document.getElementById('fPlataforma').value;
    const tipo = document.getElementById('fTipo').value;
    const seccion = document.getElementById('fSeccion').value.trim();
    const imagen = document.getElementById('fImagen').value.trim();
    const url = document.getElementById('fUrl').value.trim();

    if (!titulo || !plataforma || !tipo || !imagen) {
        mostrarMensaje('Título, plataforma, tipo e imagen son obligatorios.', 'err');
        return;
    }

    const payload = { titulo, plataforma, tipo, seccion, imagen, url };

    try {
        let res;
        if (modoEdicion && editId) {
            // EDITAR — PUT con el _id real de MongoDB
            res = await fetch(`${API}/v1/flux/admin/editar/${editId}?correoAdmin=${correo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // CREAR NUEVO
            res = await fetch(`${API}/v1/flux/admin/agregar?correoAdmin=${correo}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (res.ok) {
            mostrarMensaje(
                modoEdicion ? '✅ Contenido actualizado.' : '✅ Contenido agregado al catálogo.',
                'ok'
            );
            await cargarCatalogo();
            setTimeout(() => {
                limpiarFormulario();
                mostrarTab('catalogo', document.querySelector('[onclick*=catalogo]'));
            }, 1500);
        } else {
            const data = await res.json();
            mostrarMensaje(data.error || 'Error al guardar.', 'err');
        }
    } catch (e) {
        mostrarMensaje('Error de conexión con el servidor.', 'err');
    }
}

// ── EDITAR ──
function editarContenido(itemId) {
    const item = catalogo.find(c => getId(c) === itemId);
    if (!item) return;

    modoEdicion = true;
    document.getElementById('editId').value = itemId;
    document.getElementById('fTitulo').value = item.titulo || '';
    document.getElementById('fPlataforma').value = item.plataforma || '';
    document.getElementById('fTipo').value = item.tipo || '';
    document.getElementById('fImagen').value = item.imagen || '';
    document.getElementById('fUrl').value = item.url || '';
    document.getElementById('formTitle').textContent = 'Editar Contenido';

    // Setear sección en el select
    const seccion = item.seccion || '';
    const sel = document.getElementById('fSeccionSelect');
    const customInput = document.getElementById('fSeccionCustom');
    const hidden = document.getElementById('fSeccion');
    const optionExists = [...sel.options].some(
        o => o.value === seccion && o.value !== '_custom' && o.value !== ''
    );

    if (optionExists) {
        sel.value = seccion;
        customInput.style.display = 'none';
    } else if (seccion) {
        sel.value = '_custom';
        customInput.style.display = 'block';
        customInput.value = seccion;
    } else {
        sel.value = '';
        customInput.style.display = 'none';
    }
    hidden.value = seccion;

    actualizarPreview();
    actualizarImagenPreview();
    mostrarTab('agregar', document.querySelector('[onclick*=agregar]'));
}

// ── ELIMINAR ──
function confirmarDelete(itemId, titulo) {
    idAEliminar = itemId;
    document.getElementById('deleteTitle').textContent = `"${titulo}"`;
    document.getElementById('deleteOverlay').classList.add('show');
    document.getElementById('deleteModal').classList.add('show');
}

function cerrarDeleteModal() {
    idAEliminar = null;
    document.getElementById('deleteOverlay').classList.remove('show');
    document.getElementById('deleteModal').classList.remove('show');
}

async function confirmarEliminar() {
    if (!idAEliminar) return;
    const correo = localStorage.getItem('userEmail');
    try {
        const res = await fetch(
            `${API}/v1/flux/admin/eliminar/${idAEliminar}?correoAdmin=${correo}`,
            { method: 'DELETE' }
        );
        cerrarDeleteModal();
        if (res.ok) {
            await cargarCatalogo();
        } else {
            const data = await res.json();
            alert(data.error || 'Error al eliminar.');
        }
    } catch (e) {
        alert('Error de conexión.');
        cerrarDeleteModal();
    }
}

// ── UTILIDADES ──
function limpiarFormulario() {
    modoEdicion = false;
    document.getElementById('editId').value = '';
    document.getElementById('fTitulo').value = '';
    document.getElementById('fPlataforma').value = '';
    document.getElementById('fTipo').value = '';
    document.getElementById('fSeccionSelect').value = '';
    document.getElementById('fSeccionCustom').value = '';
    document.getElementById('fSeccionCustom').style.display = 'none';
    document.getElementById('fSeccion').value = '';
    document.getElementById('fImagen').value = '';
    document.getElementById('fUrl').value = '';
    document.getElementById('formTitle').textContent = 'Agregar Contenido';
    document.getElementById('previewImg').style.display = 'none';
    document.getElementById('previewImg').src = '';
    document.getElementById('previewPlaceholder').style.display = 'flex';
    document.getElementById('previewInfo').style.display = 'none';
    ocultarMensaje();
}

function mostrarMensaje(texto, tipo) {
    const el = document.getElementById('formMsg');
    el.textContent = texto;
    el.className = 'form-msg ' + tipo;
}

function ocultarMensaje() {
    document.getElementById('formMsg').className = 'form-msg';
    document.getElementById('formMsg').textContent = '';
}

function cerrarSesion() {
    localStorage.clear();
    window.location.href = 'index.html';
}