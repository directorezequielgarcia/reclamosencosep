// Explica qué es un cuadro tarifario y cómo funciona el comparativo.

export function ExplicacionCuadros() {
  return (
    <section className="rounded-2xl border border-line bg-paper p-6">
      <h2 className="text-lg font-extrabold text-navy">
        Cuadros tarifarios y comparativo
      </h2>
      <p className="text-sm text-navy mt-2 leading-relaxed max-w-3xl">
        Un <b>cuadro tarifario</b> es la tabla de precios que aprueba el Ente y
        que la prestadora <b>está obligada a respetar</b> para cobrarte la luz,
        el agua y las cloacas. Cada vez que cambia, queda registrado. La
        calculadora trabaja con tres tipos de cuadro:
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <div className="rounded-xl border border-line bg-paper-2 p-4">
          <div className="inline-block px-2 py-0.5 rounded-full bg-paper-3 border border-line-strong text-[11px] font-bold text-navy">
            Anterior
          </div>
          <div className="text-sm text-navy mt-2 leading-relaxed">
            El cuadro que regía <b>antes</b> del último aumento. Sirve para ver
            cuánto subió tu factura.
          </div>
        </div>
        <div className="rounded-xl border border-svc-green/50 bg-svc-green/10 p-4">
          <div className="inline-block px-2 py-0.5 rounded-full bg-svc-green/15 border border-svc-green/50 text-[11px] font-bold text-navy">
            Vigente
          </div>
          <div className="text-sm text-navy mt-2 leading-relaxed">
            El cuadro <b>aprobado y en vigencia hoy</b>. Es con el que se calcula
            lo que deberías estar pagando.
          </div>
        </div>
        <div className="rounded-xl border border-svc-yellow/60 bg-svc-yellow/10 p-4">
          <div className="inline-block px-2 py-0.5 rounded-full bg-svc-yellow/20 border border-svc-yellow/60 text-[11px] font-bold text-navy">
            Pedido
          </div>
          <div className="text-sm text-navy mt-2 leading-relaxed">
            Un aumento que la prestadora <b>solicitó</b> y que se va a tratar en
            audiencia pública. <b>Todavía no está aprobado</b>: sirve para
            simular cómo quedaría tu factura si se aprobara.
          </div>
        </div>
      </div>

      <p className="text-sm text-navy mt-4 leading-relaxed max-w-3xl">
        En el <b>comparativo</b> elegís un cuadro principal y otro para
        comparar. La calculadora ordena los dos por fecha y te muestra el
        <b> &laquo;Antes&raquo;</b>, el <b>&laquo;Ahora&raquo;</b> y el{" "}
        <b>aumento</b> en pesos y en porcentaje. Así podés ver de un vistazo
        cuánto cambió —o cambiaría— tu factura.
      </p>
    </section>
  );
}
