import Sidebar from "../components/sidebar";
import Topbar from "../components/topbar";
import Dashboard from "../components/dashboard";

export default function Home() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Topbar />

        <main className="flex-1 p-6 bg-zinc-100">
          <Dashboard />
        </main>
      </div>
    </div>
  );
}