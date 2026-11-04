import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, note, icon: Icon, className }: { label: string; value: string | number; note: string; icon: LucideIcon; className?: string }) {
  return (
    <Card className={cn("relative overflow-hidden p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps">{label}</p>
          <p className="mt-3 font-serif text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-full bg-surface text-secondary">
          <Icon className="size-4" />
        </span>
      </div>
    </Card>
  );
}
