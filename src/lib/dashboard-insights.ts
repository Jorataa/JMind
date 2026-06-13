import { Task } from "@/stores/use-task-store";

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Working late";
}

export function getProductivityInsight(tasks: Task[]) {
  const completedToday = tasks.filter(t => 
    t.completed && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;
  
  if (completedToday === 0) {
    if (tasks.length > 0) return "A few things are waiting whenever you're ready.";
    return "A quiet start. Name one thing worth moving today.";
  }

  if (completedToday > 5) return "A lot came together today.";
  const noun = completedToday === 1 ? "thing" : "things";
  return `${completedToday} ${noun} off your mind today.`;
}
