export interface KPIHistoryEntry {
  value: number;
  timestamp: string;
}

export interface KPI {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  category?: string;
  updatedAt: string;
  history: KPIHistoryEntry[];
}
