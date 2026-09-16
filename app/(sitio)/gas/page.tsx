import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";

export const metadata = {
  title: "Reclamos de Gas — No es competencia del Ente · ENCOSEP",
  description:
    "El EnCoSeP no tiene competencia sobre el servicio público de gas. Los reclamos de gas se derivan a ENReGE.",
};

export default function DerivacionGas() {
  return (
    <>
      <SeccionHeader
        kicker="Fuera de la competencia del Ente"
        titulo="Reclamos de Gas"
        descripcion="El servicio público de gas no está bajo control del EnCoSeP. Te contamos a dónde dirigir tu reclamo."
        variante="naranja"
      />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <MigajasSitio items={[{ label: "Gas" }]} />

        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy">
            El EnCoSeP no tiene competencia en materia de gas
          </h2>
          <p className="text-sm text-navy leading-relaxed mt-3">
            El EnCoSeP (Ente de Control de los Servicios Públicos de Comodoro
            Rivadavia) fiscaliza, conforme la Ordenanza 13.189/17 de su
            creación, los servicios de <strong>agua y saneamiento</strong>,{" "}
            <strong>energía eléctrica y alumbrado público</strong>,{" "}
            <strong>gestión de residuos</strong> y{" "}
            <strong>transporte público</strong> bajo control municipal.
          </p>
          <p className="text-sm text-navy leading-relaxed mt-3">
            El servicio público de gas natural por redes no forma parte de
            estas competencias: es un servicio regulado a nivel nacional. Por
            eso, si tu reclamo es sobre gas, tenés que dirigirlo directamente
            al organismo nacional a cargo, no al EnCoSeP.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-base font-extrabold text-navy">
            ¿Qué es ENReGE?
          </h2>
          <p className="text-sm text-navy leading-relaxed mt-3">
            El <strong>ENReGE</strong> (Ente Nacional Regulador del Gas y la
            Electricidad) es el organismo nacional que regula y fiscaliza la
            distribución de gas natural por redes y de energía eléctrica en
            todo el país. Es la autoridad a la que hay que dirigir cualquier
            reclamo sobre el suministro de gas domiciliario: falta de
            suministro, errores de facturación, problemas con la
            distribuidora, y similares.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border-2 border-svc-orange/50 bg-svc-orange/10 p-6">
          <h2 className="text-base font-extrabold text-navy">
            Para reclamos de gas, contactá a ENReGE
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Contacto titulo="📞 Línea gratuita">
              <a href="tel:08003334444" className="text-navy-2 font-bold hover:underline">
                0800-333-4444
              </a>
            </Contacto>
            <Contacto titulo="📞 Teléfono">
              <a href="tel:0280443-4399" className="text-navy-2 font-bold hover:underline">
                0280 443-4399
              </a>
            </Contacto>
            <Contacto titulo="✉ Email (Delegación Trelew)">
              <a
                href="mailto:dlg-trelew@enargas.gob.ar"
                className="text-navy-2 font-bold hover:underline break-all"
              >
                dlg-trelew@enargas.gob.ar
              </a>
            </Contacto>
          </div>
          <p className="text-xs text-muted mt-4 leading-relaxed">
            Ante olor a gas o una situación de riesgo, comunicate de inmediato
            con la distribuidora de gas de tu zona antes que con cualquier
            otro organismo.
          </p>
        </section>

        <VolverInicio />
      </main>
    </>
  );
}

function Contacto({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <div className="text-[11px] font-bold tracking-widest uppercase text-muted mb-1">
        {titulo}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
