import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puedeVerBandejaWhatsApp } from "@/lib/admin";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { SVC_ORDER, SVC_META } from "@/lib/servicios";
import { convertirEnReclamo, descartarMensaje } from "./actions";

export const metadata = { title: "WhatsApp · Panel ENCOSEP" };

export default async function BandejaWhatsAppPage() {
  const session = await auth();
  if (!session || !puedeVerBandejaWhatsApp(session.user.rol)) {
    redirect("/admin");
  }

  const mensajes = await prisma.mensajeWhatsApp.findMany({
    where: { procesado: false },
    orderBy: { recibidoEn: "asc" },
  });

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <Breadcrumbs items={[{ label: "Panel", href: "/admin" }, { label: "WhatsApp" }]} />

      <header>
        <h1 className="text-2xl font-extrabold text-navy">Bandeja de WhatsApp</h1>
        <p className="text-sm text-muted mt-1">
          Mensajes entrantes al WhatsApp institucional pendientes de convertir en
          reclamo. Al convertir uno, se genera el código y se le responde
          automáticamente al vecino por WhatsApp.
        </p>
      </header>

      {mensajes.length === 0 && (
        <p className="text-sm text-muted rounded-2xl border border-line bg-paper p-5">
          No hay mensajes pendientes.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {mensajes.map((m) => (
          <details
            key={m.id}
            className="rounded-2xl border border-line bg-paper p-5 group"
          >
            <summary className="cursor-pointer flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-navy">
                  {m.nombrePerfil || "Sin nombre"}{" "}
                  <span className="text-muted font-normal">· {m.waId}</span>
                </div>
                <p className="text-sm text-navy/90 mt-1 line-clamp-2 group-open:line-clamp-none">
                  {m.cuerpo}
                </p>
              </div>
              <span className="text-[11px] text-muted whitespace-nowrap">
                {new Intl.DateTimeFormat("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(m.recibidoEn)}
              </span>
            </summary>

            <form
              action={convertirEnReclamo}
              className="mt-4 pt-4 border-t border-line flex flex-col gap-3"
            >
              <input type="hidden" name="mensajeId" value={m.id} />

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Servicio" required>
                  <select
                    name="svc"
                    required
                    defaultValue=""
                    className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
                  >
                    <option value="" disabled>
                      Elegí un servicio…
                    </option>
                    {SVC_ORDER.map((k) => (
                      <option key={k} value={k}>
                        {SVC_META[k].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Barrio">
                  <input
                    type="text"
                    name="barrio"
                    maxLength={80}
                    className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
                  />
                </Field>
              </div>

              <Field label="Título" required>
                <input
                  type="text"
                  name="titulo"
                  required
                  minLength={3}
                  maxLength={60}
                  defaultValue={m.cuerpo.slice(0, 60)}
                  className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
                />
              </Field>

              <Field label="Descripción" required>
                <textarea
                  name="descripcion"
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={3}
                  defaultValue={m.cuerpo}
                  className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
                />
              </Field>

              <Field label="Dirección" required>
                <input
                  type="text"
                  name="direccion"
                  required
                  minLength={3}
                  maxLength={200}
                  placeholder="El vecino no siempre la manda por WhatsApp: pedísela antes de convertir"
                  className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
                />
              </Field>

              <div className="flex gap-2 items-center pt-1">
                <SubmitButton
                  className="px-4 py-2 rounded-lg bg-navy text-white font-bold text-sm hover:opacity-90"
                  pendingText="Convirtiendo…"
                >
                  Convertir en reclamo
                </SubmitButton>
                <SubmitButton
                  formAction={descartarMensaje}
                  className="px-4 py-2 rounded-lg border border-line-strong text-navy font-semibold text-sm"
                  pendingText="Descartando…"
                >
                  Descartar (no es un reclamo)
                </SubmitButton>
              </div>
            </form>
          </details>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
        {label}
        {required && <span className="text-svc-red ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
