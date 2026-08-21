import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES_EDIT } from "@/lib/admin";
import { ALLOWED_VIDEO, MAX_VIDEO_BYTES } from "@/lib/uploads";

export const runtime = "nodejs";

// El vecino puede grabar/subir un video como evidencia de su reclamo (una
// pérdida de agua, un pozo, etc.). Los videos pesan demasiado para pasar por
// una Server Action o Route Handler normal (Vercel limita el body de las
// funciones serverless a ~4.5 MB), así que el navegador sube el archivo
// directo a Vercel Blob y esta ruta solo emite el token firmado, después de
// validar sesión y permiso sobre el reclamo.
type Payload =
  | { scope: "pendiente" }
  | { scope: "reclamo"; reclamoId: string };

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayloadRaw) => {
        const session = await auth();
        if (!session) throw new Error("No autenticado");

        let payload: Payload;
        try {
          payload = JSON.parse(clientPayloadRaw ?? "");
        } catch {
          throw new Error("Payload inválido");
        }

        if (payload.scope === "pendiente") {
          // Reclamo todavía no creado (wizard): cualquier vecino logueado
          // puede subir bajo su propia carpeta "pendientes".
          if (!pathname.startsWith("reclamos/pendientes/")) {
            throw new Error("Ruta no permitida");
          }
        } else if (payload.scope === "reclamo") {
          const { reclamoId } = payload;
          if (!pathname.startsWith(`reclamos/${reclamoId}/videos/`)) {
            throw new Error("Ruta no permitida");
          }
          const reclamo = await prisma.reclamo.findUnique({
            where: { id: reclamoId },
            select: { ciudadanoId: true, prestadoraId: true },
          });
          if (!reclamo) throw new Error("Reclamo inexistente");

          const esDueno = reclamo.ciudadanoId === session.user.id;
          const esAdminConPermiso =
            ROLES_EDIT.includes(session.user.rol) &&
            (session.user.rol !== "OPERADOR_PRESTADORA" ||
              reclamo.prestadoraId === session.user.prestadoraId);
          if (!esDueno && !esAdminConPermiso) {
            throw new Error("Sin permiso sobre este reclamo");
          }
        } else {
          throw new Error("Payload inválido");
        }

        return {
          allowedContentTypes: [...ALLOWED_VIDEO],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "No se pudo iniciar la subida" },
      { status: 400 },
    );
  }
}
