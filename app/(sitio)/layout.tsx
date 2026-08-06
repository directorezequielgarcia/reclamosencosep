import { SitioHeader } from "@/components/ui/SitioHeader";
import { SitioFooter } from "@/components/ui/SitioFooter";
import { FabReclamos } from "@/components/ui/FabReclamos";
import { FabAsistenciaWsp } from "@/components/ui/FabAsistenciaWsp";
import { VisitTracker } from "@/components/ui/VisitTracker";

export default function SitioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col min-h-screen bg-paper">
      <VisitTracker />
      <SitioHeader />
      <div className="flex-1">{children}</div>
      <SitioFooter />
      <FabReclamos />
      <FabAsistenciaWsp />
    </div>
  );
}
