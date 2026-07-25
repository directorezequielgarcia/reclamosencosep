// Lectura de la factura en el navegador, sin importar cómo llegue el archivo:
//   - PDF con texto (el original que manda la SCPL por mail) → se lee directo.
//   - PDF escaneado (sin texto embebido) → se renderiza la 1ª página como
//     imagen y se lee con el mismo reconocimiento óptico que una foto.
//   - Foto/captura (JPG, PNG, etc.) → reconocimiento óptico directo.
// Así el usuario tiene un solo botón: "subí tu factura" y listo.

let pdfjsWorkerConfigurado = false;

async function cargarPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!pdfjsWorkerConfigurado) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    pdfjsWorkerConfigurado = true;
  }
  return pdfjsLib;
}

async function textoEmbebidoDePdf(file: File): Promise<string> {
  const pdfjsLib = await cargarPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let texto = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const contenido = await page.getTextContent();
    texto +=
      contenido.items
        .map((it) => ("str" in it ? it.str : ""))
        .join(" ") + "\n";
  }
  return texto;
}

// El render de pdfjs-dist puede quedarse colgado sin avisar (visto en la
// práctica, no siempre reproducible). Si tarda más de este límite, se cancela
// explícitamente en vez de dejar al usuario esperando para siempre.
const LIMITE_RENDER_MS = 25_000;

async function renderizarPrimeraPagina(file: File): Promise<HTMLCanvasElement> {
  const pdfjsLib = await cargarPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const page = await pdf.getPage(1);
  // Escala alta: el OCR lee mejor una imagen grande que el tamaño de pantalla.
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  // Con pdfjs-dist v6, pasar canvasContext junto con canvas cuelga el render:
  // solo se debe pasar `canvas` (ver tipo RenderParameters).
  const task = page.render({ canvas, viewport });
  const limite = setTimeout(() => task.cancel(), LIMITE_RENDER_MS);
  try {
    await task.promise;
  } finally {
    clearTimeout(limite);
  }
  return contraste(canvas);
}

// Escaneos de baja resolución (JPEG chico incrustado en el PDF) le cuestan al
// OCR, sobre todo los dígitos chicos de la tabla de lecturas. Pasar la imagen
// a blanco y negro con más contraste no agrega detalle que no esté, pero
// ayuda a Tesseract a distinguir mejor los bordes de cada carácter.
function contraste(origen: HTMLCanvasElement): HTMLCanvasElement {
  const salida = document.createElement("canvas");
  salida.width = origen.width;
  salida.height = origen.height;
  const ctx = salida.getContext("2d");
  if (!ctx) return origen;
  ctx.filter = "grayscale(1) contrast(1.6) brightness(1.1)";
  ctx.drawImage(origen, 0, 0);
  return salida;
}

// El reconocimiento óptico en un celular viejo puede ser lento, pero tampoco
// puede quedar esperando indefinidamente si el worker se traba.
const LIMITE_OCR_MS = 90_000;

async function ocr(
  fuente: File | HTMLCanvasElement,
  onProgreso: (p: number) => void,
): Promise<string> {
  const T = await import("tesseract.js");
  const worker = await T.createWorker("spa", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgreso(m.progress);
    },
  });
  const limite = setTimeout(() => worker.terminate(), LIMITE_OCR_MS);
  try {
    const { data } = await worker.recognize(fuente);
    return data.text ?? "";
  } finally {
    clearTimeout(limite);
    await worker.terminate().catch(() => {});
  }
}

export type PasoLectura =
  | { paso: "leyendo-pdf" }
  | { paso: "convirtiendo-pdf" }
  | { paso: "ocr"; progreso: number };

const UMBRAL_TEXTO_UTIL = 40;

export async function leerFactura(
  file: File,
  onPaso: (p: PasoLectura) => void,
): Promise<string> {
  const esPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

  if (esPdf) {
    onPaso({ paso: "leyendo-pdf" });
    let texto = "";
    try {
      texto = await textoEmbebidoDePdf(file);
    } catch {
      texto = "";
    }
    if (texto.trim().length >= UMBRAL_TEXTO_UTIL) return texto;

    // Sin texto embebido: es una factura escaneada. La convertimos a imagen
    // y la leemos con reconocimiento óptico, como a una foto.
    onPaso({ paso: "convirtiendo-pdf" });
    const canvas = await renderizarPrimeraPagina(file);
    onPaso({ paso: "ocr", progreso: 0 });
    return ocr(canvas, (progreso) => onPaso({ paso: "ocr", progreso }));
  }

  onPaso({ paso: "ocr", progreso: 0 });
  return ocr(file, (progreso) => onPaso({ paso: "ocr", progreso }));
}
