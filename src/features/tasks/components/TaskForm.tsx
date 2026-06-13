"use client";

import { FormEvent, useState } from "react";
import { useTaskActions, TaskPriority, TaskEnergy } from "@/stores/use-task-store";
import { Button } from "@/components/ui/Button";

export default function TaskForm() {
  const { addTask } = useTaskActions();
  
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [energy, setEnergy] = useState<TaskEnergy>("quick");

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    addTask(trimmedTitle, priority, energy, category.trim() || undefined);
    setTitle("");
    setCategory("");
  }

  return (
    <form
      onSubmit={handleAddTask}
      className="grid gap-3 border-b border-white/10 p-6 lg:grid-cols-[1fr_140px_140px_140px_auto]"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Define next action..."
        className="h-10 rounded-xl border border-white/10 bg-zinc-950/50 px-4 text-[13px] text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-400/5"
      />
      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category (Opt)"
        className="h-10 rounded-xl border border-white/10 bg-zinc-950/50 px-4 text-[13px] text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-400/5"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as TaskPriority)}
        className="h-10 rounded-xl border border-white/10 bg-zinc-950/50 px-3 text-[12px] font-bold text-zinc-400 uppercase tracking-widest outline-none focus:border-emerald-400/30"
      >
        <option value="high">High Priority</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select
        value={energy}
        onChange={(e) => setEnergy(e.target.value as TaskEnergy)}
        className="h-10 rounded-xl border border-white/10 bg-zinc-950/50 px-3 text-[12px] font-bold text-zinc-400 uppercase tracking-widest outline-none focus:border-emerald-400/30"
      >
        <option value="deep">Deep Focus</option>
        <option value="quick">Quick Win</option>
        <option value="low">Low Energy</option>
      </select>
      <Button type="submit" className="h-10 px-6 font-bold uppercase tracking-widest text-[11px]">
        Add Action
      </Button>
    </form>
  );
}
