"use client";

import { useState, type FormEvent } from "react";

/**
 * "Zorrito Guía" — responde ¿dónde estoy? ¿qué paradas hay? ¿qué líneas pasan
 * por acá?, usando los datos geográficos reales y públicos que publica la
 * Municipalidad para su propio mapa interactivo (comodoro-mit.github.io).
 * No se copian esos datos al repo: se consultan en vivo (CORS abierto), así
 * nunca quedan desactualizados si la Municipalidad corrige un recorrido.
 *
 * El vínculo "esta parada la sirve tal línea" y "esta línea te lleva de A a
 * B" se calculan con el MISMO criterio que usa el mapa oficial de la
 * Municipalidad (comodoro-mit.github.io/transporte/js/visor.js:
 * lineasEnParada / buscarLineaSugerida) — no es una estimación propia:
 * el trazado tiene que pasar a ≤20 m del poste para contar como "para acá",
 * y para "te sirve directo" el destino tiene que quedar más adelante que el
 * origen sobre el MISMO tramo cosido (mismo sentido físico), no solo cerca
 * de los dos puntos por separado.
 *
 * Un solo formulario: origen (ubicación GPS por defecto, o dirección escrita)
 * + destino opcional. Sin destino, muestra lo que hay cerca del origen; con
 * destino, muestra qué línea conecta los dos puntos.
 */

const BASE = "https://comodoro-mit.github.io/transporte/layers_transporte";
const MAPA_MCR_URL = "https://comodoro-mit.github.io/transporte";

// Códigos reales de archivo publicados por el mapa oficial (23 líneas).
const CODIGOS_LINEA = [
  "1", "2", "3", "4", "5", "5U", "6A", "6B", "7", "8H", "8AH", "9",
  "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22",
];

// Mapea el código de archivo al numero usado como id en la lista de líneas
// de esta página (linea-1, linea-8, etc.) — 5U->5, 6A/6B->6, 8H/8AH->8.
function numeroAncla(codigo: string) {
  return codigo.replace(/[A-Z]+$/, "");
}

type Parada = {
  id: number;
  lat: number;
  lng: number;
  calle: string;
  esquina: string;
  poste: boolean;
  cartel: boolean;
  refugio: boolean;
};

// El dataset mezcla LineString (coordinates: [[lng,lat],...]) y
// MultiLineString (coordinates: [[[lng,lat],...], [[lng,lat],...]]) según la
// línea — hay que soportar las dos formas o esa línea queda invisible.
type LineaGeoJSON = {
  features: Array<{
    properties: { linea: string; sentido: string };
    geometry:
      | { type: "LineString"; coordinates: [number, number][] }
      | { type: "MultiLineString"; coordinates: [number, number][][] }
      | { type: string; coordinates: unknown };
  }>;
};

// Una "ruta" agrupa los tramos de un mismo sentido (ida/vuelta/circular) ya
// cosidos en orden — necesario para poder calcular la posición de un punto
// A LO LARGO del recorrido y saber si el destino queda más adelante que el
// origen en esa dirección (y no detrás, o en el tramo de vuelta).
type Ruta = {
  sentido: string;
  paths: [number, number][][]; // cada path: tramo continuo, coords [lng,lat]
};

type LineaProcesada = {
  codigo: string;
  rutas: Ruta[];
};

async function fetchDataJs<T>(url: string): Promise<T> {
  const texto = await fetch(url).then((r) => r.text());
  const idx = texto.indexOf("=");
  const jsonTexto = texto
    .slice(idx + 1)
    .trim()
    .replace(/;\s*$/, "");
  return JSON.parse(jsonTexto) as T;
}

function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Proyección plana local (suficientemente precisa a escala de una ciudad)
// para calcular distancia punto-a-segmento en metros.
function proyectar(lat: number, lng: number, latRef: number) {
  const metrosPorGradoLat = 111320;
  const metrosPorGradoLng = 111320 * Math.cos((latRef * Math.PI) / 180);
  return { x: lng * metrosPorGradoLng, y: lat * metrosPorGradoLat };
}

// Distancia aproximada en metros entre dos puntos [lng,lat] — solo para
// decidir qué tramos van pegados al coser (no hace falta precisión
// geodésica a esta escala).
function distanciaLngLat(a: [number, number], b: [number, number]) {
  const kx = 111320 * Math.cos((-45.86 * Math.PI) / 180);
  const ky = 111320;
  return Math.hypot((a[0] - b[0]) * kx, (a[1] - b[1]) * ky);
}

// El dataset trae cada línea cortada en varios tramos (MultiLineString) sin
// garantía de orden — hay que encadenarlos fin→inicio por proximidad antes
// de poder medir "posición a lo largo de la ruta". Mismo algoritmo que usa
// js/visor.js del mapa oficial (función `coser`).
const GAP_MAX_M = 150;
function coserTramos(parts: [number, number][][]): [number, number][][] {
  if (parts.length <= 1) return parts;
  let mejorOrden: number[] | null = null;
  let mejorCosto = Infinity;
  for (let inicio = 0; inicio < parts.length; inicio++) {
    const usados = new Set([inicio]);
    const orden = [inicio];
    let costo = 0;
    while (usados.size < parts.length) {
      const ultimo = parts[orden[orden.length - 1]];
      const fin = ultimo[ultimo.length - 1];
      let candidato = -1;
      let dMin = Infinity;
      for (let i = 0; i < parts.length; i++) {
        if (usados.has(i)) continue;
        const d = distanciaLngLat(fin, parts[i][0]);
        if (d < dMin) {
          dMin = d;
          candidato = i;
        }
      }
      costo += dMin;
      usados.add(candidato);
      orden.push(candidato);
    }
    if (costo < mejorCosto) {
      mejorCosto = costo;
      mejorOrden = orden;
    }
  }
  const paths: [number, number][][] = [];
  let actual = parts[mejorOrden![0]].slice();
  for (let k = 1; k < mejorOrden!.length; k++) {
    const seg = parts[mejorOrden![k]];
    if (distanciaLngLat(actual[actual.length - 1], seg[0]) > GAP_MAX_M) {
      paths.push(actual);
      actual = seg.slice();
    } else {
      actual = actual.concat(seg);
    }
  }
  paths.push(actual);
  return paths;
}

// Convierte el GeoJSON crudo de una línea (tal cual lo publica la
// Municipalidad) en rutas por sentido, cada una ya cosida en orden.
function procesarLinea(codigo: string, gj: LineaGeoJSON): LineaProcesada {
  const rutasPorSentido = new Map<string, [number, number][][]>();
  for (const f of gj.features) {
    const geom = f.geometry;
    const sentido = String(f.properties?.sentido || "").trim().toLowerCase() || "unico";
    const parts: [number, number][][] =
      geom?.type === "MultiLineString"
        ? (geom.coordinates as [number, number][][])
        : geom?.type === "LineString"
        ? [geom.coordinates as [number, number][]]
        : [];
    const validas = parts.filter((p) => p && p.length >= 2);
    if (!validas.length) continue;
    const stitched = coserTramos(validas);
    const previas = rutasPorSentido.get(sentido) ?? [];
    rutasPorSentido.set(sentido, previas.concat(stitched));
  }
  const rutas = Array.from(rutasPorSentido.entries()).map(([sentido, paths]) => ({
    sentido,
    paths,
  }));
  return { codigo, rutas };
}

// Punto más cercano de UN tramo continuo a un punto dado, con su posición
// acumulada (arc-length en metros) para poder comparar "quién queda más
// adelante" entre dos puntos sobre el mismo tramo.
function puntoMasCercanoEnPath(lat: number, lng: number, path: [number, number][]) {
  const p = proyectar(lat, lng, lat);
  let mejor: { dist: number; pos: number } | null = null;
  let acumulado = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [lngA, latA] = path[i];
    const [lngB, latB] = path[i + 1];
    const a = proyectar(latA, lngA, lat);
    const b = proyectar(latB, lngB, lat);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segLen = Math.hypot(dx, dy);
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * dx;
    const cy = a.y + t * dy;
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (!mejor || d < mejor.dist) mejor = { dist: d, pos: acumulado + segLen * t };
    acumulado += segLen;
  }
  return mejor;
}

function puntoMasCercanoEnRuta(lat: number, lng: number, ruta: Ruta) {
  let mejor: { dist: number } | null = null;
  for (const path of ruta.paths) {
    if (path.length < 2) continue;
    const c = puntoMasCercanoEnPath(lat, lng, path);
    if (c && (!mejor || c.dist < mejor.dist)) mejor = c;
  }
  return mejor;
}

// Distancia mínima de un punto a toda la línea (cualquier sentido) — para
// "qué líneas tenés cerca en general" (no implica que paren justo ahí).
function distanciaALinea(lat: number, lng: number, linea: LineaProcesada) {
  let min = Infinity;
  for (const ruta of linea.rutas) {
    const c = puntoMasCercanoEnRuta(lat, lng, ruta);
    if (c && c.dist < min) min = c.dist;
  }
  return min;
}

// Mismo criterio que usa el mapa oficial para decir "esta línea para en
// este poste": el trazado relevado pasa a 20 m o menos del punto exacto de
// la parada (comodoro-mit.github.io/transporte/js/visor.js, RADIO_PARADA_LINEA).
const RADIO_PARADA_LINEA_M = 20;
function lineasEnParada(lat: number, lng: number, lineas: LineaProcesada[]) {
  return lineas
    .map((linea) => ({ codigo: linea.codigo, distancia: distanciaALinea(lat, lng, linea) }))
    .filter((l) => l.distancia <= RADIO_PARADA_LINEA_M)
    .sort((a, b) => a.distancia - b.distancia)
    .map((l) => l.codigo);
}

type Coords = { lat: number; lng: number };

type Resultado = {
  paradasCercanas: Array<Parada & { distancia: number; lineas: string[] }>;
  lineasCercanas: Array<{ codigo: string; distancia: number }>;
};

// Modo "ruta": no busca lo más cercano a UN punto, sino qué línea te lleva
// realmente de un punto al otro EN ESE SENTIDO.
type ResultadoRuta = {
  paradaOrigen: Parada & { distancia: number; lineas: string[] };
  paradaDestino: Parada & { distancia: number; lineas: string[] };
  lineasOrigen: Array<{ codigo: string; distancia: number }>;
  lineasDestino: Array<{ codigo: string; distancia: number }>;
  lineasDirectas: string[];
};

type OrigenModo = "gps" | "texto";

// "Te sirve directo" exige que origen y destino caigan sobre el MISMO tramo
// cosido (mismo sentido físico) y que el destino quede más adelante que el
// origen en ese recorrido — no alcanza con pasar cerca de los dos puntos
// por separado (eso también lo cumpliría la línea de vuelta). Mismos
// umbrales que el "buscador de línea" del mapa oficial (ahí sigue en
// prototipo, apagado por defecto — por eso lo mostramos como sugerencia,
// no como garantía).
const CAMINATA_MAX_M = 900;
const RECORRIDO_MIN_M = 250;
function buscarLineasDirectas(origen: Coords, destino: Coords, lineas: LineaProcesada[]) {
  const candidatas: { codigo: string; caminataTotal: number }[] = [];
  for (const linea of lineas) {
    for (const ruta of linea.rutas) {
      for (const path of ruta.paths) {
        if (path.length < 2) continue;
        const cOrigen = puntoMasCercanoEnPath(origen.lat, origen.lng, path);
        const cDestino = puntoMasCercanoEnPath(destino.lat, destino.lng, path);
        if (!cOrigen || !cDestino) continue;
        if (cOrigen.dist > CAMINATA_MAX_M || cDestino.dist > CAMINATA_MAX_M) continue;
        if (cDestino.pos - cOrigen.pos < RECORRIDO_MIN_M) continue;
        candidatas.push({ codigo: linea.codigo, caminataTotal: cOrigen.dist + cDestino.dist });
      }
    }
  }
  candidatas.sort((a, b) => a.caminataTotal - b.caminataTotal);
  const vistos = new Set<string>();
  const unicas: string[] = [];
  for (const c of candidatas) {
    if (vistos.has(c.codigo)) continue;
    vistos.add(c.codigo);
    unicas.push(c.codigo);
  }
  return unicas.slice(0, 3);
}

function obtenerUbicacionActual(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("sin-geolocalizacion"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("geolocalizacion-denegada")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

async function geocodificar(direccion: string): Promise<Coords> {
  const resp = await fetch(`/api/geocode?direccion=${encodeURIComponent(direccion.trim())}`);
  if (!resp.ok) throw new Error("geocode falló");
  return resp.json();
}

function urlGoogleMaps(destino: Coords) {
  return `https://www.google.com/maps/dir/?api=1&destination=${destino.lat},${destino.lng}&travelmode=walking`;
}

function BotonesParada({ parada }: { parada: Coords }) {
  return (
    <div className="flex items-center gap-2">
      <a
        href={urlGoogleMaps(parada)}
        target="_blank"
        rel="noopener noreferrer"
        title="Ir hasta esta parada con Google Maps"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#7e57c2]/40 text-[11px] font-semibold text-[#7e57c2] hover:bg-[#7e57c2]/10 transition"
      >
        📍 Ir en Google Maps
      </a>
      <a
        href={MAPA_MCR_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Ver el mapa interactivo completo de Sol Bus (Municipalidad)"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-line text-[11px] font-semibold text-navy hover:bg-paper-2 transition"
      >
        🗺️ Confirmá en el mapa oficial
      </a>
    </div>
  );
}

function LineasDeParada({
  lineas,
  onIrALinea,
}: {
  lineas: string[];
  onIrALinea: (codigo: string) => void;
}) {
  if (lineas.length === 0) {
    return (
      <p className="text-[11px] text-muted">
        Ninguna línea relevada pasa a {RADIO_PARADA_LINEA_M} m o menos de
        este poste — puede que igual paren ahí, confirmá en el mapa.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-muted">Paran acá:</span>
      {lineas.map((codigo) => (
        <button
          key={codigo}
          type="button"
          onClick={() => onIrALinea(codigo)}
          className="inline-flex items-center px-2 py-0.5 rounded-full border-2 border-[#7e57c2]/60 bg-[#7e57c2]/10 text-[#7e57c2] text-[11px] font-extrabold hover:bg-[#7e57c2]/20 transition"
          title="Ver el recorrido completo de esta línea"
        >
          {codigo}
        </button>
      ))}
    </div>
  );
}

export function ZorritoGuia() {
  const [origenModo, setOrigenModo] = useState<OrigenModo>("gps");
  const [origenTexto, setOrigenTexto] = useState("");
  const [destinoTexto, setDestinoTexto] = useState("");
  const [estado, setEstado] = useState<"idle" | "buscando" | "ok" | "error">("idle");
  const [errorTexto, setErrorTexto] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [resultadoRuta, setResultadoRuta] = useState<ResultadoRuta | null>(null);

  function irALinea(codigo: string) {
    const id = `linea-${numeroAncla(codigo)}`;
    const el = document.getElementById(id);
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function reiniciar() {
    setEstado("idle");
    setResultado(null);
    setResultadoRuta(null);
    setErrorTexto(null);
  }

  async function cargarLineas(): Promise<{ paradas: Parada[]; lineas: LineaProcesada[] }> {
    const [paradas, ...lineasRaw] = await Promise.all([
      fetchDataJs<Parada[]>(`${BASE}/paradas_data.js`),
      ...CODIGOS_LINEA.map((c) => fetchDataJs<LineaGeoJSON>(`${BASE}/linea_${c}_data.js`)),
    ]);
    const lineas = CODIGOS_LINEA.map((c, i) => procesarLinea(c, lineasRaw[i]));
    return { paradas, lineas };
  }

  async function buscarPorCoords(lat: number, lng: number) {
    const { paradas, lineas } = await cargarLineas();

    const paradasCercanas = paradas
      .map((p) => ({ ...p, distancia: distanciaMetros(lat, lng, p.lat, p.lng) }))
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 4)
      .map((p) => ({ ...p, lineas: lineasEnParada(p.lat, p.lng, lineas) }));

    const lineasCercanas = lineas
      .map((linea) => ({ codigo: linea.codigo, distancia: distanciaALinea(lat, lng, linea) }))
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 6);

    setResultado({ paradasCercanas, lineasCercanas });
    setEstado("ok");
  }

  async function buscarRutaPorCoords(origen: Coords, destino: Coords) {
    const { paradas, lineas } = await cargarLineas();

    const [paradaOrigenBase] = paradas
      .map((p) => ({ ...p, distancia: distanciaMetros(origen.lat, origen.lng, p.lat, p.lng) }))
      .sort((a, b) => a.distancia - b.distancia);
    const [paradaDestinoBase] = paradas
      .map((p) => ({ ...p, distancia: distanciaMetros(destino.lat, destino.lng, p.lat, p.lng) }))
      .sort((a, b) => a.distancia - b.distancia);

    const paradaOrigen = {
      ...paradaOrigenBase,
      lineas: lineasEnParada(paradaOrigenBase.lat, paradaOrigenBase.lng, lineas),
    };
    const paradaDestino = {
      ...paradaDestinoBase,
      lineas: lineasEnParada(paradaDestinoBase.lat, paradaDestinoBase.lng, lineas),
    };

    const lineasOrigen = lineas
      .map((linea) => ({ codigo: linea.codigo, distancia: distanciaALinea(origen.lat, origen.lng, linea) }))
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 6);
    const lineasDestino = lineas
      .map((linea) => ({ codigo: linea.codigo, distancia: distanciaALinea(destino.lat, destino.lng, linea) }))
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 6);

    const lineasDirectas = buscarLineasDirectas(origen, destino, lineas);

    setResultadoRuta({ paradaOrigen, paradaDestino, lineasOrigen, lineasDestino, lineasDirectas });
    setEstado("ok");
  }

  const origenInvalido = origenModo === "texto" && origenTexto.trim().length < 3;
  const destinoEscrito = destinoTexto.trim().length > 0;
  const destinoInvalido = destinoEscrito && destinoTexto.trim().length < 3;

  async function buscar(e: FormEvent) {
    e.preventDefault();
    if (origenInvalido || destinoInvalido) return;

    setEstado("buscando");
    setErrorTexto(null);
    try {
      const origen =
        origenModo === "gps" ? await obtenerUbicacionActual() : await geocodificar(origenTexto);

      if (destinoTexto.trim().length >= 3) {
        const destino = await geocodificar(destinoTexto);
        await buscarRutaPorCoords(origen, destino);
      } else {
        await buscarPorCoords(origen.lat, origen.lng);
      }
    } catch {
      setErrorTexto(
        origenModo === "gps"
          ? "No pudimos obtener tu ubicación. Probá escribiendo tu dirección."
          : "No pudimos ubicar esa dirección. Probá con calle y altura.",
      );
      setEstado("error");
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[#7e57c2]/40 bg-paper-2 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border-2 border-[#7e57c2]/50 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/zorrito/zorrito-parado.png"
            alt=""
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div>
          <div className="text-sm font-extrabold text-navy">Zorrito Guía</div>
          <div className="text-xs text-muted">
            ¿De dónde a dónde vas? Te digo qué paradas y líneas tenés cerca.
          </div>
        </div>
      </div>

      {estado === "idle" && (
        <form onSubmit={buscar} className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              📍 ¿Dónde estás?
            </span>
            {origenModo === "gps" ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-sm text-navy">
                <span>Uso tu ubicación actual</span>
                <button
                  type="button"
                  onClick={() => setOrigenModo("texto")}
                  className="text-[11px] font-semibold text-[#7e57c2] underline underline-offset-4 shrink-0"
                >
                  Prefiero escribir la dirección
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={origenTexto}
                  onChange={(e) => setOrigenTexto(e.target.value)}
                  placeholder="Tu dirección (ej: Rivadavia 1200)"
                  className="px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-sm focus:outline-none focus:border-[#7e57c2] focus:ring-2 focus:ring-[#7e57c2]/20"
                />
                <button
                  type="button"
                  onClick={() => {
                    setOrigenModo("gps");
                    setOrigenTexto("");
                  }}
                  className="text-[11px] font-semibold text-[#7e57c2] underline underline-offset-4 self-start"
                >
                  Usar mi ubicación actual
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              🎯 ¿A dónde vas? (opcional)
            </span>
            <input
              type="text"
              value={destinoTexto}
              onChange={(e) => setDestinoTexto(e.target.value)}
              placeholder="Calle y altura (ej: Rivadavia 1200)"
              className="px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-sm focus:outline-none focus:border-[#7e57c2] focus:ring-2 focus:ring-[#7e57c2]/20"
            />
            <span className="text-[11px] text-muted">
              Si lo dejás vacío, te muestro paradas y líneas cerca de dónde estás.
            </span>
          </div>

          <button
            type="submit"
            disabled={origenInvalido || destinoInvalido}
            className="w-full px-4 py-2.5 rounded-xl bg-[#7e57c2] text-white font-bold text-sm hover:scale-[1.02] transition disabled:opacity-40 disabled:hover:scale-100"
          >
            Buscar
          </button>
        </form>
      )}

      {estado === "buscando" && (
        <div className="text-sm text-muted text-center py-2">
          {destinoEscrito
            ? "Ubicando los dos puntos y buscando qué línea te conecta…"
            : "Buscando paradas y líneas cerca tuyo…"}
        </div>
      )}

      {estado === "error" && (
        <div className="flex flex-col gap-2 items-center py-2">
          <div className="text-sm text-svc-red text-center">{errorTexto}</div>
          <button
            type="button"
            onClick={reiniciar}
            className="text-xs text-navy-2 underline underline-offset-4"
          >
            Probar de nuevo
          </button>
          <a
            href={MAPA_MCR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#7e57c2] underline underline-offset-4"
          >
            O usá el mapa interactivo completo
          </a>
        </div>
      )}

      {estado === "ok" && resultado && (
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
              Paradas más cercanas
            </div>
            <div className="flex flex-col gap-2">
              {resultado.paradasCercanas.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-line bg-paper px-3 py-2 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-navy min-w-0 truncate">
                      {p.calle} y {p.esquina}
                      {p.refugio && " 🏠"}
                    </span>
                    <span className="text-xs text-muted font-mono shrink-0">
                      {Math.round(p.distancia)} m
                    </span>
                  </div>
                  <LineasDeParada lineas={p.lineas} onIrALinea={irALinea} />
                  <BotonesParada parada={p} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
              Líneas que pasan cerca
            </div>
            <div className="flex flex-wrap gap-2">
              {resultado.lineasCercanas.map((l) => (
                <button
                  key={l.codigo}
                  type="button"
                  onClick={() => irALinea(l.codigo)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#7e57c2]/60 bg-[#7e57c2]/10 text-[#7e57c2] text-xs font-extrabold hover:bg-[#7e57c2]/20 transition"
                  title="Ver el recorrido completo de esta línea"
                >
                  {l.codigo}
                  <span className="font-normal text-navy">
                    · {Math.round(l.distancia)} m
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={reiniciar}
            className="text-xs text-navy-2 underline underline-offset-4 self-center mt-1"
          >
            Buscar de nuevo
          </button>
        </div>
      )}

      {estado === "ok" && resultadoRuta && (
        <div className="flex flex-col gap-3">
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-lg border border-line bg-paper px-3 py-2 flex flex-col gap-1.5">
              <div className="text-[11px] text-muted">Parada más cercana a vos</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-navy min-w-0 truncate">
                  {resultadoRuta.paradaOrigen.calle} y{" "}
                  {resultadoRuta.paradaOrigen.esquina}
                  {resultadoRuta.paradaOrigen.refugio && " 🏠"}
                </span>
                <span className="text-xs text-muted font-mono shrink-0">
                  {Math.round(resultadoRuta.paradaOrigen.distancia)} m
                </span>
              </div>
              <LineasDeParada lineas={resultadoRuta.paradaOrigen.lineas} onIrALinea={irALinea} />
              <BotonesParada parada={resultadoRuta.paradaOrigen} />
            </div>
            <div className="rounded-lg border border-line bg-paper px-3 py-2 flex flex-col gap-1.5">
              <div className="text-[11px] text-muted">Parada más cercana a tu destino</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-navy min-w-0 truncate">
                  {resultadoRuta.paradaDestino.calle} y{" "}
                  {resultadoRuta.paradaDestino.esquina}
                  {resultadoRuta.paradaDestino.refugio && " 🏠"}
                </span>
                <span className="text-xs text-muted font-mono shrink-0">
                  {Math.round(resultadoRuta.paradaDestino.distancia)} m
                </span>
              </div>
              <LineasDeParada lineas={resultadoRuta.paradaDestino.lineas} onIrALinea={irALinea} />
              <BotonesParada parada={resultadoRuta.paradaDestino} />
            </div>
          </div>

          {resultadoRuta.lineasDirectas.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                🎯 Te sirven directo, en tu sentido
              </div>
              <div className="flex flex-wrap gap-2">
                {resultadoRuta.lineasDirectas.map((codigo) => (
                  <button
                    key={codigo}
                    type="button"
                    onClick={() => irALinea(codigo)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#7e57c2]/60 bg-[#7e57c2]/10 text-[#7e57c2] text-xs font-extrabold hover:bg-[#7e57c2]/20 transition"
                    title="Ver el recorrido completo de esta línea"
                  >
                    {codigo}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted mt-1">
                Confirmamos que el recorrido avanza de tu punto de partida
                hacia tu destino, no solo que pasa cerca de los dos — pero el
                trazado puede tener errores de relevamiento. Fijate el cartel
                de la parada antes de subir.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Líneas cercanas a tu punto de partida
              </div>
              <div className="flex flex-wrap gap-2">
                {resultadoRuta.lineasOrigen.map((l) => (
                  <button
                    key={l.codigo}
                    type="button"
                    onClick={() => irALinea(l.codigo)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line text-[11px] font-semibold text-navy hover:bg-paper-2 transition"
                    title="Ver el recorrido completo de esta línea"
                  >
                    {l.codigo} <span className="text-muted font-normal">· {Math.round(l.distancia)} m</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Líneas cercanas a tu destino
              </div>
              <div className="flex flex-wrap gap-2">
                {resultadoRuta.lineasDestino.map((l) => (
                  <button
                    key={l.codigo}
                    type="button"
                    onClick={() => irALinea(l.codigo)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line text-[11px] font-semibold text-navy hover:bg-paper-2 transition"
                    title="Ver el recorrido completo de esta línea"
                  >
                    {l.codigo} <span className="text-muted font-normal">· {Math.round(l.distancia)} m</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {resultadoRuta.lineasDirectas.length === 0 && (
            <p className="text-[11px] text-muted">
              Ninguna línea relevada avanza de tu origen hacia tu destino en
              el mismo recorrido — puede que necesites caminar bastante o
              hacer una combinación. Probá el{" "}
              <a
                href={MAPA_MCR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                mapa interactivo completo
              </a>
              .
            </p>
          )}

          <button
            type="button"
            onClick={reiniciar}
            className="text-xs text-navy-2 underline underline-offset-4 self-center mt-1"
          >
            Buscar otra ruta
          </button>
        </div>
      )}
    </div>
  );
}
