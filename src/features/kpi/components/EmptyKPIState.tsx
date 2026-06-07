"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function EmptyKPIState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="2,18 8,10 12,13 19,5 22,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="19" cy="5" r="2" fill="currentColor" />
        </svg>
      }
      title="No KPIs yet"
      description="Define your performance indicators to start measuring progress."
      action={
        <Button onClick={onAdd}>
          Create your first KPI
        </Button>
      }
    />
  );
}
