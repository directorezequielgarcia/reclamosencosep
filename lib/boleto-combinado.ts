// Matriz de combinaciones del boleto combinado (vigente desde el 01/10/2026,
// Ordenanza 15.889/21). Fuente: planilla combinado.xlsx del Directorio de
// ENCOSEP. NO es un listado oficial publicado por la Municipalidad: hay que
// confirmarlo con la Secretaría de Servicios Públicos y Control de
// Concesiones. Los rótulos 1..22 son los de la planilla tal cual.
//
// Se guarda como lista de adyacencia por línea. Se usa solo el par recíproco:
// la planilla marca 15→14 pero no 14→15 (probable error de carga), por eso
// ese par se trata como NO confirmado en vez de combinable.

export const LINEAS_COMBINADO = Array.from({ length: 22 }, (_, i) => i + 1);

const FILAS: Record<number, number[]> = {
  1: [6, 7, 8, 10, 11, 13, 16, 17, 18, 19, 20, 22],
  2: [6, 7, 8, 10, 11, 13, 16, 17, 18, 19, 20, 22],
  3: [6, 7, 8, 10, 11, 13, 16, 17, 18, 19, 20, 22],
  4: [6, 7, 8, 10, 11, 13, 16, 17, 18, 19, 20, 22],
  5: [6, 7, 8, 10, 11, 13, 16, 17, 18, 19, 20, 22],
  6: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22],
  7: [1, 2, 3, 4, 5, 6, 9, 12, 14, 15],
  8: [1, 2, 3, 4, 5, 6, 9, 12, 14, 15, 21],
  9: [6, 7, 8, 10, 11, 13, 16, 17, 18, 19, 20, 22],
  10: [1, 2, 3, 4, 5, 6, 9, 12, 14, 15, 21],
  11: [1, 2, 3, 4, 5, 6, 9, 12, 14, 15, 21],
  12: [6, 7, 8, 10, 11, 13, 16, 17, 18, 19, 20, 22],
  13: [1, 2, 3, 4, 5, 6, 9, 12, 14, 15, 21],
  14: [6, 7, 8, 10, 11, 13, 16, 17, 18, 19, 20, 22],
  15: [6, 7, 8, 10, 11, 13, 14, 16, 17, 18, 19, 20, 22],
  16: [1, 2, 3, 4, 5, 6, 9, 12, 14, 15],
  17: [1, 2, 3, 4, 5, 6, 9, 12, 14, 15, 21],
  18: [1, 2, 3, 4, 5, 6, 9, 12, 14, 15, 21],
  19: [1, 2, 3, 4, 5, 6, 9, 12, 14, 15, 21],
  20: [1, 2, 3, 4, 5, 6, 9, 12, 14, 15, 21],
  21: [8, 10, 11, 13, 17, 18, 19, 20, 22],
  22: [1, 2, 3, 4, 5, 6, 9, 12, 14, 15, 21],
};

export const MIN_ESPERA_MIN = 15;
export const MAX_VENTANA_MIN = 120;

export function combinan(a: number, b: number): boolean {
  if (a === b) return false;
  return !!FILAS[a]?.includes(b) && !!FILAS[b]?.includes(a);
}

// Par que la planilla marca en un solo sentido: no se puede afirmar nada.
export function parDudoso(a: number, b: number): boolean {
  if (a === b) return false;
  return !!FILAS[a]?.includes(b) !== !!FILAS[b]?.includes(a);
}

export function combinablesCon(a: number): number[] {
  return LINEAS_COMBINADO.filter((b) => combinan(a, b));
}
