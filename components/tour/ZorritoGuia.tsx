"use client";

import { useState, type FormEvent } from "react";

/**
 * "Zorrito Guía" — responde ¿dónde estoy? ¿qué paradas hay? ¿qué líneas pasan
 * por acá?, usando los datos geográficos reales y públicos que publica la
 * Municipalidad para su propio mapa interactivo (comodoro-mit.github.io).
 * No se copian esos datos al repo: se consultan en vivo (CORS abierto), así
 * nunca quedan desactualizados si la Municipalidad corrige un recorrido.
 */

const BASE = "https://comodoro-mit.github.io/transporte/layers_transporte";

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
  lineasComunes: Array<{ codigo: string; distOrigen: number; distDestino: number }>;
};

type Modo = "aca" | "destino" | "ruta";

// Si ni la mejor línea candidata pasa razonablemente cerca de los dos
// puntos, probablemente haga falta combinación — se lo avisamos al usuario
// en vez de sugerir una línea que en la práctica no le sirve.
const DISTANCIA_RUTA_RAZONABLE_M = 1200;

export function ZorritoGuia() {
  const [modo, setModo] = useState<Modo>("aca");
  const [estado, setEstado] = useState<"idle" | "buscando" | "ok" | "error">("idle");
  const [errorTexto, setErrorTexto] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [resultadoRuta, setResultadoRuta] = useState<ResultadoRuta | null>(null);
  const [destinoTexto, setDestinoTexto] = useState("");
  const [destinoTextoRuta, setDestinoTextoRuta] = useState("");

  function irALinea(codigo: string) {
    const id = `linea-${numeroAncla(codigo)}`;
    const el = document.getElementById(id);
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
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

  function buscar() {
    if (!navigator.geolocation) {
      setErrorTexto("Tu navegador no soporta geolocalización.");
      setEstado("error");
      return;
    }
    setEstado("buscando");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await buscarPorCoords(pos.coords.latitude, pos.coords.longitude);
        } catch {
          setErrorTexto("No pudimos calcular paradas y líneas cercanas ahora.");
          setEstado("error");
        }
      },
      () => {
        setErrorTexto("No pudimos obtener tu ubicación.");
        setEstado("error");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function buscarDestino(e: FormEvent) {
    e.preventDefault();
    if (destinoTexto.trim().length < 3) return;
    setEstado("buscando");
    try {
      const resp = await fetch(
        `/api/geocode?direccion=${encodeURIComponent(destinoTexto.trim())}`,
      );
      if (!resp.ok) throw new Error("geocode falló");
      const { lat, lng } = await resp.json();
      await buscarPorCoords(lat, lng);
    } catch {
      setErrorTexto("No pudimos ubicar esa dirección. Probá con calle y altura.");
      setEstado("error");
    }
  }

  async function buscarRutaPorCoords(
    origenLat: number,
    origenLng: number,
    destLat: number,
    destLng: number,
  ) {
    const [paradas, ...lineas] = await Promise.all([
      fetchDataJs<Parada[]>(`${BASE}/paradas_data.js`),
      ...CODIGOS_LINEA.map((c) => fetchDataJs<LineaGeoJSON>(`${BASE}/linea_${c}_data.js`)),
    ]);

    const [paradaOrigen] = paradas
      .map((p) => ({ ...p, distancia: distanciaMetros(origenLat, origenLng, p.lat, p.lng) }))
      .sort((a, b) => a.distancia - b.distancia);
    const [paradaDestino] = paradas
      .map((p) => ({ ...p, distancia: distanciaMetros(destLat, destLng, p.lat, p.lng) }))
      .sort((a, b) => a.distancia - b.distancia);

    const lineasComunes = CODIGOS_LINEA.map((codigo, i) => ({
      codigo,
      distOrigen: distanciaAminea(origenLat, origenLng, lineas[i]),
      distDestino: distanciaAminea(destLat, destLng, lineas[i]),
    }))
      .sort((a, b) => a.distOrigen + a.distDestino - (b.distOrigen + b.distDestino))
      .slice(0, 5);

    setResultadoRuta({ paradaOrigen, paradaDestino, lineasComunes });
    setEstado("ok");
  }

  function buscarRuta(e: FormEvent) {
    e.preventDefault();
    if (destinoTextoRuta.trim().length < 3) return;
    if (!navigator.geolocation) {
      setErrorTexto("Tu navegador no soporta geolocalización.");
      setEstado("error");
      return;
    }
    setEstado("buscando");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        (async () => {
          try {
            const resp = await fetch(
              `/api/geocode?direccion=${encodeURIComponent(destinoTextoRuta.trim())}`,
            );
            if (!resp.ok) throw new Error("geocode falló");
            const { lat, lng } = await resp.json();
            await buscarRutaPorCoords(pos.coords.latitude, pos.coords.longitude, lat, lng);
          } catch {
            setErrorTexto("No pudimos ubicar ese destino o tu posición actual.");
            setEstado("error");
          }
        })();
      },
      () => {
        setErrorTexto("No pudimos obtener tu ubicación.");
        setEstado("error");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
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
            {modo === "aca"
              ? "¿Dónde estoy? ¿Qué paradas y líneas tengo cerca?"
              : modo === "destino"
                ? "¿A dónde vas? Te muestro la parada y línea más cercanas al destino."
                : "¿De dónde a dónde vas? Te digo qué línea te conecta los dos puntos."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => cambiarModo("aca")}
          className={`px-2 py-2 rounded-lg text-xs font-bold transition ${
            modo === "aca"
              ? "bg-[#7e57c2] text-white"
              : "bg-paper border border-line text-navy hover:bg-paper-2"
          }`}
        >
          📍 ¿Dónde estoy?
        </button>
        <button
          type="button"
          onClick={() => cambiarModo("destino")}
          className={`px-2 py-2 rounded-lg text-xs font-bold transition ${
            modo === "destino"
              ? "bg-[#7e57c2] text-white"
              : "bg-paper border border-line text-navy hover:bg-paper-2"
          }`}
        >
          🎯 ¿A dónde vas?
        </button>
        <button
          type="button"
          onClick={() => cambiarModo("ruta")}
          className={`px-2 py-2 rounded-lg text-xs font-bold transition ${
            modo === "ruta"
              ? "bg-[#7e57c2] text-white"
              : "bg-paper border border-line text-navy hover:bg-paper-2"
          }`}
        >
          🧭 De acá a dónde voy
        </button>
      </div>

      {estado === "idle" && modo === "aca" && (
        <button
          type="button"
          onClick={buscar}
          className="w-full px-4 py-2.5 rounded-xl bg-[#7e57c2] text-white font-bold text-sm hover:scale-[1.02] transition"
        >
          📍 Usar mi ubicación
        </button>
      )}

      {estado === "idle" && modo === "destino" && (
        <form onSubmit={buscarDestino} className="flex gap-2">
          <input
            type="text"
            value={destinoTexto}
            onChange={(e) => setDestinoTexto(e.target.value)}
            placeholder="Calle y altura (ej: Rivadavia 1200)"
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-sm focus:outline-none focus:border-[#7e57c2] focus:ring-2 focus:ring-[#7e57c2]/20"
          />
          <button
            type="submit"
            disabled={destinoTexto.trim().length < 3}
            className="px-4 py-2.5 rounded-xl bg-[#7e57c2] text-white font-bold text-sm hover:scale-[1.02] transition disabled:opacity-40 disabled:hover:scale-100"
          >
            Buscar
          </button>
        </form>
      )}

      {estado === "idle" && modo === "ruta" && (
        <form onSubmit={buscarRuta} className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={destinoTextoRuta}
              onChange={(e) => setDestinoTextoRuta(e.target.value)}
              placeholder="¿A dónde vas? (ej: Rivadavia 1200)"
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-line-strong bg-paper text-navy text-sm focus:outline-none focus:border-[#7e57c2] focus:ring-2 focus:ring-[#7e57c2]/20"
            />
            <button
              type="submit"
              disabled={destinoTextoRuta.trim().length < 3}
              className="px-4 py-2.5 rounded-xl bg-[#7e57c2] text-white font-bold text-sm hover:scale-[1.02] transition disabled:opacity-40 disabled:hover:scale-100"
            >
              Buscar
            </button>
          </div>
          <span className="text-[11px] text-muted">
            Uso tu ubicación actual como punto de partida.
          </span>
        </form>
      )}

      {estado === "buscando" && (
        <div className="text-sm text-muted text-center py-2">
          {modo === "aca"
            ? "Buscando paradas y líneas cerca tuyo…"
            : modo === "destino"
              ? "Ubicando esa dirección y buscando paradas y líneas cerca…"
              : "Ubicando tu posición y el destino, buscando qué línea te conecta…"}
        </div>
      )}

      {estado === "error" && (
        <div className="text-sm text-svc-red text-center py-2">
          {errorTexto} Probá de nuevo o usá el{" "}
          <a
            href="https://comodoro-mit.github.io/transporte"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            mapa interactivo completo
          </a>
          .
        </div>
      )}

      {estado === "ok" && resultado && (
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
              {modo === "aca" ? "Paradas más cercanas" : "Paradas cerca del destino"}
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
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=walking`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ir hasta esta parada con Google Maps"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#7e57c2]/40 text-[11px] font-semibold text-[#7e57c2] hover:bg-[#7e57c2]/10 transition"
                    >
                      📍 Ir en Google Maps
                    </a>
                    <a
                      href="https://comodoro-mit.github.io/transporte"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver el mapa interactivo completo de Sol Bus"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-line text-[11px] font-semibold text-navy hover:bg-paper-2 transition"
                    >
                      🗺️ Mapa Sol Bus
                    </a>
                  </div>
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
            onClick={() => {
              setEstado("idle");
              setResultado(null);
            }}
            className="text-xs text-navy-2 underline underline-offset-4 self-center mt-1"
          >
            {modo === "aca" ? "Volver a buscar mi ubicación" : "Buscar otro destino"}
          </button>
        </div>
      )}

      {estado === "ok" && resultadoRuta && (
        <div className="flex flex-col gap-3">
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-lg border border-line bg-paper px-3 py-2">
              <div className="text-[11px] text-muted mb-1">
                Parada más cercana a vos
              </div>
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
            </div>
            <div className="rounded-lg border border-line bg-paper px-3 py-2">
              <div className="text-[11px] text-muted mb-1">
                Parada más cercana a tu destino
              </div>
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
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
              Líneas que te acercan a los dos puntos
            </div>
            <div className="flex flex-col gap-2">
              {resultadoRuta.lineasComunes.map((l) => (
                <button
                  key={l.codigo}
                  type="button"
                  onClick={() => irALinea(l.codigo)}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-2 border-[#7e57c2]/60 bg-[#7e57c2]/10 hover:bg-[#7e57c2]/20 transition text-left"
                  title="Ver el recorrido completo de esta línea"
                >
                  <span className="text-[#7e57c2] text-sm font-extrabold">{l.codigo}</span>
                  <span className="text-[11px] text-navy">
                    Cerca tuyo: {Math.round(l.distOrigen)} m · Cerca del destino: {Math.round(l.distDestino)} m
                  </span>
                </button>
              ))}
            </div>
            {resultadoRuta.lineasComunes[0] &&
            resultadoRuta.lineasComunes[0].distOrigen + resultadoRuta.lineasComunes[0].distDestino >
              DISTANCIA_RUTA_RAZONABLE_M ? (
              <p className="text-[11px] text-muted mt-2">
                Ninguna línea pasa muy cerca de los dos puntos a la vez —
                puede que necesites caminar bastante o hacer una combinación.
                Probá el{" "}
                <a
                  href="https://comodoro-mit.github.io/transporte"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  mapa interactivo completo
                </a>
                .
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              setEstado("idle");
              setResultadoRuta(null);
            }}
            className="text-xs text-navy-2 underline underline-offset-4 self-center mt-1"
          >
            Buscar otra ruta
          </button>
        </div>
      )}
    </div>
  );
}
