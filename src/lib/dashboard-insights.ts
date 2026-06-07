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
    if (tasks.length > 0) return "You have clear objectives waiting for your focus.";
    return "Start your day by defining one clear next action.";
  }
  
  if (completedToday > 5) return "Exceptional momentum today. Keep the deep work going.";
  return `You've checked off ${completedToday} focus areas today. Great progress.`;
}
