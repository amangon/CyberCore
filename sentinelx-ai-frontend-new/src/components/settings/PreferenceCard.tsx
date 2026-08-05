interface PreferenceCardProps {
  title: string;
  detail: string;
}

export function PreferenceCard({ title, detail }: PreferenceCardProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}
