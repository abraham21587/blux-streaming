const API = 'http://localhost:8080';

// ── AVATARES DISPONIBLES ──
const AVATARES = [
    'imagenes/perfil1.jpg',
    'imagenes/perfil2.jpg',
    'imagenes/perfil3.jpg',
    'imagenes/perfil4.jpg'
];

// ── COLLAGE DE FONDO ──
const COLLAGE_IMGS = [
    'https://image.tmdb.org/t/p/w300/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    'https://image.tmdb.org/t/p/w300/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    'https://image.tmdb.org/t/p/w300/3bhkrj58Vtu7enYsLlegTcKFJua.jpg',
    'https://image.tmdb.org/t/p/w300/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg',
    'https://image.tmdb.org/t/p/w300/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    'https://image.tmdb.org/t/p/w300/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    'https://image.tmdb.org/t/p/w300/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    'https://image.tmdb.org/t/p/w300/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg',
    'https://image.tmdb.org/t/p/w300/6CoRTJTmijhBLJTUNoVSUNxZMEI.jpg',
    'https://image.tmdb.org/t/p/w300/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg',
    'https://image.tmdb.org/t/p/w300/gEjNlhZhyHeto6a68oJxRRdPmFr.jpg',
    'https://image.tmdb.org/t/p/w300/xJWPZIYOEFIjZpBL7SVBpcnpXWb.jpg',
    'https://image.tmdb.org/t/p/w300/nkayOAUBUu4mMvyNf9iHSUiPjF1.jpg',
    'https://image.tmdb.org/t/p/w300/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    'https://image.tmdb.org/t/p/w300/velWPhVMQeQKcxggNEU8YmIo52R.jpg',
    'https://image.tmdb.org/t/p/w300/aQvJ5WPzZgYVDrxLX4R6cLJCmZh.jpg',
    'https://image.tmdb.org/t/p/w300/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    'https://image.tmdb.org/t/p/w300/A3ZbZsmsvNGdprRi2lKgGEeVLEH.jpg',
    'https://image.tmdb.org/t/p/w300/rPdtLWNsZmAJxmh9n9GbT840J5Z.jpg',
    'https://image.tmdb.org/t/p/w300/y0HUz4eNFbFtwcNLp6Y2SKHrDMo.jpg'
];

// ── SPLASH + INIT ──
window.addEventListener('load', () => {
    generarCollage();
    setTimeout(() => {
        document.getElementById('splash').classList.add('hide');
        document.getElementById('loginPage').classList.add('show');
    }, 2500);
});

function generarCollage() {
    const grid = document.getElementById('collageGrid');
    if (!grid) return;
    // 20 celdas para el grid de 5 columnas
    const shuffled = [...COLLAGE_IMGS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 20; i++) {
        const div = document.createElement('div');
        div.className = 'collage-item';
        const img = document.createElement('img');
        img.src = shuffled[i % shuffled.length];
        img.alt = '';
        div.appendChild(img);
        grid.appendChild(div);
    }
}

// ── TOGGLE ENTRE FORMULARIOS ──
function toggle(form) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('recoveryForm').style.display = 'none';

    limpiarMensajes();

    if (form === 'login') document.getElementById('loginForm').style.display = 'block';
    if (form === 'register') document.getElementById('registerForm').style.display = 'block';
    if (form === 'recovery') document.getElementById('recoveryForm').style.display = 'block';
}

function limpiarMensajes() {
    ['lErr','lOk','rErr','rOk','recMsg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = ''; el.className = 'msg'; }
    });
}

function msg(id, texto, tipo) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = texto;
    el.className = 'msg ' + tipo;
}

// ── REGISTRO ──
async function doRegister() {
    const correo = document.getElementById('rEmail').value.trim();
    const contraseña = document.getElementById('rPass').value;
    const telefono = document.getElementById('rPhone').value.trim();

    if (!correo || !contraseña) return msg('rErr', 'Completa los campos obligatorios.', 'err');
    if (contraseña.length < 8) return msg('rErr', 'La contraseña debe tener al menos 8 caracteres.', 'err');

    try {
        const res = await fetch(`${API}/v1/auth/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password: contraseña, telefono })
        });
        const data = await res.json();

        if (res.ok) {
            msg('rOk', '✅ Cuenta creada. Ahora inicia sesión.', 'ok');
            setTimeout(() => toggle('login'), 1800);
        } else {
            msg('rErr', data.error || 'Error al registrar.', 'err');
        }
    } catch (e) {
        msg('rErr', 'Error de conexión.', 'err');
    }
}

// ── LOGIN ──
async function doLogin() {
    const correo = document.getElementById('lEmail').value.trim();
    const contraseña = document.getElementById('lPass').value;
    if (!correo || !contraseña) return msg('lErr', 'Completa todos los campos.', 'err');

    try {
        const res = await fetch(`${API}/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password: contraseña })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('userEmail', correo);
            if (data.rol === 'ADMIN') {
                localStorage.setItem('userRol', 'ADMIN');
                msg('lOk', '¡Bienvenido Admin!', 'ok');
                setTimeout(() => { window.location.href = 'admin.html'; }, 1000);
            } else {
                localStorage.setItem('userRol', 'USER');
                msg('lOk', '¡Acceso concedido!', 'ok');
                setTimeout(() => verificarPerfiles(correo), 1000);
            }
        } else {
            msg('lErr', data.error || 'Credenciales incorrectas.', 'err');
        }
    } catch (e) {
        msg('lErr', 'Error de conexión.', 'err');
    }
}

// ── RECUPERAR CONTRASEÑA ──
async function enviarCodigoRecuperacion() {
    const correo = document.getElementById('recoveryEmail').value.trim();
    if (!correo) return msg('recMsg', 'Ingresa tu correo.', 'err');

    try {
        const res = await fetch(`${API}/v1/auth/recuperar/solicitar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo })
        });
        const data = await res.json();

        if (res.ok) {
            msg('recMsg', '✅ Código enviado. Revisa tu correo.', 'ok');
            setTimeout(() => {
                const form = document.getElementById('recoveryForm');
                // Evitar duplicar campos
                if (!document.getElementById('recCodigo')) {
                    form.innerHTML += `
                        <div class="field" style="margin-top:10px">
                            <input type="text" id="recCodigo" placeholder="Código de 6 dígitos" maxlength="6">
                        </div>
                        <div class="field">
                            <input type="password" id="recNueva" placeholder="Nueva contraseña">
                        </div>
                        <div class="msg" id="recMsg2"></div>
                        <button type="button" class="btn-main" onclick="cambiarContraseña()">Cambiar Contraseña</button>
                    `;
                }
            }, 500);
        } else {
            msg('recMsg', data.error || 'Error al enviar código.', 'err');
        }
    } catch (e) {
        msg('recMsg', 'Error de conexión.', 'err');
    }
}

async function cambiarContraseña() {
    const correo = document.getElementById('recoveryEmail').value.trim();
    const codigo = document.getElementById('recCodigo').value.trim();
    const nuevaContraseña = document.getElementById('recNueva').value;
    if (!codigo || !nuevaContraseña) return msg('recMsg2', 'Completa todos los campos.', 'err');

    try {
        const res = await fetch(`${API}/v1/auth/recuperar/cambiar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, codigo, newPassword: nuevaContraseña })
        });
        const data = await res.json();

        if (res.ok) {
            msg('recMsg2', '✅ Contraseña cambiada. Inicia sesión.', 'ok');
            setTimeout(() => toggle('login'), 2000);
        } else {
            msg('recMsg2', data.error || 'Código incorrecto.', 'err');
        }
    } catch (e) {
        msg('recMsg2', 'Error de conexión.', 'err');
    }
}

// ── PERFILES ──
async function verificarPerfiles(correo) {
    try {
        const res = await fetch(`${API}/v1/perfiles/listar?correo=${correo}`);
        const perfiles = await res.json();

        if (!perfiles || perfiles.length === 0) {
            // Usuario nuevo — mostrar setup
            mostrarSetup();
        } else {
            // Ya tiene perfiles — mostrar selección
            mostrarSeleccion(perfiles);
        }
    } catch (e) {
        console.error('Error verificando perfiles:', e);
        mostrarSetup();
    }
}

function mostrarSetup() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('setupPage').style.display = 'flex';

    const grid = document.getElementById('setupGrid');
    grid.innerHTML = '';

    const nombres = ['Perfil 1', 'Perfil 2', 'Perfil 3', 'Perfil 4'];
    nombres.forEach((nombre, i) => {
        const card = document.createElement('div');
        card.className = 'setup-card';
        card.innerHTML = `
            <img src="${AVATARES[i]}" alt="perfil" style="width:100px;height:100px;border-radius:4px;object-fit:cover;cursor:pointer" onclick="abrirAvatarModal(${i})">
            <input type="text" id="setupNombre${i}" value="${nombre}" placeholder="Nombre del perfil">
            <input type="hidden" id="setupAvatar${i}" value="${AVATARES[i]}">
        `;
        grid.appendChild(card);
    });
}

async function guardarPerfilesNuevos() {
    const correo = localStorage.getItem('userEmail');
    const perfiles = [];

    for (let i = 0; i < 4; i++) {
        const nombre = document.getElementById(`setupNombre${i}`).value.trim() || `Perfil ${i + 1}`;
        const avatarUrl = document.getElementById(`setupAvatar${i}`).value || AVATARES[i];
        perfiles.push({ nombre, avatarUrl, usuarioCorreo: correo });
    }

    try {
        const res = await fetch(`${API}/v1/perfiles/guardar-lote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(perfiles)
        });

        if (res.ok) {
            const nuevos = await res.json();
            mostrarSeleccion(nuevos);
        } else {
            alert('Error al guardar perfiles.');
        }
    } catch (e) {
        alert('Error de conexión.');
    }
}

function mostrarSeleccion(perfiles) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('setupPage').style.display = 'none';
    document.getElementById('selectPage').style.display = 'flex';

    renderPerfiles(perfiles);
}

let modoEdicionPerfiles = false;

function renderPerfiles(perfiles) {
    const grid = document.getElementById('profileGrid');
    grid.innerHTML = '';

    perfiles.forEach(p => {
        const card = document.createElement('div');
        card.className = 'profile-card' + (modoEdicionPerfiles ? ' editing' : '');
        card.innerHTML = `
            <img class="profile-img" src="${p.avatarUrl || AVATARES[0]}" alt="${p.nombre}" onerror="this.src='${AVATARES[0]}'">
            <div class="edit-icon">✏️</div>
            <p class="profile-name">${p.nombre}</p>
        `;

        if (modoEdicionPerfiles) {
            card.onclick = () => editarPerfil(p);
        } else {
            card.onclick = () => seleccionarPerfil(p);
        }

        grid.appendChild(card);
    });
}

function seleccionarPerfil(perfil) {
    localStorage.setItem('activeProfileId', perfil.id);
    localStorage.setItem('activeProfileName', perfil.nombre);
    localStorage.setItem('activeProfileAvatar', perfil.avatarUrl || AVATARES[0]);
    window.location.href = 'home.html';
}

function toggleEditMode() {
    modoEdicionPerfiles = !modoEdicionPerfiles;
    const btn = document.querySelector('.manage-btn');
    if (btn) btn.classList.toggle('active', modoEdicionPerfiles);

    const correo = localStorage.getItem('userEmail');
    fetch(`${API}/v1/perfiles/listar?correo=${correo}`)
        .then(r => r.json())
        .then(perfiles => renderPerfiles(perfiles))
        .catch(() => {});
}

function editarPerfil(perfil) {
    const nuevoNombre = prompt('Nuevo nombre:', perfil.nombre);
    if (nuevoNombre === null) return;
    const nombre = nuevoNombre.trim() || perfil.nombre;

    fetch(`${API}/v1/perfiles/actualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: perfil.id, nombre, avatarUrl: perfil.avatarUrl })
    })
    .then(() => {
        const correo = localStorage.getItem('userEmail');
        return fetch(`${API}/v1/perfiles/listar?correo=${correo}`);
    })
    .then(r => r.json())
    .then(perfiles => renderPerfiles(perfiles))
    .catch(() => alert('Error al editar perfil.'));
}

// ── MODAL DE AVATARES ──
let avatarTargetIndex = null;

function abrirAvatarModal(index) {
    avatarTargetIndex = index;
    const list = document.getElementById('avatarList');
    list.innerHTML = '';
    AVATARES.forEach(av => {
        const img = document.createElement('img');
        img.src = av;
        img.style.cssText = 'width:80px;height:80px;border-radius:4px;object-fit:cover;cursor:pointer;border:2px solid transparent;';
        img.onclick = () => seleccionarAvatar(av);
        list.appendChild(img);
    });
    document.getElementById('avatarModal').style.display = 'flex';
}

function seleccionarAvatar(url) {
    if (avatarTargetIndex !== null) {
        const imgEl = document.querySelectorAll('.setup-card img')[avatarTargetIndex];
        const hiddenEl = document.getElementById(`setupAvatar${avatarTargetIndex}`);
        if (imgEl) imgEl.src = url;
        if (hiddenEl) hiddenEl.value = url;
    }
    closeAvatarModal();
}

function closeAvatarModal() {
    document.getElementById('avatarModal').style.display = 'none';
    avatarTargetIndex = null;
}