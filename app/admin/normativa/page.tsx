import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeVerNormativa } from "@/lib/admin";
import { armarExtracto, normalizarTexto } from "@/lib/normativa";
import type { EstadoNorma, Prisma, TipoNorma } from "@prisma/client";

export const metadata = { title: "Normativa · Panel ENCOSEP" };

// Servicios con los que se clasifica la normativa (claves guardadas en
// Norma.servicios, ver scripts/cargar-normas.ts).
const SERVICIO_LABEL: Record<string, string> = {
  marco: "Marco general y ENCOSEP",
  agua: "Agua y cloacas",
  energia: "Energía y alumbrado",
  transporte: "Transporte colectivo",
  taxis: "Taxis y remises",
  higiene: "Higiene urbana",
  convenios_scpl: "Convenios SCPL",
};

type SP = {
  q?: string;
  servicio?: string;
  tipo?: string;
  vigencia?: string;
  desde?: string;
  hasta?: string;
  pagina?: string;
};

// Resultados por página
const POR_PAGINA = 25;

function anioValido(v: string | undefined): number | undefined {
  const n = Number(v);
  return v && Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : undefined;
}

export default async function NormativaPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const session = await auth();
  if (!session || !puedeVerNormativa(session.user.rol)) redirect("/admin");

  const desde = anioValido(sp.desde);
  const hasta = anioValido(sp.hasta);

  const where: Prisma.NormaWhereInput = {};
  if (sp.servicio && sp.servicio in SERVICIO_LABEL) {
    where.servicios = { has: sp.servicio };
  }
  if (sp.tipo === "ORD" || sp.tipo === "RES") where.tipo = sp.tipo as TipoNorma;
  if (sp.vigencia === "VIGENTE" || sp.vigencia === "DEROGADA") {
    where.estado = sp.vigencia as EstadoNorma;
  }
  if (desde || hasta) where.anio = { gte: desde, lte: hasta };

  // Livianas: sin el texto completo (omit), que puede pesar bastante.
  const OMITIR_TEXTO = { texto: true, textoBusqueda: true } as const;
  const [total, candidatas] = await Promise.all([
    prisma.norma.count(),
    prisma.norma.findMany({ where, omit: OMITIR_TEXTO }),
  ]);

  // Buscador: cada palabra (sin importar mayúsculas, acentos ni orden) tiene
  // que aparecer en el número, el año, el tema o el texto completo. Para el
  // texto se le pregunta a la base cuántas veces aparece cada palabra en
  // textoBusqueda, así no se trae el texto de todas las normas.
  const palabras = normalizarTexto(sp.q ?? "").split(/\s+/).filter(Boolean);
  const coincidenciasTexto = new Map<string, number>(); // id → total de apariciones
  const enTextoPorPalabra: Map<string, number>[] = [];
  for (const p of palabras) {
    const filas = await prisma.$queryRaw<{ id: string; n: number }[]>`
      SELECT "id", ((length("textoBusqueda") - length(replace("textoBusqueda", ${p}, ''))) / length(${p}))::int AS n
      FROM "Norma"
      WHERE "textoBusqueda" IS NOT NULL AND position(${p} in "textoBusqueda") > 0`;
    const m = new Map(filas.map((f) => [f.id, Number(f.n)]));
    enTextoPorPalabra.push(m);
    for (const [id, n] of m) coincidenciasTexto.set(id, (coincidenciasTexto.get(id) ?? 0) + n);
  }

  const relevancia = new Map<string, number>();
  const filtradas = candidatas.filter((n) => {
    if (palabras.length === 0) return true;
    const pajar = normalizarTexto(
      `${n.tipo === "ORD" ? "ordenanza ord" : "resolucion res"} ${n.numero} ${n.anio} ${n.tema}`,
    );
    let puntos = 0;
    const ok = palabras.every((p, i) => {
      const enMeta = pajar.includes(p);
      const enTexto = enTextoPorPalabra[i].get(n.id) ?? 0;
      puntos += enTexto + (enMeta ? 5 : 0); // coincidir en el tema pesa más
      return enMeta || enTexto > 0;
    });
    relevancia.set(n.id, puntos);
    return ok;
  });
  const porAnio = (a: (typeof filtradas)[number], b: (typeof filtradas)[number]) =>
    b.anio - a.anio || (parseInt(b.numero, 10) || 0) - (parseInt(a.numero, 10) || 0);
  filtradas.sort((a, b) =>
    palabras.length > 0
      ? (relevancia.get(b.id) ?? 0) - (relevancia.get(a.id) ?? 0) || porAnio(a, b)
      : porAnio(a, b),
  );

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const pagina = Math.min(Math.max(1, parseInt(sp.pagina ?? "1", 10) || 1), totalPaginas);
  const normas = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  // Recién ahora se trae el texto, solo de las normas de esta página, para los extractos
  const extractos = new Map<string, ReturnType<typeof armarExtracto>>();
  if (palabras.length > 0 && normas.length > 0) {
    const conTexto = await prisma.norma.findMany({
      where: { id: { in: normas.map((n) => n.id) }, texto: { not: null } },
      select: { id: true, texto: true },
    });
    for (const t of conTexto) extractos.set(t.id, armarExtracto(t.texto ?? "", palabras));
  }

  // Link a otra página conservando los filtros
  const hrefPagina = (n: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "pagina") qs.set(k, v);
    if (n > 1) qs.set("pagina", String(n));
    const str = qs.toString();
    return `/admin/normativa${str ? `?${str}` : ""}`;
  };

  const hayFiltros = Boolean(
    sp.q || sp.servicio || sp.tipo || sp.vigencia || desde || hasta,
  );

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">Normativa</h1>
        <p className="text-sm text-muted mt-1">
          Ordenanzas y resoluciones municipales de los servicios públicos
          controlados. Uso interno del equipo.
        </p>
      </header>

      <section
        aria-label="Avisos"
        className="rounded-xl border border-svc-yellow/60 bg-svc-yellow/20 p-4 text-sm text-navy"
      >
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>
            La clasificación por servicio sale del relevamiento del 20/10/2026
            y puede tener omisiones.
          </li>
          <li>
            La vigencia es la que informa el Digesto. Verificala antes de citar
            una norma en un dictamen.
          </li>
          <li>Los textos son los oficiales del Digesto Municipal.</li>
          <li>
            El texto se obtuvo por lectura automática (OCR) de los PDF y puede
            tener errores. Para citar, abrí siempre el PDF oficial.
          </li>
        </ul>
      </section>

      <form
        method="GET"
        className="flex flex-wrap gap-2 items-end p-3 rounded-xl border border-line bg-paper"
      >
        <Field label="Buscar" className="w-full sm:flex-1 sm:min-w-[220px]">
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Número, año, tema o palabras del texto (ej. taxis, 17383, tarifa)"
            className="w-full px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
          />
        </Field>
        <Field label="Servicio">
          <select
            name="servicio"
            defaultValue={sp.servicio ?? ""}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
          >
            <option value="">Todos</option>
            {Object.entries(SERVICIO_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipo">
          <select
            name="tipo"
            defaultValue={sp.tipo ?? ""}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
          >
            <option value="">Todos</option>
            <option value="ORD">Ordenanza</option>
            <option value="RES">Resolución</option>
          </select>
        </Field>
        <Field label="Vigencia">
          <select
            name="vigencia"
            defaultValue={sp.vigencia ?? ""}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
          >
            <option value="">Todas</option>
            <option value="VIGENTE">Vigentes según Digesto</option>
            <option value="DEROGADA">Derogadas</option>
          </select>
        </Field>
        <Field label="Año desde">
          <input
            type="number"
            name="desde"
            defaultValue={desde ?? ""}
            min={1900}
            max={2100}
            placeholder="1974"
            className="w-24 px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
          />
        </Field>
        <Field label="Año hasta">
          <input
            type="number"
            name="hasta"
            defaultValue={hasta ?? ""}
            min={1900}
            max={2100}
            placeholder="2026"
            className="w-24 px-3 py-2 rounded-lg border border-line-strong bg-paper text-sm text-navy"
          />
        </Field>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-navy-2 text-white font-semibold text-sm"
        >
          Aplicar
        </button>
        {hayFiltros && (
          <Link
            href="/admin/normativa"
            className="px-4 py-2 rounded-lg border border-line-strong text-sm text-navy"
          >
            Limpiar
          </Link>
        )}
      </form>

      <p className="text-xs text-muted">
        {filtradas.length === total
          ? `${total} normas`
          : `${filtradas.length} de ${total} normas`}
        {totalPaginas > 1 && ` · página ${pagina} de ${totalPaginas}`}
      </p>

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper p-12 text-center text-muted text-sm">
          No hay normas para mostrar con esos filtros.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {normas.map((n) => {
            const derogada = n.estado === "DEROGADA";
            return (
              <li
                key={n.id}
                className="rounded-2xl border border-line bg-paper p-4 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-bold text-navy">
                      {n.tipo === "ORD" ? "Ordenanza" : "Resolución"} {n.numero}/
                      {n.anio}
                    </div>
                    <div className="text-sm text-navy mt-0.5 break-words">
                      {n.tema}
                    </div>
                  </div>
                  {derogada && (
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border border-svc-red/60 bg-svc-red text-white text-[11px] font-bold uppercase tracking-wider">
                      Derogada
                    </span>
                  )}
                </div>

                {derogada && n.derogadaPor && (
                  <p className="text-sm font-semibold text-svc-red">
                    Derogada por {n.derogadaPor}
                  </p>
                )}
                {n.derogaA && (
                  <p className="text-xs text-muted">Deroga o reemplaza a {n.derogaA}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {n.servicios.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-full border border-line-strong bg-paper-3 text-[11px] text-navy"
                    >
                      {SERVICIO_LABEL[s] ?? s}
                    </span>
                  ))}
                  {n.fechaPublicacionBO && (
                    <span className="px-2 py-0.5 text-[11px] text-muted">
                      Publicada en el BO el {n.fechaPublicacionBO}
                    </span>
                  )}
                </div>

                {n.notas && <p className="text-xs text-muted">{n.notas}</p>}

                {extractos.get(n.id) && (
                  <div className="rounded-lg bg-paper-2 border border-line p-3 text-xs text-navy leading-relaxed">
                    <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                      En el texto: {coincidenciasTexto.get(n.id) ?? 0}{" "}
                      {coincidenciasTexto.get(n.id) === 1 ? "coincidencia" : "coincidencias"}
                    </div>
                    <p className="break-words">
                      {extractos.get(n.id)!.map((f, i) =>
                        f.marcado ? (
                          <mark key={i} className="bg-svc-yellow/40 text-navy rounded px-0.5">
                            {f.texto}
                          </mark>
                        ) : (
                          <span key={i}>{f.texto}</span>
                        ),
                      )}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {n.urlPdf ? (
                    <a
                      href={n.urlPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-svc-red text-white text-sm font-bold"
                    >
                      Abrir PDF oficial
                    </a>
                  ) : (
                    <span className="inline-flex items-center px-3 py-2 text-xs text-muted">
                      Sin PDF del Digesto
                    </span>
                  )}
                  {n.urlFicha && (
                    <a
                      href={n.urlFicha}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-line-strong text-sm text-navy font-semibold"
                    >
                      Ficha Digesto
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPaginas > 1 && (
        <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Paginación">
          {pagina > 1 ? (
            <Link
              href={hrefPagina(pagina - 1)}
              className="px-4 py-2 rounded-lg border border-line-strong text-navy font-semibold"
            >
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted">
            Página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas ? (
            <Link
              href={hrefPagina(pagina + 1)}
              className="px-4 py-2 rounded-lg border border-line-strong text-navy font-semibold"
            >
              Siguiente
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}
