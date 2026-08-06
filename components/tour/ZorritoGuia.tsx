"use client";

import { useState, type FormEvent } from "react";

/**
 * "Zorrito Guía" — responde ¿dónde estoy? ¿qué paradas hay? ¿qué líneas pasan
 * por acá?, usando los datos geográficos reales y públicos que publica la
 * Municipalidad para su propio mapa interactivo (comodoro-mit.github.io).
 * No se copian esos datos al repo: se consultan en vivo (CORS abierto), así
 * nunca quedan desactualizados si la Municipalidad corrige un recorrido.
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

function distPuntoSegmento(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function distanciaSegmentos(p: { x: number; y: number }, lat: number, coords: [number, number][]) {
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lngA, latA] = coords[i];
    const [lngB, latB] = coords[i + 1];
    const a = proyectar(latA, lngA, lat);
    const b = proyectar(latB, lngB, lat);
    const d = distPuntoSegmento(p.x, p.y, a.x, a.y, b.x, b.y);
    if (d < min) min = d;
  }
  return min;
}

function distanciaAminea(lat: number, lng: number, linea: LineaGeoJSON) {
  const p = proyectar(lat, lng, lat);
  let min = Infinity;
  for (const f of linea.features) {
    const geom = f.geometry;
    if (geom?.type === "LineString") {
      const d = distanciaSegmentos(p, lat, geom.coordinates as [number, number][]);
      if (d < min) min = d;
    } else if (geom?.type === "MultiLineString") {
      for (const linea2 of geom.coordinates as [number, number][][]) {
        const d = distanciaSegmentos(p, lat, linea2);
        if (d < min) min = d;
      }
    }
  }
  return min;
}

type Coords = { lat: number; lng: number };

type Resultado = {
  paradasCercanas: Array<Parada & { distancia: number }>;
  lineasCercanas: Array<{ codigo: string; distancia: number }>;
};

// Modo "ruta": no busca lo más cercano a UN punto, sino qué líneas pasan
// cerca de los DOS puntos a la vez (tu ubicación y el destino), para
// responder "qué colectivo me lleva de acá hasta allá".
type ResultadoRuta = {
  paradaOrigen: Parada & { distancia: number };
  paradaDestino: Parada & { distancia: number };
  lineasOrigen: Array<{ codigo: string; distancia: number }>;
  lineasDestino: Array<{ codigo: string; distancia: number }>;
  lineasDirectas: string[];
};

type OrigenModo = "gps" | "texto";

// Una línea "sirve directo" solo si pasa razonablemente cerca de los DOS
// puntos por separado — no alcanza con que pase cerca de uno solo. No
// verifica sentido/dirección real, así que es una pista, no una garantía.
const DISTANCIA_DIRECTA_RAZONABLE_M = 600;

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
        🗺️ Mapa Sol Bus
      </a>
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

  async function buscarPorCoords(lat: number, lng: number) {
    const [paradas, ...lineas] = await Promise.all([
      fetchDataJs<Parada[]>(`${BASE}/paradas_data.js`),
      ...CODIGOS_LINEA.map((c) => fetchDataJs<LineaGeoJSON>(`${BASE}/linea_${c}_data.js`)),
    ]);

    const paradasCercanas = paradas
      .map((p) => ({ ...p, distancia: distanciaMetros(lat, lng, p.lat, p.lng) }))
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 4);

    const lineasCercanas = CODIGOS_LINEA.map((codigo, i) => ({
      codigo,
      distancia: distanciaAminea(lat, lng, lineas[i]),
    }))
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 6);

    setResultado({ paradasCercanas, lineasCercanas });
    setEstado("ok");
  }

  async function buscarRutaPorCoords(origen: Coords, destino: Coords) {
    const [paradas, ...lineas] = await Promise.all([
      fetchDataJs<Parada[]>(`${BASE}/paradas_data.js`),
      ...CODIGOS_LINEA.map((c) => fetchDataJs<LineaGeoJSON>(`${BASE}/linea_${c}_data.js`)),
    ]);

    const [paradaOrigen] = paradas
      .map((p) => ({ ...p, distancia: distanciaMetros(origen.lat, origen.lng, p.lat, p.lng) }))
      .sort((a, b) => a.distancia - b.distancia);
    const [paradaDestino] = paradas
      .map((p) => ({ ...p, distancia: distanciaMetros(destino.lat, destino.lng, p.lat, p.lng) }))
      .sort((a, b) => a.distancia - b.distancia);

    const distancias = CODIGOS_LINEA.map((codigo, i) => ({
      codigo,
      distOrigen: distanciaAminea(origen.lat, origen.lng, lineas[i]),
      distDestino: distanciaAminea(destino.lat, destino.lng, lineas[i]),
    }));

    const lineasOrigen = distancias
      .map((d) => ({ codigo: d.codigo, distancia: d.distOrigen }))
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 6);
    const lineasDestino = distancias
      .map((d) => ({ codigo: d.codigo, distancia: d.distDestino }))
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 6);

    // Directa = pasa cerca de los dos puntos por separado (no un promedio
    // combinado, que puede mezclar el tramo de ida con el de vuelta).
    const lineasDirectas = distancias
      .filter(
        (d) =>
          d.distOrigen <= DISTANCIA_DIRECTA_RAZONABLE_M &&
          d.distDestino <= DISTANCIA_DIRECTA_RAZONABLE_M,
      )
      .map((d) => d.codigo);

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
              <BotonesParada parada={resultadoRuta.paradaDestino} />
            </div>
          </div>

          {resultadoRuta.lineasDirectas.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                🎯 Te sirven directo (pasan cerca de los dos puntos)
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
                Es una estimación por cercanía, no confirma el sentido exacto — fijate el recorrido antes de subir.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Líneas cerca de tu punto de partida
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
                Líneas cerca de tu destino
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
              Ninguna línea pasa cerca de los dos puntos a la vez —
              puede que necesites caminar bastante o hacer una combinación.
              Probá el{" "}
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
