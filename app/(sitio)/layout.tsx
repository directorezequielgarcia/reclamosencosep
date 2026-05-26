import { SitioHeader } from "@/components/ui/SitioHeader";
import { SitioFooter } from "@/components/ui/SitioFooter";

export default function SitioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col min-h-screen bg-paper">
      <SitioHeader />
      <div className="flex-1">{children}</div>
      <SitioFooter />
    </div>
  );
}
