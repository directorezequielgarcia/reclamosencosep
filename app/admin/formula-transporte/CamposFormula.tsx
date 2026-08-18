import { RUBROS_DEF, type DatosFormula } from "@/lib/formula-transporte";

function Campo({
  label,
  name,
  defaultValue,
  hint,
  step = "0.01",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: number | string | null;
  hint?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </span>
      <input
        type="number"
        name={name}
        step={step}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
      />
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

function rubro(id: string) {
  return RUBROS_DEF.find((r) => r.id === id)!;
}

/**
 * Todos los campos numéricos de DatosFormula, agrupados por rubro del
 * pliego. Server component puro (sin estado) para usar tanto en el alta
 * como en la edición — el cálculo en vivo se hace del lado del servidor al
 * volver a renderizar tras el submit.
 */
export function CamposFormula({ d }: { d: Partial<DatosFormula> }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-line p-4">
        <h3 className="text-sm font-bold text-navy mb-1">
          1-3. Combustible, lubricantes, lavado y engrase
        </h3>
        <p className="text-xs text-muted mb-3">
          {rubro("combustible").explicacion}
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <Campo
            label="Precio combustible ($/litro)"
            name="precioCombustibleLitro"
            defaultValue={d.precioCombustibleLitro}
          />
          <Campo
            label="Precio lubricante motor ($/l)"
            name="precioLubricanteMotor"
            defaultValue={d.precioLubricanteMotor}
          />
          <Campo
            label="Precio lubricante dirección ($/l)"
            name="precioLubricanteDireccion"
            defaultValue={d.precioLubricanteDireccion}
          />
          <Campo
            label="Precio lubricante caja/diferencial ($/kg)"
            name="precioLubricanteCajaDif"
            defaultValue={d.precioLubricanteCajaDif}
          />
          <Campo
            label="Lavado y engrase — costo/km del set"
            name="precioLavadoEngraseSet"
            defaultValue={d.precioLavadoEngraseSet}
            hint="Suma ya prorrateada de aceite/filtro, filtro gasoil, engrase, lavado y filtro climatización."
          />
        </div>
      </section>

      <section className="rounded-xl border border-line p-4">
        <h3 className="text-sm font-bold text-navy mb-1">
          4-6. Neumáticos, amortización y mantenimiento del material rodante
        </h3>
        <p className="text-xs text-muted mb-3">
          {rubro("neumaticos").explicacion}
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <Campo
            label="Precio cubierta nueva ($)"
            name="precioCubiertaNueva"
            defaultValue={d.precioCubiertaNueva}
          />
          <Campo
            label="Precio recapado ($)"
            name="precioRecapado"
            defaultValue={d.precioRecapado}
          />
          <Campo
            label="Precio vehículo nuevo (USD)"
            name="precioVehiculoNuevoUsd"
            defaultValue={d.precioVehiculoNuevoUsd}
          />
          <Campo
            label="Tipo de cambio ($/USD)"
            name="tipoCambio"
            defaultValue={d.tipoCambio}
          />
        </div>
      </section>

      <section className="rounded-xl border border-line p-4">
        <h3 className="text-sm font-bold text-navy mb-1">
          7-13. Rubros de carga directa (costo/km ya determinado)
        </h3>
        <p className="text-xs text-muted mb-3">
          Salarios, seguros, máquinas/inmuebles, patentes, vigilancia y tasas
          municipales tienen componentes que no se recalculan automáticamente
          acá (convenio colectivo con 20 subcategorías, primas de seguro,
          valuaciones inmobiliarias). Cargá el costo/km ya certificado por la
          Autoridad de Aplicación, o calculado aparte.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <Campo
            label="7. Salarios — $/km"
            name="costoKmSalarios"
            defaultValue={d.costoKmSalarios}
          />
          <Campo
            label="8. Seguros — $/km"
            name="costoKmSeguros"
            defaultValue={d.costoKmSeguros}
          />
          <Campo
            label="9. Máquinas/herram./inmuebles — $/km"
            name="costoKmMaquinasInmuebles"
            defaultValue={d.costoKmMaquinasInmuebles}
          />
          <Campo
            label="10. Patentes y verif. técnicas — $/km"
            name="costoKmPatentes"
            defaultValue={d.costoKmPatentes}
          />
          <Campo
            label="12. Vigilancia — $/km"
            name="costoKmVigilancia"
            defaultValue={d.costoKmVigilancia}
          />
          <Campo
            label="13. Tasas municipales — $/km"
            name="costoKmTasasMunicipales"
            defaultValue={d.costoKmTasasMunicipales}
          />
        </div>
      </section>

      <section className="rounded-xl border border-line p-4">
        <h3 className="text-sm font-bold text-navy mb-1">
          11, 15, 17. Recaudación, Ingresos Brutos y capital invertido
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Campo
            label="Recaudación digital total del mes (SUBE) — $"
            name="recaudacionDigitalTotal"
            defaultValue={d.recaudacionDigitalTotal}
            hint="Base del rubro 11 (alícuota 8,47%) y de la Compensación."
          />
          <Campo
            label="15. Ingresos Brutos — $/km"
            name="costoKmIngresosBrutos"
            defaultValue={d.costoKmIngresosBrutos}
          />
          <Campo
            label="17. Capital invertido — $/km"
            name="costoKmCapitalInvertido"
            defaultValue={d.costoKmCapitalInvertido}
          />
        </div>
      </section>

      <section className="rounded-xl border border-line p-4">
        <h3 className="text-sm font-bold text-navy mb-1">Kilometraje del sistema</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Campo
            label="Kilometraje Mensual de Base (KMB)"
            name="kilometrajeMensualBase"
            defaultValue={d.kilometrajeMensualBase}
            step="0.01"
            hint="Denominador de varios rubros (salarios, seguros, GPS)."
          />
          <Campo
            label="Kilometraje Programado"
            name="kilometrajeProgramado"
            defaultValue={d.kilometrajeProgramado}
            hint="Referencia del pliego (100%): 826.060,27 km/mes."
          />
          <Campo
            label="Kilometraje a Pagar certificado"
            name="kilometrajeAPagarCertificado"
            defaultValue={d.kilometrajeAPagarCertificado}
            hint="El que valida la Autoridad de Aplicación vía GPS. Tope = Kilometraje Programado."
          />
        </div>
      </section>

      <section className="rounded-xl border border-svc-blue/40 bg-svc-blue/5 p-4">
        <h3 className="text-sm font-bold text-navy mb-1">
          Datos presentados por la prestadora (GRUPO MR S.R.L.)
        </h3>
        <p className="text-xs text-muted mb-3">
          Para contrastar contra lo certificado arriba por la Autoridad de
          Aplicación. Opcional — si se completa, el sistema calcula la
          diferencia de kilómetros.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo
            label="Kilometraje recorrido que declara la prestadora"
            name="prestadoraKilometrajeRecorrido"
            defaultValue={d.prestadoraKilometrajeRecorrido ?? ""}
          />
          <Campo
            label="Ingresos que declara la prestadora ($)"
            name="prestadoraIngresosDeclarados"
            defaultValue={d.prestadoraIngresosDeclarados ?? ""}
          />
        </div>
        <label className="flex flex-col gap-1 mt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Observaciones
          </span>
          <textarea
            name="prestadoraObservaciones"
            rows={3}
            defaultValue={d.prestadoraObservaciones ?? ""}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm bg-paper"
          />
        </label>
      </section>
    </div>
  );
}
