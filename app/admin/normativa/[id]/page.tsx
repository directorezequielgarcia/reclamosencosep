import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeVerNormativa } from "@/lib/admin";
import { CopiarBoton } from "@/components/ui/CopiarBoton";
import { SERVICIO_LABEL, fragmentar, posicionesCoincidencias } from "@/lib/normativa";
import { palabrasDeConsulta } from "@/lib/normativa-busqueda";

export const metadata = { title: "Ficha de norma · Panel ENCOSEP" };

type SP = { q?: string };

// "Ord. 12584/2016; Res. 417/2026" → referencias para buscar en la base
function parsearReferencias(txt: string | null) {
  if (!txt) return [];
  return [...txt.matchAll(/(Ord|Res)\.?\s*([\d.]+(?:-\d+)?)\/(\d{2,4})/gi)].map((m) => ({
    texto: m[0],
    tipo: m[1].toLowerCase() === "ord" ? ("ORD" as const) : ("RES" as const),
    numero: m[2].replace(/\./g, ""),
    anio: m[3].length === 4 ? Number(m[3]) : Number(m[3]) >= 50 ? 1900 + Number(m[3]) : 2000 + Number(m[3]),
  }));
}

export default async function NormaFichaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session || !puedeVerNormativa(session.user.rol)) redirect("/admin");

  const n = await prisma.norma.findUnique({ where: { id } });
  if (!n) notFound();

  // Normas relacionadas (derogada por / deroga a) que existan en la base
  const refs = [...parsearReferencias(n.derogadaPor), ...parsearReferencias(n.derogaA)];
  const enBase = refs.length
    ? await prisma.norma.findMany({
        where: { OR: refs.map((r) => ({ tipo: r.tipo, numero: r.numero, anio: r.anio })) },
        select: { id: true, tipo: true, numero: true, anio: true },
      })
    : [];
  const idDe = (r: (typeof refs)[number]) =>
    enBase.find((b) => b.tipo === r.tipo && b.numero === r.numero && b.anio === r.anio)?.id;
  const referencias = (txt: string) => {
    const lista = parsearReferencias(txt);
    if (lista.length === 0) return <>{txt}</>;
    return (
      <>
        {lista.map((r, i) => {
          const rid = idDe(r);
          return (
            <span key={i}>
              {i > 0 && "; "}
              {rid ? (
                <Link href={`/admin/normativa/${rid}`} className="underline underline-offset-2 font-semibold">
                  {r.texto}
                </Link>
              ) : (
                r.texto
              )}
            </span>
          );
        })}
      </>
    );
  };

  // Resaltado de la búsqueda en el texto completo, con anclas #c1, #c2...
  const palabras = palabrasDeConsulta(sp.q);
  const texto = n.texto ?? "";
  const rangos = posicionesCoincidencias(texto, palabras);
  const fragmentos = fragmentar(texto, rangos);
  let nroMarca = 0;
  const indice = rangos.slice(0, 10).map(([a, b], i) => ({
    nro: i + 1,
    previo: texto.slice(Math.max(0, a - 30), a),
    palabra: texto.slice(a, b),
    posterior: texto.slice(b, b + 30),
  }));

  const nombreTipo = n.tipo === "ORD" ? "Ordenanza" : "Resolución";
  const numeroFmt = /^\d+$/.test(n.numero) ? Number(n.numero).toLocaleString("es-AR") : n.numero;
  const titulo = `${nombreTipo} ${numeroFmt}/${n.anio}`;
  const derogada = n.estado === "DEROGADA";
  const estadoTxt = derogada
    ? `DEROGADA${n.derogadaPor ? ` por ${n.derogadaPor}` : ""}`
    : "Vigente según el Digesto";

  const cita = `${titulo}${n.fechaPublicacionBO ? `, publicada en el Boletín Oficial el ${n.fechaPublicacionBO}` : ""}. Fuente: Digesto Municipal de Comodoro Rivadavia.`;
  const ficha = [
    titulo.toUpperCase(),
    `Tema: ${n.tema}`,
    `Estado: ${estadoTxt}`,
    n.fechaPublicacionBO ? `Publicación en el BO: ${n.fechaPublicacionBO}` : null,
    n.resumen ? `\nResumen: ${n.resumen}` : null,
    n.puntosClave.length ? `\nPuntos clave:\n${n.puntosClave.map((p) => `- ${p}`).join("\n")}` : null,
    n.aplicaAlEnte ? `\nPara qué le sirve al Ente: ${n.aplicaAlEnte}` : null,
    n.urlPdf ? `\nPDF oficial: ${n.urlPdf}` : null,
    "Fuente: Digesto Municipal de Comodoro Rivadavia.",
  ]
    .filter((x) => x !== null)
    .join("\n");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/admin/normativa" className="text-sm text-navy underline underline-offset-2">
          Volver a Normativa
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-extrabold text-navy">{titulo}</h1>
          {derogada && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-svc-red/60 bg-svc-red text-white text-[11px] font-bold uppercase tracking-wider">
              Derogada
            </span>
          )}
        </div>
        <p className="text-sm text-navy">{n.tema}</p>
        <div className="flex flex-wrap gap-1.5">
          {n.servicios.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded-full border border-line-strong bg-paper-3 text-[11px] text-navy"
            >
              {SERVICIO_LABEL[s] ?? s}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {n.urlPdf && (
            <a
              href={`/admin/normativa/${n.id}/pdf`}
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-svc-red text-white text-sm font-bold"
            >
              Descargar PDF
            </a>
          )}
          {n.urlPdf && (
            <a
              href={n.urlPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-line-strong text-sm text-navy font-semibold"
            >
              Abrir PDF oficial
            </a>
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
          <CopiarBoton urlRelativa={`/admin/normativa/${n.id}`}>Copiar enlace</CopiarBoton>
          {n.urlPdf && <CopiarBoton texto={n.urlPdf}>Copiar enlace oficial</CopiarBoton>}
          <CopiarBoton texto={cita}>Copiar cita</CopiarBoton>
          <CopiarBoton texto={ficha}>Copiar ficha</CopiarBoton>
        </div>
      </header>

      <section className="rounded-2xl border border-line bg-paper p-4 text-sm text-navy flex flex-col gap-1">
        <div>
          <span className="font-semibold">Estado: </span>
          {derogada ? (
            <span className="font-bold text-svc-red">
              DEROGADA{n.derogadaPor && <> por {referencias(n.derogadaPor)}</>}
            </span>
          ) : (
            "Vigente según el Digesto (verificar antes de citar)"
          )}
        </div>
        {n.derogaA && (
          <div>
            <span className="font-semibold">Deroga o reemplaza a: </span>
            {referencias(n.derogaA)}
          </div>
        )}
        {n.fechaPublicacionBO && (
          <div>
            <span className="font-semibold">Publicada en el Boletín Oficial: </span>
            {n.fechaPublicacionBO}
          </div>
        )}
        {n.notas && <div className="text-muted">{n.notas}</div>}
      </section>

      {n.resumen ? (
        <section className="rounded-2xl border border-line bg-paper p-4 flex flex-col gap-3">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider">Resumen</h2>
          <p className="text-sm text-navy leading-relaxed">{n.resumen}</p>
          {n.puntosClave.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Puntos clave</h3>
              <ul className="list-disc pl-5 text-sm text-navy flex flex-col gap-1">
                {n.puntosClave.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </>
          )}
          {n.temas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {n.temas.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded bg-svc-blue/15 text-[11px] font-semibold text-navy">
                  {t}
                </span>
              ))}
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm text-muted">Esta norma todavía no tiene resumen.</p>
      )}

      {n.aplicaAlEnte && (
        <section className="rounded-2xl border border-svc-blue/40 bg-svc-blue/10 p-4">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
            Para qué le sirve al Ente
          </h2>
          <p className="text-sm text-navy leading-relaxed">{n.aplicaAlEnte}</p>
        </section>
      )}

      {(n.calidadTexto === "regular" || n.calidadTexto === "mala") && (
        <div
          role="note"
          className="rounded-xl border border-svc-yellow/60 bg-svc-yellow/20 p-3 text-sm text-navy"
        >
          La calidad de la lectura automática de este documento es {n.calidadTexto}: el texto puede tener
          errores. Para citar, abrí siempre el PDF oficial.
        </div>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wider">Texto completo</h2>
        {palabras.length > 0 && (
          <div className="text-sm text-navy">
            {rangos.length === 0 ? (
              <>No hay coincidencias de «{sp.q}» en el texto.</>
            ) : (
              <>
                {rangos.length} {rangos.length === 1 ? "coincidencia" : "coincidencias"} de «{sp.q}».
                <ol className="mt-1 flex flex-col gap-0.5 text-xs">
                  {indice.map((i) => (
                    <li key={i.nro}>
                      <a href={`#c${i.nro}`} className="underline underline-offset-2">
                        {i.nro}
                      </a>{" "}
                      <span className="text-muted">
                        … {i.previo}
                        <b>{i.palabra}</b>
                        {i.posterior} …
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
        {texto ? (
          <div className="rounded-2xl border border-line bg-paper p-4 max-h-[70vh] overflow-y-auto text-[15px] leading-7 text-navy whitespace-pre-wrap break-words">
            {fragmentos.map((f, i) => {
              if (!f.marcado) return <span key={i}>{f.texto}</span>;
              nroMarca++;
              return (
                <mark
                  key={i}
                  id={`c${nroMarca}`}
                  className="bg-svc-yellow/50 text-navy rounded px-0.5 scroll-mt-4"
                >
                  {f.texto}
                </mark>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">No hay texto cargado para esta norma. Abrí el PDF oficial.</p>
        )}
      </section>
    </div>
  );
}
