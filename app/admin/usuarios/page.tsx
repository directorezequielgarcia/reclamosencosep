import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROL_LABEL, puedeGestionarUsuarios, esDireccion } from "@/lib/admin";
import { resetClaveADni, toggleActivo } from "./actions";
import { BotonClaveTemporal } from "./BotonClaveTemporal";
import type { Prisma, Rol } from "@prisma/client";

export const metadata = { title: "Usuarios · Panel ENCOSEP" };

const ROL_FILTROS: { value: Rol | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "CIUDADANO", label: "Vecinos" },
  { value: "DIRECTOR", label: "Directorio" },
  { value: "SUPER_ADMIN", label: "Director técnico" },
  { value: "COOPERATIVA_DOCS", label: "Documental de prestadoras" },
  { value: "EXPEDIENTES", label: "Expedientes" },
  { value: "INSPECCIONES", label: "Inspecciones de campo" },
  { value: "AUDIENCIAS_MEDIOS", label: "Audiencias y medios" },
  { value: "GESTOR_ENTE", label: "Gestor del Ente (legacy)" },
  { value: "OPERADOR_PRESTADORA", label: "Operadores prestadora" },
  { value: "AUDITOR", label: "Auditor" },
];

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session || !puedeGestionarUsuarios(session.user.rol)) {
    redirect("/admin");
  }

  const sp = await searchParams;
  const rolFiltro = sp.rol as Rol | "TODOS" | undefined;
  const q = sp.q?.trim();

  const where: Prisma.UsuarioWhereInput = {};
  if (rolFiltro && rolFiltro !== "TODOS") {
    where.rol = rolFiltro;
  }
  if (q) {
    where.OR = [
      { dni: { contains: q } },
      { nombre: { contains: q, mode: "insensitive" } },
      { apellido: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const usuarios = await prisma.usuario.findMany({
    where,
    orderBy: [{ rol: "asc" }, { apellido: "asc" }],
    take: 200,
    include: { prestadora: true },
  });

  const totalCiudadanos = await prisma.usuario.count({
    where: { rol: "CIUDADANO" },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Usuarios</h1>
          <p className="text-sm text-muted mt-1">
            {totalCiudadanos} {totalCiudadanos === 1 ? "vecino registrado" : "vecinos registrados"} ·{" "}
            mostrando {usuarios.length} resultados.
          </p>
        </div>
        <Link
          href="/admin/usuarios/crear"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-svc-red text-white text-sm font-bold"
        >
          + Crear usuario
        </Link>
      </header>

      <form className="flex flex-wrap gap-3 items-end bg-paper rounded-2xl border border-line p-4">
        <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Buscar
          </span>
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="DNI, nombre, apellido, email"
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Rol
          </span>
          <select
            name="rol"
            defaultValue={rolFiltro ?? "TODOS"}
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
          >
            {ROL_FILTROS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-navy text-white font-semibold text-sm hover:opacity-90"
        >
          Filtrar
        </button>
      </form>

      <div className="rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-muted bg-paper-2">
            <tr className="border-b border-line">
              <th className="text-left font-semibold py-2.5 px-3">DNI</th>
              <th className="text-left font-semibold py-2.5 px-3">Nombre</th>
              <th className="text-left font-semibold py-2.5 px-3">Rol</th>
              <th className="text-left font-semibold py-2.5 px-3">Email</th>
              <th className="text-left font-semibold py-2.5 px-3">Teléfono</th>
              <th className="text-left font-semibold py-2.5 px-3">Estado</th>
              <th className="text-right font-semibold py-2.5 px-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-8">
                  Sin resultados.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-line last:border-0 hover:bg-paper-2"
                >
                  <td className="py-2 px-3 font-mono font-bold text-navy">
                    {u.dni}
                  </td>
                  <td className="py-2 px-3 text-navy">
                    {u.apellido}, {u.nombre}
                  </td>
                  <td className="py-2 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-navy/10 text-navy text-[11px] font-semibold">
                      {ROL_LABEL[u.rol]}
                    </span>
                    {u.prestadora && (
                      <div className="text-[10px] text-muted mt-0.5">
                        {u.prestadora.razonSocial}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted text-xs">
                    {u.email ?? "—"}
                  </td>
                  <td className="py-2 px-3 text-muted text-xs">
                    {u.telefono ?? "—"}
                  </td>
                  <td className="py-2 px-3">
                    {u.activo ? (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-svc-green">
                        activo
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-svc-red">
                        bloqueado
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex justify-end gap-2">
                      <BotonClaveTemporal usuarioId={u.id} />
                      <form action={resetClaveADni}>
                        <input
                          type="hidden"
                          name="usuarioId"
                          value={u.id}
                        />
                        <button
                          type="submit"
                          className="text-[11px] px-2.5 py-1 rounded-md border border-line-strong text-navy hover:bg-paper-3"
                          title={`Resetea la clave de ${u.nombre} a su propio DNI`}
                        >
                          Reset a DNI
                        </button>
                      </form>
                      {esDireccion(session.user.rol) &&
                        u.id !== session.user.id && (
                          <form action={toggleActivo}>
                            <input
                              type="hidden"
                              name="usuarioId"
                              value={u.id}
                            />
                            <button
                              type="submit"
                              className={`text-[11px] px-2.5 py-1 rounded-md border ${
                                u.activo
                                  ? "border-svc-red/40 text-svc-red hover:bg-svc-red/10"
                                  : "border-svc-green/40 text-svc-green hover:bg-svc-green/10"
                              }`}
                            >
                              {u.activo ? "Bloquear" : "Activar"}
                            </button>
                          </form>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-line bg-paper-2 p-4 text-[12px] text-navy leading-relaxed space-y-2">
        <p>
          <strong>Las claves no se muestran nunca en pantalla</strong> — están
          guardadas con bcrypt (hash + salt) y son irrecuperables a propósito,
          igual que en cualquier sistema serio. Si la base de datos se filtra,
          las claves siguen siendo inútiles.
        </p>
        <p>
          <strong className="text-navy">Para dar soporte tenés dos botones:</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Generar clave</strong> — crea una clave aleatoria nueva,
            la muestra <strong>una sola vez</strong> en pantalla para que se la
            comuniques al usuario, y se descarta. Es lo recomendado para
            operadores y staff del Ente.
          </li>
          <li>
            <strong>Reset a DNI</strong> — deja la clave igual al propio DNI/CUIT.
            Útil cuando un vecino pide ayuda urgente. Acordate que el usuario
            tiene que cambiarla apenas entre desde{" "}
            <span className="font-mono">/mi-cuenta</span>.
          </li>
        </ul>
      </div>
    </div>
  );
}
