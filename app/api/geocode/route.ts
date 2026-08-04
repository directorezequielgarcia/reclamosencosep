import { NextResponse } from "next/server";
import { geocodificarDireccion } from "@/lib/geocode";

export const runtime = "nodejs";

/**
 * Geocodifica una dirección escrita a lat/lng. Nominatim exige un User-Agent
 * identificable y desalienta el uso directo desde el navegador — por eso
 * este endpoint hace de intermediario (el cliente nunca llama a Nominatim
 * directo). Usado por el Zorrito Guía en el modo "¿A dónde vas?".
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const direccion = searchParams.get("direccion")?.trim();
  if (!direccion || direccion.length < 3) {
    return NextResponse.json({ error: "dirección inválida" }, { status: 400 });
  }
  const coords = await geocodificarDireccion(direccion);
  return NextResponse.json(coords);
}
