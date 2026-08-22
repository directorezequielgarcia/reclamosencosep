import Link from "next/link";
import { notFound } from "next/navigation";
import { SeccionHeader } from "@/components/ui/SeccionHeader";
import { MigajasSitio, VolverInicio } from "@/components/ui/MigajasSitio";
import { ZorritoTour } from "@/components/tour/ZorritoTour";
import { ZorritoGuia } from "@/components/tour/ZorritoGuia";
import { LineaDetalle } from "@/components/tour/LineaDetalle";
import { POSES, POSE_POR_SVC } from "@/components/tour/zorrito-poses";
import type { SvcKey } from "@/lib/servicios";

type AreaConfig = {
  titulo: string;
  archivo: string;
  prestadora: string;
  prestadoraDetalle?: string;
  descripcionCorta: string;
  queFiscaliza: string[];
  queSePuedeReclamar: string[];
  normativa: Array<{ norma: string; titulo: string }>;
  acento: "blue" | "yellow" | "green" | "purple";
  // Solo Transporte: listado de líneas con resumen (origen → destino) y el
  // detalle calle por calle transcripto del Anexo I de la Resolución 1.628/26
  // (desplegable por línea, para no abrumar la vista por defecto).
  lineas?: Array<{
    numero: string;
    resumen: string;
    tramos: Array<{ etiqueta: string; texto: string }>;
  }>;
  lineasNota?: string;
  // Dos mapas oficiales distintos, NO intercambiables: el de Sol Bus
  // (operador, geolocalización en vivo de las unidades) y el de la MCR
  // (Municipalidad, recorridos/paradas — mismo dataset que usa ZorritoGuia).
  mapaSolBusUrl?: string;
  mapaMcrUrl?: string;
  // Páginas oficiales de referencia de la/s prestadora/s de esta área
  // (sitio institucional, autogestión, facturas online, etc.) — no se
  // reconstruyen acá, se deriva directo al sitio de cada prestadora.
  linksOficiales?: Array<{ label: string; url: string }>;
};

const AREAS: Record<string, AreaConfig> = {
  agua: {
    titulo: "Agua y Saneamiento",
    archivo: "agua.png",
    prestadora: "SCPL — Sociedad Cooperativa Popular Limitada",
    prestadoraDetalle: "Provee agua potable y red cloacal a Comodoro Rivadavia.",
    descripcionCorta:
      "Servicio de provisión de agua potable y desagües cloacales para los hogares y comercios de Comodoro Rivadavia.",
    queFiscaliza: [
      "Continuidad del servicio sin cortes injustificados",
      "Calidad físico-química y bacteriológica del agua",
      "Presión adecuada en la red de distribución",
      "Tiempos de respuesta ante averías",
      "Estado de la red cloacal y desagües",
      "Facturación clara y conforme a la ordenanza",
    ],
    queSePuedeReclamar: [
      "Falta de agua en mi domicilio",
      "Pérdida o caño roto en la vía pública",
      "Baja presión persistente",
      "Cloaca tapada o desborde",
      "Mala calidad del agua (color, olor, sabor)",
      "Errores de facturación",
    ],
    normativa: [
      {
        norma: "Ordenanza 14.996/19",
        titulo: "Reglamento del Usuario del servicio de agua potable y desagües cloacales",
      },
    ],
    acento: "blue",
    linksOficiales: [
      { label: "Página oficial de la SCPL", url: "https://scpl.coop/" },
      { label: "Facturas de la SCPL (autogestión)", url: "https://mi.scpl.coop/login" },
    ],
  },
  energia: {
    titulo: "Energía Eléctrica y Alumbrado Público",
    archivo: "energia.png",
    prestadora: "SCPL — Sociedad Cooperativa Popular Limitada",
    prestadoraDetalle:
      "Distribuidora de energía eléctrica y responsable del alumbrado público.",
    descripcionCorta:
      "Distribución de energía eléctrica domiciliaria, comercial e industrial, y mantenimiento del alumbrado público.",
    queFiscaliza: [
      "Continuidad del suministro eléctrico",
      "Calidad del producto técnico (tensión, frecuencia)",
      "Tiempos de respuesta ante cortes",
      "Mantenimiento de luminarias públicas",
      "Seguridad de la red (postes, cables, transformadores)",
      "Facturación conforme al cuadro tarifario",
    ],
    queSePuedeReclamar: [
      "Corte de luz en mi cuadra",
      "Luminaria apagada, titilante o caída",
      "Cable caído o riesgo eléctrico",
      "Reiteración de cortes en el sector",
      "Baja tensión persistente",
      "Errores de facturación o cuadro tarifario",
    ],
    normativa: [
      {
        norma: "Ordenanza 14.995/19",
        titulo: "Reglamento del Usuario de servicios públicos de distribución de energía eléctrica y alumbrado público",
      },
    ],
    acento: "yellow",
    linksOficiales: [
      { label: "Página oficial de la SCPL", url: "https://scpl.coop/" },
      { label: "Facturas de la SCPL (autogestión)", url: "https://mi.scpl.coop/login" },
    ],
  },
  residuos: {
    titulo: "Gestión de Residuos",
    archivo: "residuos.png",
    prestadora: "CLEAR URBANA S.A.",
    prestadoraDetalle:
      "Empresa concesionaria del servicio de higiene urbana de la ciudad.",
    descripcionCorta:
      "Recolección domiciliaria de residuos, barrido de calles, mantenimiento de contenedores y operación de planta de tratamiento.",
    queFiscaliza: [
      "Cumplimiento del cronograma de recolección por zona",
      "Estado, cantidad y ubicación de contenedores",
      "Barrido y limpieza de calles, plazas y espacios públicos",
      "Retiro de residuos voluminosos y restos verdes",
      "Operación de la planta de tratamiento de residuos",
      "Cumplimiento del pliego licitatorio vigente",
    ],
    queSePuedeReclamar: [
      "No pasó el camión recolector",
      "Contenedor roto, desbordado o desplazado",
      "Basurales en la vía pública",
      "Residuos voluminosos sin retirar",
      "Suciedad en plazas o espacios públicos",
      "Olores o presencia de plagas",
    ],
    normativa: [
      {
        norma: "Ordenanza 11.638/14",
        titulo: "Residuos Sólidos Urbanos — texto ordenado",
      },
      {
        norma: "Ordenanza 11.728",
        titulo: "Pliego licitatorio de Higiene Urbana (10 años)",
      },
      {
        norma: "Lic. Pública 26/2025-SHU",
        titulo: "Nueva licitación del Servicio de Higiene Urbana — en curso",
      },
    ],
    acento: "green",
    linksOficiales: [
      { label: "Página oficial de Urbana CR", url: "https://www.urbanacr.com.ar/" },
    ],
  },
  transporte: {
    titulo: "Transporte Público Urbano y Suburbano",
    archivo: "transporte.png",
    prestadora: "SOL BUS (Grupo MR S.R.L.) · TRANSPORTE DIADEMA S.A.",
    prestadoraDetalle:
      "Desde el 1° de agosto de 2026, Grupo MR S.R.L. — marca comercial SOL BUS — presta el servicio urbano y suburbano de pasajeros, en reemplazo de Patagonia Argentina S.R.L. Diadema continúa con sus líneas. Desde el 1° de septiembre de 2026 rige un nuevo cuadro de líneas y recorridos (Resolución 1.628/26).",
    descripcionCorta:
      "Servicio de colectivos urbanos e interurbanos que conectan los barrios de Comodoro Rivadavia, Rada Tilly y zonas aledañas.",
    queFiscaliza: [
      "Cumplimiento de frecuencias y recorridos del pliego",
      "Estado mecánico y de mantenimiento de las unidades",
      "Limpieza interior y exterior de los colectivos",
      "Cumplimiento del cuadro tarifario y boleto integrado",
      "Estado de paradas y refugios",
      "Trato del personal hacia los usuarios",
    ],
    queSePuedeReclamar: [
      "El colectivo no pasó",
      "Frecuencia irregular",
      "Mal estado de la unidad",
      "Mal trato del chofer o personal",
      "Cartel o parada dañada",
      "Cambio de parada o lugar de levantamiento (Sol Bus)",
      "Cobro fuera del cuadro tarifario",
    ],
    normativa: [
      {
        norma: "Resolución Municipal Nº 1.628/26 (21-08-2026)",
        titulo:
          "Deroga la Resolución 1.399/26 y establece las nuevas líneas, ramales y recorridos de la Etapa Inicial del servicio a cargo de Grupo MR S.R.L. (Sol Bus), de cumplimiento obligatorio desde el 1° de septiembre de 2026",
      },
      {
        norma: "Ordenanza Municipal Nº 17.335/25",
        titulo: "Pliego de Bases y Condiciones — frecuencias, horarios y parámetros operativos",
      },
    ],
    acento: "purple",
    lineasNota:
      "Detalle calle por calle transcripto del Anexo I de la Resolución 1.628/26 (vigente desde el 1° de septiembre de 2026) — tocá cada línea para desplegarlo. Nota: la Etapa Inicial no incluye líneas 10 ni 11.",
    mapaSolBusUrl: "https://micronauta.dnsalias.net/web/urbano/?conf=comodoro",
    mapaMcrUrl: "https://comodoro-mit.github.io/transporte",
    linksOficiales: [
      { label: "Página oficial de Sol Bus", url: "https://www.solbus.com.ar/" },
    ],
    lineas: [
      {
        numero: "1",
        resumen: "Máximo Abásolo – Centro",
        tramos: [
          { etiqueta: "Ida", texto: "Natalia Payaguala, Avenida Polonia, Raúl Cercos, Ingeniero Huergo, Los Pensamientos, San Martín, Los Álamos, Avenida Rivadavia, Viamonte, Chaco, Saavedra, Avenida Rivadavia, Belgrano, Avenida Ducos, Carlos Pellegrini, Gil Álvarez." },
          { etiqueta: "Vuelta", texto: "Gil Álvarez, 25 de Mayo, Avenida Hipólito Yrigoyen, Avenida Alsina, Rawson, Alvear, Misiones, 13 de Diciembre, Ingeniero Huergo, Leandro N. Alem, Avenida Rivadavia, Los Nogales, San Martín, Los Pensamientos, Ingeniero Huergo, Raúl Cercos, Natalia Payaguala." },
        ],
      },
      {
        numero: "2",
        resumen: "Máximo Abásolo – Centro",
        tramos: [
          { etiqueta: "Ida", texto: "Natalia Payaguala, Avenida Polonia, Raúl Cercos, Ingeniero Huergo, Avenida Eva Duarte, Carlos O'Donnell, Avenida 10 de Noviembre, Calle Código, Avenida Julio Argentino Roca, Maestro Carlos Guastavino, Calle Código 829, Código 884, Gustavo Bahamonde, Francisco Behr, Avenida Lisandro de la Torre, Avenida Estados Unidos, Avenida Juan XXIII, Avenida Sargento Cabral, Aristóbulo del Valle, Alvear, Dorrego, Almirante Brown, Belgrano, Avenida Ducos, Carlos Pellegrini, Gil Álvarez." },
          { etiqueta: "Vuelta", texto: "Gil Álvarez, 25 de Mayo, Almirante Brown, Rawson, Saavedra, Bouchardo, 13 de Diciembre, Salta, Avenida Sargento Cabral, Avenida Juan XXIII, Avenida Estados Unidos, Avenida Lisandro de la Torre, Francisco Behr, Gustavo Bahamonde, Avenida Julio Argentino Roca, Carlos O'Donnell, Avenida Polonia, Cámpora, Avenida Eva Duarte, Ingeniero Huergo, Raúl Cercos, Natalia Payaguala." },
        ],
      },
      {
        numero: "3",
        resumen: "Estadio Centenario – Abel Amaya",
        tramos: [
          { etiqueta: "Ida", texto: "Avenida Chile, Avenida Kennedy, Avenida Rivadavia, Belgrano, Ameghino, Almirante Brown, Carlos Pellegrini, Avenida Rivadavia, 25 de Mayo, Avenida Hipólito Yrigoyen, Federico Carstens." },
          { etiqueta: "Vuelta", texto: "Carstens, Avenida Ducos, Pellegrini, Avenida Rivadavia, Isla Leones, Avenida Kennedy, Avenida Chile." },
        ],
      },
      {
        numero: "4",
        resumen: "Abel Amaya – Estadio Centenario",
        tramos: [
          { etiqueta: "Ida", texto: "Carstens, Avenida Ducos, Carlos Pellegrini, Avenida Hipólito Yrigoyen, Máximo Abásolo, Avenida Rivadavia, 25 de Mayo, Avenida Hipólito Yrigoyen, Avenida Estados Unidos, Avenida Canadá, Avenida Julio Argentino Roca, Avenida Lisandro de la Torre." },
          { etiqueta: "Vuelta", texto: "Avenida Chile, Luis Alassia, Avenida Lisandro de la Torre, Avenida Julio Argentino Roca, Avenida Canadá, Avenida Estados Unidos, Avenida Hipólito Yrigoyen, Avenida Ducos, Avenida Alsina, Bahía Bustamante, Democracia, Roque Sáenz Peña, Avenida Ducos, Carlos Pellegrini, Avenida Hipólito Yrigoyen, Máximo Abásolo, Avenida Rivadavia, 25 de Mayo, Avenida Hipólito Yrigoyen, Carstens." },
        ],
      },
      {
        numero: "5",
        resumen: "Estadio Centenario – Abel Amaya / Abel Amaya – Las Orquídeas",
        tramos: [
          { etiqueta: "Ramal 5 · Ida", texto: "Carstens, Avenida Ducos, Carlos Pellegrini, Avenida Rivadavia, Avenida Alsina, Sarmiento, Leandro N. Alem, Ceferino Namuncurá, Fontana, Ramos Mejía, Necochea, 13 de Diciembre, Aristóbulo del Valle, Avenida Sargento Cabral, Salta, José G. Artigas, Isla de los Estados, Federico Alcorta, Avenida Estados Unidos, Sargento Ramírez, Avenida Polonia, La Nación, Avenida Chile." },
          { etiqueta: "Ramal 5 · Vuelta", texto: "Avenida Chile, Antonio Morán, La Razón, Avenida Julio Argentino Roca, La Nación, Avenida Polonia, Colonos Galeses, Isla de los Estados, Figueroa Alcorta, Salta, Avenida Sargento Cabral, Aristóbulo del Valle, Alvear, Avenida Rivadavia, Belgrano, Ameghino, Almirante Brown, Carlos Pellegrini, Avenida Rivadavia, 25 de Mayo, Hipólito Yrigoyen, Carstens." },
          { etiqueta: "Ramal 5U Abel Amaya – Las Orquídeas · Ida", texto: "Avenida Kennedy, La Razón, Gabriel Barcelos, Avenida Chile, Rotonda Chile y Kennedy, Avenida Chile, Antonio Morán, La Razón, Avenida Julio Argentino Roca, La Nación, Avenida Polonia, Colonos Galeses, Isla de los Estados, Figueroa Alcorta, Salta, Avenida Sargento Cabral, Aristóbulo del Valle, Alvear, Avenida Rivadavia, Belgrano, Avenida Ducos, Pellegrini, Avenida Hipólito Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, Avenida J. M. Pueyrredón, Avenida del Libertador, Ruta Provincial N° 1, Avenida José Ingenieros, López de Vega, Ferrocarril Patagónico, Ferrocarril Roca, Galetto de Abad, Reconquista, Rotonda Barrio Usina, Reconquista, Ruta Provincial N° 1, 4 de Noviembre, García Marcet, Los Bolleros, Terraza, Los Sargentos, Benjamín Rollán." },
          { etiqueta: "Ramal 5U Abel Amaya – Las Orquídeas · Vuelta", texto: "Pedro Granzón, Terraza, Cortázar, Soldado Argentino, Avenida del Parque, Avenida José Ingenieros, Ruta Nacional N° 3, Avenida del Libertador, Ruta Nacional N° 3, Avenida Rivadavia, Alsina, Sarmiento, Leandro N. Alem, Ceferino Namuncurá, Fontana, Ramos Mejía, Necochea, 13 de Diciembre, Aristóbulo del Valle, Avenida Sargento Cabral, Salta, José G. Artigas, Isla de los Estados, Avenida Estados Unidos, Sargento Ramírez, Avenida Polonia, La Nación, Avenida Chile, Rotonda Chile y Kennedy, Avenida Kennedy." },
        ],
      },
      {
        numero: "6",
        resumen: "Circular AH / Circular H: Estadio Municipal – Centro – Gral. Mosconi – Abásolo – Stella Maris",
        tramos: [
          { etiqueta: "Circular AH: Estadio Municipal → Centro → Gral. Mosconi → Abásolo → Stella Maris → Centro", texto: "Carstens, Avenida Ducos, Pellegrini, Avenida Hipólito Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, Avenida J. M. Pueyrredón, Fray Luis Beltrán, Gallardo Rodríguez, Colectora Fray Luis Beltrán, Los Cedros, Fray Luis Beltrán, Roque González, Avenida Polonia, Raúl Cercos, Natalia Payaguala, Avenida Polonia, Avenida Kennedy, Avenida Constituyentes, Ruta Nacional N° 3, Ignacio Gatica, Camino Juan Domingo Perón, Saturnino López, Eustaquio Molina, José Dalle Mura, Avenida Hipólito Yrigoyen, Avenida Ducos, Avenida Alsina, Avenida Hipólito Yrigoyen, Carstens." },
          { etiqueta: "Circular H: Estadio Municipal → Stella Maris → Abásolo → Gral. Mosconi → Centro", texto: "Carstens, Avenida Ducos, Avenida Alsina, Avenida Hipólito Yrigoyen, Juan P. Evet, Monseñor de Andrea, Gerónimo Maliqueo, José Suazo, Avenida Portugal, José Dalle Mura, Alfredo Llames Massini, Eustaquio Molina, Saturnino López, Juan Domingo Perón, Ignacio Gatica, Avenida Hipólito Yrigoyen, Avenida Constituyentes, Avenida Callao, Avenida Roca, Del Trabajo, Avenida Polonia, Roque González, Avenida Fray Luis Beltrán, Los Cedros, Colectora Avenida Fray Luis Beltrán, Doctor Manuel Sueiro, Gallardo Rodríguez, Avenida Fray Luis Beltrán, José Fuchs, Marcelino Reyes, Avenida del Libertador, Ruta Nacional N° 3, Sarmiento, 25 de Mayo, Avenida Hipólito Yrigoyen, Carstens." },
        ],
      },
      {
        numero: "7",
        resumen: "Estadio Centenario – Laprida",
        tramos: [
          { etiqueta: "Ida", texto: "Carstens, Avenida Ducos, Avenida Alsina, Bahía Bustamante, Democracia, Roque Sáenz Peña, Avenida Ducos, Carlos Pellegrini, Hipólito Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, Avenida J. M. Pueyrredón, Avenida Fray Luis Beltrán, Francisco de Viedma, Petrolero San Lorenzo, Avenida Tehuelches, Jesús Garré, Avenida del Libertador, Ruta 25 de Mayo, Argelino Suluaga, Buenos Aires, Tucumán, Entre Ríos, Argelino Suluaga, Ruta 25 de Mayo, Jorge Blachakis, Sara Andreoli, Código 3162, Código 3161, Rotonda Código 3161, Código 3161, Código 3162, Sara Andreoli, Jorge Blachakis, Ruta 25 de Mayo, Paraguay, Bogotá, Costa Rica, Alaska, Acapulco, Potosí, Jamaica, Bogotá, Ecuador, Paraguay." },
          { etiqueta: "Vuelta", texto: "Paraguay, Ruta 25 de Mayo, Jorge Blachakis, Sara Andreoli, Código 3162, Código 3161, Rotonda Código 3161, Código 3161, Código 3162, Sara Andreoli, Jorge Blachakis, Ruta 25 de Mayo, Argelino Suluaga, Buenos Aires, Tucumán, Entre Ríos, Argelino Suluaga, Ruta 25 de Mayo, Avenida del Libertador, Avenida Tehuelches, Avenida Lángara, Francisco de Viedma, Avenida Fray Luis Beltrán, José Fuchs, Doctor Marcelino Reyes, Avenida del Libertador, Ruta Nacional N° 3, Güemes, Avenida Rivadavia, Belgrano, Avenida Hipólito Yrigoyen, Carstens." },
        ],
      },
      {
        numero: "8",
        resumen: "Standard – Palazzo",
        tramos: [
          { etiqueta: "8 AH: Standard → Palazzo", texto: "Carstens, Avenida Ducos, Avenida Alsina, Bahía Bustamante, Democracia, Roque Sáenz Peña, Avenida Ducos, Mitre, Avenida Rivadavia, Belgrano, Avenida Ducos, Pellegrini, Avenida Hipólito Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, Avenida J. M. Pueyrredón, Avenida Fray Luis Beltrán, Francisco de Viedma, Petrolero San Lorenzo, Avenida Tehuelches, Jesús Garré, Avenida del Libertador, Ruta Provincial N° 1, Avenida José Ingenieros, Ruta Provincial N° 1, Avenida Alejandro Maíz, Base Petrel, Base Matienzo, Código 2404, Teniente Daniel Jukic, Martín Comodoro Rivadavia, Los Arrayanes, Avenida Nahuel Huapi, Avenida Raúl Encina, 8 de Diciembre, E. Hermitte, F. Pigafetta, Wenceslao Escalante, Teodoro Petroff, Ítalo Dell'Oro, Juan José Paso, Reconquista, Juan José Paso, 1° de Noviembre, General Lavalle, Antártida Argentina, Ruta Provincial N° 39, Ruta Nacional N° 3, Salida Ruta Nacional N° 3, Rotonda Rodríguez Peña, ARA Crucero General Belgrano, Ruta Nacional N° 3, Mirco Michinovich, Dionisio Néstor Páez, Mariano Rodríguez, Ruta Nacional N° 3, Avenida del Libertador, Avenida Tehuelches, Avenida Lángara, Francisco de Viedma, Fray Luis Beltrán, José Fuchs, Doctor Marcelino Reyes, Avenida del Libertador, Ruta Nacional N° 3, Sarmiento, Belgrano, Avenida Hipólito Yrigoyen, Carstens." },
          { etiqueta: "8 H: Palazzo → Standard", texto: "Carstens, Avenida Ducos, Avenida Alsina, Bahía Bustamante, Democracia, Roque Sáenz Peña, Avenida Ducos, Mitre, Avenida Rivadavia, Belgrano, Avenida Ducos, Pellegrini, Avenida Hipólito Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, Avenida J. M. Pueyrredón, Avenida Fray Luis Beltrán, Francisco de Viedma, Petrolero San Lorenzo, Avenida Tehuelches, Jesús Garré, Avenida del Libertador, Rotonda Universidad, Ruta Nacional N° 3, Ingreso Barrio Castelli, Mariano Rodríguez, Código 2930, Rosalía Eulalia Guaita, Adrián Silva, Mariano Rodríguez, Ruta Nacional N° 3, Avenida Juan José Paso, Teniente Vanesia, San Lorenzo, Fuerza Aérea Argentina, Avenida Juan José Paso, Teodoro Petroff, Wenceslao Escalante, Avenida Raúl Encina, Avenida Nahuel Huapi, Laguna Blanca, Ignacio Zúñiga, Los Arrayanes, Martín Comodoro Rivadavia, Teniente Daniel Jukic, Código 2404, Base Matienzo, Base Petrel, Avenida Alejandro Maíz, Ruta Provincial N° 1, Avenida José Ingenieros, Ruta Provincial N° 1, Ruta Nacional N° 3, Avenida Tehuelches, Avenida Lángara, Francisco de Viedma, Avenida Fray Luis Beltrán, José Fuchs, Doctor Marcelino Reyes, Avenida del Libertador, Ruta Nacional N° 3, Sarmiento, Belgrano, Avenida Hipólito Yrigoyen, Carstens." },
        ],
      },
      {
        numero: "9",
        resumen: "Centro – Barrio Industrial",
        tramos: [
          { etiqueta: "Ida (9A)", texto: "Gil Álvarez, 25 de Mayo, Almirante Brown, Carlos Pellegrini, Avenida Rivadavia, Los Nogales, San Martín, Los Pensamientos, Ingeniero Huergo, Bruno Pieragnoli, Avenida Polonia, Avenida Hipólito Yrigoyen, Avenida del Progreso, Rotonda Avenida del Progreso, Avenida del Progreso, Avenida Hipólito Yrigoyen, Rotonda Ruta Nacional N° 3 y Ruta Nacional N° 26." },
          { etiqueta: "Vuelta (9)", texto: "Avenida del Progreso, Rotonda Avenida del Progreso, Avenida del Progreso, Avenida Hipólito Yrigoyen, Rotonda Ruta Nacional N° 3 y Ruta Nacional N° 26, Avenida Hipólito Yrigoyen, Avenida Polonia, Bruno Pieragnoli, Ingeniero Huergo, Los Pensamientos, San Martín, Los Álamos, Avenida Rivadavia, Belgrano, Ameghino, Almirante Brown, Carlos Pellegrini, Gil Álvarez." },
        ],
      },
      {
        numero: "9A",
        resumen: "Centro – Barrio Industrial (Extensión Arenales)",
        tramos: [
          { etiqueta: "Ida", texto: "Pasaje Gil Álvarez, 25 de Mayo, Almirante Brown, Carlos Pellegrini, Avenida Rivadavia, Los Nogales, San Martín, Los Pensamientos, Ingeniero Huergo, Bruno Pieragnoli, Avenida Polonia, Avenida Hipólito Yrigoyen, Avenida del Progreso, Rotonda Avenida del Progreso, Avenida del Progreso, Avenida Hipólito Yrigoyen, Rotonda Ruta Nacional N° 3 y Ruta Nacional N° 26, Oscar Poltroneri, Antonio Corrales, Antonio Berni, Luis Alberto Blanco." },
          { etiqueta: "Vuelta", texto: "Piedra Parada, Luis Alberto Blanco, Nicolás Esandi, Antonio Corrales, Oscar Poltroneri, Ruta Nacional N° 26, Rotonda Ruta Nacional N° 26 y Ruta Nacional N° 3, Avenida Hipólito Yrigoyen, Avenida Polonia, Bruno Pieragnoli, Ingeniero Huergo, Los Pensamientos, San Martín, Los Álamos, Avenida Rivadavia, Belgrano, Ameghino, Almirante Brown, Carlos Pellegrini, Gil Álvarez." },
        ],
      },
      {
        numero: "12",
        resumen: "Centro – Abásolo",
        tramos: [
          { etiqueta: "Ida", texto: "Raúl Cercos, Natalia Payaguala, Avenida Polonia, Ricardo Balbín, Calle Código 651, Calle Código 821, Avenida 10 de Noviembre, Avenida Roca, Maestro Carlos Guastavino, Calle Código 829, Calle Código 844, Miguel Amado, Francisco de Nevares, Jorge Marinero López, Francisco Behr, Avenida 10 de Noviembre, Avenida Estados Unidos, Avenida Rivadavia, Saavedra, Dorrego, Almirante Brown, Mitre, Ameghino, Almirante Brown, Pellegrini, Gil Álvarez." },
          { etiqueta: "Vuelta", texto: "Gil Álvarez, 25 de Mayo, Avenida Hipólito Yrigoyen, Avenida Alsina, Rawson, Alvear, Avenida Rivadavia, Avenida Estados Unidos, Avenida 10 de Noviembre, Avenida Polonia, Marinero Jorge López, Francisco Behr, Gustavo Bahamonde, José Ortega, Gustavo Bahamonde, Jaime Francisco de Nevares, Miguel Amado, Calle Código 844, Calle Código 829, Maestro Carlos Guastavino, Avenida Roca, Avenida 10 de Noviembre, Calle Código 821, Calle Código 651, Ricardo Balbín, Avenida Polonia, Rotonda Avenida Polonia y Raúl Cercos." },
        ],
      },
      {
        numero: "13",
        resumen: "Estadio Centenario – Standard",
        tramos: [
          { etiqueta: "Ida", texto: "Carstens, Avenida Ducos, Avenida Alsina, Bahía Bustamante, Democracia, Roque Sáenz Peña, Avenida Ducos, Mitre, Avenida Rivadavia, Belgrano, Avenida Ducos, Pellegrini, Avenida Hipólito Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, Avenida J. M. Pueyrredón, Avenida del Libertador, Ruta Provincial N° 1, Avenida José Ingenieros, Ruta Provincial N° 1, Avenida Alejandro Maíz, Base Petrel, Base Matienzo, Código 2404, Código 2434, Código 2438, Los Arrayanes." },
          { etiqueta: "Vuelta", texto: "El Cóndor, Código 2404, Facundo Quiroga, Código 2393, Avenida Punta Borja, E. Hermitte, F. Pigafetta, Teodoro Petroff, Ítalo Dell'Oro, Avenida Alejandro Maíz, Ruta Provincial N° 1, Avenida José Ingenieros, Ruta Provincial N° 1, Avenida del Libertador, Ruta Nacional N° 3, Güemes, Avenida Rivadavia, Belgrano, Hipólito Yrigoyen, Carstens." },
        ],
      },
      {
        numero: "14",
        resumen: "30 de Octubre – Centro (F14-15)",
        tramos: [
          { etiqueta: "Ida", texto: "Avenida Kennedy, La Razón, Gabriel Barcelo, Avenida Chile, Padre Juan Corti, Código 748, Raúl Cercos, Leonardo Trevisan, René Favaloro, María Magdalena Güemes, Nicolás Chacoma, Sixto Ojeda, Rotonda Código 748, Raúl Cercos, Código 3536, Código 3111, Raúl Cercos, Ana Herrera, Armando Cistari, Lorenzo Rognetta, Código 586, Juana Azurduy, Avenida Lisandro de la Torre, Avenida Estados Unidos, Avenida Rivadavia, Belgrano, Ameghino, Almirante Brown, Carlos Pellegrini." },
          { etiqueta: "Vuelta", texto: "Pellegrini, Avenida Rivadavia, Avenida Estados Unidos, Avenida Lisandro de la Torre, Juana Azurduy, Código 586, Lorenzo Rognetta, Armando Cistari, Ana Herrera, Raúl Cercos, Código 3111, Código 3536, Nicolás Chacoma, Sixto Ojeda, María Magdalena Güemes, René Favaloro, Leonardo Trevisan, Raúl Cercos, Código 748, Padre Corti, Avenida Chile, Rotonda Chile y Avenida Kennedy." },
        ],
      },
      {
        numero: "15",
        resumen: "Centro – Los Tres Pinos",
        tramos: [
          { etiqueta: "Ida", texto: "Pellegrini, Avenida Rivadavia, 25 de Mayo, Avenida Hipólito Yrigoyen, Avenida Polonia, Rotonda Avenida Polonia y Roque González, Doctor Eduardo Musaccio." },
          { etiqueta: "Vuelta", texto: "Eduardo Musaccio, Código 3116, Haroldo Conti, Antonio Di Benedetto, Marcos Denevi, C. Alberto Rivas, Haroldo Conti, Roberto Rajido, Roberto Payró, Concejal Alcoleas, Doctor Eduardo Musaccio, Código Ocaso, Roberto Payró, Teolindo Ramírez, Código 3219, Código 3218, Jorge Daniel Ludueña, Código 3220, C. Mazaredo, José María Moreno, Doctor Manuel Sueiro, Colectora Fray Luis Beltrán, Los Robles, Los Alerces, Los Aromos, Las Araucarias, Avenida del Pinar, El Algarrobo, Avenida 10 de Noviembre, Avenida Polonia, Avenida Hipólito Yrigoyen, Avenida Ducos, Avenida Alsina, Bahía Bustamante, Democracia, Roque Sáenz Peña, Avenida Ducos, Carlos Pellegrini." },
        ],
      },
      {
        numero: "16",
        resumen: "Estadio – Saavedra – Aeronáutico",
        tramos: [
          { etiqueta: "Ida", texto: "Carstens, Avenida Ducos, Avenida Alsina, Bahía Bustamante, Democracia, Roque Sáenz Peña, Pellegrini, Avenida Hipólito Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, Avenida J. M. Pueyrredón, Fray Luis Beltrán, Francisco de Viedma, Petrolero San Lorenzo, Avenida Tehuelches, Avenida Lángara, Avenida Mazaredo, José María Moreno, José Aimar, Santa Lucía, Edward Flagel, Doctor Manuel Sueiro, Colectora Fray Luis Beltrán, Los Cedros, El Algarrobo, Avenida Fray Luis Beltrán, Roque González, Código 2222, Fabián Arienti, Código 2224, Código 2226." },
          { etiqueta: "Vuelta", texto: "Código 2226, Código 2222, Roque González, Avenida Fray Luis Beltrán, Los Robles, Los Alerces, Los Aromos, Las Araucarias, Avenida del Pinar, El Algarrobo, Alberto Toussaint, Carlos Rodríguez Gallardo, Doctor Manuel Sueiro, Antonio Isaías Carrizo, Edward Flagel, Santa Lucía, José Aimar, Avenida Mazaredo, Avenida Lángara, Francisco de Viedma, Avenida Fray Luis Beltrán, José Fuchs, Marcelino Reyes, Avenida del Libertador, Ruta Nacional N° 3, Avenida Rivadavia, Belgrano, Avenida Hipólito Yrigoyen, Carstens." },
        ],
      },
      {
        numero: "17",
        resumen: "Estadio – Padre Corti",
        tramos: [
          { etiqueta: "Ida", texto: "Carstens, Avenida Ducos, Avenida Alsina, Bahía Bustamante, Democracia, Roque Sáenz Peña, Avenida Ducos, Carlos Pellegrini, Hipólito Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, Avenida J. M. Pueyrredón, Avenida Fray Luis Beltrán, Francisco de Viedma, Petrolero San Lorenzo, Avenida Tehuelches, Jesús Garré, Avenida del Libertador, Rotonda Universidad, Avenida del Libertador, Acceso al Barrio Castelli, Mariano Rodríguez, Dionisio Néstor Páez, Mirco Michunovich, Mariano Rodríguez, Ruta Nacional N° 3, Rotonda Ruta Nacional N° 3 y Ruta Provincial N° 39, Independencia, Fitz Roy, Los Andes, El Baqueano, El Chasqui, El Rastreador, Los Andes, Cerro La Plata, Cerro Solano." },
          { etiqueta: "Vuelta", texto: "Cerro Domuyo, Monte Pissis, Cerro Mercedario, Cerro La Plata, Los Andes, El Rastreador, El Chasqui, El Baqueano, Los Andes, Pucará, Independencia, José Hernández, Primero de Mayo, Ruta Nacional N° 3, Ingreso Rodríguez Peña, Rotonda Rodríguez Peña, ARA General Belgrano, Ruta Nacional N° 3, Mirco Michunovich, Dionisio Néstor Páez, Mariano Rodríguez, Ruta Nacional N° 3, Avenida del Libertador, Avenida Tehuelches, Avenida Lángara, Francisco de Viedma, Avenida Fray Luis Beltrán, José Fuchs, Marcelino Reyes, Avenida del Libertador, Ruta Nacional N° 3, Sarmiento, 25 de Mayo, Avenida Hipólito Yrigoyen, Carstens." },
        ],
      },
      {
        numero: "18",
        resumen: "Estadio Centenario – Restinga Alí",
        tramos: [
          { etiqueta: "Ida", texto: "Carstens, Avenida Ducos, Carlos Pellegrini, Hipólito Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, Avenida J. M. Pueyrredón, Francisco de Viedma, Petrolero San Lorenzo, Avenida Tehuelches, Jesús Garré, Avenida del Libertador, Ruta Provincial N° 1, Avenida José Ingenieros, Avenida del Parque, Soldado Argentino, Los Sargentos, Pedro Granzón, Mario Morejón, Avenida Nahuel Huapi, Sargento Baltazar González, Código 2438, Código 2432, Base Irízar, Base Petrel, Doña Juana Sosa Toledo, Rubén Darío, Dolores Mora." },
          { etiqueta: "Vuelta", texto: "Andrés Bello, Pablo Neruda, Doña Juana Sosa Toledo, Base Petrel, Base Irízar, Código 2432, Código 2438, Sargento Baltazar González, Avenida Nahuel Huapi, Mario Morejón, Pedro Granzón, Baldomero Terraza, Julio Cortázar, Soldado Argentino, Avenida del Parque, Avenida José Ingenieros, Ruta Provincial N° 1, Avenida del Libertador, Avenida Tehuelches, Avenida Lángara, Francisco de Viedma, Fray Luis Beltrán, José Fuchs, Marcelino Reyes, Avenida del Libertador, Ruta Nacional N° 3, Sarmiento, Belgrano, Avenida Hipólito Yrigoyen, Carstens." },
        ],
      },
      {
        numero: "19",
        resumen: "Estadio Centenario – Caleta Córdova",
        tramos: [
          { etiqueta: "Ida", texto: "Carstens, Avenida Ducos, Carlos Pellegrini, Avenida Hipólito Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, Avenida J. M. Pueyrredón, Avenida del Libertador, Ruta Provincial N° 1, Avenida José Ingenieros, Ruta Provincial N° 1, Avenida Alejandro Maíz, Ruta Provincial N° 1, Avenida Punta Novales, El Ancla, Código 2727." },
          { etiqueta: "Vuelta", texto: "Código 2727, Avenida Punta Novales, Ruta Provincial N° 1, Avenida Alejandro Maíz, Ruta Provincial N° 1, Avenida José Ingenieros, Ruta Provincial N° 1, Avenida del Libertador, Ruta Nacional N° 3, Sarmiento, 25 de Mayo, Avenida Hipólito Yrigoyen, Carstens." },
        ],
      },
      {
        numero: "20",
        resumen: "Base Sol Bus – Stella Maris – Hospital Alvear",
        tramos: [
          { etiqueta: "Ida", texto: "Juan Vueguen, Juan Davies, Avenida Hipólito Yrigoyen, Ignacio Gatica, Antonio Roqueta Pratt, Saavedra Lamas, Vicente Torraca, Código 811, Ramón Castillo, Ignacio Gatica, Código 562, Lorenzo Gastaldi, Código 516, Luis Gallino, Saturnino López, Eustaquio Molina, Alfredo Llames Massini, José Dalle Mura, Avenida Hipólito Yrigoyen, Avenida Ducos, Avenida Alsina, Bahía Bustamante, Democracia, Roque Sáenz Peña, Avenida Ducos, Carlos Pellegrini, Avenida Hipólito Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, Avenida J. M. Pueyrredón, José María Paz, Avenida Mariano de Vedia, Dolores Moscara de Medrano, Avenida Juan Ramón Balcarce." },
          { etiqueta: "Vuelta", texto: "Avenida Juan Ramón Balcarce, Avenida Mariano de Vedia, Avenida Manuel Quintana, Gobernador Moyano, Avenida J. M. Pueyrredón, Avenida del Libertador, Ruta Nacional N° 3, Sarmiento, 25 de Mayo, Avenida Hipólito Yrigoyen, Juan P. Evet, Monseñor de Andrea, Gerónimo Maliqueo, José Suazo, Avenida Portugal, José Dalle Mura, Alfredo Llames Massini, Eustaquio Molina, Saturnino López, José Liñeiro, Presidente Ramón Castillo, Código 811, Vicente Torraca, Saavedra Lamas, Antonio Roqueta Pratt, Ignacio Gatica, Avenida Hipólito Yrigoyen, Tirso López, Juan Davies, Juan Vueguen." },
        ],
      },
      {
        numero: "21",
        resumen: "Padre Corti – Don Bosco – Standard",
        tramos: [
          { etiqueta: "Ida", texto: "Cerro Solano, Cerro Domuyo, Cerro Hermitte, Monte Pissis, Cerro Mercedario, Cerro La Plata, Los Andes, El Rastreador, Tradición, El Baqueano, Los Andes, Pucará, Independencia, Fitz Roy, 1 de Mayo, Bulevar Constitución, Los Andes, Ruta Provincial N° 39, Antártida Argentina, Avenida General Lavalle, Luro Cambaceres, Avenida Juan José Paso, Teniente Vanesia, San Lorenzo, Fuerza Aérea Argentina, Avenida Juan José Paso, Ítalo Dell'Oro, Teodoro Petroff, Wenceslao Escalante, 8 de Diciembre, Martín Comodoro Rivadavia, Teniente Daniel Jukic, Código 2404, Base Matienzo, Base Petrel, Avenida Alejandro Maíz, Ítalo Dell'Oro." },
          { etiqueta: "Vuelta", texto: "Ítalo Dell'Oro, Teniente Miguel Giménez, Avenida Alejandro Maíz, Base Petrel, Base Matienzo, Código 2404, Teniente Daniel Jukic, Aldo Juan Silvestrini, Avenida Francisco Pietrobelli, Ítalo Dell'Oro, Juan José Paso, Reconquista, Juan José Paso, Teniente Vanesia, Avenida Juan José Paso, 1 de Noviembre, General Lavalle, Antártida Argentina, Ruta Provincial N° 39, Ruta Nacional N° 3, Independencia, Pucará, Los Andes, El Baqueano, El Chasqui, El Rastreador, Los Andes, Cerro Solano." },
        ],
      },
      {
        numero: "22",
        resumen: "Estadio Centenario – Standard – Km. 11",
        tramos: [
          { etiqueta: "Ida", texto: "Carstens, Avenida Ducos, Carlos Pellegrini, Yrigoyen, Máximo Abásolo, Ruta Nacional N° 3, Avenida del Libertador, Los Búlgaros, Gobernador Moyano, J. M. Pueyrredón, Avenida del Libertador, Ruta Provincial N° 1, Avenida José Ingenieros, Ruta Provincial N° 1, Avenida Alejandro Maíz, Teniente Miguel Giménez, Ítalo Dell'Oro, Teodoro Petroff, Wenceslao Escalante, 8 de Diciembre, Martín Comodoro Rivadavia, Los Arrayanes, Avenida Nahuel Huapi, Copihue, Enlace Rural Palazzo, Barrio Cuartel Chacabuco (RIM 28), Camino Cantera, Rotonda Km 18." },
          { etiqueta: "Vuelta", texto: "Rotonda Km 18, Camino Cantera, Enlace Rural Palazzo, Copihue, Teniente Manuel Mujica Láinez, Aldo Juan Silvestrini, Francisco Pietrobelli, Ítalo Dell'Oro, Teniente Giménez, Avenida Alejandro Maíz, Ruta Provincial N° 1, Avenida José Ingenieros, Ruta Provincial N° 1, Avenida del Libertador, Ruta Nacional N° 3, Sarmiento, 25 de Mayo, Avenida Hipólito Yrigoyen, Carstens." },
        ],
      },
    ],
  },
};

const ACENTO_CLASES: Record<AreaConfig["acento"], { border: string; bg: string }> = {
  blue: { border: "border-svc-blue/60", bg: "bg-svc-blue/10" },
  yellow: { border: "border-svc-yellow/70", bg: "bg-svc-yellow/15" },
  green: { border: "border-svc-green/60", bg: "bg-svc-green/10" },
  purple: { border: "border-[#7e57c2]/60", bg: "bg-[#7e57c2]/10" },
};

export function generateStaticParams() {
  return Object.keys(AREAS).map((svc) => ({ svc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ svc: string }>;
}) {
  const { svc } = await params;
  const area = AREAS[svc];
  if (!area) return { title: "Área no encontrada · ENCOSEP" };
  return { title: `${area.titulo} · Áreas fiscalizadas · ENCOSEP` };
}

export default async function AreaFiscalizadaPage({
  params,
}: {
  params: Promise<{ svc: string }>;
}) {
  const { svc } = await params;
  const area = AREAS[svc];
  if (!area) notFound();

  const acento = ACENTO_CLASES[area.acento];

  return (
    <>
      <SeccionHeader
        kicker="Área fiscalizada"
        titulo={area.titulo}
        descripcion={area.descripcionCorta}
      />

      <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
        <MigajasSitio items={[{ label: "Áreas fiscalizadas" }]} />

        {/* ZORRITO GRANDE — bienvenida visual, vestido para el servicio de esta área */}
        <div className="flex flex-col items-center text-center gap-2 -mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSES[POSE_POR_SVC[svc as SvcKey]]}
            alt={`El Zorrito de ENCOSEP, guía de ${area.titulo}`}
            className="w-56 h-56 md:w-64 md:h-64 object-contain drop-shadow-xl"
          />
          <p className="text-sm text-navy font-semibold max-w-md">
            {svc === "transporte"
              ? "¡Hola! Soy el Zorrito de ENCOSEP. Te ayudo a entender el nuevo sistema de transporte Sol Bus."
              : `¡Hola! Soy el Zorrito de ENCOSEP. Te ayudo a entender todo sobre ${area.titulo.toLowerCase()}.`}
          </p>
        </div>

        {/* CABECERA CON ICONO + PRESTADORA + CTA */}
        <section
          id="cabecera-transporte"
          className={`rounded-2xl border-2 ${acento.border} ${acento.bg} p-6 flex flex-col md:flex-row items-center gap-6`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/imagenes/areas/${area.archivo}`}
            alt={area.titulo}
            className="w-32 h-32 object-contain shrink-0"
          />
          <div className="flex-1 text-center md:text-left">
            <div className="text-[11px] font-bold tracking-widest uppercase text-muted">
              Prestadora controlada
            </div>
            <div className="text-lg font-extrabold text-navy mt-1">
              {area.prestadora}
            </div>
            {area.prestadoraDetalle && (
              <p className="text-sm text-navy mt-1 leading-relaxed">
                {area.prestadoraDetalle}
              </p>
            )}
            {area.linksOficiales && area.linksOficiales.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                {area.linksOficiales.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-navy-2/30 bg-paper text-navy-2 text-xs font-bold hover:bg-paper-2 transition"
                  >
                    🔗 {l.label} →
                  </a>
                ))}
              </div>
            )}
          </div>
          <Link
            href={`/ingresar?callbackUrl=/reclamo/nuevo?svc=${svc}`}
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-svc-red text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-svc-red/30 whitespace-nowrap"
          >
            Hacer un reclamo →
          </Link>
        </section>

        {/* LINEAS Y RECORRIDOS (solo Transporte) */}
        {area.lineas && (
          <section id="lineas">
            <div className="text-xs font-bold tracking-widest uppercase text-muted">
              Sol Bus
            </div>
            <h2 className="text-2xl font-extrabold text-navy mt-1">
              Líneas y recorridos
            </h2>
            {area.lineasNota && (
              <p className="text-sm text-muted mt-2 max-w-2xl">{area.lineasNota}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
              {area.mapaSolBusUrl && (
                <a
                  href={area.mapaSolBusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#7e57c2] text-white font-bold text-sm shadow-lg shadow-[#7e57c2]/30 hover:scale-105 transition"
                >
                  🚌 Mapa en vivo según Sol Bus →
                </a>
              )}
              {area.mapaMcrUrl && (
                <a
                  href={area.mapaMcrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-navy text-white font-bold text-sm shadow-lg shadow-navy/30 hover:scale-105 transition"
                >
                  🗺️ Mapa de recorridos según la MCR →
                </a>
              )}
            </div>
            {area.mapaSolBusUrl && area.mapaMcrUrl && (
              <p className="text-xs text-muted mt-2 max-w-2xl">
                Sol Bus muestra la ubicación en vivo de las unidades; la Municipalidad (MCR) publica el detalle oficial de recorridos y paradas.
              </p>
            )}

            <div id="zorrito-guia-widget" className="mt-4">
              <ZorritoGuia />
            </div>

            <ul className="flex flex-col gap-2 mt-4">
              {area.lineas.map((l) => (
                <li key={l.numero}>
                  <LineaDetalle numero={l.numero} resumen={l.resumen} tramos={l.tramos} />
                </li>
              ))}
            </ul>

            <a
              href="/normativa/resolucion-1628-26-lineas-y-ramales-grupo-mr.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-xs text-navy-2 underline underline-offset-4 font-semibold"
            >
              📄 Ver el texto oficial completo (Resolución 1.628/26, Anexo I) →
            </a>{" "}
            <a
              href="/normativa/resolucion-1399-26-lineas-y-ramales-sol-bus.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-xs text-muted underline underline-offset-4"
            >
              (Resolución 1.399/26 anterior, derogada →)
            </a>
          </section>
        )}

        {/* QUE FISCALIZA EL ENTE */}
        <section>
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            ¿Qué fiscaliza el Ente?
          </div>
          <h2 className="text-2xl font-extrabold text-navy mt-1">
            Estos son los aspectos bajo control
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2 mt-4">
            {area.queFiscaliza.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-xl border border-line bg-paper p-3"
              >
                <span className="text-svc-green text-lg leading-none mt-0.5">
                  ✓
                </span>
                <span className="text-sm text-navy">{q}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* QUE SE PUEDE RECLAMAR */}
        <section>
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            ¿Qué puede reclamar el vecino?
          </div>
          <h2 className="text-2xl font-extrabold text-navy mt-1">
            Ejemplos de reclamos típicos
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2 mt-4">
            {area.queSePuedeReclamar.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-xl border border-line bg-paper p-3"
              >
                <span className="text-svc-red text-lg leading-none mt-0.5">
                  •
                </span>
                <span className="text-sm text-navy">{q}</span>
              </li>
            ))}
          </ul>
          <div id="cta-reclamo-transporte" className="mt-5 text-center">
            <Link
              href={`/ingresar?callbackUrl=/reclamo/nuevo?svc=${svc}`}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-svc-red text-white font-bold text-base shadow-lg shadow-svc-red/30"
            >
              + Hacer un reclamo de {area.titulo}
            </Link>
          </div>
        </section>

        {/* NORMATIVA */}
        <section>
          <div className="text-xs font-bold tracking-widest uppercase text-muted">
            Marco regulatorio
          </div>
          <h2 className="text-2xl font-extrabold text-navy mt-1">
            Normativa aplicable
          </h2>
          <ul className="mt-4 space-y-2">
            {area.normativa.map((n) => (
              <li
                key={n.norma}
                className="rounded-xl border border-line bg-paper p-4"
              >
                <div className="font-mono font-bold text-navy-2 text-sm">
                  {n.norma}
                </div>
                <div className="text-sm text-navy mt-1">{n.titulo}</div>
              </li>
            ))}
          </ul>
          <Link
            href="/control-prestadoras"
            className="inline-block mt-4 text-xs text-navy-2 underline underline-offset-4 font-semibold"
          >
            Ver todas las normas →
          </Link>
        </section>

        <VolverInicio />
      </main>

      {svc === "transporte" && (
        <ZorritoTour
          storageKey="zorrito-tour-transporte-v1"
          pasos={[
            {
              pose: "colectivo",
              texto:
                "¡Hola! Soy el Zorrito de ENCOSEP 🦊. Te ayudo a entender los cambios del transporte urbano.",
            },
            {
              targetId: "cabecera-transporte",
              pose: "colectivo",
              texto:
                "Desde el 1° de agosto de 2026, Sol Bus (Grupo MR S.R.L.) reemplaza a Patagonia en el servicio urbano y suburbano.",
            },
            {
              targetId: "lineas",
              pose: "colectivo",
              texto:
                "Acá tenés el mapa interactivo oficial para buscar tu línea por origen y destino, y el detalle calle por calle de todas las líneas de la Etapa Inicial.",
            },
            {
              targetId: "zorrito-guia-widget",
              pose: "colectivo",
              texto:
                "¿No sabés qué línea te pasa cerca? Usá tu ubicación o escribí una dirección y te digo las paradas y líneas más cercanas.",
            },
            {
              targetId: "cta-reclamo-transporte",
              pose: "colectivo",
              texto:
                "¿Te cambiaron la parada o el lugar de levantamiento? Tocá acá y elegí \"Cambio de parada o lugar de levantamiento (Sol Bus)\" para contarnos.",
            },
            {
              pose: "colectivo",
              texto:
                "¡Listo! Cuando quieras volver a verme, tocá mi carita en el botón de abajo.",
            },
          ]}
        />
      )}

      {svc !== "transporte" && (
        <ZorritoTour
          storageKey={`zorrito-tour-${svc}-v1`}
          pasos={[
            {
              pose: POSE_POR_SVC[svc as SvcKey],
              texto: `¡Hola! Soy el Zorrito de ENCOSEP 🦊. Te ayudo con todo lo que necesites saber sobre ${area.titulo.toLowerCase()}.`,
            },
            {
              targetId: "cabecera-transporte",
              pose: POSE_POR_SVC[svc as SvcKey],
              texto: `${area.prestadora} es la prestadora que controlamos en este servicio.`,
            },
            {
              targetId: "cta-reclamo-transporte",
              pose: POSE_POR_SVC[svc as SvcKey],
              texto: "¿Tenés un problema con este servicio? Tocá acá y contanos qué pasó.",
            },
          ]}
        />
      )}
    </>
  );
}
