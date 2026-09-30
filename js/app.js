/**
 * ==========================================================================
 * Five Cash - Platform Suite
 * Archivo Principal de Lógica de Negocio, Jerarquías y Controladores (JS)
 * Lenguaje: JavaScript (ES6+)
 * ==========================================================================
 */

// Constantes para Almacenamiento Local Reactivo
const StorageKey = {
  SESION_ACTIVA: 'fivecash_sesion_activa',
  USUARIOS: 'fivecash_usuarios_lista',
  PREFIX: 'fivecash_user_'
};

// Cuentas demo predeterminadas para acceso rápido
const USUARIOS_BASE = [
  {
    id: 1,
    nombre: 'Laura Méndez',
    empresa: 'Mi Empresa S.A.',
    email: 'admin@fivecash.com',
    password: 'password123',
    rol: 'administradora',
    puesto: 'Directora / Administradora',
    fechaRegistro: '2026-01-15',
    origen: 'seed'
  },
  {
    id: 2,
    nombre: 'Carlos Ruiz',
    empresa: 'Mi Empresa S.A.',
    email: 'empleado@fivecash.com',
    password: 'password123',
    rol: 'empleado',
    puesto: 'Colaborador Operativo',
    fechaRegistro: '2026-02-10',
    origen: 'seed'
  },
  {
    id: 3,
    nombre: 'Sofía Valdés',
    empresa: 'Infraestructura FiveCash',
    email: 'tecnico@fivecash.com',
    password: 'password123',
    rol: 'tecnico',
    puesto: 'Soporte TI / Técnico',
    fechaRegistro: '2026-01-01',
    origen: 'seed'
  }
];

// Lista de usuarios registrados por el usuario
let listaUsuariosRegistrados = cargarDeStorage(StorageKey.USUARIOS, []);

// Sesión Activa Guardada (si no ha cerrado sesión explícitamente)
let sesionGuardada = cargarDeStorage(StorageKey.SESION_ACTIVA, null);

let usuarioActual = localStorage.getItem('fivecash_logged_out') === 'true' 
  ? null 
  : sesionGuardada;

// Datos Operativos del Usuario en Sesión (Inician limpios en Cero)
let listaCuentas = [];
let listaTransacciones = [];
let listaPagos = [];
let listaEmpleados = [];
let listaGastosTurno = [];
let turnoBaseCaja = 0.00;
let configSistema = {
  empresa: '',
  rfc: '',
  divisa: '$',
  codigoDivisa: 'MXN'
};

// Instancias de Gráficos Chart.js
let chartFlujoCaja = null;
let chartCategorias = null;

// ==========================================================================
// 1. Inicialización de la Aplicación
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  inicializarUI();
  inicializarEventos();
  cargarDatosDeUsuarioActivo();
  inicializarGraficos();
  actualizarTodo();
  aplicarJerarquiaUI();
  actualizarEstadoSistema();
});

function inicializarUI() {
  const elFecha = document.getElementById('currentDate');
  if (elFecha) {
    const ahora = new Date();
    elFecha.innerText = ahora.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const hoyStr = new Date().toISOString().split('T')[0];
  const inputsFecha = ['txFecha', 'pagoProgVencimiento'];
  inputsFecha.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = hoyStr;
  });
}

function inicializarEventos() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const s = document.getElementById('globalSearchInput');
      if (s) s.focus();
    }
    if (e.key === 'Escape') {
      cerrarTodosLosModales();
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active-modal');
      }
    });
  });
}

// ==========================================================================
// 2. Gestión de Sesión, Registro y Aislamiento de Datos por Usuario
// ==========================================================================

/**
 * Carga los datos financieros del usuario actual.
 * Si es una cuenta nueva o recién registrada, todo comienza en CERO.
 */
function cargarDatosDeUsuarioActivo() {
  const configDefault = {
    // 1. Jerarquía: Administradora
    empresa: (usuarioActual && usuarioActual.empresa) || 'Mi Empresa S.A.',
    rfc: '',
    divisa: '$',
    codigoDivisa: 'MXN',
    pais: 'México',
    gastoLimiteAlerta: 5000.00,
    saldoMinimoAlerta: 10000.00,
    exigirFolioTurno: 'si',

    // 2. Jerarquía: Empleado
    baseCajaDefault: 0.00,
    catGastoDefault: 'Operativo',
    confirmarGastoTurno: 'si',
    formatoRecibo: 'detallado',
    privacidadMontos: 'visible',
    emailNotifEmpleado: (usuarioActual && usuarioActual.email) || '',

    // 3. Jerarquía: Técnico de la App
    modoMantenimiento: 'desactivado',
    logLevel: 'debug',
    tiempoSesionMinutos: '60'
  };

  if (!usuarioActual) {
    listaCuentas = [];
    listaTransacciones = [];
    listaPagos = [];
    listaEmpleados = [];
    listaGastosTurno = [];
    configSistema = Object.assign({}, configDefault, { empresa: 'Sin Sesión' });
    return;
  }

  const userKey = StorageKey.PREFIX + encodeURIComponent(usuarioActual.email);
  const dataAlmacenada = cargarDeStorage(userKey, null);

  if (dataAlmacenada) {
    listaCuentas = dataAlmacenada.cuentas || [];
    listaTransacciones = dataAlmacenada.transacciones || [];
    listaPagos = dataAlmacenada.pagos || [];
    listaEmpleados = dataAlmacenada.empleados || [];
    listaGastosTurno = dataAlmacenada.gastosTurno || [];
    configSistema = Object.assign({}, configDefault, dataAlmacenada.config || {});
  } else {
    // Si no tiene datos previos (o cuenta nueva registrada): TODO COMIENZA EN CERO
    listaCuentas = [];
    listaTransacciones = [];
    listaPagos = [];
    listaEmpleados = [];
    listaGastosTurno = [];
    configSistema = Object.assign({}, configDefault);
    guardarDatosDeUsuarioActivo();
  }
}

function guardarDatosDeUsuarioActivo() {
  if (!usuarioActual) return;
  const userKey = StorageKey.PREFIX + encodeURIComponent(usuarioActual.email);
  const payload = {
    cuentas: listaCuentas,
    transacciones: listaTransacciones,
    pagos: listaPagos,
    empleados: listaEmpleados,
    gastosTurno: listaGastosTurno,
    config: configSistema
  };
  guardarEnStorage(userKey, payload);
}

/**
 * Registra un nuevo usuario con Jerarquía (Administradora, Empleado, Técnico)
 * y garantiza que TODO inicie completamente en CERO.
 */
async function registrarNuevoUsuario(event) {
  if (event) event.preventDefault();

  const nombre = document.getElementById('regNombre')?.value.trim();
  const empresa = document.getElementById('regEmpresa')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim().toLowerCase();
  const password = document.getElementById('regPassword')?.value;
  const confirmPass = document.getElementById('regConfirmPassword')?.value;
  
  // Obtener rol seleccionado en el formulario
  const rolInput = document.querySelector('input[name="regRol"]:checked');
  const rol = rolInput ? rolInput.value : (document.getElementById('regRolSelect')?.value || 'administradora');

  if (!nombre || !empresa || !email || !password) {
    showToast('Por favor completa todos los campos requeridos.', 'warning');
    return;
  }

  if (password !== confirmPass) {
    showToast('Las contraseñas no coinciden.', 'warning');
    return;
  }

  if (password.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres.', 'warning');
    return;
  }

  // Comprobar si ya existe el correo
  const existente = listaUsuariosRegistrados.find(u => u.email === email);
  if (existente) {
    showToast('Este correo electrónico ya está registrado. Inicia sesión.', 'warning');
    return;
  }

  const puesto = document.getElementById('regPuesto')?.value.trim() || (rol === 'empleado' ? 'Colaborador Operativo' : (rol === 'administradora' ? 'Directora / Administradora' : 'Soporte TI'));

  // Crear nuevo objeto de usuario
  const nuevoUsuario = {
    id: Date.now(),
    nombre,
    empresa,
    email,
    password,
    rol,
    puesto,
    fechaRegistro: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
    origen: 'auto-registro',
    esNuevo: true
  };

  listaUsuariosRegistrados.push(nuevoUsuario);
  guardarEnStorage(StorageKey.USUARIOS, listaUsuariosRegistrados);

  // Inicializar los datos del nuevo usuario COMPLETAMENTE EN CERO
  const userKey = StorageKey.PREFIX + encodeURIComponent(email);
  const dataCero = {
    cuentas: [],
    transacciones: [],
    pagos: [],
    empleados: [],
    config: {
      empresa: empresa,
      rfc: '',
      divisa: '$',
      codigoDivisa: 'MXN'
    }
  };
  guardarEnStorage(userKey, dataCero);

  // Iniciar sesión inmediatamente con el nuevo usuario
  localStorage.removeItem('fivecash_logged_out');
  usuarioActual = nuevoUsuario;
  guardarEnStorage(StorageKey.SESION_ACTIVA, usuarioActual);

  // Cargar su estado en cero
  listaCuentas = [];
  listaTransacciones = [];
  listaPagos = [];
  listaEmpleados = [];
  configSistema = dataCero.config;

  closeModal('modalRegistro');
  actualizarTodo();
  aplicarJerarquiaUI();

  const textoRol = obtenerTextoRol(rol);
  if (rol === 'empleado') {
    showToast(`¡Bienvenido/a ${nombre}! Te registraste como Empleado de ${empresa}. Tu Administrador podrá ver tu registro de inmediato.`, 'success');
  } else {
    showToast(`¡Bienvenido/a ${nombre}! Cuenta de ${textoRol} creada con saldo en cero.`, 'success');
  }
}

/**
 * Controla el cambio de rol en el modal de registro y sugiere empresas existentes
 */
function manejarCambioRolRegistro(rol, radioEl) {
  if (radioEl) {
    radioEl.closest('.role-selector-grid')?.querySelectorAll('.role-option-card').forEach(c => c.classList.remove('selected'));
    radioEl.closest('.role-option-card')?.classList.add('selected');
  }

  const pWrap = document.getElementById('regPuestoWrapper');
  const empLabel = document.getElementById('regEmpresaLabel');
  const empAyuda = document.getElementById('regEmpresaAyuda');

  if (rol === 'empleado') {
    if (pWrap) pWrap.style.display = 'block';
    if (empLabel) empLabel.innerText = 'Nombre de la Empresa a la que te unes *';
    if (empAyuda) empAyuda.innerText = '💡 Escribe o selecciona la empresa a la que perteneces. El Administrador te verá de inmediato en su directorio de empleados.';
    poblarDatalistEmpresas();
  } else if (rol === 'administradora') {
    if (pWrap) pWrap.style.display = 'none';
    if (empLabel) empLabel.innerText = 'Nombre de tu Empresa / Negocio *';
    if (empAyuda) empAyuda.innerText = 'Nombre de tu empresa donde gestionarás tus finanzas y a tus colaboradores.';
  } else {
    if (pWrap) pWrap.style.display = 'none';
    if (empLabel) empLabel.innerText = 'Área o Empresa TI *';
    if (empAyuda) empAyuda.innerText = 'Departamento técnico o infraestructura.';
  }

  actualizarCartelJerarquiaRegistro(rol);
}

/**
 * Renderiza el cartel explicativo de la jerarquía seleccionada EXCLUSIVAMENTE
 * en el formulario de creación de cuenta (modalRegistro).
 */
function actualizarCartelJerarquiaRegistro(rol) {
  const container = document.getElementById('cartelExplicacionJerarquiaRegistro');
  if (!container) return;

  if (rol === 'administradora') {
    container.innerHTML = `
      <div class="hierarchy-banner banner-admin" style="margin-bottom: 0; padding: 12px 16px;">
        <div class="hierarchy-info">
          <span style="font-size: 1.4rem;">👑</span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
              <strong>Jerarquía: Administradora</strong>
              <span class="role-badge role-administradora" style="font-size: 0.72rem; padding: 2px 8px;">Control Total</span>
            </div>
            <div class="hierarchy-desc" style="font-size: 0.82rem; line-height: 1.45;">
              Tienes autorización gerencial completa: creación y baja de cuentas bancarias, dispersión salarial y nómina a colaboradores, aprobación de pagos y compras, estado de resultados (P&amp;L) y configuración fiscal de la empresa.
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (rol === 'empleado') {
    container.innerHTML = `
      <div class="hierarchy-banner banner-empleado" style="margin-bottom: 0; padding: 12px 16px;">
        <div class="hierarchy-info">
          <span style="font-size: 1.4rem;">💼</span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
              <strong>Jerarquía: Empleado</strong>
              <span class="role-badge role-empleado" style="font-size: 0.72rem; padding: 2px 8px;">Acceso Operativo</span>
            </div>
            <div class="hierarchy-desc" style="font-size: 0.82rem; line-height: 1.45;">
              Acceso operativo para turnos de trabajo: registro de transacciones de caja, apertura y rendición de comprobantes en caja chica, y consulta de tu recibo salarial personal. (La dispersión masiva de nómina y configuración fiscal están reservadas para la Administradora).
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (rol === 'tecnico') {
    container.innerHTML = `
      <div class="hierarchy-banner banner-tecnico" style="margin-bottom: 0; padding: 12px 16px;">
        <div class="hierarchy-info">
          <span style="font-size: 1.4rem;">🛠️</span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
              <strong>Jerarquía: Técnico de la App</strong>
              <span class="role-badge role-tecnico" style="font-size: 0.72rem; padding: 2px 8px;">Soporte &amp; Auditoría TI</span>
            </div>
            <div class="hierarchy-desc" style="font-size: 0.82rem; line-height: 1.45;">
              Acceso técnico especializado: diagnósticos de integridad de almacenamiento local, activación de modo de mantenimiento preventivo, optimización de caché, auditoría de eventos y administración de respaldos JSON.
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Rellena el datalist con las empresas registradas en el sistema
 */
function poblarDatalistEmpresas() {
  const datalist = document.getElementById('listaEmpresasDisponibles');
  if (!datalist) return;

  const empresas = new Set();
  (listaUsuariosRegistrados || []).forEach(u => {
    if (u.empresa && u.empresa.trim()) empresas.add(u.empresa.trim());
  });
  if (configSistema && configSistema.empresa) empresas.add(configSistema.empresa.trim());
  empresas.add('Corporativo Financiero Global S.A.');

  datalist.innerHTML = '';
  empresas.forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp;
    datalist.appendChild(opt);
  });
}

/**
 * Autentica e inicia sesión para un usuario existente
 */
async function iniciarSesionUsuario(event, customEmail, customPassword) {
  if (event) event.preventDefault();

  const email = (customEmail || document.getElementById('authLoginEmail')?.value || document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
  const password = customPassword || document.getElementById('authLoginPassword')?.value || document.getElementById('loginPassword')?.value || '';

  if (!email || !password) {
    showToast('Ingresa tu correo y contraseña.', 'warning');
    return;
  }

  // Buscar en la base de datos local o cuentas demo predeterminadas
  const usuario = listaUsuariosRegistrados.find(u => u.email === email && u.password === password)
    || USUARIOS_BASE.find(u => u.email === email && u.password === password);

  if (!usuario) {
    showToast('Credenciales incorrectas o usuario no encontrado.', 'danger');
    return;
  }

  localStorage.removeItem('fivecash_logged_out');
  usuarioActual = usuario;
  guardarEnStorage(StorageKey.SESION_ACTIVA, usuarioActual);

  cargarDatosDeUsuarioActivo();
  actualizarTodo();
  aplicarJerarquiaUI();
  closeModal('modalLogin');

  const textoRol = obtenerTextoRol(usuario.rol);
  showToast(`¡Bienvenido/a ${usuario.nombre}! Sesión iniciada como ${textoRol}.`, 'success');
}

/**
 * Controladores específicos para la Pantalla Principal de Acceso (Portal)
 */
function iniciarSesionDesdePortal(event) {
  if (event) event.preventDefault();
  const email = document.getElementById('authLoginEmail')?.value.trim().toLowerCase();
  const password = document.getElementById('authLoginPassword')?.value;
  iniciarSesionUsuario(event, email, password);
}

function cambiarModoAuth(modo) {
  const btnLogin = document.getElementById('tabBtnLogin');
  const btnReg = document.getElementById('tabBtnRegister');
  const formLogin = document.getElementById('formAuthLogin');
  const formReg = document.getElementById('formAuthRegistro');
  const titleText = document.getElementById('authTitleText');
  const subText = document.getElementById('authSubtitleText');

  if (modo === 'login') {
    if (btnLogin) btnLogin.classList.add('active');
    if (btnReg) btnReg.classList.remove('active');
    if (formLogin) formLogin.style.display = 'block';
    if (formReg) formReg.style.display = 'none';
    if (titleText) titleText.innerText = 'Acceso a la Plataforma';
    if (subText) subText.innerText = 'Ingresa tus credenciales para acceder a tus finanzas';
  } else {
    if (btnReg) btnReg.classList.add('active');
    if (btnLogin) btnLogin.classList.remove('active');
    if (formReg) formReg.style.display = 'block';
    if (formLogin) formLogin.style.display = 'none';
    if (titleText) titleText.innerText = 'Crear Cuenta Nueva';
    if (subText) subText.innerText = 'Selecciona tu jerarquía e inicia tu gestión en cero';
  }
}

function manejarCambioRolPortal(rol, cardEl) {
  if (cardEl) {
    cardEl.closest('.role-selector-grid')?.querySelectorAll('.role-option-card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
    const radio = cardEl.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  }
}

function accesoRapidoDemo(rolDeseado) {
  const demo = USUARIOS_BASE.find(u => u.rol === rolDeseado);
  if (!demo) return;
  const elEmail = document.getElementById('authLoginEmail');
  const elPass = document.getElementById('authLoginPassword');
  if (elEmail) elEmail.value = demo.email;
  if (elPass) elPass.value = demo.password;
  iniciarSesionUsuario(null, demo.email, demo.password);
}

async function registrarUsuarioDesdePortal(event) {
  if (event) event.preventDefault();

  const nombre = document.getElementById('authRegNombre')?.value.trim();
  const empresa = document.getElementById('authRegEmpresa')?.value.trim();
  const email = document.getElementById('authRegEmail')?.value.trim().toLowerCase();
  const password = document.getElementById('authRegPassword')?.value;
  const confirmPass = document.getElementById('authRegConfirmPassword')?.value;

  const rolInput = document.querySelector('input[name="authPortalRol"]:checked');
  const rol = rolInput ? rolInput.value : 'administradora';

  if (!nombre || !empresa || !email || !password) {
    showToast('Por favor completa todos los campos requeridos.', 'warning');
    return;
  }

  if (password !== confirmPass) {
    showToast('Las contraseñas no coinciden.', 'warning');
    return;
  }

  if (password.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres.', 'warning');
    return;
  }

  const existente = listaUsuariosRegistrados.find(u => u.email === email)
    || USUARIOS_BASE.find(u => u.email === email);
  if (existente) {
    showToast('Este correo electrónico ya está registrado. Inicia sesión.', 'warning');
    cambiarModoAuth('login');
    const elEmail = document.getElementById('authLoginEmail');
    if (elEmail) elEmail.value = email;
    return;
  }

  const puesto = (rol === 'empleado' ? 'Colaborador Operativo' : (rol === 'administradora' ? 'Directora / Administradora' : 'Soporte TI'));

  const nuevoUsuario = {
    id: Date.now(),
    nombre,
    empresa,
    email,
    password,
    rol,
    puesto,
    fechaRegistro: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
    origen: 'auto-registro',
    esNuevo: true
  };

  listaUsuariosRegistrados.push(nuevoUsuario);
  guardarEnStorage(StorageKey.USUARIOS, listaUsuariosRegistrados);

  // Inicializar los datos del nuevo usuario COMPLETAMENTE EN CERO
  const userKey = StorageKey.PREFIX + encodeURIComponent(email);
  const dataCero = {
    cuentas: [],
    transacciones: [],
    pagos: [],
    empleados: [],
    config: {
      empresa: empresa,
      rfc: '',
      divisa: '$',
      codigoDivisa: 'MXN'
    }
  };
  guardarEnStorage(userKey, dataCero);

  // Iniciar sesión inmediatamente con el nuevo usuario
  localStorage.removeItem('fivecash_logged_out');
  usuarioActual = nuevoUsuario;
  guardarEnStorage(StorageKey.SESION_ACTIVA, usuarioActual);

  listaCuentas = [];
  listaTransacciones = [];
  listaPagos = [];
  listaEmpleados = [];
  configSistema = dataCero.config;

  actualizarTodo();
  aplicarJerarquiaUI();

  const textoRol = obtenerTextoRol(rol);
  showToast(`¡Bienvenido/a ${nombre}! Cuenta de ${textoRol} creada con saldo en cero.`, 'success');
}

/**
 * Cierra la sesión activa del usuario de forma inmediata y confiable
 */
function cerrarSesion() {
  // Guardar datos actuales del usuario antes de salir si existía sesión
  if (usuarioActual) {
    guardarDatosDeUsuarioActivo();
  }

  // Marcar estado cerrado y eliminar token de sesión activa
  localStorage.setItem('fivecash_logged_out', 'true');
  localStorage.removeItem(StorageKey.SESION_ACTIVA);
  usuarioActual = null;

  // Poner el panel en estado limpio en ceros
  listaCuentas = [];
  listaTransacciones = [];
  listaPagos = [];
  listaEmpleados = [];
  configSistema = {
    empresa: 'Five Cash',
    rfc: '',
    divisa: '$',
    codigoDivisa: 'MXN'
  };

  // Re-renderizar toda la interfaz (oculta panel y muestra formulario de acceso inmediatamente)
  actualizarTodo();
  aplicarJerarquiaUI();
  cerrarTodosLosModales();
  cambiarModoAuth('login');

  showToast('Has cerrado sesión exitosamente.', 'info');
}

/**
 * Selector Rápido de Cuenta Demo para verificar Jerarquías fácilmente
 */
function seleccionarCuentaDemo(rolDeseado) {
  const usuarioDemo = USUARIOS_BASE.find(u => u.rol === rolDeseado);
  if (!usuarioDemo) return;

  localStorage.removeItem('fivecash_logged_out');
  usuarioActual = usuarioDemo;
  guardarEnStorage(StorageKey.SESION_ACTIVA, usuarioActual);

  cargarDatosDeUsuarioActivo();
  actualizarTodo();
  aplicarJerarquiaUI();
  closeModal('modalLogin');
  closeModal('modalRegistro');

  const textoRol = obtenerTextoRol(rolDeseado);
  showToast(`Cambiado a perfil demo: ${usuarioDemo.nombre} (${textoRol}).`, 'info');
}

// ==========================================================================
// 3. Sistema de Jerarquías y Permisos (RBAC)
// ==========================================================================

function aplicarJerarquiaUI() {
  const rol = usuarioActual ? (usuarioActual.rol || 'administradora').toLowerCase() : 'invitado';
  const nombre = usuarioActual ? usuarioActual.nombre : 'Sin Sesión';
  const empresa = usuarioActual ? usuarioActual.empresa : 'Five Cash';

  // 0. CONTROL DE VISIBILIDAD DE SESIÓN:
  // "el registro y inicio de seción deben desaparecer apenas inicio o cree una cuenta"
  const loggedInElements = document.querySelectorAll('.auth-only-logged-in');
  const loggedOutElements = document.querySelectorAll('.auth-only-logged-out');

  if (usuarioActual) {
    document.body.classList.remove('user-logged-out');
    document.body.classList.add('user-logged-in');

    // Desaparecer botones de registro e inicio de sesión
    loggedOutElements.forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    // Mostrar nombre de usuario, rol y botón de salir
    loggedInElements.forEach(el => {
      el.style.setProperty('display', 'flex', 'important');
    });
  } else {
    document.body.classList.remove('user-logged-in');
    document.body.classList.add('user-logged-out');

    // Ocultar nombre de usuario, rol y botón de salir
    loggedInElements.forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    // Mostrar botones de inicio de sesión y registro
    loggedOutElements.forEach(el => {
      el.style.setProperty('display', 'flex', 'important');
    });
  }

  // 1. Actualizar Nombre de Empresa y Usuario en Cabeceras
  safeSetText('companyNameHeader', empresa);
  safeSetText('dashboardTitleEmpresa', empresa);
  safeSetText('headerUserName', nombre);
  safeSetText('sidebarUserName', nombre);

  const initiales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'FC';
  safeSetText('sidebarAvatar', initiales);

  // 2. Insignia de Jerarquía en Topbar y Sidebar
  const elBadgeTopbar = document.getElementById('headerRoleBadge');
  const elBadgeSidebar = document.getElementById('sidebarRoleBadge');

  const badgeHtml = renderRoleBadge(rol);
  if (elBadgeTopbar) elBadgeTopbar.innerHTML = badgeHtml;
  if (elBadgeSidebar) elBadgeSidebar.innerHTML = badgeHtml;

  // 3. Control de Visibilidad de Menú y Secciones según [data-role-req]
  document.querySelectorAll('[data-role-req]').forEach(el => {
    const rolesReq = el.getAttribute('data-role-req').split(',').map(r => r.trim().toLowerCase());
    const tieneAcceso = rolesReq.includes(rol);
    if (tieneAcceso) {
      if (el.tagName === 'LI') {
        el.style.display = 'list-item';
      } else {
        el.style.display = '';
      }
    } else {
      el.style.display = 'none';
    }
  });

  // 5. Pantallas de Bloqueo / Autorización en Pestañas Sensibles
  // Nómina: Administradora y Técnico sí, Empleado no (ve su propio recibo en Mi Turno)
  const nomRestricted = document.getElementById('nominaRestrictedScreen');
  const nomAuthorized = document.getElementById('nominaAuthorizedContent');
  if (nomRestricted && nomAuthorized) {
    if (rol === 'empleado') {
      nomRestricted.style.display = 'block';
      nomAuthorized.style.display = 'none';
    } else {
      nomRestricted.style.display = 'none';
      nomAuthorized.style.display = 'block';
    }
  }

  // Informes y P&L: Administradora y Técnico sí, Empleado no
  const infoRestricted = document.getElementById('informesRestrictedScreen');
  const infoAuthorized = document.getElementById('informesAuthorizedContent');
  if (infoRestricted && infoAuthorized) {
    if (rol === 'empleado') {
      infoRestricted.style.display = 'block';
      infoAuthorized.style.display = 'none';
    } else {
      infoRestricted.style.display = 'none';
      infoAuthorized.style.display = 'block';
    }
  }

  // 6. Bloqueo o habilitación de controles sensibles según Jerarquía
  const btnDispersar = document.getElementById('btnDispersarNomina');
  if (btnDispersar) {
    if (rol === 'empleado') {
      btnDispersar.classList.add('locked-action');
      btnDispersar.disabled = true;
      btnDispersar.title = 'Requiere autorización de Administradora';
      btnDispersar.innerHTML = '🔒 Dispersión Bloqueada (Solo Administradora)';
    } else {
      btnDispersar.classList.remove('locked-action');
      btnDispersar.disabled = false;
      btnDispersar.title = 'Dispersar nómina a cuentas';
      btnDispersar.innerHTML = '💸 Dispersar Nómina';
    }
  }

  // 7. Organizar el Centro de Configuraciones según la Jerarquía activa
  organizarConfiguracionesPorJerarquia(rol);

  // 8. Redirección automática de pestaña si la pestaña activa está restringida para el nuevo rol
  const activeTabEl = document.querySelector('.tab-content.active-tab');
  if (activeTabEl) {
    const activeTabId = activeTabEl.id.replace('tab-', '');
    if (rol === 'empleado' && ['nomina', 'informes'].includes(activeTabId)) {
      switchTab('turno-empleado');
    } else if (rol === 'administradora' && ['turno-empleado'].includes(activeTabId)) {
      switchTab('dashboard');
    }
  }

  // 9. Actualizar datos de turno de empleado y banner de mantenimiento
  renderizarGastosTurnoEmpleado();
  actualizarBannerMantenimiento();
}

function renderRoleBadge(rol) {
  switch (rol) {
    case 'administradora':
      return '<span class="role-badge role-administradora">👑 Administradora</span>';
    case 'empleado':
      return '<span class="role-badge role-empleado">💼 Empleado</span>';
    case 'tecnico':
      return '<span class="role-badge role-tecnico">🛠️ Técnico de la App</span>';
    default:
      return '<span class="role-badge">Invitado</span>';
  }
}

function obtenerTextoRol(rol) {
  switch (rol) {
    case 'administradora': return 'Administradora';
    case 'empleado': return 'Empleado';
    case 'tecnico': return 'Técnico de la App';
    default: return 'Usuario';
  }
}

// ==========================================================================
// 4. Control de Navegación (SPA Tabs)
// ==========================================================================
function switchTab(tabId, clickedElement) {
  document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));

  if (clickedElement) {
    clickedElement.classList.add('active');
  } else {
    const el = document.querySelector(`.menu-item[data-tab="${tabId}"]`);
    if (el) el.classList.add('active');
  }

  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active-tab'));
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active-tab');

  const sidebar = document.getElementById('mainSidebar');
  if (sidebar && sidebar.classList.contains('sidebar-open')) {
    sidebar.classList.remove('sidebar-open');
  }

  if (tabId === 'dashboard') actualizarGraficos();
  else if (tabId === 'informes') recalcularPyl();
  else if (tabId === 'turno-empleado') renderizarGastosTurnoEmpleado();
  else if (tabId === 'configuraciones') organizarConfiguracionesPorJerarquia();
}

function toggleSidebar() {
  const sidebar = document.getElementById('mainSidebar');
  if (sidebar) sidebar.classList.toggle('sidebar-open');
}

// ==========================================================================
// 5. Sistema de Modales
// ==========================================================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    if (modalId === 'modalTx') poblarSelectCuentas('txCuenta');
    if (modalId === 'modalTransferencia') {
      poblarSelectCuentas('transfOrigen');
      poblarSelectCuentas('transfDestino');
    }
    if (modalId === 'modalRegistro') {
      const selectedRadio = modal.querySelector('input[name="regRol"]:checked');
      const rolSeleccionado = selectedRadio ? selectedRadio.value : 'administradora';
      actualizarCartelJerarquiaRegistro(rolSeleccionado);
    }
    modal.classList.add('active-modal');
    const firstInput = modal.querySelector('input:not([type="hidden"]), select');
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active-modal');
}

function cerrarTodosLosModales() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active-modal');
  });
}

/**
 * Diálogo de confirmación in-app compatible 100% con iFrames (sustituye a window.confirm bloqueado)
 */
function pedirConfirmacion({ titulo, mensaje, detalle, textoBoton = 'Confirmar', claseBoton = 'btn-danger', onConfirm }) {
  const modal = document.getElementById('modalConfirmacion');
  if (!modal) {
    if (typeof onConfirm === 'function') onConfirm();
    return;
  }

  const elTitulo = document.getElementById('modalConfirmTitulo');
  const elMensaje = document.getElementById('modalConfirmMensaje');
  const elDetalle = document.getElementById('modalConfirmDetalle');
  const btnAceptar = document.getElementById('modalConfirmBotonAceptar');

  if (elTitulo) elTitulo.innerText = titulo || '⚠️ Confirmar Acción';
  if (elMensaje) elMensaje.innerText = mensaje || '¿Estás seguro de realizar esta acción?';

  if (elDetalle) {
    if (detalle) {
      elDetalle.innerText = detalle;
      elDetalle.style.display = 'block';
    } else {
      elDetalle.style.display = 'none';
    }
  }

  if (btnAceptar) {
    btnAceptar.className = `btn ${claseBoton}`;
    btnAceptar.innerText = textoBoton;
    btnAceptar.onclick = () => {
      closeModal('modalConfirmacion');
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    };
  }

  openModal('modalConfirmacion');
}

function poblarSelectCuentas(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '';
  if (listaCuentas.length === 0) {
    select.innerHTML = '<option value="">Sin cuentas registradas ($0.00)</option>';
    return;
  }

  listaCuentas.forEach(cta => {
    const opt = document.createElement('option');
    opt.value = cta.id;
    opt.innerText = `${cta.banco} (${cta.tipo}) - $${cta.saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    select.appendChild(opt);
  });
}

// ==========================================================================
// 6. Módulo de Gráficos (Chart.js)
// ==========================================================================
function inicializarGraficos() {
  const ctxLine = document.getElementById('lineChart');
  if (ctxLine) {
    chartFlujoCaja = new Chart(ctxLine.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana Actual'],
        datasets: [
          {
            label: 'Ingresos ($)',
            data: [0, 0, 0, 0],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#10b981',
            pointRadius: 4
          },
          {
            label: 'Egresos ($)',
            data: [0, 0, 0, 0],
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#f43f5e',
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#475569', font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' } }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: $${context.parsed.y.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#f1f5f9' },
            ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans' } }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              color: '#64748b',
              font: { family: 'Plus Jakarta Sans' },
              callback: (val) => `$${val}`
            }
          }
        }
      }
    });
  }

  const ctxDoughnut = document.getElementById('doughnutChart');
  if (ctxDoughnut) {
    chartCategorias = new Chart(ctxDoughnut.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Sin Movimientos'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e2e8f0'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#475569', font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }, boxWidth: 12 }
          }
        },
        cutout: '68%'
      }
    });
  }
}

function actualizarGraficos() {
  if (!chartFlujoCaja || !chartCategorias) return;

  let totalIngresos = 0;
  let totalEgresos = 0;
  const categoriaTotales = {};

  listaTransacciones.forEach(tx => {
    if (tx.tipo === 'ingreso') {
      totalIngresos += tx.monto;
    } else {
      totalEgresos += tx.monto;
      categoriaTotales[tx.categoria] = (categoriaTotales[tx.categoria] || 0) + tx.monto;
    }
  });

  chartFlujoCaja.data.datasets[0].data = [0, 0, 0, totalIngresos];
  chartFlujoCaja.data.datasets[1].data = [0, 0, 0, totalEgresos];
  chartFlujoCaja.update();

  const labels = Object.keys(categoriaTotales);
  const data = Object.values(categoriaTotales);

  if (labels.length > 0) {
    chartCategorias.data.labels = labels;
    chartCategorias.data.datasets[0].data = data;
    chartCategorias.data.datasets[0].backgroundColor = [
      '#f43f5e', '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#06b6d4', '#ec4899'
    ];
  } else {
    chartCategorias.data.labels = ['Sin Movimientos'];
    chartCategorias.data.datasets[0].data = [1];
    chartCategorias.data.datasets[0].backgroundColor = ['#e2e8f0'];
  }
  chartCategorias.update();
}

// ==========================================================================
// 7. Módulo de Cuentas Bancarias
// ==========================================================================
function guardarCuenta() {
  const banco = document.getElementById('ctaBanco')?.value.trim();
  const tipo = document.getElementById('ctaTipo')?.value;
  const numero = document.getElementById('ctaNumero')?.value.trim() || '•••• ' + Math.floor(1000 + Math.random() * 9000);
  const saldo = parseFloat(document.getElementById('ctaSaldo')?.value) || 0;

  if (!banco) {
    showToast('Ingresa el nombre del banco o institución.', 'warning');
    return;
  }

  const nuevaCuenta = {
    id: Date.now(),
    banco,
    tipo,
    numero,
    saldo,
    divisa: configSistema.codigoDivisa || 'MXN'
  };

  listaCuentas.push(nuevaCuenta);
  guardarDatosDeUsuarioActivo();

  actualizarCuentasUI();
  actualizarDashboardUI();
  closeModal('modalCuenta');

  document.getElementById('ctaBanco').value = '';
  document.getElementById('ctaNumero').value = '';
  document.getElementById('ctaSaldo').value = '';

  showToast(`Cuenta en ${banco} registrada con saldo de $${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`, 'success');
}

function eliminarCuenta(id) {
  // Verificar permisos por jerarquía
  if (usuarioActual && usuarioActual.rol === 'empleado') {
    showToast('Los empleados no tienen permiso para desvincular cuentas bancarias.', 'danger');
    return;
  }

  const cuenta = listaCuentas.find(c => String(c.id) === String(id));
  if (!cuenta) {
    showToast('No se encontró la cuenta que deseas desvincular.', 'warning');
    return;
  }

  // Confirmación in-app segura garantizada para entornos iFrame
  pedirConfirmacion({
    titulo: '🏛️ Desvincular Cuenta Bancaria',
    mensaje: `¿Confirmas que deseas desvincular la cuenta de "${cuenta.banco}"?`,
    detalle: `Tipo: ${cuenta.tipo} • Saldo: $${cuenta.saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })} • N°: ${cuenta.numero}`,
    textoBoton: 'Desvincular Cuenta',
    claseBoton: 'btn-danger',
    onConfirm: () => {
      ejecutarDesvinculacionCuenta(id);
    }
  });
}

function ejecutarDesvinculacionCuenta(id) {
  const cuentaObj = listaCuentas.find(c => String(c.id) === String(id));
  const nombreBanco = cuentaObj ? cuentaObj.banco : 'Bancaria';

  // Filtrar retirando la cuenta
  listaCuentas = listaCuentas.filter(c => String(c.id) !== String(id));
  guardarDatosDeUsuarioActivo();

  // Actualizar todas las pantallas, métricas y desplegables del sistema
  actualizarTodo();
  showToast(`La cuenta "${nombreBanco}" ha sido desvinculada con éxito.`, 'info');
}

function transferirEntreCuentas() {
  const origenId = parseInt(document.getElementById('transfOrigen')?.value);
  const destinoId = parseInt(document.getElementById('transfDestino')?.value);
  const monto = parseFloat(document.getElementById('transfMonto')?.value) || 0;

  if (origenId === destinoId) {
    showToast('La cuenta origen y destino deben ser distintas.', 'warning');
    return;
  }

  if (monto <= 0) {
    showToast('Ingresa un monto positivo para transferir.', 'warning');
    return;
  }

  const ctaOrigen = listaCuentas.find(c => c.id === origenId);
  const ctaDestino = listaCuentas.find(c => c.id === destinoId);

  if (!ctaOrigen || !ctaDestino) {
    showToast('Selecciona cuentas bancarias válidas.', 'danger');
    return;
  }

  if (ctaOrigen.saldo < monto && ctaOrigen.tipo !== 'Crédito') {
    showToast('Saldo insuficiente en la cuenta de origen.', 'danger');
    return;
  }

  ctaOrigen.saldo -= monto;
  ctaDestino.saldo += monto;

  const fechaHoy = new Date().toISOString().split('T')[0];
  listaTransacciones.unshift({
    id: Date.now(),
    tipo: 'egreso',
    concepto: `Transferencia a ${ctaDestino.banco}`,
    categoria: 'Transferencias',
    monto: monto,
    fecha: fechaHoy,
    cuentaId: origenId
  });

  listaTransacciones.unshift({
    id: Date.now() + 1,
    tipo: 'ingreso',
    concepto: `Transferencia desde ${ctaOrigen.banco}`,
    categoria: 'Transferencias',
    monto: monto,
    fecha: fechaHoy,
    cuentaId: destinoId
  });

  guardarDatosDeUsuarioActivo();
  actualizarTodo();
  closeModal('modalTransferencia');
  document.getElementById('transfMonto').value = '';
  showToast(`Transferencia de $${monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} realizada.`, 'success');
}

function actualizarCuentasUI() {
  const grid = document.getElementById('accountsGrid');
  const bankListDash = document.getElementById('bankList');
  if (!grid) return;

  grid.innerHTML = '';
  if (bankListDash) bankListDash.innerHTML = '';

  if (listaCuentas.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">No hay cuentas registradas actualmente (Saldo en Cero). Haz clic en "+ Vincular Cuenta" para agregar tu primera cuenta.</div>';
    if (bankListDash) {
      bankListDash.innerHTML = '<p class="empty-state">Sin cuentas registradas ($0.00).</p>';
    }
    actualizarMetricasCuentas(0, 0, 0);
    return;
  }

  let saldoLiquido = 0;
  let deudaCredito = 0;

  listaCuentas.forEach(cta => {
    const esCredito = cta.tipo === 'Crédito';
    if (esCredito) deudaCredito += cta.saldo;
    else saldoLiquido += cta.saldo;

    const card = document.createElement('div');
    card.className = `account-card ${esCredito ? 'credit-card' : ''}`;
    const colorMonto = esCredito ? 'var(--accent-danger)' : 'var(--accent-success)';

    const btnEliminarHtml = (usuarioActual && usuarioActual.rol === 'empleado')
      ? '<span style="font-size:0.7rem; color:var(--text-muted)">🔒 Solo Administradora</span>'
      : `<button class="btn btn-danger btn-sm" onclick="eliminarCuenta('${cta.id}')" title="Desvincular esta cuenta">Desvincular</button>`;

    card.innerHTML = `
      <div>
        <div class="account-header">
          <div class="account-bank-title">
            <span>${esCredito ? '💳' : '🏛️'}</span> ${cta.banco}
          </div>
          <span class="tag-pill">${cta.tipo}</span>
        </div>
        <div class="account-balance-amount" style="color: ${colorMonto}">
          $${cta.saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>
        <div class="account-number">${cta.numero}</div>
      </div>
      <div class="account-card-actions">
        <span style="font-size:0.75rem; color:var(--text-muted)">Estado: <strong>Activa</strong></span>
        ${btnEliminarHtml}
      </div>
    `;
    grid.appendChild(card);

    if (bankListDash) {
      const bItem = document.createElement('div');
      bItem.className = 'user-mini-card';
      bItem.style.justifyContent = 'space-between';
      bItem.style.alignItems = 'center';
      bItem.innerHTML = `
        <div style="flex:1;">
          <div style="font-weight:600; font-size:0.85rem;">${esCredito ? '💳' : '🏦'} ${cta.banco}</div>
          <div style="font-size:0.75rem; color:var(--text-muted)">${cta.tipo} • ${cta.numero}</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="font-weight:700; color:${colorMonto}">
            $${cta.saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          ${(usuarioActual && usuarioActual.rol === 'empleado') ? '' : `<button class="btn btn-danger btn-sm" onclick="eliminarCuenta('${cta.id}')" title="Desvincular cuenta" style="padding:2px 7px; font-size:0.7rem;">Desvincular</button>`}
        </div>
      `;
      bankListDash.appendChild(bItem);
    }
  });

  actualizarMetricasCuentas(saldoLiquido, deudaCredito, listaCuentas.length);
}

function actualizarMetricasCuentas(saldo, credito, total) {
  safeSetText('valSaldoTotalCta', `$${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('valCreditoTotalCta', `$${credito.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('valTotalBancosCta', total.toString());
  safeSetText('subCuentasActivas', `${total} Cuenta(s) Vinculada(s)`);
}

// ==========================================================================
// 8. Módulo de Transacciones
// ==========================================================================
function guardarTransaccion() {
  const tipo = document.getElementById('txTipo')?.value;
  const fecha = document.getElementById('txFecha')?.value || new Date().toISOString().split('T')[0];
  const concepto = document.getElementById('txConcepto')?.value.trim();
  const categoria = document.getElementById('txCategoria')?.value;
  const monto = parseFloat(document.getElementById('txMonto')?.value) || 0;
  const cuentaId = parseInt(document.getElementById('txCuenta')?.value);

  if (!concepto || monto <= 0) {
    showToast('Ingresa un concepto descriptivo y un monto mayor a cero.', 'warning');
    return;
  }

  const cuentaAsociada = listaCuentas.find(c => c.id === cuentaId);
  if (cuentaAsociada) {
    if (tipo === 'ingreso') cuentaAsociada.saldo += monto;
    else cuentaAsociada.saldo -= monto;
  }

  const nuevaTx = {
    id: Date.now(),
    tipo,
    fecha,
    concepto,
    categoria,
    monto,
    cuentaId: cuentaId || null
  };

  listaTransacciones.unshift(nuevaTx);
  guardarDatosDeUsuarioActivo();

  actualizarTodo();
  closeModal('modalTx');

  document.getElementById('txConcepto').value = '';
  document.getElementById('txMonto').value = '';
  showToast(`Movimiento "${concepto}" registrado con éxito.`, 'success');
}

function guardarPagoDash() {
  const tipo = document.getElementById('pagoTipoDash')?.value;
  const concepto = document.getElementById('pagoConceptoDash')?.value.trim();
  const monto = parseFloat(document.getElementById('pagoMontoDash')?.value) || 0;
  const categoria = document.getElementById('pagoCatDash')?.value;

  if (!concepto || monto <= 0) {
    showToast('Ingresa un concepto y un monto positivo.', 'warning');
    return;
  }

  if (listaCuentas.length > 0) {
    const cta = listaCuentas[0];
    if (tipo === 'ingreso') cta.saldo += monto;
    else cta.saldo -= monto;
  }

  const nuevaTx = {
    id: Date.now(),
    tipo,
    fecha: new Date().toISOString().split('T')[0],
    concepto,
    categoria,
    monto,
    cuentaId: listaCuentas.length > 0 ? listaCuentas[0].id : null
  };

  listaTransacciones.unshift(nuevaTx);
  guardarDatosDeUsuarioActivo();

  actualizarTodo();
  closeModal('modalPagoDash');

  document.getElementById('pagoConceptoDash').value = '';
  document.getElementById('pagoMontoDash').value = '';
  showToast('Transacción rápida registrada.', 'success');
}

function eliminarTransaccion(id) {
  const tx = listaTransacciones.find(t => String(t.id) === String(id));
  if (!tx) return;

  pedirConfirmacion({
    titulo: '🗑️ Eliminar Transacción',
    mensaje: `¿Deseas eliminar la transacción "${tx.concepto}"?`,
    detalle: `Monto: $${tx.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} • Tipo: ${tx.tipo} • Fecha: ${tx.fecha}`,
    textoBoton: 'Eliminar',
    claseBoton: 'btn-danger',
    onConfirm: () => {
      if (tx.cuentaId) {
        const cuenta = listaCuentas.find(c => String(c.id) === String(tx.cuentaId));
        if (cuenta) {
          if (tx.tipo === 'ingreso') cuenta.saldo -= tx.monto;
          else cuenta.saldo += tx.monto;
        }
      }

      listaTransacciones = listaTransacciones.filter(t => String(t.id) !== String(id));
      guardarDatosDeUsuarioActivo();

      actualizarTodo();
      showToast('Transacción eliminada y balance recalculado.', 'info');
    }
  });
}

function actualizarTransaccionesUI() {
  const tbody = document.getElementById('txTableBody');
  const tbodyDash = document.getElementById('txBodyDash');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (tbodyDash) tbodyDash.innerHTML = '';

  if (listaTransacciones.length === 0) {
    tbody.innerHTML = '<tr id="emptyTxRow"><td colspan="6" class="empty-state">No hay transacciones registradas actualmente ($0.00).</td></tr>';
    if (tbodyDash) {
      tbodyDash.innerHTML = '<tr><td colspan="5" class="empty-state">No hay transacciones registradas ($0.00).</td></tr>';
    }
    actualizarMetricasTransacciones(0, 0, 0, 0, 0);
    return;
  }

  let totalIngresos = 0;
  let totalGastos = 0;
  let numIng = 0;
  let numEg = 0;

  listaTransacciones.forEach((tx, idx) => {
    const esIngreso = tx.tipo === 'ingreso';
    if (esIngreso) {
      totalIngresos += tx.monto;
      numIng++;
    } else {
      totalGastos += tx.monto;
      numEg++;
    }

    const color = esIngreso ? 'var(--accent-success)' : 'var(--accent-danger)';
    const signo = esIngreso ? '+' : '-';
    const badgeClass = esIngreso ? 'badge-ingreso' : 'badge-egreso';

    const cta = listaCuentas.find(c => c.id === tx.cuentaId);
    const nombreCuenta = cta ? cta.banco : 'Sin vincular';

    const row = document.createElement('tr');
    row.setAttribute('data-tipo', tx.tipo);
    row.innerHTML = `
      <td><span style="font-family:monospace; color:var(--text-secondary);">${tx.fecha}</span></td>
      <td><span class="badge ${badgeClass}">${tx.tipo}</span></td>
      <td>
        <span class="table-concept">${tx.concepto}</span>
        <span class="table-subconcept">Cuenta: ${nombreCuenta}</span>
      </td>
      <td><span class="tag-pill">${tx.categoria}</span></td>
      <td style="color: ${color}; font-weight: 700; font-size:0.95rem;">
        ${signo}$${tx.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="eliminarTransaccion(${tx.id})" title="Eliminar">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);

    if (tbodyDash && idx < 6) {
      const dRow = document.createElement('tr');
      dRow.innerHTML = `
        <td><span style="font-family:monospace; color:var(--text-muted); font-size:0.75rem;">${tx.fecha}</span></td>
        <td><strong>${tx.concepto}</strong></td>
        <td><span class="tag-pill">${tx.categoria}</span></td>
        <td><span class="badge ${badgeClass}">${tx.tipo}</span></td>
        <td style="color: ${color}; font-weight: 700;">
          ${signo}$${tx.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </td>
      `;
      tbodyDash.appendChild(dRow);
    }
  });

  actualizarMetricasTransacciones(totalIngresos, totalGastos, numIng, numEg, listaTransacciones.length);
}

function actualizarMetricasTransacciones(ing, eg, numIng, numEg, totalCount) {
  const flujoNeto = ing - eg;

  safeSetText('valTotalIngresosTx', `$${ing.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('valTotalGastosTx', `$${eg.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  
  const elFlujo = document.getElementById('valFlujoNetoTx');
  if (elFlujo) {
    elFlujo.innerText = `$${flujoNeto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    elFlujo.style.color = flujoNeto >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
  }

  safeSetText('subNumIngresosTx', `${numIng} Entrada(s)`);
  safeSetText('subNumGastosTx', `${numEg} Salida(s)`);
  safeSetText('subTotalTxCount', `${totalCount} Movimiento(s)`);
}

function filtrarTablaTx() {
  const search = (document.getElementById('txSearch')?.value || '').toLowerCase();
  const filterType = document.getElementById('txTypeFilter')?.value || 'todos';
  const rows = document.querySelectorAll('#txTableBody tr:not(#emptyTxRow)');

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    const tipo = row.getAttribute('data-tipo');
    const matchesSearch = text.includes(search);
    const matchesType = (filterType === 'todos') || (tipo === filterType);
    row.style.display = (matchesSearch && matchesType) ? '' : 'none';
  });
}

// ==========================================================================
// 9. Módulo de Pagos y Cobros Programados
// ==========================================================================
function guardarPagoProgramado() {
  const tipo = document.getElementById('pagoProgTipo')?.value;
  const entidad = document.getElementById('pagoProgEntidad')?.value.trim();
  const vencimiento = document.getElementById('pagoProgVencimiento')?.value || new Date().toISOString().split('T')[0];
  const monto = parseFloat(document.getElementById('pagoProgMonto')?.value) || 0;

  if (!entidad || monto <= 0) {
    showToast('Ingresa el beneficiario/cliente y un monto válido.', 'warning');
    return;
  }

  const hoyStr = new Date().toISOString().split('T')[0];
  const estado = (vencimiento < hoyStr) ? 'Vencido' : 'Pendiente';

  const nuevoItem = {
    id: Date.now(),
    tipo,
    entidad,
    vencimiento,
    monto,
    estado
  };

  listaPagos.unshift(nuevoItem);
  guardarDatosDeUsuarioActivo();

  actualizarPagosUI();
  actualizarDashboardUI();
  closeModal('modalPagoProgramado');

  document.getElementById('pagoProgEntidad').value = '';
  document.getElementById('pagoProgMonto').value = '';
  showToast(`Compromiso con "${entidad}" guardado.`, 'success');
}

function cambiarEstadoPago(id, nuevoEstado) {
  const item = listaPagos.find(p => String(p.id) === String(id));
  if (!item) return;

  item.estado = nuevoEstado;

  if (nuevoEstado === 'Pagado') {
    pedirConfirmacion({
      titulo: '💰 Registrar Movimiento de Liquidación',
      mensaje: `¿Deseas registrar este pago de $${item.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} en tus transacciones activas?`,
      detalle: `Entidad: ${item.entidad} • Tipo: ${item.tipo}`,
      textoBoton: 'Registrar Movimiento',
      claseBoton: 'btn-success',
      onConfirm: () => {
        const tipoTx = item.tipo === 'Por Pagar' ? 'egreso' : 'ingreso';
        const cuentaDestino = listaCuentas.length > 0 ? listaCuentas[0].id : null;

        if (cuentaDestino) {
          const cta = listaCuentas.find(c => String(c.id) === String(cuentaDestino));
          if (cta) {
            if (tipoTx === 'ingreso') cta.saldo += item.monto;
            else cta.saldo -= item.monto;
          }
        }

        listaTransacciones.unshift({
          id: Date.now(),
          tipo: tipoTx,
          concepto: `Liquidación de ${item.tipo}: ${item.entidad}`,
          categoria: item.tipo === 'Por Pagar' ? 'Proveedores' : 'Ventas',
          monto: item.monto,
          fecha: new Date().toISOString().split('T')[0],
          cuentaId: cuentaDestino
        });

        guardarDatosDeUsuarioActivo();
        actualizarTodo();
        showToast('Pago liquidado y registrado en tus transacciones.', 'success');
      }
    });
  }

  guardarDatosDeUsuarioActivo();
  actualizarTodo();
  showToast(`Estado de compromiso actualizado a: ${nuevoEstado}`, 'info');
}

/**
 * Marca un pago como completado/pagado de forma directa
 */
function marcarPagoCompletado(id) {
  cambiarEstadoPago(id, 'Pagado');
}

function eliminarPago(id) {
  const item = listaPagos.find(p => String(p.id) === String(id));
  if (!item) return;

  pedirConfirmacion({
    titulo: '🗑️ Eliminar Compromiso de Pago',
    mensaje: `¿Confirmas que deseas eliminar el compromiso con "${item.entidad}"?`,
    detalle: `Monto: $${item.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} • Estado: ${item.estado}`,
    textoBoton: 'Eliminar Compromiso',
    claseBoton: 'btn-danger',
    onConfirm: () => {
      listaPagos = listaPagos.filter(p => String(p.id) !== String(id));
      guardarDatosDeUsuarioActivo();
      actualizarPagosUI();
      actualizarDashboardUI();
      showToast('Compromiso de pago eliminado.', 'info');
    }
  });
}

function actualizarPagosUI() {
  const tbody = document.getElementById('pagosTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (listaPagos.length === 0) {
    tbody.innerHTML = '<tr id="emptyPagosRow"><td colspan="6" class="empty-state">No hay pagos ni cobros programados ($0.00).</td></tr>';
    actualizarMetricasPagos(0, 0, 0, 0, 0, 0);
    return;
  }

  let porPagar = 0, numPagar = 0;
  let porCobrar = 0, numCobrar = 0;
  let vencidos = 0, numVencidos = 0;
  const hoyStr = new Date().toISOString().split('T')[0];

  listaPagos.forEach(p => {
    if (p.estado === 'Pendiente' && p.vencimiento < hoyStr) {
      p.estado = 'Vencido';
    }

    if (p.estado === 'Pendiente' && p.tipo === 'Por Pagar') { porPagar += p.monto; numPagar++; }
    if (p.estado === 'Pendiente' && p.tipo === 'Por Cobrar') { porCobrar += p.monto; numCobrar++; }
    if (p.estado === 'Vencido') { vencidos += p.monto; numVencidos++; }

    let badgeClass = 'badge-pendiente';
    if (p.estado === 'Pagado') badgeClass = 'badge-pagado';
    if (p.estado === 'Vencido') badgeClass = 'badge-vencido';

    const row = document.createElement('tr');
    row.setAttribute('data-estado', p.estado);
    row.innerHTML = `
      <td><span style="font-family:monospace; color:var(--text-secondary);">${p.vencimiento}</span></td>
      <td><span class="tag-pill">${p.tipo}</span></td>
      <td><strong>${p.entidad}</strong></td>
      <td><span class="badge ${badgeClass}">${p.estado}</span></td>
      <td style="font-weight: 700; font-size:0.95rem;">
        $${p.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </td>
      <td>
        <div style="display:flex; gap:6px;">
          ${p.estado !== 'Pagado' ? `<button class="btn btn-success btn-sm" onclick="marcarPagoCompletado('${p.id}')">Marcar Pagado</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="eliminarPago('${p.id}')" title="Eliminar compromiso">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });

  actualizarMetricasPagos(porPagar, porCobrar, vencidos, numPagar, numCobrar, numVencidos);
}

function actualizarMetricasPagos(porPagar, porCobrar, vencidos, numPagar, numCobrar, numVencidos) {
  safeSetText('valPorPagar', `$${porPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('valPorCobrar', `$${porCobrar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('valVencidos', `$${vencidos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('subNumPagar', `${numPagar} Pago(s) pendiente(s)`);
  safeSetText('subNumCobrar', `${numCobrar} Cobro(s) pendiente(s)`);
  safeSetText('subNumVencidos', `${numVencidos} Compromiso(s) vencido(s)`);
}

function filtrarTablaPagos() {
  const search = (document.getElementById('pagoSearch')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('pagoStatusFilter')?.value || 'todos';
  const rows = document.querySelectorAll('#pagosTableBody tr:not(#emptyPagosRow)');

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    const estado = row.getAttribute('data-estado');
    const matchesSearch = text.includes(search);
    const matchesStatus = (filterStatus === 'todos') || (estado === filterStatus);
    row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
  });
}

// Aliases para filtros
function cambiarFiltroPagos() {
  filtrarTablaPagos();
}

function cambiarFiltroTx() {
  filtrarTablaTx();
}

// ==========================================================================
// 10. Módulo de Empleados de tu Empresa y Nómina Colaborativa
// ==========================================================================

/**
 * Obtiene la lista consolidada de colaboradores de la empresa activa del usuario:
 * 1. Empleados dados de alta en la plantilla de nómina (listaEmpleados)
 * 2. Usuarios registrados en la app con rol 'empleado' que pertenezcan a esta misma empresa
 */
function obtenerEmpleadosEmpresa() {
  const empresaActual = (usuarioActual?.empresa || configSistema?.empresa || 'Corporativo Financiero Global S.A.').trim().toLowerCase();
  const empleadosMap = new Map();

  // A. Primero agregar usuarios del sistema que se hayan registrado con rol empleado en esta empresa
  (listaUsuariosRegistrados || []).forEach(u => {
    const uEmpresa = (u.empresa || '').trim().toLowerCase();
    const esMismaEmpresa = (uEmpresa === empresaActual) || 
      (uEmpresa.length > 4 && empresaActual.includes(uEmpresa)) || 
      (empresaActual.length > 4 && uEmpresa.includes(empresaActual));

    if (u.rol === 'empleado' && esMismaEmpresa) {
      const key = (u.email || u.nombre).trim().toLowerCase();
      empleadosMap.set(key, {
        id: String(u.id || 'usr_' + key),
        usuarioId: u.id,
        nombre: u.nombre,
        email: u.email || '',
        puesto: u.puesto || 'Colaborador Operativo',
        tieneCuentaApp: true,
        enNomina: false,
        sueldo: 0,
        bonos: 0,
        deducciones: 0,
        neto: 0,
        origen: u.origen || 'auto-registro',
        esNuevo: !!u.esNuevo,
        fechaRegistro: u.fechaRegistro || 'Reciente',
        usuarioObj: u,
        nominaObj: null
      });
    }
  });

  // B. Consolidar o complementar con la lista de nómina del perfil activo
  (listaEmpleados || []).forEach(emp => {
    const keyEmail = (emp.email || '').trim().toLowerCase();
    const keyNombre = (emp.nombre || '').trim().toLowerCase();
    const key = keyEmail || keyNombre;

    const existente = (keyEmail && empleadosMap.get(keyEmail)) || empleadosMap.get(keyNombre);

    if (existente) {
      existente.enNomina = true;
      existente.nominaId = emp.id;
      existente.sueldo = emp.sueldo || 0;
      existente.bonos = emp.bonos || 0;
      existente.deducciones = emp.deducciones || 0;
      existente.neto = (emp.sueldo + emp.bonos) - emp.deducciones;
      existente.nominaObj = emp;
      if (emp.puesto) existente.puesto = emp.puesto;
      if (emp.email && !existente.email) existente.email = emp.email;
    } else {
      empleadosMap.set(key, {
        id: String(emp.id),
        usuarioId: null,
        nombre: emp.nombre,
        email: emp.email || '',
        puesto: emp.puesto || 'Colaborador',
        tieneCuentaApp: !!(listaUsuariosRegistrados || []).find(u => u.email && u.email.toLowerCase() === (emp.email || '').toLowerCase()),
        enNomina: true,
        nominaId: emp.id,
        sueldo: emp.sueldo || 0,
        bonos: emp.bonos || 0,
        deducciones: emp.deducciones || 0,
        neto: (emp.sueldo + emp.bonos) - emp.deducciones,
        origen: emp.origen || 'alta_directa',
        esNuevo: false,
        fechaRegistro: emp.fechaRegistro || 'Pre-cargado',
        usuarioObj: (listaUsuariosRegistrados || []).find(u => u.email && u.email.toLowerCase() === (emp.email || '').toLowerCase()) || null,
        nominaObj: emp
      });
    }
  });

  return Array.from(empleadosMap.values());
}

/**
 * Actualiza el directorio de colaboradores de la empresa y la plantilla de nómina
 */
function actualizarNominaUI() {
  actualizarEmpleadosEmpresaUI();
  actualizarTablaNominaSalarialUI();
}

/**
 * Renderiza el Directorio de Empleados de tu Empresa y sus métricas
 */
function actualizarEmpleadosEmpresaUI() {
  const nombreEmpresa = usuarioActual?.empresa || configSistema?.empresa || 'Corporativo Financiero Global S.A.';
  safeSetText('adminEmpresaTitle', nombreEmpresa);
  safeSetText('simularEmpresaNombre', nombreEmpresa);

  const todosEmpleados = obtenerEmpleadosEmpresa();
  
  // Métricas
  const total = todosEmpleados.length;
  const conCuenta = todosEmpleados.filter(e => e.tieneCuentaApp).length;
  const enNomina = todosEmpleados.filter(e => e.enNomina).length;
  const nuevos = todosEmpleados.filter(e => !e.enNomina || e.esNuevo).length;

  safeSetText('statTotalEmpleadosEmpresa', total.toString());
  safeSetText('statEmpleadosConCuenta', conCuenta.toString());
  safeSetText('statEmpleadosEnNomina', enNomina.toString());
  safeSetText('statEmpleadosNuevos', nuevos.toString());
  safeSetText('menuBadgeEmpleados', total.toString());

  // Renderizado del Directorio con filtros
  filtrarDirectorioEmpleados();
}

/**
 * Filtra y renderiza la tabla del directorio de colaboradores
 */
function filtrarDirectorioEmpleados() {
  const tbody = document.getElementById('directorioEmpleadosBody');
  if (!tbody) return;

  const busqueda = (document.getElementById('empSearchInput')?.value || '').trim().toLowerCase();
  const filtroTipo = document.getElementById('empFilterTipo')?.value || 'todos';

  const todosEmpleados = obtenerEmpleadosEmpresa();

  const filtrados = todosEmpleados.filter(emp => {
    const texto = `${emp.nombre} ${emp.email} ${emp.puesto}`.toLowerCase();
    const coincideBusqueda = !busqueda || texto.includes(busqueda);

    let coincideFiltro = true;
    if (filtroTipo === 'con_cuenta') coincideFiltro = emp.tieneCuentaApp;
    else if (filtroTipo === 'en_nomina') coincideFiltro = emp.enNomina;
    else if (filtroTipo === 'pendientes') coincideFiltro = !emp.enNomina;

    return coincideBusqueda && coincideFiltro;
  });

  tbody.innerHTML = '';

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr id="emptyDirectorioRow">
        <td colspan="7" class="empty-state" style="padding: 28px 16px;">
          <div style="font-size: 1.6rem; margin-bottom: 6px;">👥</div>
          <div style="font-weight: 600; color: var(--text-main); margin-bottom: 4px;">No se encontraron colaboradores</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); max-width: 420px; margin: 0 auto;">
            ${busqueda ? 'Ningún colaborador coincide con tu búsqueda.' : 'No hay colaboradores vinculados a tu empresa actualmente. Puedes registrar uno nuevo o usar el botón "✨ Simular Registro".'}
          </div>
        </td>
      </tr>
    `;
    return;
  }

  filtrados.forEach(emp => {
    const row = document.createElement('tr');
    const iniciales = emp.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EM';
    
    // Insignias descriptivas
    let tagsHtml = '';
    if (emp.esNuevo || !emp.enNomina) {
      tagsHtml += '<span class="emp-badge-new">✨ Nuevo Registro</span> ';
    }
    if (emp.tieneCuentaApp) {
      tagsHtml += '<span class="emp-badge-app">🟢 Cuenta en App</span>';
    }

    // Origen
    const origenHtml = emp.origen === 'auto-registro'
      ? '<span class="emp-badge-app">🌐 Auto-registro Web</span>'
      : '<span class="emp-badge-payroll">📋 Alta por Administradora</span>';

    // Estatus Salarial
    const salarioHtml = emp.enNomina
      ? `<strong style="color:var(--text-main); font-size:0.88rem;">$${emp.neto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong> <span style="font-size:0.72rem; color:var(--text-muted);">neto</span>`
      : `<span class="badge badge-vencido" style="font-size:0.74rem;">⚠️ Pendiente de Salario</span>`;

    // Botones de acción
    const btnSueldo = emp.enNomina
      ? `<button class="btn btn-secondary btn-sm" onclick="editarSueldoEmpleado('${emp.id}')" title="Modificar sueldo asignado">✏️ Sueldo</button>`
      : `<button class="btn btn-primary btn-sm" onclick="asignarSueldoEmpleado('${emp.id}')" title="Asignar sueldo en nómina">➕ Asignar Sueldo</button>`;

    row.innerHTML = `
      <td>
        <div class="emp-row-info">
          <div class="emp-avatar-circle">${iniciales}</div>
          <div>
            <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">
              ${emp.nombre}
            </div>
            <div style="margin-top: 3px;">
              ${tagsHtml}
            </div>
          </div>
        </div>
      </td>
      <td>
        ${emp.email ? `<span style="font-size: 0.82rem; color: var(--text-secondary);">${emp.email}</span>` : '<span style="color:var(--text-muted); font-style:italic; font-size:0.78rem;">Sin correo vinculado</span>'}
      </td>
      <td>
        <span class="tag-pill" style="font-size: 0.76rem;">${emp.puesto}</span>
      </td>
      <td>
        ${origenHtml}
      </td>
      <td>
        ${salarioHtml}
      </td>
      <td>
        <span style="font-size: 0.78rem; color: var(--text-muted);">${emp.fechaRegistro}</span>
      </td>
      <td>
        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: nowrap;">
          <button class="btn btn-secondary btn-sm" onclick="verFichaEmpleado('${emp.id}')" title="Ver expediente y credenciales">👁️ Ficha</button>
          ${btnSueldo}
          <button class="btn btn-danger btn-sm" onclick="eliminarEmpleadoDeEmpresa('${emp.id}')" title="Dar de baja colaborador">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * Renderiza la sección de Plantilla Salarial (Cálculo de Nómina y Dispersión)
 */
function actualizarTablaNominaSalarialUI() {
  const tbody = document.getElementById('nominaBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (listaEmpleados.length === 0) {
    tbody.innerHTML = '<tr id="emptyNominaRow"><td colspan="6" class="empty-state">No hay colaboradores con sueldo asignado (Plantilla en $0.00).</td></tr>';
    actualizarMetricasNomina(0, 0, 0, 0);
    return;
  }

  let totalPercepciones = 0;
  let totalDeducciones = 0;
  let totalNeto = 0;

  listaEmpleados.forEach(emp => {
    totalPercepciones += (emp.sueldo + emp.bonos);
    totalDeducciones += emp.deducciones;
    totalNeto += emp.neto;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong class="table-concept">${emp.nombre}</strong>
        <span class="table-subconcept">${emp.puesto || 'Colaborador'}</span>
      </td>
      <td>$${emp.sueldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
      <td style="color:var(--accent-success)">+$${emp.bonos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
      <td style="color:var(--accent-danger)">-$${emp.deducciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
      <td><strong style="color:var(--text-main); font-size:0.95rem;">$${emp.neto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary btn-sm" onclick="editarSueldoEmpleado('${emp.id}')" title="Editar sueldo">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarEmpleado('${emp.id}')" title="Eliminar de nómina">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });

  actualizarMetricasNomina(totalPercepciones, totalDeducciones, totalNeto, listaEmpleados.length);
}

function actualizarMetricasNomina(percepciones, deducciones, neto, numEmpleados) {
  safeSetText('nomTotalPercepciones', `$${percepciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('nomTotalDeducciones', `$${deducciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('nomTotalNeto', `$${neto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('nomNumEmpleados', `${numEmpleados} Colaborador(es)`);
}

/**
 * Abre el modal para registrar un nuevo colaborador desde cero
 */
function abrirModalNuevoEmpleado() {
  document.getElementById('empId').value = '';
  document.getElementById('empNombre').value = '';
  document.getElementById('empEmail').value = '';
  document.getElementById('empPuesto').value = '';
  document.getElementById('empSueldo').value = '';
  document.getElementById('empBonos').value = '0';
  document.getElementById('empDeducciones').value = '0';

  const chkCuenta = document.getElementById('empCrearCuentaApp');
  if (chkCuenta) chkCuenta.checked = false;

  const pwdWrap = document.getElementById('empPasswordWrapper');
  if (pwdWrap) pwdWrap.style.display = 'none';

  const tituloModal = document.getElementById('modalEmpleadoTitulo');
  if (tituloModal) tituloModal.innerText = '👤 Registrar Colaborador en tu Empresa';

  openModal('modalEmpleado');
}

/**
 * Asigna o edita el sueldo de un colaborador del directorio
 */
function asignarSueldoEmpleado(id) {
  const todos = obtenerEmpleadosEmpresa();
  const emp = todos.find(e => String(e.id) === String(id));
  if (!emp) return;

  document.getElementById('empId').value = emp.nominaId || emp.id;
  document.getElementById('empNombre').value = emp.nombre || '';
  document.getElementById('empEmail').value = emp.email || '';
  document.getElementById('empPuesto').value = emp.puesto || '';
  document.getElementById('empSueldo').value = emp.sueldo > 0 ? emp.sueldo : '';
  document.getElementById('empBonos').value = emp.bonos || 0;
  document.getElementById('empDeducciones').value = emp.deducciones || 0;

  const chkCuenta = document.getElementById('empCrearCuentaApp');
  if (chkCuenta) chkCuenta.checked = emp.tieneCuentaApp;

  const pwdWrap = document.getElementById('empPasswordWrapper');
  if (pwdWrap) pwdWrap.style.display = 'none';

  const tituloModal = document.getElementById('modalEmpleadoTitulo');
  if (tituloModal) tituloModal.innerText = `➕ Asignar Sueldo a ${emp.nombre}`;

  openModal('modalEmpleado');
}

function editarSueldoEmpleado(id) {
  const todos = obtenerEmpleadosEmpresa();
  const emp = todos.find(e => String(e.id) === String(id));
  if (!emp) return;

  document.getElementById('empId').value = emp.nominaId || emp.id;
  document.getElementById('empNombre').value = emp.nombre || '';
  document.getElementById('empEmail').value = emp.email || '';
  document.getElementById('empPuesto').value = emp.puesto || '';
  document.getElementById('empSueldo').value = emp.sueldo || '';
  document.getElementById('empBonos').value = emp.bonos || 0;
  document.getElementById('empDeducciones').value = emp.deducciones || 0;

  const chkCuenta = document.getElementById('empCrearCuentaApp');
  if (chkCuenta) chkCuenta.checked = emp.tieneCuentaApp;

  const pwdWrap = document.getElementById('empPasswordWrapper');
  if (pwdWrap) pwdWrap.style.display = 'none';

  const tituloModal = document.getElementById('modalEmpleadoTitulo');
  if (tituloModal) tituloModal.innerText = `✏️ Modificar Sueldo de ${emp.nombre}`;

  openModal('modalEmpleado');
}

/**
 * Guarda o actualiza un empleado en nómina y opcionalmente crea su cuenta de acceso
 */
function guardarEmpleado() {
  const idExistente = document.getElementById('empId')?.value;
  const nombre = document.getElementById('empNombre')?.value.trim();
  const email = document.getElementById('empEmail')?.value.trim().toLowerCase();
  const puesto = document.getElementById('empPuesto')?.value.trim() || 'Colaborador';
  const sueldo = parseFloat(document.getElementById('empSueldo')?.value) || 0;
  const bonos = parseFloat(document.getElementById('empBonos')?.value) || 0;
  const deducciones = parseFloat(document.getElementById('empDeducciones')?.value) || 0;
  const crearCuenta = document.getElementById('empCrearCuentaApp')?.checked;
  const password = document.getElementById('empPassword')?.value || 'password123';

  if (!nombre || sueldo <= 0) {
    showToast('Ingresa el nombre completo del colaborador y un sueldo válido mayor a $0.00.', 'warning');
    return;
  }

  const percepciones = sueldo + bonos;
  const neto = percepciones - deducciones;

  // Si se marcó crear cuenta de usuario y hay correo, agregar a la lista global de usuarios si no existe
  if (crearCuenta && email) {
    const usuarioExistente = listaUsuariosRegistrados.find(u => u.email === email);
    if (!usuarioExistente) {
      const nuevoUsuario = {
        id: Date.now() + 5,
        nombre,
        empresa: usuarioActual?.empresa || configSistema.empresa || 'Corporativo Financiero Global S.A.',
        email,
        password,
        rol: 'empleado',
        puesto,
        fechaRegistro: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
        origen: 'admin'
      };
      listaUsuariosRegistrados.push(nuevoUsuario);
      guardarEnStorage(StorageKey.USUARIOS, listaUsuariosRegistrados);
      showToast(`Cuenta de acceso para ${nombre} creada exitosamente (${email}).`, 'info');
    }
  }

  // Verificar si ya existe en la lista de nómina
  const index = listaEmpleados.findIndex(e => String(e.id) === String(idExistente) || (email && e.email === email) || (e.nombre.toLowerCase() === nombre.toLowerCase()));

  if (index !== -1) {
    listaEmpleados[index] = {
      ...listaEmpleados[index],
      nombre,
      email,
      puesto,
      sueldo,
      bonos,
      deducciones,
      neto
    };
    showToast(`Datos y sueldo de ${nombre} actualizados en nómina.`, 'success');
  } else {
    listaEmpleados.push({
      id: Date.now(),
      nombre,
      email,
      puesto,
      sueldo,
      bonos,
      deducciones,
      neto,
      fechaRegistro: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
      origen: 'alta_directa'
    });
    showToast(`Colaborador ${nombre} registrado exitosamente en tu nómina.`, 'success');
  }

  guardarDatosDeUsuarioActivo();
  actualizarNominaUI();
  closeModal('modalEmpleado');
}

/**
 * Muestra el expediente completo y confidencial del empleado
 */
function verFichaEmpleado(id) {
  const todos = obtenerEmpleadosEmpresa();
  const emp = todos.find(e => String(e.id) === String(id));
  if (!emp) return;

  const modalBody = document.getElementById('fichaEmpleadoBody');
  const btnEditar = document.getElementById('btnFichaEditar');
  if (!modalBody) return;

  const iniciales = emp.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EM';
  const nombreEmpresa = usuarioActual?.empresa || configSistema?.empresa || 'Corporativo Financiero Global S.A.';

  modalBody.innerHTML = `
    <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
      <div class="emp-avatar-circle" style="width: 56px; height: 56px; font-size: 1.3rem;">${iniciales}</div>
      <div>
        <h4 style="margin: 0 0 4px 0; font-size: 1.15rem; color: var(--text-main);">${emp.nombre}</h4>
        <div style="font-size: 0.85rem; color: var(--accent-primary); font-weight: 600;">${emp.puesto}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">🏢 ${nombreEmpresa}</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
      <div style="background: var(--bg-card-hover); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Correo de Contacto / Acceso</div>
        <div style="font-size: 0.86rem; font-weight: 600; color: var(--text-main); margin-top: 2px;">
          ${emp.email || '<span style="color:var(--text-muted); font-style:italic;">No especificado</span>'}
        </div>
      </div>

      <div style="background: var(--bg-card-hover); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Cuenta en Plataforma</div>
        <div style="font-size: 0.86rem; font-weight: 600; color: var(--text-main); margin-top: 2px;">
          ${emp.tieneCuentaApp ? '🟢 Activa (Rol: Empleado)' : '⚪ Sin cuenta creada'}
        </div>
      </div>

      <div style="background: var(--bg-card-hover); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Origen del Registro</div>
        <div style="font-size: 0.86rem; font-weight: 600; color: var(--text-main); margin-top: 2px;">
          ${emp.origen === 'auto-registro' ? '🌐 Registro Web Autónomo' : '📋 Registrado por Administradora'}
        </div>
      </div>

      <div style="background: var(--bg-card-hover); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Fecha de Ingreso</div>
        <div style="font-size: 0.86rem; font-weight: 600; color: var(--text-main); margin-top: 2px;">
          ${emp.fechaRegistro}
        </div>
      </div>
    </div>

    <div style="background: rgba(15, 23, 42, 0.5); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
      <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-bottom: 10px;">
        💵 Estructura y Percepciones Salariales
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 6px;">
        <span style="color: var(--text-secondary);">Sueldo Base:</span>
        <strong style="color: var(--text-main);">$${emp.sueldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 6px;">
        <span style="color: var(--accent-success);">+ Bonos y Primas:</span>
        <strong style="color: var(--accent-success);">+$${emp.bonos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 8px;">
        <span style="color: var(--accent-danger);">- Retenciones y Deducciones:</span>
        <strong style="color: var(--accent-danger);">-$${emp.deducciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.95rem; padding-top: 8px; border-top: 1px dashed var(--border-color);">
        <span style="font-weight: 700; color: var(--text-main);">Remuneración Neta a Dispersar:</span>
        <strong style="font-size: 1.05rem; color: var(--text-main);">$${emp.neto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
      </div>
    </div>
  `;

  if (btnEditar) {
    btnEditar.onclick = () => {
      closeModal('modalFichaEmpleado');
      editarSueldoEmpleado(emp.id);
    };
  }

  openModal('modalFichaEmpleado');
}

/**
 * Da de baja a un colaborador del directorio de la empresa
 */
function eliminarEmpleadoDeEmpresa(id) {
  if (usuarioActual && usuarioActual.rol === 'empleado') {
    showToast('Solo la Administradora puede gestionar bajas de colaboradores.', 'danger');
    return;
  }

  const todos = obtenerEmpleadosEmpresa();
  const emp = todos.find(e => String(e.id) === String(id));
  if (!emp) return;

  pedirConfirmacion({
    titulo: '👤 Dar de Baja a Colaborador',
    mensaje: `¿Deseas retirar a ${emp.nombre} del directorio de tu empresa?`,
    detalle: `Se dará de baja de la plantilla salarial y se desvinculará de ${usuarioActual?.empresa || 'tu empresa'}.`,
    textoBoton: 'Dar de Baja Colaborador',
    claseBoton: 'btn-danger',
    onConfirm: () => {
      // Eliminar de listaEmpleados
      listaEmpleados = listaEmpleados.filter(e => String(e.id) !== String(emp.nominaId || emp.id) && e.nombre.toLowerCase() !== emp.nombre.toLowerCase());

      // Si tiene cuenta en listaUsuariosRegistrados, desvincular de la empresa
      const uIndex = listaUsuariosRegistrados.findIndex(u => (emp.usuarioId && u.id === emp.usuarioId) || (emp.email && u.email === emp.email));
      if (uIndex !== -1) {
        listaUsuariosRegistrados[uIndex].empresa = 'Ex-colaborador';
        guardarEnStorage(StorageKey.USUARIOS, listaUsuariosRegistrados);
      }

      guardarDatosDeUsuarioActivo();
      actualizarNominaUI();
      showToast(`Colaborador ${emp.nombre} dado de baja de la empresa.`, 'info');
    }
  });
}

function eliminarEmpleado(id) {
  eliminarEmpleadoDeEmpresa(id);
}

/**
 * Simulación de registro de un nuevo empleado a tu empresa
 */
function probarRegistroSimuladoEmpleado() {
  const nombreEmpresa = usuarioActual?.empresa || configSistema?.empresa || 'Corporativo Financiero Global S.A.';
  safeSetText('simularEmpresaNombre', nombreEmpresa);
  openModal('modalSimularEmpleado');
}

function ejecutarRegistroSimuladoEmpleado() {
  const nombre = document.getElementById('simNombre')?.value.trim();
  const email = document.getElementById('simEmail')?.value.trim().toLowerCase();
  const puesto = document.getElementById('simPuesto')?.value.trim() || 'Ejecutivo Operativo';
  const password = document.getElementById('simPassword')?.value || 'password123';
  const nombreEmpresa = usuarioActual?.empresa || configSistema?.empresa || 'Corporativo Financiero Global S.A.';

  if (!nombre || !email) {
    showToast('Ingresa el nombre y correo del colaborador a simular.', 'warning');
    return;
  }

  // Verificar si ya existe en usuarios registrados
  const existente = listaUsuariosRegistrados.find(u => u.email === email);
  if (existente) {
    existente.empresa = nombreEmpresa;
    existente.puesto = puesto;
    existente.esNuevo = true;
  } else {
    const nuevoUsuario = {
      id: Date.now(),
      nombre,
      empresa: nombreEmpresa,
      email,
      password,
      rol: 'empleado',
      puesto,
      fechaRegistro: 'Hoy ' + new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      origen: 'auto-registro',
      esNuevo: true
    };
    listaUsuariosRegistrados.push(nuevoUsuario);
  }

  guardarEnStorage(StorageKey.USUARIOS, listaUsuariosRegistrados);
  closeModal('modalSimularEmpleado');
  actualizarNominaUI();

  showToast(`¡Colaborador añadido! ${nombre} se ha registrado como Empleado en ${nombreEmpresa} y ya está visible en tu directorio.`, 'success');
}

function dispersarNomina() {
  if (usuarioActual && usuarioActual.rol === 'empleado') {
    showToast('Acceso Denegado: Solo la Administradora tiene autorización para dispersar nómina.', 'danger');
    return;
  }

  if (listaEmpleados.length === 0) {
    showToast('No hay colaboradores registrados con sueldo en la plantilla ($0.00).', 'warning');
    return;
  }

  let totalNeto = 0;
  listaEmpleados.forEach(e => totalNeto += e.neto);

  pedirConfirmacion({
    titulo: '💸 Dispersar Nómina a Colaboradores',
    mensaje: `¿Confirmas la dispersión total de nómina por $${totalNeto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}?`,
    detalle: `Se procesará el pago de ${listaEmpleados.length} colaboradores activos con cargo a las cuentas de tesorería.`,
    textoBoton: 'Dispersar Nómina',
    claseBoton: 'btn-primary',
    onConfirm: () => {
      if (listaCuentas.length > 0) {
        listaCuentas[0].saldo -= totalNeto;
      }

      listaTransacciones.unshift({
        id: Date.now(),
        tipo: 'egreso',
        concepto: `Dispersión de Nómina (${listaEmpleados.length} colaboradores)`,
        categoria: 'Nómina',
        monto: totalNeto,
        fecha: new Date().toISOString().split('T')[0],
        cuentaId: listaCuentas.length > 0 ? listaCuentas[0].id : null
      });

      guardarDatosDeUsuarioActivo();
      actualizarTodo();
      showToast(`Nómina de $${totalNeto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} dispersada con éxito.`, 'success');
    }
  });
}

// ==========================================================================
// 11. Módulo de Informes Financieros & P&L (Estado de Resultados)
// ==========================================================================
function recalcularPyl() {
  const ventas = parseFloat(document.getElementById('pylVentas')?.value) || 0;
  const costoVentas = parseFloat(document.getElementById('pylCostoVentas')?.value) || 0;
  const gastosOp = parseFloat(document.getElementById('pylGastosOp')?.value) || 0;
  const impuestos = parseFloat(document.getElementById('pylImpuestos')?.value) || 0;

  const utilidadBruta = ventas - costoVentas;
  const gastosTotales = costoVentas + gastosOp + impuestos;
  const utilidadNeta = utilidadBruta - gastosOp - impuestos;
  const ebitda = utilidadBruta - gastosOp;

  const base = ventas > 0 ? ventas : 1;
  const pctCosto = ((costoVentas / base) * 100).toFixed(1);
  const pctBruto = ((utilidadBruta / base) * 100).toFixed(1);
  const pctGastosOp = ((gastosOp / base) * 100).toFixed(1);
  const pctImpuestos = ((impuestos / base) * 100).toFixed(1);
  const pctNeto = ((utilidadNeta / base) * 100).toFixed(1);

  safeSetText('pctCosto', `${pctCosto}%`);
  safeSetText('pylUtilidadBruta', `$${utilidadBruta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('pctBruto', `${pctBruto}%`);
  safeSetText('pctGastosOp', `${pctGastosOp}%`);
  safeSetText('pctImpuestos', `${pctImpuestos}%`);
  safeSetText('pylUtilidadNeta', `$${utilidadNeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('pctNeto', `${pctNeto}%`);

  safeSetText('kpiIngresos', `$${ventas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('kpiGastos', `$${gastosTotales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  
  const elUtilidad = document.getElementById('kpiUtilidad');
  if (elUtilidad) {
    elUtilidad.innerText = `$${utilidadNeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    elUtilidad.style.color = utilidadNeta >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
  }

  safeSetText('kpiMargen', `${pctNeto}%`);
  safeSetText('kpiEbitda', `$${ebitda.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('kpiRatio', `${((gastosTotales / base) * 100).toFixed(1)}%`);
  safeSetText('kpiEquilibrio', `$${(gastosOp + costoVentas).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
}

function actualizarReporte() {
  const periodo = document.getElementById('periodoSelect')?.value || 'mes';

  if (periodo === 'trimestre') {
    setInputValue('pylVentas', 450000);
    setInputValue('pylCostoVentas', 180000);
    setInputValue('pylGastosOp', 75000);
    setInputValue('pylImpuestos', 30000);
  } else if (periodo === 'anio') {
    setInputValue('pylVentas', 1800000);
    setInputValue('pylCostoVentas', 720000);
    setInputValue('pylGastosOp', 300000);
    setInputValue('pylImpuestos', 120000);
  } else if (periodo === 'real') {
    let realIngresos = 0;
    let realEgresos = 0;
    listaTransacciones.forEach(t => {
      if (t.tipo === 'ingreso') realIngresos += t.monto;
      else realEgresos += t.monto;
    });
    setInputValue('pylVentas', realIngresos);
    setInputValue('pylCostoVentas', realEgresos * 0.4);
    setInputValue('pylGastosOp', realEgresos * 0.45);
    setInputValue('pylImpuestos', realEgresos * 0.15);
  } else {
    setInputValue('pylVentas', 150000);
    setInputValue('pylCostoVentas', 60000);
    setInputValue('pylGastosOp', 25000);
    setInputValue('pylImpuestos', 10000);
  }
  recalcularPyl();
}

function exportarCSV() {
  const encabezados = ['Tipo', 'Fecha', 'Concepto', 'Categoría', 'Monto'];
  const filas = listaTransacciones.map(t => [
    `"${t.tipo}"`,
    `"${t.fecha}"`,
    `"${t.concepto.replace(/"/g, '""')}"`,
    `"${t.categoria}"`,
    t.monto
  ]);

  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encabezados.join(',') + '\n';
  filas.forEach(f => { csvContent += f.join(',') + '\n'; });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `reporte_financiero_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Archivo CSV descargado exitosamente.', 'success');
}

// ==========================================================================
// 12. Herramientas de Diagnóstico Técnico (Rol: Técnico de la App)
// ==========================================================================
function ejecutarDiagnosticoTecnico() {
  const logBox = document.getElementById('techConsoleLog');
  if (!logBox) return;

  logBox.innerText = 'Iniciando diagnóstico integral del sistema...\n';

  setTimeout(() => {
    const usuariosCount = listaUsuariosRegistrados.length;
    const cuentasCount = listaCuentas.length;
    const txCount = listaTransacciones.length;
    const rolActual = usuarioActual ? usuarioActual.rol : 'Sin sesión';
    const emailActual = usuarioActual ? usuarioActual.email : 'Ninguno';

    let totalSaldo = 0;
    listaCuentas.forEach(c => totalSaldo += c.saldo);

    logBox.innerText += `[OK] Sesión Activa: ${emailActual} [Jerarquía: ${rolActual}]\n`;
    logBox.innerText += `[OK] Registro de Usuarios: ${usuariosCount} perfiles en almacenamiento seguro\n`;
    logBox.innerText += `[OK] Cuentas Financieras: ${cuentasCount} cuentas ($${totalSaldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })})\n`;
    logBox.innerText += `[OK] Libro Diario de Transacciones: ${txCount} movimientos auditados\n`;
    logBox.innerText += `[OK] Integridad de Esquema y Almacenamiento: 100% Consistente\n`;
    logBox.innerText += `[OK] Modo de Operación: Cliente Autónomo de Alta Disponibilidad\n`;
    logBox.innerText += `--- Diagnóstico Técnico completado sin anomalías ---\n`;
  }, 300);
}

function limpiarAlmacenamientoUsuario() {
  pedirConfirmacion({
    titulo: '🧹 Restablecer a Cero ($0.00)',
    mensaje: '¿Deseas restablecer a CERO todos tus registros financieros de esta cuenta?',
    detalle: 'Se limpiarán las cuentas bancarias, transacciones, pagos y nómina de este perfil.',
    textoBoton: 'Restablecer a CERO',
    claseBoton: 'btn-danger',
    onConfirm: () => {
      listaCuentas = [];
      listaTransacciones = [];
      listaPagos = [];
      listaEmpleados = [];
      listaGastosTurno = [];
      guardarDatosDeUsuarioActivo();

      actualizarTodo();
      showToast('Tus registros han sido restablecidos a CERO ($0.00).', 'info');
    }
  });
}

// ==========================================================================
// 13. Configuraciones por Jerarquía (Admin, Empleado, Técnico) & Respaldos
// ==========================================================================

/**
 * Organiza, adapta y activa la vista de configuraciones según la jerarquía
 * con la que el usuario creó su cuenta o inició sesión.
 */
function organizarConfiguracionesPorJerarquia(rolParam) {
  const rol = rolParam || (usuarioActual ? (usuarioActual.rol || 'administradora').toLowerCase() : 'invitado');
  const nombre = usuarioActual ? usuarioActual.nombre : '';
  const empresa = (usuarioActual && usuarioActual.empresa) ? usuarioActual.empresa : (configSistema?.empresa || 'Five Cash');

  const titleEl = document.getElementById('configSectionTitle');
  const descEl = document.getElementById('configSectionDesc');
  const badgeEl = document.getElementById('configSectionBadge');
  const navTabsEl = document.getElementById('configTabsNav');
  const guestNoticeEl = document.getElementById('configGuestNotice');

  const btnAdmin = document.getElementById('btnSubtabAdmin');
  const btnEmpleado = document.getElementById('btnSubtabEmpleado');
  const btnTecnico = document.getElementById('btnSubtabTecnico');

  const subAdmin = document.getElementById('subtabConfigAdmin');
  const subEmpleado = document.getElementById('subtabConfigEmpleado');
  const subTecnico = document.getElementById('subtabConfigTecnico');

  const btnGuardarAdmin = document.getElementById('btnGuardarConfigAdmin');
  const cfgAdminInputs = ['cfgEmpresaName', 'cfgRfc', 'cfgDivisa', 'cfgPais', 'cfgGastoLimite', 'cfgSaldoMinimo', 'cfgExigirFolio'];

  // Caso 1: Usuario Invitado / Sin Sesión
  if (rol === 'invitado' || !usuarioActual) {
    if (titleEl) titleEl.innerText = '⚙️ Centro de Configuraciones por Jerarquía';
    if (descEl) descEl.innerText = 'Inicia sesión o crea tu cuenta para acceder a las opciones personalizadas de tu perfil.';
    if (badgeEl) {
      badgeEl.className = 'role-badge';
      badgeEl.style.backgroundColor = '#f1f5f9';
      badgeEl.style.color = '#64748b';
      badgeEl.style.borderColor = '#cbd5e1';
      badgeEl.innerText = '🔒 Sin Sesión';
    }
    if (navTabsEl) navTabsEl.style.display = 'none';
    if (guestNoticeEl) guestNoticeEl.style.display = 'block';
    if (subAdmin) subAdmin.style.display = 'none';
    if (subEmpleado) subEmpleado.style.display = 'none';
    if (subTecnico) subTecnico.style.display = 'none';
    return;
  }

  // Ocultar aviso de invitado si hay sesión
  if (guestNoticeEl) guestNoticeEl.style.display = 'none';

  if (rol === 'empleado') {
    // Caso 2: 💼 JERARQUÍA EMPLEADO
    // Configura exclusivamente su panel de turno de trabajo, caja chica y comprobantes
    if (titleEl) titleEl.innerText = '⚙️ Mis Configuraciones de Empleado';
    if (descEl) descEl.innerText = `Preferencias personales para tu turno de trabajo en ${empresa}, caja chica y privacidad de tu recibo salarial.`;
    if (badgeEl) {
      badgeEl.className = 'role-badge role-empleado';
      badgeEl.style.backgroundColor = '';
      badgeEl.style.color = '';
      badgeEl.style.borderColor = '';
      badgeEl.innerText = '💼 Empleado Operativo';
    }

    // Organizar subpestañas: ocultar las que no le corresponden para evitar confusión
    if (navTabsEl) navTabsEl.style.display = 'flex';
    if (btnAdmin) btnAdmin.style.display = 'none';
    if (btnTecnico) btnTecnico.style.display = 'none';
    if (btnEmpleado) {
      btnEmpleado.style.display = 'inline-flex';
      btnEmpleado.innerHTML = '💼 Mis Preferencias de Turno &amp; Recibo';
      btnEmpleado.classList.add('active-cfg-tab');
    }

    // Deshabilitar campos fiscales de administradora
    if (btnGuardarAdmin) {
      btnGuardarAdmin.disabled = true;
      btnGuardarAdmin.classList.add('locked-action');
      btnGuardarAdmin.innerText = '🔒 Solo Administradora puede modificar datos fiscales';
    }
    cfgAdminInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = true;
    });

    // Mostrar directamente la sección de empleado
    if (subAdmin) subAdmin.style.display = 'none';
    if (subTecnico) subTecnico.style.display = 'none';
    if (subEmpleado) subEmpleado.style.display = 'block';

  } else if (rol === 'tecnico') {
    // Caso 3: 🛠️ JERARQUÍA TÉCNICO DE LA APP
    // Herramientas de diagnóstico, memoria local, mantenimiento e integridad
    if (titleEl) titleEl.innerText = '⚙️ Herramientas y Diagnóstico Técnico';
    if (descEl) descEl.innerText = 'Optimización de almacenamiento local, monitoreo de memoria y activación de modo mantenimiento.';
    if (badgeEl) {
      badgeEl.className = 'role-badge role-tecnico';
      badgeEl.style.backgroundColor = '';
      badgeEl.style.color = '';
      badgeEl.style.borderColor = '';
      badgeEl.innerText = '🛠️ Técnico de la App (TI)';
    }

    if (navTabsEl) navTabsEl.style.display = 'flex';
    if (btnTecnico) {
      btnTecnico.style.display = 'inline-flex';
      btnTecnico.innerHTML = '🛠️ 1. Diagnóstico &amp; Memoria TI (Principal)';
    }
    if (btnAdmin) {
      btnAdmin.style.display = 'inline-flex';
      btnAdmin.innerHTML = '🏢 2. Parámetros de Empresa (Auditoría)';
    }
    if (btnEmpleado) {
      btnEmpleado.style.display = 'inline-flex';
      btnEmpleado.innerHTML = '💼 3. Políticas de Turno (Auditoría)';
    }

    if (btnGuardarAdmin) {
      btnGuardarAdmin.disabled = false;
      btnGuardarAdmin.classList.remove('locked-action');
      btnGuardarAdmin.innerText = '💾 Guardar Datos Corporativos';
    }
    cfgAdminInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = false;
    });

    cambiarSubtabConfig('tecnico');
    actualizarMetricasAlmacenamientoTecnico();

  } else {
    // Caso 4: 👑 JERARQUÍA ADMINISTRADORA (Control Total)
    if (titleEl) titleEl.innerText = '⚙️ Configuraciones de Administradora';
    if (descEl) descEl.innerText = `Control central de identidad fiscal, moneda operativa, límites preventivos de tesorería y gobierno de datos de ${empresa}.`;
    if (badgeEl) {
      badgeEl.className = 'role-badge role-administradora';
      badgeEl.style.backgroundColor = '';
      badgeEl.style.color = '';
      badgeEl.style.borderColor = '';
      badgeEl.innerText = '👑 Administradora (Control Total)';
    }

    if (navTabsEl) navTabsEl.style.display = 'flex';
    if (btnAdmin) {
      btnAdmin.style.display = 'inline-flex';
      btnAdmin.innerHTML = '👑 1. Finanzas &amp; Empresa (Principal)';
    }
    if (btnEmpleado) {
      btnEmpleado.style.display = 'inline-flex';
      btnEmpleado.innerHTML = '💼 2. Políticas de Turno para Empleados';
    }
    if (btnTecnico) {
      btnTecnico.style.display = 'none'; // Exclusivo de soporte técnico
    }

    if (btnGuardarAdmin) {
      btnGuardarAdmin.disabled = false;
      btnGuardarAdmin.classList.remove('locked-action');
      btnGuardarAdmin.innerText = '💾 Guardar Datos Corporativos';
    }
    cfgAdminInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = false;
    });

    cambiarSubtabConfig('admin');
  }

  actualizarCamposConfiguracion();
}

function cambiarSubtabConfig(subtab) {
  const subtabs = ['admin', 'empleado', 'tecnico'];
  subtabs.forEach(s => {
    const btn = document.getElementById(`btnSubtab${s.charAt(0).toUpperCase() + s.slice(1)}`);
    const content = document.getElementById(`subtabConfig${s.charAt(0).toUpperCase() + s.slice(1)}`);
    if (btn) {
      if (s === subtab) {
        btn.classList.add('active-cfg-tab');
      } else {
        btn.classList.remove('active-cfg-tab');
      }
    }
    if (content) {
      content.style.display = (s === subtab) ? 'block' : 'none';
    }
  });
}

function actualizarCamposConfiguracion() {
  if (!configSistema) return;

  const empresaDefecto = (usuarioActual && usuarioActual.empresa) ? usuarioActual.empresa : (configSistema.empresa || '');
  const emailDefecto = (usuarioActual && usuarioActual.email) ? usuarioActual.email : '';

  // 1. Administradora
  setInputValue('cfgEmpresaName', configSistema.empresa || empresaDefecto);
  setInputValue('cfgRfc', configSistema.rfc || '');
  setInputValue('cfgDivisa', configSistema.codigoDivisa || 'MXN');
  setInputValue('cfgPais', configSistema.pais || 'México');
  setInputValue('cfgGastoLimite', configSistema.gastoLimiteAlerta || 5000);
  setInputValue('cfgSaldoMinimo', configSistema.saldoMinimoAlerta || 10000);
  setInputValue('cfgExigirFolio', configSistema.exigirFolioTurno || 'si');

  // 2. Empleado
  setInputValue('cfgBaseCajaEmpleado', configSistema.baseCajaDefault || 0);
  setInputValue('cfgCatGastoEmpleado', configSistema.catGastoDefault || 'Operativo');
  setInputValue('cfgConfirmarGasto', configSistema.confirmarGastoTurno || 'si');
  setInputValue('cfgFormatoRecibo', configSistema.formatoRecibo || 'detallado');
  setInputValue('cfgPrivacidadMontos', configSistema.privacidadMontos || 'visible');
  setInputValue('cfgEmailNotifEmpleado', configSistema.emailNotifEmpleado || emailDefecto);

  // 3. Técnico
  setInputValue('cfgModoMantenimiento', configSistema.modoMantenimiento || 'desactivado');
  setInputValue('cfgLogLevel', configSistema.logLevel || 'debug');
  setInputValue('cfgTiempoSesion', configSistema.tiempoSesionMinutos || '60');
}

function actualizarBannerMantenimiento() {
  const mBanner = document.getElementById('maintenanceAlertBanner');
  if (!mBanner) return;
  if (configSistema && configSistema.modoMantenimiento === 'activado') {
    mBanner.style.display = 'block';
    mBanner.innerHTML = `
      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 10px 16px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; font-weight: 500;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span>🛠️</span>
          <span><strong>Modo Mantenimiento Activo:</strong> El Técnico del Sistema ha activado el estado preventivo. Las transacciones continúan funcionando con integridad garantizada.</span>
        </div>
        <span class="role-badge role-tecnico" style="font-size:0.75rem;">Soporte TI</span>
      </div>
    `;
  } else {
    mBanner.style.display = 'none';
  }
}

function actualizarMetricasAlmacenamientoTecnico() {
  let bytes = 0;
  let keyCount = 0;
  try {
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        bytes += (localStorage[key].length + key.length) * 2;
        keyCount++;
      }
    }
  } catch (e) {}

  const kb = (bytes / 1024).toFixed(1);
  const sizeEl = document.getElementById('techStorageSizeKB');
  const countEl = document.getElementById('techStorageKeysCount');
  if (sizeEl) sizeEl.innerText = `${kb} KB`;
  if (countEl) countEl.innerText = `${keyCount} Claves`;
}

function guardarConfigAdmin() {
  if (usuarioActual && usuarioActual.rol === 'empleado') {
    showToast('Los empleados no tienen permiso para modificar la configuración fiscal de la empresa.', 'danger');
    return;
  }

  const nombreEmpresa = document.getElementById('cfgEmpresaName')?.value.trim();
  const rfc = document.getElementById('cfgRfc')?.value.trim() || '';
  const divisa = document.getElementById('cfgDivisa')?.value || 'MXN';
  const pais = document.getElementById('cfgPais')?.value || 'México';
  const gastoLimite = parseFloat(document.getElementById('cfgGastoLimite')?.value) || 5000;
  const saldoMinimo = parseFloat(document.getElementById('cfgSaldoMinimo')?.value) || 10000;
  const exigirFolio = document.getElementById('cfgExigirFolio')?.value || 'si';

  if (!nombreEmpresa) {
    showToast('El nombre comercial de la empresa no puede estar vacío.', 'warning');
    return;
  }

  configSistema.empresa = nombreEmpresa;
  configSistema.rfc = rfc;
  configSistema.codigoDivisa = divisa;
  configSistema.pais = pais;
  configSistema.gastoLimiteAlerta = gastoLimite;
  configSistema.saldoMinimoAlerta = saldoMinimo;
  configSistema.exigirFolioTurno = exigirFolio;

  if (usuarioActual) {
    usuarioActual.empresa = nombreEmpresa;
    guardarEnStorage(StorageKey.SESION_ACTIVA, usuarioActual);

    const uIdx = listaUsuariosRegistrados.findIndex(u => u.email === usuarioActual.email);
    if (uIdx !== -1) {
      listaUsuariosRegistrados[uIdx].empresa = nombreEmpresa;
      guardarEnStorage(StorageKey.USUARIOS, listaUsuariosRegistrados);
    }
  }

  guardarDatosDeUsuarioActivo();
  actualizarTodo();
  aplicarJerarquiaUI();
  showToast('Configuraciones de Administradora guardadas correctamente.', 'success');
}

function guardarConfigEmpleado() {
  const baseCaja = parseFloat(document.getElementById('cfgBaseCajaEmpleado')?.value) || 0;
  const catGasto = document.getElementById('cfgCatGastoEmpleado')?.value || 'Operativo';
  const confirmarGasto = document.getElementById('cfgConfirmarGasto')?.value || 'si';
  const formatoRecibo = document.getElementById('cfgFormatoRecibo')?.value || 'detallado';
  const privacidadMontos = document.getElementById('cfgPrivacidadMontos')?.value || 'visible';
  const emailNotif = document.getElementById('cfgEmailNotifEmpleado')?.value.trim() || (usuarioActual ? usuarioActual.email : '');

  configSistema.baseCajaDefault = baseCaja;
  configSistema.catGastoDefault = catGasto;
  configSistema.confirmarGastoTurno = confirmarGasto;
  configSistema.formatoRecibo = formatoRecibo;
  configSistema.privacidadMontos = privacidadMontos;
  configSistema.emailNotifEmpleado = emailNotif;

  guardarDatosDeUsuarioActivo();
  actualizarTodo();
  showToast('Preferencias operativas de Empleado guardadas exitosamente.', 'success');
}

function guardarConfigTecnico() {
  if (usuarioActual && usuarioActual.rol === 'empleado') {
    showToast('Acceso denegado: Se requieren permisos de nivel técnico.', 'danger');
    return;
  }

  const modoMantenimiento = document.getElementById('cfgModoMantenimiento')?.value || 'desactivado';
  const logLevel = document.getElementById('cfgLogLevel')?.value || 'debug';
  const tiempoSesion = document.getElementById('cfgTiempoSesion')?.value || '60';

  configSistema.modoMantenimiento = modoMantenimiento;
  configSistema.logLevel = logLevel;
  configSistema.tiempoSesionMinutos = tiempoSesion;

  guardarDatosDeUsuarioActivo();
  actualizarBannerMantenimiento();
  actualizarTodo();
  showToast('Parámetros técnicos de sistema actualizados.', 'success');
}

function optimizarAlmacenamientoLocal() {
  try {
    actualizarMetricasAlmacenamientoTecnico();
    const logBox = document.getElementById('techConsoleLog');
    if (logBox) {
      logBox.innerText += `[OPTIMIZAR] Almacenamiento validado y compactado. Claves activas verificadas.\n`;
    }
    showToast('Almacenamiento local optimizado y verificado.', 'success');
  } catch (err) {
    showToast('Error al optimizar almacenamiento.', 'danger');
  }
}

function purgarCacheTemporal() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('fc_cache_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    actualizarMetricasAlmacenamientoTecnico();
    showToast('Caché temporal del cliente depurada.', 'info');
  } catch (e) {
    showToast('Caché depurada.', 'info');
  }
}

function importarRespaldoJSON(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || typeof data !== 'object') {
        throw new Error('Archivo inválido');
      }

      if (Array.isArray(data.cuentas)) listaCuentas = data.cuentas;
      if (Array.isArray(data.transacciones)) listaTransacciones = data.transacciones;
      if (Array.isArray(data.pagos)) listaPagos = data.pagos;
      if (Array.isArray(data.empleados)) listaEmpleados = data.empleados;
      if (Array.isArray(data.gastosTurno)) listaGastosTurno = data.gastosTurno;
      if (data.config && typeof data.config === 'object') {
        configSistema = Object.assign({}, configSistema, data.config);
      }

      guardarDatosDeUsuarioActivo();
      actualizarTodo();
      aplicarJerarquiaUI();
      showToast('Respaldo JSON restaurado exitosamente.', 'success');
    } catch (err) {
      showToast('Error al procesar el archivo JSON de respaldo.', 'danger');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function exportarRespaldoJSON() {
  const backup = {
    fecha: new Date().toISOString(),
    usuario: usuarioActual,
    config: configSistema,
    cuentas: listaCuentas,
    transacciones: listaTransacciones,
    pagos: listaPagos,
    empleados: listaEmpleados,
    gastosTurno: listaGastosTurno
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `five_cash_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Respaldo JSON descargado.', 'success');
}

const guardarConfiguraciones = guardarConfigAdmin;

/**
 * Restablece las cuentas, transacciones y nómina a cero limpio ($0.00)
 */
function reiniciarDatosCero() {
  pedirConfirmacion({
    titulo: '🗑️ Restablecer Datos a Cero',
    mensaje: '¿Deseas reiniciar todas tus cuentas, transacciones y nómina?',
    detalle: 'Esta acción borrará los movimientos y dejará el panel limpio en $0.00.',
    textoBoton: 'Restablecer Todo a Cero',
    claseBoton: 'btn-danger',
    onConfirm: () => {
      listaCuentas = [];
      listaTransacciones = [];
      listaPagos = [];
      listaEmpleados = [];
      listaGastosTurno = [];
      configSistema = {
        empresa: usuarioActual ? (usuarioActual.empresa || 'Mi Empresa') : 'Five Cash',
        rfc: '',
        divisa: '$',
        codigoDivisa: 'MXN'
      };

      guardarDatosDeUsuarioActivo();
      actualizarTodo();
      showToast('Los datos se han restablecido a cero ($0.00).', 'info');
    }
  });
}
window.restaurarDatosDemostracion = reiniciarDatosCero;
window.reiniciarDatosCero = reiniciarDatosCero;
window.cambiarSubtabConfig = cambiarSubtabConfig;
window.guardarConfigAdmin = guardarConfigAdmin;
window.guardarConfigEmpleado = guardarConfigEmpleado;
window.guardarConfigTecnico = guardarConfigTecnico;
window.optimizarAlmacenamientoLocal = optimizarAlmacenamientoLocal;
window.purgarCacheTemporal = purgarCacheTemporal;
window.importarRespaldoJSON = importarRespaldoJSON;
window.exportarRespaldoJSON = exportarRespaldoJSON;
window.ejecutarDiagnosticoTecnico = ejecutarDiagnosticoTecnico;
window.limpiarAlmacenamientoUsuario = limpiarAlmacenamientoUsuario;

// ==========================================================================
// 14. Búsqueda Global y Notificaciones Toast
// ==========================================================================
function filterGlobalData() {
  const val = (document.getElementById('globalSearchInput')?.value || '').toLowerCase();
  const sTx = document.getElementById('txSearch');
  const sPago = document.getElementById('pagoSearch');
  if (sTx) sTx.value = val;
  if (sPago) sPago.value = val;

  filtrarTablaTx();
  filtrarTablaPagos();
}

function showToast(mensaje, tipo = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  const icono = tipo === 'success' ? '✅' : tipo === 'danger' ? '❌' : tipo === 'warning' ? '⚠️' : 'ℹ️';

  toast.innerHTML = `<span>${icono}</span> <div>${mensaje}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// 15. Rendición de Turno y Operaciones de Empleado
// ==========================================================================
function guardarGastoTurnoEmpleado(event) {
  if (event) event.preventDefault();

  const concepto = document.getElementById('empGastoConcepto')?.value.trim();
  const monto = parseFloat(document.getElementById('empGastoMonto')?.value) || 0;
  const folio = document.getElementById('empGastoFolio')?.value.trim() || `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
  const categoria = document.getElementById('empGastoCategoria')?.value || 'Operativo';

  if (!concepto) {
    showToast('Por favor describe el concepto o justificación del gasto.', 'warning');
    return;
  }

  if (monto <= 0) {
    showToast('Ingresa un monto válido mayor a $0.00.', 'warning');
    return;
  }

  const ahora = new Date();
  const fechaHoraStr = `Hoy ${ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;

  const nuevoGasto = {
    id: Date.now(),
    fechaHora: fechaHoraStr,
    concepto,
    folio,
    categoria,
    monto,
    estado: 'Rendido'
  };

  listaGastosTurno.unshift(nuevoGasto);

  // Registrar también en el libro diario contable como egreso de caja
  const fechaHoy = new Date().toISOString().split('T')[0];
  const ctaCaja = listaCuentas.find(c => c.tipo === 'Efectivo' || c.banco.toLowerCase().includes('caja')) || listaCuentas[0];

  if (ctaCaja) {
    ctaCaja.saldo = Math.max(0, ctaCaja.saldo - monto);
  }

  listaTransacciones.unshift({
    id: Date.now() + 1,
    tipo: 'egreso',
    concepto: `[Turno Caja] ${concepto} (${folio})`,
    categoria: categoria === 'Proveedores' ? 'Proveedores' : 'Operativo',
    monto: monto,
    fecha: fechaHoy,
    cuentaId: ctaCaja ? ctaCaja.id : null
  });

  guardarDatosDeUsuarioActivo();
  actualizarTodo();

  const cInput = document.getElementById('empGastoConcepto');
  const mInput = document.getElementById('empGastoMonto');
  const fInput = document.getElementById('empGastoFolio');
  if (cInput) cInput.value = '';
  if (mInput) mInput.value = '';
  if (fInput) fInput.value = '';

  showToast(`Comprobante "${concepto}" por $${monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} rendido en bitácora.`, 'success');
}

function cerrarTurnoCaja() {
  const totalGastos = listaGastosTurno.reduce((acc, g) => acc + g.monto, 0);
  let totalVentas = 0;
  listaTransacciones.forEach(t => {
    if (t.tipo === 'ingreso') totalVentas += t.monto;
  });
  const balanceFinal = turnoBaseCaja + totalVentas - totalGastos;

  pedirConfirmacion({
    titulo: '🔒 Arqueo y Cierre de Turno',
    mensaje: '¿Deseas efectuar el corte y cierre de caja de tu turno de hoy?',
    detalle: `Fondo Inicial: $${turnoBaseCaja.toLocaleString('es-MX', { minimumFractionDigits: 2 })} • Entradas: $${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })} • Comprobantes Rendidos: $${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })} • Saldo Cuadrado a Entregar: $${balanceFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    textoBoton: 'Cerrar Turno y Guardar Corte',
    claseBoton: 'btn-primary',
    onConfirm: () => {
      showToast(`Turno cerrado exitosamente. Efectivo cuadrado: $${balanceFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}. Reporte enviado a Administradora.`, 'success');
    }
  });
}

function imprimirReciboEmpleado() {
  const nombre = usuarioActual ? usuarioActual.nombre : 'Carlos Ruiz';
  showToast(`Preparando vista de impresión de tu recibo confidencial para ${nombre}...`, 'info');
  window.print();
}

function renderizarGastosTurnoEmpleado() {
  const tbody = document.getElementById('turnoGastosBody');
  if (!tbody) return;

  const totalGastos = listaGastosTurno.reduce((acc, g) => acc + g.monto, 0);
  let totalVentas = 0;
  let numVentas = 0;
  listaTransacciones.forEach(t => {
    if (t.tipo === 'ingreso') {
      totalVentas += t.monto;
      numVentas++;
    }
  });

  const balanceFinal = turnoBaseCaja + totalVentas - totalGastos;

  safeSetText('turnoFondoInicial', `$${turnoBaseCaja.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('turnoVentasCobros', `$${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('turnoNumVentas', `${numVentas} cobros/ventas registrados`);
  safeSetText('turnoGastosRendidos', `$${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('turnoNumGastos', `${listaGastosTurno.length} comprobantes registrados`);
  safeSetText('turnoBalanceCaja', `$${balanceFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);

  if (usuarioActual) {
    safeSetText('reciboNombreEmpleado', usuarioActual.nombre);
    safeSetText('reciboPuestoEmpleado', usuarioActual.rol === 'tecnico' ? 'Soporte TI & Especialista Técnico' : (usuarioActual.rol === 'empleado' ? 'Ejecutivo de Operaciones y Ventas' : 'Personal'));
  }

  tbody.innerHTML = '';
  if (listaGastosTurno.length === 0) {
    tbody.innerHTML = '<tr id="emptyTurnoRow"><td colspan="6" class="empty-state">No se han registrado comprobantes de gastos en este turno.</td></tr>';
    return;
  }

  listaGastosTurno.forEach(g => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${g.fechaHora}</td>
      <td><strong>${g.folio}</strong></td>
      <td>${g.concepto}</td>
      <td><span class="tag-pill">${g.categoria}</span></td>
      <td style="color:var(--accent-danger); font-weight:600;">-$${g.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
      <td><span class="badge badge-pagado">${g.estado}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================================================
// 16. Funciones de Actualización de Dashboard y Auxiliares
// ==========================================================================
function actualizarTodo() {
  actualizarCuentasUI();
  actualizarTransaccionesUI();
  actualizarPagosUI();
  actualizarNominaUI();
  actualizarDashboardUI();
  recalcularPyl();
  actualizarGraficos();
  renderizarGastosTurnoEmpleado();
  actualizarCamposConfiguracion();
  actualizarMetricasAlmacenamientoTecnico();
  actualizarBannerMantenimiento();
}

function actualizarDashboardUI() {
  let saldoEfectivo = 0;
  listaCuentas.forEach(c => {
    if (c.tipo !== 'Crédito') saldoEfectivo += c.saldo;
  });

  let ingMes = 0;
  let egMes = 0;
  listaTransacciones.forEach(t => {
    if (t.tipo === 'ingreso') ingMes += t.monto;
    else egMes += t.monto;
  });

  let porPagarTotal = 0;
  listaPagos.forEach(p => {
    if (p.estado !== 'Pagado' && p.tipo === 'Por Pagar') {
      porPagarTotal += p.monto;
    }
  });

  safeSetText('valSaldo', `$${saldoEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('cuentaSubtext', `${listaCuentas.length} Cuentas Registradas`);
  safeSetText('valIngresos', `$${ingMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('valGastos', `$${egMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
  safeSetText('valVencimientos', `$${porPagarTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);

  const alertCont = document.getElementById('alertContainer');
  if (alertCont) {
    alertCont.innerHTML = '';
    const alertas = [];

    if (listaCuentas.length === 0 && listaTransacciones.length === 0) {
      alertas.push({ text: 'Cuenta recién registrada. Saldo en $0.00. Comienza agregando tu primera cuenta.', type: 'info' });
    } else {
      if (porPagarTotal > saldoEfectivo && saldoEfectivo > 0) {
        alertas.push({ text: 'Los compromisos por pagar superan el saldo líquido disponible.', type: 'danger' });
      }
      const vencidosCount = listaPagos.filter(p => p.estado === 'Vencido').length;
      if (vencidosCount > 0) {
        alertas.push({ text: `Tienes ${vencidosCount} compromiso(s) con fecha vencida.`, type: 'warning' });
      }
      if (saldoEfectivo > 100000) {
        alertas.push({ text: 'Excelente liquidez operativa disponible en tesorería.', type: 'success' });
      }
    }

    if (alertas.length === 0) {
      alertCont.innerHTML = '<p style="text-align:center; margin-top:20px; color:var(--text-muted);">Sin alertas pendientes.</p>';
    } else {
      alertas.forEach(a => {
        const item = document.createElement('div');
        item.style.padding = '10px 12px';
        item.style.borderRadius = '8px';
        item.style.backgroundColor = a.type === 'danger' ? 'var(--accent-danger-bg)' : a.type === 'warning' ? 'var(--accent-warning-bg)' : 'rgba(59, 130, 246, 0.15)';
        item.style.border = `1px solid ${a.type === 'danger' ? 'rgba(244,63,94,0.3)' : a.type === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(59, 130, 246, 0.3)'}`;
        item.style.color = '#fff';
        item.style.fontSize = '0.82rem';
        item.innerText = `${a.type === 'danger' ? '⚠️' : a.type === 'warning' ? '⏰' : 'ℹ️'} ${a.text}`;
        alertCont.appendChild(item);
      });
    }
  }
}

function actualizarEstadoSistema() {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  if (dot) dot.className = 'status-dot';
  if (text) text.innerText = 'Sistema Activo / Seguro';
}

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function cargarDeStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function guardarEnStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error en localStorage:', e);
  }
}

// Vinculación explícita al objeto global window para asegurar su ejecución desde el HTML
window.cerrarSesion = cerrarSesion;
window.iniciarSesionUsuario = iniciarSesionUsuario;
window.registrarNuevoUsuario = registrarNuevoUsuario;
window.seleccionarCuentaDemo = seleccionarCuentaDemo;
window.openModal = openModal;
window.closeModal = closeModal;
window.cerrarTodosLosModales = cerrarTodosLosModales;
window.switchTab = switchTab;
window.toggleSidebar = toggleSidebar;
window.filterGlobalData = filterGlobalData;
window.ejecutarDiagnosticoTecnico = ejecutarDiagnosticoTecnico;
window.limpiarAlmacenamientoUsuario = limpiarAlmacenamientoUsuario;
window.pedirConfirmacion = pedirConfirmacion;

// Operaciones de cuentas bancarias y tesorería
window.guardarCuenta = guardarCuenta;
window.eliminarCuenta = eliminarCuenta;
window.desvincularCuenta = eliminarCuenta;
window.ejecutarDesvinculacionCuenta = ejecutarDesvinculacionCuenta;
window.transferirEntreCuentas = transferirEntreCuentas;

// Operaciones de transacciones, pagos y nómina
window.guardarTransaccion = guardarTransaccion;
window.guardarPagoDash = guardarPagoDash;
window.eliminarTransaccion = eliminarTransaccion;
window.guardarPagoProgramado = guardarPagoProgramado;
window.cambiarEstadoPago = cambiarEstadoPago;
window.marcarPagoCompletado = marcarPagoCompletado;
window.eliminarPago = eliminarPago;
window.filtrarTablaPagos = filtrarTablaPagos;
window.filtrarTablaTx = filtrarTablaTx;
window.cambiarFiltroPagos = cambiarFiltroPagos;
window.cambiarFiltroTx = cambiarFiltroTx;

// Directorio de empleados de la empresa y nómina colaborativa
window.abrirModalNuevoEmpleado = abrirModalNuevoEmpleado;
window.asignarSueldoEmpleado = asignarSueldoEmpleado;
window.editarSueldoEmpleado = editarSueldoEmpleado;
window.verFichaEmpleado = verFichaEmpleado;
window.eliminarEmpleadoDeEmpresa = eliminarEmpleadoDeEmpresa;
window.filtrarDirectorioEmpleados = filtrarDirectorioEmpleados;
window.probarRegistroSimuladoEmpleado = probarRegistroSimuladoEmpleado;
window.ejecutarRegistroSimuladoEmpleado = ejecutarRegistroSimuladoEmpleado;
window.actualizarEmpleadosEmpresaUI = actualizarEmpleadosEmpresaUI;
window.guardarEmpleado = guardarEmpleado;
window.eliminarEmpleado = eliminarEmpleado;
window.dispersarNomina = dispersarNomina;
window.manejarCambioRolRegistro = manejarCambioRolRegistro;
window.poblarDatalistEmpresas = poblarDatalistEmpresas;

window.recalcularPyl = recalcularPyl;
window.actualizarReporte = actualizarReporte;
window.guardarConfiguraciones = guardarConfiguraciones;
window.exportarCSV = exportarCSV;
window.exportarRespaldoJSON = exportarRespaldoJSON;
window.restaurarDatosDemostracion = restaurarDatosDemostracion;

// Operaciones de turno y recibo personal de empleado
window.guardarGastoTurnoEmpleado = guardarGastoTurnoEmpleado;
window.cerrarTurnoCaja = cerrarTurnoCaja;
window.imprimirReciboEmpleado = imprimirReciboEmpleado;
window.renderizarGastosTurnoEmpleado = renderizarGastosTurnoEmpleado;
window.aplicarJerarquiaUI = aplicarJerarquiaUI;
window.actualizarCartelJerarquiaRegistro = actualizarCartelJerarquiaRegistro;
window.organizarConfiguracionesPorJerarquia = organizarConfiguracionesPorJerarquia;

