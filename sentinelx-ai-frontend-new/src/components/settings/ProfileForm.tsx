interface ProfileFormProps {
  name: string;
  email: string;
  title: string;
}

export function ProfileForm({ name, email, title }: ProfileFormProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm text-slate-300">
        <span className="mb-2 block">Full name</span>
        <input defaultValue={name} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" />
      </label>
      <label className="block text-sm text-slate-300">
        <span className="mb-2 block">Email</span>
        <input defaultValue={email} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" />
      </label>
      <label className="block text-sm text-slate-300">
        <span className="mb-2 block">Title</span>
        <input defaultValue={title} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none" />
      </label>
    </div>
  );
}
