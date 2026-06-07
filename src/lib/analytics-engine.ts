import { Task } from "@/stores/use-task-store";
import { KPI } from "@/stores/use-kpi-store";

export interface AnalyticsSummary {
  productivityScore: number;
  streak: number;
  taskCompletionRate: number;
  kpiCompletionRate: number;
  taskVelocity: number; // tasks per day avg
  deepWorkRatio: number; // % of tasks that are 'deep'
  focusScore: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  secondary?: number;
}

/**
 * Calculates a weighted productivity score (0-100)
 */
export function calculateProductivityScore(tasks: Task[], kpis: KPI[]): number {
  if (tasks.length === 0 && kpis.length === 0) return 0;

  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskProgress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const kpiProgress = kpis.length > 0 
    ? kpis.reduce((acc, k) => acc + Math.min((k.value / k.target) * 100, 100), 0) / kpis.length
    : 0;

  // Weighted average: 60% Tasks, 40% KPIs
  return Math.round(taskProgress * 0.6 + kpiProgress * 0.4);
}

/**
 * Calculates current streak based on daily completions
 */
export function calculateStreak(tasks: Task[]): number {
  const completedDates = tasks
    .filter((t) => t.completed && t.completedAt)
    .map((t) => new Date(t.completedAt!).toDateString());
  
  if (completedDates.length === 0) return 0;

  const dateSet = new Set(completedDates);
  let count = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  // If didn't complete anything today, start checking from yesterday
  if (!dateSet.has(checkDate.toDateString())) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (dateSet.has(checkDate.toDateString())) {
    count++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return count;
}

/**
 * Calculates task velocity (avg completed tasks per day over last 7 days)
 */
export function calculateTaskVelocity(tasks: Task[]): number {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentCompletions = tasks.filter((t) => 
    t.completed && t.completedAt && new Date(t.completedAt) > sevenDaysAgo
  ).length;

  return parseFloat((recentCompletions / 7).toFixed(1));
}

/**
 * Generates daily completion data for charts
 */
export function getWeeklyCompletionData(tasks: Task[]): ChartDataPoint[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const data: ChartDataPoint[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toDateString();
    const count = tasks.filter((t) => 
      t.completed && t.completedAt && new Date(t.completedAt).toDateString() === dateStr
    ).length;

    data.push({
      name: days[d.getDay()],
      value: count,
    });
  }

  return data;
}

/**
 * Calculates Deep Work Ratio (% of completed tasks that were 'deep' energy)
 */
export function calculateDeepWorkRatio(tasks: Task[]): number {
  const completed = tasks.filter(t => t.completed);
  if (completed.length === 0) return 0;

  const deep = completed.filter(t => t.energy === "deep").length;
  return Math.round((deep / completed.length) * 100);
}
