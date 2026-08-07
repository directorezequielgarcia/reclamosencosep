// Presentación (categoría + emoji) del tablero de artefactos. Separado de
// electrodomesticos.ts a propósito: ese archivo es el port fiel de los datos
// técnicos del ENRE y no debería mezclarse con decisiones de UI.

const CATEGORIAS = [
  {
    id: "clima",
    nombre: "Climatización y agua caliente",
    emoji: "🔥",
    match: /aire acondicionado|estufa|caloventor|radiador|vitroconvector|termotanque/i,
  },
  {
    id: "cocina",
    nombre: "Cocina",
    emoji: "🍳",
    match: /anafe|horno|microondas|pava|tostadora|cafetera|licuadora|batidora|lavavajilla/i,
  },
  {
    id: "frio",
    nombre: "Heladera y freezer",
    emoji: "🧊",
    match: /heladera|freezer/i,
  },
  {
    id: "luz",
    nombre: "Iluminación",
    emoji: "💡",
    match: /lámpara|tubo fluorescente/i,
  },
  {
    id: "lavado",
    nombre: "Limpieza y lavado",
    emoji: "🧺",
    match: /lavarropas|secarropas|aspiradora|lustraaspiradora/i,
  },
  {
    id: "electronica",
    nombre: "Electrónica y PC",
    emoji: "📺",
    match: /televisor|notebook|computadora|monitor|minicomponente|dvd|cargador de celular/i,
  },
] as const;

const CATEGORIA_OTROS = { id: "otros", nombre: "Otros artefactos", emoji: "🔌" } as const;

export function categoriaDe(nombre: string): { id: string; nombre: string; emoji: string } {
  const cat = CATEGORIAS.find((c) => c.match.test(nombre));
  return cat ?? CATEGORIA_OTROS;
}

const EMOJIS_ESPECIFICOS: [RegExp, string][] = [
  [/aire acondicionado/i, "❄️"],
  [/estufa|caloventor|radiador|vitroconvector/i, "🔥"],
  [/termotanque/i, "🚿"],
  [/anafe/i, "🍳"],
  [/horno/i, "🍞"],
  [/microondas/i, "📡"],
  [/pava|cafetera/i, "☕"],
  [/tostadora/i, "🍞"],
  [/licuadora|batidora/i, "🥤"],
  [/lavavajilla/i, "🍽️"],
  [/heladera|freezer/i, "🧊"],
  [/lámpara|tubo fluorescente/i, "💡"],
  [/lavarropas|secarropas/i, "🧺"],
  [/aspiradora|lustraaspiradora/i, "🧹"],
  [/televisor/i, "📺"],
  [/notebook|computadora|monitor/i, "💻"],
  [/minicomponente|dvd/i, "🎵"],
  [/cargador de celular/i, "🔋"],
  [/bomba de agua/i, "🚰"],
  [/extractor de aire/i, "💨"],
  [/ventilador/i, "🌀"],
  [/plancha(?!ita)/i, "👔"],
  [/planchita/i, "💇"],
  [/secador de cabello/i, "💇"],
  [/afeitadora/i, "🪒"],
];

export function emojiDe(nombre: string): string {
  const hit = EMOJIS_ESPECIFICOS.find(([re]) => re.test(nombre));
  return hit ? hit[1] : "🔌";
}

export function categoriasOrdenadas() {
  return [...CATEGORIAS, CATEGORIA_OTROS];
}
