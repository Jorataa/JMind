export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Preferences
        </h3>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <h2 className="text-[20px] font-semibold text-zinc-100">Settings</h2>
          <p className="mt-2 text-zinc-500">
            Customize your JMind experience. Settings and preferences will be available here soon.
          </p>
        </div>
      </div>
    </div>
  );
}
