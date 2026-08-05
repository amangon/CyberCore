export function ThemeSwitcher() {
  return (
    <div className="flex flex-wrap gap-2">
      {['Dark', 'Light', 'System'].map((mode) => (
        <button key={mode} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10">
          {mode}
        </button>
      ))}
    </div>
  );
}
