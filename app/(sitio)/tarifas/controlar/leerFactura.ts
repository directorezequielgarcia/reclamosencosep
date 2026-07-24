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
  await page.render({ canvas, viewport }).promise;
  return canvas;
}

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
  const { data } = await worker.recognize(fuente);
  await worker.terminate();
  return data.text ?? "";
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
