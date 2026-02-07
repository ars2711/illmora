"use client";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const confirmStyles =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-200/40 dark:bg-rose-200/10 dark:text-rose-200 dark:hover:bg-rose-200/20"
      : "border-slate-200 bg-white text-slate-700 hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
            {description}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${confirmStyles}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
