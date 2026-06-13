"use client";

import { useState } from "react";
import { useKPIStore } from "@/stores/use-kpi-store";
import { useHydrated } from "@/hooks/use-hydrated";
import KPICard from "./KPICard";
import KPIForm from "./KPIForm";
import EmptyKPIState from "./EmptyKPIState";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Plus } from "lucide-react";

export default function KPIList() {
  const { kpis } = useKPIStore();
  const isHydrated = useHydrated();
  const [showForm, setShowForm] = useState(false);

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <div className="text-[13px] text-zinc-500">Loading indicators...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionTitle>Your Performance Indicators</SectionTitle>
        <Button size="sm" variant="secondary" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus size={14} />
          Add KPI
        </Button>
      </div>

      {kpis.length === 0 ? (
        <EmptyKPIState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      )}

      {showForm && <KPIForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
