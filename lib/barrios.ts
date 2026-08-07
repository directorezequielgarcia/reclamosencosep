// Listado oficial de barrios de Comodoro Rivadavia, según el límite de
// barrios 2026 publicado por la Dirección de Modernización e Investigación
// Territorial en el portal de datos abiertos municipal:
// https://datos.comodoro.gov.ar/dataset/barrios-de-comodoro-rivadavia
export const BARRIOS_COMODORO: string[] = [
  "13 de Diciembre",
  "25 de Mayo",
  "30 de Octubre",
  "9 de Julio",
  "Acceso Noroeste",
  "Acceso Sur",
  "Acceso Sur Fracción 14 y 15",
  "ARA San Juan",
  "Astra",
  "Balcón del Paraíso",
  "Bella Vista Norte",
  "Bella Vista Oeste",
  "Bella Vista Sur",
  "Caleta Córdova",
  "Ceferino Namuncurá",
  "Centenario",
  "Centro",
  "Centro Cívico General Solari",
  "Chacras Cañadones La Francesa y Las Leñas",
  "Chacras El Faro",
  "Chacras Km 17",
  "Chacras Km 18",
  "Chacras La Herradura",
  "Chacras Loteo Feijoo, Vento, Colla y otros",
  "Chacras Loteo Quistani y otros",
  "Ciudadela",
  "Cordón Forestal Juan Manuel Feeney",
  "Cuarteles Chacabuco",
  "Diadema Argentina",
  "Don Bosco",
  "Dr. Quirno Costa",
  "Dr. René Gerónimo Favaloro",
  "El Atardecer",
  "Ex Radio Estación",
  "Franja Forestal Cerro de la Cruz",
  "Gasoducto",
  "General Enrique Mosconi",
  "Gesta de Malvinas",
  "Gobernador Fontana",
  "Gobernador Roque González",
  "Güemes",
  "Humberto Beghin",
  "Jorge Newbery",
  "José Fuchs",
  "Juan José Castelli",
  "Juan XXIII",
  "La Floresta",
  "Laprida",
  "Las Flores",
  "Las Orquídeas",
  "Los Arenales",
  "Los Bretes",
  "Maestro Isidro Quiroga",
  "Malvinas Argentinas",
  "Manantial Rosales",
  "Mario Abel Amaya",
  "Máximo Abásolo",
  "Monseñor Argimiro Daniel Moure",
  "Nicolás Rodríguez Peña",
  "Nuestra Señora de la Divina Providencia",
  "Padre Juan Corti",
  "Parque Industrial",
  "Pietrobelli",
  "Presidente Roberto M. Ortiz",
  "Próspero Palazzo",
  "Pueyrredón",
  "Restinga Alí",
  "Saavedra",
  "San Cayetano",
  "San Isidro Labrador",
  "San Martín",
  "Sarmiento",
  "Standard Norte",
  "Standard Sur",
  "Stella Maris",
  "Teniente General Julio Argentino Roca",
  "Zona de Aeropuerto",
];

// Filtro de coincidencia insensible a mayúsculas/tildes, para el buscador
// del wizard de reclamo. Devuelve hasta `limite` sugerencias.
export function buscarBarrios(texto: string, limite = 6): string[] {
  const q = normalizar(texto.trim());
  if (!q) return [];
  return BARRIOS_COMODORO.filter((b) => normalizar(b).includes(q)).slice(0, limite);
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
