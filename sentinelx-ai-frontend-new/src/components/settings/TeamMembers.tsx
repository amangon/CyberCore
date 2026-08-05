export function TeamMembers() {
  return (
    <div className="space-y-3">
      {[
        { name: "Ava Chen", role: "SOC Lead" },
        { name: "Noah Patel", role: "Threat Analyst" },
      ].map((member) => (
        <div key={member.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
          <span>{member.name}</span>
          <span className="text-cyan-300">{member.role}</span>
        </div>
      ))}
    </div>
  );
}
