// Idioma de la página (español / inglés).
// Los textos de la escena y del panel usan tr(es, en); los del HTML usan data-i18n con la tabla UI.

const KEY = 'maqueta-lang';

function initial() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'es' || q === 'en') return q;
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'es' || v === 'en') return v;
  } catch (e) { /* almacenamiento bloqueado */ }
  return 'es';
}

export let lang = initial();

export function setLang(l) {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch (e) { /* almacenamiento bloqueado */ }
}

export const tr = (es, en) => (lang === 'en' ? en : es);

// Números con separador decimal según el idioma (6,60 / 6.60).
export const num = (n, digits = 2) => n.toLocaleString(lang === 'en' ? 'en-US' : 'es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const UI = {
  es: {
    docTitle: 'Maqueta MisioTIC',
    docDesc: 'Maqueta 3D del proyecto de cableado estructurado de MisioTIC S.A. · Taller de Redes 2026 · Grupo 3',
    eyebrow: 'Taller de Redes · TP Integrador 2026 · Grupo 3',
    h1: 'MisioTIC S.A. · Cableado estructurado',
    sub: '3 plantas de 15 × 25 m · 146 puestos · 304 enlaces Cat 6 · backbone OM3 10G',
    langBtn: 'EN',
    langAria: 'Cambiar el idioma a inglés',
    menuAria: 'Mostrar u ocultar controles',
    closeAria: 'Cerrar',
    views: 'Vistas',
    vGeneral: 'General',
    vF1: 'Piso 1',
    vF2: 'Piso 2',
    vF3: 'Piso 3',
    vCorte: 'Corte / montante',
    vTop: 'Planta',
    racks: 'Racks',
    rR03: 'R03 Core',
    rR04: 'R04 Servidores',
    explode: 'Separar pisos',
    layers: 'Capas',
    lFacade: 'Fachada y estructura',
    lCeiling: 'Cielorraso (+2,60 m)',
    lFurniture: 'Mobiliario',
    lZones: 'Zonas por sección',
    lPaths: 'Canalizaciones',
    lBackbone: 'Backbone y WAN',
    lLabels: 'Etiquetas',
    lTraffic: 'Tráfico animado',
    hint: 'Arrastre para rotar, use la rueda para acercar o alejar y el clic derecho para desplazar. Haga clic en un puesto, un rack, un equipo o un cable troncal para ver su detalle: el recorrido del cable se ilumina para que pueda seguirlo.',
    gTray: 'Bandeja 200×50',
    gConduit: 'Conduit Ø50',
    gColumn: 'Columna / cablecanal',
    gBB01: 'BB01 OM3',
    gBB02: 'BB02 OM3',
    gWan: 'WAN01',
    gInitial: 'Puesto inicial',
    gGrowth: 'Crecimiento +30 %',
    loading: 'Cargando maqueta…',
    uiHide: 'Ocultar paneles',
    uiShow: 'Mostrar paneles',
    uiAria: 'Ocultar los paneles (tecla H)',
    uiAriaShow: 'Mostrar los paneles (tecla H)',
  },
  en: {
    docTitle: 'MisioTIC Model',
    docDesc: '3D model of the MisioTIC S.A. structured cabling project · Networks Workshop 2026 · Group 3',
    eyebrow: 'Networks Workshop · Final Project 2026 · Group 3',
    h1: 'MisioTIC S.A. · Structured cabling',
    sub: '3 floors of 15 × 25 m · 146 workstations · 304 Cat 6 links · 10G OM3 backbone',
    langBtn: 'ES',
    langAria: 'Switch the language to Spanish',
    menuAria: 'Show or hide controls',
    closeAria: 'Close',
    views: 'Views',
    vGeneral: 'Overview',
    vF1: 'Floor 1',
    vF2: 'Floor 2',
    vF3: 'Floor 3',
    vCorte: 'Section / riser',
    vTop: 'Plan',
    racks: 'Racks',
    rR03: 'R03 Core',
    rR04: 'R04 Servers',
    explode: 'Separate floors',
    layers: 'Layers',
    lFacade: 'Facade and structure',
    lCeiling: 'Suspended ceiling (+2.60 m)',
    lFurniture: 'Furniture',
    lZones: 'Zones by department',
    lPaths: 'Cable pathways',
    lBackbone: 'Backbone and WAN',
    lLabels: 'Labels',
    lTraffic: 'Animated traffic',
    hint: 'Drag to rotate, use the wheel to zoom and right-click to pan. Click a workstation, a rack, a device or a backbone cable to see its details: the cable route lights up so you can follow it.',
    gTray: 'Tray 200×50',
    gConduit: 'Conduit Ø50',
    gColumn: 'Service pole / raceway',
    gBB01: 'BB01 OM3',
    gBB02: 'BB02 OM3',
    gWan: 'WAN01',
    gInitial: 'Initial workstation',
    gGrowth: 'Growth +30 %',
    loading: 'Loading model…',
    uiHide: 'Hide panels',
    uiShow: 'Show panels',
    uiAria: 'Hide the panels (H key)',
    uiAriaShow: 'Show the panels (H key)',
  },
};

// Aplica los textos fijos del HTML.
export function applyStatic() {
  const T = UI[lang];
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  document.querySelector('meta[name=description]')?.setAttribute('content', T.docDesc);
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = T[el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', T[el.dataset.i18nAria]); });
}
