"use client";

import { CircleOff } from "lucide-react";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="surface flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-mist">
        <CircleOff size={22} />
      </span>
      <p className="font-bold text-white">{title}</p>
      {hint && <p className="max-w-sm text-sm text-mist">{hint}</p>}
    </div>
  );
}
