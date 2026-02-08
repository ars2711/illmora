export default function Loading() {
  return (
    <div className="min-h-screen ilmora-ambient flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85))] dark:text-white">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white/70 px-6 py-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
          Preparing your experience
        </p>
      </div>
    </div>
  );
}
