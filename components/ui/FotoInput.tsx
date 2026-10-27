"use client";

import { useState } from "react";

const MAX_LADO = 1600;
const UMBRAL_BYTES = 1.5 * 1024 * 1024;

/**
 * Input de foto que reduce la imagen en el navegador antes de enviar el
 * formulario. Los server actions de Vercel rechazan payloads > ~4 MB y una
 * foto de celular suele pesar más. Si el navegador no puede decodificar el
 * archivo (ej. HEIC fuera de Safari) se deja el original.
 */
export function FotoInput({ name = "foto" }: { name?: string }) {
  const [aviso, setAviso] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    setAviso(null);
    if (!file || file.size <= UMBRAL_BYTES) return;
    try {
      const bmp = await createImageBitmap(file);
      const escala = Math.min(1, MAX_LADO / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * escala);
      canvas.height = Math.round(bmp.height * escala);
      canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/jpeg", 0.85),
      );
      if (!blob || blob.size >= file.size) return;
      const nombre = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      const dt = new DataTransfer();
      dt.items.add(new File([blob], nombre, { type: "image/jpeg" }));
      input.files = dt.files;
    } catch {
      if (file.size > 3.8 * 1024 * 1024) {
        setAviso("La foto pesa demasiado. Elegí una de menos de 4 MB.");
      }
    }
  }

  return (
    <>
      <input
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="text-sm"
        onChange={onChange}
      />
      {aviso && <span className="text-xs text-svc-red font-bold">{aviso}</span>}
    </>
  );
}
