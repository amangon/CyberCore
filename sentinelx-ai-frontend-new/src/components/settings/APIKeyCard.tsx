interface APIKeyCardProps {
  name: string;
  scope: string;
}

export function APIKeyCard({ name, scope }: APIKeyCardProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-white">{name}</p>
      <p className="mt-2 text-sm text-slate-400">{scope}</p>
    </div>
  );
}
