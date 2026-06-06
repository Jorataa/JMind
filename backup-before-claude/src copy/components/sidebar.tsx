export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">
          NJMind
        </h1>

        <p className="text-sm text-zinc-500 mt-1">
          Think. Plan. Execute.
        </p>
      </div>

      <nav className="flex-1 px-3">
        <button className="w-full text-left rounded-lg px-4 py-3 hover:bg-zinc-100">
          Dashboard
        </button>

        <button className="w-full text-left rounded-lg px-4 py-3 hover:bg-zinc-100">
          Mind Maps
        </button>

        <button className="w-full text-left rounded-lg px-4 py-3 hover:bg-zinc-100">
          Tasks
        </button>

        <button className="w-full text-left rounded-lg px-4 py-3 hover:bg-zinc-100">
          KPI
        </button>
      </nav>

      <div className="border-t p-4 text-sm text-zinc-500">
        Jovan
      </div>
    </aside>
  );
}