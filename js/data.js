// Datos del TP Integrador Grupo 3 (MisioTIC S.A.)
// Coordenadas tomadas de las láminas P2-01/02/03 (escala 1:100).
// En las láminas el edificio va de x=170 a 1110 px (15 m) y de y=201 a 1767 px (25 m).

export const B = {
  W: 15,            // ancho de planta (m)
  L: 25,            // largo de planta (m)
  H: 3.4,           // losa a losa
  SLAB: 0.2,        // espesor de losa
  CEIL: 2.6,        // cielorraso suspendido
  TRAY: 2.8,        // bandeja portacables
  TRAY_X: 9.8,      // eje de la bandeja troncal
  RISER: { x: 2.2, z: 17.6 }, // montante M
};

export const px = (x) => +((x - 170) / 62.67).toFixed(2);
export const pz = (y) => +((y - 201) / 62.64).toFixed(2);

export const SECTIONS = {
  // Piso 1
  AC: { name: 'Atención al Cliente', color: '#3b82f6' },
  AO: { name: 'Administración y Operaciones (Ayuda Online)', color: '#8b5cf6' },
  GV: { name: 'Gerencia de Ventas', color: '#ec4899' },
  GA: { name: 'Gerencia de Atención al Cliente', color: '#f43f5e' },
  AX1: { name: 'Auxiliares Piso 1', color: '#14b8a6' },
  RE: { name: 'Reuniones / Recepción', color: '#f59e0b' },
  // Piso 2
  SH: { name: 'Show Room', color: '#eab308' },
  GC: { name: 'Gestión de Calidad / Gerencia Comercial', color: '#ec4899' },
  DE: { name: 'Depósito / Desarrollo', color: '#64748b' },
  LP: { name: 'Laboratorio de Pruebas / Producción', color: '#10b981' },
  CE: { name: 'Comercio Exterior / Control Entrega', color: '#6366f1' },
  // Piso 3
  ID: { name: 'Investigación y Desarrollo', color: '#06b6d4' },
  AD: { name: 'Administrador y Auxiliar', color: '#f59e0b' },
  GS: { name: 'Gerencia de Sucursales', color: '#f43f5e' },
  GG: { name: 'Gerencia General', color: '#ec4899' },
  DI: { name: 'Directorio', color: '#a855f7' },
  AX3: { name: 'Auxiliares Piso 3', color: '#14b8a6' },
  SI: { name: 'Área de Sistemas', color: '#22c55e' },
};

// Filas de puestos: s = sección, y = fila (px), xs = puestos (px),
// col = índice del puesto con columna de servicio, g = índices de puestos de crecimiento (+30 %)
export const FLOORS = [
  {
    n: 1, name: 'Primer Piso', rack: 'R01', ppPorts: 20,
    room: { id: 'TC01', label: 'TC01 / IDF01 · 6,60 m²', x0: px(314), x1: px(502), z0: pz(1065), z1: pz(1203), color: '#2563eb' },
    tray: { z0: pz(276), z1: pz(1672) },
    order: ['AC', 'AO', 'GV', 'GA', 'AX1', 'RE'],
    rows: [
      { s: 'GV', y: 326, xs: [232, 326, 420], col: 2, g: [2] },
      { s: 'AX1', y: 276, xs: [514, 596, 677, 759], col: 3, g: [] },
      { s: 'AX1', y: 401, xs: [514, 596, 677, 759], col: 3, g: [2, 3] },
      { s: 'RE', y: 389, xs: [909, 1015], col: 0, g: [] },
      { s: 'RE', y: 545, xs: [909, 1015], col: 0, g: [1] },
      { s: 'AO', y: 514, xs: [545, 621, 696], col: 2, g: [] },
      { s: 'AO', y: 608, xs: [545, 621, 696], col: 2, g: [] },
      { s: 'AO', y: 702, xs: [545, 621, 696], col: 2, g: [] },
      { s: 'AO', y: 796, xs: [545, 621, 696], col: 2, g: [] },
      { s: 'AO', y: 890, xs: [545, 621, 696], col: 2, g: [] },
      { s: 'AO', y: 984, xs: [545, 621, 696], col: 2, g: [1, 2] },
      { s: 'AO', y: 1078, xs: [545, 621, 696], col: 2, g: [0, 1, 2] },
      { s: 'GA', y: 796, xs: [890, 968, 1047], col: 0, g: [2] },
      { s: 'AC', y: 1422, xs: [389, 514, 640, 765], col: 3, g: [] },
      { s: 'AC', y: 1547, xs: [389, 514, 640, 765], col: 3, g: [] },
      { s: 'AC', y: 1672, xs: [389, 514, 640], col: 2, g: [0, 1, 2] },
    ],
  },
  {
    n: 2, name: 'Segundo Piso', rack: 'R02', ppPorts: 21,
    room: { id: 'TC02', label: 'TC02 / IDF02 · 6,60 m²', x0: px(508), x1: px(696), z0: pz(1090), z1: pz(1228), color: '#2563eb' },
    tray: { z0: pz(295), z1: pz(1672) },
    order: ['SH', 'GC', 'DE', 'LP', 'CE'],
    rows: [
      { s: 'DE', y: 295, xs: [264, 420, 577], col: 2, g: [] },
      { s: 'DE', y: 451, xs: [264, 420, 577], col: 2, g: [1, 2] },
      { s: 'GC', y: 295, xs: [809, 922, 1034], col: 0, g: [] },
      { s: 'GC', y: 451, xs: [809, 922, 1034], col: 0, g: [1, 2] },
      { s: 'LP', y: 639, xs: [226, 295, 364, 433], col: 3, g: [] },
      { s: 'LP', y: 796, xs: [226, 295, 364, 433], col: 3, g: [] },
      { s: 'LP', y: 953, xs: [226, 295, 364, 433], col: 3, g: [] },
      { s: 'LP', y: 1109, xs: [226, 295, 364, 433], col: 3, g: [0, 1, 2, 3] },
      { s: 'CE', y: 671, xs: [909, 1028], col: 0, g: [] },
      { s: 'CE', y: 796, xs: [909, 1028], col: 0, g: [] },
      { s: 'CE', y: 921, xs: [909, 1028], col: 0, g: [] },
      { s: 'CE', y: 1047, xs: [909, 1028], col: 0, g: [0, 1] },
      { s: 'SH', y: 1422, xs: [389, 514, 640, 765], col: 3, g: [], single: true },
      { s: 'SH', y: 1547, xs: [389, 514, 640, 765], col: 3, g: [], single: true },
      { s: 'SH', y: 1672, xs: [389, 514, 640, 765], col: 3, g: [], single: true },
    ],
  },
  {
    n: 3, name: 'Tercer Piso', rack: 'R03', ppPorts: 24,
    room: { id: 'ER03', label: 'ER03 / MDF03 · Sala de Equipos · 13,69 m²', x0: px(514), x1: px(746), z0: pz(953), z1: pz(1184), color: '#16a34a' },
    tray: { z0: pz(326), z1: pz(1692) },
    order: ['ID', 'AD', 'GS', 'GG', 'DI', 'AX3', 'SI'],
    rows: [
      { s: 'GG', y: 326, xs: [232, 314, 396], col: 2, g: [2] },
      { s: 'GS', y: 326, xs: [495, 590, 684], col: 2, g: [2] },
      { s: 'DI', y: 420, xs: [859, 953, 1047], col: 0, g: [2] },
      { s: 'AX3', y: 608, xs: [220, 289, 358, 427], col: 3, g: [] },
      { s: 'AX3', y: 702, xs: [220, 289, 358, 427], col: 3, g: [] },
      { s: 'AX3', y: 796, xs: [220, 289, 358], col: 2, g: [0, 1, 2] },
      { s: 'AD', y: 765, xs: [890, 965, 1040], col: 0, g: [2] },
      { s: 'SI', y: 909, xs: [220, 289, 358, 427], col: 3, g: [] },
      { s: 'SI', y: 1003, xs: [220, 289, 358, 427], col: 3, g: [] },
      { s: 'SI', y: 1097, xs: [220, 289, 358, 427], col: 3, g: [] },
      { s: 'SI', y: 1191, xs: [220, 289, 358, 427], col: 3, g: [0, 1, 2, 3] },
      { s: 'ID', y: 1416, xs: [358, 458, 558, 658, 759, 859, 959], col: 4, g: [] },
      { s: 'ID', y: 1554, xs: [358, 458, 558, 658, 759, 859, 959], col: 4, g: [] },
      { s: 'ID', y: 1692, xs: [358, 458, 558, 658, 759, 859, 959], col: 4, g: [2, 3, 4, 5, 6] },
    ],
  },
];

// Unidades de rack (Anexo C). [U inferior, alto en U, tipo, id, descripción]
export const RACKS = {
  R01: {
    floor: 1, x: px(408), z: pz(1135), room: 'TC01',
    title: 'Rack R01 · TC01 (Piso 1)',
    load: '3× CRS354 + ODF + ventilación · 200 W (260 W con +30 %)',
    units: [
      [24, 1, 'ODF', 'R01-ODF01', 'ODF Panduit FRE1UBL · 12 FO OM3 (BB01)'],
      [22, 1, 'PP', 'R01-PP01', 'Patchera Panduit DP24688TGY · P1-C001..020'],
      [21, 1, 'ORG', 'R01-ORG01', 'Organizador horizontal 1U'],
      [20, 1, 'PP', 'R01-PP02', 'Patchera Panduit DP24688TGY · P1-C021..040'],
      [19, 1, 'ORG', 'R01-ORG02', 'Organizador horizontal 1U'],
      [18, 1, 'SW', 'R01-SW01', 'MikroTik CRS354-48G-4S+2Q+RM · eth1..40 → PP01/02 · SFP+1 → FO02'],
      [17, 1, 'PP', 'R01-PP03', 'Patchera Panduit DP24688TGY · P1-C041..060'],
      [16, 1, 'ORG', 'R01-ORG03', 'Organizador horizontal 1U'],
      [15, 1, 'PP', 'R01-PP04', 'Patchera Panduit DP24688TGY · P1-C061..080'],
      [14, 1, 'ORG', 'R01-ORG04', 'Organizador horizontal 1U'],
      [13, 1, 'SW', 'R01-SW02', 'MikroTik CRS354-48G-4S+2Q+RM · eth1..40 → PP03/04 · SFP+1 → FO04'],
      [12, 1, 'PP', 'R01-PP05', 'Patchera Panduit DP24688TGY · P1-C081..100'],
      [11, 1, 'ORG', 'R01-ORG05', 'Organizador horizontal 1U'],
      [10, 1, 'SW', 'R01-SW03', 'MikroTik CRS354-48G-4S+2Q+RM · eth1..20 → PP05 · SFP+1 → FO06'],
      [4, 1, 'PDU', 'R01-PDU01', 'PDU 1U · 12 salidas IEC C13 · entrada C14 10 A'],
      [1, 2, 'UPS', 'R01-UPS01', 'APC Smart-UPS SMT1500RMI2U · 1500 VA / 1000 W'],
    ],
  },
  R02: {
    floor: 2, x: px(602), z: pz(1160), room: 'TC02',
    title: 'Rack R02 · TC02 (Piso 2)',
    load: '2× CRS354 + ODF + ventilación · 140 W (182 W con +30 %)',
    units: [
      [24, 1, 'ODF', 'R02-ODF02', 'ODF Panduit FRE1UBL · 12 FO OM3 (BB02)'],
      [22, 1, 'PP', 'R02-PP01', 'Patchera Panduit DP24688TGY · P2-C001..021'],
      [21, 1, 'ORG', 'R02-ORG01', 'Organizador horizontal 1U'],
      [20, 1, 'PP', 'R02-PP02', 'Patchera Panduit DP24688TGY · P2-C022..042'],
      [19, 1, 'ORG', 'R02-ORG02', 'Organizador horizontal 1U'],
      [18, 1, 'SW', 'R02-SW01', 'MikroTik CRS354-48G-4S+2Q+RM · PP01/02 · SFP+1 → BB02 F01/F02'],
      [17, 1, 'PP', 'R02-PP03', 'Patchera Panduit DP24688TGY · P2-C043..063'],
      [16, 1, 'ORG', 'R02-ORG03', 'Organizador horizontal 1U'],
      [15, 1, 'PP', 'R02-PP04', 'Patchera Panduit DP24688TGY · P2-C064..084'],
      [14, 1, 'ORG', 'R02-ORG04', 'Organizador horizontal 1U'],
      [13, 1, 'SW', 'R02-SW02', 'MikroTik CRS354-48G-4S+2Q+RM · PP03/04 · SFP+1 → BB02 F03/F04'],
      [4, 1, 'PDU', 'R02-PDU01', 'PDU 1U · 12 salidas IEC C13'],
      [1, 2, 'UPS', 'R02-UPS01', 'APC Smart-UPS SMT1500RMI2U · 1500 VA / 1000 W'],
    ],
  },
  R03: {
    floor: 3, x: px(571), z: pz(1068), room: 'ER03',
    title: 'Rack R03 · ER03/MDF03 Core (Piso 3)',
    load: 'SW-CORE + 3× CRS354 + RT01 + ventilación · 277 W (360 W con +30 %)',
    units: [
      [24, 1, 'ODF', 'R03-ODF03', 'ODF Panduit FRE1UBL · 24 FO OM3 (BB01 + BB02)'],
      [23, 1, 'CORE', 'SW-CORE', 'MikroTik CRS317-1G-16S+RM · 16× SFP+ 10G · núcleo L3'],
      [22, 1, 'PP', 'R03-PP01', 'Patchera Panduit DP24688TGY · P3-C001..024'],
      [21, 1, 'ORG', 'R03-ORG01', 'Organizador horizontal 1U'],
      [20, 1, 'PP', 'R03-PP02', 'Patchera Panduit DP24688TGY · P3-C025..048'],
      [19, 1, 'ORG', 'R03-ORG02', 'Organizador horizontal 1U'],
      [18, 1, 'SW', 'R03-SW01', 'MikroTik CRS354-48G-4S+2Q+RM · PP01/02 · DAC01 → SW-CORE'],
      [17, 1, 'PP', 'R03-PP03', 'Patchera Panduit DP24688TGY · P3-C049..072'],
      [16, 1, 'ORG', 'R03-ORG03', 'Organizador horizontal 1U'],
      [15, 1, 'PP', 'R03-PP04', 'Patchera Panduit DP24688TGY · P3-C073..096'],
      [14, 1, 'ORG', 'R03-ORG04', 'Organizador horizontal 1U'],
      [13, 1, 'SW', 'R03-SW02', 'MikroTik CRS354-48G-4S+2Q+RM · PP03/04 · DAC02 → SW-CORE'],
      [12, 1, 'PP', 'R03-PP05', 'Patchera Panduit DP24688TGY · P3-C097..120'],
      [11, 1, 'ORG', 'R03-ORG05', 'Organizador horizontal 1U'],
      [10, 1, 'SW', 'R03-SW03', 'MikroTik CRS354-48G-4S+2Q+RM · PP05 · DAC03 → SW-CORE'],
      [9, 1, 'RT', 'RT01', 'Router de borde MikroTik RB4011iGS+RM · ether1 WAN01 · ether2 → SV05'],
      [4, 1, 'PDU', 'R03-PDU01', 'PDU 1U · 12 salidas IEC C13'],
      [1, 2, 'UPS', 'R03-UPS01', 'APC Smart-UPS SMT1500RMI2U · 1500 VA / 1000 W'],
    ],
  },
  R04: {
    floor: 3, x: px(678), z: pz(1068), room: 'ER03',
    title: 'Rack R04 · Granja de Servidores (Piso 3)',
    load: '5 servidores (250 W c/u) + SW-SRV + ventilación · 1.294 W (1.682 W con +30 %)',
    units: [
      [23, 1, 'SRV', 'SW-SRV', 'MikroTik CRS326-24G-2S+RM · DAC04 → SW-CORE SFP+9'],
      [22, 1, 'ORG', 'R04-ORG01', 'Organizador horizontal 1U'],
      [13, 2, 'SV', 'SV05', 'Firewall / Proxy-Cache · WAN dedicada a RT01 + LAN a SW-SRV'],
      [11, 2, 'SV', 'SV04', 'Servidor DNS'],
      [9, 2, 'SV', 'SV03', 'Servidor Web'],
      [7, 2, 'SV', 'SV02', 'Servidor de Correo'],
      [5, 2, 'SV', 'SV01', 'Servidor de Archivos'],
      [4, 1, 'PDU', 'R04-PDU01', 'PDU 1U · 12 salidas IEC C13'],
      [1, 2, 'UPS', 'R04-UPS01', 'APC Smart-UPS SMT3000RMI2U · 3000 VA / 2700 W'],
    ],
  },
};

export const CORE_PORTS = [
  ['SFP+ 1', 'R01-SW01 (Piso 1)', 'Fibra OM3 · BB01 F01-02'],
  ['SFP+ 2', 'R01-SW02 (Piso 1)', 'Fibra OM3 · BB01 F03-04'],
  ['SFP+ 3', 'R01-SW03 (Piso 1)', 'Fibra OM3 · BB01 F05-06'],
  ['SFP+ 4', 'R02-SW01 (Piso 2)', 'Fibra OM3 · BB02 F01-02'],
  ['SFP+ 5', 'R02-SW02 (Piso 2)', 'Fibra OM3 · BB02 F03-04'],
  ['SFP+ 6', 'R03-SW01 (Piso 3)', 'DAC01 3 m'],
  ['SFP+ 7', 'R03-SW02 (Piso 3)', 'DAC02 3 m'],
  ['SFP+ 8', 'R03-SW03 (Piso 3)', 'DAC03 3 m'],
  ['SFP+ 9', 'SW-SRV (R04)', 'DAC04 3 m'],
  ['SFP+ 10..16', 'Reserva', 'Crecimiento'],
];

export const BACKBONE = {
  BB01: { color: '#f97316', title: 'BB01 · Fibra OM3 12 hilos', desc: 'MDF03 (R03) → TC01 (R01) · 30 m (23,65 m físicos + 6 m de reserva). 3 uplinks 10GBASE-SR (F01..F06) + 3 pares de reserva.' },
  BB02: { color: '#eab308', title: 'BB02 · Fibra OM3 12 hilos', desc: 'MDF03 (R03) → TC02 (R02) · 29 m (22,95 m físicos + 6 m de reserva). 2 uplinks 10GBASE-SR (F01..F04) + 4 pares de reserva.' },
  WAN01: { color: '#c2410c', title: 'WAN01 · U/UTP Cat 6', desc: 'EF01 (Piso 1) → ER03 · 20 m. ISP → EF01 → RB4011 ether1 → ether2 → SV05 Firewall → SW-SRV → SW-CORE.' },
  DAC04: { color: '#8b5cf6', title: 'DAC04 · Direct Attach 10G 3 m', desc: 'SW-CORE SFP+9 ↔ SW-SRV (granja de servidores R04).' },
};
