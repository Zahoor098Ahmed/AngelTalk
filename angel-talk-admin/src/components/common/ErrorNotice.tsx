import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/** Shown when the server could not be reached or refused a request (no made-up data is shown instead). */
export const ErrorNotice: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
    <div className="flex-1">
      <div className="font-bold">Could not load data from the server</div>
      <div className="mt-0.5 text-rose-700">{message}</div>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Try again
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
    <div className="font-bold text-slate-700">{title}</div>
    {hint && <div className="mt-1 text-sm text-slate-500">{hint}</div>}
  </div>
);
