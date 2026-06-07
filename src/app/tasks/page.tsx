import TaskPanel from "@/features/tasks/TaskPanel";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function TasksPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Execution</SectionTitle>
        </div>
        <TaskPanel />
      </div>
    </div>
  );
}
