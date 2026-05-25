import { WizardReclamo } from "./wizard";

export const metadata = { title: "Nuevo reclamo · ENCOSEP" };

export default async function NuevoReclamoPage({
  searchParams,
}: {
  searchParams: Promise<{ svc?: string }>;
}) {
  const sp = await searchParams;
  const inicial =
    sp.svc === "residuos" ||
    sp.svc === "energia" ||
    sp.svc === "agua" ||
    sp.svc === "transporte"
      ? sp.svc
      : undefined;

  return <WizardReclamo svcInicial={inicial} />;
}
