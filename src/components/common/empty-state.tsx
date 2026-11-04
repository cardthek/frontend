import type { ReactNode } from "react";
import { Sprout } from "lucide-react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-border bg-surface/45 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface text-secondary">
        <Sprout className="size-5" />
      </span>
      <h3 className="mt-4 font-serif text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
