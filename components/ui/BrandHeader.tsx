import Link from "next/link";

type Props = {
  right?: React.ReactNode;
  back?: string;
  title?: string;
};

export function BrandHeader({ right, back, title }: Props) {
  return (
    <header className="flex items-center gap-3 py-2 border-b border-line">
      {back ? (
        <Link
          href={back}
          aria-label="Volver"
          className="text-navy text-xl px-1 -ml-1"
        >
          ‹
        </Link>
      ) : null}
      <div className="flex-1 min-w-0">
        {title ? (
          <div className="text-sm font-bold text-navy truncate">{title}</div>
        ) : (
          <>
            <div className="text-[10px] font-bold tracking-widest text-muted uppercase leading-tight">
              ENCOSEP
            </div>
            <div className="text-xs text-navy font-semibold leading-tight">
              Portal de Reclamos
            </div>
          </>
        )}
      </div>
      {right}
    </header>
  );
}
