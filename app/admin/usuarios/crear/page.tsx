import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROL_LABEL, puedeGestionarUsuarios, esDireccion } from "@/lib/admin";
import { crearUsuario } from "../actions";
import type { Rol } from "@prisma/client";

export const metadata = { title: "Nuevo usuario · Panel ENCOSEP" };

export default async function CrearUsuarioPage() {
  const session = await auth();
  if (!session || !puedeGestionarUsuarios(session.user.rol)) {
    redirect("/admin");
  }

  const prestadoras = await prisma.prestadora.findMany({
    where: { activa: true },
    orderBy: { razonSocial: "asc" },
  });

  const direccion = esDireccion(session.user.rol);

  // Roles que el usuario actual puede asignar.
  const rolesAsignables: Rol[] = direccion
    ? [
        "DIRECTOR",
        "SUPER_ADMIN",
        "COOPERATIVA_DOCS",
        "EXPEDIENTES",
        "INSPECCIONES",
        "AUDIENCIAS_MEDIOS",
        "GESTOR_ENTE",
        "AUDITOR",
        "OPERADOR_PRESTADORA",
        "CIUDADANO",
      ]
    : [
        "COOPERATIVA_DOCS",
        "EXPEDIENTES",
        "INSPECCIONES",
        "AUDIENCIAS_MEDIOS",
        "GESTOR_ENTE",
        "AUDITOR",
        "OPERADOR_PRESTADORA",
        "CIUDADANO",
      ];

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <nav className="text-xs text-muted">
        <Link href="/admin/usuarios" className="hover:underline">
          ← Usuarios
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-extrabold text-navy">Nuevo usuario</h1>
        <p className="text-sm text-muted mt-1">
          Alta de un miembro del equipo del Ente, operador de prestadora o vecino.
          La clave inicial es opcional — si no la indicás, se usa el propio DNI y
          el usuario deberá cambiarla en su primer ingreso.
        </p>
      </header>

      <form
        action={crearUsuario}
        className="rounded-2xl border border-line bg-paper p-5 flex flex-col gap-4"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="DNI" required>
            <input
              type="text"
              name="dni"
              required
              inputMode="numeric"
              pattern="\d+"
              maxLength={12}
              placeholder="27345678"
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
            />
          </Field>
          <Field label="Rol" required>
            <select
              name="rol"
              required
              defaultValue=""
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
            >
              <option value="" disabled>
                Elegí un rol…
              </option>
              {rolesAsignables.map((r) => (
                <option key={r} value={r}>
                  {ROL_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nombre" required>
            <input
              type="text"
              name="nombre"
              required
              maxLength={80}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
            />
          </Field>
          <Field label="Apellido" required>
            <input
              type="text"
              name="apellido"
              required
              maxLength={80}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              name="email"
              maxLength={120}
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
            />
          </Field>
          <Field label="Teléfono">
            <input
              type="tel"
              name="telefono"
              maxLength={40}
              placeholder="+54 9 297 4xxxxxx"
              className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
            />
          </Field>
        </div>

        <Field label="Prestadora (solo si el rol es Operador prestadora)">
          <select
            name="prestadoraId"
            defaultValue=""
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
          >
            <option value="">— No aplica —</option>
            {prestadoras.map((p) => (
              <option key={p.id} value={p.id}>
                {p.razonSocial}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Clave inicial (opcional)">
          <input
            type="text"
            name="claveInicial"
            minLength={4}
            maxLength={80}
            placeholder="Si la dejás en blanco, se usa el DNI como clave"
            className="px-3 py-2 rounded-lg border border-line-strong bg-paper text-navy"
          />
        </Field>

        <div className="flex gap-2 items-center pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-navy text-white font-bold text-sm hover:opacity-90"
          >
            Crear usuario
          </button>
          <Link
            href="/admin/usuarios"
            className="px-5 py-2.5 rounded-lg border border-line-strong text-navy font-semibold text-sm"
          >
            Cancelar
          </Link>
        </div>
      </form>

      <p className="text-[12px] text-muted">
        <strong className="text-navy">Importante:</strong> los roles{" "}
        <em>Director del Ente</em> y <em>Director técnico</em> tienen acceso a todo
        el sistema y son los únicos que pueden exportar el informe oficial. Solo el
        Directorio puede crear estos roles.
      </p>
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
