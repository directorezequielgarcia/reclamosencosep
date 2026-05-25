import { SVC_META, type SvcKey } from "@/lib/servicios";

type Props = {
  kind: SvcKey;
  size?: number;
  ring?: boolean;
};

export function SvcIcon({ kind, size = 56, ring = true }: Props) {
  const meta = SVC_META[kind];
  const r = Math.max(3, size * 0.07);
  const inner = size - r * 2 - 4;
  return (
    <div
      className="inline-flex items-center justify-center rounded-full bg-paper box-border"
      style={{
        width: size,
        height: size,
        borderWidth: ring ? r : 0,
        borderStyle: "solid",
        borderColor: meta.ring,
      }}
    >
      <svg
        viewBox="0 0 64 64"
        width={inner}
        height={inner}
        style={{ display: "block" }}
      >
        <g
          stroke="var(--navy)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {kind === "agua" && <AguaGlyph />}
          {kind === "energia" && <EnergiaGlyph />}
          {kind === "transporte" && <TransporteGlyph />}
          {kind === "residuos" && <ResiduosGlyph />}
        </g>
      </svg>
    </div>
  );
}

function AguaGlyph() {
  return (
    <g>
      <path d="M14 18 L 30 18 L 30 28 L 14 28 Z" />
      <path d="M22 14 L 22 18" />
      <path d="M18 14 L 26 14" />
      <path d="M30 22 L 40 22 L 40 32" />
      <path d="M36 32 L 44 32" />
      <path d="M40 36 C 36 41, 35 45, 35 48 C 35 51, 37 53, 40 53 C 43 53, 45 51, 45 48 C 45 45, 44 41, 40 36 Z" />
    </g>
  );
}

function EnergiaGlyph() {
  return (
    <g>
      <path d="M24 28 Q 24 16, 36 16 Q 48 16, 48 28 Q 48 34, 44 38 L 44 44 L 28 44 L 28 38 Q 24 34, 24 28 Z" />
      <path d="M30 48 L 42 48" />
      <path d="M32 52 L 40 52" />
      <path d="M36 22 L 32 30 L 36 30 L 34 38" strokeLinejoin="miter" />
    </g>
  );
}

function TransporteGlyph() {
  return (
    <g>
      <path d="M14 22 Q 14 14, 22 14 L 42 14 Q 50 14, 50 22 L 50 46 Q 50 50, 46 50 L 18 50 Q 14 50, 14 46 Z" />
      <path d="M20 22 L 30 22 L 30 30 L 20 30 Z" />
      <path d="M34 22 L 44 22 L 44 30 L 34 30 Z" />
      <path d="M14 36 L 50 36" />
      <circle cx="22" cy="52" r="3.5" />
      <circle cx="42" cy="52" r="3.5" />
      <path d="M22 40 L 22 44" />
      <path d="M42 40 L 42 44" />
    </g>
  );
}

function ResiduosGlyph() {
  return (
    <g>
      <path d="M18 22 L 38 22 L 38 44 L 18 44 Z" />
      <path d="M14 22 L 42 22" strokeWidth="2.6" />
      <path d="M22 18 L 34 18 L 34 22 L 22 22 Z" />
      <path d="M24 28 L 24 38" />
      <path d="M32 28 L 32 38" />
      <path d="M28 28 L 28 38" />
      <path d="M40 30 L 50 30 L 50 44 L 40 44 Z" />
      <path d="M43 32 L 48 32 L 48 36 L 43 36 Z" />
      <circle cx="24" cy="48" r="3" />
      <circle cx="44" cy="48" r="3" />
    </g>
  );
}
