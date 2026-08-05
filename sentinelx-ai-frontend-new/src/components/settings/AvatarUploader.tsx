import { UploadCloud } from "lucide-react";

export function AvatarUploader() {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 p-4 text-center text-sm text-slate-400">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-cyan-200">
        <UploadCloud size={18} />
      </div>
      <p className="mt-3 text-white">Upload avatar</p>
      <p className="mt-1">PNG, JPG, or SVG up to 4MB</p>
    </div>
  );
}
