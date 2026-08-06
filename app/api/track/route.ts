import { NextResponse } from "next/server";
import { ipDeRequest, registrarVisita } from "@/lib/visitas";

export async function POST(req: Request) {
  try {
    const { path } = await req.json();
    if (typeof path === "string" && path.length > 0 && path.length < 300) {
      await registrarVisita(path, ipDeRequest(req), req.headers.get("user-agent"));
    }
  } catch {
    // Nunca romper la navegación del usuario por un fallo de tracking.
  }
  return new NextResponse(null, { status: 204 });
}
