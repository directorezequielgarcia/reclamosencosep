type Props = {
  height?: number;
  className?: string;
};

export function BrandStripe({ height = 4, className = "" }: Props) {
  return (
    <div
      className={`brand-stripe ${className}`}
      style={{ height, borderRadius: height / 2 }}
    >
      <span className="bg-svc-green" />
      <span className="bg-svc-yellow" />
      <span className="bg-svc-blue" />
      <span className="bg-svc-red" />
    </div>
  );
}
