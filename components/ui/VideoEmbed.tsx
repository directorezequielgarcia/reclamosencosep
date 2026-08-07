/** Extrae el ID de un link de YouTube (youtu.be, watch?v=, embed/), o null. */
export function youtubeId(url: string): string | null {
  const m =
    url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

/** Miniatura pública de YouTube para usar como "foto" cuando no hay una
 *  subida a mano — no requiere API key, hqdefault existe siempre. */
export function youtubeThumbnail(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/** Reproductor embebido de un video (YouTube, Vimeo o archivo directo mp4/webm/ogg). */
export function VideoEmbed({ url, titulo = "Video" }: { url: string; titulo?: string }) {
  const ytMatch = youtubeId(url);
  if (ytMatch) {
    const id = ytMatch;
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-line bg-black mb-3">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title={titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-line bg-black mb-3">
        <iframe
          src={`https://player.vimeo.com/video/${id}`}
          title={titulo}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return (
      <div className="rounded-xl overflow-hidden border border-line bg-black mb-3">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video controls src={url} className="w-full h-auto block">
          Tu navegador no puede reproducir este video.
        </video>
      </div>
    );
  }
  return null;
}
