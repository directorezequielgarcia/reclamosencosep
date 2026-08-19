// Datos digitalizados del Pliego de Licitación "Servicio de Higiene Urbana de
// la Ciudad de Comodoro Rivadavia" (Resolución 0752/2025) y su Contrato de
// adjudicación a CLEAR URBANA S.A. (Resolución 0370/2026), más las fichas de
// recorrido de Barrido Manual/Mecánico/Guardia aportadas por el Ente.
//
// Fuente y alcance (MVP — ver decisión del 2026-08-19):
// - Recolección domiciliaria (Anexo 1 del pliego): digitalización COMPLETA,
//   ambas zonas (Norte/Sur) y ambos turnos (Diurno/Nocturno). La mayoría de
//   los núcleos tiene nombre de barrio impreso en el propio mapa.
// - Barrido y limpieza de calles (Anexo 2 + fichas de recorrido): el servicio
//   es por CALLE, no por barrio completo (el contrato solo cubre calles y
//   pasajes pavimentados — Cap. II del ETP). Zona Sur está confirmada al 100%
//   (recorridos 001 a 069, con día exacto). Zona Norte solo llegó a
//   digitalizarse a nivel de sector (BIS001 a BIS020, frecuencia 2x/semana)
//   SIN el día exacto — el pliego no lo imprime en el mapa y no se encontró
//   el documento equivalente al de Zona Sur para Zona Norte.
// - Fuera de alcance: plazas, paseos, bulevares, riego y poda de espacios
//   verdes — no forman parte de este contrato de Higiene Urbana.
//
// "diasConfirmados: false" indica que el día de la semana no pudo verificarse
// con certeza contra el pliego — no inventar/completar ese dato en la UI.

export type Turno = "Diurno" | "Nocturno";

export interface NucleoRecoleccion {
  codigo: string | null;
  zona: "Norte" | "Sur";
  turno: Turno;
  frecuenciaSemanal: number | null;
  dias: string[];
  diasConfirmados: boolean;
  barrios: string[];
  referencias: string[];
}

export type TipoBarrido = "Manual" | "Mecánico" | "Guardia";

export interface RecorridoBarrido {
  recorrido: string;
  tipo: TipoBarrido;
  zona: string;
  turno: Turno;
  frecuenciaSemanal: number | null;
  dias: string[];
  diasConfirmados: boolean;
  calles: string[];
  barrios: string[];
}

const LMV = ["Lunes", "Miércoles", "Viernes"];
const MJS = ["Martes", "Jueves", "Sábado"];
const LAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAV = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const MYJ = ["Martes", "Jueves"];

// ---------------------------------------------------------------------------
// RECOLECCIÓN DOMICILIARIA — Anexo 1 del pliego (núcleos por zona/turno)
// ---------------------------------------------------------------------------
export const NUCLEOS_RECOLECCION: NucleoRecoleccion[] = [
  // Zona Sur — turno diurno
  { codigo: "RSU-TD-ZS-N1-F3-LMV", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 3, dias: LMV, diasConfirmados: true, barrios: [], referencias: ["Ruta Nacional 3", "Tenaris Nueva Base Río Senguer", "Hotel Su Estrella", "Axion El Patagón", "Feadar Comodoro Rivadavia", "Mercado Concentrador de la Costa"] },
  { codigo: "RSU-TD-ZS-N1-F6-LaS", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 6, dias: LAS, diasConfirmados: true, barrios: ["Stella Maris", "Extensión Stella Maris", "Extensión Stella Maris II"], referencias: ["Av. Portugal", "Liceo Militar General Roca", "Hiper ChangoMás", "C. Eustaquio Molina", "C. Sebastián López"] },
  { codigo: "RSU-TD-ZS-N2-F2-MyJ", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 2, dias: MYJ, diasConfirmados: true, barrios: ["Bella Vista Sur", "El Atardecer"], referencias: ["Vecinal Bella Vista Sur", "Vivero Nativas del Sur", "23 de Febrero"] },
  { codigo: "RSU-TD-ZS-N2-F6-LaS", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 6, dias: LAS, diasConfirmados: true, barrios: ["Cordón Forestal Juan Manuel Feeney", "Gobernador Fontana (Abel Amaya)"], referencias: ["Av. Congreso", "Av. Chile", "Escuela 723 Puerto Argentino", "Las Américas"] },
  { codigo: "RSU-TD-ZS-N3-F2-MyJ", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 2, dias: MYJ, diasConfirmados: true, barrios: [], referencias: ["Roque González", "Cancha de Alianza Fútbol Club"] },
  { codigo: "RSU-TD-ZS-N3-F3-LMV", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 3, dias: LMV, diasConfirmados: true, barrios: ["Cordón Forestal Juan Manuel Feeney", "Dr. Quirno Costa (Isidro Quiroga)"], referencias: ["Av. 10 de Noviembre", "Complejo Fénix", "Canchas Hay Equipo"] },
  { codigo: "RSU-TD-ZS-N3-F6-LaS", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 6, dias: LAS, diasConfirmados: true, barrios: ["Cordón Forestal Juan Manuel Feeney"], referencias: ["Extensión Máximo Abasolo", "Salón de eventos ZEUS"] },
  { codigo: "RSU-TD-ZS-N4-F6-LaS", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 6, dias: LAS, diasConfirmados: true, barrios: ["Los Bretes (Moure)", "Dr. Quirno Costa (Isidro Quiroga)", "Extensión Cerro Solo"], referencias: ["Av. Julio Argentino Roca", "Carrefour Hiper Comodoro Rivadavia", "Gimnasio Municipal N°2"] },
  { codigo: "RSU-TD-ZS-N5-F6-LaS", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 6, dias: LAS, diasConfirmados: true, barrios: ["El Atardecer (El Cerrito)", "Barrio San Cayetano"], referencias: ["Av. Polonia", "Av. Eva Duarte", "Escuela San Juan Bosco"] },
  { codigo: "RSU-TD-ZS-N6-F6-LaS", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 6, dias: LAS, diasConfirmados: true, barrios: ["Dr. Quirno Costa"], referencias: ["Av. Rivadavia", "Cementerio Oeste", "Vecinal Quirno Costa"] },
  { codigo: "RSU-TD-ZS-N7-F6-LaS", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 6, dias: LAS, diasConfirmados: true, barrios: ["Extensión Eva Perón", "Extensión Máximo Abasolo", "Extensión Máximo Abasolo II", "Máximo Abasolo", "San Martín"], referencias: ["Av. Eva Duarte", "Terminal Patagonia", "Av. Rivadavia"] },
  { codigo: "RSU-TD-ZS-N8-F6-LaS", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 6, dias: LAS, diasConfirmados: true, barrios: ["La Floresta", "Las Flores", "Jorge Newbery", "Pietrobelli"], referencias: ["Av. Rivadavia", "C. Huergo", "Colegio Salesiano Domingo Savio"] },
  // Zona Sur — turno nocturno
  { codigo: "RSU-TN-ZS-N1-F6-DaV", zona: "Sur", turno: "Nocturno", frecuenciaSemanal: 6, dias: DAV, diasConfirmados: true, barrios: [], referencias: ["Av. Callao", "Av. Constituyentes", "Av. Chile", "Hiper ChangoMás"] },
  { codigo: "RSU-TN-ZS-N2-F6-DaV", zona: "Sur", turno: "Nocturno", frecuenciaSemanal: 6, dias: DAV, diasConfirmados: true, barrios: [], referencias: ["Av. Polonia", "Av. Callao", "Carrefour Hipermercado Comodoro Rivadavia II"] },
  { codigo: "RSU-TN-ZS-N3-F6-DaV", zona: "Sur", turno: "Nocturno", frecuenciaSemanal: 6, dias: DAV, diasConfirmados: true, barrios: [], referencias: ["Cementerio Oeste", "Av. Estados Unidos", "Av. Portugal"] },
  { codigo: "RSU-TN-ZS-N4-F6-DaV", zona: "Sur", turno: "Nocturno", frecuenciaSemanal: 6, dias: DAV, diasConfirmados: true, barrios: ["Stella Maris"], referencias: ["Av. Estados Unidos", "La Anónima"] },
  { codigo: "RSU-TN-ZS-N5-F6-DaV", zona: "Sur", turno: "Nocturno", frecuenciaSemanal: 6, dias: DAV, diasConfirmados: true, barrios: [], referencias: ["Av. Rivadavia", "Catedral San Juan Bosco", "Hospital Regional de Comodoro"] },
  { codigo: "RSU-TN-ZS-N6-F6-DaV", zona: "Sur", turno: "Nocturno", frecuenciaSemanal: 6, dias: DAV, diasConfirmados: true, barrios: [], referencias: ["Av. Rivadavia", "Av. Alsina", "Jumbo", "Paseo Costanera"] },
  { codigo: "RSU-TN-ZS-N7-F6-DaV", zona: "Sur", turno: "Nocturno", frecuenciaSemanal: 6, dias: DAV, diasConfirmados: true, barrios: ["Centro"], referencias: ["Puerto Comodoro Rivadavia", "Costanera", "Catedral San Juan Bosco", "Jumbo"] },

  // Zona Norte — turno diurno
  { codigo: "RSU-TD-ZN-N1-F3-LMV", zona: "Norte", turno: "Diurno", frecuenciaSemanal: 3, dias: LMV, diasConfirmados: true, barrios: ["Gobernador Roque González (Rodríguez Peña)", "Juan José Castelli", "Güemes", "Malvinas Argentinas (Sarmiento)", "Manantial Rosales", "Laprida"], referencias: ["Universidad Nacional de la Patagonia San Juan Bosco", "Hiper ChangoMás"] },
  { codigo: null, zona: "Norte", turno: "Diurno", frecuenciaSemanal: null, dias: [], diasConfirmados: false, barrios: ["Diadema Argentina"], referencias: ["Companías Asociadas Petroleras SA", "Natatorio Diadema", "Club Atlético Argentinos Diadema"] },
  { codigo: "RSU-TD-ZN-N2-F3-LMV", zona: "Norte", turno: "Diurno", frecuenciaSemanal: 3, dias: LMV, diasConfirmados: true, barrios: ["Acceso Noroeste", "Ciudadela"], referencias: ["La Casona", "Franja Forestal Cerro de la Cruz", "Axion El Cruce"] },
  { codigo: "RSU-TD-ZN-N3-F3-LMV", zona: "Norte", turno: "Diurno", frecuenciaSemanal: 3, dias: LMV, diasConfirmados: true, barrios: [], referencias: ["Universidad Nacional de la Patagonia San Juan Bosco", "Carrefour Comodoro Universidad"] },
  { codigo: null, zona: "Norte", turno: "Diurno", frecuenciaSemanal: null, dias: [], diasConfirmados: false, barrios: ["Gobernador Roque González (Rodríguez Peña)"], referencias: ["Plaza Intendente Mario Morejón", "Plaza B° Las Orquídeas", "Cementerio Km5"] },
  { codigo: "RSU-TD-ZN-N4-F3-LMV", zona: "Norte", turno: "Diurno", frecuenciaSemanal: 3, dias: LMV, diasConfirmados: true, barrios: ["Próspero Palazzo"], referencias: ["Aeropuerto Internacional Gral. Enrique Mosconi", "Gral. Lavalle"] },
  { codigo: null, zona: "Norte", turno: "Diurno", frecuenciaSemanal: null, dias: [], diasConfirmados: false, barrios: ["Chacras Km 17"], referencias: ["Rancho de Campo", "Granja Sabaoth", "Ruta del TOAS - Unidad Histórica"] },
  { codigo: null, zona: "Norte", turno: "Diurno", frecuenciaSemanal: null, dias: [], diasConfirmados: false, barrios: ["Astra"], referencias: ["Comodoro Rugby Club", "Cine Teatro Astra", "CAPSA KM20"] },
  { codigo: "RSU-TD-ZN-N5-F3-MJS", zona: "Norte", turno: "Diurno", frecuenciaSemanal: 3, dias: MJS, diasConfirmados: true, barrios: ["Don Bosco (Km 8)", "Bella Vista Norte (Standard Norte)"], referencias: ["Av. Francisco Pietrobelli", "YPF ORVE Km 8", "Kartódromo Internacional AKPS"] },
  { codigo: "RSU-TD-ZN-N6-F3-MJS", zona: "Norte", turno: "Diurno", frecuenciaSemanal: 3, dias: MJS, diasConfirmados: true, barrios: ["Bella Vista Norte (Standard Norte)"], referencias: ["Gimnasio Municipal N°4 Standart Norte", "Av. Francisco Pietrobelli"] },
  { codigo: null, zona: "Norte", turno: "Diurno", frecuenciaSemanal: null, dias: [], diasConfirmados: false, barrios: ["Cuarteles Chacabuco"], referencias: ["Base de Apoyo Logístico", "Regimiento de Infantería Mecanizada"] },
  { codigo: "RSU-TD-ZN-N7-F3-MJS", zona: "Norte", turno: "Diurno", frecuenciaSemanal: 3, dias: MJS, diasConfirmados: true, barrios: ["Don Bosco (Km 8)", "Extensión Quinta Bella Vista Norte"], referencias: ["Cantera Peralta Áridos Especiales", "Av. Alejandro Maíz"] },
  { codigo: "RSU-TD-ZN-N8-F3-MJS", zona: "Norte", turno: "Diurno", frecuenciaSemanal: 3, dias: MJS, diasConfirmados: true, barrios: ["Don Bosco", "Gasoducto (Restinga Alí Ferrocarrilera)"], referencias: ["Materiales Silpat KM8", "Vivero Mi Sueño"] },
  { codigo: null, zona: "Norte", turno: "Diurno", frecuenciaSemanal: null, dias: [], diasConfirmados: false, barrios: ["Caleta Córdova"], referencias: ["El Muelle Marisquería", "Cancha Club Atlético Caleta Córdova", "Muelle de Caleta Córdova"] },
  // Zona Norte — turno nocturno
  { codigo: "RSU-TN-ZN-N1-F6-DaV", zona: "Norte", turno: "Nocturno", frecuenciaSemanal: 6, dias: DAV, diasConfirmados: true, barrios: ["General Enrique Mosconi", "Caballeriza", "Jorge Newbery (Pietrobelli)"], referencias: ["Museo Nacional del Petróleo", "Calafate Rugby Club", "Monumento Primeros Colonos"] },
  { codigo: "RSU-TN-ZN-N2-F3-DMJ", zona: "Norte", turno: "Nocturno", frecuenciaSemanal: 3, dias: [], diasConfirmados: false, barrios: ["Extensión Sismográfica"], referencias: ["Unión Vecinal Sismográfica", "Cantera Peralta Áridos Especiales"] },
  { codigo: "RSU-TN-ZN-N2-F3-LMV", zona: "Norte", turno: "Nocturno", frecuenciaSemanal: 3, dias: LMV, diasConfirmados: true, barrios: ["Presidente Ortiz"], referencias: ["Club Deportivo Ferrocarril del Estado", "Centrales Térmicas Patagónicas", "Paseo Costero Barrio Ferroviario"] },
  { codigo: "RSU-TN-ZN-N2-F6-DaV", zona: "Norte", turno: "Nocturno", frecuenciaSemanal: 6, dias: DAV, diasConfirmados: true, barrios: [], referencias: ["Av. del Libertador", "Gendarmería Nacional Escuadrón 41"] },
  { codigo: null, zona: "Norte", turno: "Nocturno", frecuenciaSemanal: null, dias: [], diasConfirmados: false, barrios: ["Los Arenales (Barrio Saavedra)"], referencias: ["Barrio Médanos Km3", "Parque Saavedra", "Quincho Saavedra"] },
  { codigo: "RSU-TN-ZN-N3-F3-LMV", zona: "Norte", turno: "Nocturno", frecuenciaSemanal: 3, dias: LMV, diasConfirmados: true, barrios: ["25 de Mayo"], referencias: ["Universidad Nacional de la Patagonia San Juan Bosco", "Playa Km 4", "Club Náutico YPF"] },
  { codigo: "RSU-TN-ZN-N3-F6-DaV", zona: "Norte", turno: "Nocturno", frecuenciaSemanal: 6, dias: DAV, diasConfirmados: true, barrios: ["General Enrique Mosconi"], referencias: ["Escuela 146 Gral Mosconi", "Club Ing. Luis A. Huergo", "Muelle Petrolero"] },
];

// ---------------------------------------------------------------------------
// BARRIDO Y LIMPIEZA — por calle/recorrido, no por barrio completo
// ---------------------------------------------------------------------------

// Barrido Manual, Zona Sur — recorridos 001 a 069, día ya confirmado
const BARRIDO_MANUAL_ZS_LMV = [
  [1, ["Av. Chile", "Inspector Ramón Coliboro", "Elio Medrano", "C. 857", "C. 479"]],
  [2, ["10 de Noviembre", "Av. Polonia", "Maestro Carlos Guastavino", "Av. Julio Argentino Roca"]],
  [3, ["Av. Polonia", "C. 554", "C. 555", "Av. 10 de Noviembre", "Mahuida", "Cámpora"]],
  [4, ["Los Plátanos", "C. 12 de Octubre", "C. Huergo", "Av. Eva Duarte", "Los Ciruelos", "Roque Varela"]],
  [5, ["Av. Patricios", "Sgto. García", "Av. Lisandro de la Torre", "Tres Sargentos"]],
  [6, ["Av. Hipólito Yrigoyen", "Av. Polonia", "José Dalle Mura", "Antonio Canal", "C. Eustaquio Molina"]],
  [7, ["Av. Polonia", "Francisco Behr", "Av. Julio Argentino Roca", "Sgto. García", "Av. Lisandro de la Torre"]],
  [8, ["Av. Lisandro de la Torre", "San Francisco de Asís", "Avenida John F. Kennedy", "Cerro Chenque"]],
  [9, ["Av. Rivadavia", "Calle Los Lirios", "Las Rosas", "Sarmiento", "San Martín", "Las Orquídeas"]],
  [10, ["Roque Varela", "C. Batalla Ganso Verde", "Los Ciruelos", "Franzoni", "Los Duraznos", "Av. Eva Duarte"]],
  [11, ["Av. Rivadavia", "Jesús María", "Tabaré", "30 de Octubre", "Florencio Sánchez", "Av. Juan XXIII"]],
  [12, ["Gregorio de la Ferrere", "Avenida John F. Kennedy", "Almafuerte", "Guaraníes", "Av. Juan XXIII"]],
  [13, ["Av. Sgto. Cabral", "13 de Diciembre", "Juan B. Justo", "Tucumán", "Santa Cruz", "Figueroa Alcorta"]],
  [14, ["Av. Estados Unidos", "José G. Artigas", "Islas Malvinas Sur", "Paraná", "Salta", "Juan B. Justo"]],
  [15, ["Av. Estados Unidos", "José G. Artigas", "Isla Rasa", "Figueroa Alcorta", "Avellaneda", "Av. Portugal"]],
  [16, ["Avenida John F. Kennedy", "San Francisco de Asís", "El Patagónico", "Colonos Sudafricanos", "Carlos Gardel"]],
  [17, ["Avenida John F. Kennedy", "Av. Polonia", "Carlos Gardel", "Sáenz Peña", "Francisco Behr"]],
  [18, ["Av. Polonia", "Colonos Galeses", "Sgto. Ramírez", "La Nación", "Av. Julio Argentino Roca", "Av. Hipólito Yrigoyen"]],
  [19, ["Avenida John F. Kennedy", "Av. Callao", "Manuela Pedraza", "Av. Constituyentes", "Antonio Morán"]],
  [20, ["Av. Julio Argentino Roca", "Av. Constituyentes", "Av. Callao", "Gdor. Galina", "Jauretche"]],
  [21, ["Guillermo Leguizamón", "Enrique Girolamo", "Juan de Dios Trevisan", "Manuel de Arburua", "Ramón Castillo"]],
  [22, ["Cabo Principal Carlos Valdez", "Sgto. García", "La Plata", "Cabo Julio Benítez", "Av. Lisandro de la Torre"]],
] as const;

const BARRIDO_MANUAL_ZS_MYV = [
  [23, ["Av. Lisandro de la Torre", "Cabo Principal Carlos Valdez", "Blas Rodríguez", "Reverendo Padre Juan Corti", "Av. Chile"]],
  [24, ["Monseñor Enrique Angelelli", "Av. Lisandro de la Torre", "Juana Azurduy", "Mariano Rodríguez"]],
  [25, ["Kaiquen", "Mahuida", "Armando Tejada Gómez", "Av. Polonia", "Bruno Pieragnoli", "Ricardo Balbín"]],
  [26, ["Adela Small", "Franzoni", "Los Damascos", "Las Violetas", "C. Huergo", "Los Pensamientos"]],
  [27, ["C. Eustaquio Molina", "Camino Juan Domingo Perón", "José Liñero"]],
  [28, ["Av. Julio Argentino Roca", "Av. Roca", "Cabo Julio Benítez", "José Rementería", "Av. Lisandro de la Torre"]],
  [29, ["Av. Lisandro de la Torre", "Scalabrini Ortiz", "Avenida John F. Kennedy", "Av. Congreso", "Juan Manuel de Rosas"]],
  [30, ["Av. Julio Argentino Roca", "Av. Lisandro de la Torre", "Avenida John F. Kennedy", "Francisco Behr", "Tres Sargentos"]],
  [31, ["Calle Los Lirios", "La Pinta", "Sarmiento", "San Martín", "Granaderos", "Av. Rivadavia"]],
  [32, ["Franzoni", "Las Frutillas", "C. Huergo", "Cámpora", "Armando Tejada Gómez", "Padre Dabrowsky"]],
  [33, ["Roque Varela", "C. Huergo", "C. los Perales", "Los Naranjos", "San Martín", "Av. Rivadavia"]],
  [34, ["Av. Rivadavia", "Av. 10 de Noviembre", "Martín Fierro", "Olegario Andrade", "Avenida John F. Kennedy"]],
  [35, ["Avenida John F. Kennedy", "Calafate", "Guaraníes", "Av. Juan XXIII", "Av. Rivadavia"]],
  [36, ["Av. Estados Unidos", "José G. Artigas", "Islas Malvinas Sur", "Figueroa Alcorta", "Guaraníes"]],
  [37, ["Av. Sgto. Cabral", "Cabildo", "Bernardo O'Higgins", "Figueroa Alcorta", "Salta", "Juan B. Justo"]],
  [38, ["Av. Estados Unidos", "Av. Hipólito Yrigoyen", "Figueroa Alcorta", "Suipacha", "Colón", "Antonio Canal"]],
  [39, ["Avenida John F. Kennedy", "Av. Juan XXIII", "Av. Estados Unidos", "Av. Canadá", "Sáenz Peña", "Av. Portugal"]],
  [40, ["Av. Canadá", "Av. Polonia", "Av. Portugal", "Tte. Levalle", "Carlos Gardel", "El Patagónico"]],
  [41, ["Avenida John F. Kennedy", "Av. Julio Argentino Roca", "La Prensa", "Jauretche", "Gdor. Galina"]],
  [42, ["Av. Canadá", "Av. Polonia", "Francisco Behr", "Gdor. Galina", "Av. Julio Argentino Roca", "Av. Callao"]],
  [43, ["Av. Julio Argentino Roca", "Colonos Galeses", "La Nación", "Av. Chile", "Av. Hipólito Yrigoyen"]],
  [44, ["Avenida John F. Kennedy", "La Gaceta de Buenos Aires", "Av. Constituyentes", "Av. Chile", "Cipriano Alonso"]],
  [45, ["Benito Grillo", "C. Alfredo Llames Massini", "Antonio Roqueta Prat", "C. Eustaquio Molina", "Garzón"]],
] as const;

const BARRIDO_MANUAL_ZS_MIS = [
  [46, ["Antonio López Arias", "Juan de Dios Trevisan", "Carlos Kim", "Fernando Peternoster", "Santiago Farrell", "Jacinto Garat"]],
  [47, ["Jacinto Garat", "Domingo Adano", "Santiago Farrell", "Francisco Salso", "Andrés Sañudo", "Eloy Canova"]],
  [48, ["C. Ricardo Tora", "Cerro San Bernardo", "Romero", "Juana Azurduy", "Cerro Colorado", "Enrique Angelelli"]],
  [49, ["Av. Julio Argentino Roca", "Miguel Amado", "Carlos Campo", "Julio Lecumberry", "Marinero Jorge López", "Enrique Angelelli"]],
  [50, ["C. Huergo", "Av. Eva Duarte", "Garces", "Las Frutillas", "Av. Polonia", "San Martín"]],
  [51, ["Carlos O'Donell", "Av. 10 de Noviembre", "Av. Estados Unidos", "Dr. Federicci", "San Cayetano"]],
  [52, ["Los Nogales", "Los Robles", "Burucuyá", "Carabelas", "San Martín", "Granaderos"]],
  [53, ["Av. Rivadavia", "Florencio Sánchez", "Gregorio de la Ferrere", "Wilde", "Orán", "Av. Juan XXIII"]],
  [54, ["Av. Lisandro de la Torre", "Av. Patricios", "Avenida John F. Kennedy", "Av. Callao", "Juan Manuel de Rosas"]],
  [55, ["Av. Polonia", "Av. Lisandro de la Torre", "Francisco Behr", "Gdor. Galina", "Avenida John F. Kennedy", "San Lorenzo"]],
  [56, ["Andrés Minoli", "Av. 10 de Noviembre", "Balcón del Paraíso", "Av. Lisandro de la Torre", "Av. Polonia"]],
  [57, ["Av. Lisandro de la Torre", "Av. Estados Unidos", "Almafuerte", "Avenida John F. Kennedy", "Cerro Chenque"]],
  [58, ["Av. Rivadavia", "Av. Estados Unidos", "Florencio Sánchez", "Gregorio de la Ferrere", "Av. 10 de Noviembre"]],
  [59, ["12 de Octubre", "Las Margaritas", "Las Orquídeas", "Chaco", "Misiones", "Los Nogales", "San Martín"]],
  [60, ["Av. Juan XXIII", "Guaraníes", "Av. Estados Unidos", "Av. Canadá", "Puelches", "Querandíes"]],
  [61, ["Figueroa Alcorta", "Av. Estados Unidos", "Sgto. Ramírez", "Juan de Garay", "Colón", "Monseñor de Andrea"]],
  [62, ["Av. Estados Unidos", "Suipacha", "Islas Malvinas Sur", "Falucho", "Av. Portugal", "Monseñor de Andrea"]],
  [63, ["Monseñor de Andrea", "Av. Estados Unidos", "Av. Hipólito Yrigoyen", "Antonio Canal", "José Dalle Mura"]],
  [64, ["Chubut", "Av. Portugal", "Esquel", "Av. Polonia", "La Prensa"]],
  [65, ["Av. Polonia", "Av. Julio Argentino Roca", "Francisco Behr", "Gdor. Galina", "La Nación", "Chubut"]],
  [66, ["Av. Constituyentes", "La Gaceta de Buenos Aires", "Av. Julio Argentino Roca", "Av. Chile", "Frondizi"]],
  [67, ["Av. Chile", "Av. Julio Argentino Roca", "Av. Hipólito Yrigoyen", "Enrique Girolamo", "Benito Grillo"]],
  [68, ["Antonio Canal", "Fortunato Carante", "Casimira Pella", "C. Alfredo Llames Massini", "Antonio Roqueta Prat"]],
  [69, ["Juan Carlos Altavista", "Alfredo Adjuar", "Luis Sandrini", "Av. Andrés Chazarreta", "Mahuida", "Av. Polonia"]],
] as const;

function barridoManualZS(
  lista: readonly (readonly [number, readonly string[]])[],
  dias: string[],
): RecorridoBarrido[] {
  return lista.map(([n, calles]) => ({
    recorrido: String(n).padStart(3, "0"),
    tipo: "Manual" as const,
    zona: "Sur",
    turno: "Diurno" as const,
    frecuenciaSemanal: 2,
    dias,
    diasConfirmados: true,
    calles: [...calles],
    barrios: [],
  }));
}

// Barrido Manual, Zona Norte — sectores BIS001 a BIS020. El pliego confirma
// la frecuencia (2x/semana) pero NO el día exacto (no está impreso en el
// mapa, y no existe para Zona Norte un documento equivalente al de Zona Sur).
const BARRIDO_MANUAL_ZN_BIS: { n: number; barrios: string[]; calles: string[] }[] = [
  { n: 1, barrios: ["Manantial Rosales", "Sarmiento", "Güemes"], calles: ["Ruta 25 de Mayo", "Ana Andrade", "Santa Fe", "Chubut", "Buenos Aires"] },
  { n: 2, barrios: [], calles: ["Av. Fray Luis Beltrán", "José Sixto Almirón", "Diego Jara", "Florencio Pol"] },
  { n: 3, barrios: [], calles: ["Comandante Luis Piedrabuena", "Gral. Roca", "Los Italianos", "Río Mayo"] },
  { n: 4, barrios: [], calles: ["Av. del Libertador", "Lola Mora", "Av. Manuel Quintana", "Av. J.M. Pueyrredón"] },
  { n: 5, barrios: [], calles: ["Av. del Libertador", "Golfo San Jorge", "Tehuelches", "Leopoldo Lugones"] },
  { n: 6, barrios: [], calles: ["Av. José Ingenieros", "Ruta Nacional 3", "Pje. Tomillo"] },
  { n: 7, barrios: [], calles: ["Av. José Ingenieros", "Francisco Beiró", "Luis Vernet", "Ricardo Güiraldes"] },
  { n: 8, barrios: [], calles: ["Av. del Parque", "Vicecomodoro Marambio", "Florencio Molina Campos", "Julio Cortázar"] },
  { n: 9, barrios: [], calles: ["Los Andes", "Ruta Nacional 39", "El Rastreador", "Independencia"] },
  { n: 10, barrios: [], calles: ["Gral. Lavalle", "Av. Juan José Paso", "Ruta Nacional 39", "Las Heras", "San Lorenzo"] },
  { n: 11, barrios: [], calles: ["Gral. Lavalle", "Av. Juan José Paso", "Ruta Nacional 39", "Ayacucho", "Güemes"] },
  { n: 12, barrios: [], calles: ["Nahuel Huapi", "30 de Octubre", "Los Glaciares", "Bosques Petrificados", "Laguna Blanca"] },
  { n: 13, barrios: [], calles: ["Av. Francisco Pietrobelli", "Av. Punta Borjas", "Base Sobral", "Base Tte. Cámara"] },
  { n: 14, barrios: [], calles: ["Tte. Daniel Jukic", "Av. Alejandro Maíz", "Base Melchor", "Base Matienzo", "Doña Juana Sosa"] },
  { n: 15, barrios: [], calles: ["Av. Alejandro Maíz", "Francisco Calatraba", "Julio Moreno", "Padre Arcemio Guerra"] },
  { n: 16, barrios: [], calles: ["Av. Alejandro Maíz", "Andrés Bello", "Benito Pérez Galdós", "Moreno"] },
  { n: 17, barrios: [], calles: ["Arturo Marasso", "Rubén Darío", "Doña Juana Sosa", "Hilario Ascasubi", "Dolores Mora"] },
  { n: 18, barrios: [], calles: ["Av. Nahuel Huapi", "30 de Octubre", "Los Glaciares", "Bosques Petrificados", "Av. Francisco Pietrobelli"] },
  { n: 19, barrios: [], calles: ["Av. Nahuel Huapi", "30 de Octubre", "Los Glaciares", "Bosques Petrificados", "Julián Murga"] },
  { n: 20, barrios: [], calles: ["Lago Colihue Huapi", "Río Casa de Piedra", "Lago Viedma", "Lago Argentino", "Ruta Nacional 39"] },
];

// Barrido Mecánico (avenidas/corredores principales) — recorridos 550 a 558
const BARRIDO_MECANICO: RecorridoBarrido[] = [
  { recorrido: "550", tipo: "Mecánico", zona: "Sur – Ruta 3", turno: "Nocturno", frecuenciaSemanal: 6, dias: DAV, diasConfirmados: true, barrios: ["Stella Maris"], calles: ["Av. Rivadavia", "Av. Portugal", "Av. Estados Unidos", "Av. Alsina", "Av. Juan XXIII"] },
  { recorrido: "551", tipo: "Mecánico", zona: "Norte – Ruta 3", turno: "Nocturno", frecuenciaSemanal: 1, dias: ["Lunes"], diasConfirmados: true, barrios: ["General Enrique Mosconi"], calles: ["Ruta Nacional 3", "Cno. del Centenario"] },
  { recorrido: "552", tipo: "Manual", zona: "Norte – Ruta 3", turno: "Nocturno", frecuenciaSemanal: 1, dias: ["Domingo"], diasConfirmados: true, barrios: ["Ciudadela", "Próspero Palazzo", "Gobernador Roque González (Rodríguez Peña)", "Juan José Castelli", "Sarmiento", "Güemes", "25 de Mayo", "General Enrique Mosconi", "Presidente Ortiz"], calles: ["Ruta Nacional 3", "Av. Tehuelches", "Av. Fray Luis Beltrán"] },
  { recorrido: "553", tipo: "Mecánico", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 1, dias: ["Lunes"], diasConfirmados: true, barrios: ["San Cayetano"], calles: ["Av. Rivadavia", "Av. 10 de Noviembre", "13 de Diciembre", "Vélez Sársfield"] },
  { recorrido: "554", tipo: "Mecánico", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 1, dias: ["Martes"], diasConfirmados: true, barrios: ["San Cayetano", "Cordón Forestal Juan Manuel Feeney"], calles: ["Av. Rivadavia", "Av. Polonia", "Av. Lisandro de la Torre", "Av. Congreso", "Av. Chile"] },
  { recorrido: "555", tipo: "Mecánico", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 1, dias: ["Miércoles"], diasConfirmados: true, barrios: ["La Floresta", "Las Flores", "Cordón Forestal Juan Manuel Feeney"], calles: ["C. Huergo", "Av. Julio Argentino Roca", "Av. Estados Unidos", "Av. Chile"] },
  { recorrido: "556", tipo: "Mecánico", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 1, dias: ["Jueves"], diasConfirmados: true, barrios: ["Centro"], calles: ["Av. Rivadavia", "13 de Diciembre", "Alvear", "San Martín"] },
  { recorrido: "557", tipo: "Mecánico", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 1, dias: ["Viernes"], diasConfirmados: true, barrios: ["San Cayetano", "Cordón Forestal Juan Manuel Feeney"], calles: ["Av. Polonia", "Av. 10 de Noviembre", "Avenida John F. Kennedy", "Av. Chile"] },
  { recorrido: "558", tipo: "Mecánico", zona: "Sur", turno: "Diurno", frecuenciaSemanal: 1, dias: ["Sábado"], diasConfirmados: true, barrios: [], calles: ["Av. Rivadavia", "Av. Estados Unidos", "Av. Chile", "Av. Constituyentes", "Av. Julio Argentino Roca"] },
];

// Barrido Manual — Guardia dominical, Centro — recorridos 500 a 503
const BARRIDO_GUARDIA: RecorridoBarrido[] = [
  { recorrido: "500", tipo: "Guardia", zona: "Centro", turno: "Diurno", frecuenciaSemanal: 1, dias: ["Domingo"], diasConfirmados: true, barrios: ["Centro"], calles: ["San Martín", "Pellegrini", "Sarmiento", "Inmigrantes Gallegos"] },
  { recorrido: "501", tipo: "Guardia", zona: "Centro", turno: "Diurno", frecuenciaSemanal: 1, dias: ["Domingo"], diasConfirmados: true, barrios: ["Centro"], calles: ["España", "Belgrano", "25 de Mayo", "9 de Julio", "Av. Rivadavia"] },
  { recorrido: "502", tipo: "Guardia", zona: "Centro", turno: "Diurno", frecuenciaSemanal: 1, dias: ["Domingo"], diasConfirmados: true, barrios: ["Centro"], calles: ["C. Huergo", "Pje. Travaglini", "Pellegrini", "Sarmiento"] },
  { recorrido: "503", tipo: "Guardia", zona: "Centro", turno: "Diurno", frecuenciaSemanal: 1, dias: ["Domingo"], diasConfirmados: true, barrios: ["Centro"], calles: ["San Martín", "Av. Costanera", "Inmigrantes Gallegos", "Dr. Scocco", "Puerto"] },
];

export const RECORRIDOS_BARRIDO: RecorridoBarrido[] = [
  ...barridoManualZS(BARRIDO_MANUAL_ZS_LMV, ["Lunes", "Jueves"]),
  ...barridoManualZS(BARRIDO_MANUAL_ZS_MYV, ["Martes", "Viernes"]),
  ...barridoManualZS(BARRIDO_MANUAL_ZS_MIS, ["Miércoles", "Sábado"]),
  ...BARRIDO_MANUAL_ZN_BIS.map((s) => ({
    recorrido: `BIS${String(s.n).padStart(3, "0")}`,
    tipo: "Manual" as const,
    zona: "Norte",
    turno: "Diurno" as const,
    frecuenciaSemanal: 2,
    dias: [],
    diasConfirmados: false,
    calles: s.calles,
    barrios: s.barrios,
  })),
  ...BARRIDO_MECANICO,
  ...BARRIDO_GUARDIA,
];

// ---------------------------------------------------------------------------
// SERVICIOS ADICIONALES — Cap. VIII del ETP ("Servicios Opcionales"), se
// prestan a requerimiento de la Inspección/Concedente, no tienen zona ni día
// fijo como recolección/barrido. Referencia rápida para cuando el reclamo
// no es "no pasó el camión" sino uno de estos otros pedidos.
// ---------------------------------------------------------------------------

export interface ServicioAdicional {
  nombre: string;
  cuandoUsar: string;
  comoFunciona: string;
  plazoOAlcance: string;
}

export const SERVICIOS_ADICIONALES: ServicioAdicional[] = [
  {
    nombre: "Limpieza y acondicionamiento de terrenos baldíos",
    cuandoUsar: "El vecino reclama por un terreno baldío sucio/con pastizales junto a su casa.",
    comoFunciona: "No es automático: la Inspección de Obra debe emitir una Orden de Servicio con la ubicación, datos catastrales y del propietario. Clear Urbana limpia, desmaleza, nivela y coloca un cerramiento provisorio (malla Sima).",
    plazoOAlcance: "Sin frecuencia fija — depende de que se emita la Orden de Servicio. Indicar al vecino que se deriva a Inspección para relevar el terreno.",
  },
  {
    nombre: "Erradicación de basurales clandestinos",
    cuandoUsar: "Hay un basural a cielo abierto (no es un contenedor desbordado puntual, sino un lugar usado sistemáticamente para tirar basura).",
    comoFunciona: "La Inspección releva el lugar, la Concesionaria presenta un Plan de Trabajo (metodología, cronograma, destino de los residuos) que la Inspección aprueba antes de ejecutar.",
    plazoOAlcance: "Relevamiento inicial en un plazo máximo de 60 días desde el inicio del contrato; después, a demanda cada vez que se detecte un basural nuevo.",
  },
  {
    nombre: "Recolección de chatarra metálica en la vía pública",
    cuandoUsar: "Restos o rezagos metálicos abandonados (no vehículos con dueño, sino chatarra evidente).",
    comoFunciona: "La Inspección comunica la ubicación mediante Orden de Servicio; Clear Urbana traslada la chatarra a Parque Ambiental o escombrera.",
    plazoOAlcance: "Sin frecuencia fija — depende de la Orden de Servicio.",
  },
  {
    nombre: "Limpieza de playas habilitadas",
    cuandoUsar: "Reclamo de suciedad en Playa Centro, Km3, Km4 o Km5 durante el verano.",
    comoFunciona: "Personal con rastrillos y bolsas recolecta residuos sólidos de la superficie de arena; las bolsas se retiran después con el servicio de barrido de la zona.",
    plazoOAlcance: "Solo diciembre, enero y febrero, todos los días de 07:00 a 10:00 hs. No se presta con feriados nacionales ni mal tiempo (lluvia fuerte, tormenta, viento fuerte). Fuera de esos meses, este servicio NO existe.",
  },
  {
    nombre: "Recolección de mascotas (canes y felinos) muertos en la vía pública",
    cuandoUsar: "Un animal muerto en la calle, sin dueño identificable ni proveniente de una veterinaria/criadero.",
    comoFunciona: "El vecino pide el retiro (o llega por Orden de Servicio); Clear Urbana lo levanta, lo embolsa (bolsa de 70 micrones, es residuo patogénico según Ordenanza 7861/03) y lo traslada al lugar de tratamiento dispuesto por la Municipalidad.",
    plazoOAlcance: "En todo el ejido urbano. Lunes a viernes 7:00-15:00 hs, sábados 8:00-12:00 hs (no domingos ni feriados). Ninguna solicitud puede quedar sin atender por más de 24 horas desde que se pidió.",
  },
];

// ---------------------------------------------------------------------------
// Búsqueda
// ---------------------------------------------------------------------------

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Núcleos de recolección domiciliaria cuyo barrio etiquetado matchea la búsqueda. */
export function buscarRecoleccionPorBarrio(query: string): NucleoRecoleccion[] {
  const q = normalizar(query);
  if (!q) return [];
  return NUCLEOS_RECOLECCION.filter((n) =>
    n.barrios.some((b) => normalizar(b).includes(q)),
  );
}

/** Recorridos de barrido cuyas calles o barrio etiquetado matchean la búsqueda. */
export function buscarBarridoPorCalleOBarrio(query: string): RecorridoBarrido[] {
  const q = normalizar(query);
  if (!q || q.length < 3) return [];
  return RECORRIDOS_BARRIDO.filter(
    (r) =>
      r.calles.some((c) => normalizar(c).includes(q)) ||
      r.barrios.some((b) => normalizar(b).includes(q)),
  );
}
