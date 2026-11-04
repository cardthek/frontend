import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        {eyebrow && <p className="label-caps mb-3">{eyebrow}</p>}
        <h1 className="section-title">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
