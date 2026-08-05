export function RoleManager() {
  return (
    <div className="space-y-3">
      {[
        { name: "Owner", description: "Full platform control" },
        { name: "Analyst", description: "Operational review access" },
      ].map((role) => (
        <div key={role.name} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <p className="text-sm font-semibold text-white">{role.name}</p>
          <p className="mt-1 text-sm text-slate-400">{role.description}</p>
        </div>
      ))}
    </div>
  );
}
