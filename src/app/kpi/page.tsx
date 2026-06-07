import KPIList from "@/features/kpi/components/KPIList";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function KPIPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionTitle>Measurement</SectionTitle>
          <KPIList />
        </section>
      </div>
    </div>
  );
}
