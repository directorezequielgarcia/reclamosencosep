import { LogoEncosep } from "@/components/ui/LogoEncosep";

const TIPO_EVENTO_LABEL: Record<string, string> = {
  CREACION: "Reclamo registrado",
  CAMBIO_ESTADO: "Cambio de estado",
  ASIGNACION: "Asignación / derivación",
  COMENTARIO: "Comentario",
  ADJUNTO: "Adjunto agregado",
  NOTIFICACION: "Notificación",
};

export type EventoImprimible = {
  id: string;
  tipo: string;
  estadoLabel: string | null;
  autorNombre: string | null;
  mensaje: string | null;
  visibleVecino: boolean;
  createdAt: Date;
};

export type ReclamoImprimibleProps = {
  codigo: string;
  origen: string;
  createdAt: Date;
  estadoLabel: string;
  titulo: string;
  descripcion: string;
  servicioNombre: string;
  prestadoraNombre: string | null;
  vecinoNombre: string;
  vecinoDni: string;
  vecinoContacto: string | null;
  direccion: string;
  barrio: string | null;
  coordenadas: string | null;
  expediente: { numero: string; caratula: string } | null;
  fotos: { url: string }[];
  mapaSvg: string | null;
  eventos: EventoImprimible[];
  mostrarInterno: boolean;
};

function fmt(d: Date): string {
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReclamoImprimible(props: ReclamoImprimibleProps) {
  const ubicacion = [props.direccion, props.barrio].filter(Boolean).join(", ");

  return (
    <div
      id="doc"
      className="max-w-[800px] mx-auto my-6 bg-white text-black p-12 shadow"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <LogoEncosep size={80} />
        </div>
        <div className="text-sm uppercase tracking-widest">
          Ente de Control de los Servicios Públicos
        </div>
        <div className="text-xs uppercase tracking-widest text-gray-600">
          Comodoro Rivadavia · Chubut
        </div>
        <div className="mt-8 text-2xl font-bold">RECLAMO N° {props.codigo}</div>
        <div className="mt-1 text-base italic text-gray-700">{props.titulo}</div>
      </div>

      <table className="w-full mt-8 text-[14px] border-collapse">
        <tbody>
          <Fila label="Origen" value={props.origen === "WHATSAPP" ? "WhatsApp" : "Portal web"} />
          <Fila label="Fecha de ingreso" value={fmt(props.createdAt)} />
          <Fila label="Estado actual" value={props.estadoLabel} />
          <Fila label="Servicio" value={props.servicioNombre} />
          <Fila label="Prestadora" value={props.prestadoraNombre ?? "Sin asignar"} />
          <Fila
            label="Vecino reclamante"
            value={`${props.vecinoNombre} (DNI ${props.vecinoDni})`}
          />
          {props.vecinoContacto && <Fila label="Contacto" value={props.vecinoContacto} />}
          <Fila label="Dirección" value={ubicacion || "—"} />
          {props.coordenadas && <Fila label="Coordenadas (GPS)" value={props.coordenadas} />}
          {props.expediente && (
            <Fila
              label="Expediente vinculado"
              value={`${props.expediente.numero} — ${props.expediente.caratula}`}
            />
          )}
        </tbody>
      </table>

      <Seccion titulo="Descripción del vecino">
        <p className="whitespace-pre-wrap leading-relaxed text-[14px] text-justify">
          {props.descripcion}
        </p>
      </Seccion>

      {props.mapaSvg && (
        <Seccion titulo="Ubicación">
          <div
            className="mx-auto border border-gray-300"
            style={{ width: 420, maxWidth: "100%" }}
            dangerouslySetInnerHTML={{ __html: props.mapaSvg }}
          />
          {props.coordenadas && (
            <p className="text-xs text-gray-600 mt-1 text-center">
              {props.coordenadas} · Mapa: © OpenStreetMap contributors
            </p>
          )}
        </Seccion>
      )}

      {props.fotos.length > 0 && (
        <Seccion titulo={`Documental fotográfica (${props.fotos.length})`}>
          <div className="flex flex-col gap-4">
            {props.fotos.map((f, i) => (
              <figure key={i} className="text-center" style={{ breakInside: "avoid" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt={`Foto ${i + 1}`}
                  className="mx-auto max-w-full border border-gray-300"
                  style={{ maxHeight: "16cm", objectFit: "contain" }}
                />
                <figcaption className="text-xs text-gray-600 mt-1">Foto {i + 1}</figcaption>
              </figure>
            ))}
          </div>
        </Seccion>
      )}

      <Seccion titulo={`Historial del trámite (${props.eventos.length})`}>
        {props.eventos.length === 0 ? (
          <p className="text-sm text-gray-600 italic">Sin movimientos registrados.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {props.eventos.map((ev) => (
              <div key={ev.id} className="text-[13px] border-b border-gray-200 pb-2">
                <div className="font-semibold">
                  {fmt(ev.createdAt)} · {TIPO_EVENTO_LABEL[ev.tipo] ?? ev.tipo}
                  {ev.estadoLabel ? ` → ${ev.estadoLabel}` : ""}
                  {ev.autorNombre ? ` — ${ev.autorNombre}` : ""}
                </div>
                {ev.mensaje && (
                  <div className="whitespace-pre-wrap mt-0.5 text-gray-800">{ev.mensaje}</div>
                )}
                {props.mostrarInterno && ev.tipo === "COMENTARIO" && (
                  <div className="text-[11px] italic text-gray-500 mt-0.5">
                    {ev.visibleVecino ? "(Visible para el vecino)" : "(Nota interna del Ente)"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Seccion>

      <div className="mt-10 text-[11px] text-gray-500 text-center">
        Documento generado el {fmt(new Date())}.
      </div>
    </div>
  );
}

function Fila({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-1.5 pr-3 font-bold align-top w-[32%]">{label}</td>
      <td className="py-1.5 align-top">{value}</td>
    </tr>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="text-base font-bold border-b border-black pb-1 mb-3">{titulo}</h2>
      {children}
    </div>
  );
}
