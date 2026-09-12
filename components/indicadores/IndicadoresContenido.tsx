import type { ReclamoEstado } from "@prisma/client";
import { ESTADO_META, TONE_CLASS } from "@/lib/admin";
import { SVC_META, SVC_COLOR_HEX, svcFromKind } from "@/lib/servicios";
import { MapaCalor, type PuntoCalor } from "@/components/mapa/MapaCalor";
import type { IndicadoresStats } from "@/lib/indicadores-stats";

type Props = {
  stats: IndicadoresStats;
  /** Título ya armado por la página llamante (rango de fechas + servicio). */
  tituloPeriodo: string;
  /**
   * "publico": página /indicadores abierta a cualquiera, con CTA para votar
   * la encuesta. "consulta": panel interno /consulta/indicadores — sin CTA
   * de voto, enlaza al detalle descargable de la encuesta.
   */
  variante: "publico" | "consulta";
};

export function IndicadoresContenido({ stats, tituloPeriodo, variante }: Props) {
  const {
    totalPeriodo,
    distribServicios,
    total,
    resueltos,
    tiempoMedioHoras,
    puntos,
    estadoBreakdown,
    cumplimiento,
    topBarrios,
    topTitulos,
    topBarriosConSvc,
    porMes,
    porDiaSem,
    encuestaCierre,
    pctFoto,
    pctGps,
    pctBarrio,
    encuesta,
  } = stats;

  const puntosCalor: PuntoCalor[] = puntos.map((p) => ({
    lat: p.lat,
    lng: p.lng,
    estado: p.estado,
    codigo: p.codigo,
    titulo: p.titulo,
    servicio: p.servicio,
  }));

  const maxBarrios = Math.max(1, ...topBarrios.map(([, n]) => n));
  const maxTitulos = Math.max(1, ...topTitulos.map(([, v]) => v.count));
  const maxPorMes = Math.max(1, ...[...porMes.values()]);
  const maxPorDia = Math.max(1, ...porDiaSem);

  return (
    <>
      {/* CIFRAS DE INTERÉS — estilo "vidriera pública" en /indicadores; en el
          panel de consulta se reemplaza por una tabla lisa tipo planilla,
          para que el rol de trabajo no vea el mismo diseño de marketing. */}
      {variante === "publico" ? (
        <section className="rounded-3xl overflow-hidden shadow-xl">
          <div className="bg-gradient-to-br from-svc-red via-[#9b2b2e] to-navy text-white p-8 md:p-10">
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">
              {tituloPeriodo}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-1">
              Cifras de interés
            </h2>
            <div className="text-sm opacity-80 mt-1">
              {totalPeriodo} reclamo{totalPeriodo === 1 ? "" : "s"} registrado
              {totalPeriodo === 1 ? "" : "s"} en el período seleccionado.
            </div>

            <div className="mt-8 flex flex-col gap-5">
              {distribServicios.map((d) => (
                <div key={d.key} className="grid grid-cols-[140px_1fr_50px] items-center gap-4">
                  <div className="text-sm font-bold uppercase tracking-wider">
                    {d.label}
                  </div>
                  <div className="h-7 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(d.pct, 1)}%`,
                        background: d.color,
                      }}
                    />
                  </div>
                  <div className="text-right font-extrabold text-base">
                    {d.pct}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-line-strong bg-paper overflow-hidden">
          <div className="bg-navy text-white px-5 py-3 flex items-baseline justify-between flex-wrap gap-1">
            <div>
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase opacity-70">
                {tituloPeriodo}
              </div>
              <h2 className="text-base font-extrabold">Distribución por servicio</h2>
            </div>
            <div className="text-xs opacity-80">
              {totalPeriodo} reclamo{totalPeriodo === 1 ? "" : "s"} en el período
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
              <tr>
                <th className="text-left font-semibold py-2 px-4">Servicio</th>
                <th className="text-right font-semibold py-2 px-4">Cantidad</th>
                <th className="text-right font-semibold py-2 px-4">% del período</th>
              </tr>
            </thead>
            <tbody>
              {distribServicios.map((d) => (
                <tr key={d.key} className="border-t border-line">
                  <td className="py-2 px-4">
                    <span className="inline-flex items-center gap-2 text-navy font-semibold">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ background: d.color }}
                      />
                      {d.label}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-navy">
                    {d.total}
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-muted">{d.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* KPIs GENERALES */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total histórico" value={total} />
        <Kpi label="En el período" value={totalPeriodo} tone="info" />
        <Kpi label="Resueltos" value={resueltos} tone="success" />
        <Kpi
          label="Tiempo medio"
          value={tiempoMedioHoras ? `${tiempoMedioHoras}h` : "—"}
          tone="neutral"
        />
      </section>

      {/* MAPA DE CALOR */}
      <section className="rounded-2xl border border-line bg-paper p-6">
        <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider">
            Mapa de calor de reclamos
          </h2>
          <span className="text-xs text-muted">
            {puntos.length} reclamo{puntos.length === 1 ? "" : "s"} con
            ubicación GPS
          </span>
        </div>
        {puntos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-paper-2 p-8 text-center text-muted text-sm">
            Aún no hay reclamos con ubicación GPS cargada.
          </div>
        ) : (
          <>
            <MapaCalor puntos={puntosCalor} alto={460} />
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl border border-line bg-paper-2 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                  Intensidad
                </div>
                <div
                  className="h-3 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #4a8b3a 0%, #f0bc40 33%, #e88a3c 66%, #c4393c 100%)",
                  }}
                />
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>Pocos reclamos</span>
                  <span>Muchos reclamos</span>
                </div>
              </div>
              <div className="rounded-xl border border-line bg-paper-2 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                  Color del punto = servicio
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <Leyenda color={SVC_COLOR_HEX.AGUA} label="Agua y Saneamiento" />
                  <Leyenda color={SVC_COLOR_HEX.ENERGIA} label="Energía" />
                  <Leyenda color={SVC_COLOR_HEX.RESIDUOS} label="Residuos" />
                  <Leyenda color={SVC_COLOR_HEX.TRANSPORTE} label="Transporte" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-3 leading-relaxed">
              Datos anonimizados: el mapa muestra ubicación y servicio, sin
              nombre ni DNI. Click en un punto para ver el código del reclamo.
            </p>
          </>
        )}
      </section>

      {/* POR ESTADO */}
      <section className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-3">
          Estado de los reclamos
        </h2>
        <div className="flex flex-col gap-2">
          {estadoBreakdown.map(({ estado, n, pct }) => {
            const m = ESTADO_META[estado as ReclamoEstado];
            return (
              <div key={estado} className="grid grid-cols-[180px_1fr_60px] items-center gap-3">
                <span
                  className={`inline-flex items-center text-[10px] uppercase tracking-wider font-bold rounded-full border px-2 py-1 ${TONE_CLASS[m.tone]}`}
                >
                  {m.label}
                </span>
                <div className="h-3 bg-paper-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-navy-2 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-right font-mono font-bold text-navy">
                  {n}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* CUMPLIMIENTO PRESTADORAS */}
      <section className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-3">
          Cumplimiento por prestadora
        </h2>
        {cumplimiento.length === 0 ? (
          <div className="text-sm text-muted">
            Aún no hay reclamos asignados a prestadoras.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {cumplimiento.map((p) => (
              <li
                key={p.nombre}
                className="grid grid-cols-[1fr_120px_60px] items-center gap-3"
              >
                <span className="text-sm text-navy font-semibold">
                  {p.nombre}
                </span>
                <div className="h-3 bg-paper-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-svc-green rounded-full"
                    style={{ width: `${p.pct ?? 0}%` }}
                  />
                </div>
                <span className="text-right text-xs font-mono text-navy">
                  {p.pct ?? 0}% ({p.resueltos}/{p.total})
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted mt-3 leading-relaxed">
          Porcentaje de reclamos derivados que la prestadora resolvió respecto
          del total que tiene asignados.
        </p>
      </section>

      {/* TOP BARRIOS */}
      <section className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
          Top 10 barrios con más reclamos
        </h2>
        <p className="text-xs text-muted mb-4">
          Zonificación: dónde se concentran los problemas. Útil para
          priorizar inspecciones territoriales.
        </p>
        {topBarrios.length === 0 ? (
          <div className="text-sm text-muted">
            Aún no hay reclamos con barrio cargado.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {topBarrios.map(([nombre, count], i) => {
              const pct = Math.round((count / maxBarrios) * 100);
              return (
                <li
                  key={nombre}
                  className="grid grid-cols-[24px_1fr_60px] items-center gap-3"
                >
                  <span className="text-[11px] text-muted font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <div className="h-7 bg-paper-2 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-svc-orange to-svc-red rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-sm font-bold text-white drop-shadow">
                        {nombre}
                      </span>
                    </div>
                  </div>
                  <span className="text-right font-mono font-bold text-navy">
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* TOP TIPOS DE RECLAMO */}
      <section className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
          Top 10 tipos de reclamo
        </h2>
        <p className="text-xs text-muted mb-4">
          Tipificación: qué problemas son los más reportados por los vecinos.
          Cada barra está coloreada según el servicio al que pertenece.
        </p>
        {topTitulos.length === 0 ? (
          <div className="text-sm text-muted">
            Aún no hay reclamos cargados.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {topTitulos.map(([titulo, v], i) => {
              const pct = Math.round((v.count / maxTitulos) * 100);
              const color = SVC_COLOR_HEX[v.svc] ?? "#1d3550";
              return (
                <li
                  key={titulo}
                  className="grid grid-cols-[24px_1fr_60px] items-center gap-3"
                >
                  <span className="text-[11px] text-muted font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <div className="h-7 bg-paper-2 rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-xs font-bold text-white drop-shadow truncate">
                        {titulo}
                      </span>
                    </div>
                  </div>
                  <span className="text-right font-mono font-bold text-navy">
                    {v.count}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* CRUCE BARRIO × SERVICIO */}
      {topBarriosConSvc.length > 0 && (
        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
            Top 5 barrios — qué servicio falla más en cada uno
          </h2>
          <p className="text-xs text-muted mb-4">
            Cruce zonificación × tipificación: el servicio principal que
            genera reclamos en cada barrio crítico.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topBarriosConSvc.map((b) => (
              <div
                key={b.nombre}
                className="rounded-xl border border-line bg-paper-2 p-3"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-sm font-bold text-navy">{b.nombre}</h3>
                  <span className="text-xs font-mono text-muted">
                    {b.count} reclamos
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {b.top.map((s) => {
                    const color = SVC_COLOR_HEX[s.svc] ?? "#1d3550";
                    const pct = Math.round((s.n / b.count) * 100);
                    const label = SVC_META[svcFromKind(s.svc)].short;
                    return (
                      <div
                        key={s.svc}
                        className="grid grid-cols-[80px_1fr_36px] items-center gap-2 text-xs"
                      >
                        <span className="text-navy">{label}</span>
                        <div className="h-2.5 bg-paper-3 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                        <span className="text-right font-mono text-navy">
                          {s.n}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TENDENCIA MENSUAL */}
      <section className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
          Tendencia · Últimos 6 meses
        </h2>
        <p className="text-xs text-muted mb-4">
          Reclamos cargados por mes. Sirve para ver estacionalidad
          (verano vs invierno) y detectar picos.
        </p>
        <div className="flex items-end gap-2 h-40">
          {[...porMes.entries()].map(([mes, n]) => {
            const pct = (n / maxPorMes) * 100;
            const [a, m] = mes.split("-").map(Number);
            const fecha = new Date(a, m - 1, 1);
            const lbl = fecha.toLocaleDateString("es-AR", { month: "short" });
            return (
              <div key={mes} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-mono font-bold text-navy">{n}</div>
                <div className="w-full flex-1 bg-paper-2 rounded-t-lg overflow-hidden flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-navy to-navy-2 rounded-t-lg transition-all"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted">
                  {lbl}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DÍA DE LA SEMANA */}
      <section className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
          Reclamos por día de la semana
        </h2>
        <p className="text-xs text-muted mb-4">
          En qué día se concentra más la carga. Útil para planificar guardias
          y disponibilidad del equipo.
        </p>
        <div className="flex items-end gap-2 h-32">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d, i) => {
            const n = porDiaSem[i];
            const pct = (n / maxPorDia) * 100;
            return (
              <div key={d} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-mono font-bold text-navy">{n}</div>
                <div className="w-full flex-1 bg-paper-2 rounded-t-lg overflow-hidden flex items-end">
                  <div
                    className="w-full bg-svc-blue rounded-t-lg"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted">
                  {d}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SATISFACCIÓN ENTE vs PRESTADORA (encuesta de cierre) */}
      {encuestaCierre.count > 0 && (
        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
            Satisfacción post-reclamo · Ente vs Prestadora
          </h2>
          <p className="text-xs text-muted mb-4">
            Calificaciones que dejaron los vecinos al cerrarse su reclamo
            ({encuestaCierre.count} respuesta
            {encuestaCierre.count === 1 ? "" : "s"}).
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <PuntajeCard
              label="Atención del Ente"
              valor={encuestaCierre.avgEnte}
              color="navy-2"
            />
            <PuntajeCard
              label="Atención de la prestadora"
              valor={encuestaCierre.avgPrestadora}
              color="orange"
            />
          </div>
        </section>
      )}

      {/* CALIDAD DEL REPORTE */}
      <section className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-1">
          Calidad del reporte
        </h2>
        <p className="text-xs text-muted mb-4">
          Qué porcentaje de los reclamos tiene cada elemento de respaldo. A
          mayor calidad, mayor capacidad de gestión y de auditoría.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <CalidadCard label="Con foto adjunta" pct={pctFoto} />
          <CalidadCard label="Con GPS o geolocalización" pct={pctGps} />
          <CalidadCard label="Con barrio especificado" pct={pctBarrio} />
        </div>
      </section>

      {/* SATISFACCIÓN GENERAL (encuesta /encuesta) */}
      <section className="rounded-2xl border border-line bg-paper-2 p-6">
        <h2 className="text-base font-extrabold text-navy uppercase tracking-wider mb-3">
          Satisfacción del usuario
        </h2>
        <div className="text-sm text-muted">
          {encuesta.count === 0 ? (
            <>
              Aún no hay respuestas a la encuesta de satisfacción.{" "}
              {variante === "publico" && (
                <a
                  href="/encuesta"
                  className="text-navy-2 font-bold underline underline-offset-4"
                >
                  Respondé la encuesta →
                </a>
              )}
            </>
          ) : (
            <>
              <div className="text-navy">
                Promedios sobre {encuesta.count} respuesta
                {encuesta.count === 1 ? "" : "s"} ciudadanas (escala 1 al 5):
              </div>
              <div className="grid sm:grid-cols-2 gap-2 mt-3">
                {[
                  { k: "Agua y Saneamiento", v: encuesta.avgAgua },
                  { k: "Energía Eléctrica", v: encuesta.avgEnergia },
                  { k: "Residuos", v: encuesta.avgResiduos },
                  { k: "Transporte", v: encuesta.avgTransporte },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2"
                  >
                    <span className="text-sm text-navy">{row.k}</span>
                    <span className="text-lg font-extrabold text-navy">
                      {row.v ? row.v.toFixed(1) : "—"}
                      {row.v ? <span className="text-sm text-muted"> / 5</span> : null}
                    </span>
                  </div>
                ))}
              </div>
              {variante === "publico" ? (
                <a
                  href="/encuesta"
                  className="inline-block mt-4 text-navy-2 font-bold underline underline-offset-4 text-sm"
                >
                  Sumá tu respuesta →
                </a>
              ) : (
                <a
                  href="/consulta/encuesta"
                  className="inline-block mt-4 text-navy-2 font-bold underline underline-offset-4 text-sm"
                >
                  Ver detalle y descargar →
                </a>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

function PuntajeCard({
  label,
  valor,
  color,
}: {
  label: string;
  valor: number | null;
  color: "navy-2" | "orange";
}) {
  const bg = color === "navy-2" ? "bg-navy-2" : "bg-svc-orange";
  return (
    <div className="rounded-xl border border-line bg-paper-2 p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-3xl font-extrabold text-navy">
          {valor ? valor.toFixed(1) : "—"}
        </span>
        <span className="text-sm text-muted">/ 5</span>
      </div>
      <div className="mt-2 h-2 bg-paper-3 rounded-full overflow-hidden">
        <div
          className={`h-full ${bg} rounded-full`}
          style={{ width: `${((valor ?? 0) / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

function CalidadCard({ label, pct }: { label: string; pct: number }) {
  const tone =
    pct >= 70
      ? "text-svc-green border-svc-green/40"
      : pct >= 40
        ? "text-svc-orange border-svc-orange/40"
        : "text-svc-red border-svc-red/40";
  return (
    <div className={`rounded-xl border-2 ${tone} bg-paper p-4`}>
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="text-3xl font-extrabold mt-1">{pct}%</div>
      <div className="mt-2 h-2 bg-paper-3 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: pct >= 70 ? "#4a8b3a" : pct >= 40 ? "#e88a3c" : "#c4393c",
          }}
        />
      </div>
    </div>
  );
}

function Leyenda({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-navy">{label}</span>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "info" | "success";
}) {
  const cls =
    tone === "info"
      ? "border-svc-blue/60"
      : tone === "success"
        ? "border-svc-green/50"
        : "border-line";
  return (
    <div className={`rounded-2xl border-2 ${cls} bg-paper p-4`}>
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </div>
      <div className="text-3xl font-extrabold text-navy leading-none mt-1">
        {value}
      </div>
    </div>
  );
}
