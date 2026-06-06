import MindMapCanvas from "../features/mindmap/MindMapCanvas";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold">
        Welcome back 👋
      </h1>

      <div className="mt-8">
        <MindMapCanvas />
      </div>
    </div>
  );
}