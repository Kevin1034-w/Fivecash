/* ==========================================================================
   Five Cash - Platform Suite
   Hoja de Estilos Principal (CSS)
   Diseño: Limpio, agradable, descansado a la vista, moderno y minimalista
   ========================================================================== */

:root {
  /* Paleta Corporativa Limpia y Amable (Light Slate Fintech) */
  --bg-app: #f8fafc;              /* Fondo general suave y descansado */
  --bg-dark: #f8fafc;            /* Compatibilidad */
  --bg-sidebar: #ffffff;          /* Barra lateral blanca nítida */
  --bg-card: #ffffff;             /* Tarjetas blancas luminosas */
  --bg-card-hover: #fcfcfd;
  --bg-card-subtle: #f8fafc;      /* Fondos secundarios suaves */
  --bg-input: #ffffff;            /* Controles limpios */
  
  /* Bordes sutiles y elegantes */
  --border-color: #e2e8f0;        /* Slate 200 suave */
  --border-light: #f1f5f9;        /* Divisores internos */
  --border-focus: #3b82f6;        /* Enfoque azul */

  /* Acentos y Semántica Financiera */
  --accent-primary: #2563eb;          /* Azul corporativo moderno */
  --accent-primary-hover: #1d4ed8;
  --accent-primary-subtle: #eff6ff;   /* Azul muy tenue */
  --accent-primary-border: #bfdbfe;

  --accent-success: #059669;          /* Esmeralda suave para ingresos */
  --accent-success-hover: #047857;
  --accent-success-bg: #ecfdf5;
  --accent-success-border: #a7f3d0;

  --accent-danger: #e11d48;           /* Rosa/carmesí suave para egresos */
  --accent-danger-hover: #be123c;
  --accent-danger-bg: #fff1f2;
  --accent-danger-border: #fecdd3;

  --accent-warning: #d97706;          /* Ámbar para pendientes */
  --accent-warning-hover: #b45309;
  --accent-warning-bg: #fffbeb;
  --accent-warning-border: #fde68a;

  --accent-purple: #7c3aed;           /* Púrpura suave para técnico */
  --accent-purple-hover: #6d28d9;
  --accent-purple-bg: #f5f3ff;
  --accent-purple-border: #ddd6fe;

  --accent-cyan: #0284c7;

  /* Tipografía y Contraste */
  --text-main: #0f172a;               /* Slate 900 de máxima nitidez */
  --text-body: #334155;               /* Slate 700 para párrafos y descripciones */
  --text-secondary: #64748b;          /* Slate 500 para metadatos */
  --text-muted: #94a3b8;              /* Slate 400 para placeholders y sutiles */

  /* Dimensiones y Sombras Orgánicas (No pesadas) */
  --sidebar-width: 260px;
  --header-height: 66px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;

  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.03);
  --shadow-modal: 0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06);

  --transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ==========================================================================
   Reset Global y Base
   ========================================================================== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

html, body {
  width: 100%;
  height: 100vh;
  background-color: var(--bg-app);
  color: var(--text-main);
  overflow: hidden;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Layout General */
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-app);
}

/* --------------------------------------------------------------------------
   Barra Lateral (Sidebar)
   -------------------------------------------------------------------------- */
aside.sidebar {
  width: var(--sidebar-width);
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  flex-shrink: 0;
  user-select: none;
  z-index: 50;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02);
}

.brand-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 0 6px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--text-main);
}

.brand-icon {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.brand-info h2 {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-main);
  line-height: 1.1;
}

.brand-info span {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 2px;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}
.sidebar-nav::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: var(--radius-full);
}

.nav-section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  padding: 10px 10px 4px;
}

.menu-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-body);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
  border: 1px solid transparent;
}

.menu-item .item-icon {
  font-size: 1.1rem;
  opacity: 0.85;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
}

.menu-item:hover {
  background-color: #f1f5f9;
  color: var(--text-main);
}

.menu-item.active {
  background-color: #eff6ff;
  color: var(--accent-primary);
  font-weight: 600;
  border-color: #dbeafe;
}

.menu-item.active .item-icon {
  opacity: 1;
}

/* Sidebar Footer & Perfil */
.sidebar-footer {
  padding-top: 14px;
  margin-top: 12px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.backend-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  background-color: #f8fafc;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--accent-success);
  display: inline-block;
  margin-right: 6px;
  box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
}

.status-dot.local-mode {
  background-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.user-mini-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background-color: #f8fafc;
  border: 1px solid var(--border-color);
  transition: var(--transition);
}

.user-mini-card:hover {
  background-color: #f1f5f9;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.7rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --------------------------------------------------------------------------
   Área Principal de Contenido (Main Wrapper)
   -------------------------------------------------------------------------- */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-app);
}

/* Cabecera Superior (Topbar) */
.topbar {
  height: var(--header-height);
  background-color: #ffffff;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  flex-shrink: 0;
  z-index: 40;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle-btn {
  display: none;
  background: #f8fafc;
  border: 1px solid var(--border-color);
  color: var(--text-main);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
}

.header-workspace-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.workspace-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-primary);
  background-color: var(--accent-primary-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--accent-primary-border);
}

.workspace-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.company-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.company-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-main);
}

.company-sub {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  background-color: #ffffff;
  border: 1px solid var(--border-color);
  color: var(--accent-danger);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn-logout:hover {
  background-color: var(--accent-danger-bg);
  border-color: var(--accent-danger-border);
}

/* Contenido de Pestañas */
.tab-content {
  display: none;
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  background-color: var(--bg-app);
}

.tab-content.active-tab {
  display: block;
}

.tab-content::-webkit-scrollbar {
  width: 6px;
}
.tab-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: var(--radius-full);
}

/* Encabezados de Sección */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title h1 {
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-main);
  margin-bottom: 3px;
}

.header-title p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* --------------------------------------------------------------------------
   Botones
   -------------------------------------------------------------------------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition);
  text-decoration: none;
  line-height: 1.3;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background-color: var(--accent-primary);
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
}

.btn-primary:hover {
  background-color: var(--accent-primary-hover);
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
}

.btn-secondary {
  background-color: #ffffff;
  border-color: var(--border-color);
  color: var(--text-main);
  box-shadow: var(--shadow-xs);
}

.btn-secondary:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.btn-success {
  background-color: var(--accent-success);
  color: #ffffff;
}

.btn-success:hover {
  background-color: var(--accent-success-hover);
}

.btn-danger {
  background-color: var(--accent-danger);
  color: #ffffff;
}

.btn-danger:hover {
  background-color: var(--accent-danger-hover);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.btn-icon-only {
  padding: 6px 8px;
}

/* --------------------------------------------------------------------------
   Tarjetas (Cards)
   -------------------------------------------------------------------------- */
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 22px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
  transition: var(--transition);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.tag-pill {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background-color: #f1f5f9;
  color: var(--text-secondary);
}

/* Rejilla de Métricas */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.metric-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  transition: var(--transition);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: #cbd5e1;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.metric-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.metric-icon-badge {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background-color: #f1f5f9;
}

.metric-value {
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
  margin-bottom: 4px;
}

.metric-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.metric-footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border-light);
  font-size: 0.72rem;
  color: var(--text-secondary);
}

/* Grillas Compuestas */
.dashboard-grid-charts {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.dashboard-grid-bottom {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 270px;
}

/* --------------------------------------------------------------------------
   Tablas Limpias y Legibles
   -------------------------------------------------------------------------- */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: #ffffff;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

thead {
  background-color: #f8fafc;
  border-bottom: 1px solid var(--border-color);
}

th {
  padding: 12px 16px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: var(--text-body);
  vertical-align: middle;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background-color: #f8fafc;
}

.table-concept {
  font-weight: 600;
  color: var(--text-main);
}

.table-subconcept {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.row-total {
  font-weight: 700;
  background-color: #f8fafc;
  color: var(--text-main);
  border-top: 2px solid var(--border-color);
}

.empty-state {
  padding: 36px 20px;
  text-align: center;
  color: var(--text-secondary);
}

/* --------------------------------------------------------------------------
   Insignias (Badges) Suaves y Elegantes
   -------------------------------------------------------------------------- */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
}

.badge-ingreso, .badge-pagado {
  background-color: var(--accent-success-bg);
  color: var(--accent-success);
  border: 1px solid var(--accent-success-border);
}

.badge-egreso, .badge-vencido {
  background-color: var(--accent-danger-bg);
  color: var(--accent-danger);
  border: 1px solid var(--accent-danger-border);
}

.badge-pendiente {
  background-color: var(--accent-warning-bg);
  color: var(--accent-warning);
  border: 1px solid var(--accent-warning-border);
}

.badge-transferencia {
  background-color: var(--accent-primary-subtle);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary-border);
}

/* --------------------------------------------------------------------------
   Controles, Formularios e Inputs
   -------------------------------------------------------------------------- */
.controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-select, .form-control {
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  color: var(--text-main);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  outline: none;
  transition: var(--transition);
}

.filter-select:focus, .form-control:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-control::placeholder {
  color: var(--text-muted);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-body);
}

/* --------------------------------------------------------------------------
   Módulo de Cuentas Bancarias
   -------------------------------------------------------------------------- */
.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.account-card {
  background-color: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  transition: var(--transition);
}

.account-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: #cbd5e1;
}

.account-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.account-bank-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
}

.account-balance-amount {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.account-number {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: monospace;
}

.account-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
}

/* --------------------------------------------------------------------------
   Informes y KPIs
   -------------------------------------------------------------------------- */
.reports-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.sim-input {
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  color: var(--text-main);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  outline: none;
}

.sim-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.kpi-stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.kpi-stat-item:last-child {
  border-bottom: none;
}

.kpi-stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.kpi-stat-val {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
}

/* --------------------------------------------------------------------------
   Código y Consolas de Diagnóstico
   -------------------------------------------------------------------------- */
.php-code-box {
  background-color: #0f172a;
  color: #e2e8f0;
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  overflow-x: auto;
  border: 1px solid #334155;
}

.file-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  font-size: 0.75rem;
  color: var(--text-body);
  font-family: monospace;
}

.tech-diagnostic-card {
  background-color: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 16px;
}

.tech-diagnostic-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tech-console-log {
  background-color: #0f172a;
  color: #38bdf8;
  border-radius: var(--radius-sm);
  padding: 12px;
  font-family: monospace;
  font-size: 0.78rem;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
}

/* --------------------------------------------------------------------------
   Modales (Ventanas Emergentes)
   -------------------------------------------------------------------------- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal-overlay.active-modal {
  display: flex;
}

.modal-card {
  background-color: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 520px;
  box-shadow: var(--shadow-modal);
  overflow: hidden;
  animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-card.modal-lg {
  max-width: 720px;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
}

.modal-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.4rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.modal-close-btn:hover {
  background-color: #f1f5f9;
  color: var(--text-main);
}

.modal-body {
  padding: 22px 24px;
  max-height: 75vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  background-color: #f8fafc;
}

/* --------------------------------------------------------------------------
   Alertas Toast
   -------------------------------------------------------------------------- */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 200;
  max-width: 360px;
  pointer-events: none;
}

.toast {
  background-color: #ffffff;
  color: var(--text-main);
  border: 1px solid var(--border-color);
  border-left-width: 4px;
  border-left-color: var(--accent-primary);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  box-shadow: var(--shadow-lg);
  font-size: 0.85rem;
  font-weight: 500;
  pointer-events: auto;
  animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast.toast-success { border-left-color: var(--accent-success); }
.toast.toast-danger { border-left-color: var(--accent-danger); }
.toast.toast-warning { border-left-color: var(--accent-warning); }
.toast.toast-info { border-left-color: var(--accent-primary); }

/* ==========================================================================
   Sistema de Jerarquías y Roles (RBAC) - Visualmente Limpio y Amable
   ========================================================================== */
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.role-badge.role-administradora {
  background-color: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.role-badge.role-empleado {
  background-color: #fefce8;
  color: #a16207;
  border: 1px solid #fef08a;
}

.role-badge.role-tecnico {
  background-color: #f5f3ff;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
}

/* Barra Informativa de Jerarquía */
.hierarchy-banner {
  border-radius: var(--radius-md);
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 14px;
  box-shadow: var(--shadow-xs);
}

.hierarchy-banner.banner-admin {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
}

.hierarchy-banner.banner-empleado {
  background-color: #fefce8;
  border: 1px solid #fef08a;
  color: #713f12;
}

.hierarchy-banner.banner-tecnico {
  background-color: #f5f3ff;
  border: 1px solid #ddd6fe;
  color: #4c1d95;
}

.hierarchy-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hierarchy-desc {
  font-size: 0.8rem;
  opacity: 0.9;
  margin-top: 1px;
}

.nav-role-pill {
  margin-left: auto;
  font-size: 0.68rem;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.nav-role-pill.admin-pill {
  background-color: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.nav-role-pill.employee-pill {
  background-color: #fefce8;
  color: #ca8a04;
  border: 1px solid #fef08a;
}

.nav-role-pill.tech-pill {
  background-color: #f5f3ff;
  color: #7c3aed;
  border: 1px solid #ddd6fe;
}

/* Pantalla de bloqueo por jerarquía */
.role-lock-screen {
  background-color: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 40px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);
}

.role-lock-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.role-lock-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 6px;
}

.role-lock-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  max-width: 500px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.role-lock-badge-detail {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background-color: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

/* Selector Visual de Rol en Registro */
.role-selector-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 6px;
}

.role-option-card {
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 12px 10px;
  text-align: center;
  cursor: pointer;
  background-color: #ffffff;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.role-option-card:hover {
  border-color: #cbd5e1;
  background-color: #f8fafc;
}

.role-option-card.selected {
  border-color: var(--accent-primary);
  background-color: var(--accent-primary-subtle);
}

.role-option-icon {
  font-size: 1.4rem;
}

.role-option-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-main);
}

.role-option-sub {
  font-size: 0.68rem;
  color: var(--text-secondary);
}

/* Tarjetas de Turno de Empleado y Recibo */
.employee-receipt-box {
  background-color: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.employee-receipt-watermark {
  position: absolute;
  right: -10px;
  bottom: -10px;
  font-size: 6rem;
  opacity: 0.04;
  user-select: none;
  pointer-events: none;
}

/* Directorio de Empleados */
.emp-table-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.emp-table-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #eff6ff;
  color: var(--accent-primary);
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
}

.emp-badge-new {
  font-size: 0.68rem;
  padding: 2px 6px;
  background-color: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-full);
}

.emp-badge-app {
  font-size: 0.68rem;
  padding: 2px 6px;
  background-color: #f8fafc;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
}

.emp-badge-payroll {
  font-size: 0.68rem;
  padding: 2px 6px;
  background-color: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  border-radius: var(--radius-full);
}

.emp-badge-admin {
  background-color: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.emp-badge-tech {
  background-color: #f5f3ff;
  color: #7c3aed;
  border: 1px solid #ddd6fe;
}

/* Visibilidad de Sesión */
body.user-logged-out .auth-only-logged-in {
  display: none !important;
}

body.user-logged-in .auth-only-logged-out {
  display: none !important;
}

/* --------------------------------------------------------------------------
   Responsive (Adaptabilidad Móvil)
   -------------------------------------------------------------------------- */
@media (max-width: 1024px) {
  .dashboard-grid-charts,
  .dashboard-grid-bottom {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .menu-toggle-btn {
    display: block;
  }

  aside.sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    box-shadow: var(--shadow-lg);
  }

  aside.sidebar.sidebar-open {
    transform: translateX(0);
  }

  .tab-content {
    padding: 16px;
  }

  .topbar {
    padding: 0 16px;
  }

  .role-selector-grid {
    grid-template-columns: 1fr;
  }
}
