// Guía para leer la factura de servicios de la SCPL (luz + agua + cloacas).
// Sin JS: usa <details>/<summary> nativos.

const ITEMS: { titulo: string; cuerpo: React.ReactNode }[] = [
  {
    titulo: "Encabezado: titular, medidor y período",
    cuerpo: (
      <>
        Arriba figuran tu nombre, domicilio y el <b>número de medidor</b>. El{" "}
        <b>período</b> indica el mes facturado y, en el recuadro de lecturas,
        vas a ver la <b>lectura actual</b> y la <b>lectura anterior</b> del
        medidor: la resta entre ambas es tu <b>consumo activo en kWh</b> (el dato
        que cargás en la calculadora).
      </>
    ),
  },
  {
    titulo: "Servicio eléctrico",
    cuerpo: (
      <>
        Se compone de: <b>cargo fijo</b> (un monto según tu escala de consumo),{" "}
        <b>cargo variable</b> y <b>compra de energía</b> (ambos por cada kWh
        consumido) y <b>alumbrado público</b>. Si tenés tarifa social o subsidio
        nacional, aparece un renglón de <b>subsidio</b> que <b>resta</b>. La suma
        de estos conceptos es lo que pagás por la luz.
      </>
    ),
  },
  {
    titulo: "Servicios sanitarios: agua y cloacas",
    cuerpo: (
      <>
        El <b>agua</b> puede facturarse de dos formas:{" "}
        <b>estimada</b> (si no tenés medidor, se calcula con los m² cubiertos de
        tu casa) o <b>medida</b> (por los m³ que marcó tu medidor). Las{" "}
        <b>cloacas</b> se cobran como un <b>porcentaje del agua</b> (50% en
        residencial). Si no tenés conexión cloacal, ese renglón no debería
        aparecer.
      </>
    ),
  },
  {
    titulo: "Impuestos y tasas",
    cuerpo: (
      <>
        Sobre los servicios se aplican el <b>IVA (21%)</b>, la{" "}
        <b>Ley Provincial I-26</b> y la <b>Tasa ENRE</b> de fiscalización. Son
        tributos que la cooperativa cobra y traslada al Estado: no son ganancia
        de la prestadora.
      </>
    ),
  },
  {
    titulo: "Fondos y adhesiones (bomberos, sepelios)",
    cuerpo: (
      <>
        Pueden aparecer el <b>Fondo de Ayuda a Bomberos Voluntarios</b> y el{" "}
        <b>Servicio Solidario de Sepelios</b>. El de sepelios es una{" "}
        <b>adhesión opcional</b>: si no lo querés, podés pedir la baja en la
        cooperativa y dejar de pagarlo.
      </>
    ),
  },
  {
    titulo: "Total, vencimientos y qué pasa si no pago",
    cuerpo: (
      <>
        Al pie está el <b>total</b> y la <b>fecha de vencimiento</b>. Pasado el
        vencimiento se aplican <b>recargos por mora</b> y, a los días, puede
        suspenderse el servicio. Si una factura te parece desproporcionada,
        primero compará con esta calculadora y después, si la diferencia es
        grande, hacé un reclamo.
      </>
    ),
  },
];

export function InstructivoFactura() {
  return (
    <section className="rounded-2xl border border-line bg-paper-2 p-6">
      <h2 className="text-lg font-extrabold text-navy">
        ¿Cómo leer tu factura?
      </h2>
      <p className="text-sm text-muted mt-1 mb-4 max-w-2xl">
        Una guía rápida para entender cada renglón de tu factura de la SCPL
        (luz, agua y cloacas) y saber qué estás pagando.
      </p>
      <div className="flex flex-col gap-2">
        {ITEMS.map((it, i) => (
          <details
            key={i}
            className="group rounded-xl border border-line bg-paper px-4 py-3"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-bold text-navy">
              {it.titulo}
              <span className="text-muted group-open:rotate-180 transition-transform">
                ▾
              </span>
            </summary>
            <div className="text-sm text-navy leading-relaxed mt-2">
              {it.cuerpo}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
