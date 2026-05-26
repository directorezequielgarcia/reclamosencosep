import Link from "next/link";
import { LogoEncosep } from "./LogoEncosep";

export function SitioFooter() {
  return (
    <footer className="bg-navy text-white mt-12">
      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <div className="bg-white rounded-2xl p-3 inline-block mb-3">
            <LogoEncosep size={120} />
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
            Ente de Control de los Servicios Públicos de Comodoro Rivadavia,
            Chubut. Velamos por la continuidad, regularidad y calidad de los
            servicios bajo nuestro control.
          </p>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">
            Información de contacto
          </div>
          <ul className="text-sm opacity-90 leading-relaxed space-y-1">
            <li>Pasaje Valdivia 435</li>
            <li>Comodoro Rivadavia · Chubut</li>
            <li>0800 333 1175</li>
            <li>info@encosepcomodoro.gob.ar</li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">
            Accesos rápidos
          </div>
          <ul className="text-sm opacity-90 leading-relaxed space-y-1">
            <li>
              <Link href="/reclamos" className="hover:underline">
                Portal de Reclamos
              </Link>
            </li>
            <li>
              <Link href="/prestadoras" className="hover:underline">
                Portal de Prestadoras
              </Link>
            </li>
            <li>
              <Link href="/control-prestadoras" className="hover:underline">
                Normativa
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="hover:underline">
                Contacto
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="max-w-6xl mx-auto px-6 py-4 text-xs opacity-60 flex items-center justify-between flex-wrap gap-2">
          <span>
            © {new Date().getFullYear()} EnCoSeP · Comodoro Rivadavia · Todos
            los derechos reservados.
          </span>
          <span>Versión preliminar · MVP</span>
        </div>
      </div>
    </footer>
  );
}
