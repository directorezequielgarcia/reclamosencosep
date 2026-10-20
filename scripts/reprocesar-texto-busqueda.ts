// Recalcula textoBusqueda de todas las normas con texto, aplicando la
// normalización tolerante a errores de OCR (ver normalizarParaBusqueda en
// lib/normativa.ts: dígito 6/0/1 entre dos letras de una palabra → ó/o/i).
// Solo toca textoBusqueda; `texto` queda intacto. Idempotente.
//
// Uso: npx tsx --env-file=.env scripts/reprocesar-texto-busqueda.ts

import { prisma } from "../lib/prisma";
import { normalizarParaBusqueda, normalizarTexto } from "../lib/normativa";

async function main() {
  const normas = await prisma.norma.findMany({
    where: { texto: { not: null } },
    select: { id: true, texto: true, textoBusqueda: true },
  });
  let reemplazos = 0;
  let cambiadas = 0;
  const ejemplos = new Map<string, number>();
  for (const n of normas) {
    const base = normalizarTexto(n.texto!);
    const nuevo = normalizarParaBusqueda(n.texto!);
    for (let i = 0; i < base.length; i++) {
      if (base[i] !== nuevo[i]) {
        reemplazos++;
        // palabra completa donde ocurrió, antes → después
        let a = i, b = i;
        while (a > 0 && /[a-z0-9]/.test(base[a - 1])) a--;
        while (b < base.length - 1 && /[a-z0-9]/.test(base[b + 1])) b++;
        const k = `${base.slice(a, b + 1)} → ${nuevo.slice(a, b + 1)}`;
        ejemplos.set(k, (ejemplos.get(k) ?? 0) + 1);
      }
    }
    if (nuevo !== n.textoBusqueda) {
      await prisma.norma.update({ where: { id: n.id }, data: { textoBusqueda: nuevo } });
      cambiadas++;
    }
  }
  console.log(`Normas con texto: ${normas.length}. textoBusqueda actualizado en ${cambiadas}.`);
  console.log(`Reemplazos de caracteres: ${reemplazos}. Palabras distintas corregidas: ${ejemplos.size}`);
  const lista = [...ejemplos.entries()].sort((x, y) => y[1] - x[1]);
  console.log("Más frecuentes:");
  lista.slice(0, 15).forEach(([k, c]) => console.log(`  ${k}  (${c})`));
  console.log("Menos frecuentes (para revisar falsos positivos):");
  lista.slice(-15).forEach(([k, c]) => console.log(`  ${k}  (${c})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
