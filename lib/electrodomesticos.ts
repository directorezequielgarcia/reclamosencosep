// Estimador de consumo por electrodoméstico.
// Tabla y fórmula portadas del "Calculadora de consumo v.2022" del ENRE
// (enre.gov.ar/calculadora), que es de acceso público y no depende de
// ningún backend: es puro cálculo con datos técnicos de cada artefacto.
// La pestaña "Consumo anual" del ENRE sí requiere su sistema de facturación
// interno (NIS + medidor de Edenor/Edesur) y no aplica a Comodoro Rivadavia
// (SCPL, fuera de jurisdicción ENRE), por eso no se replica acá.

export type Electrodomestico = {
  id: string;
  nombre: string;
  /** Si el artefacto cicla por termostato (heladera, aire, termotanque...). */
  termostato: boolean;
  potenciaW: number;
  /** Consumo horario efectivo en W (ya contempla el duty cycle base del ENRE). */
  horaConsumoW: number;
};

export const ELECTRODOMESTICOS: Electrodomestico[] = [
  { id: "00", nombre: "Afeitadora", termostato: false, potenciaW: 5, horaConsumoW: 5 },
  { id: "01", nombre: "Aire acondicionado de 2200 frigorías F/C", termostato: true, potenciaW: 1350, horaConsumoW: 1012.5 },
  { id: "02", nombre: "Aire acondicionado de 3500 frigorías F/C", termostato: true, potenciaW: 2150, horaConsumoW: 1612.5 },
  { id: "03", nombre: "Aire acondicionado de 4500 frigorías F/C", termostato: true, potenciaW: 2028, horaConsumoW: 2153 },
  { id: "04", nombre: "Aire acondicionado de 2200 frigorías F/C - Inverter", termostato: true, potenciaW: 877.5, horaConsumoW: 658.125 },
  { id: "05", nombre: "Aire acondicionado de 3500 frigorías F/C - Inverter", termostato: true, potenciaW: 1397.5, horaConsumoW: 1048.125 },
  { id: "06", nombre: "Aire acondicionado de 4500 frigorías F/C - Inverter", termostato: true, potenciaW: 1820, horaConsumoW: 1365 },
  { id: "07", nombre: "Anafe vitrocerámico con hornalla de 120 mm de diámetro", termostato: false, potenciaW: 750, horaConsumoW: 750 },
  { id: "08", nombre: "Anafe vitrocerámico con hornalla de 140 mm de diámetro", termostato: false, potenciaW: 1250, horaConsumoW: 1250 },
  { id: "09", nombre: "Anafe vitrocerámico con hornalla de 175 mm de diámetro", termostato: false, potenciaW: 1500, horaConsumoW: 1500 },
  { id: "10", nombre: "Anafe vitrocerámico con hornalla de 200 mm de diámetro", termostato: false, potenciaW: 1800, horaConsumoW: 1800 },
  { id: "11", nombre: "Anafe vitrocerámico con hornalla de 215 mm de diámetro", termostato: false, potenciaW: 2110, horaConsumoW: 2110 },
  { id: "12", nombre: "Anafe vitrocerámico con hornalla de 220 mm de diámetro", termostato: false, potenciaW: 2350, horaConsumoW: 2350 },
  { id: "13", nombre: "Anafe resistivo con hornalla de 150 mm de diámetro", termostato: false, potenciaW: 1000, horaConsumoW: 1000 },
  { id: "14", nombre: "Anafe resistivo con hornalla de 190 mm de diámetro", termostato: false, potenciaW: 2000, horaConsumoW: 2000 },
  { id: "15", nombre: "Aspiradora", termostato: false, potenciaW: 1200, horaConsumoW: 1200 },
  { id: "16", nombre: "Batidora de mano", termostato: false, potenciaW: 300, horaConsumoW: 300 },
  { id: "17", nombre: "Bomba de agua de 1/2 HP", termostato: false, potenciaW: 380, horaConsumoW: 380 },
  { id: "18", nombre: "Bomba de agua de 3/4 HP", termostato: false, potenciaW: 570, horaConsumoW: 570 },
  { id: "19", nombre: "Cafetera de filtro eléctrica", termostato: false, potenciaW: 900, horaConsumoW: 900 },
  { id: "20", nombre: "Caloventor chico con termostato", termostato: true, potenciaW: 1500, horaConsumoW: 1500 },
  { id: "21", nombre: "Cargador de celular genérico", termostato: false, potenciaW: 5, horaConsumoW: 5 },
  { id: "22", nombre: "Computadora (sólo la CPU)", termostato: false, potenciaW: 200, horaConsumoW: 200 },
  { id: "23", nombre: "Estufa halógena tres velas con termostato", termostato: true, potenciaW: 1500, horaConsumoW: 1500 },
  { id: "24", nombre: "Estufa de cuarzo con termostato", termostato: true, potenciaW: 1500, horaConsumoW: 1500 },
  { id: "25", nombre: "Extractor de aire para cocina o baño - 80 m³/hora", termostato: false, potenciaW: 12, horaConsumoW: 12 },
  { id: "26", nombre: "Extractor de aire para cocina o baño - 200 m³/hora", termostato: false, potenciaW: 20, horaConsumoW: 20 },
  { id: "27", nombre: "Extractor de aire para cocina o baño - 1200 m³/hora", termostato: false, potenciaW: 50, horaConsumoW: 50 },
  { id: "28", nombre: "Freezer", termostato: false, potenciaW: 250, horaConsumoW: 112.5 },
  { id: "29", nombre: "Heladera", termostato: false, potenciaW: 150, horaConsumoW: 75 },
  { id: "30", nombre: "Heladera con freezer", termostato: false, potenciaW: 200, horaConsumoW: 90 },
  { id: "31", nombre: "Heladera con freezer - Inverter", termostato: false, potenciaW: 200, horaConsumoW: 35 },
  { id: "32", nombre: "Horno eléctrico de 25 a 30 litros c/termostato", termostato: false, potenciaW: 1500, horaConsumoW: 750 },
  { id: "33", nombre: "Horno eléctrico de 73 litros c/termostato, para empotrar", termostato: false, potenciaW: 2450, horaConsumoW: 1225 },
  { id: "34", nombre: "Lámpara de bajo consumo de 11W", termostato: false, potenciaW: 11, horaConsumoW: 11 },
  { id: "35", nombre: "Lámpara de bajo consumo de 15W", termostato: false, potenciaW: 15, horaConsumoW: 15 },
  { id: "36", nombre: "Lámpara de bajo consumo de 20W", termostato: false, potenciaW: 20, horaConsumoW: 20 },
  { id: "37", nombre: "Lámpara halógena de 100W", termostato: false, potenciaW: 100, horaConsumoW: 100 },
  { id: "38", nombre: "Lámpara halógena de 40W", termostato: false, potenciaW: 40, horaConsumoW: 40 },
  { id: "39", nombre: "Lámpara halógena de 60W", termostato: false, potenciaW: 60, horaConsumoW: 60 },
  { id: "40", nombre: "Lámpara LED de 5 W", termostato: false, potenciaW: 5, horaConsumoW: 5 },
  { id: "41", nombre: "Lámpara LED de 9 W", termostato: false, potenciaW: 9, horaConsumoW: 9 },
  { id: "42", nombre: "Lámpara LED de 11 W", termostato: false, potenciaW: 11, horaConsumoW: 11 },
  { id: "43", nombre: "Lavarropas automático 5 kg. c/ calentador de agua", termostato: false, potenciaW: 2500, horaConsumoW: 875 },
  { id: "44", nombre: "Lavarropas automático de 5 kg.", termostato: false, potenciaW: 500, horaConsumoW: 175 },
  { id: "45", nombre: "Lavarropas semiautomático de 5 kg.", termostato: false, potenciaW: 200, horaConsumoW: 80 },
  { id: "46", nombre: "Lavavajilla para 12 cubiertos", termostato: false, potenciaW: 1500, horaConsumoW: 1500 },
  { id: "47", nombre: "Licuadora de mano o de pie", termostato: false, potenciaW: 600, horaConsumoW: 600 },
  { id: "48", nombre: "Lustraaspiradora", termostato: false, potenciaW: 800, horaConsumoW: 720 },
  { id: "49", nombre: "Microondas", termostato: false, potenciaW: 800, horaConsumoW: 640 },
  { id: "50", nombre: "Minicomponente", termostato: false, potenciaW: 60, horaConsumoW: 60 },
  { id: "51", nombre: "Monitor LED de 19 pulg.", termostato: false, potenciaW: 22, horaConsumoW: 22 },
  { id: "52", nombre: "Notebook", termostato: false, potenciaW: 22, horaConsumoW: 22 },
  { id: "53", nombre: "Pava eléctrica de 1,7 litros", termostato: false, potenciaW: 2000, horaConsumoW: 2000 },
  { id: "54", nombre: "Plancha", termostato: false, potenciaW: 1500, horaConsumoW: 750 },
  { id: "55", nombre: "Planchita de pelo o buclera", termostato: false, potenciaW: 40, horaConsumoW: 40 },
  { id: "56", nombre: "Radiador eléctrico mediano c/termostato", termostato: true, potenciaW: 1500, horaConsumoW: 1500 },
  { id: "57", nombre: "Reproductor de DVD", termostato: false, potenciaW: 15, horaConsumoW: 15 },
  { id: "58", nombre: "Secador de cabello", termostato: false, potenciaW: 2000, horaConsumoW: 2000 },
  { id: "59", nombre: "Secarropas a calor", termostato: false, potenciaW: 950, horaConsumoW: 950 },
  { id: "60", nombre: "Secarropas centrífugo", termostato: false, potenciaW: 380, horaConsumoW: 380 },
  { id: "61", nombre: "Televisor color tubo fluorescente de 21\"", termostato: false, potenciaW: 75, horaConsumoW: 75 },
  { id: "62", nombre: "Televisor color tubo fluorescente de 25\"", termostato: false, potenciaW: 55, horaConsumoW: 55 },
  { id: "63", nombre: "Televisor color tubo fluorescente de 29 a 34\"", termostato: false, potenciaW: 175, horaConsumoW: 175 },
  { id: "64", nombre: "Televisor LCD 40 pulg.", termostato: false, potenciaW: 180, horaConsumoW: 180 },
  { id: "65", nombre: "Televisor LED 24 pulg.", termostato: false, potenciaW: 40, horaConsumoW: 40 },
  { id: "66", nombre: "Televisor LED 32 a 50 pulg.", termostato: false, potenciaW: 90, horaConsumoW: 90 },
  { id: "67", nombre: "Termotanque eléctrico c/termostato", termostato: true, potenciaW: 1500, horaConsumoW: 1500 },
  { id: "68", nombre: "Tostadora", termostato: false, potenciaW: 950, horaConsumoW: 950 },
  { id: "69", nombre: "Tubo fluorescente de 18W", termostato: false, potenciaW: 18, horaConsumoW: 18 },
  { id: "70", nombre: "Tubo fluorescente de 36W", termostato: false, potenciaW: 36, horaConsumoW: 36 },
  { id: "71", nombre: "Tubo fluorescente de 58W", termostato: false, potenciaW: 58, horaConsumoW: 58 },
  { id: "72", nombre: "Ventilador de techo", termostato: false, potenciaW: 60, horaConsumoW: 60 },
  { id: "73", nombre: "Ventilador de pie", termostato: false, potenciaW: 90, horaConsumoW: 90 },
  { id: "74", nombre: "Vitroconvector 54 x 57 cm c/termostato", termostato: true, potenciaW: 1000, horaConsumoW: 1000 },
  { id: "75", nombre: "Vitroconvector 86 x 58 cm c/termostato", termostato: true, potenciaW: 2000, horaConsumoW: 2000 },
];

/**
 * Para artefactos con termostato, cada hora adicional de uso pesa cada vez
 * menos (el equipo pasa más tiempo "ciclando" apagado una vez que llega a
 * temperatura). Aproximación por tramos tal cual la usa el ENRE.
 */
function consumoDiarioConTermostato(x: number, horasPorDia: number): number {
  switch (horasPorDia) {
    case 1:
      return x * (1 + 0.75 * (horasPorDia - 1));
    case 2:
      return x * (1.75 + 0.5625 * (horasPorDia - 2));
    case 3:
      return x * (2.3125 + 0.421875 * (horasPorDia - 3));
    default:
      return x * (2.734375 + Math.pow(0.75, 4) * (horasPorDia - 4));
  }
}

/** kWh por mes para un artefacto, dada la cantidad y el uso declarado. */
export function kwhMensual(
  item: Electrodomestico,
  cantidad: number,
  horasPorDia: number,
  diasPorSemana: number,
): number {
  if (cantidad <= 0 || horasPorDia <= 0 || diasPorSemana <= 0) return 0;
  const x = cantidad * item.horaConsumoW;
  let consumoDiario = x * horasPorDia;
  if (item.termostato) {
    consumoDiario = consumoDiarioConTermostato(x, horasPorDia);
  }
  // 4.5 ≈ semanas por mes (9/2), igual que la fórmula del ENRE.
  return (9 * diasPorSemana * consumoDiario) / 1000 / 2;
}
